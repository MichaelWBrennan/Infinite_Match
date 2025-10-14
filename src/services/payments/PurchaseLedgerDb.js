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
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

const refundSchema = new mongoose.Schema(
  {
    transactionId: { type: String, index: true },
    playerId: String,
    amountUsd: Number,
    currency: String,
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

const subEventSchema = new mongoose.Schema(
  {
    provider: String,
    eventType: String,
    raw: mongoose.Schema.Types.Mixed,
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
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
  SubEventModel = mongoose.models.SubscriptionEvent || mongoose.model('SubscriptionEvent', subEventSchema);
  connected = true;
  logger.info('Connected to MongoDB for ledger');
}

export const PurchaseLedgerDb = {
  async recordPurchase(doc) {
    try {
      await ensureConnection();
      if (doc.transactionId) {
        await PurchaseModel.updateOne(
          { transactionId: doc.transactionId },
          { $setOnInsert: { ...doc } },
          { upsert: true }
        );
      } else {
        await new PurchaseModel(doc).save();
      }
    } catch (error) {
      logger.error('recordPurchase failed', { error: error.message });
    }
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
        { $group: { _id: null, revenue: { $sum: '$amountUsd' }, payers: { $addToSet: '$playerId' } } },
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
      const found = await PurchaseModel.findOne({ playerId, productId }).lean();
      return Boolean(found);
    } catch (error) {
      logger.error('hasPurchase failed', { error: error.message });
      return false;
    }
  },
  async listPurchases(playerId) {
    try {
      await ensureConnection();
      return await PurchaseModel.find({ playerId }).lean();
    } catch (error) {
      logger.error('listPurchases failed', { error: error.message });
      return [];
    }
  },
};

export default PurchaseLedgerDb;
