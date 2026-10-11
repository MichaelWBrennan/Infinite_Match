// Kingdom: room upgrades and decorations. Rules come from src/services/meta/kingdom*.js, the same
// pure functions the existing server uses. Each action runs in one transaction and saves once.
import {
  ensureKingdom,
  kingdomCoinMultiplier,
  kingdomView,
  MILESTONE_REWARDS,
  planRenovation,
  roomById,
} from '../src/services/meta/kingdom.js';
import {
  DecorError,
  MAX_DECOR_OWNED,
  decorView,
  ensureDecor,
  planBuyDecor,
  planChooseDecor,
  planPlaceDecor,
  planRemoveDecor,
} from '../src/services/meta/kingdom-decor.js';
import { ApiError } from './errors.js';
import { transaction } from './db.js';
import { loadEconomy, saveEconomy } from './economy.js';

const MAX_ID = 40;

function kingdomOf(economy) {
  return ensureKingdom(economy);
}

function requireId(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_ID) throw new ApiError(400, 'invalid_id');
  return value;
}

// The decor errors are shown to the player by code, so they map to 400 with that code.
function wrapDecorErrors(fn) {
  try {
    return fn();
  } catch (error) {
    if (error instanceof DecorError) throw new ApiError(400, error.code);
    throw error;
  }
}

export function getKingdom(db, playerId) {
  return transaction(db, () => {
    const economy = loadEconomy(db, playerId);
    const kingdom = kingdomOf(economy);
    const decor = ensureDecor(kingdom);
    const coins = economy.currencies.coins.amount;
    saveEconomy(db, playerId, economy);
    return {
      success: true,
      kingdom: kingdomView({ kingdom, coins, lifetimeStars: economy.currencies.stars.earned }),
      decor: decorView(decor),
      coins,
      coinBonus: kingdomCoinMultiplier(kingdom) - 1,
    };
  });
}

export function renovateRoom(db, playerId, roomIdInput) {
  const roomId = requireId(roomIdInput);
  const room = roomById(roomId);
  if (!room) throw new ApiError(400, 'unknown_room');
  return transaction(db, () => {
    const economy = loadEconomy(db, playerId);
    const kingdom = kingdomOf(economy);
    const plan = planRenovation({
      kingdom, room, coins: economy.currencies.coins.amount, lifetimeStars: economy.currencies.stars.earned,
    });
    if (!plan.ok) throw new ApiError(400, plan.reason);
    const coins = economy.currencies.coins;
    coins.amount -= plan.costCoins;
    coins.spent += plan.costCoins;
    kingdom.rooms[roomId] = plan.targetLevel;
    kingdom.renovations += 1;
    const milestone = MILESTONE_REWARDS[plan.targetLevel] || null;
    if (milestone) {
      const powerups = economy.inventory.powerups;
      powerups[milestone.itemId] = (powerups[milestone.itemId] || 0) + milestone.amount;
    }
    saveEconomy(db, playerId, economy);
    return {
      roomId,
      level: plan.targetLevel,
      costCoins: plan.costCoins,
      milestone,
      coins: coins.amount,
      renovations: kingdom.renovations,
    };
  });
}

// Decor actions. Each one validates everything first, then changes coins or inventory.
export function buyDecor(db, playerId, decorIdInput) {
  const decorId = requireId(decorIdInput);
  return transaction(db, () => {
    const economy = loadEconomy(db, playerId);
    const decor = ensureDecor(kingdomOf(economy));
    const plan = wrapDecorErrors(() => planBuyDecor(decor, decorId, economy.currencies.coins.amount));
    const coins = economy.currencies.coins;
    coins.amount -= plan.costCoins;
    coins.spent += plan.costCoins;
    decor.owned[decorId] = (decor.owned[decorId] || 0) + 1;
    saveEconomy(db, playerId, economy);
    return { decorId, costCoins: plan.costCoins, owned: decor.owned[decorId], coins: coins.amount };
  });
}

export function placeDecor(db, playerId, roomIdInput, decorIdInput) {
  const roomId = requireId(roomIdInput);
  const decorId = requireId(decorIdInput);
  return transaction(db, () => {
    const economy = loadEconomy(db, playerId);
    const kingdom = kingdomOf(economy);
    const decor = ensureDecor(kingdom);
    const plan = wrapDecorErrors(() => planPlaceDecor(kingdom, decor, roomId, decorId));
    decor.placed[plan.roomId] = plan.decorId;
    saveEconomy(db, playerId, economy);
    return { roomId, decorId, placed: { ...decor.placed } };
  });
}

// Choose = place this item in the room, buying one first if none is in stock.
export function chooseDecor(db, playerId, roomIdInput, decorIdInput) {
  const roomId = requireId(roomIdInput);
  const decorId = requireId(decorIdInput);
  return transaction(db, () => {
    const economy = loadEconomy(db, playerId);
    const kingdom = kingdomOf(economy);
    const decor = ensureDecor(kingdom);
    const plan = wrapDecorErrors(() => planChooseDecor(kingdom, decor, roomId, decorId, economy.currencies.coins.amount));
    if (plan.unchanged) return { roomId, decorId, unchanged: true, coins: economy.currencies.coins.amount, placed: { ...decor.placed } };
    const coins = economy.currencies.coins;
    if (plan.buy) {
      if ((decor.owned[decorId] || 0) >= MAX_DECOR_OWNED) throw new ApiError(400, 'decor_limit');
      coins.amount -= plan.costCoins;
      coins.spent += plan.costCoins;
      decor.owned[decorId] = (decor.owned[decorId] || 0) + 1;
    }
    decor.placed[roomId] = decorId;
    saveEconomy(db, playerId, economy);
    return { roomId, decorId, bought: plan.buy, costCoins: plan.costCoins, coins: coins.amount, placed: { ...decor.placed } };
  });
}

export function removeDecor(db, playerId, roomIdInput) {
  const roomId = requireId(roomIdInput);
  return transaction(db, () => {
    const economy = loadEconomy(db, playerId);
    const decor = ensureDecor(kingdomOf(economy));
    const plan = wrapDecorErrors(() => planRemoveDecor(decor, roomId));
    delete decor.placed[roomId];
    saveEconomy(db, playerId, economy);
    return { roomId, removed: plan.decorId, placed: { ...decor.placed } };
  });
}
