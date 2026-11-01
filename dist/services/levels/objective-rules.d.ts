/** Deterministic goals are calibrated against an already-replayed no-inventory witness. */
export function composeObjectives({ level, mode, seed, palette, favorite, proof, targetScore, fraction }: {
    level: any;
    mode: any;
    seed: any;
    palette: any;
    favorite: any;
    proof: any;
    targetScore: any;
    fraction: any;
}): {
    profile: string | undefined;
    objectives: {
        type: string;
        target: any;
    }[];
};
/** Older funded definitions keep their score-only interpretation, even if caller metadata changes. */
export function levelObjectives(definition: any): any;
export function validObjectives(definition: any): boolean;
export function initialObjectiveProgress(definition: any): {
    blockersCleared: number;
    lockedCleared: number;
    jellyCleared: number;
    chocolateCleared: number;
    liquoriceCleared: number;
    marmaladeCleared: number;
    frostingCleared: number;
    shieldsCleared?: number;
    collected: {
        [k: string]: any;
    };
};
/** Strict completion/input boundary: no coercion, unknown colors, fractions, negatives or unbounded counts. */
export function validObjectiveProgress(definition: any, progress: any): boolean;
export function addObjectiveProgress(definition: any, previous: any, collected: any, brokenShields?: number, brokenBlockers?: number, brokenLocks?: number, brokenJelly?: number, brokenChocolate?: number, brokenLiquorice?: number, brokenMarmalade?: number, brokenFrosting?: number): {
    blockersCleared: number;
    lockedCleared: number;
    jellyCleared: number;
    chocolateCleared: number;
    liquoriceCleared: number;
    marmaladeCleared: number;
    frostingCleared: number;
    shieldsCleared?: number;
    collected: {
        [k: string]: any;
    };
};
/** Every declared goal is required; targetScore alone is only a rating baseline on collection-only levels. */
export function objectiveStatus(definition: any, score: any, progress: any): {
    items: any;
    complete: any;
    fraction: number;
};
/** One star for satisfying collection goals; further stars still use the pinned score thresholds. */
export function objectiveStars(definition: any, score: any, progress: any): number;
export function objectiveCompletionError(definition: any, score: any, progress: any): "invalid_score" | "invalid_level_objectives" | "objective_progress_required" | "invalid_objective_progress" | "score_below_target" | "objectives_incomplete" | null;
export function objectiveDescription(definition: any): any;
export function objectiveSummary(definition: any, score: any, progress: any, showRemaining?: boolean): any;
/** Immediate goal-aware hints without consuming RNG or running every full cascade. Not an optimal-win promise. */
export function objectiveActions(definition: any, board: any, specials: any, progress: any, score?: number, shields?: null, refillState?: number, blockers?: null, lockedGems?: null, jelly?: null, chocolate?: null, liquorice?: null, marmalade?: null, frosting?: null): {
    cells: number[];
    count: number;
}[];
export function simulateObjectiveMove(definition: any, state: any, cells: any, visualTrace?: boolean): any;
export function simulateObjectiveClear(definition: any, state: any, keys: any, points: any, visualTrace?: boolean): any;
/** The same bounded witness used to compose goals must satisfy every goal, not only a score threshold. */
export function certifyObjectiveLevel(definition: any): {
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
    collected?: {
        [k: string]: any;
    } | null;
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
export const MAX_COLLECTED_GEMS: 1000000;
//# sourceMappingURL=objective-rules.d.ts.map