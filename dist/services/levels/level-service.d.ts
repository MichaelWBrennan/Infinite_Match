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
/** Untagged deployed v2 clients must never be charged for an unsupported newer-rules target. */
export function clientRulesVersion(value: any): 2 | 3 | 4;
//# sourceMappingURL=level-service.d.ts.map