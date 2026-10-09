import { describe, test, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import authRoutes from '../routes/auth.js';
import kingdomRoutes from '../routes/kingdom.js';
import accountEconomyRoutes from '../routes/account-economy.js';
import stripeRoutes from '../routes/stripe.js';
import adsRoutes from '../routes/ads.js';
import AccountEconomyService, { EconomyRuleError, accountEconomy } from '../services/economy/AccountEconomyService.js';
import { isDurableEconomy } from '../services/economy/PlayerEconomyDb.js';
import {
  upgradeCost,
  planRenovation,
  kingdomView,
  KINGDOM_ROOMS,
  ensureKingdom,
  initialKingdom,
} from '../services/meta/kingdom.js';
import { LOOTBOXES, pickLootReward } from '../services/meta/lootbox.js';
import { grantPurchase, GrantRetryableError } from '../services/payments/purchase-grants.js';
import PurchaseLedgerDb from '../services/payments/PurchaseLedgerDb.js';
import StripeService from '../services/payments/StripeService.js';
import AdEventDb from '../services/ads/AdEventDb.js';

const uniq = (p: string) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// The auth route allows 5 registrations per 15 minutes per IP, so this file registers one player.
const authApp = express();
authApp.use(express.json());
authApp.use('/api/auth', authRoutes);
let sharedPlayerToken: string | null = null;
async function playerToken(): Promise<string> {
  if (!sharedPlayerToken) {
    const id = uniq('player');
    const res = await request(authApp)
      .post('/api/auth/register')
      .send({ playerId: id, email: `${id}@example.com`, password: 'secret123' });
    if (!res.body.token) throw new Error(`registration failed: ${res.status}`);
    sharedPlayerToken = res.body.token as string;
  }
  return sharedPlayerToken;
}

describe('kingdom rules', () => {
  const throne = KINGDOM_ROOMS.find((r) => r.id === 'throne') as any;

  test('upgrade cost is base cost times level squared', () => {
    expect([1, 2, 3, 4, 5].map((l) => upgradeCost(throne, l))).toEqual([200, 800, 1800, 3200, 5000]);
  });

  test('planRenovation names the reason an upgrade is blocked', () => {
    const kingdom = initialKingdom();
    expect(planRenovation({ kingdom, room: throne, coins: 100, lifetimeStars: 0 }).reason).toBe('insufficient_coins');
    kingdom.rooms.throne = 1;
    expect(planRenovation({ kingdom, room: throne, coins: 10000, lifetimeStars: 4 }).reason).toBe('stars_required');
    kingdom.rooms.throne = 5;
    expect(planRenovation({ kingdom, room: throne, coins: 10000, lifetimeStars: 999 }).reason).toBe('room_max_level');
  });

  test('ensureKingdom fills in rooms for economies saved before this feature', () => {
    const economy: any = { currencies: {} };
    expect(ensureKingdom(economy).rooms.chapel).toBe(0);
    const partial: any = { kingdom: { rooms: { throne: 2 } } };
    ensureKingdom(partial);
    expect(partial.kingdom.rooms).toMatchObject({ throne: 2, library: 0, chapel: 0 });
  });

  test('kingdomView lists every room with its next upgrade', () => {
    const view = kingdomView({ kingdom: initialKingdom(), coins: 1000, lifetimeStars: 0 });
    expect(view.rooms).toHaveLength(KINGDOM_ROOMS.length);
    expect(view.rooms[0]).toMatchObject({ id: 'throne', level: 0, canRenovate: true });
    expect(view.rooms[0].next).toMatchObject({ level: 1, costCoins: 200, starsRequired: 0 });
    expect(view.maxTotalLevel).toBe(KINGDOM_ROOMS.length * 5);
  });
});

describe('loot box rolls', () => {
  test('a roll picks by weight, and the first and last bands are reachable', () => {
    const rewards = LOOTBOXES.common.rewards;
    expect(pickLootReward(rewards, () => 0).id).toBe(rewards[0].id);
    const total = rewards.reduce((s, r) => s + r.weight, 0);
    expect(pickLootReward(rewards, () => total - 1).id).toBe(rewards[rewards.length - 1].id);
  });
});

describe('server-priced economy operations', () => {
  let economy: AccountEconomyService;
  beforeEach(() => {
    economy = new AccountEconomyService();
  });

  test('renovation charges the server price, enforces stars, and grants the milestone item', async () => {
    const playerId = uniq('reno');
    await economy.initializePlayerEconomy(playerId, 'test');

    // Level 1 needs no stars.
    const first = await economy.renovateRoom(playerId, 'throne');
    expect(first).toMatchObject({ level: 1, costCoins: 200, coins: 800 });

    // Level 2 needs 5 lifetime stars. Stars are earned, not spent, so the gate uses lifetime stars.
    await expect(economy.renovateRoom(playerId, 'throne')).rejects.toMatchObject({ code: 'stars_required' });
    const eco = await economy.getPlayerEconomy(playerId);
    eco.currencies.stars.earned = 5;
    const second = await economy.renovateRoom(playerId, 'throne');
    expect(second).toMatchObject({ level: 2, costCoins: 800, coins: 0 });

    // Level 3 needs 15 lifetime stars and 1800 coins.
    eco.currencies.coins.amount = 1800;
    await expect(economy.renovateRoom(playerId, 'throne')).rejects.toMatchObject({ code: 'stars_required' });
    eco.currencies.stars.earned = 15;
    await expect(economy.renovateRoom(playerId, 'throne')).resolves.toMatchObject({
      level: 3,
      milestone: { itemId: 'bomb' },
    });
    const after = await economy.getPlayerEconomy(playerId);
    expect(after.inventory.powerups.bomb.count).toBe(4);
    expect(after.kingdom.rooms.throne).toBe(3);
    expect(after.kingdom.renovations).toBe(3);
  });

  test('renovation refuses unknown rooms and unaffordable upgrades without changing coins', async () => {
    const playerId = uniq('reno2');
    await economy.initializePlayerEconomy(playerId, 'test');
    await expect(economy.renovateRoom(playerId, 'dungeon')).rejects.toBeInstanceOf(EconomyRuleError);
    const eco = await economy.getPlayerEconomy(playerId);
    eco.currencies.coins.amount = 10;
    await expect(economy.renovateRoom(playerId, 'library')).rejects.toMatchObject({ code: 'insufficient_coins' });
    expect(eco.currencies.coins.amount).toBe(10);
  });

  test('a loot box costs coins, and the reward is granted in the same save', async () => {
    const playerId = uniq('lootbox');
    await economy.initializePlayerEconomy(playerId, 'test');
    await expect(economy.openLootbox(playerId, 'mythic')).rejects.toMatchObject({ code: 'unknown_lootbox' });

    const result = await economy.openLootbox(playerId, 'common', () => 0);
    expect(result.reward.id).toBe('coins_100');
    expect(result.coins).toBe(1000 - 100 + 100);
    const eco = await economy.getPlayerEconomy(playerId);
    expect(eco.currencies.coins.spent).toBe(100);
  });

  test('an unaffordable loot box is refused and grants nothing', async () => {
    const playerId = uniq('lootbox2');
    await economy.initializePlayerEconomy(playerId, 'test');
    const eco = await economy.getPlayerEconomy(playerId);
    eco.currencies.coins.amount = 99;
    await expect(economy.openLootbox(playerId, 'common', () => 0)).rejects.toMatchObject({ code: 'insufficient_coins' });
    expect(eco.currencies.coins.amount).toBe(99);
  });

  test('energy refill charges only for missing energy, and refuses when full', async () => {
    const playerId = uniq('energy');
    await economy.initializePlayerEconomy(playerId, 'test');
    await expect(economy.refillEnergy(playerId)).rejects.toMatchObject({ code: 'energy_full' });
    const eco = await economy.getPlayerEconomy(playerId);
    eco.currencies.energy.amount = 90;
    const result = await economy.refillEnergy(playerId);
    expect(result).toMatchObject({ costCoins: 100, energy: 100, coins: 900 });
  });

  test('the durable store is off unless ECONOMY_STORE=mongo', () => {
    expect(isDurableEconomy()).toBe(false);
  });
});

describe('consumable grants', () => {
  type Row = Record<string, any>;
  let rows: Map<string, Row>;
  let credits: Array<{ playerId: string; grants: any }>;
  const db = PurchaseLedgerDb as any;
  const originals = {
    recordPurchase: db.recordPurchase,
    findPurchaseByTransaction: db.findPurchaseByTransaction,
    claimFulfillment: db.claimFulfillment,
    releaseFulfillment: db.releaseFulfillment,
    markFulfilled: db.markFulfilled,
  };

  beforeEach(() => {
    rows = new Map();
    credits = [];
    db.recordPurchase = async (doc: Row) => {
      if (rows.has(doc.transactionId)) return { inserted: false };
      rows.set(doc.transactionId, { ...doc });
      return { inserted: true };
    };
    db.findPurchaseByTransaction = async (id: string) => (rows.has(id) ? { ...rows.get(id) } : null);
    db.claimFulfillment = async (id: string) => {
      const row = rows.get(id);
      if (!row || row.fulfilled || row.claimedAt) return false;
      row.claimedAt = new Date();
      return true;
    };
    db.releaseFulfillment = async (id: string) => {
      const row = rows.get(id);
      if (row && !row.fulfilled) delete row.claimedAt;
    };
    db.markFulfilled = async (id: string) => {
      rows.get(id)!.fulfilled = true;
    };
  });
  afterEach(() => Object.assign(db, originals));

  const credit = async (playerId: string, grants: any) => {
    credits.push({ playerId, grants });
  };

  test('a coin pack credits the catalog amount once, however often it is delivered', async () => {
    const args = { playerId: 'p1', productId: 'coins_medium', transactionId: 'pi_1', platform: 'stripe', credit, durable: true };
    expect(await grantPurchase(args)).toEqual({ granted: true, duplicate: false });
    expect(await grantPurchase(args)).toEqual({ granted: true, duplicate: true });
    expect(credits).toEqual([{ playerId: 'p1', grants: { currency: 'coins', amount: 3000 } }]);
    expect(rows.get('pi_1')).toMatchObject({ fulfilled: true, amountUsd: 4.99 });
  });

  test('a failed credit releases the claim, so a retry credits exactly once', async () => {
    let fail = true;
    const flaky = async (playerId: string, grants: any) => {
      if (fail) throw new Error('economy store unavailable');
      credits.push({ playerId, grants });
    };
    const args = { playerId: 'p1', productId: 'coins_small', transactionId: 'pi_2', platform: 'stripe', credit: flaky, durable: true };
    await expect(grantPurchase(args)).rejects.toThrow('economy store unavailable');
    expect(rows.get('pi_2')!.fulfilled).toBe(false);
    expect(rows.get('pi_2')!.claimedAt).toBeUndefined();
    fail = false;
    expect(await grantPurchase(args)).toEqual({ granted: true, duplicate: false });
    expect(credits).toHaveLength(1);
  });

  test('a claim held by another request is retried later, never credited twice', async () => {
    const args = { playerId: 'p1', productId: 'coins_small', transactionId: 'pi_3', platform: 'stripe', credit, durable: true };
    await grantPurchase(args);
    rows.get('pi_3')!.fulfilled = false;
    rows.get('pi_3')!.claimedAt = new Date();
    await expect(grantPurchase(args)).rejects.toMatchObject({ reason: 'fulfillment_in_progress' });
    expect(credits).toHaveLength(1);
  });

  test('without a durable economy, a consumable is not recorded and the caller must retry', async () => {
    const args = { playerId: 'p1', productId: 'coins_small', transactionId: 'pi_4', platform: 'stripe', credit, durable: false };
    await expect(grantPurchase(args)).rejects.toBeInstanceOf(GrantRetryableError);
    expect(rows.has('pi_4')).toBe(false);
    expect(credits).toHaveLength(0);
  });

  test('another player cannot take a transaction that was granted to someone else', async () => {
    await grantPurchase({ playerId: 'p1', productId: 'coins_small', transactionId: 'pi_5', platform: 'stripe', credit, durable: true });
    const res = await grantPurchase({ playerId: 'p2', productId: 'coins_small', transactionId: 'pi_5', platform: 'stripe', credit, durable: true });
    expect(res).toEqual({ granted: false, reason: 'transaction_claimed' });
    expect(credits).toHaveLength(1);
  });

  test('entitlements are fulfilled on record and never call the economy', async () => {
    const res = await grantPurchase({ playerId: 'p1', productId: 'remove_ads', transactionId: 'pi_6', platform: 'stripe', credit, durable: true });
    expect(res).toEqual({ granted: true, duplicate: false });
    expect(rows.get('pi_6')).toMatchObject({ fulfilled: true, productId: 'remove_ads' });
    expect(credits).toHaveLength(0);
  });
});

describe('checkout and quote timing', () => {
  const saved = { ...process.env };
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/stripe', stripeRoutes);
  app.use('/api/kingdom', kingdomRoutes);
  app.use('/api/account-economy', accountEconomyRoutes);
  app.use('/api/ads', adsRoutes);

  afterAll(() => {
    process.env = saved;
  });

  test('checkout requires a session', async () => {
    const res = await request(app).post('/api/stripe/checkout-session').send({ productId: 'coins_small' });
    expect(res.status).toBe(401);
  });

  test('checkout refuses unpriced products and stops when the URLs are not configured', async () => {
    const token = await playerToken();
    delete process.env.STRIPE_CHECKOUT_SUCCESS_URL;
    delete process.env.STRIPE_CHECKOUT_CANCEL_URL;
    const bad = await request(app)
      .post('/api/stripe/checkout-session')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: 'season_pass_premium' });
    expect(bad.status).toBe(400);
    const notConfigured = await request(app)
      .post('/api/stripe/checkout-session')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: 'coins_small' });
    expect(notConfigured.body.error).toBe('checkout_not_configured');
  });

  test('checkout quotes the server price and records the quote time in metadata', async () => {
    const token = await playerToken();
    process.env.STRIPE_CHECKOUT_SUCCESS_URL = 'https://game.example/?purchase=ok';
    process.env.STRIPE_CHECKOUT_CANCEL_URL = 'https://game.example/';
    const calls: any[] = [];
    const original = (StripeService as any).createCheckoutSession;
    (StripeService as any).createCheckoutSession = async (args: any) => {
      calls.push(args);
      return { success: true, url: 'https://checkout.stripe.test/c/1', sessionId: 'cs_1' };
    };
    try {
      const res = await request(app)
        .post('/api/stripe/checkout-session')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: 'coins_large', priceCents: 1 });
      expect(res.status).toBe(200);
      expect(res.body.url).toBe('https://checkout.stripe.test/c/1');
      expect(calls[0].amountCents).toBe(999);
      expect(calls[0].metadata.productId).toBe('coins_large');
      expect(Number(calls[0].metadata.quotedAtMs)).toBeGreaterThan(0);
    } finally {
      (StripeService as any).createCheckoutSession = original;
    }
  });

  test('a webhook grant uses the quoted price while the quote is fresh, and refuses a stale one', async () => {
    const rows = new Map<string, any>();
    const db = PurchaseLedgerDb as any;
    const originalRecord = db.recordPurchase;
    const originalFind = db.findPurchaseByTransaction;
    db.recordPurchase = async (doc: any) => {
      if (rows.has(doc.transactionId)) return { inserted: false };
      rows.set(doc.transactionId, { ...doc });
      return { inserted: true };
    };
    db.findPurchaseByTransaction = async (id: string) => rows.get(id) ?? null;
    const dealFile = path.join(process.cwd(), 'var', `quote-test-${Date.now()}.json`);
    try {
      // A deal that ended a few minutes ago: the quote from inside it must still be honoured.
      const { loadLiveOps } = await import('../services/live-ops/live-ops.js');
      const dealStart = Date.parse('2030-01-01T00:00:00Z');
      fs.mkdirSync(path.dirname(dealFile), { recursive: true });
      fs.writeFileSync(
        dealFile,
        JSON.stringify({
          deals: [{ productId: 'remove_ads', priceCents: 199, start: new Date(dealStart).toISOString(), end: new Date(dealStart + 3600e3).toISOString() }],
        }),
      );
      loadLiveOps({ path: dealFile, reload: true });
      const quotedAtMs = dealStart + 60_000;
      const created = Math.floor((dealStart + 60_000 + 10 * 60_000) / 1000);
      await (StripeService as any).handlePaymentIntentSucceeded({
        id: 'pi_quoted',
        amount: 199,
        currency: 'usd',
        created,
        metadata: { productId: 'remove_ads', playerId: 'p1', quotedAtMs: String(quotedAtMs) },
      });
      expect(rows.get('pi_quoted')).toMatchObject({ amountUsd: 1.99 });

      // Paid three hours after the quote: outside the window, so not granted.
      const stale = Math.floor((quotedAtMs + 3 * 3600e3) / 1000);
      await (StripeService as any).handlePaymentIntentSucceeded({
        id: 'pi_stale',
        amount: 199,
        currency: 'usd',
        created: stale,
        metadata: { productId: 'remove_ads', playerId: 'p1', quotedAtMs: String(quotedAtMs) },
      });
      expect(rows.has('pi_stale')).toBe(false);
    } finally {
      db.recordPurchase = originalRecord;
      db.findPurchaseByTransaction = originalFind;
      fs.rmSync(dealFile, { force: true });
      const { loadLiveOps: reset } = await import('../services/live-ops/live-ops.js');
      reset({ path: path.join(process.cwd(), 'var', 'no-liveops.json'), reload: true });
    }
  });

  test('the payment-intent route ignores a client-supplied quote time', async () => {
    const token = await playerToken();
    const calls: any[] = [];
    const original = (StripeService as any).createPaymentIntent;
    (StripeService as any).createPaymentIntent = async (args: any) => {
      calls.push(args);
      return { success: true, clientSecret: 'cs', paymentIntentId: 'pi' };
    };
    try {
      await request(app)
        .post('/api/stripe/payment-intent')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: 'remove_ads', metadata: { quotedAtMs: '1' } });
      expect(calls[0].metadata.quotedAtMs).toBeUndefined();
    } finally {
      (StripeService as any).createPaymentIntent = original;
    }
  });
});

