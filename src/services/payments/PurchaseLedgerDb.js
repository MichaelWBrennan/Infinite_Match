import mongoose from 'mongoose';
import { AppConfig } from '../../core/config/index.js';
import { Logger } from '../../core/logger/index.js';

const logger = new Logger('PurchaseLedgerDb');

const purchaseSchema = new mongoose.Schema(
  {
    transactionId: { type: String, index: true, unique: true, sparse: true },
    productId: String,
    platform: String,
    acknowledged: Boolean,
    playerId: String,
    amountUsd: Number,
    currency: String,
    // Consumables: `claimedAt` is set by the one request that credits the purchase, and
    // `fulfilled` once the credit is stored. Entitlements are fulfilled when recorded.
    fulfilled: { type: Boolean, default: false },
    claimedAt: Date,
    // Refunds, chargebacks, and store voids. `reversedAt` is set once; a reversed purchase is
    // never granted and no longer counts as owned. `reversalClaimedAt` is taken by the one request
    // that debits the coins, so a retry cannot debit twice.
    reversedAt: Date,
    reversalClaimedAt: Date,
    reversedShortfall: Number,
    reversalReason: String,
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } },
);

const refundSchema = new mongoose.Schema(
  {
    transactionId: { type: String, index: true },
    playerId: String,
    amountUsd: Number,
    currency: String,
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } },
);

const subEventSchema = new mongoose.Schema(
  {
    provider: String,
    eventType: String,
    raw: mongoose.Schema.Types.Mixed,
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } },
);

let PurchaseModel;
let RefundModel;
let SubEventModel;
let connected = false;

async function ensureConnection() {
  if (connected) return;
  const uri = AppConfig.database.url;
  await mongoose.connect(uri, AppConfig.database.options || {});
  PurchaseModel = mongoose.models.Purchase || mongoose.model('Purchase', purchaseSchema);
  RefundModel = mongoose.models.Refund || mongoose.model('Refund', refundSchema);
  SubEventModel =
    mongoose.models.SubscriptionEvent || mongoose.model('SubscriptionEvent', subEventSchema);
  connected = true;
  logger.info('Connected to MongoDB for ledger');
}

export const PurchaseLedgerDb = {
  /**
   * Stores one purchase, keyed on transactionId. Resolves { inserted } and throws on
   * failure, so a caller never grants an entitlement that was not saved.
   */
  async recordPurchase(doc) {
    if (!doc?.transactionId) throw new Error('transactionId required');
    await ensureConnection();
    const res = await PurchaseModel.updateOne(
      { transactionId: doc.transactionId },
      { $setOnInsert: { ...doc } },
      { upsert: true },
    );
    return { inserted: res.upsertedCount > 0 };
  },
  /**
   * Atomically takes the right to fulfil an unfulfilled purchase. Resolves true for one caller only.
   */
  async claimFulfillment(transactionId) {
    await ensureConnection();
    const res = await PurchaseModel.updateOne(
      { transactionId, fulfilled: { $ne: true }, claimedAt: { $exists: false }, reversedAt: { $exists: false } },
      { $set: { claimedAt: new Date() } },
    );
    return res.modifiedCount === 1;
  },
  /** Gives back a claim after a failed credit, so a retry can take it again. */
  async releaseFulfillment(transactionId) {
    await ensureConnection();
    await PurchaseModel.updateOne({ transactionId, fulfilled: { $ne: true } }, { $unset: { claimedAt: 1 } });
  },
  async markFulfilled(transactionId) {
    await ensureConnection();
    await PurchaseModel.updateOne({ transactionId }, { $set: { fulfilled: true } });
  },
  /**
   * Reverses a consumable that was never credited. Atomic with the grant's claim: whichever of
   * the two runs first wins, and the other one refuses. Resolves true only for the reversal.
   */
  async reverseUnfulfilled(transactionId, reason) {
    await ensureConnection();
    const res = await PurchaseModel.updateOne(
      { transactionId, fulfilled: { $ne: true }, claimedAt: { $exists: false }, reversedAt: { $exists: false } },
      { $set: { reversedAt: new Date(), reversedShortfall: 0, reversalReason: reason } },
    );
    return res.modifiedCount === 1;
  },
  /** Takes the right to debit a reversed consumable's coins. Resolves true for one caller only. */
  async claimReversal(transactionId) {
    await ensureConnection();
    const res = await PurchaseModel.updateOne(
      { transactionId, reversedAt: { $exists: false }, reversalClaimedAt: { $exists: false } },
      { $set: { reversalClaimedAt: new Date() } },
    );
    return res.modifiedCount === 1;
  },
  /** Gives back a reversal claim after a failed debit, so a retry can take it again. */
  async releaseReversal(transactionId) {
    await ensureConnection();
    await PurchaseModel.updateOne({ transactionId, reversedAt: { $exists: false } }, { $unset: { reversalClaimedAt: 1 } });
  },
  async markReversed(transactionId, { shortfall = 0, reason = 'unspecified' } = {}) {
    await ensureConnection();
    await PurchaseModel.updateOne(
      { transactionId },
      { $set: { reversedAt: new Date(), reversedShortfall: shortfall, reversalReason: reason } },
    );
  },
  async findPurchaseByTransaction(transactionId) {
    await ensureConnection();
    return PurchaseModel.findOne({ transactionId }).lean();
  },
  async recordRefund(doc) {
    try {
      await ensureConnection();
      await new RefundModel(doc).save();
    } catch (error) {
      logger.error('recordRefund failed', { error: error.message });
    }
  },
  async recordSubscriptionEvent(doc) {
    try {
      await ensureConnection();
      await new SubEventModel(doc).save();
    } catch (error) {
      logger.error('recordSubscriptionEvent failed', { error: error.message });
    }
  },
  async revenueSince(days = 30) {
    try {
      await ensureConnection();
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const pipeline = [
        { $match: { createdAt: { $gte: since }, amountUsd: { $gt: 0 } } },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$amountUsd' },
            payers: { $addToSet: '$playerId' },
          },
        },
      ];
      const res = await PurchaseModel.aggregate(pipeline);
      const revenue = res[0]?.revenue || 0;
      const payers = res[0]?.payers?.filter(Boolean)?.length || 0;
      return { revenue, payers };
    } catch (error) {
      logger.error('revenueSince failed', { error: error.message });
      return { revenue: 0, payers: 0 };
    }
  },
  async hasPurchase(playerId, productId) {
    try {
      await ensureConnection();
      const found = await PurchaseModel.findOne({ playerId, productId, reversedAt: { $exists: false } }).lean();
      return Boolean(found);
    } catch (error) {
      logger.error('hasPurchase failed', { error: error.message });
      return false;
    }
  },
  async listPurchases(playerId) {
    try {
      await ensureConnection();
      return await PurchaseModel.find({ playerId, reversedAt: { $exists: false } }).lean();
    } catch (error) {
      logger.error('listPurchases failed', { error: error.message });
      return [];
    }
  },
};

export default PurchaseLedgerDb;
