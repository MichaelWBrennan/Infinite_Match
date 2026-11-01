/**
 * Monetization Routes - revenue-generating endpoints.
 *
 *   POST   /api/monetization/receipt/verify   - Verify a store purchase receipt
 *   GET    /api/monetization/ad-config        - Get ad config for the player
 *   GET    /api/monetization/purchase-history - Player's purchase history
 *   GET    /api/monetization/pricing          - Get localized pricing tiers
 *   POST   /api/monetization/offers           - Get personalized offers
 *   POST   /api/monetization/pvp/booster      - Purchase a PvP booster with coins
 *   POST   /api/monetization/continue-level   - Continue a failed level (spend coins for extra moves)
 *   POST   /api/monetization/skip-level       - Skip a level entirely (spend coins)
 *   POST   /api/monetization/streak-freeze    - Purchase a streak freeze (coins or USD checkout)
 *   POST   /api/monetization/life-refill      - Create Stripe checkout for instant life refill
 *   POST   /api/ads/rewarded                  - Grant reward for watching a rewarded ad
 *   GET    /api/monetization/status           - Get player's monetization status
 */

import express from 'express';
import { body, validationResult, query } from 'express-validator';
import security from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';
import ReceiptVerificationService from '../services/payments/ReceiptVerificationService.js';
import PricingService from '../services/pricing/PricingService.js';
import AdConfigService from '../services/ad/AdConfigService.js';
import OffersService, { OFFER_CATALOG } from '../services/offers/OffersService.js';
import PurchaseLedgerDb from '../services/payments/PurchaseLedgerDb.js';
import { grantPurchase } from '../services/payments/purchase-grants.js';
import { productIdForSku } from '../services/payments/product-catalog.js';
import { accountEconomy as accountEconomyService } from '../services/economy/AccountEconomyService.js';
import { monetizationService } from '../services/monetization/monetization-service.js';

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

      // Server-side offer validation: enforce offer expiry and limits at purchase time.
      const playerProfile = req.user || {};
      const productOffer = OFFER_CATALOG.find((o) => o.productId === productId);
      if (productOffer) {
        // Build a profile from the player's economy to check segments and purchase history
        const playerEconomy = await accountEconomyService.getPlayerEconomy(playerId);
        const profile = {
          playerId,
          level: playerEconomy.progression?.level || 0,
          totalSpentUsd: playerEconomy.statistics?.totalSpentUsd || 0,
          lastPlay: playerEconomy.statistics?.lastPlayed || undefined,
          streak: playerEconomy.dailyRewards?.streak || 0,
          hasVip: await PurchaseLedgerDb.hasPurchase(playerId, 'vip'),
          purchases: [],
          offerSeenAt: playerProfile.offerSeenAt,
        };
        const validation = offersService.validateOffer(productOffer.sku, profile);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            error: validation.reason,
          });
        }
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
    // Entitlement enforcement: disable ads if user owns remove_ads or has an active VIP subscription
    if (req.user?.playerId) {
      const hasRemoveAds = await PurchaseLedgerDb.hasPurchase(req.user.playerId, 'remove_ads');
      const hasVip = await PurchaseLedgerDb.hasPurchase(req.user.playerId, 'vip');
      if (hasRemoveAds || hasVip) {
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

// Purchase history for the signed-in player.
router.get('/purchase-history', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;
    const purchases = await PurchaseLedgerDb.listPurchases(playerId);
    const history = purchases.map((p) => ({
      transactionId: p.transactionId,
      productId: p.productId,
      platform: p.platform,
      amountUsd: p.amountUsd,
      currency: p.currency,
      priceCents: p.priceCents,
      onDeal: p.onDeal,
      fulfilled: p.fulfilled,
      createdAt: p.createdAt,
    }));
    res.json({ success: true, purchases: history, requestId: req.requestId });
  } catch (error) {
    logger.error('Purchase history failed', { error: error.message });
    res.status(500).json({ success: false, error: 'purchase_history_error', requestId: req.requestId });
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

/**
 * Purchase a PvP booster with coins. Deducts coins from the player's account
 * and records the booster purchase. Boosters can be used in PvP matches.
 */
router.post(
  '/pvp/booster',
  security.sessionValidation,
  [body('boosterId').isString().withMessage('boosterId required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const playerId = req.user?.playerId;
      if (!playerId) {
        return res.status(401).json({ success: false, error: 'unauthorized' });
      }
      const { boosterId } = req.body;

      const boosterPrices = {
        pvp_booster_extra_moves: 50,
        pvp_booster_color_bomb: 75,
        pvp_booster_extra_time: 60,
      };

      const priceCoins = boosterPrices[boosterId];
      if (!priceCoins) {
        return res.status(400).json({ success: false, error: 'unknown_booster' });
      }

      const playerEconomy = await accountEconomyService.getPlayerEconomy(playerId);
      const coins = playerEconomy.currencies.coins;
      if (coins.amount < priceCoins) {
        return res.status(400).json({
          success: false,
          error: 'insufficient_coins',
          required: priceCoins,
          balance: coins.amount,
        });
      }

      await accountEconomyService.updateCurrency(
        playerId,
        'coins',
        priceCoins,
        'spend',
        `pvp_booster:${boosterId}`
      );

      res.json({
        success: true,
        boosterId,
        costCoins: priceCoins,
        message: `Purchased ${boosterId}`,
      });
    } catch (error) {
      logger.error('PvP booster purchase failed', { error: error.message });
      res.status(500).json({ success: false, error: 'booster_purchase_error' });
    }
  },
);

/**
 * GET /api/monetization/status
 * Get the player's monetization status: continue availability, streak freeze, ad grants.
 */
router.get('/status', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;
    const status = await monetizationService.getPlayerStatus(playerId);
    return res.json({ success: true, ...status, requestId: req.requestId });
  } catch (error) {
    logger.error('Monetization status failed', { error: error.message });
    return res.status(500).json({ success: false, error: 'status_error', requestId: req.requestId });
  }
});

/**
 * POST /api/monetization/continue-level
 * Spend coins to continue a failed level with +5 moves.
 * Body: { levelNumber }
 */
router.post(
  '/continue-level',
  security.sessionValidation,
  [body('levelNumber').isInt({ min: 1 }).withMessage('levelNumber is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const { playerId } = req.user;
      const { levelNumber } = req.body;
      const result = await monetizationService.continueLevel(playerId, levelNumber);
      if (!result.success) {
        const status = result.error === 'insufficient_coins' ? 400 : 409;
        return res.status(status).json({ success: false, error: result.error, requestId: req.requestId });
      }
      return res.json({ success: true, ...result, requestId: req.requestId });
    } catch (error) {
      logger.error('Level continue failed', { error: error.message });
      return res.status(500).json({ success: false, error: 'continue_failed', requestId: req.requestId });
    }
  },
);

/**
 * POST /api/monetization/skip-level
 * Spend coins to skip a level entirely. Grants a 1-star win reward.
 * Body: { levelNumber }
 */
router.post(
  '/skip-level',
  security.sessionValidation,
  [body('levelNumber').isInt({ min: 1 }).withMessage('levelNumber is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const { playerId } = req.user;
      const { levelNumber } = req.body;
      const result = await monetizationService.skipLevel(playerId, levelNumber);
      if (!result.success) {
        const status = result.error === 'insufficient_coins' ? 400 : 409;
        return res.status(status).json({ success: false, error: result.error, requestId: req.requestId });
      }
      return res.json({ success: true, ...result, requestId: req.requestId });
    } catch (error) {
      logger.error('Level skip failed', { error: error.message });
      return res.status(500).json({ success: false, error: 'skip_failed', requestId: req.requestId });
    }
  },
);

/**
 * POST /api/monetization/streak-freeze
 * Purchase a streak freeze with coins (24h). Returns a Stripe checkout if paying with USD.
 * Body: { payWith: 'coins' | 'usd' }
 */
router.post(
  '/streak-freeze',
  security.sessionValidation,
  [body('payWith').optional().isIn(['coins', 'usd']).withMessage("payWith must be 'coins' or 'usd'")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const { playerId } = req.user;
      const { payWith = 'coins' } = req.body;

      if (payWith === 'usd') {
        // Create a checkout for the streak freeze product
        const result = await monetizationService.createStreakFreezeCheckout(playerId);
        if (!result.success) {
          return res.status(400).json({ success: false, error: result.error, requestId: req.requestId });
        }
        return res.json({ success: true, payWith: 'usd', ...result, requestId: req.requestId });
      }

      const result = await monetizationService.purchaseStreakFreeze(playerId, { payWith: 'coins' });
      if (!result.success) {
        const status = result.error === 'insufficient_coins' ? 400 : 409;
        return res.status(status).json({ success: false, error: result.error, requestId: req.requestId });
      }
      return res.json({ success: true, payWith: 'coins', ...result, requestId: req.requestId });
    } catch (error) {
      logger.error('Streak freeze purchase failed', { error: error.message });
      return res.status(500).json({ success: false, error: 'streak_freeze_failed', requestId: req.requestId });
    }
  },
);

