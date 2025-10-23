/**
 * Account Economy Routes
 * Handles account-linked economy operations and Unity synchronization
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import security from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';
import AccountEconomyService from '../services/economy/AccountEconomyService.js';

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
  body('operation').isIn(['add', 'spend', 'set']).withMessage('Operation must be add, spend, or set'),
  body('source').optional().isString().withMessage('Source must be a string'),
];

const validateInventoryUpdate = [
  body('category').isString().notEmpty().withMessage('Category is required'),
  body('itemId').isString().notEmpty().withMessage('Item ID is required'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a positive integer'),
  body('operation').isIn(['add', 'remove', 'set']).withMessage('Operation must be add, remove, or set'),
];

const validateProgressionUpdate = [
  body('xpGained').isInt({ min: 0 }).withMessage('XP gained must be a positive integer'),
  body('levelCompleted').optional().isBoolean().withMessage('Level completed must be a boolean'),
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
router.post('/progression/update', security.sessionValidation, validateProgressionUpdate, async (req, res) => {
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
    const { xpGained, levelCompleted } = req.body;

    const result = await accountEconomyService.updateProgression(
      playerId,
      xpGained,
      levelCompleted
    );

    security.logSecurityEvent('progression_updated', {
      playerId,
      xpGained,
      levelCompleted,
      ip: req.ip,
    });

    res.json({
      success: true,
      result,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'update progression', req.requestId);
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
router.get('/service/stats', security.sessionValidation, security.requireRole('admin'), async (req, res) => {
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
    const { itemId, currencyId, amount } = req.body;

    // Validate purchase
    if (!itemId || !currencyId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: itemId, currencyId, amount',
        requestId: req.requestId,
      });
    }

    // Check if player can afford the purchase
    const playerEconomy = await accountEconomyService.getPlayerEconomy(playerId);
    const currency = playerEconomy.currencies[currencyId];
    
    if (!currency || currency.amount < amount) {
      return res.status(400).json({
        success: false,
        error: `Insufficient ${currencyId}`,
        requestId: req.requestId,
      });
    }

    // Process purchase
    const currencyResult = await accountEconomyService.updateCurrency(
      playerId,
      currencyId,
      amount,
      'spend',
      'purchase'
    );

    // Add item to inventory (this would be based on the item being purchased)
    const inventoryResult = await accountEconomyService.updateInventory(
      playerId,
      'powerups',
      itemId,
      1,
      'add'
    );

    security.logSecurityEvent('item_purchased', {
      playerId,
      itemId,
      currencyId,
      amount,
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
    const { level, score, stars, xpGained = 0 } = req.body;

    if (!level || !score) {
      return res.status(400).json({
        success: false,
        error: 'Level and score are required',
        requestId: req.requestId,
      });
    }

    // Update progression
    const progressionResult = await accountEconomyService.updateProgression(
      playerId,
      xpGained,
      true
    );

    // Give level completion rewards
    const rewards = [];
    
    // Base coins reward
    const coinsReward = Math.floor(score / 100);
    if (coinsReward > 0) {
      await accountEconomyService.updateCurrency(playerId, 'coins', coinsReward, 'add', 'level_complete');
      rewards.push({ type: 'currency', currencyId: 'coins', amount: coinsReward });
    }

    // Stars reward
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