import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { execSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { X509Certificate } from 'crypto';
import express from 'express';
import request from 'supertest';
import PurchaseLedgerDb from '../services/payments/PurchaseLedgerDb.js';
import { grantPurchase } from '../services/payments/purchase-grants.js';
import { productIdForSku, productFor } from '../services/payments/product-catalog.js';
import ReceiptVerificationService from '../services/payments/ReceiptVerificationService.js';
import {
  validateLiveOps,
  priceFor,
  liveOpsToday,
  loadLiveOps,
  MIN_DEAL_PRICE_CENTS,
} from '../services/live-ops/live-ops.js';
import liveOpsRoutes from '../routes/live-ops.js';
import monetizationRoutes from '../routes/monetization.js';

const b64url = (buf: Buffer | string) => Buffer.from(buf).toString('base64url');

// In-memory stand-in for the purchase collection.
function fakeLedger() {
  const rows = new Map<string, any>();
  const db = PurchaseLedgerDb as any;
  const originals = {
    recordPurchase: db.recordPurchase,
    findPurchaseByTransaction: db.findPurchaseByTransaction,
    hasPurchase: db.hasPurchase,
  };
  db.recordPurchase = async (doc: any) => {
    if (rows.has(doc.transactionId)) return { inserted: false };
    rows.set(doc.transactionId, { ...doc });
    return { inserted: true };
  };
  db.findPurchaseByTransaction = async (id: string) => rows.get(id) ?? null;
  db.hasPurchase = async (playerId: string, productId: string) =>
    [...rows.values()].some((r) => r.playerId === playerId && r.productId === productId);
  return {
    rows,
    restore: () => Object.assign(db, originals),
  };
}

describe('product catalog SKUs', () => {
  test('store SKUs map back to catalog products per platform', () => {
    expect(productIdForSku('ios', 'remove_ads')).toBe('remove_ads');
    expect(productIdForSku('android', 'unlock_all_themes')).toBe('unlock_all_themes');
    expect(productIdForSku('ios', 'season_pass_premium')).toBeNull();
    expect(productIdForSku('web', 'remove_ads')).toBeNull();
    expect(productIdForSku('ios', undefined as any)).toBeNull();
    expect(productFor('remove_ads')?.priceCents).toBe(499);
  });
});

describe('grantPurchase', () => {
  let ledger: ReturnType<typeof fakeLedger>;
  beforeEach(() => {
    ledger = fakeLedger();
  });
  afterEach(() => ledger.restore());

  test('records the catalog amount, never a client-supplied one', async () => {
    const res = await grantPurchase({ playerId: 'p1', productId: 'remove_ads', transactionId: 't1', platform: 'ios' });
    expect(res).toEqual({ granted: true, duplicate: false });
    expect(ledger.rows.get('t1')).toMatchObject({ playerId: 'p1', productId: 'remove_ads', amountUsd: 4.99 });
  });

  test('the same player presenting the same transaction again is a duplicate, not a second grant', async () => {
    await grantPurchase({ playerId: 'p1', productId: 'remove_ads', transactionId: 't1', platform: 'ios' });
    const again = await grantPurchase({ playerId: 'p1', productId: 'remove_ads', transactionId: 't1', platform: 'ios' });
    expect(again).toEqual({ granted: true, duplicate: true });
    expect(ledger.rows.size).toBe(1);
  });

  test('a transaction owned by another player is refused', async () => {
    await grantPurchase({ playerId: 'p1', productId: 'remove_ads', transactionId: 't1', platform: 'ios' });
    const res = await grantPurchase({ playerId: 'p2', productId: 'remove_ads', transactionId: 't1', platform: 'ios' });
    expect(res).toEqual({ granted: false, reason: 'transaction_claimed' });
  });

  test('refuses unknown products, missing players and missing transactions', async () => {
    expect(
      (await grantPurchase({ playerId: 'p1', productId: 'nope', transactionId: 't', platform: 'ios' })).reason,
    ).toBe('unknown_product');
    expect(
      (await grantPurchase({ playerId: '', productId: 'remove_ads', transactionId: 't', platform: 'ios' })).reason,
    ).toBe('player_required');
    expect(
      (await grantPurchase({ playerId: 'p1', productId: 'remove_ads', transactionId: '', platform: 'ios' })).reason,
    ).toBe('transaction_required');
    expect(ledger.rows.size).toBe(0);
  });

  test('a failed database write is thrown, so nothing is granted silently', async () => {
    const db = PurchaseLedgerDb as any;
    const original = db.recordPurchase;
    db.recordPurchase = async () => {
      throw new Error('db down');
    };
    try {
      await expect(
        grantPurchase({ playerId: 'p1', productId: 'remove_ads', transactionId: 'tx', platform: 'stripe' }),
      ).rejects.toThrow('db down');
    } finally {
      db.recordPurchase = original;
    }
  });
});

describe('live ops config', () => {
  const future = (days: number) => new Date(Date.parse('2030-01-01T00:00:00Z') + days * 86400000).toISOString();

  test('a deal below the floor, at or above the catalog price, or for an unknown product is rejected', () => {
    const deal = (productId: string, priceCents: number) => ({
      deals: [{ productId, priceCents, start: future(0), end: future(1) }],
    });
    expect(MIN_DEAL_PRICE_CENTS).toBe(99);
    expect(validateLiveOps(deal('remove_ads', 98)).errors).toHaveLength(1);
    expect(validateLiveOps(deal('remove_ads', 499)).errors).toHaveLength(1);
    expect(validateLiveOps(deal('remove_ads', 300.5)).errors).toHaveLength(1);
    expect(validateLiveOps(deal('unknown', 199)).errors).toHaveLength(1);
    expect(validateLiveOps(deal('remove_ads', 299)).errors).toHaveLength(0);
  });

  test('an event or deal whose end is not after its start is rejected', () => {
    const res = validateLiveOps({
      events: [{ id: 'e', name: 'E', start: future(2), end: future(1) }],
    });
    expect(res.errors).toHaveLength(1);
    expect(res.config).toBeNull();
  });

  test('priceFor uses the deal only inside its window and the catalog price otherwise', () => {
    const { config } = validateLiveOps({
      deals: [{ productId: 'unlock_all_themes', priceCents: 399, start: future(0), end: future(1) }],
    });
    const inside = Date.parse(future(0)) + 1000;
    const after = Date.parse(future(1));
    expect(priceFor('unlock_all_themes', inside, config!)).toEqual({ priceCents: 399, currency: 'usd', deal: true });
    expect(priceFor('unlock_all_themes', after, config!)).toEqual({ priceCents: 799, currency: 'usd', deal: false });
    expect(priceFor('unlock_all_themes', Date.parse(future(0)) - 1, config!)?.deal).toBe(false);
    expect(priceFor('season_pass_premium', inside, config!)).toBeNull();
  });

  test('liveOpsToday lists active deals and events, and upcoming events in order', () => {
    const { config } = validateLiveOps({
      events: [
        { id: 'later', name: 'Later', start: future(5), end: future(6) },
        { id: 'now', name: 'Now', start: future(0), end: future(2) },
      ],
      deals: [{ productId: 'remove_ads', priceCents: 199, start: future(0), end: future(1) }],
    });
    const today = liveOpsToday(Date.parse(future(0)) + 1000, config!);
    expect(today.activeEvents.map((e) => e.id)).toEqual(['now']);
    expect(today.upcomingEvents.map((e) => e.id)).toEqual(['later']);
    expect(today.deals[0]).toMatchObject({ productId: 'remove_ads', priceCents: 199, catalogPriceCents: 499 });
  });

  test('an unreadable config falls back to no deals and no events', () => {
    const file = path.join(os.tmpdir(), `liveops-bad-${Date.now()}.json`);
    fs.writeFileSync(file, '{ not json');
    try {
      const cfg = loadLiveOps({ path: file, reload: true });
      expect(cfg.deals).toHaveLength(0);
      expect(priceFor('remove_ads', Date.now(), cfg)?.priceCents).toBe(499);
    } finally {
      fs.rmSync(file, { force: true });
      loadLiveOps({ path: path.join(os.tmpdir(), 'does-not-exist.json'), reload: true });
    }
  });
});

describe('Apple StoreKit 2 signed transactions', () => {
  let dir: string;
  let rootPem: string;
  let leafKeyPem: string;
  let x5c: string[];
  const saved = { ...process.env };

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'apple-tx-'));
    const sh = (cmd: string) => execSync(cmd, { cwd: dir, stdio: 'pipe' });
    fs.writeFileSync(path.join(dir, 'ca.ext'), 'basicConstraints=critical,CA:TRUE\nkeyUsage=critical,keyCertSign\n');
    fs.writeFileSync(path.join(dir, 'leaf.ext'), 'basicConstraints=CA:FALSE\nkeyUsage=critical,digitalSignature\n');
    sh('openssl ecparam -name prime256v1 -genkey -noout -out root.key');
    sh('openssl req -x509 -new -key root.key -subj "/CN=Test Root CA" -days 3650 -out root.pem -addext "basicConstraints=critical,CA:TRUE" -addext "keyUsage=critical,keyCertSign"');
    sh('openssl ecparam -name prime256v1 -genkey -noout -out inter.key');
    sh('openssl req -new -key inter.key -subj "/CN=Test Intermediate" -out inter.csr');
    sh('openssl x509 -req -in inter.csr -CA root.pem -CAkey root.key -CAcreateserial -days 3650 -extfile ca.ext -out inter.pem');
    sh('openssl ecparam -name prime256v1 -genkey -noout -out leaf.key');
    sh('openssl req -new -key leaf.key -subj "/CN=Test Leaf" -out leaf.csr');
    sh('openssl x509 -req -in leaf.csr -CA inter.pem -CAkey inter.key -CAcreateserial -days 3650 -extfile leaf.ext -out leaf.pem');
    rootPem = fs.readFileSync(path.join(dir, 'root.pem'), 'utf-8');
    leafKeyPem = fs.readFileSync(path.join(dir, 'leaf.key'), 'utf-8');
    const leaf = new X509Certificate(fs.readFileSync(path.join(dir, 'leaf.pem')));
    const inter = new X509Certificate(fs.readFileSync(path.join(dir, 'inter.pem')));
    x5c = [leaf.raw.toString('base64'), inter.raw.toString('base64')];
  });
  afterAll(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    process.env = saved;
  });
  beforeEach(() => {
    process.env.APPLE_ROOT_CA_G3 = rootPem;
    process.env.APPLE_BUNDLE_ID = 'com.example.match';
    delete process.env.APPLE_ALLOW_SANDBOX;
  });

  function sign(payload: object) {
    const header = b64url(JSON.stringify({ alg: 'ES256', x5c }));
    const body = b64url(JSON.stringify(payload));
    const sig = crypto.sign('sha256', Buffer.from(`${header}.${body}`), { key: leafKeyPem, dsaEncoding: 'ieee-p1363' });
    return `${header}.${body}.${b64url(sig)}`;
  }
  const tx = (over: object = {}) => ({
    bundleId: 'com.example.match',
    environment: 'Production',
    productId: 'remove_ads',
    originalTransactionId: '2000000001',
    transactionId: '2000000002',
    ...over,
  });

  test('accepts a valid production transaction and keys it on the original transaction ID', () => {
    const res = ReceiptVerificationService.verifyAppleSignedTransaction(sign(tx()));
    expect(res).toMatchObject({ success: true, productId: 'remove_ads', transactionId: '2000000001' });
  });

  test('refuses when the pinned root or bundle ID is not configured', () => {
    delete process.env.APPLE_ROOT_CA_G3;
    expect(ReceiptVerificationService.verifyAppleSignedTransaction(sign(tx())).reason).toBe('store_not_configured');
  });

  test('refuses a transaction for another app', () => {
    const res = ReceiptVerificationService.verifyAppleSignedTransaction(sign(tx({ bundleId: 'com.other' })));
    expect(res).toMatchObject({ success: false, reason: 'bundle_mismatch' });
  });

  test('refuses Sandbox transactions unless APPLE_ALLOW_SANDBOX=true', () => {
    const jws = sign(tx({ environment: 'Sandbox' }));
    expect(ReceiptVerificationService.verifyAppleSignedTransaction(jws).reason).toBe('sandbox_not_allowed');
    process.env.APPLE_ALLOW_SANDBOX = 'true';
    expect(ReceiptVerificationService.verifyAppleSignedTransaction(jws).success).toBe(true);
  });

  test('refuses a revoked transaction', () => {
    const res = ReceiptVerificationService.verifyAppleSignedTransaction(sign(tx({ revocationDate: 1700000000000 })));
    expect(res.reason).toBe('revoked');
  });

  test('refuses a forged signature', () => {
    const jws = sign(tx());
    const [h, , s] = jws.split('.');
    const forged = `${h}.${b64url(JSON.stringify(tx({ productId: 'unlock_all_themes' })))}.${s}`;
    expect(ReceiptVerificationService.verifyAppleSignedTransaction(forged).reason).toBe('signature_invalid');
  });
});

describe('routes require a session', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/live-ops', liveOpsRoutes);
  app.use('/api/monetization', monetizationRoutes);

  test('live ops today returns 401 without a session', async () => {
    const res = await request(app).get('/api/live-ops/today');
    expect(res.status).toBe(401);
  });

  test('receipt verification returns 401 without a session', async () => {
    const res = await request(app)
      .post('/api/monetization/receipt/verify')
      .send({ platform: 'ios', payload: { signedTransaction: 'x.y.z' } });
    expect(res.status).toBe(401);
  });
});
