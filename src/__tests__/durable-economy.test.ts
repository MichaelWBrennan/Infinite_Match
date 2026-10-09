import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import AccountEconomyService from '../services/economy/AccountEconomyService.js';
import { PlayerEconomyDb } from '../services/economy/PlayerEconomyDb.js';
import { aiCacheManager } from '../services/ai-cache-manager.js';

// The durable store is replaced with an in-memory stand-in that copies documents on every save and
// load. Copying matters: it means a test only sees what was actually written, not the live object.
// No MongoDB is needed. The real Mongo calls are a few lines in PlayerEconomyDb.js.

const realLoad = PlayerEconomyDb.load;
const realSave = PlayerEconomyDb.save;
let docs: Map<string, any>;
let saveCalls: number;
let failNextSave: boolean;

const uniq = (p: string) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

beforeEach(() => {
  process.env.ECONOMY_STORE = 'mongo';
  docs = new Map();
  saveCalls = 0;
  failNextSave = false;
  PlayerEconomyDb.load = async (playerId: string) => {
    const doc = docs.get(playerId);
    return doc ? JSON.parse(JSON.stringify(doc)) : null;
  };
  PlayerEconomyDb.save = async (playerId: string, economy: any) => {
    saveCalls++;
    if (failNextSave) {
      failNextSave = false;
      throw new Error('store unavailable');
    }
    docs.set(playerId, JSON.parse(JSON.stringify(economy)));
  };
});

afterEach(() => {
  delete process.env.ECONOMY_STORE;
  PlayerEconomyDb.load = realLoad;
  PlayerEconomyDb.save = realSave;
});

// Roll 60 on a 100-weight common box lands on energy_20, not coins. A coin reward would hide a leaked spend.
const ENERGY_ROLL = () => 60;

const coinsOf = (economy: any) => economy.currencies.coins.amount;
const storedCoins = (playerId: string) => coinsOf(docs.get(playerId));

describe('durable economy: failed writes never leak into later saves', () => {
  test('a failed save leaves the saved balance in place and the next read matches it', async () => {
    const svc = new AccountEconomyService();
    const playerId = uniq('save_fail');
    await svc.initializePlayerEconomy(playerId, 'test');
    const before = storedCoins(playerId);
    expect(before).toBeGreaterThan(0);

    failNextSave = true;
    await expect(svc.openLootbox(playerId, 'common', ENERGY_ROLL)).rejects.toThrow('store unavailable');

    // The store still holds the old balance. The read must not serve the spend that failed to save.
    const after = await svc.getPlayerEconomy(playerId);
    expect(coinsOf(after)).toBe(before);
    expect(storedCoins(playerId)).toBe(before);
  });

  test('a later successful write does not carry an earlier failed spend', async () => {
    const svc = new AccountEconomyService();
    const playerId = uniq('no_carry');
    await svc.initializePlayerEconomy(playerId, 'test');
    const before = storedCoins(playerId);

    failNextSave = true;
    await expect(svc.openLootbox(playerId, 'common', ENERGY_ROLL)).rejects.toThrow();

    // A later successful box costs 100 and pays energy_20. It must save exactly that, with no trace
    // of the failed attempt.
    await svc.openLootbox(playerId, 'common', ENERGY_ROLL);
    expect(storedCoins(playerId)).toBe(before - 100);
    expect(coinsOf(await svc.getPlayerEconomy(playerId))).toBe(before - 100);
  });

  test('an operation that throws after spending is rolled back to the saved state', async () => {
    const svc = new AccountEconomyService();
    const playerId = uniq('throw_after_spend');
    await svc.initializePlayerEconomy(playerId, 'test');
    const before = storedCoins(playerId);
    const saves = saveCalls;

    // randomInt runs after the coins are spent in memory, so a throw here used to leave the spend
    // on the cached object.
    await expect(
      svc.openLootbox(playerId, 'common', () => {
        throw new Error('rng failed');
      }),
    ).rejects.toThrow('rng failed');

    expect(saveCalls).toBe(saves); // nothing was written
    expect(coinsOf(await svc.getPlayerEconomy(playerId))).toBe(before);
    expect(storedCoins(playerId)).toBe(before);
  });
});

describe('durable economy: survives a restart', () => {
  test('a purchase is still there after the service and cache are cleared', async () => {
    const svc = new AccountEconomyService();
    const playerId = uniq('restart');
    await svc.initializePlayerEconomy(playerId, 'test');
    await svc.openLootbox(playerId, 'common', ENERGY_ROLL);
    const expected = coinsOf(await svc.getPlayerEconomy(playerId));

    // Simulate a restart: a new service instance and an empty cache. Only the store survives.
    await aiCacheManager.delete(`player_economy:${playerId}`, 'content');
    const restarted = new AccountEconomyService();
    expect(coinsOf(await restarted.getPlayerEconomy(playerId))).toBe(expected);
  });

  test('re-initialising a player keeps the saved balance instead of resetting it', async () => {
    const svc = new AccountEconomyService();
    const playerId = uniq('reinit');
    await svc.initializePlayerEconomy(playerId, 'test');
    await svc.openLootbox(playerId, 'common', ENERGY_ROLL);
    const expected = storedCoins(playerId);

    await aiCacheManager.delete(`player_economy:${playerId}`, 'content');
    const restarted = new AccountEconomyService();
    const economy = await restarted.initializePlayerEconomy(playerId, 'test');
    expect(coinsOf(economy)).toBe(expected);
  });
});

describe('durable economy: off by default', () => {
  test('without ECONOMY_STORE the store is never called', async () => {
    delete process.env.ECONOMY_STORE;
    const svc = new AccountEconomyService();
    const playerId = uniq('memory_only');
    await svc.initializePlayerEconomy(playerId, 'test');
    await svc.openLootbox(playerId, 'common', ENERGY_ROLL);
    expect(saveCalls).toBe(0);
  });
});
