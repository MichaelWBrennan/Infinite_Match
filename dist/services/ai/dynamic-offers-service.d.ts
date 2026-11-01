/**
 * DynamicOffersService - generates personalized, dynamically-priced offers.
 */
export class DynamicOffersService {
    constructor(offersService?: null, personalizationEngine?: null);
    logger: Logger;
    offersService: OffersService;
    personalizationEngine: AIPersonalizationEngine;
    playerOfferCache: Map<any, any>;
    cacheTtlMs: number;
    maxCacheSize: number;
    priceComputeCache: Map<any, any>;
    priceCacheTtlMs: number;
    /**
     * Evict expired player offer cache entries and enforce max size.
     */
    _evictCache(): void;
    /**
     * Get personalized offers for a player.
     * Returns a list of offers with player-specific pricing/discounts.
     */
    getPersonalizedOffers(playerId: any, { nowMs, context }?: {
        nowMs?: number | undefined;
        context?: {} | undefined;
    }): Promise<any>;
    /**
     * Compute dynamic price/discount for a single offer.
     * Uses cached computation when possible.
     */
    computeDynamicOffer(offerId: any, offer: any, { ltvScore, churnRisk, monetizationAcceptance }: {
        ltvScore: any;
        churnRisk: any;
        monetizationAcceptance: any;
    }): any;
    /**
     * Build a churn-rescue offer (deep discount, high value).
     */
    buildChurnRescueOffer(nowMs: any, playerId: any): {
        id: string;
        type: string;
        name: string;
        description: string;
        baseCostCents: number;
        priceCents: number;
        discountPercent: number;
        originalPriceCents: number;
        priceTier: string;
        contents: {
            coins: number;
            lives: number;
            boosters: {
                colorBomb: number;
                hammer: number;
            };
        };
        oneTimeUse: boolean;
        playerId: any;
        generatedAt: any;
        expiresAt: any;
        dynamic: boolean;
        dynamicReason: string;
    };
    /**
     * Build a whale premium offer (expensive, high value).
     */
    buildWhalePremiumOffer(nowMs: any, playerId: any): {
        id: string;
        type: string;
        name: string;
        description: string;
        baseCostCents: number;
        priceCents: number;
        discountPercent: number;
        originalPriceCents: number;
        priceTier: string;
        contents: {
            coins: number;
            lives: number;
            boosters: {
                colorBomb: number;
                hammer: number;
                swap: number;
            };
        };
        oneTimeUse: boolean;
        playerId: any;
        generatedAt: any;
        expiresAt: any;
        dynamic: boolean;
        dynamicReason: string;
    };
    /**
     * Validate and finalize a dynamic offer before purchase.
     * Ensures the price hasn't been tampered with client-side.
     * O(1) lookup via offerIndex Map.
     */
    validateDynamicOffer(playerId: any, offerId: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): {
        valid: boolean;
        reason: string;
        offer?: never;
        priceCents?: never;
    } | {
        valid: boolean;
        offer: any;
        priceCents: any;
        reason?: never;
    };
    /**
     * Mark an offer as claimed (one-time use).
     * O(1) lookup via offerIndex Map.
     */
    markClaimed(playerId: any, offerId: any): boolean;
    getPriceTier(priceCents: any): "whale" | "budget" | "standard" | "premium";
    explainPricing({ ltvScore, churnRisk, monetizationAcceptance }: {
        ltvScore: any;
        churnRisk: any;
        monetizationAcceptance: any;
    }): "churn_rescue_discount" | "premium_whale_pricing" | "price_sensitive_discount" | "standard_dynamic_pricing";
    getDefaultCatalog(): ({
        id: string;
        type: string;
        name: string;
        description: string;
        baseCostCents: number;
        discountPercent: number;
        contents: {
            coins: number;
            lives: number;
            boosters?: never;
        };
    } | {
        id: string;
        type: string;
        name: string;
        description: string;
        baseCostCents: number;
        discountPercent: number;
        contents: {
            boosters: {
                hammer: number;
                colorBomb: number;
            };
            coins?: never;
            lives?: never;
        };
    } | {
        id: string;
        type: string;
        name: string;
        description: string;
        baseCostCents: number;
        discountPercent: number;
        contents: {
            lives: number;
            coins?: never;
            boosters?: never;
        };
    })[];
    /**
     * Clear all caches (testing / memory pressure).
     */
    clearCache(): void;
}
export default DynamicOffersService;
import { Logger } from '../../core/logger/index.js';
import { OffersService } from '../offers/OffersService.js';
import { AIPersonalizationEngine } from '../ai-personalization-engine.js';
//# sourceMappingURL=dynamic-offers-service.d.ts.map