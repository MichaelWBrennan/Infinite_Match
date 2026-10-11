import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import AccountEconomyService from '../services/economy/AccountEconomyService.js';
import { PlayerEconomyDb } from '../services/economy/PlayerEconomyDb.js';
import { aiCacheManager } from '../services/ai-cache-manager.js';

// The durable store is replaced with an in-memory stand-in that copies documents on every save and
// load. Copying matters: it means a test only sees what was actually written, not the live object.
// No MongoDB is needed. The real Mongo calls are a few lines in PlayerEconomyDb.js.

const realLoad = PlayerEconomyDb.load;
const realSave = PlayerEconomyDb.save;
const realInsert = PlayerEconomyDb.insertIfAbsent;
const realPendingSave = PlayerEconomyDb.saveIfPending;
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
  PlayerEconomyDb.insertIfAbsent = async (playerId: string, economy: any) => {
    if (docs.has(playerId)) return false;
    docs.set(playerId, structuredClone({ ...economy, writeRevision: 0 }));
    return true;
  };
  PlayerEconomyDb.save = async (playerId: string, economy: any) => {
    saveCalls++;
    if (failNextSave) {
      failNextSave = false;
      throw new Error('store unavailable');
    }
    const current = docs.get(playerId);
    if (!current || (current.writeRevision ?? 0) !== (economy.writeRevision ?? 0)) return false;
    docs.set(playerId, structuredClone({ ...economy, writeRevision: (current.writeRevision ?? 0) + 1 }));
    return true;
  };
  PlayerEconomyDb.saveIfPending = async (playerId: string, attemptId: string, economy: any) => {
    if (docs.get(playerId)?.pendingAttempt?.id !== attemptId) return false;
    return PlayerEconomyDb.save(playerId, economy);
  };
});

