/**
 * Brings lives up to date for the time that has passed since the last regen.
 * Mutates and returns the lives currency object.
 *
 * @param {Object} lives - { amount, maxAmount, regenRate, lastRegen }
 * @param {number} nowMs - current time in ms
 * @returns {Object} the mutated lives object
 */
export function regenerateLives(lives: Object, nowMs: number): Object;
/**
 * Milliseconds until the next life regenerates, or null when lives are full.
 */
export function nextRegenInMs(lives: any, nowMs: any): number | null;
/**
 * Spends one life for a level attempt. Returns { success, livesRemaining }
 * or { success: false, reason } if no lives are available.
 */
export function spendLife(lives: any): {
    success: boolean;
    reason: string;
    livesRemaining?: never;
} | {
    success: boolean;
    livesRemaining: any;
    reason?: never;
};
/**
 * Grants purchased lives to a player, capped at max.
 * Returns { success, livesAdded, livesRemaining }.
 */
export function grantLives(lives: any, amount: any): {
    success: boolean;
    livesAdded: number;
    livesRemaining: any;
};
/** Cost in lives to start a level attempt. */
export const LIFE_COST_PER_ATTEMPT: 1;
/** Cost in coins to buy one life instantly. */
export const COST_COINS_PER_LIFE: 50;
/** Maximum lives a player can hold. */
export const MAX_LIVES: 5;
/** Lives regenerate one per this many minutes. */
export const LIFE_REGEN_MINUTES: 30;
/** How long a failed attempt can be completed before it expires. */
export const ATTEMPT_MAX_AGE_MS: number;
declare namespace _default {
    export { LIFE_COST_PER_ATTEMPT };
    export { COST_COINS_PER_LIFE };
    export { MAX_LIVES };
    export { LIFE_REGEN_MINUTES };
    export { regenerateLives };
    export { nextRegenInMs };
    export { spendLife };
    export { grantLives };
}
export default _default;
//# sourceMappingURL=lives.d.ts.map