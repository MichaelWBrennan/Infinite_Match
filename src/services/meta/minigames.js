/**
 * Daily mini-games. Each game can be paid once per UTC day. The client plays the game and reports
 * its score; the server checks the score is a whole number in range, pays coins for it, and records
 * the play. Coins are capped per game, so a made-up score is worth at most the cap, once a day.
 *
 * Tuning values are here. Change them here, and the server applies the change.
 */

export const MINIGAMES = Object.freeze({
  memory: { id: 'memory', name: 'Memory Match', maxScore: 100, coinsPerPoint: 2, coinsCap: 200 },
  treasure: { id: 'treasure', name: 'Treasure Dig', maxScore: 12, coinsPerPoint: 15, coinsCap: 180 },
  rhythm: { id: 'rhythm', name: 'Rhythm Tap', maxScore: 16, coinsPerPoint: 8, coinsCap: 128 },
});

export class MinigameError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

export function utcDay(nowMs = Date.now()) {
  return new Date(nowMs).toISOString().slice(0, 10);
}

export function minigameFor(gameId) {
  return Object.prototype.hasOwnProperty.call(MINIGAMES, gameId) ? MINIGAMES[gameId] : null;
}

/** Coins a score pays for one game. */
export function minigameCoins(game, score) {
  return Math.min(game.coinsCap, Math.floor(score * game.coinsPerPoint));
}

/**
 * The play record for today. Yesterday's plays are dropped when the day changes, so the record
 * never grows.
 */
function todayRecord(economy, day) {
  const stored = economy.minigames;
  if (!stored || stored.day !== day || typeof stored.played !== 'object') {
    return { day, played: {} };
  }
  return { day, played: { ...stored.played } };
}

/**
 * Checks one play and returns what to pay. Throws MinigameError for an unknown game, a score out of
 * range, or a second play of the same game today. Changes nothing: the caller saves the record.
 */
export function planMinigamePlay(economy, gameId, score, nowMs = Date.now()) {
  const game = minigameFor(gameId);
  if (!game) throw new MinigameError('unknown_game');
  if (!Number.isInteger(score) || score < 0 || score > game.maxScore) throw new MinigameError('invalid_score');
  const day = utcDay(nowMs);
  const record = todayRecord(economy, day);
  if (record.played[gameId]) throw new MinigameError('already_played_today');
  record.played[gameId] = { score, at: nowMs };
  return { game, coins: minigameCoins(game, score), record };
}

/** Each game with whether it has been played today. */
export function minigameStatus(economy, nowMs = Date.now()) {
  const record = todayRecord(economy, utcDay(nowMs));
  return Object.values(MINIGAMES).map((game) => ({
    id: game.id,
    name: game.name,
    maxScore: game.maxScore,
    playedToday: Boolean(record.played[game.id]),
    coinsCap: game.coinsCap,
  }));
}
