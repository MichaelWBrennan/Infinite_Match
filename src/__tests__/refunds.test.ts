import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import PurchaseLedgerDb from '../services/payments/PurchaseLedgerDb.js';
import { grantPurchase } from '../services/payments/purchase-grants.js';
import { reverseTransaction, appleTransactionIds, googleTransactionIds } from '../services/payments/refunds.js';
import ReceiptVerificationService from '../services/payments/ReceiptVerificationService.js';
import AccountEconomyService, { accountEconomy } from '../services/economy/AccountEconomyService.js';
import StripeService from '../services/payments/StripeService.js';
import { PlayerEconomyDb } from '../services/economy/PlayerEconomyDb.js';

const uniq = (p: string) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// In-memory stand-in for the purchase collection. It follows the same rules as the Mongo methods:
// conditional updates are atomic, and a reversed purchase is never claimed for fulfilment.
function fakeLedger() {
  const rows = new Map<string, any>();
  const refunds: any[] = [];
  const db = PurchaseLedgerDb as any;
  const names = [
    'recordPurchase', 'findPurchaseByTransaction', 'claimFulfillment', 'releaseFulfillment',
    'markFulfilled', 'reverseUnfulfilled', 'claimReversal', 'releaseReversal', 'markReversed',
    'recordRefund', 'hasPurchase',
  ];
  const originals = Object.fromEntries(names.map((n) => [n, db[n]]));
  const row = (id: string) => rows.get(id) ?? null;
  db.recordPurchase = async (doc: any) => {
    if (rows.has(doc.transactionId)) return { inserted: false };
    rows.set(doc.transactionId, { ...doc });
    return { inserted: true };
  };
  db.findPurchaseByTransaction = async (id: string) => row(id);
  db.claimFulfillment = async (id: string) => {
    const r = row(id);
    if (!r || r.fulfilled === true || r.claimedAt || r.reversedAt) return false;
    r.claimedAt = new Date();
    return true;
  };
  db.releaseFulfillment = async (id: string) => {
    const r = row(id);
    if (r && r.fulfilled !== true && !r.reversedAt) delete r.claimedAt;
  };
  db.markFulfilled = async (id: string) => {
    const r = row(id);
    if (!r || r.reversedAt) return false;
    r.fulfilled = true;
    return true;
  };
  db.reverseUnfulfilled = async (id: string, reason: string) => {
    const r = row(id);
    if (!r || r.fulfilled === true || r.claimedAt || r.reversedAt) return false;
    Object.assign(r, { reversedAt: new Date(), reversedShortfall: 0, reversalReason: reason });
    return true;
  };
  db.claimReversal = async (id: string) => {
    const r = row(id);
    if (!r || r.reversedAt || r.reversalClaimedAt) return false;
    r.reversalClaimedAt = new Date();
    return true;
  };
  db.releaseReversal = async (id: string) => {
    const r = row(id);
    if (r && !r.reversedAt) delete r.reversalClaimedAt;
  };
  db.markReversed = async (id: string, { shortfall = 0, reason = 'unspecified' } = {}) => {
    const r = row(id);
    if (!r || r.reversedAt) return false;
    Object.assign(r, { reversedAt: new Date(), reversedShortfall: shortfall, reversalReason: reason });
    return true;
  };
  db.recordRefund = async (doc: any) => {
    refunds.push(doc);
  };
  db.hasPurchase = async (playerId: string, productId: string) =>
    [...rows.values()].some((r) => r.playerId === playerId && r.productId === productId && !r.reversedAt);
  return {
    rows,
    refunds,
    restore: () => Object.assign(db, originals),
  };
}

const credit = (playerId: string, grants: any) =>
  accountEconomy.updateCurrency(playerId, grants.currency, grants.amount, 'add', 'purchase');

async function setCoins(playerId: string, amount: number) {
  const eco = await accountEconomy.getPlayerEconomy(playerId);
  eco.currencies.coins.amount = amount;
}
const coinsOf = async (playerId: string) => (await accountEconomy.getPlayerEconomy(playerId)).currencies.coins.amount;

