export function weatherArea(location: any): any;
export function unavailableWeather(area?: null, reason?: string, expiresAt?: null): {
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
};
export function metCondition(symbol: any): string;
export function wmoCondition(code: any): "unknown" | "clear" | "partly_cloudy" | "cloudy" | "fog" | "storm" | "sleet" | "snow" | "rain";
/** Never treat unknown/malformed data as sunny weather or a current observation. */
export function normalizeForecast(body: any, provider: any, area: any, nowMs: any, cacheExpiresAt: any): {
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
/** Isolated caches/transport make the real feed adapter testable without live internet. */
export function createLevelWeatherService({ fetchFn, env, maxCache, maxInFlight, timeoutMs }?: {
    fetchFn?: ((...args: any[]) => Promise<Response>) | undefined;
    env?: (() => NodeJS.ProcessEnv) | undefined;
    maxCache?: number | undefined;
    maxInFlight?: number | undefined;
    timeoutMs?: number | undefined;
}): Readonly<{
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
}>;
export const levelWeatherService: Readonly<{
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
}>;
//# sourceMappingURL=weather-context.d.ts.map