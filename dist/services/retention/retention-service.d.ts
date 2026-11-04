/** Records a player's first login (cohort date) — idempotent per player. */
export function recordFirstLogin(playerId: any, nowMs?: number): Promise<{
    alreadyRecorded: boolean;
    cohortDate: any;
}>;
/** Records a player login on a given day (for retention tracking). */
export function recordLogin(playerId: any, nowMs?: number): Promise<{
    day: string;
}>;
/**
 * Computes retention by cohort day.
 * Returns { cohorts: [{ cohortDate, size, d1, d7, d30, d1Benchmarks, d7Benchmarks, d30Benchmarks }], overall }
 */
export function computeRetention(nowMs?: number): Promise<{
    cohorts: {
        cohortDate: any;
        size: any;
        d1: number;
        d7: number;
        d30: number;
        d1Benchmarks: {
            match3_median: {
                d1: number;
                d7: number;
                d30: number;
            };
            match3_top: {
                d1: number;
                d7: number;
                d30: number;
            };
        };
        d7Benchmarks: {
            match3_median: {
                d1: number;
                d7: number;
                d30: number;
            };
            match3_top: {
                d1: number;
                d7: number;
                d30: number;
            };
        };
        d30Benchmarks: {
            match3_median: {
                d1: number;
                d7: number;
                d30: number;
            };
            match3_top: {
                d1: number;
                d7: number;
                d30: number;
            };
        };
        daysSinceCohort: number;
        canMeasureD1: boolean;
        canMeasureD7: boolean;
        canMeasureD30: boolean;
    }[];
    overall: {
        d1: number;
        d7: number;
        d30: number;
        benchmarks: {
            match3_median: {
                d1: number;
                d7: number;
                d30: number;
            };
            match3_top: {
                d1: number;
                d7: number;
                d30: number;
            };
        };
    };
    totalPlayers: number;
}>;
declare namespace _default {
    export { recordFirstLogin };
    export { recordLogin };
    export { computeRetention };
}
export default _default;
//# sourceMappingURL=retention-service.d.ts.map