/**
 * Level Analytics Service
 *
 * Tracks level completion and failure rates to identify choke points that cause
 * player churn. Helps tune difficulty and improve retention.
 *
 * Tracks:
 *  - Level attempts (starts)
 *  - Level completions (wins)
 *  - Level failures (losses / out of moves)
 *  - Continues used per level
 *  - Skips used per level
 *  - Average moves used
 *  - Average time spent
 *  - Fail rate by level (failures / attempts)
 *  - Choke point identification (levels with >30% fail rate)
 */

import { Logger } from '../../core/logger/index.js';

const logger = new Logger('LevelAnalyticsService');

// In-memory level attempt store: levelNumber -> { attempts, completions, failures, ... }
// In production this would be persisted to a database.
const levelStats = new Map();

// Player-level attempt tracking: playerId:levelNumber -> { startedAt, attempts, continues, skips }
const playerAttempts = new Map();

class LevelAnalyticsService {
  constructor() {
    this.isEnabled = true;
  }

  /**
   * Record a level start attempt.
   */
  recordLevelStart(playerId, levelNumber, { mode = 'classic', nowMs = Date.now() } = {}) {
    if (!this.isEnabled) return;

    const key = `level_${levelNumber}`;
    let stats = levelStats.get(key);
    if (!stats) {
      stats = {
        level: levelNumber,
        mode,
        attempts: 0,
        completions: 0,
        failures: 0,
        continuesUsed: 0,
        skipsUsed: 0,
        totalMoves: 0,
        totalTimeMs: 0,
        firstAttemptAt: nowMs,
        lastAttemptAt: nowMs,
      };
      levelStats.set(key, stats);
    }

    stats.attempts += 1;
    stats.lastAttemptAt = nowMs;

    // Track player attempt
    const playerKey = `${playerId}:${levelNumber}`;
    playerAttempts.set(playerKey, {
      playerId,
      levelNumber,
      startedAt: nowMs,
      attempts: 0,
      continues: 0,
      skips: 0,
    });

    logger.debug('Level start recorded', { playerId, levelNumber, mode });
  }

  /**
   * Record a level completion (win).
   */
  recordLevelComplete(playerId, levelNumber, { movesUsed, timeMs, starsEarned, nowMs = Date.now() } = {}) {
    if (!this.isEnabled) return;

    const key = `level_${levelNumber}`;
    const stats = levelStats.get(key);
    if (stats) {
      stats.completions += 1;
      if (movesUsed !== undefined) stats.totalMoves += movesUsed;
      if (timeMs !== undefined) stats.totalTimeMs += timeMs;
    }

    // Update player attempt
    const playerKey = `${playerId}:${levelNumber}`;
    const attempt = playerAttempts.get(playerKey);
    if (attempt) {
      attempt.completed = true;
      attempt.completedAt = nowMs;
      attempt.movesUsed = movesUsed;
      attempt.timeMs = timeMs;
      attempt.starsEarned = starsEarned;
    }

    logger.debug('Level complete recorded', { playerId, levelNumber, starsEarned });
  }

  /**
   * Record a level failure (loss / out of moves).
   */
  recordLevelFail(playerId, levelNumber, { movesUsed, timeMs, reason = 'out_of_moves', nowMs = Date.now() } = {}) {
    if (!this.isEnabled) return;

    const key = `level_${levelNumber}`;
    const stats = levelStats.get(key);
    if (stats) {
      stats.failures += 1;
      if (movesUsed !== undefined) stats.totalMoves += movesUsed;
      if (timeMs !== undefined) stats.totalTimeMs += timeMs;
    }

    // Update player attempt
    const playerKey = `${playerId}:${levelNumber}`;
    const attempt = playerAttempts.get(playerKey);
    if (attempt) {
      attempt.failed = true;
      attempt.failedAt = nowMs;
      attempt.failReason = reason;
      attempt.movesUsed = movesUsed;
      attempt.timeMs = timeMs;
    }

    logger.debug('Level fail recorded', { playerId, levelNumber, reason });
  }

  /**
   * Record a continue used on a level.
   */
  recordContinue(playerId, levelNumber, { nowMs = Date.now() } = {}) {
    if (!this.isEnabled) return;

    const key = `level_${levelNumber}`;
    const stats = levelStats.get(key);
    if (stats) stats.continuesUsed += 1;

    const playerKey = `${playerId}:${levelNumber}`;
    const attempt = playerAttempts.get(playerKey);
    if (attempt) attempt.continues += 1;

    logger.debug('Continue recorded', { playerId, levelNumber });
  }

