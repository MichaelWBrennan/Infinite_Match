// Live ops / social S2: energy gifts between friends. Route-level: the social store and the economy
// are the real in-memory implementations; a gift is recorded first, then credited once.
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import request from 'supertest';
import authRoutes from '../routes/auth.js';
import economyRoutes from '../routes/account-economy.js';
import socialRoutes from '../routes/social.js';
import { accountEconomy } from '../services/economy/AccountEconomyService.js';
import { socialStore, GIFT_DAILY_LIMIT, ENERGY_GIFT_AMOUNT, BOOSTER_GIFT_DAILY_LIMIT, BOOSTER_GIFT_AMOUNT } from '../services/social/social-store.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/account-economy', economyRoutes);
app.use('/api/social', socialRoutes);

let dir: string;
const tokens: Record<string, string> = {};
// Registration is limited to 5 per 15 minutes per process, so keep the cast to five players.
const ids = ['alice', 'bob', 'carol', 'gina', 'hank'];
let seq = 0;
const gift = (token: string, receiverId: string, giftId = `g${Date.now()}_${seq++}`) =>
  request(app).post('/api/social/gifts/energy').set({ Authorization: `Bearer ${tokens[token]}` }).send({ receiverId, giftId });

async function energyOf(playerId: string) {
  const economy: any = await accountEconomy.getPlayerEconomy(playerId);
  return economy.currencies.energy.amount as number;
}
async function setEnergy(playerId: string, amount: number) {
  const economy: any = await accountEconomy.getPlayerEconomy(playerId);
  economy.currencies.energy.amount = amount;
  economy.currencies.energy.lastRegen = Date.now();
  await accountEconomy.updatePlayerEconomyCache(playerId, economy);
}
async function befriend(a: string, b: string) {
  const codeB = (await socialStore.profile(b)).code;
  await socialStore.requestFriend(a, codeB);
  await socialStore.acceptFriend(b, a);
}

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'energy-gifts-'));
  process.env.SOCIAL_STORE_FILE = path.join(dir, 'social.json');
  for (const id of ids) {
    const registered = await request(app).post('/api/auth/register').send({ playerId: id, email: `${id}@example.com`, password: 'secret123' });
    expect(registered.status).toBe(200);
    tokens[id] = registered.body.token;
    await socialStore.setName(id, id[0].toUpperCase() + id.slice(1));
  }
  await befriend('alice', 'bob');
  await befriend('carol', 'bob');
  await befriend('hank', 'gina');
});

