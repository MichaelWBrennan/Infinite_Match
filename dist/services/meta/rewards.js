/**
 * Rules the server applies to a win. V4 additionally validates the pinned objectives and
 * bounded reported collection progress before applying these score-rating thresholds.
 * Reported star counts, client-authored goals and reported rewards cannot change the payout.
 *
 * The level target matches levelConfig() in phaser3-game.js. A parity test checks that the two
 * stay the same, with no tuning overrides. The reward values are the tuning knobs.
 */
export const WIN_REWARDS = Object.freeze({
    coinsBase: 20,
    coinsPerStar: 5,
    xpBase: 50,
    xpPerStar: 50,
});
// Endless runs have no target, so they pay for the score they bank.
export const ENDLESS_REWARDS = Object.freeze({
    pointsPerCoin: 80,
    maxCoins: 300,
    pointsPerXp: 200,
    maxXp: 500,
});
/**
 * Score that wins a level. Boss levels (every tenth) need twice as much. `multiplier` is the
 * tuning override for this level (1 when there is none).
 */
export function levelTarget(level, multiplier = 1) {
    const n = Math.max(1, Math.floor(Number(level) || 1));
    const isBoss = n % 10 === 0;
    return Math.round((800 + n * 60) * (isBoss ? 2 : 1) * multiplier);
}
/** Stars for a score: 1x, 1.5x, and 2x the target. Zero means the level was not won. */
export function starsForScore(score, level, multiplier = 1) {
    return starsForTarget(score, levelTarget(level, multiplier));
}
/** Generated attempts pin their own certified target; do not recompute it at completion. */
export function starsForTarget(score, target) {
    if (score >= target * 2)
        return 3;
    if (score >= target * 1.5)
        return 2;
    if (score >= target)
        return 1;
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
/** What an endless run of `score` points pays. The score is bounded by the caller. */
export function endlessRewards(score) {
    const s = Math.max(0, Math.floor(score));
    return {
        coins: Math.min(ENDLESS_REWARDS.maxCoins, Math.floor(s / ENDLESS_REWARDS.pointsPerCoin)),
        xp: Math.min(ENDLESS_REWARDS.maxXp, Math.floor(s / ENDLESS_REWARDS.pointsPerXp)),
    };
}
//# sourceMappingURL=rewards.js.map