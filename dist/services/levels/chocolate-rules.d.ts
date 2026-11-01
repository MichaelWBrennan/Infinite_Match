export function validChocolate(chocolate: any, size: any): boolean;
export function chocolateCount(chocolate: any): any;
/** Blank grid of zeros. */
export function blankChocolate(size: any): any[][];
/** Place chocolate only on cells the no-inventory witness actually clears, up to CHOCOLATE_CAP.
 * Same existence-proof pattern as witnessedShields. One layer per cell.
 */
export function witnessedChocolate(board: any, refillState: any, palette: any, weights: any, specials: any, witness: any, seed: any): any[][];
/** Check if a cell is eligible for chocolate to spread into. */
export function spreadEligible(chocolate: any, specials: any, shields: any, blockers: any, locked: any, row: any, col: any, size: any): boolean;
/** Spread chocolate from each existing chocolate cell to one eligible neighbour.
 * Returns { chocolate, spread: [keys] } where spread is the list of newly chocolate cells.
 * Never mutates input. Deterministic: lowest row,col neighbour chosen.
 */
export function spreadChocolate(chocolate: any, specials: any, shields: any, blockers: any, locked: any): {
    chocolate: any;
    spread: string[];
} | null;
/** Clear chocolate cells covered by a clear event. Returns { chocolate, cleared: count }. */
export function clearChocolate(chocolate: any, clearedKeys: any): {
    chocolate: any;
    cleared: number;
};
/** Thread chocolate through a simulate-style result. Used by match-core's v6
 * transition to clear chocolate on cleared cells and rebuild state. Never mutates input.
 */
export function applyChocolateClear(result: any, initialChocolate: any): any;
/** Certify a chocolate level: run the no-inventory witness and confirm every chocolate
 * cell is cleared by the witness path. Returns { score, collected, chocolateCleared, events }.
 */
export function certifyChocolateBoard(definition: any): {
    score: number;
    collected: {
        [k: string]: any;
    };
    chocolateCleared: number;
    events: never[];
};
export const CHOCOLATE_CAP: 8;
declare namespace _default {
    export { validChocolate };
    export { chocolateCount };
    export { blankChocolate };
    export { witnessedChocolate };
    export { spreadChocolate };
    export { clearChocolate };
    export { applyChocolateClear };
    export { certifyChocolateBoard };
    export { CHOCOLATE_CAP };
}
export default _default;
//# sourceMappingURL=chocolate-rules.d.ts.map