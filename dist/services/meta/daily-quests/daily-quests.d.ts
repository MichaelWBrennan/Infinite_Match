/** Start of the current UTC day. */
export function todayStartMs(nowMs?: number): number;
/** Start of the next UTC day. */
export function tomorrowStartMs(nowMs?: number): number;
/**
 * Returns all quest definitions.
 */
export function getQuestDefinitions(): readonly {
    id: string;
    label: string;
    type: string;
    target: number;
    reward: {
        coins: number;
        xp: number;
    };
    description: string;
}[];
/**
 * Returns the quest definition for an id, or null.
 */
export function getQuestDefinition(questId: any): {
    id: string;
    label: string;
    type: string;
    target: number;
    reward: {
        coins: number;
        xp: number;
    };
    description: string;
} | null;
/**
 * Initializes a player's daily quests state for today.
 * Returns { quests: [], dayStartMs }.
 */
export function initializeDailyQuests(existing?: null, nowMs?: number): {
    quests: {
        id: string;
        type: string;
        target: number;
        progress: number;
        claimed: boolean;
        reward: {
            coins: number;
            xp: number;
        };
    }[];
    dayStartMs: number;
};
/**
 * Returns true if the player can claim the quest (progress >= target and not claimed).
 */
export function canClaimQuest(quest: any): boolean;
/**
 * Updates quest progress for a player. Returns the updated quests array.
 * `event` is one of: 'level_played', 'level_won', 'stars_earned', 'booster_used', 'coins_earned'.
 * `amount` is the amount to add (e.g., stars earned, coins earned).
 */
export function updateQuestProgress(quests: any, event: any, amount?: number, nowMs?: number): any;
/**
 * Claims a quest reward. Returns { success, reward } or { success: false, reason }.
 */
export function claimQuest(quests: any, questId: any, nowMs?: number): {
    success: boolean;
    reason: string;
    reward?: never;
    quests?: never;
} | {
    success: boolean;
    reward: any;
    quests: any;
    reason?: never;
};
/**
 * Returns quests that are claimable (complete but not claimed).
 */
export function getClaimableQuests(quests: any): any;
declare namespace _default {
    export { getQuestDefinitions };
    export { getQuestDefinition };
    export { initializeDailyQuests };
    export { updateQuestProgress };
    export { claimQuest };
    export { getClaimableQuests };
    export { todayStartMs };
    export { tomorrowStartMs };
}
export default _default;
//# sourceMappingURL=daily-quests.d.ts.map