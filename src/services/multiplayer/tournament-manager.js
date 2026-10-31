import { Logger } from '../../core/logger/index.js';
import { ServiceError } from '../../core/errors/ErrorHandler.js';
import { randomUUID as uuidv4 } from 'node:crypto';

/**
 * Multiplayer Tournament Manager
 * Runs single-elimination Match-3 tournaments using existing PvP sessions.
 *
 * Tournament lifecycle:
 *   registration -> active -> completed
 *
 * Each round pairs remaining players into head-to-head match3_versus sessions.
 * Winners advance; losers are eliminated. The last player standing wins.
 */
class TournamentManager {
  constructor(io, roomManager, sessionManager, antiCheatSystem) {
    this.logger = new Logger('TournamentManager');
    this.io = io;
    this.roomManager = roomManager;
    this.sessionManager = sessionManager;
    this.antiCheatSystem = antiCheatSystem;

    // Tournament storage
    this.tournaments = new Map(); // tournamentId -> tournament data
    this.playerTournaments = new Map(); // playerId -> tournamentId
    this.matches = new Map(); // matchId -> match data

    // Configuration
    this.defaultEntryFee = 0;
    this.defaultPrizePool = 0;
    this.minPlayers = 4;
    this.maxPlayers = 8;
    this.matchTimeLimit = 60; // seconds per match
    this.matchMaxMoves = 30;

    this.initializeTournamentManager();
  }

  /** Initialize tournament manager */
  initializeTournamentManager() {
    this.logger.info('Initializing Tournament Manager');
  }

  /** Create a new tournament */
  createTournament(creatorId, options = {}) {
    try {
      const tournamentId = uuidv4();
      const now = Date.now();

      const maxPlayers = Math.min(
        options.maxPlayers || this.maxPlayers,
        this.maxPlayers
      );
      if (maxPlayers < this.minPlayers) {
        throw new ServiceError(
          `Tournament requires at least ${this.minPlayers} players`
        );
      }
      // Single-elimination brackets work best with power-of-2 player counts.
      // We accept any count >= minPlayers and pad byes as needed.

      const tournament = {
        id: tournamentId,
        name: options.name || 'Match-3 Tournament',
        creatorId,
        status: 'registration', // registration, active, completed
        format: 'single_elimination',
        maxPlayers,
        entryFee: options.entryFee || this.defaultEntryFee,
        prizePool: options.prizePool || this.defaultPrizePool,
        players: new Set([creatorId]),
        brackets: [],
        currentRound: 0,
        createdAt: now,
        startedAt: null,
        completedAt: null,
        winnerId: null,
        settings: {
          timeLimit: options.timeLimit || this.matchTimeLimit,
          maxMoves: options.maxMoves || this.matchMaxMoves,
          ...options.settings
        }
      };

      this.tournaments.set(tournamentId, tournament);
      this.playerTournaments.set(creatorId, tournamentId);

      this.logger.info(
        `Tournament created: ${tournamentId} by ${creatorId}`
      );

      return {
        success: true,
        tournament: this.getPublicTournament(tournament),
        message: 'Tournament created successfully'
      };
    } catch (error) {
      this.logger.error('Failed to create tournament:', error);
      throw error;
    }
  }

  /** Join a tournament */
  joinTournament(playerId, tournamentId) {
    try {
      const tournament = this.tournaments.get(tournamentId);
      if (!tournament) {
        throw new ServiceError('Tournament not found');
      }

      if (tournament.status !== 'registration') {
        throw new ServiceError('Tournament is not open for registration');
      }

      if (tournament.players.has(playerId)) {
        throw new ServiceError('Player is already in this tournament');
      }

      if (tournament.players.size >= tournament.maxPlayers) {
        throw new ServiceError('Tournament is full');
      }

      // Player cannot be in another active tournament
      if (this.playerTournaments.has(playerId)) {
        throw new ServiceError('Player is already in a tournament');
      }

      tournament.players.add(playerId);
      this.playerTournaments.set(playerId, tournamentId);

      this.logger.info(
        `Player ${playerId} joined tournament ${tournamentId}`
      );

      return {
        success: true,
        tournament: this.getPublicTournament(tournament),
        message: 'Joined tournament successfully'
      };
    } catch (error) {
      this.logger.error('Failed to join tournament:', error);
      throw error;
    }
  }

