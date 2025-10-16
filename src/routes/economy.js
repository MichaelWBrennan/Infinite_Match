/**
 * Economy Routes
 * Handles game economy data and operations
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import security from 'core/security/index.js';
import { Logger } from 'core/logger/index.js';
import PricingService from 'services/pricing/PricingService.js';
import EconomyService from 'services/economy/index.js';
import UnityService from 'services/unity/index.js';

const router = express.Router();
const logger = new Logger('EconomyRoutes');

// Initialize services
const economyService = new EconomyService();
const unityService = new UnityService();
const pricingService = new PricingService();

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
const validateEconomyData = [
  body('type').isIn(['currency', 'inventory', 'catalog']).withMessage('Invalid economy data type'),
  body('data').isArray().withMessage('Data must be an array'),
];

// Get economy data
router.get('/data', security.sessionValidation, async (req, res) => {
  try {
    const economyData = await economyService.loadEconomyData();

    res.json({
      success: true,
      data: economyData,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'load economy data', req.requestId);
  }
});

// Get economy report
router.get('/report', security.sessionValidation, async (req, res) => {
  try {
    const report = await economyService.generateReport();

    res.json({
      success: true,
      report,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'generate economy report', req.requestId);
  }
});

// Deploy economy data to Unity
router.post('/deploy', security.sessionValidation, validateEconomyData, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
        requestId: req.requestId,
      });
    }

    const { type, data } = req.body;

    // Prepare economy data based on type
    let economyData = {};
    switch (type) {
      case 'currency':
        economyData.currencies = data;
        break;
      case 'inventory':
        economyData.inventory = data;
        break;
      case 'catalog':
        economyData.catalog = data;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid economy data type',
          requestId: req.requestId,
        });
    }

    // Deploy to Unity Services
    const result = await unityService.deployEconomyData(economyData);

    security.logSecurityEvent('economy_deploy', {
      playerId: req.user.playerId,
      type,
      itemCount: data.length,
      ip: req.ip,
    });

    res.json({
      success: true,
      result,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'deploy economy data', req.requestId);
  }
});

// Get currencies
router.get('/currencies', security.sessionValidation, async (req, res) => {
  try {
    const currencies = await unityService.getCurrencies();

    res.json({
      success: true,
      currencies,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'get currencies', req.requestId);
  }
});

// Get inventory items
router.get('/inventory', security.sessionValidation, async (req, res) => {
  try {
    const inventory = await unityService.getInventoryItems();

    res.json({
      success: true,
      inventory,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'get inventory items', req.requestId);
  }
});

// Get catalog items
router.get('/catalog', security.sessionValidation, async (req, res) => {
  try {
    const catalog = await unityService.getCatalogItems();

    res.json({
      success: true,
      catalog,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'get catalog items', req.requestId);
  }
});

// Create currency
router.post('/currencies', security.sessionValidation, async (req, res) => {
  try {
    const currencyData = req.body;
    const result = await unityService.createCurrency(currencyData);

    security.logSecurityEvent('currency_created', {
      playerId: req.user.playerId,
      currencyId: currencyData.id,
      ip: req.ip,
    });

    res.json({
      success: true,
      currency: result,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'create currency', req.requestId);
  }
});

// Create inventory item
router.post('/inventory', security.sessionValidation, async (req, res) => {
  try {
    const itemData = req.body;
    const result = await unityService.createInventoryItem(itemData);

    security.logSecurityEvent('inventory_item_created', {
      playerId: req.user.playerId,
      itemId: itemData.id,
      ip: req.ip,
    });

    res.json({
      success: true,
      item: result,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'create inventory item', req.requestId);
  }
});

// Create catalog item
router.post('/catalog', security.sessionValidation, async (req, res) => {
  try {
    const catalogData = req.body;
    const result = await unityService.createCatalogItem(catalogData);

    security.logSecurityEvent('catalog_item_created', {
      playerId: req.user.playerId,
      itemId: catalogData.id,
      ip: req.ip,
    });

    res.json({
      success: true,
      item: result,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'create catalog item', req.requestId);
  }
});

export default router;

// Monetization helpers (mounted under /api/monetization in server)
export const createPricingRouter = () => {
  const r = express.Router();

  r.get('/pricing', security.sessionValidation, async (req, res) => {
    try {
      const { country, currency } = req.query;
      const tiers = await pricingService.getLocalizedTiers({ country, currency });
      res.json({ success: true, tiers, country: country || null, currency: currency || null });
    } catch (error) {
      logger.error('Pricing retrieval failed', { error: error.message });
      res.status(500).json({ success: false, error: 'pricing_error' });
    }
  });

  return r;
};
