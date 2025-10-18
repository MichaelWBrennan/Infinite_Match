import express from 'express';
import { Logger } from '../core/logger/index.js';
import { aiCacheManager } from '../services/ai-cache-manager.js';
import { AIContentGenerator } from '../services/ai-content-generator.js';
import { AIPersonalizationEngine } from '../services/ai-personalization-engine.js';
import { AIAnalyticsEngine } from '../services/ai-analytics-engine.js';
import { ServiceError } from '../core/errors/ErrorHandler.js';

const router = express.Router();
const logger = new Logger('AIOptimizedRoutes');

// Initialize AI services
const aiContentGenerator = new AIContentGenerator();
const aiPersonalizationEngine = new AIPersonalizationEngine();
const aiAnalyticsEngine = new AIAnalyticsEngine();

/**
 * AI-Optimized Content Generation Endpoints
 */

// Generate level with AI optimization
router.post('/content/generate-level', async (req, res) => {
  const startTime = Date.now();
  const { levelNumber, difficulty, playerId } = req.body;
  
  try {
    const cacheKey = `level:${levelNumber}:${difficulty}:${playerId || 'default'}`;
    
    // Try cache first
    const cachedLevel = await aiCacheManager.get(cacheKey, 'content');
    if (cachedLevel) {
      logger.info('Level served from cache', { levelNumber, responseTime: Date.now() - startTime });
      return res.json({
        success: true,
        data: cachedLevel,
        cached: true,
        responseTime: Date.now() - startTime
      });
    }
    
    // Generate with AI
    const level = await aiContentGenerator.generateLevel(levelNumber, difficulty, { id: playerId });
    
    // Cache the result
    await aiCacheManager.set(cacheKey, level, 'content', 3600);
    
    logger.info('Level generated with AI', { 
      levelNumber, 
      responseTime: Date.now() - startTime 
    });
    
    res.json({
      success: true,
      data: level,
      cached: false,
      responseTime: Date.now() - startTime
    });
  } catch (error) {
    logger.error('Level generation failed', { error: error.message, levelNumber });
    res.status(500).json({
      success: false,
      error: 'Failed to generate level',
      responseTime: Date.now() - startTime
    });
  }
});

// Generate event with AI optimization
router.post('/content/generate-event', async (req, res) => {
  const startTime = Date.now();
  const { eventType, playerSegment, marketTrends } = req.body;
  
  try {
    const cacheKey = `event:${eventType}:${playerSegment}:${JSON.stringify(marketTrends)}`;
    
    const cachedEvent = await aiCacheManager.get(cacheKey, 'content');
    if (cachedEvent) {
      return res.json({
        success: true,
        data: cachedEvent,
        cached: true,
        responseTime: Date.now() - startTime
      });
    }
    
    const event = await aiContentGenerator.generateEvent(eventType, playerSegment, marketTrends);
    await aiCacheManager.set(cacheKey, event, 'content', 1800);
    
    res.json({
      success: true,
      data: event,
      cached: false,
      responseTime: Date.now() - startTime
    });
  } catch (error) {
    logger.error('Event generation failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate event',
      responseTime: Date.now() - startTime
    });
  }
});

// Generate visual asset with AI optimization
router.post('/content/generate-visual', async (req, res) => {
  const startTime = Date.now();
  const { assetType, description, style } = req.body;
  
  try {
    const cacheKey = `visual:${assetType}:${description}:${style}`;
    
    const cachedAsset = await aiCacheManager.get(cacheKey, 'content');
    if (cachedAsset) {
      return res.json({
        success: true,
        data: cachedAsset,
        cached: true,
        responseTime: Date.now() - startTime
      });
    }
    
    const asset = await aiContentGenerator.generateVisualAsset(assetType, description, style);
    await aiCacheManager.set(cacheKey, asset, 'content', 7200);
    
    res.json({
      success: true,
      data: asset,
      cached: false,
      responseTime: Date.now() - startTime
    });
  } catch (error) {
    logger.error('Visual asset generation failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate visual asset',
      responseTime: Date.now() - startTime
    });
  }
});

/**
 * AI-Optimized Personalization Endpoints
 */

// Get personalized recommendations
router.get('/personalization/recommendations/:playerId', async (req, res) => {
  const startTime = Date.now();
  const { playerId } = req.params;
  const { type = 'content' } = req.query;
  
  try {
    const cacheKey = `recommendations:${playerId}:${type}`;
    
    const cachedRecommendations = await aiCacheManager.get(cacheKey, 'personalization');
    if (cachedRecommendations) {
      return res.json({
        success: true,
        data: cachedRecommendations,
        cached: true,
        responseTime: Date.now() - startTime
      });
    }
    
    const recommendations = await aiPersonalizationEngine.generatePersonalizedRecommendations(playerId, type);
    await aiCacheManager.set(cacheKey, recommendations, 'personalization', 900);
    
    res.json({
      success: true,
      data: recommendations,
      cached: false,
      responseTime: Date.now() - startTime
    });
  } catch (error) {
    logger.error('Recommendations generation failed', { error: error.message, playerId });
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations',
      responseTime: Date.now() - startTime
    });
  }
});

