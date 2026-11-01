/** Add one verified classic win to the challenge total. Only wins inside the window count. */
export function recordChallengeWin(economy: any, challenge: any, score: any, nowMs?: number, disabled?: boolean): {
    challengeId: any;
    total: any;
} | null;
/** Grant one earned tier's coins once. Returns the same result for a retry. */
export function claimChallengeTier(economy: any, challenge: any, threshold: any, nowMs?: number, disabled?: boolean): {
    duplicate: boolean;
    coins: any;
    balance: any;
};
/** Operator kill switch. Set SCORE_CHALLENGE_DISABLED=1 to stop new wins and claims. */
export function scoreChallengeDisabled(): boolean;
export function findScoreChallenge(config: any, challengeId: any): any;
/** The challenge whose window contains nowMs, or null (also null while the kill switch is on). */
export function activeScoreChallenge(config: any, nowMs?: number): any;
/** Settlement hook: counts a server-verified win. Never throws, so a win is never blocked by the challenge. */
export function recordVerifiedChallengeWin(economy: any, config: any, score: any, nowMs?: number): {
    challengeId: any;
    total: any;
} | null;
/** Claim route entry: resolves the challenge from validated config, then claims once. */
export function claimScoreChallenge(economy: any, config: any, challengeId: any, threshold: any, nowMs?: number): {
    duplicate: boolean;
    coins: any;
    balance: any;
};
/** What the client shows: the open challenge, else the next upcoming one, else nothing.
 * Progress and claimability are only filled in for a signed-in player (economy given). */
export function scoreChallengeView(config: any, economy: any, nowMs?: number, disabled?: boolean): {
    challenge: null;
    disabled: boolean;
    serverNow: string;
} | {
    challenge: {
        id: any;
        name: any;
        status: string;
        startsAt: string;
        endsAt: string;
        target: any;
        total: any;
        tiers: any;
    };
    disabled: boolean;
    serverNow: string;
};
export class ScoreChallengeError extends Error {
    constructor(code: any);
    code: any;
}
//# sourceMappingURL=score-challenge-economy.d.ts.map