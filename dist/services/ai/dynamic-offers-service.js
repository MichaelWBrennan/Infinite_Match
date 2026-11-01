/**
 * Dynamic Offers Service - per-player personalized offers and dynamic pricing.
 * Uses the AI Personalization Engine to predict LTV and churn risk, then
 * generates server-computed, time-boxed offers. Clients cannot invent prices.
 */
import { Logger } from '../../core/logger/index.js';
import { OffersService } from '../offers/OffersService.js';
import { AIPersonalizationEngine } from '../ai-personalization-engine.js';
const logger = new Logger('DynamicOffersService');
const DEFAULT_BASE_COST_CENTS = 99; // $0.99 anchor
const MAX_CACHE_SIZE = 500;
const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_OFFERS_PER_PLAYER = 50;
/**
 * DynamicOffersService - generates personalized, dynamically-priced offers.
 */
export class DynamicOffersService {
    constructor(offersService = null, personalizationEngine = null) {
        this.logger = new Logger('DynamicOffersService');
        this.offersService = offersService || new OffersService();
        this.personalizationEngine = personalizationEngine || new AIPersonalizationEngine();
        this.playerOfferCache = new Map();
        this.cacheTtlMs = CACHE_TTL_MS;
        this.maxCacheSize = MAX_CACHE_SIZE;
        this.priceComputeCache = new Map();
        this.priceCacheTtlMs = 30 * 60 * 1000;
    }
    /**
     * Evict expired player offer cache entries and enforce max size.
     */
    _evictCache() {
        const now = Date.now();
        // Remove expired entries
        for (const [playerId, cached] of this.playerOfferCache) {
            if (now - cached.generatedAt > this.cacheTtlMs) {
                this.playerOfferCache.delete(playerId);
            }
        }
        // Enforce max size - evict oldest entries
        while (this.playerOfferCache.size > this.maxCacheSize) {
            let oldestKey = null;
            let oldestTime = Infinity;
            for (const [key, cached] of this.playerOfferCache) {
                if (cached.generatedAt < oldestTime) {
                    oldestTime = cached.generatedAt;
                    oldestKey = key;
                }
            }
            if (oldestKey)
                this.playerOfferCache.delete(oldestKey);
        }
        // Evict expired price computations
        for (const [key, { generatedAt }] of this.priceComputeCache) {
            if (now - generatedAt > this.priceCacheTtlMs) {
                this.priceComputeCache.delete(key);
            }
        }
    }
    /**
     * Get personalized offers for a player.
     * Returns a list of offers with player-specific pricing/discounts.
     */
    async getPersonalizedOffers(playerId, { nowMs = Date.now(), context = {} } = {}) {
        // Check cache
        const cached = this.playerOfferCache.get(playerId);
        if (cached && nowMs - cached.generatedAt < this.cacheTtlMs) {
            return { ...cached, fromCache: true };
        }
        // Get base catalog from existing OffersService
        let baseOffers = [];
        try {
            baseOffers = this.offersService.getOffers(playerId) || [];
        }
        catch (error) {
            logger.warn('Could not fetch base offers, using defaults', { playerId, error: error.message });
            baseOffers = this.getDefaultCatalog();
        }
        // Get AI monetization prediction for this player
        let monetizationProfile = null;
        try {
            monetizationProfile = await this.personalizationEngine.predictMonetizationBehavior({
                spendHistory: context.spendHistory || [],
                sessionCount: context.sessionCount || 0,
                lastSessionMs: context.lastSessionMs || nowMs,
                winRate: context.winRate || 0.5,
            });
        }
        catch (error) {
            logger.warn('AI monetization prediction unavailable, using defaults', {
                playerId, error: error.message,
            });
        }
        const ltvScore = monetizationProfile?.ltvScore ?? 0.5; // 0.0-1.0
        const churnRisk = monetizationProfile?.churnProbability ?? 0.2;
        const monetizationAcceptance = monetizationProfile?.monetizationAcceptance ?? 'medium';
        // Build personalized offers with O(1) offer index
        const personalized = [];
        const offerIndex = new Map();
        for (const offer of baseOffers) {
            if (personalized.length >= MAX_OFFERS_PER_PLAYER)
                break;
            const dynamic = this.computeDynamicOffer(offer.id, offer, {
                ltvScore, churnRisk, monetizationAcceptance,
            });
            const entry = {
                ...offer,
                ...dynamic,
                playerId,
                generatedAt: nowMs,
                expiresAt: nowMs + 24 * 60 * 60 * 1000, // 24 hours
                dynamic: true,
            };
            personalized.push(entry);
            offerIndex.set(offer.id, entry);
        }
        // Add a churn-rescue offer if risk is high
        if (churnRisk > 0.6 && personalized.length < MAX_OFFERS_PER_PLAYER) {
            const rescue = this.buildChurnRescueOffer(nowMs, playerId);
            personalized.push(rescue);
            offerIndex.set(rescue.id, rescue);
        }
        // Add a high-LTV premium offer if acceptance is high
        if (ltvScore > 0.7 && monetizationAcceptance === 'high' && personalized.length < MAX_OFFERS_PER_PLAYER) {
            const whale = this.buildWhalePremiumOffer(nowMs, playerId);
            personalized.push(whale);
            offerIndex.set(whale.id, whale);
        }
        const result = {
            playerId,
            offers: personalized,
            generatedAt: nowMs,
            fromCache: false,
            aiInformed: !!monetizationProfile,
            offerIndex,
        };
        // Cache
        this.playerOfferCache.set(playerId, { ...result, generatedAt: nowMs });
        this._evictCache();
        logger.info('Generated personalized offers', {
            playerId, offerCount: personalized.length, ltvScore: ltvScore.toFixed(2),
            churnRisk: churnRisk.toFixed(2), aiInformed: !!monetizationProfile,
        });
        return result;
    }
    /**
     * Compute dynamic price/discount for a single offer.
     * Uses cached computation when possible.
     */
    computeDynamicOffer(offerId, offer, { ltvScore, churnRisk, monetizationAcceptance }) {
        const cacheKey = `${offerId}:${ltvScore.toFixed(2)}:${churnRisk.toFixed(2)}:${monetizationAcceptance}`;
        const now = Date.now();
        const cached = this.priceComputeCache.get(cacheKey);
        if (cached && now - cached.generatedAt < this.priceCacheTtlMs) {
            return cached.result;
        }
        const baseCostCents = offer.baseCostCents ?? DEFAULT_BASE_COST_CENTS;
        const baseDiscount = offer.discountPercent ?? 0;
        let finalPriceCents = baseCostCents;
        let finalDiscount = baseDiscount;
        // Churn rescue: deeper discount for players at risk of leaving
        if (churnRisk > 0.6) {
            finalDiscount = Math.min(70, baseDiscount + 25);
            finalPriceCents = Math.round(baseCostCents * (1 - finalDiscount / 100));
        }
        else if (churnRisk > 0.4) {
            finalDiscount = Math.min(50, baseDiscount + 15);
            finalPriceCents = Math.round(baseCostCents * (1 - finalDiscount / 100));
        }
        // LTV-based premium: charge slightly more to whales who accept it
        if (ltvScore > 0.7 && monetizationAcceptance === 'high') {
            finalPriceCents = Math.round(baseCostCents * 1.15);
            finalDiscount = Math.max(0, baseDiscount - 5);
        }
        else if (ltvScore < 0.3) {
            // Price-sensitive: ensure it's affordable
            finalPriceCents = Math.min(finalPriceCents, Math.round(baseCostCents * 0.85));
        }
        // Round to price psychology (.99 endings)
        finalPriceCents = Math.max(49, Math.round(finalPriceCents / 100) * 100 - 1);
        const result = {
            priceCents: finalPriceCents,
            discountPercent: finalDiscount,
            originalPriceCents: baseCostCents,
            priceTier: this.getPriceTier(finalPriceCents),
            dynamicReason: this.explainPricing({ ltvScore, churnRisk, monetizationAcceptance }),
        };
        this.priceComputeCache.set(cacheKey, { result, generatedAt: now });
        return result;
    }
    /**
     * Build a churn-rescue offer (deep discount, high value).
     */
    buildChurnRescueOffer(nowMs, playerId) {
        return {
            id: `churn-rescue-${playerId}-${nowMs}`,
            type: 'churn_rescue',
            name: 'Comeback Bundle',
            description: "We've missed you. Here's a special welcome-back deal.",
            baseCostCents: 499,
            priceCents: 199,
            discountPercent: 60,
            originalPriceCents: 499,
            priceTier: 'budget',
            contents: { coins: 5000, lives: 5, boosters: { colorBomb: 3, hammer: 3 } },
            oneTimeUse: true,
            playerId,
            generatedAt: nowMs,
            expiresAt: nowMs + 48 * 60 * 60 * 1000, // 48 hours
            dynamic: true,
            dynamicReason: 'churn_rescue',
        };
    }
    /**
     * Build a whale premium offer (expensive, high value).
     */
    buildWhalePremiumOffer(nowMs, playerId) {
        return {
            id: `whale-premium-${playerId}-${nowMs}`,
            type: 'premium',
            name: "Player's Ultimate Pack",
            description: 'For our most dedicated players. Maximum value, minimum friction.',
            baseCostCents: 4999,
            priceCents: 4499,
            discountPercent: 10,
            originalPriceCents: 4999,
            priceTier: 'premium',
            contents: { coins: 50000, lives: 25, boosters: { colorBomb: 20, hammer: 20, swap: 20 } },
            oneTimeUse: false,
            playerId,
            generatedAt: nowMs,
            expiresAt: nowMs + 7 * 24 * 60 * 60 * 1000, // 7 days
            dynamic: true,
            dynamicReason: 'high_ltv_premium',
        };
    }
    /**
     * Validate and finalize a dynamic offer before purchase.
     * Ensures the price hasn't been tampered with client-side.
     * O(1) lookup via offerIndex Map.
     */
    validateDynamicOffer(playerId, offerId, { nowMs = Date.now() } = {}) {
        const cached = this.playerOfferCache.get(playerId);
        if (!cached) {
            return { valid: false, reason: 'No offers generated for player' };
        }
        const offer = cached.offerIndex?.get(offerId) ?? cached.offers.find((o) => o.id === offerId);
        if (!offer) {
            return { valid: false, reason: 'Offer not found' };
        }
        if (nowMs > offer.expiresAt) {
            return { valid: false, reason: 'Offer expired' };
        }
        if (offer.oneTimeUse && offer.claimed) {
            return { valid: false, reason: 'Offer already claimed' };
        }
        return { valid: true, offer, priceCents: offer.priceCents };
    }
    /**
     * Mark an offer as claimed (one-time use).
     * O(1) lookup via offerIndex Map.
     */
    markClaimed(playerId, offerId) {
        const cached = this.playerOfferCache.get(playerId);
        if (!cached)
            return false;
        const offer = cached.offerIndex?.get(offerId) ?? cached.offers.find((o) => o.id === offerId);
        if (offer && offer.oneTimeUse) {
            offer.claimed = true;
            return true;
        }
        return false;
    }
    getPriceTier(priceCents) {
        if (priceCents <= 199)
            return 'budget';
        if (priceCents <= 999)
            return 'standard';
        if (priceCents <= 2499)
            return 'premium';
        return 'whale';
    }
    explainPricing({ ltvScore, churnRisk, monetizationAcceptance }) {
        if (churnRisk > 0.6)
            return 'churn_rescue_discount';
        if (ltvScore > 0.7 && monetizationAcceptance === 'high')
            return 'premium_whale_pricing';
        if (ltvScore < 0.3)
            return 'price_sensitive_discount';
        return 'standard_dynamic_pricing';
    }
    getDefaultCatalog() {
        return [
            {
                id: 'starter-pack',
                type: 'bundle',
                name: 'Starter Pack',
                description: 'Coins and lives to get you started.',
                baseCostCents: 99,
                discountPercent: 0,
                contents: { coins: 1000, lives: 3 },
            },
            {
                id: 'booster-bundle',
                type: 'boosters',
                name: 'Booster Bundle',
                description: 'Essential boosters for tough levels.',
                baseCostCents: 299,
                discountPercent: 10,
                contents: { boosters: { hammer: 5, colorBomb: 3 } },
            },
            {
                id: 'life-refill',
                type: 'consumable',
                name: 'Life Refill',
                description: 'Instantly restore all lives.',
                baseCostCents: 199,
                discountPercent: 0,
                contents: { lives: 5 },
            },
        ];
    }
    /**
     * Clear all caches (testing / memory pressure).
     */
    clearCache() {
        this.playerOfferCache.clear();
        this.priceComputeCache.clear();
    }
}
export default DynamicOffersService;
//# sourceMappingURL=dynamic-offers-service.js.map