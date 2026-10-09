/**
 * The one place a purchase becomes an entitlement.
 *
 * Every payment source (Stripe, Apple, Google) calls grantPurchase. It records the
 * purchase in the database that entitlement checks read, and it fails loudly when
 * that write fails. The file ledger is an audit trail only, not a source of truth.
 *
 * The amount is the price in effect at `atMs` (catalog price, or an active deal), never a
 * value from the caller. A transaction ID can
 * belong to one player only: a second player who presents the same transaction is refused.
 */

import { Logger } from '../../core/logger/index.js';
import PurchaseLedgerDb from './PurchaseLedgerDb.js';
import PurchaseLedger from './PurchaseLedger.js';
import { productFor } from './product-catalog.js';
import { priceFor } from '../live-ops/live-ops.js';

const logger = new Logger('PurchaseGrants');

/**
 * Returns { granted: true, duplicate } or { granted: false, reason }.
 * Throws only when the database cannot be reached; the caller should then fail the request
 * so the payment provider retries it.
 */
export async function grantPurchase({ playerId, productId, transactionId, platform, atMs = Date.now() }) {
  if (typeof playerId !== 'string' || playerId === '') return { granted: false, reason: 'player_required' };
  if (typeof transactionId !== 'string' || transactionId === '') {
    return { granted: false, reason: 'transaction_required' };
  }
  const product = productFor(productId);
  if (!product) return { granted: false, reason: 'unknown_product' };
  const price = priceFor(productId, atMs);

  const ownerOf = (existing) =>
    existing.playerId === playerId
      ? { granted: true, duplicate: true }
      : { granted: false, reason: 'transaction_claimed' };

  const existing = await PurchaseLedgerDb.findPurchaseByTransaction(transactionId);
  if (existing) return ownerOf(existing);

  const doc = {
    transactionId,
    productId,
    playerId,
    platform,
    amountUsd: price.priceCents / 100,
    currency: price.currency,
    priceCents: price.priceCents,
    onDeal: price.deal,
  };
  const { inserted } = await PurchaseLedgerDb.recordPurchase(doc);
  if (!inserted) {
    // Another request stored the same transaction first. Check who owns it.
    const owner = await PurchaseLedgerDb.findPurchaseByTransaction(transactionId);
    return owner ? ownerOf(owner) : { granted: false, reason: 'transaction_unavailable' };
  }

  try {
    await PurchaseLedger.recordPurchase({ ...doc, amount: doc.amountUsd });
  } catch (error) {
    // The entitlement is already stored; only the audit line failed.
    logger.warn('Audit ledger write failed', { transactionId, error: error.message });
  }
  logger.info('Purchase granted', { transactionId, productId, platform });
  return { granted: true, duplicate: false };
}

export default { grantPurchase };
