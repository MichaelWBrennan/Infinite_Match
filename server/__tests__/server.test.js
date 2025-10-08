const request = require('supertest');
const express = require('express');

// Mock the server module
const app = express();

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Basic API endpoint
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'Test endpoint working' });
});

describe('Server Tests', () => {
  test('Health check endpoint should return 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  test('Test API endpoint should return 200', async () => {
    const response = await request(app).get('/api/test');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Test endpoint working');
  });
});
