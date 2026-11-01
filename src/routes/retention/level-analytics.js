/**
 * Level Analytics Routes
 *
 * POST /api/retention/level-analytics/start - Record level start
 * POST /api/retention/level-analytics/complete - Record level completion
 * POST /api/retention/level-analytics/fail - Record level failure
 * POST /api/retention/level-analytics/continue - Record continue used
 * POST /api/retention/level-analytics/skip - Record skip used
 * GET /api/retention/level-analytics/stats/:level - Get stats for a level
 * GET /api/retention/level-analytics/choke-points - Get choke points (admin)
 * GET /api/retention/level-analytics/difficulty-curve - Get difficulty curve (admin)
 * GET /api/retention/level-analytics/summary - Get overall summary (admin)
 */

import express from 'express';
import security from '../../core/security/index.js';
import { Logger } from '../../core/logger/index.js';
import LevelAnalyticsService from '../../services/retention/level-analytics-service.js';

const router = express.Router();
const logger = new Logger('LevelAnalyticsRoutes');

const levelAnalytics = new LevelAnalyticsService();

router.use(security.sessionValidation);

/** Record level start attempt. */
router.post('/start', async (req, res) => {
  try {
    const { playerId } = req.user;
    const { level, mode = 'classic' } = req.body || {};
    if (!level) {
      return res.status(400).json({ success: false, error: 'level required', requestId: req.requestId });
    }
    levelAnalytics.recordLevelStart(playerId, level, { mode });
    res.json({ success: true, requestId: req.requestId });
  } catch (error) {
    logger.error('Record level start failed', { error: error.message });
    res.status(500).json({ success: false, error: 'record_start_error', requestId: req.requestId });
  }
});

/** Record level completion. */
router.post('/complete', async (req, res) => {
  try {
    const { playerId } = req.user;
    const { level, movesUsed, timeMs, starsEarned } = req.body || {};
    if (!level) {
      return res.status(400).json({ success: false, error: 'level required', requestId: req.requestId });
    }
    levelAnalytics.recordLevelComplete(playerId, level, { movesUsed, timeMs, starsEarned });
    res.json({ success: true, requestId: req.requestId });
  } catch (error) {
    logger.error('Record level complete failed', { error: error.message });
    res.status(500).json({ success: false, error: 'record_complete_error', requestId: req.requestId });
  }
});

/** Record level failure. */
router.post('/fail', async (req, res) => {
  try {
    const { playerId } = req.user;
    const { level, movesUsed, timeMs, reason = 'out_of_moves' } = req.body || {};
    if (!level) {
      return res.status(400).json({ success: false, error: 'level required', requestId: req.requestId });
    }
    levelAnalytics.recordLevelFail(playerId, level, { movesUsed, timeMs, reason });
    res.json({ success: true, requestId: req.requestId });
  } catch (error) {
    logger.error('Record level fail failed', { error: error.message });
    res.status(500).json({ success: false, error: 'record_fail_error', requestId: req.requestId });
  }
});

/** Record continue used. */
router.post('/continue', async (req, res) => {
  try {
    const { playerId } = req.user;
    const { level } = req.body || {};
    if (!level) {
      return res.status(400).json({ success: false, error: 'level required', requestId: req.requestId });
    }
    levelAnalytics.recordContinue(playerId, level);
    res.json({ success: true, requestId: req.requestId });
  } catch (error) {
    logger.error('Record continue failed', { error: error.message });
    res.status(500).json({ success: false, error: 'record_continue_error', requestId: req.requestId });
  }
});

/** Record skip used. */
router.post('/skip', async (req, res) => {
  try {
    const { playerId } = req.user;
    const { level } = req.body || {};
    if (!level) {
      return res.status(400).json({ success: false, error: 'level required', requestId: req.requestId });
    }
    levelAnalytics.recordSkip(playerId, level);
    res.json({ success: true, requestId: req.requestId });
  } catch (error) {
    logger.error('Record skip failed', { error: error.message });
    res.status(500).json({ success: false, error: 'record_skip_error', requestId: req.requestId });
  }
});

/** Get stats for a specific level. */
router.get('/stats/:level', async (req, res) => {
  try {
    const level = parseInt(req.params.level);
    const stats = levelAnalytics.getLevelStats(level);
    if (!stats) {
      return res.status(404).json({ success: false, error: 'no_data_for_level', requestId: req.requestId });
    }
    res.json({ success: true, ...stats, requestId: req.requestId });
  } catch (error) {
    logger.error('Get level stats failed', { error: error.message });
    res.status(500).json({ success: false, error: 'level_stats_error', requestId: req.requestId });
  }
});

/** Get choke points (admin only). */
router.get('/choke-points', async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.playerId !== 'admin') {
      return res.status(403).json({ success: false, error: 'admin_required', requestId: req.requestId });
    }
    const failRateThreshold = parseFloat(req.query.threshold) || 30;
    const minAttempts = parseInt(req.query.minAttempts) || 10;
    const chokePoints = levelAnalytics.getChokePoints({ failRateThreshold, minAttempts });
    res.json({ success: true, chokePoints, count: chokePoints.length, requestId: req.requestId });
  } catch (error) {
    logger.error('Get choke points failed', { error: error.message });
    res.status(500).json({ success: false, error: 'choke_points_error', requestId: req.requestId });
  }
});

/** Get difficulty curve (admin only). */
router.get('/difficulty-curve', async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.playerId !== 'admin') {
      return res.status(403).json({ success: false, error: 'admin_required', requestId: req.requestId });
    }
    const fromLevel = parseInt(req.query.from) || 1;
    const toLevel = parseInt(req.query.to) || 100;
    const curve = levelAnalytics.getDifficultyCurve(fromLevel, toLevel);
    res.json({ success: true, curve, requestId: req.requestId });
  } catch (error) {
    logger.error('Get difficulty curve failed', { error: error.message });
    res.status(500).json({ success: false, error: 'difficulty_curve_error', requestId: req.requestId });
  }
});

/** Get overall analytics summary (admin only). */
router.get('/summary', async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.playerId !== 'admin') {
      return res.status(403).json({ success: false, error: 'admin_required', requestId: req.requestId });
    }
    const summary = levelAnalytics.getSummary();
    res.json({ success: true, ...summary, requestId: req.requestId });
  } catch (error) {
    logger.error('Get analytics summary failed', { error: error.message });
    res.status(500).json({ success: false, error: 'analytics_summary_error', requestId: req.requestId });
  }
});

export default router;
