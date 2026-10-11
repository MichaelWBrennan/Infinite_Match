/**
 * Account Economy Routes
 * Handles account-linked economy operations and Unity synchronization
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import security, { requireMinRole } from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';
import { accountEconomy as accountEconomyService, EconomyRuleError } from '../services/economy/AccountEconomyService.js';
import { LEVEL_LIMITS } from '../services/economy/item-catalog.js';
import { levelTarget, winRewards } from '../services/meta/rewards.js';
import { levelMultiplier, readLevelOverrides } from '../services/meta/level-overrides.js';
import { VIP_ENTITLEMENT } from '../services/meta/vip.js';
import { loadSeasonSafely } from '../services/meta/battlepass-season.js';
import PurchaseLedgerDb from '../services/payments/PurchaseLedgerDb.js';
import { socialStore } from '../services/social/social-store.js';
import { activeCompetitions, loadCompetitions } from '../services/live-ops/competitions.js';

import { liveGeneratedLevel, clientRulesVersion } from '../services/levels/level-service.js';
import { LevelInputError } from '../services/levels/location-context.js';

const router = express.Router();
const logger = new Logger('AccountEconomyRoutes');

// The shared instance: balances live in it, so every route must use the same one.

// Helper function for consistent error handling
const handleRouteError = (res, error, operation, requestId) => {
  logger.error(`Failed to ${operation}`, { error: error.message });
  res.status(500).json({
    success: false,
    error: `Failed to ${operation}`,
    requestId,
  });
};

// Validation middleware
// Records a won level for the social boards: the player's best score, and their score and progress
// in any running tournament or challenge. A failure is logged and does not undo the reward.
async function recordCompetitionWin(playerId, attemptId, level, score, competitionIds) {
  try {
    await socialStore.recordWin(playerId, { level, score, attemptId,
      tournamentIds: competitionIds.tournamentIds, challengeIds: competitionIds.challengeIds });
  } catch (error) {
    logger.error('Could not record the win for boards', { error: error.message, playerId });
  }
}

// Pin competition membership when the economy claim is paid. A later receipt retry must
// not count a win in a new event just because the active window changed.
function competitionIdsAtWin() {
  try {
    const active = activeCompetitions(loadCompetitions(), Date.now());
    return { tournamentIds: active.tournaments.map((t) => t.id),
      challengeIds: active.challenges.map((c) => c.id) };
  } catch (error) {
    logger.error('Could not load active competition for win', { error: error.message });
    return { tournamentIds: [], challengeIds: [] };
  }
}

const validateCurrencyUpdate = [
  body('currencyId').isString().notEmpty().withMessage('Currency ID is required'),
  body('amount').isInt({ min: 0 }).withMessage('Amount must be a positive integer'),
  // Players may only spend. Grants come from server flows.
  body('operation').isIn(['spend']).withMessage('Operation must be spend'),
  body('source').optional().isString().withMessage('Source must be a string'),
];

const validateInventoryUpdate = [
  body('category').isString().notEmpty().withMessage('Category is required'),
  body('itemId').isString().notEmpty().withMessage('Item ID is required'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a positive integer'),
  // Players may only consume items. Grants come from server flows.
  body('operation').isIn(['remove']).withMessage('Operation must be remove'),
];

// Initialize player economy
router.post('/initialize', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;
    const { platform = 'local' } = req.body;

    await accountEconomyService.initializePlayerEconomy(playerId, platform);
    const playerEconomy = await accountEconomyService.getPlayerEconomyView(playerId);

    security.logSecurityEvent('economy_initialized', {
      playerId,
      platform,
      ip: req.ip,
    });

    res.json({
      success: true,
      data: playerEconomy,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'initialize player economy', req.requestId);
  }
});

// Get player economy data
router.get('/data', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;

    // Energy is shown as it is now, not as it was at the last save. Nothing is written here.
    const playerEconomy = await accountEconomyService.getPlayerEconomyView(playerId);

    res.json({
      success: true,
      data: playerEconomy,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'get player economy data', req.requestId);
  }
});

// Update currency
router.post('/currency/update', security.sessionValidation, validateCurrencyUpdate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
        requestId: req.requestId,
      });
    }

    const { playerId } = req.user;
    const { currencyId, amount, operation, source } = req.body;

    const result = await accountEconomyService.updateCurrency(
      playerId,
      currencyId,
      amount,
      operation,
      source
    );

    security.logSecurityEvent('currency_updated', {
      playerId,
      currencyId,
      amount,
      operation,
      source,
      ip: req.ip,
    });

    res.json({
      success: true,
      result,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'update currency', req.requestId);
  }
});

// Update inventory
router.post('/inventory/update', security.sessionValidation, validateInventoryUpdate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
        requestId: req.requestId,
      });
    }

    const { playerId } = req.user;
    const { category, itemId, quantity, operation } = req.body;

    const result = await accountEconomyService.updateInventory(
      playerId,
      category,
      itemId,
      quantity,
      operation
    );

    security.logSecurityEvent('inventory_updated', {
      playerId,
      category,
      itemId,
      quantity,
      operation,
      ip: req.ip,
    });

    res.json({
      success: true,
      result,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'update inventory', req.requestId);
  }
});

// Update progression
// XP is granted only by /level/complete, which computes it on the server.
// Accepting client XP let a player level up without limit and collect the rewards.
router.post('/progression/update', security.sessionValidation, (req, res) => {
  res.status(403).json({
    success: false,
    error: 'XP is granted by level completion',
    requestId: req.requestId,
  });
});

// Lucky wheel: one spin per day, reward chosen and granted on the server.
router.post('/wheel/spin', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;
    const { reward, spunAt } = await accountEconomyService.spinLuckyWheel(playerId);
    security.logSecurityEvent('lucky_wheel_spun', { playerId, reward: reward.id, ip: req.ip });
    res.json({ success: true, result: { reward, spunAt }, requestId: req.requestId });
  } catch (error) {
    if (error.message.includes('already spun')) {
      return res.status(400).json({ success: false, error: error.message, requestId: req.requestId });
    }
    handleRouteError(res, error, 'spin lucky wheel', req.requestId);
  }
});

// Claim daily reward
router.post('/daily-reward/claim', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;

    const result = await accountEconomyService.claimDailyReward(playerId, await loadSeasonSafely());

    security.logSecurityEvent('daily_reward_claimed', {
      playerId,
      streak: result.streak,
      ip: req.ip,
    });

    res.json({
      success: true,
      result,
      requestId: req.requestId,
    });
  } catch (error) {
    if (error.message.includes('already claimed')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        requestId: req.requestId,
      });
    }
    handleRouteError(res, error, 'claim daily reward', req.requestId);
  }
});

// Sync with Unity
router.post('/sync/unity', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;
    const { unityData } = req.body;

    const result = await accountEconomyService.syncWithUnity(playerId, unityData);

    security.logSecurityEvent('economy_synced_unity', {
      playerId,
      ip: req.ip,
    });

    res.json({
      success: true,
      result,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'sync with Unity', req.requestId);
  }
});

// Get economy statistics
router.get('/stats', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;

    const stats = await accountEconomyService.getEconomyStats(playerId);

    res.json({
      success: true,
      stats,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'get economy statistics', req.requestId);
  }
});

// Get service statistics (admin only)
router.get('/service/stats', security.sessionValidation, requireMinRole('admin'), async (req, res) => {
  try {
    const stats = accountEconomyService.getStats();

    res.json({
      success: true,
      stats,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'get service statistics', req.requestId);
  }
});

// Purchase item (integrates with Unity Economy)
router.post('/purchase', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;
    const { itemId } = req.body;

    // The price and item limits come from the server catalog, committed together.
    const result = await accountEconomyService.purchaseCatalogItem(playerId, itemId);
    const currencyId = result.currency.currencyId;
    const price = result.currency.oldAmount - result.currency.newAmount;

    security.logSecurityEvent('item_purchased', {
      playerId,
      itemId,
      currencyId,
      price,
      ip: req.ip,
    });

    res.json({
      success: true,
      result,
      requestId: req.requestId,
    });
  } catch (error) {
    if (error instanceof EconomyRuleError) {
      return res.status(400).json({ success: false, error: error.code, requestId: req.requestId });
    }
    handleRouteError(res, error, 'purchase item', req.requestId);
  }
});

// Use powerup
router.post('/powerup/use', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;
    const { powerupId, quantity = 1, attemptId, useId } = req.body || {};

    if (!powerupId) {
      return res.status(400).json({
        success: false,
        error: 'Powerup ID is required',
        requestId: req.requestId,
      });
    }

    // Receipt issuance and inventory removal must commit together with the paid attempt.
    const result = await accountEconomyService.spendPowerUp(playerId, powerupId, quantity, attemptId, undefined, useId);

    security.logSecurityEvent(result.reused ? 'powerup_use_retried' : 'powerup_used', {
      playerId,
      powerupId,
      quantity,
      attemptId: attemptId || null,
      useId: useId || null,
      receiptId: result.receiptId || null,
      ip: req.ip,
    });

    res.json({
      success: true,
      result,
      requestId: req.requestId,
    });
  } catch (error) {
    if (error instanceof EconomyRuleError) {
      return res.status(400).json({ success: false, error: error.code, requestId: req.requestId });
    }
    handleRouteError(res, error, 'use powerup', req.requestId);
  }
});

// A client-reported loss or explicit quit ends the matching paid attempt without any payout.
// Moves/hints are bounded diagnostics only, never proof or tuning authority.
router.post('/attempt/close', security.sessionValidation, async (req, res) => {
  try {
    const { attemptId, outcome, movesUsed, hintsUsed } = req.body || {};
    if (typeof attemptId !== 'string' || attemptId.length < 1 || attemptId.length > 64) {
      return res.status(400).json({ success: false, error: 'attempt_required', requestId: req.requestId });
    }
    const result = await accountEconomyService.closeAttempt(req.user.playerId, attemptId, outcome,
      { movesUsed, hintsUsed });
    res.json({ success: true, result, requestId: req.requestId });
  } catch (error) {
    if (error instanceof EconomyRuleError) {
      return res.status(400).json({ success: false, error: error.code, requestId: req.requestId });
    }
    handleRouteError(res, error, 'close attempt', req.requestId);
  }
});

// Complete a level the player won. Needs the attempt id from energy/spend. The server works out
// the stars from the score and the level target, and pays the server's reward for them. A reported
// star count is ignored.
router.post('/level/complete', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;
    const { level, score, attemptId } = req.body || {};

    const validLevel = Number.isInteger(level) && level >= 1 && level <= LEVEL_LIMITS.maxLevel;
    const validScore = Number.isInteger(score) && score >= 0 && score <= LEVEL_LIMITS.maxScore;
    if (!validLevel || !validScore) {
      return res.status(400).json({
        success: false,
        error: 'Invalid level or score',
        requestId: req.requestId,
      });
    }

    if (typeof attemptId !== 'string' || attemptId.length === 0 || attemptId.length > 64) {
      return res.status(400).json({ success: false, error: 'attempt_required', requestId: req.requestId });
    }
    // External policy reads run only for a fresh claim. Receipt-only retries can recover
    // even if the entitlement store is temporarily unavailable.
    const { result, rankedScore, competitionIds } = await accountEconomyService.settleLevelAttempt(
      playerId, attemptId, level, {
        mode: 'level', score, objectiveProgress: req.body.objectiveProgress, moves: req.body.moves,
        hintsUsed: req.body.hintsUsed,
        legacyTarget: levelTarget(level, levelMultiplier(level, readLevelOverrides())), // old in-flight attempts only
      }, async () => ({
        isVip: await PurchaseLedgerDb.hasPurchase(playerId, VIP_ENTITLEMENT),
        season: await loadSeasonSafely(),
        competitionIds: competitionIdsAtWin(),
      }));

    if (rankedScore !== null) await recordCompetitionWin(playerId, attemptId, level, rankedScore, competitionIds);
    if (!result.duplicate) security.logSecurityEvent('level_completed', {
      playerId, level, score, stars: result.stars, xpGained: winRewards(result.stars).xp,
      ip: req.ip,
    });
    res.json({ success: true, result, requestId: req.requestId });
  } catch (error) {
    if (error instanceof EconomyRuleError) {
      return res.status(error.code === 'economy_conflict' ? 503 : 400).json({
        success: false, error: error.code, requestId: req.requestId,
      });
    }
    handleRouteError(res, error, 'complete level', req.requestId);
  }
});

// Buy a loot box with coins. The reward is rolled and granted on the server.
// Endless mode: no target and no clock. A run ends when the board has no move left. The score
// is paid as coins and XP. An endless run uses one energy point, spent as attempt level 1.
router.post('/endless/complete', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;
    const { score, attemptId } = req.body || {};
    if (!Number.isInteger(score) || score < 0 || score > LEVEL_LIMITS.maxScore) {
      return res.status(400).json({ success: false, error: 'Invalid score', requestId: req.requestId });
    }
    if (typeof attemptId !== 'string' || attemptId.length === 0 || attemptId.length > 64) {
      return res.status(400).json({ success: false, error: 'attempt_required', requestId: req.requestId });
    }
    const result = await accountEconomyService.settleEndlessAttempt(playerId, attemptId, score);
    res.json({ success: true, result, requestId: req.requestId });
  } catch (error) {
    if (error instanceof EconomyRuleError) {
      return res.status(error.code === 'economy_conflict' ? 503 : 400).json({
        success: false, error: error.code, requestId: req.requestId,
      });
    }
    handleRouteError(res, error, 'complete endless run', req.requestId);
  }
});

router.post('/lootbox/open', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;
    const { type } = req.body || {};
    const result = await accountEconomyService.openLootbox(playerId, type);
    security.logSecurityEvent('lootbox_opened', { playerId, type, reward: result.reward.id, ip: req.ip });
    res.json({ success: true, result, requestId: req.requestId });
  } catch (error) {
    if (error instanceof EconomyRuleError) {
      return res.status(400).json({ success: false, error: error.code, requestId: req.requestId });
    }
    handleRouteError(res, error, 'open loot box', req.requestId);
  }
});

// Spends the energy for one attempt at a level and returns the attempt id. Completing the level
// needs that id, so a reward cannot be claimed without an attempt.
router.post('/energy/spend', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;
    // Legacy clients may omit mode. New clients receive and pin the generated
    // definition in the SAME request that spends energy, not from client-supplied goals.
    if (req.body?.mode === 'endless' && req.body?.level !== undefined && req.body.level !== 1) {
      throw new LevelInputError('invalid_endless_start_level');
    }
    const definition = req.body?.mode === undefined ? null : await liveGeneratedLevel({
      level: req.body?.level, mode: req.body.mode, location: req.body.location ?? {},
      rulesVersion: clientRulesVersion(req.body.rulesVersion),
    });
    const legacyTarget = definition ? null : levelTarget(req.body?.level,
      levelMultiplier(req.body?.level, readLevelOverrides()));
    const result = await accountEconomyService.spendAttemptEnergy(
      playerId, definition?.level ?? req.body?.level, Date.now(), definition, legacyTarget,
    );
    res.json({ success: true, result, serverTime: new Date().toISOString(), requestId: req.requestId });
  } catch (error) {
    if (error instanceof EconomyRuleError || error instanceof LevelInputError) {
      return res.status(400).json({ success: false, error: error.code, requestId: req.requestId });
    }
    handleRouteError(res, error, 'spend attempt energy', req.requestId);
  }
});

// Refill energy to full with coins. Charges only for the energy that is missing.
router.post('/energy/refill', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;
    const result = await accountEconomyService.refillEnergy(playerId);
    security.logSecurityEvent('energy_refilled', { playerId, costCoins: result.costCoins, ip: req.ip });
    res.json({ success: true, result, requestId: req.requestId });
  } catch (error) {
    if (error instanceof EconomyRuleError) {
      return res.status(400).json({ success: false, error: error.code, requestId: req.requestId });
    }
    handleRouteError(res, error, 'refill energy', req.requestId);
  }
});

export default router;