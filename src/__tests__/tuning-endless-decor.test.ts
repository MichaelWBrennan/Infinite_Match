import { describe, test, expect, beforeAll } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import authRoutes from '../routes/auth.js';
import { KINGDOM_ROOMS } from '../services/meta/kingdom.js';
import accountEconomyRoutes from '../routes/account-economy.js';
import kingdomRoutes from '../routes/kingdom.js';
import {
  validateOverrides,
  proposeOverrides,
  applyProposals,
  readLevelOverrides,
  writeLevelOverrides,
  levelMultiplier,
  MULTIPLIER_MIN,
  MULTIPLIER_MAX,
} from '../services/meta/level-overrides.js';
import { levelTarget, starsForScore, endlessRewards, ENDLESS_REWARDS } from '../services/meta/rewards.js';
import {
  DECOR_CATALOG,
  MAX_DECOR_OWNED,
  ensureDecor,
  planBuyDecor,
  planPlaceDecor,
  planRemoveDecor,
  decorInStock,
  DecorError,
} from '../services/meta/kingdom-decor.js';

const codeOf = (fn: () => unknown): string | null => {
  try {
    fn();
    return null;
  } catch (e: any) {
    return e.code ?? 'unexpected';
  }
};

describe('level overrides', () => {
  test('a multiplier must be inside the bounds, and 1 is dropped as the default', () => {
    const { errors, levels } = validateOverrides({ levels: { 5: 1, 6: 0.95, 7: 1.5, 8: 0.5, x: 1 } });
    expect(levels).toEqual({ 6: 0.95 });
    expect(errors).toHaveLength(3);
    expect(MULTIPLIER_MIN).toBe(0.8);
    expect(MULTIPLIER_MAX).toBe(1.2);
  });

  test('a too-hard level eases by one step, a too-easy level tightens by one step', () => {
    const summary = [
      { level: 12, flag: 'too_hard', winRate: 0.2, attempts: 40 },
      { level: 13, flag: 'too_easy', winRate: 0.99, attempts: 40 },
      { level: 14, flag: 'ok', winRate: 0.6, attempts: 40 },
    ];
    const proposals = proposeOverrides(summary, {});
    expect(proposals.map((p) => [p.level, p.from, p.to])).toEqual([
      [12, 1, 0.95],
      [13, 1, 1.05],
    ]);
  });

  test('the total change is capped at the bounds, and reaching 1 removes the entry', () => {
    const atFloor = proposeOverrides([{ level: 3, flag: 'too_hard', winRate: 0.1, attempts: 30 }], { 3: 0.8 });
    expect(atFloor).toEqual([]);
    const back = applyProposals({ 4: 1.05 }, [{ level: 4, to: 1 }]);
    expect(back).toEqual({});
  });

  test('a missing file means no overrides, and a written file reads back', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lo-'));
    try {
      const file = path.join(dir, 'overrides.json');
      expect(readLevelOverrides(file).levels).toEqual({});
      expect(levelMultiplier(9, readLevelOverrides(file))).toBe(1);
      writeLevelOverrides({ 9: 0.9 }, file, new Date('2026-01-01T00:00:00Z'));
      const back = readLevelOverrides(file);
      expect(back.levels).toEqual({ 9: 0.9 });
      expect(back.updatedAt).toBe('2026-01-01T00:00:00.000Z');
      expect(levelMultiplier(9, back)).toBe(0.9);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('targets and rewards with a multiplier', () => {
  test('the multiplier scales the target and the star thresholds with it', () => {
    expect(levelTarget(12, 1.1)).toBe(Math.round((800 + 12 * 60) * 1.1));
    expect(starsForScore(levelTarget(12, 0.9), 12, 0.9)).toBe(1);
    expect(starsForScore(levelTarget(12, 0.9) - 1, 12, 0.9)).toBe(0);
  });

  test('endless pays per point, up to the caps', () => {
    expect(endlessRewards(0)).toEqual({ coins: 0, xp: 0 });
    const { pointsPerCoin, maxCoins, pointsPerXp, maxXp } = ENDLESS_REWARDS;
    expect(endlessRewards(pointsPerCoin * 10)).toMatchObject({ coins: 10 });
    expect(endlessRewards(pointsPerXp * 3)).toMatchObject({ xp: 3 });
    expect(endlessRewards(1e9)).toEqual({ coins: maxCoins, xp: maxXp });
  });
});

describe('kingdom decorations', () => {
  const kingdom = (rooms: Record<string, number> = {}) => ({ rooms: { ...rooms } }) as any;

  test('buying needs coins, a free slot, and a known decoration', () => {
    const decor = ensureDecor(kingdom() as any);
    expect(planBuyDecor(decor, 'tapestry', 200)).toEqual({ costCoins: 200 });
    expect(codeOf(() => planBuyDecor(decor, 'tapestry', 199))).toBe('insufficient_coins');
    expect(codeOf(() => planBuyDecor(decor, 'dragon', 99999))).toBe('unknown_decor');
    decor.owned.tapestry = MAX_DECOR_OWNED;
    expect(codeOf(() => planBuyDecor(decor, 'tapestry', 99999))).toBe('decor_limit');
  });

  test('placing needs the item owned, the room empty, and the room at its level', () => {
    const [roomLow, roomHigh] = [KINGDOM_ROOMS[0].id, KINGDOM_ROOMS[1].id];
    const k = kingdom({ [roomLow]: 0, [roomHigh]: 2 });
    const decor = ensureDecor(k as any);
    expect(codeOf(() => planPlaceDecor(k, decor, roomHigh, 'banner'))).toBe('decor_not_owned');
    decor.owned.banner = 1;
    expect(codeOf(() => planPlaceDecor(k, decor, roomLow, 'banner'))).toBe('room_level_too_low');
    expect(codeOf(() => planPlaceDecor(k, decor, 'nowhere', 'banner'))).toBe('unknown_room');
    expect(planPlaceDecor(k, decor, roomHigh, 'banner')).toEqual({ roomId: roomHigh, decorId: 'banner' });
    decor.placed[roomHigh] = 'banner';
    expect(decorInStock(decor, 'banner')).toBe(0);
    decor.owned.banner = 2;
    expect(codeOf(() => planPlaceDecor(k, decor, roomHigh, 'banner'))).toBe('room_occupied');
  });

  test('removing needs something in the room', () => {
    const decor = ensureDecor({ rooms: {} } as any);
    expect(codeOf(() => planRemoveDecor(decor, 'hall'))).toBe('room_empty');
    decor.placed.hall = 'statue';
    expect(planRemoveDecor(decor, 'hall')).toEqual({ roomId: 'hall', decorId: 'statue' });
    expect(DECOR_CATALOG.fountain.priceCoins).toBe(500);
    expect(new DecorError('x').code).toBe('x');
  });
});

describe('endless and decoration routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/account-economy', accountEconomyRoutes);
  app.use('/api/kingdom', kingdomRoutes);

  let token = '';
  const playerId = `et_${Date.now()}`;
  beforeAll(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ playerId, email: `${playerId}@example.com`, password: 'secret123' });
    token = reg.body.token as string;
    expect(token).toBeTruthy();
  });

  test('endless completion needs a session and a valid score', async () => {
    expect((await request(app).post('/api/account-economy/endless/complete').send({ score: 100, attemptId: 'a' })).status).toBe(401);
    const bad = await request(app)
      .post('/api/account-economy/endless/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({ score: -5, attemptId: 'a' });
    expect(bad.status).toBe(400);
  });

  test('an endless run spends one attempt and returns the same reward on a lost-response retry', async () => {
    const spend = await request(app)
      .post('/api/account-economy/energy/spend')
      .set('Authorization', `Bearer ${token}`)
      .send({ level: 1 });
    expect(spend.status).toBe(200);
    const attemptId = spend.body.result.attemptId;
    expect(typeof attemptId).toBe('string');

    const done = await request(app)
      .post('/api/account-economy/endless/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 8000, attemptId });
    expect(done.status).toBe(200);
    expect(done.body.result.reward).toEqual(endlessRewards(8000));
    // A new player starts with 1000 coins, and this run pays the capped coin reward.
    expect(done.body.result.balances.coins).toBe(1000 + endlessRewards(8000).coins);

    const again = await request(app)
      .post('/api/account-economy/endless/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 8000, attemptId });
    expect(again.status).toBe(200);
    expect(again.body.result).toEqual({ ...done.body.result, duplicate: true });
    const changed = await request(app)
      .post('/api/account-economy/endless/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 8001, attemptId });
    expect(changed.status).toBe(400);
    expect(changed.body.error).toBe('attempt_score_mismatch');
    const view = await request(app).get('/api/account-economy/data').set('Authorization', `Bearer ${token}`);
    expect(view.body.data.statistics.endlessRuns).toBe(1);
    expect(view.body.data.currencies.coins.amount).toBe(done.body.result.balances.coins);
    expect(view.body.data.endlessReceipts).toBeUndefined();
  });

  test('decorations need a session, and buying one takes its price from coins', async () => {
    expect((await request(app).get('/api/kingdom')).status).toBe(401);
    const view = await request(app).get('/api/kingdom').set('Authorization', `Bearer ${token}`);
    expect(view.status).toBe(200);
    expect(view.body.decor.catalog.map((d: any) => d.id)).toEqual(Object.keys(DECOR_CATALOG));

    const buy = await request(app).post('/api/kingdom/decor/buy').set('Authorization', `Bearer ${token}`).send({ decorId: 'tapestry' });
    expect(buy.status).toBe(200);
    // The endless run above paid 100 coins, so 1100 less the 200 price leaves 900.
    expect(buy.body.result).toMatchObject({ decorId: 'tapestry', costCoins: 200, owned: 1, coins: 900 });

    const unknown = await request(app).post('/api/kingdom/decor/buy').set('Authorization', `Bearer ${token}`).send({ decorId: 'dragon' });
    expect(unknown.status).toBeGreaterThanOrEqual(400);
    expect(unknown.body.error).toBe('unknown_decor');
  });
});
