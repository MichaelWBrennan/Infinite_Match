import { Logger } from '../../core/logger/index.js';
import { ServiceError } from '../../core/errors/ErrorHandler.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Game Session Manager
 * Handles individual game sessions, state synchronization, and turn management
 */
class GameSessionManager {
  constructor(io) {
    this.logger = new Logger('GameSessionManager');
    this.io = io;
    
    // Session storage
    this.sessions = new Map(); // sessionId -> session data
    this.playerSessions = new Map(); // playerId -> sessionId
    
    // Session configuration
    this.sessionTimeout = 60 * 60 * 1000; // 1 hour
    this.turnTimeout = 30 * 1000; // 30 seconds per turn
    this.maxMovesPerSession = 100;
    
    // Game state templates
    this.gameStateTemplates = {
      'match3_versus': this.getMatch3VersusTemplate(),
      'match3_tournament': this.getMatch3TournamentTemplate(),
      'match3_coop': this.getMatch3CoopTemplate()
    };
    
    this.initializeSessionManager();
  }

  /**
   * Initialize session manager
   */
  initializeSessionManager() {
    this.logger.info('Initializing Game Session Manager');
    
    // Cleanup inactive sessions every 5 minutes
    setInterval(() => {
      this.cleanupInactiveSessions();
    }, 5 * 60 * 1000);
    
    // Process turn timeouts every 10 seconds
    setInterval(() => {
      this.processTurnTimeouts();
    }, 10 * 1000);
  }

  /**
   * Start a new game session
   */
  startSession(roomId, players, gameType, settings = {}) {
    try {
      const sessionId = uuidv4();
      const now = Date.now();
      
      // Initialize game state
      const gameState = this.initializeGameState(gameType, players, settings);
      
      const session = {
        id: sessionId,
        roomId,
        gameType,
        players: new Set(players),
        spectators: new Set(),
        status: 'starting', // starting, active, paused, finished
        createdAt: now,
        lastActivity: now,
        currentTurn: players[0], // First player starts
        turnStartTime: now,
        moveCount: 0,
        gameState,
        settings: {
          timeLimit: settings.timeLimit || null,
          maxMoves: settings.maxMoves || this.maxMovesPerSession,
          difficulty: settings.difficulty || 'normal',
          ...settings
        },
        history: [],
        scores: this.initializeScores(players),
        winner: null,
        endReason: null
      };

      this.sessions.set(sessionId, session);
      
      // Track player sessions
      for (const playerId of players) {
        this.playerSessions.set(playerId, sessionId);
      }

      this.logger.info(`Game session started: ${sessionId} for room ${roomId}`);
      
      return {
        success: true,
        sessionId,
        session: this.getSessionInfo(session),
        message: 'Game session started'
      };
    } catch (error) {
      this.logger.error('Failed to start game session:', error);
      throw error;
    }
  }