describe('refunding a coin pack', () => {
  let ledger: ReturnType<typeof fakeLedger>;
  beforeEach(() => {
    ledger = fakeLedger();
  });
  afterEach(() => ledger.restore());

  test('a full refund takes back the coins the purchase granted', async () => {
    const playerId = uniq('refund');
    await setCoins(playerId, 0);
    await grantPurchase({ playerId, productId: 'coins_small', transactionId: 'pi_full', platform: 'stripe', durable: true, credit });
    expect(await coinsOf(playerId)).toBe(500);

    const res = await reverseTransaction({ transactionIds: ['pi_full'], reason: 'stripe_refund', durable: true });
    expect(res).toMatchObject({ reversed: true, kind: 'consumable', taken: 500, shortfall: 0 });
    expect(await coinsOf(playerId)).toBe(0);
    expect(ledger.refunds[0]).toMatchObject({ transactionId: 'pi_full', coinsReversed: 500, shortfall: 0 });
  });

  test('a second refund for the same payment takes nothing more', async () => {
    const playerId = uniq('twice');
    await setCoins(playerId, 0);
    await grantPurchase({ playerId, productId: 'coins_small', transactionId: 'pi_twice', platform: 'stripe', durable: true, credit });
    await reverseTransaction({ transactionIds: ['pi_twice'], reason: 'stripe_refund', durable: true });
    await setCoins(playerId, 300);
    const again = await reverseTransaction({ transactionIds: ['pi_twice'], reason: 'stripe_refund', durable: true });
    expect(again).toEqual({ reversed: false, reason: 'already_reversed' });
    expect(await coinsOf(playerId)).toBe(300);
  });

  test('coins already spent are not recovered; the balance stops at zero and the shortfall is recorded', async () => {
    const playerId = uniq('spent');
    await setCoins(playerId, 0);
    await grantPurchase({ playerId, productId: 'coins_small', transactionId: 'pi_spent', platform: 'stripe', durable: true, credit });
    await setCoins(playerId, 50); // the player spent 450 of the 500
    const res = await reverseTransaction({ transactionIds: ['pi_spent'], reason: 'stripe_dispute', durable: true });
    expect(res).toMatchObject({ reversed: true, taken: 50, shortfall: 450 });
    expect(await coinsOf(playerId)).toBe(0);
    expect(ledger.refunds[0]).toMatchObject({ coinsReversed: 50, shortfall: 450 });
  });

  test('concurrent reversals debit once', async () => {
    const playerId = uniq('race');
    await setCoins(playerId, 0);
    await grantPurchase({ playerId, productId: 'coins_small', transactionId: 'pi_race', platform: 'stripe', durable: true, credit });
    const debit = jest.fn(async (p: string, grants: any) => accountEconomy.reverseCurrency(p, grants.currency, grants.amount));
    const results = await Promise.allSettled([
      reverseTransaction({ transactionIds: ['pi_race'], reason: 'a', durable: true, debit }),
      reverseTransaction({ transactionIds: ['pi_race'], reason: 'b', durable: true, debit }),
    ]);
    expect(debit).toHaveBeenCalledTimes(1);
    const rejected = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
    for (const r of rejected) expect(r.reason.reason).toBe('reversal_in_progress');
    expect(await coinsOf(playerId)).toBe(0);
  });

  test('a failed debit releases the claim, so the retry can take the coins back', async () => {
    const playerId = uniq('retry');
    await setCoins(playerId, 0);
    await grantPurchase({ playerId, productId: 'coins_small', transactionId: 'pi_retry', platform: 'stripe', durable: true, credit });
    let fail = true;
    const debit = async (p: string, grants: any) => {
      if (fail) throw new Error('economy down');
      return accountEconomy.reverseCurrency(p, grants.currency, grants.amount);
    };
    await expect(reverseTransaction({ transactionIds: ['pi_retry'], reason: 'r', durable: true, debit })).rejects.toThrow('economy down');
    fail = false;
    const res = await reverseTransaction({ transactionIds: ['pi_retry'], reason: 'r', durable: true, debit });
    expect(res.reversed).toBe(true);
    expect(await coinsOf(playerId)).toBe(0);
  });

  test('without the durable store the reversal is retried, not applied in memory only', async () => {
    const playerId = uniq('nodurable');
    await setCoins(playerId, 0);
    await grantPurchase({ playerId, productId: 'coins_small', transactionId: 'pi_nd', platform: 'stripe', durable: true, credit });
    await expect(reverseTransaction({ transactionIds: ['pi_nd'], reason: 'r', durable: false })).rejects.toMatchObject({
      reason: 'durable_economy_required',
    });
    expect(ledger.rows.get('pi_nd').reversedAt).toBeUndefined();
  });

  test('a refund for a payment that is not a coin pack or entitlement we know is reported, not guessed', async () => {
    expect(await reverseTransaction({ transactionIds: ['pi_unknown'], reason: 'r', durable: true })).toEqual({
      reversed: false,
      reason: 'unknown_transaction',
    });
  });

  test('a store that keys the purchase by its second id is still found', async () => {
    const playerId = uniq('alt');
    await setCoins(playerId, 0);
    await grantPurchase({ playerId, productId: 'coins_small', transactionId: 'tx_second', platform: 'ios', durable: true, credit });
    const res = await reverseTransaction({ transactionIds: ['orig_first', 'tx_second'], reason: 'apple_refund', durable: true });
    expect(res.reversed).toBe(true);
  });
});

