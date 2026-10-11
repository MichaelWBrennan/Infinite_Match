import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import PurchaseLedgerDb from '../services/payments/PurchaseLedgerDb.js';
import { grantPurchase } from '../services/payments/purchase-grants.js';
import { reverseTransaction, appleTransactionIds, googleTransactionIds } from '../services/payments/refunds.js';
import ReceiptVerificationService from '../services/payments/ReceiptVerificationService.js';
import { accountEconomy } from '../services/economy/AccountEconomyService.js';
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
    row(id).fulfilled = true;
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
    Object.assign(row(id), { reversedAt: new Date(), reversedShortfall: shortfall, reversalReason: reason });
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
