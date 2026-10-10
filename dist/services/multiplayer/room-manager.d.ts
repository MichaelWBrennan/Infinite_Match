/**
 * Multiplayer Room Manager
 * Handles game rooms, lobbies, and player matchmaking
 */
export class RoomManager {
    constructor(io: any);
    logger: Logger;
    io: any;
    rooms: Map<any, any>;
    playerRooms: Map<any, any>;
    waitingPlayers: Set<any>;
    maxRoomsPerPlayer: number;
    maxPlayersPerRoom: number;
    roomTimeout: number;
    matchmakingTimeout: number;
    gameTypes: {
        match3_classic: {
            minPlayers: number;
            maxPlayers: number;
            isCompetitive: boolean;
            description: string;
        };
        match3_versus: {
            minPlayers: number;
            maxPlayers: number;
            isCompetitive: boolean;
            description: string;
        };
        match3_tournament: {
            minPlayers: number;
            maxPlayers: number;
            isCompetitive: boolean;
            description: string;
        };
        match3_coop: {
            minPlayers: number;
            maxPlayers: number;
            isCompetitive: boolean;
            description: string;
        };
    };
    /**
     * Initialize room manager
     */
    initializeRoomManager(): void;
    /**
     * Create a new game room
     */
    createRoom(creatorId: any, gameType: any, options?: {}): {
        success: boolean;
        room: {
            id: any;
            gameType: any;
            creator: any;
            playerCount: any;
            maxPlayers: any;
            status: any;
            createdAt: any;
            isPrivate: any;
            settings: any;
            players: any[];
            spectators: any[];
        };
        message: string;
    };
    /**
     * Join a room
     */
    joinRoom(playerId: any, roomId: any, password?: null): {
        success: boolean;
        room: {
            id: any;
            gameType: any;
            creator: any;
            playerCount: any;
            maxPlayers: any;
            status: any;
            createdAt: any;
            isPrivate: any;
            settings: any;
            players: any[];
            spectators: any[];
        };
        message: string;
    };
    /**
     * Leave a room
     */
    leaveRoom(playerId: any, roomId: any): {
        success: boolean;
        message: string;
    };
    /**
     * Start matchmaking for a player
     */
    startMatchmaking(playerId: any, gameType: any, preferences?: {}): {
        success: boolean;
        message: string;
        estimatedWaitTime: number;
    };
    /**
     * Stop matchmaking for a player
     */
    stopMatchmaking(playerId: any): {
        success: boolean;
        message: string;
    };
    /**
     * Process matchmaking queue
     */
    processMatchmakingQueue(): void;
    /**
     * Match competitive players
     */
    matchCompetitivePlayers(gameType: any, players: any): void;
    /**
     * Match cooperative players
     */
    matchCooperativePlayers(gameType: any, players: any): void;
    /**
     * Get room information
     */
    getRoomInfo(room: any): {
        id: any;
        gameType: any;
        creator: any;
        playerCount: any;
        maxPlayers: any;
        status: any;
        createdAt: any;
        isPrivate: any;
        settings: any;
        players: any[];
        spectators: any[];
    };
    /**
     * Get player's current room
     */
    getPlayerRoom(playerId: any): {
        id: any;
        gameType: any;
        creator: any;
        playerCount: any;
        maxPlayers: any;
        status: any;
        createdAt: any;
        isPrivate: any;
        settings: any;
        players: any[];
        spectators: any[];
    } | null;
    /**
     * Get available rooms
     */
    getAvailableRooms(gameType?: null, limit?: number): {
        id: any;
        gameType: any;
        creator: any;
        playerCount: any;
        maxPlayers: any;
        status: any;
        createdAt: any;
        isPrivate: any;
        settings: any;
        players: any[];
        spectators: any[];
    }[];
    /**
     * Get player room count
     */
    getPlayerRoomCount(playerId: any): number;
    /**
     * Initialize game state for a room
     */
    initializeGameState(gameType: any): {
        gameType: any;
        status: string;
        currentTurn: null;
        turnStartTime: null;
        moveCount: number;
        scores: {};
        board: null;
        lastMove: null;
    } | {
        timeLimit: number;
        maxMoves: number;
        targetScore: number;
        gameType: any;
        status: string;
        currentTurn: null;
        turnStartTime: null;
        moveCount: number;
        scores: {};
        board: null;
        lastMove: null;
    } | {
        rounds: never[];
        currentRound: number;
        bracket: never[];
        timeLimit: number;
        gameType: any;
        status: string;
        currentTurn: null;
        turnStartTime: null;
        moveCount: number;
        scores: {};
        board: null;
        lastMove: null;
    } | {
        sharedScore: number;
        targetScore: number;
        timeLimit: number;
        gameType: any;
        status: string;
        currentTurn: null;
        turnStartTime: null;
        moveCount: number;
        scores: {};
        board: null;
        lastMove: null;
    };
    /**
     * Get default room settings
     */
    getDefaultRoomSettings(gameType: any): any;
    /**
     * Get estimated wait time for matchmaking
     */
    getEstimatedWaitTime(gameType: any): number;
    /**
     * Cleanup inactive rooms
     */
    cleanupInactiveRooms(): void;
    /**
     * Get room statistics
     */
    getStatistics(): {
        totalRooms: number;
        waitingPlayers: number;
        activePlayers: number;
        gameTypeDistribution: {};
        averageRoomSize: number;
    };
    /**
     * Get game type distribution
     */
    getGameTypeDistribution(): {};
    /**
     * Get average room size
     */
    getAverageRoomSize(): number;
}
import { Logger } from '../../core/logger/index.js';
//# sourceMappingURL=room-manager.d.ts.map