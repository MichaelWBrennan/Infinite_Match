/**
 * Server-side price list for in-game items.
 *
 * Purchases use these prices, never a client-supplied amount. Each entry names
 * the currency it costs and how much. Keep this in step with the shop UI.
 */
export const ITEM_CATALOG = {
  bomb: { category: 'powerups', currencyId: 'coins', price: 150 },
  rocket: { category: 'powerups', currencyId: 'coins', price: 200 },
  rainbow: { category: 'powerups', currencyId: 'coins', price: 300 },
  lightning: { category: 'powerups', currencyId: 'coins', price: 300 },
  diamond: { category: 'powerups', currencyId: 'coins', price: 400 },
  target: { category: 'powerups', currencyId: 'coins', price: 250 },
  star: { category: 'powerups', currencyId: 'coins', price: 350 },
};

// Level-complete rules. The client reports the result, so the server bounds it.
export const LEVEL_LIMITS = {
  maxLevel: 10000,
  maxScore: 1000000,
  maxStars: 3,
  maxCoinsPerLevel: 500,
};

export default ITEM_CATALOG;
