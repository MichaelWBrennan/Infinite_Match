// Level endpoints: context, regions, daily level, level by number. Run with: npm run test:server
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../app.js';
import { openDatabase } from '../db.js';

describe('level endpoints', () => {
  let app;
  let base;

  before(async () => {
    app = createApp({ db: openDatabase(':memory:'), allowedOrigins: [], now: () => Date.parse('2026-10-10T12:00:00Z'), authLimitPerWindow: 10000 });
    await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${app.server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve) => app.server.close(resolve));
    app.db.close();
  });

  const get = async (path) => {
    const res = await fetch(base + path);
    return { status: res.status, json: await res.json() };
  };

  it('lists regions, and refuses an unknown country', async () => {
    const res = await get('/api/levels/regions');
    assert.equal(res.status, 200);
    assert.equal(res.json.success, true);
    assert.ok(res.json.countries, 'catalog has countries');
    const bad = await get('/api/levels/regions?country=ZZ');
    assert.equal(bad.status, 400);
    assert.equal(bad.json.error, 'invalid_country');
  });

  it('returns a local context with no weather and a refresh time', async () => {
    const res = await get('/api/levels/context?timeZone=America%2FNew_York');
    assert.equal(res.status, 200);
    assert.equal(res.json.context.weather, null);
    assert.ok(res.json.context.timeOfDay);
    assert.equal(typeof res.json.context.environmentRefreshAt, 'string');
    assert.ok(res.json.serverTime);
  });

  it('gives the same daily level for the same place and day', async () => {
    const first = await get('/api/levels/daily?timeZone=America%2FNew_York');
    const second = await get('/api/levels/daily?timeZone=America%2FNew_York');
    assert.equal(first.status, 200);
    assert.equal(first.json.level.mode, 'daily');
    assert.equal(first.json.level.isDaily, true);
    assert.deepEqual(first.json.level.board, second.json.level.board);
    assert.equal(first.json.level.targetScore, second.json.level.targetScore);
  });

  it('serves a level by number and rejects a malformed number', async () => {
    const res = await get('/api/levels/5?mode=classic&rulesVersion=5');
    assert.equal(res.status, 200);
    assert.equal(res.json.level.level, 5);
    assert.equal(res.json.level.mode, 'classic');
    const bad = await get('/api/levels/abc');
    assert.equal(bad.status, 400);
    assert.equal(bad.json.error, 'invalid_level');
  });

  it('answers a bad level request with a stable error, not a crash', async () => {
    const res = await get('/api/levels/5?mode=nonsense');
    assert.equal(res.status, 400);
    assert.equal(typeof res.json.error, 'string');
  });
});
