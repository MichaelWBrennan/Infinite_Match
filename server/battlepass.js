// Battle pass: config, the player's season progress, and tier claims. Rules come from
// src/services/meta/battlepass.js. The premium track needs a purchase, and the free server has no
// purchases, so premium stays locked here.
import { BattlePassError, planTierClaim, progressView } from '../src/services/meta/battlepass.js';
import { ApiError } from './errors.js';
import { transaction } from './db.js';
import { grantCurrency, loadEconomy, saveEconomy } from './economy.js';
import { loadSeason, readSeasonConfig } from './season.js';

const ERROR_STATUS = {
  season_not_active: 409,
  tier_not_found: 404,
  tier_locked: 409,
  already_claimed: 409,
  premium_required: 403,
  no_reward: 400,
  invalid_track: 400,
  invalid_level: 400,
};

export function getBattlePassConfig() {
  try {
    return { success: true, pass: readSeasonConfig() };
  } catch {
    throw new ApiError(500, 'config_error');
  }
}

function seasonOrUnavailable() {
  try {
    return loadSeason();
  } catch {
    throw new ApiError(503, 'battlepass_unavailable');
  }
}

export function getProgress(db, playerId, nowMs = Date.now()) {
  const season = seasonOrUnavailable();
  return transaction(db, () => {
    const economy = loadEconomy(db, playerId);
    const progress = progressView(economy, season, { owned: false, nowMs });
    saveEconomy(db, playerId, economy);
    return { success: true, progress };
  });
}

export function claimTier(db, playerId, body, nowMs = Date.now()) {
  const season = seasonOrUnavailable();
  return transaction(db, () => {
    const economy = loadEconomy(db, playerId);
    let plan;
    try {
      plan = planTierClaim(economy, season, { level: body?.level, track: body?.track, owned: false, nowMs });
    } catch (error) {
      if (error instanceof BattlePassError) throw new ApiError(ERROR_STATUS[error.code] || 400, error.code);
      throw error;
    }
    for (const op of plan.operations) {
      if (op.type === 'currency') grantCurrency(economy.currencies, op.currencyId, op.amount);
      else economy.inventory.powerups[op.itemId] = (economy.inventory.powerups[op.itemId] || 0) + op.amount;
    }
    plan.mark();
    saveEconomy(db, playerId, economy);
    return { reward: plan.reward, balances: { coins: economy.currencies.coins.amount } };
  });
}
