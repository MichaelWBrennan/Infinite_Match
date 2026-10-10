export function levelTheme(context: any): any;
/** Cache/seed identity excludes fetch timestamps and small changes within weather bands. */
export function generationKey(levelNumber: any, context: any, mode?: string, version?: number): string;
/** Any positive safe level number; bounded difficulty instead of impossible linear score growth. */
export function generateLevel(levelNumber: any, context: any, mode?: string, version?: number): {
    difficulty: string | undefined;
    theme: any;
    context: any;
    quality: {
        verifiedCollected?: any;
        verifiedObjectives?: boolean;
        initialMatches: number;
        legalOpeningMoves: number;
        verifiedWithoutBoosters: boolean;
        verifiedMoves: number;
        verifiedScore: number;
    };
    objectiveProfile?: any;
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
        target: any;
    }[] | {
        type: string;
        target: number;
    }[];
    specials?: any[][];
    id: string;
    generatorVersion: number;
};
/** Use the frozen definition's rules, never today's generator version, during an active attempt. */
export function levelActions(definition: any, board: any, specials: any, progress: any, score?: number): {
    cells: number[];
    count: number;
}[];
export function simulateLevelMove(definition: any, state: any, cells: any): {
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
} | {
    board: any;
    refillState: number;
    score: number;
    cascades: number;
} | null;
export function certifyLevel(definition: any): {
    score: number;
    witness: number[][];
};
export const GENERATOR_VERSION: 4;
export const GEM_TYPES: string[];
export const LEVEL_MODES: string[];
export { hashSeed, nextRandom, pickGem, matchingCells, legalSwaps, dealPlayableBoard, simulateMove, certifyBoard } from "./match-core.js";
export { SPECIAL_TYPES, blankSpecials, earnedMatches, specialActions, simulateSpecialMove, simulateSpecialClear } from "./special-rules.js";
export { composeObjectives, levelObjectives, initialObjectiveProgress, validObjectiveProgress, addObjectiveProgress, objectiveStatus, objectiveStars, objectiveCompletionError, objectiveDescription, objectiveSummary, simulateObjectiveClear } from "./objective-rules.js";
//# sourceMappingURL=generator.d.ts.map