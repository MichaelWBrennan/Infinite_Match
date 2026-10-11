// Run with: npm run test:server
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../app.js';
import { openDatabase } from '../db.js';

const PASSWORD = 'correct-horse-battery';

describe('free server', () => {
  let app;
  let base;
  let clock;
  let allowed;

  before(async () => {
    clock = { now: Date.parse('2026-10-10T12:00:00Z') };
    allowed = ['https://game.example'];
    app = createApp({ db: openDatabase(':memory:'), allowedOrigins: allowed, now: () => clock.now });
    await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${app.server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve) => app.server.close(resolve));
    app.db.close();
  });

  async function call(method, path, { body, token, headers = {}, raw } = {}) {
    const init = { method, headers: { ...headers } };
    if (token) init.headers.Authorization = `Bearer ${token}`;
    if (raw !== undefined) {
      init.body = raw;
      init.headers['Content-Type'] = 'application/json';
    } else if (body !== undefined) {
      init.body = JSON.stringify(body);
      init.headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(base + path, init);
    const text = await res.text();
    return { status: res.status, headers: res.headers, json: text ? JSON.parse(text) : null };
  }

  async function newPlayer(name = `player_${Math.random().toString(36).slice(2, 8)}`) {
    const res = await call('POST', '/api/auth/register', { body: { playerId: name, password: PASSWORD } });
    assert.equal(res.status, 200);
    return { name, token: res.json.token };
  }

  it('answers health checks', async () => {
    const res = await call('GET', '/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.json.ok, true);
  });

  it('registers, rejects duplicates, and logs in', async () => {
    const name = 'Alice_01';
    const reg = await call('POST', '/api/auth/register', { body: { playerId: name, password: PASSWORD } });
    assert.equal(reg.status, 200);
    assert.equal(reg.json.success, true);
    assert.ok(reg.json.token.length > 30);
    assert.ok(reg.json.sessionId);

    const dup = await call('POST', '/api/auth/register', { body: { playerId: 'alice_01', password: PASSWORD } });
    assert.equal(dup.status, 409);
    assert.equal(dup.json.error, 'username_taken');

    const login = await call('POST', '/api/auth/login', { body: { playerId: name, password: PASSWORD } });
    assert.equal(login.status, 200);
    assert.ok(login.json.token);
  });

  it('rejects wrong passwords and unknown users with the same error', async () => {
    const { name } = await newPlayer();
    const wrong = await call('POST', '/api/auth/login', { body: { playerId: name, password: 'not-the-password' } });
    const unknown = await call('POST', '/api/auth/login', { body: { playerId: 'nobody_here', password: 'not-the-password' } });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.equal(wrong.json.error, unknown.json.error);
  });

  it('validates usernames and passwords', async () => {
    const badName = await call('POST', '/api/auth/register', { body: { playerId: 'a b', password: PASSWORD } });
    assert.equal(badName.json.error, 'invalid_username');
    const shortPw = await call('POST', '/api/auth/register', { body: { playerId: 'valid_name', password: 'short' } });
    assert.equal(shortPw.json.error, 'invalid_password');
  });

  it('stores only hashed session tokens and passwords', async () => {
    const { token } = await newPlayer();
    const rows = app.db.prepare('SELECT token_hash FROM sessions').all().map((r) => r.token_hash);
    assert.ok(!rows.includes(token));
    const pw = app.db.prepare('SELECT password_hash FROM players').all().map((r) => r.password_hash);
    assert.ok(pw.every((h) => h.startsWith('scrypt$') && !h.includes(PASSWORD)));
  });

  it('requires a valid bearer token for economy routes', async () => {
    const none = await call('GET', '/api/account-economy/data');
    assert.equal(none.status, 401);
    const bogus = await call('GET', '/api/account-economy/data', { token: 'nope' });
    assert.equal(bogus.status, 401);
  });

  it('starts new players with full energy and the default coins', async () => {
    const { token } = await newPlayer();
    const res = await call('GET', '/api/account-economy/data', { token });
    assert.equal(res.status, 200);
    const c = res.json.data.currencies;
    assert.equal(c.energy.amount, 100);
    assert.equal(c.energy.maxAmount, 100);
    assert.equal(c.coins.amount, 1000);
    assert.equal(c.stars.amount, 0);
  });

  it('spends energy on an attempt and returns an attempt id', async () => {
    const { token } = await newPlayer();
    const res = await call('POST', '/api/account-economy/energy/spend', { token, body: { level: 3 } });
    assert.equal(res.status, 200);
    assert.equal(res.json.result.energy, 99);
    assert.equal(res.json.result.level, 3);
    assert.match(res.json.result.attemptId, /^[0-9a-f-]{36}$/);
  });

  it('refuses attempts with no energy', async () => {
    const { token } = await newPlayer();
    for (let i = 0; i < 100; i++) {
      const ok = await call('POST', '/api/account-economy/energy/spend', { token, body: { level: 1 } });
      assert.equal(ok.status, 200);
    }
    const empty = await call('POST', '/api/account-economy/energy/spend', { token, body: { level: 1 } });
    assert.equal(empty.status, 400);
    assert.equal(empty.json.error, 'energy_empty');
  });

  it('regenerates one energy per minute while the player is away', async () => {
    const { token } = await newPlayer();
    const start = clock.now;
    await call('POST', '/api/account-economy/energy/spend', { token, body: { level: 1 } });
    await call('POST', '/api/account-economy/energy/spend', { token, body: { level: 1 } });
    clock.now = start + 5 * 60_000;
    const res = await call('GET', '/api/account-economy/data', { token });
    assert.equal(res.json.data.currencies.energy.amount, 100);
    clock.now = start;
  });

  it('refills missing energy for coins and refuses when full', async () => {
    const { token } = await newPlayer();
    const full = await call('POST', '/api/account-economy/energy/refill', { token });
    assert.equal(full.json.error, 'energy_full');
    await call('POST', '/api/account-economy/energy/spend', { token, body: { level: 1 } });
    await call('POST', '/api/account-economy/energy/spend', { token, body: { level: 1 } });
    const refill = await call('POST', '/api/account-economy/energy/refill', { token });
    assert.equal(refill.status, 200);
    assert.equal(refill.json.result.energy, 100);
    assert.equal(refill.json.result.costCoins, 20);
    const after = await call('GET', '/api/account-economy/data', { token });
    assert.equal(after.json.data.currencies.coins.amount, 980);
  });

  it('closes attempts idempotently, including unknown ones', async () => {
    const { token } = await newPlayer();
    const spend = await call('POST', '/api/account-economy/energy/spend', { token, body: { level: 2 } });
    const id = spend.json.result.attemptId;
    const first = await call('POST', '/api/account-economy/attempt/close', { token, body: { attemptId: id, outcome: 'lost' } });
    const again = await call('POST', '/api/account-economy/attempt/close', { token, body: { attemptId: id, outcome: 'lost' } });
    const unknown = await call('POST', '/api/account-economy/attempt/close', { token, body: { attemptId: 'missing' } });
    assert.equal(first.json.closed, true);
    assert.equal(again.json.closed, true);
    assert.equal(unknown.json.closed, true);
  });

  it('does not generate levels by mode yet (explicit 503, not a silent fallback)', async () => {
    const { token } = await newPlayer();
    const res = await call('POST', '/api/account-economy/energy/spend', { token, body: { level: 1, mode: 'classic' } });
    assert.equal(res.status, 503);
    assert.equal(res.json.error, 'generated_levels_unavailable');
  });

  it('answers unimplemented /api paths with JSON 503, never HTML 200', async () => {
    const res = await call('GET', '/api/kingdom');
    assert.equal(res.status, 503);
    assert.equal(res.json.code, 'api_unavailable');
    assert.match(res.headers.get('content-type'), /application\/json/);
  });

  it('returns 404 for non-API paths', async () => {
    const res = await call('GET', '/index.html');
    assert.equal(res.status, 404);
  });

  it('allows only configured browser origins', async () => {
    const ok = await call('GET', '/api/health', { headers: { Origin: 'https://game.example' } });
    assert.equal(ok.headers.get('access-control-allow-origin'), 'https://game.example');
    const other = await call('GET', '/api/health', { headers: { Origin: 'https://evil.example' } });
    assert.equal(other.headers.get('access-control-allow-origin'), null);
  });

  it('rejects oversized and malformed bodies', async () => {
    const big = await call('POST', '/api/auth/login', { raw: JSON.stringify({ playerId: 'x'.repeat(20000) }) });
    assert.equal(big.status, 413);
    const bad = await call('POST', '/api/auth/login', { raw: '{not json' });
    assert.equal(bad.json.error, 'invalid_json');
  });

  it('rate limits sign-in attempts per client', async () => {
    const limited = createApp({ db: openDatabase(':memory:'), allowedOrigins: [], now: () => clock.now });
    await new Promise((resolve) => limited.server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${limited.server.address().port}/api/auth/login`;
    let last = 0;
    for (let i = 0; i < 25; i++) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: 'nobody_here', password: 'whatever-password' }),
      });
      last = res.status;
    }
    assert.equal(last, 429);
    await new Promise((resolve) => limited.server.close(resolve));
    limited.db.close();
  });
});
