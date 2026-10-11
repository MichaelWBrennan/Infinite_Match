import { afterAll, beforeAll, describe, expect, jest, test } from '@jest/globals';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import request from 'supertest';
import authRoutes from '../routes/auth.js';
import economyRoutes from '../routes/account-economy.js';
import adminRoutes from '../routes/admin.js';
import { certifyLevel, simulateLevelMove } from '../services/levels/generator.js';
import { initialObjectiveProgress, objectiveStatus } from '../services/levels/objective-rules.js';
import { levelTarget } from '../services/meta/rewards.js';
import { writeLevelOverrides, readLevelOverrides } from '../services/meta/level-overrides.js';
import { runTuning } from '../services/level-tuning.js';
import { startTuningSchedule } from '../services/level-tuning-schedule.js';
import { MemoryLevelResultsStore, setLevelResultsStore } from '../services/level-results-store.js';
import levelResultsRoutes from '../routes/level-results.js';
import { rbacProvider, ROLES } from '../core/security/rbac.js';
import { observationMeta, observationRow, readAttemptObservations, summarizeAttemptObservations } from '../services/levels/attempt-observations.js';

const pinned: any = { generatorVersion: 5, mode: 'classic', level: 4,
  objectiveProfile: 'clear-shields', difficulty: 'challenging', seed: 12345 };
const key = 'fixed-test-key-with-at-least-32-characters';
const at = Date.parse('2026-10-10T12:00:00Z');

describe('anonymous generated-attempt observations', () => {
  test('the server derives low-cardinality cohort and secret-keyed seed without location, player, attempt or board', () => {
    const first = observationMeta({ ...pinned, context: { region: 'PA', timeZone: 'America/New_York' }, board: [['red']] }, 0, key)!;
    expect(first).toMatchObject({ cohort: 'first_observed', level: 4, profile: 'clear-shields' });
    expect(first.seedGroup).toMatch(/^[0-9a-f]{16}$/);
    expect(JSON.stringify(first)).not.toMatch(/12345|player|context|America|board|region/);
    expect(observationMeta(pinned, 4, key)?.cohort).toBe('early_observed');
    expect(observationMeta(pinned, 5, key)?.cohort).toBe('established_observed');
    expect(observationMeta(pinned, 1, '')?.seedGroup).toBeNull(); // No stable operator key: no seed grouping.
    expect(observationMeta({ ...pinned, mode: 'endless' }, 0, key)).toBeNull();
    expect(observationMeta({ ...pinned, generatorVersion: 3 }, 0, key)).toBeNull();
  });

  test('client hints and quit point are bounded diagnostic buckets, not detailed traces', () => {
    const meta = observationMeta(pinned, 0, key)!;
    const row = observationRow(meta, 'reported_loss', { hintsUsed: 2, movesUsed: 5, moveBudget: 24, playerId: 'do-not-copy', score: 99 }, at);
    expect(row).toMatchObject({ day: '2026-10-10', reportedHints: 2, reportedProgress: 'early', outcome: 'reported_loss' });
    expect(JSON.stringify(row)).not.toContain('do-not-copy');
    expect(observationRow(meta, 'reported_quit', { hintsUsed: 999, movesUsed: 100000, moveBudget: 24 }, at)).toMatchObject({ reportedHints: null, reportedProgress: 'unknown' });
    expect(observationRow(meta, 'reported_quit', { movesUsed: 25, moveBudget: 24 }, at)?.reportedProgress).toBe('unknown');
    expect(observationRow(null, 'started')).toBeNull();
  });

  test('only k-or-larger slices appear, and the rates distinguish verified wins from unverified and client-reported losses', () => {
    const meta = observationMeta(pinned, 0, key)!;
    const row = (outcome: string, extra = {}) => observationRow(meta, outcome, extra, at)!;
    const rows = [...Array(19)].map(() => row('started'));
    rows.push(row('verified_win', { inventoryUses: 1, hintsUsed: 2 }), row('unverified_win'), row('reported_loss', { movesUsed: 12, moveBudget: 24 }));
    expect(summarizeAttemptObservations(rows).groups).toEqual([]);
    rows.push(row('started'));
    const report = summarizeAttemptObservations(rows);
    expect(report.groups).toHaveLength(1);
    expect(report.groups[0]).toMatchObject({ started: 20, verifiedWins: 1, assistedVerifiedWins: 1,
      reportedHintWins: 1, unverifiedWins: 1, reportedLosses: 1, verifiedWinPerStart: 0.05,
      reportedQuits: 0, unsettled: 17, lossProgress: { middle: 1 } });
    expect(summarizeAttemptObservations(rows, { bySeed: true }).groups[0].seedGroup).toBe(meta.seedGroup);
    expect(summarizeAttemptObservations(rows.map((r) => ({ ...r, seedGroup: null })), { bySeed: true }).groups).toEqual([]);
  });
});

