/** Read-only operator triage for old, held provider claims. Never infer that an absent
 * receipt proves a credit/debit did not occur; even an old write can be ambiguous.
 * No player IDs, payment IDs, balances or payment receipts leave this service.
 */
import PurchaseLedgerDb from './PurchaseLedgerDb.js';
import { productFor } from './product-catalog.js';
import { accountEconomy } from '../economy/AccountEconomyService.js';
import { isDurableEconomy } from '../economy/PlayerEconomyDb.js';

export const CLAIM_REPORT_MIN_AGE_MS = 15 * 60 * 1000;
export const CLAIM_REPORT_LIMIT = 100;

function matchesCredit(receipt, grants) {
  return receipt.currency === grants.currency && receipt.amount === grants.amount &&
    Number.isSafeInteger(receipt.credited) && receipt.credited >= 0 &&
    receipt.credited <= grants.amount;
}
function matchesDebit(receipt, grants) {
  return receipt.currency === grants.currency && receipt.amount === grants.amount &&
    Number.isSafeInteger(receipt.taken) && receipt.taken >= 0 &&
    Number.isSafeInteger(receipt.shortfall) && receipt.shortfall >= 0 &&
    receipt.taken + receipt.shortfall <= grants.amount;
}

export async function reportStalePaymentClaims(nowMs = Date.now()) {
  if (!isDurableEconomy()) throw new Error('durable_economy_required');
  const before = new Date(nowMs - CLAIM_REPORT_MIN_AGE_MS);
  if (!Number.isFinite(before.getTime())) throw new Error('invalid_claim_report_time');
  const rows = await PurchaseLedgerDb.listStaleClaims(before, CLAIM_REPORT_LIMIT);
  if (!Array.isArray(rows)) throw new Error('invalid_claim_report_result');
  const report = {
    minimumAgeMinutes: CLAIM_REPORT_MIN_AGE_MS / 60000,
    sampled: Math.min(rows.length, CLAIM_REPORT_LIMIT),
    hasMore: rows.length > CLAIM_REPORT_LIMIT,
    fulfillment: { confirmedReceipt: 0, noConfirmedReceipt: 0, mismatch: 0 },
    reversal: { confirmedReceipt: 0, noConfirmedReceipt: 0, mismatch: 0 },
    invalidRows: 0,
  };
  for (const row of rows.slice(0, CLAIM_REPORT_LIMIT)) {
    const grants = row?.productId && productFor(row.productId)?.grants;
    if (!row?.playerId || !row.transactionId || !grants) {
      report.invalidRows++;
      continue;
    }
    // A reversal takes precedence when both old claim fields happen to be present.
    const reversing = row.reversalClaimedAt && new Date(row.reversalClaimedAt).getTime() <= before.getTime();
    const bucket = reversing ? report.reversal : report.fulfillment;
    const receipt = reversing
      ? await accountEconomy.getPurchaseDebitReceipt(row.playerId, row.transactionId)
      : await accountEconomy.getPurchaseCreditReceipt(row.playerId, row.transactionId);
    if (!receipt) bucket.noConfirmedReceipt++;
    else if (reversing ? matchesDebit(receipt, grants) : matchesCredit(receipt, grants)) bucket.confirmedReceipt++;
    else bucket.mismatch++;
  }
  return report;
}
