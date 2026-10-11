// Social (friends, guilds, names), tournaments, and community challenges. Run with: npm run test:server
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../app.js';
import { openDatabase } from '../db.js';
import { socialStore } from '../social.js';
import { playGreedy } from './bot.mjs';

const FIXTURE = {
  events: [],
  deals: [],
  weeklyEvents: [],
  weeklyEventArchive: [],
  tournaments: [{
    id: 'cup-1',
    name: 'Royal Cup',
    start: '2026-10-01T00:00:00Z',
    end: '2026-10-20T00:00:00Z',
    prizes: [{ from: 1, to: 1, coins: 300 }, { from: 2, to: 3, coins: 100 }],
  }],
  challenges: [{
    id: 'chal-1',
    name: 'Community Crown',
    start: '2026-10-01T00:00:00Z',
    end: '2026-10-31T00:00:00Z',
    goal: 2,
    reward: { coins: 150 },
  }],
};

describe('social, tournaments, and challenges', () => {
  let app;
  let base;
  let clock;
  let dir;
  const saved = {
    live: process.env.LIVE_OPS_CONFIG,
    social: process.env.SOCIAL_STORE_FILE,
    operators: process.env.OPERATOR_USERNAMES,
  };

  before(async () => {
    dir = mkdtempSync(join(tmpdir(), 'social-'));
    const liveOps = join(dir, 'liveops.json');
    writeFileSync(liveOps, JSON.stringify(FIXTURE));
    process.env.LIVE_OPS_CONFIG = liveOps;
    process.env.SOCIAL_STORE_FILE = join(dir, 'social.json');
    process.env.OPERATOR_USERNAMES = 'opsadmin';
    clock = { now: Date.parse('2026-10-10T12:00:00Z') };
    app = createApp({ db: openDatabase(':memory:'), allowedOrigins: [], now: () => clock.now, authLimitPerWindow: 10000 });
    await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${app.server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve) => app.server.close(resolve));
    app.db.close();
    for (const [key, env] of [['LIVE_OPS_CONFIG', saved.live], ['SOCIAL_STORE_FILE', saved.social], ['OPERATOR_USERNAMES', saved.operators]]) {
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

  const tokens = new Map();

  async function registerAs(name) {
    const reg = await call('POST', '/api/auth/register', { body: { playerId: name, password: 'long-enough-pw' } });
    const id = app.db.prepare('SELECT id FROM players WHERE username = ?').get(name).id;
    tokens.set(name, reg.json.token);
    return { token: reg.json.token, id, name };
  }

  function newPlayer(prefix = 's') {
    return registerAs(`${prefix}_${Math.random().toString(36).slice(2, 8)}`);
  }

  const coins = async (token) => (await call('GET', '/api/account-economy/data', { token })).json.data.currencies.coins.amount;

  // A real verified win on a generated level, the same way the game sends it.
  async function winLevel(token, { retry = false } = {}) {
    const spend = await call('POST', '/api/account-economy/energy/spend', { token, body: { level: 1, mode: 'classic', rulesVersion: 5 } });
    assert.equal(spend.status, 200, JSON.stringify(spend.json));
    const played = playGreedy(spend.json.result.generatedLevel);
    const body = {
      level: 1, attemptId: spend.json.result.attemptId, score: played.score,
      moves: played.moves, objectiveProgress: played.objectiveProgress,
    };
    const win = await call('POST', '/api/account-economy/level/complete', { token, body });
    assert.equal(win.status, 200, JSON.stringify(win.json));
    if (retry) {
      const again = await call('POST', '/api/account-economy/level/complete', { token, body });
      assert.equal(again.json.result.duplicate, true);
    }
    return { score: played.score, attemptId: spend.json.result.attemptId };
  }

  describe('friends and names', () => {
    it('requires sign-in and returns a profile with a friend code', async () => {
      assert.equal((await call('GET', '/api/social/me')).status, 401);
      const { token, name } = await newPlayer('ann');
      const me = await call('GET', '/api/social/me', { token });
      assert.equal(me.status, 200);
      assert.equal(typeof me.json.profile.code, 'string');
      assert.ok(name.length > 0);
    });

    it('sets a valid name and refuses an invalid or taken one', async () => {
      const first = await newPlayer('nam');
      const second = await newPlayer('nam');
      assert.equal((await call('PUT', '/api/social/name', { token: first.token, body: { name: 'Crown_01' } })).status, 200);
      const bad = await call('PUT', '/api/social/name', { token: second.token, body: { name: '!!' } });
      assert.equal(bad.status, 400);
      assert.equal(bad.json.error, 'invalid_name');
      const taken = await call('PUT', '/api/social/name', { token: second.token, body: { name: 'Crown_01' } });
      assert.equal(taken.status, 409);
      assert.equal(taken.json.error, 'name_taken');
    });

    it('sends, accepts, and removes friend requests by code', async () => {
      const a = await newPlayer('fa');
      const b = await newPlayer('fb');
      // A profile needs a name before it can take part in friend requests.
      await call('PUT', '/api/social/name', { token: a.token, body: { name: `Ann_${a.name.slice(-4)}` } });
      await call('PUT', '/api/social/name', { token: b.token, body: { name: `Ben_${b.name.slice(-4)}` } });
      const aCode = (await call('GET', '/api/social/me', { token: a.token })).json.profile.code;
      const bCode = (await call('GET', '/api/social/me', { token: b.token })).json.profile.code;

      assert.equal((await call('POST', '/api/social/friends/request', { token: a.token, body: { code: aCode } })).json.error, 'self_request');
      assert.equal((await call('POST', '/api/social/friends/request', { token: b.token, body: { code: 'ZZZZZZZZ' } })).json.error, 'code_not_found');
      assert.equal((await call('POST', '/api/social/friends/request', { token: b.token, body: { code: aCode } })).status, 200);
      assert.equal((await call('POST', `/api/social/friends/${b.name}/decline`, { token: a.token })).status, 200);
      assert.equal((await call('POST', '/api/social/friends/request', { token: b.token, body: { code: aCode } })).status, 200);
      assert.equal((await call('POST', `/api/social/friends/${b.name}/accept`, { token: a.token })).status, 200);

      const friends = await call('GET', '/api/social/friends', { token: a.token });
      assert.equal(friends.status, 200);
      assert.ok(JSON.stringify(friends.json).includes(b.name));
      const board = await call('GET', '/api/social/friends/leaderboard', { token: a.token });
      assert.equal(board.status, 200);
      assert.ok(Array.isArray(board.json.rows));

      assert.equal((await call('DELETE', `/api/social/friends/${b.name}`, { token: a.token })).status, 200);
      assert.equal((await call('POST', `/api/social/friends/${b.name}/accept`, { token: a.token })).json.error, 'no_request');
      assert.ok(bCode.length > 0);
    });

    it('creates, joins, and leaves guilds', async () => {
      const owner = await newPlayer('go');
      const member = await newPlayer('gm');
      const created = await call('POST', '/api/social/guilds', { token: owner.token, body: { name: 'Crown Guild' } });
      assert.equal(created.status, 200);
      const dupe = await call('POST', '/api/social/guilds', { token: member.token, body: { name: 'Crown Guild' } });
      assert.equal(dupe.json.error, 'guild_name_taken');

      const mine = await call('GET', '/api/social/guilds/mine', { token: owner.token });
      assert.equal(mine.json.guild.name, 'Crown Guild');
      const listed = await call('GET', '/api/social/guilds?limit=5', { token: owner.token });
      assert.equal(listed.status, 200);
      assert.ok(JSON.stringify(listed.json.guilds).includes('Crown Guild'));

      const guildId = mine.json.guild.id;
      assert.equal((await call('POST', `/api/social/guilds/${guildId}/join`, { token: member.token })).status, 200);
      assert.equal((await call('POST', `/api/social/guilds/${guildId}/join`, { token: member.token })).json.error, 'already_in_guild');
      assert.equal((await call('POST', '/api/social/guilds/leave', { token: member.token })).status, 200);
      assert.equal((await call('POST', '/api/social/guilds/leave', { token: member.token })).json.error, 'not_in_guild');
    });
  });

  // Challenge progress is community-wide, so each test that counts it starts from zero.
  async function resetChallenge() {
    await socialStore().write((d) => {
      d.competitions['c:chal-1'] = { progress: 0, contributors: {} };
    });
  }

  describe('tournaments and challenges', () => {
    it('shows the active competitions to signed-in players only', async () => {
      assert.equal((await call('GET', '/api/live-ops/competitions')).status, 401);
      const { token } = await newPlayer('cp');
      const res = await call('GET', '/api/live-ops/competitions', { token });
      assert.equal(res.status, 200);
      assert.equal(res.json.tournaments[0].id, 'cup-1');
      assert.equal(res.json.challenges[0].goal, 2);
      assert.equal(res.json.challenges[0].canClaim, false);
    });

    it('counts a verified win once on the board and in challenge progress', async () => {
      await resetChallenge();
      const winner = await newPlayer('tw');
      const { score } = await winLevel(winner.token, { retry: true });
      const view = await call('GET', '/api/live-ops/competitions', { token: winner.token });
      assert.equal(view.json.tournaments[0].you.score, score);
      assert.equal(view.json.tournaments[0].you.isYou, true);
      assert.equal(view.json.challenges[0].progress, 1);
      assert.equal(view.json.challenges[0].contributed, 1);
    });

    it('refuses a challenge claim before the community goal, then pays once', async () => {
      await resetChallenge();
      const player = await newPlayer('ch');
      await winLevel(player.token);
      const early = await call('POST', '/api/live-ops/challenges/chal-1/claim', { token: player.token });
      assert.equal(early.status, 409);
      assert.equal(early.json.error, 'goal_not_reached');

      // The goal is shared by everyone who plays, so a second player's win completes it.
      const helper = await newPlayer('ch2');
      await winLevel(helper.token);
      const before = await coins(player.token);
      const claim = await call('POST', '/api/live-ops/challenges/chal-1/claim', { token: player.token });
      assert.equal(claim.status, 200, JSON.stringify(claim.json));
      assert.equal(claim.json.result.reward.coins, 150);
      assert.equal(claim.json.result.duplicate, false);
      assert.equal(await coins(player.token), before + 150);
      const again = await call('POST', '/api/live-ops/challenges/chal-1/claim', { token: player.token });
      assert.equal(again.json.error, 'already_claimed');
      assert.equal(await coins(player.token), before + 150);
    });

    it('refuses a challenge claim from a player who did not contribute', async () => {
      const bystander = await newPlayer('by');
      await socialStore().write((d) => {
        d.competitions['c:chal-1'] = { progress: 5, contributors: {} };
      });
      const res = await call('POST', '/api/live-ops/challenges/chal-1/claim', { token: bystander.token });
      assert.equal(res.status, 403);
      assert.equal(res.json.error, 'not_a_contributor');
    });

    it('refuses an unknown challenge', async () => {
      const { token } = await newPlayer('uc');
      const res = await call('POST', '/api/live-ops/challenges/nope/claim', { token });
      assert.equal(res.status, 404);
      assert.equal(res.json.error, 'challenge_not_active');
    });

    it('settles a finished tournament for operators only, paying each place once', async () => {
      const top = await newPlayer('top');
      await winLevel(top.token);
      const operator = await registerAs('opsadmin');
      const player = await newPlayer('pl');
      assert.equal((await call('POST', '/api/live-ops/tournaments/cup-1/settle', { token: player.token })).status, 403);

      clock.now = Date.parse('2026-10-21T12:00:00Z');
      try {
        assert.equal((await call('POST', '/api/live-ops/tournaments/nope/settle', { token: operator.token })).status, 404);
        // Other players from earlier tests are on the board too, so find who is actually first.
        const [first1] = await socialStore().tournamentRanking('cup-1');
        const winnerToken = tokens.get(first1.playerId);
        const before1 = await coins(winnerToken);
        const first = await call('POST', '/api/live-ops/tournaments/cup-1/settle', { token: operator.token });
        assert.equal(first.status, 200, JSON.stringify(first.json));
        assert.equal(first.json.success, true);
        assert.deepEqual(first.json.result.failed, []);
        assert.deepEqual(first.json.result.paid.find((p) => p.rank === 1), { rank: 1, coins: 300 });
        assert.equal(await coins(winnerToken), before1 + 300);

        const second = await call('POST', '/api/live-ops/tournaments/cup-1/settle', { token: operator.token });
        assert.deepEqual(second.json.result.paid, []);
        assert.ok(second.json.result.alreadyPaid.includes(1));
        assert.equal(await coins(winnerToken), before1 + 300);
      } finally {
        clock.now = Date.parse('2026-10-10T12:00:00Z');
      }
    });
  });
});
