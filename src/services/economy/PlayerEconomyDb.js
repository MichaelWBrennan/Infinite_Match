/**
 * Durable store for player economy documents (balances, inventory, kingdom).
 *
 * Opt-in: the economy only writes here when ECONOMY_STORE=mongo. Without it,
 * balances live in memory and are lost on restart, so consumable purchases refuse
 * to credit (see purchase-grants.js).
 */

import mongoose from 'mongoose';
import { AppConfig } from '../../core/config/index.js';

export function isDurableEconomy() {
  return process.env.ECONOMY_STORE === 'mongo';
}

/**
 * Production keeps player balances in the database. Without ECONOMY_STORE=mongo they live in
 * memory and are lost on restart, so the server refuses to start rather than run that way.
 */
export function assertEconomyStoreForEnvironment(env = process.env) {
  if (env.NODE_ENV === 'production' && env.ECONOMY_STORE !== 'mongo') {
    throw new Error('ECONOMY_STORE=mongo is required when NODE_ENV=production: player balances must be saved');
  }
}

const economySchema = new mongoose.Schema(
  {
    playerId: { type: String, unique: true, required: true },
    economy: mongoose.Schema.Types.Mixed,
    revision: Number,
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } },
);

let EconomyModel = null;
let connecting = null;

async function ensureModel() {
  if (EconomyModel) return EconomyModel;
  if (!connecting) {
    connecting = (async () => {
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(AppConfig.database.url, AppConfig.database.options || {});
      }
      EconomyModel = mongoose.models.PlayerEconomy || mongoose.model('PlayerEconomy', economySchema);
      return EconomyModel;
    })().catch((error) => {
      connecting = null;
      throw error;
    });
  }
  return connecting;
}

// Legacy documents have no revision; their first guarded update starts at zero.
const revisionFilter = (playerId, revision) => ({
  playerId,
  ...(revision === 0 ? { $or: [{ revision: 0 }, { revision: { $exists: false } }] } : { revision }),
});

export const PlayerEconomyDb = {
  async load(playerId) {
    const Model = await ensureModel();
    const doc = await Model.findOne({ playerId }).lean();
    return doc ? { ...doc.economy, writeRevision: doc.revision ?? 0 } : null;
  },
  // Create only: racing initialisations must never reset another worker's balance.
  async insertIfAbsent(playerId, economy) {
    const Model = await ensureModel();
    const result = await Model.updateOne({ playerId },
      { $setOnInsert: { economy, revision: 0 } }, { upsert: true });
    return result.upsertedCount === 1;
  },
  // Atomic compare-and-swap of the whole economy. A stale worker cannot erase another
  // worker's attempt/receipt/currency write. The caller must reload and re-evaluate rules.
  async save(playerId, economy) {
    const Model = await ensureModel();
    const revision = economy.writeRevision ?? 0;
    const body = { ...economy };
    delete body.writeRevision;
    const result = await Model.updateOne(revisionFilter(playerId, revision),
      { $set: { economy: body }, $inc: { revision: 1 } });
    return result.matchedCount === 1;
  },
  async saveIfPending(playerId, attemptId, economy) {
    const Model = await ensureModel();
    const revision = economy.writeRevision ?? 0;
    const body = { ...economy };
    delete body.writeRevision;
    const result = await Model.updateOne(
      { ...revisionFilter(playerId, revision), 'economy.pendingAttempt.id': attemptId },
      { $set: { economy: body }, $inc: { revision: 1 } },
    );
    return result.matchedCount === 1;
  },
};

export default PlayerEconomyDb;