const app = express(); app.use(express.json());
app.use('/api/auth', authRoutes); app.use('/api/account-economy', economyRoutes); app.use('/api/admin', adminRoutes);
app.use('/api/level-results', levelResultsRoutes);
let token: string; let dir: string; let file: string; let playerId: string;
const auth = () => ({ Authorization: `Bearer ${token}` });
const spend = (level = 4, mode: string | null = 'classic') => request(app).post('/api/account-economy/energy/spend').set(auth()).send(mode
  ? { level, mode, rulesVersion: 5, location: { timeZone: 'America/New_York', country: 'US', region: 'PA' } }
  : { level });
const rows = () => fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'attempt-obs-'));
  file = path.join(dir, 'observations.jsonl');
  process.env.ATTEMPT_OBSERVATIONS_FILE = file;
  process.env.OBSERVATION_SEED_KEY = key;
  process.env.LEVEL_OVERRIDES_CONFIG = path.join(dir, 'overrides.json');
  process.env.ADMIN_API_TOKEN = 'f'.repeat(40);
  process.env.ADMIN_IDS = 'obs-review';
  playerId = `obs_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const registration = await request(app).post('/api/auth/register').send({ playerId, email: `${playerId}@example.com`, password: 'secret123' });
  expect(registration.status).toBe(200); token = registration.body.token;
});

afterAll(() => {
  setLevelResultsStore(null);
  for (const name of ['ATTEMPT_OBSERVATIONS_FILE', 'OBSERVATION_SEED_KEY', 'LEVEL_OVERRIDES_CONFIG', 'ADMIN_API_TOKEN', 'ADMIN_IDS', 'LEVEL_TUNING_MANUAL_ENABLED']) delete process.env[name];
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('paid attempt lifecycle, read-only operator report and legacy target safety', () => {
  test('auth required; a loss consumes its matching attempt once with no reward or identity in the observation file', async () => {
    expect((await request(app).post('/api/account-economy/attempt/close').send({ attemptId: 'x', outcome: 'lost' })).status).toBe(401);
    const started = await spend(); expect(started.status).toBe(200);
    const id = started.body.result.attemptId;
    expect(rows()).toHaveLength(1);
    expect(rows()[0].seedGroup).toMatch(/^[0-9a-f]{16}$/);
    const before = await request(app).get('/api/account-economy/data').set(auth());
    const lost = await request(app).post('/api/account-economy/attempt/close').set(auth()).send({
      attemptId: id, outcome: 'lost', movesUsed: 7, hintsUsed: 2, playerId: 'forged', location: 'exact'
    });
    expect(lost.status).toBe(200);
    const after = await request(app).get('/api/account-economy/data').set(auth());
    expect(after.body.data.currencies.coins.amount).toBe(before.body.data.currencies.coins.amount);
    expect(after.body.data.currencies.stars.amount).toBe(before.body.data.currencies.stars.amount);
    expect(rows().map((r) => r.outcome)).toEqual(['started', 'reported_loss']);
    expect(fs.readFileSync(file, 'utf8')).not.toMatch(/forged|exact|playerId|attemptId|timeZone|region|board|"seed"/);
    expect((await request(app).post('/api/account-economy/attempt/close').set(auth()).send({ attemptId: id, outcome: 'quit' })).body.error).toBe('attempt_not_found');
    expect((await request(app).post('/api/account-economy/level/complete').set(auth()).send({ level: 4, attemptId: id, score: 100000 })).body.error).toBe('attempt_not_found');
  });

  test('new paid start marks the prior unresolved run replaced, while explicit quit is a single terminal outcome', async () => {
    const first = await spend(); expect(first.status).toBe(200);
    const second = await spend(); expect(second.status).toBe(200);
    expect(rows().filter((r) => r.outcome === 'replaced')).toHaveLength(1);
    const close = await request(app).post('/api/account-economy/attempt/close').set(auth()).send({ attemptId: second.body.result.attemptId, outcome: 'quit', movesUsed: 1 });
    expect(close.status).toBe(200);
    expect(rows().filter((r) => r.outcome === 'reported_quit')).toHaveLength(1);
    expect((await readAttemptObservations(file)).skipped).toBe(0);
  });

  test('an exact pinned replay is the only verified win; a rejected replay leaves the observation incomplete', async () => {
    const started = await spend(); expect(started.status).toBe(200);
    const { generatedLevel: def, attemptId } = started.body.result;
    let state: any = { board: def.board, specials: def.specials, shields: def.shields,
      refillState: def.refillState, objectiveProgress: initialObjectiveProgress(def) };
    const moves: number[][] = []; let score = 0;
    for (const cells of certifyLevel(def).witness) {
      const result = simulateLevelMove(def, state, cells)!;
      score += result.score; moves.push(cells);
      state = { board: result.board, specials: result.specials, shields: result.shields,
        refillState: result.refillState, objectiveProgress: result.objectiveProgress };
      if (objectiveStatus(def, score, state.objectiveProgress).complete) break;
    }
    const body = { level: 4, attemptId, score, objectiveProgress: state.objectiveProgress, moves, hintsUsed: 3 };
    const before = rows().length;
    const rejected = await request(app).post('/api/account-economy/level/complete').set(auth()).send({ ...body, score: score + 1 });
    expect(rejected.status).toBe(400); expect(rows()).toHaveLength(before);
    const won = await request(app).post('/api/account-economy/level/complete').set(auth()).send(body);
    expect(won.status).toBe(200); expect(won.body.result.verified).toBe(true);
    expect(rows().at(-1)).toMatchObject({ outcome: 'verified_win', reportedHints: 3, inventoryUses: 0 });
    const replay = await request(app).post('/api/account-economy/level/complete').set(auth()).send(body);
    expect(replay.status).toBe(200); expect(replay.body.result.duplicate).toBe(true);
    expect(rows().filter((r) => r.outcome === 'verified_win')).toHaveLength(1);
  });

  test('a legacy paid target is pinned at spend: later override changes cannot raise its completion threshold', async () => {
    writeLevelOverrides({}, process.env.LEVEL_OVERRIDES_CONFIG);
    const started = await spend(1, null); expect(started.status).toBe(200);
    writeLevelOverrides({ 1: 1.2 }, process.env.LEVEL_OVERRIDES_CONFIG);
    const oldTarget = levelTarget(1);
    const complete = await request(app).post('/api/account-economy/level/complete').set(auth()).send({
      level: 1, attemptId: started.body.result.attemptId, score: oldTarget,
    });
    expect(complete.status).toBe(200); expect(complete.body.result.stars).toBe(1);
    expect(rows().filter((r) => r.level === 1)).toHaveLength(0); // Legacy self-reports are separate.
  });

  test('operator report suppresses small slices and never exposes observations to ordinary players', async () => {
    expect((await request(app).get('/api/admin/attempt-observations')).status).toBe(401);
    const response = await request(app).get('/api/admin/attempt-observations')
      .set('x-admin-token', 'f'.repeat(40)).set('x-admin-id', 'obs-review');
    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('private, no-store');
    expect(response.body.groups).toEqual([]);
    expect(response.body.suppressedGroups).toBeGreaterThan(0);
    expect(JSON.stringify(response.body)).not.toMatch(/playerId|attemptId|region|timeZone|board/);
  });

  test('corrupt lines are skipped and failed observation writes never block a paid attempt', async () => {
    fs.appendFileSync(file, '{"playerId":"spoofed"}\nnot-json\n');
    expect((await readAttemptObservations(file)).skipped).toBe(2);
    const previous = process.env.ATTEMPT_OBSERVATIONS_FILE;
    process.env.ATTEMPT_OBSERVATIONS_FILE = dir; // appending to a directory fails (EISDIR)
    try {
      const started = await spend(); expect(started.status).toBe(200);
      const quit = await request(app).post('/api/account-economy/attempt/close').set(auth())
        .send({ attemptId: started.body.result.attemptId, outcome: 'quit' });
      expect(quit.status).toBe(200);
    } finally { process.env.ATTEMPT_OBSERVATIONS_FILE = previous; }
    expect((await readAttemptObservations(file)).skipped).toBe(2);
  });

  test('legacy tuning is disabled by default, accepts one explicit previewed change, rejects stale approvals', async () => {
    const store = new MemoryLevelResultsStore();
    setLevelResultsStore(store);
    for (const level of [8, 9]) {
      for (let i = 0; i < 20; i++) await store.append({ level, outcome: 'lost', score: 0,
        targetScore: 1000, stars: 0, movesLeft: 0, durationSeconds: 90, isBoss: false });
    }
    writeLevelOverrides({}, process.env.LEVEL_OVERRIDES_CONFIG);
    const notices: string[] = [];
    jest.useFakeTimers();
    try {
      const timer = startTuningSchedule({ intervalMs: 20, store, file: process.env.LEVEL_OVERRIDES_CONFIG,
        logger: { info: (message: string) => notices.push(message), error: (message: string) => notices.push(message) } });
      await jest.advanceTimersByTimeAsync(25);
      clearInterval(timer!);
    } finally { jest.useRealTimers(); }
    expect(notices).toContain('Tuning review suggested; no target changed');
    expect(readLevelOverrides().levels).toEqual({});
    const preview = await request(app).get('/api/level-results/tuning').set(auth());
    // A normal player cannot read or apply a plan, regardless of env configuration.
    expect(preview.status).toBe(403);
    rbacProvider.assignRole(playerId, ROLES.ADMIN, 'test');
    const approval = { level: 8, expectedFrom: 1, expectedUpdatedAt: readLevelOverrides().updatedAt,
      reviewId: 'review-guardrails-2026-10' };
    const disabled = await request(app).post('/api/level-results/tuning/apply').set(auth()).send(approval);
    expect(disabled.status).toBe(403);
    expect(readLevelOverrides().levels).toEqual({});
    const before = await request(app).get('/api/level-results/tuning').set(auth());
    expect(before.status).toBe(200); expect(before.body.proposals.map((p: any) => p.level)).toEqual([8, 9]);
    expect(before.body.source).toBe('legacy_client_reported_only');
    process.env.LEVEL_TUNING_MANUAL_ENABLED = '1';
    expect((await request(app).post('/api/level-results/tuning/apply').set(auth()).send({ ...approval, reviewId: '' })).status).toBe(400);
    const applied = await request(app).post('/api/level-results/tuning/apply').set(auth()).send(approval);
    expect(applied.status).toBe(200); expect(applied.body.applied).toHaveLength(1);
    expect(readLevelOverrides().levels).toEqual({ 8: 0.95 });
    const stale = await request(app).post('/api/level-results/tuning/apply').set(auth()).send({ ...approval, level: 9 });
    expect(stale.status).toBe(409); expect(readLevelOverrides().levels).toEqual({ 8: 0.95 });
    const current = readLevelOverrides();
    await expect(runTuning({ store, file: process.env.LEVEL_OVERRIDES_CONFIG, apply: true,
      approvedLevel: 9, expectedFrom: 2, expectedUpdatedAt: current.updatedAt })).rejects.toMatchObject({ code: 'tuning_plan_stale' });
    expect(readLevelOverrides().levels).toEqual({ 8: 0.95 });
    delete process.env.LEVEL_TUNING_MANUAL_ENABLED;
  });
});
