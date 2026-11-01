/**
 * Retention Actions Routes
 *
 * POST /api/retention/retention-actions/evaluate - Evaluate retention and trigger actions (admin)
 * GET /api/retention/retention-actions/history - Get action history (admin)
 * GET /api/retention/retention-actions/stats - Get action statistics (admin)
 * POST /api/retention/retention-actions/auto-actions - Enable/disable auto-actions (admin)
 */

import express from 'express';
import security from '../../core/security/index.js';
import { Logger } from '../../core/logger/index.js';
import { computeRetention } from '../../services/retention/retention-service.js';
import LevelAnalyticsService from '../../services/retention/level-analytics-service.js';
import { accountEconomy } from '../../services/economy/AccountEconomyService.js';
import { notifyPlayer } from '../../services/push/push-service.js';

const router = express.Router();
const logger = new Logger('RetentionActionsRoutes');

const levelAnalytics = new LevelAnalyticsService();

// Retention action history
const actionHistory = [];
let autoActionsEnabled = true;

const RETENTION_BENCHMARKS = { d1_warning: 30, d7_warning: 15, d30_warning: 5 };
const DAY_MS = 24 * 60 * 60 * 1000;

router.use(security.sessionValidation);

/** Evaluate retention metrics and trigger automatic actions (admin only). */
router.post('/evaluate', async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.playerId !== 'admin') {
      return res.status(403).json({ success: false, error: 'admin_required', requestId: req.requestId });
    }
    const nowMs = Date.now();
    const actions = [];
    const alerts = [];

    let retention;
    try {
      retention = await computeRetention(nowMs);
    } catch (error) {
      return res.status(500).json({ success: false, error: 'retention_compute_error', requestId: req.requestId });
    }

    // D1 check
    if (retention.overall.d1 < RETENTION_BENCHMARKS.d1_warning) {
      alerts.push({ type: 'retention_warning', metric: 'd1', current: retention.overall.d1, threshold: RETENTION_BENCHMARKS.d1_warning, severity: 'high', message: `D1 retention (${retention.overall.d1}%) below benchmark` });
      if (autoActionsEnabled) {
        const d1Actions = await triggerD1Recovery(nowMs);
        actions.push(...d1Actions);
      }
    }

    // D7 check
    if (retention.overall.d7 < RETENTION_BENCHMARKS.d7_warning) {
      alerts.push({ type: 'retention_warning', metric: 'd7', current: retention.overall.d7, threshold: RETENTION_BENCHMARKS.d7_warning, severity: 'high', message: `D7 retention (${retention.overall.d7}%) below benchmark` });
      if (autoActionsEnabled) {
        const d7Actions = await triggerD7Recovery(nowMs);
        actions.push(...d7Actions);
      }
    }

    // D30 check
    if (retention.overall.d30 < RETENTION_BENCHMARKS.d30_warning) {
      alerts.push({ type: 'retention_warning', metric: 'd30', current: retention.overall.d30, threshold: RETENTION_BENCHMARKS.d30_warning, severity: 'critical', message: `D30 retention (${retention.overall.d30}%) below benchmark` });
      if (autoActionsEnabled) {
        const d30Actions = await triggerD30Recovery(nowMs);
        actions.push(...d30Actions);
      }
    }

    // Choke points
    const chokePoints = levelAnalytics.getChokePoints();
    for (const choke of chokePoints.slice(0, 5)) {
      alerts.push({ type: 'choke_point', level: choke.level, failRate: choke.failRate, severity: choke.severity, message: `Level ${choke.level} has ${choke.failRate}% fail rate` });
      if (autoActionsEnabled) {
        actions.push({ type: 'level_difficulty_alert', level: choke.level, reason: `High fail rate (${choke.failRate}%)`, triggeredAt: new Date(nowMs).toISOString(), result: 'flagged_for_review' });
      }
    }

    for (const a of actions) actionHistory.push({ ...a, recordedAt: new Date(nowMs).toISOString() });
    for (const a of alerts) actionHistory.push({ ...a, recordedAt: new Date(nowMs).toISOString() });
    if (actionHistory.length > 1000) actionHistory.splice(0, actionHistory.length - 1000);

    res.json({ success: true, actions, alerts, retention: retention.overall, requestId: req.requestId });
  } catch (error) {
    logger.error('Evaluate retention actions failed', { error: error.message });
    res.status(500).json({ success: false, error: 'evaluate_actions_error', requestId: req.requestId });
  }
});

