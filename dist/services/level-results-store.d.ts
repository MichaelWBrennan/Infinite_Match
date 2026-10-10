/** The store the server uses. Created on first use as a file store. */
export function levelResultsStore(): any;
/** Replaces the store (used by tests and by hosts that bring their own). */
export function setLevelResultsStore(store: any): void;
export class FileLevelResultsStore {
    constructor(file?: null);
    file: any;
    path(): any;
    append(record: any): Promise<void>;
    read(): Promise<{
        records: any[];
        skipped: number;
    }>;
}
export class MemoryLevelResultsStore {
    records: any[];
    append(record: any): Promise<void>;
    read(): Promise<{
        records: any[];
        skipped: number;
    }>;
}
//# sourceMappingURL=level-results-store.d.ts.map