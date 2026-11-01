/**
 * Infinite Mode Service - endless levels, paragon/prestige, perpetual events.
 * All progression is server-authoritative; run scores are verified via
 * attempt replay before being accepted.
 */
import { Logger } from '../../core/logger/index.js';
import { generateLevel, GENERATOR_VERSION, LEVEL_MODES } from '../levels/generator.js';
import { localLevelContext } from '../levels/location-context.js';
import { AIPersonalizationEngine } from '../ai-personalization-engine.js';
import { EventGeneratorService } from '../ai/event-generator-service.js';
const logger = new Logger('InfiniteModeService');
const MAX_PLAYERS = 50000;
const PLAYER_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_PERPETUAL_EVENTS = 100;
const MAX_LEADERBOARD_SIZE = 1000;
const LEADERBOARD_CACHE_TTL_MS = 5 * 60 * 1000;
/**
 * Paragon tier thresholds (XP required). Never caps - keeps growing.
 * Sorted ascending by xp for binary search.
 */
const PARAGON_TIERS = [
    { name: 'Novice', xp: 0, multiplier: 1.00 },
    { name: 'Apprentice', xp: 1_000, multiplier: 1.10 },
    { name: 'Adept', xp: 5_000, multiplier: 1.25 },
    { name: 'Expert', xp: 20_000, multiplier: 1.50 },
    { name: 'Master', xp: 100_000, multiplier: 2.00 },
    { name: 'Grandmaster', xp: 500_000, multiplier: 3.00 },
    { name: 'Legend', xp: 2_000_000, multiplier: 5.00 },
    { name: 'Mythic', xp: 10_000_000, multiplier: 8.00 },
    { name: 'Transcendent', xp: 50_000_000, multiplier: 12.00 },
];
/**
 * Prestige tiers. Each prestige resets level but grants permanent bonuses.
 * Sorted ascending by requiredLevel.
 */
const PRESTIGE_TIERS = [
    { name: 'Iron', requiredLevel: 100, coinBonus: 0.05, xpBonus: 0.05 },
    { name: 'Bronze', requiredLevel: 250, coinBonus: 0.10, xpBonus: 0.10 },
    { name: 'Silver', requiredLevel: 500, coinBonus: 0.20, xpBonus: 0.20 },
    { name: 'Gold', requiredLevel: 1_000, coinBonus: 0.35, xpBonus: 0.35 },
    { name: 'Platinum', requiredLevel: 2_500, coinBonus: 0.50, xpBonus: 0.50 },
    { name: 'Diamond', requiredLevel: 5_000, coinBonus: 0.75, xpBonus: 0.75 },
    { name: 'Infinite', requiredLevel: 10_000, coinBonus: 1.00, xpBonus: 1.00 },
];
const STREAK_MILESTONES = [3, 5, 10, 25, 50, 100, 250, 500, 1000];
/**
 * InfiniteModeService - tracks endless gameplay with no level cap.
 */
