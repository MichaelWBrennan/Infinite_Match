import express from 'express';
import { body, validationResult, query } from 'express-validator';
import security from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';
import ARPUOptimizationService from '../services/arpu/ARPUOptimizationService.js';

const router = express.Router();
const logger = new Logger('ARPURoutes');

const arpuService = new ARPUOptimizationService();

/**
 * Get personalized offers for player
 */
router.post(
  '/offers/personalized',
  security.sessionValidation,
  [body('playerProfile').isObject().withMessage('Player profile required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { playerProfile } = req.body;
      const playerId = req.user?.playerId || 'anonymous';

      const offers = await arpuService.generatePersonalizedOffers(playerId, playerProfile);

      res.json({ success: true, offers });
    } catch (error) {
      logger.error('Failed to get personalized offers', { error: error.message });
      res.status(500).json({ success: false, error: 'offers_error' });
    }
  },
);

/**
 * Purchase personalized offer
 */
router.post(
  '/offers/purchase',
  security.sessionValidation,
  [
    body('offerId').notEmpty().withMessage('Offer ID required'),
    body('amount').isNumeric().withMessage('Amount must be numeric'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { offerId, amount } = req.body;
      const playerId = req.user?.playerId || 'anonymous';

      const result = await arpuService.processOfferPurchase(offerId, playerId, amount);

      res.json({ success: true, result });
    } catch (error) {
      logger.error('Failed to purchase offer', { error: error.message });
      res.status(500).json({ success: false, error: 'purchase_error' });
    }
  },
);

/**
 * Update player profile
 */
router.post(
  '/profile/update',
  security.sessionValidation,
  [body('updates').isObject().withMessage('Updates object required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { updates } = req.body;
      const playerId = req.user?.playerId || 'anonymous';

      arpuService.updatePlayerProfile(playerId, updates);

      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to update player profile', { error: error.message });
      res.status(500).json({ success: false, error: 'profile_update_error' });
    }
  },
);

/**
 * Get ARPU statistics
 */
router.get('/statistics', security.sessionValidation, async (req, res) => {
  try {
    const statistics = arpuService.getARPUStatistics();

    res.json({ success: true, statistics });
  } catch (error) {
    logger.error('Failed to get ARPU statistics', { error: error.message });
    res.status(500).json({ success: false, error: 'statistics_error' });
  }
});

/**
 * Track revenue event
 */
router.post(
  '/revenue/track',
  security.sessionValidation,
  [
    body('amount').isNumeric().withMessage('Amount must be numeric'),
    body('source').isIn(['IAP', 'Subscription', 'Ad']).withMessage('Invalid revenue source'),
    body('itemId').optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { amount, source, itemId } = req.body;
      const playerId = req.user?.playerId || 'anonymous';

      arpuService.trackRevenue(playerId, amount, source, itemId);

      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to track revenue', { error: error.message });
      res.status(500).json({ success: false, error: 'revenue_tracking_error' });
    }
  },
);

/**
 * Get player segment
 */
router.get('/player/segment', security.sessionValidation, async (req, res) => {
  try {
    const playerId = req.user?.playerId || 'anonymous';
    const profile = arpuService.getPlayerProfile(playerId);
    const segment = arpuService.determinePlayerSegment(profile);

    res.json({ success: true, segment, profile });
  } catch (error) {
    logger.error('Failed to get player segment', { error: error.message });
    res.status(500).json({ success: false, error: 'segment_error' });
  }
});

/**
 * Get energy packs
 */
router.get('/energy/packs', security.sessionValidation, async (req, res) => {
  try {
    const energyPacks = Array.from(arpuService.energyPacks.values());

    res.json({ success: true, energyPacks });
  } catch (error) {
    logger.error('Failed to get energy packs', { error: error.message });
    res.status(500).json({ success: false, error: 'energy_packs_error' });
  }
});

/**
 * Get subscription tiers
 */
router.get('/subscriptions/tiers', security.sessionValidation, async (req, res) => {
  try {
    const subscriptionTiers = Array.from(arpuService.subscriptionTiers.values());

    res.json({ success: true, subscriptionTiers });
  } catch (error) {
    logger.error('Failed to get subscription tiers', { error: error.message });
    res.status(500).json({ success: false, error: 'subscription_tiers_error' });
  }
});

export default router;
