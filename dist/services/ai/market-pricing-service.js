/**
 * Market Pricing Service - market-responsive pricing via competitor monitoring.
 * Tracks competitor prices and promotions; adjusts our pricing to stay
 * competitive without a race to the bottom.
 */
import { Logger } from '../../core/logger/index.js';
import { MarketResearchEngine } from '../market-research-engine.js';
const logger = new Logger('MarketPricingService');
const DEFAULT_MARKUP = 1.0;
const COMPETITIVE_WINDOW_HOURS = 24;
const MAX_COMPETITORS = 50;
const MARKET_DATA_TTL_MS = 6 * 60 * 60 * 1000;
const PRICE_CACHE_TTL_MS = 30 * 60 * 1000;
/**
 * MarketPricingService - adjusts pricing based on real-time market data.
 */
export class MarketPricingService {
    constructor(marketResearchEngine = null) {
        this.logger = new Logger('MarketPricingService');
        this.marketResearch = marketResearchEngine || new MarketResearchEngine();
        this.marketData = new Map();
        this.priceAdjustments = new Map();
        this.priceCache = new Map();
        this.lastRefreshMs = 0;
        this.refreshIntervalMs = 6 * 60 * 60 * 1000;
        this.maxCompetitors = MAX_COMPETITORS;
        this.marketDataTtlMs = MARKET_DATA_TTL_MS;
    }
    /**
     * Evict expired market data entries and enforce max competitor count.
     */
    _evictData({ nowMs = Date.now() } = {}) {
        // Remove expired competitor data
        for (const [compId, data] of this.marketData) {
            if (nowMs - data.lastSeenMs > this.marketDataTtlMs) {
                this.marketData.delete(compId);
            }
        }
        // Enforce max competitors - remove oldest
        while (this.marketData.size > this.maxCompetitors) {
            let oldestKey = null;
            let oldestTime = Infinity;
            for (const [key, data] of this.marketData) {
                if (data.lastSeenMs < oldestTime) {
                    oldestTime = data.lastSeenMs;
                    oldestKey = key;
                }
            }
            if (oldestKey)
                this.marketData.delete(oldestKey);
        }
        // Evict expired price cache entries
        for (const [key, { generatedAt }] of this.priceCache) {
            if (nowMs - generatedAt > PRICE_CACHE_TTL_MS) {
                this.priceCache.delete(key);
            }
        }
    }
    /**
     * Refresh market data from all monitored competitors.
     */
    async refreshMarketData({ nowMs = Date.now() } = {}) {
        if (nowMs - this.lastRefreshMs < this.refreshIntervalMs && this.marketData.size > 0) {
            return { refreshed: false, competitors: this.marketData.size };
        }
        this._evictData({ nowMs });
        let competitors = [];
        try {
            competitors = await this.marketResearch.monitorAllCompetitors();
        }
        catch (error) {
            logger.warn('Market research refresh failed, using cached data', { error: error.message });
        }
        for (const comp of competitors) {
            this.marketData.set(comp.id, {
                ...comp,
                lastSeenMs: nowMs,
            });
        }
        this.lastRefreshMs = nowMs;
        logger.info('Refreshed market data', { competitorCount: competitors.length });
        return { refreshed: true, competitors: competitors.length };
    }
    /**
     * Get market-adjusted price for an offer type.
     * Compares our price against competitors and suggests an adjustment.
     * Uses cached result when available.
     */
    async getAdjustedPrice(offerType, ourBasePriceCents, { nowMs = Date.now() } = {}) {
        await this.refreshMarketData({ nowMs });
        // Check price cache
        const priceCacheKey = `${offerType}:${ourBasePriceCents}`;
        const cached = this.priceCache.get(priceCacheKey);
        if (cached && nowMs - cached.generatedAt < PRICE_CACHE_TTL_MS) {
            return cached.result;
        }
        const competitorPrices = this.gatherCompetitorPrices(offerType);
        if (competitorPrices.length === 0) {
            const result = {
                adjustedPriceCents: ourBasePriceCents,
                adjustmentPercent: 0,
                reason: 'no_market_data',
                competitorCount: 0,
            };
            this.priceCache.set(priceCacheKey, { result, generatedAt: nowMs });
            return result;
        }
        const avgCompetitorPrice = competitorPrices.reduce((sum, p) => sum + p.priceCents, 0) / competitorPrices.length;
        const minCompetitorPrice = Math.min(...competitorPrices.map((p) => p.priceCents));
        let adjustmentPercent = 0;
        let reason = 'market_aligned';
        // If we're significantly above market average, adjust down toward average
        if (ourBasePriceCents > avgCompetitorPrice * 1.2) {
            adjustmentPercent = -15; // 15% below our price
            reason = 'above_market_adjust_down';
        }
        else if (ourBasePriceCents < minCompetitorPrice * 0.8) {
            // We're cheapest - could raise slightly or stay
            adjustmentPercent = 0;
            reason = 'price_leader';
        }
        else {
            // Within competitive range - slight adjustment toward average
            adjustmentPercent = Math.round(((avgCompetitorPrice - ourBasePriceCents) / ourBasePriceCents) * 100 * 0.5);
            reason = 'market_aligned';
        }
        const adjustedPriceCents = Math.max(49, Math.round(ourBasePriceCents * (1 + adjustmentPercent / 100) / 100) * 100 - 1);
        const result = {
            adjustedPriceCents,
            adjustmentPercent,
            reason,
            competitorCount: competitorPrices.length,
            avgCompetitorPriceCents: Math.round(avgCompetitorPrice),
            ourBasePriceCents,
            generatedAt: nowMs,
        };
        this.priceCache.set(priceCacheKey, { result, generatedAt: nowMs });
        this.priceAdjustments.set(offerType, result);
        return result;
    }
    /**
     * Get all current market-adjusted prices for the offer catalog.
     */
    async getMarketPricingCatalog(baseCatalog, { nowMs = Date.now() } = {}) {
        await this.refreshMarketData({ nowMs });
        const catalog = [];
        for (const offer of baseCatalog) {
            const adjusted = await this.getAdjustedPrice(offer.id, offer.baseCostCents, { nowMs });
            catalog.push({
                ...offer,
                ...adjusted,
                marketAdjusted: true,
            });
        }
        // Add market context (active competitor promotions we should respond to)
        const activePromotions = this.getActiveCompetitorPromotions(nowMs);
        if (activePromotions.length > 0) {
            catalog.push({
                id: 'market-response-promo',
                type: 'market_response',
                name: 'Market Match Promotion',
                description: 'Limited-time price match on our most popular bundle.',
                baseCostCents: 999,
                priceCents: 799,
                discountPercent: 20,
                marketAdjusted: true,
                reason: 'competitor_promotion_response',
                competitorPromotions: activePromotions,
                generatedAt: nowMs,
                expiresAt: nowMs + 48 * 60 * 60 * 1000,
            });
        }
        return catalog;
    }
    gatherCompetitorPrices(offerType) {
        const prices = [];
        for (const [compId, data] of this.marketData) {
            const compPrices = data.prices || [];
            for (const p of compPrices) {
                if (p.type === offerType || p.category === offerType) {
                    prices.push({ competitorId: compId, ...p });
                }
            }
        }
        return prices;
    }
    getActiveCompetitorPromotions(nowMs) {
        const promotions = [];
        for (const [compId, data] of this.marketData) {
            const promos = data.promotions || [];
            for (const promo of promos) {
                const startsAt = new Date(promo.startsAt).getTime();
                const endsAt = new Date(promo.endsAt).getTime();
                if (nowMs >= startsAt && nowMs < endsAt) {
                    promotions.push({ competitorId: compId, ...promo });
                }
            }
        }
        return promotions;
    }
    /**
     * Get market context summary for display in admin dashboards.
     */
    getMarketSummary() {
        const competitors = Array.from(this.marketData.values());
        const totalPromotions = competitors.reduce((sum, c) => sum + (c.promotions?.length || 0), 0);
        const activePromotions = competitors.reduce((sum, c) => {
            const now = Date.now();
            return sum + (c.promotions?.filter((p) => {
                const s = new Date(p.startsAt).getTime();
                const e = new Date(p.endsAt).getTime();
                return now >= s && now < e;
            }).length || 0);
        }, 0);
        return {
            competitorCount: competitors.length,
            totalPromotions,
            activePromotions,
            lastRefreshMs: this.lastRefreshMs,
            priceAdjustments: Array.from(this.priceAdjustments.entries()).map(([k, v]) => ({ offerType: k, ...v })),
        };
    }
    /**
     * Clear all caches (testing / memory pressure).
     */
    clearCache() {
        this.marketData.clear();
        this.priceCache.clear();
        this.priceAdjustments.clear();
        this.lastRefreshMs = 0;
    }
}
export default MarketPricingService;
//# sourceMappingURL=market-pricing-service.js.map