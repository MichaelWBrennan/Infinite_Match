// Daily rewards and lootboxes. Run with: npm run test:server
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../app.js';
import { openDatabase } from '../db.js';

const DAY = 24 * 60 * 60 * 1000;

describe('daily rewards and lootboxes', () => {
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
    const name = `p_${Math.random().toString(36).slice(2, 10)}`;
    const reg = await call('POST', '/api/auth/register', { body: { playerId: name, password: 'long-enough-pw' } });
    return { token: reg.json.token, id: app.db.prepare('SELECT id FROM players WHERE username = ?').get(name).id };
  }

  const data = async (token) => (await call('GET', '/api/account-economy/data', { token })).json.data;

  it('pays one daily reward per day and continues the streak from yesterday', async () => {
    const { token } = await newPlayer();
    const coinsBefore = (await data(token)).currencies.coins.amount;
    const first = await call('POST', '/api/account-economy/daily-reward/claim', { token });
    assert.equal(first.status, 200);
    assert.equal(first.json.result.streak, 1);
    assert.equal(first.json.result.reward.coins, 100);
    assert.equal(first.json.result.reward.xp, 50);
    const afterFirst = await data(token);
    assert.equal(afterFirst.currencies.coins.amount, coinsBefore + 100);
    assert.equal(afterFirst.dailyRewards.canClaim, false);

    const again = await call('POST', '/api/account-economy/daily-reward/claim', { token });
    assert.equal(again.status, 400);
    assert.match(again.json.error, /already claimed today/);

    clock.now += DAY;
    const second = await call('POST', '/api/account-economy/daily-reward/claim', { token });
    assert.equal(second.json.result.streak, 2);
    assert.equal(second.json.result.reward.coins, 150);
    clock.now -= DAY;
  });

  it('resets the streak after a missed day', async () => {
    const { token } = await newPlayer();
    await call('POST', '/api/account-economy/daily-reward/claim', { token });
    clock.now += 3 * DAY;
    const after = await call('POST', '/api/account-economy/daily-reward/claim', { token });
    assert.equal(after.json.result.streak, 1);
    clock.now -= 3 * DAY;
  });

  it('rejects unknown lootbox types', async () => {
    const { token } = await newPlayer();
    const res = await call('POST', '/api/account-economy/lootbox/open', { token, body: { type: 'mythic' } });
    assert.equal(res.status, 400);
    assert.equal(res.json.error, 'invalid_lootbox');
  });

  it('refuses a lootbox the player cannot afford', async () => {
    const { token, id } = await newPlayer();
    const economy = JSON.parse(app.db.prepare('SELECT state FROM economy WHERE player_id = ?').get(id).state);
    economy.currencies.coins.amount = 50;
    app.db.prepare('UPDATE economy SET state = ? WHERE player_id = ?').run(JSON.stringify(economy), id);
    const res = await call('POST', '/api/account-economy/lootbox/open', { token, body: { type: 'common' } });
    assert.equal(res.status, 400);
    assert.equal(res.json.error, 'insufficient_coins');
  });

  it('charges the box price and grants the rolled reward, with inventory matching the view', async () => {
    const { token } = await newPlayer();
    const start = (await data(token)).currencies.coins.amount;
    const granted = { coins: 0, stars: 0, powerups: {} };
    let spent = 0;
    for (let i = 0; i < 6; i++) {
      const res = await call('POST', '/api/account-economy/lootbox/open', { token, body: { type: 'common' } });
      assert.equal(res.status, 200);
      const { reward } = res.json.result;
      spent += 100;
      if (reward.type === 'currency') granted[reward.currencyId] = (granted[reward.currencyId] || 0) + reward.amount;
      else granted.powerups[reward.itemId] = (granted.powerups[reward.itemId] || 0) + reward.amount;
    }
    const view = await data(token);
    assert.equal(view.currencies.coins.amount, start - spent + (granted.coins || 0));
    assert.equal(view.currencies.stars.amount, granted.stars || 0);
    assert.deepEqual(view.inventory.powerups, granted.powerups);
  });
});
