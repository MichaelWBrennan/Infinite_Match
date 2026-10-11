// Live ops S4: the server side of offline reconciliation. A queued win is sent again after the
// player is back online. The server pays an attempt once and answers repeats with its receipt; a
// stale, replaced, expired or unknown attempt is refused with a clear error and grants nothing.
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import request from 'supertest';
import authRoutes from '../routes/auth.js';
import economyRoutes from '../routes/account-economy.js';
import { accountEconomy } from '../services/economy/AccountEconomyService.js';
import { certifyLevel, simulateLevelMove } from '../services/levels/generator.js';
import { initialObjectiveProgress, objectiveStatus } from '../services/levels/objective-rules.js';
import { ATTEMPT_MAX_AGE_MS } from '../services/meta/energy.js';

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
const complete = (body: object) => request(app).post('/api/account-economy/level/complete').set(auth()).send(body);
async function coins() {
  return ((await accountEconomy.getPlayerEconomy(playerId)) as any).currencies.coins.amount as number;
}

// The exact pinned replay of the level's own witness, as the browser sends it.
function winFor(started: any) {
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
  return { level: 4, attemptId, score, objectiveProgress: state.objectiveProgress, moves, hintsUsed: 0 };
}

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'offline-win-'));
  process.env.ATTEMPT_OBSERVATIONS_FILE = path.join(dir, 'observations.jsonl');
  process.env.OBSERVATION_SEED_KEY = 'fixed-test-key-with-at-least-32-characters';
  process.env.LEVEL_OVERRIDES_CONFIG = path.join(dir, 'overrides.json');
  playerId = `ow_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const registration = await request(app).post('/api/auth/register').send({ playerId, email: `${playerId}@example.com`, password: 'secret123' });
  expect(registration.status).toBe(200);
  token = registration.body.token;
});

afterAll(() => {
  for (const name of ['ATTEMPT_OBSERVATIONS_FILE', 'OBSERVATION_SEED_KEY', 'LEVEL_OVERRIDES_CONFIG']) delete process.env[name];
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('offline win reconciliation (S4), server side', () => {
  test('a queued win sent again after a lost response pays once', async () => {
    const started = await spend();
    expect(started.status).toBe(200);
    const body = winFor(started);
    const first = await complete(body);
    expect(first.status).toBe(200);
    expect(first.body.result.duplicate).toBeFalsy();
    const afterFirst = await coins();
    // The browser replays the same queued win, possibly several times.
    for (let i = 0; i < 2; i++) {
      const replay = await complete(body);
      expect(replay.status).toBe(200);
      expect(replay.body.result.duplicate).toBe(true);
    }
    expect(await coins()).toBe(afterFirst);
  });

  test('a win for an attempt that a newer spend replaced is refused, and grants nothing', async () => {
    const older = await spend();
    const olderBody = winFor(older);
    const newer = await spend(); // replaces the pending attempt
    expect(newer.status).toBe(200);
    const before = await coins();
    const stale = await complete(olderBody);
    expect(stale.status).toBe(400);
    expect(stale.body.error).toBe('attempt_not_found');
    expect(await coins()).toBe(before);
  });

  test('a win older than the attempt age limit is refused, and grants nothing', async () => {
    const started = await spend();
    const body = winFor(started);
    const economy: any = await accountEconomy.getPlayerEconomy(playerId);
    economy.pendingAttempt.issuedAt -= ATTEMPT_MAX_AGE_MS + 60_000;
    await accountEconomy.updatePlayerEconomyCache(playerId, economy);
    const before = await coins();
    const expired = await complete(body);
    expect(expired.status).toBe(400);
    expect(expired.body.error).toBe('attempt_expired');
    expect(await coins()).toBe(before);
  });

  test('an attempt id the server never issued is refused', async () => {
    const before = await coins();
    const unknown = await complete({ level: 4, attemptId: '00000000-0000-4000-8000-000000000000', score: 1000, moves: [] });
    expect(unknown.status).toBe(400);
    expect(unknown.body.error).toBe('attempt_not_found');
    expect(await coins()).toBe(before);
  });
});
