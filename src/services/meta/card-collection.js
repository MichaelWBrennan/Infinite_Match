/**
 * Card Collection - secondary progression (Royal Match-style collectible cards).
 *
 * Cards belong to sets. Completing a set grants a reward. Cards are obtained
 * through event rewards, level milestones, and card packs. Duplicates can be
 * traded or converted. All state is server-authoritative.
 *
 * Card rarity: common, rare, epic, legendary.
 * Drop rates are weighted by rarity.
 */

const CARD_CATALOG = Object.freeze({
  // Kingdom set (common theme)
  king_card:   { id: 'king_card',   name: 'The King',   set: 'kingdom', rarity: 'common',    type: 'character' },
  queen_card:  { id: 'queen_card',  name: 'The Queen',  set: 'kingdom', rarity: 'common',    type: 'character' },
  prince_card: { id: 'prince_card', name: 'The Prince', set: 'kingdom', rarity: 'rare',      type: 'character' },
  castle_card: { id: 'castle_card', name: 'The Castle', set: 'kingdom', rarity: 'epic',      type: 'building' },
  crown_card:  { id: 'crown_card',  name: 'The Crown',  set: 'kingdom', rarity: 'legendary', type: 'artifact' },

  // Jungle set
  tiger_card:  { id: 'tiger_card',  name: 'Tiger',      set: 'jungle',  rarity: 'common',    type: 'character' },
  parrot_card: { id: 'parrot_card', name: 'Parrot',     set: 'jungle',  rarity: 'common',    type: 'character' },
  monkey_card: { id: 'monkey_card', name: 'Monkey',     set: 'jungle',  rarity: 'rare',      type: 'character' },
  temple_card: { id: 'temple_card', name: 'Temple',     set: 'jungle',  rarity: 'epic',      type: 'building' },
  idol_card:   { id: 'idol_card',   name: 'Golden Idol',set: 'jungle',  rarity: 'legendary', type: 'artifact' },

  // Winter set
  yeti_card:   { id: 'yeti_card',   name: 'Yeti',       set: 'winter',  rarity: 'common',    type: 'character' },
  fox_card:    { id: 'fox_card',    name: 'Arctic Fox', set: 'winter',  rarity: 'rare',      type: 'character' },
  igloo_card:  { id: 'igloo_card',  name: 'Igloo',      set: 'winter',  rarity: 'epic',      type: 'building' },
  aurora_card: { id: 'aurora_card', name: 'Aurora',     set: 'winter',  rarity: 'legendary', type: 'artifact' },
});

/** Sets: completing all cards in a set grants the reward. */
const CARD_SETS = Object.freeze({
  kingdom: { id: 'kingdom', name: 'Kingdom', cards: ['king_card','queen_card','prince_card','castle_card','crown_card'], reward: { coins: 5000, stars: 10 } },
  jungle:  { id: 'jungle',  name: 'Jungle',  cards: ['tiger_card','parrot_card','monkey_card','temple_card','idol_card'],  reward: { coins: 5000, stars: 10 } },
  winter:  { id: 'winter',  name: 'Winter',  cards: ['yeti_card','fox_card','igloo_card','aurora_card'], reward: { coins: 4000, stars: 8 } }, // 4-card set
});

/** Drop weights per rarity. Higher weight = more common. */
const RARITY_WEIGHTS = Object.freeze({
  common:    60,
  rare:      25,
  epic:      12,
  legendary: 3,
});

/** Cards available at each rarity, for weighted random drops. */
const CARDS_BY_RARITY = Object.freeze({
  common:    Object.keys(CARD_CATALOG).filter(id => CARD_CATALOG[id].rarity === 'common'),
  rare:      Object.keys(CARD_CATALOG).filter(id => CARD_CATALOG[id].rarity === 'rare'),
  epic:      Object.keys(CARD_CATALOG).filter(id => CARD_CATALOG[id].rarity === 'epic'),
  legendary: Object.keys(CARD_CATALOG).filter(id => CARD_CATALOG[id].rarity === 'legendary'),
});

/** Cost to open a card pack (in coins). */
export const PACK_COST_COINS = 250;
/** Cards per pack. */
export const PACK_CARD_COUNT = 3;

/** Maximum duplicates of a card before they must be converted (prevents hoarding). */
export const MAX_DUPLICATES = 5;

/**
 * Picks a random card id using weighted rarity selection. `randomInt(max)` returns [0, max).
 */
