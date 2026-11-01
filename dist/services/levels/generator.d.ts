export function levelTheme(context: any): any;
/** Cache/seed identity excludes fetch timestamps and small changes within weather bands. */
export function generationKey(levelNumber: any, context: any, mode?: string, version?: number): string;
/** Any positive safe level number; bounded difficulty instead of impossible linear score growth. */
export function generateLevel(levelNumber: any, context: any, mode?: string, version?: number): {
    difficulty: string | undefined;
    theme: any;
    context: any;
    quality: {
        verifiedFrosting?: any;
        verifiedMarmalade?: any;
        verifiedLiquorice?: any;
        verifiedChocolate?: any;
        verifiedJelly?: any;
        verifiedLockedGems?: any;
        verifiedBlockers?: any;
        verifiedShields?: any;
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
    frosting?: any[][] | null;
    marmalade?: any[][] | null;
    liquorice?: any[][] | null;
    chocolate?: any[][] | null;
    jelly?: any[][] | null;
    lockedGems?: any[][] | null;
    blockers?: any[][] | null;
    shields?: number[][] | null;
    specials?: any[][];
    id: string;
    generatorVersion: number;
};
/** Use the frozen definition's rules, never today's generator version, during an active attempt. */
export function levelActions(definition: any, board: any, specials: any, progress: any, score?: number, shields?: any, refillState?: any, blockers?: any, lockedGems?: any, jelly?: any, chocolate?: any, liquorice?: any, marmalade?: any, frosting?: any): {
    cells: number[];
    count: number;
}[];
export function simulateLevelMove(definition: any, state: any, cells: any, visualTrace?: boolean): any;
export function certifyLevel(definition: any): {
    score: number;
    witness: number[][];
} | {
    objectiveProgress: {
        frostingCleared?: any;
        marmaladeCleared?: any;
        liquoriceCleared?: any;
        chocolateCleared?: any;
        jellyCleared?: any;
        lockedCleared?: any;
        blockersCleared?: any;
        shieldsCleared?: any;
        collected: {
            [k: string]: any;
        } | null | undefined;
    };
    objectivesComplete: any;
    score: number;
    collected: {
        [k: string]: any;
    };
    jellyCleared: number;
    events: never[];
} | {
    objectiveProgress: {
        frostingCleared?: any;
        marmaladeCleared?: any;
        liquoriceCleared?: any;
        chocolateCleared?: any;
        jellyCleared?: any;
        lockedCleared?: any;
        blockersCleared?: any;
        shieldsCleared?: any;
        collected: {
            [k: string]: any;
        } | null | undefined;
    };
    objectivesComplete: any;
    score: number;
    collected: {
        [k: string]: any;
    };
    chocolateCleared: number;
    events: never[];
} | {
    objectiveProgress: {
        frostingCleared?: any;
        marmaladeCleared?: any;
        liquoriceCleared?: any;
        chocolateCleared?: any;
        jellyCleared?: any;
        lockedCleared?: any;
        blockersCleared?: any;
        shieldsCleared?: any;
        collected: {
            [k: string]: any;
        } | null | undefined;
    };
    objectivesComplete: any;
    score: number;
    collected: {
        [k: string]: any;
    };
    liquoriceCleared: number;
    events: never[];
} | {
    objectiveProgress: {
        frostingCleared?: any;
        marmaladeCleared?: any;
        liquoriceCleared?: any;
        chocolateCleared?: any;
        jellyCleared?: any;
        lockedCleared?: any;
        blockersCleared?: any;
        shieldsCleared?: any;
        collected: {
            [k: string]: any;
        } | null | undefined;
    };
    objectivesComplete: any;
    score: number;
    collected: {
        [k: string]: any;
    };
    marmaladeCleared: number;
    events: never[];
} | {
    objectiveProgress: {
        frostingCleared?: any;
        marmaladeCleared?: any;
        liquoriceCleared?: any;
        chocolateCleared?: any;
        jellyCleared?: any;
        lockedCleared?: any;
        blockersCleared?: any;
        shieldsCleared?: any;
        collected: {
            [k: string]: any;
        } | null | undefined;
    };
    objectivesComplete: any;
    score: number;
    collected: {
        [k: string]: any;
    };
    frostingCleared: number;
    events: never[];
};
export const GENERATOR_VERSION: 5;
export const GEM_TYPES: string[];
export const LEVEL_MODES: string[];
export { hashSeed, nextRandom, pickGem, matchingCells, legalSwaps, dealPlayableBoard, simulateMove, certifyBoard } from "./match-core.js";
export { SPECIAL_TYPES, blankSpecials, earnedMatches, specialActions, simulateSpecialMove, simulateSpecialClear } from "./special-rules.js";
export { composeObjectives, levelObjectives, initialObjectiveProgress, validObjectiveProgress, addObjectiveProgress, objectiveStatus, objectiveStars, objectiveCompletionError, objectiveDescription, objectiveSummary, simulateObjectiveClear } from "./objective-rules.js";
//# sourceMappingURL=generator.d.ts.map