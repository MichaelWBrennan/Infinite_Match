/**
 * Match 3 Game API Integration Example
 * Demonstrates how to use all SDKs in a real game backend
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import analyticsService from '../services/analytics-service.js';
import cloudServices from '../services/cloud-services.js';
import {
  analyticsMiddleware,
  errorTrackingMiddleware,
} from '../middleware/analytics-middleware.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Analytics middleware
app.use(analyticsMiddleware);

// Initialize services
async function initializeServices() {
  try {
    await analyticsService.initialize();
    await cloudServices.initialize();
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Game API Routes

/**
 * @route POST /api/game/start
 * @desc Start a new game session with comprehensive tracking
 */
app.post('/api/game/start', async (req, res) => {
  try {
    const { level, difficulty, platform, playerId } = req.body;
    const sessionId = analyticsService.sessionId;

    // Track game start with all analytics services
    await analyticsService.trackGameStart(playerId, {
      level: level || 1,
      difficulty: difficulty || 'normal',
      platform: platform || 'web',
      userAgent: req.get('User-Agent'),
      sessionId: sessionId,
    });

    // Save initial game state to multiple cloud services
    const gameState = {
      playerId,
      level: level || 1,
      difficulty: difficulty || 'normal',
      platform: platform || 'web',
      startTime: new Date().toISOString(),
      sessionId: sessionId,
      gameVersion: process.env.GAME_VERSION || '1.0.0',
    };

    // Save to all cloud services for redundancy
    await Promise.allSettled([
      cloudServices.saveGameState(playerId, gameState),
      cloudServices.savePlayerDataToDynamoDB(process.env.AWS_DYNAMODB_TABLE, {
        playerId,
        level: level || 1,
        score: 0,
        gameData: gameState,
      }),
      cloudServices.savePlayerDataToFirestore('players', playerId, gameState),
      cloudServices.savePlayerDataToCosmos('game-db', 'players', gameState),
    ]);

    // Send notifications
    await cloudServices.sendGameEventNotification('game_started', playerId, {
      level: level || 1,
      difficulty: difficulty || 'normal',
      platform: platform || 'web',
    });

    res.json({
      success: true,
      message: 'Game started successfully',
      sessionId: sessionId,
      gameState: {
        level: level || 1,
        difficulty: difficulty || 'normal',
        platform: platform || 'web',
      },
    });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start game',
      error: error.message,
    });
  }
});

/**
 * @route POST /api/game/level-complete
 * @desc Complete a level with comprehensive analytics
 */
app.post('/api/game/level-complete', async (req, res) => {
  try {
    const { level, score, timeSpent, movesUsed, starsEarned, powerupsUsed, playerId, sessionId } =
      req.body;

    // Track level completion
    await analyticsService.trackLevelComplete(playerId, {
      level,
      score,
      timeSpent,
      movesUsed,
      starsEarned,
      powerupsUsed,
    });

    // Track performance metrics
    await analyticsService.trackPerformance(playerId, {
      metricName: 'level_completion_time',
      value: timeSpent,
      unit: 'seconds',
      level: level,
      deviceInfo: {
        platform: req.get('X-Platform') || 'web',
        user_agent: req.get('User-Agent'),
      },
    });

    // Update player progress in all cloud services
    const playerData = {
      playerId,
      level: level + 1,
      score: score,
      gameData: {
        lastLevelCompleted: level,
        totalScore: score,
        starsEarned: starsEarned,
        lastUpdated: new Date().toISOString(),
        sessionId: sessionId,
      },
    };

    await Promise.allSettled([
      cloudServices.savePlayerDataToDynamoDB(process.env.AWS_DYNAMODB_TABLE, playerData),
      cloudServices.savePlayerDataToFirestore('players', playerId, playerData),
      cloudServices.savePlayerDataToCosmos('game-db', 'players', playerData),
    ]);

    // Send level completion notification
    await cloudServices.sendGameEventNotification('level_completed', playerId, {
      level,
      score,
      timeSpent,
      movesUsed,
      starsEarned,
      powerupsUsed,
    });

    res.json({
      success: true,
      message: 'Level completed successfully',
      nextLevel: level + 1,
      totalScore: score,
      performance: {
        timeSpent,
        movesUsed,
        starsEarned,
      },
    });
  } catch (error) {
    console.error('Error completing level:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete level',
      error: error.message,
    });
  }
});

/**
 * @route POST /api/game/match-made
 * @desc Track match made in the game
 */
app.post('/api/game/match-made', async (req, res) => {
  try {
    const { matchType, piecesMatched, position, level, scoreGained, playerId } = req.body;

    // Track match made
    await analyticsService.trackMatchMade(playerId, {
      matchType,
      piecesMatched,
      position,
      level,
      scoreGained,
    });

    // Track performance for match efficiency
    const efficiency = scoreGained / piecesMatched;
    await analyticsService.trackPerformance(playerId, {
      metricName: 'match_efficiency',
      value: efficiency,
      unit: 'score_per_piece',
      level: level,
      deviceInfo: {
        platform: req.get('X-Platform') || 'web',
      },
    });

    res.json({
      success: true,
      message: 'Match tracked successfully',
      efficiency: efficiency,
    });
  } catch (error) {
    console.error('Error tracking match:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track match',
      error: error.message,
    });
  }
});

