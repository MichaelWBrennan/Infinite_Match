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

// Completion bonus granted when every room reaches KINGDOM_MAX_LEVEL.
export const KINGDOM_COMPLETION_REWARD = { category: 'powerups', itemId: 'rainbow', amount: 3 };

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
    completedRooms: [],
    completedAt: null,
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
  if (!Array.isArray(playerEconomy.kingdom.completedRooms)) {
    playerEconomy.kingdom.completedRooms = [];
  }
  if (playerEconomy.kingdom.completedAt === undefined) playerEconomy.kingdom.completedAt = null;
  return playerEconomy.kingdom;
}

/** True when every room has reached KINGDOM_MAX_LEVEL. */
export function kingdomCompleted(kingdom) {
  const completed = kingdom?.completedRooms || [];
  return completed.length >= KINGDOM_ROOMS.length;
}

/** The room IDs that have reached max level, in completion order. */
export function completedRoomIds(kingdom) {
  return [...(kingdom?.completedRooms || [])];
}

/** The timestamp the kingdom was fully completed, or null. */
export function kingdomCompletedAt(kingdom) {
  return kingdom?.completedAt ?? null;
}

/**
 * Marks a room as completed when its level reaches KINGDOM_MAX_LEVEL.
 * Returns { kingdom, justCompleted, allCompleted } where `kingdom` is the
 * updated state (with completedRooms and completedAt set), `justCompleted` is
 * true when this call completed the room, and `allCompleted` is true when
 * every room is now complete.
 */
export function markRoomCompleted(kingdom, roomId, nowMs = Date.now()) {
  const completed = [...(kingdom?.completedRooms || [])];
  let justCompleted = false;
  if (!completed.includes(roomId)) {
    completed.push(roomId);
    justCompleted = true;
  }
  const allCompleted = completed.length >= KINGDOM_ROOMS.length;
  const updated = {
    ...kingdom,
    completedRooms: completed,
    completedAt: allCompleted && !kingdom?.completedAt ? new Date(nowMs).toISOString() : kingdom?.completedAt ?? null,
  };
  return { kingdom: updated, justCompleted, allCompleted };
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
export function kingdomView({ kingdom, coins, lifetimeStars, roomJustCompleted = null }) {
  const completed = kingdom?.completedRooms || [];
  const rooms = KINGDOM_ROOMS.map((room) => {
    const plan = planRenovation({ kingdom, room, coins, lifetimeStars });
    const isCompleted = completed.includes(room.id);
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
      completed: isCompleted,
      justCompleted: roomJustCompleted === room.id,
      next,
      canRenovate: plan.ok && !isCompleted,
      blockedBy: isCompleted ? 'room_max_level' : plan.ok ? null : plan.reason,
    };
  });
  const allCompleted = completed.length >= KINGDOM_ROOMS.length;
  return {
    rooms,
    renovations: kingdom.renovations,
    totalLevel: rooms.reduce((sum, r) => sum + r.level, 0),
    maxTotalLevel: KINGDOM_ROOMS.length * KINGDOM_MAX_LEVEL,
    completedRooms: [...completed],
    completedAt: kingdom?.completedAt ?? null,
    allCompleted,
    completionReward: allCompleted ? KINGDOM_COMPLETION_REWARD : null,
  };
}

// Each room level adds this much to coins from a level win, up to the cap. These are tuning
// values: change them here, and the server applies the change to every win.
export const ROOM_COIN_BONUS_PER_LEVEL = 0.01;
export const ROOM_COIN_BONUS_CAP = 0.15;

/**
 * The coin multiplier from kingdom rooms: 1 plus 1% per room level, capped at +15%. Reads only;
 * a missing kingdom gives 1.
 */
export function kingdomCoinMultiplier(kingdom) {
  const rooms = kingdom?.rooms || {};
  const levels = KINGDOM_ROOMS.reduce((sum, room) => sum + (Number(rooms[room.id]) || 0), 0);
  return 1 + Math.min(ROOM_COIN_BONUS_CAP, levels * ROOM_COIN_BONUS_PER_LEVEL);
}
