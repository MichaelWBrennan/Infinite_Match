/** Applies VIP to a win reward. Only coins are multiplied; XP and stars are not. */
export function applyVip(reward: any, isVip: any): any;
/**
 * VIP benefits. A player is VIP while they hold the `vip` entitlement in the purchase ledger.
 * No store product grants it yet: the product needs a price and a store SKU before it can be
 * sold. The benefit below applies as soon as the entitlement exists.
 */
export const VIP_ENTITLEMENT: "vip";
export const VIP_BENEFITS: Readonly<{
    coinMultiplier: 1.5;
}>;
declare namespace _default {
    export { VIP_ENTITLEMENT };
    export { VIP_BENEFITS };
    export { applyVip };
}
export default _default;
//# sourceMappingURL=vip.d.ts.map