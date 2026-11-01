import { describe, expect, test } from '@jest/globals';
import { OffersService } from '../services/offers/OffersService.js';

describe('OffersService', () => {
  const service = new OffersService();

  test('newbie nonpayer gets starter pack with discount', () => {
    const offers = service.getOffers({
      playerId: 'p1',
      level: 5,
      totalSpentUsd: 0,
    });
    const starter = offers.find((o) => o.sku === 'pack_starter');
    expect(starter).toBeDefined();
    expect(starter!.discount).toBeGreaterThan(0);
    expect(starter!.priceCents).toBeLessThan(starter!.basePriceUsd * 100);
  });

  test('whale gets whale pack', () => {
    const offers = service.getOffers({
      playerId: 'p2',
      level: 100,
      totalSpentUsd: 100,
    });
    const whale = offers.find((o) => o.sku === 'pack_whale');
    expect(whale).toBeDefined();
    expect(whale!.matchedSegment).toBe('whale');
  });

  test('lapsed player gets comeback pack', () => {
    const offers = service.getOffers({
      playerId: 'p3',
      level: 20,
      totalSpentUsd: 0,
      lastPlay: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const comeback = offers.find((o) => o.sku === 'pack_comeback');
    expect(comeback).toBeDefined();
    expect(comeback!.discount).toBeGreaterThan(0);
  });

  test('VIP player gets VIP pack', () => {
    const offers = service.getOffers({
      playerId: 'p4',
      level: 30,
      totalSpentUsd: 5,
      hasVip: true,
    });
    const vip = offers.find((o) => o.sku === 'pack_vip');
    expect(vip).toBeDefined();
    expect(vip!.matchedSegment).toBe('vip');
  });

  test('already purchased offer at limit is filtered out', () => {
    const offers = service.getOffers({
      playerId: 'p5',
      level: 5,
      totalSpentUsd: 0,
      purchases: ['pack_starter'],
    });
    // pack_starter has maxPurchases: 1, so once purchased it's filtered out
    const starterInOffers = offers.filter((o) => o.sku === 'pack_starter');
    expect(starterInOffers.length).toBe(0);
  });

  test('offers are sorted by discount then price', () => {
    const offers = service.getOffers({
      playerId: 'p6',
      level: 50,
      totalSpentUsd: 0,
    });
    for (let i = 0; i < offers.length - 1; i++) {
      const a = offers[i];
      const b = offers[i + 1];
      expect(a.discount).toBeGreaterThanOrEqual(b.discount);
    }
  });

  test('empty profile returns offers eligible to all (flash sale)', () => {
    const offers = service.getOffers({});
    // Should at least return flash sale (no segments required)
    const hasFlash = offers.some((o) => o.sku === 'pack_flash_sale');
    expect(hasFlash).toBe(true);
  });
});
