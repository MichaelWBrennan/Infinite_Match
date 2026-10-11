// Player economy: energy, coins, stars, XP, and the attempts that energy pays for.
// Rules come from the shared pure modules in src/services/meta and src/services/levels,
// the same code the existing server uses. Storage is one JSON document per player.
import { randomInt, randomUUID } from 'node:crypto';
import {
  ATTEMPT_ENERGY_COST,
  ATTEMPT_MAX_AGE_MS,
  nextRegenInMs,
  regenerateEnergy,
} from '../src/services/meta/energy.js';
import { ENERGY_PRICE_COINS, LOOTBOXES, pickLootReward } from '../src/services/meta/lootbox.js';
import { endlessRewards, starsForTarget, winRewards } from '../src/services/meta/rewards.js';
import { REPLAY_POWERUPS } from '../src/services/levels/inventory-replay.js';
import { ensureKingdom, kingdomCoinMultiplier } from '../src/services/meta/kingdom.js';
import { ensureDecor } from '../src/services/meta/kingdom-decor.js';
import { generatedLevel, clientRulesVersion } from '../src/services/levels/level-service.js';
import { LEVEL_MODES } from '../src/services/levels/generator.js';
import { replayLevelAttempt } from '../src/services/levels/attempt-replay.js';
import { transaction } from './db.js';
import { ApiError } from './errors.js';

const MAX_LEVEL = 100000;
const MAX_SCORE = 1000000;
const MAX_OUTCOME_LENGTH = 40;
const MAX_MOVES = 1000;

// Same schedule as the existing server (AccountEconomyService.initializeDailyRewards).
const DAILY_REWARDS = Object.freeze([
  { day: 1, coins: 100, xp: 50 },
  { day: 2, coins: 150, xp: 75 },
  { day: 3, stars: 5, xp: 100 },
  { day: 4, coins: 200, xp: 125 },
  { day: 5, stars: 10, xp: 150 },
  { day: 6, coins: 300, xp: 175 },
  { day: 7, stars: 20, xp: 200, bonus: 'mega_reward' },
]);
const DAY_MS = 24 * 60 * 60 * 1000;

export function defaultEconomy(nowMs) {
  return {
    currencies: {
      coins: { amount: 1000, maxAmount: 999999, earned: 0, spent: 0 },
      stars: { amount: 0, maxAmount: 99999, earned: 0, spent: 0 },
      energy: { amount: 100, maxAmount: 100, earned: 0, spent: 0, regenRate: 1, lastRegen: nowMs },
    },
    progress: { xp: 0 },
    dailyRewards: { streak: 0, lastClaimed: null },
    inventory: { powerups: {} },
    attempts: {},
  };
}

export function loadEconomy(db, playerId) {
  const row = db.prepare('SELECT state FROM economy WHERE player_id = ?').get(playerId);
  if (!row) throw new ApiError(404, 'economy_not_found');
  const economy = JSON.parse(row.state);
  // Documents written before a field existed get its default on first load.
  if (!economy.dailyRewards) economy.dailyRewards = { streak: 0, lastClaimed: null };
  if (!economy.inventory) economy.inventory = { powerups: {} };
  ensureKingdom(economy);
  ensureDecor(economy.kingdom);
  return economy;
}

