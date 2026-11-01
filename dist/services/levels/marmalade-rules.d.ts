export function validMarmalade(marmalade: any, size: any): boolean;
export function marmaladeCount(marmalade: any): any;
/** Blank grid of zeros. */
export function blankMarmalade(size: any): any[][];
/** Place marmalade only on cells the no-inventory witness actually clears, up to MARMALADE_CAP.
 * Same existence-proof pattern as witnessedShields. One layer per cell.
 */
export function witnessedMarmalade(board: any, refillState: any, palette: any, weights: any, specials: any, witness: any, seed: any): any[][];
/** Clear marmalade cells covered by a clear event. Returns { marmalade, cleared: count }. */
export function clearMarmalade(marmalade: any, clearedKeys: any): {
    marmalade: any;
    cleared: number;
};
/** Thread marmalade through a simulate-style result. Marmalade on cleared cells is removed.
 * Never mutates input. */
export function applyMarmaladeClear(result: any, initialMarmalade: any): any;
/** Certify a marmalade level: run the no-inventory witness and confirm every marmalade
 * cell is cleared by the witness path. Returns { score, collected, marmaladeCleared, events }.
 */
export function certifyMarmaladeBoard(definition: any): {
    score: number;
    collected: {
        [k: string]: any;
    };
    marmaladeCleared: number;
    events: never[];
};
export const MARMALADE_CAP: 5;
declare namespace _default {
    export { validMarmalade };
    export { marmaladeCount };
    export { blankMarmalade };
    export { witnessedMarmalade };
    export { clearMarmalade };
    export { applyMarmaladeClear };
    export { certifyMarmaladeBoard };
    export { MARMALADE_CAP };
}
export default _default;
//# sourceMappingURL=marmalade-rules.d.ts.map