/**
 * The one place a purchase becomes something the player owns.
 *
 * Every payment source (Stripe, Apple, Google) calls grantPurchase.
 *
 *  - entitlement (e.g. remove_ads): recorded in the purchase ledger, which entitlement checks read.
 *  - consumable (e.g. coin packs): the ledger row is claimed by one request, the coins are
 *    credited, then the row is marked fulfilled. A claim is never retried after a credit may
 *    have happened, so a retry cannot pay out twice. A crash between credit and mark leaves
 *    the row claimed but unfulfilled; support must check it by hand.
 *
 * The amount is the price in effect at `atMs`, never a value from the caller. A transaction
 * belongs to one player: another player presenting it is refused.
 *
 * Infrastructure failures throw GrantRetryableError (or the underlying error), so the
 * payment provider redelivers the event. A permanent refusal returns { granted: false }.
 */

import { Logger } from '../../core/logger/index.js';
import PurchaseLedgerDb from './PurchaseLedgerDb.js';
import PurchaseLedger from './PurchaseLedger.js';
import { productFor } from './product-catalog.js';
import { priceFor } from '../live-ops/live-ops.js';
import { accountEconomy } from '../economy/AccountEconomyService.js';
import { isDurableEconomy } from '../economy/PlayerEconomyDb.js';

const logger = new Logger('PurchaseGrants');

/** Thrown when the grant cannot finish now but should be retried. */
export class GrantRetryableError extends Error {
  constructor(reason) {
    super(reason);
    this.name = 'GrantRetryableError';
    this.reason = reason;
  }
}

const defaultCredit = (playerId, grants) =>
  accountEconomy.updateCurrency(playerId, grants.currency, grants.amount, 'add', 'purchase');

/** Appends the file audit line. The grant is already stored, so a failure here is only logged. */
async function audit(doc) {
  try {
    await PurchaseLedger.recordPurchase({ ...doc, amount: doc.amountUsd });
  } catch (error) {
    logger.warn('Audit ledger write failed', { transactionId: doc.transactionId, error: error.message });
  }
}

/**
 * Returns { granted: true, duplicate } or { granted: false, reason }.
 * Options `credit` and `durable` exist for tests; production uses the defaults.
 */
export async function grantPurchase({
  playerId,
  productId,
  transactionId,
  platform,
  atMs = Date.now(),
  credit = defaultCredit,
  durable = isDurableEconomy(),
}) {
  if (typeof playerId !== 'string' || playerId === '') return { granted: false, reason: 'player_required' };
  if (typeof transactionId !== 'string' || transactionId === '') {
    return { granted: false, reason: 'transaction_required' };
  }
  const product = productFor(productId);
  if (!product) return { granted: false, reason: 'unknown_product' };
  // Never record a consumable we cannot credit durably. Stripe/store will redeliver it.
  if (product.kind === 'consumable' && !durable) throw new GrantRetryableError('durable_economy_required');

  const price = priceFor(productId, atMs);
  const doc = {
    transactionId,
    productId,
    playerId,
    platform,
    amountUsd: price.priceCents / 100,
    currency: price.currency,
    priceCents: price.priceCents,
    onDeal: price.deal,
    // Entitlements are fulfilled when recorded. Consumables start unfulfilled.
    fulfilled: product.kind === 'entitlement',
  };

  const { inserted } = await PurchaseLedgerDb.recordPurchase(doc);
  const row = inserted ? doc : await PurchaseLedgerDb.findPurchaseByTransaction(transactionId);
  if (!row) throw new GrantRetryableError('transaction_unavailable');
  if (row.playerId !== playerId) return { granted: false, reason: 'transaction_claimed' };
  // Refunded or voided: never granted, even if the provider delivers the purchase again.
  if (row.reversedAt) return { granted: false, reason: 'reversed' };

  // Fulfilled rows: entitlements, or consumables already credited. Rows saved before the
  // field existed are entitlements, so only an explicit `false` means unfulfilled.
  if (row.fulfilled !== false) {
    if (inserted) await audit(doc);
    return { granted: true, duplicate: !inserted };
  }

  const claimed = await PurchaseLedgerDb.claimFulfillment(transactionId);
  if (!claimed) {
    // Another request holds the claim, or finished while we checked.
    const latest = await PurchaseLedgerDb.findPurchaseByTransaction(transactionId);
    if (latest && latest.fulfilled !== false) return { granted: true, duplicate: true };
    throw new GrantRetryableError('fulfillment_in_progress');
  }

  try {
    await credit(playerId, product.grants);
  } catch (error) {
    // Nothing was credited (the economy refused or could not save), so release the claim for a retry.
    await PurchaseLedgerDb.releaseFulfillment(transactionId).catch((releaseError) =>
      logger.error('Could not release fulfilment claim', { transactionId, error: releaseError.message }),
    );
    throw error;
  }
  try {
    await PurchaseLedgerDb.markFulfilled(transactionId);
  } catch (error) {
    logger.error('Credited but not marked fulfilled; check by hand', { transactionId, error: error.message });
    throw error;
  }

  await audit(doc);
  logger.info('Purchase granted', { transactionId, productId, platform, kind: product.kind });
  return { granted: true, duplicate: false };
}

export default { grantPurchase, GrantRetryableError };
