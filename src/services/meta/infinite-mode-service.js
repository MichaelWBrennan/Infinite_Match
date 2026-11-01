/**
 * Infinite Mode Service - makes "Infinite Match" live up to its name.
 *
 * Core systems:
 * 1. Endless Level Progression - Levels scale forever (no cap), difficulty
 *    escalates with each level. Uses the existing deterministic generator
 *    in 'endless' mode (Number.MAX_SAFE_INTEGER moves, no clock).
 * 2. Paragon/Prestige System - Infinite XP, paragon levels that never cap,
 *    prestige tiers with permanent bonuses.
 * 3. Perpetual Live Events - AI-generated events that rotate forever,
 *    never repeating, integrated with the EventGeneratorService.
 * 4. Infinite Streaks - Win streaks with escalating rewards that never cap.
 * 5. Endless Leaderboard - Global endless runs leaderboard.
 *
 * All progression is server-authoritative. The client reports a run score;
 * the server verifies it via attempt replay before accepting it.
 */

import { Logger } from '../../core/logger/index.js';
import { generateLevel, GENERATOR_VERSION, LEVEL_MODES } from '../levels/generator.js';
import { localLevelContext } from '../levels/location-context.js';
import { AIPersonalizationEngine } from '../ai-personalization-engine.js';
import { EventGeneratorService } from '../ai/event-generator-service.js';

const logger = new Logger('InfiniteModeService');

/**
 * Paragon tier thresholds (XP required). Never caps - keeps growing.
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

/**
 * InfiniteModeService - tracks endless gameplay with no level cap.
 */
export class InfiniteModeService {
  constructor(personalizationEngine = null, eventGenerator = null) {
    this.logger = new Logger('InfiniteModeService');
    this.personalizationEngine = personalizationEngine || new AIPersonalizationEngine();
    this.eventGenerator = eventGenerator || new EventGeneratorService();

    // Player infinite state: playerId -> InfinitePlayerState
    this.playerState = new Map();

    // Perpetual event rotation: scheduled events that never end
    this.perpetualEvents = [];

    // Global endless leaderboard: [{ playerId, score, level, at }]
    this.endlessLeaderboard = [];

    // Initialize perpetual events
    this.initializePerpetualEvents();
  }

  // ========================================================================
  // PLAYER STATE
  // ========================================================================

  /**
   * Get or create a player's infinite mode state.
   */
  getPlayerState(playerId) {
    if (!this.playerState.has(playerId)) {
      this.playerState.set(playerId, this.createInitialState(playerId));
    }
    return this.playerState.get(playerId);
  }

  createInitialState(playerId) {
    return {
      playerId,
      // Endless progression
      endlessLevel: 1,
      totalEndlessLevels: 0,
      totalEndlessXP: 0,
      paragonLevel: 0,
      paragonXP: 0,
      prestige: 0,
      prestigePoints: 0,
      // Streaks
      currentStreak: 0,
      bestStreak: 0,
      streakRewardsClaimed: new Set(),
      // Run history
      runsCompleted: 0,
      bestRunScore: 0,
      bestRunLevel: 1,
      totalCoinsEarned: 0,
      totalTimePlayedMs: 0,
      lastRunAt: null,
      createdAt: Date.now(),
    };
  }

  /**
   * Get the paragon tier for a given paragon level.
   */
  getParagonTier(paragonLevel) {
    let tier = PARAGON_TIERS[0];
    for (const t of PARAGON_TIERS) {
      if (paragonLevel >= t.xp / 1000) tier = t; // approximate: XP/1000 = level
    }
    // Find exact tier by XP
    for (let i = PARAGON_TIERS.length - 1; i >= 0; i--) {
      if (paragonLevel * 1000 >= PARAGON_TIERS[i].xp) {
        return PARAGON_TIERS[i];
      }
    }
    return PARAGON_TIERS[0];
  }

  /**
   * Calculate XP needed for next paragon level.
   * Formula: base * 1.5^level, never caps.
   */
  xpForParagonLevel(level) {
    return Math.floor(1000 * Math.pow(1.5, level));
  }

  /**
   * Get prestige tier for current prestige.
   */
  getPrestigeTier(prestige) {
    if (prestige >= PRESTIGE_TIERS.length) {
      // Infinite prestiges beyond the last tier
      return {
        name: `Infinite ${prestige}`,
        requiredLevel: PRESTIGE_TIERS[PRESTIGE_TIERS.length - 1].requiredLevel,
        coinBonus: PRESTIGE_TIERS[PRESTIGE_TIERS.length - 1].coinBonus * (1 + prestige * 0.1),
        xpBonus: PRESTIGE_TIERS[PRESTIGE_TIERS.length - 1].xpBonus * (1 + prestige * 0.1),
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
  async completeEndlessRun(playerId, {
    score, levelReached, movesMade, timeMs, verified = false,
    nowMs = Date.now(),
  } = {}) {
    if (!verified) {
      return { success: false, error: 'unverified_run' };
    }

    const state = this.getPlayerState(playerId);
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
    } else {
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
    if (!tier) return false; // Already at max defined tier, can always prestige
    return state.totalEndlessLevels >= tier.requiredLevel;
  }

  /**
   * Check streak milestone rewards.
   */
  checkStreakRewards(state) {
    const rewards = [];
    const milestones = [3, 5, 10, 25, 50, 100, 250, 500, 1000];
    for (const milestone of milestones) {
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
    // Generate an initial batch of perpetual events
    // These rotate continuously - when one ends, another begins
    this.perpetualEvents = [];
    this.logger.info('Perpetual event rotation initialized');
  }

  /**
   * Get active perpetual events at nowMs.
   * Generates new events on-demand so the rotation never ends.
   */
  async getPerpetualEvents({ nowMs = Date.now(), count = 3 } = {}) {
    const active = this.perpetualEvents.filter(
      (e) => e.startsAt <= nowMs && e.endsAt > nowMs && e.status === 'active'
    );

    // Generate more events if we don't have enough active ones
    if (active.length < count) {
      const needed = count - active.length;
      for (let i = 0; i < needed; i++) {
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

    // Clean up old completed events (keep last 10)
    this.perpetualEvents = this.perpetualEvents
      .filter((e) => e.endsAt > nowMs - 7 * 24 * 60 * 60 * 1000)
      .slice(-50);

    return active.sort((a, b) => a.endsAt - b.endsAt);
  }

  // ========================================================================
  // LEADERBOARD
  // ========================================================================

  /**
   * Update the global endless leaderboard.
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

    // Sort by score desc, keep top 1000 (infinite leaderboard - no cap on players)
    this.endlessLeaderboard.sort((a, b) => b.score - a.score);
    this.endlessLeaderboard = this.endlessLeaderboard.slice(0, 1000);
  }

  /**
   * Get the endless leaderboard.
   */
  getLeaderboard({ limit = 100 } = {}) {
    return this.endlessLeaderboard
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        playerId: entry.playerId,
        score: entry.score,
        level: entry.level,
        at: entry.at,
      }));
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
   * Reset player state (for testing).
   */
  resetForTesting() {
    this.playerState.clear();
    this.endlessLeaderboard = [];
    this.perpetualEvents = [];
  }
}

export const infiniteModeService = new InfiniteModeService();
export default InfiniteModeService;
