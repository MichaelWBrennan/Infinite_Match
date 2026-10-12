// Live ops S3: guild milestone reward through the Express routes. The social store and the economy
// are the real in-memory implementations. Registration is limited to 5 per 15 minutes per process.
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
import { socialStore, MILESTONE_GOAL, MILESTONE_REWARD_COINS } from '../services/social/social-store.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/account-economy', economyRoutes);
app.use('/api/social', socialRoutes);

let dir: string;
const tokens: Record<string, string> = {};
let seq = 0;

async function coinsOf(playerId: string) {
  const economy: any = await accountEconomy.getPlayerEconomy(playerId);
  return economy.currencies.coins;
}
async function setCoins(playerId: string, amount: number) {
  const economy: any = await accountEconomy.getPlayerEconomy(playerId);
  economy.currencies.coins.amount = amount;
  await accountEconomy.updatePlayerEconomyCache(playerId, economy);
}
const get = (who: string) => request(app).get('/api/social/milestone').set({ Authorization: `Bearer ${tokens[who]}` });
const claim = (who: string) => request(app).post('/api/social/milestone/claim').set({ Authorization: `Bearer ${tokens[who]}` });

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'milestone-route-'));
  process.env.SOCIAL_STORE_FILE = path.join(dir, 'social.json');
  for (const id of ['alice', 'bob', 'carol']) {
    const registered = await request(app).post('/api/auth/register').send({ playerId: id, email: `${id}@example.com`, password: 'secret123' });
    expect(registered.status).toBe(200);
    tokens[id] = registered.body.token;
    await socialStore.setName(id, id[0].toUpperCase() + id.slice(1));
  }
  const guild = await socialStore.createGuild('alice', 'Lantern Club');
  await socialStore.joinGuild('bob', guild.id);
  await socialStore.joinGuild('carol', guild.id);
  const now = Date.now();
  // 30 verified wins by alice and 20 by bob reach the goal of 50.
  for (let i = 0; i < 30; i++) await socialStore.recordMilestoneWin('alice', `alice_win_${seq++}`, true, now);
  for (let i = 0; i < MILESTONE_GOAL - 30; i++) await socialStore.recordMilestoneWin('bob', `bob_win_${seq++}`, true, now);
});

afterAll(() => {
  delete process.env.SOCIAL_STORE_FILE;
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('guild milestone reward (S3) through the routes', () => {
  test('guests have no milestone', async () => {
    const res = await request(app).get('/api/social/milestone');
    expect(res.status).toBe(401);
  });

  test('a contributing member sees the reached goal and can claim', async () => {
    const res = await get('alice');
    expect(res.status).toBe(200);
    expect(res.body.result).toMatchObject({ inGuild: true, count: MILESTONE_GOAL, reached: true, contributed: 30, canClaim: true, claimed: false });
  });

  test('a member with no verified win cannot claim', async () => {
    const res = await claim('carol');
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('no_milestone_contribution');
  });

  test('a claim grants the coins once, and a retry grants nothing', async () => {
    const before = (await coinsOf('alice')).amount;
    const first = await claim('alice');
    expect(first.status).toBe(200);
    expect(first.body.result).toMatchObject({ coins: MILESTONE_REWARD_COINS, duplicate: false });
    expect((await coinsOf('alice')).amount).toBe(before + MILESTONE_REWARD_COINS);
    const retry = await claim('alice');
    expect(retry.status).toBe(200);
    expect(retry.body.result.duplicate).toBe(true);
    expect((await coinsOf('alice')).amount).toBe(before + MILESTONE_REWARD_COINS);
    expect((await get('alice')).body.result).toMatchObject({ claimed: true, canClaim: false });
  });

  test('each contributing member gets their own single grant', async () => {
    const before = (await coinsOf('bob')).amount;
    expect((await claim('bob')).body.result.duplicate).toBe(false);
    expect((await claim('bob')).body.result.duplicate).toBe(true);
    expect((await coinsOf('bob')).amount).toBe(before + MILESTONE_REWARD_COINS);
  });

  test('a full coin wallet refuses the claim without losing it; room later allows it', async () => {
    await socialStore.recordMilestoneWin('carol', `carol_win_${seq++}`, true, Date.now());
    const wallet = await coinsOf('carol');
    await setCoins('carol', wallet.maxAmount);
    const full = await claim('carol');
    expect(full.status).toBe(409);
    expect(full.body.error).toBe('milestone_wallet_full');
    await setCoins('carol', 0);
    const later = await claim('carol');
    expect(later.status).toBe(200);
    expect(later.body.result).toMatchObject({ coins: MILESTONE_REWARD_COINS, duplicate: false });
    expect((await coinsOf('carol')).amount).toBe(MILESTONE_REWARD_COINS);
  });

  test('milestone grants are not part of the player view', async () => {
    const view = await request(app).get('/api/account-economy/data').set({ Authorization: `Bearer ${tokens.alice}` });
    expect(view.status).toBe(200);
    expect(JSON.stringify(view.body)).not.toContain('milestoneGrants');
  });
});
