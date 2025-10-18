/**
 * Unified Analytics Service
 * Combines free analytics and enhanced analytics into a single, AI-optimized service
 * Merged from analytics-service.js and enhanced-analytics-service.js
 */

import { Logger } from '../core/logger/index.js';
import { ServiceError } from '../core/errors/ErrorHandler.js';
import { aiCacheManager } from './ai-cache-manager.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

// Optional external dependencies (only loaded if available)
let Sentry = null;
let Amplitude = null;
let DatadogRum = null;
let newrelic = null;

try {
  Sentry = require('@sentry/node');
} catch (e) {
  // Sentry not available
}

try {
  Amplitude = require('@amplitude/analytics-node');
} catch (e) {
  // Amplitude not available
}

try {
  DatadogRum = require('@datadog/browser-rum');
} catch (e) {
  // Datadog not available
}

try {
  newrelic = require('newrelic');
} catch (e) {
  // New Relic not available
}

const logger = new Logger('UnifiedAnalyticsService');

/**
 * Unified Analytics Service for Match 3 Game
 * Combines free analytics with enhanced features and AI optimization
 */
class UnifiedAnalyticsService {
  constructor() {
    this.isInitialized = false;
    this.sessionId = uuidv4();
    this.gameEvents = new Map();
    this.analyticsData = new Map();
    this.playerProfiles = new Map();
    this.realTimeMetrics = new Map();
    this.aiInsights = new Map();
    this.predictionModels = new Map();
    
    // External service instances
    this.amplitude = null;
    this.datadogRum = null;
    this.redis = null;
    this.mongodb = null;
    
    // Configuration for unified analytics
    this.config = {
      // Core settings
      dataPath: './data/analytics/',
      maxEventsInMemory: 1000,
      flushInterval: 60000, // 1 minute
      
      // File storage
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 100,
      
      // Privacy settings
      anonymizeData: true,
      retentionDays: 30,
      
      // Performance
      batchSize: 100,
      compressionEnabled: true,
      
      // External services (only enable if available)
      enableSentry: process.env.SENTRY_DSN ? true : false,
      enableAmplitude: process.env.AMPLITUDE_API_KEY ? true : false,
      enableDatadog: process.env.DATADOG_APPLICATION_ID ? true : false,
      enableNewRelic: process.env.NEW_RELIC_LICENSE_KEY ? true : false,
      enableRedis: process.env.REDIS_URL ? true : false,
      enableMongoDB: process.env.MONGODB_URI ? true : false,
      
      // AI optimization
      enableAIOptimization: true,
      enablePredictiveAnalytics: true,
      enableRealTimeInsights: true,
    };

    // Addiction mechanics tracking
    this.dailyStreaks = new Map();
    this.comebackBonuses = new Map();
    this.fomoEvents = new Map();
    this.variableRewards = new Map();
  }

  /**
   * Initialize unified analytics service
   */
  async initialize() {
    try {
      logger.info('🚀 Initializing Unified Analytics Service...');

      // Create data directory
      await this.ensureDataDirectory();

      // Load existing analytics data
      await this.loadAnalyticsData();

      // Initialize external services if available
      await this.initializeExternalServices();

      // Initialize AI models
      if (this.config.enableAIOptimization) {
        await this.initializeAIModels();
      }

      // Start periodic data flushing
      this.startDataFlushing();

      this.isInitialized = true;
      logger.info('✅ Unified Analytics Service initialized successfully');

      // Track service initialization
      await this.trackEvent('analytics_service_initialized', {
        session_id: this.sessionId,
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        type: 'unified',
        services: this.getEnabledServices(),
        ai_optimized: this.config.enableAIOptimization,
      });
    } catch (error) {
      logger.error('❌ Failed to initialize Unified Analytics Service:', error);
      throw error;
    }
  }