  /**
   * Make a move in the game
   */
  makeMove(sessionId, playerId, move) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new ServiceError('Session not found');
      }

      // Validate move
      if (!this.validateMove(session, playerId, move)) {
        throw new ServiceError('Invalid move');
      }

      // Check if it's player's turn
      if (session.currentTurn !== playerId) {
        throw new ServiceError('Not your turn');
      }

      // Check if session is active
      if (session.status !== 'active') {
        throw new ServiceError('Session is not active');
      }

      // Process the move
      const moveResult = this.processMove(session, playerId, move);
      
      // Update session state
      session.moveCount++;
      session.lastActivity = Date.now();
      session.history.push({
        playerId,
        move,
        result: moveResult,
        timestamp: Date.now()
      });

      // Update scores
      if (moveResult.score) {
        session.scores[playerId] = (session.scores[playerId] || 0) + moveResult.score;
      }

      // Check for game end conditions
      const gameEndResult = this.checkGameEndConditions(session);
      if (gameEndResult.isGameOver) {
        session.status = 'finished';
        session.winner = gameEndResult.winner;
        session.endReason = gameEndResult.reason;
        
        // Notify all players
        this.io.to(`room_${session.roomId}`).emit('game_ended', {
          sessionId,
          winner: session.winner,
          reason: session.endReason,
          finalScores: session.scores
        });
      } else {
        // Switch to next player
        this.switchTurn(session);
      }

      // Broadcast move to all players
      this.io.to(`room_${session.roomId}`).emit('move_made', {
        sessionId,
        playerId,
        move,
        result: moveResult,
        gameState: this.getPublicGameState(session),
        currentTurn: session.currentTurn,
        scores: session.scores
      });

      this.logger.info(`Move made in session ${sessionId} by player ${playerId}`);
      
      return {
        success: true,
        moveResult,
        gameState: this.getPublicGameState(session),
        message: 'Move processed successfully'
      };
    } catch (error) {
      this.logger.error('Failed to make move:', error);
      throw error;
    }
  }

  /**
   * Join a session as spectator
   */
  joinAsSpectator(sessionId, playerId) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new ServiceError('Session not found');
      }

      session.spectators.add(playerId);
      session.lastActivity = Date.now();

      this.logger.info(`Player ${playerId} joined session ${sessionId} as spectator`);
      
      return {
        success: true,
        session: this.getSessionInfo(session),
        message: 'Joined as spectator'
      };
    } catch (error) {
      this.logger.error('Failed to join as spectator:', error);
      throw error;
    }
  }

  /**
   * Leave a session
   */
  leaveSession(sessionId, playerId) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new ServiceError('Session not found');
      }

      // Remove from players or spectators
      session.players.delete(playerId);
      session.spectators.delete(playerId);
      this.playerSessions.delete(playerId);
      session.lastActivity = Date.now();

      // If no players left, end session
      if (session.players.size === 0) {
        session.status = 'finished';
        session.endReason = 'all_players_left';
        this.sessions.delete(sessionId);
      } else if (session.currentTurn === playerId) {
        // If current player left, switch turn
        this.switchTurn(session);
      }

      this.logger.info(`Player ${playerId} left session ${sessionId}`);
      
      return {
        success: true,
        message: 'Left session successfully'
      };
    } catch (error) {
      this.logger.error('Failed to leave session:', error);
      throw error;
    }
  }

  /**
   * Pause a session
   */
  pauseSession(sessionId, playerId) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new ServiceError('Session not found');
      }

      if (!session.players.has(playerId)) {
        throw new ServiceError('Player not in session');
      }

      session.status = 'paused';
      session.lastActivity = Date.now();

      // Notify all players
      this.io.to(`room_${session.roomId}`).emit('session_paused', {
        sessionId,
        pausedBy: playerId,
        timestamp: Date.now()
      });

      this.logger.info(`Session ${sessionId} paused by player ${playerId}`);
      
      return {
        success: true,
        message: 'Session paused'
      };
    } catch (error) {
      this.logger.error('Failed to pause session:', error);
      throw error;
    }
  }

  /**
   * Resume a session
   */
  resumeSession(sessionId, playerId) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new ServiceError('Session not found');
      }

      if (!session.players.has(playerId)) {
        throw new ServiceError('Player not in session');
      }

      session.status = 'active';
      session.lastActivity = Date.now();

      // Notify all players
      this.io.to(`room_${session.roomId}`).emit('session_resumed', {
        sessionId,
        resumedBy: playerId,
        timestamp: Date.now()
      });

      this.logger.info(`Session ${sessionId} resumed by player ${playerId}`);
      
      return {
        success: true,
        message: 'Session resumed'
      };
    } catch (error) {
      this.logger.error('Failed to resume session:', error);
      throw error;
    }
  }

  /**
   * Get session information
   */
  getSessionInfo(session) {
    return {
      id: session.id,
      roomId: session.roomId,
      gameType: session.gameType,
      status: session.status,
      players: Array.from(session.players),
      spectators: Array.from(session.spectators),
      currentTurn: session.currentTurn,
      moveCount: session.moveCount,
      scores: session.scores,
      winner: session.winner,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity
    };
  }

  /**
   * Get player's current session
   */
  getPlayerSession(playerId) {
    const sessionId = this.playerSessions.get(playerId);
    if (!sessionId) return null;
    
    const session = this.sessions.get(sessionId);
    return session ? this.getSessionInfo(session) : null;
  }

  /**
   * Get public game state (what spectators can see)
   */
  getPublicGameState(session) {
    return {
      sessionId: session.id,
      gameType: session.gameType,
      status: session.status,
      currentTurn: session.currentTurn,
      moveCount: session.moveCount,
      scores: session.scores,
      board: session.gameState.board,
      lastMove: session.history[session.history.length - 1],
      timeRemaining: this.getTimeRemaining(session)
    };
  }

  /**
   * Initialize game state
   */
  initializeGameState(gameType, players, settings) {
    const template = this.gameStateTemplates[gameType];
    if (!template) {
      throw new ServiceError(`Unknown game type: ${gameType}`);
    }

    return {
      ...template,
      players,
      settings,
      board: this.generateBoard(gameType, settings),
      createdAt: Date.now()
    };
  }

  /**
   * Initialize scores for players
   */
  initializeScores(players) {
    const scores = {};
    for (const playerId of players) {
      scores[playerId] = 0;
    }
    return scores;
  }

  /**
   * Validate a move
   */
  validateMove(session, playerId, move) {
    // Basic validation
    if (!move || typeof move !== 'object') return false;
    if (!session.players.has(playerId)) return false;
    if (session.currentTurn !== playerId) return false;
    if (session.status !== 'active') return false;

    // Game-specific validation
    switch (session.gameType) {
      case 'match3_versus':
        return this.validateMatch3Move(session, move);
      case 'match3_tournament':
        return this.validateMatch3Move(session, move);
      case 'match3_coop':
        return this.validateMatch3Move(session, move);
      default:
        return false;
    }
  }

  /**
   * Validate Match-3 move
   */
  validateMatch3Move(session, move) {
    if (!move.from || !move.to) return false;
    if (!Array.isArray(move.from) || !Array.isArray(move.to)) return false;
    if (move.from.length !== 2 || move.to.length !== 2) return false;

    const [fromX, fromY] = move.from;
    const [toX, toY] = move.to;

    // Check bounds
    if (fromX < 0 || fromX >= 8 || fromY < 0 || fromY >= 8) return false;
    if (toX < 0 || toX >= 8 || toY < 0 || toY >= 8) return false;

    // Check if adjacent
    const dx = Math.abs(toX - fromX);
    const dy = Math.abs(toY - fromY);
    if (dx + dy !== 1) return false;

    return true;
  }

  /**
   * Process a move
   */
  processMove(session, playerId, move) {
    const result = {
      success: true,
      score: 0,
      matches: [],
      newBoard: null,
      powerUps: []
    };

    // Game-specific move processing
    switch (session.gameType) {
      case 'match3_versus':
        return this.processMatch3Move(session, playerId, move);
      case 'match3_tournament':
        return this.processMatch3Move(session, playerId, move);
      case 'match3_coop':
        return this.processMatch3Move(session, playerId, move);
      default:
        result.success = false;
        result.error = 'Unknown game type';
        return result;
    }
  }

  /**
   * Process Match-3 move
   */
  processMatch3Move(session, playerId, move) {
    const result = {
      success: true,
      score: 0,
      matches: [],
      newBoard: null,
      powerUps: []
    };

    try {
      // Swap tiles
      const board = [...session.gameState.board];
      const [fromX, fromY] = move.from;
      const [toX, toY] = move.to;

      const temp = board[fromY][fromX];
      board[fromY][fromX] = board[toY][toX];
      board[toY][toX] = temp;

      // Check for matches
      const matches = this.findMatches(board);
      if (matches.length === 0) {
        // Invalid move, swap back
        board[toY][toX] = board[fromY][fromX];
        board[fromY][fromX] = temp;
        result.success = false;
        result.error = 'No matches found';
        return result;
      }

      // Calculate score
      result.score = this.calculateScore(matches);
      result.matches = matches;
      result.newBoard = board;

      // Update game state
      session.gameState.board = board;

      // Check for power-ups
      result.powerUps = this.checkPowerUps(matches);

      return result;
    } catch (error) {
      result.success = false;
      result.error = error.message;
      return result;
    }
  }

  /**
   * Find matches on the board
   */
  findMatches(board) {
    const matches = [];
    const rows = board.length;
    const cols = board[0].length;

    // Check horizontal matches
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols - 2; x++) {
        const tile = board[y][x];
        if (tile && board[y][x + 1] === tile && board[y][x + 2] === tile) {
          matches.push({
            type: 'horizontal',
            tiles: [[x, y], [x + 1, y], [x + 2, y]],
            value: tile
          });
        }
      }
    }

    // Check vertical matches
    for (let y = 0; y < rows - 2; y++) {
      for (let x = 0; x < cols; x++) {
        const tile = board[y][x];
        if (tile && board[y + 1][x] === tile && board[y + 2][x] === tile) {
          matches.push({
            type: 'vertical',
            tiles: [[x, y], [x, y + 1], [x, y + 2]],
            value: tile
          });
        }
      }
    }

    return matches;
  }

  /**
   * Calculate score from matches
   */
  calculateScore(matches) {
    let score = 0;
    for (const match of matches) {
      score += match.tiles.length * 10; // 10 points per tile
    }
    return score;
  }

  /**
   * Check for power-ups
   */
  checkPowerUps(matches) {
    const powerUps = [];
    for (const match of matches) {
      if (match.tiles.length >= 4) {
        powerUps.push({
          type: 'line_clear',
          position: match.tiles[0]
        });
      }
      if (match.tiles.length >= 5) {
        powerUps.push({
          type: 'bomb',
          position: match.tiles[0]
        });
      }
    }
    return powerUps;
  }

  /**
   * Switch to next player's turn
   */
  switchTurn(session) {
    const players = Array.from(session.players);
    const currentIndex = players.indexOf(session.currentTurn);
    const nextIndex = (currentIndex + 1) % players.length;
    
    session.currentTurn = players[nextIndex];
    session.turnStartTime = Date.now();

    // Notify players
    this.io.to(`room_${session.roomId}`).emit('turn_switched', {
      sessionId: session.id,
      currentTurn: session.currentTurn,
      timeRemaining: this.getTimeRemaining(session)
    });
  }

  /**
   * Check game end conditions
   */
  checkGameEndConditions(session) {
    const result = {
      isGameOver: false,
      winner: null,
      reason: null
    };

    // Check move limit
    if (session.moveCount >= session.settings.maxMoves) {
      result.isGameOver = true;
      result.reason = 'move_limit_reached';
      result.winner = this.getHighestScoringPlayer(session);
      return result;
    }

    // Check time limit
    if (session.settings.timeLimit) {
      const elapsed = Date.now() - session.createdAt;
      if (elapsed >= session.settings.timeLimit) {
        result.isGameOver = true;
        result.reason = 'time_limit_reached';
        result.winner = this.getHighestScoringPlayer(session);
        return result;
      }
    }

    // Game-specific end conditions
    switch (session.gameType) {
      case 'match3_versus':
        return this.checkMatch3VersusEndConditions(session);
      case 'match3_tournament':
        return this.checkMatch3TournamentEndConditions(session);
      case 'match3_coop':
        return this.checkMatch3CoopEndConditions(session);
      default:
        return result;
    }
  }

  /**
   * Check Match-3 versus end conditions
   */
  checkMatch3VersusEndConditions(session) {
    const result = {
      isGameOver: false,
      winner: null,
      reason: null
    };

    const players = Array.from(session.players);
    const scores = players.map(p => session.scores[p] || 0);
    const maxScore = Math.max(...scores);

    // Check if any player reached target score
    if (maxScore >= 1000) {
      result.isGameOver = true;
      result.reason = 'target_score_reached';
      result.winner = players[scores.indexOf(maxScore)];
    }

    return result;
  }

  /**
   * Check Match-3 tournament end conditions
   */
  checkMatch3TournamentEndConditions(session) {
    // Tournament logic would go here
    return { isGameOver: false, winner: null, reason: null };
  }

  /**
   * Check Match-3 coop end conditions
   */
  checkMatch3CoopEndConditions(session) {
    const result = {
      isGameOver: false,
      winner: null,
      reason: null
    };

    const totalScore = Object.values(session.scores).reduce((sum, score) => sum + score, 0);

    // Check if team reached target score
    if (totalScore >= 2000) {
      result.isGameOver = true;
      result.reason = 'target_score_reached';
      result.winner = 'team'; // All players win in coop
    }

    return result;
  }

  /**
   * Get highest scoring player
   */
  getHighestScoringPlayer(session) {
    let maxScore = -1;
    let winner = null;

    for (const [playerId, score] of Object.entries(session.scores)) {
      if (score > maxScore) {
        maxScore = score;
        winner = playerId;
      }
    }

    return winner;
  }

  /**
   * Get time remaining in current turn
   */
  getTimeRemaining(session) {
    if (!session.turnStartTime) return null;
    
    const elapsed = Date.now() - session.turnStartTime;
    const remaining = Math.max(0, this.turnTimeout - elapsed);
    return remaining;
  }

  /**
   * Process turn timeouts
   */
  processTurnTimeouts() {
    const now = Date.now();
    
    for (const session of this.sessions.values()) {
      if (session.status === 'active' && session.turnStartTime) {
        const elapsed = now - session.turnStartTime;
        if (elapsed >= this.turnTimeout) {
          // Turn timeout - switch to next player
          this.switchTurn(session);
          
          // Notify players
          this.io.to(`room_${session.roomId}`).emit('turn_timeout', {
            sessionId: session.id,
            currentTurn: session.currentTurn
          });
        }
      }
    }
  }

  /**
   * Cleanup inactive sessions
   */
  cleanupInactiveSessions() {
    const now = Date.now();
    const sessionsToDelete = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.sessionTimeout) {
        sessionsToDelete.push(sessionId);
      }
    }

    for (const sessionId of sessionsToDelete) {
      const session = this.sessions.get(sessionId);
      if (session) {
        // Notify players
        this.io.to(`room_${session.roomId}`).emit('session_expired', {
          sessionId,
          reason: 'inactive'
        });

        // Remove players from session tracking
        for (const playerId of session.players) {
          this.playerSessions.delete(playerId);
        }

        this.sessions.delete(sessionId);
        this.logger.info(`Cleaned up inactive session: ${sessionId}`);
      }
    }
  }

  /**
   * Generate board for game type
   */
  generateBoard(gameType, settings) {
    const size = 8; // 8x8 board
    const board = [];
    
    for (let y = 0; y < size; y++) {
      board[y] = [];
      for (let x = 0; x < size; x++) {
        board[y][x] = Math.floor(Math.random() * 6) + 1; // 1-6 tile types
      }
    }
    
    return board;
  }

  /**
   * Get Match-3 versus template
   */
  getMatch3VersusTemplate() {
    return {
      gameType: 'match3_versus',
      timeLimit: 60,
      maxMoves: 30,
      targetScore: 1000,
      powerUps: true
    };
  }

  /**
   * Get Match-3 tournament template
   */
  getMatch3TournamentTemplate() {
    return {
      gameType: 'match3_tournament',
      rounds: [],
      currentRound: 0,
      bracket: [],
      timeLimit: 45
    };
  }

  /**
   * Get Match-3 coop template
   */
  getMatch3CoopTemplate() {
    return {
      gameType: 'match3_coop',
      sharedScore: 0,
      targetScore: 2000,
      timeLimit: 300
    };
  }

  /**
   * Get session statistics
   */
  getStatistics() {
    return {
      totalSessions: this.sessions.size,
      activePlayers: this.playerSessions.size,
      gameTypeDistribution: this.getGameTypeDistribution(),
      averageSessionDuration: this.getAverageSessionDuration()
    };
  }

  /**
   * Get game type distribution
   */
  getGameTypeDistribution() {
    const distribution = {};
    for (const session of this.sessions.values()) {
      distribution[session.gameType] = (distribution[session.gameType] || 0) + 1;
    }
    return distribution;
  }

  /**
   * Get average session duration
   */
  getAverageSessionDuration() {
    if (this.sessions.size === 0) return 0;
    
    const now = Date.now();
    const totalDuration = Array.from(this.sessions.values())
      .reduce((sum, session) => sum + (now - session.createdAt), 0);
    
    return totalDuration / this.sessions.size;
  }
}

export { GameSessionManager };