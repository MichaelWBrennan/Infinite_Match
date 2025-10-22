/**
 * Admin Routes
 * Handles administrative operations and monitoring
 */

import express from 'express';
import security from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';
import EconomyService from '../services/economy/index.js';
import UnityService from '../services/unity/index.js';

const router = express.Router();
const logger = new Logger('AdminRoutes');

// Initialize services
const economyService = new EconomyService();
const unityService = new UnityService();

// Admin authentication middleware with proper security
const adminAuth = async (req, res, next) => {
  try {
    const adminToken = req.headers['x-admin-token'];
    const adminId = req.headers['x-admin-id'];
    
    if (!adminToken || !adminId) {
      return res.status(401).json({
        success: false,
        error: 'Admin credentials required',
        requestId: req.requestId,
      });
    }

    // Verify admin token and permissions
    const isValidAdmin = await security.verifyAdminToken(adminToken, adminId);
    if (!isValidAdmin) {
      security.logSecurityEvent('admin_auth_failed', {
        adminId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      return res.status(403).json({
        success: false,
        error: 'Invalid admin credentials',
        requestId: req.requestId,
      });
    }

    // Add admin info to request
    req.admin = {
      id: adminId,
      permissions: isValidAdmin.permissions,
      lastActivity: new Date().toISOString(),
    };

    security.logSecurityEvent('admin_access', {
      adminId,
      ip: req.ip,
      endpoint: req.path,
    });

    next();
  } catch (error) {
    logger.error('Admin authentication error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Authentication service error',
      requestId: req.requestId,
    });
  }
};

// Apply admin authentication to all routes
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
        unity: await unityService.authenticate(),
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
    const report = await economyService.generateReport();

    res.json({
      success: true,
      stats: report.summary,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Failed to get economy statistics', { error: error.message });
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
    const isAuthenticated = await unityService.authenticate();

    res.json({
      success: true,
      status: {
        authenticated: isAuthenticated,
        projectId: unityService.projectId,
        environmentId: unityService.environmentId,
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
    const economyData = await economyService.loadEconomyData();
    const result = await unityService.deployEconomyData(economyData);

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
router.get('/logs', async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    // Get actual system logs from logger service
    const logs = await logger.getLogs({
      limit: parseInt(limit),
      adminId: req.admin.id,
    });

    res.json({
      success: true,
      logs: logs.slice(0, parseInt(limit)),
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Failed to get system logs', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get system logs',
      requestId: req.requestId,
    });
  }
});

// Clear cache
router.post('/cache/clear', async (req, res) => {
  try {
    economyService.clearExpiredCache();

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
