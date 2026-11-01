/**
 * Lives system.
 *
 * Lives are spent when a player fails a level attempt. They regenerate over
 * time independently of energy (which is spent to start an attempt). When lives
 * reach zero, the player cannot attempt levels until they regenerate or are
 * purchased with coins.
 *
 * These are pure functions. The economy service calls them under its player lock.
 */
const MINUTE_MS = 60_000;
/** Cost in lives to start a level attempt. */
export const LIFE_COST_PER_ATTEMPT = 1;
/** Cost in coins to buy one life instantly. */
export const COST_COINS_PER_LIFE = 50;
/** Maximum lives a player can hold. */
export const MAX_LIVES = 5;
/** Lives regenerate one per this many minutes. */
export const LIFE_REGEN_MINUTES = 30;
/** How long a failed attempt can be completed before it expires. */
export const ATTEMPT_MAX_AGE_MS = 3 * 60 * MINUTE_MS;
/**
 * Brings lives up to date for the time that has passed since the last regen.
 * Mutates and returns the lives currency object.
 *
 * @param {Object} lives - { amount, maxAmount, regenRate, lastRegen }
 * @param {number} nowMs - current time in ms
 * @returns {Object} the mutated lives object
 */
export function regenerateLives(lives, nowMs) {
    const max = lives.maxAmount ?? MAX_LIVES;
    if (lives.amount >= max) {
        lives.lastRegen = nowMs;
        return lives;
    }
    if (!Number.isFinite(lives.lastRegen)) {
        lives.lastRegen = nowMs;
        return lives;
    }
    const regenRate = lives.regenRate ?? 1;
    const minutesPassed = Math.floor((nowMs - lives.lastRegen) / MINUTE_MS);
    if (minutesPassed > 0 && regenRate > 0) {
        const livesToAdd = Math.floor((minutesPassed * regenRate) / LIFE_REGEN_MINUTES);
        if (livesToAdd > 0) {
            lives.amount = Math.min(max, lives.amount + livesToAdd);
            const minutesConsumed = Math.floor((livesToAdd * LIFE_REGEN_MINUTES) / regenRate);
            lives.lastRegen =
                lives.amount >= max ? nowMs : lives.lastRegen + minutesConsumed * MINUTE_MS;
        }
    }
    return lives;
}
/**
 * Milliseconds until the next life regenerates, or null when lives are full.
 */
export function nextRegenInMs(lives, nowMs) {
    const max = lives.maxAmount ?? MAX_LIVES;
    if (lives.amount >= max)
        return null;
    const regenRate = lives.regenRate ?? 1;
    if (!Number.isFinite(lives.lastRegen))
        return MINUTE_MS;
    const minutesSinceRegen = (nowMs - lives.lastRegen) / MINUTE_MS;
    const minutesNeeded = LIFE_REGEN_MINUTES / regenRate;
    const minutesLeft = minutesNeeded - minutesSinceRegen;
    if (minutesLeft <= 0)
        return 0;
    return minutesLeft * MINUTE_MS;
}
/**
 * Spends one life for a level attempt. Returns { success, livesRemaining }
 * or { success: false, reason } if no lives are available.
 */
export function spendLife(lives) {
    const max = lives.maxAmount ?? MAX_LIVES;
    if (lives.amount <= 0) {
        return { success: false, reason: 'no_lives' };
    }
    lives.amount = Math.max(0, lives.amount - 1);
    return { success: true, livesRemaining: lives.amount };
}
/**
 * Grants purchased lives to a player, capped at max.
 * Returns { success, livesAdded, livesRemaining }.
 */
export function grantLives(lives, amount) {
    const max = lives.maxAmount ?? MAX_LIVES;
    const room = max - lives.amount;
    const livesAdded = Math.min(amount, room);
    lives.amount += livesAdded;
    return { success: true, livesAdded, livesRemaining: lives.amount };
}
export default {
    LIFE_COST_PER_ATTEMPT,
    COST_COINS_PER_LIFE,
    MAX_LIVES,
    LIFE_REGEN_MINUTES,
    regenerateLives,
    nextRegenInMs,
    spendLife,
    grantLives,
};
//# sourceMappingURL=lives.js.map