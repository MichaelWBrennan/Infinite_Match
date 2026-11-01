/** The key is operator-managed. Without it, seed grouping is deliberately omitted. */
export function observationMeta(definition: any, priorStarts?: number, key?: string | undefined): {
    version: any;
    mode: any;
    level: any;
    profile: any;
    difficulty: any;
    cohort: string;
    seedGroup: string | null;
} | null;
/** The signals are client-reported diagnostics only; never interpreted as proof of gameplay. */
export function observationRow(meta: any, outcome: any, signals?: {}, nowMs?: number): any;
/** Best effort: an unavailable telemetry file must never revoke a paid attempt or reward. */
export function observeAttempt(meta: any, outcome: any, signals?: {}, nowMs?: number, file?: string): Promise<void>;
/** Read a bounded local file. Retain malformed-line counts, never echo raw lines. */
export function readAttemptObservations(file?: string): Promise<{
    rows: any[];
    skipped: number;
}>;
/** Aggregate only stable, low-cardinality slices; suppress groups below k started attempts. */
export function summarizeAttemptObservations(rows: any, { minSample, bySeed }?: {
    minSample?: number | undefined;
    bySeed?: boolean | undefined;
}): {
    groups: any[];
    suppressedGroups: number;
    minSample: number;
    source: string;
};
export const MIN_OBSERVATION_SAMPLE: 20;
export function observationFile(): string;
//# sourceMappingURL=attempt-observations.d.ts.map