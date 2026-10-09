/**
 * Kingdom renovation: six rooms, each upgraded from level 0 to KINGDOM_MAX_LEVEL.
 *
 * Each upgrade costs coins and needs a lifetime star count. Reaching certain levels
 * grants an item. The server decides the price, the gate, and the reward. The client
 * only asks to renovate a room. Kingdom levels do not change gameplay yet.
 */

export const KINGDOM_MAX_LEVEL = 5;

export const KINGDOM_ROOMS = Object.freeze([
  { id: 'throne', name: 'Throne Hall', baseCost: 200 },
  { id: 'library', name: 'Royal Library', baseCost: 200 },
  { id: 'garden', name: 'Royal Garden', baseCost: 150 },
  { id: 'armory', name: 'Armory', baseCost: 250 },
  { id: 'gatehouse', name: 'Gatehouse', baseCost: 250 },
  { id: 'chapel', name: 'Chapel', baseCost: 300 },
]);

// Lifetime stars earned before upgrading to each level. Index = target level.
export const STARS_REQUIRED = Object.freeze([0, 0, 5, 15, 30, 50]);

// Item granted on reaching a level. Index = target level.
export const MILESTONE_REWARDS = Object.freeze({
  3: { category: 'powerups', itemId: 'bomb', amount: 1 },
  5: { category: 'powerups', itemId: 'rainbow', amount: 1 },
});

export function roomById(roomId) {
  return KINGDOM_ROOMS.find((room) => room.id === roomId) || null;
}

/** Coins to upgrade a room to `targetLevel`: baseCost x level squared (x1, x4, x9, x16, x25). */
export function upgradeCost(room, targetLevel) {
  return room.baseCost * targetLevel * targetLevel;
}

export function initialKingdom() {
  return {
    rooms: Object.fromEntries(KINGDOM_ROOMS.map((room) => [room.id, 0])),
    renovations: 0,
  };
}

/** Fills in a kingdom for economies saved before this feature existed. */
export function ensureKingdom(playerEconomy) {
  if (!playerEconomy.kingdom) {
    playerEconomy.kingdom = initialKingdom();
    return playerEconomy.kingdom;
  }
  for (const room of KINGDOM_ROOMS) {
    if (typeof playerEconomy.kingdom.rooms?.[room.id] !== 'number') {
      playerEconomy.kingdom.rooms = { ...(playerEconomy.kingdom.rooms || {}), [room.id]: 0 };
    }
  }
  if (typeof playerEconomy.kingdom.renovations !== 'number') playerEconomy.kingdom.renovations = 0;
  return playerEconomy.kingdom;
}

/**
 * What the next upgrade of a room would cost and require. `ok` is false with a
 * `reason` when the player cannot upgrade it now.
 */
export function planRenovation({ kingdom, room, coins, lifetimeStars }) {
  const current = kingdom.rooms[room.id] ?? 0;
  if (current >= KINGDOM_MAX_LEVEL) {
    return { ok: false, reason: 'room_max_level', current, targetLevel: null, costCoins: 0 };
  }
  const targetLevel = current + 1;
  const costCoins = upgradeCost(room, targetLevel);
  const starsNeeded = STARS_REQUIRED[targetLevel];
  if (lifetimeStars < starsNeeded) {
    return { ok: false, reason: 'stars_required', current, targetLevel, costCoins, starsNeeded };
  }
  if (coins < costCoins) {
    return { ok: false, reason: 'insufficient_coins', current, targetLevel, costCoins, starsNeeded };
  }
  return { ok: true, current, targetLevel, costCoins, starsNeeded };
}

/** The kingdom as the client shows it: each room with its level and next upgrade. */
export function kingdomView({ kingdom, coins, lifetimeStars }) {
  const rooms = KINGDOM_ROOMS.map((room) => {
    const plan = planRenovation({ kingdom, room, coins, lifetimeStars });
    let next = null;
    if (plan.targetLevel) {
      next = {
        level: plan.targetLevel,
        costCoins: plan.costCoins,
        starsRequired: plan.starsNeeded,
        milestone: MILESTONE_REWARDS[plan.targetLevel] || null,
      };
    }
    return {
      id: room.id,
      name: room.name,
      level: plan.current,
      maxLevel: KINGDOM_MAX_LEVEL,
      next,
      canRenovate: plan.ok,
      blockedBy: plan.ok ? null : plan.reason,
    };
  });
  return {
    rooms,
    renovations: kingdom.renovations,
    totalLevel: rooms.reduce((sum, r) => sum + r.level, 0),
    maxTotalLevel: KINGDOM_ROOMS.length * KINGDOM_MAX_LEVEL,
  };
}
