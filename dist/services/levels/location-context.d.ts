export function civilDate(nowMs: any, timeZone: any): string;
/** First instant of tomorrow locally, including 23/25-hour DST days and half-hour offsets. */
export function nextLocalMidnight(nowMs: any, timeZone: any): string;
export function normalizeLocation(input?: {}): {
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
};
export function localLevelContext(input?: {}, nowMs?: number): {
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
};
export function locationCatalog(country: any): {
    countries: {
        code: string;
        name: string;
    }[];
    regions: {
        code: string;
        name: string;
    }[];
};
export class LevelInputError extends Error {
    constructor(code: any);
    code: any;
}
//# sourceMappingURL=location-context.d.ts.map