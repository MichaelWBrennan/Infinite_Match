/**
 * CRM campaign routes.
 *
 * Operator-facing endpoints for managing player segments and campaigns.
 * Campaigns send targeted push notifications to players in matching segments.
 * All mutation endpoints require ADMIN_API_TOKEN and ADMIN_IDS.
 */

import express from 'express';
import { body, validationResult, query } from 'express-validator';
import security from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';
import {
  getAllSegments,
  computeSegments,
  createCampaign,
  getCampaign,
  getAllCampaigns,
  deactivateCampaign,
  evaluateCampaign,
  sendCampaign,
  getPlayerCampaigns,
} from '../services/crm/crm-service.js';

const router = express.Router();
const logger = new Logger('CRMRoutes');

// Operator-only: admin token check
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.admin_token;
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected || token !== expected) {
    return res.status(401).json({ success: false, error: 'admin_required' });
  }
  next();
}

// List all segment definitions (public read).
router.get('/segments', async (req, res) => {
  try {
    const segments = getAllSegments();
    res.json({ success: true, segments, requestId: req.requestId });
  } catch (error) {
    logger.error('List CRM segments failed', { error: error.message });
    res.status(500).json({ success: false, error: 'segment_list_error', requestId: req.requestId });
  }
});

// Compute which segments a player belongs to.
router.get('/segments/compute', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;
    const profile = {
      playerId,
      level: req.query.level ? Number(req.query.level) : undefined,
      totalSpentUsd: req.query.total_spent_usd ? Number(req.query.total_spent_usd) : undefined,
      lastPlay: req.query.last_play || undefined,
      streak: req.query.streak ? Number(req.query.streak) : undefined,
      hasVip: req.query.has_vip === 'true',
    };
    const segments = computeSegments(profile);
    res.json({ success: true, playerId, segments, requestId: req.requestId });
  } catch (error) {
    logger.error('Compute player segments failed', { error: error.message });
    res.status(500).json({ success: false, error: 'segment_compute_error', requestId: req.requestId });
  }
});

// Create a new campaign (admin only).
router.post(
  '/campaigns',
  requireAdmin,
  [
    body('name').isString().isLength({ min: 1 }).withMessage('name required'),
    body('segmentIds').isArray({ min: 1 }).withMessage('at least one segment required'),
    body('message').isString().isLength({ min: 1 }).withMessage('message required'),
    body('offer').optional().isObject(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const { name, segmentIds, message, offer } = req.body;
      const campaign = createCampaign({ name, segmentIds, message, offer });
      res.json({ success: true, campaign, requestId: req.requestId });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message, requestId: req.requestId });
    }
  },
);

// List all campaigns (admin only).
router.get('/campaigns', requireAdmin, async (req, res) => {
  try {
    const campaigns = getAllCampaigns();
    res.json({ success: true, campaigns, requestId: req.requestId });
  } catch (error) {
    logger.error('List CRM campaigns failed', { error: error.message });
    res.status(500).json({ success: false, error: 'campaign_list_error', requestId: req.requestId });
  }
});

// Get a single campaign (admin only).
router.get('/campaigns/:campaignId', requireAdmin, async (req, res) => {
  try {
    const campaign = getCampaign(req.params.campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'campaign_not_found', requestId: req.requestId });
    }
    res.json({ success: true, campaign, requestId: req.requestId });
  } catch (error) {
    logger.error('Get CRM campaign failed', { error: error.message });
    res.status(500).json({ success: false, error: 'campaign_get_error', requestId: req.requestId });
  }
});

// Deactivate a campaign (admin only).
router.post('/campaigns/:campaignId/deactivate', requireAdmin, async (req, res) => {
  try {
    const ok = deactivateCampaign(req.params.campaignId);
    if (!ok) {
      return res.status(404).json({ success: false, error: 'campaign_not_found', requestId: req.requestId });
    }
    res.json({ success: true, campaignId: req.params.campaignId, requestId: req.requestId });
  } catch (error) {
    logger.error('Deactivate CRM campaign failed', { error: error.message });
    res.status(500).json({ success: false, error: 'campaign_deactivate_error', requestId: req.requestId });
  }
});

// Evaluate which players in a provided list match a campaign (admin only).
router.post(
  '/campaigns/:campaignId/evaluate',
  requireAdmin,
  [body('players').isArray().withMessage('players array required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const { players } = req.body;
      const matching = evaluateCampaign(req.params.campaignId, players);
      res.json({
        success: true,
        campaignId: req.params.campaignId,
        matchingCount: matching.length,
        matching: matching.map((p) => p.playerId),
        requestId: req.requestId,
      });
    } catch (error) {
      logger.error('Evaluate CRM campaign failed', { error: error.message });
      res.status(500).json({ success: false, error: 'campaign_evaluate_error', requestId: req.requestId });
    }
  },
);

// Send a campaign to matching players (admin only).
router.post(
  '/campaigns/:campaignId/send',
  requireAdmin,
  [body('players').isArray().withMessage('players array required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const { players } = req.body;
      const result = await sendCampaign(req.params.campaignId, players);
      res.json({
        success: true,
        campaignId: req.params.campaignId,
        ...result,
        requestId: req.requestId,
      });
    } catch (error) {
      logger.error('Send CRM campaign failed', { error: error.message });
      res.status(500).json({ success: false, error: 'campaign_send_error', requestId: req.requestId });
    }
  },
);

// Get campaigns a player has received (player read).
router.get('/players/:playerId/campaigns', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.params;
    // Players can only see their own campaigns
    if (req.user.playerId !== playerId) {
      return res.status(403).json({ success: false, error: 'forbidden', requestId: req.requestId });
    }
    const campaigns = getPlayerCampaigns(playerId);
    res.json({ success: true, playerId, campaigns, requestId: req.requestId });
  } catch (error) {
    logger.error('Get player CRM campaigns failed', { error: error.message });
    res.status(500).json({ success: false, error: 'player_campaigns_error', requestId: req.requestId });
  }
});

export default router;
