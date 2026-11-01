/**
 * Verified Tournament Service - replay-verified competitive play.
 *
 * Every tournament match result requires a server-verified replay before
 * it enters competitive leaderboards. Unverified results are rejected,
 * making replay verification the core moat against cheating.
 *
 * Integrates with the existing attempt-replay.js (server-verified replay
 * simulation) and the level-service/generator.js (deterministic levels).
 */

import { Logger } from '../../core/logger/index.js';
import { replayLevelAttempt } from '../levels/attempt-replay.js';
import { generateLevel, GENERATOR_VERSION } from '../levels/generator.js';
import { localLevelContext } from '../levels/location-context.js';

const logger = new Logger('VerifiedTournamentService');

/**
 * VerifiedTournamentService - manages replay-verified tournaments.
 */
export class VerifiedTournamentService {
  constructor() {
    this.logger = new Logger('VerifiedTournamentService');
    this.tournaments = new Map(); // tournamentId -> tournament
    this.entries = new Map(); // entryId -> entry
    this.playerEntries = new Map(); // playerId -> Set of entryIds
  }

  /**
   * Create a new tournament.
   * config - { name, levelNumber, mode, startsAt, endsAt, entryFee, prizePool, maxEntries }
   */
  createTournament(config, { nowMs = Date.now() } = {}) {
    const tournamentId = `tournament-${config.levelNumber}-${Math.floor(nowMs / 1000)}-${Math.random().toString(36).slice(2, 8)}`;

    const tournament = {
      id: tournamentId,
      name: config.name || `Level ${config.levelNumber} Challenge`,
      levelNumber: config.levelNumber,
      mode: config.mode || 'classic',
      startsAt: config.startsAt || nowMs,
      endsAt: config.endsAt || nowMs + 24 * 60 * 60 * 1000,
      entryFee: config.entryFee || 0,
      prizePool: config.prizePool || { coins: 10000, lives: 10 },
      maxEntries: config.maxEntries || 1000,
      status: 'scheduled', // scheduled -> active -> completed
      entries: [],
      verifiedEntries: 0,
      rejectedEntries: 0,
      createdAt: nowMs,
      levelSeed: null, // set when tournament activates (all players play same seed)
    };

    this.tournaments.set(tournamentId, tournament);
    logger.info('Created tournament', { tournamentId, levelNumber: config.levelNumber });
    return tournament;
  }

