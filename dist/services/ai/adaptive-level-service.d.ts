/**
 * AdaptiveLevelService - generates AI-tuned levels per player.
 * Uses a composite cache key (playerId:level:mode) with LRU eviction
 * and bounded profile storage.
 */
export class AdaptiveLevelService {
    constructor(personalizationEngine?: null);
    logger: Logger;
    personalizationEngine: AIPersonalizationEngine;
    playerProfiles: Map<any, any>;
    difficultyCache: Map<any, any>;
    cacheTtlMs: number;
    maxCacheSize: number;
    maxProfiles: number;
    profileAccessOrder: any[];
    /**
     * Build a composite cache key to avoid cross-level/mode collisions.
     */
    _cacheKey(playerId: any, levelNumber: any, mode: any): string;
    /**
     * Evict expired cache entries and enforce max size (LRU).
     */
    _evictCache(): void;
    /**
     * Evict stale player profiles to prevent memory leaks.
     */
    _evictProfiles(): void;
    /**
     * Record the outcome of a completed level attempt for skill tracking.
     * Call this after every settleLevelAttempt.
     */
    recordAttempt(playerId: any, { level, stars, moves, timeMs, boosterUsed, won }: {
        level: any;
        stars: any;
        moves: any;
        timeMs: any;
        boosterUsed: any;
        won: any;
    }): void;
    /**
     * Get or create the skill profile for a player.
     */
    getSkillProfile(playerId: any): any;
    /**
     * Generate an AI-adaptive level for a player. The difficulty parameters
     * (target score, move budget, color count, obstacle density) are tuned
     * to the player's measured skill score.
     *
     * context - player location/time/weather context (from localLevelContext)
     * levelNumber - the level number to generate
     * mode - 'classic' | 'daily' | 'timed' | 'endless'
     */
    generateAdaptiveLevel(playerId: any, { levelNumber, mode, context, nowMs }?: {
        levelNumber?: number | undefined;
        mode?: string | undefined;
        context?: null | undefined;
        nowMs?: number | undefined;
    }): Promise<any>;
    /**
     * Apply difficulty tuning to a generated level definition.
     * Adjusts target score, move budget, and color count based on bias.
     */
    applyDifficultyTuning(definition: any, bias: any, skillScore: any): any;
    /**
     * Get the difficulty tier name for display.
     */
    getDifficultyTier(skillScore: any): "gentle" | "steady" | "challenging" | "expert" | "beginner";
    /**
     * Clear all cached data (useful for testing or memory pressure).
     */
    clearCache(): void;
}
export default AdaptiveLevelService;
import { Logger } from '../../core/logger/index.js';
import { AIPersonalizationEngine } from '../ai-personalization-engine.js';
//# sourceMappingURL=adaptive-level-service.d.ts.map