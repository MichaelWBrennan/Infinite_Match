export function utcDay(nowMs?: number): string;
export function minigameFor(gameId: any): any;
/** Coins a score pays for one game. */
export function minigameCoins(game: any, score: any): number;
/**
 * Checks one play and returns what to pay. Throws MinigameError for an unknown game, a score out of
 * range, or a second play of the same game today. Changes nothing: the caller saves the record.
 */
export function planMinigamePlay(economy: any, gameId: any, score: any, nowMs?: number): {
    game: any;
    coins: number;
    record: {
        day: any;
        played: any;
    };
};
/** Each game with whether it has been played today. */
export function minigameStatus(economy: any, nowMs?: number): {
    id: string;
    name: string;
    maxScore: number;
    playedToday: boolean;
    coinsCap: number;
}[];
/**
 * Daily mini-games. Each game can be paid once per UTC day. The client plays the game and reports
 * its score; the server checks the score is a whole number in range, pays coins for it, and records
 * the play. Coins are capped per game, so a made-up score is worth at most the cap, once a day.
 *
 * Tuning values are here. Change them here, and the server applies the change.
 */
export const MINIGAMES: Readonly<{
    memory: {
        id: string;
        name: string;
        maxScore: number;
        coinsPerPoint: number;
        coinsCap: number;
    };
    treasure: {
        id: string;
        name: string;
        maxScore: number;
        coinsPerPoint: number;
        coinsCap: number;
    };
    rhythm: {
        id: string;
        name: string;
        maxScore: number;
        coinsPerPoint: number;
        coinsCap: number;
    };
}>;
export class MinigameError extends Error {
    constructor(code: any);
    code: any;
}
//# sourceMappingURL=minigames.d.ts.map