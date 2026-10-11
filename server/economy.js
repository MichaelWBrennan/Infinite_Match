// Player economy: energy, coins, stars, XP, and the attempts that energy pays for.
// Rules come from the shared pure modules in src/services/meta and src/services/levels,
// the same code the existing server uses. Storage is one JSON document per player.
import { randomUUID } from 'node:crypto';
import {
  ATTEMPT_ENERGY_COST,
  ATTEMPT_MAX_AGE_MS,
  nextRegenInMs,
  regenerateEnergy,
} from '../src/services/meta/energy.js';
import { ENERGY_PRICE_COINS } from '../src/services/meta/lootbox.js';
import { starsForTarget, winRewards } from '../src/services/meta/rewards.js';
import { generatedLevel, clientRulesVersion } from '../src/services/levels/level-service.js';
import { LEVEL_MODES } from '../src/services/levels/generator.js';
import { replayLevelAttempt } from '../src/services/levels/attempt-replay.js';
import { transaction } from './db.js';
import { ApiError } from './errors.js';

const MAX_LEVEL = 100000;
const MAX_SCORE = 1000000;
const MAX_OUTCOME_LENGTH = 40;
const MAX_MOVES = 1000;

export function defaultEconomy(nowMs) {
  return {
    currencies: {
      coins: { amount: 1000, maxAmount: 999999, earned: 0, spent: 0 },
      stars: { amount: 0, maxAmount: 99999, earned: 0, spent: 0 },
      energy: { amount: 100, maxAmount: 100, earned: 0, spent: 0, regenRate: 1, lastRegen: nowMs },
    },
    progress: { xp: 0 },
    attempts: {},
  };
}

function loadEconomy(db, playerId) {
  const row = db.prepare('SELECT state FROM economy WHERE player_id = ?').get(playerId);
  if (!row) throw new ApiError(404, 'economy_not_found');
  return JSON.parse(row.state);
}

function saveEconomy(db, playerId, economy) {
  db.prepare('UPDATE economy SET state = ? WHERE player_id = ?').run(JSON.stringify(economy), playerId);
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
    serverTime: new Date(nowMs).toISOString(),
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
    economy.attempts[attemptId] = { level, mode: mode ?? 'legacy', createdAt: nowMs, status: 'open', definition };
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
    const replay = replayLevelAttempt(attempt.definition, moves, score, body?.objectiveProgress, []);
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

    const reward = winRewards(stars);
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
