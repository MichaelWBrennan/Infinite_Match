import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import authRoutes from '../routes/auth.js';
import accountEconomyRoutes from '../routes/account-economy.js';
import battlepassRoutes from '../routes/battlepass.js';
import PurchaseLedgerDb from '../services/payments/PurchaseLedgerDb.js';
import { applyVip, VIP_BENEFITS, VIP_ENTITLEMENT } from '../services/meta/vip.js';
import { winRewards } from '../services/meta/rewards.js';
import { socialStore } from '../services/social/social-store.js';

const DAY = 86_400_000;

describe('VIP benefit', () => {
  test('VIP multiplies coins only', () => {
    const reward = winRewards(1);
    const vip = applyVip(reward, true);
    expect(vip.coins).toBe(Math.floor(reward.coins * VIP_BENEFITS.coinMultiplier));
    expect(vip.xp).toBe(reward.xp);
    expect(vip.stars).toBe(reward.stars);
  });

  test('without VIP the reward is unchanged', () => {
    expect(applyVip(winRewards(3), false)).toEqual(winRewards(3));
  });

  test('the VIP entitlement is named vip', () => {
    expect(VIP_ENTITLEMENT).toBe('vip');
  });
});

describe('a won level', () => {
  let dir: string;
  const now = Date.now();
  const playerId = `win_${now}`;
  let token = '';
  // Coins after the first (VIP) win. The first win also crosses a level, which pays extra coins
  // from progression, so the tests compare balances rather than assume a starting figure.
  let balanceAfterVipWin = 0;
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/account-economy', accountEconomyRoutes);
  app.use('/api/battlepass', battlepassRoutes);

  const spendAndWin = async (score: number) => {
    const spend = await request(app)
      .post('/api/account-economy/energy/spend')
      .set('Authorization', `Bearer ${token}`)
      .send({ level: 1 });
    expect(spend.status).toBe(200);
    return request(app)
      .post('/api/account-economy/level/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({ level: 1, score, attemptId: spend.body.result.attemptId });
  };

  beforeAll(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'win-'));
    process.env.SOCIAL_STORE_FILE = path.join(dir, 'social.json');
    const season = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config/battlepass/config.json'), 'utf-8'));
    season.start = '2000-01-01T00:00:00Z';
    season.end = '2099-01-01T00:00:00Z';
    process.env.BATTLEPASS_CONFIG = path.join(dir, 'season.json');
    fs.writeFileSync(process.env.BATTLEPASS_CONFIG, JSON.stringify(season));
    const live = {
      events: [],
      deals: [],
      tournaments: [
        {
          id: 'cup_win',
          name: 'Win Cup',
          start: new Date(now - DAY).toISOString(),
          end: new Date(now + DAY).toISOString(),
          prizes: [{ from: 1, to: 1, coins: 100 }],
        },
      ],
      challenges: [],
    };
    process.env.LIVE_OPS_CONFIG = path.join(dir, 'liveops.json');
    fs.writeFileSync(process.env.LIVE_OPS_CONFIG, JSON.stringify(live));

    // The auth route allows 5 registrations per 15 minutes per IP. This file registers one player.
    const reg = await request(app).post('/api/auth/register').send({ playerId, email: `${playerId}@example.com`, password: 'secret123' });
    token = reg.body.token as string;
  });

  afterAll(() => {
    jest.restoreAllMocks();
    for (const k of ['SOCIAL_STORE_FILE', 'BATTLEPASS_CONFIG', 'LIVE_OPS_CONFIG']) delete process.env[k];
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('a VIP player is paid the VIP coins for the same win', async () => {
    jest.spyOn(PurchaseLedgerDb, 'hasPurchase').mockImplementation(async (_p: string, product: string) => product === VIP_ENTITLEMENT);
    const res = await spendAndWin(900);
    expect(res.status).toBe(200);
    expect(res.body.result.vip).toBe(true);
    const coins = res.body.result.rewards.find((r: any) => r.currencyId === 'coins');
    expect(coins.amount).toBe(37); // 25 coins for one star, times 1.5
    balanceAfterVipWin = res.body.result.balances.coins;
  });

  test('a win adds season XP and shows on the tournament board', async () => {
    const progress = await request(app).get('/api/battlepass/progress').set('Authorization', `Bearer ${token}`);
    expect(progress.status).toBe(200);
    expect(progress.body.progress.xp).toBe(50);
    const board = await socialStore.tournamentBoard('cup_win', playerId);
    expect(board.you).toMatchObject({ rank: 1, score: 900 });
  });

  test('a player without VIP gets the normal coins', async () => {
    jest.spyOn(PurchaseLedgerDb, 'hasPurchase').mockResolvedValue(false);
    const res = await spendAndWin(900);
    expect(res.status).toBe(200);
    expect(res.body.result.vip).toBe(false);
    const coins = res.body.result.rewards.find((r: any) => r.currencyId === 'coins');
    expect(coins.amount).toBe(25);
    expect(res.body.result.balances.coins).toBe(balanceAfterVipWin + 25);
  });

  test('a score below the target is not a win and adds no XP', async () => {
    const res = await spendAndWin(100);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('score_below_target');
    const progress = await request(app).get('/api/battlepass/progress').set('Authorization', `Bearer ${token}`);
    expect(progress.body.progress.xp).toBe(100);
  });
});
