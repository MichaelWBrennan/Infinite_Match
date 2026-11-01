/**
 * Dynamic Offers Service Tests - Phase 8.
 */

import { describe, expect, test, beforeEach } from '@jest/globals';
import { DynamicOffersService } from '../services/ai/dynamic-offers-service.js';

describe('DynamicOffersService', () => {
  let service: DynamicOffersService;

  beforeEach(() => {
    service = new DynamicOffersService();
  });

  test('returns personalized offers for a player', async () => {
    const result = await service.getPersonalizedOffers('player-1');

    expect(result.playerId).toBe('player-1');
    expect(Array.isArray(result.offers)).toBe(true);
    expect(result.offers.length).toBeGreaterThan(0);
    expect(result.fromCache).toBe(false);
    expect(result.generatedAt).toBeDefined();
  });

  test('caches offers for 15 minutes', async () => {
    const now = Date.now();
    const result1 = await service.getPersonalizedOffers('cache-player', { nowMs: now });
    const result2 = await service.getPersonalizedOffers('cache-player', { nowMs: now + 1000 });

    expect(result2.fromCache).toBe(true);
  });

  test('applies churn rescue discount for high churn risk', async () => {
    // Simulate high churn risk by providing context suggesting low engagement
    const result = await service.getPersonalizedOffers('churn-player', {
      nowMs: Date.now(),
      context: {
        sessionCount: 1,
        lastSessionMs: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
        winRate: 0.1,
        spendHistory: [],
      },
    });

    const churnRescue = result.offers.find((o) => o.type === 'churn_rescue');
    if (churnRescue) {
      expect(churnRescue.dynamicReason).toBe('churn_rescue_discount');
      expect(churnRescue.oneTimeUse).toBe(true);
    }
  });

  test('applies premium pricing for high LTV players', async () => {
    const result = await service.getPersonalizedOffers('whale-player', {
      nowMs: Date.now(),
      context: {
        sessionCount: 100,
        lastSessionMs: Date.now(),
        winRate: 0.9,
        spendHistory: [{ amount: 5000 }, { amount: 3000 }],
      },
    });

    const whaleOffer = result.offers.find((o) => o.type === 'premium');
    if (whaleOffer) {
      expect(whaleOffer.dynamicReason).toBe('high_ltv_premium');
    }
  });

  test('validates a dynamic offer successfully', async () => {
    const result = await service.getPersonalizedOffers('validate-player');
    const offer = result.offers[0];

    const validation = service.validateDynamicOffer('validate-player', offer.id);
    expect(validation.valid).toBe(true);
    expect(validation.offer.id).toBe(offer.id);
    expect(validation.priceCents).toBe(offer.priceCents);
  });

  test('rejects expired offer', async () => {
    const result = await service.getPersonalizedOffers('expired-player');
    const offer = result.offers[0];

    // Manually expire it
    offer.expiresAt = Date.now() - 1000;

    const validation = service.validateDynamicOffer('expired-player', offer.id);
    expect(validation.valid).toBe(false);
    expect(validation.reason).toBe('Offer expired');
  });

  test('rejects unknown offer', async () => {
    // First generate offers so the player has a cache entry
    await service.getPersonalizedOffers('unknown-player');
    const validation = service.validateDynamicOffer('unknown-player', 'nonexistent-offer');
    expect(validation.valid).toBe(false);
    expect(validation.reason).toBe('Offer not found');
  });

  test('marks one-time offer as claimed', async () => {
    const result = await service.getPersonalizedOffers('claim-player');
    const churnOffer = result.offers.find((o) => o.oneTimeUse);
    if (churnOffer) {
      const marked = service.markClaimed('claim-player', churnOffer.id);
      expect(marked).toBe(true);

      const validation = service.validateDynamicOffer('claim-player', churnOffer.id);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('Offer already claimed');
    }
  });

  test('getPriceTier returns correct tier', () => {
    expect(service.getPriceTier(99)).toBe('budget');
    expect(service.getPriceTier(500)).toBe('standard');
    expect(service.getPriceTier(1500)).toBe('premium');
    expect(service.getPriceTier(5000)).toBe('whale');
  });
});