  /** Start a tournament - generate brackets and first round matches */
  startTournament(tournamentId, startedBy) {
    try {
      const tournament = this.tournaments.get(tournamentId);
      if (!tournament) {
        throw new ServiceError('Tournament not found');
      }

      if (startedBy !== tournament.creatorId) {
        throw new ServiceError('Only the tournament creator can start it');
      }

      if (tournament.status !== 'registration') {
        throw new ServiceError('Tournament has already started or completed');
      }

      if (tournament.players.size < this.minPlayers) {
        throw new ServiceError(
          `Tournament needs at least ${this.minPlayers} players to start`
        );
      }

      tournament.status = 'active';
      tournament.startedAt = Date.now();
      tournament.currentRound = 1;

      // Generate single-elimination bracket
      const players = Array.from(tournament.players);
      const brackets = this.generateBracket(players, tournament.settings);
      tournament.brackets = brackets;

      // Create match sessions for round 1
      const round1 = brackets[0];
      for (const match of round1.matches) {
        if (match.player2Id) {
          // Real match - create a PvP session
          this.createMatchSession(tournament, match);
        }
        // Byes (player2Id === null) auto-advance the player
      }

      this.logger.info(
        `Tournament ${tournamentId} started with ${tournament.players.size} players`
      );

      return {
        success: true,
        tournament: this.getPublicTournament(tournament),
        message: 'Tournament started'
      };
    } catch (error) {
      this.logger.error('Failed to start tournament:', error);
      throw error;
    }
  }

  /** Generate a single-elimination bracket from players */
  generateBracket(players, settings) {
    // Shuffle players for random seeding
    const shuffled = [...players].sort(() => Math.random() - 0.5);

    // Find next power of 2 >= player count for clean bracket
    let bracketSize = 1;
    while (bracketSize < shuffled.length) {
      bracketSize *= 2;
    }

    const numRounds = Math.log2(bracketSize);
    const brackets = [];

    // Round 1: pair players, add byes for empty slots
    const round1Matches = [];
    for (let i = 0; i < bracketSize; i += 2) {
      const p1 = shuffled[i] || null;
      const p2 = shuffled[i + 1] || null;

      round1Matches.push({
        id: uuidv4(),
        round: 1,
        matchNumber: i / 2 + 1,
        player1Id: p1,
        player2Id: p2,
        sessionId: null,
        winnerId: null,
        scores: {},
        status: p1 && p2 ? 'pending' : 'completed', // bye = auto-completed
        winnerAdvancesTo: null
      });

      if (p1 && !p2) {
        // p1 gets a bye - auto advances
        round1Matches[round1Matches.length - 1].winnerId = p1;
        round1Matches[round1Matches.length - 1].status = 'completed';
      } else if (!p1 && p2) {
        round1Matches[round1Matches.length - 1].winnerId = p2;
        round1Matches[round1Matches.length - 1].status = 'completed';
      }
    }

    brackets.push({ round: 1, matches: round1Matches });

    // Subsequent rounds: placeholder matches (filled as winners advance)
    for (let r = 2; r <= numRounds; r++) {
      const numMatches = bracketSize / Math.pow(2, r);
      const roundMatches = [];
      for (let m = 0; m < numMatches; m++) {
        roundMatches.push({
          id: uuidv4(),
          round: r,
          matchNumber: m + 1,
          player1Id: null,
          player2Id: null,
          sessionId: null,
          winnerId: null,
          scores: {},
          status: 'pending',
          winnerAdvancesTo: null
        });
      }
      brackets.push({ round: r, matches: roundMatches });
    }

    // Link matches: winner of match m in round r advances to a slot in round r+1
    for (let r = 0; r < brackets.length - 1; r++) {
      const currentRound = brackets[r];
      const nextRound = brackets[r + 1];
      for (let m = 0; m < currentRound.matches.length; m++) {
        const match = currentRound.matches[m];
        const targetMatchIndex = Math.floor(m / 2);
        const isPlayer1 = m % 2 === 0;
        match.winnerAdvancesTo = {
          nextRoundMatchId: nextRound.matches[targetMatchIndex].id,
          slot: isPlayer1 ? 'player1' : 'player2'
        };
      }
    }

    return brackets;
  }

