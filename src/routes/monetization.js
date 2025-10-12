import express from 'express';
import { body, validationResult, query } from 'express-validator';
import security from 'core/security/index.js';
import { Logger } from 'core/logger/index.js';
import ReceiptVerificationService from 'services/payments/ReceiptVerificationService.js';
import PricingService from 'services/pricing/PricingService.js';
import AdConfigService from 'services/ad/AdConfigService.js';
import OffersService from 'services/offers/OffersService.js';

const router = express.Router();
const logger = new Logger('MonetizationRoutes');

const pricingService = new PricingService();
const adConfigService = new AdConfigService();
const offersService = new OffersService();

router.post(
  '/receipt/verify',
  security.authRateLimit,
  [
    body('platform').isIn(['ios', 'android']).withMessage('Invalid platform'),
    body('payload').notEmpty().withMessage('payload required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const { platform, payload } = req.body;
      const result = await ReceiptVerificationService.verify({ platform, payload });
      if (!result.success) {
        return res.status(400).json({ success: false, error: 'verification_failed', details: result });
      }
      res.json({ success: true, result });
    } catch (error) {
      logger.error('Receipt verification error', { error: error.message });
      res.status(500).json({ success: false, error: 'verification_error' });
    }
  }
);

router.get(
  '/ad-config',
  security.sessionValidation,
  async (req, res) => {
    try {
      const profile = req.user || {};
      const config = await adConfigService.getAdConfigForPlayer(profile);
      res.json({ success: true, config });
    } catch (error) {
      logger.error('Ad config retrieval failed', { error: error.message });
      res.status(500).json({ success: false, error: 'ad_config_error' });
    }
  }
);

router.get(
  '/pricing',
  security.sessionValidation,
  [
    query('country').optional().isString(),
    query('currency').optional().isString(),
  ],
  async (req, res) => {
    try {
      const { country, currency } = req.query;
      const tiers = await pricingService.getLocalizedTiers({ country, currency });
      res.json({ success: true, tiers, country: country || null, currency: currency || null });
    } catch (error) {
      logger.error('Pricing retrieval failed', { error: error.message });
      res.status(500).json({ success: false, error: 'pricing_error' });
    }
  }
);

router.post(
  '/offers',
  security.sessionValidation,
  async (req, res) => {
    try {
      const profile = req.body || {};
      const offers = offersService.getOffers(profile);
      res.json({ success: true, offers });
    } catch (error) {
      logger.error('Offers generation failed', { error: error.message });
      res.status(500).json({ success: false, error: 'offers_error' });
    }
  }
);

export default router;
