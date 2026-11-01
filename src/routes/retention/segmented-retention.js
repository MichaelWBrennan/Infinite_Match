/**
 * Segmented Retention Routes
 *
 * GET /api/retention/segmented-retention/all - Get retention for all segments (admin)
 * GET /api/retention/segmented-retention/segment/:segmentId - Get retention for a segment (admin)
 * GET /api/retention/segmented-retention/priority - Get priority segments (admin)
 */

import express from 'express';
import security from '../../core/security/index.js';
import { Logger } from '../../core/logger/index.js';
import { accountEconomy } from '../../services/economy/AccountEconomyService.js';
import SegmentedRetentionService from '../../services/retention/segmented-retention-service.js';

const router = express.Router();
const logger = new Logger('SegmentedRetentionRoutes');

const segmentedRetention = new SegmentedRetentionService();

router.use(security.sessionValidation);

/** Get retention for all segments (admin only). */
router.get('/all', async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.playerId !== 'admin') {
      return res.status(403).json({ success: false, error: 'admin_required', requestId: req.requestId });
    }
    const allEconomies = await accountEconomy.getAllPlayerEconomies();
    const result = await segmentedRetention.computeAllSegmentRetention(allEconomies);
    res.json({ success: true, ...result, requestId: req.requestId });
  } catch (error) {
    logger.error('Get all segment retention failed', { error: error.message });
    res.status(500).json({ success: false, error: 'all_segment_retention_error', requestId: req.requestId });
  }
});

/** Get retention for a specific segment (admin only). */
router.get('/segment/:segmentId', async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.playerId !== 'admin') {
      return res.status(403).json({ success: false, error: 'admin_required', requestId: req.requestId });
    }
    const { segmentId } = req.params;
    const allEconomies = await accountEconomy.getAllPlayerEconomies();
    const result = await segmentedRetention.computeSegmentRetention(allEconomies, segmentId);
    res.json({ success: true, ...result, requestId: req.requestId });
  } catch (error) {
    logger.error('Get segment retention failed', { error: error.message });
    res.status(500).json({ success: false, error: 'segment_retention_error', requestId: req.requestId });
  }
});

/** Get priority segments needing attention (admin only). */
router.get('/priority', async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.playerId !== 'admin') {
      return res.status(403).json({ success: false, error: 'admin_required', requestId: req.requestId });
    }
    const limit = parseInt(req.query.limit) || 5;
    const allEconomies = await accountEconomy.getAllPlayerEconomies();
    const priorities = await segmentedRetention.getPrioritySegments(allEconomies, { limit });
    res.json({ success: true, prioritySegments: priorities, count: priorities.length, requestId: req.requestId });
  } catch (error) {
    logger.error('Get priority segments failed', { error: error.message });
    res.status(500).json({ success: false, error: 'priority_segments_error', requestId: req.requestId });
  }
});

export default router;
