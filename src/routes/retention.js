/**
 * Retention Dashboard routes - D1/D7/D30 cohort tracking vs genre benchmarks.
 *
 * GET /api/retention/dashboard  - retention rates by cohort, overall averages, benchmarks
 * POST /api/retention/heartbeat  - record the current player's login (client heartbeat)
 */

import express from 'express';
import { Logger } from '../core/logger/index.js';
import security from '../core/security/index.js';
import { recordLogin, computeRetention } from '../services/retention/retention-service.js';

const router = express.Router();
const logger = new Logger('RetentionRoutes');

router.use(security.sessionValidation);

// Client heartbeat: records the current player's login for today.
router.post('/heartbeat', async (req, res) => {
  try {
    const result = await recordLogin(req.user.playerId);
    res.json({ success: true, day: result.day, requestId: req.requestId });
  } catch (error) {
    logger.error('Retention heartbeat failed', { error: error.message });
    res.status(500).json({ success: false, error: 'heartbeat_error', requestId: req.requestId });
  }
});

// Retention dashboard: D1/D7/D30 by cohort vs genre benchmarks.
router.get('/dashboard', async (_req, res) => {
  try {
    const result = await computeRetention();
    res.json({ success: true, ...result, requestId: undefined });
  } catch (error) {
    logger.error('Retention dashboard failed', { error: error.message });
    res.status(500).json({ success: false, error: 'dashboard_error', requestId: undefined });
  }
});

export default router;
