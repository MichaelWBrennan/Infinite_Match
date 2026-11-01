// A/B testing framework: sticky assignment, segment filtering, conversion tracking.
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import request from 'supertest';
import authRoutes from '../routes/auth.js';
import experimentsRoutes from '../routes/experiments.js';
import { assignPlayer, listExperiments, getExperiment } from '../services/experiments/experiment-service.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/experiments', experimentsRoutes);

let dir: string;
const tokens: Record<string, string> = {};

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'experiments-'));
  process.env.SOCIAL_STORE_FILE = path.join(dir, 'social.json');
  for (const id of ['alice', 'bob', 'carol']) {
    const registered = await request(app).post('/api/auth/register').send({ playerId: id, email: `${id}@example.com`, password: 'secret123' });
    expect(registered.status).toBe(200);
    tokens[id] = registered.body.token;
  }
});

afterAll(() => {
  delete process.env.SOCIAL_STORE_FILE;
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('experiment definitions', () => {
  test('listExperiments returns registered experiments', () => {
    const exps = listExperiments();
    expect(exps.length).toBeGreaterThan(0);
    expect(exps.find(e => e.id === 'continue_price_test')).toBeDefined();
  });

  test('getExperiment returns a specific experiment', () => {
    const exp = getExperiment('continue_price_test');
    expect(exp?.name).toBe('Continue price sensitivity');
    expect(exp?.variants.length).toBe(3);
  });

  test('getExperiment returns null for unknown id', () => {
    expect(getExperiment('no_such_experiment')).toBeNull();
  });
});

describe('sticky assignment', () => {
  test('same player gets same variant across calls', () => {
    const a1 = assignPlayer('continue_price_test', 'alice');
    const a2 = assignPlayer('continue_price_test', 'alice');
    expect(a1.variantId).toBe(a2.variantId);
    expect(a1.inExperiment).toBe(a2.inExperiment);
  });

  test('different players may get different variants', () => {
    const variants = new Set();
    for (const id of ['alice', 'bob', 'carol']) {
      const a = assignPlayer('continue_price_test', id);
      if (a.inExperiment) variants.add(a.variantId);
    }
    // At least one player is in the experiment (traffic = 1.0)
    expect(variants.size).toBeGreaterThan(0);
  });

  test('assignment is sticky for all players across calls', () => {
    const assignments = new Map<string, string | null>();
    for (const id of ['alice', 'bob', 'carol']) {
      const a1 = assignPlayer('continue_price_test', id);
      const a2 = assignPlayer('continue_price_test', id);
      expect(a1.variantId).toBe(a2.variantId);
      assignments.set(id, a1.variantId);
    }
  });

  test('assign returns null variant for unknown experiment', () => {
    const a = assignPlayer('no_such_experiment', 'alice');
    expect(a.inExperiment).toBe(false);
    expect(a.variantId).toBeNull();
    expect(a.variant).toBeNull();
  });
});

describe('assignment API', () => {
  test('assign endpoint returns variant and config', async () => {
    const res = await request(app).post('/api/experiments/assign')
      .set({ Authorization: `Bearer ${tokens.alice}` })
      .send({ experimentId: 'continue_price_test' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.experimentId).toBe('continue_price_test');
    expect(res.body.variantId).toBeDefined();
    expect(res.body.inExperiment).toBeDefined();
  });

  test('assign for unknown experiment returns 404', async () => {
    const res = await request(app).post('/api/experiments/assign')
      .set({ Authorization: `Bearer ${tokens.alice}` })
      .send({ experimentId: 'no_such_experiment' });
    expect(res.status).toBe(404);
  });

  test('conversion endpoint records event', async () => {
    const res = await request(app).post('/api/experiments/convert')
      .set({ Authorization: `Bearer ${tokens.alice}` })
      .send({ experimentId: 'continue_price_test', variantId: 'control', event: 'continue_purchase', value: 1 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('results endpoint computes conversion rates', async () => {
    const res = await request(app).get('/api/experiments/continue_price_test/results')
      .set({ Authorization: `Bearer ${tokens.alice}` });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.results.experimentId).toBe('continue_price_test');
    expect(Array.isArray(res.body.results.results)).toBe(true);
    expect(res.body.results.totalPlayers).toBeGreaterThanOrEqual(0);
  });
});
