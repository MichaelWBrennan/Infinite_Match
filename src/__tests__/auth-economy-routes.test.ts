import express from 'express';
import request from 'supertest';
import { describe, test, expect } from '@jest/globals';
import authRoutes from '../routes/auth.js';
import accountEconomyRoutes from '../routes/account-economy.js';

// Regression coverage for the routes the game shell calls. These were either
// unmounted (404) or crashed at load/request time before being fixed.
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/account-economy', accountEconomyRoutes);

describe('auth routes', () => {
  const playerId = `test_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const password = 'secret123';
  let token = '';

  test('register returns a session token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ playerId, email: `${playerId}@example.com`, password });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe('string');
    expect(typeof res.body.sessionId).toBe('string');
  });

  test('login with the right password succeeds', async () => {
    const res = await request(app).post('/api/auth/login').send({ playerId, password });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    token = res.body.token;
  });

  test('login with a wrong password is rejected with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ playerId, password: 'wrongpass' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('profile returns the account for a valid token', async () => {
    const res = await request(app).get('/api/auth/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.profile.playerId).toBe(playerId);
  });
});

describe('account-economy routes', () => {
  test('are mounted and require a session', async () => {
    const res = await request(app).get('/api/account-economy/data');
    expect(res.status).toBe(401);
  });
});
