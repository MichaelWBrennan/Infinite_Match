import { describe, expect, jest, test } from '@jest/globals';
import { AccountEconomyService } from '../services/economy/AccountEconomyService.js';

const newAccount = async () => {
  const service = new AccountEconomyService();
  const id = `atomic_${Math.random().toString(36).slice(2)}`;
  await service.initializePlayerEconomy(id);
  return { service, id };
};

const failOneSave = (service: AccountEconomyService) =>
  jest.spyOn(service, 'updatePlayerEconomyCache').mockRejectedValueOnce(new Error('store unavailable'));

describe('single-save account reward paths', () => {
  test('a level win keeps its paid attempt after a failed payout, then pays one exact receipt', async () => {
    const { service, id } = await newAccount();
    const { attemptId } = await service.spendAttemptEnergy(id, 2, Date.now(), null, 900);
    const claim = { mode: 'level', score: 1000, legacyTarget: 900 };
    const fail = failOneSave(service);
    await expect(service.settleLevelAttempt(id, attemptId, 2, claim)).rejects.toThrow('store unavailable');
    fail.mockRestore();
    const before = await service.getPlayerEconomy(id);
    expect(before.pendingAttempt.id).toBe(attemptId);
    expect(before.currencies.coins.amount).toBe(1000);
    expect(before.progression.totalXp).toBe(0);
    expect(before.statistics.levelsCompleted).toBe(0);
    expect(before.levelReceipts).toBeUndefined();

    const write = jest.spyOn(service, 'updatePlayerEconomyCache');
    const first = await service.settleLevelAttempt(id, attemptId, 2, claim);
    expect(write).toHaveBeenCalledTimes(1);
    const retry = await service.settleLevelAttempt(id, attemptId, 2, claim, () => { throw Error('policy offline'); });
    expect(retry.result).toEqual({ ...first.result, duplicate: true });
    expect(write).toHaveBeenCalledTimes(1);
    write.mockRestore();
    const paid = await service.getPlayerEconomy(id);
    expect(paid.currencies.coins.amount).toBe(1125); // 100 level-up + 25 win
    expect(paid.currencies.stars.amount).toBe(1);
    expect(paid.progression).toMatchObject({ level: 2, xp: 0, totalXp: 100 });
    expect(paid.statistics).toMatchObject({ gamesPlayed: 1, levelsCompleted: 1, totalScore: 1000 });
    const view = await service.getPlayerEconomyView(id);
    expect(view.levelReceipts).toBeUndefined();
    expect(view.pendingAttempt).toBeUndefined();
    await expect(service.settleLevelAttempt(id, attemptId, 2, { ...claim, score: 1200 }))
      .rejects.toMatchObject({ code: 'attempt_result_mismatch' });
    const next = await service.spendAttemptEnergy(id, 2);
    await service.settleLevelAttempt(id, attemptId, 2, claim);
    expect((await service.getPlayerEconomy(id)).pendingAttempt.id).toBe(next.attemptId);
  });

  test('simultaneous level claims pay once and a receipt survives the claim deadline', async () => {
    const { service, id } = await newAccount();
    const at = Date.now();
    const { attemptId } = await service.spendAttemptEnergy(id, 2, at, null, 900);
    const claim = { mode: 'level', score: 1000, legacyTarget: 900 };
    const [a, b] = await Promise.all([
      service.settleLevelAttempt(id, attemptId, 2, claim, {}, at + 1000),
      service.settleLevelAttempt(id, attemptId, 2, claim, {}, at + 1000),
    ]);
    expect([a.result.duplicate, b.result.duplicate].filter(Boolean)).toHaveLength(1);
    const recovered = await service.settleLevelAttempt(id, attemptId, 2, claim, {}, at + 4 * 60 * 60 * 1000);
    expect(recovered.result).toEqual({ ...a.result, duplicate: true });
    expect((await service.getPlayerEconomy(id)).statistics.levelsCompleted).toBe(1);
  });

  test('progression saves XP and milestone level-up rewards as one unit', async () => {
    const { service, id } = await newAccount();
    const fail = failOneSave(service);
    await expect(service.updateProgression(id, 500)).rejects.toThrow('store unavailable');
    fail.mockRestore();
    const before = await service.getPlayerEconomy(id);
    expect(before.progression.totalXp).toBe(0);
    expect(before.currencies.coins.amount).toBe(1000);
    const write = jest.spyOn(service, 'updatePlayerEconomyCache');
    await service.updateProgression(id, 500);
    expect(write).toHaveBeenCalledTimes(1);
    write.mockRestore();
    const paid = await service.getPlayerEconomy(id);
    expect(paid.progression).toMatchObject({ level: 4, xp: 136, totalXp: 500 });
    expect(paid.currencies.coins.amount).toBe(1450);
  });

  test('wheel claims and rewards live in the same saved snapshot', async () => {
    const { service, id } = await newAccount();
    const fail = failOneSave(service);
    await expect(service.spinLuckyWheel(id, () => 0)).rejects.toThrow('store unavailable');
    fail.mockRestore();
    expect((await service.getPlayerEconomy(id)).wheel).toBeUndefined();
    expect((await service.getPlayerEconomy(id)).currencies.coins.amount).toBe(1000);
    const write = jest.spyOn(service, 'updatePlayerEconomyCache');
    const reward = await service.spinLuckyWheel(id, () => 0);
    expect(reward.reward.id).toBe('coins_50');
    expect(write).toHaveBeenCalledTimes(1);
    write.mockRestore();
    expect((await service.getPlayerEconomy(id)).currencies.coins.amount).toBe(1050);
    await expect(service.spinLuckyWheel(id, () => 0)).rejects.toThrow(/already spun/);
  });

  test('daily claim, XP, level-up grants and season progress save together', async () => {
    const { service, id } = await newAccount();
    const account = await service.getPlayerEconomy(id);
    account.progression.xp = 90;
    const now = Date.now();
    const season = { season: 42, startMs: now - 10000, endMs: now + 10000,
      xpEvents: { daily_login: 25 }, tiers: [] };
    const fail = failOneSave(service);
    await expect(service.claimDailyReward(id, season)).rejects.toThrow('store unavailable');
    fail.mockRestore();
    expect((await service.getPlayerEconomy(id)).dailyRewards.streak).toBe(0);
    expect((await service.getPlayerEconomy(id)).progression.level).toBe(1);
    const write = jest.spyOn(service, 'updatePlayerEconomyCache');
    const result = await service.claimDailyReward(id, season);
    expect(result.reward).toMatchObject({ coins: 100, xp: 50 });
    expect(write).toHaveBeenCalledTimes(1);
    write.mockRestore();
    const paid = await service.getPlayerEconomy(id);
    expect(paid.dailyRewards.streak).toBe(1);
    expect(paid.currencies.coins.amount).toBe(1200); // 100 daily + 100 level-up
    expect(paid.progression).toMatchObject({ level: 2, xp: 40 });
    expect(paid.battlePass.xp).toBe(25);
    await expect(service.claimDailyReward(id, season)).rejects.toThrow(/already claimed/);
  });

  test('catalog purchase cannot debit without its item or charge for a full inventory', async () => {
    const { service, id } = await newAccount();
    const fail = failOneSave(service);
    await expect(service.purchaseCatalogItem(id, 'bomb')).rejects.toThrow('store unavailable');
    fail.mockRestore();
    const before = await service.getPlayerEconomy(id);
    expect(before.currencies.coins.amount).toBe(1000);
    expect(before.inventory.powerups.bomb.count).toBe(3);
    const write = jest.spyOn(service, 'updatePlayerEconomyCache');
    const result = await service.purchaseCatalogItem(id, 'bomb');
    expect(result.currency).toMatchObject({ oldAmount: 1000, newAmount: 850 });
    expect(result.inventory).toMatchObject({ oldCount: 3, newCount: 4 });
    expect(write).toHaveBeenCalledTimes(1);
    write.mockRestore();
    const economy = await service.getPlayerEconomy(id);
    economy.inventory.powerups.bomb.count = economy.inventory.powerups.bomb.maxCount;
    await expect(service.purchaseCatalogItem(id, 'bomb')).rejects.toMatchObject({ code: 'item_full' });
    expect((await service.getPlayerEconomy(id)).currencies.coins.amount).toBe(850);
  });
});
