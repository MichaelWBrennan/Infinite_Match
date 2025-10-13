import mongoose from 'mongoose';
import { AppConfig } from '../../core/config/index.js';

const adEventSchema = new mongoose.Schema(
  {
    userId: { type: String, index: true },
    country: { type: String, index: true },
    network: { type: String, index: true },
    format: { type: String, index: true }, // rewarded, interstitial, banner
    event: { type: String, index: true }, // impression, click, load, fill
    revenueUsd: { type: Number, default: 0 },
    placement: String,
  },
  { timestamps: true }
);

let AdEvent;
let connected = false;
async function ensure() {
  if (connected) return;
  await mongoose.connect(AppConfig.database.url, AppConfig.database.options || {});
  AdEvent = mongoose.models.AdEvent || mongoose.model('AdEvent', adEventSchema);
  connected = true;
}

export const AdEventDb = {
  async record(doc) {
    await ensure();
    await new AdEvent(doc).save();
  },
  async metrics({ days = 7, country, format }) {
    await ensure();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const match = { createdAt: { $gte: since } };
    if (country) match.country = country;
    if (format) match.format = format;
    const agg = await AdEvent.aggregate([
      { $match: match },
      { $group: { _id: { network: '$network' }, revenue: { $sum: '$revenueUsd' }, impressions: { $sum: { $cond: [{ $eq: ['$event', 'impression'] }, 1, 0] } } } },
      { $project: { network: '$_id.network', revenue: 1, impressions: 1, ecpm: { $cond: [{ $gt: ['$impressions', 0] }, { $multiply: [{ $divide: ['$revenue', '$impressions'] }, 1000] }, 0] } } },
      { $sort: { ecpm: -1 } },
    ]);
    return agg;
  },
};

export default AdEventDb;
