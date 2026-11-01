/**
 * Retention Actions Service
 *
 * Makes the retention dashboard actionable by automatically triggering
 * interventions when retention drops below benchmarks.
 *
 * Rules:
 *  - D1 < 30% → Send welcome-back offer to new players who played once and left
 *  - D7 < 15% → Send streak repair offer to players with broken streaks
 *  - D30 < 5% → Send high-value win-back to lapsed spenders
 *  - Choke point detected → Offer level skip or continue discount
 *  - Streak broken → Send streak repair notification
 */

import { Logger } from '../../core/logger/index.js';
import { notifyPlayer } from '../push/push-service.js';
import { computeRetention } from './retention-service.js';
import LevelAnalyticsService from './level-analytics-service.js';

const logger = new Logger('RetentionActionsService');

const DAY_MS = 24 * 60 * 60 * 1000;

// Retention benchmarks (match-3 genre)
const RETENTION_BENCHMARKS = {
  d1_warning: 30,   // % - alert if D1 below this
  d7_warning: 15,   // % - alert if D7 below this
  d30_warning: 5,   // % - alert if D30 below this
};

class RetentionActionsService {
  constructor(accountEconomy, levelAnalytics, winbackScheduler, streakProtection) {
    this.accountEconomy = accountEconomy;
    this.levelAnalytics = levelAnalytics;
    this.winbackScheduler = winbackScheduler;
    this.streakProtection = streakProtection;

    // Action history: { actionType, playerId, triggeredAt, reason, result }
    this.actionHistory = [];

    // Whether auto-actions are enabled
    this.autoActionsEnabled = true;
  }

  /**
   * Evaluate retention metrics and trigger automatic actions.
   * Returns { actions: [], alerts: [] }.
   */
  async evaluateAndAct({ nowMs = Date.now() } = {}) {
    const actions = [];
    const alerts = [];

    // Get retention data
    let retention;
    try {
      retention = await computeRetention(nowMs);
    } catch (error) {
      logger.error('Failed to compute retention for actions', { error: error.message });
      return { actions: [], alerts: [{ type: 'error', message: error.message }] };
    }

    // Check D1 retention
    if (retention.overall.d1 < RETENTION_BENCHMARKS.d1_warning) {
      alerts.push({
        type: 'retention_warning',
        metric: 'd1',
        current: retention.overall.d1,
        threshold: RETENTION_BENCHMARKS.d1_warning,
        severity: 'high',
        message: `D1 retention (${retention.overall.d1}%) is below benchmark (${RETENTION_BENCHMARKS.d1_warning}%)`,
      });

      // Auto-action: send welcome-back offers to new players who played once and left
      if (this.autoActionsEnabled) {
        const d1Actions = await this.triggerD1RecoveryActions(nowMs);
        actions.push(...d1Actions);
      }
    }

    // Check D7 retention
    if (retention.overall.d7 < RETENTION_BENCHMARKS.d7_warning) {
      alerts.push({
        type: 'retention_warning',
        metric: 'd7',
        current: retention.overall.d7,
        threshold: RETENTION_BENCHMARKS.d7_warning,
        severity: 'high',
        message: `D7 retention (${retention.overall.d7}%) is below benchmark (${RETENTION_BENCHMARKS.d7_warning}%)`,
      });

      if (this.autoActionsEnabled) {
        const d7Actions = await this.triggerD7RecoveryActions(nowMs);
        actions.push(...d7Actions);
      }
    }

    // Check D30 retention
    if (retention.overall.d30 < RETENTION_BENCHMARKS.d30_warning) {
      alerts.push({
        type: 'retention_warning',
        metric: 'd30',
        current: retention.overall.d30,
        threshold: RETENTION_BENCHMARKS.d30_warning,
        severity: 'critical',
        message: `D30 retention (${retention.overall.d30}%) is below benchmark (${RETENTION_BENCHMARKS.d30_warning}%)`,
      });

      if (this.autoActionsEnabled) {
        const d30Actions = await this.triggerD30RecoveryActions(nowMs);
        actions.push(...d30Actions);
      }
    }

    // Check for choke points in level difficulty
    const chokePoints = this.levelAnalytics.getChokePoints();
    for (const choke of chokePoints.slice(0, 5)) {
      alerts.push({
        type: 'choke_point',
        level: choke.level,
        failRate: choke.failRate,
        severity: choke.severity,
        message: `Level ${choke.level} has ${choke.failRate}% fail rate - consider difficulty adjustment`,
      });

      if (this.autoActionsEnabled) {
        actions.push({
          type: 'level_difficulty_alert',
          level: choke.level,
          reason: `High fail rate (${choke.failRate}%)`,
          triggeredAt: new Date(nowMs).toISOString(),
          result: 'flagged_for_review',
        });
      }
    }

    // Record all actions and alerts
    for (const action of actions) {
      this.actionHistory.push({ ...action, recordedAt: new Date(nowMs).toISOString() });
    }
    for (const alert of alerts) {
      this.actionHistory.push({ ...alert, recordedAt: new Date(nowMs).toISOString() });
    }

    // Trim history to last 1000 entries
    if (this.actionHistory.length > 1000) {
      this.actionHistory = this.actionHistory.slice(-1000);
    }

    return { actions, alerts };
  }