export function pickRandomCard(randomInt) {
  const rarities = ['common', 'rare', 'epic', 'legendary'];
  const weights = rarities.map(r => RARITY_WEIGHTS[r]);
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = randomInt(total);
  let rarity = null;
  for (let i = 0; i < rarities.length; i++) {
    if (roll < weights[i]) { rarity = rarities[i]; break; }
    roll -= weights[i];
  }
  const pool = CARDS_BY_RARITY[rarity];
  return pool[randomInt(pool.length)];
}

/** Returns the card definition for an id, or null. */
export function cardFor(id) {
  return CARD_CATALOG[id] ?? null;
}

/** Returns all cards in a set. */
export function cardsInSet(setId) {
  const set = CARD_SETS[setId];
  return set ? set.cards.map(id => ({ ...CARD_CATALOG[id] })) : [];
}

/** Returns all set definitions. */
export function allSets() {
  return Object.values(CARD_SETS);
}

/** Returns the card catalog (read-only). */
export function allCards() {
  return { ...CARD_CATALOG };
}

/** Number of unique cards needed to complete a set. */
export function setGoal(setId) {
  const set = CARD_SETS[setId];
  return set ? set.cards.length : 0;
}

/**
 * Evaluates a player's collection against all sets.
 * collection: Map<cardId, count>
 * Returns { sets: [{ id, name, progress, goal, complete, reward }], totalCards, uniqueCards }
 */
export function evaluateCollection(collection, sets = allSets()) {
  const results = [];
  let totalCards = 0;
  let uniqueCards = 0;
  for (const set of sets) {
    let owned = 0;
    for (const cardId of set.cards) {
      const count = collection.get(cardId) || 0;
      if (count > 0) owned += 1;
      totalCards += count;
    }
    for (const cardId of set.cards) {
      if ((collection.get(cardId) || 0) > 0) uniqueCards += 1;
    }
    const complete = owned === set.cards.length;
    results.push({
      id: set.id,
      name: set.name,
      progress: owned,
      goal: set.cards.length,
      complete,
      reward: set.reward,
    });
  }
  return { sets: results, totalCards, uniqueCards };
}

/**
 * Opens a card pack: deducts coins, draws cards, adds to collection.
 * Returns { success, cards: [{ id, name, rarity, isDuplicate }], coinsDeducted, collection }
 * or { success: false, error }.
 */
export async function openCardPack(playerId, accountEconomy, collection, { nowMs = Date.now(), randomInt = (max) => Math.floor(Math.random() * max) } = {}) {
  const economy = await accountEconomy.getPlayerEconomy(playerId);
  const coins = economy.currencies.coins;
  if (coins.amount < PACK_COST_COINS) {
    return { success: false, error: 'insufficient_coins', required: PACK_COST_COINS, balance: coins.amount };
  }

  await accountEconomy.updateCurrency(playerId, 'coins', PACK_COST_COINS, 'spend', 'card_pack');

  const drawn = [];
  for (let i = 0; i < PACK_CARD_COUNT; i++) {
    const cardId = pickRandomCard(randomInt);
    const def = CARD_CATALOG[cardId];
    const before = collection.get(cardId) || 0;
    collection.set(cardId, before + 1);
    drawn.push({ id: cardId, name: def.name, rarity: def.rarity, isDuplicate: before > 0 });
  }

  await accountEconomy.updatePlayerEconomyCache(playerId, economy);

  return {
    success: true,
    cards: drawn,
    coinsDeducted: PACK_COST_COINS,
    collection: new Map(collection),
  };
}

/**
 * Converts duplicate cards into coins. Converts all copies above 1 for each card.
 * Returns { success, coinsEarned, cardsConverted, collection }.
 */
export function convertDuplicates(collection) {
  let coinsEarned = 0;
  const cardsConverted = [];
  const values = {
    common: 10,
    rare: 50,
    epic: 200,
    legendary: 1000,
  };
  for (const [cardId, count] of collection) {
    if (count > 1) {
      const def = CARD_CATALOG[cardId];
      const duplicates = count - 1;
      coinsEarned += duplicates * (values[def.rarity] || 5);
      cardsConverted.push({ id: cardId, name: def.name, duplicates, coins: duplicates * (values[def.rarity] || 5) });
      collection.set(cardId, 1);
    }
  }
  return { success: true, coinsEarned, cardsConverted, collection: new Map(collection) };
}
