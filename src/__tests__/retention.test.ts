// Retention service: D1/D7/D30 cohort tracking vs genre benchmarks.
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import request from 'supertest';
import authRoutes from '../routes/auth.js';
import retentionRoutes from '../routes/retention.js';
import { recordFirstLogin, recordLogin, computeRetention } from '../services/retention/retention-service.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/retention', retentionRoutes);

let dir: string;
let retentionDir: string;
const tokens: Record<string, string> = {};

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'retention-'));
  retentionDir = fs.mkdtempSync(path.join(os.tmpdir(), 'retention-reports-'));
  process.env.SOCIAL_STORE_FILE = path.join(dir, 'social.json');
  process.env.RETENTION_REPORTS_DIR = retentionDir;
  for (const id of ['alice', 'bob', 'carol']) {
    const registered = await request(app).post('/api/auth/register').send({ playerId: id, email: `${id}@example.com`, password: 'secret123' });
    expect(registered.status).toBe(200);
    tokens[id] = registered.body.token;
  }
});

afterAll(() => {
  delete process.env.SOCIAL_STORE_FILE;
  delete process.env.RETENTION_REPORTS_DIR;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.rmSync(retentionDir, { recursive: true, force: true });
});

describe('retention service', () => {
  test('recordFirstLogin records cohort date', async () => {
    const result = await recordFirstLogin('test_player');
    expect(result.alreadyRecorded).toBe(false);
    expect(result.cohortDate).toMatch(/\d{4}-\d{2}-\d{2}/);

    // Idempotent: second call returns alreadyRecorded
    const result2 = await recordFirstLogin('test_player');
    expect(result2.alreadyRecorded).toBe(true);
    expect(result2.cohortDate).toBe(result.cohortDate);
  });

  test('recordLogin records login day', async () => {
    const result = await recordLogin('alice');
    expect(result.day).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  test('computeRetention returns overall and cohorts', async () => {
    // Give alice logins on consecutive days to simulate retention
    const today = new Date().toISOString().slice(0, 10);

    await recordFirstLogin('ret_d1', new Date(Date.parse(today + 'T00:00:00Z') - 2 * 24 * 60 * 60 * 1000).getTime());
    await recordLogin('ret_d1', new Date(Date.parse(today + 'T00:00:00Z') - 1 * 24 * 60 * 60 * 1000).getTime()); // D1 login

    const result = await computeRetention();
    expect(result.totalPlayers).toBeGreaterThan(0);
    expect(result.overall.d1).toBeGreaterThanOrEqual(0);
    expect(result.overall.d7).toBeGreaterThanOrEqual(0);
    expect(result.overall.d30).toBeGreaterThanOrEqual(0);
    expect(result.overall.benchmarks.match3_median.d1).toBe(0.38);
    expect(Array.isArray(result.cohorts)).toBe(true);
  });
});

describe('retention API', () => {
  test('heartbeat records login', async () => {
    const res = await request(app).post('/api/retention/heartbeat').set({ Authorization: `Bearer ${tokens.alice}` });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.day).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  test('dashboard returns retention data', async () => {
    const res = await request(app).get('/api/retention/dashboard').set({ Authorization: `Bearer ${tokens.alice}` });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.overall.d1).toBe('number');
    expect(typeof res.body.overall.d7).toBe('number');
    expect(typeof res.body.overall.d30).toBe('number');
    expect(Array.isArray(res.body.cohorts)).toBe(true);
    expect(res.body.overall.benchmarks.match3_median.d1).toBe(0.38);
  });
});
