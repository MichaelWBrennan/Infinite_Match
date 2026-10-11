// Kingdom: renovations and decor. Run with: npm run test:server
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../app.js';
import { openDatabase } from '../db.js';

describe('kingdom renovations and decor', () => {
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
    const name = `k_${Math.random().toString(36).slice(2, 10)}`;
    const reg = await call('POST', '/api/auth/register', { body: { playerId: name, password: 'long-enough-pw' } });
    return { token: reg.json.token, id: app.db.prepare('SELECT id FROM players WHERE username = ?').get(name).id };
  }

  // Test-only: set balances directly, the same way the economy document is stored.
  function seed(playerId, change) {
    const row = app.db.prepare('SELECT state FROM economy WHERE player_id = ?').get(playerId);
    const economy = JSON.parse(row.state);
    // New economies get their kingdom on first load, so create the record here before changing it.
    if (!economy.kingdom) economy.kingdom = { rooms: {}, renovations: 0 };
    change(economy);
    app.db.prepare('UPDATE economy SET state = ? WHERE player_id = ?').run(JSON.stringify(economy), playerId);
  }

  const kingdom = async (token) => call('GET', '/api/kingdom', { token });
  const renovate = (token, roomId) => call('POST', '/api/kingdom/renovate', { token, body: { roomId } });
  const decor = (token, action, body) => call('POST', `/api/kingdom/decor/${action}`, { token, body });

  it('requires sign-in and returns the kingdom with the decor catalog', async () => {
    const anon = await call('GET', '/api/kingdom');
    assert.equal(anon.status, 401);
    const { token } = await newPlayer();
    const res = await kingdom(token);
    assert.equal(res.status, 200);
    assert.equal(res.json.success, true);
    assert.equal(res.json.coins, 1000);
    assert.equal(res.json.coinBonus, 0);
    assert.equal(res.json.kingdom.rooms.length, 6);
    assert.ok(res.json.decor.catalog.some((item) => item.id === 'tapestry'));
    assert.deepEqual(res.json.decor.placed, {});
  });

  it('charges the coins for a renovation and levels the room up', async () => {
    const { token, id } = await newPlayer();
    const res = await renovate(token, 'throne');
    assert.equal(res.status, 200);
    assert.equal(res.json.result.level, 1);
    assert.equal(res.json.result.costCoins, 200);
    assert.equal(res.json.result.coins, 800);
    assert.equal(res.json.result.renovations, 1);
    assert.equal(res.json.result.milestone, null);
    // Level 2 needs 5 lifetime stars, so it is blocked until the player earns them.
    const blocked = await renovate(token, 'throne');
    assert.equal(blocked.status, 400);
    assert.equal(blocked.json.error, 'stars_required');
    seed(id, (economy) => { economy.currencies.stars.earned = 5; });
    const level2 = await renovate(token, 'throne');
    assert.equal(level2.status, 200);
    assert.equal(level2.json.result.level, 2);
    assert.equal(level2.json.result.costCoins, 800); // 200 x 2 squared
    assert.equal(level2.json.result.coins, 0);
  });

  it('gives the milestone item when a room reaches level 3', async () => {
    const { token, id } = await newPlayer();
    seed(id, (economy) => {
      economy.currencies.stars.earned = 50;
      economy.currencies.coins.amount = 10000;
    });
    await renovate(token, 'library'); // level 1
    await renovate(token, 'library'); // level 2
    const third = await renovate(token, 'library'); // level 3: 200 x 9 coins
    assert.equal(third.status, 200);
    assert.equal(third.json.result.level, 3);
    assert.equal(third.json.result.costCoins, 1800);
    assert.deepEqual(third.json.result.milestone, { category: 'powerups', itemId: 'bomb', amount: 1 });
    const data = await call('GET', '/api/account-economy/data', { token });
    assert.equal(data.json.data.inventory.powerups.bomb, 1);
  });

  it('rejects unknown rooms, full rooms, and unaffordable upgrades', async () => {
    const { token, id } = await newPlayer();
    assert.equal((await renovate(token, 'moat')).json.error, 'unknown_room');
    seed(id, (economy) => { economy.currencies.coins.amount = 100; });
    assert.equal((await renovate(token, 'throne')).json.error, 'insufficient_coins');
    seed(id, (economy) => {
      economy.currencies.coins.amount = 1e6;
      economy.currencies.stars.earned = 500;
      economy.kingdom.rooms.throne = 5;
    });
    assert.equal((await renovate(token, 'throne')).json.error, 'room_max_level');
  });

  it('buys decor, places it once room level allows, and removes it', async () => {
    const { token, id } = await newPlayer();
    seed(id, (economy) => { economy.currencies.coins.amount = 5000; });
    const bought = await decor(token, 'buy', { decorId: 'tapestry' });
    assert.equal(bought.status, 200);
    assert.equal(bought.json.result.owned, 1);
    assert.equal(bought.json.result.costCoins, 200);
    assert.equal(bought.json.result.coins, 4800);

    // The throne is still level 0, so a level-1 decoration cannot go there yet.
    assert.equal((await decor(token, 'place', { roomId: 'throne', decorId: 'tapestry' })).json.error, 'room_level_too_low');
    await renovate(token, 'throne');
    const placed = await decor(token, 'place', { roomId: 'throne', decorId: 'tapestry' });
    assert.equal(placed.status, 200);
    assert.deepEqual(placed.json.result.placed, { throne: 'tapestry' });

    // The only tapestry is already displayed, so it cannot go in another room.
    assert.equal((await decor(token, 'place', { roomId: 'garden', decorId: 'tapestry' })).json.error, 'decor_not_owned');
    assert.equal((await decor(token, 'place', { roomId: 'throne', decorId: 'mosaic' })).json.error, 'decor_not_owned');

    const removed = await decor(token, 'remove', { roomId: 'throne' });
    assert.equal(removed.status, 200);
    assert.deepEqual(removed.json.result.placed, {});
    assert.equal((await decor(token, 'remove', { roomId: 'throne' })).json.error, 'room_empty');
  });

  it('validates decor ids and enforces the owned limit', async () => {
    const { token, id } = await newPlayer();
    seed(id, (economy) => { economy.currencies.coins.amount = 1e5; });
    assert.equal((await decor(token, 'buy', { decorId: 'castle' })).json.error, 'unknown_decor');
    assert.equal((await decor(token, 'buy', { decorId: '__proto__' })).json.error, 'unknown_decor');
    for (let i = 0; i < 5; i += 1) assert.equal((await decor(token, 'buy', { decorId: 'banner' })).status, 200);
    assert.equal((await decor(token, 'buy', { decorId: 'banner' })).json.error, 'decor_limit');
  });

  it('choose buys one item when none is in stock, and swaps the room display', async () => {
    const { token, id } = await newPlayer();
    seed(id, (economy) => {
      economy.currencies.coins.amount = 5000;
      economy.kingdom.rooms.throne = 1;
    });
    const first = await decor(token, 'choose', { roomId: 'throne', decorId: 'mosaic' });
    assert.equal(first.status, 200);
    assert.equal(first.json.result.bought, true);
    assert.equal(first.json.result.costCoins, 140);
    assert.equal(first.json.result.coins, 4860);

    // Same item again: nothing is charged and nothing changes.
    const same = await decor(token, 'choose', { roomId: 'throne', decorId: 'mosaic' });
    assert.equal(same.json.result.unchanged, true);
    assert.equal(same.json.result.coins, 4860);

    // Choosing a second owned item swaps it in without buying, and the mosaic returns to stock.
    seed(id, (economy) => { economy.kingdom.rooms.garden = 1; });
    await decor(token, 'buy', { decorId: 'mosaic' });
    const swapped = await decor(token, 'choose', { roomId: 'throne', decorId: 'sconces' });
    assert.equal(swapped.json.result.bought, true);
    const again = await decor(token, 'choose', { roomId: 'garden', decorId: 'mosaic' });
    assert.equal(again.status, 200);
    assert.equal(again.json.result.bought, false);
    assert.deepEqual(again.json.result.placed, { throne: 'sconces', garden: 'mosaic' });
  });

  it('adds the room coin bonus to endless payouts', async () => {
    const { token, id } = await newPlayer();
    seed(id, (economy) => { economy.kingdom.rooms.throne = 5; });
    const view = await kingdom(token);
    assert.ok(Math.abs(view.json.coinBonus - 0.05) < 1e-9);
    const spend = await call('POST', '/api/account-economy/energy/spend', { token, body: { level: 1, mode: 'endless', rulesVersion: 5 } });
    assert.equal(spend.status, 200);
    const res = await call('POST', '/api/account-economy/endless/complete', { token, body: { attemptId: spend.json.result.attemptId, score: 5000 } });
    assert.equal(res.status, 200);
    // 5000 points is 62 coins before the bonus; 62 x 1.05 rounds down to 65.
    assert.equal(res.json.result.reward.coins, 65);
  });

  it('choose rejects a locked room without charging', async () => {
    const { token, id } = await newPlayer();
    seed(id, (economy) => { economy.currencies.coins.amount = 5000; });
    const res = await decor(token, 'choose', { roomId: 'chapel', decorId: 'fountain' });
    assert.equal(res.json.error, 'room_level_too_low');
    const data = await kingdom(token);
    assert.equal(data.json.coins, 5000);
  });
});
