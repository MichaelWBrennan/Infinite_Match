export function civilDate(nowMs: any, timeZone: any): string;
/** First instant of tomorrow locally, including 23/25-hour DST days and half-hour offsets. */
export function nextLocalMidnight(nowMs: any, timeZone: any): string;
export function normalizeLocation(input?: {}): {
    timeZone: string;
    country: string | null;
    region: string | null;
    hemisphere: any;
    locationSource: string;
    holidayThemes: boolean;
};
export function localLevelContext(input?: {}, nowMs?: number): {
    localDate: string;
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
    timeZone: string;
    country: string | null;
    region: string | null;
    hemisphere: any;
    locationSource: string;
    holidayThemes: boolean;
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