async function triggerD1Recovery(nowMs) {
  const actions = [];
  const cutoffMs = nowMs - 2 * DAY_MS;
  try {
    const allEconomies = await accountEconomy.getAllPlayerEconomies();
    let count = 0;
    for (const [playerId, economy] of allEconomies) {
      const stats = economy.statistics || {};
      const createdAt = economy.createdAt ? new Date(economy.createdAt).getTime() : 0;
      const lastPlayed = stats.lastPlayed ? new Date(stats.lastPlayed).getTime() : 0;
      const levelsCompleted = stats.levelsCompleted || 0;
      if (createdAt >= cutoffMs && createdAt < nowMs - DAY_MS && levelsCompleted >= 1 && nowMs - lastPlayed > DAY_MS) {
        try {
          await notifyPlayer({ userId: playerId, title: 'Come back for your second day!', body: "You're off to a great start. Log in today for your day 2 bonus!", data: { type: 'd1_recovery', playerId } });
          actions.push({ type: 'd1_recovery', playerId, reason: 'D1 retention below benchmark', triggeredAt: new Date(nowMs).toISOString(), result: 'notification_sent' });
          if (++count >= 50) break;
        } catch (e) { logger.error('D1 recovery notify failed', { playerId, error: e.message }); }
      }
    }
  } catch (e) { logger.error('D1 recovery failed', { error: e.message }); }
  return actions;
}

async function triggerD7Recovery(nowMs) {
  const actions = [];
  const cutoffMs = nowMs - 7 * DAY_MS;
  try {
    const allEconomies = await accountEconomy.getAllPlayerEconomies();
    let count = 0;
    for (const [playerId, economy] of allEconomies) {
      const stats = economy.statistics || {};
      const dailyRewards = economy.dailyRewards || {};
      const lastPlayed = stats.lastPlayed ? new Date(stats.lastPlayed).getTime() : 0;
      const streak = dailyRewards.streak || 0;
      const createdAt = economy.createdAt ? new Date(economy.createdAt).getTime() : 0;
      if (createdAt < cutoffMs && nowMs - lastPlayed > 2 * DAY_MS && streak === 0 && stats.levelsCompleted >= 3) {
        try {
          await notifyPlayer({ userId: playerId, title: 'Repair your streak!', body: 'Your streak is waiting to be restored. Come back and claim it!', data: { type: 'streak_repair', playerId } });
          actions.push({ type: 'streak_repair_offer', playerId, reason: 'D7 retention below benchmark', triggeredAt: new Date(nowMs).toISOString(), result: 'notification_sent' });
          if (++count >= 50) break;
        } catch (e) { logger.error('D7 recovery notify failed', { playerId, error: e.message }); }
      }
    }
  } catch (e) { logger.error('D7 recovery failed', { error: e.message }); }
  return actions;
}

async function triggerD30Recovery(nowMs) {
  const actions = [];
  const cutoffMs = nowMs - 30 * DAY_MS;
  try {
    const allEconomies = await accountEconomy.getAllPlayerEconomies();
    let count = 0;
    for (const [playerId, economy] of allEconomies) {
      const stats = economy.statistics || {};
      const lastPlayed = stats.lastPlayed ? new Date(stats.lastPlayed).getTime() : 0;
      const totalSpent = stats.totalSpent || 0;
      if (totalSpent > 0 && nowMs - lastPlayed > cutoffMs) {
        try {
          await notifyPlayer({ userId: playerId, title: 'An exclusive offer awaits your return', body: "We've reserved a special welcome-back package just for you.", data: { type: 'd30_winback', playerId } });
          actions.push({ type: 'high_value_winback', playerId, reason: 'D30 retention below benchmark', triggeredAt: new Date(nowMs).toISOString(), result: 'notification_sent' });
          if (++count >= 50) break;
        } catch (e) { logger.error('D30 recovery notify failed', { playerId, error: e.message }); }
      }
    }
  } catch (e) { logger.error('D30 recovery failed', { error: e.message }); }
  return actions;
}

/** Get action history (admin only). */
router.get('/history', async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.playerId !== 'admin') {
      return res.status(403).json({ success: false, error: 'admin_required', requestId: req.requestId });
    }
    const limit = parseInt(req.query.limit) || 100;
    res.json({ success: true, history: actionHistory.slice(-limit), count: actionHistory.length, requestId: req.requestId });
  } catch (error) {
    logger.error('Get action history failed', { error: error.message });
    res.status(500).json({ success: false, error: 'action_history_error', requestId: req.requestId });
  }
});

/** Get action statistics (admin only). */
router.get('/stats', async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.playerId !== 'admin') {
      return res.status(403).json({ success: false, error: 'admin_required', requestId: req.requestId });
    }
    const byType = {};
    for (const action of actionHistory) {
      byType[action.type] = (byType[action.type] || 0) + 1;
    }
    res.json({ success: true, totalActions: actionHistory.length, byType, autoActionsEnabled, requestId: req.requestId });
  } catch (error) {
    logger.error('Get action stats failed', { error: error.message });
    res.status(500).json({ success: false, error: 'action_stats_error', requestId: req.requestId });
  }
});

/** Enable/disable auto-actions (admin only). */
router.post('/auto-actions', async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.playerId !== 'admin') {
      return res.status(403).json({ success: false, error: 'admin_required', requestId: req.requestId });
    }
    const { enabled } = req.body || {};
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ success: false, error: 'enabled must be a boolean', requestId: req.requestId });
    }
    autoActionsEnabled = enabled;
    res.json({ success: true, autoActionsEnabled, requestId: req.requestId });
  } catch (error) {
    logger.error('Set auto-actions failed', { error: error.message });
    res.status(500).json({ success: false, error: 'set_auto_actions_error', requestId: req.requestId });
  }
});

export default router;
