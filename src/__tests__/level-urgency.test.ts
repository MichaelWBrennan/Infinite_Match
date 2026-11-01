// "One step away" urgency pricing: near-miss losses return time-boxed,
// discounted extra-moves offers (Royal Match loss-aversion mechanic).
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import request from 'supertest';
import authRoutes from '../routes/auth.js';
import levelResultsRoutes from '../routes/level-results.js';
import { isNearMiss, nearMissUrgency } from '../services/level-tuning.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/level-results', levelResultsRoutes);

let dir: string;
const tokens: Record<string, string> = {};

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'urgency-'));
  process.env.LEVEL_RESULTS_FILE = path.join(dir, 'level-results.jsonl');
  for (const id of ['alice', 'bob']) {
    const registered = await request(app).post('/api/auth/register').send({ playerId: id, email: `${id}@example.com`, password: 'secret123' });
    expect(registered.status).toBe(200);
    tokens[id] = registered.body.token;
  }
});

afterAll(() => {
  delete process.env.LEVEL_RESULTS_FILE;
  fs.rmSync(dir, { recursive: true, force: true });
});

const levelResult = (token: string, overrides: Record<string, unknown> = {}) =>
  request(app).post('/api/level-results')
    .set({ Authorization: `Bearer ${tokens[token]}` })
    .send({
      level: 42,
      outcome: 'lost',
      score: 900,
      targetScore: 1000,
      movesLeft: 0,
      durationSeconds: 60,
      isBoss: false,
      ...overrides,
    });

describe('near miss detection', () => {
  test('isNearMiss: lost with moves left is a near miss', () => {
    expect(isNearMiss({ outcome: 'lost', score: 100, targetScore: 1000, movesLeft: 3 })).toBe(true);
  });

  test('isNearMiss: lost with score close to target is a near miss', () => {
    expect(isNearMiss({ outcome: 'lost', score: 900, targetScore: 1000, movesLeft: 0 })).toBe(true);
  });

  test('isNearMiss: won is never a near miss', () => {
    expect(isNearMiss({ outcome: 'won', score: 2000, targetScore: 1000, movesLeft: 5 })).toBe(false);
  });

  test('isNearMiss: lost far from target is not a near miss', () => {
    expect(isNearMiss({ outcome: 'lost', score: 100, targetScore: 1000, movesLeft: 0 })).toBe(false);
  });

  test('nearMissUrgency: critical tier (1 move left)', () => {
    const u = nearMissUrgency({ outcome: 'lost', score: 500, targetScore: 1000, movesLeft: 1 });
    expect(u?.urgency).toBe('critical');
    expect(u?.discountPercent).toBe(50);
    expect(u?.movesAdded).toBe(5);
  });

  test('nearMissUrgency: critical tier (score 98% of target)', () => {
    const u = nearMissUrgency({ outcome: 'lost', score: 980, targetScore: 1000, movesLeft: 0 });
    expect(u?.urgency).toBe('critical');
    expect(u?.discountPercent).toBe(50);
  });

  test('nearMissUrgency: high tier (score 90% of target)', () => {
    const u = nearMissUrgency({ outcome: 'lost', score: 900, targetScore: 1000, movesLeft: 0 });
    expect(u?.urgency).toBe('high');
    expect(u?.discountPercent).toBe(30);
  });

  test('nearMissUrgency: medium tier (score 85% of target)', () => {
    const u = nearMissUrgency({ outcome: 'lost', score: 850, targetScore: 1000, movesLeft: 0 });
    expect(u?.urgency).toBe('medium');
    expect(u?.discountPercent).toBe(15);
  });

  test('nearMissUrgency: null when not a near miss', () => {
    expect(nearMissUrgency({ outcome: 'won', score: 2000, targetScore: 1000, movesLeft: 5 })).toBe(null);
    expect(nearMissUrgency({ outcome: 'lost', score: 100, targetScore: 1000, movesLeft: 0 })).toBe(null);
  });
});

describe('urgency offer in level-result response', () => {
  test('a near-miss loss returns an urgency offer with discounted coins', async () => {
    const res = await levelResult('alice', { movesLeft: 1, score: 950, targetScore: 1000 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.urgencyOffer).not.toBeNull();
    expect(res.body.urgencyOffer.urgency).toBe('critical');
    expect(res.body.urgencyOffer.discountedCostCoins).toBeLessThan(100);
    expect(res.body.urgencyOffer.discountedCostCoins).toBeGreaterThan(0);
    expect(res.body.urgencyOffer.expiresAt).toBeGreaterThan(Date.now());
  });

  test('a far-from-target loss returns no urgency offer', async () => {
    const res = await levelResult('bob', { movesLeft: 0, score: 100, targetScore: 1000 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.urgencyOffer).toBeNull();
  });

  test('a win returns no urgency offer', async () => {
    const res = await levelResult('alice', { outcome: 'won', score: 2000, targetScore: 1000, movesLeft: 5 });
    expect(res.status).toBe(200);
    expect(res.body.urgencyOffer).toBeNull();
  });
});
