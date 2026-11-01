/**
 * Cross-Platform Progression Sync Service - unified progression across platforms.
 * Syncs player state across WebGL, iOS, Android, and Facebook using
 * last-write-wins conflict resolution. All sync is server-authoritative.
 */
import { Logger } from '../../core/logger/index.js';
const logger = new Logger('ProgressionSyncService');
const PLATFORMS = ['webgl', 'ios', 'android', 'facebook'];
const SYNCABLE_FIELDS = new Set([
    'coins', 'lives', 'stars', 'maxLevelReached', 'currentLevel',
    'inventory', 'boosters', 'vipLevel', 'vipExpiresAt', 'dailyQuestProgress',
    'friendInvites', 'purchaseHistory',
]);
const MAX_PLAYERS = 50000;
const PLAYER_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_STATE = {
    coins: 0,
    lives: 5,
    stars: 0,
    maxLevelReached: 1,
    currentLevel: 1,
    inventory: {},
    boosters: {},
    vipLevel: 0,
    vipExpiresAt: null,
    dailyQuestProgress: {},
    friendInvites: [],
    purchaseHistory: [],
};
/**
 * ProgressionSyncService - unified cross-platform player progression.
 */
export class ProgressionSyncService {
    constructor() {
        this.logger = new Logger('ProgressionSyncService');
        this.playerState = new Map(); // playerId -> { platformStates, mergedState, version, lastSyncMs, createdAt, lastAccessedMs }
        this.syncQueue = new Map(); // playerId -> pending sync operations
        this.maxPlayers = MAX_PLAYERS;
        this.playerTtlMs = PLAYER_TTL_MS;
    }
    /**
     * Evict stale player states and enforce max count.
     */
    _evictPlayers({ nowMs = Date.now() } = {}) {
        // Remove expired player states
        for (const [playerId, state] of this.playerState) {
            if (nowMs - state.lastAccessedMs > this.playerTtlMs) {
                this.playerState.delete(playerId);
            }
        }
        // Enforce max count - remove least recently accessed
        while (this.playerState.size > this.maxPlayers) {
            let lruKey = null;
            let lruTime = Infinity;
            for (const [key, state] of this.playerState) {
                if (state.lastAccessedMs < lruTime) {
                    lruTime = state.lastAccessedMs;
                    lruKey = key;
                }
            }
            if (lruKey)
                this.playerState.delete(lruKey);
        }
    }
    getPlayerState(playerId) {
        const now = Date.now();
        if (!this.playerState.has(playerId)) {
            this.playerState.set(playerId, {
                playerId,
                platformStates: {},
                mergedState: { ...DEFAULT_STATE },
                version: 0,
                lastSyncMs: 0,
                lastAccessedMs: now,
                createdAt: now,
                mergedDirty: false,
            });
            if (this.playerState.size > this.maxPlayers)
                this._evictPlayers({ nowMs: now });
        }
        else {
            this.playerState.get(playerId).lastAccessedMs = now;
        }
        return this.playerState.get(playerId);
    }
    syncPlatformProgress(playerId, platform, data, { nowMs = Date.now() } = {}) {
        if (!PLATFORMS.includes(platform)) {
            return { success: false, reason: `Unsupported platform: ${platform}` };
        }
        this._evictPlayers({ nowMs });
        const state = this.getPlayerState(playerId);
        state.lastAccessedMs = nowMs;
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
        let changed = false;
        if (incomingTimestamp >= platformState.lastSyncedAt) {
            // Merge fields from this platform, newer timestamp wins
            for (const field of SYNCABLE_FIELDS) {
                if (data[field] !== undefined) {
                    platformState.data[field] = data[field];
                    changed = true;
                }
            }
            platformState.lastSyncedAt = incomingTimestamp;
            platformState.version++;
        }
        // Mark merged state as dirty only if something changed
        if (changed) {
            state.mergedDirty = true;
        }
        state.lastSyncMs = nowMs;
        state.version++;
        // Recompute merged state so callers always get fresh data
        if (state.mergedDirty) {
            this.recomputeMergedState(state, nowMs);
            state.mergedDirty = false;
        }
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
    getMergedState(playerId) {
        const state = this.getPlayerState(playerId);
        if (state.mergedDirty) {
            this.recomputeMergedState(state, state.lastSyncMs || Date.now());
            state.mergedDirty = false;
        }
        return {
            playerId,
            mergedState: state.mergedState,
            version: state.version,
            lastSyncMs: state.lastSyncMs,
            platforms: Object.keys(state.platformStates),
        };
    }
    recomputeMergedState(state, nowMs) {
        const merged = { ...DEFAULT_STATE };
        const bestTs = {}; // field -> best timestamp
        for (const field of SYNCABLE_FIELDS) {
            let bestValue = DEFAULT_STATE[field];
            let bestTimestamp = 0;
            for (const pState of Object.values(state.platformStates)) {
                if (pState.data[field] !== undefined && pState.lastSyncedAt >= bestTimestamp) {
                    bestValue = pState.data[field];
                    bestTimestamp = pState.lastSyncedAt;
                }
            }
            merged[field] = bestValue;
            bestTs[field] = bestTimestamp;
        }
        state.mergedState = merged;
    }
    getProgressSummary(playerId) {
        const state = this.getPlayerState(playerId);
        // Ensure merged state is up to date
        if (state.mergedDirty) {
            this.recomputeMergedState(state, state.lastSyncMs || Date.now());
            state.mergedDirty = false;
        }
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
    resolveConflict(playerId, field, platform, { nowMs = Date.now() } = {}) {
        const state = this.getPlayerState(playerId);
        const platformState = state.platformStates[platform];
        if (!platformState || platformState.data[field] === undefined) {
            return { success: false, reason: 'No data for this platform/field' };
        }
        // Force this platform's value to win
        const value = platformState.data[field];
        state.mergedState[field] = value;
        state.mergedDirty = false; // Manually resolved, not dirty
        state.version++;
        logger.info('Resolved conflict', { playerId, field, platform, value });
        return { success: true, field, value, winningPlatform: platform, version: state.version };
    }
    /**
     * Clear all player data (testing / memory pressure).
     */
    clearCache() {
        this.playerState.clear();
        this.syncQueue.clear();
    }
}
export default ProgressionSyncService;
//# sourceMappingURL=progression-sync-service.js.map