describe('refunding an entitlement and late deliveries', () => {
  let ledger: ReturnType<typeof fakeLedger>;
  beforeEach(() => {
    ledger = fakeLedger();
  });
  afterEach(() => ledger.restore());

  test('a refunded entitlement no longer counts as owned', async () => {
    const playerId = uniq('ads');
    await grantPurchase({ playerId, productId: 'remove_ads', transactionId: 'pi_ads', platform: 'stripe' });
    expect(await PurchaseLedgerDb.hasPurchase(playerId, 'remove_ads')).toBe(true);
    const res = await reverseTransaction({ transactionIds: ['pi_ads'], reason: 'stripe_refund', durable: true });
    expect(res).toMatchObject({ reversed: true, kind: 'entitlement' });
    expect(await PurchaseLedgerDb.hasPurchase(playerId, 'remove_ads')).toBe(false);
  });

  test('a purchase refunded before it was credited is never credited when the store delivers it', async () => {
    const playerId = uniq('late');
    // The purchase is recorded but not credited yet (as if the grant has not run).
    await PurchaseLedgerDb.recordPurchase({
      transactionId: 'pi_late', productId: 'coins_small', playerId, platform: 'stripe', fulfilled: false,
    });
    const reversed = await reverseTransaction({ transactionIds: ['pi_late'], reason: 'stripe_refund', durable: true });
    expect(reversed).toMatchObject({ reversed: true, kind: 'consumable', taken: 0, shortfall: 0 });

    const grant = jest.fn(credit);
    const res = await grantPurchase({
      playerId, productId: 'coins_small', transactionId: 'pi_late', platform: 'stripe', durable: true, credit: grant,
    });
    expect(res).toEqual({ granted: false, reason: 'reversed' });
    expect(grant).not.toHaveBeenCalled();
  });
});

