/**
 * MarketPricingService - adjusts pricing based on real-time market data.
 */
export class MarketPricingService {
    constructor(marketResearchEngine?: null);
    logger: Logger;
    marketResearch: MarketResearchEngine;
    marketData: Map<any, any>;
    priceAdjustments: Map<any, any>;
    priceCache: Map<any, any>;
    lastRefreshMs: number;
    refreshIntervalMs: number;
    maxCompetitors: number;
    marketDataTtlMs: number;
    /**
     * Evict expired market data entries and enforce max competitor count.
     */
    _evictData({ nowMs }?: {
        nowMs?: number | undefined;
    }): void;
    /**
     * Refresh market data from all monitored competitors.
     */
    refreshMarketData({ nowMs }?: {
        nowMs?: number | undefined;
    }): Promise<{
        refreshed: boolean;
        competitors: any;
    }>;
    /**
     * Get market-adjusted price for an offer type.
     * Compares our price against competitors and suggests an adjustment.
     * Uses cached result when available.
     */
    getAdjustedPrice(offerType: any, ourBasePriceCents: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): Promise<any>;
    /**
     * Get all current market-adjusted prices for the offer catalog.
     */
    getMarketPricingCatalog(baseCatalog: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): Promise<any[]>;
    gatherCompetitorPrices(offerType: any): any[];
    getActiveCompetitorPromotions(nowMs: any): any[];
    /**
     * Get market context summary for display in admin dashboards.
     */
    getMarketSummary(): {
        competitorCount: number;
        totalPromotions: any;
        activePromotions: any;
        lastRefreshMs: number;
        priceAdjustments: any[];
    };
    /**
     * Clear all caches (testing / memory pressure).
     */
    clearCache(): void;
}
export default MarketPricingService;
import { Logger } from '../../core/logger/index.js';
import { MarketResearchEngine } from '../market-research-engine.js';
//# sourceMappingURL=market-pricing-service.d.ts.map