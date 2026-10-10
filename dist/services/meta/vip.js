/**
 * VIP benefits. A player is VIP while they hold the `vip` entitlement in the purchase ledger.
 * No store product grants it yet: the product needs a price and a store SKU before it can be
 * sold. The benefit below applies as soon as the entitlement exists.
 */
export const VIP_ENTITLEMENT = 'vip';
export const VIP_BENEFITS = Object.freeze({
    coinMultiplier: 1.5,
});
/** Applies VIP to a win reward. Only coins are multiplied; XP and stars are not. */
export function applyVip(reward, isVip) {
    if (!isVip)
        return reward;
    return { ...reward, coins: Math.floor(reward.coins * VIP_BENEFITS.coinMultiplier) };
}
export default { VIP_ENTITLEMENT, VIP_BENEFITS, applyVip };
//# sourceMappingURL=vip.js.map