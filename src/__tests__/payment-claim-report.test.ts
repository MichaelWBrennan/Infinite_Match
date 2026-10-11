import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import adminRoutes from '../routes/admin.js';
import PurchaseLedgerDb, { mergeStaleClaims } from '../services/payments/PurchaseLedgerDb.js';
import { accountEconomy } from '../services/economy/AccountEconomyService.js';
import { CLAIM_REPORT_LIMIT, CLAIM_REPORT_MIN_AGE_MS, reportStalePaymentClaims } from '../services/payments/claim-report.js';

const app = express();
app.use('/api/admin', adminRoutes);
const headers = { 'x-admin-token': 'p'.repeat(40), 'x-admin-id': 'payments-reviewer' };
const original = {
  list: PurchaseLedgerDb.listStaleClaims,
  credit: accountEconomy.getPurchaseCreditReceipt,
  debit: accountEconomy.getPurchaseDebitReceipt,
};
const previous = {
  adminToken: process.env.ADMIN_API_TOKEN,
  adminIds: process.env.ADMIN_IDS,
  economyStore: process.env.ECONOMY_STORE,
};
let rows: any[];
let calls: string[];
const row = (id: string, reversal = false): any => ({
  transactionId: `provider-sensitive-${id}`,
  playerId: `private-account-${id}`,
  productId: 'coins_small',
  fulfilled: reversal,
  ...(reversal ? { reversalClaimedAt: new Date('2026-01-01') } : { claimedAt: new Date('2026-01-01') }),
});
const credit = { currency: 'coins', amount: 500, credited: 450 };
const debit = { currency: 'coins', amount: 500, taken: 200, shortfall: 250 };

beforeEach(() => {
  process.env.ADMIN_API_TOKEN = headers['x-admin-token'];
  process.env.ADMIN_IDS = headers['x-admin-id'];
  process.env.ECONOMY_STORE = 'mongo';
  rows = [];
  calls = [];
  PurchaseLedgerDb.listStaleClaims = async (before: Date, limit: number) => {
    expect(before).toBeInstanceOf(Date);
    expect(Date.now() - before.getTime()).toBeGreaterThanOrEqual(CLAIM_REPORT_MIN_AGE_MS);
    expect(limit).toBe(CLAIM_REPORT_LIMIT);
    return rows;
  };
  accountEconomy.getPurchaseCreditReceipt = async (_playerId: string, tx: string) => {
    calls.push(tx);
    return tx.endsWith('credit-ok') ? credit : tx.endsWith('credit-bad') ? { ...credit, amount: 3000 } : null;
  };
  accountEconomy.getPurchaseDebitReceipt = async (_playerId: string, tx: string) => {
    calls.push(tx);
    return tx.endsWith('debit-ok') ? debit : tx.endsWith('debit-bad') ? { ...debit, taken: -1 } : null;
  };
});
afterEach(() => {
  PurchaseLedgerDb.listStaleClaims = original.list;
  accountEconomy.getPurchaseCreditReceipt = original.credit;
  accountEconomy.getPurchaseDebitReceipt = original.debit;
  for (const [env, value] of Object.entries({
    ADMIN_API_TOKEN: previous.adminToken, ADMIN_IDS: previous.adminIds, ECONOMY_STORE: previous.economyStore,
  })) {
    if (value === undefined) delete process.env[env]; else process.env[env] = value;
  }
});

describe('admin-only, aggregate payment claim triage', () => {
  test('oldest claims from both index walks merge in claim-time order, with an overflow marker', () => {
    const claim = (id: string, minutes: number, reversal = false) => ({
      _id: id,
      ...(reversal ? { reversalClaimedAt: new Date(minutes * 60000) } : { claimedAt: new Date(minutes * 60000) }),
    });
    const fulfillment = [claim('a', 1), claim('c', 3), claim('e', 5)];
    const reversal = [claim('b', 2, true), claim('d', 4, true)];
    expect(mergeStaleClaims(fulfillment, reversal, 3).map((r) => r._id))
      .toEqual(['a', 'b', 'c', 'd']);
    expect(fulfillment.map((r) => r._id)).toEqual(['a', 'c', 'e']);
    expect(reversal.map((r) => r._id)).toEqual(['b', 'd']);
  });

  test('ledger sample query rejects invalid dates and unbounded limits before connecting', async () => {
    await expect(original.list(new Date('bad'), 100)).rejects.toThrow('invalid_claim_report_query');
    await expect(original.list(new Date(), 101)).rejects.toThrow('invalid_claim_report_query');
    await expect(original.list(new Date(), 0)).rejects.toThrow('invalid_claim_report_query');
  });

  test('authentication is mandatory and no unauthenticated query touches the ledger', async () => {
    rows = [row('credit-ok')];
    expect((await request(app).get('/api/admin/payment-claims')).status).toBe(401);
    expect((await request(app).get('/api/admin/payment-claims')
      .set({ ...headers, 'x-admin-token': 'wrong' })).status).toBe(401);
    expect(calls).toEqual([]);
  });

  test('read-only report distinguishes confirmed, missing and mismatched receipts without identifiers', async () => {
    rows = [row('credit-ok'), row('credit-none'), row('credit-bad'),
      row('debit-ok', true), row('debit-none', true), row('debit-bad', true),
      { ...row('invalid'), productId: 'not-a-product' }];
    const result = await request(app).get('/api/admin/payment-claims').set(headers);
    expect(result.status).toBe(200);
    expect(result.headers['cache-control']).toBe('private, no-store');
    expect(result.body).toMatchObject({ success: true, sampled: 7, hasMore: false,
      minimumAgeMinutes: 15,
      fulfillment: { confirmedReceipt: 1, noConfirmedReceipt: 1, mismatch: 1 },
      reversal: { confirmedReceipt: 1, noConfirmedReceipt: 1, mismatch: 1 },
      invalidRows: 1 });
    expect(calls).toHaveLength(6);
    expect(JSON.stringify(result.body)).not.toMatch(/provider-sensitive|private-account|transactionId|playerId|credited|taken|shortfall/i);
    expect(rows.every((r) => !r.reversedAt)).toBe(true); // no mutations
  });

  test('hard cap reports an incomplete sample and does not read receipts for the overflow row', async () => {
    rows = Array.from({ length: CLAIM_REPORT_LIMIT + 1 }, (_, i) => row(`n${i}`));
    const report = await reportStalePaymentClaims();
    expect(report).toMatchObject({ sampled: CLAIM_REPORT_LIMIT, hasMore: true,
      fulfillment: { noConfirmedReceipt: CLAIM_REPORT_LIMIT } });
    expect(calls).toHaveLength(CLAIM_REPORT_LIMIT);
  });

  test('a store failure or disabled durable economy yields 503, never a partial or empty success report', async () => {
    rows = [row('credit-ok'), row('credit-none')];
    accountEconomy.getPurchaseCreditReceipt = async (_p: string, tx: string) => {
      if (tx.endsWith('credit-none')) throw new Error('private-store-message');
      return credit;
    };
    const failed = await request(app).get('/api/admin/payment-claims').set(headers);
    expect(failed.status).toBe(503);
    expect(failed.headers['cache-control']).toBe('private, no-store');
    expect(failed.body).toMatchObject({ success: false, error: 'payment_claim_report_unavailable' });
    expect(JSON.stringify(failed.body)).not.toContain('private-store-message');
    delete process.env.ECONOMY_STORE;
    const unavailable = await request(app).get('/api/admin/payment-claims').set(headers);
    expect(unavailable.status).toBe(503);
    expect(unavailable.body.success).toBe(false);
  });
});
