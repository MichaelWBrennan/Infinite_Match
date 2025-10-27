import { Logger } from '../../core/logger/index.js';
import { ServiceError } from '../../core/errors/ErrorHandler.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Multiplayer Room Manager
 * Handles game rooms, lobbies, and player matchmaking
 */
class RoomManager {
  constructor(io) {
    this.logger = new Logger('RoomManager');
    this.io = io;
    
    // Room storage
    this.rooms = new Map(); // roomId -> room data
    this.playerRooms = new Map(); // playerId -> roomId
    this.waitingPlayers = new Set(); // players waiting for matchmaking
    
    // Room configuration
    this.maxRoomsPerPlayer = 3;
    this.maxPlayersPerRoom = 8;
    this.roomTimeout = 30 * 60 * 1000; // 30 minutes
    this.matchmakingTimeout = 60 * 1000; // 1 minute
    
    // Game types and their requirements
    this.gameTypes = {
      'match3_classic': {
        minPlayers: 1,
        maxPlayers: 1,
        isCompetitive: false,
        description: 'Classic Match-3 gameplay'
      },
      'match3_versus': {
        minPlayers: 2,
        maxPlayers: 2,
        isCompetitive: true,
        description: 'Head-to-head Match-3 competition'
      },
      'match3_tournament': {
        minPlayers: 4,
        maxPlayers: 8,
        isCompetitive: true,
        description: 'Tournament-style Match-3'
      },
      'match3_coop': {
        minPlayers: 2,
        maxPlayers: 4,
        isCompetitive: false,
        description: 'Cooperative Match-3 challenges'
      }
    };
    
    this.initializeRoomManager();
  }

  /**
   * Initialize room manager
   */
  initializeRoomManager() {
    this.logger.info('Initializing Room Manager');
    
    // Cleanup inactive rooms every 5 minutes
    setInterval(() => {
      this.cleanupInactiveRooms();
    }, 5 * 60 * 1000);
    
    // Process matchmaking queue every 10 seconds
    setInterval(() => {
      this.processMatchmakingQueue();
    }, 10 * 1000);
  }

  /**
   * Create a new game room
   */
  createRoom(creatorId, gameType, options = {}) {
    try {
      // Validate game type
      if (!this.gameTypes[gameType]) {
        throw new ServiceError(`Invalid game type: ${gameType}`);
      }

      // Check if player can create more rooms
      const playerRoomCount = this.getPlayerRoomCount(creatorId);
      if (playerRoomCount >= this.maxRoomsPerPlayer) {
        throw new ServiceError('Player has reached maximum room limit');
      }

      const roomId = uuidv4();
      const room = {
        id: roomId,
        gameType,
        creator: creatorId,
        players: new Set([creatorId]),
        spectators: new Set(),
        status: 'waiting', // waiting, playing, finished
        createdAt: Date.now(),
        lastActivity: Date.now(),
        options: {
          isPrivate: options.isPrivate || false,
          password: options.password || null,
          maxPlayers: options.maxPlayers || this.gameTypes[gameType].maxPlayers,
          timeLimit: options.timeLimit || null,
          ...options
        },
        gameState: this.initializeGameState(gameType),
        settings: this.getDefaultRoomSettings(gameType)
      };

      this.rooms.set(roomId, room);
      this.playerRooms.set(creatorId, roomId);

      // Join Socket.IO room
      this.io.to(creatorId).socketsJoin(`room_${roomId}`);

      this.logger.info(`Room created: ${roomId} by ${creatorId}`);
      
      return {
        success: true,
        room: this.getRoomInfo(room),
        message: 'Room created successfully'
      };
    } catch (error) {
      this.logger.error('Failed to create room:', error);
      throw error;
    }
  }

