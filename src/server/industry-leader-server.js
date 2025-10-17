import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Logger } from '../core/logger/index.js';
import { IndustryLeaderEngine } from '../services/industry-leader-engine.js';
import { AIContentGenerator } from '../services/ai-content-generator.js';
import { AIPersonalizationEngine } from '../services/ai-personalization-engine.js';
import { MarketResearchEngine } from '../services/market-research-engine.js';
import { InfiniteContentPipeline } from '../services/infinite-content-pipeline.js';
import { AIAnalyticsEngine } from '../services/ai-analytics-engine.js';

/**
 * Industry Leader Server - The Ultimate Game Development Server
 * Integrates all AI systems to create the most advanced mobile game ever built
 */
class IndustryLeaderServer {
    constructor() {
        this.logger = new Logger('IndustryLeaderServer');
        this.app = express();
        this.server = new HttpServer(this.app);
        this.io = new SocketIOServer(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.port = process.env.PORT || 3000;
        this.isInitialized = false;
        
        // Initialize the Industry Leader Engine
        this.industryLeaderEngine = new IndustryLeaderEngine();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
        this.setupErrorHandling();
    }

    /**
     * Setup middleware
     */
    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "https:"],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"],
                },
            },
        }));

        // CORS middleware
        this.app.use(cors({
            origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
            credentials: true
        }));

        // Compression middleware
        this.app.use(compression());

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000, // limit each IP to 1000 requests per windowMs
            message: 'Too many requests from this IP, please try again later.',
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use(limiter);

        // Body parsing middleware
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging
        this.app.use((req, res, next) => {
            this.logger.info(`${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            next();
        });
    }

    /**
     * Setup routes
     */
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                engine: this.industryLeaderEngine.getEngineStatus()
            });
        });

        // Engine status
        this.app.get('/api/engine/status', (req, res) => {
            try {
                const status = this.industryLeaderEngine.getEngineStatus();
                res.json({
                    success: true,
                    status: status
                });
            } catch (error) {
                this.logger.error('Failed to get engine status', { error: error.message });
                res.status(500).json({
                    success: false,
                    error: 'Failed to get engine status'
                });
            }
        });

        // Comprehensive analytics
        this.app.get('/api/analytics/comprehensive', async (req, res) => {
            try {
                const analytics = await this.industryLeaderEngine.getComprehensiveAnalytics();
                res.json({
                    success: true,
                    analytics: analytics
                });
            } catch (error) {
                this.logger.error('Failed to get comprehensive analytics', { error: error.message });
                res.status(500).json({
                    success: false,
                    error: 'Failed to get comprehensive analytics'
                });
            }
        });

        // Player insights
        this.app.get('/api/analytics/player/:playerId', async (req, res) => {
            try {
                const { playerId } = req.params;
                const insights = await this.industryLeaderEngine.generatePlayerInsights(playerId);
                res.json({
                    success: true,
                    insights: insights
                });
            } catch (error) {
                this.logger.error('Failed to get player insights', { error: error.message, playerId: req.params.playerId });
                res.status(500).json({
                    success: false,
                    error: 'Failed to get player insights'
                });
            }
        });

        // Generate content for player
        this.app.post('/api/content/generate/:playerId', async (req, res) => {
            try {
                const { playerId } = req.params;
                const { contentType, preferences } = req.body;
                
                const content = await this.industryLeaderEngine.generateContentForPlayer(
                    playerId, 
                    contentType, 
                    preferences
                );
                
                res.json({
                    success: true,
                    content: content
                });
            } catch (error) {
                this.logger.error('Failed to generate content for player', { 
                    error: error.message, 
                    playerId: req.params.playerId 
                });
                res.status(500).json({
                    success: false,
                    error: 'Failed to generate content for player'
                });
            }
        });

        // Generate event for segment
        this.app.post('/api/events/generate/:segmentName', async (req, res) => {
            try {
                const { segmentName } = req.params;
                const event = await this.industryLeaderEngine.generateEventForSegment(segmentName);
                
                res.json({
                    success: true,
                    event: event
                });
            } catch (error) {
                this.logger.error('Failed to generate event for segment', { 
                    error: error.message, 
                    segmentName: req.params.segmentName 
                });
                res.status(500).json({
                    success: false,
                    error: 'Failed to generate event for segment'
                });
            }
        });

        // Generate visual asset
        this.app.post('/api/assets/generate', async (req, res) => {
            try {
                const { prompt, style } = req.body;
                const asset = await this.industryLeaderEngine.generateVisualAsset(prompt, style);
                
                res.json({
                    success: true,
                    asset: asset
                });
            } catch (error) {
                this.logger.error('Failed to generate visual asset', { error: error.message });
                res.status(500).json({
                    success: false,
                    error: 'Failed to generate visual asset'
                });
            }
        });

        // Get market trends
        this.app.get('/api/market/trends', async (req, res) => {
            try {
                const trends = await this.industryLeaderEngine.getMarketTrends();
                res.json({
                    success: true,
                    trends: trends
                });
            } catch (error) {
                this.logger.error('Failed to get market trends', { error: error.message });
                res.status(500).json({
                    success: false,
                    error: 'Failed to get market trends'
                });
            }
        });

        // Get competitor analysis
        this.app.get('/api/market/competitors', async (req, res) => {
            try {
                const analysis = await this.industryLeaderEngine.getCompetitorAnalysis();
                res.json({
                    success: true,
                    analysis: analysis
                });
            } catch (error) {
                this.logger.error('Failed to get competitor analysis', { error: error.message });
                res.status(500).json({
                    success: false,
                    error: 'Failed to get competitor analysis'
                });
            }
        });

        // Get AI recommendations
        this.app.post('/api/ai/recommendations', async (req, res) => {
            try {
                const { context } = req.body;
                const recommendations = await this.industryLeaderEngine.getAIRecommendations(context);
                
                res.json({
                    success: true,
                    recommendations: recommendations
                });
            } catch (error) {
                this.logger.error('Failed to get AI recommendations', { error: error.message });
                res.status(500).json({
                    success: false,
                    error: 'Failed to get AI recommendations'
                });
            }
        });

        // Real-time insights
        this.app.get('/api/insights/realtime', async (req, res) => {
            try {
                const insights = await this.industryLeaderEngine.aiAnalyticsEngine.generateRealTimeInsights();
                res.json({
                    success: true,
                    insights: insights
                });
            } catch (error) {
                this.logger.error('Failed to get real-time insights', { error: error.message });
                res.status(500).json({
                    success: false,
                    error: 'Failed to get real-time insights'
                });
            }
        });

        // Churn prediction
        this.app.get('/api/predictions/churn/:playerId', async (req, res) => {
            try {
                const { playerId } = req.params;
                const prediction = await this.industryLeaderEngine.aiAnalyticsEngine.predictPlayerChurn(playerId);
                
                res.json({
                    success: true,
                    prediction: prediction
                });
            } catch (error) {
                this.logger.error('Failed to predict churn', { error: error.message, playerId: req.params.playerId });
                res.status(500).json({
                    success: false,
                    error: 'Failed to predict churn'
                });
            }
        });

        // LTV prediction
        this.app.get('/api/predictions/ltv/:playerId', async (req, res) => {
            try {
                const { playerId } = req.params;
                const prediction = await this.industryLeaderEngine.aiAnalyticsEngine.predictPlayerLTV(playerId);
                
                res.json({
                    success: true,
                    prediction: prediction
                });
            } catch (error) {
                this.logger.error('Failed to predict LTV', { error: error.message, playerId: req.params.playerId });
                res.status(500).json({
                    success: false,
                    error: 'Failed to predict LTV'
                });
            }
        });

        // Engagement optimization
        this.app.post('/api/optimization/engagement/:playerId', async (req, res) => {
            try {
                const { playerId } = req.params;
                const optimization = await this.industryLeaderEngine.aiAnalyticsEngine.optimizePlayerEngagement(playerId);
                
                res.json({
                    success: true,
                    optimization: optimization
                });
            } catch (error) {
                this.logger.error('Failed to optimize engagement', { error: error.message, playerId: req.params.playerId });
                res.status(500).json({
                    success: false,
                    error: 'Failed to optimize engagement'
                });
            }
        });

        // Monetization optimization
        this.app.post('/api/optimization/monetization/:playerId', async (req, res) => {
            try {
                const { playerId } = req.params;
                const optimization = await this.industryLeaderEngine.aiAnalyticsEngine.optimizeMonetization(playerId);
                
                res.json({
                    success: true,
                    optimization: optimization
                });
            } catch (error) {
                this.logger.error('Failed to optimize monetization', { error: error.message, playerId: req.params.playerId });
                res.status(500).json({
                    success: false,
                    error: 'Failed to optimize monetization'
                });
            }
        });

        // Personalized content
        this.app.post('/api/personalization/content/:playerId', async (req, res) => {
            try {
                const { playerId } = req.params;
                const { contentType, preferences } = req.body;
                
                const content = await this.industryLeaderEngine.aiPersonalizationEngine.generatePersonalizedContent(
                    playerId, 
                    contentType, 
                    preferences
                );
                
                res.json({
                    success: true,
                    content: content
                });
            } catch (error) {
                this.logger.error('Failed to generate personalized content', { 
                    error: error.message, 
                    playerId: req.params.playerId 
                });
                res.status(500).json({
                    success: false,
                    error: 'Failed to generate personalized content'
                });
            }
        });

        // Personalized offers
        this.app.get('/api/personalization/offers/:playerId', async (req, res) => {
            try {
                const { playerId } = req.params;
                const { count = 5 } = req.query;
                
                const offers = await this.industryLeaderEngine.aiPersonalizationEngine.generatePersonalizedOffers(
                    playerId, 
                    parseInt(count)
                );
                
                res.json({
                    success: true,
                    offers: offers
                });
            } catch (error) {
                this.logger.error('Failed to generate personalized offers', { 
                    error: error.message, 
                    playerId: req.params.playerId 
                });
                res.status(500).json({
                    success: false,
                    error: 'Failed to generate personalized offers'
                });
            }
        });

        // Social personalization
        this.app.get('/api/personalization/social/:playerId', async (req, res) => {
            try {
                const { playerId } = req.params;
                const social = await this.industryLeaderEngine.aiPersonalizationEngine.personalizeSocialFeatures(playerId);
                
                res.json({
                    success: true,
                    social: social
                });
            } catch (error) {
                this.logger.error('Failed to personalize social features', { 
                    error: error.message, 
                    playerId: req.params.playerId 
                });
                res.status(500).json({
                    success: false,
                    error: 'Failed to personalize social features'
                });
            }
        });

        // Content difficulty personalization
        this.app.post('/api/personalization/difficulty/:playerId', async (req, res) => {
            try {
                const { playerId } = req.params;
                const { levelId, currentPerformance } = req.body;
                
                const difficulty = await this.industryLeaderEngine.aiPersonalizationEngine.personalizeDifficulty(
                    playerId, 
                    levelId, 
                    currentPerformance
                );
                
                res.json({
                    success: true,
                    difficulty: difficulty
                });
            } catch (error) {
                this.logger.error('Failed to personalize difficulty', { 
                    error: error.message, 
                    playerId: req.params.playerId 
                });
                res.status(500).json({
                    success: false,
                    error: 'Failed to personalize difficulty'
                });
            }
        });

        // Content timing optimization
        this.app.post('/api/personalization/timing/:playerId', async (req, res) => {
            try {
                const { playerId } = req.params;
                const { contentType, contentData } = req.body;
                
                const timing = await this.industryLeaderEngine.aiPersonalizationEngine.optimizeContentTiming(
                    playerId, 
                    contentType, 
                    contentData
                );
                
                res.json({
                    success: true,
                    timing: timing
                });
            } catch (error) {
                this.logger.error('Failed to optimize content timing', { 
                    error: error.message, 
                    playerId: req.params.playerId 
                });
                res.status(500).json({
                    success: false,
                    error: 'Failed to optimize content timing'
                });
            }
        });

        // Market analysis
        this.app.get('/api/market/analysis', async (req, res) => {
            try {
                const analysis = await this.industryLeaderEngine.marketResearchEngine.performMarketAnalysis();
                res.json({
                    success: true,
                    analysis: analysis
                });
            } catch (error) {
                this.logger.error('Failed to perform market analysis', { error: error.message });
                res.status(500).json({
                    success: false,
                    error: 'Failed to perform market analysis'
                });
            }
        });

        // Content pipeline status
        this.app.get('/api/pipeline/status', (req, res) => {
            try {
                const status = {
                    isInitialized: this.industryLeaderEngine.infiniteContentPipeline.isInitialized,
                    contentQueue: this.industryLeaderEngine.infiniteContentPipeline.contentQueue.size,
                    playerContentNeeds: this.industryLeaderEngine.infiniteContentPipeline.playerContentNeeds.size,
                    contentPerformance: this.industryLeaderEngine.infiniteContentPipeline.contentPerformance.size
                };
                
                res.json({
                    success: true,
                    status: status
                });
            } catch (error) {
                this.logger.error('Failed to get pipeline status', { error: error.message });
                res.status(500).json({
                    success: false,
                    error: 'Failed to get pipeline status'
                });
            }
        });

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                error: 'Endpoint not found'
            });
        });
    }

    /**
     * Setup Socket.IO handlers
     */
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            this.logger.info('Client connected', { socketId: socket.id });

            // Handle real-time insights
            socket.on('subscribe_insights', () => {
                socket.join('insights');
                this.logger.info('Client subscribed to insights', { socketId: socket.id });
            });

            // Handle player-specific insights
            socket.on('subscribe_player_insights', (playerId) => {
                socket.join(`player_insights_${playerId}`);
                this.logger.info('Client subscribed to player insights', { socketId: socket.id, playerId });
            });

            // Handle content generation
            socket.on('request_content', async (data) => {
                try {
                    const { playerId, contentType, preferences } = data;
                    const content = await this.industryLeaderEngine.generateContentForPlayer(
                        playerId, 
                        contentType, 
                        preferences
                    );
                    
                    socket.emit('content_generated', {
                        success: true,
                        content: content
                    });
                } catch (error) {
                    this.logger.error('Failed to generate content via socket', { error: error.message });
                    socket.emit('content_generated', {
                        success: false,
                        error: error.message
                    });
                }
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                this.logger.info('Client disconnected', { socketId: socket.id });
            });
        });

        // Broadcast real-time insights every minute
        setInterval(async () => {
            try {
                const insights = await this.industryLeaderEngine.aiAnalyticsEngine.generateRealTimeInsights();
                this.io.to('insights').emit('insights_update', insights);
            } catch (error) {
                this.logger.error('Failed to broadcast insights', { error: error.message });
            }
        }, 60 * 1000);
    }

    /**
     * Setup error handling
     */
    setupErrorHandling() {
        // Global error handler
        this.app.use((error, req, res, next) => {
            this.logger.error('Unhandled error', { 
                error: error.message, 
                stack: error.stack,
                path: req.path,
                method: req.method
            });
            
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            this.logger.error('Uncaught exception', { error: error.message, stack: error.stack });
            process.exit(1);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            this.logger.error('Unhandled rejection', { reason: reason, promise: promise });
            process.exit(1);
        });
    }

    /**
     * Start the server
     */
    async start() {
        try {
            // Wait for engine initialization
            while (!this.industryLeaderEngine.isInitialized) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            this.server.listen(this.port, () => {
                this.logger.info(`Industry Leader Server started on port ${this.port}`);
                this.logger.info('Server is ready to handle requests');
                this.logger.info('Available endpoints:');
                this.logger.info('  GET  /health - Health check');
                this.logger.info('  GET  /api/engine/status - Engine status');
                this.logger.info('  GET  /api/analytics/comprehensive - Comprehensive analytics');
                this.logger.info('  GET  /api/analytics/player/:playerId - Player insights');
                this.logger.info('  POST /api/content/generate/:playerId - Generate content');
                this.logger.info('  POST /api/events/generate/:segmentName - Generate events');
                this.logger.info('  POST /api/assets/generate - Generate visual assets');
                this.logger.info('  GET  /api/market/trends - Market trends');
                this.logger.info('  GET  /api/market/competitors - Competitor analysis');
                this.logger.info('  POST /api/ai/recommendations - AI recommendations');
                this.logger.info('  GET  /api/insights/realtime - Real-time insights');
                this.logger.info('  GET  /api/predictions/churn/:playerId - Churn prediction');
                this.logger.info('  GET  /api/predictions/ltv/:playerId - LTV prediction');
                this.logger.info('  POST /api/optimization/engagement/:playerId - Engagement optimization');
                this.logger.info('  POST /api/optimization/monetization/:playerId - Monetization optimization');
                this.logger.info('  POST /api/personalization/content/:playerId - Personalized content');
                this.logger.info('  GET  /api/personalization/offers/:playerId - Personalized offers');
                this.logger.info('  GET  /api/personalization/social/:playerId - Social personalization');
                this.logger.info('  POST /api/personalization/difficulty/:playerId - Difficulty personalization');
                this.logger.info('  POST /api/personalization/timing/:playerId - Content timing optimization');
                this.logger.info('  GET  /api/market/analysis - Market analysis');
                this.logger.info('  GET  /api/pipeline/status - Content pipeline status');
            });

        } catch (error) {
            this.logger.error('Failed to start server', { error: error.message });
            throw error;
        }
    }

    /**
     * Stop the server
     */
    async stop() {
        try {
            this.server.close(() => {
                this.logger.info('Server stopped');
            });
        } catch (error) {
            this.logger.error('Failed to stop server', { error: error.message });
        }
    }
}

export { IndustryLeaderServer };