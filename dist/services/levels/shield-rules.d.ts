export function validShields(shields: any, size: any): boolean;
export function shieldCount(shields: any): any;
/** Place only on cells the existing no-inventory witness actually clears enough times.
 * This is an existence proof, not a promise of human-solvable difficulty. */
export function witnessedShields(board: any, refillState: any, palette: any, weights: any, specials: any, witness: any, seed: any): number[][];
export function simulateShieldMove(definition: any, state: any, cells: any, visualTrace?: boolean): any;
export function simulateShieldClear(definition: any, state: any, keys: any, points: any, visualTrace?: boolean): any;
/** Replay the same no-booster path used to place shields, through the exact v5 transition. */
export function certifyShieldBoard(definition: any): {
    score: number;
    witness: number[][];
    collected: {
        [k: string]: any;
    };
    brokenShields: number;
    shields: any;
};
//# sourceMappingURL=shield-rules.d.ts.map