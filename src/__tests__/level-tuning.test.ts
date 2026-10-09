import { mkdtempSync, rmSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import express from 'express';
import request from 'supertest';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import {
  validateLevelResult,
  summarizeLevelResults,
  starsFor,
  readLevelResults,
  MIN_ATTEMPTS_TO_FLAG,
} from '../services/level-tuning.js';

const win = { level: 4, outcome: 'won', score: 1200, targetScore: 1000, movesLeft: 7, durationSeconds: 40, isBoss: false };

describe('level result validation', () => {
  test('accepts a well-formed win and recomputes stars from the score', () => {
    const { value } = validateLevelResult(win) as any;
    expect(value).toMatchObject({ level: 4, outcome: 'won', stars: 1, isBoss: false });
  });

  test('a win must reach the target, and a loss must not', () => {
    expect(validateLevelResult({ ...win, score: 900 })).toEqual({ error: 'outcome_mismatch' });
    expect(validateLevelResult({ ...win, outcome: 'lost', score: 1500 })).toEqual({ error: 'outcome_mismatch' });
    expect(validateLevelResult({ ...win, outcome: 'lost', score: 900 }).value).toBeDefined();
  });

  test('rejects bad types and out-of-range values', () => {
    expect(validateLevelResult(null)).toEqual({ error: 'body_required' });
    expect(validateLevelResult({ ...win, level: 0 })).toEqual({ error: 'invalid_level' });
    expect(validateLevelResult({ ...win, level: '4' })).toEqual({ error: 'invalid_level' });
    expect(validateLevelResult({ ...win, score: -1 })).toEqual({ error: 'invalid_score' });
    expect(validateLevelResult({ ...win, score: 1.5 })).toEqual({ error: 'invalid_score' });
    expect(validateLevelResult({ ...win, outcome: 'draw' })).toEqual({ error: 'invalid_outcome' });
    expect(validateLevelResult({ ...win, isBoss: 'yes' })).toEqual({ error: 'invalid_isBoss' });
    expect(validateLevelResult({ ...win, durationSeconds: 99999 })).toEqual({ error: 'invalid_durationSeconds' });
  });

  test('stars follow the 1x, 1.5x, 2x rule', () => {
    expect([starsFor(999, 1000), starsFor(1000, 1000), starsFor(1500, 1000), starsFor(2000, 1000)]).toEqual([0, 1, 2, 3]);
  });
});

describe('level tuning summary', () => {
  function results(level: number, outcomes: Array<'won' | 'lost'>, isBoss = false) {
    return outcomes.map((outcome) => ({
      level,
      outcome,
      score: outcome === 'won' ? 1000 : 500,
      targetScore: 1000,
      stars: outcome === 'won' ? 1 : 0,
      movesLeft: outcome === 'won' ? 5 : 0,
      durationSeconds: 30,
      isBoss,
    }));
  }

  test('flags a level that players almost never win as too hard', () => {
    const records = results(10, Array(MIN_ATTEMPTS_TO_FLAG).fill('lost') as any, true);
    const [row] = summarizeLevelResults(records);
    expect(row).toMatchObject({ level: 10, attempts: MIN_ATTEMPTS_TO_FLAG, winRate: 0, flag: 'too_hard', isBoss: true, avgMovesLeftOnWin: null });
  });

  test('flags a level that players almost always win as too easy', () => {
    const [row] = summarizeLevelResults(results(3, Array(MIN_ATTEMPTS_TO_FLAG).fill('won') as any));
    expect(row).toMatchObject({ winRate: 1, flag: 'too_easy', avgMovesLeftOnWin: 5 });
  });

  test('does not flag a level before it has enough attempts', () => {
    const [row] = summarizeLevelResults(results(2, ['lost', 'lost', 'lost']));
    expect(row.flag).toBe('insufficient_data');
  });

  test('a balanced level is ok and levels are sorted by number', () => {
    const records = [
      ...results(9, Array(MIN_ATTEMPTS_TO_FLAG).fill('won') as any),
      ...results(5, [...Array(10).fill('won'), ...Array(10).fill('lost')] as any),
    ];
    const rows = summarizeLevelResults(records);
    expect(rows.map((r) => r.level)).toEqual([5, 9]);
    expect(rows[0]).toMatchObject({ winRate: 0.5, flag: 'ok' });
  });
});

describe('level result storage and routes', () => {
  let dir: string;
  let file: string;
  let app: express.Express;
  let registerToken: string;

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'level-results-'));
    file = join(dir, 'level-results.jsonl');
    process.env.LEVEL_RESULTS_FILE = file;
    process.env.ADMIN_API_TOKEN = 'd'.repeat(40);
    process.env.ADMIN_IDS = 'ops-tune';
    const { default: authRoutes } = await import('../routes/auth.js');
    const { default: levelRoutes } = await import('../routes/level-results.js');
    const { default: adminRoutes } = await import('../routes/admin.js');
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/level-results', levelRoutes);
    app.use('/api/admin', adminRoutes);
    const stamp = Date.now();
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ playerId: `tune_${stamp}`, email: `tune_${stamp}@example.com`, password: 'secret123' });
    registerToken = reg.body.token;
  });

  afterAll(() => {
    delete process.env.LEVEL_RESULTS_FILE;
    rmSync(dir, { recursive: true, force: true });
  });

  test('requires a signed-in player', async () => {
    const res = await request(app).post('/api/level-results').send(win);
    expect(res.status).toBe(401);
  });

  test('stores a valid result without a player ID', async () => {
    const res = await request(app)
      .post('/api/level-results')
      .set('Authorization', `Bearer ${registerToken}`)
      .send(win);
    expect(res.status).toBe(200);
    const line = JSON.parse(readFileSync(file, 'utf-8').trim());
    expect(line).toMatchObject({ level: 4, outcome: 'won', stars: 1 });
    expect(line).not.toHaveProperty('playerId');
  });

  test('rejects an inconsistent result with a reason and stores nothing', async () => {
    const before = readFileSync(file, 'utf-8');
    const res = await request(app)
      .post('/api/level-results')
      .set('Authorization', `Bearer ${registerToken}`)
      .send({ ...win, score: 10 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('outcome_mismatch');
    expect(readFileSync(file, 'utf-8')).toBe(before);
  });

  test('reading results skips malformed lines and reports the count', async () => {
    const { appendFileSync } = await import('fs');
    appendFileSync(file, 'not json\n');
    const { records, skipped } = await readLevelResults(file);
    expect(records.length).toBeGreaterThan(0);
    expect(skipped).toBe(1);
  });

  test('admin tuning report returns the summary and requires admin credentials', async () => {
    const denied = await request(app).get('/api/admin/level-tuning');
    expect(denied.status).toBe(401);
    const res = await request(app)
      .get('/api/admin/level-tuning')
      .set('x-admin-token', 'd'.repeat(40))
      .set('x-admin-id', 'ops-tune');
    expect(res.status).toBe(200);
    expect(res.body.totalResults).toBeGreaterThan(0);
    expect(res.body.levels.find((l: any) => l.level === 4)).toMatchObject({ attempts: 1, flag: 'insufficient_data' });
  });
});

describe('experiment assignment', () => {
  test('the same player can land in different buckets for different experiments', async () => {
    const { stickyAssign } = await import('../routes/experiments.js');
    const variants = ['control', 'treatment'];
    const buckets = new Set(
      Array.from({ length: 20 }, (_, i) => stickyAssign(`exp_${i}`, 'player-1', variants)),
    );
    expect(buckets.size).toBe(2);
  });

  test('assignment is sticky for the same experiment and player', async () => {
    const { stickyAssign } = await import('../routes/experiments.js');
    const variants = ['a', 'b', 'c'];
    expect(stickyAssign('pricing', 'p1', variants)).toBe(stickyAssign('pricing', 'p1', variants));
  });
});
