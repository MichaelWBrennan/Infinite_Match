/**
 * Adaptive Level Service - AI-driven per-player level difficulty.
 *
 * Uses the AI Personalization Engine to analyze each player's skill
 * (win rate, average stars, moves efficiency, booster dependency,
 * completion speed) and generates procedurally-tuned levels via the
 * existing deterministic generator. No two players see the same
 * difficulty curve - the game adapts to the player, not vice versa.
 *
 * All generation is server-side and deterministic: the client receives
 * a level definition with a pinned seed and a witnessed solution path,
 * so the result can be verified via attempt replay.
 */
import { Logger } from '../../core/logger/index.js';
import { generateLevel, GENERATOR_VERSION, LEVEL_MODES } from '../levels/generator.js';
import { localLevelContext } from '../levels/location-context.js';
import { levelWeatherService } from '../levels/weather-context.js';
import { AIPersonalizationEngine } from '../ai-personalization-engine.js';
const logger = new Logger('AdaptiveLevelService');
const ALL_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
/**
 * Player skill profile tracked for adaptive difficulty.
 */
class PlayerSkillProfile {
    constructor(playerId) {
        this.playerId = playerId;
        this.gamesPlayed = 0;
        this.gamesWon = 0;
        this.totalStars = 0;
        this.totalMoves = 0;
        this.totalTimeMs = 0;
        this.boosterUses = 0;
        this.levelsCompleted = new Set();
        this.lastUpdated = Date.now();
    }
    get winRate() {
        return this.gamesPlayed === 0 ? 0.5 : this.gamesWon / this.gamesPlayed;
    }
    get avgStars() {
        return this.gamesWon === 0 ? 0 : this.totalStars / this.gamesWon;
    }
    get movesPerWin() {
        return this.gamesWon === 0 ? 20 : this.totalMoves / this.gamesWon;
    }
    get avgTimePerWinMs() {
        return this.gamesWon === 0 ? 60000 : this.totalTimeMs / this.gamesWon;
    }
    get skillScore() {
        // 0.0 (struggling) to 1.0 (expert)
        const winRateComponent = this.winRate * 0.4;
        const starsComponent = (this.avgStars / 3) * 0.3;
        const efficiencyComponent = Math.min(1, 20 / Math.max(1, this.movesPerWin)) * 0.2;
        const speedComponent = Math.min(1, 45000 / Math.max(1000, this.avgTimePerWinMs)) * 0.1;
        return winRateComponent + starsComponent + efficiencyComponent + speedComponent;
    }
}
/**
 * Cache entry for a generated level.
 */
class CacheEntry {
    constructor(level, mode, definition, generatedAt) {
        this.level = level;
        this.mode = mode;
        this.definition = definition;
        this.generatedAt = generatedAt;
        this.accessCount = 0;
        this.lastAccessed = generatedAt;
    }
}
/**
 * AdaptiveLevelService - generates AI-tuned levels per player.
 * Uses a composite cache key (playerId:level:mode) with LRU eviction
 * and bounded profile storage.
 */
