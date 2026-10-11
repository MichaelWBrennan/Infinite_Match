// Live ops: offers, today, and the weekly event. Run with: npm run test:server
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../app.js';
import { openDatabase } from '../db.js';
import { playGreedy } from './bot.mjs';

const EVENT_ID = 'week-2026-10-05';
const WEEK = {
  id: EVENT_ID,
  name: 'Royal Sprint',
  description: 'Win levels this week to earn bonus coins.',
  start: '2026-10-05T00:00:00Z',
  end: '2026-10-12T00:00:00Z',
  milestones: [{ wins: 1, coins: 50 }, { wins: 2, coins: 100 }],
};

describe('live ops', () => {
  let app;
  let base;
  let clock;
  let dir;
  const saved = { config: process.env.LIVE_OPS_CONFIG, disabled: process.env.WEEKLY_EVENT_DISABLED };

  before(async () => {
    dir = mkdtempSync(join(tmpdir(), 'liveops-'));
    const path = join(dir, 'liveops.json');
    writeFileSync(path, JSON.stringify({ events: [], deals: [], weeklyEvents: [WEEK], weeklyEventArchive: [] }));
    process.env.LIVE_OPS_CONFIG = path;
    delete process.env.WEEKLY_EVENT_DISABLED;
    clock = { now: Date.parse('2026-10-10T12:00:00Z') };
    app = createApp({ db: openDatabase(':memory:'), allowedOrigins: [], now: () => clock.now, authLimitPerWindow: 10000 });
    await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${app.server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve) => app.server.close(resolve));
    app.db.close();
    for (const [key, env] of [['LIVE_OPS_CONFIG', saved.config], ['WEEKLY_EVENT_DISABLED', saved.disabled]]) {
      if (env === undefined) delete process.env[key];
      else process.env[key] = env;
    }
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
    const name = `lo_${Math.random().toString(36).slice(2, 10)}`;
    const reg = await call('POST', '/api/auth/register', { body: { playerId: name, password: 'long-enough-pw' } });
    return { token: reg.json.token, id: app.db.prepare('SELECT id FROM players WHERE username = ?').get(name).id };
  }

  function seed(playerId, change) {
    const row = app.db.prepare('SELECT state FROM economy WHERE player_id = ?').get(playerId);
    const economy = JSON.parse(row.state);
    if (!economy.kingdom) economy.kingdom = { rooms: {}, renovations: 0 };
    change(economy);
    app.db.prepare('UPDATE economy SET state = ? WHERE player_id = ?').run(JSON.stringify(economy), playerId);
  }

  const coins = async (token) => (await call('GET', '/api/account-economy/data', { token })).json.data.currencies.coins.amount;

  it('lists coin packs publicly, with prices from the server catalog', async () => {
    const res = await call('GET', '/api/live-ops/offers');
    assert.equal(res.status, 200);
    assert.ok(res.json.coinPacks.length > 0);
    for (const pack of res.json.coinPacks) {
      assert.equal(typeof pack.coins, 'number');
      assert.equal(typeof pack.priceCents, 'number');
    }
    assert.deepEqual(res.json.deals, []);
  });

  it('shows today\'s deals only to signed-in players, and marks none as owned', async () => {
    assert.equal((await call('GET', '/api/live-ops/today')).status, 401);
    const { token } = await newPlayer();
    const res = await call('GET', '/api/live-ops/today', { token });
    assert.equal(res.status, 200);
    assert.deepEqual(res.json.deals, []);
    assert.deepEqual(res.json.activeEvents, []);
  });

  it('previews the active week publicly, with no progress', async () => {
    const res = await call('GET', '/api/live-ops/weekly/preview');
    assert.equal(res.status, 200);
    assert.equal(res.json.disabled, false);
    assert.equal(res.json.event.id, EVENT_ID);
    assert.equal(res.json.event.status, 'active');
    assert.equal(res.json.event.wins, 0);
    assert.ok(res.json.event.milestones.every((m) => m.canClaim === false));
  });

  it('shows a player their weekly progress and blocks claims they have not earned', async () => {
    assert.equal((await call('GET', '/api/live-ops/weekly')).status, 401);
    const { token } = await newPlayer();
    const view = await call('GET', '/api/live-ops/weekly', { token });
    assert.equal(view.json.event.wins, 0);
    const early = await call('POST', '/api/live-ops/weekly/claim', { token, body: { eventId: EVENT_ID, wins: 1 } });
    assert.equal(early.status, 409);
    assert.equal(early.json.error, 'weekly_progress_required');
  });

  it('counts a verified win toward the week, and pays each milestone once', async () => {
    const { token, id } = await newPlayer();
    const attempt = await call('POST', '/api/account-economy/energy/spend', { token, body: { level: 1, mode: 'classic', rulesVersion: 5 } });
    const played = playGreedy(attempt.json.result.generatedLevel);
    const win = await call('POST', '/api/account-economy/level/complete', {
      token,
      body: {
        level: 1, attemptId: attempt.json.result.attemptId, score: played.score,
        moves: played.moves, objectiveProgress: played.objectiveProgress,
      },
    });
    assert.equal(win.status, 200, JSON.stringify(win.json));
    const view = await call('GET', '/api/live-ops/weekly', { token });
    assert.equal(view.json.event.wins, 1);
    assert.equal(view.json.event.milestones[0].canClaim, true);

    const before = await coins(token);
    const claim = await call('POST', '/api/live-ops/weekly/claim', { token, body: { eventId: EVENT_ID, wins: 1 } });
    assert.equal(claim.status, 200);
    assert.equal(claim.json.result.coins, 50);
    assert.equal(claim.json.result.duplicate, false);
    assert.equal(await coins(token), before + 50);
    const again = await call('POST', '/api/live-ops/weekly/claim', { token, body: { eventId: EVENT_ID, wins: 1 } });
    assert.equal(again.json.result.duplicate, true);
    assert.equal(await coins(token), before + 50);

    // Two wins are needed for milestone 2, and a milestone that does not exist is refused.
    seed(id, (economy) => { economy.weeklyEvents[EVENT_ID].wins = 2; });
    assert.equal((await call('POST', '/api/live-ops/weekly/claim', { token, body: { eventId: EVENT_ID, wins: 2 } })).json.result.coins, 100);
    assert.equal((await call('POST', '/api/live-ops/weekly/claim', { token, body: { eventId: EVENT_ID, wins: 3 } })).json.error, 'weekly_milestone_not_found');
  });

  it('answers unknown events with 404 and refuses claims after the week ends', async () => {
    const { token, id } = await newPlayer();
    seed(id, (economy) => { economy.weeklyEvents = { [EVENT_ID]: { wins: 2, claimed: [] } }; });
    const unknown = await call('POST', '/api/live-ops/weekly/claim', { token, body: { eventId: 'week-2000-01-03', wins: 1 } });
    assert.equal(unknown.status, 404);
    assert.equal(unknown.json.error, 'weekly_event_not_found');

    clock.now = Date.parse('2026-10-13T12:00:00Z');
    try {
      const late = await call('POST', '/api/live-ops/weekly/claim', { token, body: { eventId: EVENT_ID, wins: 1 } });
      assert.equal(late.status, 409);
      assert.equal(late.json.error, 'weekly_event_closed');
      assert.equal((await call('GET', '/api/live-ops/weekly/preview')).json.event?.status ?? null, null);
    } finally {
      clock.now = Date.parse('2026-10-10T12:00:00Z');
    }
  });

  it('WEEKLY_EVENT_DISABLED switches the weekly event off everywhere', async () => {
    process.env.WEEKLY_EVENT_DISABLED = '1';
    try {
      const res = await call('GET', '/api/live-ops/weekly/preview');
      assert.equal(res.json.disabled, true);
      assert.equal(res.json.event, null);
    } finally {
      delete process.env.WEEKLY_EVENT_DISABLED;
    }
  });
});
