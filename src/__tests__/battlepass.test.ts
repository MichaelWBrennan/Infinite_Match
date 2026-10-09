import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import authRoutes from '../routes/auth.js';
import battlepassRoutes from '../routes/battlepass.js';
import accountEconomyRoutes from '../routes/account-economy.js';
import PurchaseLedgerDb from '../services/payments/PurchaseLedgerDb.js';
import {
  addSeasonXp,
  battlePassFor,
  planTierClaim,
  seasonStatus,
  validateSeason,
} from '../services/meta/battlepass.js';

const DAY = 86_400_000;
const shipped = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config/battlepass/config.json'), 'utf-8'));

const seasonFrom = (raw: any) => {
  const { errors, season } = validateSeason(raw);
  if (!season) throw new Error(errors.join('; '));
  return season;
};

/** The error code a rule throws, or null when it does not throw. */
const codeOf = (fn: () => unknown): string | null => {
  try {
    fn();
    return null;
  } catch (e: any) {
    return e.code ?? 'unexpected';
  }
};

const baseRaw = () => JSON.parse(JSON.stringify(shipped));
const economy = (xp = 0, season = 2) => ({ battlePass: { active: true, season, xp, claimed: { free: [], premium: [] } } });

describe('battle pass config', () => {
  test('the shipped season is valid', () => {
    const { errors, season } = validateSeason(shipped);
    expect(errors).toEqual([]);
    expect(season.tiers.length).toBe(5);
  });

  test('gems are not a reward', () => {
    const raw = baseRaw();
    raw.tiers[0].free = { gems: 10 };
    expect(validateSeason(raw).errors.join(' ')).toMatch(/free: reward needs exactly one of coins or item/);
  });

  test('a reward names a real power-up', () => {
    const raw = baseRaw();
    raw.tiers[1].premium = { item: 'color_bomb', amount: 1 };
    expect(validateSeason(raw).errors.join(' ')).toMatch(/unknown item color_bomb/);
  });

  test('tier XP must rise and tiers must be numbered in order', () => {
    const raw = baseRaw();
    raw.tiers[2].xp = 50;
    raw.tiers[3].level = 9;
    const { errors } = validateSeason(raw);
    expect(errors.join(' ')).toMatch(/tier 3: xp must be higher/);
    expect(errors.join(' ')).toMatch(/tier 4: level must be 4/);
  });

  test('the season must end after it starts', () => {
    const raw = baseRaw();
    raw.end = raw.start;
    expect(validateSeason(raw).errors).toContain('end must be after start');
  });

  test('status follows the season window', () => {
    const season = seasonFrom(baseRaw());
    expect(seasonStatus(season, season.startMs - 1)).toBe('upcoming');
    expect(seasonStatus(season, season.startMs + DAY)).toBe('active');
    expect(seasonStatus(season, season.endMs + 1)).toBe('ended');
  });
});

describe('battle pass rules', () => {
  const season = seasonFrom(baseRaw());
  const now = season.startMs + DAY;

  test('XP only counts while the season is running', () => {
    const e: any = economy(0);
    expect(addSeasonXp(e, season, 'level_complete', season.endMs + 1)).toBeNull();
    expect(addSeasonXp(e, season, 'level_complete', now)).toBe(50);
    expect(addSeasonXp(e, season, 'daily_login', now)).toBe(60);
  });

  test('a new season starts from zero', () => {
    const e: any = economy(400, 1);
    const bp = battlePassFor(e, season);
    expect(bp.season).toBe(2);
    expect(bp.xp).toBe(0);
  });

  test('a free tier claim grants its reward once', () => {
    const e: any = economy(100);
    const plan = planTierClaim(e, season, { level: 2, track: 'free', owned: false, nowMs: now });
    expect(plan.operations).toEqual([{ type: 'inventory', category: 'powerups', itemId: 'bomb', amount: 1 }]);
    plan.mark();
    expect(codeOf(() => planTierClaim(e, season, { level: 2, track: 'free', owned: false, nowMs: now }))).toBe(
      'already_claimed',
    );
  });

  test('a tier the player has not reached is refused', () => {
    expect(
      codeOf(() => planTierClaim(economy(99) as any, season, { level: 2, track: 'free', owned: false, nowMs: now })),
    ).toBe('tier_locked');
  });

  test('the premium track needs the entitlement', () => {
    expect(
      codeOf(() => planTierClaim(economy(500) as any, season, { level: 2, track: 'premium', owned: false, nowMs: now })),
    ).toBe('premium_required');
    expect(
      codeOf(() => planTierClaim(economy(500) as any, season, { level: 2, track: 'premium', owned: true, nowMs: now })),
    ).toBeNull();
  });

  test('a claim after the season ends is refused', () => {
    expect(
      codeOf(() => planTierClaim(economy(500) as any, season, { level: 1, track: 'free', owned: false, nowMs: season.endMs + 1 })),
    ).toBe('season_not_active');
  });

  test('a tier with no reward on that track is refused', () => {
    const raw = baseRaw();
    raw.tiers[0].premium = null;
    const s = seasonFrom(raw);
    expect(codeOf(() => planTierClaim(economy(0) as any, s, { level: 1, track: 'premium', owned: true, nowMs: now }))).toBe(
      'no_reward',
    );
  });
});

