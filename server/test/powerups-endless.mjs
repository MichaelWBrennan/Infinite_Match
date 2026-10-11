// Power-ups in verified levels, and endless runs. Run with: npm run test:server
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../app.js';
import { openDatabase } from '../db.js';
import { playGreedy } from './bot.mjs';

describe('power-ups and endless mode', () => {
  let app;
  let base;
  let clock;

  before(async () => {
    clock = { now: Date.parse('2026-10-10T12:00:00Z') };
    app = createApp({ db: openDatabase(':memory:'), allowedOrigins: [], now: () => clock.now, authLimitPerWindow: 10000 });
    await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${app.server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve) => app.server.close(resolve));
    app.db.close();
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
    const name = `q_${Math.random().toString(36).slice(2, 10)}`;
    const reg = await call('POST', '/api/auth/register', { body: { playerId: name, password: 'long-enough-pw' } });
    return { token: reg.json.token, id: app.db.prepare('SELECT id FROM players WHERE username = ?').get(name).id };
  }

  function editEconomy(id, edit) {
    const economy = JSON.parse(app.db.prepare('SELECT state FROM economy WHERE player_id = ?').get(id).state);
    edit(economy);
    app.db.prepare('UPDATE economy SET state = ? WHERE player_id = ?').run(JSON.stringify(economy), id);
  }

  const data = async (token) => (await call('GET', '/api/account-economy/data', { token })).json.data;

  async function spend(token, body) {
    const res = await call('POST', '/api/account-economy/energy/spend', { token, body });
    assert.equal(res.status, 200, JSON.stringify(res.json));
    return res.json.result;
  }

  it('spends a power-up from the inventory into a receipt, once per use id', async () => {
    const { token, id } = await newPlayer();
    editEconomy(id, (e) => { e.inventory.powerups.bomb = 1; });
    const attempt = await spend(token, { level: 1, mode: 'classic', rulesVersion: 5 });

    const used = await call('POST', '/api/account-economy/powerup/use', {
      token, body: { powerupId: 'bomb', attemptId: attempt.attemptId, useId: 'use-1' },
    });
    assert.equal(used.status, 200);
    assert.equal(used.json.result.reused, false);
    assert.match(used.json.result.receiptId, /^[0-9a-f-]{36}$/);
    assert.equal((await data(token)).inventory.powerups.bomb, undefined);

    const retry = await call('POST', '/api/account-economy/powerup/use', {
      token, body: { powerupId: 'bomb', attemptId: attempt.attemptId, useId: 'use-1' },
    });
    assert.equal(retry.json.result.reused, true);
    assert.equal(retry.json.result.receiptId, used.json.result.receiptId);

    const none = await call('POST', '/api/account-economy/powerup/use', {
      token, body: { powerupId: 'bomb', attemptId: attempt.attemptId, useId: 'use-2' },
    });
    assert.equal(none.status, 400);
    assert.equal(none.json.error, 'insufficient_powerup');
  });

  it('rejects unknown power-ups and power-ups on attempts with no replayable board', async () => {
    const { token, id } = await newPlayer();
    editEconomy(id, (e) => { e.inventory.powerups.star = 1; });
    const bad = await call('POST', '/api/account-economy/powerup/use', { token, body: { powerupId: 'nuke', attemptId: 'x' } });
    assert.equal(bad.json.error, 'invalid_powerup');
    const legacy = await spend(token, { level: 2 });
    const res = await call('POST', '/api/account-economy/powerup/use', {
      token, body: { powerupId: 'star', attemptId: legacy.attemptId },
    });
    assert.equal(res.json.error, 'powerups_need_a_replayable_level');
  });

  it('pays a verified win that uses a power-up receipt', async () => {
    const { token, id } = await newPlayer();
    editEconomy(id, (e) => { e.inventory.powerups.bomb = 1; });
    const attempt = await spend(token, { level: 1, mode: 'classic', rulesVersion: 5 });
    const used = await call('POST', '/api/account-economy/powerup/use', {
      token, body: { powerupId: 'bomb', attemptId: attempt.attemptId, useId: 'win-bomb' },
    });
    const receiptId = used.json.result.receiptId;
    const prefix = [{ receiptId, type: 'bomb', target: [4, 4] }];
    const played = playGreedy(attempt.generatedLevel, prefix);
    assert.equal(played.complete, true, 'the test bot should win with the bomb applied');

    const win = await call('POST', '/api/account-economy/level/complete', {
      token, body: {
        level: 1, attemptId: attempt.attemptId, score: played.score,
        moves: played.moves, objectiveProgress: played.objectiveProgress,
      },
    });
    assert.equal(win.status, 200, JSON.stringify(win.json));
    assert.ok(win.json.result.stars >= 1);
  });

  it('rejects a win that leaves a power-up receipt unused', async () => {
    const { token, id } = await newPlayer();
    editEconomy(id, (e) => { e.inventory.powerups.bomb = 1; });
    const attempt = await spend(token, { level: 1, mode: 'classic', rulesVersion: 5 });
    await call('POST', '/api/account-economy/powerup/use', {
      token, body: { powerupId: 'bomb', attemptId: attempt.attemptId, useId: 'unused-bomb' },
    });
    const played = playGreedy(attempt.generatedLevel);
    const res = await call('POST', '/api/account-economy/level/complete', {
      token, body: {
        level: 1, attemptId: attempt.attemptId, score: played.score,
        moves: played.moves, objectiveProgress: played.objectiveProgress,
      },
    });
    assert.equal(res.status, 400);
    assert.equal(res.json.error, 'unused_powerup_receipt');
  });

  it('pays an endless run by score with the caps, once', async () => {
    const { token } = await newPlayer();
    const attempt = await spend(token, { level: 1, mode: 'endless', rulesVersion: 5 });
    const before = await data(token);
    const res = await call('POST', '/api/account-economy/endless/complete', {
      token, body: { attemptId: attempt.attemptId, score: 5000 },
    });
    assert.equal(res.status, 200);
    assert.deepEqual(res.json.result.reward, { coins: 62, xp: 25 });
    const retry = await call('POST', '/api/account-economy/endless/complete', {
      token, body: { attemptId: attempt.attemptId, score: 5000 },
    });
    assert.equal(retry.json.result.duplicate, true);
    const after = await data(token);
    assert.equal(after.currencies.coins.amount, before.currencies.coins.amount + 62);
  });

  it('caps endless payouts and separates endless from classic completion', async () => {
    const { token } = await newPlayer();
    const endless = await spend(token, { level: 1, mode: 'endless', rulesVersion: 5 });
    const capped = await call('POST', '/api/account-economy/endless/complete', {
      token, body: { attemptId: endless.attemptId, score: 1000000 },
    });
    assert.deepEqual(capped.json.result.reward, { coins: 300, xp: 500 });

    const classic = await spend(token, { level: 1, mode: 'classic', rulesVersion: 5 });
    const wrong = await call('POST', '/api/account-economy/endless/complete', {
      token, body: { attemptId: classic.attemptId, score: 100 },
    });
    assert.equal(wrong.json.error, 'not_endless_attempt');

    const endlessAsLevel = await call('POST', '/api/account-economy/level/complete', {
      token, body: { level: 1, attemptId: endless.attemptId, score: 100, moves: [[0, 0, 1, 0]] },
    });
    assert.equal(endlessAsLevel.json.error, 'use_endless_complete');
  });
});
