/**
 * Look up an authored level by number and mode. Returns null if no authored
 * level exists for that combination (the procedural generator is used instead).
 */
export function authoredLevelFor(level: any, mode?: string): {
    level: number;
    mode: string;
    boardSize: number;
    moves: number;
    targetScore: number;
    gemTypes: string[];
    gemWeights: {
        red: number;
        blue: number;
        green: number;
        yellow?: never;
        purple?: never;
        orange?: never;
    };
    shields: null;
    blockers: null;
    lockedGems: null;
    objectives: {
        type: string;
        gemType: string;
        target: number;
    }[];
    witness: number[][];
    difficulty: string;
} | {
    level: number;
    mode: string;
    boardSize: number;
    moves: number;
    targetScore: number;
    gemTypes: string[];
    gemWeights: {
        red: number;
        blue: number;
        green: number;
        yellow: number;
        purple?: never;
        orange?: never;
    };
    shields: null;
    blockers: null;
    lockedGems: null;
    objectives: {
        type: string;
        gemType: string;
        target: number;
    }[];
    witness: number[][];
    difficulty: string;
} | {
    level: number;
    mode: string;
    boardSize: number;
    moves: number;
    targetScore: number;
    gemTypes: string[];
    gemWeights: {
        red: number;
        blue: number;
        green: number;
        yellow: number;
        purple?: never;
        orange?: never;
    };
    shields: number[][];
    blockers: null;
    lockedGems: null;
    objectives: {
        type: string;
        target: number;
    }[];
    witness: number[][];
    difficulty: string;
} | {
    level: number;
    mode: string;
    boardSize: number;
    moves: number;
    targetScore: number;
    gemTypes: string[];
    gemWeights: {
        red: number;
        blue: number;
        green: number;
        yellow: number;
        purple: number;
        orange?: never;
    };
    shields: null;
    blockers: number[][];
    lockedGems: null;
    objectives: ({
        type: string;
        gemType: string;
        target: number;
    } | {
        type: string;
        target: number;
        gemType?: never;
    })[];
    witness: number[][];
    difficulty: string;
} | {
    level: number;
    mode: string;
    boardSize: number;
    moves: number;
    targetScore: number;
    gemTypes: string[];
    gemWeights: {
        red: number;
        blue: number;
        green: number;
        yellow: number;
        orange: number;
        purple?: never;
    };
    shields: null;
    blockers: null;
    lockedGems: number[][];
    objectives: {
        type: string;
        target: number;
    }[];
    witness: number[][];
    difficulty: string;
} | {
    level: number;
    mode: string;
    boardSize: number;
    moves: number;
    targetScore: number;
    gemTypes: string[];
    gemWeights: {
        red: number;
        blue: number;
        green: number;
        yellow: number;
        purple: number;
        orange: number;
    };
    shields: number[][];
    blockers: null;
    lockedGems: null;
    objectives: {
        type: string;
        target: number;
    }[];
    witness: number[][];
    difficulty: string;
} | null;
/**
 * All authored level numbers for a given mode, sorted ascending.
 */
export function authoredLevelNumbers(mode?: string): number[];
/**
 * Authored level pack — hand-crafted match-3 levels that complement the
 * procedurally generated supply. Each level has a designed difficulty curve,
 * teach/test pacing, and specific objectives. Levels are served alongside
 * procedural levels; authored levels take priority for their level number.
 *
 * These levels are deterministic (no RNG at runtime) and include a certified
 * no-booster winning path so they can be replay-verified like any other level.
 */
export const AUTHORED_LEVELS: readonly ({
    level: number;
    mode: string;
    boardSize: number;
    moves: number;
    targetScore: number;
    gemTypes: string[];
    gemWeights: {
        red: number;
        blue: number;
        green: number;
        yellow?: never;
        purple?: never;
        orange?: never;
    };
    shields: null;
    blockers: null;
    lockedGems: null;
    objectives: {
        type: string;
        gemType: string;
        target: number;
    }[];
    witness: number[][];
    difficulty: string;
} | {
    level: number;
    mode: string;
    boardSize: number;
    moves: number;
    targetScore: number;
    gemTypes: string[];
    gemWeights: {
        red: number;
        blue: number;
        green: number;
        yellow: number;
        purple?: never;
        orange?: never;
    };
    shields: null;
    blockers: null;
    lockedGems: null;
    objectives: {
        type: string;
        gemType: string;
        target: number;
    }[];
    witness: number[][];
    difficulty: string;
} | {
    level: number;
    mode: string;
    boardSize: number;
    moves: number;
    targetScore: number;
    gemTypes: string[];
    gemWeights: {
        red: number;
        blue: number;
        green: number;
        yellow: number;
        purple?: never;
        orange?: never;
    };
    shields: number[][];
    blockers: null;
    lockedGems: null;
    objectives: {
        type: string;
        target: number;
    }[];
    witness: number[][];
    difficulty: string;
} | {
    level: number;
    mode: string;
    boardSize: number;
    moves: number;
    targetScore: number;
    gemTypes: string[];
    gemWeights: {
        red: number;
        blue: number;
        green: number;
        yellow: number;
        purple: number;
        orange?: never;
    };
    shields: null;
    blockers: number[][];
    lockedGems: null;
    objectives: ({
        type: string;
        gemType: string;
        target: number;
    } | {
        type: string;
        target: number;
        gemType?: never;
    })[];
    witness: number[][];
    difficulty: string;
} | {
    level: number;
    mode: string;
    boardSize: number;
    moves: number;
    targetScore: number;
    gemTypes: string[];
    gemWeights: {
        red: number;
        blue: number;
        green: number;
        yellow: number;
        orange: number;
        purple?: never;
    };
    shields: null;
    blockers: null;
    lockedGems: number[][];
    objectives: {
        type: string;
        target: number;
    }[];
    witness: number[][];
    difficulty: string;
} | {
    level: number;
    mode: string;
    boardSize: number;
    moves: number;
    targetScore: number;
    gemTypes: string[];
    gemWeights: {
        red: number;
        blue: number;
        green: number;
        yellow: number;
        purple: number;
        orange: number;
    };
    shields: number[][];
    blockers: null;
    lockedGems: null;
    objectives: {
        type: string;
        target: number;
    }[];
    witness: number[][];
    difficulty: string;
})[];
declare namespace _default {
    export { AUTHORED_LEVELS };
    export { authoredLevelFor };
    export { authoredLevelNumbers };
}
export default _default;
//# sourceMappingURL=levels.d.ts.map