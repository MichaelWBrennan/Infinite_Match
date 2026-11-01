export function validFrosting(frosting: any, size: any): boolean;
export function frostingCount(frosting: any): any;
/** Blank grid of zeros. */
export function blankFrosting(size: any): any[][];
/** Place frosting only on cells the no-inventory witness actually clears, up to FROSTING_CAP.
 * Same existence-proof pattern as witnessedShields. Cells cleared 2+ times get 2 layers,
 * cells cleared 3+ times get 3 layers.
 */
export function witnessedFrosting(board: any, refillState: any, palette: any, weights: any, specials: any, witness: any, seed: any): any[][];
/** Clear frosting layers on cells covered by a clear event. Each covered cell loses
 * one layer. Returns { frosting, cleared: number of layers removed }. */
export function clearFrosting(frosting: any, clearedKeys: any): {
    frosting: any;
    cleared: number;
};
/** Thread frosting layers through a simulate-style result. Frosting on cleared cells
 * loses one layer per clear. Never mutates input. */
export function applyFrostingClear(result: any, initialFrosting: any): any;
/** Certify a frosting level: run the no-inventory witness and confirm every frosting
 * cell is fully cleared by the witness path. Returns { score, collected, frostingCleared, events }.
 */
export function certifyFrostingBoard(definition: any): {
    score: number;
    collected: {
        [k: string]: any;
    };
    frostingCleared: number;
    events: never[];
};
export const FROSTING_MAX_LAYERS: 3;
declare namespace _default {
    export { validFrosting };
    export { frostingCount };
    export { blankFrosting };
    export { witnessedFrosting };
    export { clearFrosting };
    export { applyFrostingClear };
    export { certifyFrostingBoard };
    export { FROSTING_MAX_LAYERS };
}
export default _default;
//# sourceMappingURL=frosting-rules.d.ts.map