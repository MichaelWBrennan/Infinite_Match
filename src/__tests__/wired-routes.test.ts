import express from 'express';
import request from 'supertest';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import authRoutes from '../routes/auth.js';
import adminRoutes from '../routes/admin.js';
import consentRoutes from '../routes/consent.js';
import pushRoutes from '../routes/push.js';
import experimentsRoutes from '../routes/experiments.js';
import battlepassRoutes from '../routes/battlepass.js';
import subscriptionsRoutes from '../routes/subscriptions.js';
import { verifyAdminCredentials } from '../middleware/admin-auth.js';

// Mirrors the mounts in src/server/index.ts for the routers that were unmounted before.
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/experiments', experimentsRoutes);
app.use('/api/battlepass', battlepassRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);

const ADMIN_TOKEN = 'a'.repeat(40);
const ADMIN_ID = 'ops-1';
const savedEnv = { ...process.env };

describe('admin authentication', () => {
  beforeAll(() => {
    process.env.ADMIN_API_TOKEN = ADMIN_TOKEN;
    process.env.ADMIN_IDS = `${ADMIN_ID},ops-2`;
  });
  afterAll(() => {
    process.env = savedEnv;
  });

  test('accepts the right token for an allowed admin id', () => {
    expect(verifyAdminCredentials(ADMIN_TOKEN, ADMIN_ID)).toEqual({ id: ADMIN_ID, permissions: ['admin'] });
  });

  test('rejects a wrong token, an unknown id, or missing headers', () => {
    expect(verifyAdminCredentials('b'.repeat(40), ADMIN_ID)).toBeNull();
    expect(verifyAdminCredentials(ADMIN_TOKEN, 'intruder')).toBeNull();
    expect(verifyAdminCredentials(undefined, ADMIN_ID)).toBeNull();
    expect(verifyAdminCredentials(ADMIN_TOKEN, undefined)).toBeNull();
  });

  test('fails closed when the server has no admin configuration', () => {
    process.env.ADMIN_API_TOKEN = 'short';
    expect(verifyAdminCredentials('short', ADMIN_ID)).toBeNull();
    process.env.ADMIN_API_TOKEN = ADMIN_TOKEN;
    process.env.ADMIN_IDS = '';
    expect(verifyAdminCredentials(ADMIN_TOKEN, ADMIN_ID)).toBeNull();
    process.env.ADMIN_IDS = `${ADMIN_ID}`;
  });

  test('admin routes return 401 without credentials', async () => {
    const res = await request(app).get('/api/admin/economy/stats');
    expect(res.status).toBe(401);
  });

  test('admin routes return 401 with the wrong token', async () => {
    const res = await request(app)
      .get('/api/admin/economy/stats')
      .set('x-admin-token', 'b'.repeat(40))
      .set('x-admin-id', ADMIN_ID);
    expect(res.status).toBe(401);
  });

  test('economy stats say when the economy CSVs are missing, instead of a generic error', async () => {
    const res = await request(app)
      .get('/api/admin/economy/stats')
      .set('x-admin-token', ADMIN_TOKEN)
      .set('x-admin-id', ADMIN_ID);
    expect([200, 503]).toContain(res.status);
    if (res.status === 503) expect(res.body.error).toBe('economy_data_missing');
  });

  test('admin logs endpoint is honest about being unbuilt, not a crash', async () => {
    const res = await request(app)
      .get('/api/admin/logs')
      .set('x-admin-token', ADMIN_TOKEN)
      .set('x-admin-id', ADMIN_ID);
    expect(res.status).toBe(501);
  });

  test('admin security events are returned to an authorised admin', async () => {
    const res = await request(app)
      .get('/api/admin/security/events?limit=5')
      .set('x-admin-token', ADMIN_TOKEN)
      .set('x-admin-id', ADMIN_ID);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.events)).toBe(true);
  });

});

describe('player-scoped routes need a session', () => {
  test('consent, push, and experiments reject anonymous requests', async () => {
    expect((await request(app).get('/api/consent/someone')).status).toBe(401);
    expect((await request(app).post('/api/consent/set').send({ adsAllowed: true })).status).toBe(401);
    expect((await request(app).post('/api/push/register').send({ token: 't' })).status).toBe(401);
    expect(
      (await request(app).post('/api/experiments/assign').send({ experiment: 'e', variants: ['a', 'b'] })).status,
    ).toBe(401);
  });

  test('push send is admin-only', async () => {
    const res = await request(app)
      .post('/api/push/send')
      .send({ token: 't', title: 'hi', body: 'there' });
    expect(res.status).toBe(401);
  });

  test('a signed-in player cannot read another player consent', async () => {
    const register = await request(app)
      .post('/api/auth/register')
      .send({
        playerId: `consent_${Date.now()}`,
        email: `consent_${Date.now()}@example.com`,
        password: 'secret123',
      });
    expect(register.status).toBe(200);
    const res = await request(app)
      .get('/api/consent/some-other-player')
      .set('Authorization', `Bearer ${register.body.token}`);
    expect(res.status).toBe(403);
  });
});

describe('battle pass and subscriptions', () => {
  test('battle pass config is public', async () => {
    const res = await request(app).get('/api/battlepass/config');
    expect(res.status).toBe(200);
    expect(res.body.pass.season).toBeDefined();
  });

  test('Apple notifications are refused until the root is configured', async () => {
    const saved = process.env.APPLE_ROOT_CA_G3;
    delete process.env.APPLE_ROOT_CA_G3;
    const res = await request(app).post('/api/subscriptions/apple').send({ signedPayload: 'a.b.c' });
    expect(res.status).toBe(503);
    if (saved !== undefined) process.env.APPLE_ROOT_CA_G3 = saved;
  });

  test('unsigned Apple payloads are rejected, not recorded', async () => {
    process.env.APPLE_ROOT_CA_G3 = '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----';
    const res = await request(app).post('/api/subscriptions/apple').send({ notificationType: 'DID_RENEW' });
    expect(res.status).toBe(401);
    delete process.env.APPLE_ROOT_CA_G3;
  });

  test('Google notifications are refused until the audience is configured', async () => {
    delete process.env.GOOGLE_RTDN_AUDIENCE;
    delete process.env.GOOGLE_RTDN_SERVICE_ACCOUNT;
    const res = await request(app).post('/api/subscriptions/google').send({});
    expect(res.status).toBe(503);
  });

  test('Google notifications without a valid Pub/Sub token are rejected', async () => {
    process.env.GOOGLE_RTDN_AUDIENCE = 'https://example.test/api/subscriptions/google';
    process.env.GOOGLE_RTDN_SERVICE_ACCOUNT = 'rtdn@project.iam.gserviceaccount.com';
    const res = await request(app).post('/api/subscriptions/google').send({ message: {} });
    expect(res.status).toBe(401);
    delete process.env.GOOGLE_RTDN_AUDIENCE;
    delete process.env.GOOGLE_RTDN_SERVICE_ACCOUNT;
  });
});