  /**
   * Join a room
   */
  joinRoom(playerId, roomId, password = null) {
    try {
      const room = this.rooms.get(roomId);
      if (!room) {
        throw new ServiceError('Room not found');
      }

      // Check if room is full
      if (room.players.size >= room.options.maxPlayers) {
        throw new ServiceError('Room is full');
      }

      // Check password for private rooms
      if (room.options.isPrivate && room.options.password && room.options.password !== password) {
        throw new ServiceError('Invalid room password');
      }

      // Check if player is already in a room
      if (this.playerRooms.has(playerId)) {
        throw new ServiceError('Player is already in a room');
      }

      // Add player to room
      room.players.add(playerId);
      this.playerRooms.set(playerId, roomId);
      room.lastActivity = Date.now();

      // Join Socket.IO room
      this.io.to(playerId).socketsJoin(`room_${roomId}`);

      // Notify all players in room
      this.io.to(`room_${roomId}`).emit('player_joined', {
        playerId,
        roomId,
        playerCount: room.players.size,
        room: this.getRoomInfo(room)
      });

      this.logger.info(`Player ${playerId} joined room ${roomId}`);
      
      return {
        success: true,
        room: this.getRoomInfo(room),
        message: 'Joined room successfully'
      };
    } catch (error) {
      this.logger.error('Failed to join room:', error);
      throw error;
    }
  }

  /**
   * Leave a room
   */
  leaveRoom(playerId, roomId) {
    try {
      const room = this.rooms.get(roomId);
      if (!room) {
        throw new ServiceError('Room not found');
      }

      // Remove player from room
      room.players.delete(playerId);
      room.spectators.delete(playerId);
      this.playerRooms.delete(playerId);
      room.lastActivity = Date.now();

      // Leave Socket.IO room
      this.io.to(playerId).socketsLeave(`room_${roomId}`);

      // If room is empty, delete it
      if (room.players.size === 0) {
        this.rooms.delete(roomId);
        this.logger.info(`Room ${roomId} deleted (empty)`);
      } else {
        // Notify remaining players
        this.io.to(`room_${roomId}`).emit('player_left', {
          playerId,
          roomId,
          playerCount: room.players.size,
          room: this.getRoomInfo(room)
        });
      }

      this.logger.info(`Player ${playerId} left room ${roomId}`);
      
      return {
        success: true,
        message: 'Left room successfully'
      };
    } catch (error) {
      this.logger.error('Failed to leave room:', error);
      throw error;
    }
  }

  /**
   * Start matchmaking for a player
   */
  startMatchmaking(playerId, gameType, preferences = {}) {
    try {
      // Validate game type
      if (!this.gameTypes[gameType]) {
        throw new ServiceError(`Invalid game type: ${gameType}`);
      }

      // Check if player is already in a room
      if (this.playerRooms.has(playerId)) {
        throw new ServiceError('Player is already in a room');
      }

      // Add to waiting queue
      this.waitingPlayers.add({
        playerId,
        gameType,
        preferences,
        joinedAt: Date.now()
      });

      this.logger.info(`Player ${playerId} started matchmaking for ${gameType}`);
      
      return {
        success: true,
        message: 'Matchmaking started',
        estimatedWaitTime: this.getEstimatedWaitTime(gameType)
      };
    } catch (error) {
      this.logger.error('Failed to start matchmaking:', error);
      throw error;
    }
  }

  /**
   * Stop matchmaking for a player
   */
  stopMatchmaking(playerId) {
    try {
      // Remove from waiting queue
      for (const waitingPlayer of this.waitingPlayers) {
        if (waitingPlayer.playerId === playerId) {
          this.waitingPlayers.delete(waitingPlayer);
          break;
        }
      }

      this.logger.info(`Player ${playerId} stopped matchmaking`);
      
      return {
        success: true,
        message: 'Matchmaking stopped'
      };
    } catch (error) {
      this.logger.error('Failed to stop matchmaking:', error);
      throw error;
    }
  }

