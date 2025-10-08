/**
 * Economy Routes
 * Handles game economy data and operations
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import security from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';
import EconomyService from '../services/economy/index.js';
import UnityService from '../services/unity/index.js';

const router = express.Router();
const logger = new Logger('EconomyRoutes');

// Initialize services
const economyService = new EconomyService();
const unityService = new UnityService();

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
    logger.error('Failed to load economy data', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to load economy data',
      requestId: req.requestId,
    });
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
    logger.error('Failed to generate economy report', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate economy report',
      requestId: req.requestId,
    });
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
    logger.error('Economy deployment failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Economy deployment failed',
      requestId: req.requestId,
    });
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
    logger.error('Failed to get currencies', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get currencies',
      requestId: req.requestId,
    });
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
    logger.error('Failed to get inventory items', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get inventory items',
      requestId: req.requestId,
    });
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
    logger.error('Failed to get catalog items', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get catalog items',
      requestId: req.requestId,
    });
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
    logger.error('Failed to create currency', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create currency',
      requestId: req.requestId,
    });
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
    logger.error('Failed to create inventory item', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create inventory item',
      requestId: req.requestId,
    });
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
    logger.error('Failed to create catalog item', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create catalog item',
      requestId: req.requestId,
    });
  }
});

export default router;