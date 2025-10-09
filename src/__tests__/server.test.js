/**
 * Server Tests
 * Basic server functionality tests
 */

import request from 'supertest';
import app from 'server/index.js';

describe('Server', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
    });
  });

  describe('POST /api/verify_receipt', () => {
    it('should validate receipt with required fields', async () => {
      const response = await request(app)
        .post('/api/verify_receipt')
        .send({
          sku: 'test-sku',
          receipt: 'test-receipt-data',
        })
        .expect(200);

      expect(response.body).toHaveProperty('valid');
      expect(response.body).toHaveProperty('sku', 'test-sku');
      expect(response.body).toHaveProperty('requestId');
    });

    it('should return error for missing fields', async () => {
      const response = await request(app)
        .post('/api/verify_receipt')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('valid', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/segments', () => {
    it('should return 401 without authentication', async () => {
      await request(app).post('/api/segments').send({}).expect(401);
    });
  });

  describe('POST /api/promo', () => {
    it('should validate promo code', async () => {
      const response = await request(app)
        .post('/api/promo')
        .send({
          code: 'WELCOME',
          playerId: 'test-player',
        })
        .expect(200);

      expect(response.body).toHaveProperty('ok', true);
      expect(response.body).toHaveProperty('code', 'WELCOME');
      expect(response.body).toHaveProperty('reward');
    });

    it('should return error for invalid promo code', async () => {
      const response = await request(app)
        .post('/api/promo')
        .send({
          code: 'INVALID',
          playerId: 'test-player',
        })
        .expect(404);

      expect(response.body).toHaveProperty('ok', false);
      expect(response.body).toHaveProperty('error', 'Invalid promo code');
    });
  });
});
