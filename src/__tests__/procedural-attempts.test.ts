import { beforeAll, describe, expect, test } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import authRoutes from '../routes/auth.js';
import accountEconomyRoutes from '../routes/account-economy.js';
import AccountEconomyService from '../services/economy/AccountEconomyService.js';
import { generatedLevel } from '../services/levels/level-service.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/account-economy', accountEconomyRoutes);
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
  const res = await request(app).post('/api/account-economy/energy/spend').set(auth()).send({ level, mode, location });
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

  test('a paid endless run must begin at stage one, without spending on an invalid start', async () => {
    const before = await request(app).get('/api/account-economy/data').set(auth());
    const rejected = await request(app).post('/api/account-economy/energy/spend').set(auth())
      .send({ level: 2, mode: 'endless', location });
    expect(rejected.status).toBe(400);
    expect(rejected.body.error).toBe('invalid_endless_start_level');
    const after = await request(app).get('/api/account-economy/data').set(auth());
    expect(after.body.data.currencies.energy.amount).toBe(before.body.data.currencies.energy.amount);
  });

  test('a generated level well past the legacy limit completes against its pinned goal', async () => {
    const attempt = await spend(100001);
    const definition = attempt.generatedLevel;
    expect(definition.level).toBe(100001);
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
      { mode: 'level', score: target, legacyTarget: 1000000 });
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
