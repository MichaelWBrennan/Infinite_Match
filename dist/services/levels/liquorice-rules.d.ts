export function validLiquorice(liquorice: any, size: any): boolean;
export function liquoriceCount(liquorice: any): any;
/** Blank grid of zeros. */
export function blankLiquorice(size: any): any[][];
/** Check whether a cell has a liquorice lock. */
export function isLocked(liquorice: any, row: any, col: any, size: any): boolean;
/** Check whether a swap between two cells is legal given liquorice locks.
 * A swap is illegal if either cell is locked. Returns true if the swap is allowed.
 */
export function swapLegalWithLiquorice(liquorice: any, cellA: any, cellB: any, size: any): boolean;
/** Place liquorice only on cells the no-inventory witness actually clears, up to LIQUORICE_CAP.
 * Same existence-proof pattern as witnessedShields. One lock per cell.
 */
export function witnessedLiquorice(board: any, refillState: any, palette: any, weights: any, specials: any, witness: any, seed: any): any[][];
/** Return the set of liquorice lock keys adjacent to any cleared key. These locks
 * are cleared by the clear event. Returns { liquorice, cleared: [keys] }.
 */
export function clearLiquoriceAdjacent(liquorice: any, clearedKeys: any, size: any): {
    liquorice: any;
    cleared: string[];
};
/** Thread liquorice locks through a simulate-style result. Locks adjacent to cleared
 * cells are removed. Never mutates input. */
export function applyLiquoriceClear(result: any, initialLiquorice: any): any;
/** Certify a liquorice level: run the no-inventory witness and confirm every liquorice
 * cell is cleared by the witness path. Returns { score, collected, liquoriceCleared, events }.
 */
export function certifyLiquoriceBoard(definition: any): {
    score: number;
    collected: {
        [k: string]: any;
    };
    liquoriceCleared: number;
    events: never[];
};
export const LIQUORICE_CAP: 6;
declare namespace _default {
    export { validLiquorice };
    export { liquoriceCount };
    export { blankLiquorice };
    export { witnessedLiquorice };
    export { swapLegalWithLiquorice };
    export { clearLiquoriceAdjacent };
    export { applyLiquoriceClear };
    export { certifyLiquoriceBoard };
    export { LIQUORICE_CAP };
}
export default _default;
//# sourceMappingURL=liquorice-rules.d.ts.map