describe('provider wiring', () => {
  let ledger: ReturnType<typeof fakeLedger>;
  const previousStore = process.env.ECONOMY_STORE;
  const realLoad = PlayerEconomyDb.load;
  const realSave = PlayerEconomyDb.save;
  const realInsert = PlayerEconomyDb.insertIfAbsent;
  beforeEach(() => {
    ledger = fakeLedger();
    // Production runs with the durable store; the provider paths refuse to debit without it.
    // The economy document store is stubbed (in memory), as in durable-economy.test.ts.
    process.env.ECONOMY_STORE = 'mongo';
    PlayerEconomyDb.load = async () => null;
    PlayerEconomyDb.save = async () => true;
    PlayerEconomyDb.insertIfAbsent = async () => true;
  });
  afterEach(() => {
    PlayerEconomyDb.load = realLoad;
    PlayerEconomyDb.save = realSave;
    PlayerEconomyDb.insertIfAbsent = realInsert;
    ledger.restore();
    if (previousStore === undefined) delete process.env.ECONOMY_STORE;
    else process.env.ECONOMY_STORE = previousStore;
  });

  test('a full Stripe refund reverses the payment; a partial refund does not', async () => {
    const playerId = uniq('stripe');
    await setCoins(playerId, 0);
    await grantPurchase({ playerId, productId: 'coins_medium', transactionId: 'pi_stripe', platform: 'stripe', durable: true, credit });
    const partial = { refunded: false, payment_intent: 'pi_stripe' };
    await (StripeService as any).handleChargeRefunded(partial);
    expect(ledger.rows.get('pi_stripe').reversedAt).toBeUndefined();

    await (StripeService as any).handleChargeRefunded({ refunded: true, payment_intent: 'pi_stripe' });
    expect(ledger.rows.get('pi_stripe').reversedAt).toBeDefined();
    expect(await coinsOf(playerId)).toBe(0);
  });

  test('a dispute reverses the payment when it opens', async () => {
    const playerId = uniq('dispute');
    await setCoins(playerId, 0);
    await grantPurchase({ playerId, productId: 'coins_large', transactionId: 'pi_disp', platform: 'stripe', durable: true, credit });
    await (StripeService as any).handleDisputeCreated({ payment_intent: 'pi_disp' });
    expect(ledger.rows.get('pi_disp').reversedAt).toBeDefined();
    expect(await coinsOf(playerId)).toBe(0);
  });

  test('Apple names the purchase by original or per-transaction id', () => {
    expect(appleTransactionIds({ originalTransactionId: 111, transactionId: 222 })).toEqual(['111', '222']);
    expect(appleTransactionIds({ transactionId: 222 })).toEqual(['222']);
    expect(appleTransactionIds(null)).toEqual([]);
  });

  test('Google keys a purchase by a hash of its SKU and token, so each catalog SKU is tried', () => {
    const ids = googleTransactionIds('token-abc');
    const expected = ReceiptVerificationService.buildAndroidTransactionId({ productId: 'coins_small', purchaseToken: 'token-abc' });
    expect(ids).toContain(expected);
    expect(ids.length).toBeGreaterThanOrEqual(5);
    expect(googleTransactionIds('')).toEqual([]);
  });
});

