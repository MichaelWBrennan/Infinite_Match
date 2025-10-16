import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Logger } from '../../core/logger/index.js';

const logger = new Logger('PurchaseLedger');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPORTS_DIR = join(__dirname, '..', '..', '..', 'monitoring', 'reports');

function getPeriodFile(prefix, date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return join(REPORTS_DIR, `${prefix}-${y}-${m}.jsonl`);
}

class PurchaseLedgerImpl {
  constructor() {
    this.seenTransactionIds = new Set();
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    try {
      await fs.mkdir(REPORTS_DIR, { recursive: true });
    } catch {}
    this.initialized = true;
  }

  async appendJsonl(prefix, obj) {
    await this.init();
    const file = getPeriodFile(prefix);
    const line = JSON.stringify(obj) + '\n';
    await fs.appendFile(file, line, 'utf-8');
  }

  async recordPurchase(evt) {
    const event = {
      type: 'purchase',
      timestamp: new Date().toISOString(),
      ...evt,
    };
    if (event.transactionId) this.seenTransactionIds.add(event.transactionId);
    await this.appendJsonl('purchase-ledger', event);
    logger.info('Recorded purchase', {
      transactionId: event.transactionId,
      productId: event.productId,
    });
  }

  async recordRefund(evt) {
    const event = {
      type: 'refund',
      timestamp: new Date().toISOString(),
      ...evt,
    };
    await this.appendJsonl('purchase-ledger', event);
    logger.info('Recorded refund', { transactionId: event.transactionId });
  }

  async recordSubscriptionEvent(evt) {
    const event = {
      type: 'subscription',
      timestamp: new Date().toISOString(),
      ...evt,
    };
    await this.appendJsonl('subscriptions', event);
    logger.info('Recorded subscription event', { eventType: event.eventType });
  }

  hasTransaction(transactionId) {
    if (!transactionId) return false;
    return this.seenTransactionIds.has(transactionId);
  }
}

export const PurchaseLedger = new PurchaseLedgerImpl();
export default PurchaseLedger;
