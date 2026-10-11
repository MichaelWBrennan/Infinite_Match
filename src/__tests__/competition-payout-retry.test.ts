import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import request from 'supertest';
import authRoutes from '../routes/auth.js';
import liveOpsRoutes from '../routes/live-ops.js';
import AccountEconomyService, { accountEconomy } from '../services/economy/AccountEconomyService.js';
import { PlayerEconomyDb } from '../services/economy/PlayerEconomyDb.js';
import { socialStore } from '../services/social/social-store.js';
import { rbacProvider, ROLES } from '../core/security/rbac.js';

// The two durable stores are represented separately. Each economy update copies its data,
// compares its revision and can commit before its acknowledgement is lost.
const realDb = { load: PlayerEconomyDb.load, save: PlayerEconomyDb.save, insert: PlayerEconomyDb.insertIfAbsent };
const oldEnv = { social: process.env.SOCIAL_STORE_FILE, live: process.env.LIVE_OPS_CONFIG,
  season: process.env.BATTLEPASS_CONFIG, store: process.env.ECONOMY_STORE };
const app = express(); app.use(express.json()); app.use('/api/auth', authRoutes); app.use('/api/live-ops', liveOpsRoutes);
const now = Date.now();
const player = `prize_p_${now}`;
const admin = `prize_a_${now}`;
let playerToken: string; let adminToken: string;
let dir: string;
let docs: Map<string, any>;
let throwAfterCommit = false;
let failBeforeCommit = false;
const coins = (id = player) => docs.get(id)?.currencies.coins.amount;
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const challengeUrl = '/api/live-ops/challenges/prize_challenge/claim';
const tournamentUrl = '/api/live-ops/tournaments/prize_tournament/settle';

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prize-retry-'));
  process.env.SOCIAL_STORE_FILE = path.join(dir, 'social.json');
  process.env.LIVE_OPS_CONFIG = path.join(dir, 'liveops.json');
  process.env.BATTLEPASS_CONFIG = path.join(dir, 'season.json');
  process.env.ECONOMY_STORE = 'mongo';
  const iso = (t: number) => new Date(t).toISOString();
  fs.writeFileSync(process.env.LIVE_OPS_CONFIG, JSON.stringify({ events: [], deals: [],
    challenges: [{ id: 'prize_challenge', name: 'Prize Test', start: iso(now - 86400000), end: iso(now + 86400000), goal: 1, reward: { coins: 400 } }],
    tournaments: [{ id: 'prize_tournament', name: 'Prize Cup', start: iso(now - 3 * 86400000), end: iso(now - 86400000), prizes: [{ from: 1, to: 1, coins: 500 }] }],
  }));
  fs.writeFileSync(process.env.BATTLEPASS_CONFIG, JSON.stringify({ season: 1234, name: 'Prize Season',
    start: iso(now - 86400000), end: iso(now + 86400000), premiumSku: 'season_pass_premium',
    xpEvents: { challenge_complete: 100 }, tiers: [{ level: 1, xp: 0, free: { coins: 10 }, premium: null }],
  }));
  docs = new Map();
  PlayerEconomyDb.load = async (id: string) => docs.has(id) ? structuredClone(docs.get(id)) : null;
  PlayerEconomyDb.insertIfAbsent = async (id: string, economy: any) => {
    if (docs.has(id)) return false;
    docs.set(id, structuredClone({ ...economy, writeRevision: 0 }));
    return true;
  };
  PlayerEconomyDb.save = async (id: string, economy: any) => {
    if (failBeforeCommit) { failBeforeCommit = false; throw new Error('offline before save'); }
    const prior = docs.get(id);
    if (!prior || prior.writeRevision !== economy.writeRevision) return false;
    docs.set(id, structuredClone({ ...economy, writeRevision: prior.writeRevision + 1 }));
    if (throwAfterCommit) { throwAfterCommit = false; throw new Error('acknowledgement lost'); }
    return true;
  };
  const p = await request(app).post('/api/auth/register')
    .send({ playerId: player, email: `${player}@example.com`, password: 'secret123' });
  const a = await request(app).post('/api/auth/register')
    .send({ playerId: admin, email: `${admin}@example.com`, password: 'secret123' });
  playerToken = p.body.token as string;
  adminToken = a.body.token as string;
  expect(playerToken).toBeTruthy(); expect(adminToken).toBeTruthy();
  rbacProvider.assignRole(admin, ROLES.ADMIN, 'test');
  await socialStore.recordWin(player, { level: 1, score: 1000,
    challengeIds: ['prize_challenge'], tournamentIds: ['prize_tournament'] });
});
afterAll(() => {
  PlayerEconomyDb.load = realDb.load;
  PlayerEconomyDb.save = realDb.save;
  PlayerEconomyDb.insertIfAbsent = realDb.insert;
  for (const [name, value] of Object.entries({ SOCIAL_STORE_FILE: oldEnv.social,
    LIVE_OPS_CONFIG: oldEnv.live, BATTLEPASS_CONFIG: oldEnv.season, ECONOMY_STORE: oldEnv.store })) {
    if (value === undefined) delete process.env[name]; else process.env[name] = value;
  }
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('competition prizes across social and economy stores', () => {
  test('challenge coin and season XP commit in one save; lost acknowledgement retries without paying twice', async () => {
    throwAfterCommit = true;
    const first = await request(app).post(challengeUrl).set(auth(playerToken));
    expect(first.status).toBe(500);
    expect(coins()).toBe(1400);
    expect(docs.get(player).battlePass.xp).toBe(100);
    expect(await socialStore.hasPayout('challenge:prize_challenge', player)).toBe(false);

    const retry = await request(app).post(challengeUrl).set(auth(playerToken));
    expect(retry.status).toBe(200);
    expect(retry.body.result).toMatchObject({ duplicate: true, balances: { coins: 1400 } });
    expect(coins()).toBe(1400);
    expect(docs.get(player).battlePass.xp).toBe(100);
    expect(await socialStore.hasPayout('challenge:prize_challenge', player)).toBe(true);
    const again = await request(app).post(challengeUrl).set(auth(playerToken));
    expect(again.status).toBe(409);
    expect(again.body.error).toBe('already_claimed');
    const view = await accountEconomy.getPlayerEconomyView(player);
    expect(view.competitionPayouts).toBeUndefined();
    expect(Object.keys(docs.get(player).competitionPayouts)).toHaveLength(1);
  });

  test('tournament retry after a committed credit of the payout never pays it a second time', async () => {
    throwAfterCommit = true;
    const first = await request(app).post(tournamentUrl).set(auth(adminToken));
    expect(first.body.result.failed).toEqual([1]);
    expect(coins()).toBe(1900);
    expect(await socialStore.hasPayout('tournament:prize_tournament', player)).toBe(false);
    const retry = await request(app).post(tournamentUrl).set(auth(adminToken));
    expect(retry.body.result).toMatchObject({ paid: [], alreadyPaid: [1], failed: [] });
    expect(coins()).toBe(1900);
    const again = await request(app).post(tournamentUrl).set(auth(adminToken));
    expect(again.body.result.alreadyPaid).toEqual([1]);
    expect(coins()).toBe(1900);
  });

  test('a held reservation without a receipt is not reported as paid or automatically cleared', async () => {
    const id = `payout_hold_${now}`;
    const signup = await request(app).post('/api/auth/register')
      .send({ playerId: id, email: `${id}@example.com`, password: 'secret123' });
    expect(signup.status).toBe(200);
    await accountEconomy.initializePlayerEconomy(id);
    const ticket = 'challenge:prize_challenge';
    await socialStore.recordWin(id, { level: 1, score: 900, challengeIds: ['prize_challenge'] });
    // Crash between the social reservation and the economy save.
    await socialStore.reservePayout(ticket, id);
    const response = await request(app).post(challengeUrl).set(auth(signup.body.token));
    expect(response.status).toBe(503);
    expect(response.body.error).toBe('payout_unconfirmed');
    expect(await socialStore.hasPayout(ticket, id)).toBe(true);
    expect(coins(id)).toBe(1000);
  });

  test('a failed challenge save releases its social reservation for one safe retry', async () => {
    const id = `payout_retry_${now}`;
    const signup = await request(app).post('/api/auth/register')
      .send({ playerId: id, email: `${id}@example.com`, password: 'secret123' });
    expect(signup.status).toBe(200);
    await accountEconomy.initializePlayerEconomy(id);
    await socialStore.recordWin(id, { level: 1, score: 700, challengeIds: ['prize_challenge'] });
    failBeforeCommit = true;
    const first = await request(app).post(challengeUrl).set(auth(signup.body.token));
    expect(first.status).toBe(500);
    expect(coins(id)).toBe(1000);
    expect(await socialStore.hasPayout('challenge:prize_challenge', id)).toBe(false);
    const retry = await request(app).post(challengeUrl).set(auth(signup.body.token));
    expect(retry.status).toBe(200);
    expect(retry.body.result.duplicate).toBe(false);
    expect(coins(id)).toBe(1400);
    expect(docs.get(id).battlePass.xp).toBe(100);
  });

  test('conflicting payouts, stale writers and a failed save never mint a second prize', async () => {
    const id = `prize_direct_${now}`;
    const firstWorker = new AccountEconomyService();
    const staleWorker = new AccountEconomyService();
    await firstWorker.initializePlayerEconomy(id);
    const stale = structuredClone(await staleWorker.getPlayerEconomy(id));
    expect((await firstWorker.grantCompetitionRewardOnce(id, 'tournament:another_cup', 100)).duplicate).toBe(false);
    staleWorker.accountEconomyData.set(id, stale);
    expect((await staleWorker.grantCompetitionRewardOnce(id, 'tournament:another_cup', 100)).duplicate).toBe(true);
    expect(coins(id)).toBe(1100);
    await expect(firstWorker.grantCompetitionRewardOnce(id, 'tournament:another_cup', 200))
      .rejects.toMatchObject({ code: 'competition_receipt_mismatch' });
    failBeforeCommit = true;
    await expect(firstWorker.grantCompetitionRewardOnce(id, 'challenge:new_cup', 100))
      .rejects.toThrow('offline before save');
    expect(coins(id)).toBe(1100);
    expect(await firstWorker.getCompetitionPayoutReceipt(id, 'challenge:new_cup', 100)).toBeNull();

    const capped = structuredClone(docs.get(id));
    capped.currencies.coins.amount = 999_900;
    await firstWorker.updatePlayerEconomyCache(id, capped);
    expect((await firstWorker.grantCompetitionRewardOnce(id, 'challenge:capped_prize', 500)).credited).toBe(99);
    expect(coins(id)).toBe(999_999);
    expect((await firstWorker.grantCompetitionRewardOnce(id, 'challenge:capped_prize', 500)).duplicate).toBe(true);
    expect(coins(id)).toBe(999_999);
    expect(Object.keys(docs.get(id).competitionPayouts)).toHaveLength(2);
    await expect(firstWorker.grantCompetitionRewardOnce(id, 'challenge:capped_prize', 1000))
      .rejects.toMatchObject({ code: 'competition_receipt_mismatch' });

    const corrupt = structuredClone(docs.get(id));
    const paidKey = Object.keys(corrupt.competitionPayouts).find(
      (key) => corrupt.competitionPayouts[key].key === 'tournament:another_cup')!;
    corrupt.competitionPayouts[paidKey].credited = -1;
    await firstWorker.updatePlayerEconomyCache(id, corrupt);
    await expect(firstWorker.getCompetitionPayoutReceipt(id, 'tournament:another_cup', 100))
      .rejects.toMatchObject({ code: 'competition_receipt_mismatch' });
    await expect(firstWorker.grantCompetitionRewardOnce(id, 'tournament:another_cup', 100))
      .rejects.toMatchObject({ code: 'competition_receipt_mismatch' });

    const atLimit = structuredClone(docs.get(id));
    atLimit.competitionPayouts = Object.fromEntries(
      Array.from({ length: 4096 }, (_, n) => [String(n), { amount: 1 }]));
    await firstWorker.updatePlayerEconomyCache(id, atLimit);
    await expect(firstWorker.grantCompetitionRewardOnce(id, 'tournament:new_cup', 100))
      .rejects.toMatchObject({ code: 'competition_receipt_limit' });
    expect(coins(id)).toBe(999_999);
  });
});