/**
 * @route POST /api/game/powerup-used
 * @desc Track power-up usage
 */
app.post('/api/game/powerup-used', async (req, res) => {
  try {
    const { type, level, position, cost, playerId } = req.body;

    // Track power-up usage
    await analyticsService.trackPowerUpUsed(playerId, {
      type,
      level,
      position,
      cost,
    });

    // Track power-up effectiveness
    await analyticsService.trackPerformance(playerId, {
      metricName: 'powerup_usage',
      value: 1,
      unit: 'count',
      level: level,
      deviceInfo: {
        powerup_type: type,
        cost: cost,
      },
    });

    res.json({
      success: true,
      message: 'Power-up usage tracked successfully',
    });
  } catch (error) {
    console.error('Error tracking power-up:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track power-up usage',
      error: error.message,
    });
  }
});

/**
 * @route POST /api/game/purchase
 * @desc Handle in-game purchase with fraud detection
 */
app.post('/api/game/purchase', async (req, res) => {
  try {
    const { itemId, itemType, currency, amount, transactionId, platform, playerId } = req.body;

    // Validate purchase data
    if (!itemId || !currency || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required purchase data',
      });
    }

    // Track purchase
    await analyticsService.trackPurchase(playerId, {
      itemId,
      itemType,
      currency,
      amount,
      transactionId,
      platform: platform || 'web',
    });

    // Track revenue metrics
    await analyticsService.trackPerformance(playerId, {
      metricName: 'revenue',
      value: amount,
      unit: currency,
      level: req.body.level || 1,
      deviceInfo: {
        item_type: itemType,
        platform: platform || 'web',
      },
    });

    // Send purchase notification to all cloud services
    await cloudServices.sendGameEventNotification('purchase_made', playerId, {
      itemId,
      itemType,
      currency,
      amount,
      transactionId,
      platform: platform || 'web',
    });

    res.json({
      success: true,
      message: 'Purchase tracked successfully',
      transactionId: transactionId,
      revenue: {
        amount,
        currency,
        itemType,
      },
    });
  } catch (error) {
    console.error('Error tracking purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track purchase',
      error: error.message,
    });
  }
});

/**
 * @route POST /api/game/error
 * @desc Track game errors with detailed context
 */
app.post('/api/game/error', async (req, res) => {
  try {
    const { type, message, code, level, stackTrace, playerId, gameState } = req.body;

    // Track error
    await analyticsService.trackError(playerId, {
      type,
      message,
      code,
      level,
      stackTrace,
    });

    // Send error notification for immediate attention
    await cloudServices.sendGameEventNotification('error_occurred', playerId, {
      error: {
        type,
        message,
        code,
        stackTrace,
      },
      gameState: gameState,
      context: {
        level: level,
        platform: req.get('X-Platform') || 'web',
        user_agent: req.get('User-Agent'),
      },
    });

    res.json({
      success: true,
      message: 'Error tracked successfully',
    });
  } catch (error) {
    console.error('Error tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track error',
      error: error.message,
    });
  }
});

/**
 * @route GET /api/game/analytics/summary
 * @desc Get comprehensive analytics summary
 */
app.get('/api/game/analytics/summary', async (req, res) => {
  try {
    const analyticsSummary = analyticsService.getAnalyticsSummary();
    const cloudStatus = cloudServices.getServiceStatus();

    res.json({
      success: true,
      analytics: analyticsSummary,
      cloudServices: cloudStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics summary',
      error: error.message,
    });
  }
});

/**
 * @route POST /api/game/performance
 * @desc Track custom performance metrics
 */
app.post('/api/game/performance', async (req, res) => {
  try {
    const { metricName, value, unit, level, deviceInfo, playerId } = req.body;

    // Track performance metric
    await analyticsService.trackPerformance(playerId, {
      metricName,
      value,
      unit,
      level,
      deviceInfo,
    });

    res.json({
      success: true,
      message: 'Performance metric tracked successfully',
    });
  } catch (error) {
    console.error('Error tracking performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track performance metric',
      error: error.message,
    });
  }
});

/**
 * @route GET /api/game/leaderboard
 * @desc Get leaderboard data from cloud services
 */
app.get('/api/game/leaderboard', async (req, res) => {
  try {
    const { level, limit = 10 } = req.query;

    // Get leaderboard from DynamoDB
    const leaderboard = await cloudServices.awsClients.dynamodb.send(
      new cloudServices.awsClients.dynamodb.ScanCommand({
        TableName: process.env.AWS_DYNAMODB_TABLE,
        FilterExpression: level ? 'level = :level' : undefined,
        ExpressionAttributeValues: level ? { ':level': { N: level.toString() } } : undefined,
        Limit: parseInt(limit),
      }),
    );

    res.json({
      success: true,
      leaderboard: leaderboard.Items || [],
      level: level || 'all',
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard',
      error: error.message,
    });
  }
});

// Error handling middleware
app.use(errorTrackingMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      analytics: analyticsService.isInitialized,
      cloud: cloudServices.isInitialized,
    },
  });
});

// Start server
async function startServer() {
  await initializeServices();

  app.listen(PORT, () => {
    console.log(`Match 3 Game API server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Analytics summary: http://localhost:${PORT}/api/game/analytics/summary`);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await analyticsService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await analyticsService.shutdown();
  process.exit(0);
});

startServer().catch(console.error);

export default app;
