/**
 * Offer personalization service.
 *
 * Generates personalized in-game store offers for a player based on their
 * profile, segments, and behavior. Integrates with the CRM segment system
 * so that whales, nonpayers, lapsed players, VIPs, and streak keepers each
 * see offers tuned to their behavior.
 *
 * Offer prices are computed dynamically: each offer has a base USD price and
 * an optional segment-specific discount. The final price is always determined
 * server-side and never trusted from the client.
 */

import { computeSegments, getSegment } from '../crm/crm-service.js';
import { Logger } from '../../core/logger/index.js';

const logger = new Logger('OffersService');

/**
 * Base offer catalog. Each offer:
 *   sku            - unique offer identifier
 *   label          - display name
 *   productId      - catalog product this maps to (for purchase)
 *   basePriceUsd   - base price in USD
 *   currency       - 'usd'
 *   segments       - segment ids eligible for this offer
 *   segmentDiscounts - optional map of segmentId -> discount fraction (0-1)
 *   maxPurchases   - optional limit on how many times a player can buy this
 *   reasonTemplate - human-readable reason for why the offer is shown
 */
const OFFER_CATALOG = Object.freeze([
  {
    sku: 'pack_starter',
    label: 'Starter Pack',
    productId: 'coins_small',
    basePriceUsd: 0.99,
    currency: 'usd',
    segments: ['newbie', 'nonpayer'],
    segmentDiscounts: { newbie: 0.5, nonpayer: 0.4 },
    maxPurchases: 1,
    reasonTemplate: 'A starter pack just for new players',
  },
  {
    sku: 'pack_value',
    label: 'Value Pack',
    productId: 'coins_medium',
    basePriceUsd: 4.99,
    currency: 'usd',
    segments: ['payer', 'nonpayer'],
    segmentDiscounts: { payer: 0.2 },
    maxPurchases: 3,
    reasonTemplate: 'Great value on coins',
  },
  {
    sku: 'pack_whale',
    label: 'Whale Pack',
    productId: 'coins_large',
    basePriceUsd: 19.99,
    currency: 'usd',
    segments: ['whale'],
    segmentDiscounts: { whale: 0.15 },
    maxPurchases: 10,
    reasonTemplate: 'Exclusive offer for top spenders',
  },
  {
    sku: 'pack_comeback',
    label: 'Welcome Back Pack',
    productId: 'coins_small',
    basePriceUsd: 1.99,
    currency: 'usd',
    segments: ['lapsed_7d', 'lapsed_30d'],
    segmentDiscounts: { lapsed_7d: 0.5, lapsed_30d: 0.7 },
    maxPurchases: 1,
    reasonTemplate: "Welcome back! Here's a special offer",
  },
  {
    sku: 'pack_streak',
    label: 'Streak Reward Pack',
    productId: 'coins_medium',
    basePriceUsd: 3.99,
    currency: 'usd',
    segments: ['streak_keeper'],
    segmentDiscounts: { streak_keeper: 0.25 },
    maxPurchases: 1,
    reasonTemplate: 'Reward for keeping your streak alive',
  },
  {
    sku: 'pack_vip',
    label: 'VIP Bonus Pack',
    productId: 'coins_medium',
    basePriceUsd: 4.99,
    currency: 'usd',
    segments: ['vip'],
    segmentDiscounts: { vip: 0.3 },
    maxPurchases: 5,
    reasonTemplate: 'VIP-exclusive discount',
  },
  {
    sku: 'pack_flash_sale',
    label: 'Flash Sale',
    productId: 'coins_large',
    basePriceUsd: 9.99,
    currency: 'usd',
    segments: [],
    segmentDiscounts: {},
    maxPurchases: 1,
    reasonTemplate: 'Limited-time flash sale',
    expiresInSeconds: 3600,
  },
]);

/**
 * Computes the final price for an offer for a given player profile.
 * Applies segment-specific discounts. Returns { priceCents, discount, reason }.
 */
function computeOfferPrice(offer, profile) {
  const playerSegments = new Set(computeSegments(profile));
  let bestDiscount = 0;
  let matchedSegment = null;

  for (const segmentId of offer.segments) {
    if (playerSegments.has(segmentId)) {
      const discount = (offer.segmentDiscounts && offer.segmentDiscounts[segmentId]) || 0;
      if (discount > bestDiscount) {
        bestDiscount = discount;
        matchedSegment = segmentId;
      }
    }
  }

  const priceUsd = offer.basePriceUsd * (1 - bestDiscount);
  const priceCents = Math.round(priceUsd * 100);

  let reason = offer.reasonTemplate;
  if (matchedSegment) {
    const segmentLabel = getSegment(matchedSegment)?.label || matchedSegment;
    reason = `${reason} (${segmentLabel})`;
  }

  return { priceCents, discount: bestDiscount, reason, matchedSegment };
}

/**
 * Generates personalized offers for a player profile.
 * Returns an array of offers with computed prices, discounts, and eligibility.
 */
export class OffersService {
  constructor() {}

  getOffers(profile = {}) {
    const now = Date.now();
    const offers = [];
    const playerSegments = new Set(computeSegments(profile));

    for (const offer of OFFER_CATALOG) {
      // Skip expired flash sales
      if (offer.expiresInSeconds && profile.offerSeenAt) {
        const seenAt = new Date(profile.offerSeenAt).getTime();
        if (now - seenAt > offer.expiresInSeconds * 1000) continue;
      }

      // Check segment eligibility: offer with no segments is available to all (e.g. flash sale)
      const eligible =
        offer.segments.length === 0 ||
        offer.segments.some((s) => playerSegments.has(s));

      if (!eligible) continue;

      // Check purchase limit
      const alreadyPurchased = (profile.purchases || []).includes(offer.sku);
      if (offer.maxPurchases && alreadyPurchased >= offer.maxPurchases) continue;

      const pricing = computeOfferPrice(offer, profile);

      offers.push({
        sku: offer.sku,
        label: offer.label,
        productId: offer.productId,
        priceCents: pricing.priceCents,
        basePriceUsd: offer.basePriceUsd,
        currency: offer.currency,
        discount: pricing.discount,
        reason: pricing.reason,
        matchedSegment: pricing.matchedSegment,
        maxPurchases: offer.maxPurchases,
        alreadyPurchased,
        expiresInSeconds: offer.expiresInSeconds || null,
      });
    }

    // Sort: offers with higher discounts first, then by price ascending
    offers.sort((a, b) => b.discount - a.discount || a.priceCents - b.priceCents);

    logger.info('Generated personalized offers', {
      count: offers.length,
      segments: Array.from(playerSegments),
    });
    return offers;
  }
}

export default OffersService;
