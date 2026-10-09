import express from 'express';
import { body, validationResult, query } from 'express-validator';
import security from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';
import ReceiptVerificationService from '../services/payments/ReceiptVerificationService.js';
import PricingService from '../services/pricing/PricingService.js';
import AdConfigService from '../services/ad/AdConfigService.js';
import OffersService from '../services/offers/OffersService.js';
import PurchaseLedgerDb from '../services/payments/PurchaseLedgerDb.js';
import { grantPurchase } from '../services/payments/purchase-grants.js';
import { productIdForSku } from '../services/payments/product-catalog.js';

const router = express.Router();
const logger = new Logger('MonetizationRoutes');

const pricingService = new PricingService();
const adConfigService = new AdConfigService();
const offersService = new OffersService();

/**
 * Verifies a store purchase and grants the matching catalog product to the signed-in player.
 * iOS: payload.signedTransaction (StoreKit 2 JWS), or payload.receiptData (legacy receipt).
 * Android: payload { packageName, productId, purchaseToken }.
 */
router.post(
  '/receipt/verify',
  security.sessionValidation,
  security.authRateLimit,
  [
    body('platform').isIn(['ios', 'android']).withMessage('Invalid platform'),
    body('payload').isObject().withMessage('payload required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const { platform, payload } = req.body;
      const playerId = req.user?.playerId;
      if (!playerId) {
        return res.status(401).json({ success: false, error: 'unauthorized' });
      }
      const verified = await ReceiptVerificationService.verify({ platform, payload });
      if (!verified.success) {
        return res
          .status(400)
          .json({ success: false, error: 'verification_failed', details: verified });
      }
      // The store SKU must map to a catalog product. The grant takes its price from the catalog.
      const productId = productIdForSku(platform, verified.productId);
      if (!productId) {
        return res.status(400).json({ success: false, error: 'unknown_product' });
      }
      const grant = await grantPurchase({
        playerId,
        productId,
        transactionId: verified.transactionId,
        platform,
      });
      if (!grant.granted) {
        const status = grant.reason === 'transaction_claimed' ? 409 : 400;
        return res.status(status).json({ success: false, error: grant.reason });
      }
      res.json({
        success: true,
        productId,
        duplicate: grant.duplicate,
        transactionId: verified.transactionId,
      });
    } catch (error) {
      logger.error('Receipt verification error', { error: error.message });
      res.status(500).json({ success: false, error: 'verification_error' });
    }
  },
);

router.get('/ad-config', security.sessionValidation, async (req, res) => {
  try {
    const profile = req.user || {};
    const config = await adConfigService.getAdConfigForPlayer(profile);
    // Entitlement enforcement: disable ads if user owns remove_ads
    if (req.user?.playerId) {
      const hasRemoveAds = await PurchaseLedgerDb.hasPurchase(req.user.playerId, 'remove_ads');
      if (hasRemoveAds) {
        config.enabled = false;
        config.rewarded.enabled = false;
        config.interstitial.enabled = false;
      }
    }
    res.json({ success: true, config });
  } catch (error) {
    logger.error('Ad config retrieval failed', { error: error.message });
    res.status(500).json({ success: false, error: 'ad_config_error' });
  }
});

router.get(
  '/pricing',
  security.sessionValidation,
  [query('country').optional().isString(), query('currency').optional().isString()],
  async (req, res) => {
    try {
      const { country, currency } = req.query;
      const tiers = await pricingService.getLocalizedTiers({ country, currency });
      res.json({ success: true, tiers, country: country || null, currency: currency || null });
    } catch (error) {
      logger.error('Pricing retrieval failed', { error: error.message });
      res.status(500).json({ success: false, error: 'pricing_error' });
    }
  },
);

router.post('/offers', security.sessionValidation, async (req, res) => {
  try {
    const profile = req.body || {};
    const offers = offersService.getOffers(profile);
    res.json({ success: true, offers });
  } catch (error) {
    logger.error('Offers generation failed', { error: error.message });
    res.status(500).json({ success: false, error: 'offers_error' });
  }
});

export default router;