  /**
   * Activate a tournament - generates the shared level seed and level definition.
   * All players in an active tournament play the exact same level (same seed).
   */
  activateTournament(tournamentId, { nowMs = Date.now() } = {}) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      throw new Error(`Tournament ${tournamentId} not found`);
    }
    if (tournament.status !== 'scheduled') {
      throw new Error(`Tournament ${tournamentId} already ${tournament.status}`);
    }

    // All players in the same tournament play the same level seed
    const context = localLevelContext({}, nowMs);
    const levelDefinition = generateLevel(tournament.levelNumber, context, tournament.mode, GENERATOR_VERSION);

    tournament.status = 'active';
    tournament.levelSeed = levelDefinition.seed;
    tournament.levelDefinition = {
      seed: levelDefinition.seed,
      targetScore: levelDefinition.targetScore,
      moves: levelDefinition.moves,
      gemTypes: levelDefinition.gemTypes,
      gemWeights: levelDefinition.gemWeights,
      boardWidth: levelDefinition.boardWidth,
      boardHeight: levelDefinition.boardHeight,
    };
    tournament.activatedAt = nowMs;

    logger.info('Activated tournament', { tournamentId, seed: levelDefinition.seed });
    return tournament;
  }

  /**
   * Get active tournaments at nowMs.
   */
  getActiveTournaments({ nowMs = Date.now() } = {}) {
    const active = [];
    for (const [id, t] of this.tournaments) {
      if (t.status === 'scheduled' && nowMs >= t.startsAt && nowMs < t.endsAt) {
        t.status = 'active';
        // Auto-activate with level seed
        this.activateTournament(id, { nowMs });
      }
      if (t.status === 'active' && nowMs >= t.startsAt && nowMs < t.endsAt) {
        active.push(t);
      }
      if (t.status === 'active' && nowMs >= t.endsAt) {
        t.status = 'completed';
        t.completedAt = nowMs;
      }
    }
    return active.sort((a, b) => a.endsAt - b.endsAt);
  }

  /**
   * Get a tournament by ID (includes level definition if active).
   */
  getTournament(tournamentId) {
    return this.tournaments.get(tournamentId);
  }

  /**
   * Submit a tournament match result with replay verification.
   * The replay must be verified server-side before the result is accepted.
   *
   * params:
   *   tournamentId - the tournament
   *   playerId - the player
   *   moves - array of moves made
   *   reportedScore - score claimed by client
   *   reportedProgress - progress claimed by client
   *   receipts - receipts from the level generator (for verification)
   *   nowMs - reference time
   */
  async submitTournamentResult(tournamentId, playerId, {
    moves,
    reportedScore,
    reportedProgress,
    receipts,
    nowMs = Date.now(),
  } = {}) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      return { accepted: false, reason: 'Tournament not found' };
    }

    if (tournament.status !== 'active') {
      return { accepted: false, reason: `Tournament is ${tournament.status}` };
    }

    if (nowMs < tournament.startsAt || nowMs >= tournament.endsAt) {
      return { accepted: false, reason: 'Tournament not active at this time' };
    }

    // Check if player already has an entry (one entry per player per tournament)
    const existingEntryIds = this.playerEntries.get(playerId);
    if (existingEntryIds && existingEntryIds.has(tournamentId)) {
      return { accepted: false, reason: 'Player already has an entry in this tournament' };
    }

    // Verify the replay server-side using the tournament's level definition
    const levelDef = tournament.levelDefinition;
    if (!levelDef) {
      return { accepted: false, reason: 'Tournament level not initialized' };
    }

    let verification;
    try {
      verification = replayLevelAttempt(
        levelDef,
        moves,
        reportedScore,
        reportedProgress,
        receipts
      );
    } catch (error) {
      logger.error('Replay verification threw', { tournamentId, playerId, error: error.message });
      return { accepted: false, reason: 'Replay verification error' };
    }

    if (!verification.verified) {
      // Record rejection
      tournament.rejectedEntries = (tournament.rejectedEntries || 0) + 1;
      logger.warn('Rejected unverified tournament result', {
        tournamentId, playerId, reason: verification.error,
      });
      return {
        accepted: false,
        reason: verification.error || 'Replay verification failed',
        verified: false,
      };
    }

    // Create verified entry
    const entryId = `entry-${tournamentId}-${playerId}-${Math.floor(nowMs / 1000)}`;
    const entry = {
      id: entryId,
      tournamentId,
      playerId,
      score: verification.score,
      progress: verification.progress,
      moves: moves.length,
      verified: true,
      verifiedAt: nowMs,
      levelSeed: tournament.levelSeed,
      replayHash: verification.replayHash,
    };

    this.entries.set(entryId, entry);

    if (!this.playerEntries.has(playerId)) {
      this.playerEntries.set(playerId, new Set());
    }
    this.playerEntries.get(playerId).add(tournamentId);

    tournament.entries.push(entryId);
    tournament.verifiedEntries = (tournament.verifiedEntries || 0) + 1;

    logger.info('Accepted verified tournament result', {
      tournamentId, playerId, score: verification.score, verified: true,
    });

    return {
      accepted: true,
      entryId,
      score: verification.score,
      progress: verification.progress,
      verified: true,
    };
  }

  /**
   * Get the leaderboard for a tournament (verified entries only, sorted by score desc).
   */
  getLeaderboard(tournamentId, { limit = 100 } = {}) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      return { tournamentId, entries: [], verifiedCount: 0 };
    }

    const leaderboard = tournament.entries
      .map((entryId) => this.entries.get(entryId))
      .filter(Boolean)
      .filter((e) => e.verified)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((e, rank) => ({
        rank: rank + 1,
        playerId: e.playerId,
        score: e.score,
        progress: e.progress,
        moves: e.moves,
        verified: e.verified,
        verifiedAt: e.verifiedAt,
      }));

    return {
      tournamentId,
      tournamentName: tournament.name,
      entries: leaderboard,
      verifiedCount: tournament.verifiedEntries || 0,
      rejectedCount: tournament.rejectedEntries || 0,
    };
  }

  /**
   * Get all tournaments a player has entered.
   */
  getPlayerTournaments(playerId) {
    const entryIds = this.playerEntries.get(playerId);
    if (!entryIds) return [];
    return Array.from(entryIds).map((tId) => this.tournaments.get(tId)).filter(Boolean);
  }

  /**
   * Finalize a completed tournament - compute winners and distribute prizes.
   */
  finalizeTournament(tournamentId, { nowMs = Date.now() } = {}) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      return { success: false, reason: 'Tournament not found' };
    }
    if (nowMs < tournament.endsAt) {
      return { success: false, reason: 'Tournament still active' };
    }

    const leaderboard = this.getLeaderboard(tournamentId, { limit: 10 });
    const winners = leaderboard.entries.slice(0, 3);

    tournament.status = 'completed';
    tournament.completedAt = nowMs;
    tournament.winners = winners;

    logger.info('Finalized tournament', { tournamentId, winnerCount: winners.length });

    return {
      success: true,
      tournamentId,
      winners,
      totalVerifiedEntries: tournament.verifiedEntries,
      totalRejectedEntries: tournament.rejectedEntries,
    };
  }
}

export default VerifiedTournamentService;
