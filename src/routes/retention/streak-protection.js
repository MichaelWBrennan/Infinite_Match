/**
 * Streak Protection Routes
 *
 * GET /api/retention/streak-protection/status - Get streak protection status
 * POST /api/retention/streak-protection/freeze/purchase - Purchase streak freeze
 * POST /api/retention/streak-protection/repair/offer - Get streak repair offer
 * POST /api/retention/streak-protection/repair/accept - Accept streak repair offer
 */

import express from 'express';
import security from '../../core/security/index.js';
import { Logger } from '../../core/logger/index.js';
import { accountEconomy } from '../../services/economy/AccountEconomyService.js';
import { monetizationService } from '../../services/monetization/monetization-service.js';
import StreakProtectionService from '../../services/retention/streak-protection-service.js';

const router = express.Router();
const logger = new Logger('StreakProtectionRoutes');

const streakProtection = new StreakProtectionService(accountEconomy, monetizationService);

router.use(security.sessionValidation);

/** Get streak protection status for the current player. */
router.get('/status', async (req, res) => {
  try {
    const { playerId } = req.user;
    const status = await streakProtection.getStreakStatus(playerId);
    res.json({ success: true, ...status, requestId: req.requestId });
  } catch (error) {
    logger.error('Get streak status failed', { error: error.message });
    res.status(500).json({ success: false, error: 'streak_status_error', requestId: req.requestId });
  }
});

/** Purchase a streak freeze. */
router.post('/freeze/purchase', async (req, res) => {
  try {
    const { playerId } = req.user;
    const { payWith = 'coins' } = req.body || {};
    const result = await streakProtection.purchaseStreakFreeze(playerId, { payWith });
    res.json({ success: result.success, ...result, requestId: req.requestId });
  } catch (error) {
    logger.error('Purchase streak freeze failed', { error: error.message });
    res.status(500).json({ success: false, error: 'purchase_freeze_error', requestId: req.requestId });
  }
});

/** Get a streak repair offer. */
router.post('/repair/offer', async (req, res) => {
  try {
    const { playerId } = req.user;
    const result = streakProtection.offerStreakRepair(playerId);
    res.json({ success: result.success, ...result, requestId: req.requestId });
  } catch (error) {
    logger.error('Get streak repair offer failed', { error: error.message });
    res.status(500).json({ success: false, error: 'streak_repair_offer_error', requestId: req.requestId });
  }
});

/** Accept a streak repair offer. */
router.post('/repair/accept', async (req, res) => {
  try {
    const { playerId } = req.user;
    const { payWith = 'coins' } = req.body || {};
    const result = await streakProtection.acceptStreakRepair(playerId, { payWith });
    res.json({ success: result.success, ...result, requestId: req.requestId });
  } catch (error) {
    logger.error('Accept streak repair failed', { error: error.message });
    res.status(500).json({ success: false, error: 'accept_streak_repair_error', requestId: req.requestId });
  }
});

export default router;
