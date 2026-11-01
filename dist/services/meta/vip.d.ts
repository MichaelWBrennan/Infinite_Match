/** Applies VIP to a win reward. Only coins are multiplied; XP and stars are not. */
export function applyVip(reward: any, isVip: any): any;
/** Returns the maximum lives for a player, including VIP bonus. */
export function getMaxLives(isVip: any, baseMaxLives?: number): number;
/** Returns the energy regeneration rate for a player, including VIP multiplier. */
export function getEnergyRegenRate(isVip: any, baseRegenRate?: number): number;
/** Applies VIP multiplier to daily reward coins. */
export function applyVipToDailyReward(reward: any, isVip: any): any;
/**
 * VIP benefits. A player is VIP while they hold the `vip` entitlement in the purchase ledger.
 * The `vip` product is in the server catalog (product-catalog.js) and can be purchased
 * through the standard receipt verification / checkout flow. Benefits apply as soon as
 * the entitlement exists.
 */
export const VIP_ENTITLEMENT: "vip";
export const VIP_BENEFITS: Readonly<{
    coinMultiplier: 1.5;
    bonusMaxLives: 1;
    energyRegenMultiplier: 2;
    dailyRewardMultiplier: 1.25;
}>;
declare namespace _default {
    export { VIP_ENTITLEMENT };
    export { VIP_BENEFITS };
    export { applyVip };
    export { getMaxLives };
    export { getEnergyRegenRate };
    export { applyVipToDailyReward };
}
export default _default;
//# sourceMappingURL=vip.d.ts.map