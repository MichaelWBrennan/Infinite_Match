/**
 * VIP benefits. A player is VIP while they hold the `vip` entitlement in the purchase ledger.
 * The `vip` product is in the server catalog (product-catalog.js) and can be purchased
 * through the standard receipt verification / checkout flow. Benefits apply as soon as
 * the entitlement exists.
 */

export const VIP_ENTITLEMENT = 'vip';

export const VIP_BENEFITS = Object.freeze({
  coinMultiplier: 1.5,
  // Extra starting lives above the base MAX_LIVES (5)
  bonusMaxLives: 1,
  // Energy regenerates faster for VIP players (multiplier on regenRate)
  energyRegenMultiplier: 2,
  // Daily reward bonus coins multiplier
  dailyRewardMultiplier: 1.25,
});

/** Applies VIP to a win reward. Only coins are multiplied; XP and stars are not. */
export function applyVip(reward, isVip) {
  if (!isVip) return reward;
  return { ...reward, coins: Math.floor(reward.coins * VIP_BENEFITS.coinMultiplier) };
}

/** Returns the maximum lives for a player, including VIP bonus. */
export function getMaxLives(isVip, baseMaxLives = 5) {
  return baseMaxLives + (isVip ? VIP_BENEFITS.bonusMaxLives : 0);
}

/** Returns the energy regeneration rate for a player, including VIP multiplier. */
export function getEnergyRegenRate(isVip, baseRegenRate = 1) {
  return baseRegenRate * (isVip ? VIP_BENEFITS.energyRegenMultiplier : 1);
}

/** Applies VIP multiplier to daily reward coins. */
export function applyVipToDailyReward(reward, isVip) {
  if (!isVip) return reward;
  return {
    ...reward,
    coins: reward.coins ? Math.floor(reward.coins * VIP_BENEFITS.dailyRewardMultiplier) : reward.coins,
    stars: reward.stars ? Math.floor(reward.stars * VIP_BENEFITS.dailyRewardMultiplier) : reward.stars,
    xp: reward.xp ? Math.floor(reward.xp * VIP_BENEFITS.dailyRewardMultiplier) : reward.xp,
  };
}

export default {
  VIP_ENTITLEMENT,
  VIP_BENEFITS,
  applyVip,
  getMaxLives,
  getEnergyRegenRate,
  applyVipToDailyReward,
};
