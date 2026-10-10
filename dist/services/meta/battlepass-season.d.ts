/** The season config file. BATTLEPASS_CONFIG overrides it (used by tests and staging). */
export function seasonConfigPath(): string;
/** Reads and validates the season config. Throws if it is missing or invalid. */
export function loadSeason(path?: string): Promise<{
    season: any;
    name: any;
    startMs: number;
    endMs: number;
    premiumSku: any;
    xpEvents: any;
    tiers: any;
} | null>;
/** Like loadSeason, but returns null and logs when the config cannot be used. Rewards keep working. */
export function loadSeasonSafely(path?: string): Promise<{
    season: any;
    name: any;
    startMs: number;
    endMs: number;
    premiumSku: any;
    xpEvents: any;
    tiers: any;
} | null>;
/** Adds season XP for an event (level_complete, daily_login) under the economy lock. */
export function grantSeasonXp(playerId: any, event: any): Promise<any>;
//# sourceMappingURL=battlepass-season.d.ts.map