/**
 * POST /api/monetization/life-refill
 * Create a Stripe checkout session for an instant life refill (5 lives).
 */
router.post(
  '/life-refill',
  security.sessionValidation,
  async (req, res) => {
    try {
      const { playerId } = req.user;
      const result = await monetizationService.createLifeRefillCheckout(playerId);
      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error, requestId: req.requestId });
      }
      return res.json({ success: true, ...result, requestId: req.requestId });
    } catch (error) {
      logger.error('Life refill checkout failed', { error: error.message });
      return res.status(500).json({ success: false, error: 'life_refill_failed', requestId: req.requestId });
    }
  },
);

/**
 * POST /api/ads/rewarded
 * Grant a reward for watching a rewarded ad.
 * Body: { rewardType: 'coins' | 'lives' }
 */
router.post(
  '/ads/rewarded',
  security.sessionValidation,
  [body('rewardType').isIn(['coins', 'lives']).withMessage("rewardType must be 'coins' or 'lives'")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const { playerId } = req.user;
      const { rewardType } = req.body;
      const result = await monetizationService.grantAdReward(playerId, rewardType);
      if (!result.success) {
        const status = result.error === 'daily_ad_limit_reached' ? 409 : 400;
        return res.status(status).json({ success: false, error: result.error, requestId: req.requestId });
      }
      return res.json({ success: true, ...result, requestId: req.requestId });
    } catch (error) {
      logger.error('Ad reward grant failed', { error: error.message });
      return res.status(500).json({ success: false, error: 'ad_reward_failed', requestId: req.requestId });
    }
  },
);

export default router;
