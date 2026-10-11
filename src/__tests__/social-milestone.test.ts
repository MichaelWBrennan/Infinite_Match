// Live ops S3 (social and sync plan): guild milestone. Contributions come only from verified wins,
// once per attempt; the reward is claimable once per member, by a member who is still in the guild.
// A fake collection enforces compare-and-set like MongoDB (real MongoDB check is still open).
import { describe, expect, test } from '@jest/globals';
import { MILESTONE_GOAL, SocialError, SocialStore } from '../services/social/social-store.js';
import { MongoSocialBackend, SOCIAL_DOC_KEY } from '../services/social/social-backend.js';

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
const WED = Date.UTC(2026, 9, 7, 12); // Wed 2026-10-07 12:00 UTC, week of Mon 2026-10-05
const NEXT_MON = Date.UTC(2026, 9, 12, 0); // Mon 2026-10-12 00:00 UTC, next week

async function errorOf(promise: Promise<unknown>) {
  try { await promise; } catch (error) { return error instanceof SocialError ? error.code : error; }
  return null;
}

async function guildOf3(store: SocialStore) {
  for (const id of ['alice', 'bob', 'carol', 'dave']) await store.setName(id, `P${id}`);
  const guild = await store.createGuild('alice', 'Lantern Club');
  await store.joinGuild('bob', guild.id);
  await store.joinGuild('carol', guild.id);
  return guild;
}

// Adds `n` verified wins for a player, with distinct attempt ids.
async function wins(store: SocialStore, playerId: string, n: number, tag = 'a') {
  for (let i = 0; i < n; i++) await store.recordMilestoneWin(playerId, `${playerId}_${tag}_${i}`, true, WED);
}

describe('guild milestone (S3)', () => {
  test('only a verified win counts, and an attempt counts once across retries', async () => {
    const store = storeOn(fakeCollection());
    await guildOf3(store);
    expect(await store.recordMilestoneWin('alice', 'att_unverified', false, WED)).toEqual({ counted: false, reason: 'unverified' });
    const first = await store.recordMilestoneWin('alice', 'att_verified_1', true, WED);
    const retry = await store.recordMilestoneWin('alice', 'att_verified_1', true, WED);
    expect(first).toEqual({ counted: true, count: 1, goal: MILESTONE_GOAL });
    expect(retry).toEqual({ counted: false, duplicate: true, count: 1, goal: MILESTONE_GOAL });
    expect((await store.milestoneView('alice', WED)).count).toBe(1);
  });

  test('a player outside a guild adds nothing and gets no progress', async () => {
    const store = storeOn(fakeCollection());
    await guildOf3(store);
    expect(await store.recordMilestoneWin('gina_outside', 'att_outside_1', true, WED)).toEqual({ counted: false, reason: 'not_in_guild' });
    const view = await store.milestoneView('gina_outside', WED);
    expect(view).toMatchObject({ inGuild: false, count: 0, canClaim: false });
  });

  test('the reward unlocks at the goal, and only for members who contributed', async () => {
    const store = storeOn(fakeCollection());
    await guildOf3(store);
    await wins(store, 'alice', 30);
    await wins(store, 'bob', MILESTONE_GOAL - 30);
    expect(await errorOf(store.milestoneClaim('carol', WED))).toBe('no_milestone_contribution');
    const alice = await store.milestoneView('alice', WED);
    expect(alice).toMatchObject({ count: MILESTONE_GOAL, reached: true, contributed: 30, canClaim: true, claimed: false });
    expect((await store.milestoneClaim('alice', WED)).claimed).toBe(false);
  });

  test('before the goal, nobody can claim', async () => {
    const store = storeOn(fakeCollection());
    await guildOf3(store);
    await wins(store, 'alice', MILESTONE_GOAL - 1);
    expect(await errorOf(store.milestoneClaim('alice', WED))).toBe('milestone_not_reached');
  });

  test('a member who leaves the guild before claiming gets nothing new', async () => {
    const store = storeOn(fakeCollection());
    await guildOf3(store);
    await wins(store, 'alice', 30);
    await wins(store, 'bob', 20);
    await store.leaveGuild('bob');
    expect(await errorOf(store.milestoneClaim('bob', WED))).toBe('not_in_guild');
    expect(await store.milestoneView('bob', WED)).toMatchObject({ inGuild: false, canClaim: false });
  });

  test('once marked claimed, the same member cannot claim again; the others still can', async () => {
    const store = storeOn(fakeCollection());
    await guildOf3(store);
    await wins(store, 'alice', 30);
    await wins(store, 'bob', 20);
    const claim = await store.milestoneClaim('alice', WED);
    await store.markMilestoneClaimed(claim.key, 'alice', WED);
    expect(await store.milestoneClaim('alice', WED)).toMatchObject({ claimed: true });
    expect((await store.milestoneView('alice', WED)).canClaim).toBe(false);
    expect((await store.milestoneView('bob', WED)).canClaim).toBe(true);
  });

  test('progress resets each UTC week, and last week cannot be claimed in the new one', async () => {
    const store = storeOn(fakeCollection());
    await guildOf3(store);
    await wins(store, 'alice', MILESTONE_GOAL);
    expect((await store.milestoneView('alice', WED)).reached).toBe(true);
    expect(await store.milestoneView('alice', NEXT_MON)).toMatchObject({ count: 0, reached: false, canClaim: false });
    expect(await errorOf(store.milestoneClaim('alice', NEXT_MON))).toBe('milestone_not_reached');
  });

  test('two servers recording the same attempt count it once, and concurrent wins are not lost', async () => {
    const shared = fakeCollection();
    const serverA = storeOn(shared);
    const serverB = storeOn(shared);
    await guildOf3(serverA);
    const same = await Promise.all([
      serverA.recordMilestoneWin('bob', 'att_same_0001', true, WED),
      serverB.recordMilestoneWin('bob', 'att_same_0001', true, WED),
    ]);
    expect(same.filter((r) => r.counted)).toHaveLength(1);
    const racing = Array.from({ length: 49 }, (_, i) =>
      (i % 2 ? serverA : serverB).recordMilestoneWin('alice', `att_race_${i}`, true, WED));
    await Promise.all(racing);
    expect((await serverA.milestoneView('alice', WED)).count).toBe(MILESTONE_GOAL);
  });

  test('wins from players outside a guild do not write to the shared store', async () => {
    const collection = fakeCollection();
    const store = storeOn(collection);
    await guildOf3(store);
    const before = (await collection.findOne({ key: SOCIAL_DOC_KEY }))?.revision;
    expect(before).toBeGreaterThan(0);
    await store.recordMilestoneWin('gina_outside', 'att_outside_2', true, WED);
    expect((await collection.findOne({ key: SOCIAL_DOC_KEY }))?.revision).toBe(before);
    await store.recordMilestoneWin('alice', 'att_member_01', true, WED);
    expect((await collection.findOne({ key: SOCIAL_DOC_KEY }))?.revision).toBeGreaterThan(before);
  });
});
