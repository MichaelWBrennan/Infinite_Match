export function blankBlockers(size: any): any[][];
export function validBlockers(blockers: any, size: any): boolean;
export function blockerCount(blockers: any): any;
export function blockerKeys(blockers: any): any[];
/** An ordinary gem cell that a blocker may grow into. */
export function spreadEligible(blockers: any, specials: any, shields: any, row: any, col: any): boolean;
/** Returns { blockers, spread } where spread is the 'r,c' key that gained a blocker, or null.
 * Returns null for invalid input. Never mutates its arguments. */
export function spreadBlockers(blockers: any, specials: any, shields: any, cap?: number): {
    blockers: any;
    spread: null;
} | {
    blockers: any;
    spread: string;
} | null;
/** Removes blockers on the cleared keys. Returns { blockers, cleared } with cleared sorted
 * by (row, col). Keys that are not blockers are ignored. Returns null for invalid input. */
export function clearBlockers(blockers: any, clearedKeys: any): {
    blockers: any;
    cleared: string[];
} | null;
/** Place up to BLOCKER_STAGE_COUNT blockers only on cells the no-booster witness clears.
 * Same deterministic witness-based placement as shields, but on non-special cells. */
export function witnessedBlockers(board: any, refillState: any, palette: any, weights: any, specials: any, witness: any, seed: any): any[][];
/** One accepted player move: shield transition, then blocker clears, then one spread. */
export function simulateBlockerMove(definition: any, state: any, cells: any, visualTrace?: boolean): any;
/** Booster clears remove blockers they hit but never spread. */
export function simulateBlockerClear(definition: any, state: any, keys: any, points: any, visualTrace?: boolean): any;
/** Replay the same no-booster path used to place blockers, through the exact v6 transition. */
export function certifyBlockerBoard(definition: any): {
    score: number;
    witness: number[][];
    collected: {
        [k: string]: any;
    };
    brokenBlockers: number;
    brokenShields: number;
    blockers: any;
    shields: any;
};
export const BLOCKER_CAP: 6;
export const BLOCKER_STAGE_COUNT: 3;
//# sourceMappingURL=blocker-rules.d.ts.map