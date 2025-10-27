import express from 'express';
import { Logger } from '../core/logger/index.js';
import { ServiceError } from '../core/errors/ErrorHandler.js';
import { RoomManager } from '../services/multiplayer/room-manager.js';
import { GameSessionManager } from '../services/multiplayer/game-session-manager.js';
import { AntiCheatSystem } from '../services/multiplayer/anti-cheat-system.js';

const router = express.Router();
const logger = new Logger('MultiplayerRoutes');

// Initialize multiplayer services
let roomManager = null;
let sessionManager = null;
let antiCheatSystem = null;

/**
 * Initialize multiplayer services
 */
function initializeMultiplayerServices(io) {
  if (!roomManager) {
    roomManager = new RoomManager(io);
    sessionManager = new GameSessionManager(io);
    antiCheatSystem = new AntiCheatSystem();
    logger.info('Multiplayer services initialized');
  }
}

/**
 * ROOM MANAGEMENT ROUTES
 */

// Create a new room
router.post('/rooms', async (req, res) => {
  try {
    const { playerId, gameType, options = {} } = req.body;

    if (!playerId || !gameType) {
      return res.status(400).json({
        success: false,
        error: 'Player ID and game type are required'
      });
    }

    const result = roomManager.createRoom(playerId, gameType, options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
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
    const { playerId, password } = req.body;

    if (!playerId) {
      return res.status(400).json({
        success: false,
        error: 'Player ID is required'
      });
    }

    const result = roomManager.joinRoom(playerId, roomId, password);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
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
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({
        success: false,
        error: 'Player ID is required'
      });
    }

    const result = roomManager.leaveRoom(playerId, roomId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
    const { playerId, gameType, preferences = {} } = req.body;

    if (!playerId || !gameType) {
      return res.status(400).json({
        success: false,
        error: 'Player ID and game type are required'
      });
    }

    const result = roomManager.startMatchmaking(playerId, gameType, preferences);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
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
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({
        success: false,
        error: 'Player ID is required'
      });
    }

    const result = roomManager.stopMatchmaking(playerId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
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
    const { roomId, players, gameType, settings = {} } = req.body;

    if (!roomId || !players || !gameType) {
      return res.status(400).json({
        success: false,
        error: 'Room ID, players, and game type are required'
      });
    }

    const result = sessionManager.startSession(roomId, players, gameType, settings);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
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
    const { playerId, move } = req.body;

    if (!playerId || !move) {
      return res.status(400).json({
        success: false,
        error: 'Player ID and move are required'
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

    const result = sessionManager.makeMove(sessionId, playerId, move);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
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
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({
        success: false,
        error: 'Player ID is required'
      });
    }

    const result = sessionManager.joinAsSpectator(sessionId, playerId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
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
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({
        success: false,
        error: 'Player ID is required'
      });
    }

    const result = sessionManager.leaveSession(sessionId, playerId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
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
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({
        success: false,
        error: 'Player ID is required'
      });
    }

    const result = sessionManager.pauseSession(sessionId, playerId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
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
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({
        success: false,
        error: 'Player ID is required'
      });
    }

    const result = sessionManager.resumeSession(sessionId, playerId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
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
  } catch (error) {
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
    const { playerId } = req.params;
    const session = sessionManager.getPlayerSession(playerId);

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
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
    const { playerId } = req.params;
    const stats = antiCheatSystem.getPlayerStatistics(playerId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    logger.error('Failed to unban player:', error);
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
  } catch (error) {
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

// Export the router and initialization function
export { router, initializeMultiplayerServices };