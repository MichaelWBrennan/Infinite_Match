import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { Logger } from '../core/logger/index.js';
import { ErrorHandler, ValidationError } from '../core/errors/ErrorHandler.js';
import { ApiResponseBuilder, ApiResponse } from '../core/types/ApiResponse.js';
import { ServiceContainer } from '../core/container/ServiceContainer.js';
import { analyticsMiddleware, gameEventMiddleware } from '../middleware/analytics-middleware.js';

const router = express.Router();
const logger = new Logger('GameRoutes');
const serviceContainer = new ServiceContainer();

// Apply analytics middleware to all game routes
router.use(analyticsMiddleware);
router.use(gameEventMiddleware);

// Validation middleware
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new ValidationError('Validation failed', null, { errors: errors.array() });
    const errorInfo = ErrorHandler.handle(error);
    const response = ApiResponseBuilder.error(
      errorInfo.context?.code || 'VALIDATION_ERROR',
      errorInfo.message,
      errorInfo.type,
      errorInfo.recoverable,
      errorInfo.action,
      errorInfo.context,
    );
    return res.status(400).json(response);
  }
  next();
};

/**
 * @route POST /api/game/start
 * @desc Start a new game session
 */
router.post(
  '/start',
  [
    body('level').isInt({ min: 1 }).withMessage('Level must be a positive integer'),
    body('difficulty')
      .isIn(['easy', 'medium', 'hard'])
      .withMessage('Difficulty must be easy, medium, or hard'),
    body('platform').optional().isString().withMessage('Platform must be a string'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { level, difficulty, platform } = req.body;
      const userId = req.user?.id || 'anonymous';

      // Get services from container
      const analyticsService = serviceContainer.get('analytics');
      const cloudServices = serviceContainer.get('cloud');

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

      const response = ApiResponseBuilder.success({
        sessionId: analyticsService.sessionId,
        level,
        difficulty,
      });

      res.json(response);
    } catch (error) {
      logger.error('Error starting game:', error);
      const errorInfo = ErrorHandler.handle(error as Error, { route: 'game/start' });
      const response = ApiResponseBuilder.error(
        errorInfo.context?.code || 'GAME_START_ERROR',
        errorInfo.message,
        errorInfo.type,
        errorInfo.recoverable,
        errorInfo.action,
        errorInfo.context,
      );
      res.status(500).json(response);
    }
  },
);

/**
 * @route POST /api/game/level-complete
 * @desc Complete a level
 */
