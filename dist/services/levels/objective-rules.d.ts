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
    collected: {
        [k: string]: any;
    };
};
/** Strict completion/input boundary: no coercion, unknown colors, fractions, negatives or unbounded counts. */
export function validObjectiveProgress(definition: any, progress: any): boolean;
export function addObjectiveProgress(definition: any, previous: any, collected: any): {
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
export function objectiveActions(definition: any, board: any, specials: any, progress: any, score?: number): {
    cells: number[];
    count: number;
}[];
export function simulateObjectiveMove(definition: any, state: any, cells: any): {
    objectiveProgress: {
        collected: {
            [k: string]: any;
        };
    };
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
export function simulateObjectiveClear(definition: any, state: any, keys: any, points: any): {
    objectiveProgress: {
        collected: {
            [k: string]: any;
        };
    };
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
/** The same bounded witness used to compose goals must satisfy every goal, not only a score threshold. */
export function certifyObjectiveLevel(definition: any): {
    objectiveProgress: {
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
};
export const MAX_COLLECTED_GEMS: 1000000;
//# sourceMappingURL=objective-rules.d.ts.map