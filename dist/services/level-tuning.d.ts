export function levelResultsFile(): string;
export function starsFor(score: any, targetScore: any): 1 | 2 | 0 | 3;
/** Returns true when a lost attempt was a near miss worth an urgency offer. */
export function isNearMiss(record: any): boolean;
/**
 * Classifies the urgency of a near miss and the matching offer.
 * Returns { urgency, offer, movesAdded, discountPercent } or null when not a near miss.
 *
 * Urgency tiers:
 *  - 'critical': movesLeft === 1 or scoreRatio >= 0.98 — one move / one percent away
 *  - 'high': movesLeft <= 3 or scoreRatio >= 0.90 — very close
 *  - 'medium': movesLeft > 0 or scoreRatio >= 0.85 — close but not desperate
 */
export function nearMissUrgency(record: any): {
    urgency: string;
    offer: string;
    movesAdded: number;
    discountPercent: number;
    scoreRatio: number;
    movesLeft: any;
} | null;
/**
 * Checks a client report. Returns { value } with the normalised record, or { error }.
 * A win must reach the target score, and a loss must not.
 */
export function validateLevelResult(body: any): {
    error: string;
    value?: never;
} | {
    value: {
        level: any;
        outcome: any;
        score: any;
        targetScore: any;
        stars: number;
        movesLeft: any;
        durationSeconds: any;
        isBoss: boolean;
    };
    error?: never;
};
export function appendLevelResult(record: any, file?: string): Promise<void>;
/** Reads all records. Lines that are not valid JSON are skipped and counted. */
export function readLevelResults(file?: string): Promise<{
    records: any[];
    skipped: number;
}>;
/** Per-level summary, sorted by level number. */
export function summarizeLevelResults(records: any): {
    level: any;
    attempts: any;
    winRate: number;
    avgStars: number;
    avgScoreRatio: number;
    avgMovesLeftOnWin: number | null;
    isBoss: boolean;
    flag: string;
}[];
/**
 * Plans the tuning step from the results. Each level counts only results after its last move
 * (`tuned`), so a flagged level moves once per new batch of attempts, not once per run. Pure:
 * it returns the new levels and tuning times, and changes nothing.
 */
export function planTuning(records: any, { levels, tuned }?: {
    levels?: {} | undefined;
    tuned?: {} | undefined;
}, now?: number): {
    summary: {
        level: any;
        attempts: any;
        winRate: number;
        avgStars: number;
        avgScoreRatio: number;
        avgMovesLeftOnWin: number | null;
        isBoss: boolean;
        flag: string;
    }[];
    proposals: {
        level: any;
        flag: any;
        winRate: any;
        attempts: any;
        from: number;
        to: number;
    }[];
    levels: any;
    tuned: {};
};
/**
 * Reads the results and plans a tuning step. With `apply`, saves the new levels. Runs are
 * serialized, so two requests cannot both apply the same batch.
 */
export function runTuning({ store, file, apply, now, approvedLevel, expectedUpdatedAt, expectedFrom }: {
    store: any;
    file: any;
    apply?: boolean | undefined;
    now?: number | undefined;
    approvedLevel?: null | undefined;
    expectedUpdatedAt?: undefined;
    expectedFrom?: undefined;
}): Promise<{
    applied: boolean;
    summary: {
        level: any;
        attempts: any;
        winRate: number;
        avgStars: number;
        avgScoreRatio: number;
        avgMovesLeftOnWin: number | null;
        isBoss: boolean;
        flag: string;
    }[];
    proposals: {
        level: any;
        flag: any;
        winRate: any;
        attempts: any;
        from: number;
        to: number;
    }[];
    levels: any;
    tuned: {};
}>;
export const MIN_ATTEMPTS_TO_FLAG: 20;
export const TOO_HARD_WIN_RATE: 0.3;
export const TOO_EASY_WIN_RATE: 0.95;
/**
 * "One step away" urgency detection (Royal Match-style loss aversion).
 *
 * A near-miss is a lost attempt where the player was close to winning:
 *  - they still had moves left when they lost (ran out of time/objectives), or
 *  - their score reached at least NEAR_MISS_SCORE_RATIO of the target.
 *
 * These are the moments of maximum frustration and the best time to offer
 * a time-boxed, discounted continue (extra moves) — the core Royal Match
 * monetization mechanic.
 */
export const NEAR_MISS_SCORE_RATIO: 0.85;
//# sourceMappingURL=level-tuning.d.ts.map