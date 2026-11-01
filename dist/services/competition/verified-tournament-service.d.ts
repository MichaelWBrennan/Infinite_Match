/**
 * VerifiedTournamentService - manages replay-verified tournaments.
 */
export class VerifiedTournamentService {
    logger: Logger;
    tournaments: Map<any, any>;
    entries: Map<any, any>;
    playerEntries: Map<any, any>;
    leaderboardCache: Map<any, any>;
    /**
     * Evict expired tournaments and enforce max count.
     */
    _evictTournaments({ nowMs }?: {
        nowMs?: number | undefined;
    }): void;
    _removeTournament(tournamentId: any): void;
    /**
     * Invalidate leaderboard cache for a tournament.
     */
    _invalidateLeaderboardCache(tournamentId: any): void;
    /**
     * Create a new tournament.
     * config - { name, levelNumber, mode, startsAt, endsAt, entryFee, prizePool, maxEntries }
     */
    createTournament(config: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): {
        id: string;
        name: any;
        levelNumber: any;
        mode: any;
        startsAt: any;
        endsAt: any;
        entryFee: any;
        prizePool: any;
        maxEntries: any;
        status: string;
        entries: never[];
        verifiedEntries: number;
        rejectedEntries: number;
        createdAt: number;
        levelSeed: null;
    };
    /**
     * Activate a tournament - generates the shared level seed and level definition.
     * All players in an active tournament play the exact same level (same seed).
     */
    activateTournament(tournamentId: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): any;
    /**
     * Get active tournaments at nowMs.
     */
    getActiveTournaments({ nowMs }?: {
        nowMs?: number | undefined;
    }): any[];
    /**
     * Get a tournament by ID (includes level definition if active).
     */
    getTournament(tournamentId: any): any;
    /**
     * Submit a tournament match result with replay verification.
     * The replay must be verified server-side before the result is accepted.
     *
     * params:
     *   tournamentId - the tournament
     *   playerId - the player
     *   moves - array of moves made
     *   reportedScore - score claimed by client
     *   reportedProgress - progress claimed by client
     *   receipts - receipts from the level generator (for verification)
     *   nowMs - reference time
     */
    submitTournamentResult(tournamentId: any, playerId: any, { moves, reportedScore, reportedProgress, receipts, nowMs, }?: {
        nowMs?: number | undefined;
    }): Promise<{
        accepted: boolean;
        reason: string;
        verified?: never;
        entryId?: never;
        score?: never;
        progress?: never;
    } | {
        accepted: boolean;
        reason: any;
        verified: boolean;
        entryId?: never;
        score?: never;
        progress?: never;
    } | {
        accepted: boolean;
        entryId: string;
        score: any;
        progress: any;
        verified: boolean;
        reason?: never;
    }>;
    /**
     * Get the leaderboard for a tournament (verified entries only, sorted by score desc).
     * Results cached for LEADERBOARD_CACHE_TTL_MS.
     */
    getLeaderboard(tournamentId: any, { limit }?: {
        limit?: number | undefined;
    }): {
        tournamentId: any;
        tournamentName: any;
        entries: any;
        verifiedCount: any;
        rejectedCount: any;
    } | {
        tournamentId: any;
        entries: never[];
        verifiedCount: number;
        tournamentName?: never;
        rejectedCount?: never;
    };
    /**
     * Get all tournaments a player has entered.
     */
    getPlayerTournaments(playerId: any): any[];
    /**
     * Finalize a completed tournament - compute winners and distribute prizes.
     */
    finalizeTournament(tournamentId: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): {
        success: boolean;
        reason: string;
        tournamentId?: never;
        winners?: never;
        totalVerifiedEntries?: never;
        totalRejectedEntries?: never;
    } | {
        success: boolean;
        tournamentId: any;
        winners: any;
        totalVerifiedEntries: any;
        totalRejectedEntries: any;
        reason?: never;
    };
    /**
     * Clear all data (testing / memory pressure).
     */
    clearCache(): void;
}
export default VerifiedTournamentService;
import { Logger } from '../../core/logger/index.js';
//# sourceMappingURL=verified-tournament-service.d.ts.map