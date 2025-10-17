import express from 'express';
import { Logger } from '../core/logger/index.js';
import { AIContentGenerator } from '../services/ai-content-generator.js';
import { MarketResearchEngine } from '../services/market-research-engine.js';
import { AIPersonalizationEngine } from '../services/ai-personalization-engine.js';
import { InfiniteContentPipeline } from '../services/infinite-content-pipeline.js';
import { AIAnalyticsEngine } from '../services/ai-analytics-engine.js';

const router = express.Router();
const logger = new Logger('AIContentRoutes');

// Initialize AI services
const aiContentGenerator = new AIContentGenerator();
const marketResearch = new MarketResearchEngine();
const personalizationEngine = new AIPersonalizationEngine();
const contentPipeline = new InfiniteContentPipeline();
const analyticsEngine = new AIAnalyticsEngine();

/**
 * Generate AI content
 */
router.post('/generate', async (req, res) => {
    try {
        const { contentType, playerId, preferences } = req.body;
        
        if (!contentType) {
            return res.status(400).json({ 
                success: false, 
                error: 'Content type is required' 
            });
        }

        let content;
        
        if (playerId && preferences) {
            // Generate personalized content
            content = await aiContentGenerator.generatePersonalizedContent(
                playerId, 
                contentType, 
                preferences
            );
        } else {
            // Generate general content
            const marketInsights = await marketResearch.getMarketInsights();
            
            switch (contentType) {
                case 'level':
                    content = await aiContentGenerator.generateLevel(
                        req.body.levelNumber || 1,
                        req.body.difficulty || 5,
                        { marketTrends: marketInsights }
                    );
                    break;
                case 'event':
                    content = await aiContentGenerator.generateEvent(
                        req.body.eventType || 'daily',
                        req.body.playerSegment || 'casual',
                        marketInsights
                    );
                    break;
                case 'visual':
                    content = await aiContentGenerator.generateVisualAsset(
                        req.body.assetType || 'background',
                        req.body.description || 'Game asset',
                        req.body.style || 'cartoon'
                    );
                    break;
                default:
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Invalid content type' 
                    });
            }
        }

        res.json({ 
            success: true, 
            content: content,
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Failed to generate AI content', { error: error.message });
        res.status(500).json({ 
            success: false, 
            error: 'Content generation failed' 
        });
    }
});

/**
 * Get market insights
 */
router.get('/market-insights', async (req, res) => {
    try {
        const insights = await marketResearch.getMarketInsights();
        
        res.json({ 
            success: true, 
            insights: insights,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Failed to get market insights', { error: error.message });
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get market insights' 
        });
    }
});

/**
 * Create player profile
 */
router.post('/player-profile', async (req, res) => {
    try {
        const { playerId, initialData } = req.body;
        
        if (!playerId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Player ID is required' 
            });
        }

        const profile = await personalizationEngine.createPlayerProfile(playerId, initialData);
        
        res.json({ 
            success: true, 
            profile: profile
        });

    } catch (error) {
        logger.error('Failed to create player profile', { error: error.message });
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create player profile' 
        });
    }
});

/**
 * Get personalized recommendations
 */
router.get('/recommendations/:playerId', async (req, res) => {
    try {
        const { playerId } = req.params;
        const { contentType } = req.query;
        
        const recommendations = await personalizationEngine.generatePersonalizedRecommendations(
            playerId, 
            contentType || 'level'
        );
        
        res.json({ 
            success: true, 
            recommendations: recommendations
        });

    } catch (error) {
        logger.error('Failed to get recommendations', { error: error.message });
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get recommendations' 
        });
    }
});

/**
 * Optimize difficulty
 */
router.post('/optimize-difficulty', async (req, res) => {
    try {
        const { playerId, currentLevel, performance } = req.body;
        
        if (!playerId || !currentLevel) {
            return res.status(400).json({ 
                success: false, 
                error: 'Player ID and current level are required' 
            });
        }

        const optimization = await personalizationEngine.optimizeDifficulty(
            playerId, 
            currentLevel, 
            performance
        );
        
        res.json({ 
            success: true, 
            optimization: optimization
        });

    } catch (error) {
        logger.error('Failed to optimize difficulty', { error: error.message });
        res.status(500).json({ 
            success: false, 
            error: 'Failed to optimize difficulty' 
        });
    }
});

/**
 * Predict churn risk
 */
router.get('/churn-prediction/:playerId', async (req, res) => {
    try {
        const { playerId } = req.params;
        
        const prediction = await personalizationEngine.predictChurnRisk(playerId);
        
        res.json({ 
            success: true, 
            prediction: prediction
        });

    } catch (error) {
        logger.error('Failed to predict churn risk', { error: error.message });
        res.status(500).json({ 
            success: false, 
            error: 'Failed to predict churn risk' 
        });
    }
});

/**
 * Generate personalized offers
 */
