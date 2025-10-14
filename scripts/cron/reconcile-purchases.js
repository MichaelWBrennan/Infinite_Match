#!/usr/bin/env node
import 'dotenv/config';
import mongoose from 'mongoose';
import { AppConfig } from '../../src/core/config/index.js';

const purchaseSchema = new mongoose.Schema(
  {
    transactionId: { type: String, index: true },
    productId: String,
    platform: String,
    acknowledged: Boolean,
    playerId: String,
    amountUsd: Number,
    currency: String,
  },
  { timestamps: true }
);

async function main() {
  const uri = AppConfig.database.url;
  await mongoose.connect(uri, AppConfig.database.options || {});
  const Purchase = mongoose.model('Purchase', purchaseSchema, 'purchases');

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const total = await Purchase.countDocuments({ createdAt: { $gte: since } });
  const unacked = await Purchase.countDocuments({ platform: 'android', acknowledged: { $ne: true }, createdAt: { $gte: since } });
  const dupes = await Purchase.aggregate([
    { $match: { createdAt: { $gte: since }, transactionId: { $ne: null } } },
    { $group: { _id: '$transactionId', c: { $sum: 1 } } },
    { $match: { c: { $gt: 1 } } },
    { $count: 'dupeCount' },
  ]);

  const report = {
    generatedAt: new Date().toISOString(),
    totalPurchases30d: total,
    unackAndroid30d: unacked,
    duplicateTransactions30d: dupes[0]?.dupeCount || 0,
  };

  console.log(JSON.stringify(report, null, 2));
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
