import { Logger } from '../../core/logger/index.js';
import { ServiceError } from '../../core/errors/ErrorHandler.js';

/**
 * Anti-Cheat System
 * Detects and prevents cheating in multiplayer games
 */
class AntiCheatSystem {
  constructor() {
    this.logger = new Logger('AntiCheatSystem');
    
    // Player behavior tracking
    this.playerProfiles = new Map(); // playerId -> behavior profile
    this.suspiciousActivities = new Map(); // playerId -> suspicious activities
    this.banList = new Set(); // banned player IDs
    
    // Cheat detection thresholds
    this.thresholds = {
      maxMovesPerSecond: 5,
      maxScorePerSecond: 100,
      maxConsecutivePerfectMoves: 10,
      maxImpossibleMoves: 3,
      maxSuspiciousPatterns: 5
    };
    
    // Detection patterns
    this.patterns = {
      botBehavior: this.getBotBehaviorPatterns(),
      impossibleMoves: this.getImpossibleMovePatterns(),
      scoreManipulation: this.getScoreManipulationPatterns()
    };
    
    this.initializeAntiCheatSystem();
  }

  /**
   * Initialize anti-cheat system
   */
  initializeAntiCheatSystem() {
    this.logger.info('Initializing Anti-Cheat System');
    
    // Cleanup old data every hour
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000);
    
