import { beforeAll, describe, expect, test } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import authRoutes from '../routes/auth.js';
import accountEconomyRoutes from '../routes/account-economy.js';
import levelRoutes from '../routes/levels.js';
import AccountEconomyService from '../services/economy/AccountEconomyService.js';
import { generatedLevel } from '../services/levels/level-service.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/account-economy', accountEconomyRoutes);
app.use('/api/levels', levelRoutes);
const location = { timeZone: 'America/New_York', country: 'US', region: 'PA' };
let token: string;
const auth = () => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  const id = `procedural_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const res = await request(app).post('/api/auth/register').send({ playerId: id, email: `${id}@example.com`, password: 'secret123' });
  token = res.body.token;
  expect(token).toBeTruthy();
});

async function spend(level: number, mode = 'classic') {
  const res = await request(app).post('/api/account-economy/energy/spend').set(auth()).send({ level, mode, location, rulesVersion: 3 });
  expect(res.status).toBe(200);
  return res.body.result;
}

describe('server-authoritative generated attempts', () => {
  test('anonymous callers cannot spend energy even though level previews are public', async () => {
    expect((await request(app).post('/api/account-economy/energy/spend').send({ level: 1, mode: 'daily', location })).status).toBe(401);
  });

  test('invalid location is refused before energy is spent', async () => {
    const before = await request(app).get('/api/account-economy/data').set(auth());
    const rejected = await request(app).post('/api/account-economy/energy/spend').set(auth())
      .send({ level: 1, mode: 'daily', location: { timeZone: 'Invented/Zone' } });
    expect(rejected.status).toBe(400);
    expect(rejected.body.error).toBe('invalid_time_zone');
    const after = await request(app).get('/api/account-economy/data').set(auth());
    expect(after.body.data.currencies.energy.amount).toBe(before.body.data.currencies.energy.amount);
  });

  test('invalid weather coordinates or flags are refused before spending energy', async () => {
    const before = await request(app).get('/api/account-economy/data').set(auth());
    for (const preference of [{ weatherLatitude: 91, weatherLongitude: 0 }, { weatherLatitude: 40 }, { weatherEnabled: 'maybe' }, { timeOfDayEnabled: [] }]) {
      const rejected = await request(app).post('/api/account-economy/energy/spend').set(auth())
        .send({ level: 1, mode: 'daily', location: { ...location, ...preference } });
      expect(rejected.status).toBe(400);
    }
    const after = await request(app).get('/api/account-economy/data').set(auth());
    expect(after.body.data.currencies.energy.amount).toBe(before.body.data.currencies.energy.amount);
  });

  test('a paid endless run must begin at stage one, without spending on an invalid start', async () => {
    const before = await request(app).get('/api/account-economy/data').set(auth());
    const rejected = await request(app).post('/api/account-economy/energy/spend').set(auth())
      .send({ level: 2, mode: 'endless', location });
    expect(rejected.status).toBe(400);
    expect(rejected.body.error).toBe('invalid_endless_start_level');
    const after = await request(app).get('/api/account-economy/data').set(auth());
    expect(after.body.data.currencies.energy.amount).toBe(before.body.data.currencies.energy.amount);
  });

  test('unsupported rules are refused before any energy or inventory spend', async () => {
    const before = await request(app).get('/api/account-economy/data').set(auth());
    for (const rulesVersion of [1, 5, 'bad', null, [], {}]) {
      const refused = await request(app).post('/api/account-economy/energy/spend').set(auth())
        .send({ level: 1, mode: 'classic', location, rulesVersion });
      expect(refused.status).toBe(400);
      expect(refused.body.error).toBe('unsupported_rules_version');
    }
    const after = await request(app).get('/api/account-economy/data').set(auth());
    expect(after.body.data.currencies.energy.amount).toBe(before.body.data.currencies.energy.amount);
    expect(after.body.data.inventory).toEqual(before.body.data.inventory);
  });

  test('untagged procedural clients keep v2 definitions; updated clients explicitly receive v3', async () => {
    const legacy = await request(app).post('/api/account-economy/energy/spend').set(auth()).send({ level: 2, mode: 'classic', location });
    expect(legacy.status).toBe(200);
    const old = legacy.body.result;
    expect(old.generatedLevel.generatorVersion).toBe(2);
    expect(old.generatedLevel.specials).toBeUndefined();
    // A newly generated preview/default must not alter the definition already paid for.
    const modernPreview = generatedLevel({ level: 2, location, rulesVersion: 3 });
    expect(modernPreview.id).not.toBe(old.generatedLevel.id);
    const win = await request(app).post('/api/account-economy/level/complete').set(auth())
      .send({ level: 2, score: old.generatedLevel.targetScore, attemptId: old.attemptId });
    expect(win.status).toBe(200);
    // The existing one-pending-attempt replacement policy is deliberately unchanged.
    const modern = await spend(2);
    expect(modern.generatedLevel.generatorVersion).toBe(3);
    expect(modern.generatedLevel.id).not.toBe(old.generatedLevel.id);
  });

  test('a generated level well past the legacy limit completes against its pinned goal', async () => {
    const attempt = await spend(100001);
    const definition = attempt.generatedLevel;
    expect(definition.level).toBe(100001);
    expect(definition.generatorVersion).toBe(3);
    expect(definition.targetScore).toBeLessThanOrEqual(2400);
    const win = await request(app).post('/api/account-economy/level/complete').set(auth())
      .send({ level: 100001, score: definition.targetScore, attemptId: attempt.attemptId, stars: 3, targetScore: 1 });
    expect(win.status).toBe(200);
    expect(win.body.result.stars).toBe(1); // Reported stars/target are never trusted.
  });

  test('a below-target claim keeps the attempt available for a legitimate win', async () => {
    const attempt = await spend(3);
    const target = attempt.generatedLevel.targetScore;
    const body = { level: 3, attemptId: attempt.attemptId, score: target - 1, targetScore: 1 };
    const failed = await request(app).post('/api/account-economy/level/complete').set(auth()).send(body);
    expect(failed.status).toBe(400);
    expect(failed.body.error).toBe('score_below_target');
    const win = await request(app).post('/api/account-economy/level/complete').set(auth()).send({ ...body, score: target });
    expect(win.status).toBe(200);
  });

  test('a daily attempt cannot be cashed as an endless run', async () => {
    const attempt = await spend(1, 'daily');
    const wrong = await request(app).post('/api/account-economy/endless/complete').set(auth())
      .send({ score: 5000, attemptId: attempt.attemptId });
    expect(wrong.status).toBe(400);
    expect(wrong.body.error).toBe('attempt_mode_mismatch');
    const valid = await request(app).post('/api/account-economy/level/complete').set(auth())
      .send({ level: 1, score: attempt.generatedLevel.targetScore, attemptId: attempt.attemptId });
    expect(valid.status).toBe(200);
  });

  test('an endless attempt cannot be cashed as a normal win', async () => {
    const attempt = await spend(1, 'endless');
    const wrong = await request(app).post('/api/account-economy/level/complete').set(auth())
      .send({ level: 1, score: attempt.generatedLevel.targetScore, attemptId: attempt.attemptId });
    expect(wrong.status).toBe(400);
    expect(wrong.body.error).toBe('attempt_mode_mismatch');
    const bank = await request(app).post('/api/account-economy/endless/complete').set(auth())
      .send({ score: 5000, attemptId: attempt.attemptId });
    expect(bank.status).toBe(200);
    expect(bank.body.result.reward.coins).toBeGreaterThan(0);
  });

  test('even simultaneous completion requests consume the same attempt only once', async () => {
    const attempt = await spend(7);
    const body = { level: 7, score: attempt.generatedLevel.targetScore, attemptId: attempt.attemptId };
    const responses = await Promise.all([1, 2].map(() => request(app).post('/api/account-economy/level/complete').set(auth()).send(body)));
    expect(responses.map((r) => r.status).sort()).toEqual([200, 400]);
    expect(responses.find((r) => r.status === 400)!.body.error).toBe('attempt_not_found');
  });

  test('the daily attempt definition is frozen across midnight and a holiday change', async () => {
    const service = new AccountEconomyService();
    const player = `midnight_${Date.now()}`;
    await service.initializePlayerEconomy(player, 'test');
    const before = Date.parse('2026-11-01T03:59:00Z'); // Halloween, 23:59 in New York.
    const after = before + 120000;
    const old = generatedLevel({ mode: 'daily', location }, before);
    const nextDay = generatedLevel({ mode: 'daily', location }, after);
    expect(old.theme.name).toBe('Halloween');
    expect(nextDay.id).not.toBe(old.id);
    const attempt = await service.spendAttemptEnergy(player, 1, before, old);
    const target = old.targetScore;
    old.targetScore = 1; // Cached/caller objects must not mutate the stored attempt.
    const win = await service.consumeAttempt(player, attempt.attemptId, 1, after,
      { mode: 'level', score: target, legacyTarget: 1000000, objectiveProgress: { collected: old.quality.verifiedCollected } });
    expect(win).toMatchObject({ level: 1, stars: 1 });
  });

  test('legacy clients without mode retain their existing level rules', async () => {
    const res = await request(app).post('/api/account-economy/energy/spend').set(auth()).send({ level: 2 });
    expect(res.status).toBe(200);
    expect(res.body.result.generatedLevel).toBeUndefined();
    const win = await request(app).post('/api/account-economy/level/complete').set(auth())
      .send({ level: 2, score: 920, attemptId: res.body.result.attemptId });
    expect(win.status).toBe(200);
    expect(win.body.result.stars).toBe(1);
  });
});


describe('v4 pinned paid objectives', () => {
  async function start(level = 2, mode = 'classic') {
    const result = await request(app).post('/api/account-economy/energy/spend').set(auth()).send({ level, mode, location, rulesVersion: 4 });
    expect(result.status).toBe(200); expect(result.body.result.generatedLevel.generatorVersion).toBe(4);
    return result.body.result;
  }
  const complete = (attempt: any, extra: any = {}) => request(app).post('/api/account-economy/level/complete').set(auth()).send({
    level: attempt.generatedLevel.level, attemptId: attempt.attemptId, score: 0, ...extra,
  });
  const progressFor = (attempt: any) => ({ collected: { ...attempt.generatedLevel.quality.verifiedCollected } });

  test('the negotiated v4 preview and paid goals agree, without spending inventory', async () => {
    const before = await request(app).get('/api/account-economy/data').set(auth());
    const preview = await request(app).get('/api/levels/2').query({ mode: 'classic', ...location, rulesVersion: '4' });
    expect(preview.status).toBe(200);
    const attempt = await start();
    expect(attempt.generatedLevel).toEqual({ ...preview.body.level, context: { ...preview.body.level.context, evaluatedAt: attempt.generatedLevel.context.evaluatedAt } });
    const after = await request(app).get('/api/account-economy/data').set(auth());
    expect(after.body.data.currencies.energy.amount).toBe(before.body.data.currencies.energy.amount - 1);
    expect(after.body.data.inventory).toEqual(before.body.data.inventory);
  });

  test('collection-only paid wins earn one star below the score baseline, never client-reported stars', async () => {
    const attempt = await start();
    expect(attempt.generatedLevel.objectives.every((goal: any) => goal.type === 'collect')).toBe(true);
    const win = await complete(attempt, { score: 30, objectiveProgress: progressFor(attempt), stars: 3, targetScore: 1,
      objectives: [{ type: 'score', target: 1 }] });
    expect(win.status).toBe(200); expect(win.body.result.stars).toBe(1);
    const replay = await complete(attempt, { objectiveProgress: progressFor(attempt) });
    expect(replay.status).toBe(400); expect(replay.body.error).toBe('attempt_not_found');
  });

  test('missing counters cannot bypass a pinned collection goal by reporting a huge score or new goals', async () => {
    const attempt = await start();
    const rejected = await complete(attempt, { score: 100000, objectives: [{ type: 'score', target: 1 }] });
    expect(rejected.status).toBe(400); expect(rejected.body.error).toBe('objective_progress_required');
    const incomplete = await complete(attempt, { score: 100000, objectiveProgress: { collected: {} } });
    expect(incomplete.status).toBe(400); expect(incomplete.body.error).toBe('objectives_incomplete');
    const win = await complete(attempt, { objectiveProgress: progressFor(attempt) });
    expect(win.status).toBe(200);
  });

  test('malformed counters are refused without consuming energy, inventory or the pending attempt', async () => {
    const attempt = await start();
    const before = await request(app).get('/api/account-economy/data').set(auth());
    for (const objectiveProgress of [null, [], { collected: [] }, { collected: { red: -1 } }, { collected: { red: 0.5 } },
      { collected: { red: '30' } }, { collected: { cyan: 30 } }, { collected: { red: 1000001 } }, { collected: {}, goals: [] }]) {
      const refused = await complete(attempt, { objectiveProgress });
      expect(refused.status).toBe(400); expect(refused.body.error).toBe('invalid_objective_progress');
    }
    const after = await request(app).get('/api/account-economy/data').set(auth());
    expect(after.body.data.inventory).toEqual(before.body.data.inventory);
    for (const currency of Object.keys(before.body.data.currencies)) expect(after.body.data.currencies[currency].amount).toBe(before.body.data.currencies[currency].amount);
    expect((await complete(attempt, { objectiveProgress: progressFor(attempt) })).status).toBe(200);
  });

  test('mixed paid levels cannot omit either score or collection', async () => {
    const attempt = await start(4); const definition = attempt.generatedLevel;
    expect(definition.objectiveProfile).toBe('score-and-collect');
    const belowScore = await complete(attempt, { objectiveProgress: progressFor(attempt) });
    expect(belowScore.status).toBe(400); expect(belowScore.body.error).toBe('score_below_target');
    const belowCollection = await complete(attempt, { score: definition.targetScore, objectiveProgress: { collected: {} } });
    expect(belowCollection.status).toBe(400); expect(belowCollection.body.error).toBe('objectives_incomplete');
    const win = await complete(attempt, { score: definition.targetScore, objectiveProgress: progressFor(attempt) });
    expect(win.status).toBe(200); expect(win.body.result.stars).toBe(1);
  });

  test('pair paid levels require both frozen colors', async () => {
    const attempt = await start(7); const [first, second] = attempt.generatedLevel.objectives;
    expect(attempt.generatedLevel.objectiveProfile).toBe('collect-pair');
    const progress = { collected: { [first.gemType]: first.target } };
    const rejected = await complete(attempt, { score: 100000, objectiveProgress: progress });
    expect(rejected.status).toBe(400); expect(rejected.body.error).toBe('objectives_incomplete');
    progress.collected[second.gemType] = second.target;
    expect((await complete(attempt, { objectiveProgress: progress })).status).toBe(200);
  });

  test('simultaneous v4 completions still award only once', async () => {
    const attempt = await start();
    const responses = await Promise.all([complete(attempt, { objectiveProgress: progressFor(attempt) }), complete(attempt, { objectiveProgress: progressFor(attempt) })]);
    expect(responses.map((result) => result.status).sort()).toEqual([200, 400]);
    expect(responses.find((result) => result.status === 400)!.body.error).toBe('attempt_not_found');
  });

  test('v4 score-only onboarding works without counters, and banking a partial endless stage stays legal', async () => {
    const classic = await start(1);
    expect(classic.generatedLevel.objectiveProfile).toBe('score');
    expect((await complete(classic, { score: classic.generatedLevel.targetScore })).status).toBe(200);
    const run = await start(1, 'endless');
    const bank = await request(app).post('/api/account-economy/endless/complete').set(auth()).send({ score: 30, attemptId: run.attemptId });
    expect(bank.status).toBe(200); expect(bank.body.result.reward.coins).toBe(0); // Unchanged banking formula: floor(30 / 80).
  });

  test('v4 definitions and collection goals are isolated from caller mutations after purchase', async () => {
    const service = new AccountEconomyService(); const player = `v4_frozen_${Date.now()}`;
    await service.initializePlayerEconomy(player, 'test');
    const at = Date.parse('2026-10-31T12:00:00Z'); const definition = generatedLevel({ level: 2, mode: 'classic', location, rulesVersion: 4 }, at);
    const original = structuredClone(definition);
    const attempt = await service.spendAttemptEnergy(player, 2, at, definition);
    definition.objectives[0].target = 1; definition.objectives[0].gemType = 'cyan'; definition.targetScore = 1;
    attempt.generatedLevel.objectives[0].target = 2;
    await expect(service.consumeAttempt(player, attempt.attemptId, 2, at + 1000,
      { mode: 'level', score: 30, objectiveProgress: { collected: { [original.objectives[0].gemType]: 2 } } })).rejects.toMatchObject({ code: 'objectives_incomplete' });
    const win = await service.consumeAttempt(player, attempt.attemptId, 2, at + 2000,
      { mode: 'level', score: 30, objectiveProgress: { collected: original.quality.verifiedCollected } });
    expect(win).toMatchObject({ level: 2, stars: 1 });
  });
});
