/**
 * Score that wins a level. Boss levels (every tenth) need twice as much. `multiplier` is the
 * tuning override for this level (1 when there is none).
 */
export function levelTarget(level: any, multiplier?: number): number;
/** Stars for a score: 1x, 1.5x, and 2x the target. Zero means the level was not won. */
export function starsForScore(score: any, level: any, multiplier?: number): 1 | 3 | 0 | 2;
/** What a win of `stars` stars pays. Only called with 1 to 3 stars. */
export function winRewards(stars: any): {
    coins: number;
    xp: number;
    stars: any;
};
/** What an endless run of `score` points pays. The score is bounded by the caller. */
export function endlessRewards(score: any): {
    coins: number;
    xp: number;
};
/**
 * Rules the server applies to a win. The client sends its score and attempt. The server works
 * out the stars and the reward itself, so a reported star count or a reported reward cannot
 * change what a win pays.
 *
 * The level target matches levelConfig() in phaser3-game.js. A parity test checks that the two
 * stay the same, with no tuning overrides. The reward values are the tuning knobs.
 */
export const WIN_REWARDS: Readonly<{
    coinsBase: 20;
    coinsPerStar: 5;
    xpBase: 50;
    xpPerStar: 50;
}>;
export const ENDLESS_REWARDS: Readonly<{
    pointsPerCoin: 80;
    maxCoins: 300;
    pointsPerXp: 200;
    maxXp: 500;
}>;
//# sourceMappingURL=rewards.d.ts.map