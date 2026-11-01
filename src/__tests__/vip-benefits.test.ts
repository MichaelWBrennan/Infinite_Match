import { describe, expect, test } from '@jest/globals';
import {
  VIP_ENTITLEMENT,
  VIP_BENEFITS,
  applyVip,
  getMaxLives,
  getEnergyRegenRate,
  applyVipToDailyReward,
} from '../services/meta/vip.js';

describe('VIP benefits', () => {
  test('VIP_ENTITLEMENT constant', () => {
    expect(VIP_ENTITLEMENT).toBe('vip');
  });

  test('VIP_BENEFITS has all expected fields', () => {
    expect(VIP_BENEFITS.coinMultiplier).toBe(1.5);
    expect(VIP_BENEFITS.bonusMaxLives).toBe(1);
    expect(VIP_BENEFITS.energyRegenMultiplier).toBe(2);
    expect(VIP_BENEFITS.dailyRewardMultiplier).toBe(1.25);
  });

  test('applyVip multiplies coins', () => {
    const reward = { coins: 100, stars: 10, xp: 50 };
    const result = applyVip(reward, true);
    expect(result.coins).toBe(150);
    expect(result.stars).toBe(10);
    expect(result.xp).toBe(50);
  });

  test('applyVip does nothing for non-VIP', () => {
    const reward = { coins: 100 };
    const result = applyVip(reward, false);
    expect(result).toEqual({ coins: 100 });
  });

  test('getMaxLives returns base for non-VIP', () => {
    expect(getMaxLives(false, 5)).toBe(5);
  });

  test('getMaxLives returns bonus for VIP', () => {
    expect(getMaxLives(true, 5)).toBe(6);
  });

  test('getEnergyRegenRate returns base for non-VIP', () => {
    expect(getEnergyRegenRate(false, 1)).toBe(1);
  });

  test('getEnergyRegenRate returns doubled for VIP', () => {
    expect(getEnergyRegenRate(true, 1)).toBe(2);
  });

  test('applyVipToDailyReward multiplies all fields', () => {
    const reward = { coins: 100, stars: 10, xp: 50 };
    const result = applyVipToDailyReward(reward, true);
    expect(result.coins).toBe(125);
    expect(result.stars).toBe(12);
    expect(result.xp).toBe(62);
  });

  test('applyVipToDailyReward does nothing for non-VIP', () => {
    const reward = { coins: 100 };
    const result = applyVipToDailyReward(reward, false);
    expect(result).toEqual({ coins: 100 });
  });
});
