// Daily mini-games. The client reports a score, which must be a whole number within the game's
// range. Coins are capped per game, and each game pays once per UTC day. The score itself is not
// verified (there is no replay for mini-games), so the cap is the limit on what a made-up score
// can earn. Rules live in src/services/meta/minigames.js.
import { transaction } from './db.js';
import { ApiError } from './errors.js';
import { grantCurrency, loadEconomy, saveEconomy } from './economy.js';
import { MinigameError, minigameStatus, planMinigamePlay } from '../src/services/meta/minigames.js';

export function listMinigames(db, player, nowMs = Date.now()) {
  const economy = loadEconomy(db, player.id);
  return { success: true, games: minigameStatus(economy, nowMs) };
}

export function completeMinigame(db, player, gameId, body, nowMs = Date.now()) {
  return transaction(db, () => {
    const economy = loadEconomy(db, player.id);
    let plan;
    try {
      plan = planMinigamePlay(economy, gameId, body?.score, nowMs);
    } catch (error) {
      if (error instanceof MinigameError) {
        throw new ApiError(error.code === 'already_played_today' ? 409 : 400, error.code);
      }
      throw error;
    }
    grantCurrency(economy.currencies, 'coins', plan.coins);
    economy.minigames = plan.record;
    saveEconomy(db, player.id, economy);
    return {
      success: true,
      result: { game: gameId, coins: plan.coins, balance: economy.currencies.coins.amount },
    };
  });
}
