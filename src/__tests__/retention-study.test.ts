import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import request from 'supertest';
import authRoutes from '../routes/auth.js';
import studyRoutes from '../routes/retention-study.js';
import adminRoutes from '../routes/admin.js';
import { RetentionStudyStore, retentionEnabled, retentionSummary } from '../services/study/retention-study.js';

const key = 'study-key-held-outside-repository-for-real';
const now = Date.parse('2026-10-10T12:00:00Z');
const d = (offset: number) => now + offset * 86400000;
const day = (offset: number) => new Date(d(offset)).toISOString().slice(0, 10);
let dir: string;

beforeAll(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'web-return-')); process.env.RETENTION_STUDY_KEY = key; });
afterAll(() => {
  for (const name of ['RETENTION_STUDY_KEY', 'RETENTION_STUDY_ENABLED', 'RETENTION_STUDY_FILE', 'ADMIN_API_TOKEN', 'ADMIN_IDS']) delete process.env[name];
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('opt-in return study store', () => {
  test('disabled by default; a sufficiently long operator key and explicit flag are both required', () => {
    expect(retentionEnabled({ RETENTION_STUDY_ENABLED: '1', RETENTION_STUDY_KEY: 'short' } as any)).toBe(false);
    expect(retentionEnabled({ RETENTION_STUDY_ENABLED: '0', RETENTION_STUDY_KEY: key } as any)).toBe(false);
    expect(retentionEnabled({ RETENTION_STUDY_ENABLED: '1', RETENTION_STUDY_KEY: key } as any)).toBe(true);
  });

  test('no record before opt-in, repeat visits and opt-ins are idempotent, withdrawal deletes and rejoin is a new cohort', async () => {
    const file = path.join(dir, 'unit.json'); const store = new RetentionStudyStore(file);
    expect(await store.status('a-private-account', d(0))).toEqual({ consented: false });
    expect(await store.visit('a-private-account', d(0))).toEqual({ consented: false, counted: false });
    expect(fs.existsSync(file)).toBe(false);
    expect(await store.optIn('a-private-account', d(0))).toEqual({ consented: true });
    expect(await store.optIn('a-private-account', d(1))).toEqual({ consented: true });
    expect(await store.visit('a-private-account', d(0))).toMatchObject({ counted: false });
    expect(await store.visit('a-private-account', d(1))).toMatchObject({ counted: true });
    expect(await store.visit('a-private-account', d(1))).toMatchObject({ counted: false });
    const content = fs.readFileSync(file, 'utf8');
    expect(content).not.toMatch(/a-private-account|location|board|token|ipAddress/);
    expect(JSON.parse(content).participants).toHaveProperty(store.pseudonym('a-private-account'));
    if (process.platform !== 'win32') expect(fs.statSync(file).mode & 0o777).toBe(0o600);
    expect(await store.withdraw('a-private-account', d(2))).toEqual({ consented: false });
    expect(fs.readFileSync(file, 'utf8')).not.toContain(store.pseudonym('a-private-account'));
    expect(await store.visit('a-private-account', d(3))).toMatchObject({ consented: false, counted: false });
    await store.optIn('a-private-account', d(3));
    expect(JSON.parse(fs.readFileSync(file, 'utf8')).participants[store.pseudonym('a-private-account')].start).toBe(day(3));
    expect(await store.status('a-private-account', d(39))).toEqual({ consented: false }); // Consent expires and is pruned.
    expect(fs.readFileSync(file, 'utf8')).not.toContain(store.pseudonym('a-private-account'));
  });

  test('exact UTC day offsets, independent D1/D7 denominators and 20-enrollee suppression', async () => {
    const file = path.join(dir, 'cohorts.json'); const store = new RetentionStudyStore(file);
    for (let i = 0; i < 20; i++) {
      const id = `study-subject-${i}`;
      await store.optIn(id, d(0));
      if (i < 16) await store.visit(id, d(1));
      if (i < 10) await store.visit(id, d(7));
      if (i === 0) await store.visit(id, d(2)); // D2 is not D1 or D7.
    }
    const report = await store.report(d(8));
    expect(report.d1).toEqual({ eligible: 20, returned: 16, rate: 0.8, suppressed: false });
    expect(report.d7).toEqual({ eligible: 20, returned: 10, rate: 0.5, suppressed: false });
    expect(report.cohorts).toHaveLength(1);
    expect(JSON.stringify(report)).not.toMatch(/study-subject|participants|pseudonym/);
    // Recent enrollees may be D1-eligible but not D7-eligible; do not dilute D7.
    const records = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [String(i), { start: day(7), days: [day(7), day(8)] }]));
    const recent = retentionSummary(records, d(8));
    expect(recent.d1).toMatchObject({ eligible: 20, returned: 20, rate: 1 });
    expect(recent.d7.suppressed).toBe(true);
    expect(retentionSummary({ solo: { start: day(0), days: [day(0), day(1)] } }, d(8)))
      .toMatchObject({ enrolled: null, enrolledSuppressed: true, d1: { rate: null, suppressed: true }, cohorts: [], suppressedCohorts: 1 });
  });

  test('invalid/corrupt data is never reset to empty and a failed write never changes memory', async () => {
    const file = path.join(dir, 'corrupt.json'); fs.writeFileSync(file, '{oops');
    const store = new RetentionStudyStore(file);
    await expect(store.optIn('p1', d(0))).rejects.toThrow();
    expect(fs.readFileSync(file, 'utf8')).toBe('{oops');
    const impossible = new RetentionStudyStore(dir); // A directory cannot be loaded as a file.
    await expect(impossible.optIn('p1', d(0))).rejects.toThrow();
    expect(impossible.data).toBeNull();
    const tampered = path.join(dir, 'tampered.json');
    fs.writeFileSync(tampered, JSON.stringify({ version: 1, participants: {
      [store.pseudonym('p1')]: { start: day(0), days: [day(0)], playerId: 'do-not-retain' }
    } }));
    await expect(new RetentionStudyStore(tampered).report(d(1))).rejects.toThrow('invalid_retention_study_file');
    const valid = new RetentionStudyStore(path.join(dir, 'save-fails.json'));
    await valid.optIn('p1', d(0));
    const original = fs.readFileSync(valid.filePath(), 'utf8');
    const save = valid.save.bind(valid);
    valid.save = async () => { throw new Error('simulated_disk_full'); };
    await expect(valid.visit('p1', d(1))).rejects.toThrow('simulated_disk_full');
    expect(fs.readFileSync(valid.filePath(), 'utf8')).toBe(original);
    expect(valid.data.participants[valid.pseudonym('p1')].days).toEqual([day(0)]);
    valid.save = save;
    expect(await valid.visit('p1', d(1))).toMatchObject({ counted: true });
  });
});