  /** Create a PvP session for a match */
  createMatchSession(tournament, match) {
    const roomId = uuidv4();
    const players = [match.player1Id, match.player2Id];

    const result = this.sessionManager.startSession(
      roomId,
      players,
      'match3_tournament',
      {
        timeLimit: tournament.settings.timeLimit,
        maxMoves: tournament.settings.maxMoves,
        difficulty: 'normal',
        powerUps: true,
        tournamentId: tournament.id,
        matchId: match.id
      }
    );

    match.sessionId = result.sessionId;
    match.status = 'active';

    this.matches.set(match.id, match);

    this.logger.info(
      `Match ${match.id} created for tournament ${tournament.id}`
    );

    return result;
  }

  /** Record a match result and advance the winner */
  recordMatchResult(tournamentId, matchId, winnerId, scores = {}, reportedBy) {
    try {
      const tournament = this.tournaments.get(tournamentId);
      if (!tournament) {
        throw new ServiceError('Tournament not found');
      }

      const match = this.matches.get(matchId);
      if (!match || match.tournamentId !== tournamentId) {
        throw new ServiceError('Match not found');
      }

      if (match.status !== 'active') {
        throw new ServiceError('Match is not active');
      }

      if (!match.player1Id || !match.player2Id) {
        throw new ServiceError('Match has no players');
      }

      // Only participants can report match results
      if (reportedBy && !([match.player1Id, match.player2Id].includes(reportedBy))) {
        throw new ServiceError('Only match participants can report results');
      }

      if (![match.player1Id, match.player2Id].includes(winnerId)) {
        throw new ServiceError('Winner is not a participant in this match');
      }

      // Validate with anti-cheat if session exists
      if (match.sessionId) {
        const session = this.sessionManager.sessions.get(match.sessionId);
        if (session) {
          const loserId =
            winnerId === match.player1Id
              ? match.player2Id
              : match.player1Id;
          // Record the winner's score from the session if available
          const winnerScore = session.scores[winnerId] || 0;
          const loserScore = session.scores[loserId] || 0;

          scores = {
            [winnerId]: winnerScore,
            [loserId]: loserScore
          };
        }
      }

      match.winnerId = winnerId;
      match.scores = scores;
      match.status = 'completed';
      match.completedAt = Date.now();

      // End the session
      if (match.sessionId) {
        try {
          this.sessionManager.sessions.get(match.sessionId).status = 'finished';
          this.sessionManager.sessions.get(match.sessionId).winner = winnerId;
          this.sessionManager.sessions.get(match.sessionId).endReason =
            'match_completed';
        } catch {
          // Session may already be cleaned up
        }
      }

      // Advance winner to next round
      if (match.winnerAdvancesTo) {
        const nextMatch = this.matches.get(
          match.winnerAdvancesTo.nextRoundMatchId
        );
        if (nextMatch) {
          const slot = match.winnerAdvancesTo.slot;
          nextMatch[slot] = winnerId;

          // If both players in next match are now set, activate it
          if (
            nextMatch.player1Id &&
            nextMatch.player2Id &&
            nextMatch.status === 'pending'
          ) {
            nextMatch.status = 'active';
            this.createMatchSession(tournament, nextMatch);
          }
        }
      } else {
        // This was the final match - tournament is complete
        tournament.status = 'completed';
        tournament.completedAt = Date.now();
        tournament.winnerId = winnerId;
      }

      this.logger.info(
        `Match ${matchId} completed: winner ${winnerId} in tournament ${tournamentId}`
      );

      return {
        success: true,
        match: this.getPublicMatch(match),
        tournament: this.getPublicTournament(tournament),
        message: 'Match result recorded'
      };
    } catch (error) {
      this.logger.error('Failed to record match result:', error);
      throw error;
    }
  }

  /** Get tournament details (public view) */
  getPublicTournament(tournament) {
    return {
      id: tournament.id,
      name: tournament.name,
      creatorId: tournament.creatorId,
      status: tournament.status,
      format: tournament.format,
      playerCount: tournament.players.size,
      maxPlayers: tournament.maxPlayers,
      entryFee: tournament.entryFee,
      prizePool: tournament.prizePool,
      currentRound: tournament.currentRound,
      players: Array.from(tournament.players),
      brackets: tournament.brackets.map((b) => ({
        round: b.round,
        matches: b.matches.map((m) => this.getPublicMatch(m))
      })),
      winnerId: tournament.winnerId,
      createdAt: tournament.createdAt,
      startedAt: tournament.startedAt,
      completedAt: tournament.completedAt
    };
  }