  /**
   * Record a skip used on a level.
   */
  recordSkip(playerId, levelNumber, { nowMs = Date.now() } = {}) {
    if (!this.isEnabled) return;

    const key = `level_${levelNumber}`;
    const stats = levelStats.get(key);
    if (stats) stats.skipsUsed += 1;

    const playerKey = `${playerId}:${levelNumber}`;
    const attempt = playerAttempts.get(playerKey);
    if (attempt) attempt.skips += 1;

    logger.debug('Skip recorded', { playerId, levelNumber });
  }

  /**
   * Get statistics for a specific level.
   */
  getLevelStats(levelNumber) {
    return levelStats.get(`level_${levelNumber}`) || null;
  }

  /**
   * Get fail rate for a level (failures / attempts).
   */
  getFailRate(levelNumber) {
    const stats = this.getLevelStats(levelNumber);
    if (!stats || stats.attempts === 0) return 0;
    return Math.round((stats.failures / stats.attempts) * 10000) / 100;
  }

  /**
   * Get completion rate for a level (completions / attempts).
   */
  getCompletionRate(levelNumber) {
    const stats = this.getLevelStats(levelNumber);
    if (!stats || stats.attempts === 0) return 0;
    return Math.round((stats.completions / stats.attempts) * 10000) / 100;
  }

  /**
   * Identify choke points - levels with high fail rates that may cause churn.
   * Returns levels with fail rate > threshold, sorted by severity.
   */
  getChokePoints({ failRateThreshold = 30, minAttempts = 10 } = {}) {
    const chokePoints = [];

    for (const [key, stats] of levelStats.entries()) {
      if (stats.attempts < minAttempts) continue;

      const failRate = this.getFailRate(stats.level);
      if (failRate >= failRateThreshold) {
        chokePoints.push({
          level: stats.level,
          attempts: stats.attempts,
          completions: stats.completions,
          failures: stats.failures,
          failRate,
          completionRate: this.getCompletionRate(stats.level),
          continuesUsed: stats.continuesUsed,
          skipsUsed: stats.skipsUsed,
          avgMoves: stats.attempts > 0 ? Math.round(stats.totalMoves / stats.attempts) : 0,
          avgTimeMs: stats.attempts > 0 ? Math.round(stats.totalTimeMs / stats.attempts) : 0,
          severity: failRate >= 50 ? 'critical' : failRate >= 40 ? 'high' : 'medium',
        });
      }
    }

    chokePoints.sort((a, b) => b.failRate - a.failRate);
    return chokePoints;
  }

  /**
   * Get level difficulty curve - fail rates for a range of levels.
   */
  getDifficultyCurve(fromLevel = 1, toLevel = 100) {
    const curve = [];
    for (let level = fromLevel; level <= toLevel; level++) {
      const failRate = this.getFailRate(level);
      const completionRate = this.getCompletionRate(level);
      const stats = this.getLevelStats(level);
      curve.push({
        level,
        attempts: stats ? stats.attempts : 0,
        failRate,
        completionRate,
        difficulty: failRate >= 40 ? 'hard' : failRate >= 25 ? 'medium' : 'easy',
      });
    }
    return curve;
  }

  /**
   * Get overall analytics summary.
   */
  getSummary() {
    const levels = Array.from(levelStats.values());
    const totalAttempts = levels.reduce((sum, s) => sum + s.attempts, 0);
    const totalCompletions = levels.reduce((sum, s) => sum + s.completions, 0);
    const totalFailures = levels.reduce((sum, s) => sum + s.failures, 0);

    return {
      totalLevelsTracked: levels.length,
      totalAttempts,
      totalCompletions,
      totalFailures,
      overallFailRate: totalAttempts > 0 ? Math.round((totalFailures / totalAttempts) * 10000) / 100 : 0,
      overallCompletionRate: totalAttempts > 0 ? Math.round((totalCompletions / totalAttempts) * 10000) / 100 : 0,
      chokePoints: this.getChokePoints().length,
    };
  }

  /**
   * Reset all analytics (for testing).
   */
  reset() {
    levelStats.clear();
    playerAttempts.clear();
  }
}

export default LevelAnalyticsService;
export { LevelAnalyticsService };
