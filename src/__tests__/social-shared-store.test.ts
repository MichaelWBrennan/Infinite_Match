// Live ops S1 (social and sync plan): shared social store. A fake collection enforces the same
// compare-and-set and unique-key rules as MongoDB, so two store instances behave like two servers.
// A real MongoDB is not available in this environment; that check is still open (see the plan).
import { describe, expect, test } from '@jest/globals';
import { MAX_GUILD_MEMBERS, SocialError, SocialStore } from '../services/social/social-store.js';
import { MongoSocialBackend, assertSocialStoreForEnvironment, importSocialFile } from '../services/social/social-backend.js';

function fakeCollection() {
  let doc: any = null;
  const collection = {
    get doc() { return doc; },
    async findOne(filter: any) { return doc && doc.key === filter.key ? structuredClone(doc) : null; },
    async updateOne(filter: any, update: any, options: any = {}) {
      if (filter.revision && typeof filter.revision === 'object' && filter.revision.$exists === false) {
        if (doc) {
          // Insert path with a document already present: the unique key rejects it, as in MongoDB.
          if (options.upsert) throw Object.assign(new Error('E11000 duplicate key'), { code: 11000 });
          return { matchedCount: 0, upsertedCount: 0 };
        }
        if (!options.upsert) return { matchedCount: 0, upsertedCount: 0 };
        doc = structuredClone({ key: filter.key, ...update.$setOnInsert });
        return { matchedCount: 0, upsertedCount: 1 };
      }
      if (!doc || doc.key !== filter.key || doc.revision !== filter.revision) return { matchedCount: 0, upsertedCount: 0 };
      doc.data = structuredClone(update.$set.data);
      doc.revision += update.$inc.revision;
      return { matchedCount: 1, upsertedCount: 0 };
    },
  };
  return collection;
}

const storeOn = (collection: any) => new SocialStore(null, new MongoSocialBackend(collection));

describe('shared social store (S1)', () => {
  test('two servers on one store see the same profile, friend request and guild', async () => {
    const shared = fakeCollection();
    const serverA = storeOn(shared);
    const serverB = storeOn(shared);
    const alice = await serverA.profile('alice');
    const bob = await serverB.profile('bob');
    await serverA.setName('alice', 'Alice');
    await serverB.setName('bob', 'Bobby');
    await serverB.requestFriend('bob', alice.code);
    await serverA.acceptFriend('alice', 'bob');
    expect(JSON.stringify(await serverB.friends('bob'))).toContain('Alice');
    const guild = await serverA.createGuild('alice', 'Lantern Club');
    expect((await serverB.myGuild('alice'))?.id ?? guild.id).toBe(guild.id);
    expect(shared.doc.revision).toBeGreaterThan(1);
    expect(bob.code).toBeTruthy();
  });

  test('a guild filled from two servers at once never exceeds the member limit', async () => {
    const shared = fakeCollection();
    const a = storeOn(shared);
    const b = storeOn(shared);
    const guild = await a.createGuild('owner', 'Lantern Club');
    const joins = Array.from({ length: 40 }, (_, i) => (i % 2 ? b : a).joinGuild(`p${i}`, guild.id));
    const results = await Promise.allSettled(joins);
    const admitted = results.filter((r) => r.status === 'fulfilled').length;
    const refused = results.filter((r) => r.status === 'rejected');
    expect(admitted).toBe(MAX_GUILD_MEMBERS - 1);
    expect(refused.every((r: any) => r.reason instanceof SocialError && ['guild_full', 'social_store_busy'].includes(r.reason.code))).toBe(true);
    expect(shared.doc.data.guilds[guild.id].members).toHaveLength(MAX_GUILD_MEMBERS);
  });

  test('a write that keeps losing the race gives a clear busy error and saves nothing', async () => {
    const never = { findOne: async () => ({ key: 'social', data: null, revision: 3 }), updateOne: async () => ({ matchedCount: 0, upsertedCount: 0 }) };
    const store = storeOn(never);
    await expect(store.profile('carol')).rejects.toMatchObject({ code: 'social_store_busy' });
  });

  test('a validation error inside a write saves nothing and reaches the caller', async () => {
    const shared = fakeCollection();
    const store = storeOn(shared);
    await expect(store.createGuild('dave', 'x')).rejects.toMatchObject({ code: 'invalid_name' });
    expect(shared.doc).toBeNull();
  });

  test('importing the JSON file is idempotent: a second import changes nothing', async () => {
    const shared = fakeCollection();
    const backend = new MongoSocialBackend(shared);
    const file = { version: 2, profiles: { eve: { name: 'Eve', code: 'ABCD1234', createdAt: '2026-10-01T00:00:00Z' } }, friends: {}, requests: {}, guildOf: {}, guilds: {}, bestScores: {}, competitions: {}, rankReceipts: {}, payouts: {} };
    expect(await importSocialFile(backend, file)).toBe('imported');
    const after = structuredClone(shared.doc);
    expect(await importSocialFile(backend, { ...file, profiles: {} })).toBe('already-present');
    expect(shared.doc).toEqual(after);
    expect((await storeOn(shared).profile('eve')).code).toBe('ABCD1234');
    expect(await importSocialFile(backend, null)).toBe('no-file');
  });

  test('production refuses to start without SOCIAL_STORE=mongo; development is unaffected', () => {
    expect(() => assertSocialStoreForEnvironment({ NODE_ENV: 'production' } as any)).toThrow('SOCIAL_STORE=mongo is required');
    expect(() => assertSocialStoreForEnvironment({ NODE_ENV: 'production', SOCIAL_STORE: 'mongo' } as any)).not.toThrow();
    expect(() => assertSocialStoreForEnvironment({ NODE_ENV: 'development' } as any)).not.toThrow();
  });
});
