import { describe, expect, test } from '@jest/globals';
import { OffersService, OFFER_CATALOG } from '../services/offers/OffersService.js';

describe('offer expiry validation', () => {
  const service = new OffersService();
  const now = Date.now();

  test('validateOffer returns valid for eligible offer', () => {
    const result = service.validateOffer('pack_starter', {
      playerId: 'p1',
      level: 5,
      totalSpentUsd: 0,
    });
    expect(result.valid).toBe(true);
    expect(result.priceCents).toBeLessThan(OFFER_CATALOG.find((o) => o.sku === 'pack_starter')!.basePriceUsd * 100);
  });

  test('validateOffer returns invalid for unknown offer', () => {
    const result = service.validateOffer('nonexistent', {});
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('unknown_offer');
  });

  test('validateOffer returns invalid for ineligible segment', () => {
    const result = service.validateOffer('pack_whale', {
      playerId: 'p1',
      level: 5,
      totalSpentUsd: 0,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('offer_not_eligible');
  });

  test('validateOffer returns invalid for expired flash sale', () => {
    const result = service.validateOffer('pack_flash_sale', {
      playerId: 'p1',
      level: 50,
      totalSpentUsd: 0,
      offerSeenAt: new Date(now - 2 * 3600 * 1000).toISOString(), // seen 2 hours ago
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('offer_expired');
  });

  test('validateOffer returns valid for non-expired flash sale', () => {
    const result = service.validateOffer('pack_flash_sale', {
      playerId: 'p1',
      level: 50,
      totalSpentUsd: 0,
      offerSeenAt: new Date(now - 30 * 60 * 1000).toISOString(), // seen 30 min ago
    });
    expect(result.valid).toBe(true);
  });

  test('validateOffer returns invalid when purchase limit reached', () => {
    const result = service.validateOffer('pack_starter', {
      playerId: 'p1',
      level: 5,
      totalSpentUsd: 0,
      purchases: ['pack_starter'],
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('purchase_limit_reached');
  });

  test('getOffers excludes expired flash sales', () => {
    const offers = service.getOffers({
      playerId: 'p1',
      level: 50,
      totalSpentUsd: 0,
      offerSeenAt: new Date(now - 2 * 3600 * 1000).toISOString(), // seen 2 hours ago
    });
    const flashSale = offers.find((o) => o.sku === 'pack_flash_sale');
    expect(flashSale).toBeUndefined();
  });
});