function startOfLocalDay(ms) {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function saveEconomy(db, playerId, economy) {
  db.prepare('UPDATE economy SET state = ? WHERE player_id = ?').run(JSON.stringify(economy), playerId);
}

// Kingdom rooms add a small coin bonus to coin payouts (see kingdomCoinMultiplier).
function withCoinBonus(reward, economy) {
  const multiplier = kingdomCoinMultiplier(economy.kingdom);
  return { ...reward, coins: Math.floor(reward.coins * multiplier) };
}

function clampCurrency(currency) {
  if (currency.amount > currency.maxAmount) currency.amount = currency.maxAmount;
}

// Drops attempts that can no longer be completed, so the stored document stays small.
function pruneAttempts(economy, nowMs) {
  for (const [id, attempt] of Object.entries(economy.attempts)) {
    if (nowMs - attempt.createdAt > ATTEMPT_MAX_AGE_MS) delete economy.attempts[id];
  }
}

function view(economy, nowMs) {
  const energy = economy.currencies.energy;
  return {
    currencies: {
      coins: { amount: economy.currencies.coins.amount, maxAmount: economy.currencies.coins.maxAmount },
      stars: { amount: economy.currencies.stars.amount, maxAmount: economy.currencies.stars.maxAmount },
      energy: {
        amount: energy.amount,
        maxAmount: energy.maxAmount,
        regenRate: energy.regenRate,
        nextRegenInMs: nextRegenInMs(energy, nowMs),
      },
    },
    progress: { xp: economy.progress.xp },
    dailyRewards: dailyStatus(economy, nowMs),
    inventory: { powerups: { ...economy.inventory.powerups } },
    serverTime: new Date(nowMs).toISOString(),
  };
}

function dailyStatus(economy, nowMs) {
  const { streak, lastClaimed } = economy.dailyRewards;
  const last = lastClaimed ? new Date(lastClaimed).getTime() : null;
  const canClaim = last === null || startOfLocalDay(nowMs) > startOfLocalDay(last);
  // A missed day (more than one calendar day since the last claim) starts the streak over.
  const effectiveStreak = last !== null && startOfLocalDay(nowMs) - startOfLocalDay(last) > DAY_MS ? 0 : streak;
  return {
    streak: effectiveStreak,
    canClaim,
    nextReward: Math.min(effectiveStreak + 1, DAILY_REWARDS.length),
    rewards: DAILY_REWARDS.map((r) => ({ ...r })),
  };
}

function parseLevel(value) {
  const level = value === undefined ? 1 : value;
  if (!Number.isSafeInteger(level) || level < 1 || level > MAX_LEVEL) throw new ApiError(400, 'invalid_level');
  return level;
}

export function getEconomyView(db, playerId, nowMs = Date.now()) {
  return transaction(db, () => {
    const economy = loadEconomy(db, playerId);
    regenerateEnergy(economy.currencies.energy, nowMs);
    saveEconomy(db, playerId, economy);
    return view(economy, nowMs);
  });
}

// Starts an attempt. Without a mode the level is a legacy classic attempt with no pinned board,
// and its win can't be verified, so it pays nothing (see completeLevel).
// With a mode, the server generates the board now and pins it to the attempt.
export function spendEnergy(db, playerId, body, nowMs = Date.now()) {
  const level = parseLevel(body?.level);
  const mode = body?.mode;
  if (mode !== undefined && !LEVEL_MODES.includes(mode)) throw new ApiError(400, 'invalid_mode');
  if (mode === 'endless' && level !== 1) throw new ApiError(400, 'invalid_endless_start_level');

  let definition = null;
  if (mode !== undefined) {
    try {
      definition = generatedLevel({
        level,
        mode,
        location: body.location ?? {},
        rulesVersion: clientRulesVersion(body.rulesVersion),
      }, nowMs);
    } catch (error) {
      if (error?.code) throw new ApiError(400, error.code);
      throw error;
    }
  }

  return transaction(db, () => {
    const economy = loadEconomy(db, playerId);
    const energy = regenerateEnergy(economy.currencies.energy, nowMs);
    if (energy.amount < ATTEMPT_ENERGY_COST) throw new ApiError(400, 'energy_empty');
    energy.amount -= ATTEMPT_ENERGY_COST;
    energy.spent += ATTEMPT_ENERGY_COST;
    pruneAttempts(economy, nowMs);
    const attemptId = randomUUID();
    // Endless boards are not replayable, so only the level id is pinned for them.
    economy.attempts[attemptId] = {
      level, mode: mode ?? 'legacy', createdAt: nowMs, status: 'open',
      definition: mode === 'endless' ? null : definition, receipts: [],
    };
    saveEconomy(db, playerId, economy);
    return {
      energy: energy.amount,
      attemptId,
      level,
      legacyTarget: null,
      generatedLevel: definition,
    };
  });
}

export function refillEnergy(db, playerId, nowMs = Date.now()) {
  return transaction(db, () => {
    const economy = loadEconomy(db, playerId);
    const energy = regenerateEnergy(economy.currencies.energy, nowMs);
    const missing = energy.maxAmount - energy.amount;
    if (missing <= 0) throw new ApiError(400, 'energy_full');
    const costCoins = missing * ENERGY_PRICE_COINS;
    const coins = economy.currencies.coins;
    if (coins.amount < costCoins) throw new ApiError(400, 'insufficient_coins');
    coins.amount -= costCoins;
    coins.spent += costCoins;
    energy.amount = energy.maxAmount;
    energy.lastRegen = nowMs;
    saveEconomy(db, playerId, economy);
    return { energy: energy.amount, costCoins };
  });
}

// Completing a level pays only when the server can replay the moves and reach the same result.
// The replay runs against the board the server pinned at spend time, not a board the client sent.
export function completeLevel(db, playerId, body, nowMs = Date.now()) {
  const level = parseLevel(body?.level);
  const score = body?.score;
  if (!Number.isSafeInteger(score) || score < 0 || score > MAX_SCORE) throw new ApiError(400, 'invalid_score');
  const attemptId = typeof body?.attemptId === 'string' ? body.attemptId : '';
  if (!attemptId || attemptId.length > 64) throw new ApiError(400, 'attempt_required');

  const outcome = transaction(db, () => {
    const economy = loadEconomy(db, playerId);
    const attempt = economy.attempts[attemptId];
    if (!attempt) throw new ApiError(400, 'attempt_not_found');

    if (attempt.mode === 'endless') throw new ApiError(400, 'use_endless_complete');
    // A retry after a lost response gets the original receipt, not a second payout.
    if (attempt.status === 'won') {
      return {
        duplicate: true, level, stars: attempt.stars, reward: attempt.reward,
        balances: { stars: economy.currencies.stars.amount, coins: economy.currencies.coins.amount },
      };
    }
    if (attempt.status !== 'open') throw new ApiError(400, 'attempt_closed');
    if (attempt.level !== level) throw new ApiError(400, 'level_mismatch');
    if (nowMs - attempt.createdAt > ATTEMPT_MAX_AGE_MS) throw new ApiError(400, 'attempt_expired');
    if (!attempt.definition) throw new ApiError(400, 'replay_required');

    const moves = body?.moves;
    if (!Array.isArray(moves) || moves.length < 1 || moves.length > MAX_MOVES) {
      throw new ApiError(400, 'replay_required');
    }
    const replay = replayLevelAttempt(attempt.definition, moves, score, body?.objectiveProgress, attempt.receipts || []);
    if (replay.error) {
      // Record the rejection and return it. Throwing here would roll the write back.
      attempt.status = 'rejected';
      attempt.outcome = replay.error;
      delete attempt.definition;
      saveEconomy(db, playerId, economy);
      return { rejected: replay.error };
    }

    const stars = starsForTarget(score, attempt.definition.targetScore);
    attempt.status = 'won';
    attempt.stars = stars;
    attempt.closedAt = nowMs;
    delete attempt.definition;

    if (stars <= 0) {
      attempt.reward = null;
      saveEconomy(db, playerId, economy);
      return { duplicate: false, level, stars, reward: null, balances: { stars: economy.currencies.stars.amount, coins: economy.currencies.coins.amount } };
    }

    const reward = withCoinBonus(winRewards(stars), economy);
    const currencies = economy.currencies;
    currencies.coins.amount += reward.coins;
    currencies.coins.earned += reward.coins;
    currencies.stars.amount += stars;
    currencies.stars.earned += stars;
    economy.progress.xp += reward.xp;
    clampCurrency(currencies.coins);
    clampCurrency(currencies.stars);
    attempt.reward = reward;
    saveEconomy(db, playerId, economy);
    return {
      duplicate: false,
      level,
      stars,
      reward,
      balances: { stars: currencies.stars.amount, coins: currencies.coins.amount },
    };
  });
  if (outcome.rejected) throw new ApiError(400, outcome.rejected);
  return outcome;
}

function grantCurrency(currencies, currencyId, amount) {
  const currency = currencies[currencyId];
  currency.amount += amount;
  currency.earned += amount;
  clampCurrency(currency);
}

// One claim per local calendar day. The streak continues from yesterday and resets after a missed day.
export function claimDailyReward(db, playerId, nowMs = Date.now()) {
  return transaction(db, () => {
    const economy = loadEconomy(db, playerId);
    const status = dailyStatus(economy, nowMs);
    if (!status.canClaim) throw new ApiError(400, 'Daily reward already claimed today');
    const streak = status.streak + 1;
    const reward = DAILY_REWARDS[Math.min(streak - 1, DAILY_REWARDS.length - 1)];
    economy.dailyRewards = { streak, lastClaimed: new Date(nowMs).toISOString() };
    if (reward.coins) grantCurrency(economy.currencies, 'coins', reward.coins);
    if (reward.stars) grantCurrency(economy.currencies, 'stars', reward.stars);
    if (reward.xp) economy.progress.xp += reward.xp;
    saveEconomy(db, playerId, economy);
    return { success: true, streak, reward: { ...reward }, nextReward: Math.min(streak + 1, DAILY_REWARDS.length) };
  });
}

// Boxes cost coins. The reward is rolled here with a cryptographic RNG; the client never picks it.
export function openLootbox(db, playerId, type) {
  if (typeof type !== 'string' || !Object.prototype.hasOwnProperty.call(LOOTBOXES, type)) {
    throw new ApiError(400, 'invalid_lootbox');
  }
  const box = LOOTBOXES[type];
  return transaction(db, () => {
    const economy = loadEconomy(db, playerId);
    const coins = economy.currencies.coins;
    if (coins.amount < box.costCoins) throw new ApiError(400, 'insufficient_coins');
    coins.amount -= box.costCoins;
    coins.spent += box.costCoins;
    const reward = pickLootReward(box.rewards, (max) => randomInt(max));
    if (reward.type === 'currency') {
      grantCurrency(economy.currencies, reward.currencyId, reward.amount);
    } else {
      const powerups = economy.inventory.powerups;
      powerups[reward.itemId] = (powerups[reward.itemId] || 0) + reward.amount;
    }
    saveEconomy(db, playerId, economy);
    return {
      type,
      reward: { ...reward },
      balances: { coins: coins.amount, stars: economy.currencies.stars.amount },
      inventory: { powerups: { ...economy.inventory.powerups } },
    };
  });
}

// Spends one power-up from the inventory and issues a receipt bound to the open attempt.
// The receipt is the only thing the level replay accepts for a power-up, so the player cannot
// use an item they do not own. A repeated useId returns the original receipt without spending again.
export function usePowerUp(db, playerId, body, nowMs = Date.now()) {
  const powerupId = typeof body?.powerupId === 'string' ? body.powerupId : '';
  if (!REPLAY_POWERUPS.includes(powerupId)) throw new ApiError(400, 'invalid_powerup');
  if (body?.quantity !== undefined && body.quantity !== 1) throw new ApiError(400, 'invalid_quantity');
  const attemptId = typeof body?.attemptId === 'string' ? body.attemptId : '';
  if (!attemptId || attemptId.length > 64) throw new ApiError(400, 'attempt_required');
  const useId = typeof body?.useId === 'string' && body.useId.length > 0 && body.useId.length <= 64 ? body.useId : null;

  return transaction(db, () => {
    const economy = loadEconomy(db, playerId);
    const attempt = economy.attempts[attemptId];
    if (!attempt) throw new ApiError(400, 'attempt_not_found');
    if (attempt.status !== 'open') throw new ApiError(400, 'attempt_closed');
    if (nowMs - attempt.createdAt > ATTEMPT_MAX_AGE_MS) throw new ApiError(400, 'attempt_expired');
    if (!attempt.definition) throw new ApiError(400, 'powerups_need_a_replayable_level');
    attempt.receipts = attempt.receipts || [];
    const inventory = () => ({ ...economy.inventory.powerups });

    if (useId) {
      const existing = attempt.receipts.find((receipt) => receipt.useId === useId);
      if (existing) return { reused: true, receiptId: existing.id, powerupId: existing.type, inventory: inventory() };
    }
    if (attempt.receipts.length >= 20) throw new ApiError(400, 'too_many_powerups');
    const powerups = economy.inventory.powerups;
    if ((powerups[powerupId] || 0) < 1) throw new ApiError(400, 'insufficient_powerup');
    powerups[powerupId] -= 1;
    if (powerups[powerupId] === 0) delete powerups[powerupId];
    const receipt = { id: randomUUID(), type: powerupId, useId };
    attempt.receipts.push(receipt);
    saveEconomy(db, playerId, economy);
    return { reused: false, receiptId: receipt.id, powerupId, inventory: inventory() };
  });
}

// Endless runs have no replay in the shared rules, so the score is trusted and paid with the same
// caps as the existing server (endlessRewards). This is the one unverified payout on the free server.
export function settleEndless(db, playerId, body, nowMs = Date.now()) {
  const score = body?.score;
  if (!Number.isSafeInteger(score) || score < 0 || score > MAX_SCORE) throw new ApiError(400, 'invalid_score');
  const attemptId = typeof body?.attemptId === 'string' ? body.attemptId : '';
  if (!attemptId || attemptId.length > 64) throw new ApiError(400, 'attempt_required');

  return transaction(db, () => {
    const economy = loadEconomy(db, playerId);
    const attempt = economy.attempts[attemptId];
    if (!attempt) throw new ApiError(400, 'attempt_not_found');
    if (attempt.mode !== 'endless') throw new ApiError(400, 'not_endless_attempt');
    if (attempt.status === 'won') {
      return { duplicate: true, score: attempt.score, reward: attempt.reward, balances: { coins: economy.currencies.coins.amount } };
    }
    if (attempt.status !== 'open') throw new ApiError(400, 'attempt_closed');
    if (nowMs - attempt.createdAt > ATTEMPT_MAX_AGE_MS) throw new ApiError(400, 'attempt_expired');
    const reward = withCoinBonus(endlessRewards(score), economy);
    if (reward.coins) grantCurrency(economy.currencies, 'coins', reward.coins);
    economy.progress.xp += reward.xp;
    attempt.status = 'won';
    attempt.score = score;
    attempt.reward = reward;
    delete attempt.definition;
    saveEconomy(db, playerId, economy);
    return { duplicate: false, score, reward, balances: { coins: economy.currencies.coins.amount } };
  });
}

// Closing an attempt is idempotent. Unknown or already-closed attempts are accepted and ignored,
// because the client retries and a lost response must not break the next attempt.
export function closeAttempt(db, playerId, body, nowMs = Date.now()) {
  const attemptId = typeof body?.attemptId === 'string' ? body.attemptId : '';
  const outcome = typeof body?.outcome === 'string' ? body.outcome.slice(0, MAX_OUTCOME_LENGTH) : 'unknown';
  return transaction(db, () => {
    const economy = loadEconomy(db, playerId);
    const attempt = economy.attempts[attemptId];
    if (attempt && attempt.status === 'open') {
      attempt.status = 'closed';
      attempt.outcome = outcome;
      attempt.closedAt = nowMs;
      delete attempt.definition;
      saveEconomy(db, playerId, economy);
    }
    return { closed: true };
  });
}
