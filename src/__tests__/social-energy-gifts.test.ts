// Live ops S2 (social and sync plan): energy gift rules in the social store. A fake collection
// enforces compare-and-set like MongoDB, so two store instances behave like two servers. The real
// MongoDB check is still open (see the plan); this is the only evidence for the shared path.
import { describe, expect, test } from '@jest/globals';
import { GIFT_DAILY_LIMIT, SocialError, SocialStore } from '../services/social/social-store.js';
import { MongoSocialBackend } from '../services/social/social-backend.js';

// Same compare-and-set and unique-key rules as social-shared-store.test.ts.
function fakeCollection() {
  let doc: any = null;
  return {
    async findOne(filter: any) { return doc && doc.key === filter.key ? structuredClone(doc) : null; },
    async updateOne(filter: any, update: any, options: any = {}) {
      if (filter.revision && typeof filter.revision === 'object' && filter.revision.$exists === false) {
        if (doc) {
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
}

const storeOn = (collection: any) => new SocialStore(null, new MongoSocialBackend(collection));
const DAY = Date.UTC(2026, 9, 11, 12); // 2026-10-11 12:00 UTC

async function befriend(store: SocialStore, a: string, b: string) {
  const code = (await store.profile(b)).code;
  await store.requestFriend(a, code);
  await store.acceptFriend(b, a);
}

async function network(store: SocialStore, players: string[]) {
  for (const id of players) await store.setName(id, `P${id.toUpperCase()}`);
}

async function errorOf(promise: Promise<unknown>) {
  try { await promise; } catch (error) { return error instanceof SocialError ? error.code : error; }
  return null;
}

describe('energy gifts in the social store (S2)', () => {
  test('gifts go to friends only, and never to yourself', async () => {
    const store = storeOn(fakeCollection());
    await network(store, ['alice', 'bob', 'carol']);
    await befriend(store, 'alice', 'bob');
    expect(await errorOf(store.reserveEnergyGift('alice', 'carol', 'gift_stranger1', DAY))).toBe('not_friends');
    expect(await errorOf(store.reserveEnergyGift('alice', 'alice', 'gift_self_0001', DAY))).toBe('self_gift');
  });

  test('a gift id must be well formed', async () => {
    const store = storeOn(fakeCollection());
    await network(store, ['alice', 'bob']);
    await befriend(store, 'alice', 'bob');
    expect(await errorOf(store.reserveEnergyGift('alice', 'bob', 'short', DAY))).toBe('invalid_gift');
    expect(await errorOf(store.reserveEnergyGift('alice', 'bob', 'has spaces here', DAY))).toBe('invalid_gift');
    expect(await errorOf(store.reserveEnergyGift('alice', 'bob', undefined as any, DAY))).toBe('invalid_gift');
  });

  test('a sender gives at most three gifts a day', async () => {
    const store = storeOn(fakeCollection());
    await network(store, ['alice', 'bob', 'carol', 'gina', 'hank']);
    for (const friend of ['bob', 'carol', 'gina', 'hank']) await befriend(store, 'alice', friend);
    for (const [i, friend] of ['bob', 'carol', 'gina'].entries()) {
      expect((await store.reserveEnergyGift('alice', friend, `gift_sender_${i}`, DAY)).reserved).toBe(true);
    }
    expect(await errorOf(store.reserveEnergyGift('alice', 'hank', 'gift_sender_3', DAY))).toBe('gift_sender_limit');
  });

  test('a receiver takes at most three gifts a day, from any senders', async () => {
    const store = storeOn(fakeCollection());
    await network(store, ['rec', 's1', 's2', 's3', 's4']);
    for (const sender of ['s1', 's2', 's3', 's4']) await befriend(store, sender, 'rec');
    for (const [i, sender] of ['s1', 's2', 's3'].entries()) {
      await store.reserveEnergyGift(sender, 'rec', `gift_recv_${i}`, DAY);
    }
    expect(await errorOf(store.reserveEnergyGift('s4', 'rec', 'gift_recv_3', DAY))).toBe('gift_receiver_limit');
  });

  test('a retry with the same id counts once, so the sender keeps the other two gifts', async () => {
    const store = storeOn(fakeCollection());
    await network(store, ['alice', 'bob']);
    await befriend(store, 'alice', 'bob');
    const first = await store.reserveEnergyGift('alice', 'bob', 'gift_retry_01', DAY);
    const retry = await store.reserveEnergyGift('alice', 'bob', 'gift_retry_01', DAY + 1000);
    expect(first.reserved).toBe(true);
    expect(retry).toEqual({ gift: first.gift, reserved: false });
    await store.reserveEnergyGift('alice', 'bob', 'gift_retry_02', DAY);
    await store.reserveEnergyGift('alice', 'bob', 'gift_retry_03', DAY);
    expect(await errorOf(store.reserveEnergyGift('alice', 'bob', 'gift_retry_04', DAY))).toBe('gift_sender_limit');
  });

  test('a gift id used by a different pair is refused', async () => {
    const store = storeOn(fakeCollection());
    await network(store, ['alice', 'bob', 'carol']);
    await befriend(store, 'alice', 'bob');
    await store.reserveEnergyGift('alice', 'bob', 'gift_reuse_01', DAY);
    expect(await errorOf(store.reserveEnergyGift('carol', 'bob', 'gift_reuse_01', DAY))).toBe('gift_id_reused');
    expect(await errorOf(store.reserveEnergyGift('alice', 'carol', 'gift_reuse_01', DAY))).toBe('gift_id_reused');
  });

  test('daily limits reset at the next UTC day', async () => {
    const store = storeOn(fakeCollection());
    await network(store, ['alice', 'bob']);
    await befriend(store, 'alice', 'bob');
    for (let i = 0; i < GIFT_DAILY_LIMIT; i++) await store.reserveEnergyGift('alice', 'bob', `gift_day_0${i}`, DAY);
    expect(await errorOf(store.reserveEnergyGift('alice', 'bob', 'gift_day_09', DAY))).toBe('gift_sender_limit');
    const tomorrow = DAY + 24 * 60 * 60 * 1000;
    expect((await store.reserveEnergyGift('alice', 'bob', 'gift_day_10', tomorrow)).reserved).toBe(true);
  });

  test('two servers sending to one receiver at once admit exactly three gifts', async () => {
    const shared = fakeCollection();
    const serverA = storeOn(shared);
    const serverB = storeOn(shared);
    await network(serverA, ['rec', 's1', 's2', 's3', 's4', 's5']);
    for (const sender of ['s1', 's2', 's3', 's4', 's5']) await befriend(serverA, sender, 'rec');
    const attempts = ['s1', 's2', 's3', 's4', 's5'].map((sender, i) =>
      (i % 2 ? serverA : serverB).reserveEnergyGift(sender, 'rec', `gift_race_0${i}`, DAY));
    const results = await Promise.allSettled(attempts);
    const admitted = results.filter((r) => r.status === 'fulfilled');
    const refused = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
    expect(admitted).toHaveLength(GIFT_DAILY_LIMIT);
    expect(refused).toHaveLength(2);
    expect(refused.every((r) => r.reason instanceof SocialError && r.reason.code === 'gift_receiver_limit')).toBe(true);
  });

  test('marking a gift credited records the amount actually added, and a missing gift is refused', async () => {
    const store = storeOn(fakeCollection());
    await network(store, ['alice', 'bob']);
    await befriend(store, 'alice', 'bob');
    await store.reserveEnergyGift('alice', 'bob', 'gift_mark_001', DAY);
    expect(await store.markEnergyGiftCredited('gift_mark_001', 0)).toEqual({ id: 'gift_mark_001', credited: 0 });
    expect(await errorOf(store.markEnergyGiftCredited('gift_missing1', 1))).toBe('gift_not_found');
  });
});
