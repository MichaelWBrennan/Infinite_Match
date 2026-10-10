/** Frozen v1/v2 plain-gem rules. Shared helpers also underpin earned-special v3. */
export function hashSeed(text: any): number;
/** The serializable state is also used for the game's refill stream. */
export function nextRandom(rng: any): number;
export function pickGem(rng: any, palette: any, weights?: {}): any;
export function matchingCells(board: any): Set<any>;
export function legalSwaps(board: any): {
    cells: number[];
    count: number;
}[];
/** Stable AND playable, including the fallback; no unbounded rejection loop. */
export function dealPlayableBoard(size: any, palette: any, weights: any, rng: any): any[][];
/** Identical column/refill order and cascade scoring to the Phaser match-3 core. */
export function simulateMove(initialBoard: any, refillState: any, palette: any, weights: any, cells: any): {
    board: any;
    refillState: number;
    score: number;
    cascades: number;
} | null;
/** Existence proof, not a claim that every choice wins or that humans meet a timed deadline. */
export function certifyBoard(board: any, refillState: any, palette: any, weights: any, moveBudget: any): {
    score: number;
    witness: number[][];
};
//# sourceMappingURL=match-core.d.ts.map