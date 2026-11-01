/**
 * Multiplayer Tournament Manager
 * Runs single-elimination Match-3 tournaments using existing PvP sessions.
 *
 * Tournament lifecycle:
 *   registration -> active -> completed
 *
 * Each round pairs remaining players into head-to-head match3_versus sessions.
 * Winners advance; losers are eliminated. The last player standing wins.
 *
 * Live Ops integration: completed match results are published to the social
 * store's competition system (t:<id> / c:<id>) so they appear in the
 * /api/live-ops/competitions endpoint and count toward score challenges.
 */
export class TournamentManager {
    constructor(io: any, roomManager: any, sessionManager: any, antiCheatSystem: any, socialStore_?: import("../../services/social/social-store.js").SocialStore);
    logger: Logger;
    io: any;
    roomManager: any;
    sessionManager: any;
    antiCheatSystem: any;
    socialStore: import("../../services/social/social-store.js").SocialStore;
    tournaments: Map<any, any>;
    playerTournaments: Map<any, any>;
    matches: Map<any, any>;
    defaultEntryFee: number;
    defaultPrizePool: number;
    minPlayers: number;
    maxPlayers: number;
    matchTimeLimit: number;
    matchMaxMoves: number;
    /** Initialize tournament manager */
    initializeTournamentManager(): void;
    /** Create a new tournament */
    createTournament(creatorId: any, options?: {}): {
        success: boolean;
        tournament: {
            id: any;
            name: any;
            creatorId: any;
            status: any;
            format: any;
            playerCount: any;
            maxPlayers: any;
            entryFee: any;
            prizePool: any;
            currentRound: any;
            players: any[];
            brackets: any;
            winnerId: any;
            createdAt: any;
            startedAt: any;
            completedAt: any;
        };
        message: string;
    };
    /** Join a tournament */
    joinTournament(playerId: any, tournamentId: any): Promise<{
        success: boolean;
        tournament: {
            id: any;
            name: any;
            creatorId: any;
            status: any;
            format: any;
            playerCount: any;
            maxPlayers: any;
            entryFee: any;
            prizePool: any;
            currentRound: any;
            players: any[];
            brackets: any;
            winnerId: any;
            createdAt: any;
            startedAt: any;
            completedAt: any;
        };
        message: string;
    }>;
    /** Start a tournament - generate brackets and first round matches */
    startTournament(tournamentId: any, startedBy: any): {
        success: boolean;
        tournament: {
            id: any;
            name: any;
            creatorId: any;
            status: any;
            format: any;
            playerCount: any;
            maxPlayers: any;
            entryFee: any;
            prizePool: any;
            currentRound: any;
            players: any[];
            brackets: any;
            winnerId: any;
            createdAt: any;
            startedAt: any;
            completedAt: any;
        };
        message: string;
    };
    /** Generate a single-elimination bracket from players */
    generateBracket(players: any, settings: any): {
        round: number;
        matches: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            round: number;
            matchNumber: number;
            player1Id: any;
            player2Id: any;
            sessionId: null;
            winnerId: null;
            scores: {};
            status: string;
            winnerAdvancesTo: null;
        }[];
    }[];
    /** Create a PvP session for a match */
    createMatchSession(tournament: any, match: any): any;
    /** Record a match result and advance the winner */
    recordMatchResult(tournamentId: any, matchId: any, winnerId: any, scores: {} | undefined, reportedBy: any): Promise<{
        success: boolean;
        match: {
            id: any;
            round: any;
            matchNumber: any;
            player1Id: any;
            player2Id: any;
            winnerId: any;
            scores: any;
            status: any;
            sessionId: any;
            winnerAdvancesTo: any;
        };
        tournament: {
            id: any;
            name: any;
            creatorId: any;
            status: any;
            format: any;
            playerCount: any;
            maxPlayers: any;
            entryFee: any;
            prizePool: any;
            currentRound: any;
            players: any[];
            brackets: any;
            winnerId: any;
            createdAt: any;
            startedAt: any;
            completedAt: any;
        };
        message: string;
    }>;
    /** Distribute prize pool to tournament winners based on placement. */
    distributePrizes(tournament: any, winnerId: any): Promise<{
        playerId: any;
        placement: number;
        prizeAmount: number;
    }[]>;
    /** Determine placement for all players in a completed tournament. */
    getTournamentPlacements(tournament: any, winnerId: any): {
        playerId: any;
        placement: number;
    }[];
    /** Get tournament details (public view) */
    getPublicTournament(tournament: any): {
        id: any;
        name: any;
        creatorId: any;
        status: any;
        format: any;
        playerCount: any;
        maxPlayers: any;
        entryFee: any;
        prizePool: any;
        currentRound: any;
        players: any[];
        brackets: any;
        winnerId: any;
        createdAt: any;
        startedAt: any;
        completedAt: any;
    };
    /** Get match details (public view) */
    getPublicMatch(match: any): {
        id: any;
        round: any;
        matchNumber: any;
        player1Id: any;
        player2Id: any;
        winnerId: any;
        scores: any;
        status: any;
        sessionId: any;
        winnerAdvancesTo: any;
    };
    /** Get tournament standings (final placement) */
    getTournamentStandings(tournamentId: any): {
        tournamentId: any;
        winnerId: any;
        standings: {
            playerId: any;
            placement: number;
            roundsWon: number;
            prize: number;
        }[];
    };
    /** Calculate prize for a placement */
    calculatePrize(placement: any, totalPrizePool: any): number;
    /** Get player's current tournament */
    getPlayerTournament(playerId: any): {
        id: any;
        name: any;
        creatorId: any;
        status: any;
        format: any;
        playerCount: any;
        maxPlayers: any;
        entryFee: any;
        prizePool: any;
        currentRound: any;
        players: any[];
        brackets: any;
        winnerId: any;
        createdAt: any;
        startedAt: any;
        completedAt: any;
    } | null;
    /** Get tournament by id */
    getTournament(tournamentId: any): {
        id: any;
        name: any;
        creatorId: any;
        status: any;
        format: any;
        playerCount: any;
        maxPlayers: any;
        entryFee: any;
        prizePool: any;
        currentRound: any;
        players: any[];
        brackets: any;
        winnerId: any;
        createdAt: any;
        startedAt: any;
        completedAt: any;
    } | null;
    /** Get match by id */
    getMatch(matchId: any): {
        id: any;
        round: any;
        matchNumber: any;
        player1Id: any;
        player2Id: any;
        winnerId: any;
        scores: any;
        status: any;
        sessionId: any;
        winnerAdvancesTo: any;
    } | null;
    /** Get available (registration-phase) tournaments */
    getAvailableTournaments(): {
        id: any;
        name: any;
        creatorId: any;
        status: any;
        format: any;
        playerCount: any;
        maxPlayers: any;
        entryFee: any;
        prizePool: any;
        currentRound: any;
        players: any[];
        brackets: any;
        winnerId: any;
        createdAt: any;
        startedAt: any;
        completedAt: any;
    }[];
    /** Reset all tournament state (for testing) */
    reset(): void;
    /** Get tournament statistics */
    getStatistics(): {
        totalTournaments: number;
        registration: number;
        active: number;
        completed: number;
        totalPlayersInTournaments: number;
        totalMatches: number;
        completedMatches: number;
    };
}
import { Logger } from '../../core/logger/index.js';
//# sourceMappingURL=tournament-manager.d.ts.map