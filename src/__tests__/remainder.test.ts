import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import authRoutes from '../routes/auth.js';
import minigamesRoutes from '../routes/minigames.js';
import liveOpsRoutes from '../routes/live-ops.js';
import { FileLevelResultsStore, MemoryLevelResultsStore } from '../services/level-results-store.js';
import { planTuning, runTuning } from '../services/level-tuning.js';
import { readLevelOverrides, parseTuned } from '../services/meta/level-overrides.js';
import { tuningIntervalMs, startTuningSchedule } from '../services/level-tuning-schedule.js';
import { kingdomCoinMultiplier, ROOM_COIN_BONUS_CAP } from '../services/meta/kingdom.js';
import {
  MinigameError,
  minigameCoins,
  minigameStatus,
  planMinigamePlay,
  MINIGAMES,
  utcDay,
} from '../services/meta/minigames.js';

const DAY = 86_400_000;

const codeOf = (fn: () => unknown): string | null => {
  try {
    fn();
    return null;
  } catch (e: any) {
    return e.code ?? 'unexpected';
  }
};

const loss = (level: number, ts: number) => ({
  level, outcome: 'lost', score: 100, targetScore: 1000, stars: 0, movesLeft: 0, isBoss: false, ts,
});
const win = (level: number, ts: number) => ({
  level, outcome: 'won', score: 1000, targetScore: 1000, stars: 1, movesLeft: 3, isBoss: false, ts,
});

