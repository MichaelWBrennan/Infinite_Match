import express from 'express';
import { Logger } from '../core/logger/index.js';
import { ServiceError } from '../core/errors/ErrorHandler.js';
import { RoomManager } from '../services/multiplayer/room-manager.js';
import { GameSessionManager } from '../services/multiplayer/game-session-manager.js';
import { AntiCheatSystem } from '../services/multiplayer/anti-cheat-system.js';
import { TournamentManager } from '../services/multiplayer/tournament-manager.js';
import { accountEconomy as accountEconomyService } from '../services/economy/AccountEconomyService.js';
import { loadLiveOps } from '../services/live-ops/live-ops.js';
import { recordVerifiedChallengeWin } from '../services/live-ops/score-challenge-economy.js';
import security from '../core/security/index.js';
const router = express.Router();
const logger = new Logger('MultiplayerRoutes');
// All multiplayer routes require an authenticated player session.
// The player id comes from the JWT, never from the request body.
router.use(security.sessionValidation);
// Initialize multiplayer services
let roomManager = null;
let sessionManager = null;
let antiCheatSystem = null;
let tournamentManager = null;
/**
 * Get the initialized room manager (for Socket.IO handlers)
 */
function getRoomManager() {
    return roomManager;
}
/**
 * Get the initialized session manager (for Socket.IO handlers)
 */
function getSessionManager() {
    return sessionManager;
}
/**
 * Get the initialized anti-cheat system (for Socket.IO handlers)
 */
function getAntiCheatSystem() {
    return antiCheatSystem;
}
/**
 * Get the initialized tournament manager (for Socket.IO handlers)
 */
function getTournamentManager() {
    return tournamentManager;
}
/**
 * Initialize multiplayer services
 */
function initializeMultiplayerServices(io) {
    if (!roomManager) {
        roomManager = new RoomManager(io);
        sessionManager = new GameSessionManager(io);
        antiCheatSystem = new AntiCheatSystem();
        tournamentManager = new TournamentManager(io, roomManager, sessionManager, antiCheatSystem);
        logger.info('Multiplayer services initialized');
    }
}
/**
 * ROOM MANAGEMENT ROUTES
 */
