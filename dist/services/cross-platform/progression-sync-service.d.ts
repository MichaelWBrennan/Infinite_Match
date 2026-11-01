/**
 * ProgressionSyncService - unified cross-platform player progression.
 */
export class ProgressionSyncService {
    logger: Logger;
    playerState: Map<any, any>;
    syncQueue: Map<any, any>;
    maxPlayers: number;
    playerTtlMs: number;
    /**
     * Evict stale player states and enforce max count.
     */
    _evictPlayers({ nowMs }?: {
        nowMs?: number | undefined;
    }): void;
    getPlayerState(playerId: any): any;
    syncPlatformProgress(playerId: any, platform: any, data: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): {
        success: boolean;
        reason: string;
        playerId?: never;
        platform?: never;
        mergedState?: never;
        version?: never;
    } | {
        success: boolean;
        playerId: any;
        platform: any;
        mergedState: any;
        version: any;
        reason?: never;
    };
    getMergedState(playerId: any): {
        playerId: any;
        mergedState: any;
        version: any;
        lastSyncMs: any;
        platforms: string[];
    };
    recomputeMergedState(state: any, nowMs: any): void;
    getProgressSummary(playerId: any): {
        playerId: any;
        mergedState: any;
        version: any;
        lastSyncMs: any;
        platforms: {};
        isCrossPlatform: boolean;
    };
    resolveConflict(playerId: any, field: any, platform: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): {
        success: boolean;
        reason: string;
        field?: never;
        value?: never;
        winningPlatform?: never;
        version?: never;
    } | {
        success: boolean;
        field: any;
        value: any;
        winningPlatform: any;
        version: any;
        reason?: never;
    };
    /**
     * Clear all player data (testing / memory pressure).
     */
    clearCache(): void;
}
export default ProgressionSyncService;
import { Logger } from '../../core/logger/index.js';
//# sourceMappingURL=progression-sync-service.d.ts.map