  /**
   * Process matchmaking queue
   */
  processMatchmakingQueue() {
    try {
      const gameTypeGroups = {};
      
      // Group waiting players by game type
      for (const waitingPlayer of this.waitingPlayers) {
        const gameType = waitingPlayer.gameType;
        if (!gameTypeGroups[gameType]) {
          gameTypeGroups[gameType] = [];
        }
        gameTypeGroups[gameType].push(waitingPlayer);
      }

      // Process each game type
      for (const [gameType, players] of Object.entries(gameTypeGroups)) {
        const gameConfig = this.gameTypes[gameType];
        
        if (gameConfig.isCompetitive) {
          // For competitive games, try to match players
          this.matchCompetitivePlayers(gameType, players);
        } else {
          // For cooperative games, create rooms as needed
          this.matchCooperativePlayers(gameType, players);
        }
      }
    } catch (error) {
      this.logger.error('Failed to process matchmaking queue:', error);
    }
  }

  /**
   * Match competitive players
   */
  matchCompetitivePlayers(gameType, players) {
    const gameConfig = this.gameTypes[gameType];
    const playersPerMatch = gameConfig.maxPlayers;
    
    // Group players into matches
    for (let i = 0; i < players.length; i += playersPerMatch) {
      const matchPlayers = players.slice(i, i + playersPerMatch);
      
      if (matchPlayers.length >= gameConfig.minPlayers) {
        // Create room for this match
        const roomId = uuidv4();
        const room = {
          id: roomId,
          gameType,
          creator: matchPlayers[0].playerId,
          players: new Set(matchPlayers.map(p => p.playerId)),
          spectators: new Set(),
          status: 'waiting',
          createdAt: Date.now(),
          lastActivity: Date.now(),
          options: {
            isPrivate: false,
            password: null,
            maxPlayers: playersPerMatch
          },
          gameState: this.initializeGameState(gameType),
          settings: this.getDefaultRoomSettings(gameType)
        };

        this.rooms.set(roomId, room);
        
        // Add players to room
        for (const player of matchPlayers) {
          this.playerRooms.set(player.playerId, roomId);
          this.waitingPlayers.delete(player);
          this.io.to(player.playerId).socketsJoin(`room_${roomId}`);
        }

        // Notify players
        this.io.to(`room_${roomId}`).emit('match_found', {
          roomId,
          room: this.getRoomInfo(room),
          players: matchPlayers.map(p => p.playerId)
        });

        this.logger.info(`Match created: ${roomId} with ${matchPlayers.length} players`);
      }
    }
  }

  /**
   * Match cooperative players
   */
  matchCooperativePlayers(gameType, players) {
    // For cooperative games, create rooms as players join
    for (const player of players) {
      try {
        const result = this.createRoom(player.playerId, gameType, {
          isPrivate: false
        });
        
        this.waitingPlayers.delete(player);
        
        this.io.to(player.playerId).emit('room_created', {
          roomId: result.room.id,
          room: result.room
        });
      } catch (error) {
        this.logger.error(`Failed to create room for player ${player.playerId}:`, error);
      }
    }
  }

  /**
   * Get room information
   */
  getRoomInfo(room) {
    return {
      id: room.id,
      gameType: room.gameType,
      creator: room.creator,
      playerCount: room.players.size,
      maxPlayers: room.options.maxPlayers,
      status: room.status,
      createdAt: room.createdAt,
      isPrivate: room.options.isPrivate,
      settings: room.settings,
      players: Array.from(room.players),
      spectators: Array.from(room.spectators)
    };
  }

  /**
   * Get player's current room
   */
  getPlayerRoom(playerId) {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return null;
    
    const room = this.rooms.get(roomId);
    return room ? this.getRoomInfo(room) : null;
  }