    // Analyze suspicious activities every 5 minutes
    setInterval(() => {
      this.analyzeSuspiciousActivities();
    }, 5 * 60 * 1000);
  }

  /**
   * Validate a move for cheating
   */
  validateMove(playerId, move, gameState, sessionData) {
    try {
      const profile = this.getPlayerProfile(playerId);
      const now = Date.now();
      
      // Update player activity
      this.updatePlayerActivity(profile, move, now);
      
      // Check for various cheat patterns
      const checks = [
        this.checkMoveFrequency(profile, now),
        this.checkImpossibleMoves(move, gameState),
        this.checkBotBehavior(profile, move),
        this.checkScoreManipulation(profile, move, gameState),
        this.checkPatternRepetition(profile, move),
        this.checkTimingAnomalies(profile, now)
      ];
      
      const suspiciousChecks = checks.filter(check => check.suspicious);
      
      if (suspiciousChecks.length > 0) {
        this.recordSuspiciousActivity(playerId, suspiciousChecks, move);
        
        // If too many suspicious activities, flag for review
        if (suspiciousChecks.length >= this.thresholds.maxSuspiciousPatterns) {
          this.flagPlayerForReview(playerId, suspiciousChecks);
        }
      }
      
      // Check if player is banned
      if (this.banList.has(playerId)) {
        throw new ServiceError('Player is banned from multiplayer');
      }
      
      return {
        valid: true,
        suspicious: suspiciousChecks.length > 0,
        warnings: suspiciousChecks.map(check => check.warning)
      };
    } catch (error) {
      this.logger.error('Failed to validate move:', error);
      throw error;
    }
  }

  /**
   * Check move frequency
   */
  checkMoveFrequency(profile, now) {
    const recentMoves = profile.recentMoves.filter(
      move => now - move.timestamp < 1000 // Last second
    );
    
    if (recentMoves.length > this.thresholds.maxMovesPerSecond) {
      return {
        suspicious: true,
        warning: 'Move frequency too high',
        details: {
          movesPerSecond: recentMoves.length,
          threshold: this.thresholds.maxMovesPerSecond
        }
      };
    }
    
    return { suspicious: false };
  }

  /**
   * Check for impossible moves
   */
  checkImpossibleMoves(move, gameState) {
    const impossibleMoves = this.patterns.impossibleMoves;
    
    for (const pattern of impossibleMoves) {
      if (pattern.detect(move, gameState)) {
        return {
          suspicious: true,
          warning: 'Impossible move detected',
          details: {
            pattern: pattern.name,
            move: move
          }
        };
      }
    }
    
    return { suspicious: false };
  }

  /**
   * Check for bot behavior
   */
  checkBotBehavior(profile, move) {
    const botPatterns = this.patterns.botBehavior;
    
    for (const pattern of botPatterns) {
      if (pattern.detect(profile, move)) {
        return {
          suspicious: true,
          warning: 'Bot-like behavior detected',
          details: {
            pattern: pattern.name,
            confidence: pattern.confidence
          }
        };
      }
    }
    
    return { suspicious: false };
  }

  /**
   * Check for score manipulation
   */
  checkScoreManipulation(profile, move, gameState) {
    const scorePatterns = this.patterns.scoreManipulation;
    
    for (const pattern of scorePatterns) {
      if (pattern.detect(profile, move, gameState)) {
        return {
          suspicious: true,
          warning: 'Score manipulation detected',
          details: {
            pattern: pattern.name,
            expectedScore: pattern.expectedScore,
            actualScore: pattern.actualScore
          }
        };
      }
    }
    
    return { suspicious: false };
  }

  /**
   * Check for pattern repetition
   */
  checkPatternRepetition(profile, move) {
    const recentMoves = profile.recentMoves.slice(-10); // Last 10 moves
    
    if (recentMoves.length < 5) return { suspicious: false };
    
    // Check for identical move patterns
    const patterns = this.extractMovePatterns(recentMoves);
    const patternCounts = {};
    
    for (const pattern of patterns) {
      patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
    }
    
    const maxRepetition = Math.max(...Object.values(patternCounts));
    
    if (maxRepetition >= 3) {
      return {
        suspicious: true,
        warning: 'Repetitive move patterns detected',
        details: {
          maxRepetition,
          patterns: patternCounts
        }
      };
    }
    
    return { suspicious: false };
  }

  /**
   * Check for timing anomalies
   */
  checkTimingAnomalies(profile, now) {
    if (profile.recentMoves.length < 2) return { suspicious: false };
    
    const recentMoves = profile.recentMoves.slice(-5);
    const intervals = [];
    
    for (let i = 1; i < recentMoves.length; i++) {
      intervals.push(recentMoves[i].timestamp - recentMoves[i - 1].timestamp);
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Check for too consistent timing (bot-like)
    if (standardDeviation < 50) { // Less than 50ms variation
      return {
        suspicious: true,
        warning: 'Too consistent timing detected',
        details: {
          standardDeviation,
          avgInterval
        }
      };
    }
    
    // Check for impossibly fast moves
    const minInterval = Math.min(...intervals);
    if (minInterval < 100) { // Less than 100ms between moves
      return {
        suspicious: true,
        warning: 'Impossibly fast moves detected',
        details: {
          minInterval
        }
      };
    }
    
    return { suspicious: false };
  }

  /**
   * Get player profile
   */
  getPlayerProfile(playerId) {
    if (!this.playerProfiles.has(playerId)) {
      this.playerProfiles.set(playerId, {
        playerId,
        totalMoves: 0,
        recentMoves: [],
        suspiciousActivities: [],
        averageMoveTime: 0,
        movePatterns: [],
        scoreHistory: [],
        createdAt: Date.now(),
        lastActivity: Date.now()
      });
    }
    
    return this.playerProfiles.get(playerId);
  }

  /**
   * Update player activity
   */
  updatePlayerActivity(profile, move, timestamp) {
    profile.totalMoves++;
    profile.lastActivity = timestamp;
    
    // Add move to recent moves
    profile.recentMoves.push({
      move,
      timestamp,
      score: move.score || 0
    });
    
    // Keep only last 100 moves
    if (profile.recentMoves.length > 100) {
      profile.recentMoves = profile.recentMoves.slice(-100);
    }
    
    // Update average move time
    if (profile.recentMoves.length > 1) {
      const intervals = [];
      for (let i = 1; i < profile.recentMoves.length; i++) {
        intervals.push(profile.recentMoves[i].timestamp - profile.recentMoves[i - 1].timestamp);
      }
      profile.averageMoveTime = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    }
    
    // Update score history
    if (move.score) {
      profile.scoreHistory.push({
        score: move.score,
        timestamp
      });
      
      // Keep only last 50 scores
      if (profile.scoreHistory.length > 50) {
        profile.scoreHistory = profile.scoreHistory.slice(-50);
      }
    }
  }

  /**
   * Record suspicious activity
   */
  recordSuspiciousActivity(playerId, suspiciousChecks, move) {
    const profile = this.getPlayerProfile(playerId);
    
    const activity = {
      timestamp: Date.now(),
      checks: suspiciousChecks,
      move,
      severity: this.calculateSeverity(suspiciousChecks)
    };
    
    profile.suspiciousActivities.push(activity);
    
    // Keep only last 50 activities
    if (profile.suspiciousActivities.length > 50) {
      profile.suspiciousActivities = profile.suspiciousActivities.slice(-50);
    }
    
    this.logger.warn(`Suspicious activity recorded for player ${playerId}:`, activity);
  }

  /**
   * Calculate severity of suspicious activity
   */
  calculateSeverity(suspiciousChecks) {
    let severity = 0;
    
    for (const check of suspiciousChecks) {
      switch (check.warning) {
        case 'Move frequency too high':
          severity += 2;
          break;
        case 'Impossible move detected':
          severity += 3;
          break;
        case 'Bot-like behavior detected':
          severity += 2;
          break;
        case 'Score manipulation detected':
          severity += 3;
          break;
        case 'Repetitive move patterns detected':
          severity += 1;
          break;
        case 'Too consistent timing detected':
          severity += 2;
          break;
        case 'Impossibly fast moves detected':
          severity += 3;
          break;
        default:
          severity += 1;
      }
    }
    
    return severity;
  }

  /**
   * Flag player for review
   */
  flagPlayerForReview(playerId, suspiciousChecks) {
    const profile = this.getPlayerProfile(playerId);
    
    // Calculate total severity
    const totalSeverity = profile.suspiciousActivities.reduce(
      (sum, activity) => sum + activity.severity, 0
    );
    
    if (totalSeverity >= 10) {
      // Auto-ban for high severity
      this.banPlayer(playerId, 'High severity cheating detected');
    } else if (totalSeverity >= 5) {
      // Flag for manual review
      this.logger.warn(`Player ${playerId} flagged for manual review. Severity: ${totalSeverity}`);
    }
  }

  /**
   * Ban a player
   */
  banPlayer(playerId, reason) {
    this.banList.add(playerId);
    
    this.logger.warn(`Player ${playerId} banned. Reason: ${reason}`);
    
    // Notify game servers
    this.notifyPlayerBan(playerId, reason);
  }

  /**
   * Unban a player
   */
  unbanPlayer(playerId) {
    this.banList.delete(playerId);
    
    this.logger.info(`Player ${playerId} unbanned`);
  }

  /**
   * Notify about player ban
   */
  notifyPlayerBan(playerId, reason) {
    // This would notify all game servers about the ban
    // Implementation depends on your notification system
    this.logger.info(`Ban notification sent for player ${playerId}`);
  }

  /**
   * Extract move patterns
   */
  extractMovePatterns(moves) {
    const patterns = [];
    
    for (let i = 0; i < moves.length - 1; i++) {
      const current = moves[i];
      const next = moves[i + 1];
      
      if (current.move && next.move) {
        const pattern = this.createMovePattern(current.move, next.move);
        patterns.push(pattern);
      }
    }
    
    return patterns;
  }

  /**
   * Create move pattern
   */
  createMovePattern(move1, move2) {
    return {
      from1: move1.from,
      to1: move1.to,
      from2: move2.from,
      to2: move2.to,
      pattern: `${JSON.stringify(move1.from)}->${JSON.stringify(move1.to)}|${JSON.stringify(move2.from)}->${JSON.stringify(move2.to)}`
    };
  }

  /**
   * Get bot behavior patterns
   */
  getBotBehaviorPatterns() {
    return [
      {
        name: 'Perfect Timing',
        detect: (profile, move) => {
          if (profile.recentMoves.length < 5) return false;
          
          const recentMoves = profile.recentMoves.slice(-5);
          const intervals = [];
          
          for (let i = 1; i < recentMoves.length; i++) {
            intervals.push(recentMoves[i].timestamp - recentMoves[i - 1].timestamp);
          }
          
          const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
          const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
          
          return variance < 100; // Very low variance indicates bot
        },
        confidence: 0.8
      },
      {
        name: 'Perfect Moves',
        detect: (profile, move) => {
          if (profile.recentMoves.length < 10) return false;
          
          const recentMoves = profile.recentMoves.slice(-10);
          const perfectMoves = recentMoves.filter(m => m.score > 0);
          
          return perfectMoves.length >= 8; // 80% perfect moves
        },
        confidence: 0.9
      }
    ];
  }

  /**
   * Get impossible move patterns
   */
  getImpossibleMovePatterns() {
    return [
      {
        name: 'Invalid Board Position',
        detect: (move, gameState) => {
          if (!move.from || !move.to) return false;
          
          const [fromX, fromY] = move.from;
          const [toX, toY] = move.to;
          
          // Check if positions are valid
          if (fromX < 0 || fromX >= 8 || fromY < 0 || fromY >= 8) return true;
          if (toX < 0 || toX >= 8 || toY < 0 || toY >= 8) return true;
          
          return false;
        }
      },
      {
        name: 'Non-Adjacent Move',
        detect: (move, gameState) => {
          if (!move.from || !move.to) return false;
          
          const [fromX, fromY] = move.from;
          const [toX, toY] = move.to;
          
          const dx = Math.abs(toX - fromX);
          const dy = Math.abs(toY - fromY);
          
          return dx + dy !== 1; // Not adjacent
        }
      }
    ];
  }

  /**
   * Get score manipulation patterns
   */
  getScoreManipulationPatterns() {
    return [
      {
        name: 'Impossible Score',
        detect: (profile, move, gameState) => {
          if (!move.score) return false;
          
          // Check if score is too high for the move
          const expectedScore = this.calculateExpectedScore(move, gameState);
          const actualScore = move.score;
          
          return actualScore > expectedScore * 2; // More than double expected
        },
        expectedScore: 0,
        actualScore: 0
      },
      {
        name: 'Score History Anomaly',
        detect: (profile, move, gameState) => {
          if (profile.scoreHistory.length < 5) return false;
          
          const recentScores = profile.scoreHistory.slice(-5).map(s => s.score);
          const avgScore = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
          const currentScore = move.score || 0;
          
          return currentScore > avgScore * 3; // More than triple average
        },
        expectedScore: 0,
        actualScore: 0
      }
    ];
  }

  /**
   * Calculate expected score for a move
   */
  calculateExpectedScore(move, gameState) {
    // This would implement the actual game logic to calculate expected score
    // For now, return a simple calculation
    return 10; // Base score for a move
  }

  /**
   * Cleanup old data
   */
  cleanupOldData() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [playerId, profile] of this.playerProfiles.entries()) {
      // Clean up old moves
      profile.recentMoves = profile.recentMoves.filter(
        move => now - move.timestamp < maxAge
      );
      
      // Clean up old suspicious activities
      profile.suspiciousActivities = profile.suspiciousActivities.filter(
        activity => now - activity.timestamp < maxAge
      );
      
      // Clean up old scores
      profile.scoreHistory = profile.scoreHistory.filter(
        score => now - score.timestamp < maxAge
      );
    }
  }

  /**
   * Analyze suspicious activities
   */
  analyzeSuspiciousActivities() {
    for (const [playerId, profile] of this.playerProfiles.entries()) {
      if (profile.suspiciousActivities.length > 0) {
        const recentActivities = profile.suspiciousActivities.filter(
          activity => Date.now() - activity.timestamp < 60 * 60 * 1000 // Last hour
        );
        
        if (recentActivities.length >= 5) {
          this.flagPlayerForReview(playerId, recentActivities);
        }
      }
    }
  }

  /**
   * Get player statistics
   */
  getPlayerStatistics(playerId) {
    const profile = this.getPlayerProfile(playerId);
    
    return {
      playerId,
      totalMoves: profile.totalMoves,
      suspiciousActivities: profile.suspiciousActivities.length,
      averageMoveTime: profile.averageMoveTime,
      isBanned: this.banList.has(playerId),
      lastActivity: profile.lastActivity
    };
  }

  /**
   * Get system statistics
   */
  getSystemStatistics() {
    return {
      totalPlayers: this.playerProfiles.size,
      bannedPlayers: this.banList.size,
      suspiciousPlayers: Array.from(this.playerProfiles.values())
        .filter(profile => profile.suspiciousActivities.length > 0).length,
      totalSuspiciousActivities: Array.from(this.playerProfiles.values())
        .reduce((sum, profile) => sum + profile.suspiciousActivities.length, 0)
    };
  }
}

export { AntiCheatSystem };