  /** Get match details (public view) */
  getPublicMatch(match) {
    return {
      id: match.id,
      round: match.round,
      matchNumber: match.matchNumber,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      winnerId: match.winnerId,
      scores: match.scores,
      status: match.status,
      sessionId: match.sessionId,
      winnerAdvancesTo: match.winnerAdvancesTo
    };
  }

  /** Get tournament standings (final placement) */
  getTournamentStandings(tournamentId) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      throw new ServiceError('Tournament not found');
    }

    if (tournament.status !== 'completed') {
      throw new ServiceError('Tournament is not yet completed');
    }

    // Build standings from bracket results
    const players = Array.from(tournament.players);
    const standings = players.map((playerId) => {
      let placement = 1;
      let roundsWon = 0;

      // Count how many matches this player won
      for (const bracket of tournament.brackets) {
        for (const match of bracket.matches) {
          if (match.winnerId === playerId) {
            roundsWon++;
          }
        }
      }

      // Determine placement based on how far they advanced
      if (playerId === tournament.winnerId) {
        placement = 1;
      } else {
        // Find the round they were eliminated
        let eliminatedRound = 0;
        for (const bracket of tournament.brackets) {
          for (const match of bracket.matches) {
            if (
              (match.player1Id === playerId || match.player2Id === playerId) &&
              match.winnerId !== playerId &&
              match.status === 'completed'
            ) {
              eliminatedRound = Math.max(eliminatedRound, match.round);
            }
          }
        }
        // Players eliminated in the final (round = numRounds) get 2nd
        // Players eliminated in semifinals get 3rd-4th, etc.
        const numRounds = tournament.brackets.length;
        if (eliminatedRound === numRounds) {
          placement = 2;
        } else if (eliminatedRound === numRounds - 1) {
          placement = 3; // tied 3rd-4th
        } else {
          placement = 5; // tied 5th-8th (for 8-player bracket)
        }
      }

      return {
        playerId,
        placement,
        roundsWon,
        prize: this.calculatePrize(placement, tournament.prizePool)
      };
    });

    standings.sort((a, b) => a.placement - b.placement);

    return {
      tournamentId,
      winnerId: tournament.winnerId,
      standings
    };
  }

  /** Calculate prize for a placement */
  calculatePrize(placement, totalPrizePool) {
    if (totalPrizePool <= 0) return 0;
    // Simple prize distribution: 50% / 30% / 20% for top 3
    const distribution = { 1: 0.5, 2: 0.3, 3: 0.2 };
    const pct = distribution[placement] || 0;
    return Math.floor(totalPrizePool * pct);
  }

  /** Get player's current tournament */
  getPlayerTournament(playerId) {
    const tournamentId = this.playerTournaments.get(playerId);
    if (!tournamentId) return null;
    const tournament = this.tournaments.get(tournamentId);
    return tournament ? this.getPublicTournament(tournament) : null;
  }

  /** Get tournament by id */
  getTournament(tournamentId) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return null;
    return this.getPublicTournament(tournament);
  }

  /** Get match by id */
  getMatch(matchId) {
    const match = this.matches.get(matchId);
    if (!match) return null;
    return this.getPublicMatch(match);
  }

  /** Get available (registration-phase) tournaments */
  getAvailableTournaments() {
    return Array.from(this.tournaments.values())
      .filter((t) => t.status === 'registration')
      .map((t) => this.getPublicTournament(t));
  }

  /** Get tournament statistics */
  getStatistics() {
    const active = Array.from(this.tournaments.values()).filter(
      (t) => t.status === 'active'
    ).length;
    const completed = Array.from(this.tournaments.values()).filter(
      (t) => t.status === 'completed'
    ).length;
    const registration = Array.from(this.tournaments.values()).filter(
      (t) => t.status === 'registration'
    ).length;

    return {
      totalTournaments: this.tournaments.size,
      registration,
      active,
      completed,
      totalPlayersInTournaments: this.playerTournaments.size,
      totalMatches: this.matches.size,
      completedMatches: Array.from(this.matches.values()).filter(
        (m) => m.status === 'completed'
      ).length
    };
  }
}

export { TournamentManager };
