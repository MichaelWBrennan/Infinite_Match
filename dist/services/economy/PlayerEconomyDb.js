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
const economySchema = new mongoose.Schema({
    playerId: { type: String, unique: true, required: true },
    economy: mongoose.Schema.Types.Mixed,
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });
let EconomyModel = null;
let connecting = null;
async function ensureModel() {
    if (EconomyModel)
        return EconomyModel;
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
export const PlayerEconomyDb = {
    async load(playerId) {
        const Model = await ensureModel();
        const doc = await Model.findOne({ playerId }).lean();
        return doc ? doc.economy : null;
    },
    async save(playerId, economy) {
        const Model = await ensureModel();
        await Model.updateOne({ playerId }, { $set: { economy } }, { upsert: true });
    },
};
export default PlayerEconomyDb;
//# sourceMappingURL=PlayerEconomyDb.js.map