// Update player behavior
router.post('/personalization/behavior', async (req, res) => {
  const startTime = Date.now();
  const { playerId, behaviorData } = req.body;
  
  try {
    // Update behavior in real-time
    await aiPersonalizationEngine.updatePlayerBehaviorRealTime(playerId, behaviorData);
    
    // Invalidate related caches
    await aiCacheManager.invalidatePattern(`*${playerId}*`, 'personalization');
    
    res.json({
      success: true,
      message: 'Behavior updated successfully',
      responseTime: Date.now() - startTime
    });
  } catch (error) {
    logger.error('Behavior update failed', { error: error.message, playerId });
    res.status(500).json({
      success: false,
      error: 'Failed to update behavior',
      responseTime: Date.now() - startTime
    });
  }
});

// Get difficulty adjustment
router.get('/personalization/difficulty/:playerId', async (req, res) => {
  const startTime = Date.now();
  const { playerId } = req.params;
  
  try {
    const cacheKey = `difficulty:${playerId}`;
    
    const cachedAdjustment = await aiCacheManager.get(cacheKey, 'personalization');
    if (cachedAdjustment) {
      return res.json({
        success: true,
        data: cachedAdjustment,
        cached: true,
        responseTime: Date.now() - startTime
      });
    }
    
    const adjustment = await aiPersonalizationEngine.optimizeDifficulty(playerId, req.body.currentLevel, req.body.performance);
    await aiCacheManager.set(cacheKey, adjustment, 'personalization', 300);
    
    res.json({
      success: true,
      data: adjustment,
      cached: false,
      responseTime: Date.now() - startTime
    });
  } catch (error) {
    logger.error('Difficulty optimization failed', { error: error.message, playerId });
    res.status(500).json({
      success: false,
      error: 'Failed to optimize difficulty',
      responseTime: Date.now() - startTime
    });
  }
});

/**
 * AI-Optimized Analytics Endpoints
 */

// Analyze player behavior
router.post('/analytics/analyze-player', async (req, res) => {
  const startTime = Date.now();
  const { playerId, timeRange = '7d' } = req.body;
  
  try {
    const cacheKey = `analysis:${playerId}:${timeRange}`;
    
    const cachedAnalysis = await aiCacheManager.get(cacheKey, 'analytics');
    if (cachedAnalysis) {
      return res.json({
        success: true,
        data: cachedAnalysis,
        cached: true,
        responseTime: Date.now() - startTime
      });
    }
    
    const analysis = await aiAnalyticsEngine.analyzePlayerBehavior(playerId, timeRange);
    await aiCacheManager.set(cacheKey, analysis, 'analytics', 600);
    
    res.json({
      success: true,
      data: analysis,
      cached: false,
      responseTime: Date.now() - startTime
    });
  } catch (error) {
    logger.error('Player analysis failed', { error: error.message, playerId });
    res.status(500).json({
      success: false,
      error: 'Failed to analyze player',
      responseTime: Date.now() - startTime
    });
  }
});

// Predict player LTV
router.get('/analytics/predict-ltv/:playerId', async (req, res) => {
  const startTime = Date.now();
  const { playerId } = req.params;
  
  try {
    const cacheKey = `ltv:${playerId}`;
    
    const cachedLTV = await aiCacheManager.get(cacheKey, 'predictions');
    if (cachedLTV) {
      return res.json({
        success: true,
        data: cachedLTV,
        cached: true,
        responseTime: Date.now() - startTime
      });
    }
    
    const ltvPrediction = await aiAnalyticsEngine.predictPlayerLTV(playerId);
    await aiCacheManager.set(cacheKey, ltvPrediction, 'predictions', 1800);
    
    res.json({
      success: true,
      data: ltvPrediction,
      cached: false,
      responseTime: Date.now() - startTime
    });
  } catch (error) {
    logger.error('LTV prediction failed', { error: error.message, playerId });
    res.status(500).json({
      success: false,
      error: 'Failed to predict LTV',
      responseTime: Date.now() - startTime
    });
  }
});

