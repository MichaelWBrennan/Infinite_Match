export function validJelly(jelly: any, size: any): boolean;
export function jellyCount(jelly: any): any;
/** Blank grid of zeros. */
export function blankJelly(size: any): any[][];
/** Place jelly only on cells the no-inventory witness actually clears, up to JELLY_CAP.
 * Same existence-proof pattern as witnessedShields. One layer per cell unless the
 * witness clears it twice or more, in which case two layers are used.
 */
export function witnessedJelly(board: any, refillState: any, palette: any, weights: any, specials: any, witness: any, seed: any): any[][];
/** Apply one clear pass over jelly cells: decrement each covered cell by 1 (floor 0).
 * Returns { jelly, cleared: number of cells that lost a layer }. Never mutates input.
 */
export function clearJelly(jelly: any, clearedKeys: any): {
    jelly: any;
    cleared: number;
};
/** Certify a jelly level: run the no-inventory witness and confirm every jelly cell
 * is cleared by the witness path. Returns { score, collected, jellyCleared, events }.
 */
export function certifyJellyBoard(definition: any): {
    score: number;
    collected: {
        [k: string]: any;
    };
    jellyCleared: number;
    events: never[];
};
/** Thread jelly layers through a simulate-style result. Used by match-core's v6
 * transition to decrement jelly on cleared cells and rebuild state. Never mutates input.
 */
export function applyJellyClear(result: any, initialJelly: any): any;
export const JELLY_MAX_LAYERS: 2;
declare namespace _default {
    export { validJelly };
    export { jellyCount };
    export { blankJelly };
    export { witnessedJelly };
    export { clearJelly };
    export { applyJellyClear };
    export { JELLY_MAX_LAYERS };
}
export default _default;
//# sourceMappingURL=jelly-rules.d.ts.map