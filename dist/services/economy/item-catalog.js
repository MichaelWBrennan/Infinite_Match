/**
 * Server-side price list for in-game items.
 *
 * Purchases use these prices, never a client-supplied amount. Each entry names
 * the currency it costs and how much. Keep this in step with the shop UI.
 */
export const ITEM_CATALOG = {
    blast: { category: 'powerups', currencyId: 'coins', price: 150 },
    ray: { category: 'powerups', currencyId: 'coins', price: 200 },
    prism: { category: 'powerups', currencyId: 'coins', price: 300 },
    bolt: { category: 'powerups', currencyId: 'coins', price: 300 },
    facet: { category: 'powerups', currencyId: 'coins', price: 400 },
    mark: { category: 'powerups', currencyId: 'coins', price: 250 },
    nova: { category: 'powerups', currencyId: 'coins', price: 350 },
    spectrum: { category: 'powerups', currencyId: 'coins', price: 400 },
};
// Level-complete rules. The client reports the result, so the server bounds it.
export const LEVEL_LIMITS = {
    maxLevel: Number.MAX_SAFE_INTEGER,
    maxScore: 1000000,
    maxStars: 3,
    maxCoinsPerLevel: 500,
};
export default ITEM_CATALOG;
// Lucky wheel rewards. Weights are relative. The server picks the reward and
// grants it. The client only displays the result.
export const WHEEL_REWARDS = [
    { id: 'coins_50', weight: 40, type: 'currency', currencyId: 'coins', amount: 50 },
    { id: 'coins_150', weight: 25, type: 'currency', currencyId: 'coins', amount: 150 },
    { id: 'stars_1', weight: 20, type: 'currency', currencyId: 'stars', amount: 1 },
    { id: 'blast_1', weight: 10, type: 'inventory', category: 'powerups', itemId: 'blast', amount: 1 },
    { id: 'facet_1', weight: 5, type: 'inventory', category: 'powerups', itemId: 'facet', amount: 1 },
    { id: 'shift_1', weight: 8, type: 'inventory', category: 'powerups', itemId: 'shift', amount: 1 },
    { id: 'hammer_1', weight: 12, type: 'inventory', category: 'powerups', itemId: 'hammer', amount: 1 },
];
/** Picks one wheel reward. `randomInt(max)` must return an integer in [0, max). */
export function pickWheelReward(randomInt) {
    const total = WHEEL_REWARDS.reduce((sum, r) => sum + r.weight, 0);
    let roll = randomInt(total);
    for (const reward of WHEEL_REWARDS) {
        if (roll < reward.weight)
            return reward;
        roll -= reward.weight;
    }
    return WHEEL_REWARDS[WHEEL_REWARDS.length - 1];
}
//# sourceMappingURL=item-catalog.js.map