const app = express(); app.use(express.json()); app.use('/api/auth', authRoutes);
app.use('/api/retention-study', studyRoutes); app.use('/api/admin', adminRoutes);
let tokenA: string; let tokenB: string;
const a = () => ({ Authorization: `Bearer ${tokenA}` });
const b = () => ({ Authorization: `Bearer ${tokenB}` });

beforeAll(async () => {
  process.env.RETENTION_STUDY_FILE = path.join(dir, 'routes.json');
  process.env.ADMIN_API_TOKEN = 'r'.repeat(40);
  process.env.ADMIN_IDS = 'retention-review';
  for (const n of ['A', 'B']) {
    const playerId = `return_${n}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const registration = await request(app).post('/api/auth/register')
      .send({ playerId, email: `${playerId}@example.com`, password: 'secret123' });
    expect(registration.status).toBe(200);
    if (n === 'A') tokenA = registration.body.token; else tokenB = registration.body.token;
  }
});

describe('signed-in and operator routes', () => {
  test('auth required, disabled by default, no implicit enrollment or record on visits', async () => {
    expect((await request(app).post('/api/retention-study/visit').send({})).status).toBe(401);
    expect((await request(app).post('/api/retention-study/opt-in').set(a()).send({})).status).toBe(503);
    expect((await request(app).get('/api/retention-study/me').set(a())).body.consented).toBe(false);
    process.env.RETENTION_STUDY_ENABLED = '1';
    expect((await request(app).post('/api/retention-study/visit').set(a()).send({})).body).toMatchObject({ consented: false, counted: false });
    expect(fs.existsSync(process.env.RETENTION_STUDY_FILE!)).toBe(false);
  });

  test('only self-consent records days; another player cannot read, write or withdraw their record', async () => {
    expect((await request(app).post('/api/retention-study/opt-in').set(a()).send({ userId: 'forged' })).status).toBe(400);
    const joined = await request(app).post('/api/retention-study/opt-in').set(a()).send({});
    expect(joined.status).toBe(200); expect(joined.body.consented).toBe(true);
    const other = await request(app).get('/api/retention-study/me').set(b());
    expect(other.body.consented).toBe(false);
    const duplicate = await request(app).post('/api/retention-study/visit').set(a()).send({});
    expect(duplicate.body.counted).toBe(false); // Opt-in already recorded today's app open.
    expect((await request(app).post('/api/retention-study/visit').set(b()).send({})).body.consented).toBe(false);
    expect(fs.readFileSync(process.env.RETENTION_STUDY_FILE!, 'utf8')).not.toMatch(/return_A_|return_B_|forged|email|location/);
    expect((await request(app).delete('/api/retention-study/me').set(b())).body.consented).toBe(false);
    expect((await request(app).get('/api/retention-study/me').set(a())).body.consented).toBe(true);
  });

  test('the admin report suppresses small cohorts; withdrawal still works after study enrollment is paused', async () => {
    expect((await request(app).get('/api/admin/retention-study')).status).toBe(401);
    const report = await request(app).get('/api/admin/retention-study')
      .set('x-admin-token', 'r'.repeat(40)).set('x-admin-id', 'retention-review');
    expect(report.status).toBe(200);
    expect(report.headers['cache-control']).toBe('private, no-store');
    expect(report.body).toMatchObject({ enrolledSuppressed: true, d1: { suppressed: true }, d7: { suppressed: true }, cohorts: [] });
    expect(JSON.stringify(report.body)).not.toMatch(/return_A_|return_B_|participant|pseudonym|email/);
    const heldKey = process.env.RETENTION_STUDY_KEY;
    delete process.env.RETENTION_STUDY_KEY;
    expect((await request(app).delete('/api/retention-study/me').set(a())).status).toBe(503);
    process.env.RETENTION_STUDY_KEY = heldKey!;
    expect((await request(app).get('/api/retention-study/me').set(a())).body.consented).toBe(true);
    process.env.RETENTION_STUDY_ENABLED = '0';
    const withdrawn = await request(app).delete('/api/retention-study/me').set(a());
    expect(withdrawn.status).toBe(200); expect(withdrawn.body.consented).toBe(false);
    expect((await request(app).get('/api/retention-study/me').set(a())).body.consented).toBe(false);
    expect((await request(app).post('/api/retention-study/visit').set(a()).send({})).status).toBe(503);
    expect(JSON.parse(fs.readFileSync(process.env.RETENTION_STUDY_FILE!, 'utf8')).participants).toEqual({});
  });
});
