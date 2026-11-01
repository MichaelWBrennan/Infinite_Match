/** Reject unexpected fields so a private identifier or error stack cannot leak into a report. */
export function validateStabilityStudy(input: any): {
    error: string;
    row?: never;
    value?: never;
} | {
    error: string;
    row: number;
    value?: never;
} | {
    value: any;
    error?: never;
    row?: never;
};
/** Descriptive check of the existing >=99.5% / >=1000-session proposed beta gate only. */
export function evaluateStabilityStudy(input: any): {
    error: string;
    row?: never;
    value?: never;
} | {
    error: string;
    row: number;
    value?: never;
} | {
    schemaVersion: number;
    studyId: any;
    build: any;
    status: string;
    stability: {
        sessions: any;
        minimum: number;
        threshold: number;
        noCrashObserved: number | null;
        confirmedCrashes: any;
        unknownOutcomes: any;
        conservativeNoCrashRate: number | null;
        approximate95PercentWilson: {
            lower: number;
            upper: number;
        } | null;
        status: string;
    };
    clientErrors: {
        observed: any;
        missingChecks: any;
        note: string;
    };
    breakdown: {
        [k: string]: {
            groups: {
                label: any;
                sessions: any;
                confirmedCrashes: any;
                unknownOutcomes: any;
                clientErrorsObserved: any;
            }[];
            suppressedGroups: number;
        };
    };
    note: string;
};
export const STABILITY_SCHEMA_VERSION: 1;
export const MIN_STABILITY_SESSIONS: 1000;
export const MIN_STABILITY_STRATUM: 20;
//# sourceMappingURL=session-stability.d.ts.map