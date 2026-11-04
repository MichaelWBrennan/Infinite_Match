export function levelForContext(level: any, mode: any, context: any, rulesVersion?: number): any;
/** Synchronous, no-network generation for tooling, tests and calendar-only callers. */
export function generatedLevel({ level, mode, location, rulesVersion }?: {
    level?: number | undefined;
    mode?: string | undefined;
    location?: {} | undefined;
    rulesVersion?: number | undefined;
}, nowMs?: number): any;
/** A single server-selected clock/forecast snapshot is frozen into a new board. */
export function liveLevelContext(location?: {}, nowMs?: number, weatherService?: Readonly<{
    snapshot: (location: any, nowMs?: number) => Promise<{
        available: boolean;
        condition: string;
        temperatureC: null;
        temperatureBand: string;
        windBand: string;
        source: string;
        area: null;
        forecastAt: null;
        expiresAt: null;
        reason: string;
        attribution: null;
    } | {
        available: boolean;
        source: any;
        condition: string;
        temperatureC: number;
        temperatureBand: string;
        windBand: string;
        area: any;
        forecastAt: string;
        expiresAt: string;
        attribution: any;
    }>;
}>): Promise<{
    weather: {
        available: boolean;
        condition: string;
        temperatureC: null;
        temperatureBand: string;
        windBand: string;
        source: string;
        area: null;
        forecastAt: null;
        expiresAt: null;
        reason: string;
        attribution: null;
    } | {
        available: boolean;
        source: any;
        condition: string;
        temperatureC: number;
        temperatureBand: string;
        windBand: string;
        area: any;
        forecastAt: string;
        expiresAt: string;
        attribution: any;
    };
    environmentRefreshAt: string;
    localDate: string;
    evaluatedAt: string;
    clockSource: string;
    timeOfDay: {
        period: string;
        label: string;
        nextChangeAt: null;
    } | {
        period: string;
        label: string;
        nextChangeAt: string;
    };
    year: number | undefined;
    month: number | undefined;
    day: number | undefined;
    season: any;
    holidays: {
        name: any;
        type: any;
    }[];
    holidayCoverage: boolean;
    refreshAt: string;
    weatherLatitude?: never;
    weatherLongitude?: never;
    timeZone: string;
    country: string | null;
    region: string | null;
    hemisphere: any;
    locationSource: string;
    holidayThemes: boolean;
    timeOfDayEnabled: boolean;
    weatherEnabled: boolean;
} | {
    weather: {
        available: boolean;
        condition: string;
        temperatureC: null;
        temperatureBand: string;
        windBand: string;
        source: string;
        area: null;
        forecastAt: null;
        expiresAt: null;
        reason: string;
        attribution: null;
    } | {
        available: boolean;
        source: any;
        condition: string;
        temperatureC: number;
        temperatureBand: string;
        windBand: string;
        area: any;
        forecastAt: string;
        expiresAt: string;
        attribution: any;
    };
    environmentRefreshAt: string;
    localDate: string;
    evaluatedAt: string;
    clockSource: string;
    timeOfDay: {
        period: string;
        label: string;
        nextChangeAt: null;
    } | {
        period: string;
        label: string;
        nextChangeAt: string;
    };
    year: number | undefined;
    month: number | undefined;
    day: number | undefined;
    season: any;
    holidays: {
        name: any;
        type: any;
    }[];
    holidayCoverage: boolean;
    refreshAt: string;
    weatherLatitude: number;
    weatherLongitude: number;
    timeZone: string;
    country: string | null;
    region: string | null;
    hemisphere: any;
    locationSource: string;
    holidayThemes: boolean;
    timeOfDayEnabled: boolean;
    weatherEnabled: boolean;
}>;
export function liveGeneratedLevel({ level, mode, location, rulesVersion }?: {
    level?: number | undefined;
    mode?: string | undefined;
    location?: {} | undefined;
    rulesVersion?: number | undefined;
}, nowMs?: number, weatherService?: Readonly<{
    snapshot: (location: any, nowMs?: number) => Promise<{
        available: boolean;
        condition: string;
        temperatureC: null;
        temperatureBand: string;
        windBand: string;
        source: string;
        area: null;
        forecastAt: null;
        expiresAt: null;
        reason: string;
        attribution: null;
    } | {
        available: boolean;
        source: any;
        condition: string;
        temperatureC: number;
        temperatureBand: string;
        windBand: string;
        area: any;
        forecastAt: string;
        expiresAt: string;
        attribution: any;
    }>;
}>): Promise<any>;
/** Look up an authored level by number and mode, shaped into a full generated-level
 *  definition with real certification. Returns null if no authored level exists. */
export function authoredLevel(level: any, mode?: string, context?: {
    localDate: string;
}): {
    quality: {
        initialMatches: number;
        legalOpeningMoves: number;
        verifiedWithoutBoosters: boolean;
        verifiedMoves: any;
        verifiedScore: number;
        verifiedCollected: {
            [k: string]: any;
        };
        verifiedObjectives: boolean;
        verifiedBlockers: any;
        verifiedLockedGems: any;
        verifiedJelly: any;
        verifiedChocolate: any;
        verifiedLiquorice: any;
        verifiedMarmalade: any;
        verifiedFrosting: any;
        verifiedDelivery: any;
    };
    id: string;
    generatorVersion: number;
    shields: any;
    blockers: any;
    lockedGems: any;
    jelly: any;
    chocolate: any;
    liquorice: any;
    marmalade: any;
    frosting: any;
    delivery: any;
    specials: any;
    witness: any;
    environmentKey: string;
    level: any;
    mode: any;
    isDaily: boolean;
    isBoss: boolean;
    seed: number;
    refillState: number;
    boardSize: any;
    board: any;
    gemTypes: any;
    gemWeights: any;
    targetScore: any;
    moves: any;
    timeLimit: number;
    objectives: any;
    objectiveProfile: any;
    difficulty: any;
    theme: {
        name: string;
        background: string;
        accent: string;
        favorite: string;
    };
    context: any;
} | null;
/** Untagged deployed v2 clients must never be charged for an unsupported newer-rules target. */
/** Rules v6 is server-gated: the BLOCKER_LEVELS flag must be 'on', and the request must be classic. */
export function blockerLevelsEnabled(env?: NodeJS.ProcessEnv): boolean;
export function clientRulesVersion(value: any, mode?: undefined, blockers?: boolean): 2 | 5 | 3 | 4 | 6;
//# sourceMappingURL=level-service.d.ts.map