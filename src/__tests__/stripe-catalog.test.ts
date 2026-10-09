import express from 'express';
import request from 'supertest';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import authRoutes from '../routes/auth.js';
import stripeRoutes from '../routes/stripe.js';
import { productFor, PRODUCTS } from '../services/payments/product-catalog.js';
import PurchaseLedger from '../services/payments/PurchaseLedger.js';
import StripeService from '../services/payments/StripeService.js';

describe('product catalog', () => {
  test('only priced products are sold', () => {
    expect(productFor('remove_ads')).toEqual({ priceCents: 499, currency: 'usd' });
    expect(productFor('unlock_all_themes')).toEqual({ priceCents: 799, currency: 'usd' });
    // The premium pass has no price in the repo, so it cannot be bought.
    expect(productFor('season_pass_premium')).toBeNull();
    expect(productFor('__proto__')).toBeNull();
    expect(productFor(undefined)).toBeNull();
    expect(Object.isFrozen(PRODUCTS)).toBe(true);
  });
});

describe('webhook grants only what was charged', () => {
  let recorded: any[];
  const original = (PurchaseLedger as any).recordPurchase;

  beforeAll(() => {
    recorded = [];
    (PurchaseLedger as any).recordPurchase = async (purchase: any) => {
      recorded.push(purchase);
    };
  });
  afterAll(() => {
    (PurchaseLedger as any).recordPurchase = original;
  });

  test('a $0.01 intent for a priced product is not recorded', async () => {
    await (StripeService as any).handlePaymentIntentSucceeded({
      id: 'pi_cheap',
      amount: 1,
      currency: 'usd',
      metadata: { productId: 'remove_ads', playerId: 'p1' },
    });
    expect(recorded).toHaveLength(0);
  });

  test('an intent for an unpriced product is not recorded', async () => {
    await (StripeService as any).handlePaymentIntentSucceeded({
      id: 'pi_pass',
      amount: 499,
      currency: 'usd',
      metadata: { productId: 'season_pass_premium', playerId: 'p1' },
    });
    expect(recorded).toHaveLength(0);
  });

  test('an intent at the catalog price is recorded', async () => {
    await (StripeService as any).handlePaymentIntentSucceeded({
      id: 'pi_ok',
      amount: 499,
      currency: 'usd',
      metadata: { productId: 'remove_ads', playerId: 'p1' },
    });
    expect(recorded).toHaveLength(1);
    expect(recorded[0]).toMatchObject({ productId: 'remove_ads', playerId: 'p1', amount: 4.99 });
  });
});

describe('payment intent route', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/stripe', stripeRoutes);

  test('requires a session', async () => {
    const res = await request(app).post('/api/stripe/payment-intent').send({ productId: 'remove_ads' });
    expect(res.status).toBe(401);
  });

  test('refuses products without a price, whatever amount the client sends', async () => {
    const register = await request(app)
      .post('/api/auth/register')
      .send({
        playerId: `stripe_${Date.now()}`,
        email: `stripe_${Date.now()}@example.com`,
        password: 'secret123',
      });
    const res = await request(app)
      .post('/api/stripe/payment-intent')
      .set('Authorization', `Bearer ${register.body.token}`)
      .send({ productId: 'season_pass_premium', amount: 0.01, currency: 'usd' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('unknown_product');
  });
});
