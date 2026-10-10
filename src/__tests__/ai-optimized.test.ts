import express from 'express';
import request from 'supertest';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import aiOptimizedRoutes from '../routes/ai-optimized-routes.js';
import { adminAuth } from '../middleware/admin-auth.js';

const app = express();
app.use(express.json());
app.use('/api/ai-optimized', adminAuth, aiOptimizedRoutes);

const ADMIN_TOKEN = 'c'.repeat(40);
const ADMIN_ID = 'ops-ai';
const savedEnv = { ...process.env };

describe('AI-optimized routes', () => {
  beforeAll(() => {
    process.env.ADMIN_API_TOKEN = ADMIN_TOKEN;
    process.env.ADMIN_IDS = ADMIN_ID;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
    delete process.env.OLLAMA_BASE_URL;
  });
  afterAll(() => {
    process.env = savedEnv;
  });

  test('require admin credentials', async () => {
    const res = await request(app).post('/api/ai-optimized/content/generate-level').send({ levelNumber: 3 });
    expect(res.status).toBe(401);
  });

  test('fail fast with 503 when no OpenAI key is configured', async () => {
    const started = Date.now();
    const res = await request(app)
      .post('/api/ai-optimized/content/generate-level')
      .set('x-admin-token', ADMIN_TOKEN)
      .set('x-admin-id', ADMIN_ID)
      .send({ levelNumber: 3, difficulty: 'medium' });
    expect(res.status).toBe(503);
    expect(res.body.error).toBe('ai_not_configured');
    expect(Date.now() - started).toBeLessThan(5000);
  });

  test('health stays reachable without a key', async () => {
    const res = await request(app)
      .get('/api/ai-optimized/health')
      .set('x-admin-token', ADMIN_TOKEN)
      .set('x-admin-id', ADMIN_ID);
    expect(res.status).not.toBe(404);
    expect(res.status).not.toBe(503);
  });
});