  /**
   * D1 recovery: send welcome-back to players who played level 1 but haven't returned.
   */
  async triggerD1RecoveryActions(nowMs = Date.now()) {
    const actions = [];
    const cutoffMs = nowMs - 2 * DAY_MS; // Players who joined 1-2 days ago

    // This would query real players; for now we use the economy service
    try {
      const allEconomies = await this.accountEconomy.getAllPlayerEconomies();
      if (!allEconomies) return actions;

      let count = 0;
      for (const [playerId, economy] of allEconomies) {
        const stats = economy.statistics || {};
        const createdAt = economy.createdAt ? new Date(economy.createdAt).getTime() : 0;
        const lastPlayed = stats.lastPlayed ? new Date(stats.lastPlayed).getTime() : 0;
        const levelsCompleted = stats.levelsCompleted || 0;

        // Player joined recently, played level 1, but hasn't returned in 24+ hours
        if (createdAt >= cutoffMs && createdAt < nowMs - DAY_MS &&
            levelsCompleted >= 1 &&
            nowMs - lastPlayed > DAY_MS) {

          try {
            await notifyPlayer({
              userId: playerId,
              title: "Come back for your second day!",
              body: "You're off to a great start. Log in today for your day 2 bonus!",
              data: { type: 'd1_recovery', playerId },
            });

            actions.push({
              type: 'd1_recovery',
              playerId,
              reason: 'D1 retention below benchmark',
              triggeredAt: new Date(nowMs).toISOString(),
              result: 'notification_sent',
            });
            count++;

            // Cap notifications per cycle
            if (count >= 50) break;
          } catch (error) {
            logger.error('Failed to send D1 recovery notification', { playerId, error: error.message });
          }
        }
      }

      logger.info('D1 recovery actions triggered', { count });
    } catch (error) {
      logger.error('D1 recovery failed', { error: error.message });
    }

    return actions;
  }

  /**
   * D7 recovery: send streak repair to players with broken streaks.
   */
  async triggerD7RecoveryActions(nowMs = Date.now()) {
    const actions = [];
    const cutoffMs = nowMs - 7 * DAY_MS;

    try {
      const allEconomies = await this.accountEconomy.getAllPlayerEconomies();
      if (!allEconomies) return actions;

      let count = 0;
      for (const [playerId, economy] of allEconomies) {
        const stats = economy.statistics || {};
        const dailyRewards = economy.dailyRewards || {};
        const lastPlayed = stats.lastPlayed ? new Date(stats.lastPlayed).getTime() : 0;
        const streak = dailyRewards.streak || 0;
        const createdAt = economy.createdAt ? new Date(economy.createdAt).getTime() : 0;

        // Player has been around for a week+, has a broken streak, and hasn't played recently
        if (createdAt < cutoffMs &&
            nowMs - lastPlayed > 2 * DAY_MS &&
            streak === 0 &&
            stats.levelsCompleted >= 3) {

          try {
            await notifyPlayer({
              userId: playerId,
              title: 'Repair your streak!',
              body: "Your streak is waiting to be restored. Come back and claim it!",
              data: { type: 'streak_repair', playerId, offer: 'streak_repair' },
            });

            actions.push({
              type: 'streak_repair_offer',
              playerId,
              reason: 'D7 retention below benchmark - broken streak',
              triggeredAt: new Date(nowMs).toISOString(),
              result: 'notification_sent',
            });
            count++;

            if (count >= 50) break;
          } catch (error) {
            logger.error('Failed to send streak repair notification', { playerId, error: error.message });
          }
        }
      }

      logger.info('D7 recovery actions triggered', { count });
    } catch (error) {
      logger.error('D7 recovery failed', { error: error.message });
    }

    return actions;
  }

  /**
   * D30 recovery: high-value win-back for lapsed spenders.
   */
  async triggerD30RecoveryActions(nowMs = Date.now()) {
    const actions = [];
    const cutoffMs = nowMs - 30 * DAY_MS;

    try {
      const allEconomies = await this.accountEconomy.getAllPlayerEconomies();
      if (!allEconomies) return actions;

      let count = 0;
      for (const [playerId, economy] of allEconomies) {
        const stats = economy.statistics || {};
        const lastPlayed = stats.lastPlayed ? new Date(stats.lastPlayed).getTime() : 0;
        const totalSpent = stats.totalSpent || 0;

        // Lapsed spender: spent money, inactive for 30+ days
        if (totalSpent > 0 && nowMs - lastPlayed > cutoffMs) {

          try {
            await notifyPlayer({
              userId: playerId,
              title: 'An exclusive offer awaits your return',
              body: "We've reserved a special welcome-back package just for you.",
              data: { type: 'd30_winback', playerId, offer: 'high_value_winback' },
            });

            actions.push({
              type: 'high_value_winback',
              playerId,
              reason: 'D30 retention below benchmark - lapsed spender',
              triggeredAt: new Date(nowMs).toISOString(),
              result: 'notification_sent',
            });
            count++;

            if (count >= 50) break;
          } catch (error) {
            logger.error('Failed to send D30 win-back notification', { playerId, error: error.message });
          }
        }
      }

      logger.info('D30 recovery actions triggered', { count });
    } catch (error) {
      logger.error('D30 recovery failed', { error: error.message });
    }

    return actions;
  }

  /**
   * Get recent action history.
   */
  getActionHistory(limit = 100) {
    return this.actionHistory.slice(-limit);
  }

  /**
   * Get stats on actions taken.
   */
  getStats() {
    const byType = {};
    for (const action of this.actionHistory) {
      byType[action.type] = (byType[action.type] || 0) + 1;
    }
    return {
      totalActions: this.actionHistory.length,
      byType,
      autoActionsEnabled: this.autoActionsEnabled,
    };
  }

  /**
   * Enable or disable auto-actions.
   */
  setAutoActions(enabled) {
    this.autoActionsEnabled = enabled;
  }
}

export default RetentionActionsService;
export { RetentionActionsService, RETENTION_BENCHMARKS };
