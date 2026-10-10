export function levelOverridesPath(): string;
/** Checks a raw overrides file. Returns { errors, levels } with levels as numbers. */
export function validateOverrides(raw: any): {
    errors: string[];
    levels: {};
};
/**
 * Moves each flagged level one step toward balance. `summary` is summarizeLevelResults() output;
 * `current` is the levels map. Returns the proposals; nothing is changed here.
 */
export function proposeOverrides(summary: any, current?: {}): {
    level: any;
    flag: any;
    winRate: any;
    attempts: any;
    from: number;
    to: number;
}[];
/** The levels map after the proposals are applied. Multipliers of 1 are dropped. */
export function applyProposals(current: any, proposals: any): any;
/**
 * When each level was last moved by the tuning job (ms since the epoch). Only results after that
 * time count toward the next move, so one flagged level is not pushed again by the same data.
 */
export function parseTuned(raw: any): {};
/** Reads the overrides, cached until the file changes. A missing or invalid file means none. */
export function readLevelOverrides(file?: string): Readonly<{
    levels: Readonly<{}>;
    updatedAt: null;
    tuned: Readonly<{}>;
}>;
/** The tuning multiplier for one level. 1 when there is no override. */
export function levelMultiplier(level: any, overrides?: Readonly<{
    levels: Readonly<{}>;
    updatedAt: null;
    tuned: Readonly<{}>;
}>): any;
/** Writes the levels map and the tuning times atomically. */
export function writeLevelOverrides(levels: any, file?: string, now?: Date, tuned?: {}): {
    updatedAt: string;
    levels: any;
    tuned: {};
};
export const MULTIPLIER_MIN: 0.8;
export const MULTIPLIER_MAX: 1.2;
export const TUNING_STEP: 0.05;
//# sourceMappingURL=level-overrides.d.ts.map