afterAll(() => {
  delete process.env.SOCIAL_STORE_FILE;
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('energy gifts between friends (S2)', () => {
  test('guests cannot send a gift', async () => {
    const res = await request(app).post('/api/social/gifts/energy').send({ receiverId: 'bob', giftId: 'guest_gift_1' });
    expect(res.status).toBe(401);
  });

  test('only a friend can receive a gift, and never yourself', async () => {
    const stranger = await gift('gina', 'bob');
    expect(stranger.status).toBe(404);
    expect(stranger.body.error).toBe('not_friends');
    const self = await gift('alice', 'alice');
    expect(self.status).toBe(400);
    expect(self.body.error).toBe('self_gift');
  });

  test('a friend gift adds one energy once, costs the sender nothing, and never touches coins', async () => {
    await setEnergy('bob', 50);
    const coinsBefore = (await accountEconomy.getPlayerEconomy('alice') as any).currencies.coins.amount;
    const senderEnergy = await energyOf('alice');
    const sent = await gift('alice', 'bob', 'gift_alice_bob_1');
    expect(sent.status).toBe(200);
    expect(sent.body.result).toEqual({ giftId: 'gift_alice_bob_1', credited: ENERGY_GIFT_AMOUNT, duplicate: false });
    expect(await energyOf('bob')).toBe(50 + ENERGY_GIFT_AMOUNT);
    expect((await accountEconomy.getPlayerEconomy('alice') as any).currencies.coins.amount).toBe(coinsBefore);
    expect(await energyOf('alice')).toBe(senderEnergy);
  });

  test('a retry with the same gift id is acknowledged and credits nothing new', async () => {
    const before = await energyOf('bob');
    const retry = await gift('alice', 'bob', 'gift_alice_bob_1');
    expect(retry.status).toBe(200);
    expect(retry.body.result.duplicate).toBe(true);
    expect(await energyOf('bob')).toBe(before);
  });

  test('a gift id cannot be reused by a different sender', async () => {
    const reused = await gift('carol', 'bob', 'gift_alice_bob_1');
    expect(reused.status).toBe(409);
    expect(reused.body.error).toBe('gift_id_reused');
  });

  test('a sender gives at most three gifts a day, and a receiver takes at most three', async () => {
    const sentSoFar = 1;
    for (let i = sentSoFar; i < GIFT_DAILY_LIMIT; i++) expect((await gift('alice', 'bob')).status).toBe(200);
    const senderLimit = await gift('alice', 'bob');
    expect(senderLimit.status).toBe(409);
    expect(senderLimit.body.error).toBe('gift_sender_limit');
    // Bob has now received three gifts today; a different friend (carol) is refused too.
    const receiverLimit = await gift('carol', 'bob');
    expect(receiverLimit.status).toBe(409);
    expect(receiverLimit.body.error).toBe('gift_receiver_limit');
  });

  test('a full receiver gets nothing, but the gift is still recorded once', async () => {
    await setEnergy('gina', 100);
    const full = await gift('hank', 'gina', 'gift_hank_gina_1');
    expect(full.status).toBe(200);
    expect(full.body.result.credited).toBe(0);
    expect(await energyOf('gina')).toBe(100);
    const again = await gift('hank', 'gina', 'gift_hank_gina_1');
    expect(again.body.result.duplicate).toBe(true);
  });

  test('gift records and receipts are not part of the player view', async () => {
    const view = await request(app).get('/api/account-economy/data').set({ Authorization: `Bearer ${tokens.bob}` });
    expect(view.status).toBe(200);
    expect(JSON.stringify(view.body)).not.toContain('energyGifts');
  });
});

describe('booster gifts between friends (S2)', () => {
  const boosterGift = (token: string, receiverId: string, boosterId: string, giftId = `bg${Date.now()}_${seq++}`) =>
    request(app).post('/api/social/gifts/booster')
      .set({ Authorization: `Bearer ${tokens[token]}` })
      .send({ receiverId, giftId, boosterId });

  test('guests cannot send a booster gift', async () => {
    const res = await request(app).post('/api/social/gifts/booster')
      .send({ receiverId: 'bob', giftId: 'guest_bg_1', boosterId: 'color_bomb' });
    expect(res.status).toBe(401);
  });

  test('only a friend can receive a booster gift, and never yourself', async () => {
    const stranger = await boosterGift('gina', 'bob', 'color_bomb');
    expect(stranger.status).toBe(404);
    expect(stranger.body.error).toBe('not_friends');
    const self = await boosterGift('alice', 'alice', 'color_bomb');
    expect(self.status).toBe(400);
    expect(self.body.error).toBe('self_gift');
  });

  test('an invalid booster id is refused', async () => {
    // hank and gina are friends, use them for a clean test
    const bad = await boosterGift('hank', 'gina', 'not_a_booster');
    expect(bad.status).toBe(400);
    expect(bad.body.error).toBe('invalid_booster');
  });

  test('a friend booster gift adds one booster once, costs the sender nothing', async () => {
    const before = (await accountEconomy.getPlayerEconomy('gina') as any).inventory.boosters.color_bomb.count;
    const sent = await boosterGift('hank', 'gina', 'color_bomb', 'gift_booster_hank_gina_1');
    expect(sent.status).toBe(200);
    expect(sent.body.result).toMatchObject({ giftId: 'gift_booster_hank_gina_1', credited: BOOSTER_GIFT_AMOUNT, duplicate: false });
    const after = (await accountEconomy.getPlayerEconomy('gina') as any).inventory.boosters.color_bomb.count;
    expect(after).toBe(before + BOOSTER_GIFT_AMOUNT);
  });

  test('a retry with the same gift id is acknowledged and credits nothing new', async () => {
    const before = (await accountEconomy.getPlayerEconomy('gina') as any).inventory.boosters.color_bomb.count;
    const retry = await boosterGift('hank', 'gina', 'color_bomb', 'gift_booster_hank_gina_1');
    expect(retry.status).toBe(200);
    expect(retry.body.result.duplicate).toBe(true);
    const after = (await accountEconomy.getPlayerEconomy('gina') as any).inventory.boosters.color_bomb.count;
    expect(after).toBe(before);
  });

  test('a booster gift id cannot be reused by a different sender', async () => {
    // alice and gina are not yet friends; befriend them so the gift_id_reused check fires
    const ginaCode = (await socialStore.profile('gina')).code;
    await socialStore.requestFriend('alice', ginaCode);
    await socialStore.acceptFriend('gina', 'alice');
    // hank already used gift_booster_hank_gina_1 to send to gina
    const reused = await boosterGift('alice', 'gina', 'color_bomb', 'gift_booster_hank_gina_1');
    expect(reused.status).toBe(409);
    expect(reused.body.error).toBe('gift_id_reused');
  });

  test('a sender gives at most one booster a day (carol and bob are already friends)', async () => {
    // carol→bob: carol hasn't sent any boosters, bob hasn't received any boosters
    expect((await boosterGift('carol', 'bob', 'striped_candy', 'bg_sender_0')).status).toBe(200);
    const senderLimit = await boosterGift('carol', 'bob', 'extra_moves', 'bg_sender_limit');
    expect(senderLimit.status).toBe(409);
    expect(senderLimit.body.error).toBe('gift_sender_limit');
  });

  test('a receiver takes at most one booster a day, from any senders (bob already received from carol)', async () => {
    // bob's booster receiver counter is now 1 from the previous test
    const receiverLimit = await boosterGift('alice', 'bob', 'bomb', 'bg_receiver_limit');
    expect(receiverLimit.status).toBe(409);
    expect(receiverLimit.body.error).toBe('gift_receiver_limit');
  });

  test('booster gift counts are capped at maxCount (99)', async () => {
    const economy: any = await accountEconomy.getPlayerEconomy('alice');
    economy.inventory.boosters.color_bomb.count = 99;
    await accountEconomy.updatePlayerEconomyCache('alice', economy);
    const full = await boosterGift('bob', 'alice', 'color_bomb', 'gift_booster_bob_alice_1');
    expect(full.status).toBe(200);
    expect(full.body.result.credited).toBe(0);
    const again = await boosterGift('bob', 'alice', 'color_bomb', 'gift_booster_bob_alice_1');
    expect(again.body.result.duplicate).toBe(true);
  });

  test('booster gift records and receipts are not part of the player view', async () => {
    const view = await request(app).get('/api/account-economy/data').set({ Authorization: `Bearer ${tokens.bob}` });
    expect(view.status).toBe(200);
    expect(JSON.stringify(view.body)).not.toContain('boosterGifts');
  });
});