router.post(
  '/level-complete',
  [
    body('level').isInt({ min: 1 }).withMessage('Level must be a positive integer'),
    body('score').isInt({ min: 0 }).withMessage('Score must be a non-negative integer'),
    body('timeSpent').isInt({ min: 0 }).withMessage('Time spent must be a non-negative integer'),
    body('movesUsed').isInt({ min: 1 }).withMessage('Moves used must be a positive integer'),
    body('starsEarned')
      .isInt({ min: 0, max: 3 })
      .withMessage('Stars earned must be between 0 and 3'),
    body('powerupsUsed').optional().isArray().withMessage('Powerups used must be an array'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { level, score, timeSpent, movesUsed, starsEarned, powerupsUsed = [] } = req.body;
      const userId = req.user?.id || 'anonymous';

      // Get services from container
      const analyticsService = serviceContainer.get('analytics');
      const cloudServices = serviceContainer.get('cloud');

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
      await cloudServices.savePlayerDataToDynamoDB(process.env.AWS_DYNAMODB_TABLE!, {
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

      const response = ApiResponseBuilder.success({
        nextLevel: level + 1,
        totalScore: score,
      });

      res.json(response);
    } catch (error) {
      logger.error('Error completing level:', error);
      const errorInfo = ErrorHandler.handle(error as Error, { route: 'game/level-complete' });
      const response = ApiResponseBuilder.error(
        errorInfo.context?.code || 'LEVEL_COMPLETE_ERROR',
        errorInfo.message,
        errorInfo.type,
        errorInfo.recoverable,
        errorInfo.action,
        errorInfo.context,
      );
      res.status(500).json(response);
    }
  },
);

/**
 * @route POST /api/game/match-made
 * @desc Track a match made in the game
 */
router.post(
  '/match-made',
  [
    body('matchType').isString().withMessage('Match type must be a string'),
    body('piecesMatched')
      .isInt({ min: 1 })
      .withMessage('Pieces matched must be a positive integer'),
    body('position').isObject().withMessage('Position must be an object'),
    body('level').isInt({ min: 1 }).withMessage('Level must be a positive integer'),
    body('scoreGained')
      .isInt({ min: 0 })
      .withMessage('Score gained must be a non-negative integer'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { matchType, piecesMatched, position, level, scoreGained } = req.body;
      const userId = req.user?.id || 'anonymous';

      // Get services from container
      const analyticsService = serviceContainer.get('analytics');

      // Track match made
      await analyticsService.trackMatchMade(userId, {
        matchType,
        piecesMatched,
        position,
        level,
        scoreGained,
      });

      const response = ApiResponseBuilder.success({
        scoreGained,
      });

      res.json(response);
    } catch (error) {
      logger.error('Error tracking match:', error);
      const errorInfo = ErrorHandler.handle(error as Error, { route: 'game/match-made' });
      const response = ApiResponseBuilder.error(
        errorInfo.context?.code || 'MATCH_TRACKING_ERROR',
        errorInfo.message,
        errorInfo.type,
        errorInfo.recoverable,
        errorInfo.action,
        errorInfo.context,
      );
      res.status(500).json(response);
    }
  },
);

/**
 * @route POST /api/game/powerup-used
 * @desc Track power-up usage
 */
router.post(
  '/powerup-used',
  [
    body('type').isString().withMessage('Power-up type must be a string'),
    body('level').isInt({ min: 1 }).withMessage('Level must be a positive integer'),
    body('position').isObject().withMessage('Position must be an object'),
    body('cost').isInt({ min: 0 }).withMessage('Cost must be a non-negative integer'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { type, level, position, cost } = req.body;
      const userId = req.user?.id || 'anonymous';

      // Get services from container
      const analyticsService = serviceContainer.get('analytics');

      // Track power-up usage
      await analyticsService.trackPowerUpUsed(userId, {
        type,
        level,
        position,
        cost,
      });

      const response = ApiResponseBuilder.success({});

      res.json(response);
    } catch (error) {
      logger.error('Error tracking power-up:', error);
      const errorInfo = ErrorHandler.handle(error as Error, { route: 'game/powerup-used' });
      const response = ApiResponseBuilder.error(
        errorInfo.context?.code || 'POWERUP_TRACKING_ERROR',
        errorInfo.message,
        errorInfo.type,
        errorInfo.recoverable,
        errorInfo.action,
        errorInfo.context,
      );
      res.status(500).json(response);
    }
  },
);

/**
 * @route POST /api/game/purchase
 * @desc Handle in-game purchase
 */
router.post(
  '/purchase',
  [
    body('itemId').isString().withMessage('Item ID must be a string'),
    body('itemType').isString().withMessage('Item type must be a string'),
    body('currency').isString().withMessage('Currency must be a string'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('transactionId').isString().withMessage('Transaction ID must be a string'),
    body('platform').optional().isString().withMessage('Platform must be a string'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { itemId, itemType, currency, amount, transactionId, platform } = req.body;
      const userId = req.user?.id || 'anonymous';

      // Get services from container
      const analyticsService = serviceContainer.get('analytics');
      const cloudServices = serviceContainer.get('cloud');

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

      const response = ApiResponseBuilder.success({
        transactionId,
      });

      res.json(response);
    } catch (error) {
      logger.error('Error tracking purchase:', error);
      const errorInfo = ErrorHandler.handle(error as Error, { route: 'game/purchase' });
      const response = ApiResponseBuilder.error(
        errorInfo.context?.code || 'PURCHASE_TRACKING_ERROR',
        errorInfo.message,
        errorInfo.type,
        errorInfo.recoverable,
        errorInfo.action,
        errorInfo.context,
      );
      res.status(500).json(response);
    }
  },
);

/**
 * @route POST /api/game/error
 * @desc Track game errors
 */
router.post(
  '/error',
  [
    body('type').isString().withMessage('Error type must be a string'),
    body('message').isString().withMessage('Error message must be a string'),
    body('code').optional().isString().withMessage('Error code must be a string'),
    body('level').optional().isInt({ min: 1 }).withMessage('Level must be a positive integer'),
    body('stackTrace').optional().isString().withMessage('Stack trace must be a string'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { type, message, code, level, stackTrace } = req.body;
      const userId = req.user?.id || 'anonymous';

      // Get services from container
      const analyticsService = serviceContainer.get('analytics');

      // Track error
      await analyticsService.trackError(userId, {
        type,
        message,
        code,
        level,
        stackTrace,
      });

      const response = ApiResponseBuilder.success({});

      res.json(response);
    } catch (error) {
      logger.error('Error tracking error:', error);
      const errorInfo = ErrorHandler.handle(error as Error, { route: 'game/error' });
      const response = ApiResponseBuilder.error(
        errorInfo.context?.code || 'ERROR_TRACKING_ERROR',
        errorInfo.message,
        errorInfo.type,
        errorInfo.recoverable,
        errorInfo.action,
        errorInfo.context,
      );
      res.status(500).json(response);
    }
  },
);

/**
 * @route GET /api/game/analytics/summary
 * @desc Get analytics summary
 */
router.get('/analytics/summary', async (req: Request, res: Response) => {
  try {
    // Get services from container
    const analyticsService = serviceContainer.get('analytics');
    const cloudServices = serviceContainer.get('cloud');

    const summary = analyticsService.getAnalyticsSummary();
    const cloudStatus = cloudServices.getServiceStatus();

    const response = ApiResponseBuilder.success({
      analytics: summary,
      cloudServices: cloudStatus,
    });

    res.json(response);
  } catch (error) {
    logger.error('Error getting analytics summary:', error);
    const errorInfo = ErrorHandler.handle(error as Error, { route: 'game/analytics/summary' });
    const response = ApiResponseBuilder.error(
      errorInfo.context?.code || 'ANALYTICS_SUMMARY_ERROR',
      errorInfo.message,
      errorInfo.type,
      errorInfo.recoverable,
      errorInfo.action,
      errorInfo.context,
    );
    res.status(500).json(response);
  }
});

/**
 * @route POST /api/game/performance
 * @desc Track performance metrics
 */
router.post(
  '/performance',
  [
    body('metricName').isString().withMessage('Metric name must be a string'),
    body('value').isNumeric().withMessage('Value must be a number'),
    body('unit').isString().withMessage('Unit must be a string'),
    body('level').optional().isInt({ min: 1 }).withMessage('Level must be a positive integer'),
    body('deviceInfo').optional().isObject().withMessage('Device info must be an object'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { metricName, value, unit, level, deviceInfo } = req.body;
      const userId = req.user?.id || 'anonymous';

      // Get services from container
      const analyticsService = serviceContainer.get('analytics');

      // Track performance metric
      await analyticsService.trackPerformance(userId, {
        metricName,
        value,
        unit,
        level,
        deviceInfo,
      });

      const response = ApiResponseBuilder.success({});

      res.json(response);
    } catch (error) {
      logger.error('Error tracking performance:', error);
      const errorInfo = ErrorHandler.handle(error as Error, { route: 'game/performance' });
      const response = ApiResponseBuilder.error(
        errorInfo.context?.code || 'PERFORMANCE_TRACKING_ERROR',
        errorInfo.message,
        errorInfo.type,
        errorInfo.recoverable,
        errorInfo.action,
        errorInfo.context,
      );
      res.status(500).json(response);
    }
  },
);

export default router;
