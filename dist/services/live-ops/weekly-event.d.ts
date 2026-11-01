/** Validate scheduled or archived weeks. Archived definitions are for read-only claim retries only. */
export function validateWeeklyEvents(entries: any, { archive, nowMs }?: {
    archive?: boolean | undefined;
    nowMs?: number | undefined;
}): {
    errors: string[];
    events: any[];
};
/** Reject reused IDs and out-of-order archives, including when one list is empty. */
export function validateWeeklyCalendar(schedule: any, archive: any, nowMs?: number): {
    errors: string[];
    events: any[];
    archive: any[];
};
export function validateWeeklyRotation(previous: any, candidate: any, nowMs?: number): string[];
export function weeklyDisabled(): boolean;
export function activeWeeklyEvent(config: any, nowMs?: number): any;
export function visibleWeeklyEvent(config: any, nowMs?: number): any;
export function weeklyView(event: any, economy?: null, nowMs?: number): {
    id: any;
    name: any;
    description: any;
    startsAt: string;
    endsAt: string;
    status: string;
    wins: any;
    milestones: any;
} | null;
/** Called inside the paid completion's lock and save, exactly once per verified attempt. */
export function recordWeeklyWin(economy: any, config: any, nowMs?: number): {
    eventId: any;
    wins: any;
} | null;
/** Check all rules before mutating. Caller holds the economy lock and saves once. */
export function claimWeeklyMilestone(economy: any, config: any, eventId: any, goal: any, nowMs?: number): {
    duplicate: boolean;
    coins: any;
    balance: any;
};
export class WeeklyEventError extends Error {
    constructor(code: any);
    code: any;
}
//# sourceMappingURL=weekly-event.d.ts.map