/**
 * Returns the trigger definition for a type, or null.
 */
export function getTrigger(type: any): any;
/**
 * Returns all trigger definitions (without evaluate functions, for client exposure).
 */
export function getAllTriggers(): {
    [k: string]: {
        type: string;
        title: string;
        body: string;
        cooldownMs: number;
    };
};
/**
 * Evaluates all applicable triggers for a given event context and sends
 * notifications for those that should fire. Returns the list of sent triggers.
 *
 * context must include: playerId
 * Optional context fields depend on the trigger being evaluated:
 *   economy, season, tournament, newLevels, offer, sender, giftType, giftId, nowMs
 */
export function evaluateTriggers(context: any): Promise<{
    type: string;
    title: string;
    body: string;
}[]>;
/**
 * Send a specific named trigger to a player (e.g. after a gift is received).
 * Bypasses the generic evaluate loop and uses the trigger's template directly.
 */
export function sendTrigger(playerId: any, type: any, templateVars?: {}): Promise<{
    sent: boolean;
    title: any;
    body: any;
    reason?: never;
} | {
    sent: boolean;
    reason: any;
    title?: never;
    body?: never;
}>;
declare namespace _default {
    export { getTrigger };
    export { getAllTriggers };
    export { evaluateTriggers };
    export { sendTrigger };
    export { setEnabled };
    export { isEnabled };
    export { getAll };
}
export default _default;
export function setEnabled(playerId: any, triggerType: any, enabled: any): void;
export function isEnabled(playerId: any, triggerType: any): any;
export function getAll(playerId: any): {
    energy_full: any;
    streak_reminder: any;
    battle_pass_ending: any;
    tournament_starting: any;
    comeback: any;
    new_level: any;
    limited_offer: any;
    gift_received: any;
};
//# sourceMappingURL=push-triggers.d.ts.map