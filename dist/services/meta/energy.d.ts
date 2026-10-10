/**
 * Brings energy up to date for the time that has passed since it last regenerated.
 * Partial minutes keep their progress. At the cap, regeneration restarts from now.
 * Mutates and returns the energy currency.
 */
export function regenerateEnergy(energy: any, nowMs: any): any;
/** Milliseconds until the next point regenerates, or null when energy is full or does not regenerate. */
export function nextRegenInMs(energy: any, nowMs: any): number | null;
/**
 * Energy is spent to start an attempt at a level and regenerates over time.
 * The cap and the regeneration rate (points per minute) come from the economy's energy currency.
 * These are pure functions. The economy service calls them under its player lock.
 */
export const ATTEMPT_ENERGY_COST: 1;
/** A spent attempt can be completed for this long. After that the win is refused. */
export const ATTEMPT_MAX_AGE_MS: number;
//# sourceMappingURL=energy.d.ts.map