// The real services and conditional ledger rules run against a copying, revision-guarded
// economy stand-in. This catches commit-then-throw and cross-store interleavings without
// claiming to exercise Mongo's networking or provider callbacks.
describe('durable payment receipts and cross-store failure paths', () => {
  let ledger: ReturnType<typeof fakeLedger>;
  const original = {
    load: PlayerEconomyDb.load,
    save: PlayerEconomyDb.save,
    insert: PlayerEconomyDb.insertIfAbsent,
  };
  const previousStore = process.env.ECONOMY_STORE;
  let docs: Map<string, any>;
  const id = () => uniq('receipt');
  const args = (playerId: string, transactionId: string) => ({
    playerId, transactionId, productId: 'coins_small', platform: 'stripe', durable: true,
  });
  const refund = (transactionId: string) => reverseTransaction({
    transactionIds: [transactionId], reason: 'store_void', durable: true,
  });
  const balance = (playerId: string) => docs.get(playerId).currencies.coins.amount;

  beforeEach(() => {
    process.env.ECONOMY_STORE = 'mongo';
    ledger = fakeLedger();
    docs = new Map();
    PlayerEconomyDb.load = async (playerId: string) => {
      const doc = docs.get(playerId);
      return doc ? structuredClone(doc) : null;
    };
    PlayerEconomyDb.insertIfAbsent = async (playerId: string, economy: any) => {
      if (docs.has(playerId)) return false;
      docs.set(playerId, structuredClone({ ...economy, writeRevision: 0 }));
      return true;
    };
    PlayerEconomyDb.save = async (playerId: string, economy: any) => {
      const current = docs.get(playerId);
      if (!current || current.writeRevision !== economy.writeRevision) return false;
      docs.set(playerId, structuredClone({ ...economy, writeRevision: current.writeRevision + 1 }));
      return true;
    };
  });
  afterEach(() => {
    ledger.restore();
    PlayerEconomyDb.load = original.load;
    PlayerEconomyDb.save = original.save;
    PlayerEconomyDb.insertIfAbsent = original.insert;
    if (previousStore === undefined) delete process.env.ECONOMY_STORE;
    else process.env.ECONOMY_STORE = previousStore;
  });

  test('credit and debit each save the balance and receipt once, and hide payment keys from the public view', async () => {
    const playerId = id();
    const transactionId = id();
    await accountEconomy.initializePlayerEconomy(playerId);
    expect(await grantPurchase(args(playerId, transactionId))).toMatchObject({ granted: true, duplicate: false });
    expect(balance(playerId)).toBe(1500);
    expect(await accountEconomy.creditPurchaseOnce(playerId, transactionId, { currency: 'coins', amount: 500 }))
      .toMatchObject({ duplicate: true });
    expect(balance(playerId)).toBe(1500);
    expect(await refund(transactionId)).toMatchObject({ taken: 500, shortfall: 0 });
    expect(balance(playerId)).toBe(1000);
    expect(await accountEconomy.reversePurchaseOnce(playerId, transactionId, { currency: 'coins', amount: 500 }))
      .toMatchObject({ duplicate: true, taken: 500 });
    expect(balance(playerId)).toBe(1000);
    expect(Object.keys(docs.get(playerId).purchaseCredits)).toHaveLength(1);
    expect(Object.keys(docs.get(playerId).purchaseCredits)[0]).toMatch(/^[0-9a-f]{64}$/);
    expect(Object.keys(docs.get(playerId).purchaseDebits)).toHaveLength(1);
    const view = await accountEconomy.getPlayerEconomyView(playerId);
    expect(view.purchaseCredits).toBeUndefined();
    expect(view.purchaseDebits).toBeUndefined();
  });

  test('a credit write that committed but lost its acknowledgement keeps the claim; refund reconciles and debits', async () => {
    const playerId = id();
    const transactionId = id();
    const save = PlayerEconomyDb.save;
    let throwAfterCommit = true;
    PlayerEconomyDb.save = async (p: string, economy: any) => {
      const saved = await save(p, economy);
      if (throwAfterCommit) { throwAfterCommit = false; throw new Error('credit acknowledgement lost'); }
      return saved;
    };
    await expect(grantPurchase(args(playerId, transactionId))).rejects.toThrow('credit acknowledgement lost');
    expect(balance(playerId)).toBe(1500);
    expect(ledger.rows.get(transactionId).claimedAt).toBeDefined();
    expect(ledger.rows.get(transactionId).fulfilled).toBe(false);
    // The retry can complete a held claim from the durable receipt without paying again.
    expect(await grantPurchase(args(playerId, transactionId))).toMatchObject({ granted: true, duplicate: true });
    expect(balance(playerId)).toBe(1500);
    expect(await refund(transactionId)).toMatchObject({ taken: 500, shortfall: 0 });
    expect(balance(playerId)).toBe(1000);
  });

  test('a pending credit cannot be classified as uncredited by a racing refund', async () => {
    const playerId = id();
    const transactionId = id();
    const save = PlayerEconomyDb.save;
    let entered!: () => void;
    let resume!: () => void;
    const atSave = new Promise<void>((resolve) => { entered = resolve; });
    const gate = new Promise<void>((resolve) => { resume = resolve; });
    PlayerEconomyDb.save = async (p: string, economy: any) => {
      entered();
      await gate;
      const saved = await save(p, economy);
      throw new Error(`ambiguous credit: ${saved}`);
    };
    try {
      const granting = grantPurchase(args(playerId, transactionId));
      await atSave;
      await expect(refund(transactionId)).rejects.toMatchObject({ reason: 'fulfilment_in_progress' });
      expect(ledger.rows.get(transactionId).reversedAt).toBeUndefined();
      resume();
      await expect(granting).rejects.toThrow('ambiguous credit');
      expect(ledger.rows.get(transactionId).claimedAt).toBeDefined();
    } finally { resume(); }
    PlayerEconomyDb.save = save;
    expect(await refund(transactionId)).toMatchObject({ taken: 500 });
    expect(balance(playerId)).toBe(1000);
  });

  test('an uncredited purchase can be reversed, and its later delivery cannot credit', async () => {
    const playerId = id();
    const transactionId = id();
    await accountEconomy.initializePlayerEconomy(playerId);
    await PurchaseLedgerDb.recordPurchase({ ...args(playerId, transactionId), fulfilled: false });
    expect(await refund(transactionId)).toMatchObject({ reversed: true, taken: 0 });
    expect(await grantPurchase(args(playerId, transactionId))).toMatchObject({ granted: false, reason: 'reversed' });
    expect(balance(playerId)).toBe(1000);
  });

  test('a legacy released claim with a committed credit receipt cannot be reversed as uncredited', async () => {
    const playerId = id();
    const transactionId = id();
    await accountEconomy.initializePlayerEconomy(playerId);
    await PurchaseLedgerDb.recordPurchase({ ...args(playerId, transactionId), fulfilled: false });
    await accountEconomy.creditPurchaseOnce(playerId, transactionId, { currency: 'coins', amount: 500 });
    expect(await refund(transactionId)).toMatchObject({ taken: 500 });
    expect(ledger.rows.get(transactionId)).toMatchObject({ fulfilled: true });
    expect(balance(playerId)).toBe(1000);
  });

  test('reconciliation refuses to mark an already reversed row fulfilled even if a receipt exists', async () => {
    const playerId = id();
    const transactionId = id();
    await accountEconomy.initializePlayerEconomy(playerId);
    await PurchaseLedgerDb.recordPurchase({ ...args(playerId, transactionId), fulfilled: false });
    await accountEconomy.creditPurchaseOnce(playerId, transactionId, { currency: 'coins', amount: 500 });
    const mark = PurchaseLedgerDb.markFulfilled;
    PurchaseLedgerDb.markFulfilled = async (tx: string) => {
      await PurchaseLedgerDb.reverseUnfulfilled(tx, 'racing_refund');
      return mark(tx);
    };
    try {
      await expect(refund(transactionId)).rejects.toMatchObject({ reason: 'fulfilment_reversed' });
      expect(ledger.rows.get(transactionId)).toMatchObject({ fulfilled: false, reversalReason: 'racing_refund' });
    } finally { PurchaseLedgerDb.markFulfilled = mark; }
  });

  test('ambiguous debit retries from its receipt without debiting twice', async () => {
    const playerId = id();
    const transactionId = id();
    await grantPurchase(args(playerId, transactionId));
    const save = PlayerEconomyDb.save;
    let throwAfterCommit = true;
    PlayerEconomyDb.save = async (p: string, economy: any) => {
      const saved = await save(p, economy);
      if (throwAfterCommit) { throwAfterCommit = false; throw new Error('debit acknowledgement lost'); }
      return saved;
    };
    await expect(refund(transactionId)).rejects.toThrow('debit acknowledgement lost');
    expect(balance(playerId)).toBe(1000);
    expect(ledger.rows.get(transactionId).reversalClaimedAt).toBeUndefined();
    expect(await refund(transactionId)).toMatchObject({ taken: 500, shortfall: 0 });
    expect(balance(playerId)).toBe(1000);
  });

  test('a failed ledger mark after debit reconciles from its receipt on redelivery', async () => {
    const playerId = id();
    const transactionId = id();
    await grantPurchase(args(playerId, transactionId));
    const mark = PurchaseLedgerDb.markReversed;
    PurchaseLedgerDb.markReversed = async () => { throw new Error('ledger down'); };
    try {
      await expect(refund(transactionId)).rejects.toThrow('ledger down');
      expect(ledger.rows.get(transactionId).reversalClaimedAt).toBeDefined();
      expect(balance(playerId)).toBe(1000);
      await expect(refund(transactionId)).rejects.toThrow('ledger down');
      expect(balance(playerId)).toBe(1000);
    } finally { PurchaseLedgerDb.markReversed = mark; }
    expect(await refund(transactionId)).toMatchObject({ reversed: true, taken: 500 });
    expect(balance(playerId)).toBe(1000);
    expect(await refund(transactionId)).toMatchObject({ reversed: false, reason: 'already_reversed' });
  });

  test('a held historical reversal without a debit receipt stays held for manual review', async () => {
    const playerId = id();
    const transactionId = id();
    await grantPurchase(args(playerId, transactionId));
    ledger.rows.get(transactionId).reversalClaimedAt = new Date();
    await expect(refund(transactionId)).rejects.toMatchObject({ reason: 'reversal_in_progress' });
    expect(balance(playerId)).toBe(1500);
    expect(ledger.rows.get(transactionId).reversedAt).toBeUndefined();
  });

  test('stale economy writers reload receipts after a revision conflict, rather than double credit/debit', async () => {
    const playerId = id();
    const transactionId = id();
    await accountEconomy.initializePlayerEconomy(playerId);
    const staleWorker = new AccountEconomyService();
    const stale = structuredClone(await staleWorker.getPlayerEconomy(playerId));
    await accountEconomy.creditPurchaseOnce(playerId, transactionId, { currency: 'coins', amount: 500 });
    staleWorker.accountEconomyData.set(playerId, stale);
    expect(await staleWorker.creditPurchaseOnce(playerId, transactionId, { currency: 'coins', amount: 500 }))
      .toMatchObject({ duplicate: true });
    expect(balance(playerId)).toBe(1500);

    staleWorker.accountEconomyData.set(playerId, structuredClone(docs.get(playerId)));
    await accountEconomy.reversePurchaseOnce(playerId, transactionId, { currency: 'coins', amount: 500 });
    expect(await staleWorker.reversePurchaseOnce(playerId, transactionId, { currency: 'coins', amount: 500 }))
      .toMatchObject({ duplicate: true, taken: 500 });
    expect(balance(playerId)).toBe(1000);
  });

  test('credit failure without proof of commit keeps the claim held for review', async () => {
    const playerId = id();
    const transactionId = id();
    PlayerEconomyDb.save = async () => { throw new Error('economy unavailable'); };
    await expect(grantPurchase(args(playerId, transactionId))).rejects.toThrow('economy unavailable');
    expect(ledger.rows.get(transactionId).claimedAt).toBeDefined();
    await expect(refund(transactionId)).rejects.toMatchObject({ reason: 'fulfilment_in_progress' });
    expect(balance(playerId)).toBe(1000);
  });

  test('a failed authoritative receipt read cannot reverse a purchase as uncredited', async () => {
    const playerId = id();
    const transactionId = id();
    await accountEconomy.initializePlayerEconomy(playerId);
    await PurchaseLedgerDb.recordPurchase({ ...args(playerId, transactionId), fulfilled: false });
    PlayerEconomyDb.load = async () => { throw new Error('receipt store unavailable'); };
    await expect(refund(transactionId)).rejects.toThrow('receipt store unavailable');
    expect(ledger.rows.get(transactionId).reversedAt).toBeUndefined();
  });

  test('ledger mark failure after credit can be completed by a refund without re-crediting', async () => {
    const playerId = id();
    const transactionId = id();
    const mark = PurchaseLedgerDb.markFulfilled;
    PurchaseLedgerDb.markFulfilled = async () => { throw new Error('ledger unavailable'); };
    try {
      await expect(grantPurchase(args(playerId, transactionId))).rejects.toThrow('ledger unavailable');
      expect(balance(playerId)).toBe(1500);
      expect(ledger.rows.get(transactionId).claimedAt).toBeDefined();
    } finally { PurchaseLedgerDb.markFulfilled = mark; }
    expect(await refund(transactionId)).toMatchObject({ taken: 500 });
    expect(balance(playerId)).toBe(1000);
  });

  test('a capped wallet is refunded only for the coins actually credited', async () => {
    const playerId = id();
    const transactionId = id();
    await accountEconomy.initializePlayerEconomy(playerId);
    // Set via a revision-guarded save, not by mutating the stored object.
    const economy = structuredClone(docs.get(playerId));
    economy.currencies.coins.amount = 999_900;
    await accountEconomy.updatePlayerEconomyCache(playerId, economy);
    expect(await grantPurchase(args(playerId, transactionId))).toMatchObject({ granted: true });
    expect(balance(playerId)).toBe(999_999);
    expect((await accountEconomy.getPurchaseCreditReceipt(playerId, transactionId)).credited).toBe(99);
    expect(await refund(transactionId)).toMatchObject({ taken: 99, shortfall: 0 });
    expect(balance(playerId)).toBe(999_900);
  });

  test('receipt mismatch and exhausted receipt capacity fail closed', async () => {
    const playerId = id();
    await accountEconomy.initializePlayerEconomy(playerId);
    await accountEconomy.creditPurchaseOnce(playerId, 'mismatch', { currency: 'coins', amount: 500 });
    await expect(accountEconomy.creditPurchaseOnce(playerId, 'mismatch', { currency: 'coins', amount: 3000 }))
      .rejects.toMatchObject({ code: 'purchase_receipt_mismatch' });
    const economy = structuredClone(docs.get(playerId));
    economy.purchaseCredits = Object.fromEntries(Array.from({ length: 4096 }, (_, n) => [String(n), { currency: 'coins', amount: 500 }]));
    await accountEconomy.updatePlayerEconomyCache(playerId, economy);
    await expect(accountEconomy.creditPurchaseOnce(playerId, id(), { currency: 'coins', amount: 500 }))
      .rejects.toMatchObject({ code: 'purchase_receipt_limit' });
  });
});
