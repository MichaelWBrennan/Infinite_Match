/**
 * InfiniteModeService - tracks endless gameplay with no level cap.
 */
export class InfiniteModeService {
    constructor(personalizationEngine?: null, eventGenerator?: null);
    logger: Logger;
    personalizationEngine: AIPersonalizationEngine;
    eventGenerator: EventGeneratorService;
    playerState: Map<any, any>;
    perpetualEvents: any[];
    endlessLeaderboard: any[];
    leaderboardCache: {
        leaderboard: {
            rank: number;
            playerId: any;
            score: any;
            level: any;
            at: any;
        }[];
        generatedAt: number;
    } | null;
    maxPlayers: number;
    playerTtlMs: number;
    /**
     * Evict stale player states and enforce max count.
     */
    _evictPlayers({ nowMs }?: {
        nowMs?: number | undefined;
    }): void;
    /**
     * Get or create a player's infinite mode state.
     */
    getPlayerState(playerId: any): any;
    createInitialState(playerId: any, nowMs?: number): {
        playerId: any;
        endlessLevel: number;
        totalEndlessLevels: number;
        totalEndlessXP: number;
        paragonLevel: number;
        paragonXP: number;
        prestige: number;
        prestigePoints: number;
        currentStreak: number;
        bestStreak: number;
        streakRewardsClaimed: Set<any>;
        runsCompleted: number;
        bestRunScore: number;
        bestRunLevel: number;
        totalCoinsEarned: number;
        totalTimePlayedMs: number;
        lastRunAt: null;
        lastAccessedMs: number;
        createdAt: number;
    };
    getParagonTier(paragonLevel: any): {
        name: string;
        xp: number;
        multiplier: number;
    } | undefined;
    xpForParagonLevel(level: any): number;
    /**
     * Get prestige tier for current prestige.
     */
    getPrestigeTier(prestige: any): {
        name: string;
        requiredLevel: number;
        coinBonus: number;
        xpBonus: number;
    } | undefined;
    /**
     * Generate the next endless level for a player.
     * Difficulty escalates with level number - no cap.
     *
     * context - player location/time/weather context
     * nowMs - reference time
     */
    generateEndlessLevel(playerId: any, { context, nowMs }?: {
        context?: null | undefined;
        nowMs?: number | undefined;
    }): Promise<{
        endlessMode: boolean;
        endlessLevel: any;
        playerId: any;
        generatedAt: number;
        paragonMultiplier: number;
        prestigeBonus: number;
        streak: any;
        noLevelCap: boolean;
        difficulty: string | undefined;
        theme: any;
        context: any;
        quality: {
            verifiedFrosting?: any;
            verifiedMarmalade?: any;
            verifiedLiquorice?: any;
            verifiedChocolate?: any;
            verifiedJelly?: any;
            verifiedLockedGems?: any;
            verifiedBlockers?: any;
            verifiedShields?: any;
            verifiedCollected?: any;
            verifiedObjectives?: boolean;
            initialMatches: number;
            legalOpeningMoves: number;
            verifiedWithoutBoosters: boolean;
            verifiedMoves: number;
            verifiedScore: number;
        };
        objectiveProfile?: any;
        environmentKey: string;
        level: any;
        mode: string;
        isDaily: boolean;
        isBoss: boolean;
        seed: number;
        refillState: number;
        boardSize: number;
        board: any[][];
        gemTypes: any[];
        gemWeights: any;
        targetScore: number;
        moves: number;
        timeLimit: number;
        objectives: {
            type: string;
            target: any;
        }[] | {
            type: string;
            target: number;
        }[];
        frosting?: any[][] | null;
        marmalade?: any[][] | null;
        liquorice?: any[][] | null;
        chocolate?: any[][] | null;
        jelly?: any[][] | null;
        lockedGems?: any[][] | null;
        blockers?: any[][] | null;
        shields?: number[][] | null;
        specials?: any[][];
        id: string;
        generatorVersion: number;
    }>;
    /**
     * Calculate the difficulty multiplier for an endless level.
     * Escalates forever: 1.0 + (level-1) * 0.05, capped at 10x.
     */
    endlessDifficultyMultiplier(levelNumber: any): number;
    /**
     * Complete an endless run. Server-authoritative: verifies the score,
     * awards XP/coins, updates paragon/prestige, and updates streaks.
     *
     * replay - the verified replay result from attempt-replay.js
     * score - the final run score
     * levelReached - the endless level reached
     * movesMade - total moves in the run
     * timeMs - run duration
     */
    completeEndlessRun(playerId: any, { score, levelReached, movesMade, timeMs, verified, nowMs, }?: {
        verified?: boolean | undefined;
        nowMs?: number | undefined;
    }): Promise<{
        success: boolean;
        playerId: any;
        run: {
            score: any;
            levelReached: any;
            movesMade: any;
            timeMs: any;
            verified: boolean;
        };
        rewards: {
            xpEarned: number;
            coinsEarned: number;
            paragonLevelsGained: number;
            newParagonLevel: any;
            newParagonXP: any;
            nextParagonXP: number;
        };
        progression: {
            endlessLevel: any;
            prestige: any;
            prestigePoints: any;
            currentStreak: any;
            bestStreak: any;
            prestiged: boolean;
            noLevelCap: boolean;
        };
        streakRewards: {
            milestone: number;
            coins: number;
            xp: number;
            bonus: string;
        }[];
    } | {
        success: boolean;
        error: string;
    }>;
    /**
     * Check if player can prestige (reached a prestige tier level).
     */
    checkPrestigeAvailable(state: any): boolean;
    /**
     * Check streak milestone rewards.
     */
    checkStreakRewards(state: any): {
        milestone: number;
        coins: number;
        xp: number;
        bonus: string;
    }[];
    /**
     * Initialize perpetual events that rotate forever.
     */
    initializePerpetualEvents(): void;
    /**
     * Get active perpetual events at nowMs.
     * Generates new events on-demand so the rotation never ends.
     * Bounded to MAX_PERPETUAL_EVENTS to prevent memory leaks.
     */
    getPerpetualEvents({ nowMs, count }?: {
        nowMs?: number | undefined;
        count?: number | undefined;
    }): Promise<any[]>;
    /**
     * Update the global endless leaderboard.
     * Maintains sorted order for O(1) reads.
     */
    updateLeaderboard(playerId: any, score: any, levelReached: any, nowMs: any): void;
    /**
     * Get the endless leaderboard.
     * Cached for LEADERBOARD_CACHE_TTL_MS.
     */
    getLeaderboard({ limit }?: {
        limit?: number | undefined;
    }): {
        rank: number;
        playerId: any;
        score: any;
        level: any;
        at: any;
    }[];
    /**
     * Get a player's infinite mode summary.
     */
    getPlayerSummary(playerId: any): {
        playerId: any;
        endlessLevel: any;
        totalEndlessLevels: any;
        paragonLevel: any;
        paragonXP: any;
        nextParagonXP: number;
        paragonTier: {
            name: string;
            xp: number;
            multiplier: number;
        } | undefined;
        prestige: any;
        prestigeTier: {
            name: string;
            requiredLevel: number;
            coinBonus: number;
            xpBonus: number;
        } | undefined;
        prestigePoints: any;
        currentStreak: any;
        bestStreak: any;
        runsCompleted: any;
        bestRunScore: any;
        bestRunLevel: any;
        totalCoinsEarned: any;
        totalTimePlayedMs: any;
        lastRunAt: any;
        noLevelCap: boolean;
        createdAt: any;
    };
    /**
     * Reset all state (for testing).
     */
    resetForTesting(): void;
}
export const infiniteModeService: InfiniteModeService;
export default InfiniteModeService;
import { Logger } from '../../core/logger/index.js';
import { AIPersonalizationEngine } from '../ai-personalization-engine.js';
import { EventGeneratorService } from '../ai/event-generator-service.js';
//# sourceMappingURL=infinite-mode-service.d.ts.map