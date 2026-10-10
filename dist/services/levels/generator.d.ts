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
export function levelTheme(context: any): any;
/** Cache/seed identity excludes fetch timestamps and small changes within weather bands. */
export function generationKey(levelNumber: any, context: any, mode?: string): string;
/** Any positive safe level number; bounded difficulty instead of impossible linear score growth. */
export function generateLevel(levelNumber: any, context: any, mode?: string): {
    id: string;
    generatorVersion: number;
    environmentKey: string;
    level: any;
    mode: string;
    isDaily: boolean;
    isBoss: boolean;
    seed: number;
    refillState: number;
    boardSize: number;
    board: any[][];
    gemTypes: any[];
    gemWeights: any;
    targetScore: number;
    moves: number;
    timeLimit: number;
    objectives: {
        type: string;
        target: number;
    }[];
    difficulty: string | undefined;
    theme: any;
    context: any;
    quality: {
        initialMatches: number;
        legalOpeningMoves: number;
        verifiedWithoutBoosters: boolean;
        verifiedMoves: number;
        verifiedScore: number;
    };
};
export const GENERATOR_VERSION: 2;
export const GEM_TYPES: string[];
export const LEVEL_MODES: string[];
//# sourceMappingURL=generator.d.ts.map