/**
 * Optional scheduled review. Off unless LEVEL_TUNING_INTERVAL_HOURS is set to 1 or more.
 * Never auto-apply a proposal from client-reported legacy data: an operator must review
 * a single level and explicitly approve its change.
 */

import { runTuning } from './level-tuning.js';
import { levelResultsStore } from './level-results-store.js';

/** The interval in ms from the environment, or 0 when scheduled tuning is off. */
export function tuningIntervalMs(env = process.env) {
  const raw = env.LEVEL_TUNING_INTERVAL_HOURS;
  if (raw === undefined || raw === '') return 0;
  const hours = Number(raw);
  if (!Number.isFinite(hours) || hours < 1) return 0;
  return hours * 3_600_000;
}

/**
 * Starts the schedule and returns the timer, or null when it is off. The timer does not keep the
 * process alive. `logger` needs info and error methods.
 */
/**
 * @param {{ intervalMs?: number, store?: object, file?: string, logger?: { info: (...a: any[]) => void, error: (...a: any[]) => void } }} [options]
 */
export function startTuningSchedule({
  intervalMs = tuningIntervalMs(),
  store = levelResultsStore(),
  file,
  logger,
} = {}) {
  if (!intervalMs) return null;
  const tick = async () => {
    try {
      const result = await runTuning({ store, file, apply: false });
      if (result.proposals.length) logger?.info('Tuning review suggested; no target changed', { changes: result.proposals });
    } catch (error) {
      logger?.error('Scheduled tuning failed', { error: error.message });
    }
  };
  const timer = setInterval(tick, intervalMs);
  timer.unref?.();
  return timer;
}
