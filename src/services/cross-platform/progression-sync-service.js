/**
 * Cross-Platform Progression Sync Service - unified progression across platforms.
 *
 * Syncs player progress (lives, coins, stars, level progress, inventory,
 * VIP status, daily quests) across WebGL, mobile, and Facebook. Uses
 * last-write-wins with vector-clock-style timestamps for conflict resolution.
 * All sync is server-authoritative.
 */

import { Logger } from '../../core/logger/index.js';

const logger = new Logger('ProgressionSyncService');

const PLATFORMS = ['webgl', 'ios', 'android', 'facebook'];

const SYNCABLE_FIELDS = [
  'coins', 'lives', 'stars', 'maxLevelReached', 'currentLevel',
  'inventory', 'boosters', 'vipLevel', 'vipExpiresAt', 'dailyQuestProgress',
  'friendInvites', 'purchaseHistory',
];

/**
 * ProgressionSyncService - unified cross-platform player progression.
 */
export class ProgressionSyncService {
  constructor() {
    this.logger = new Logger('ProgressionSyncService');
    this.playerState = new Map(); // playerId -> { platformStates, mergedState, version }
    this.syncQueue = new Map(); // playerId -> pending sync operations
  }

  /**
   * Get or initialize player cross-platform state.
   */
  getPlayerState(playerId) {
    if (!this.playerState.has(playerId)) {
      this.playerState.set(playerId, {
        playerId,
        platformStates: {},
        mergedState: {},
        version: 0,
        lastSyncMs: 0,
        createdAt: Date.now(),
      });
    }
    return this.playerState.get(playerId);
  }

  /**
   * Sync progress from a specific platform.
   * platform - 'webgl' | 'ios' | 'android' | 'facebook'
   * data - the progress data from that platform
   * nowMs - reference time
   */
  syncPlatformProgress(playerId, platform, data, { nowMs = Date.now() } = {}) {
    if (!PLATFORMS.includes(platform)) {
      return { success: false, reason: `Unsupported platform: ${platform}` };
    }

    const state = this.getPlayerState(playerId);

    // Merge platform data into that platform's state
    if (!state.platformStates[platform]) {
      state.platformStates[platform] = {
        platform,
        data: {},
        version: 0,
        lastSyncedAt: 0,
      };
    }

    const platformState = state.platformStates[platform];

    // Last-write-wins: if this platform's data is newer, it wins for conflicting fields
    const incomingTimestamp = data.timestamp || nowMs;
    if (incomingTimestamp >= platformState.lastSyncedAt) {
      // Merge fields from this platform, newer timestamp wins
      for (const field of SYNCABLE_FIELDS) {
        if (data[field] !== undefined) {
          platformState.data[field] = data[field];
        }
      }
      platformState.lastSyncedAt = incomingTimestamp;
      platformState.version++;
    }

    // Recompute merged state across all platforms
    this.recomputeMergedState(state, nowMs);
    state.lastSyncMs = nowMs;
    state.version++;

    logger.debug('Synced platform progress', {
      playerId, platform, timestamp: incomingTimestamp, version: state.version,
    });

    return {
      success: true,
      playerId,
      platform,
      mergedState: state.mergedState,
      version: state.version,
    };
  }

  /**
   * Get the unified merged state for a player (the source of truth).
   */
  getMergedState(playerId) {
    const state = this.getPlayerState(playerId);
    // Ensure defaults are present even if no sync has occurred yet
    if (Object.keys(state.mergedState).length === 0) {
      this.recomputeMergedState(state, Date.now());
    }
    return {
      playerId,
      mergedState: state.mergedState,
      version: state.version,
      lastSyncMs: state.lastSyncMs,
      platforms: Object.keys(state.platformStates),
    };
  }

  /**
   * Recompute merged state from all platform states using last-write-wins.
   * For each field, the value from the platform with the most recent timestamp wins.
   */
  recomputeMergedState(state, nowMs) {
    const merged = {};

    for (const field of SYNCABLE_FIELDS) {
      let bestValue = undefined;
      let bestTimestamp = 0;

      for (const [platform, pState] of Object.entries(state.platformStates)) {
        if (pState.data[field] !== undefined && pState.lastSyncedAt >= bestTimestamp) {
          bestValue = pState.data[field];
          bestTimestamp = pState.lastSyncedAt;
        }
      }

      if (bestValue !== undefined) {
        merged[field] = bestValue;
      }
    }

    // Ensure defaults for critical fields
    merged.coins = merged.coins ?? 0;
    merged.lives = merged.lives ?? 5;
    merged.stars = merged.stars ?? 0;
    merged.maxLevelReached = merged.maxLevelReached ?? 1;
    merged.currentLevel = merged.currentLevel ?? 1;
    merged.inventory = merged.inventory ?? {};
    merged.boosters = merged.boosters ?? {};
    merged.vipLevel = merged.vipLevel ?? 0;
    merged.dailyQuestProgress = merged.dailyQuestProgress ?? {};
    merged.friendInvites = merged.friendInvites ?? [];
    merged.purchaseHistory = merged.purchaseHistory ?? [];

    state.mergedState = merged;
  }

  /**
   * Get progress summary for display across all platforms.
   */
  getProgressSummary(playerId) {
    const state = this.getPlayerState(playerId);
    const platformSummaries = {};
    for (const [platform, pState] of Object.entries(state.platformStates)) {
      platformSummaries[platform] = {
        lastSyncedAt: pState.lastSyncedAt,
        version: pState.version,
        fieldsSynced: Object.keys(pState.data).length,
      };
    }

    return {
      playerId,
      mergedState: state.mergedState,
      version: state.version,
      lastSyncMs: state.lastSyncMs,
      platforms: platformSummaries,
      isCrossPlatform: Object.keys(state.platformStates).length > 1,
    };
  }

  /**
   * Resolve a conflict between two platforms for a specific field.
   * Called when manual intervention is needed.
   */
  resolveConflict(playerId, field, platform, { nowMs = Date.now() } = {}) {
    const state = this.getPlayerState(playerId);
    const platformState = state.platformStates[platform];
    if (!platformState || platformState.data[field] === undefined) {
      return { success: false, reason: 'No data for this platform/field' };
    }

    // Force this platform's value to win
    const value = platformState.data[field];
    state.mergedState[field] = value;
    state.version++;

    logger.info('Resolved conflict', { playerId, field, platform, value });

    return { success: true, field, value, winningPlatform: platform, version: state.version };
  }
}

export default ProgressionSyncService;
