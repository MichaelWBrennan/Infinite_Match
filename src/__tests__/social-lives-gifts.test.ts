// Lives gifts between friends (S2): builds on the energy/booster gift infrastructure.
// A friend gives one life; the receiver can keep playing when out of lives.
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
import { socialStore, GIFT_DAILY_LIMIT, LIVES_GIFT_AMOUNT, LIVES_GIFT_DAILY_LIMIT } from '../services/social/social-store.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/account-economy', economyRoutes);
app.use('/api/social', socialRoutes);

let dir: string;
const tokens: Record<string, string> = {};
const ids = ['alice', 'bob', 'carol', 'gina', 'hank'];
let seq = 0;
const gift = (token: string, receiverId: string, giftId = `lg${Date.now()}_${seq++}`) =>
  request(app).post('/api/social/gifts/lives').set({ Authorization: `Bearer ${tokens[token]}` }).send({ receiverId, giftId });

async function livesOf(playerId: string) {
  const economy: any = await accountEconomy.getPlayerEconomy(playerId);
  return economy.currencies.lives.amount as number;
}
async function setLives(playerId: string, amount: number) {
  const economy: any = await accountEconomy.getPlayerEconomy(playerId);
  economy.currencies.lives.amount = amount;
  economy.currencies.lives.lastRegen = Date.now();
  await accountEconomy.updatePlayerEconomyCache(playerId, economy);
}
async function befriend(a: string, b: string) {
  const codeB = (await socialStore.profile(b)).code;
  await socialStore.requestFriend(a, codeB);
  await socialStore.acceptFriend(b, a);
}

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lives-gifts-'));
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

describe('lives gifts between friends (S2)', () => {
  test('guests cannot send a lives gift', async () => {
    const res = await request(app).post('/api/social/gifts/lives').send({ receiverId: 'bob', giftId: 'guest_gift_1' });
    expect(res.status).toBe(401);
  });

  test('only a friend can receive a lives gift, and never yourself', async () => {
    const stranger = await gift('gina', 'bob');
    expect(stranger.status).toBe(404);
    expect(stranger.body.error).toBe('not_friends');
    const self = await gift('alice', 'alice');
    expect(self.status).toBe(400);
    expect(self.body.error).toBe('self_gift');
  });

  test('a friend lives gift adds one life once, costs the sender nothing', async () => {
    await setLives('bob', 2);
    const before = await livesOf('bob');
    const senderLives = await livesOf('alice');
    const sent = await gift('alice', 'bob', 'gift_alice_bob_1');
    expect(sent.status).toBe(200);
    expect(sent.body.result).toEqual({ giftId: 'gift_alice_bob_1', credited: LIVES_GIFT_AMOUNT, duplicate: false });
    expect(await livesOf('bob')).toBe(before + LIVES_GIFT_AMOUNT);
    expect(await livesOf('alice')).toBe(senderLives);
  });

  test('a retry with the same gift id is acknowledged and credits nothing new', async () => {
    const before = await livesOf('bob');
    const retry = await gift('alice', 'bob', 'gift_alice_bob_1');
    expect(retry.status).toBe(200);
    expect(retry.body.result.duplicate).toBe(true);
    expect(await livesOf('bob')).toBe(before);
  });

  test('a gift id cannot be reused by a different sender', async () => {
    const reused = await gift('carol', 'bob', 'gift_alice_bob_1');
    expect(reused.status).toBe(409);
    expect(reused.body.error).toBe('gift_id_reused');
  });

  test('a sender gives at most three lives gifts a day, and a receiver takes at most three', async () => {
    const sentSoFar = 1;
    for (let i = sentSoFar; i < GIFT_DAILY_LIMIT; i++) expect((await gift('alice', 'bob')).status).toBe(200);
    const senderLimit = await gift('alice', 'bob');
    expect(senderLimit.status).toBe(409);
    expect(senderLimit.body.error).toBe('gift_sender_limit');
    const receiverLimit = await gift('carol', 'bob');
    expect(receiverLimit.status).toBe(409);
    expect(receiverLimit.body.error).toBe('gift_receiver_limit');
  });

  test('a full receiver gets nothing, but the gift is still recorded once', async () => {
    await setLives('gina', 5); // MAX_LIVES
    const full = await gift('hank', 'gina', 'gift_hank_gina_1');
    expect(full.status).toBe(200);
    expect(full.body.result.credited).toBe(0);
    expect(await livesOf('gina')).toBe(5);
    const again = await gift('hank', 'gina', 'gift_hank_gina_1');
    expect(again.body.result.duplicate).toBe(true);
  });

  test('lives gift receipts are tracked per gift id (idempotent)', async () => {
    // hank and gina have remaining gift capacity (hank sent 1, gina sent 0 today)
    await setLives('gina', 2);
    const before = await livesOf('gina');
    const first = await gift('hank', 'gina', 'gift_idempotent_hg_1');
    expect(first.status).toBe(200);
    expect(first.body.result.duplicate).toBe(false);
    expect(await livesOf('gina')).toBe(before + LIVES_GIFT_AMOUNT);
    const second = await gift('hank', 'gina', 'gift_idempotent_hg_1');
    expect(second.status).toBe(200);
    expect(second.body.result.duplicate).toBe(true);
    expect(await livesOf('gina')).toBe(before + LIVES_GIFT_AMOUNT);
  });
});