describe('kingdom and loot box routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/kingdom', kingdomRoutes);
  app.use('/api/account-economy', accountEconomyRoutes);

  test('kingdom routes require a session', async () => {
    expect((await request(app).get('/api/kingdom')).status).toBe(401);
    expect((await request(app).post('/api/kingdom/renovate').send({ roomId: 'throne' })).status).toBe(401);
  });

  test('a signed-in player sees the kingdom and can renovate a room', async () => {
    const token = await playerToken();
    const view = await request(app).get('/api/kingdom').set('Authorization', `Bearer ${token}`);
    expect(view.status).toBe(200);
    expect(view.body.kingdom.rooms).toHaveLength(KINGDOM_ROOMS.length);
    expect(view.body.coins).toBe(1000);

    const upgrade = await request(app)
      .post('/api/kingdom/renovate')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: 'garden' });
    expect(upgrade.status).toBe(200);
    expect(upgrade.body.result).toMatchObject({ roomId: 'garden', level: 1, costCoins: 150, coins: 850 });
  });

  test('a renovation request is refused for an unknown room, with the error code', async () => {
    const token = await playerToken();
    const res = await request(app)
      .post('/api/kingdom/renovate')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: 'dungeon' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('unknown_room');
  });

  test('loot box and energy endpoints return server-side rule errors', async () => {
    const token = await playerToken();
    const bad = await request(app)
      .post('/api/account-economy/lootbox/open')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'mythic' });
    expect(bad.status).toBe(400);
    expect(bad.body.error).toBe('unknown_lootbox');

    const full = await request(app)
      .post('/api/account-economy/energy/refill')
      .set('Authorization', `Bearer ${token}`);
    expect(full.status).toBe(400);
    expect(full.body.error).toBe('energy_full');
  });
});

