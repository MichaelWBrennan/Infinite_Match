/**
 * Onboarding Routes - FTUE tutorial system
 *
 * GET /api/retention/onboarding/state - Get player's onboarding state
 * GET /api/retention/onboarding/hint - Get current tutorial hint
 * POST /api/retention/onboarding/hint/seen - Mark a hint as seen
 * POST /api/retention/onboarding/stage/complete - Complete a tutorial stage
 * GET /api/retention/onboarding/quests - Get onboarding quests
 */

import express from 'express';
import security from '../../core/security/index.js';
import { Logger } from '../../core/logger/index.js';
import { accountEconomy } from '../../services/economy/AccountEconomyService.js';
import {
  getOnboardingState,
  isOnboardingComplete,
  getCurrentStage,
  getTutorialHint,
  markHintSeen,
  completeStage,
  getOnboardingQuests,
} from '../../services/retention/onboarding-service.js';

const router = express.Router();
const logger = new Logger('OnboardingRoutes');

router.use(security.sessionValidation);

/** Get onboarding state for the current player. */
router.get('/state', async (req, res) => {
  try {
    const { playerId } = req.user;
    const economy = await accountEconomy.getPlayerEconomy(playerId);
    const onboarding = getOnboardingState(economy);
    res.json({
      success: true,
      onboarding,
      isComplete: isOnboardingComplete(onboarding),
      currentStage: getCurrentStage(onboarding),
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Get onboarding state failed', { error: error.message });
    res.status(500).json({ success: false, error: 'onboarding_state_error', requestId: req.requestId });
  }
});

/** Get the current tutorial hint for the player. */
router.get('/hint', async (req, res) => {
  try {
    const { playerId } = req.user;
    const economy = await accountEconomy.getPlayerEconomy(playerId);
    const onboarding = getOnboardingState(economy);
    const hint = getTutorialHint(onboarding);
    res.json({ success: true, hint, requestId: req.requestId });
  } catch (error) {
    logger.error('Get tutorial hint failed', { error: error.message });
    res.status(500).json({ success: false, error: 'tutorial_hint_error', requestId: req.requestId });
  }
});

/** Mark a tutorial hint as seen. */
router.post('/hint/seen', async (req, res) => {
  try {
    const { playerId } = req.user;
    const { stageId } = req.body || {};
    if (!stageId) {
      return res.status(400).json({ success: false, error: 'stageId required', requestId: req.requestId });
    }
    const economy = await accountEconomy.getPlayerEconomy(playerId);
    const onboarding = getOnboardingState(economy);
    markHintSeen(onboarding, stageId);
    await accountEconomy.updatePlayerEconomyCache(playerId, economy);
    res.json({ success: true, stageId, requestId: req.requestId });
  } catch (error) {
    logger.error('Mark hint seen failed', { error: error.message });
    res.status(500).json({ success: false, error: 'mark_hint_seen_error', requestId: req.requestId });
  }
});

/** Complete a tutorial stage and claim its reward. */
router.post('/stage/complete', async (req, res) => {
  try {
    const { playerId } = req.user;
    const { stageId } = req.body || {};
    if (!stageId) {
      return res.status(400).json({ success: false, error: 'stageId required', requestId: req.requestId });
    }
    const economy = await accountEconomy.getPlayerEconomy(playerId);
    const onboarding = getOnboardingState(economy);
    const result = await completeStage(onboarding, stageId, economy, accountEconomy);
    await accountEconomy.updatePlayerEconomyCache(playerId, economy);
    res.json({ success: true, ...result, requestId: req.requestId });
  } catch (error) {
    logger.error('Complete onboarding stage failed', { error: error.message });
    res.status(500).json({ success: false, error: 'complete_stage_error', requestId: req.requestId });
  }
});

/** Get onboarding quests for the player. */
router.get('/quests', async (req, res) => {
  try {
    const { playerId } = req.user;
    const economy = await accountEconomy.getPlayerEconomy(playerId);
    const onboarding = getOnboardingState(economy);
    const quests = getOnboardingQuests(onboarding);
    res.json({ success: true, quests, requestId: req.requestId });
  } catch (error) {
    logger.error('Get onboarding quests failed', { error: error.message });
    res.status(500).json({ success: false, error: 'onboarding_quests_error', requestId: req.requestId });
  }
});

export default router;
