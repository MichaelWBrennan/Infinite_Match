/**
 * Verified Tournament Service - replay-verified competitive play.
 * Every match result requires a server-verified replay before entering
 * leaderboards. Unverified results are rejected.
 */
import { Logger } from '../../core/logger/index.js';
import { replayLevelAttempt } from '../levels/attempt-replay.js';
import { generateLevel, GENERATOR_VERSION } from '../levels/generator.js';
import { localLevelContext } from '../levels/location-context.js';
const logger = new Logger('VerifiedTournamentService');
const MAX_TOURNAMENTS = 500;
const TOURNAMENT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ENTRIES_PER_TOURNAMENT = 10000;
const LEADERBOARD_CACHE_TTL_MS = 5 * 60 * 1000;
/**
 * VerifiedTournamentService - manages replay-verified tournaments.
 */
export class VerifiedTournamentService {
    constructor() {
        this.logger = new Logger('VerifiedTournamentService');
        this.tournaments = new Map(); // tournamentId -> tournament
        this.entries = new Map(); // entryId -> entry
        this.playerEntries = new Map(); // playerId -> Set of entryIds
        this.leaderboardCache = new Map(); // tournamentId -> { leaderboard, generatedAt }
    }
    /**
     * Evict expired tournaments and enforce max count.
     */
    _evictTournaments({ nowMs = Date.now() } = {}) {
        for (const [id, t] of this.tournaments) {
            if (t.status === 'completed' && t.completedAt && nowMs - t.completedAt > TOURNAMENT_TTL_MS) {
                this._removeTournament(id);
            }
        }
        while (this.tournaments.size > MAX_TOURNAMENTS) {
            let oldestKey = null;
            let oldestTime = Infinity;
            for (const [key, t] of this.tournaments) {
                if (t.status === 'completed' && t.completedAt && t.completedAt < oldestTime) {
                    oldestTime = t.completedAt;
                    oldestKey = key;
                }
            }
            if (oldestKey)
                this._removeTournament(oldestKey);
            else
                break;
        }
    }
    _removeTournament(tournamentId) {
        const tournament = this.tournaments.get(tournamentId);
        if (!tournament)
            return;
        // Remove entries associated with this tournament
        for (const entryId of tournament.entries) {
            const entry = this.entries.get(entryId);
            if (entry) {
                const playerEntries = this.playerEntries.get(entry.playerId);
                if (playerEntries) {
                    playerEntries.delete(tournamentId);
                    if (playerEntries.size === 0) {
                        this.playerEntries.delete(entry.playerId);
                    }
                }
                this.entries.delete(entryId);
            }
        }
        this.tournaments.delete(tournamentId);
        this.leaderboardCache.delete(tournamentId);
    }
    /**
     * Invalidate leaderboard cache for a tournament.
     */
    _invalidateLeaderboardCache(tournamentId) {
        this.leaderboardCache.delete(tournamentId);
    }
    /**
     * Create a new tournament.
     * config - { name, levelNumber, mode, startsAt, endsAt, entryFee, prizePool, maxEntries }
     */
    createTournament(config, { nowMs = Date.now() } = {}) {
        this._evictTournaments({ nowMs });
        const tournamentId = `tournament-${config.levelNumber}-${Math.floor(nowMs / 1000)}-${Math.random().toString(36).slice(2, 8)}`;
        const tournament = {
            id: tournamentId,
            name: config.name || `Level ${config.levelNumber} Challenge`,
            levelNumber: config.levelNumber,
            mode: config.mode || 'classic',
            startsAt: config.startsAt || nowMs,
            endsAt: config.endsAt || nowMs + 24 * 60 * 60 * 1000,
            entryFee: config.entryFee || 0,
            prizePool: config.prizePool || { coins: 10000, lives: 10 },
            maxEntries: config.maxEntries || 1000,
            status: 'scheduled', // scheduled -> active -> completed
            entries: [],
            verifiedEntries: 0,
            rejectedEntries: 0,
            createdAt: nowMs,
            levelSeed: null, // set when tournament activates (all players play same seed)
        };
        this.tournaments.set(tournamentId, tournament);
        logger.info('Created tournament', { tournamentId, levelNumber: config.levelNumber });
        return tournament;
    }
    /**
     * Activate a tournament - generates the shared level seed and level definition.
     * All players in an active tournament play the exact same level (same seed).
     */
    activateTournament(tournamentId, { nowMs = Date.now() } = {}) {
        const tournament = this.tournaments.get(tournamentId);
        if (!tournament) {
            throw new Error(`Tournament ${tournamentId} not found`);
        }
        if (tournament.status !== 'scheduled') {
            throw new Error(`Tournament ${tournamentId} already ${tournament.status}`);
        }
        // All players in the same tournament play the same level seed
        const context = localLevelContext({}, nowMs);
        const levelDefinition = generateLevel(tournament.levelNumber, context, tournament.mode, GENERATOR_VERSION);
        tournament.status = 'active';
        tournament.levelSeed = levelDefinition.seed;
        tournament.levelDefinition = {
            seed: levelDefinition.seed,
            targetScore: levelDefinition.targetScore,
            moves: levelDefinition.moves,
            gemTypes: levelDefinition.gemTypes,
            gemWeights: levelDefinition.gemWeights,
            boardWidth: levelDefinition.boardWidth,
            boardHeight: levelDefinition.boardHeight,
        };
        tournament.activatedAt = nowMs;
        this._invalidateLeaderboardCache(tournamentId);
        logger.info('Activated tournament', { tournamentId, seed: levelDefinition.seed });
        return tournament;
    }
    /**
     * Get active tournaments at nowMs.
     */
    getActiveTournaments({ nowMs = Date.now() } = {}) {
        const active = [];
        for (const [id, t] of this.tournaments) {
            if (t.status === 'scheduled' && nowMs >= t.startsAt && nowMs < t.endsAt) {
                t.status = 'active';
                // Auto-activate with level seed
                this.activateTournament(id, { nowMs });
            }
            if (t.status === 'active' && nowMs >= t.startsAt && nowMs < t.endsAt) {
                active.push(t);
            }
            if (t.status === 'active' && nowMs >= t.endsAt) {
                t.status = 'completed';
                t.completedAt = nowMs;
                this._invalidateLeaderboardCache(id);
            }
        }
        return active.sort((a, b) => a.endsAt - b.endsAt);
    }
    /**
     * Get a tournament by ID (includes level definition if active).
     */
    getTournament(tournamentId) {
        return this.tournaments.get(tournamentId);
    }
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
    async submitTournamentResult(tournamentId, playerId, { moves, reportedScore, reportedProgress, receipts, nowMs = Date.now(), } = {}) {
        const tournament = this.tournaments.get(tournamentId);
        if (!tournament) {
            return { accepted: false, reason: 'Tournament not found' };
        }
        if (tournament.status !== 'active') {
            return { accepted: false, reason: `Tournament is ${tournament.status}` };
        }
        if (nowMs < tournament.startsAt || nowMs >= tournament.endsAt) {
            return { accepted: false, reason: 'Tournament not active at this time' };
        }
        // Check if player already has an entry (one entry per player per tournament)
        const existingEntryIds = this.playerEntries.get(playerId);
        if (existingEntryIds && existingEntryIds.has(tournamentId)) {
            return { accepted: false, reason: 'Player already has an entry in this tournament' };
        }
        // Bound entries per tournament
        if (tournament.entries.length >= MAX_ENTRIES_PER_TOURNAMENT) {
            return { accepted: false, reason: 'Tournament entry limit reached' };
        }
        // Verify the replay server-side using the tournament's level definition
        const levelDef = tournament.levelDefinition;
        if (!levelDef) {
            return { accepted: false, reason: 'Tournament level not initialized' };
        }
        let verification;
        try {
            verification = replayLevelAttempt(levelDef, moves, reportedScore, reportedProgress, receipts);
        }
        catch (error) {
            logger.error('Replay verification threw', { tournamentId, playerId, error: error.message });
            return { accepted: false, reason: 'Replay verification error' };
        }
        if (!verification.verified) {
            // Record rejection
            tournament.rejectedEntries = (tournament.rejectedEntries || 0) + 1;
            logger.warn('Rejected unverified tournament result', {
                tournamentId, playerId, reason: verification.error,
            });
            return {
                accepted: false,
                reason: verification.error || 'Replay verification failed',
                verified: false,
            };
        }
        // Create verified entry
        const entryId = `entry-${tournamentId}-${playerId}-${Math.floor(nowMs / 1000)}`;
        const entry = {
            id: entryId,
            tournamentId,
            playerId,
            score: verification.score,
            progress: verification.progress,
            moves: moves.length,
            verified: true,
            verifiedAt: nowMs,
            levelSeed: tournament.levelSeed,
            replayHash: verification.replayHash,
        };
        this.entries.set(entryId, entry);
        if (!this.playerEntries.has(playerId)) {
            this.playerEntries.set(playerId, new Set());
        }
        this.playerEntries.get(playerId).add(tournamentId);
        tournament.entries.push(entryId);
        tournament.verifiedEntries = (tournament.verifiedEntries || 0) + 1;
        this._invalidateLeaderboardCache(tournamentId);
        logger.info('Accepted verified tournament result', {
            tournamentId, playerId, score: verification.score, verified: true,
        });
        return {
            accepted: true,
            entryId,
            score: verification.score,
            progress: verification.progress,
            verified: true,
        };
    }
    /**
     * Get the leaderboard for a tournament (verified entries only, sorted by score desc).
     * Results cached for LEADERBOARD_CACHE_TTL_MS.
     */
    getLeaderboard(tournamentId, { limit = 100 } = {}) {
        const now = Date.now();
        const cached = this.leaderboardCache.get(tournamentId);
        if (cached && now - cached.generatedAt < LEADERBOARD_CACHE_TTL_MS) {
            const entries = cached.leaderboard.slice(0, limit).map((e, rank) => ({
                rank: rank + 1,
                playerId: e.playerId,
                score: e.score,
                progress: e.progress,
                moves: e.moves,
                verified: e.verified,
                verifiedAt: e.verifiedAt,
            }));
            return {
                tournamentId,
                tournamentName: this.tournaments.get(tournamentId)?.name || '',
                entries,
                verifiedCount: cached.verifiedCount,
                rejectedCount: cached.rejectedCount,
            };
        }
        const tournament = this.tournaments.get(tournamentId);
        if (!tournament) {
            return { tournamentId, entries: [], verifiedCount: 0 };
        }
        const leaderboard = tournament.entries
            .map((entryId) => this.entries.get(entryId))
            .filter(Boolean)
            .filter((e) => e.verified)
            .sort((a, b) => b.score - a.score);
        const verifiedCount = leaderboard.length;
        const topEntries = leaderboard.slice(0, limit).map((e, rank) => ({
            rank: rank + 1,
            playerId: e.playerId,
            score: e.score,
            progress: e.progress,
            moves: e.moves,
            verified: e.verified,
            verifiedAt: e.verifiedAt,
        }));
        this.leaderboardCache.set(tournamentId, {
            leaderboard,
            generatedAt: now,
            verifiedCount,
            rejectedCount: tournament.rejectedEntries || 0,
        });
        return {
            tournamentId,
            tournamentName: tournament.name,
            entries: topEntries,
            verifiedCount,
            rejectedCount: tournament.rejectedEntries || 0,
        };
    }
    /**
     * Get all tournaments a player has entered.
     */
    getPlayerTournaments(playerId) {
        const entryIds = this.playerEntries.get(playerId);
        if (!entryIds)
            return [];
        return Array.from(entryIds).map((tId) => this.tournaments.get(tId)).filter(Boolean);
    }
    /**
     * Finalize a completed tournament - compute winners and distribute prizes.
     */
    finalizeTournament(tournamentId, { nowMs = Date.now() } = {}) {
        const tournament = this.tournaments.get(tournamentId);
        if (!tournament) {
            return { success: false, reason: 'Tournament not found' };
        }
        if (nowMs < tournament.endsAt) {
            return { success: false, reason: 'Tournament still active' };
        }
        const leaderboard = this.getLeaderboard(tournamentId, { limit: 10 });
        const winners = leaderboard.entries.slice(0, 3);
        tournament.status = 'completed';
        tournament.completedAt = nowMs;
        tournament.winners = winners;
        this._invalidateLeaderboardCache(tournamentId);
        logger.info('Finalized tournament', { tournamentId, winnerCount: winners.length });
        return {
            success: true,
            tournamentId,
            winners,
            totalVerifiedEntries: tournament.verifiedEntries,
            totalRejectedEntries: tournament.rejectedEntries,
        };
    }
    /**
     * Clear all data (testing / memory pressure).
     */
    clearCache() {
        this.tournaments.clear();
        this.entries.clear();
        this.playerEntries.clear();
        this.leaderboardCache.clear();
    }
}
export default VerifiedTournamentService;
//# sourceMappingURL=verified-tournament-service.js.map