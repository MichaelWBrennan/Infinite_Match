// Stripe checkout and webhook for coin packs. No network: the checkout client is replaced with a
// fake, and webhook signatures come from the Stripe SDK's own test-header helper. Run with: npm run test:server
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import Stripe from 'stripe';
import { createApp } from '../app.js';
import { openDatabase } from '../db.js';
import { setStripeClientForFree } from '../payments.js';

const SECRET = `sk_test_${'a'.repeat(30)}`;
const WEBHOOK = `whsec_${'b'.repeat(30)}`;
const ENV = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_CHECKOUT_SUCCESS_URL', 'STRIPE_CHECKOUT_CANCEL_URL', 'LIVE_OPS_CONFIG'];

// One active deal on the medium pack (399 cents instead of 499). Deals must be at least 99 cents,
// so the 99-cent small pack cannot have one.
const DEAL_FIXTURE = {
  events: [], weeklyEvents: [], weeklyEventArchive: [],
  deals: [{ productId: 'coins_medium', priceCents: 399, start: '2020-01-01T00:00:00Z', end: '2030-01-01T00:00:00Z' }],
};

describe('Stripe coin packs', () => {
  let app;
  let base;
  let created = [];
  let dir;
  let liveOps;
  const saved = {};

  // A real SDK instance for signature checks only. It never sends a request.
  const verifier = new Stripe(SECRET);

  const fakeClient = {
    checkout: {
      sessions: {
        create: async (params) => {
          created.push(params);
          return { id: `cs_test_${created.length}`, url: `https://checkout.stripe.test/session/${created.length}` };
        },
      },
    },
    webhooks: verifier.webhooks,
  };

  before(async () => {
    for (const key of ENV) saved[key] = process.env[key];
    dir = mkdtempSync(join(tmpdir(), 'payments-'));
    liveOps = join(dir, 'liveops.json');
    writeFileSync(liveOps, JSON.stringify(DEAL_FIXTURE));
    process.env.LIVE_OPS_CONFIG = liveOps;
    app = createApp({ db: openDatabase(':memory:'), allowedOrigins: [], authLimitPerWindow: 10000 });
    await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${app.server.address().port}`;
  });

  after(async () => {
    setStripeClientForFree(null);
    await new Promise((resolve) => app.server.close(resolve));
    app.db.close();
    for (const key of ENV) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
    rmSync(dir, { recursive: true, force: true });
  });

  function configure() {
    process.env.STRIPE_SECRET_KEY = SECRET;
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK;
    process.env.STRIPE_CHECKOUT_SUCCESS_URL = 'https://example.test/ok';
    process.env.STRIPE_CHECKOUT_CANCEL_URL = 'https://example.test/cancel';
    setStripeClientForFree(fakeClient);
  }

  function unconfigure() {
    for (const key of ENV) if (key !== 'LIVE_OPS_CONFIG') delete process.env[key];
    setStripeClientForFree(null);
  }

  async function call(method, path, { body, token, raw, headers = {} } = {}) {
    const init = { method, headers: { ...headers } };
    if (token) init.headers.Authorization = `Bearer ${token}`;
    if (raw !== undefined) init.body = raw;
    else if (body !== undefined) {
      init.body = JSON.stringify(body);
      init.headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(base + path, init);
    return { status: res.status, json: await res.json() };
  }

  async function registerAs(name) {
    const reg = await call('POST', '/api/auth/register', { body: { playerId: name, password: 'long-enough-pw' } });
    assert.equal(reg.status, 200, JSON.stringify(reg.json));
    const id = app.db.prepare('SELECT id FROM players WHERE username = ?').get(name).id;
    return { token: reg.json.token, id };
  }

  const coins = async (token) => (await call('GET', '/api/account-economy/data', { token })).json.data.currencies.coins.amount;

  function signedEvent(event) {
    const payload = JSON.stringify(event);
    const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK });
    return { payload, header };
  }

  function paidSession(id, playerId, productId = 'coins_small', overrides = {}) {
    const quoted = productId === 'coins_medium' ? 399 : 99;
    return {
      id: 'evt_' + id,
      type: 'checkout.session.completed',
      data: {
        object: {
          id,
          payment_status: 'paid',
          amount_total: quoted,
          currency: 'usd',
          metadata: { playerId, productId, priceCents: String(quoted) },
          ...overrides,
        },
      },
    };
  }

  async function postWebhook(event, header) {
    return call('POST', '/api/stripe/webhook', { raw: event, headers: { 'Content-Type': 'application/json', 'stripe-signature': header } });
  }

  describe('checkout session', () => {
    it('answers 503 when Stripe is not configured', async () => {
      unconfigure();
      const token = (await registerAs(`st_${Math.random().toString(36).slice(2, 8)}`)).token;
      const res = await call('POST', '/api/stripe/checkout-session', { token, body: { productId: 'coins_small' } });
      assert.equal(res.status, 503);
      assert.equal(res.json.error, 'checkout_not_configured');
    });

    it('needs a token', async () => {
      configure();
      const res = await call('POST', '/api/stripe/checkout-session', { body: { productId: 'coins_small' } });
      assert.equal(res.status, 401);
    });

    it('creates a session at the catalog price, with the player in the metadata', async () => {
      configure();
      created = [];
      const player = await registerAs(`st_${Math.random().toString(36).slice(2, 8)}`);
      const res = await call('POST', '/api/stripe/checkout-session', { token: player.token, body: { productId: 'coins_medium' } });
      assert.equal(res.status, 200, JSON.stringify(res.json));
      assert.equal(res.json.url, 'https://checkout.stripe.test/session/1');
      assert.equal(res.json.sessionId, 'cs_test_1');
      const params = created[0];
      assert.equal(params.mode, 'payment');
      assert.equal(params.line_items[0].price_data.unit_amount, 399, 'the active deal price, as the offers show');
      assert.equal(params.line_items[0].price_data.currency, 'usd');
      assert.equal(params.metadata.playerId, player.id);
      assert.equal(params.metadata.productId, 'coins_medium');
      assert.equal(params.metadata.priceCents, '399');
    });

    it('charges the catalog price when no deal is active', async () => {
      configure();
      created = [];
      const token = (await registerAs(`st_${Math.random().toString(36).slice(2, 8)}`)).token;
      await call('POST', '/api/stripe/checkout-session', { token, body: { productId: 'coins_small' } });
      assert.equal(created[0].line_items[0].price_data.unit_amount, 99);
    });

    it('refuses entitlements and unknown products without contacting Stripe', async () => {
      configure();
      created = [];
      const token = (await registerAs(`st_${Math.random().toString(36).slice(2, 8)}`)).token;
      const ent = await call('POST', '/api/stripe/checkout-session', { token, body: { productId: 'remove_ads' } });
      assert.equal(ent.json.error, 'product_not_available');
      const unknown = await call('POST', '/api/stripe/checkout-session', { token, body: { productId: 'free_money' } });
      assert.equal(unknown.json.error, 'unknown_product');
      assert.equal(created.length, 0);
    });
  });

  describe('webhook', () => {
    it('grants a coin pack once for a signed, paid session', async () => {
      configure();
      const player = await registerAs(`wh_${Math.random().toString(36).slice(2, 8)}`);
      const before = await coins(player.token);
      const { payload, header } = signedEvent(paidSession('cs_once', player.id));

      const first = await postWebhook(payload, header);
      assert.equal(first.status, 200, JSON.stringify(first.json));
      assert.equal(first.json.outcome, 'granted');
      assert.equal(await coins(player.token), before + 500);

      const replay = await postWebhook(payload, header);
      assert.equal(replay.json.outcome, 'duplicate');
      assert.equal(await coins(player.token), before + 500, 'a replayed event must not grant twice');
    });

    it('rejects a bad signature and grants nothing', async () => {
      configure();
      const player = await registerAs(`wh_${Math.random().toString(36).slice(2, 8)}`);
      const before = await coins(player.token);
      const { payload } = signedEvent(paidSession('cs_forged', player.id));
      const forged = await postWebhook(payload, 't=1,v1=deadbeef');
      assert.equal(forged.status, 400);
      assert.equal(forged.json.error, 'invalid_signature');
      assert.equal(await coins(player.token), before);
    });

    it('rejects a payment of more than the quoted (deal) price', async () => {
      configure();
      const player = await registerAs(`wh_${Math.random().toString(36).slice(2, 8)}`);
      const before = await coins(player.token);
      const { payload, header } = signedEvent(paidSession('cs_overcharge', player.id, 'coins_medium', { amount_total: 499 }));
      const res = await postWebhook(payload, header);
      assert.equal(res.json.error, 'amount_mismatch');
      assert.equal(await coins(player.token), before);
    });

    it('rejects a signed event whose amount is not the catalog price', async () => {
      configure();
      const player = await registerAs(`wh_${Math.random().toString(36).slice(2, 8)}`);
      const before = await coins(player.token);
      const { payload, header } = signedEvent(paidSession('cs_cheap', player.id, 'coins_small', { amount_total: 1 }));
      const res = await postWebhook(payload, header);
      assert.equal(res.status, 400);
      assert.equal(res.json.error, 'amount_mismatch');
      assert.equal(await coins(player.token), before);
    });

    it('ignores unpaid sessions and unrelated events', async () => {
      configure();
      const player = await registerAs(`wh_${Math.random().toString(36).slice(2, 8)}`);
      const before = await coins(player.token);
      const unpaid = signedEvent(paidSession('cs_unpaid', player.id, 'coins_small', { payment_status: 'unpaid' }));
      assert.equal((await postWebhook(unpaid.payload, unpaid.header)).json.ignored, true);
      const other = signedEvent({ id: 'evt_other', type: 'charge.succeeded', data: { object: {} } });
      assert.equal((await postWebhook(other.payload, other.header)).json.ignored, true);
      assert.equal(await coins(player.token), before);
    });

    it('does not grant to an unknown player', async () => {
      configure();
      const { payload, header } = signedEvent(paidSession('cs_ghost', 'no-such-player'));
      const res = await postWebhook(payload, header);
      assert.equal(res.json.outcome, 'unknown_player');
    });

    it('answers 503 when the webhook secret is missing', async () => {
      unconfigure();
      const { payload, header } = signedEvent(paidSession('cs_nosecret', 'x'));
      const res = await postWebhook(payload, header);
      assert.equal(res.status, 503);
    });
  });
});
