/**
 * Market Pricing Service Tests - Phase 8.
 */

import { describe, expect, test, beforeEach } from '@jest/globals';
import { MarketPricingService } from '../services/ai/market-pricing-service.js';

describe('MarketPricingService', () => {
  let service: MarketPricingService;

  beforeEach(() => {
    service = new MarketPricingService();
  });

  test('returns base price when no market data available', async () => {
    const result = await service.getAdjustedPrice('starter-pack', 99);

    expect(result.adjustedPriceCents).toBe(99);
    expect(result.adjustmentPercent).toBe(0);
    expect(result.reason).toBe('no_market_data');
    expect(result.competitorCount).toBe(0);
  });

  test('adjusts price down when above market average', async () => {
    // Manually inject competitor data
    service.marketData.set('comp-a', {
      id: 'comp-a',
      lastSeenMs: Date.now(),
      prices: [
        { type: 'starter-pack', priceCents: 79, category: 'bundle' },
        { type: 'starter-pack', priceCents: 89, category: 'bundle' },
      ],
    });

    // Use a larger base price so the .99 rounding doesn't mask the adjustment
    const result = await service.getAdjustedPrice('starter-pack', 999);
    expect(result.adjustedPriceCents).toBeLessThan(999);
    expect(result.reason).toBe('above_market_adjust_down');
    expect(result.competitorCount).toBe(2);
    expect(result.adjustmentPercent).toBeLessThan(0);
  });

  test('keeps price when within competitive range', async () => {
    service.marketData.set('comp-b', {
      id: 'comp-b',
      lastSeenMs: Date.now(),
      prices: [
        { type: 'booster-bundle', priceCents: 280, category: 'boosters' },
        { type: 'booster-bundle', priceCents: 320, category: 'boosters' },
      ],
    });

    const result = await service.getAdjustedPrice('booster-bundle', 299);
    expect(result.competitorCount).toBe(2);
    expect(result.adjustedPriceCents).toBeGreaterThan(0);
  });

  test('getMarketPricingCatalog returns adjusted prices for all offers', async () => {
    service.marketData.set('comp-c', {
      id: 'comp-c',
      lastSeenMs: Date.now(),
      prices: [
        { type: 'starter-pack', priceCents: 79, category: 'bundle' },
      ],
    });

    const baseCatalog = [
      { id: 'starter-pack', type: 'bundle', name: 'Starter Pack', baseCostCents: 99, discountPercent: 0 },
    ];

    const catalog = await service.getMarketPricingCatalog(baseCatalog);
    expect(catalog.length).toBe(1);
    expect(catalog[0].marketAdjusted).toBe(true);
    expect(catalog[0].adjustedPriceCents).toBeDefined();
  });

  test('refreshMarketData returns refresh status', async () => {
    const result = await service.refreshMarketData();
    expect(result.refreshed).toBeDefined();
    expect(result.competitors).toBeDefined();
  });

  test('getMarketSummary returns competitor and promotion counts', async () => {
    service.marketData.set('comp-d', {
      id: 'comp-d',
      lastSeenMs: Date.now(),
      promotions: [
        { id: 'promo-1', startsAt: new Date(Date.now() - 86400000).toISOString(), endsAt: new Date(Date.now() + 86400000).toISOString() },
      ],
    });

    const summary = service.getMarketSummary();
    expect(summary.competitorCount).toBe(1);
    expect(summary.activePromotions).toBe(1);
    expect(summary.lastRefreshMs).toBeDefined();
  });
});
