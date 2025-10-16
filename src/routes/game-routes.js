import express from 'express';
import analyticsService from '../services/analytics-service.js';
import cloudServices from '../services/cloud-services.js';
import { analyticsMiddleware, gameEventMiddleware } from '../middleware/analytics-middleware.js';

const router = express.Router();

// Apply analytics middleware to all game routes
router.use(analyticsMiddleware);
router.use(gameEventMiddleware);

/**
 * @route POST /api/game/start
 * @desc Start a new game session
 */
router.post('/start', async (req, res) => {
  try {
    const { level, difficulty, platform } = req.body;
    const userId = req.user?.id || 'anonymous';

    // Track game start
    await analyticsService.trackGameStart(userId, {
      level,
      difficulty,
      platform: platform || 'web',
      userAgent: req.get('User-Agent'),
    });

    // Save game state to cloud
    await cloudServices.saveGameState(userId, {
      level,
      difficulty,
      startTime: new Date().toISOString(),
      platform: platform || 'web',
    });

    // Send game start notification
    await cloudServices.sendGameEventNotification('game_started', userId, {
      level,
      difficulty,
      platform: platform || 'web',
    });

    res.json({
      success: true,
      message: 'Game started successfully',
      sessionId: analyticsService.sessionId,
      level,
      difficulty,
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
 * @desc Complete a level
 */
router.post('/level-complete', async (req, res) => {
  try {
    const { level, score, timeSpent, movesUsed, starsEarned, powerupsUsed } = req.body;
    const userId = req.user?.id || 'anonymous';

    // Track level completion
    await analyticsService.trackLevelComplete(userId, {
      level,
      score,
      timeSpent,
      movesUsed,
      starsEarned,
      powerupsUsed,
    });

    // Update player progress in cloud
    await cloudServices.savePlayerDataToDynamoDB(process.env.AWS_DYNAMODB_TABLE, {
      playerId: userId,
      level: level + 1, // Next level
      score: score,
      gameData: {
        lastLevelCompleted: level,
        totalScore: score,
        starsEarned: starsEarned,
      },
    });

    // Send level completion notification
    await cloudServices.sendGameEventNotification('level_completed', userId, {
      level,
      score,
      timeSpent,
      movesUsed,
      starsEarned,
    });

    res.json({
      success: true,
      message: 'Level completed successfully',
      nextLevel: level + 1,
      totalScore: score,
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
 * @desc Track a match made in the game
 */
router.post('/match-made', async (req, res) => {
  try {
    const { matchType, piecesMatched, position, level, scoreGained } = req.body;
    const userId = req.user?.id || 'anonymous';

    // Track match made
    await analyticsService.trackMatchMade(userId, {
      matchType,
      piecesMatched,
      position,
      level,
      scoreGained,
    });

    res.json({
      success: true,
      message: 'Match tracked successfully',
      scoreGained,
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
router.post('/powerup-used', async (req, res) => {
  try {
    const { type, level, position, cost } = req.body;
    const userId = req.user?.id || 'anonymous';

    // Track power-up usage
    await analyticsService.trackPowerUpUsed(userId, {
      type,
      level,
      position,
      cost,
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
 * @desc Handle in-game purchase
 */
router.post('/purchase', async (req, res) => {
  try {
    const { itemId, itemType, currency, amount, transactionId, platform } = req.body;
    const userId = req.user?.id || 'anonymous';

    // Track purchase
    await analyticsService.trackPurchase(userId, {
      itemId,
      itemType,
      currency,
      amount,
      transactionId,
      platform: platform || 'web',
    });

    // Send purchase notification
    await cloudServices.sendGameEventNotification('purchase_made', userId, {
      itemId,
      itemType,
      currency,
      amount,
      transactionId,
    });

    res.json({
      success: true,
      message: 'Purchase tracked successfully',
      transactionId,
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
 * @desc Track game errors
 */
router.post('/error', async (req, res) => {
  try {
    const { type, message, code, level, stackTrace } = req.body;
    const userId = req.user?.id || 'anonymous';

    // Track error
    await analyticsService.trackError(userId, {
      type,
      message,
      code,
      level,
      stackTrace,
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
 * @desc Get analytics summary
 */
router.get('/analytics/summary', async (req, res) => {
  try {
    const summary = analyticsService.getAnalyticsSummary();
    const cloudStatus = cloudServices.getServiceStatus();

    res.json({
      success: true,
      analytics: summary,
      cloudServices: cloudStatus,
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
 * @desc Track performance metrics
 */
router.post('/performance', async (req, res) => {
  try {
    const { metricName, value, unit, level, deviceInfo } = req.body;
    const userId = req.user?.id || 'anonymous';

    // Track performance metric
    await analyticsService.trackPerformance(userId, {
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

export default router;
