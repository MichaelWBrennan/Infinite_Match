/**
 * Battle pass rules. A season has tiers. Each tier has a free and a premium reward. A player
 * claims a tier when their season XP reaches it. The premium track needs the season_pass_premium
 * entitlement. All checks happen here on the server; the client only displays the result.
 *
 * Rewards are either coins (`{ coins: n }`) or a power-up from the item catalog
 * (`{ item: 'bomb', amount: n }`). Gems are not part of the game and are not accepted.
 */

import { ITEM_CATALOG } from '../economy/item-catalog.js';

export const POWERUP_IDS = Object.freeze(
  Object.keys(ITEM_CATALOG).filter((id) => ITEM_CATALOG[id].category === 'powerups'),
);

export const MAX_COINS_PER_REWARD = 10000;
export const MAX_ITEMS_PER_REWARD = 10;

export class BattlePassError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;

function validateReward(reward) {
  if (reward === null) return null;
  if (!reward || typeof reward !== 'object' || Array.isArray(reward)) return 'reward must be an object or null';
  const hasCoins = 'coins' in reward;
  const hasItem = 'item' in reward;
  if (hasCoins === hasItem) return 'reward needs exactly one of coins or item';
  if (hasCoins) return isInt(reward.coins, 1, MAX_COINS_PER_REWARD) ? null : 'coins out of range';
  if (!POWERUP_IDS.includes(reward.item)) return `unknown item ${String(reward.item)}`;
  return isInt(reward.amount, 1, MAX_ITEMS_PER_REWARD) ? null : 'amount out of range';
}

/** Checks a raw season config. Returns { errors, season } and a normalised season when valid. */
export function validateSeason(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { errors: ['season must be an object'], season: null };
  }
  if (!isInt(raw.season, 1, 100000)) errors.push('season must be a positive integer');
  if (typeof raw.name !== 'string' || raw.name.trim() === '') errors.push('name is required');
  const start = Date.parse(raw.start);
  const end = Date.parse(raw.end);
  if (!Number.isFinite(start) || !Number.isFinite(end)) errors.push('start and end must be dates');
  else if (end <= start) errors.push('end must be after start');
  if (typeof raw.premiumSku !== 'string' || raw.premiumSku === '') errors.push('premiumSku is required');

  const tiers = Array.isArray(raw.tiers) ? raw.tiers : [];
  if (tiers.length === 0) errors.push('at least one tier is required');
  let lastXp = -1;
  tiers.forEach((tier, i) => {
    const at = `tier ${i + 1}`;
    if (tier?.level !== i + 1) errors.push(`${at}: level must be ${i + 1}`);
    if (!isInt(tier?.xp, 0, 10_000_000)) errors.push(`${at}: xp must be a whole number`);
    else if (tier.xp <= lastXp) errors.push(`${at}: xp must be higher than the tier before`);
    else lastXp = tier.xp;
    const freeErr = validateReward(tier?.free ?? null);
    if (freeErr) errors.push(`${at} free: ${freeErr}`);
    const premiumErr = validateReward(tier?.premium ?? null);
    if (premiumErr) errors.push(`${at} premium: ${premiumErr}`);
  });

  const xpEvents = raw.xpEvents && typeof raw.xpEvents === 'object' ? raw.xpEvents : {};
  for (const [name, value] of Object.entries(xpEvents)) {
    if (!isInt(value, 0, 10000)) errors.push(`xpEvents.${name} must be 0 to 10000`);
  }
  if (errors.length) return { errors, season: null };

  return {
    errors,
    season: {
      season: raw.season,
      name: raw.name.trim(),
      startMs: start,
      endMs: end,
      premiumSku: raw.premiumSku,
      xpEvents: { level_complete: 0, daily_login: 0, ...xpEvents },
      tiers: tiers.map((t) => ({ level: t.level, xp: t.xp, free: t.free ?? null, premium: t.premium ?? null })),
    },
  };
}

/** 'upcoming', 'active' or 'ended' for a validated season. */
export function seasonStatus(season, nowMs = Date.now()) {
  if (nowMs < season.startMs) return 'upcoming';
  if (nowMs > season.endMs) return 'ended';
  return 'active';
}

/** The tier a player is on: the highest tier whose XP they have reached. */
export function currentTier(season, xp) {
  let level = 0;
  for (const tier of season.tiers) if (xp >= tier.xp) level = tier.level;
  return level;
}

/**
 * Returns the player's battle pass state for this season. A new season, or a player without a
 * battle pass record, starts from zero. Mutates and returns the economy's battlePass field.
 */
export function battlePassFor(playerEconomy, season) {
  const bp = playerEconomy.battlePass;
  if (!bp || typeof bp !== 'object' || bp.season !== season.season) {
    playerEconomy.battlePass = {
      active: true,
      season: season.season,
      xp: 0,
      claimed: { free: [], premium: [] },
    };
  }
  const current = playerEconomy.battlePass;
  current.claimed = current.claimed || { free: [], premium: [] };
  current.claimed.free = current.claimed.free || [];
  current.claimed.premium = current.claimed.premium || [];
  return current;
}

/** Adds season XP for an event, but only while the season is running. Returns the new XP. */
export function addSeasonXp(playerEconomy, season, event, nowMs = Date.now()) {
  if (seasonStatus(season, nowMs) !== 'active') return null;
  const amount = season.xpEvents[event] || 0;
  const bp = battlePassFor(playerEconomy, season);
  bp.xp += amount;
  return bp.xp;
}

/** Converts a reward to the economy operation that grants it. */
export function rewardOperation(reward) {
  if (reward.coins !== undefined) return { type: 'currency', currencyId: 'coins', amount: reward.coins };
  return { type: 'inventory', category: 'powerups', itemId: reward.item, amount: reward.amount };
}

/**
 * Works out a tier claim without granting anything yet. Throws BattlePassError with the reason.
 * Returns the reward operations to apply; the caller applies them and saves the economy.
 */
export function planTierClaim(playerEconomy, season, { level, track, owned, nowMs = Date.now() }) {
  if (seasonStatus(season, nowMs) !== 'active') throw new BattlePassError('season_not_active');
  if (track !== 'free' && track !== 'premium') throw new BattlePassError('invalid_track');
  if (!Number.isInteger(level)) throw new BattlePassError('invalid_level');
  const tier = season.tiers.find((t) => t.level === level);
  if (!tier) throw new BattlePassError('tier_not_found');
  if (track === 'premium' && !owned) throw new BattlePassError('premium_required');

  const bp = battlePassFor(playerEconomy, season);
  if (bp.xp < tier.xp) throw new BattlePassError('tier_locked');
  if (bp.claimed[track].includes(level)) throw new BattlePassError('already_claimed');

  const reward = tier[track];
  if (!reward) throw new BattlePassError('no_reward');
  return { operations: [rewardOperation(reward)], reward, mark: () => bp.claimed[track].push(level) };
}

/** Public view of a player's progress: what they have reached and claimed. */
export function progressView(playerEconomy, season, { owned, nowMs = Date.now() }) {
  const bp = battlePassFor(playerEconomy, season);
  return {
    season: season.season,
    name: season.name,
    status: seasonStatus(season, nowMs),
    endsAt: new Date(season.endMs).toISOString(),
    xp: bp.xp,
    tier: currentTier(season, bp.xp),
    premiumUnlocked: Boolean(owned),
    claimed: { free: [...bp.claimed.free], premium: [...bp.claimed.premium] },
    tiers: season.tiers.map((t) => ({
      level: t.level,
      xp: t.xp,
      free: t.free,
      premium: t.premium,
      reached: bp.xp >= t.xp,
    })),
  };
}
