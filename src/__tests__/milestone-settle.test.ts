// Live ops S3: a verified classic win settled through /level/complete counts once toward the guild
// milestone; a retry does not count again; a rejected completion counts nothing. Uses the same real
// pinned-replay flow as attempt-observations.test.ts.
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import request from 'supertest';
import authRoutes from '../routes/auth.js';
import economyRoutes from '../routes/account-economy.js';
import { certifyLevel, simulateLevelMove } from '../services/levels/generator.js';
import { initialObjectiveProgress, objectiveStatus } from '../services/levels/objective-rules.js';
import { socialStore } from '../services/social/social-store.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/account-economy', economyRoutes);

let dir: string;
let token: string;
let playerId: string;
const auth = () => ({ Authorization: `Bearer ${token}` });
const spend = () => request(app).post('/api/account-economy/energy/spend').set(auth())
  .send({ level: 4, mode: 'classic', rulesVersion: 5, location: { timeZone: 'America/New_York', country: 'US', region: 'PA' } });

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'milestone-settle-'));
  process.env.ATTEMPT_OBSERVATIONS_FILE = path.join(dir, 'observations.jsonl');
  process.env.OBSERVATION_SEED_KEY = 'fixed-test-key-with-at-least-32-characters';
  process.env.LEVEL_OVERRIDES_CONFIG = path.join(dir, 'overrides.json');
  process.env.SOCIAL_STORE_FILE = path.join(dir, 'social.json');
  playerId = `ms_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const registration = await request(app).post('/api/auth/register').send({ playerId, email: `${playerId}@example.com`, password: 'secret123' });
  expect(registration.status).toBe(200);
  token = registration.body.token;
  await socialStore.setName(playerId, 'Milestone');
  await socialStore.createGuild(playerId, 'Milestone Club');
});

afterAll(() => {
  for (const name of ['ATTEMPT_OBSERVATIONS_FILE', 'OBSERVATION_SEED_KEY', 'LEVEL_OVERRIDES_CONFIG', 'SOCIAL_STORE_FILE']) delete process.env[name];
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('a verified win counts toward the guild milestone (S3)', () => {
  test('one verified win counts once, a retry does not count, and a rejected completion counts nothing', async () => {
    const started = await spend();
    expect(started.status).toBe(200);
    const { generatedLevel: def, attemptId } = started.body.result;
    let state: any = { board: def.board, specials: def.specials, shields: def.shields,
      refillState: def.refillState, objectiveProgress: initialObjectiveProgress(def) };
    const moves: number[][] = [];
    let score = 0;
    for (const cells of certifyLevel(def).witness) {
      const result = simulateLevelMove(def, state, cells)!;
      score += result.score;
      moves.push(cells);
      state = { board: result.board, specials: result.specials, shields: result.shields,
        refillState: result.refillState, objectiveProgress: result.objectiveProgress };
      if (objectiveStatus(def, score, state.objectiveProgress).complete) break;
    }
    const body = { level: 4, attemptId, score, objectiveProgress: state.objectiveProgress, moves, hintsUsed: 0 };

    const rejected = await request(app).post('/api/account-economy/level/complete').set(auth()).send({ ...body, score: score + 1 });
    expect(rejected.status).toBe(400);
    expect((await socialStore.milestoneView(playerId)).count).toBe(0);

    const won = await request(app).post('/api/account-economy/level/complete').set(auth()).send(body);
    expect(won.status).toBe(200);
    expect(won.body.result.verified).toBe(true);
    expect((await socialStore.milestoneView(playerId)).count).toBe(1);

    const retry = await request(app).post('/api/account-economy/level/complete').set(auth()).send(body);
    expect(retry.status).toBe(200);
    expect(retry.body.result.duplicate).toBe(true);
    expect((await socialStore.milestoneView(playerId)).count).toBe(1);
  });
});
