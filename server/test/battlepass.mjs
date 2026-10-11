// Battle pass: config, progress, tier claims, and season XP. Run with: npm run test:server
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../app.js';
import { openDatabase } from '../db.js';
import { validateSeason } from '../../src/services/meta/battlepass.js';

const SEASON = {
  season: 3,
  name: 'Test Season',
  start: '2026-10-01T00:00:00Z',
  end: '2026-12-31T23:59:59Z',
  premiumSku: 'season_pass_premium',
  xpEvents: { level_complete: 50, daily_login: 10 },
  tiers: [
    { level: 1, xp: 0, free: { coins: 100 }, premium: { coins: 200 } },
    { level: 2, xp: 100, free: { item: 'bomb', amount: 1 }, premium: { coins: 500 } },
    { level: 3, xp: 250, free: { coins: 200 }, premium: { item: 'rainbow', amount: 1 } },
  ],
};

describe('battle pass', () => {
  let app;
  let base;
  let clock;
  let dir;
  const previousConfig = process.env.BATTLEPASS_CONFIG;

  before(async () => {
    dir = mkdtempSync(join(tmpdir(), 'battlepass-'));
    const path = join(dir, 'season.json');
    writeFileSync(path, JSON.stringify(SEASON));
    process.env.BATTLEPASS_CONFIG = path;
    clock = { now: Date.parse('2026-10-10T12:00:00Z') };
    app = createApp({ db: openDatabase(':memory:'), allowedOrigins: [], now: () => clock.now, authLimitPerWindow: 10000 });
    await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${app.server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve) => app.server.close(resolve));
    app.db.close();
    if (previousConfig === undefined) delete process.env.BATTLEPASS_CONFIG;
    else process.env.BATTLEPASS_CONFIG = previousConfig;
    rmSync(dir, { recursive: true, force: true });
  });

  async function call(method, path, { body, token } = {}) {
    const init = { method, headers: {} };
    if (token) init.headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) {
      init.body = JSON.stringify(body);
      init.headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(base + path, init);
    return { status: res.status, json: await res.json() };
  }

  async function newPlayer() {
    const name = `bp_${Math.random().toString(36).slice(2, 10)}`;
    const reg = await call('POST', '/api/auth/register', { body: { playerId: name, password: 'long-enough-pw' } });
    return { token: reg.json.token, id: app.db.prepare('SELECT id FROM players WHERE username = ?').get(name).id };
  }

  // Test-only: write the economy document directly, as the server stores it.
  function seed(playerId, change) {
    const row = app.db.prepare('SELECT state FROM economy WHERE player_id = ?').get(playerId);
    const economy = JSON.parse(row.state);
    if (!economy.kingdom) economy.kingdom = { rooms: {}, renovations: 0 };
    change(economy);
    app.db.prepare('UPDATE economy SET state = ? WHERE player_id = ?').run(JSON.stringify(economy), playerId);
  }

  const progress = (token) => call('GET', '/api/battlepass/progress', { token });
  const claim = (token, body) => call('POST', '/api/battlepass/claim', { token, body });

  it('serves the season config without sign-in', async () => {
    const res = await call('GET', '/api/battlepass/config');
    assert.equal(res.status, 200);
    assert.equal(res.json.pass.season, 3);
    assert.equal(res.json.pass.tiers.length, 3);
  });

  it('shows progress only to signed-in players, starting at tier 1 with no premium', async () => {
    assert.equal((await call('GET', '/api/battlepass/progress')).status, 401);
    const { token } = await newPlayer();
    const res = await progress(token);
    assert.equal(res.status, 200);
    assert.equal(res.json.progress.status, 'active');
    assert.equal(res.json.progress.xp, 0);
    assert.equal(res.json.progress.tier, 1);
    assert.equal(res.json.progress.premiumUnlocked, false);
    assert.deepEqual(res.json.progress.claimed, { free: [], premium: [] });
    assert.equal(res.json.progress.tiers.length, 3);
  });

  it('claims a reached tier once and grants coins', async () => {
    const { token } = await newPlayer();
    const coinsBefore = (await call('GET', '/api/account-economy/data', { token })).json.data.currencies.coins.amount;
    const res = await claim(token, { level: 1, track: 'free' });
    assert.equal(res.status, 200);
    assert.deepEqual(res.json.result.reward, { coins: 100 });
    assert.equal(res.json.result.balances.coins, coinsBefore + 100);
    const again = await claim(token, { level: 1, track: 'free' });
    assert.equal(again.status, 409);
    assert.equal(again.json.error, 'already_claimed');
    const after = await progress(token);
    assert.deepEqual(after.json.progress.claimed.free, [1]);
  });

  it('keeps a tier locked until the player has its XP, then grants a power-up', async () => {
    const { token, id } = await newPlayer();
    const locked = await claim(token, { level: 2, track: 'free' });
    assert.equal(locked.status, 409);
    assert.equal(locked.json.error, 'tier_locked');
    seed(id, (economy) => { economy.battlePass = { active: true, season: 3, xp: 120, claimed: { free: [], premium: [] } }; });
    const res = await claim(token, { level: 2, track: 'free' });
    assert.equal(res.status, 200);
    assert.deepEqual(res.json.result.reward, { item: 'bomb', amount: 1 });
    const data = await call('GET', '/api/account-economy/data', { token });
    assert.equal(data.json.data.inventory.powerups.bomb, 1);
  });

  it('keeps the premium track locked, since the free server has no purchases', async () => {
    const { token, id } = await newPlayer();
    seed(id, (economy) => { economy.battlePass = { active: true, season: 3, xp: 300, claimed: { free: [], premium: [] } }; });
    const res = await claim(token, { level: 1, track: 'premium' });
    assert.equal(res.status, 403);
    assert.equal(res.json.error, 'premium_required');
  });

  it('rejects bad tracks, levels, and unknown tiers', async () => {
    const { token } = await newPlayer();
    assert.equal((await claim(token, { level: 1, track: 'gold' })).json.error, 'invalid_track');
    assert.equal((await claim(token, { level: 'one', track: 'free' })).json.error, 'invalid_level');
    assert.equal((await claim(token, { level: 99, track: 'free' })).json.error, 'tier_not_found');
    assert.equal((await claim(token, { track: 'free' })).json.error, 'invalid_level');
    assert.equal((await claim(token, undefined)).json.error, 'invalid_track');
  });

  it('gives season XP for a daily login, and stops once the season has ended', async () => {
    const { token } = await newPlayer();
    const claimedDaily = await call('POST', '/api/account-economy/daily-reward/claim', { token });
    assert.equal(claimedDaily.status, 200);
    assert.equal((await progress(token)).json.progress.xp, 10);

    clock.now = Date.parse('2027-01-15T12:00:00Z');
    const ended = await progress(token);
    assert.equal(ended.json.progress.status, 'ended');
    const blocked = await claim(token, { level: 1, track: 'free' });
    assert.equal(blocked.status, 409);
    assert.equal(blocked.json.error, 'season_not_active');
    clock.now = Date.parse('2026-10-10T12:00:00Z');
  });

  it('the shipped season config is valid', () => {
    const shipped = JSON.parse(readFileSync(new URL('../../config/battlepass/config.json', import.meta.url), 'utf8'));
    assert.deepEqual(validateSeason(shipped).errors, []);
  });

  it('a broken config fails the battle pass but daily rewards keep paying', async () => {
    const broken = join(dir, 'broken.json');
    writeFileSync(broken, '{ not json');
    const saved = process.env.BATTLEPASS_CONFIG;
    process.env.BATTLEPASS_CONFIG = broken;
    try {
      const { token } = await newPlayer();
      const pass = await call('GET', '/api/battlepass/progress', { token });
      assert.equal(pass.status, 503);
      assert.equal(pass.json.error, 'battlepass_unavailable');
      assert.equal((await call('GET', '/api/battlepass/config')).json.error, 'config_error');
      const daily = await call('POST', '/api/account-economy/daily-reward/claim', { token });
      assert.equal(daily.status, 200);
    } finally {
      process.env.BATTLEPASS_CONFIG = saved;
    }
  });
});
