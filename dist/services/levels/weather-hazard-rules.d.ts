/** Validate a weather hazard grid: size x size, each cell 0..3 layers. */
export function validWeatherHazards(hazards: any, size: any): boolean;
/** Count cells with at least one hazard layer. */
export function weatherHazardCount(hazards: any): any;
/** Blank grid of zeros. */
export function blankWeatherHazards(size: any): any[][];
/** Place weather hazards only on cells the witness path clears. Cells cleared
 * multiple times get more layers, capped at 3. Returns a size x size grid. */
export function witnessedWeatherHazards(board: any, refillState: any, palette: any, weights: any, specials: any, witness: any, seed: any, hazardDef: any): any[][];
/** Clear one hazard layer on each cell covered by clearedKeys. Returns
 * { hazards, cleared } where cleared is the number of layers removed. */
export function clearWeatherHazards(hazards: any, clearedKeys: any): {
    hazards: any;
    cleared: number;
} | null;
/** Spread weather hazards: one new hazard cell per accepted move on the lowest
 * eligible orthogonal neighbour of an existing hazard cell. Never spreads onto
 * specials, shields, or existing hazards. Only used by storm lightning. */
export function spreadWeatherHazards(hazards: any, specials: any, shields: any, cap?: number): {
    hazards: any;
    spread: null;
} | {
    hazards: any;
    spread: string;
} | null;
/** Thread hazard layers through a simulate-style result. Hazards on cleared cells
 * lose one layer per clear. Returns { ...result, hazards, hazardCleared }. */
export function applyWeatherHazardClear(result: any, initialHazards: any): any;
/** Simulate one accepted player move with weather hazards: hazard clears on hit
 * cells, then optional spread (storm lightning only). Never mutates input. */
export function simulateWeatherHazardMove(definition: any, state: any, cells: any, visualTrace?: boolean): {
    hazardSpread: string | null;
    hazards: any;
    hazardCleared: number;
    presentation?: import("./special-rules.js").PresentationTrace;
    collected?: {
        [k: string]: any;
    } | null;
    board: any;
    specials: any;
    origins: any;
    refillState: any;
    score: number;
    cascades: number;
    events: {
        collected?: {
            [k: string]: any;
        } | null;
        cleared: any[];
        created: {
            row: any;
            col: any;
            type: any;
            color: any;
        }[];
        activated: {
            row: any;
            col: any;
            type: any;
        }[];
        points: number;
        combo: any;
    }[];
    reshuffled: boolean;
} | null;
/** Booster clear: removes hazard layers on hit cells but never spreads. */
export function simulateWeatherHazardClear(definition: any, state: any, keys: any, points: any, visualTrace?: boolean): {
    hazards: any;
    hazardCleared: number;
} | null;
/** Certify a weather-hazard level: replay the witness and confirm every hazard
 * cell is fully cleared by the witness path. Throws if any hazard remains. */
export function certifyWeatherHazardBoard(definition: any): {
    score: number;
    collected: {
        [k: string]: any;
    };
    hazardCleared: number;
    witness: any[];
    events: never[];
};
export const WEATHER_HAZARD_CAP: 8;
declare namespace _default {
    export { validWeatherHazards };
    export { weatherHazardCount };
    export { blankWeatherHazards };
    export { witnessedWeatherHazards };
    export { clearWeatherHazards };
    export { spreadWeatherHazards };
    export { applyWeatherHazardClear };
    export { simulateWeatherHazardMove };
    export { simulateWeatherHazardClear };
    export { certifyWeatherHazardBoard };
    export { WEATHER_HAZARD_CAP };
}
export default _default;
//# sourceMappingURL=weather-hazard-rules.d.ts.map