describe('battle pass routes', () => {
  let dir: string;
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/account-economy', accountEconomyRoutes);
  app.use('/api/battlepass', battlepassRoutes);

  // The season config is a far-future copy, so these tests do not depend on today's date.
  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bp-'));
    const raw = baseRaw();
    raw.start = '2000-01-01T00:00:00Z';
    raw.end = '2099-01-01T00:00:00Z';
    fs.writeFileSync(path.join(dir, 'season.json'), JSON.stringify(raw));
    process.env.BATTLEPASS_CONFIG = path.join(dir, 'season.json');
  });
  afterAll(() => {
    delete process.env.BATTLEPASS_CONFIG;
    fs.rmSync(dir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  let token = '';
  const playerId = `bp_${Date.now()}`;
  beforeAll(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ playerId, email: `${playerId}@example.com`, password: 'secret123' });
    token = reg.body.token as string;
    expect(token).toBeTruthy();
  });

  test('progress and claims need a session', async () => {
    expect((await request(app).get('/api/battlepass/progress')).status).toBe(401);
    expect((await request(app).post('/api/battlepass/claim').send({ level: 1, track: 'free' })).status).toBe(401);
  });

  test('a player with no XP can claim the first free tier once', async () => {
    const stats = await request(app).get('/api/account-economy/data').set('Authorization', `Bearer ${token}`);
    expect(stats.status).toBe(200);

    const first = await request(app)
      .post('/api/battlepass/claim')
      .set('Authorization', `Bearer ${token}`)
      .send({ level: 1, track: 'free' });
    expect(first.status).toBe(200);
    expect(first.body.result.reward).toEqual({ coins: 100 });
    // A new player starts with 1000 coins and has spent none, so the claim leaves 1100.
    expect(first.body.result.balances.coins).toBe(1100);

    const second = await request(app)
      .post('/api/battlepass/claim')
      .set('Authorization', `Bearer ${token}`)
      .send({ level: 1, track: 'free' });
    expect(second.status).toBe(409);
    expect(second.body.error).toBe('already_claimed');
  });

  test('the premium track is refused without the entitlement', async () => {
    jest.spyOn(PurchaseLedgerDb, 'hasPurchase').mockResolvedValue(false);
    const res = await request(app)
      .post('/api/battlepass/claim')
      .set('Authorization', `Bearer ${token}`)
      .send({ level: 1, track: 'premium' });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('premium_required');
  });

  test('a tier above the player XP is locked', async () => {
    const res = await request(app)
      .post('/api/battlepass/claim')
      .set('Authorization', `Bearer ${token}`)
      .send({ level: 5, track: 'free' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('tier_locked');
  });

  test('progress shows what was claimed', async () => {
    const res = await request(app).get('/api/battlepass/progress').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.progress.claimed.free).toEqual([1]);
    expect(res.body.progress.status).toBe('active');
  });

  test('the config route still serves the season', async () => {
    const res = await request(app).get('/api/battlepass/config');
    expect(res.status).toBe(200);
    expect(res.body.pass.season).toBe(2);
  });
});
