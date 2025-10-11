import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { Logger } from '../../core/logger/index.js';
import { redisService } from '../../services/cache/RedisService.js';

const logger = new Logger('WebSocketService');

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3006;

// Initialize Redis
await redisService.connect();

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
};

// Socket.IO server
const io = new SocketIOServer(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'websocket-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    connections: io.engine.clientsCount
  });
});

// Connection handling
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });

  // Join game room
  socket.on('join-game', async (data) => {
    try {
      const { playerId, gameId } = data;
      
      if (!playerId || !gameId) {
        socket.emit('error', { message: 'Player ID and Game ID required' });
        return;
      }

      // Join game room
      socket.join(`game:${gameId}`);
      socket.join(`player:${playerId}`);

      // Store player session
      await redisService.setJSON(`session:${socket.id}`, {
        playerId,
        gameId,
        connectedAt: new Date(),
        lastActivity: new Date()
      }, 3600);

      // Notify other players
      socket.to(`game:${gameId}`).emit('player-joined', {
        playerId,
        timestamp: new Date()
      });

      // Send current game state
      const gameState = await getGameState(gameId);
      socket.emit('game-state', gameState);

      logger.info('Player joined game', { playerId, gameId, socketId: socket.id });
    } catch (error) {
      logger.error('Join game error', error);
      socket.emit('error', { message: 'Failed to join game' });
    }
  });

  // Leave game room
  socket.on('leave-game', async (data) => {
    try {
      const { playerId, gameId } = data;
      
      socket.leave(`game:${gameId}`);
      socket.leave(`player:${playerId}`);

      // Remove player session
      await redisService.del(`session:${socket.id}`);

      // Notify other players
      socket.to(`game:${gameId}`).emit('player-left', {
        playerId,
        timestamp: new Date()
      });

      logger.info('Player left game', { playerId, gameId, socketId: socket.id });
    } catch (error) {
      logger.error('Leave game error', error);
    }
  });

  // Game move
  socket.on('game-move', async (data) => {
    try {
      const { playerId, gameId, move } = data;
      
      if (!playerId || !gameId || !move) {
        socket.emit('error', { message: 'Player ID, Game ID, and move required' });
        return;
      }

      // Validate move
      const isValid = await validateMove(gameId, move);
      if (!isValid) {
        socket.emit('move-invalid', { move, reason: 'Invalid move' });
        return;
      }

      // Process move
      const gameState = await processMove(gameId, playerId, move);
      
      // Broadcast to all players in game
      io.to(`game:${gameId}`).emit('move-processed', {
        playerId,
        move,
        gameState,
        timestamp: new Date()
      });

      // Update player activity
      await updatePlayerActivity(socket.id);

      logger.info('Move processed', { playerId, gameId, move });
    } catch (error) {
      logger.error('Game move error', error);
      socket.emit('error', { message: 'Failed to process move' });
    }
  });

  // Real-time chat
  socket.on('chat-message', async (data) => {
    try {
      const { playerId, gameId, message } = data;
      
      if (!playerId || !gameId || !message) {
        socket.emit('error', { message: 'Player ID, Game ID, and message required' });
        return;
      }

      // Validate message
      if (message.length > 200) {
        socket.emit('error', { message: 'Message too long' });
        return;
      }

      // Broadcast message to game room
      io.to(`game:${gameId}`).emit('chat-message', {
        playerId,
        message,
        timestamp: new Date()
      });

      logger.info('Chat message sent', { playerId, gameId, message: message.substring(0, 50) });
    } catch (error) {
      logger.error('Chat message error', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Real-time leaderboard updates
  socket.on('request-leaderboard', async (data) => {
    try {
      const { type, limit = 10 } = data;
      
      const leaderboard = await getLeaderboard(type, limit);
      socket.emit('leaderboard-update', {
        type,
        leaderboard,
        timestamp: new Date()
      });

      logger.info('Leaderboard requested', { type, limit, socketId: socket.id });
    } catch (error) {
      logger.error('Leaderboard request error', error);
      socket.emit('error', { message: 'Failed to get leaderboard' });
    }
  });

  // Real-time notifications
  socket.on('subscribe-notifications', async (data) => {
    try {
      const { playerId, types = ['achievements', 'friends', 'system'] } = data;
      
      if (!playerId) {
        socket.emit('error', { message: 'Player ID required' });
        return;
      }

      // Join notification rooms
      types.forEach((type: string) => {
        socket.join(`notifications:${playerId}:${type}`);
      });

      logger.info('Notifications subscribed', { playerId, types, socketId: socket.id });
    } catch (error) {
      logger.error('Notification subscription error', error);
      socket.emit('error', { message: 'Failed to subscribe to notifications' });
    }
  });

  // Real-time analytics
  socket.on('analytics-event', async (data) => {
    try {
      const { playerId, eventType, eventData } = data;
      
      if (!playerId || !eventType) {
        socket.emit('error', { message: 'Player ID and event type required' });
        return;
      }

      // Store analytics event
      await redisService.lpush(`analytics:${playerId}`, JSON.stringify({
        eventType,
        eventData,
        timestamp: new Date()
      }));

      // Broadcast to analytics subscribers
      io.to(`analytics:${playerId}`).emit('analytics-update', {
        eventType,
        eventData,
        timestamp: new Date()
      });

      logger.info('Analytics event received', { playerId, eventType });
    } catch (error) {
      logger.error('Analytics event error', error);
      socket.emit('error', { message: 'Failed to process analytics event' });
    }
  });

  // WebRTC signaling for voice chat
  socket.on('webrtc-offer', (data) => {
    const { targetPlayerId, offer } = data;
    socket.to(`player:${targetPlayerId}`).emit('webrtc-offer', {
      fromPlayerId: data.playerId,
      offer
    });
  });

  socket.on('webrtc-answer', (data) => {
    const { targetPlayerId, answer } = data;
    socket.to(`player:${targetPlayerId}`).emit('webrtc-answer', {
      fromPlayerId: data.playerId,
      answer
    });
  });

  socket.on('webrtc-ice-candidate', (data) => {
    const { targetPlayerId, candidate } = data;
    socket.to(`player:${targetPlayerId}`).emit('webrtc-ice-candidate', {
      fromPlayerId: data.playerId,
      candidate
    });
  });

  // Disconnect handling
  socket.on('disconnect', async (reason) => {
    try {
      // Get player session
      const session = await redisService.getJSON(`session:${socket.id}`);
      
      if (session) {
        const { playerId, gameId } = session;
        
        // Notify other players
        socket.to(`game:${gameId}`).emit('player-disconnected', {
          playerId,
          reason,
          timestamp: new Date()
        });

        // Clean up session
        await redisService.del(`session:${socket.id}`);

        logger.info('Player disconnected', { playerId, gameId, reason, socketId: socket.id });
      }
    } catch (error) {
      logger.error('Disconnect handling error', error);
    }
  });
});

// Helper functions
async function getGameState(gameId: string) {
  try {
    const cached = await redisService.getJSON(`game:${gameId}`);
    if (cached) {
      return cached;
    }

    // Default game state
    return {
      gameId,
      status: 'waiting',
      players: [],
      currentLevel: 1,
      score: 0,
      moves: 0,
      timeLeft: 300
    };
  } catch (error) {
    logger.error('Get game state error', error);
    return null;
  }
}

async function validateMove(gameId: string, move: any) {
  try {
    // Basic move validation
    if (!move.from || !move.to) {
      return false;
    }

    // Check if move is within bounds
    if (move.from.x < 0 || move.from.x > 7 || move.from.y < 0 || move.from.y > 7) {
      return false;
    }

    if (move.to.x < 0 || move.to.x > 7 || move.to.y < 0 || move.to.y > 7) {
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Validate move error', error);
    return false;
  }
}

async function processMove(gameId: string, playerId: string, move: any) {
  try {
    // Get current game state
    let gameState = await getGameState(gameId);
    if (!gameState) {
      throw new Error('Game state not found');
    }

    // Process the move (simplified)
    gameState.moves += 1;
    gameState.lastMove = {
      playerId,
      move,
      timestamp: new Date()
    };

    // Update game state in cache
    await redisService.setJSON(`game:${gameId}`, gameState, 3600);

    return gameState;
  } catch (error) {
    logger.error('Process move error', error);
    throw error;
  }
}

async function updatePlayerActivity(socketId: string) {
  try {
    const session = await redisService.getJSON(`session:${socketId}`);
    if (session) {
      session.lastActivity = new Date();
      await redisService.setJSON(`session:${socketId}`, session, 3600);
    }
  } catch (error) {
    logger.error('Update player activity error', error);
  }
}

async function getLeaderboard(type: string, limit: number) {
  try {
    const cached = await redisService.getJSON(`leaderboard:${type}`);
    if (cached) {
      return cached.slice(0, limit);
    }

    // Default leaderboard
    return [
      { rank: 1, playerId: 'player1', score: 100000, name: 'Player 1' },
      { rank: 2, playerId: 'player2', score: 95000, name: 'Player 2' },
      { rank: 3, playerId: 'player3', score: 90000, name: 'Player 3' }
    ];
  } catch (error) {
    logger.error('Get leaderboard error', error);
    return [];
  }
}

// Periodic tasks
setInterval(async () => {
  try {
    // Clean up inactive sessions
    const sessions = await redisService.smembers('active_sessions');
    for (const sessionId of sessions) {
      const session = await redisService.getJSON(`session:${sessionId}`);
      if (session) {
        const lastActivity = new Date(session.lastActivity);
        const now = new Date();
        const diff = now.getTime() - lastActivity.getTime();
        
        // Remove sessions inactive for more than 1 hour
        if (diff > 3600000) {
          await redisService.del(`session:${sessionId}`);
          await redisService.srem('active_sessions', sessionId);
        }
      }
    }
  } catch (error) {
    logger.error('Periodic cleanup error', error);
  }
}, 300000); // Run every 5 minutes

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('WebSocket Service error', { error: err.message, stack: err.stack, url: req.url });
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

server.listen(PORT, () => {
  logger.info(`WebSocket Service running on port ${PORT}`);
});

export default app;