export class InfiniteModeService {
    constructor(personalizationEngine = null, eventGenerator = null) {
        this.logger = new Logger('InfiniteModeService');
        this.personalizationEngine = personalizationEngine || new AIPersonalizationEngine();
        this.eventGenerator = eventGenerator || new EventGeneratorService();
        this.playerState = new Map();
        this.perpetualEvents = [];
        this.endlessLeaderboard = [];
        this.leaderboardCache = null;
        this.maxPlayers = MAX_PLAYERS;
        this.playerTtlMs = PLAYER_TTL_MS;
        this.initializePerpetualEvents();
    }
    /**
     * Evict stale player states and enforce max count.
     */
    _evictPlayers({ nowMs = Date.now() } = {}) {
        for (const [playerId, state] of this.playerState) {
            if (nowMs - (state.lastAccessedMs || state.createdAt) > this.playerTtlMs) {
                this.playerState.delete(playerId);
            }
        }
        while (this.playerState.size > this.maxPlayers) {
            let lruKey = null;
            let lruTime = Infinity;
            for (const [key, state] of this.playerState) {
                const t = state.lastAccessedMs || state.createdAt;
                if (t < lruTime) {
                    lruTime = t;
                    lruKey = key;
                }
            }
            if (lruKey)
                this.playerState.delete(lruKey);
        }
    }
    /**
     * Get or create a player's infinite mode state.
     */
    getPlayerState(playerId) {
        const now = Date.now();
        if (!this.playerState.has(playerId)) {
            this.playerState.set(playerId, this.createInitialState(playerId, now));
            if (this.playerState.size > this.maxPlayers) {
                this._evictPlayers({ nowMs: now });
            }
        }
        else {
            this.playerState.get(playerId).lastAccessedMs = now;
        }
        return this.playerState.get(playerId);
    }
    createInitialState(playerId, nowMs = Date.now()) {
        return {
            playerId,
            endlessLevel: 1,
            totalEndlessLevels: 0,
            totalEndlessXP: 0,
            paragonLevel: 0,
            paragonXP: 0,
            prestige: 0,
            prestigePoints: 0,
            currentStreak: 0,
            bestStreak: 0,
            streakRewardsClaimed: new Set(),
            runsCompleted: 0,
            bestRunScore: 0,
            bestRunLevel: 1,
            totalCoinsEarned: 0,
            totalTimePlayedMs: 0,
            lastRunAt: null,
            lastAccessedMs: nowMs,
            createdAt: nowMs,
        };
    }
    getParagonTier(paragonLevel) {
        const paragonXP = paragonLevel * 1000;
        let lo = 0;
        let hi = PARAGON_TIERS.length - 1;
        let result = PARAGON_TIERS[0];
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (PARAGON_TIERS[mid].xp <= paragonXP) {
                result = PARAGON_TIERS[mid];
                lo = mid + 1;
            }
            else {
                hi = mid - 1;
            }
        }
        return result;
    }
    xpForParagonLevel(level) {
        return Math.floor(1000 * Math.pow(1.5, level));
    }
    /**
     * Get prestige tier for current prestige.
     */
    getPrestigeTier(prestige) {
        if (prestige >= PRESTIGE_TIERS.length) {
            const last = PRESTIGE_TIERS[PRESTIGE_TIERS.length - 1];
            return {
                name: `Infinite ${prestige}`,
                requiredLevel: last.requiredLevel,
                coinBonus: last.coinBonus * (1 + prestige * 0.1),
                xpBonus: last.xpBonus * (1 + prestige * 0.1),
            };
        }
        return PRESTIGE_TIERS[prestige];
    }
    // ========================================================================
    // ENDLESS LEVEL GENERATION
    // ========================================================================
    /**
     * Generate the next endless level for a player.
     * Difficulty escalates with level number - no cap.
     *
     * context - player location/time/weather context
     * nowMs - reference time
     */
    async generateEndlessLevel(playerId, { context = null, nowMs = Date.now() } = {}) {
        const state = this.getPlayerState(playerId);
        const levelNumber = state.endlessLevel;
        // Build generation context with endless-mode escalation
        const genContext = context || localLevelContext({}, nowMs);
        // Endless mode: difficulty scales with level, no cap
        const endlessBias = Math.min(0.9, (levelNumber - 1) * 0.02); // caps at 0.9 bias
        genContext._endlessMode = true;
        genContext._endlessLevel = levelNumber;
        genContext._endlessBias = endlessBias;
        // Apply endless difficulty to the context
        // Higher levels: more colors, tighter move budget, more obstacles
        const definition = generateLevel(levelNumber, genContext, LEVEL_MODES[3] /* 'endless' */, GENERATOR_VERSION);
        // Add endless-mode metadata
        const endlessDefinition = {
            ...definition,
            endlessMode: true,
            endlessLevel: levelNumber,
            playerId,
            generatedAt: nowMs,
            paragonMultiplier: this.getParagonTier(state.paragonLevel).multiplier,
            prestigeBonus: this.getPrestigeTier(state.prestige).coinBonus,
            streak: state.currentStreak,
            noLevelCap: true,
        };
        logger.info('Generated endless level', {
            playerId, level: levelNumber, endlessBias: endlessBias.toFixed(2),
            targetScore: endlessDefinition.targetScore,
        });
        return endlessDefinition;
    }
    /**
     * Calculate the difficulty multiplier for an endless level.
     * Escalates forever: 1.0 + (level-1) * 0.05, capped at 10x.
     */
    endlessDifficultyMultiplier(levelNumber) {
        return Math.min(10.0, 1.0 + (levelNumber - 1) * 0.05);
    }
    // ========================================================================
    // RUN COMPLETION & PROGRESSION
    // ========================================================================
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
    async completeEndlessRun(playerId, { score, levelReached, movesMade, timeMs, verified = false, nowMs = Date.now(), } = {}) {
        if (!verified) {
            return { success: false, error: 'unverified_run' };
        }
        const state = this.getPlayerState(playerId);
        state.lastAccessedMs = nowMs;
        const previousLevel = state.endlessLevel;
        const previousStreak = state.currentStreak;
        // Calculate XP earned (escalates with level)
        const levelXP = Math.floor(score * 0.1 * (1 + (levelReached - 1) * 0.01));
        const paragonMultiplier = this.getParagonTier(state.paragonLevel).multiplier;
        const xpEarned = Math.floor(levelXP * paragonMultiplier);
        // Calculate coins earned
        const prestigeBonus = this.getPrestigeTier(state.prestige).coinBonus;
        const coinsEarned = Math.floor(score * 0.05 * (1 + prestigeBonus));
        // Update state
        state.totalEndlessLevels += levelReached;
        state.totalEndlessXP += xpEarned;
        state.totalCoinsEarned += coinsEarned;
        state.runsCompleted += 1;
        state.totalTimePlayedMs += timeMs;
        state.lastRunAt = nowMs;
        // Update best run
        if (score > state.bestRunScore) {
            state.bestRunScore = score;
            state.bestRunLevel = levelReached;
        }
        // Advance endless level for next run (no cap)
        state.endlessLevel = levelReached + 1;
        // Update streak
        if (score > 0) {
            state.currentStreak = previousStreak + 1;
            if (state.currentStreak > state.bestStreak) {
                state.bestStreak = state.currentStreak;
            }
        }
        else {
            state.currentStreak = 0;
        }
        // Paragon progression
        state.paragonXP += xpEarned;
        let paragonLevelsGained = 0;
        while (state.paragonXP >= this.xpForParagonLevel(state.paragonLevel + 1)) {
            state.paragonXP -= this.xpForParagonLevel(state.paragonLevel + 1);
            state.paragonLevel += 1;
            paragonLevelsGained += 1;
        }
        // Prestige check: can prestige when reaching level milestones
        const prestigeAvailable = this.checkPrestigeAvailable(state);
        let prestiged = false;
        if (prestigeAvailable) {
            state.prestige += 1;
            state.prestigePoints += 1;
            state.endlessLevel = 1; // Reset level on prestige, keep paragon
            state.totalEndlessLevels = 0;
            prestiged = true;
            logger.info('Player prestiged', { playerId, newPrestige: state.prestige });
        }
        // Update global leaderboard
        this.updateLeaderboard(playerId, score, levelReached, nowMs);
        const result = {
            success: true,
            playerId,
            run: {
                score,
                levelReached,
                movesMade,
                timeMs,
                verified: true,
            },
            rewards: {
                xpEarned,
                coinsEarned,
                paragonLevelsGained,
                newParagonLevel: state.paragonLevel,
                newParagonXP: state.paragonXP,
                nextParagonXP: this.xpForParagonLevel(state.paragonLevel + 1),
            },
            progression: {
                endlessLevel: state.endlessLevel,
                prestige: state.prestige,
                prestigePoints: state.prestigePoints,
                currentStreak: state.currentStreak,
                bestStreak: state.bestStreak,
                prestiged,
                noLevelCap: true,
            },
            streakRewards: this.checkStreakRewards(state),
        };
        logger.info('Endless run completed', {
            playerId, score, levelReached, xpEarned, coinsEarned,
            paragonLevel: state.paragonLevel, streak: state.currentStreak,
        });
        return result;
    }
    /**
     * Check if player can prestige (reached a prestige tier level).
     */
    checkPrestigeAvailable(state) {
        const tier = PRESTIGE_TIERS[state.prestige];
        if (!tier)
            return false; // Already at max defined tier, can always prestige
        return state.totalEndlessLevels >= tier.requiredLevel;
    }
    /**
     * Check streak milestone rewards.
     */
    checkStreakRewards(state) {
        const rewards = [];
        for (const milestone of STREAK_MILESTONES) {
            if (state.currentStreak >= milestone && !state.streakRewardsClaimed.has(milestone)) {
                state.streakRewardsClaimed.add(milestone);
                rewards.push({
                    milestone,
                    coins: milestone * 100,
                    xp: milestone * 50,
                    bonus: `Streak ${milestone}!`,
                });
            }
        }
        return rewards;
    }
    // ========================================================================
    // PERPETUAL EVENTS
    // ========================================================================
    /**
     * Initialize perpetual events that rotate forever.
     */
    initializePerpetualEvents() {
        this.perpetualEvents = [];
        this.logger.info('Perpetual event rotation initialized');
    }
    /**
     * Get active perpetual events at nowMs.
     * Generates new events on-demand so the rotation never ends.
     * Bounded to MAX_PERPETUAL_EVENTS to prevent memory leaks.
     */
    async getPerpetualEvents({ nowMs = Date.now(), count = 3 } = {}) {
        // Filter to active events
        const active = this.perpetualEvents.filter((e) => e.startsAt <= nowMs && e.endsAt > nowMs && e.status === 'active');
        // Generate more events if we don't have enough active ones
        if (active.length < count) {
            const needed = count - active.length;
            for (let i = 0; i < needed; i++) {
                if (this.perpetualEvents.length >= MAX_PERPETUAL_EVENTS)
                    break;
                const event = await this.eventGenerator.generateEvent({
                    durationKey: i % 2 === 0 ? 'daily' : 'weekend',
                    nowMs,
                });
                event.status = 'active';
                event.perpetual = true;
                this.perpetualEvents.push(event);
                active.push(event);
            }
        }
        // Clean up old completed events (keep last 10 days)
        const cutoff = nowMs - 7 * 24 * 60 * 60 * 1000;
        this.perpetualEvents = this.perpetualEvents
            .filter((e) => e.endsAt > cutoff)
            .slice(-MAX_PERPETUAL_EVENTS);
        return active.sort((a, b) => a.endsAt - b.endsAt);
    }
    // ========================================================================
    // LEADERBOARD
    // ========================================================================
    /**
     * Update the global endless leaderboard.
     * Maintains sorted order for O(1) reads.
     */
    updateLeaderboard(playerId, score, levelReached, nowMs) {
        // Remove existing entry for this player
        this.endlessLeaderboard = this.endlessLeaderboard.filter((e) => e.playerId !== playerId);
        // Add new entry
        this.endlessLeaderboard.push({
            playerId,
            score,
            level: levelReached,
            at: nowMs,
        });
        // Sort by score desc, keep top MAX_LEADERBOARD_SIZE
        this.endlessLeaderboard.sort((a, b) => b.score - a.score);
        this.endlessLeaderboard = this.endlessLeaderboard.slice(0, MAX_LEADERBOARD_SIZE);
        // Invalidate cache
        this.leaderboardCache = null;
    }
    /**
     * Get the endless leaderboard.
     * Cached for LEADERBOARD_CACHE_TTL_MS.
     */
    getLeaderboard({ limit = 100 } = {}) {
        const now = Date.now();
        if (this.leaderboardCache && now - this.leaderboardCache.generatedAt < LEADERBOARD_CACHE_TTL_MS) {
            const entries = this.leaderboardCache.leaderboard.slice(0, limit).map((entry, index) => ({
                rank: index + 1,
                playerId: entry.playerId,
                score: entry.score,
                level: entry.level,
                at: entry.at,
            }));
            return entries;
        }
        const entries = this.endlessLeaderboard.slice(0, limit).map((entry, index) => ({
            rank: index + 1,
            playerId: entry.playerId,
            score: entry.score,
            level: entry.level,
            at: entry.at,
        }));
        this.leaderboardCache = { leaderboard: entries, generatedAt: now };
        return entries;
    }
    // ========================================================================
    // PLAYER SUMMARY
    // ========================================================================
    /**
     * Get a player's infinite mode summary.
     */
    getPlayerSummary(playerId) {
        const state = this.getPlayerState(playerId);
        const paragonTier = this.getParagonTier(state.paragonLevel);
        const prestigeTier = this.getPrestigeTier(state.prestige);
        const nextParagonXP = this.xpForParagonLevel(state.paragonLevel + 1);
        return {
            playerId,
            endlessLevel: state.endlessLevel,
            totalEndlessLevels: state.totalEndlessLevels,
            paragonLevel: state.paragonLevel,
            paragonXP: state.paragonXP,
            nextParagonXP,
            paragonTier,
            prestige: state.prestige,
            prestigeTier,
            prestigePoints: state.prestigePoints,
            currentStreak: state.currentStreak,
            bestStreak: state.bestStreak,
            runsCompleted: state.runsCompleted,
            bestRunScore: state.bestRunScore,
            bestRunLevel: state.bestRunLevel,
            totalCoinsEarned: state.totalCoinsEarned,
            totalTimePlayedMs: state.totalTimePlayedMs,
            lastRunAt: state.lastRunAt,
            noLevelCap: true,
            createdAt: state.createdAt,
        };
    }
    /**
     * Reset all state (for testing).
     */
    resetForTesting() {
        this.playerState.clear();
        this.endlessLeaderboard = [];
        this.perpetualEvents = [];
        this.leaderboardCache = null;
    }
}
export const infiniteModeService = new InfiniteModeService();
export default InfiniteModeService;
//# sourceMappingURL=infinite-mode-service.js.map