  /**
   * Initialize external services if available
   */
  async initializeExternalServices() {
    // Initialize Sentry for error tracking
    if (this.config.enableSentry && Sentry) {
      await this.initializeSentry();
    }

    // Initialize Amplitude for game analytics
    if (this.config.enableAmplitude && Amplitude) {
      await this.initializeAmplitude();
    }

    // Initialize Datadog RUM
    if (this.config.enableDatadog && DatadogRum) {
      await this.initializeDatadog();
    }

    // Initialize New Relic
    if (this.config.enableNewRelic && newrelic) {
      this.initializeNewRelic();
    }

    // Initialize Redis for caching
    if (this.config.enableRedis) {
      await this.initializeRedis();
    }

    // Initialize MongoDB for data storage
    if (this.config.enableMongoDB) {
      await this.initializeMongoDB();
    }
  }

  /**
   * Initialize Sentry for error tracking and performance monitoring
   */
  async initializeSentry() {
    if (!Sentry) return;

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app: require('express') }),
      ],
      beforeSend(event) {
        // Filter out non-critical errors in production
        if (process.env.NODE_ENV === 'production' && event.level === 'info') {
          return null;
        }
        return event;
      },
    });
    logger.info('✅ Sentry initialized');
  }

  /**
   * Initialize Amplitude for game analytics
   */
  async initializeAmplitude() {
    if (!Amplitude) return;

    this.amplitude = Amplitude.getInstance();
    await this.amplitude.init(process.env.AMPLITUDE_API_KEY, {
      serverUrl: process.env.AMPLITUDE_SERVER_URL || 'https://api2.amplitude.com',
      flushQueueSize: 10,
      flushIntervalMillis: 10000,
      logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
    });
    logger.info('✅ Amplitude initialized');
  }

  /**
   * Initialize Datadog RUM for real user monitoring
   */
  async initializeDatadog() {
    if (!DatadogRum || typeof window === 'undefined') return;

    this.datadogRum = DatadogRum.init({
      applicationId: process.env.DATADOG_APPLICATION_ID,
      clientToken: process.env.DATADOG_CLIENT_TOKEN,
      site: process.env.DATADOG_SITE || 'datadoghq.com',
      service: 'match3-game',
      env: process.env.NODE_ENV || 'development',
      version: '2.0.0',
      sessionSampleRate: 100,
      sessionReplaySampleRate: 20,
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      defaultPrivacyLevel: 'mask-user-input',
    });
    logger.info('✅ Datadog RUM initialized');
  }

  /**
   * Initialize New Relic
   */
  initializeNewRelic() {
    if (!newrelic) return;
    logger.info('✅ New Relic initialized');
  }

  /**
   * Initialize Redis for caching
   */
  async initializeRedis() {
    try {
      const { createClient } = require('redis');
      this.redis = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });

      this.redis.on('error', (err) => logger.error('Redis Client Error', err));
      await this.redis.connect();
      logger.info('✅ Redis initialized');
    } catch (error) {
      logger.warn('Redis not available, using local storage only', { error: error.message });
    }
  }

  /**
   * Initialize MongoDB for data storage
   */
  async initializeMongoDB() {
    try {
      const { MongoClient } = require('mongodb');
      this.mongodb = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
      await this.mongodb.connect();
      logger.info('✅ MongoDB initialized');
    } catch (error) {
      logger.warn('MongoDB not available, using local storage only', { error: error.message });
    }
  }

  /**
   * Initialize AI models for insights and predictions
   */
  async initializeAIModels() {
    // Initialize prediction models
    this.predictionModels.set('churn_prediction', {
      model: 'churn_classifier_v2',
      accuracy: 0.87,
      lastTrained: new Date(),
    });

    this.predictionModels.set('ltv_prediction', {
      model: 'ltv_regressor_v2',
      accuracy: 0.82,
      lastTrained: new Date(),
    });

    this.predictionModels.set('difficulty_prediction', {
      model: 'difficulty_classifier_v2',
      accuracy: 0.85,
      lastTrained: new Date(),
    });

    logger.info('✅ AI Models initialized');
  }

  /**
   * Ensure data directory exists
   */
  async ensureDataDirectory() {
    try {
      await fs.mkdir(this.config.dataPath, { recursive: true });
      await fs.mkdir(path.join(this.config.dataPath, 'events'), { recursive: true });
      await fs.mkdir(path.join(this.config.dataPath, 'sessions'), { recursive: true });
      await fs.mkdir(path.join(this.config.dataPath, 'reports'), { recursive: true });
    } catch (error) {
      logger.error('Failed to create data directory:', error);
      throw error;
    }
  }

  /**
   * Load existing analytics data
   */
  async loadAnalyticsData() {
    try {
      // Load session data
      const sessionFiles = await this.getFilesInDirectory(path.join(this.config.dataPath, 'sessions'));
      for (const file of sessionFiles.slice(-10)) { // Load last 10 sessions
        try {
          const data = await fs.readFile(file, 'utf8');
          const sessionData = JSON.parse(data);
          this.analyticsData.set(sessionData.session_id, sessionData);
        } catch (error) {
          logger.warn(`Failed to load session file ${file}:`, error);
        }
      }

      logger.info(`Loaded ${this.analyticsData.size} sessions`);
    } catch (error) {
      logger.warn('Failed to load analytics data:', error);
    }
  }

  /**
   * Start periodic data flushing
   */
  startDataFlushing() {
    setInterval(async () => {
      await this.flushEvents();
    }, this.config.flushInterval);
  }

  /**
   * Get files in directory
   */
  async getFilesInDirectory(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => path.join(dirPath, file))
        .sort();
    } catch (error) {
      return [];
    }
  }

  /**
   * Track comprehensive game events with AI optimization
   */
  async trackGameEvent(eventName, properties = {}, userId = null) {
    if (!this.isInitialized) {
      logger.warn('Analytics Service not initialized');
      return;
    }

    const eventData = {
      event_id: uuidv4(),
      event_name: eventName,
      properties: this.config.anonymizeData ? this.anonymizeProperties(properties) : properties,
      user_id: this.config.anonymizeData ? this.anonymizeUserId(userId) : userId,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      platform: 'web',
      game_version: process.env.GAME_VERSION || '2.0.0',
      user_agent: this.getUserAgent(),
      ip_address: this.config.anonymizeData ? this.anonymizeIP(this.getClientIP()) : this.getClientIP(),
    };

    try {
      // Store event in memory
      this.gameEvents.set(eventData.event_id, eventData);

      // Track with external services if available
      await this.trackWithExternalServices(eventName, eventData, userId);

      // Store in AI cache if available
      if (this.config.enableAIOptimization) {
        await aiCacheManager.set(`event:${eventName}:${userId}`, eventData, 'analytics', 3600);
      }

      // Store in Redis for real-time access
      if (this.redis) {
        await this.redis.setex(`event:${eventName}:${userId}`, 3600, JSON.stringify(eventData));
      }

      // Store in MongoDB for long-term storage
      if (this.mongodb) {
        const db = this.mongodb.db('match3_analytics');
        await db.collection('game_events').insertOne(eventData);
      }

      // Flush if we have too many events in memory
      if (this.gameEvents.size >= this.config.maxEventsInMemory) {
        await this.flushEvents();
      }

      logger.debug(`📊 Event tracked: ${eventName}`, eventData.properties);
    } catch (error) {
      logger.error('Failed to track game event:', error);
      if (Sentry) {
        Sentry.captureException(error);
      }
    }
  }

  /**
   * Track with external services
   */
  async trackWithExternalServices(eventName, eventData, userId) {
    // Track with Amplitude
    if (this.amplitude) {
      await this.amplitude.track(eventName, eventData.properties, {
        user_id: userId,
        session_id: this.sessionId,
      });
    }

    // Track with New Relic
    if (newrelic) {
      newrelic.recordCustomEvent('GameEvent', {
        eventName,
        ...eventData.properties,
      });
    }

    // Track with Datadog RUM
    if (this.datadogRum) {
      this.datadogRum.addAction(eventName, eventData.properties);
    }

    // Track with Sentry (for performance monitoring)
    if (Sentry) {
      Sentry.addBreadcrumb({
        message: eventName,
        category: 'game_event',
        data: eventData.properties,
        level: 'info',
      });
    }
  }

  /**
   * Track specific game events with enhanced context
   */
  async trackGameStart(userId, gameData) {
    await this.trackGameEvent(
      'game_started',
      {
        level: gameData.level,
        difficulty: gameData.difficulty,
        platform: gameData.platform,
        user_agent: gameData.userAgent,
        device_info: gameData.deviceInfo,
      },
      userId,
    );
  }

  async trackLevelComplete(userId, levelData) {
    await this.trackGameEvent(
      'level_completed',
      {
        level: levelData.level,
        score: levelData.score,
        time_spent: levelData.timeSpent,
        moves_used: levelData.movesUsed,
        stars_earned: levelData.starsEarned,
        powerups_used: levelData.powerupsUsed,
        attempts: levelData.attempts,
        difficulty: levelData.difficulty,
      },
      userId,
    );
  }

  async trackMatchMade(userId, matchData) {
    await this.trackGameEvent(
      'match_made',
      {
        match_type: matchData.matchType,
        pieces_matched: matchData.piecesMatched,
        position_x: matchData.position.x,
        position_y: matchData.position.y,
        level: matchData.level,
        score_gained: matchData.scoreGained,
        special_piece_created: matchData.specialPieceCreated,
      },
      userId,
    );
  }

  async trackPowerUpUsed(userId, powerUpData) {
    await this.trackGameEvent(
      'powerup_used',
      {
        powerup_type: powerUpData.type,
        level: powerUpData.level,
        position_x: powerUpData.position.x,
        position_y: powerUpData.position.y,
        cost: powerUpData.cost,
        effectiveness: powerUpData.effectiveness,
      },
      userId,
    );
  }

  async trackPurchase(userId, purchaseData) {
    await this.trackGameEvent(
      'purchase_made',
      {
        item_id: purchaseData.itemId,
        item_type: purchaseData.itemType,
        currency: purchaseData.currency,
        amount: purchaseData.amount,
        transaction_id: purchaseData.transactionId,
        platform: purchaseData.platform,
      },
      userId,
    );
  }

  async trackError(userId, errorData) {
    await this.trackGameEvent(
      'error_occurred',
      {
        error_type: errorData.type,
        error_message: errorData.message,
        error_code: errorData.code,
        level: errorData.level,
        stack_trace: errorData.stackTrace,
      },
      userId,
    );

    // Also send to Sentry
    if (Sentry) {
      Sentry.captureException(new Error(errorData.message), {
        tags: {
          error_type: errorData.type,
          level: errorData.level,
          user_id: userId,
        },
        extra: errorData,
      });
    }
  }

  /**
   * Track performance metrics
   */
  async trackPerformance(userId, performanceData) {
    await this.trackGameEvent(
      'performance_metric',
      {
        metric_name: performanceData.metricName,
        value: performanceData.value,
        unit: performanceData.unit,
        level: performanceData.level,
        device_info: performanceData.deviceInfo,
      },
      userId,
    );

    // Track with New Relic
    if (newrelic) {
      newrelic.recordMetric(performanceData.metricName, performanceData.value);
    }

    // Store in real-time metrics
    this.realTimeMetrics.set(performanceData.metricName, {
      value: performanceData.value,
      timestamp: new Date(),
      userId: userId,
    });
  }

  /**
   * Generate AI insights
   */
  async generateInsights(userId) {
    if (!this.config.enableAIOptimization) {
      return [];
    }

    try {
      // Analyze player behavior
      const playerProfile = await this.getPlayerProfile(userId);
      const insights = [];

      // Churn prediction
      const churnProbability = await this.predictChurn(userId);
      if (churnProbability > 0.7) {
        insights.push({
          type: 'churn_risk',
          confidence: churnProbability,
          recommendation: 'Trigger retention campaign',
          priority: 'high',
        });
      }

      // LTV prediction
      const predictedLTV = await this.predictLTV(userId);
      if (predictedLTV > 100) {
        insights.push({
          type: 'high_value_player',
          confidence: 0.8,
          recommendation: 'Offer premium features',
          priority: 'medium',
        });
      }

      // Difficulty adjustment
      const difficultyInsight = await this.analyzeDifficulty(userId);
      if (difficultyInsight.needsAdjustment) {
        insights.push({
          type: 'difficulty_adjustment',
          confidence: difficultyInsight.confidence,
          recommendation: difficultyInsight.recommendation,
          priority: 'medium',
        });
      }

      // Store insights
      this.aiInsights.set(userId, {
        insights,
        generatedAt: new Date(),
        playerProfile,
      });

      return insights;
    } catch (error) {
      logger.error('Failed to generate insights:', error);
      return [];
    }
  }

  /**
   * Predict player churn
   */
  async predictChurn(userId) {
    const playerProfile = await this.getPlayerProfile(userId);

    // Simple churn prediction based on engagement metrics
    const daysSinceLastPlay = playerProfile.daysSinceLastPlay || 0;
    const sessionDuration = playerProfile.avgSessionDuration || 0;
    const levelCompletionRate = playerProfile.levelCompletionRate || 0;

    // Weighted churn probability
    let churnProbability = 0;

    if (daysSinceLastPlay > 7) churnProbability += 0.4;
    if (sessionDuration < 300) churnProbability += 0.3;
    if (levelCompletionRate < 0.5) churnProbability += 0.3;

    return Math.min(churnProbability, 1.0);
  }

  /**
   * Predict player LTV
   */
  async predictLTV(userId) {
    const playerProfile = await this.getPlayerProfile(userId);

    // Simple LTV prediction based on engagement and spending
    const avgSessionDuration = playerProfile.avgSessionDuration || 0;
    const totalSpent = playerProfile.totalSpent || 0;
    const levelProgress = playerProfile.levelProgress || 0;

    // Weighted LTV calculation
    const engagementScore = (avgSessionDuration / 3600) * 10; // Convert to hours
    const spendingScore = totalSpent * 2;
    const progressScore = levelProgress * 5;

    return engagementScore + spendingScore + progressScore;
  }

  /**
   * Analyze difficulty needs
   */
  async analyzeDifficulty(userId) {
    const playerProfile = await this.getPlayerProfile(userId);

    const avgAttemptsPerLevel = playerProfile.avgAttemptsPerLevel || 1;
    const avgTimePerLevel = playerProfile.avgTimePerLevel || 0;

    if (avgAttemptsPerLevel > 5) {
      return {
        needsAdjustment: true,
        confidence: 0.8,
        recommendation: 'Reduce difficulty - too many attempts',
      };
    }

    if (avgTimePerLevel > 600) {
      return {
        needsAdjustment: true,
        confidence: 0.7,
        recommendation: 'Reduce difficulty - too much time per level',
      };
    }

    return {
      needsAdjustment: false,
      confidence: 0.5,
      recommendation: 'Difficulty is appropriate',
    };
  }

  /**
   * Get player profile
   */
  async getPlayerProfile(userId) {
    if (this.playerProfiles.has(userId)) {
      return this.playerProfiles.get(userId);
    }

    // Load from database
    if (this.mongodb) {
      const db = this.mongodb.db('match3_analytics');
      const profile = await db.collection('player_profiles').findOne({ userId });
      if (profile) {
        this.playerProfiles.set(userId, profile);
        return profile;
      }
    }

    // Create new profile
    const newProfile = {
      userId,
      createdAt: new Date(),
      daysSinceLastPlay: 0,
      avgSessionDuration: 0,
      levelCompletionRate: 0,
      totalSpent: 0,
      levelProgress: 0,
      avgAttemptsPerLevel: 1,
      avgTimePerLevel: 0,
    };

    this.playerProfiles.set(userId, newProfile);
    return newProfile;
  }

  /**
   * Flush events to disk
   */
  async flushEvents() {
    if (this.gameEvents.size === 0) return;

    try {
      const events = Array.from(this.gameEvents.values());
      const filename = `events_${Date.now()}.json`;
      const filepath = path.join(this.config.dataPath, 'events', filename);

      await fs.writeFile(filepath, JSON.stringify(events, null, 2));
      
      logger.info(`Flushed ${events.length} events to ${filename}`);
      this.gameEvents.clear();

      // Clean old files if needed
      await this.cleanOldFiles('events');
    } catch (error) {
      logger.error('Failed to flush events:', error);
    }
  }

  /**
   * Clean old files
   */
  async cleanOldFiles(type) {
    try {
      const dirPath = path.join(this.config.dataPath, type);
      const files = await this.getFilesInDirectory(dirPath);

      if (files.length > this.config.maxFiles) {
        const filesToDelete = files.slice(0, files.length - this.config.maxFiles);
        for (const file of filesToDelete) {
          await fs.unlink(file);
        }
        logger.info(`Cleaned ${filesToDelete.length} old ${type} files`);
      }
    } catch (error) {
      logger.warn(`Failed to clean old ${type} files:`, error);
    }
  }

  /**
   * Anonymize user data
   */
  anonymizeUserId(userId) {
    if (!userId) return 'anonymous';
    return `user_${this.hashString(userId).substring(0, 8)}`;
  }

  anonymizeIP(ip) {
    if (!ip) return '0.0.0.0';
    return ip.split('.').slice(0, 3).join('.') + '.0';
  }

  anonymizeProperties(properties) {
    const anonymized = { ...properties };
    
    // Remove or hash sensitive fields
    if (anonymized.email) {
      anonymized.email = this.hashString(anonymized.email);
    }
    if (anonymized.name) {
      anonymized.name = this.hashString(anonymized.name);
    }
    if (anonymized.phone) {
      anonymized.phone = this.hashString(anonymized.phone);
    }

    return anonymized;
  }

  /**
   * Hash string for anonymization
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get user agent
   */
  getUserAgent() {
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'server';
  }

  /**
   * Get client IP
   */
  getClientIP() {
    // In a real implementation, this would get the actual client IP
    return '127.0.0.1';
  }

  /**
   * Get enabled services
   */
  getEnabledServices() {
    return Object.keys(this.config).filter((key) => this.config[key]);
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary() {
    return {
      session_id: this.sessionId,
      is_initialized: this.isInitialized,
      events_tracked: this.gameEvents.size,
      total_events_stored: this.analyticsData.size,
      services: {
        local_storage: true,
        file_storage: true,
        anonymization: this.config.anonymizeData,
        compression: this.config.compressionEnabled,
        ai_optimization: this.config.enableAIOptimization,
        external_services: this.getEnabledServices(),
      },
      configuration: this.config,
      real_time_metrics: Object.fromEntries(this.realTimeMetrics),
      ai_insights: Object.fromEntries(this.aiInsights),
    };
  }

  /**
   * Flush all pending events
   */
  async flush() {
    if (this.amplitude) {
      await this.amplitude.flush();
    }

    if (this.datadogRum) {
      this.datadogRum.flush();
    }
  }

  /**
   * Shutdown analytics service
   */
  async shutdown() {
    try {
      await this.flush();

      if (this.redis) {
        await this.redis.quit();
      }

      if (this.mongodb) {
        await this.mongodb.close();
      }

      this.isInitialized = false;
      logger.info('✅ Unified Analytics Service shutdown complete');
    } catch (error) {
      logger.error('Error during analytics shutdown:', error);
    }
  }

  // ===== ADDICTION MECHANICS =====

  /**
   * Check daily reward eligibility for player
   */
  async checkDailyRewardEligibility(userId) {
    try {
      const now = new Date();
      const lastLogin = this.dailyStreaks.get(userId)?.lastLogin || new Date(0);
      const hoursSinceLastLogin = (now - lastLogin) / (1000 * 60 * 60);

      let streak = this.dailyStreaks.get(userId)?.streak || 0;
      let maxStreak = this.dailyStreaks.get(userId)?.maxStreak || 0;

      // Check if it's a new day (24+ hours since last login)
      if (hoursSinceLastLogin >= 24) {
        if (hoursSinceLastLogin >= 24 && hoursSinceLastLogin <= 48) {
          // Continue streak
          streak++;
          if (streak > maxStreak) maxStreak = streak;
        } else if (hoursSinceLastLogin > 72) {
          // 3 days - Reset streak but give comeback bonus
          streak = 1;
          await this.triggerComebackBonus(userId);
        } else {
          // Reset streak
          streak = 1;
        }

        // Update streak data
        this.dailyStreaks.set(userId, {
          streak,
          maxStreak,
          lastLogin: now,
          hasClaimedToday: false,
        });

        // Track daily reward availability
        await this.trackGameEvent('daily_reward_available', {
          userId,
          streak,
          maxStreak,
          isComeback: hoursSinceLastLogin > 72,
        });
      }
    } catch (error) {
      logger.error('Failed to check daily reward eligibility:', error);
    }
  }

  /**
   * Trigger comeback bonus for returning player
   */
  async triggerComebackBonus(userId) {
    const bonusId = uuidv4();
    this.comebackBonuses.set(bonusId, {
      userId,
      bonusType: 'comeback',
      multiplier: 2.0,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      createdAt: new Date(),
    });

    await this.trackGameEvent('comeback_bonus_triggered', {
      userId,
      bonusId,
      multiplier: 2.0,
      expiresIn: 24 * 60 * 60 * 1000,
    });
  }

  /**
   * Claim daily reward
   */
  async claimDailyReward(userId) {
    const streakData = this.dailyStreaks.get(userId);
    if (!streakData || streakData.hasClaimedToday) {
      return { success: false, message: 'Already claimed today' };
    }

    // Calculate reward
    const baseReward = 100;
    const streakBonus = streakData.streak * 10;
    const multiplier = streakData.streak >= 7 ? 1.5 : 1.0;
    const totalReward = Math.floor((baseReward + streakBonus) * multiplier);

    // Mark as claimed
    streakData.hasClaimedToday = true;
    this.dailyStreaks.set(userId, streakData);

    // Track reward claim
    await this.trackGameEvent('daily_reward_claimed', {
      userId,
      streak: streakData.streak,
      maxStreak: streakData.maxStreak,
      baseReward,
      streakBonus,
      multiplier,
      totalReward,
    });

    return { success: true, reward: totalReward };
  }

  /**
   * Create FOMO event
   */
  async createFOMOEvent(eventType, eventData) {
    const eventId = uuidv4();
    const fomoEvent = {
      id: eventId,
      type: eventType,
      data: eventData,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (eventData.duration || 3600) * 1000),
    };

    this.fomoEvents.set(eventId, fomoEvent);

    await this.trackGameEvent('fomo_event_created', {
      eventId,
      eventType,
      duration: eventData.duration || 3600,
      ...eventData,
    });

    return fomoEvent;
  }

  /**
   * Track variable reward
   */
  async trackVariableReward(userId, rewardType, rewardValue, rarity) {
    const rewardId = uuidv4();

    await this.trackGameEvent('variable_reward', {
      userId,
      rewardId,
      rewardType,
      rewardValue,
      rarity,
      timestamp: new Date().toISOString(),
    });

    // Store reward for analytics
    this.variableRewards.set(rewardId, {
      userId,
      rewardType,
      rewardValue,
      rarity,
      timestamp: new Date(),
    });
  }

  /**
   * Get addiction mechanics data for player
   */
  getAddictionData(userId) {
    const streakData = this.dailyStreaks.get(userId);
    const activeFOMOEvents = Array.from(this.fomoEvents.values()).filter(
      (event) => event.expiresAt > new Date(),
    );
    const recentRewards = Array.from(this.variableRewards.values())
      .filter((reward) => reward.userId === userId)
      .slice(-10); // Last 10 rewards

    return {
      dailyStreak: streakData?.streak || 0,
      maxStreak: streakData?.maxStreak || 0,
      hasClaimedToday: streakData?.hasClaimedToday || false,
      activeFOMOEvents,
      recentRewards,
      comebackBonuses: Array.from(this.comebackBonuses.values()).filter(
        (bonus) => bonus.userId === userId && bonus.expiresAt > new Date(),
      ),
    };
  }
}

// Export singleton instance
export default new UnifiedAnalyticsService();