describe('ad revenue is not taken from the client', () => {
  test('a client-reported revenue figure is kept for debugging but not counted', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/ads', adsRoutes);
    const token = await playerToken();
    const original = (AdEventDb as any).record;
    const recorded: any[] = [];
    (AdEventDb as any).record = async (doc: any) => {
      recorded.push(doc);
    };
    try {
      const res = await request(app)
        .post('/api/ads/event')
        .set('Authorization', `Bearer ${token}`)
        .send({ network: 'x', format: 'rewarded', event: 'impression', revenueUsd: 5000 });
      expect(res.status).toBe(200);
      // Out-of-range claims are dropped; nothing from the client reaches the revenue total.
      expect(recorded[0]).toMatchObject({ revenueUsd: 0, clientReportedRevenueUsd: 0 });

      await request(app)
        .post('/api/ads/event')
        .set('Authorization', `Bearer ${token}`)
        .send({ network: 'x', format: 'rewarded', event: 'impression', revenueUsd: 0.02 });
      expect(recorded[1]).toMatchObject({ revenueUsd: 0, clientReportedRevenueUsd: 0.02 });

      // Unknown events and formats are refused rather than stored.
      const bad = await request(app)
        .post('/api/ads/event')
        .set('Authorization', `Bearer ${token}`)
        .send({ network: 'x', format: 'rewarded', event: 'free_gems' });
      expect(bad.status).toBe(400);
      const badFormat = await request(app)
        .post('/api/ads/event')
        .set('Authorization', `Bearer ${token}`)
        .send({ network: 'x', format: 'popup', event: 'impression' });
      expect(badFormat.status).toBe(400);
      expect(recorded).toHaveLength(2);
    } finally {
      (AdEventDb as any).record = original;
    }
  });
});

describe('client shop has no free currency grants', () => {
  test('phaser3-game.js does not add currency locally', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'phaser3-game.js'), 'utf-8');
    expect(source).not.toMatch(/this\.gems \+=/);
    expect(source).not.toMatch(/purchaseGems\(|purchaseStars\(|purchaseEnergy\(/);
    expect(source).toMatch(/\/api\/stripe\/checkout-session/);
    expect(source).toMatch(/\/api\/account-economy\/lootbox\/open/);
  });
});
