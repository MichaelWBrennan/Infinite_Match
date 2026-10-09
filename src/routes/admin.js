/**
 * Admin Routes
 * Handles administrative operations and monitoring
 */

import express from 'express';
import security from '../core/security/index.js';
import { adminAuth } from '../middleware/admin-auth.js';
import DataLoader from '../data/DataLoader.js';
import EconomyValidator from '../data/validators/EconomyValidator.js';
import CacheManager from '../core/cache/CacheManager.js';
import { Logger } from '../core/logger/index.js';
import EconomyService from '../services/economy/UnifiedEconomyService.js';
import UnityService from '../services/unity/UnifiedUnityService.js';

const router = express.Router();
const logger = new Logger('AdminRoutes');

// Initialize services
// Built on first use: config is not initialised yet when this module is imported.
// Same dependencies the service registry uses, so the economy service can read its CSV data.
let services = null;
function getServices() {
  if (!services) {
    services = {
      economy: new EconomyService(new DataLoader(), new EconomyValidator(), new CacheManager()),
      unity: new UnityService(new CacheManager()),
    };
  }
  return services;
}

// Operator-only: every route below requires ADMIN_API_TOKEN and ADMIN_IDS.
router.use(adminAuth);

// Get system health
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        unity: await getServices().unity.authenticate(),
        economy: true, // Economy service is always available
      },
    };

    res.json({
      success: true,
      health,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      requestId: req.requestId,
    });
  }
});

// Get economy statistics
router.get('/economy/stats', async (req, res) => {
  try {
    const report = await getServices().economy.generateReport();

    res.json({
      success: true,
      stats: report.summary,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Failed to get economy statistics', { error: error.message });
    // The economy CSVs are not in this repository. Say so, instead of a generic failure.
    if (String(error.message).includes('ENOENT')) {
      return res.status(503).json({
        success: false,
        error: 'economy_data_missing',
        requestId: req.requestId,
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to get economy statistics',
      requestId: req.requestId,
    });
  }
});

// Get security events
router.get('/security/events', async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    // Get actual security events from security service
    const events = await security.getSecurityEvents({
      limit: parseInt(limit),
      adminId: req.admin.id,
    });

    res.json({
      success: true,
      events: events.slice(0, parseInt(limit)),
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Failed to get security events', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get security events',
      requestId: req.requestId,
    });
  }
});

// Get Unity Services status
router.get('/unity/status', async (req, res) => {
  try {
    const isAuthenticated = await getServices().unity.authenticate();

    res.json({
      success: true,
      status: {
        authenticated: isAuthenticated,
        projectId: getServices().unity.projectId,
        environmentId: getServices().unity.environmentId,
      },
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Failed to get Unity status', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get Unity status',
      requestId: req.requestId,
    });
  }
});

// Deploy all economy data to Unity
router.post('/unity/deploy', async (req, res) => {
  try {
    const economyData = await getServices().economy.loadEconomyData();
    const result = await getServices().unity.deployEconomyData(economyData);

    security.logSecurityEvent('admin_economy_deploy', {
      adminId: req.headers['x-admin-id'] || 'unknown',
      ip: req.ip,
    });

    res.json({
      success: true,
      result,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Failed to deploy economy data', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to deploy economy data',
      requestId: req.requestId,
    });
  }
});

// Get system logs
router.get('/logs', (req, res) => {
  // Logs go to stdout as JSON; no queryable log store is wired yet.
  res.status(501).json({ success: false, error: 'not_implemented', requestId: req.requestId });
});

// Clear cache
router.post('/cache/clear', async (req, res) => {
  try {
    getServices().economy.clearExpiredCache();

    res.json({
      success: true,
      message: 'Cache cleared successfully',
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Failed to clear cache', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      requestId: req.requestId,
    });
  }
});

export default router;