// Predict churn risk
router.get('/analytics/predict-churn/:playerId', async (req, res) => {
  const startTime = Date.now();
  const { playerId } = req.params;
  
  try {
    const cacheKey = `churn:${playerId}`;
    
    const cachedChurn = await aiCacheManager.get(cacheKey, 'predictions');
    if (cachedChurn) {
      return res.json({
        success: true,
        data: cachedChurn,
        cached: true,
        responseTime: Date.now() - startTime
      });
    }
    
    const churnPrediction = await aiAnalyticsEngine.predictChurnRisk(playerId);
    await aiCacheManager.set(cacheKey, churnPrediction, 'predictions', 900);
    
    res.json({
      success: true,
      data: churnPrediction,
      cached: false,
      responseTime: Date.now() - startTime
    });
  } catch (error) {
    logger.error('Churn prediction failed', { error: error.message, playerId });
    res.status(500).json({
      success: false,
      error: 'Failed to predict churn',
      responseTime: Date.now() - startTime
    });
  }
});

// Generate optimization recommendations
router.post('/analytics/optimization-recommendations', async (req, res) => {
  const startTime = Date.now();
  const { gameArea } = req.body;
  
  try {
    const cacheKey = `optimization:${gameArea}`;
    
    const cachedRecommendations = await aiCacheManager.get(cacheKey, 'analytics');
    if (cachedRecommendations) {
      return res.json({
        success: true,
        data: cachedRecommendations,
        cached: true,
        responseTime: Date.now() - startTime
      });
    }
    
    const recommendations = await aiAnalyticsEngine.generateOptimizationRecommendations(gameArea);
    await aiCacheManager.set(cacheKey, recommendations, 'analytics', 1800);
    
    res.json({
      success: true,
      data: recommendations,
      cached: false,
      responseTime: Date.now() - startTime
    });
  } catch (error) {
    logger.error('Optimization recommendations failed', { error: error.message, gameArea });
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations',
      responseTime: Date.now() - startTime
    });
  }
});

/**
 * AI-Optimized Batch Endpoints
 */

// Batch content generation
router.post('/batch/content', async (req, res) => {
  const startTime = Date.now();
  const { requests } = req.body;
  
  try {
    const results = [];
    const cacheKeys = [];
    
    // Check cache for all requests
    for (const request of requests) {
      const cacheKey = `batch:${JSON.stringify(request)}`;
      cacheKeys.push(cacheKey);
      
      const cached = await aiCacheManager.get(cacheKey, 'content');
      if (cached) {
        results.push({ ...request, data: cached, cached: true });
      } else {
        results.push({ ...request, cached: false });
      }
    }
    
    // Generate missing content
    const generationPromises = results
      .filter(result => !result.cached)
      .map(async (result) => {
        try {
          let data;
          switch (result.type) {
            case 'level':
              data = await aiContentGenerator.generateLevel(result.levelNumber, result.difficulty, result.playerProfile);
              break;
            case 'event':
              data = await aiContentGenerator.generateEvent(result.eventType, result.playerSegment, result.marketTrends);
              break;
            case 'visual':
              data = await aiContentGenerator.generateVisualAsset(result.assetType, result.description, result.style);
              break;
            default:
              throw new Error(`Unknown content type: ${result.type}`);
          }
          
          result.data = data;
          result.cached = false;
          
          // Cache the result
          const cacheKey = `batch:${JSON.stringify(result)}`;
          await aiCacheManager.set(cacheKey, data, 'content', 3600);
        } catch (error) {
          result.error = error.message;
        }
      });
    
    await Promise.allSettled(generationPromises);
    
    res.json({
      success: true,
      data: results,
      responseTime: Date.now() - startTime
    });
  } catch (error) {
    logger.error('Batch content generation failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate batch content',
      responseTime: Date.now() - startTime
    });
  }
});

/**
 * AI Performance Monitoring Endpoints
 */

// Get AI performance stats
router.get('/performance/stats', async (req, res) => {
  try {
    const cacheStats = aiCacheManager.getCacheStats();
    const contentStats = aiContentGenerator.getPerformanceStats?.() || {};
    const personalizationStats = aiPersonalizationEngine.getPerformanceStats?.() || {};
    const analyticsStats = aiAnalyticsEngine.getPerformanceStats?.() || {};
    
    res.json({
      success: true,
      data: {
        cache: cacheStats,
        content: contentStats,
        personalization: personalizationStats,
        analytics: analyticsStats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to get performance stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get performance stats'
    });
  }
});

// Clear AI caches
router.post('/performance/clear-cache', async (req, res) => {
  try {
    const { cacheType } = req.body;
    await aiCacheManager.clear(cacheType);
    
    res.json({
      success: true,
      message: `Cache cleared: ${cacheType || 'all'}`
    });
  } catch (error) {
    logger.error('Failed to clear cache', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const cacheHealth = await aiCacheManager.healthCheck();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        cache: cacheHealth,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

export default router;