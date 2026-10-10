import express from 'express';
import { body, validationResult } from 'express-validator';
import { Logger } from '../core/logger/index.js';
import { ErrorHandler, ValidationError } from '../core/errors/ErrorHandler.js';
import { ApiResponseBuilder } from '../core/types/ApiResponse.js';
import { container } from '../core/container/ServiceContainer.js';
import { analyticsMiddleware, gameEventMiddleware } from '../middleware/analytics-middleware.js';
import security from '../core/security/index.js';
const router = express.Router();
const logger = new Logger('GameRoutes');
// Shared container: the server registers the live service instances here at
// start-up. Creating a new container resolved nothing and every route threw.
const serviceContainer = container;
// Apply analytics middleware to all game routes
router.use(analyticsMiddleware);
router.use(gameEventMiddleware);
/**
 * Turn a caught error into a consistent 500 API response.
 * `error` is `unknown` in a catch block, so it is normalized before use.
 */
const sendError = (res, error, route, fallbackCode) => {
    const errorInfo = ErrorHandler.handle(error instanceof Error ? error : new Error(String(error)), { route });
    const response = ApiResponseBuilder.error(errorInfo.context?.['code'] || fallbackCode, errorInfo.message, errorInfo.type, errorInfo.recoverable, errorInfo.action, errorInfo.context);
    res.status(500).json(response);
};
/**
 * `container.get()` THROWS when a service has not been registered, which is
 * the case whenever the app is used before `start()` runs (tests, embedding,
 * partial boot) or when an optional backend failed to come up.
 *
 * Analytics tracking and cloud persistence are side effects: they must never
 * turn a gameplay request into a 500. A missing service therefore resolves to
 * an inert stub that logs a warning and records nothing, so every route below
 * can keep calling the service unconditionally.
 */
const getService = (name) => {
    try {
        return serviceContainer.get(name);
    }
    catch {
        logger.warn(`Optional service '${name}' is not registered; running without it`, {
            service: name,
        });
        return undefined;
    }
};
/** Inert stand-in used when the analytics service is unavailable. */
const analyticsStub = {
    sessionId: 'unavailable',
    trackGameStart: async () => { },
    trackLevelComplete: async () => { },
    trackMatchMade: async () => { },
    trackPowerUpUsed: async () => { },
    trackPurchase: async () => { },
    trackError: async () => { },
    trackPerformance: async () => { },
    getAnalyticsSummary: () => ({ degraded: true }),
};
/** Inert stand-in used when the cloud service is unavailable. */
const cloudStub = {
    saveGameState: async () => null,
    savePlayerDataToDynamoDB: async () => null,
    sendGameEventNotification: async () => null,
    getServiceStatus: () => ({ status: 'not_initialized' }),
    getPlayerProgress: async () => null,
    getPlayerAchievements: async () => null,
    getLeaderboard: async () => null,
};
const getAnalytics = () => getService('analytics') ?? analyticsStub;
const getCloud = () => getService('cloud') ?? cloudStub;
// Validation middleware
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new ValidationError('Validation failed', null, { errors: errors.array() });
        const errorInfo = ErrorHandler.handle(error);
        const response = ApiResponseBuilder.error(errorInfo.context?.['code'] || 'VALIDATION_ERROR', errorInfo.message, errorInfo.type, errorInfo.recoverable, errorInfo.action, errorInfo.context);
        res.status(400).json(response);
        return;
    }
    next();
};
/**
 * @route POST /api/game/start
 * @desc Start a new game session
 */
router.post('/start', [
    body('level').isInt({ min: 1 }).withMessage('Level must be a positive integer'),
    body('difficulty')
        .isIn(['easy', 'medium', 'hard'])
        .withMessage('Difficulty must be easy, medium, or hard'),
    body('platform').optional().isString().withMessage('Platform must be a string'),
], validateRequest, async (req, res) => {
    try {
        const { level, difficulty, platform } = req.body;
        const userId = req.user?.id || 'anonymous';
        // Get services from container
        const analyticsService = getAnalytics();
        const cloudServices = getCloud();
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
    }
    catch (error) {
        logger.error('Error starting game:', error);
        sendError(res, error, 'game/start', 'GAME_START_ERROR');
    }
});
/**
 * @route POST /api/game/level-complete
 * @desc Complete a level
 */
