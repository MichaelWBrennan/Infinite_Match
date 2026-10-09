/**
 * Energy is spent to start an attempt at a level and regenerates over time.
 * The cap and the regeneration rate (points per minute) come from the economy's energy currency.
 * These are pure functions. The economy service calls them under its player lock.
 */

export const ATTEMPT_ENERGY_COST = 1;
const MINUTE_MS = 60_000;
/** A spent attempt can be completed for this long. After that the win is refused. */
export const ATTEMPT_MAX_AGE_MS = 3 * 60 * MINUTE_MS;

/**
 * Brings energy up to date for the time that has passed since it last regenerated.
 * Partial minutes keep their progress. At the cap, regeneration restarts from now.
 * Mutates and returns the energy currency.
 */
export function regenerateEnergy(energy, nowMs) {
  const max = energy.maxAmount;
  if (energy.amount >= max) {
    energy.lastRegen = nowMs;
    return energy;
  }
  if (!Number.isFinite(energy.lastRegen)) {
    energy.lastRegen = nowMs;
    return energy;
  }
  const minutes = Math.floor((nowMs - energy.lastRegen) / MINUTE_MS);
  if (minutes > 0 && energy.regenRate > 0) {
    energy.amount = Math.min(max, energy.amount + minutes * energy.regenRate);
    energy.lastRegen = energy.amount >= max ? nowMs : energy.lastRegen + minutes * MINUTE_MS;
  }
  return energy;
}

/** Milliseconds until the next point regenerates, or null when energy is full or does not regenerate. */
export function nextRegenInMs(energy, nowMs) {
  if (energy.amount >= energy.maxAmount || !(energy.regenRate > 0)) return null;
  if (!Number.isFinite(energy.lastRegen)) return MINUTE_MS;
  return MINUTE_MS - ((nowMs - energy.lastRegen) % MINUTE_MS);
}
