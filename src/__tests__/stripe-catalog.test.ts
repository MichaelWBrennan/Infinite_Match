import express from 'express';
import request from 'supertest';
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import authRoutes from '../routes/auth.js';
import stripeRoutes from '../routes/stripe.js';
import { productFor, PRODUCTS } from '../services/payments/product-catalog.js';
import PurchaseLedgerDb from '../services/payments/PurchaseLedgerDb.js';
import { loadLiveOps } from '../services/live-ops/live-ops.js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import StripeService from '../services/payments/StripeService.js';

describe('product catalog', () => {
  test('only priced products are sold', () => {
    expect(productFor('remove_ads')).toMatchObject({ priceCents: 499, currency: 'usd' });
    expect(productFor('unlock_all_themes')).toMatchObject({ priceCents: 799, currency: 'usd' });
    // The premium pass has no price in the repo, so it cannot be bought.
    expect(productFor('season_pass_premium')).toBeNull();
    expect(productFor('__proto__')).toBeNull();
    expect(productFor(undefined)).toBeNull();
    expect(Object.isFrozen(PRODUCTS)).toBe(true);
  });
});

describe('webhook grants only what was charged', () => {
  let rows: Map<string, any>;
  const db = PurchaseLedgerDb as any;
  const originals = { recordPurchase: db.recordPurchase, findPurchaseByTransaction: db.findPurchaseByTransaction };

  beforeEach(() => {
    rows = new Map();
    db.recordPurchase = async (doc: any) => {
      if (rows.has(doc.transactionId)) return { inserted: false };
      rows.set(doc.transactionId, doc);
      return { inserted: true };
    };
    db.findPurchaseByTransaction = async (id: string) => rows.get(id) ?? null;
  });
  afterEach(() => {
    Object.assign(db, originals);
    loadLiveOps({ path: path.join(os.tmpdir(), 'no-liveops.json'), reload: true });
  });

  test('a $0.01 intent for a priced product is not granted', async () => {
    await (StripeService as any).handlePaymentIntentSucceeded({
      id: 'pi_cheap',
      amount: 1,
      currency: 'usd',
      created: Math.floor(Date.now() / 1000),
      metadata: { productId: 'remove_ads', playerId: 'p1' },
    });
    expect(rows.size).toBe(0);
  });

  test('an intent for an unpriced product is not granted', async () => {
    await (StripeService as any).handlePaymentIntentSucceeded({
      id: 'pi_pass',
      amount: 499,
      currency: 'usd',
      created: Math.floor(Date.now() / 1000),
      metadata: { productId: 'season_pass_premium', playerId: 'p1' },
    });
    expect(rows.size).toBe(0);
  });

  test('an intent at the catalog price is granted to the database ledger', async () => {
    await (StripeService as any).handlePaymentIntentSucceeded({
      id: 'pi_ok',
      amount: 499,
      currency: 'usd',
      created: Math.floor(Date.now() / 1000),
      metadata: { productId: 'remove_ads', playerId: 'p1' },
    });
    expect(rows.get('pi_ok')).toMatchObject({ productId: 'remove_ads', playerId: 'p1', amountUsd: 4.99, platform: 'stripe' });
  });

  test('an intent at the deal price is granted only when created inside the deal window', async () => {
    const file = path.join(os.tmpdir(), `liveops-stripe-${Date.now()}.json`);
    const start = Date.parse('2030-01-01T00:00:00Z');
    fs.writeFileSync(
      file,
      JSON.stringify({
        deals: [
          {
            productId: 'remove_ads',
            priceCents: 199,
            start: new Date(start).toISOString(),
            end: new Date(start + 86400000).toISOString(),
          },
        ],
      }),
    );
    try {
      loadLiveOps({ path: file, reload: true });
      const inside = { id: 'pi_deal', amount: 199, currency: 'usd', created: start / 1000 + 60, metadata: { productId: 'remove_ads', playerId: 'p1' } };
      await (StripeService as any).handlePaymentIntentSucceeded(inside);
      expect(rows.get('pi_deal')).toMatchObject({ amountUsd: 1.99 });

      // The same discounted amount, created after the window closes, is not granted.
      const after = { id: 'pi_late', amount: 199, currency: 'usd', created: start / 1000 + 86400 + 60, metadata: { productId: 'remove_ads', playerId: 'p1' } };
      await (StripeService as any).handlePaymentIntentSucceeded(after);
      expect(rows.has('pi_late')).toBe(false);
    } finally {
      fs.rmSync(file, { force: true });
    }
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

  test('charges the catalog price for a priced product, ignoring the client amount', async () => {
    const register = await request(app)
      .post('/api/auth/register')
      .send({
        playerId: `stripe_amt_${Date.now()}`,
        email: `stripe_amt_${Date.now()}@example.com`,
        password: 'secret123',
      });
    const original = (StripeService as any).createPaymentIntent;
    const calls: any[] = [];
    (StripeService as any).createPaymentIntent = async (args: any) => {
      calls.push(args);
      return { success: true, clientSecret: 'cs_test', paymentIntentId: 'pi_test' };
    };
    try {
      const res = await request(app)
        .post('/api/stripe/payment-intent')
        .set('Authorization', `Bearer ${register.body.token}`)
        .send({ productId: 'remove_ads', amount: 0.01, currency: 'eur', metadata: { priceCents: '1' } });
      expect(res.status).toBe(200);
      expect(calls).toHaveLength(1);
      expect(calls[0].amount).toBe(4.99);
      expect(calls[0].currency).toBe('usd');
      expect(calls[0].metadata.priceCents).toBe('499');
      expect(calls[0].metadata.productId).toBe('remove_ads');
    } finally {
      (StripeService as any).createPaymentIntent = original;
    }
  });
});
