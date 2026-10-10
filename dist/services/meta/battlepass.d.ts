/** Checks a raw season config. Returns { errors, season } and a normalised season when valid. */
export function validateSeason(raw: any): {
    errors: string[];
    season: null;
} | {
    errors: string[];
    season: {
        season: any;
        name: any;
        startMs: number;
        endMs: number;
        premiumSku: any;
        xpEvents: any;
        tiers: any;
    };
};
/** 'upcoming', 'active' or 'ended' for a validated season. */
export function seasonStatus(season: any, nowMs?: number): "active" | "upcoming" | "ended";
/** The tier a player is on: the highest tier whose XP they have reached. */
export function currentTier(season: any, xp: any): number;
/**
 * Returns the player's battle pass state for this season. A new season, or a player without a
 * battle pass record, starts from zero. Mutates and returns the economy's battlePass field.
 */
export function battlePassFor(playerEconomy: any, season: any): any;
/** Adds season XP for an event, but only while the season is running. Returns the new XP. */
export function addSeasonXp(playerEconomy: any, season: any, event: any, nowMs?: number): any;
/** Converts a reward to the economy operation that grants it. */
export function rewardOperation(reward: any): {
    type: string;
    currencyId: string;
    amount: any;
    category?: never;
    itemId?: never;
} | {
    type: string;
    category: string;
    itemId: any;
    amount: any;
    currencyId?: never;
};
/**
 * Works out a tier claim without granting anything yet. Throws BattlePassError with the reason.
 * Returns the reward operations to apply; the caller applies them and saves the economy.
 */
export function planTierClaim(playerEconomy: any, season: any, { level, track, owned, nowMs }: {
    level: any;
    track: any;
    owned: any;
    nowMs?: number | undefined;
}): {
    operations: ({
        type: string;
        currencyId: string;
        amount: any;
        category?: never;
        itemId?: never;
    } | {
        type: string;
        category: string;
        itemId: any;
        amount: any;
        currencyId?: never;
    })[];
    reward: any;
    mark: () => any;
};
/** Public view of a player's progress: what they have reached and claimed. */
export function progressView(playerEconomy: any, season: any, { owned, nowMs }: {
    owned: any;
    nowMs?: number | undefined;
}): {
    season: any;
    name: any;
    status: string;
    endsAt: string;
    xp: any;
    tier: number;
    premiumUnlocked: boolean;
    claimed: {
        free: any[];
        premium: any[];
    };
    tiers: any;
};
export const POWERUP_IDS: readonly string[];
export const MAX_COINS_PER_REWARD: 10000;
export const MAX_ITEMS_PER_REWARD: 10;
export class BattlePassError extends Error {
    constructor(code: any);
    code: any;
}
//# sourceMappingURL=battlepass.d.ts.map