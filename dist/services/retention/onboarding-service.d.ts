/**
 * Get (or initialize) the onboarding state for a player.
 */
export function getOnboardingState(economy: any): any;
/**
 * Check if a player is still in onboarding (hasn't completed all stages).
 */
export function isOnboardingComplete(onboarding: any): any;
/**
 * Get the current tutorial stage for a player, or null if onboarding is complete.
 */
export function getCurrentStage(onboarding: any): {
    id: string;
    name: string;
    level: number;
    hint: string;
    reward: {
        coins: number;
        xp: number;
        stars?: never;
    };
    requiredAction: string;
} | {
    id: string;
    name: string;
    level: number;
    hint: string;
    reward: {
        coins: number;
        stars: number;
        xp: number;
    };
    requiredAction: string;
} | null | undefined;
/**
 * Get the hint for the current stage, if the player hasn't seen it yet.
 * Returns null if no hint should be shown (already seen or onboarding complete).
 */
export function getTutorialHint(onboarding: any, nowMs?: number): {
    stageId: string;
    hint: string;
    level: number;
    reward: {
        coins: number;
        xp: number;
        stars?: never;
    } | {
        coins: number;
        stars: number;
        xp: number;
    };
} | null;
/**
 * Mark a tutorial hint as seen for the current stage.
 */
export function markHintSeen(onboarding: any, stageId: any, nowMs?: number): void;
/**
 * Complete a tutorial stage. Awards the stage reward and advances to the next stage.
 * Returns { completed, stage, reward, nextStage, onboardingComplete }.
 */
export function completeStage(onboarding: any, stageId: any, economy: any, accountEconomy: any, nowMs?: number): Promise<{
    completed: boolean;
    stage: {
        id: string;
        name: string;
        level: number;
        hint: string;
        reward: {
            coins: number;
            xp: number;
            stars?: never;
        };
        requiredAction: string;
    } | {
        id: string;
        name: string;
        level: number;
        hint: string;
        reward: {
            coins: number;
            stars: number;
            xp: number;
        };
        requiredAction: string;
    };
    reward: null;
    nextStage: null;
    onboardingComplete: any;
} | {
    completed: boolean;
    stage: {
        id: string;
        name: string;
        level: number;
        hint: string;
        reward: {
            coins: number;
            xp: number;
            stars?: never;
        };
        requiredAction: string;
    } | {
        id: string;
        name: string;
        level: number;
        hint: string;
        reward: {
            coins: number;
            stars: number;
            xp: number;
        };
        requiredAction: string;
    };
    reward: {
        coins: number;
        xp: number;
        stars?: never;
    } | {
        coins: number;
        stars: number;
        xp: number;
    };
    nextStage: {
        id: string;
        name: string;
        level: number;
        hint: string;
        reward: {
            coins: number;
            xp: number;
            stars?: never;
        };
        requiredAction: string;
    } | {
        id: string;
        name: string;
        level: number;
        hint: string;
        reward: {
            coins: number;
            stars: number;
            xp: number;
        };
        requiredAction: string;
    } | null | undefined;
    onboardingComplete: any;
}>;
/**
 * Get onboarding quests - daily-style quests specific to new players.
 */
export function getOnboardingQuests(onboarding: any): ({
    id: string;
    name: string;
    description: string;
    progress: number;
    maxProgress: number;
    reward: {
        coins: number;
        stars?: never;
    };
    completed: any;
} | {
    id: string;
    name: string;
    description: string;
    progress: any;
    maxProgress: number;
    reward: {
        stars: number;
        coins?: never;
    };
    completed: any;
})[];
/**
 * Check if a player qualifies for the "first win guaranteed" boost.
 * Level 1 boards are always certified winnable; this service marks them as tutorial levels.
 */
export function isTutorialLevel(levelNumber: any): boolean;
declare namespace _default {
    export { getOnboardingState };
    export { isOnboardingComplete };
    export { getCurrentStage };
    export { getTutorialHint };
    export { markHintSeen };
    export { completeStage };
    export { getOnboardingQuests };
    export { isTutorialLevel };
    export { defaultOnboardingState };
    export { TUTORIAL_STAGES };
}
export default _default;
/**
 * Default onboarding state for a new player.
 */
declare function defaultOnboardingState(): {
    completed: boolean;
    currentStage: number;
    completedStages: never[];
    firstWinAt: null;
    tutorialHintsSeen: never[];
    onboardingQuestsCompleted: number;
    totalOnboardingReward: {
        coins: number;
        stars: number;
        xp: number;
    };
    lastHintAt: null;
};
/**
 * Onboarding tutorial stages. Each stage unlocks the next when completed.
 */
declare const TUTORIAL_STAGES: ({
    id: string;
    name: string;
    level: number;
    hint: string;
    reward: {
        coins: number;
        xp: number;
        stars?: never;
    };
    requiredAction: string;
} | {
    id: string;
    name: string;
    level: number;
    hint: string;
    reward: {
        coins: number;
        stars: number;
        xp: number;
    };
    requiredAction: string;
})[];
//# sourceMappingURL=onboarding-service.d.ts.map