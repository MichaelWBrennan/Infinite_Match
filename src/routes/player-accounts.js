import express from 'express';
import { body, validationResult } from 'express-validator';
import { Logger } from '../core/logger/index.js';
import { ServiceError } from '../core/errors/ErrorHandler.js';
import { PlayerAccountManager } from '../services/player-accounts/player-account-manager.js';
import { PurchaseManager } from '../services/player-accounts/purchase-manager.js';

const router = express.Router();
const logger = new Logger('PlayerAccountRoutes');

// Initialize services
const accountManager = new PlayerAccountManager();
const purchaseManager = new PurchaseManager(accountManager);

// Validation middleware
const validateRegistration = [
  body('playerId').notEmpty().withMessage('Player ID is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('displayName').optional().isLength({ min: 2 }).withMessage('Display name must be at least 2 characters')
];

const validateLogin = [
  body('playerId').notEmpty().withMessage('Player ID is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const validatePurchase = [
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required'),
  body('amount').isNumeric().withMessage('Amount must be numeric'),
  body('currency').isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters')
];

/**
 * ACCOUNT MANAGEMENT ROUTES
 */

// Register new account
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { playerId, email, password, displayName, platform, deviceInfo } = req.body;

    const result = await accountManager.createAccount({
      playerId,
      email,
      password,
      displayName,
      platform,
      deviceInfo
    });

    res.status(201).json(result);
  } catch (error) {
    logger.error('Failed to register account:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { playerId, password, deviceInfo } = req.body;

    const result = await accountManager.authenticatePlayer(playerId, password, deviceInfo);

    res.json(result);
  } catch (error) {
    logger.error('Failed to login:', error);
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    const result = await accountManager.logoutPlayer(sessionId);

    res.json(result);
  } catch (error) {
    logger.error('Failed to logout:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get account information
router.get('/account/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;

    const result = await accountManager.getAccount(playerId);

    res.json(result);
  } catch (error) {
    logger.error('Failed to get account:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// Update profile
router.put('/account/:playerId/profile', async (req, res) => {
  try {
    const { playerId } = req.params;
    const profileData = req.body;

    const result = await accountManager.updateProfile(playerId, profileData);

    res.json(result);
  } catch (error) {
    logger.error('Failed to update profile:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update statistics
router.put('/account/:playerId/statistics', async (req, res) => {
  try {
    const { playerId } = req.params;
    const statsData = req.body;

    const result = await accountManager.updateStatistics(playerId, statsData);

    res.json(result);
  } catch (error) {
    logger.error('Failed to update statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Deactivate account
router.delete('/account/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { reason } = req.body;

    const result = await accountManager.deactivateAccount(playerId, reason);

    res.json(result);
  } catch (error) {
    logger.error('Failed to deactivate account:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PURCHASE ROUTES
 */

// Process purchase
router.post('/purchase', validatePurchase, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { playerId, productId, paymentData } = req.body;

    if (!playerId) {
      return res.status(400).json({
        success: false,
        error: 'Player ID is required'
      });
    }

    const result = await purchaseManager.processPurchase(playerId, productId, paymentData);

    res.json(result);
  } catch (error) {
    logger.error('Failed to process purchase:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get player purchases
router.get('/purchases/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { productType, platform, dateFrom, dateTo, limit = 50 } = req.query;

    const filters = {};
    if (productType) filters.productType = productType;
    if (platform) filters.platform = platform;
    if (dateFrom) filters.dateFrom = parseInt(dateFrom);
    if (dateTo) filters.dateTo = parseInt(dateTo);

    const result = await accountManager.getPurchases(playerId, filters);

    // Apply limit
    if (limit) {
      result.purchases = result.purchases.slice(0, parseInt(limit));
    }

    res.json(result);
  } catch (error) {
    logger.error('Failed to get purchases:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get player entitlements
router.get('/entitlements/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;

    const result = await accountManager.getEntitlements(playerId);

    res.json(result);
  } catch (error) {
    logger.error('Failed to get entitlements:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get product catalog
router.get('/catalog', async (req, res) => {
  try {
    const { category } = req.query;

    const catalog = purchaseManager.getProductCatalog(category);

    res.json({
      success: true,
      catalog,
      categories: Object.keys(purchaseManager.productCatalog)
    });
  } catch (error) {
    logger.error('Failed to get catalog:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get specific product
router.get('/catalog/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const product = purchaseManager.getProduct(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    logger.error('Failed to get product:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * SESSION MANAGEMENT ROUTES
 */

// Validate session
router.post('/session/validate', async (req, res) => {
  try {
    const { sessionId, token } = req.body;

    if (!sessionId || !token) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and token are required'
      });
    }

    const result = await accountManager.validateSession(sessionId, token);

    res.json(result);
  } catch (error) {
    logger.error('Failed to validate session:', error);
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// Refresh session
router.post('/session/refresh', async (req, res) => {
  try {
    const { sessionId, token } = req.body;

    if (!sessionId || !token) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and token are required'
      });
    }

    // Validate current session
    const validation = await accountManager.validateSession(sessionId, token);
    if (!validation.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session'
      });
    }

    // Create new session
    const newSession = await accountManager.createSession(validation.playerId, validation.session.deviceInfo);

    res.json({
      success: true,
      session: newSession,
      message: 'Session refreshed successfully'
    });
  } catch (error) {
    logger.error('Failed to refresh session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * STATISTICS ROUTES
 */

// Get account statistics
router.get('/stats/accounts', async (req, res) => {
  try {
    const stats = accountManager.getAccountStatistics();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Failed to get account stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get purchase statistics
router.get('/stats/purchases', async (req, res) => {
  try {
    const stats = purchaseManager.getPurchaseStatistics();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Failed to get purchase stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * UTILITY ROUTES
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      services: {
        accountManager: 'active',
        purchaseManager: 'active'
      },
      timestamp: new Date().toISOString()
    }
  });
});

export default router;