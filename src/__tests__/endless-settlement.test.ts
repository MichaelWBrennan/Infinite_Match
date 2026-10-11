import { describe, expect, jest, test } from '@jest/globals';
import { AccountEconomyService } from '../services/economy/AccountEconomyService.js';

const now = Date.now();
const newAccount = async () => {
  const service = new AccountEconomyService();
  const id = `endless_settle_${Math.random().toString(36).slice(2)}`;
  await service.initializePlayerEconomy(id);
  const { attemptId } = await service.spendAttemptEnergy(id, 1, now);
  return { service, id, attemptId };
};

describe('receipt-backed Endless settlement', () => {
  test('concurrent same-score claims pay once, including capped XP, level-up rewards and statistics', async () => {
    const { service, id, attemptId } = await newAccount();
    const write = jest.spyOn(service, 'updatePlayerEconomyCache');
    const [first, second] = await Promise.all([
      service.settleEndlessAttempt(id, attemptId, 100000, now + 1000),
      service.settleEndlessAttempt(id, attemptId, 100000, now + 1000),
    ]);
    expect([first.duplicate, second.duplicate].filter(Boolean)).toHaveLength(1);
    expect(write).toHaveBeenCalledTimes(1);
    write.mockRestore();
    expect(first.reward).toEqual({ coins: 300, xp: 500 });
    const account = await service.getPlayerEconomy(id);
    expect(account.progression).toMatchObject({ level: 4, xp: 25, totalXp: 500 });
    expect(account.currencies.coins.amount).toBe(1750); // 300 bank + 100/150/200 level-ups
    expect(account.statistics).toMatchObject({ endlessRuns: 1, endlessBest: 100000 });
    expect(account.endlessReceipts).toHaveLength(1);
    await expect(service.settleEndlessAttempt(id, attemptId, 100001)).rejects.toMatchObject({ code: 'attempt_score_mismatch' });
  });

  test('a milestone level-up grants its stars and inventory in the same save', async () => {
    const { service, id, attemptId } = await newAccount();
    const account = await service.getPlayerEconomy(id);
    account.progression.level = 9;
    account.progression.xp = 99;
    account.progression.xpToNext = 100;
    const write = jest.spyOn(service, 'updatePlayerEconomyCache');
    const paid = await service.settleEndlessAttempt(id, attemptId, 200, now + 1000);
    expect(write).toHaveBeenCalledTimes(1);
    write.mockRestore();
    expect(paid.reward).toEqual({ coins: 2, xp: 1 });
    const settled = await service.getPlayerEconomy(id);
    expect(settled.progression.level).toBe(10);
    expect(settled.currencies.coins.amount).toBe(1502);
    expect(settled.currencies.stars.amount).toBe(2);
    expect(settled.inventory.powerups.rainbow.count).toBe(2);
    await service.settleEndlessAttempt(id, attemptId, 200, now + 2000);
    expect((await service.getPlayerEconomy(id)).inventory.powerups.rainbow.count).toBe(2);
  });

  test('a failed save does not consume the attempt or leak XP, coins, stats or receipt', async () => {
    const { service, id, attemptId } = await newAccount();
    const original = service.updatePlayerEconomyCache;
    const save = jest.spyOn(service, 'updatePlayerEconomyCache').mockRejectedValueOnce(new Error('save failed'));
    await expect(service.settleEndlessAttempt(id, attemptId, 100000, now + 1000)).rejects.toThrow('save failed');
    save.mockRestore();
    const before = await service.getPlayerEconomy(id);
    expect(before.pendingAttempt.id).toBe(attemptId);
    expect(before.currencies.coins.amount).toBe(1000);
    expect(before.progression.totalXp).toBe(0);
    expect(before.statistics.endlessRuns).toBeUndefined();
    expect(before.endlessReceipts).toBeUndefined();
    const paid = await service.settleEndlessAttempt(id, attemptId, 100000, now + 1000);
    expect(paid.balances.coins).toBe(1750);
    expect(service.updatePlayerEconomyCache).toBe(original);
  });

  test('evicted receipts refuse a very late replay rather than paying it again', async () => {
    const { service, id, attemptId } = await newAccount();
    await service.settleEndlessAttempt(id, attemptId, 0, now + 1000);
    for (let i = 0; i < 32; i++) {
      const next = await service.spendAttemptEnergy(id, 1, now + 2000 + i);
      await service.settleEndlessAttempt(id, next.attemptId, 0, now + 3000 + i);
    }
    expect((await service.getPlayerEconomy(id)).endlessReceipts).toHaveLength(32);
    await expect(service.settleEndlessAttempt(id, attemptId, 0)).rejects.toMatchObject({ code: 'attempt_not_found' });
    expect((await service.getPlayerEconomy(id)).statistics.endlessRuns).toBe(33);
  });

  test('a retry after the next paid start returns its own receipt without touching that attempt', async () => {
    const { service, id, attemptId } = await newAccount();
    const first = await service.settleEndlessAttempt(id, attemptId, 3000, now + 1000);
    const next = await service.spendAttemptEnergy(id, 1, now + 2000);
    expect(await service.settleEndlessAttempt(id, attemptId, 3000, now + 3000))
      .toEqual({ ...first, duplicate: true });
    expect((await service.getPlayerEconomy(id)).pendingAttempt.id).toBe(next.attemptId);
    expect((await service.settleEndlessAttempt(id, next.attemptId, 0, now + 3000)).reward)
      .toEqual({ coins: 0, xp: 0 });
    expect((await service.getPlayerEconomy(id)).statistics.endlessRuns).toBe(2);
  });
});
