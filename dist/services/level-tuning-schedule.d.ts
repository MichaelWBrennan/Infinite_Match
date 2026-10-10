/** The interval in ms from the environment, or 0 when scheduled tuning is off. */
export function tuningIntervalMs(env?: NodeJS.ProcessEnv): number;
/**
 * Starts the schedule and returns the timer, or null when it is off. The timer does not keep the
 * process alive. `logger` needs info and error methods.
 */
/**
 * @param {{ intervalMs?: number, store?: object, file?: string, logger?: { info: (...a: any[]) => void, error: (...a: any[]) => void } }} [options]
 */
export function startTuningSchedule({ intervalMs, store, file, logger, }?: {
    intervalMs?: number;
    store?: object;
    file?: string;
    logger?: {
        info: (...a: any[]) => void;
        error: (...a: any[]) => void;
    };
}): NodeJS.Timeout | null;
//# sourceMappingURL=level-tuning-schedule.d.ts.map