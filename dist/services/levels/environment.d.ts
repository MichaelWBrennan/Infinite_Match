export function periodForHour(hour: any): "night" | "morning" | "afternoon" | "evening";
/** Fixed local clock periods, not astronomical sunrise/sunset. DST uses native tzdb. */
export function timeOfDayContext(nowMs: any, timeZone: any, enabled?: boolean): {
    period: string;
    label: string;
    nextChangeAt: null;
} | {
    period: string;
    label: string;
    nextChangeAt: string;
};
export function temperatureBand(temperatureC: any): "unknown" | "cold" | "cool" | "hot" | "mild";
/** Only normalized, coarse bands affect mechanics: tiny forecast revisions cannot flicker the seed. */
export function environmentRules(context: any): {
    key: string;
    period: any;
    condition: any;
    temperatureBand: any;
    windBand: string;
    priorities: any[];
    gemBonuses: any;
    minimumColors: any;
    moveBonus: any;
    tint: any;
    accent: any;
    label: string;
};
export function blendHex(first: any, second: any, amount?: number): any;
/** Pure, shared clock/weather rules. No network, GPS, random weather or player data. */
export const DAY_PERIODS: string[];
export const WEATHER_CONDITIONS: string[];
//# sourceMappingURL=environment.d.ts.map