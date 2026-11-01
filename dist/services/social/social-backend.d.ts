export function isMongoSocialStore(env?: NodeJS.ProcessEnv): boolean;
/** Production keeps social state in the database too, so several servers share one copy. */
export function assertSocialStoreForEnvironment(env?: NodeJS.ProcessEnv): void;
/** The mongoose-backed collection for production. Connects on first use, as the economy does. */
export function mongoSocialCollection(): Promise<any>;
/** The backend the running server uses, or null for the JSON file. */
export function socialBackendFromEnv(env?: NodeJS.ProcessEnv): MongoSocialBackend | null;
/**
 * One-time import of the JSON file into an empty shared store. Idempotent: if the shared document
 * already exists, nothing changes. Returns 'imported', 'already-present' or 'no-file'.
 */
export function importSocialFile(backend: any, data: any): Promise<"no-file" | "already-present" | "imported">;
/**
 * Shared storage for social state (live ops S1): one MongoDB document holds the whole social
 * state, with a revision number. A write succeeds only if the revision it read is still current,
 * so two servers cannot overwrite each other. SocialStore retries a write that lost the race.
 *
 * Opt-in: SOCIAL_STORE=mongo. Without it the store keeps using the JSON file (one server only).
 * The guard in assertSocialStoreForEnvironment refuses to start production without Mongo, as the
 * economy does.
 */
export const SOCIAL_DOC_KEY: "social";
/**
 * Compare-and-set over a collection with two operations: findOne({ key }) and
 * updateOne(filter, update, options). The real collection is a mongoose model; tests pass a fake.
 */
export class MongoSocialBackend {
    constructor(collection: any);
    collection: any;
    /** The current data and its revision. A missing document is revision 0 with no data. */
    load(): Promise<{
        data: any;
        revision: any;
    }>;
    /**
     * Saves data only if the stored revision is still `revision`. Returns false when another
     * writer got there first (the caller reloads and retries). Revision 0 means "no document yet".
     */
    save(data: any, revision: any): Promise<boolean>;
}
//# sourceMappingURL=social-backend.d.ts.map