router.post('/level-complete', [
    body('level').isInt({ min: 1 }).withMessage('Level must be a positive integer'),
    body('score').isInt({ min: 0 }).withMessage('Score must be a non-negative integer'),
    body('timeSpent').isInt({ min: 0 }).withMessage('Time spent must be a non-negative integer'),
    body('movesUsed').isInt({ min: 1 }).withMessage('Moves used must be a positive integer'),
    body('starsEarned')
        .isInt({ min: 0, max: 3 })
        .withMessage('Stars earned must be between 0 and 3'),
    body('powerupsUsed').optional().isArray().withMessage('Powerups used must be an array'),
], validateRequest, async (req, res) => {
    try {
        const { level, score, timeSpent, movesUsed, starsEarned, powerupsUsed = [] } = req.body;
        const userId = req.user?.id || 'anonymous';
        // Get services from container
        const analyticsService = getAnalytics();
        const cloudServices = getCloud();
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
        await cloudServices.savePlayerDataToDynamoDB(process.env['AWS_DYNAMODB_TABLE'] || '', {
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
    }
    catch (error) {
        logger.error('Error completing level:', error);
        sendError(res, error, 'game/level-complete', 'LEVEL_COMPLETE_ERROR');
    }
});
/**
 * @route POST /api/game/match-made
 * @desc Track a match made in the game
 */
router.post('/match-made', [
    body('matchType').isString().withMessage('Match type must be a string'),
    body('piecesMatched')
        .isInt({ min: 1 })
        .withMessage('Pieces matched must be a positive integer'),
    body('position').isObject().withMessage('Position must be an object'),
    body('level').isInt({ min: 1 }).withMessage('Level must be a positive integer'),
    body('scoreGained')
        .isInt({ min: 0 })
        .withMessage('Score gained must be a non-negative integer'),
], validateRequest, async (req, res) => {
    try {
        const { matchType, piecesMatched, position, level, scoreGained } = req.body;
        const userId = req.user?.id || 'anonymous';
        // Get services from container
        const analyticsService = getAnalytics();
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
    }
    catch (error) {
        logger.error('Error tracking match:', error);
        sendError(res, error, 'game/match-made', 'MATCH_TRACKING_ERROR');
    }
});
/**
 * @route POST /api/game/powerup-used
 * @desc Track power-up usage
 */
router.post('/powerup-used', [
    body('type').isString().withMessage('Power-up type must be a string'),
    body('level').isInt({ min: 1 }).withMessage('Level must be a positive integer'),
    body('position').isObject().withMessage('Position must be an object'),
    body('cost').isInt({ min: 0 }).withMessage('Cost must be a non-negative integer'),
], validateRequest, async (req, res) => {
    try {
        const { type, level, position, cost } = req.body;
        const userId = req.user?.id || 'anonymous';
        // Get services from container
        const analyticsService = getAnalytics();
        // Track power-up usage
        await analyticsService.trackPowerUpUsed(userId, {
            type,
            level,
            position,
            cost,
        });
        const response = ApiResponseBuilder.success({});
        res.json(response);
    }
    catch (error) {
        logger.error('Error tracking power-up:', error);
        sendError(res, error, 'game/powerup-used', 'POWERUP_TRACKING_ERROR');
    }
});
/**
 * @route POST /api/game/purchase
 * @desc Handle in-game purchase
 */
router.post('/purchase', [
    body('itemId').isString().withMessage('Item ID must be a string'),
    body('itemType').isString().withMessage('Item type must be a string'),
    body('currency').isString().withMessage('Currency must be a string'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('transactionId').isString().withMessage('Transaction ID must be a string'),
    body('platform').optional().isString().withMessage('Platform must be a string'),
], validateRequest, async (req, res) => {
    try {
        const { itemId, itemType, currency, amount, transactionId, platform } = req.body;
        const userId = req.user?.id || 'anonymous';
        // Get services from container
        const analyticsService = getAnalytics();
        const cloudServices = getCloud();
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
    }
    catch (error) {
        logger.error('Error tracking purchase:', error);
        sendError(res, error, 'game/purchase', 'PURCHASE_TRACKING_ERROR');
    }
});
/**
 * @route POST /api/game/error
 * @desc Track game errors
 */
router.post('/error', [
    body('type').isString().withMessage('Error type must be a string'),
    body('message').isString().withMessage('Error message must be a string'),
    body('code').optional().isString().withMessage('Error code must be a string'),
    body('level').optional().isInt({ min: 1 }).withMessage('Level must be a positive integer'),
    body('stackTrace').optional().isString().withMessage('Stack trace must be a string'),
], validateRequest, async (req, res) => {
    try {
        const { type, message, code, level, stackTrace } = req.body;
        const userId = req.user?.id || 'anonymous';
        // Get services from container
        const analyticsService = getAnalytics();
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
    }
    catch (error) {
        logger.error('Error tracking error:', error);
        sendError(res, error, 'game/error', 'ERROR_TRACKING_ERROR');
    }
});
/**
 * @route POST /api/game/submit_data
 * @desc Submit game data with security validation
 */
router.post('/submit_data', security.sessionValidation, [
    body('gameData').isObject().withMessage('Game data must be an object'),
    body('actionType').isString().withMessage('Action type must be a string'),
], validateRequest, async (req, res) => {
    try {
        const { gameData, actionType } = req.body;
        const playerId = req.user?.playerId;
        logger.info('Game data submitted', {
            playerId,
            actionType,
            gameData,
        });
        security.logSecurityEvent('game_data_submitted', {
            playerId,
            actionType,
            ip: req.ip,
        });
        const response = ApiResponseBuilder.success({
            message: 'Game data processed successfully',
        });
        res.json(response);
    }
    catch (error) {
        logger.error('Game data submission failed', error);
        sendError(res, error, 'game/submit_data', 'GAME_DATA_SUBMISSION_ERROR');
    }
});
/**
 * @route GET /api/game/progress
 * @desc Get player progress
 */
router.get('/progress', security.sessionValidation, async (req, res) => {
    try {
        const playerId = req.user?.playerId;
        if (!playerId) {
            res.status(401).json(ApiResponseBuilder.error('UNAUTHORIZED', 'Player not authenticated'));
            return;
        }
        // Get actual progress from cloud services
        const cloudServices = getCloud();
        const progress = await cloudServices.getPlayerProgress(playerId) || {
            playerId,
            level: 1,
            score: 0,
            coins: 100,
            gems: 10,
            lastPlayed: new Date().toISOString(),
        };
        const response = ApiResponseBuilder.success({ progress });
        res.json(response);
    }
    catch (error) {
        logger.error('Failed to get player progress', error);
        sendError(res, error, 'game/progress', 'PROGRESS_RETRIEVAL_ERROR');
    }
});
/**
 * @route PUT /api/game/progress
 * @desc Update player progress
 */
router.put('/progress', security.sessionValidation, async (req, res) => {
    try {
        const playerId = req.user?.playerId;
        const progressData = req.body;
        logger.info('Player progress updated', {
            playerId,
            progressData,
        });
        security.logSecurityEvent('progress_updated', {
            playerId,
            ip: req.ip,
        });
        const response = ApiResponseBuilder.success({
            message: 'Progress updated successfully',
        });
        res.json(response);
    }
    catch (error) {
        logger.error('Failed to update player progress', error);
        sendError(res, error, 'game/progress', 'PROGRESS_UPDATE_ERROR');
    }
});
/**
 * @route GET /api/game/leaderboard
 * @desc Get leaderboard
 */
router.get('/leaderboard', security.sessionValidation, async (req, res) => {
    try {
        const { type = 'score', limit = 10 } = req.query;
        const parsedLimit = Number.parseInt(String(limit), 10);
        const safeLimit = Number.isNaN(parsedLimit) ? 10 : Math.min(Math.max(parsedLimit, 1), 100);
        // Get actual leaderboard from cloud services
        const cloudServices = getCloud();
        const leaderboard = await cloudServices.getLeaderboard(String(type), safeLimit) || [];
        const response = ApiResponseBuilder.success({
            leaderboard,
            type,
        });
        res.json(response);
    }
    catch (error) {
        logger.error('Failed to get leaderboard', error);
        sendError(res, error, 'game/leaderboard', 'LEADERBOARD_RETRIEVAL_ERROR');
    }
});
/**
 * @route GET /api/game/achievements
 * @desc Get achievements
 */
router.get('/achievements', security.sessionValidation, async (req, res) => {
    try {
        const playerId = req.user?.playerId;
        if (!playerId) {
            res.status(401).json(ApiResponseBuilder.error('UNAUTHORIZED', 'Player not authenticated'));
            return;
        }
        // Get actual achievements from cloud services
        const cloudServices = getCloud();
        const achievements = await cloudServices.getPlayerAchievements(playerId) || [];
        const response = ApiResponseBuilder.success({ achievements });
        res.json(response);
    }
    catch (error) {
        logger.error('Failed to get achievements', error);
        sendError(res, error, 'game/achievements', 'ACHIEVEMENTS_RETRIEVAL_ERROR');
    }
});
/**
 * @route POST /api/game/achievements/:achievementId/unlock
 * @desc Unlock achievement
 */
router.post('/achievements/:achievementId/unlock', security.sessionValidation, async (req, res) => {
    try {
        const playerId = req.user?.playerId;
        const { achievementId } = req.params;
        logger.info('Achievement unlocked', {
            playerId,
            achievementId,
        });
        security.logSecurityEvent('achievement_unlocked', {
            playerId,
            achievementId,
            ip: req.ip,
        });
        const response = ApiResponseBuilder.success({
            message: 'Achievement unlocked successfully',
        });
        res.json(response);
    }
    catch (error) {
        logger.error('Failed to unlock achievement', error);
        sendError(res, error, 'game/achievements/unlock', 'ACHIEVEMENT_UNLOCK_ERROR');
    }
});
/**
 * @route GET /api/game/analytics/summary
 * @desc Get analytics summary
 */
router.get('/analytics/summary', async (req, res) => {
    try {
        // Get services from container
        const analyticsService = getAnalytics();
        const cloudServices = getCloud();
        const summary = analyticsService.getAnalyticsSummary();
        const cloudStatus = cloudServices.getServiceStatus();
        const response = ApiResponseBuilder.success({
            analytics: summary,
            cloudServices: cloudStatus,
        });
        res.json(response);
    }
    catch (error) {
        logger.error('Error getting analytics summary:', error);
        sendError(res, error, 'game/analytics/summary', 'ANALYTICS_SUMMARY_ERROR');
    }
});
/**
 * @route POST /api/game/performance
 * @desc Track performance metrics
 */
router.post('/performance', [
    body('metricName').isString().withMessage('Metric name must be a string'),
    body('value').isNumeric().withMessage('Value must be a number'),
    body('unit').isString().withMessage('Unit must be a string'),
    body('level').optional().isInt({ min: 1 }).withMessage('Level must be a positive integer'),
    body('deviceInfo').optional().isObject().withMessage('Device info must be an object'),
], validateRequest, async (req, res) => {
    try {
        const { metricName, value, unit, level, deviceInfo } = req.body;
        const userId = req.user?.id || 'anonymous';
        // Get services from container
        const analyticsService = getAnalytics();
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
    }
    catch (error) {
        logger.error('Error tracking performance:', error);
        sendError(res, error, 'game/performance', 'PERFORMANCE_TRACKING_ERROR');
    }
});
export default router;
//# sourceMappingURL=game-routes.js.map