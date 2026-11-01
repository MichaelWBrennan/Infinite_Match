export function blankLockedGems(size: any): any[][];
export function validLockedGems(locked: any, size: any): boolean;
export function lockedGemCount(locked: any): any;
export function lockedGemKeys(locked: any): any[];
/** An ordinary gem cell that may hold a lock. Not a special anchor, not a shield cell. */
export function lockEligible(locked: any, specials: any, shields: any, row: any, col: any): boolean;
/** Removes locks on the cleared keys. Returns { locked, cleared } with cleared sorted
 * by (row, col). Keys that are not locks are ignored. Returns null for invalid input. */
export function clearLockedGems(locked: any, clearedKeys: any): {
    locked: any;
    cleared: string[];
} | null;
/** Place up to LOCKED_GEM_STAGE_COUNT locks only on cells the no-booster witness clears.
 * Same deterministic witness-based placement as shields and blockers. */
export function witnessedLockedGems(board: any, refillState: any, palette: any, weights: any, specials: any, witness: any, seed: any): any[][];
/** One accepted player move: shield transition, then lock clears. No spread. */
export function simulateLockedGemMove(definition: any, state: any, cells: any, visualTrace?: boolean): any;
/** Booster clears remove locks they hit but never spread. */
export function simulateLockedGemClear(definition: any, state: any, keys: any, points: any, visualTrace?: boolean): any;
/** Replay the same no-booster path used to place locks, through the exact v7 transition. */
export function certifyLockedGemBoard(definition: any): {
    score: number;
    witness: number[][];
    collected: {
        [k: string]: any;
    };
    brokenLocks: number;
    locked: any;
};
/** Exclude locked gem cells from legal swaps: a locked cell cannot be part of a swap. */
export function legalSwapsExcludingLocks(board: any, locked: any): number[][];
export const LOCKED_GEM_CAP: 8;
export const LOCKED_GEM_STAGE_COUNT: 3;
//# sourceMappingURL=locked-gem-rules.d.ts.map