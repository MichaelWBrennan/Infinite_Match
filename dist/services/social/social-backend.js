/**
 * Shared storage for social state (live ops S1): one MongoDB document holds the whole social
 * state, with a revision number. A write succeeds only if the revision it read is still current,
 * so two servers cannot overwrite each other. SocialStore retries a write that lost the race.
 *
 * Opt-in: SOCIAL_STORE=mongo. Without it the store keeps using the JSON file (one server only).
 * The guard in assertSocialStoreForEnvironment refuses to start production without Mongo, as the
 * economy does.
 */
// mongoose and the app config load only when SOCIAL_STORE=mongo. The free server runs plain Node and
// imports this module for the file store, where the TypeScript config is not available.
export const SOCIAL_DOC_KEY = 'social';
export function isMongoSocialStore(env = process.env) {
    return env.SOCIAL_STORE === 'mongo';
}
/** Production keeps social state in the database too, so several servers share one copy. */
export function assertSocialStoreForEnvironment(env = process.env) {
    if (env.NODE_ENV === 'production' && env.SOCIAL_STORE !== 'mongo') {
        throw new Error('SOCIAL_STORE=mongo is required when NODE_ENV=production: social state must be shared and saved');
    }
}
/**
 * Compare-and-set over a collection with two operations: findOne({ key }) and
 * updateOne(filter, update, options). The real collection is a mongoose model; tests pass a fake.
 */
export class MongoSocialBackend {
    constructor(collection) {
        this.collection = collection;
    }
    /** The current data and its revision. A missing document is revision 0 with no data. */
    async load() {
        const doc = await this.collection.findOne({ key: SOCIAL_DOC_KEY });
        if (!doc)
            return { data: null, revision: 0 };
        return { data: doc.data ?? null, revision: Number.isSafeInteger(doc.revision) ? doc.revision : 1 };
    }
    /**
     * Saves data only if the stored revision is still `revision`. Returns false when another
     * writer got there first (the caller reloads and retries). Revision 0 means "no document yet".
     */
    async save(data, revision) {
        try {
            if (revision === 0) {
                // The unique key makes a racing insert fail with a duplicate-key error, which means "lost the race".
                const result = await this.collection.updateOne({ key: SOCIAL_DOC_KEY, revision: { $exists: false } }, { $setOnInsert: { key: SOCIAL_DOC_KEY, data, revision: 1 } }, { upsert: true });
                return result.upsertedCount === 1;
            }
            const result = await this.collection.updateOne({ key: SOCIAL_DOC_KEY, revision }, { $set: { data }, $inc: { revision: 1 } });
            return result.matchedCount === 1;
        }
        catch (error) {
            if (error && error.code === 11000)
                return false;
            throw error;
        }
    }
}
let SocialModel = null;
let connecting = null;
/** The mongoose-backed collection for production. Connects on first use, as the economy does. */
export async function mongoSocialCollection() {
    if (SocialModel)
        return SocialModel;
    if (!connecting) {
        connecting = (async () => {
            const { default: mongoose } = await import('mongoose');
            const { AppConfig } = await import('../../core/config/index.js');
            const socialSchema = new mongoose.Schema({
                key: { type: String, unique: true, required: true },
                data: mongoose.Schema.Types.Mixed,
                revision: Number,
            }, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });
            if (mongoose.connection.readyState !== 1) {
                await mongoose.connect(AppConfig.database.url, AppConfig.database.options || {});
            }
            SocialModel = mongoose.models.SocialState || mongoose.model('SocialState', socialSchema);
            return SocialModel;
        })().catch((error) => {
            connecting = null;
            throw error;
        });
    }
    return connecting;
}
/** The backend the running server uses, or null for the JSON file. */
export function socialBackendFromEnv(env = process.env) {
    if (!isMongoSocialStore(env))
        return null;
    // Resolve the collection lazily through a thin adapter, so importing this module never connects.
    const lazy = {
        findOne: async (filter) => (await mongoSocialCollection()).findOne(filter).lean(),
        updateOne: async (filter, update, options) => (await mongoSocialCollection()).updateOne(filter, update, options),
    };
    return new MongoSocialBackend(lazy);
}
/**
 * One-time import of the JSON file into an empty shared store. Idempotent: if the shared document
 * already exists, nothing changes. Returns 'imported', 'already-present' or 'no-file'.
 */
export async function importSocialFile(backend, data) {
    if (!data)
        return 'no-file';
    const current = await backend.load();
    if (current.revision !== 0)
        return 'already-present';
    const saved = await backend.save(data, 0);
    return saved ? 'imported' : 'already-present';
}
//# sourceMappingURL=social-backend.js.map