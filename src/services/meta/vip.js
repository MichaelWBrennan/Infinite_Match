/**
 * VIP benefits. A player is VIP while they hold the `vip` entitlement in the purchase ledger.
 * The `vip` product is in the server catalog (product-catalog.js) and can be purchased
 * through the standard receipt verification / checkout flow. Benefits apply as soon as
 * the entitlement exists.
 */

export const VIP_ENTITLEMENT = 'vip';

export const VIP_BENEFITS = Object.freeze({
  coinMultiplier: 1.5,
});

/** Applies VIP to a win reward. Only coins are multiplied; XP and stars are not. */
export function applyVip(reward, isVip) {
  if (!isVip) return reward;
  return { ...reward, coins: Math.floor(reward.coins * VIP_BENEFITS.coinMultiplier) };
}

export default { VIP_ENTITLEMENT, VIP_BENEFITS, applyVip };
