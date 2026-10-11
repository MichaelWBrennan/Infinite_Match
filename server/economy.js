// Player economy: energy, coins, and stars, plus the attempt records that energy pays for.
// Rules come from the shared pure modules in src/services/meta, the same ones the
// existing server uses. Storage is one JSON document per player.
import { randomUUID } from 'node:crypto';
import {
  ATTEMPT_ENERGY_COST,
  ATTEMPT_MAX_AGE_MS,
  nextRegenInMs,
  regenerateEnergy,
} from '../src/services/meta/energy.js';
import { ENERGY_PRICE_COINS } from '../src/services/meta/lootbox.js';
import { ApiError } from './errors.js';
import { transaction } from './db.js';

const MAX_LEVEL = 100000;
const MAX_OUTCOME_LENGTH = 40;

export function defaultEconomy(nowMs) {
  return {
    currencies: {
      coins: { amount: 1000, maxAmount: 999999, earned: 0, spent: 0 },
      stars: { amount: 0, maxAmount: 99999, earned: 0, spent: 0 },
      energy: { amount: 100, maxAmount: 100, earned: 0, spent: 0, regenRate: 1, lastRegen: nowMs },
    },
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
    serverTime: new Date(nowMs).toISOString(),
  };
}

export function getEconomyView(db, playerId, nowMs = Date.now()) {
  return transaction(db, () => {
    const economy = loadEconomy(db, playerId);
    regenerateEnergy(economy.currencies.energy, nowMs);
    saveEconomy(db, playerId, economy);
    return view(economy, nowMs);
  });
}

export function spendEnergy(db, playerId, body, nowMs = Date.now()) {
  const level = body?.level === undefined ? 1 : body.level;
  if (!Number.isSafeInteger(level) || level < 1 || level > MAX_LEVEL) {
    throw new ApiError(400, 'invalid_level');
  }
  // Generated (mode-based) levels need the level generator, which the free server does not run yet.
  if (body?.mode !== undefined) throw new ApiError(503, 'generated_levels_unavailable');

  return transaction(db, () => {
    const economy = loadEconomy(db, playerId);
    const energy = regenerateEnergy(economy.currencies.energy, nowMs);
    if (energy.amount < ATTEMPT_ENERGY_COST) throw new ApiError(400, 'energy_empty');
    energy.amount -= ATTEMPT_ENERGY_COST;
    energy.spent += ATTEMPT_ENERGY_COST;
    pruneAttempts(economy, nowMs);
    const attemptId = randomUUID();
    economy.attempts[attemptId] = { level, createdAt: nowMs, status: 'open' };
    saveEconomy(db, playerId, economy);
    return {
      energy: energy.amount,
      attemptId,
      level,
      legacyTarget: null,
      generatedLevel: null,
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
      saveEconomy(db, playerId, economy);
    }
    return { closed: true };
  });
}