describe('level results store', () => {
  test('the memory double keeps what is appended and returns copies', async () => {
    const store = new MemoryLevelResultsStore();
    await store.append({ level: 3, outcome: 'won', score: 1000, targetScore: 1000 });
    const { records, skipped } = await store.read();
    expect(skipped).toBe(0);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ level: 3, outcome: 'won' });
    expect(typeof records[0].ts).toBe('number');
    records[0].level = 99;
    expect((await store.read()).records[0].level).toBe(3);
  });

  test('the file store writes JSONL and reads it back, skipping bad lines', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lrs-'));
    try {
      const file = path.join(dir, 'results.jsonl');
      const store = new FileLevelResultsStore(file);
      await store.append({ level: 4, outcome: 'lost', score: 10, targetScore: 1000 });
      fs.appendFileSync(file, 'not json\n');
      const { records, skipped } = await store.read();
      expect(records).toHaveLength(1);
      expect(skipped).toBe(1);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('tuning plan only moves a level on new results', () => {
  test('a flagged level moves one step, then waits for a new batch', () => {
    const records = Array.from({ length: 25 }, (_, i) => loss(12, 1000 + i));
    const first = planTuning(records, { levels: {}, tuned: {} }, 3000);
    expect(first.proposals.map((p) => [p.level, p.to])).toEqual([[12, 0.95]]);
    expect(first.levels[12]).toBe(0.95);
    expect(first.tuned[12]).toBe(3000);

    const again = planTuning(records, { levels: first.levels, tuned: first.tuned }, 4000);
    expect(again.proposals).toEqual([]);
    expect(again.levels[12]).toBe(0.95);

    const fresh = Array.from({ length: 25 }, (_, i) => loss(12, 3500 + i));
    const next = planTuning([...records, ...fresh], { levels: first.levels, tuned: first.tuned }, 5000);
    expect(next.proposals.map((p) => [p.from, p.to])).toEqual([[0.95, 0.9]]);
  });

  test('levels with too few results are not moved, and their results keep counting', () => {
    const records = Array.from({ length: 5 }, (_, i) => loss(7, 1000 + i));
    const plan = planTuning(records, { levels: {}, tuned: {} }, 3000);
    expect(plan.proposals).toEqual([]);
    expect(plan.tuned).toEqual({});
  });

  test('a saved tuning time is read back and bad entries are dropped', () => {
    expect(parseTuned({ '5': 100, x: 1, '0': 3, '6': -1 })).toEqual({ 5: 100 });
    expect(parseTuned(null)).toEqual({});
  });
});

describe('applying tuning writes the overrides file once per batch', () => {
  test('runTuning with apply saves the step, and a second run changes nothing', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tune-'));
    try {
      const file = path.join(dir, 'overrides.json');
      const store = new MemoryLevelResultsStore();
      for (let i = 0; i < 25; i++) await store.append(loss(21, 0));
      const now = Date.now() + 1000;
      await expect(runTuning({ store, file, apply: true, now })).rejects.toMatchObject({ code: 'tuning_approval_required' });
      const applied = await runTuning({ store, file, apply: true, now,
        approvedLevel: 21, expectedFrom: 1, expectedUpdatedAt: null });
      expect(applied.applied).toBe(true);
      expect(readLevelOverrides(file).levels[21]).toBe(0.95);
      expect(readLevelOverrides(file).tuned[21]).toBe(now);

      await expect(runTuning({ store, file, apply: true, now: now + 1000,
        approvedLevel: 21, expectedFrom: 1, expectedUpdatedAt: null })).rejects.toMatchObject({ code: 'tuning_plan_stale' });
      expect(readLevelOverrides(file).levels[21]).toBe(0.95);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('a preview (apply false) reports the step and writes nothing', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tune-'));
    try {
      const file = path.join(dir, 'overrides.json');
      const store = new MemoryLevelResultsStore();
      for (let i = 0; i < 25; i++) await store.append(win(22, 0));
      const plan = await runTuning({ store, file, apply: false, now: Date.now() + 1000 });
      expect(plan.proposals.map((p) => [p.level, p.flag])).toEqual([[22, 'too_easy']]);
      expect(plan.applied).toBe(false);
      expect(fs.existsSync(file)).toBe(false);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('scheduled tuning is off unless set', () => {
  test('the interval comes from LEVEL_TUNING_INTERVAL_HOURS, one hour at least', () => {
    expect(tuningIntervalMs({} as any)).toBe(0);
    expect(tuningIntervalMs({ LEVEL_TUNING_INTERVAL_HOURS: '0.5' } as any)).toBe(0);
    expect(tuningIntervalMs({ LEVEL_TUNING_INTERVAL_HOURS: 'soon' } as any)).toBe(0);
    expect(tuningIntervalMs({ LEVEL_TUNING_INTERVAL_HOURS: '24' } as any)).toBe(24 * 3_600_000);
  });

  test('no timer starts when it is off, and a timer is returned and cleared when on', () => {
    expect(startTuningSchedule({ intervalMs: 0, store: new MemoryLevelResultsStore() })).toBeNull();
    const timer = startTuningSchedule({ intervalMs: 3_600_000, store: new MemoryLevelResultsStore() });
    expect(timer).not.toBeNull();
    clearInterval(timer as any);
  });
});

describe('kingdom room coin bonus', () => {
  test('no rooms gives no bonus, and each room level adds 1%', () => {
    expect(kingdomCoinMultiplier(undefined)).toBe(1);
    expect(kingdomCoinMultiplier({ rooms: {} })).toBe(1);
    expect(kingdomCoinMultiplier({ rooms: { throne: 3 } })).toBeCloseTo(1.03, 10);
  });

  test('the bonus is capped at 15%', () => {
    expect(ROOM_COIN_BONUS_CAP).toBe(0.15);
    const maxed = { rooms: { throne: 5, library: 5, garden: 5, armory: 5, gatehouse: 5, hall: 5 } };
    expect(kingdomCoinMultiplier(maxed)).toBeCloseTo(1.15, 10);
  });
});

describe('mini-game rules', () => {
  const now = Date.UTC(2026, 9, 9, 12);

  test('coins follow the score and are capped per game', () => {
    expect(minigameCoins(MINIGAMES.memory, 10)).toBe(20);
    expect(minigameCoins(MINIGAMES.memory, 100)).toBe(MINIGAMES.memory.coinsCap);
    expect(minigameCoins(MINIGAMES.treasure, 0)).toBe(0);
  });

  test('a game pays once per UTC day, and the next day is open again', () => {
    const economy: any = {};
    const first = planMinigamePlay(economy, 'rhythm', 4, now);
    expect(first.coins).toBe(32);
    economy.minigames = first.record;
    expect(codeOf(() => planMinigamePlay(economy, 'rhythm', 4, now + 3600_000))).toBe('already_played_today');
    expect(planMinigamePlay(economy, 'memory', 4, now + 3600_000).coins).toBe(8);
    expect(planMinigamePlay(economy, 'rhythm', 4, now + DAY).coins).toBe(32);
  });

  test('unknown games and out-of-range or fractional scores are refused', () => {
    expect(codeOf(() => planMinigamePlay({}, 'chess', 1, now))).toBe('unknown_game');
    expect(codeOf(() => planMinigamePlay({}, 'treasure', 13, now))).toBe('invalid_score');
    expect(codeOf(() => planMinigamePlay({}, 'treasure', -1, now))).toBe('invalid_score');
    expect(codeOf(() => planMinigamePlay({}, 'treasure', 1.5, now))).toBe('invalid_score');
    expect(new MinigameError('x').code).toBe('x');
  });

  test('status shows which games are played today', () => {
    const economy: any = { minigames: planMinigamePlay({}, 'memory', 5, now).record };
    const status = minigameStatus(economy, now);
    expect(status.find((g) => g.id === 'memory')?.playedToday).toBe(true);
    expect(status.find((g) => g.id === 'rhythm')?.playedToday).toBe(false);
    expect(minigameStatus(economy, now + DAY).every((g) => !g.playedToday)).toBe(true);
    expect(utcDay(now)).toBe('2026-10-09');
  });
});

describe('mini-game and offers routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/minigames', minigamesRoutes);
  app.use('/api/live-ops', liveOpsRoutes);

  let token = '';
  const playerId = `mg_${Date.now()}`;
  beforeAll(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ playerId, email: `${playerId}@example.com`, password: 'secret123' });
    token = reg.body.token as string;
    expect(token).toBeTruthy();
  });

  test('the mini-games need a session', async () => {
    expect((await request(app).get('/api/minigames')).status).toBe(401);
    expect((await request(app).post('/api/minigames/memory/complete').send({ score: 5 })).status).toBe(401);
  });

  test('a play pays coins once a day, and the second play is refused', async () => {
    const list = await request(app).get('/api/minigames').set('Authorization', `Bearer ${token}`);
    expect(list.body.games.map((g: any) => g.id)).toEqual(['memory', 'treasure', 'rhythm']);
    expect(list.body.games.every((g: any) => g.playedToday === false)).toBe(true);

    const paid = await request(app)
      .post('/api/minigames/memory/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 10 });
    expect(paid.status).toBe(200);
    expect(paid.body.result).toEqual({ game: 'memory', coins: 20, balance: 1020 });

    const again = await request(app)
      .post('/api/minigames/memory/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 10 });
    expect(again.status).toBe(409);
    expect(again.body.error).toBe('already_played_today');
  });

  test('bad games and scores are refused without paying', async () => {
    const send = (game: string, body: object) =>
      request(app).post(`/api/minigames/${game}/complete`).set('Authorization', `Bearer ${token}`).send(body);
    expect((await send('chess', { score: 1 })).body.error).toBe('unknown_game');
    const bad = await send('treasure', { score: 99 });
    expect(bad.status).toBe(400);
    expect(bad.body.error).toBe('invalid_score');
    const list = await request(app).get('/api/minigames').set('Authorization', `Bearer ${token}`);
    expect(list.body.games.find((g: any) => g.id === 'treasure').playedToday).toBe(false);
  });

  test('the offers are public and priced from the catalog, with any deal', async () => {
    const res = await request(app).get('/api/live-ops/offers');
    expect(res.status).toBe(200);
    expect(res.body.coinPacks.map((p: any) => p.productId)).toEqual(['coins_small', 'coins_medium', 'coins_large']);
    for (const pack of res.body.coinPacks) {
      expect(pack.currency).toBe('usd');
      if (pack.deal) expect(pack.priceCents).toBeLessThan(pack.catalogPriceCents);
      else expect(pack.priceCents).toBe(pack.catalogPriceCents);
    }
    expect(Array.isArray(res.body.activeEvents)).toBe(true);
    expect(Array.isArray(res.body.upcomingEvents)).toBe(true);
  });
});

describe('battle pass counts a challenge', () => {
  test('the season config grants XP for a completed community challenge', () => {
    const cfg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config/battlepass/config.json'), 'utf-8'));
    expect(cfg.xpEvents.challenge_complete).toBe(100);
  });
});

afterAll(() => {
  // Nothing global to restore: the tests use temporary directories and in-memory stores.
});
