/** Checks the competitions part of a live ops config. Returns { errors, tournaments, challenges }. */
export function validateCompetitions(raw: any): {
    errors: any[];
    tournaments: {
        prizes: {
            from: any;
            to: any;
            coins: any;
        }[];
        startMs: number;
        endMs: number;
        id: any;
        name: any;
    }[];
    challenges: {
        startMs: number;
        endMs: number;
        id: any;
        name: any;
        goal: any;
        reward: {
            coins: any;
        };
    }[];
};
/** Reads the competitions from the live ops file. Missing or invalid config gives none. */
export function loadCompetitions(path?: string): {
    tournaments: {
        prizes: {
            from: any;
            to: any;
            coins: any;
        }[];
        startMs: number;
        endMs: number;
        id: any;
        name: any;
    }[];
    challenges: {
        startMs: number;
        endMs: number;
        id: any;
        name: any;
        goal: any;
        reward: {
            coins: any;
        };
    }[];
};
/** Competitions whose window contains `nowMs`. */
export function activeCompetitions(config: any, nowMs?: number): {
    tournaments: any;
    challenges: any;
};
/** Coins for a tournament place, or 0 when the place does not earn a prize. */
export function prizeForRank(tournament: any, rank: any): any;
export const MAX_PRIZE_COINS: 100000;
export const MAX_CHALLENGE_GOAL: 1000000;
export const MAX_RANKED_PLACE: 100;
declare namespace _default {
    export { validateCompetitions };
    export { loadCompetitions };
    export { activeCompetitions };
    export { prizeForRank };
}
export default _default;
//# sourceMappingURL=competitions.d.ts.map