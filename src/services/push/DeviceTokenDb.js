import mongoose from 'mongoose';
import { AppConfig } from '../../core/config/index.js';

const tokenSchema = new mongoose.Schema(
  {
    userId: { type: String, index: true },
    token: { type: String, index: true, unique: true },
    platform: String,
    locale: String,
  },
  { timestamps: true },
);

let DeviceToken;
let connected = false;
async function ensure() {
  if (connected) return;
  await mongoose.connect(AppConfig.database.url, AppConfig.database.options || {});
  DeviceToken = mongoose.models.DeviceToken || mongoose.model('DeviceToken', tokenSchema);
  connected = true;
}

export const DeviceTokenDb = {
  async upsert({ userId, token, platform, locale }) {
    await ensure();
    await DeviceToken.updateOne(
      { token },
      { $set: { userId, platform: platform || null, locale: locale || null } },
      { upsert: true },
    );
  },

  /** All device tokens registered for a user. Returns [{ token, platform, locale }]. */
  async findByUserId(userId) {
    await ensure();
    const docs = await DeviceToken.find({ userId }).lean();
    return docs.map((doc) => ({
      token: doc.token,
      platform: doc.platform,
      locale: doc.locale,
    }));
  },
};

export default DeviceTokenDb;
