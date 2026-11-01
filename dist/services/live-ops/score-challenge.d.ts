/** Returns { errors, challenge } where challenge is a normalised copy, or null when invalid. */
export function validateScoreChallenge(raw: any): {
    errors: string[];
    challenge: null;
} | {
    errors: string[];
    challenge: {
        id: any;
        name: any;
        startMs: number | null;
        endMs: number | null;
        target: any;
        tiers: any;
    };
};
/** Half-open window: a result counts from start (inclusive) to end (exclusive). */
export function challengeOpen(challenge: any, nowMs: any): boolean;
/** results: verified classic wins as { score, verifiedAtMs }. Only wins inside the window count. */
export function challengeProgress(challenge: any, results: any): {
    total: number;
    target: any;
    complete: boolean;
    tiers: any;
};
/** Tiers earned and not yet claimed. claimed holds the thresholds already paid. */
export function claimableTiers(challenge: any, progress: any, claimed?: any[]): any;
/** Live ops v1 (L1): personal score challenge. Pure definition, validation and progress only.
 * Not wired into config or claims yet (L2 and L3). A challenge counts verified classic wins
 * inside its window, sums their scores, and unlocks up to three coin tiers. The coin ceiling
 * matches the Hall Lanterns weekly event: each tier at most 40 coins, all tiers at most 80. */
export const CHALLENGE_MAX_TIERS: 3;
export const CHALLENGE_TIER_COINS_MAX: 40;
export const CHALLENGE_COIN_CEILING: 80;
export const CHALLENGE_MAX_DURATION_MS: number;
export const CHALLENGE_TARGET_MIN: 1000;
export const CHALLENGE_TARGET_MAX: 100000;
//# sourceMappingURL=score-challenge.d.ts.map