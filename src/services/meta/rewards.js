/**
 * Level rules the server applies to a win. The client sends its score and attempt. The server
 * works out the stars and the reward itself, so a reported star count or a reported reward
 * cannot change what a win pays.
 *
 * The level target matches levelConfig() in phaser3-game.js. A parity test checks that the two
 * stay the same. The reward values are the tuning knobs for wins.
 */

export const WIN_REWARDS = Object.freeze({
  coinsBase: 20,
  coinsPerStar: 5,
  xpBase: 50,
  xpPerStar: 50,
});

/** Score that wins a level. Boss levels (every tenth) need twice as much. */
export function levelTarget(level) {
  const n = Math.max(1, Math.floor(Number(level) || 1));
  const isBoss = n % 10 === 0;
  return (800 + n * 60) * (isBoss ? 2 : 1);
}

/** Stars for a score: 1x, 1.5x, and 2x the target. Zero means the level was not won. */
export function starsForScore(score, level) {
  const target = levelTarget(level);
  if (score >= target * 2) return 3;
  if (score >= target * 1.5) return 2;
  if (score >= target) return 1;
  return 0;
}

/** What a win of `stars` stars pays. Only called with 1 to 3 stars. */
export function winRewards(stars) {
  return {
    coins: WIN_REWARDS.coinsBase + WIN_REWARDS.coinsPerStar * stars,
    xp: WIN_REWARDS.xpBase + WIN_REWARDS.xpPerStar * stars,
    stars,
  };
}
