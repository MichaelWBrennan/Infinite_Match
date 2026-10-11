// Level results and tuning, retention study, daily mini-games, timed boards, and the refused
// client-grant routes. Run with: npm run test:server
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../app.js';
import { openDatabase } from '../db.js';
import { playGreedy } from './bot.mjs';

const KEY = 'x'.repeat(40);

describe('level results, retention, mini-games, timed boards', () => {
  let app;
  let base;
  let dir;
  let operatorToken;
  const saved = {};
  const ENV = ['LEVEL_RESULTS_FILE', 'LEVEL_TUNING_MANUAL_ENABLED', 'OPERATOR_USERNAMES',
    'RETENTION_STUDY_FILE', 'RETENTION_STUDY_KEY', 'RETENTION_STUDY_ENABLED'];

  before(async () => {
    for (const key of ENV) saved[key] = process.env[key];
    dir = mkdtempSync(join(tmpdir(), 'parity-'));
    process.env.LEVEL_RESULTS_FILE = join(dir, 'level-results.jsonl');
    process.env.RETENTION_STUDY_FILE = join(dir, 'retention.json');
    process.env.RETENTION_STUDY_KEY = KEY;
    process.env.OPERATOR_USERNAMES = 'opsadmin';
    delete process.env.LEVEL_TUNING_MANUAL_ENABLED;
    delete process.env.RETENTION_STUDY_ENABLED;
    app = createApp({ db: openDatabase(':memory:'), allowedOrigins: [], authLimitPerWindow: 10000 });
    await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${app.server.address().port}`;
    operatorToken = await registerAs('opsadmin');
  });

  after(async () => {
    await new Promise((resolve) => app.server.close(resolve));
    app.db.close();
    for (const key of ENV) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
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

  async function registerAs(name) {
    const reg = await call('POST', '/api/auth/register', { body: { playerId: name, password: 'long-enough-pw' } });
    assert.equal(reg.status, 200, JSON.stringify(reg.json));
    return reg.json.token;
  }

  const name = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 8)}`;

  const result = (overrides = {}) => ({
    level: 3, outcome: 'won', score: 1200, targetScore: 1000, movesLeft: 4,
    durationSeconds: 60, isBoss: false, ...overrides,
  });

  describe('level results', () => {
    it('serves targets without a token', async () => {
      const res = await call('GET', '/api/level-results/targets');
      assert.equal(res.status, 200);
      assert.equal(res.json.success, true);
      assert.equal(typeof res.json.levels, 'object');
    });

    it('stores a valid report and rejects a bad one', async () => {
      const token = await registerAs(name('lr'));
      const ok = await call('POST', '/api/level-results', { token, body: result() });
      assert.deepEqual(ok.json, { success: true });
      const bad = await call('POST', '/api/level-results', { token, body: result({ outcome: 'maybe' }) });
      assert.equal(bad.status, 400);
      assert.equal(bad.json.error, 'invalid_outcome');
      const mismatch = await call('POST', '/api/level-results', { token, body: result({ score: 10 }) });
      assert.equal(mismatch.json.error, 'outcome_mismatch');
    });

    it('needs a token to report', async () => {
      assert.equal((await call('POST', '/api/level-results', { body: result() })).status, 401);
    });

    it('stores no player identity with the report', async () => {
      const token = await registerAs(name('lr'));
      const who = name('secret');
      await call('POST', '/api/level-results', { token, body: { ...result(), playerId: who, username: who } });
      const stored = readFileSync(process.env.LEVEL_RESULTS_FILE, 'utf8');
      assert.equal(stored.includes(who), false);
    });

    it('limits the tuning report to operators', async () => {
      const player = await registerAs(name('lr'));
      assert.equal((await call('GET', '/api/level-results/tuning', { token: player })).json.error, 'forbidden');
      const op = operatorToken;
      const report = await call('GET', '/api/level-results/tuning', { token: op });
      assert.equal(report.status, 200);
      assert.equal(report.json.source, 'legacy_client_reported_only');
      assert.ok(Array.isArray(report.json.proposals));
    });

    it('keeps tuning apply off unless the flag is set, and checks the approval', async () => {
      const op = operatorToken;
      const off = await call('POST', '/api/level-results/tuning/apply', { token: op, body: {} });
      assert.equal(off.status, 403);
      assert.equal(off.json.error, 'tuning_apply_disabled');

      process.env.LEVEL_TUNING_MANUAL_ENABLED = '1';
      try {
        const invalid = await call('POST', '/api/level-results/tuning/apply', { token: op, body: { level: 3 } });
        assert.equal(invalid.status, 400);
        assert.equal(invalid.json.error, 'invalid_tuning_approval');
      } finally {
        delete process.env.LEVEL_TUNING_MANUAL_ENABLED;
      }
    });
  });

  describe('retention study', () => {
    it('answers 503 for enrolment and visits while the study is off', async () => {
      const token = await registerAs(name('rs'));
      assert.equal((await call('POST', '/api/retention-study/opt-in', { token, body: {} })).status, 503);
      assert.equal((await call('POST', '/api/retention-study/visit', { token, body: {} })).status, 503);
    });

    it('lets a player read and withdraw their own consent while off', async () => {
      const token = await registerAs(name('rs'));
      const me = await call('GET', '/api/retention-study/me', { token });
      assert.equal(me.status, 200);
      assert.equal(me.json.consented, false);
      const withdrawn = await call('DELETE', '/api/retention-study/me', { token });
      assert.equal(withdrawn.json.consented, false);
    });

    it('enrols, counts a visit, withdraws, and stores only pseudonyms', async () => {
      process.env.RETENTION_STUDY_ENABLED = '1';
      try {
        const who = name('rs');
        const token = await registerAs(who);

        const extra = await call('POST', '/api/retention-study/opt-in', { token, body: { extra: true } });
        assert.equal(extra.json.error, 'unexpected_fields');

        const joined = await call('POST', '/api/retention-study/opt-in', { token, body: {} });
        assert.equal(joined.json.consented, true);
        const again = await call('POST', '/api/retention-study/opt-in', { token, body: {} });
        assert.equal(again.json.consented, true);

        // Same UTC day as the opt-in, so the visit is not counted again.
        const visit = await call('POST', '/api/retention-study/visit', { token, body: {} });
        assert.equal(visit.json.consented, true);
        assert.equal(visit.json.counted, false);

        const stored = readFileSync(process.env.RETENTION_STUDY_FILE, 'utf8');
        assert.equal(stored.includes(who), false, 'the study file must not contain usernames');

        const gone = await call('DELETE', '/api/retention-study/me', { token });
        assert.equal(gone.json.consented, false);
        const after2 = await call('POST', '/api/retention-study/visit', { token, body: {} });
        assert.equal(after2.json.consented, false);
      } finally {
        delete process.env.RETENTION_STUDY_ENABLED;
      }
    });
  });

  describe('daily mini-games', () => {
    it('needs a token', async () => {
      assert.equal((await call('GET', '/api/minigames')).status, 401);
    });

    it('lists the three games, none played yet', async () => {
      const token = await registerAs(name('mg'));
      const list = await call('GET', '/api/minigames', { token });
      assert.equal(list.status, 200);
      assert.deepEqual(list.json.games.map((g) => g.id), ['memory', 'treasure', 'rhythm']);
      assert.ok(list.json.games.every((g) => g.playedToday === false));
    });

    it('pays once per game per day, capped per game', async () => {
      const token = await registerAs(name('mg'));
      const before = (await call('GET', '/api/account-economy/data', { token })).json.data.currencies.coins.amount;

      const paid = await call('POST', '/api/minigames/memory/complete', { token, body: { score: 50 } });
      assert.equal(paid.status, 200, JSON.stringify(paid.json));
      assert.equal(paid.json.result.coins, 100);
      assert.equal(paid.json.result.balance, before + 100);

      const twice = await call('POST', '/api/minigames/memory/complete', { token, body: { score: 50 } });
      assert.equal(twice.status, 409);
      assert.equal(twice.json.error, 'already_played_today');

      // Treasure caps at 180 coins even for the highest allowed score.
      const capped = await call('POST', '/api/minigames/treasure/complete', { token, body: { score: 12 } });
      assert.equal(capped.json.result.coins, 180);

      const list = await call('GET', '/api/minigames', { token });
      assert.equal(list.json.games.find((g) => g.id === 'memory').playedToday, true);
    });

    it('rejects bad games and scores without paying', async () => {
      const token = await registerAs(name('mg'));
      const before = (await call('GET', '/api/account-economy/data', { token })).json.data.currencies.coins.amount;
      assert.equal((await call('POST', '/api/minigames/chess/complete', { token, body: { score: 1 } })).json.error, 'unknown_game');
      assert.equal((await call('POST', '/api/minigames/rhythm/complete', { token, body: { score: 99 } })).json.error, 'invalid_score');
      assert.equal((await call('POST', '/api/minigames/rhythm/complete', { token, body: { score: 1.5 } })).json.error, 'invalid_score');
      assert.equal((await call('POST', '/api/minigames/rhythm/complete', { token, body: {} })).json.error, 'invalid_score');
      const after2 = (await call('GET', '/api/account-economy/data', { token })).json.data.currencies.coins.amount;
      assert.equal(after2, before);
      // Nothing was recorded, so the game is still open for a valid score.
      const ok = await call('POST', '/api/minigames/rhythm/complete', { token, body: { score: 2 } });
      assert.equal(ok.status, 200);
    });
  });

  describe('timed boards', () => {
    it('verifies a real timed win through the replay', async () => {
      const token = await registerAs(name('timed'));
      const spend = await call('POST', '/api/account-economy/energy/spend', { token, body: { level: 1, mode: 'timed', rulesVersion: 5 } });
      assert.equal(spend.status, 200, JSON.stringify(spend.json));
      assert.equal(spend.json.result.generatedLevel.moves, 999);
      const played = playGreedy(spend.json.result.generatedLevel);
      const win = await call('POST', '/api/account-economy/level/complete', {
        token,
        body: { level: 1, attemptId: spend.json.result.attemptId, score: played.score, moves: played.moves, objectiveProgress: played.objectiveProgress, rulesVersion: 5 },
      });
      assert.equal(win.status, 200, JSON.stringify(win.json));
      assert.ok(win.json.result.stars >= 1);
    });

    it('still rejects a timed win whose reported score does not match the replay', async () => {
      const token = await registerAs(name('timed'));
      const spend = await call('POST', '/api/account-economy/energy/spend', { token, body: { level: 1, mode: 'timed', rulesVersion: 5 } });
      const played = playGreedy(spend.json.result.generatedLevel);
      const forged = await call('POST', '/api/account-economy/level/complete', {
        token,
        body: { level: 1, attemptId: spend.json.result.attemptId, score: played.score + 500, moves: played.moves, objectiveProgress: played.objectiveProgress, rulesVersion: 5 },
      });
      assert.equal(forged.status, 400);
    });
  });

  describe('client-grant refusals', () => {
    it('refuses client-sent balance and item changes', async () => {
      const token = await registerAs(name('gr'));
      const currency = await call('POST', '/api/account-economy/currency/update', { token, body: { currencyId: 'coins', amount: 999999, operation: 'add' } });
      assert.equal(currency.status, 403);
      assert.equal(currency.json.error, 'client_grant_disabled');
      const item = await call('POST', '/api/account-economy/inventory/update', { token, body: { category: 'powerups', itemId: 'bomb', quantity: 5, operation: 'add' } });
      assert.equal(item.json.error, 'client_grant_disabled');
      const balance = (await call('GET', '/api/account-economy/data', { token })).json.data.currencies.coins.amount;
      assert.ok(balance < 999999);
    });

    it('does not link platform accounts without verification', async () => {
      const token = await registerAs(name('gr'));
      const res = await call('POST', '/api/auth/platform-sync', { token, body: { platform: 'steam', platformUserId: '1' } });
      assert.equal(res.status, 503);
      assert.equal(res.json.error, 'platform_sync_unavailable');
    });
  });
});