// Create a new room
router.post('/rooms', async (req, res) => {
    try {
        const playerId = req.user.id;
        const { gameType, options = {} } = req.body;
        if (!gameType) {
            return res.status(400).json({
                success: false,
                error: 'Game type is required'
            });
        }
        const result = roomManager.createRoom(playerId, gameType, options);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger.error('Failed to create room:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Join a room
router.post('/rooms/:roomId/join', async (req, res) => {
    try {
        const { roomId } = req.params;
        const playerId = req.user.id;
        const { password } = req.body;
        const result = roomManager.joinRoom(playerId, roomId, password);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger.error('Failed to join room:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Leave a room
router.post('/rooms/:roomId/leave', async (req, res) => {
    try {
        const { roomId } = req.params;
        const playerId = req.user.id;
        const result = roomManager.leaveRoom(playerId, roomId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger.error('Failed to leave room:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Get available rooms
router.get('/rooms', async (req, res) => {
    try {
        const { gameType, limit = 20 } = req.query;
        const rooms = roomManager.getAvailableRooms(gameType, parseInt(limit));
        res.json({
            success: true,
            data: rooms
        });
    }
    catch (error) {
        logger.error('Failed to get rooms:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Get room details
router.get('/rooms/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;
        const room = roomManager.rooms.get(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                error: 'Room not found'
            });
        }
        res.json({
            success: true,
            data: roomManager.getRoomInfo(room)
        });
    }
    catch (error) {
        logger.error('Failed to get room details:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * MATCHMAKING ROUTES
 */
// Start matchmaking
router.post('/matchmaking/start', async (req, res) => {
    try {
        const playerId = req.user.id;
        const { gameType, preferences = {} } = req.body;
        if (!gameType) {
            return res.status(400).json({
                success: false,
                error: 'Game type is required'
            });
        }
        const result = roomManager.startMatchmaking(playerId, gameType, preferences);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger.error('Failed to start matchmaking:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Stop matchmaking
router.post('/matchmaking/stop', async (req, res) => {
    try {
        const playerId = req.user.id;
        const result = roomManager.stopMatchmaking(playerId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger.error('Failed to stop matchmaking:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * GAME SESSION ROUTES
 */
// Start a game session
router.post('/sessions/start', async (req, res) => {
    try {
        const playerId = req.user.id;
        const { roomId, gameType, settings = {} } = req.body;
        if (!roomId || !gameType) {
            return res.status(400).json({
                success: false,
                error: 'Room ID and game type are required'
            });
        }
        const players = [playerId];
        const result = sessionManager.startSession(roomId, players, gameType, settings);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger.error('Failed to start game session:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Make a move
router.post('/sessions/:sessionId/move', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const playerId = req.user.id;
        const { move } = req.body;
        if (!move) {
            return res.status(400).json({
                success: false,
                error: 'Move is required'
            });
        }
        // Get session for anti-cheat validation
        const session = sessionManager.sessions.get(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }
        // Validate move with anti-cheat system
        const cheatValidation = antiCheatSystem.validateMove(playerId, move, session.gameState, session);
        if (!cheatValidation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Invalid move detected by anti-cheat system',
                details: cheatValidation.warnings
            });
        }
        let result;
        try {
            result = sessionManager.makeMove(sessionId, playerId, move);
        }
        catch (moveError) {
            // Game validation errors (not your turn, invalid move, session not active)
            // are client errors, not server errors.
            return res.status(400).json({
                success: false,
                error: moveError.message
            });
        }
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger.error('Failed to make move:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Join session as spectator
router.post('/sessions/:sessionId/spectate', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const playerId = req.user.id;
        const result = sessionManager.joinAsSpectator(sessionId, playerId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger.error('Failed to join as spectator:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Leave session
router.post('/sessions/:sessionId/leave', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const playerId = req.user.id;
        const result = sessionManager.leaveSession(sessionId, playerId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger.error('Failed to leave session:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Pause session
router.post('/sessions/:sessionId/pause', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const playerId = req.user.id;
        const result = sessionManager.pauseSession(sessionId, playerId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger.error('Failed to pause session:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Resume session
router.post('/sessions/:sessionId/resume', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const playerId = req.user.id;
        const result = sessionManager.resumeSession(sessionId, playerId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger.error('Failed to resume session:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Get session details
router.get('/sessions/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = sessionManager.sessions.get(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }
        res.json({
            success: true,
            data: sessionManager.getSessionInfo(session)
        });
    }
    catch (error) {
        logger.error('Failed to get session details:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Get player's current session
router.get('/players/:playerId/session', async (req, res) => {
    try {
        const playerId = req.user.id;
        const session = sessionManager.getPlayerSession(playerId);
        res.json({
            success: true,
            data: session
        });
    }
    catch (error) {
        logger.error('Failed to get player session:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * ANTI-CHEAT ROUTES
 */
// Get player anti-cheat statistics
router.get('/anti-cheat/players/:playerId', async (req, res) => {
    try {
        const playerId = req.user.id;
        const stats = antiCheatSystem.getPlayerStatistics(playerId);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        logger.error('Failed to get player anti-cheat stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Get anti-cheat system statistics
router.get('/anti-cheat/stats', async (req, res) => {
    try {
        const stats = antiCheatSystem.getSystemStatistics();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        logger.error('Failed to get anti-cheat stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Ban a player (admin only)
router.post('/anti-cheat/ban', async (req, res) => {
    try {
        const { playerId, reason } = req.body;
        if (!playerId || !reason) {
            return res.status(400).json({
                success: false,
                error: 'Player ID and reason are required'
            });
        }
        antiCheatSystem.banPlayer(playerId, reason);
        res.json({
            success: true,
            message: 'Player banned successfully'
        });
    }
    catch (error) {
        logger.error('Failed to ban player:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Unban a player (admin only)
router.post('/anti-cheat/unban', async (req, res) => {
    try {
        const { playerId } = req.body;
        if (!playerId) {
            return res.status(400).json({
                success: false,
                error: 'Player ID is required'
            });
        }
        antiCheatSystem.unbanPlayer(playerId);
        res.json({
            success: true,
            message: 'Player unbanned successfully'
        });
    }
    catch (error) {
        logger.error('Failed to unban player:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * TOURNAMENT ROUTES
 */
// Create a new tournament
router.post('/tournaments', async (req, res) => {
    try {
        const playerId = req.user.id;
        const { name, maxPlayers, entryFee, prizePool, settings = {} } = req.body;
        const result = tournamentManager.createTournament(playerId, {
            name,
            maxPlayers,
            entryFee,
            prizePool,
            settings
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger.error('Failed to create tournament:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Join a tournament
router.post('/tournaments/:tournamentId/join', async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const playerId = req.user.id;
        const result = await tournamentManager.joinTournament(playerId, tournamentId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger.error('Failed to join tournament:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Start a tournament
router.post('/tournaments/:tournamentId/start', async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const playerId = req.user.id;
        const result = tournamentManager.startTournament(tournamentId, playerId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger.error('Failed to start tournament:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Get tournament details
router.get('/tournaments/:tournamentId', async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const tournament = tournamentManager.getTournament(tournamentId);
        if (!tournament) {
            return res.status(404).json({
                success: false,
                error: 'Tournament not found'
            });
        }
        res.json({
            success: true,
            data: tournament
        });
    }
    catch (error) {
        logger.error('Failed to get tournament details:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Get tournament standings
router.get('/tournaments/:tournamentId/standings', async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const standings = tournamentManager.getTournamentStandings(tournamentId);
        res.json({
            success: true,
            data: standings
        });
    }
    catch (error) {
        logger.error('Failed to get tournament standings:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// List available tournaments (registration phase)
router.get('/tournaments', async (req, res) => {
    try {
        const tournaments = tournamentManager.getAvailableTournaments();
        res.json({
            success: true,
            data: tournaments
        });
    }
    catch (error) {
        logger.error('Failed to list tournaments:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Record a match result
router.post('/tournaments/:tournamentId/matches/:matchId/result', async (req, res) => {
    try {
        const { tournamentId, matchId } = req.params;
        const playerId = req.user.id;
        const { winnerId, scores = {} } = req.body;
        if (!winnerId) {
            return res.status(400).json({
                success: false,
                error: 'Winner ID is required'
            });
        }
        const result = await tournamentManager.recordMatchResult(tournamentId, matchId, winnerId, scores, playerId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger.error('Failed to record match result:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Record a PvP match win toward the player's active score challenge.
// The score comes from the completed PvP session.
router.post('/sessions/:sessionId/record-win', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const playerId = req.user.id;
        const { score } = req.body;
        if (!Number.isInteger(score) || score < 0) {
            return res.status(400).json({
                success: false,
                error: 'Score must be a non-negative integer'
            });
        }
        const session = sessionManager.sessions.get(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }
        if (!session.players.has(playerId)) {
            return res.status(403).json({
                success: false,
                error: 'Player not in session'
            });
        }
        const economy = await accountEconomyService.getPlayerEconomy(playerId);
        const config = loadLiveOps();
        const result = await accountEconomyService.withPlayerLock(playerId, () => {
            const currentEconomy = accountEconomyService.getPlayerEconomy(playerId);
            const recorded = recordVerifiedChallengeWin(currentEconomy, config, score);
            if (recorded) {
                accountEconomyService.updatePlayerEconomyCache(playerId, currentEconomy);
            }
            return recorded;
        });
        res.json({
            success: true,
            data: result,
            message: result ? 'Win recorded toward score challenge' : 'No active score challenge'
        });
    }
    catch (error) {
        logger.error('Failed to record PvP win:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * STATISTICS ROUTES
 */
// Get multiplayer statistics
router.get('/stats', async (req, res) => {
    try {
        const roomStats = roomManager.getStatistics();
        const sessionStats = sessionManager.getStatistics();
        const antiCheatStats = antiCheatSystem.getSystemStatistics();
        res.json({
            success: true,
            data: {
                rooms: roomStats,
                sessions: sessionStats,
                antiCheat: antiCheatStats,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger.error('Failed to get multiplayer stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * UTILITY ROUTES
 */
// Get supported game types
router.get('/game-types', (req, res) => {
    const gameTypes = {
        'match3_classic': {
            name: 'Classic Match-3',
            description: 'Single-player Match-3 gameplay',
            minPlayers: 1,
            maxPlayers: 1,
            isCompetitive: false
        },
        'match3_versus': {
            name: 'Match-3 Versus',
            description: 'Head-to-head Match-3 competition',
            minPlayers: 2,
            maxPlayers: 2,
            isCompetitive: true
        },
        'match3_tournament': {
            name: 'Match-3 Tournament',
            description: 'Tournament-style Match-3',
            minPlayers: 4,
            maxPlayers: 8,
            isCompetitive: true
        },
        'match3_coop': {
            name: 'Match-3 Cooperative',
            description: 'Cooperative Match-3 challenges',
            minPlayers: 2,
            maxPlayers: 4,
            isCompetitive: false
        }
    };
    res.json({
        success: true,
        data: gameTypes
    });
});
// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'healthy',
            services: {
                roomManager: roomManager ? 'active' : 'inactive',
                sessionManager: sessionManager ? 'active' : 'inactive',
                antiCheatSystem: antiCheatSystem ? 'active' : 'inactive'
            },
            timestamp: new Date().toISOString()
        }
    });
});
// Export the router, initialization function, and service accessors
export { router, initializeMultiplayerServices, getRoomManager, getSessionManager, getAntiCheatSystem, getTournamentManager };
//# sourceMappingURL=multiplayer.js.map