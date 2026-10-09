/**
 * Undoes a purchase after a refund, a chargeback, or a store void. Every provider calls
 * reverseTransaction, so the rule is the same everywhere.
 *
 *  - entitlement (e.g. remove_ads): marked reversed. Entitlement checks no longer count it.
 *  - consumable (coin packs): the granted coins are taken back, down to zero. Coins the
 *    player already spent cannot be taken back. The shortfall is stored on the refund record
 *    so it can be followed up. The balance never goes negative.
 *
 * The reversal is claimed once, so a repeated webhook cannot debit twice. A debit that succeeded
 * before the record was marked is logged for a manual check, and the webhook is failed so the
 * provider retries. Infrastructure failures throw GrantRetryableError.
 */

import { Logger } from '../../core/logger/index.js';
import PurchaseLedgerDb from './PurchaseLedgerDb.js';
import { productFor, PRODUCTS } from './product-catalog.js';
import { accountEconomy } from '../economy/AccountEconomyService.js';
import { isDurableEconomy } from '../economy/PlayerEconomyDb.js';
import { GrantRetryableError } from './purchase-grants.js';
import ReceiptVerificationService from './ReceiptVerificationService.js';

const logger = new Logger('PurchaseRefunds');

const defaultDebit = (playerId, grants) =>
  accountEconomy.reverseCurrency(playerId, grants.currency, grants.amount, 'purchase_reversal');

/**
 * Reverses the purchase stored under any of `transactionIds`. A provider can key one purchase by
 * more than one id (Apple: original and per-transaction), so each candidate is tried.
 * Returns { reversed: false, reason } or { reversed: true, kind, shortfall }.
 */
export async function reverseTransaction({
  transactionIds,
  reason,
  durable = isDurableEconomy(),
  debit = defaultDebit,
}) {
  const ids = [...new Set((transactionIds || []).filter((id) => typeof id === 'string' && id !== ''))];
  let transactionId = null;
  let row = null;
  for (const id of ids) {
    const found = await PurchaseLedgerDb.findPurchaseByTransaction(id);
    if (found) {
      transactionId = id;
      row = found;
      break;
    }
  }
  if (!row) return { reversed: false, reason: 'unknown_transaction' };
  if (row.reversedAt) return { reversed: false, reason: 'already_reversed' };
  const product = productFor(row.productId);
  if (!product) return { reversed: false, reason: 'unknown_product' };

  if (product.kind === 'entitlement') {
    await PurchaseLedgerDb.markReversed(transactionId, { shortfall: 0, reason });
    logger.info('Entitlement reversed', { transactionId, productId: row.productId, reason });
    return { reversed: true, kind: 'entitlement', shortfall: 0 };
  }

  // Consumable. A purchase that was never credited has nothing to take back. It is reversed
  // atomically with the grant's claim, so the grant cannot credit it afterwards.
  if (row.fulfilled === false && !row.claimedAt) {
    const reversedNow = await PurchaseLedgerDb.reverseUnfulfilled(transactionId, reason);
    if (!reversedNow) throw new GrantRetryableError('fulfilment_in_progress');
    logger.info('Uncredited purchase reversed', { transactionId, reason });
    return { reversed: true, kind: 'consumable', shortfall: 0, taken: 0 };
  }
  if (row.fulfilled === false) throw new GrantRetryableError('fulfilment_in_progress');

  if (!durable) throw new GrantRetryableError('durable_economy_required');
  const claimed = await PurchaseLedgerDb.claimReversal(transactionId);
  if (!claimed) throw new GrantRetryableError('reversal_in_progress');

  let outcome;
  try {
    outcome = await debit(row.playerId, product.grants);
  } catch (error) {
    // Nothing was debited (the economy refused or could not save), so a retry may take the claim.
    await PurchaseLedgerDb.releaseReversal(transactionId).catch((releaseError) =>
      logger.error('Could not release reversal claim', { transactionId, error: releaseError.message }),
    );
    throw error;
  }
  try {
    await PurchaseLedgerDb.markReversed(transactionId, { shortfall: outcome.shortfall, reason });
  } catch (error) {
    logger.error('Debited but not marked reversed; check by hand', { transactionId, error: error.message });
    throw error;
  }
  await PurchaseLedgerDb.recordRefund({
    transactionId,
    playerId: row.playerId,
    productId: row.productId,
    amountUsd: row.amountUsd,
    currency: row.currency,
    reason,
    coinsReversed: outcome.taken,
    shortfall: outcome.shortfall,
  });
  logger.info('Consumable purchase reversed', {
    transactionId,
    productId: row.productId,
    taken: outcome.taken,
    shortfall: outcome.shortfall,
    reason,
  });
  return { reversed: true, kind: 'consumable', shortfall: outcome.shortfall, taken: outcome.taken };
}

/** The ids Apple may have used for a purchase, from a verified signedTransactionInfo. */
export function appleTransactionIds(transactionInfo) {
  return [transactionInfo?.originalTransactionId, transactionInfo?.transactionId]
    .filter((id) => id !== undefined && id !== null)
    .map(String);
}

/**
 * The ids Google may have used for a purchase, from its purchase token. The ledger keys an Android
 * purchase by a hash of its SKU and token, so each catalog SKU is tried.
 */
export function googleTransactionIds(purchaseToken) {
  if (typeof purchaseToken !== 'string' || purchaseToken === '') return [];
  return Object.values(PRODUCTS).map((product) =>
    ReceiptVerificationService.buildAndroidTransactionId({ productId: product.skus.android, purchaseToken }),
  );
}

export default { reverseTransaction, appleTransactionIds, googleTransactionIds };