router.post('/personalized-offers', async (req, res) => {
    try {
        const { playerId, offerType } = req.body;
        
        if (!playerId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Player ID is required' 
            });
        }

        const offers = await personalizationEngine.generatePersonalizedOffers(
            playerId, 
            offerType || 'discount'
        );
        
        res.json({ 
            success: true, 
            offers: offers
        });

    } catch (error) {
        logger.error('Failed to generate personalized offers', { error: error.message });
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate personalized offers' 
        });
    }
});

/**
 * Get analytics insights
 */
router.get('/analytics/insights', async (req, res) => {
    try {
        const { gameArea } = req.query;
        
        const insights = await analyticsEngine.generateRealTimeInsights();
        
        res.json({ 
            success: true, 
            insights: insights
        });

    } catch (error) {
        logger.error('Failed to get analytics insights', { error: error.message });
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get analytics insights' 
        });
    }
});

/**
 * Analyze player behavior
 */
router.post('/analytics/player-behavior', async (req, res) => {
    try {
        const { playerId, timeRange } = req.body;
        
        if (!playerId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Player ID is required' 
            });
        }

        const analysis = await analyticsEngine.analyzePlayerBehavior(
            playerId, 
            timeRange || '7d'
        );
        
        res.json({ 
            success: true, 
            analysis: analysis
        });

    } catch (error) {
        logger.error('Failed to analyze player behavior', { error: error.message });
        res.status(500).json({ 
            success: false, 
            error: 'Failed to analyze player behavior' 
        });
    }
});

/**
 * Predict player LTV
 */
router.get('/analytics/ltv/:playerId', async (req, res) => {
    try {
        const { playerId } = req.params;
        
        const ltvPrediction = await analyticsEngine.predictPlayerLTV(playerId);
        
        res.json({ 
            success: true, 
            ltvPrediction: ltvPrediction
        });

    } catch (error) {
        logger.error('Failed to predict LTV', { error: error.message });
        res.status(500).json({ 
            success: false, 
            error: 'Failed to predict LTV' 
        });
    }
});

/**
 * Analyze content performance
 */
router.post('/analytics/content-performance', async (req, res) => {
    try {
        const { contentId, contentType } = req.body;
        
        if (!contentId || !contentType) {
            return res.status(400).json({ 
                success: false, 
                error: 'Content ID and type are required' 
            });
        }

        const analysis = await analyticsEngine.analyzeContentPerformance(
            contentId, 
            contentType
        );
        
        res.json({ 
            success: true, 
            analysis: analysis
        });

    } catch (error) {
        logger.error('Failed to analyze content performance', { error: error.message });
        res.status(500).json({ 
            success: false, 
            error: 'Failed to analyze content performance' 
        });
    }
});

/**
 * Get optimization recommendations
 */
router.get('/analytics/optimization', async (req, res) => {
    try {
        const { gameArea } = req.query;
        
        const recommendations = await analyticsEngine.generateOptimizationRecommendations(
            gameArea || 'general'
        );
        
        res.json({ 
            success: true, 
            recommendations: recommendations
        });

    } catch (error) {
        logger.error('Failed to get optimization recommendations', { error: error.message });
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get optimization recommendations' 
        });
    }
});

/**
 * Get market analysis
 */
router.get('/analytics/market', async (req, res) => {
    try {
        const analysis = await analyticsEngine.analyzeMarketTrends();
        
        res.json({ 
            success: true, 
            analysis: analysis
        });

    } catch (error) {
        logger.error('Failed to analyze market trends', { error: error.message });
        res.status(500).json({ 
            success: false, 
            error: 'Failed to analyze market trends' 
        });
    }
});

/**
 * Predict revenue
 */
router.get('/analytics/revenue-prediction', async (req, res) => {
    try {
        const { timeRange } = req.query;
        
        const prediction = await analyticsEngine.predictRevenue(timeRange || '30d');
        
        res.json({ 
            success: true, 
            prediction: prediction
        });

    } catch (error) {
        logger.error('Failed to predict revenue', { error: error.message });
        res.status(500).json({ 
            success: false, 
            error: 'Failed to predict revenue' 
        });
    }
});

/**
 * Get content pipeline status
 */
router.get('/pipeline/status', async (req, res) => {
    try {
        const status = {
            isRunning: true,
            lastUpdate: new Date().toISOString(),
            generatedContent: {
                levels: 0,
                events: 0,
                visuals: 0,
                offers: 0
            },
            activeGenerators: 0,
            queueSize: 0
        };
        
        res.json({ 
            success: true, 
            status: status
        });

    } catch (error) {
        logger.error('Failed to get pipeline status', { error: error.message });
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get pipeline status' 
        });
    }
});

/**
 * Trigger content generation
 */
router.post('/pipeline/generate', async (req, res) => {
    try {
        const { contentType, count } = req.body;
        
        if (!contentType) {
            return res.status(400).json({ 
                success: false, 
                error: 'Content type is required' 
            });
        }

        const content = await contentPipeline.generateBatchContent(
            contentType, 
            count || 10
        );
        
        res.json({ 
            success: true, 
            content: content,
            count: content.length
        });

    } catch (error) {
        logger.error('Failed to trigger content generation', { error: error.message });
        res.status(500).json({ 
            success: false, 
            error: 'Failed to trigger content generation' 
        });
    }
});

export default router;