/**
 * Account Economy Routes
 * Handles account-linked economy operations and Unity synchronization
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import security, { requireMinRole } from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';
import AccountEconomyService from '../services/economy/AccountEconomyService.js';
import { ITEM_CATALOG, LEVEL_LIMITS } from '../services/economy/item-catalog.js';

const router = express.Router();
const logger = new Logger('AccountEconomyRoutes');

// Initialize service
const accountEconomyService = new AccountEconomyService();

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

    const playerEconomy = await accountEconomyService.initializePlayerEconomy(playerId, platform);

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

    const playerEconomy = await accountEconomyService.getPlayerEconomy(playerId);

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

    const result = await accountEconomyService.claimDailyReward(playerId);

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

    // The price comes from the server catalog. A client-supplied amount is ignored.
    const item = Object.prototype.hasOwnProperty.call(ITEM_CATALOG, itemId) ? ITEM_CATALOG[itemId] : null;
    if (!item) {
      return res.status(400).json({
        success: false,
        error: 'Unknown item',
        requestId: req.requestId,
      });
    }

    const { currencyId, price, category } = item;

    const currencyResult = await accountEconomyService.updateCurrency(
      playerId,
      currencyId,
      price,
      'spend',
      'purchase'
    );

    const inventoryResult = await accountEconomyService.updateInventory(
      playerId,
      category,
      itemId,
      1,
      'add'
    );

    security.logSecurityEvent('item_purchased', {
      playerId,
      itemId,
      currencyId,
      price,
      ip: req.ip,
    });

    res.json({
      success: true,
      result: {
        currency: currencyResult,
        inventory: inventoryResult,
      },
      requestId: req.requestId,
    });
  } catch (error) {
    if (error.message.includes('Insufficient')) {
      return res.status(400).json({ success: false, error: error.message, requestId: req.requestId });
    }
    handleRouteError(res, error, 'purchase item', req.requestId);
  }
});

// Use powerup
router.post('/powerup/use', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;
    const { powerupId, quantity = 1 } = req.body;

    if (!powerupId) {
      return res.status(400).json({
        success: false,
        error: 'Powerup ID is required',
        requestId: req.requestId,
      });
    }

    // Remove powerup from inventory
    const result = await accountEconomyService.updateInventory(
      playerId,
      'powerups',
      powerupId,
      quantity,
      'remove'
    );

    security.logSecurityEvent('powerup_used', {
      playerId,
      powerupId,
      quantity,
      ip: req.ip,
    });

    res.json({
      success: true,
      result,
      requestId: req.requestId,
    });
  } catch (error) {
    if (error.message.includes('Insufficient')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        requestId: req.requestId,
      });
    }
    handleRouteError(res, error, 'use powerup', req.requestId);
  }
});

// Complete level
router.post('/level/complete', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;
    const { level, score, stars = 0 } = req.body;

    // Validate ranges. The client reports the result, so the server bounds it.
    const validLevel = Number.isInteger(level) && level >= 1 && level <= LEVEL_LIMITS.maxLevel;
    const validScore = Number.isInteger(score) && score >= 0 && score <= LEVEL_LIMITS.maxScore;
    const validStars = Number.isInteger(stars) && stars >= 0 && stars <= LEVEL_LIMITS.maxStars;
    if (!validLevel || !validScore || !validStars) {
      return res.status(400).json({
        success: false,
        error: 'Invalid level, score, or stars',
        requestId: req.requestId,
      });
    }

    // XP and coins are computed here. The client never sets them.
    const xpGained = Math.floor(score / 100) + stars * 50;
    const progressionResult = await accountEconomyService.updateProgression(
      playerId,
      xpGained,
      true
    );

    const rewards = [];

    const coinsReward = Math.min(Math.floor(score / 100), LEVEL_LIMITS.maxCoinsPerLevel);
    if (coinsReward > 0) {
      await accountEconomyService.updateCurrency(playerId, 'coins', coinsReward, 'add', 'level_complete');
      rewards.push({ type: 'currency', currencyId: 'coins', amount: coinsReward });
    }

    if (stars > 0) {
      await accountEconomyService.updateCurrency(playerId, 'stars', stars, 'add', 'level_complete');
      rewards.push({ type: 'currency', currencyId: 'stars', amount: stars });
    }

    // Update statistics
    const playerEconomy = await accountEconomyService.getPlayerEconomy(playerId);
    playerEconomy.statistics.gamesPlayed++;
    playerEconomy.statistics.levelsCompleted++;
    playerEconomy.statistics.totalScore += score;
    playerEconomy.statistics.averageScore = Math.floor(playerEconomy.statistics.totalScore / playerEconomy.statistics.gamesPlayed);
    playerEconomy.statistics.bestScore = Math.max(playerEconomy.statistics.bestScore, score);
    playerEconomy.statistics.lastPlayed = new Date().toISOString();

    await accountEconomyService.updatePlayerEconomyCache(playerId, playerEconomy);

    security.logSecurityEvent('level_completed', {
      playerId,
      level,
      score,
      stars,
      xpGained,
      ip: req.ip,
    });

    res.json({
      success: true,
      result: {
        progression: progressionResult,
        rewards,
        statistics: {
          gamesPlayed: playerEconomy.statistics.gamesPlayed,
          levelsCompleted: playerEconomy.statistics.levelsCompleted,
          totalScore: playerEconomy.statistics.totalScore,
          averageScore: playerEconomy.statistics.averageScore,
          bestScore: playerEconomy.statistics.bestScore,
        },
      },
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'complete level', req.requestId);
  }
});

export default router;