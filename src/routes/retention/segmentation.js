/**
 * Player Segmentation Routes
 *
 * GET /api/retention/segmentation/player - Get segments for current player
 * GET /api/retention/segmentation/churn-risk - Get at-risk players (admin)
 * GET /api/retention/segmentation/churned - Get churned players (admin)
 * GET /api/retention/segmentation/high-value-at-risk - Get high-value at-risk players (admin)
 */

import express from 'express';
import security from '../../core/security/index.js';
import { Logger } from '../../core/logger/index.js';
import { accountEconomy } from '../../services/economy/AccountEconomyService.js';
import { segmentPlayer, getChurnRiskPlayers, getChurnedPlayers, getHighValueAtRiskPlayers } from '../../services/retention/player-segmentation-service.js';

const router = express.Router();
const logger = new Logger('SegmentationRoutes');

router.use(security.sessionValidation);

/** Get segments for the current player. */
router.get('/player', async (req, res) => {
  try {
    const { playerId } = req.user;
    const economy = await accountEconomy.getPlayerEconomy(playerId);
    const segments = segmentPlayer(playerId, economy);
    res.json({ success: true, segments, requestId: req.requestId });
  } catch (error) {
    logger.error('Get player segments failed', { error: error.message });
    res.status(500).json({ success: false, error: 'player_segments_error', requestId: req.requestId });
  }
});

/** Get churn risk players (admin only). */
router.get('/churn-risk', async (req, res) => {
  try {
    // Check admin
    if (!req.user.isAdmin && req.user.playerId !== 'admin') {
      return res.status(403).json({ success: false, error: 'admin_required', requestId: req.requestId });
    }
    const allEconomies = await accountEconomy.getAllPlayerEconomies();
    const atRisk = getChurnRiskPlayers(allEconomies);
    res.json({ success: true, atRisk, count: atRisk.length, requestId: req.requestId });
  } catch (error) {
    logger.error('Get churn risk players failed', { error: error.message });
    res.status(500).json({ success: false, error: 'churn_risk_error', requestId: req.requestId });
  }
});

/** Get churned players (admin only). */
router.get('/churned', async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.playerId !== 'admin') {
      return res.status(403).json({ success: false, error: 'admin_required', requestId: req.requestId });
    }
    const allEconomies = await accountEconomy.getAllPlayerEconomies();
    const churned = getChurnedPlayers(allEconomies);
    res.json({ success: true, churned, count: churned.length, requestId: req.requestId });
  } catch (error) {
    logger.error('Get churned players failed', { error: error.message });
    res.status(500).json({ success: false, error: 'churned_error', requestId: req.requestId });
  }
});

/** Get high-value at-risk players (admin only). */
router.get('/high-value-at-risk', async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.playerId !== 'admin') {
      return res.status(403).json({ success: false, error: 'admin_required', requestId: req.requestId });
    }
    const allEconomies = await accountEconomy.getAllPlayerEconomies();
    const highValue = getHighValueAtRiskPlayers(allEconomies);
    res.json({ success: true, highValue, count: highValue.length, requestId: req.requestId });
  } catch (error) {
    logger.error('Get high-value at-risk players failed', { error: error.message });
    res.status(500).json({ success: false, error: 'high_value_at_risk_error', requestId: req.requestId });
  }
});

export default router;
