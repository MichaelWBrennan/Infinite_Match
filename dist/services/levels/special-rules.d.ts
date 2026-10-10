export function blankSpecials(size: any): any[][];
/** One special per connected match, precedence: line 5+ > intersecting runs > line 4. */
export function earnedMatches(board: any, specials?: any[][], preferred?: any[]): {
    matches: Set<string>;
    creations: {
        row: any;
        col: any;
        type: any;
        color: any;
    }[];
};
/** Swap adjacent cells, or tap one earned special. A successful action costs ONE ordinary move. */
export function simulateSpecialMove(board: any, refillState: any, palette: any, weights: any, cells: any, specials?: null, recordColors?: boolean): {
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
/** Existing inventory boosters keep their base award; effects can chain earned specials. No inventory logic here. */
export function simulateSpecialClear(board: any, refillState: any, palette: any, weights: any, keys: any, specials?: null, bonusScore?: number, recordColors?: boolean): {
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
/** Fast deterministic hint/certification candidates. Count is an immediate estimate, not an optimal win promise. */
export function specialActions(board: any, specials?: any[][], recordColors?: boolean): {
    cells: number[];
    count: number;
}[];
export function certifySpecialBoard(board: any, refillState: any, palette: any, weights: any, moveBudget: any, specials?: any[][], recordColors?: boolean): {
    collected?: {
        [k: string]: any;
    } | null;
    score: number;
    witness: number[][];
};
export const SPECIAL_TYPES: readonly string[];
//# sourceMappingURL=special-rules.d.ts.map