  /**
   * Get available rooms
   */
  getAvailableRooms(gameType = null, limit = 20) {
    const rooms = Array.from(this.rooms.values())
      .filter(room => {
        if (gameType && room.gameType !== gameType) return false;
        if (room.status !== 'waiting') return false;
        if (room.players.size >= room.options.maxPlayers) return false;
        return true;
      })
      .sort((a, b) => b.lastActivity - a.lastActivity)
      .slice(0, limit)
      .map(room => this.getRoomInfo(room));

    return rooms;
  }

  /**
   * Get player room count
   */
  getPlayerRoomCount(playerId) {
    let count = 0;
    for (const room of this.rooms.values()) {
      if (room.players.has(playerId)) count++;
    }
    return count;
  }

  /**
   * Initialize game state for a room
   */
  initializeGameState(gameType) {
    const baseState = {
      gameType,
      status: 'waiting',
      currentTurn: null,
      turnStartTime: null,
      moveCount: 0,
      scores: {},
      board: null,
      lastMove: null
    };

    // Add game-specific state
    switch (gameType) {
      case 'match3_versus':
        return {
          ...baseState,
          timeLimit: 60, // 60 seconds per turn
          maxMoves: 30,
          targetScore: 1000
        };
      case 'match3_tournament':
        return {
          ...baseState,
          rounds: [],
          currentRound: 0,
          bracket: [],
          timeLimit: 45
        };
      case 'match3_coop':
        return {
          ...baseState,
          sharedScore: 0,
          targetScore: 2000,
          timeLimit: 300 // 5 minutes
        };
      default:
        return baseState;
    }
  }

  /**
   * Get default room settings
   */
  getDefaultRoomSettings(gameType) {
    const gameConfig = this.gameTypes[gameType];
    return {
      timeLimit: null,
      maxMoves: null,
      difficulty: 'normal',
      powerUps: true,
      specialEvents: true,
      ...gameConfig
    };
  }

  /**
   * Get estimated wait time for matchmaking
   */
  getEstimatedWaitTime(gameType) {
    const waitingCount = Array.from(this.waitingPlayers)
      .filter(p => p.gameType === gameType).length;
    
    // Simple estimation based on current waiting players
    const avgWaitTime = Math.max(10, waitingCount * 5); // 5 seconds per waiting player, min 10s
    return avgWaitTime;
  }

  /**
   * Cleanup inactive rooms
   */
  cleanupInactiveRooms() {
    const now = Date.now();
    const roomsToDelete = [];

    for (const [roomId, room] of this.rooms.entries()) {
      if (now - room.lastActivity > this.roomTimeout) {
        roomsToDelete.push(roomId);
      }
    }

    for (const roomId of roomsToDelete) {
      const room = this.rooms.get(roomId);
      if (room) {
        // Notify players
        this.io.to(`room_${roomId}`).emit('room_expired', {
          roomId,
          reason: 'inactive'
        });

        // Remove players from room tracking
        for (const playerId of room.players) {
          this.playerRooms.delete(playerId);
        }

        this.rooms.delete(roomId);
        this.logger.info(`Cleaned up inactive room: ${roomId}`);
      }
    }
  }

  /**
   * Get room statistics
   */
  getStatistics() {
    return {
      totalRooms: this.rooms.size,
      waitingPlayers: this.waitingPlayers.size,
      activePlayers: this.playerRooms.size,
      gameTypeDistribution: this.getGameTypeDistribution(),
      averageRoomSize: this.getAverageRoomSize()
    };
  }

  /**
   * Get game type distribution
   */
  getGameTypeDistribution() {
    const distribution = {};
    for (const room of this.rooms.values()) {
      distribution[room.gameType] = (distribution[room.gameType] || 0) + 1;
    }
    return distribution;
  }

  /**
   * Get average room size
   */
  getAverageRoomSize() {
    if (this.rooms.size === 0) return 0;
    
    const totalPlayers = Array.from(this.rooms.values())
      .reduce((sum, room) => sum + room.players.size, 0);
    
    return totalPlayers / this.rooms.size;
  }
}

export { RoomManager };