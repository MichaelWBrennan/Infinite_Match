/**
 * Loot boxes are bought with coins and the reward is rolled on the server.
 * Weights are relative. A reward is either a currency or an inventory item.
 */

export const LOOTBOXES = Object.freeze({
  common: Object.freeze({
    costCoins: 100,
    rewards: Object.freeze([
      { id: 'coins_100', weight: 35, type: 'currency', currencyId: 'coins', amount: 100 },
      { id: 'coins_250', weight: 20, type: 'currency', currencyId: 'coins', amount: 250 },
      { id: 'energy_20', weight: 25, type: 'currency', currencyId: 'energy', amount: 20 },
      { id: 'stars_2', weight: 15, type: 'currency', currencyId: 'stars', amount: 2 },
      { id: 'bomb_1', weight: 5, type: 'inventory', category: 'powerups', itemId: 'bomb', amount: 1 },
    ]),
  }),
  rare: Object.freeze({
    costCoins: 500,
    rewards: Object.freeze([
      { id: 'coins_600', weight: 30, type: 'currency', currencyId: 'coins', amount: 600 },
      { id: 'stars_5', weight: 25, type: 'currency', currencyId: 'stars', amount: 5 },
      { id: 'energy_50', weight: 15, type: 'currency', currencyId: 'energy', amount: 50 },
      { id: 'rainbow_1', weight: 20, type: 'inventory', category: 'powerups', itemId: 'rainbow', amount: 1 },
      { id: 'diamond_1', weight: 10, type: 'inventory', category: 'powerups', itemId: 'diamond', amount: 1 },
    ]),
  }),
  epic: Object.freeze({
    costCoins: 1000,
    rewards: Object.freeze([
      { id: 'coins_1500', weight: 30, type: 'currency', currencyId: 'coins', amount: 1500 },
      { id: 'stars_15', weight: 20, type: 'currency', currencyId: 'stars', amount: 15 },
      { id: 'star_1', weight: 20, type: 'inventory', category: 'powerups', itemId: 'star', amount: 1 },
      { id: 'diamond_2', weight: 20, type: 'inventory', category: 'powerups', itemId: 'diamond', amount: 2 },
      { id: 'rainbow_2', weight: 10, type: 'inventory', category: 'powerups', itemId: 'rainbow', amount: 2 },
    ]),
  }),
});

/** Picks one reward by weight. `randomInt(max)` must return an integer in [0, max). */
export function pickLootReward(rewards, randomInt) {
  const total = rewards.reduce((sum, r) => sum + r.weight, 0);
  let roll = randomInt(total);
  for (const reward of rewards) {
    if (roll < reward.weight) return reward;
    roll -= reward.weight;
  }
  return rewards[rewards.length - 1];
}

/** Energy refill: coins per missing energy point. Refilling to full costs only what is missing. */
export const ENERGY_PRICE_COINS = 10;