afterEach(() => {
  delete process.env.ECONOMY_STORE;
  PlayerEconomyDb.load = realLoad;
  PlayerEconomyDb.save = realSave;
  PlayerEconomyDb.insertIfAbsent = realInsert;
  PlayerEconomyDb.saveIfPending = realPendingSave;
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

describe('durable economy: racing initialization', () => {
  test('a losing initializer reloads the winning profile instead of caching fresh defaults', async () => {
    const first = new AccountEconomyService();
    const id = uniq('init_race');
    await first.initializePlayerEconomy(id);
    await first.updateCurrency(id, 'coins', 40, 'add', 'test');
    await aiCacheManager.delete(`player_economy:${id}`, 'content');
    const real = PlayerEconomyDb.load;
    let reads = 0;
    PlayerEconomyDb.load = async (playerId: string) => {
      if (reads++ === 0) return null; // concurrent initializer had not inserted yet
      return real(playerId);
    };
    try {
      const second = new AccountEconomyService();
      const result = await second.initializePlayerEconomy(id);
      expect(result.currencies.coins.amount).toBe(1040);
      expect(result.writeRevision).toBe(1);
      expect(docs.get(id).currencies.coins.amount).toBe(1040);
    } finally {
      PlayerEconomyDb.load = real;
    }
  });
});

describe('durable economy: stale workers cannot overwrite a banked receipt', () => {
  test('an unrelated stale save is rejected, then reload preserves the latest reward', async () => {
    const writer = new AccountEconomyService();
    const staleWorker = new AccountEconomyService();
    const id = uniq('revision');
    await writer.initializePlayerEconomy(id);
    const { attemptId } = await writer.spendAttemptEnergy(id, 1);
    const snapshot = structuredClone(await staleWorker.getPlayerEconomy(id));
    const paid = await writer.settleEndlessAttempt(id, attemptId, 8000);

    staleWorker.accountEconomyData.set(id, snapshot);
    const stale = await staleWorker.getPlayerEconomy(id);
    stale.currencies.coins.amount += 500;
    await expect(staleWorker.updatePlayerEconomyCache(id, stale)).rejects.toMatchObject({ code: 'economy_conflict' });
    const fresh = await staleWorker.getPlayerEconomy(id);
    expect(fresh.currencies.coins.amount).toBe(paid.balances.coins);
    expect(fresh.endlessReceipts).toHaveLength(1);
    expect((await staleWorker.settleEndlessAttempt(id, attemptId, 8000)).duplicate).toBe(true);
    expect(docs.get(id).statistics.endlessRuns).toBe(1);
  });

  test('a legacy economy without a revision is upgraded on its next guarded write', async () => {
    const svc = new AccountEconomyService();
    const id = uniq('legacy_revision');
    await svc.initializePlayerEconomy(id);
    delete docs.get(id).writeRevision;
    svc.accountEconomyData.delete(id);
    await aiCacheManager.delete(`player_economy:${id}`, 'content');
    const updated = await svc.updateCurrency(id, 'coins', 20, 'add', 'test');
    expect(updated.newAmount).toBe(1020);
    expect(docs.get(id).writeRevision).toBe(1);
  });

  test('concurrent currency updates on one worker serialize before either snapshot is saved', async () => {
    const svc = new AccountEconomyService();
    const id = uniq('local_race');
    await svc.initializePlayerEconomy(id);
    const fakeSave = PlayerEconomyDb.save;
    let resume: () => void = () => {};
    let entered: () => void = () => {};
    const atSave = new Promise<void>((resolve) => { entered = resolve; });
    const gate = new Promise<void>((resolve) => { resume = resolve; });
    let calls = 0;
    PlayerEconomyDb.save = async (playerId: string, economy: any) => {
      calls++;
      if (calls === 1) { entered(); await gate; }
      return fakeSave(playerId, economy);
    };
    try {
      const first = svc.updateCurrency(id, 'coins', 10, 'add', 'test');
      await atSave;
      const second = svc.updateCurrency(id, 'coins', 20, 'add', 'test');
      expect(calls).toBe(1);
      resume();
      await Promise.all([first, second]);
      expect(calls).toBe(2);
      expect(docs.get(id).currencies.coins.amount).toBe(1030);
      expect(docs.get(id).writeRevision).toBe(2);
    } finally {
      resume();
      PlayerEconomyDb.save = fakeSave;
    }
  });

  test('a stale worker cannot overwrite a complete level win, and the receipt recovers it', async () => {
    const writer = new AccountEconomyService();
    const other = new AccountEconomyService();
    const id = uniq('level_race');
    await writer.initializePlayerEconomy(id);
    const { attemptId } = await writer.spendAttemptEnergy(id, 2, Date.now(), null, 900);
    const stale = structuredClone(await other.getPlayerEconomy(id));
    const claim = { mode: 'level', score: 1000, legacyTarget: 900 };
    const first = await writer.settleLevelAttempt(id, attemptId, 2, claim);
    other.accountEconomyData.set(id, stale);
    const current = await other.getPlayerEconomy(id);
    current.currencies.coins.amount -= 25;
    await expect(other.updatePlayerEconomyCache(id, current)).rejects.toMatchObject({ code: 'economy_conflict' });
    const second = await other.settleLevelAttempt(id, attemptId, 2, claim);
    expect(second.result).toEqual({ ...first.result, duplicate: true });
    expect(docs.get(id).statistics.levelsCompleted).toBe(1);
    expect(docs.get(id).currencies.coins.amount).toBe(first.result.balances.coins);
    expect(docs.get(id).levelReceipts).toHaveLength(1);
  });

  test('Endless re-evaluates its bank on a newer revision with the same pending attempt', async () => {
    const writer = new AccountEconomyService();
    const other = new AccountEconomyService();
    const id = uniq('bank_race');
    await writer.initializePlayerEconomy(id);
    const { attemptId } = await writer.spendAttemptEnergy(id, 1);
    const stale = structuredClone(await writer.getPlayerEconomy(id));
    await other.getPlayerEconomy(id);
    // Another worker records a small legitimate grant without replacing the paid attempt.
    await other.updateCurrency(id, 'coins', 20, 'add', 'test');
    writer.accountEconomyData.set(id, stale);
    const result = await writer.settleEndlessAttempt(id, attemptId, 8000);
    expect(result.balances.coins).toBe(1120);
    expect(docs.get(id).endlessReceipts).toHaveLength(1);
    expect(docs.get(id).statistics.endlessRuns).toBe(1);
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
