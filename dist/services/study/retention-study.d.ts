export function retentionEnabled(env?: NodeJS.ProcessEnv): boolean;
export function retentionSummary(records: any, nowMs?: number, minSample?: number): {
    fromDay: string;
    throughDay: string;
    enrolled: number | null;
    enrolledSuppressed: boolean;
    d1: {
        eligible: any;
        returned: any;
        rate: number | null;
        suppressed: boolean;
    };
    d7: {
        eligible: any;
        returned: any;
        rate: number | null;
        suppressed: boolean;
    };
    cohorts: {
        enrolledDay: any;
        enrolled: any;
        d1: {
            eligible: any;
            returned: any;
            rate: number | null;
            suppressed: boolean;
        };
        d7: {
            eligible: any;
            returned: any;
            rate: number | null;
            suppressed: boolean;
        };
    }[];
    suppressedCohorts: number;
    basis: string;
};
export const RETENTION_DAYS: 35;
export const MIN_RETENTION_SAMPLE: 20;
export function retentionStudyFile(): string;
export class RetentionStudyStore {
    constructor(file?: null);
    file: any;
    data: any;
    queue: Promise<void>;
    filePath(): any;
    pseudonym(playerId: any, key?: string | undefined): string;
    load(): Promise<void>;
    save(draft: any): Promise<void>;
    transact(nowMs: any, fn: any): Promise<any>;
    status(playerId: any, nowMs?: number): Promise<any>;
    optIn(playerId: any, nowMs?: number): Promise<any>;
    visit(playerId: any, nowMs?: number): Promise<any>;
    withdraw(playerId: any, nowMs?: number): Promise<any>;
    report(nowMs?: number): Promise<any>;
}
export const retentionStudyStore: RetentionStudyStore;
//# sourceMappingURL=retention-study.d.ts.map