/** Strict schema: fail closed on extra fields so identifiers/notes cannot leak to reports. */
export function validateStudy(input: any): {
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
/** Evaluates only the documented first-play and loss-fairness study gates. */
export function evaluateStudy(input: any): {
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
    note: string;
    learning: {
        cohort: string;
        sessions: any;
        minimum: number;
        unassistedMovesBy30s: any;
        unassistedMoveRate: number | null;
        goalsExplained: any;
        goalRate: number | null;
        missingGoal: any;
        status: string;
    };
    fairness: {
        cohort: string;
        sessions: any;
        minimum: number;
        fairLosses: any;
        fairRate: number | null;
        medianEnjoyment: any;
        missingFairness: any;
        missingEnjoyment: any;
        status: string;
    };
    overallSessions: any;
    breakdown: {
        [k: string]: {
            groups: ({
                label: any;
                sessions: any;
            } | {
                unassistedMoveRate: number | null;
                goalRate: number | null;
                missingGoal: any;
                label: any;
                sessions: any;
            } | {
                fairRate: number | null;
                medianEnjoyment: any;
                missingFairness: any;
                missingEnjoyment: any;
                label: any;
                sessions: any;
            })[];
            suppressedGroups: number;
        };
    };
    cohortBreakdown: any;
};
export const STUDY_SCHEMA_VERSION: 1;
export const MIN_LEARNING: 20;
export const MIN_LOSS_PILOT: 30;
export const MIN_STRATUM: 5;
//# sourceMappingURL=first-play.d.ts.map