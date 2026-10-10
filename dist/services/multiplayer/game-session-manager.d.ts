/**
 * Game Session Manager
 * Handles individual game sessions, state synchronization, and turn management
 */
export class GameSessionManager {
    constructor(io: any);
    logger: Logger;
    io: any;
    sessions: Map<any, any>;
    playerSessions: Map<any, any>;
    sessionTimeout: number;
    turnTimeout: number;
    maxMovesPerSession: number;
    gameStateTemplates: {
        match3_versus: {
            gameType: string;
            timeLimit: number;
            maxMoves: number;
            targetScore: number;
            powerUps: boolean;
        };
        match3_tournament: {
            gameType: string;
            rounds: never[];
            currentRound: number;
            bracket: never[];
            timeLimit: number;
        };
        match3_coop: {
            gameType: string;
            sharedScore: number;
            targetScore: number;
            timeLimit: number;
        };
    };
    /**
     * Initialize session manager
     */
    initializeSessionManager(): void;
    /**
     * Start a new game session
     */
    startSession(roomId: any, players: any, gameType: any, settings?: {}): {
        success: boolean;
        sessionId: `${string}-${string}-${string}-${string}-${string}`;
        session: {
            id: any;
            roomId: any;
            gameType: any;
            status: any;
            players: any[];
            spectators: any[];
            currentTurn: any;
            moveCount: any;
            scores: any;
            winner: any;
            createdAt: any;
            lastActivity: any;
        };
        message: string;
    };
    /**
     * Make a move in the game
     */
    makeMove(sessionId: any, playerId: any, move: any): {
        success: boolean;
        moveResult: {
            success: boolean;
            score: number;
            matches: never[];
            newBoard: null;
            powerUps: never[];
        };
        gameState: {
            sessionId: any;
            gameType: any;
            status: any;
            currentTurn: any;
            moveCount: any;
            scores: any;
            board: any;
            lastMove: any;
            timeRemaining: number | null;
        };
        message: string;
    };
    /**
     * Join a session as spectator
     */
    joinAsSpectator(sessionId: any, playerId: any): {
        success: boolean;
        session: {
            id: any;
            roomId: any;
            gameType: any;
            status: any;
            players: any[];
            spectators: any[];
            currentTurn: any;
            moveCount: any;
            scores: any;
            winner: any;
            createdAt: any;
            lastActivity: any;
        };
        message: string;
    };
    /**
     * Leave a session
     */
    leaveSession(sessionId: any, playerId: any): {
        success: boolean;
        message: string;
    };
    /**
     * Pause a session
     */
    pauseSession(sessionId: any, playerId: any): {
        success: boolean;
        message: string;
    };
    /**
     * Resume a session
     */
    resumeSession(sessionId: any, playerId: any): {
        success: boolean;
        message: string;
    };
    /**
     * Get session information
     */
    getSessionInfo(session: any): {
        id: any;
        roomId: any;
        gameType: any;
        status: any;
        players: any[];
        spectators: any[];
        currentTurn: any;
        moveCount: any;
        scores: any;
        winner: any;
        createdAt: any;
        lastActivity: any;
    };
    /**
     * Get player's current session
     */
    getPlayerSession(playerId: any): {
        id: any;
        roomId: any;
        gameType: any;
        status: any;
        players: any[];
        spectators: any[];
        currentTurn: any;
        moveCount: any;
        scores: any;
        winner: any;
        createdAt: any;
        lastActivity: any;
    } | null;
    /**
     * Get public game state (what spectators can see)
     */
    getPublicGameState(session: any): {
        sessionId: any;
        gameType: any;
        status: any;
        currentTurn: any;
        moveCount: any;
        scores: any;
        board: any;
        lastMove: any;
        timeRemaining: number | null;
    };
    /**
     * Initialize game state
     */
    initializeGameState(gameType: any, players: any, settings: any): any;
    /**
     * Initialize scores for players
     */
    initializeScores(players: any): {};
    /**
     * Validate a move
     */
    validateMove(session: any, playerId: any, move: any): boolean;
    /**
     * Validate Match-3 move
     */
    validateMatch3Move(session: any, move: any): boolean;
    /**
     * Process a move
     */
    processMove(session: any, playerId: any, move: any): {
        success: boolean;
        score: number;
        matches: never[];
        newBoard: null;
        powerUps: never[];
    };
    /**
     * Process Match-3 move
     */
    processMatch3Move(session: any, playerId: any, move: any): {
        success: boolean;
        score: number;
        matches: never[];
        newBoard: null;
        powerUps: never[];
    };
    /**
     * Find matches on the board
     */
    findMatches(board: any): {
        type: string;
        tiles: number[][];
        value: any;
    }[];
    /**
     * Calculate score from matches
     */
    calculateScore(matches: any): number;
    /**
     * Check for power-ups
     */
    checkPowerUps(matches: any): {
        type: string;
        position: any;
    }[];
    /**
     * Switch to next player's turn
     */
    switchTurn(session: any): void;
    /**
     * Check game end conditions
     */
    checkGameEndConditions(session: any): {
        isGameOver: boolean;
        winner: null;
        reason: null;
    };
    /**
     * Check Match-3 versus end conditions
     */
    checkMatch3VersusEndConditions(session: any): {
        isGameOver: boolean;
        winner: null;
        reason: null;
    };
    /**
     * Check Match-3 tournament end conditions
     */
    checkMatch3TournamentEndConditions(session: any): {
        isGameOver: boolean;
        winner: null;
        reason: null;
    };
    /**
     * Check Match-3 coop end conditions
     */
    checkMatch3CoopEndConditions(session: any): {
        isGameOver: boolean;
        winner: null;
        reason: null;
    };
    /**
     * Get highest scoring player
     */
    getHighestScoringPlayer(session: any): string | null;
    /**
     * Get time remaining in current turn
     */
    getTimeRemaining(session: any): number | null;
    /**
     * Process turn timeouts
     */
    processTurnTimeouts(): void;
    /**
     * Cleanup inactive sessions
     */
    cleanupInactiveSessions(): void;
    /**
     * Generate board for game type
     */
    generateBoard(gameType: any, settings: any): never[][];
    /**
     * Get Match-3 versus template
     */
    getMatch3VersusTemplate(): {
        gameType: string;
        timeLimit: number;
        maxMoves: number;
        targetScore: number;
        powerUps: boolean;
    };
    /**
     * Get Match-3 tournament template
     */
    getMatch3TournamentTemplate(): {
        gameType: string;
        rounds: never[];
        currentRound: number;
        bracket: never[];
        timeLimit: number;
    };
    /**
     * Get Match-3 coop template
     */
    getMatch3CoopTemplate(): {
        gameType: string;
        sharedScore: number;
        targetScore: number;
        timeLimit: number;
    };
    /**
     * Get session statistics
     */
    getStatistics(): {
        totalSessions: number;
        activePlayers: number;
        gameTypeDistribution: {};
        averageSessionDuration: number;
    };
    /**
     * Get game type distribution
     */
    getGameTypeDistribution(): {};
    /**
     * Get average session duration
     */
    getAverageSessionDuration(): number;
}
import { Logger } from '../../core/logger/index.js';
//# sourceMappingURL=game-session-manager.d.ts.map