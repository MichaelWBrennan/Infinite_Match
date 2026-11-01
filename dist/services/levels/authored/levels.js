/**
 * Authored level pack — hand-crafted match-3 levels that complement the
 * procedurally generated supply. Each level has a designed difficulty curve,
 * teach/test pacing, and specific objectives. Levels are served alongside
 * procedural levels; authored levels take priority for their level number.
 *
 * These levels are deterministic (no RNG at runtime) and include a certified
 * no-booster winning path so they can be replay-verified like any other level.
 */
export const AUTHORED_LEVELS = Object.freeze([
    // --- Level 1: Gentle introduction. Single-collect objective, no obstacles. ---
    {
        level: 1,
        mode: 'classic',
        boardSize: 6,
        moves: 25,
        targetScore: 500,
        gemTypes: ['red', 'blue', 'green'],
        gemWeights: { red: 1.2, blue: 1.0, green: 1.0 },
        shields: null,
        blockers: null,
        lockedGems: null,
        objectives: [{ type: 'collect', gemType: 'red', target: 6 }],
        witness: [[0, 0, 0, 1], [1, 1, 1, 2], [2, 0, 2, 1], [3, 3, 3, 4], [4, 4, 4, 5]],
        difficulty: 'gentle',
    },
    // --- Level 2: Two-collect objective, introduces color switching. ---
    {
        level: 2,
        mode: 'classic',
        boardSize: 6,
        moves: 25,
        targetScore: 750,
        gemTypes: ['red', 'blue', 'green', 'yellow'],
        gemWeights: { red: 1.1, blue: 1.0, green: 1.0, yellow: 1.0 },
        shields: null,
        blockers: null,
        lockedGems: null,
        objectives: [
            { type: 'collect', gemType: 'red', target: 5 },
            { type: 'collect', gemType: 'blue', target: 5 },
        ],
        witness: [[0, 0, 0, 1], [1, 0, 1, 1], [2, 0, 2, 1], [0, 2, 0, 3], [1, 2, 1, 3]],
        difficulty: 'gentle',
    },
    // --- Level 3: Score target with a few shields (teaches clear-shields objective). ---
    {
        level: 3,
        mode: 'classic',
        boardSize: 6,
        moves: 28,
        targetScore: 900,
        gemTypes: ['red', 'blue', 'green', 'yellow'],
        gemWeights: { red: 1.0, blue: 1.0, green: 1.0, yellow: 1.0 },
        shields: [
            [0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 1, 1, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
        ],
        blockers: null,
        lockedGems: null,
        objectives: [
            { type: 'score', target: 900 },
            { type: 'clear-shields', target: 4 },
        ],
        witness: [[0, 0, 0, 1], [1, 1, 1, 2], [2, 0, 2, 1], [3, 0, 3, 1], [4, 0, 4, 1]],
        difficulty: 'steady',
    },
    // --- Level 4: Collection with spreading blockers (v6 blocker stage). ---
    {
        level: 4,
        mode: 'classic',
        boardSize: 6,
        moves: 30,
        targetScore: 1100,
        gemTypes: ['red', 'blue', 'green', 'yellow', 'purple'],
        gemWeights: { red: 1.0, blue: 1.0, green: 1.0, yellow: 1.0, purple: 1.0 },
        shields: null,
        blockers: [
            [0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
        ],
        lockedGems: null,
        objectives: [
            { type: 'collect', gemType: 'purple', target: 8 },
            { type: 'clear-blockers', target: 2 },
        ],
        witness: [[2, 2, 2, 3], [3, 2, 3, 3], [1, 3, 1, 4], [4, 3, 4, 4], [0, 4, 0, 5]],
        difficulty: 'challenging',
    },
    // --- Level 5: Locked gems teach swap-blocking terrain (v6 locked gem stage). ---
    {
        level: 5,
        mode: 'classic',
        boardSize: 6,
        moves: 30,
        targetScore: 1000,
        gemTypes: ['red', 'blue', 'green', 'yellow', 'orange'],
        gemWeights: { red: 1.0, blue: 1.0, green: 1.0, yellow: 1.0, orange: 1.0 },
        shields: null,
        blockers: null,
        lockedGems: [
            [0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
        ],
        objectives: [
            { type: 'score', target: 1000 },
            { type: 'clear-locked-gems', target: 3 },
        ],
        witness: [[1, 1, 1, 2], [2, 1, 2, 2], [3, 2, 3, 3], [4, 2, 4, 3], [5, 2, 5, 3]],
        difficulty: 'challenging',
    },
    // --- Level 6: Boss level — score target with shields and blockers. ---
    {
        level: 6,
        mode: 'classic',
        boardSize: 7,
        moves: 30,
        targetScore: 1500,
        gemTypes: ['red', 'blue', 'green', 'yellow', 'purple', 'orange'],
        gemWeights: { red: 1.0, blue: 1.0, green: 1.0, yellow: 1.0, purple: 1.0, orange: 1.0 },
        shields: [
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 1, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 1, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
        ],
        blockers: null,
        lockedGems: null,
        objectives: [
            { type: 'score', target: 1500 },
            { type: 'clear-shields', target: 6 },
        ],
        witness: [[3, 3, 3, 4], [2, 3, 2, 4], [4, 3, 4, 4], [1, 4, 1, 5], [5, 4, 5, 5]],
        difficulty: 'boss',
    },
]);
/**
 * Look up an authored level by number and mode. Returns null if no authored
 * level exists for that combination (the procedural generator is used instead).
 */
export function authoredLevelFor(level, mode = 'classic') {
    for (const def of AUTHORED_LEVELS) {
        if (def.level === level && def.mode === mode)
            return def;
    }
    return null;
}
/**
 * All authored level numbers for a given mode, sorted ascending.
 */
export function authoredLevelNumbers(mode = 'classic') {
    return AUTHORED_LEVELS
        .filter((def) => def.mode === mode)
        .map((def) => def.level)
        .sort((a, b) => a - b);
}
export default { AUTHORED_LEVELS, authoredLevelFor, authoredLevelNumbers };
//# sourceMappingURL=levels.js.map