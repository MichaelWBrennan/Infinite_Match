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
import { Logger, getRecentLogs } from '../core/logger/index.js';
import EconomyService from '../services/economy/UnifiedEconomyService.js';
import UnityService from '../services/unity/UnifiedUnityService.js';
import { readLevelResults, summarizeLevelResults } from '../services/level-tuning.js';
import { readAttemptObservations, summarizeAttemptObservations } from '../services/levels/attempt-observations.js';
import { retentionStudyStore } from '../services/study/retention-study.js';

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
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 500);
  const logs = getRecentLogs({
    limit,
    level: typeof req.query.level === 'string' ? req.query.level : undefined,
    context: typeof req.query.context === 'string' ? req.query.context : undefined,
  });
  res.json({ success: true, logs, requestId: req.requestId });
});

// Anonymous generated-board observations are review-only. Never expose raw JSONL rows,
// exact clocks, player IDs, board contents, geography or sub-threshold slices.
router.get('/attempt-observations', async (req, res) => {
  try {
    const { rows, skipped } = await readAttemptObservations();
    const fromDay = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const report = summarizeAttemptObservations(rows.filter((row) => row.day >= fromDay),
      { bySeed: req.query.bySeed === 'true' });
    res.set('Cache-Control', 'private, no-store');
    res.json({ success: true, fromDay, skippedLines: skipped, ...report, requestId: req.requestId });
  } catch (error) {
    logger.error('Attempt observation report failed', { error: error.message });
    res.status(503).json({ success: false, error: 'observation_report_unavailable', requestId: req.requestId });
  }
});

// Opt-in return cohorts are pseudonymous and entirely separate from ads consent or payouts.
// Aggregate only; no day-level entries, player pseudonyms or sub-threshold rates leave this route.
router.get('/retention-study', async (req, res) => {
  try {
    res.set('Cache-Control', 'private, no-store');
    res.json({ success: true, ...(await retentionStudyStore.report()), requestId: req.requestId });
  } catch (error) {
    logger.error('Retention study report failed', { error: error.message });
    res.status(503).json({ success: false, error: 'retention_study_report_unavailable', requestId: req.requestId });
  }
});

// Clear cache
// Per-level difficulty summary from player-reported results. Levels are flagged
// too_hard or too_easy only after enough attempts.
router.get('/level-tuning', async (req, res) => {
  try {
    const { records, skipped } = await readLevelResults();
    res.json({
      success: true,
      generatedAt: new Date().toISOString(),
      totalResults: records.length,
      source: 'legacy_client_reported_only',
      skippedLines: skipped,
      levels: summarizeLevelResults(records),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'level_tuning_unavailable' });
  }
});

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