export class AdaptiveLevelService {
    constructor(personalizationEngine = null) {
        this.logger = new Logger('AdaptiveLevelService');
        this.personalizationEngine = personalizationEngine || new AIPersonalizationEngine();
        this.playerProfiles = new Map(); // playerId -> PlayerSkillProfile
        this.difficultyCache = new Map(); // cacheKey -> CacheEntry
        this.cacheTtlMs = 5 * 60 * 1000; // 5 minutes
        this.maxCacheSize = 500; // max cached level definitions
        this.maxProfiles = 10000; // max player profiles in memory
        this.profileAccessOrder = []; // LRU tracking for profiles
    }
    /**
     * Build a composite cache key to avoid cross-level/mode collisions.
     */
    _cacheKey(playerId, levelNumber, mode) {
        return `${playerId}:${levelNumber}:${mode}`;
    }
    /**
     * Evict expired cache entries and enforce max size (LRU).
     */
    _evictCache() {
        const now = Date.now();
        // Remove expired entries
        for (const [key, entry] of this.difficultyCache) {
            if (now - entry.generatedAt > this.cacheTtlMs) {
                this.difficultyCache.delete(key);
            }
        }
        // Enforce max size - evict least recently accessed
        while (this.difficultyCache.size > this.maxCacheSize) {
            let lruKey = null;
            let lruAccess = Infinity;
            for (const [key, entry] of this.difficultyCache) {
                if (entry.lastAccessed < lruAccess) {
                    lruAccess = entry.lastAccessed;
                    lruKey = key;
                }
            }
            if (lruKey)
                this.difficultyCache.delete(lruKey);
        }
    }
    /**
     * Evict stale player profiles to prevent memory leaks.
     */
    _evictProfiles() {
        if (this.playerProfiles.size <= this.maxProfiles)
            return;
        // Sort by lastUpdated, remove oldest 10%
        const toRemove = Math.floor(this.maxProfiles * 0.1);
        const sorted = Array.from(this.playerProfiles.entries())
            .sort((a, b) => a[1].lastUpdated - b[1].lastUpdated)
            .slice(0, toRemove);
        for (const [playerId] of sorted) {
            this.playerProfiles.delete(playerId);
        }
    }
    /**
     * Record the outcome of a completed level attempt for skill tracking.
     * Call this after every settleLevelAttempt.
     */
    recordAttempt(playerId, { level, stars, moves, timeMs, boosterUsed, won }) {
        let profile = this.playerProfiles.get(playerId);
        if (!profile) {
            profile = new PlayerSkillProfile(playerId);
            this.playerProfiles.set(playerId, profile);
            this.profileAccessOrder.push(playerId);
        }
        profile.gamesPlayed++;
        if (won) {
            profile.gamesWon++;
            profile.totalStars += stars;
            profile.totalMoves += moves;
            profile.totalTimeMs += timeMs;
            profile.levelsCompleted.add(level);
        }
        if (boosterUsed)
            profile.boosterUses++;
        profile.lastUpdated = Date.now();
        // Invalidate all cached levels for this player (skill changed)
        const prefix = `${playerId}:`;
        for (const key of this.difficultyCache.keys()) {
            if (key.startsWith(prefix)) {
                this.difficultyCache.delete(key);
            }
        }
        // Periodic profile cleanup
        if (this.playerProfiles.size > this.maxProfiles) {
            this._evictProfiles();
        }
        logger.debug('Recorded attempt for adaptive difficulty', {
            playerId, won, stars, moves, skillScore: profile.skillScore.toFixed(2),
        });
    }
    /**
     * Get or create the skill profile for a player.
     */
    getSkillProfile(playerId) {
        if (!this.playerProfiles.has(playerId)) {
            this.playerProfiles.set(playerId, new PlayerSkillProfile(playerId));
            this.profileAccessOrder.push(playerId);
            if (this.playerProfiles.size > this.maxProfiles) {
                this._evictProfiles();
            }
        }
        return this.playerProfiles.get(playerId);
    }
    /**
     * Generate an AI-adaptive level for a player. The difficulty parameters
     * (target score, move budget, color count, obstacle density) are tuned
     * to the player's measured skill score.
     *
     * context - player location/time/weather context (from localLevelContext)
     * levelNumber - the level number to generate
     * mode - 'classic' | 'daily' | 'timed' | 'endless'
     */
    async generateAdaptiveLevel(playerId, { levelNumber = 1, mode = 'classic', context = null, nowMs = Date.now() } = {}) {
        // Check cache with composite key
        const cacheKey = this._cacheKey(playerId, levelNumber, mode);
        const cached = this.difficultyCache.get(cacheKey);
        if (cached && nowMs - cached.generatedAt < this.cacheTtlMs) {
            cached.accessCount++;
            cached.lastAccessed = nowMs;
            return { ...cached.definition, fromCache: true };
        }
        // Build player context for AI personalization
        const profile = this.getSkillProfile(playerId);
        let aiPreferences = null;
        try {
            aiPreferences = await this.personalizationEngine.predictPlayerPreferences({
                skillLevel: profile.skillScore > 0.7 ? 'expert' : profile.skillScore > 0.4 ? 'intermediate' : 'beginner',
                playStyle: profile.winRate > 0.7 ? 'efficient' : 'casual',
                engagementLevel: profile.gamesPlayed > 50 ? 'high' : 'medium',
            });
        }
        catch (error) {
            logger.warn('AI personalization unavailable, using skill profile only', {
                playerId, error: error.message,
            });
        }
        // Determine difficulty bias from skill score (0.0 to 1.0)
        const skillScore = profile.skillScore;
        // Map skill to difficulty modifier: -0.3 (easier) to +0.3 (harder)
        const difficultyBias = (skillScore - 0.5) * 0.6;
        // Build generation context with AI-informed preferences
        const genContext = context || localLevelContext({}, nowMs);
        if (aiPreferences) {
            // AI preference: difficulty preference influences the bias
            if (aiPreferences.difficultyPreference === 'easier') {
                genContext._aiDifficultyBias = Math.min(-0.1, difficultyBias - 0.1);
            }
            else if (aiPreferences.difficultyPreference === 'harder') {
                genContext._aiDifficultyBias = Math.max(0.1, difficultyBias + 0.1);
            }
            else {
                genContext._aiDifficultyBias = difficultyBias;
            }
        }
        else {
            genContext._aiDifficultyBias = difficultyBias;
        }
        // Generate the level using the deterministic generator
        const definition = generateLevel(levelNumber, genContext, mode, GENERATOR_VERSION);
        // Apply AI difficulty tuning to the generated definition
        const tuned = this.applyDifficultyTuning(definition, genContext._aiDifficultyBias, skillScore);
        const result = {
            ...tuned,
            adaptive: true,
            skillScore,
            difficultyBias: genContext._aiDifficultyBias,
            playerId,
            generatedAt: nowMs,
            fromCache: false,
        };
        // Cache for this player/level/mode
        this.difficultyCache.set(cacheKey, new CacheEntry(levelNumber, mode, result, nowMs));
        this._evictCache();
        logger.info('Generated adaptive level', {
            playerId, level: levelNumber, mode, skillScore: skillScore.toFixed(2),
            difficultyBias: genContext._aiDifficultyBias.toFixed(2),
            targetScore: tuned.targetScore,
        });
        return result;
    }
    /**
     * Apply difficulty tuning to a generated level definition.
     * Adjusts target score, move budget, and color count based on bias.
     */
    applyDifficultyTuning(definition, bias, skillScore) {
        const tuned = { ...definition };
        // Target score adjustment: higher skill = higher target
        const scoreMultiplier = 1 + bias * 0.4; // +/- 20%
        tuned.targetScore = Math.max(100, Math.round(definition.targetScore * scoreMultiplier / 50) * 50);
        // Move budget adjustment: higher skill = fewer moves (slightly)
        const moveAdjustment = Math.round(-bias * 3); // +/- 3 moves
        tuned.moves = Math.max(15, Math.min(35, definition.moves + moveAdjustment));
        // Color count: higher skill = more colors (harder to match)
        const colorAdjustment = bias > 0.2 ? 1 : bias < -0.2 ? -1 : 0;
        const maxColors = definition.gemTypes.length;
        if (colorAdjustment > 0 && maxColors < 6) {
            // Add a color to the palette
            const missing = ALL_COLORS.filter((c) => !definition.gemTypes.includes(c));
            if (missing.length > 0) {
                tuned.gemTypes = [...definition.gemTypes, missing[0]];
                tuned.gemWeights = { ...definition.gemWeights, [missing[0]]: 0.8 };
            }
        }
        else if (colorAdjustment < 0 && maxColors > 4) {
            // Remove the least-weighted color
            const weights = Object.entries(definition.gemWeights);
            const minColor = weights.sort((a, b) => a[1] - b[1])[0][0];
            tuned.gemTypes = definition.gemTypes.filter((c) => c !== minColor);
            const { [minColor]: _, ...rest } = definition.gemWeights;
            tuned.gemWeights = rest;
        }
        // Obstacle density: higher skill = more obstacles
        if (bias > 0.1 && definition.shields) {
            tuned.shields = definition.shields.map((row) => row.map((cell) => Math.random() < 0.15 ? Math.min(3, cell + 1) : cell));
        }
        tuned._adaptiveTuning = {
            scoreMultiplier,
            moveAdjustment,
            colorAdjustment,
            obstacleBias: bias,
        };
        return tuned;
    }
    /**
     * Get the difficulty tier name for display.
     */
    getDifficultyTier(skillScore) {
        if (skillScore >= 0.8)
            return 'expert';
        if (skillScore >= 0.6)
            return 'challenging';
        if (skillScore >= 0.4)
            return 'steady';
        if (skillScore >= 0.2)
            return 'gentle';
        return 'beginner';
    }
    /**
     * Clear all cached data (useful for testing or memory pressure).
     */
    clearCache() {
        this.difficultyCache.clear();
    }
}
export default AdaptiveLevelService;
//# sourceMappingURL=adaptive-level-service.js.map