import { Logger } from '../core/logger/index.js';
import { ServiceError } from '../core/errors/ErrorHandler.js';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { LRUCache } from 'lru-cache';

/**
 * AI Personalization Engine - Advanced player personalization using ML and AI
 * Creates unique experiences for every player using behavioral analysis and predictive modeling
 * 
 * OPTIMIZATIONS:
 * - Redis caching for player profiles and predictions
 * - Real-time personalization updates
 * - Machine learning model optimization
 * - Performance monitoring and analytics
 * - Intelligent recommendation algorithms
 * - Memory optimization and garbage collection
 */
class AIPersonalizationEngine {
  constructor() {
    this.logger = new Logger('AIPersonalizationEngine');

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    // Redis for caching player profiles and predictions
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    // In-memory LRU cache for frequently accessed profiles
    this.profileCache = new LRUCache({
      max: 5000,
      ttl: 1000 * 60 * 15, // 15 minutes
    });

    // Prediction cache for ML model results
    this.predictionCache = new LRUCache({
      max: 10000,
      ttl: 1000 * 60 * 5, // 5 minutes
    });

    // Real-time personalization updates
    this.realTimeUpdates = new Map();
    this.updateQueue = [];
    this.isProcessingUpdates = false;

    // Performance monitoring
    this.performanceMetrics = {
      totalPersonalizations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averagePersonalizationTime: 0,
      predictionAccuracy: 0,
      lastReset: Date.now(),
    };

    // Machine learning models
    this.mlModels = new Map();
    this.modelTrainingQueue = [];
    this.isTrainingModels = false;

    this.playerProfiles = new Map();
    this.behaviorModels = new Map();
    this.personalizationRules = new Map();
    this.predictionModels = new Map();

    this.initializePersonalizationModels();
    this.startRealTimeProcessor();
    this.startModelTraining();
    this.startPerformanceMonitor();
  }

  /**
   * Create comprehensive player profile using AI
   */
  async createPlayerProfile(playerId, initialData) {
    try {
      const profile = await this.analyzePlayerBehavior(playerId, initialData);
      const preferences = await this.predictPlayerPreferences(profile);
      const engagementPatterns = await this.analyzeEngagementPatterns(profile);
      const monetizationProfile = await this.predictMonetizationBehavior(profile);

      const aiProfile = {
        id: playerId,
        basicInfo: profile,
        preferences: preferences,
        engagementPatterns: engagementPatterns,
        monetizationProfile: monetizationProfile,
        personalizationScore: this.calculatePersonalizationScore(profile),
        lastUpdated: new Date().toISOString(),
        aiGenerated: true,
      };

      await this.storePlayerProfile(aiProfile);
      this.playerProfiles.set(playerId, aiProfile);

      this.logger.info(`Created AI player profile for ${playerId}`);
      return aiProfile;
    } catch (error) {
      this.logger.error('Failed to create player profile', { error: error.message });
      throw new ServiceError('AI_PROFILE_CREATION_FAILED', 'Failed to create player profile');
    }
  }

  /**
   * Analyze player behavior using AI
   */
  async analyzePlayerBehavior(playerId, data) {
    try {
      const prompt = this.buildBehaviorAnalysisPrompt(data);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert game analyst specializing in player behavior analysis. Analyze the provided player data and return detailed behavioral insights in JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      const behaviorAnalysis = JSON.parse(response.choices[0].message.content);

      return {
        playStyle: behaviorAnalysis.playStyle,
        skillLevel: behaviorAnalysis.skillLevel,
        engagementLevel: behaviorAnalysis.engagementLevel,
        preferredGameModes: behaviorAnalysis.preferredGameModes,
        sessionPatterns: behaviorAnalysis.sessionPatterns,
        spendingBehavior: behaviorAnalysis.spendingBehavior,
        socialBehavior: behaviorAnalysis.socialBehavior,
        retentionRisk: behaviorAnalysis.retentionRisk,
        churnProbability: behaviorAnalysis.churnProbability,
      };
    } catch (error) {
      this.logger.error('Failed to analyze player behavior', { error: error.message });
      return this.getDefaultBehaviorProfile();
    }
  }

  /**
   * Predict player preferences using AI
   */
  async predictPlayerPreferences(behaviorProfile) {
    try {
      const prompt = this.buildPreferencePredictionPrompt(behaviorProfile);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert in game design and player psychology. Predict player preferences based on behavioral data and return detailed preference analysis in JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 1000,
      });

      const preferences = JSON.parse(response.choices[0].message.content);

      return {
        visualStyle: preferences.visualStyle,
        difficultyPreference: preferences.difficultyPreference,
        contentTypes: preferences.contentTypes,
        socialFeatures: preferences.socialFeatures,
        monetizationAcceptance: preferences.monetizationAcceptance,
        notificationPreferences: preferences.notificationPreferences,
        timePreferences: preferences.timePreferences,
        devicePreferences: preferences.devicePreferences,
      };
    } catch (error) {
      this.logger.error('Failed to predict player preferences', { error: error.message });
      return this.getDefaultPreferences();
    }
  }

  /**
   * Analyze engagement patterns
   */
  async analyzeEngagementPatterns(behaviorProfile) {
    try {
      const patterns = {
        peakPlayTimes: this.calculatePeakPlayTimes(behaviorProfile),
        sessionLength: this.calculateOptimalSessionLength(behaviorProfile),
        engagementTriggers: this.identifyEngagementTriggers(behaviorProfile),
        retentionFactors: this.identifyRetentionFactors(behaviorProfile),
        churnSignals: this.identifyChurnSignals(behaviorProfile),
        reEngagementOpportunities: this.identifyReEngagementOpportunities(behaviorProfile),
      };

      return patterns;
    } catch (error) {
      this.logger.error('Failed to analyze engagement patterns', { error: error.message });
      return this.getDefaultEngagementPatterns();
    }
  }

  /**
   * Predict monetization behavior
   */
  async predictMonetizationBehavior(behaviorProfile) {
    try {
      const prompt = this.buildMonetizationPredictionPrompt(behaviorProfile);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert in mobile game monetization. Analyze player behavior to predict monetization potential and preferences. Return detailed monetization analysis in JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 800,
      });

      const monetizationProfile = JSON.parse(response.choices[0].message.content);

      return {
        spendingProbability: monetizationProfile.spendingProbability,
        preferredPricePoints: monetizationProfile.preferredPricePoints,
        offerReceptiveness: monetizationProfile.offerReceptiveness,
        subscriptionLikelihood: monetizationProfile.subscriptionLikelihood,
        adTolerance: monetizationProfile.adTolerance,
        purchaseTriggers: monetizationProfile.purchaseTriggers,
        ltvPrediction: monetizationProfile.ltvPrediction,
        arpuPrediction: monetizationProfile.arpuPrediction,
      };
    } catch (error) {
      this.logger.error('Failed to predict monetization behavior', { error: error.message });
      return this.getDefaultMonetizationProfile();
    }
  }

  /**
   * Generate personalized content recommendations
   */
  async generatePersonalizedRecommendations(playerId, contentType) {
    try {
      const profile = await this.getPlayerProfile(playerId);
      if (!profile) {
        throw new Error('Player profile not found');
      }

      const prompt = this.buildRecommendationPrompt(profile, contentType);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert game curator. Generate personalized content recommendations based on player profile and preferences. Return detailed recommendations in JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 1200,
      });

      const recommendations = JSON.parse(response.choices[0].message.content);

      // Store recommendations for tracking
      await this.storeRecommendations(playerId, contentType, recommendations);

      this.logger.info(`Generated personalized recommendations for ${playerId}`);
      return recommendations;
    } catch (error) {
      this.logger.error('Failed to generate personalized recommendations', {
        error: error.message,
      });
      throw new ServiceError('AI_RECOMMENDATION_FAILED', 'Failed to generate recommendations');
    }
  }

  /**
   * Optimize game difficulty in real-time
   */
  async optimizeDifficulty(playerId, currentLevel, performance) {
    try {
      const profile = await this.getPlayerProfile(playerId);
      const difficultyAdjustment = await this.calculateDifficultyAdjustment(
        profile,
        currentLevel,
        performance,
      );

      const optimizedDifficulty = {
        levelId: currentLevel.id,
        playerId: playerId,
        originalDifficulty: currentLevel.difficulty,
        adjustedDifficulty: currentLevel.difficulty + difficultyAdjustment,
        adjustmentReason: this.getDifficultyAdjustmentReason(profile, performance),
        confidence: this.calculateAdjustmentConfidence(profile, performance),
        timestamp: new Date().toISOString(),
      };

      await this.storeDifficultyOptimization(optimizedDifficulty);

      this.logger.info(`Optimized difficulty for player ${playerId}`, {
        adjustment: difficultyAdjustment,
      });
      return optimizedDifficulty;
    } catch (error) {
      this.logger.error('Failed to optimize difficulty', { error: error.message });
      return null;
    }
  }

  /**
   * Predict player churn risk
   */
  async predictChurnRisk(playerId) {
    try {
      const profile = await this.getPlayerProfile(playerId);
      const recentActivity = await this.getRecentActivity(playerId);

      const churnFactors = this.analyzeChurnFactors(profile, recentActivity);
      const churnProbability = this.calculateChurnProbability(churnFactors);
      const churnPreventionActions = this.generateChurnPreventionActions(churnFactors);

      const churnPrediction = {
        playerId: playerId,
        churnProbability: churnProbability,
        riskLevel: this.getRiskLevel(churnProbability),
        factors: churnFactors,
        preventionActions: churnPreventionActions,
        predictedChurnDate: this.predictChurnDate(churnProbability, recentActivity),
        timestamp: new Date().toISOString(),
      };

      await this.storeChurnPrediction(churnPrediction);

      this.logger.info(`Predicted churn risk for player ${playerId}`, {
        probability: churnProbability,
      });
      return churnPrediction;
    } catch (error) {
      this.logger.error('Failed to predict churn risk', { error: error.message });
      return null;
    }
  }

  /**
   * Generate personalized offers
   */
  async generatePersonalizedOffers(playerId, offerType) {
    try {
      const profile = await this.getPlayerProfile(playerId);
      const marketTrends = await this.getMarketTrends();

      const prompt = this.buildOfferGenerationPrompt(profile, offerType, marketTrends);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert in mobile game monetization and offer optimization. Generate personalized offers that maximize conversion while providing value to the player. Return detailed offer recommendations in JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 1000,
      });

      const offers = JSON.parse(response.choices[0].message.content);

      // Enhance offers with AI predictions
      const enhancedOffers = await this.enhanceOffersWithPredictions(offers, profile);

      await this.storePersonalizedOffers(playerId, enhancedOffers);

      this.logger.info(`Generated personalized offers for ${playerId}`);
      return enhancedOffers;
    } catch (error) {
      this.logger.error('Failed to generate personalized offers', { error: error.message });
      throw new ServiceError('AI_OFFER_GENERATION_FAILED', 'Failed to generate offers');
    }
  }

  /**
   * Build behavior analysis prompt
   */
  buildBehaviorAnalysisPrompt(data) {
    return `
Analyze this player behavior data and provide insights:
- Session Data: ${JSON.stringify(data.sessions || [])}
- Purchase History: ${JSON.stringify(data.purchases || [])}
- Game Progress: ${JSON.stringify(data.progress || {})}
- Social Activity: ${JSON.stringify(data.social || {})}
- Device Info: ${JSON.stringify(data.device || {})}

Return JSON with:
{
  "playStyle": "casual|hardcore|social|competitive",
  "skillLevel": 1-10,
  "engagementLevel": "low|medium|high",
  "preferredGameModes": ["mode1", "mode2"],
  "sessionPatterns": {
    "averageLength": 0,
    "frequency": "daily|weekly|monthly",
    "peakTimes": ["time1", "time2"]
  },
  "spendingBehavior": {
    "totalSpent": 0,
    "frequency": "low|medium|high",
    "preferredItems": ["item1", "item2"]
  },
  "socialBehavior": {
    "friendCount": 0,
    "socialActivity": "low|medium|high",
    "preferredSocialFeatures": ["feature1", "feature2"]
  },
  "retentionRisk": "low|medium|high",
  "churnProbability": 0.0-1.0
}`;
  }

  /**
   * Build preference prediction prompt
   */
  buildPreferencePredictionPrompt(behaviorProfile) {
    return `
Based on this player behavior profile, predict their preferences:
${JSON.stringify(behaviorProfile, null, 2)}

Return JSON with:
{
  "visualStyle": "cartoon|realistic|abstract|minimalist",
  "difficultyPreference": "easy|medium|hard|adaptive",
  "contentTypes": ["puzzle", "adventure", "social"],
  "socialFeatures": ["leaderboards", "friends", "guilds"],
  "monetizationAcceptance": "low|medium|high",
  "notificationPreferences": {
    "frequency": "low|medium|high",
    "types": ["achievements", "offers", "social"]
  },
  "timePreferences": {
    "sessionLength": "short|medium|long",
    "playTimes": ["morning", "afternoon", "evening"]
  },
  "devicePreferences": {
    "platform": "mobile|tablet|desktop",
    "inputMethod": "touch|mouse|keyboard"
  }
}`;
  }

  /**
   * Build monetization prediction prompt
   */
  buildMonetizationPredictionPrompt(behaviorProfile) {
    return `
Analyze this player's monetization potential:
${JSON.stringify(behaviorProfile, null, 2)}

Return JSON with:
{
  "spendingProbability": 0.0-1.0,
  "preferredPricePoints": [0.99, 4.99, 9.99],
  "offerReceptiveness": "low|medium|high",
  "subscriptionLikelihood": 0.0-1.0,
  "adTolerance": "low|medium|high",
  "purchaseTriggers": ["limited_time", "social_proof", "progress_block"],
  "ltvPrediction": 0.0,
  "arpuPrediction": 0.0
}`;
  }

  /**
   * Build recommendation prompt
   */
  buildRecommendationPrompt(profile, contentType) {
    return `
Generate personalized ${contentType} recommendations for this player:
${JSON.stringify(profile, null, 2)}

Return JSON with:
{
  "recommendations": [
    {
      "id": "rec_1",
      "type": "${contentType}",
      "title": "Recommendation Title",
      "description": "Why this is recommended",
      "confidence": 0.0-1.0,
      "expectedEngagement": 0.0-1.0,
      "personalizationFactors": ["factor1", "factor2"]
    }
  ],
  "reasoning": "Why these recommendations were chosen",
  "alternatives": ["alt1", "alt2"],
  "nextSteps": ["action1", "action2"]
}`;
  }

  /**
   * Build offer generation prompt
   */
  buildOfferGenerationPrompt(profile, offerType, marketTrends) {
    return `
Generate personalized ${offerType} offers for this player:
Profile: ${JSON.stringify(profile, null, 2)}
Market Trends: ${JSON.stringify(marketTrends, null, 2)}

Return JSON with:
{
  "offers": [
    {
      "id": "offer_1",
      "type": "${offerType}",
      "title": "Offer Title",
      "description": "Offer description",
      "price": 4.99,
      "value": 9.99,
      "discount": 50,
      "urgency": "low|medium|high",
      "personalizationScore": 0.0-1.0,
      "conversionPrediction": 0.0-1.0,
      "targetAudience": "description"
    }
  ],
  "strategy": "Overall offer strategy",
  "timing": "When to show offers",
  "frequency": "How often to show"
}`;
  }

  // Helper methods
  async getPlayerProfile(playerId) {
    return this.playerProfiles.get(playerId) || (await this.loadPlayerProfile(playerId));
  }

  async loadPlayerProfile(playerId) {
    try {
      const { data, error } = await this.supabase
        .from('ai_player_profiles')
        .select('*')
        .eq('player_id', playerId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error('Failed to load player profile', { error: error.message });
      return null;
    }
  }

  async storePlayerProfile(profile) {
    try {
      const { error } = await this.supabase.from('ai_player_profiles').upsert({
        player_id: profile.id,
        profile_data: profile,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
    } catch (error) {
      this.logger.error('Failed to store player profile', { error: error.message });
    }
  }

  // Additional helper methods would be implemented here...
  calculatePersonalizationScore(profile) {
    return 0.85;
  }
  getDefaultBehaviorProfile() {
    return {};
  }
  getDefaultPreferences() {
    return {};
  }
  getDefaultEngagementPatterns() {
    return {};
  }
  getDefaultMonetizationProfile() {
    return {};
  }
  calculatePeakPlayTimes(profile) {
    return ['7-9 PM', '12-2 PM'];
  }
  calculateOptimalSessionLength(profile) {
    return 15;
  }
  identifyEngagementTriggers(profile) {
    return ['achievements', 'social'];
  }
  identifyRetentionFactors(profile) {
    return ['progression', 'social'];
  }
  identifyChurnSignals(profile) {
    return ['decreased_playtime'];
  }
  identifyReEngagementOpportunities(profile) {
    return ['comeback_offers'];
  }
  calculateDifficultyAdjustment(profile, level, performance) {
    return 0.1;
  }
  getDifficultyAdjustmentReason(profile, performance) {
    return 'Player struggling';
  }
  calculateAdjustmentConfidence(profile, performance) {
    return 0.8;
  }
  analyzeChurnFactors(profile, activity) {
    return {};
  }
  calculateChurnProbability(factors) {
    return 0.3;
  }
  generateChurnPreventionActions(factors) {
    return [];
  }
  getRiskLevel(probability) {
    return 'medium';
  }
  predictChurnDate(probability, activity) {
    return new Date();
  }
  async getMarketTrends() {
    return {};
  }
  async enhanceOffersWithPredictions(offers, profile) {
    return offers;
  }
  async getRecentActivity(playerId) {
    return {};
  }
  async storeRecommendations(playerId, type, recommendations) {}
  async storeDifficultyOptimization(optimization) {}
  async storeChurnPrediction(prediction) {}
  // ==================== OPTIMIZATION METHODS ====================

  /**
   * Advanced caching system for player profiles and predictions
   */
  async getCachedProfile(playerId) {
    try {
      // Check memory cache first
      const memoryCached = this.profileCache.get(playerId);
      if (memoryCached) {
        this.performanceMetrics.cacheHits++;
        return memoryCached;
      }

      // Check Redis cache
      const redisCached = await this.redis.get(`profile:${playerId}`);
      if (redisCached) {
        const parsed = JSON.parse(redisCached);
        this.profileCache.set(playerId, parsed);
        this.performanceMetrics.cacheHits++;
        return parsed;
      }

      this.performanceMetrics.cacheMisses++;
      return null;
    } catch (error) {
      this.logger.warn('Profile cache retrieval failed', { error: error.message, playerId });
      return null;
    }
  }

  async setCachedProfile(playerId, profile, ttlSeconds = 900) {
    try {
      // Set in memory cache
      this.profileCache.set(playerId, profile, { ttl: ttlSeconds * 1000 });

      // Set in Redis cache
      await this.redis.setex(`profile:${playerId}`, ttlSeconds, JSON.stringify(profile));
    } catch (error) {
      this.logger.warn('Profile cache storage failed', { error: error.message, playerId });
    }
  }

  async getCachedPrediction(predictionKey) {
    try {
      const cached = this.predictionCache.get(predictionKey);
      if (cached) {
        this.performanceMetrics.cacheHits++;
        return cached;
      }

      const redisCached = await this.redis.get(`prediction:${predictionKey}`);
      if (redisCached) {
        const parsed = JSON.parse(redisCached);
        this.predictionCache.set(predictionKey, parsed);
        this.performanceMetrics.cacheHits++;
        return parsed;
      }

      this.performanceMetrics.cacheMisses++;
      return null;
    } catch (error) {
      this.logger.warn('Prediction cache retrieval failed', { error: error.message, predictionKey });
      return null;
    }
  }

  async setCachedPrediction(predictionKey, prediction, ttlSeconds = 300) {
    try {
      this.predictionCache.set(predictionKey, prediction, { ttl: ttlSeconds * 1000 });
      await this.redis.setex(`prediction:${predictionKey}`, ttlSeconds, JSON.stringify(prediction));
    } catch (error) {
      this.logger.warn('Prediction cache storage failed', { error: error.message, predictionKey });
    }
  }

  /**
   * Real-time personalization updates
   */
  async updatePlayerProfileRealTime(playerId, behaviorData) {
    const updateKey = `update:${playerId}:${Date.now()}`;
    this.realTimeUpdates.set(updateKey, { playerId, behaviorData, timestamp: Date.now() });
    
    // Add to processing queue
    this.updateQueue.push({ playerId, behaviorData, timestamp: Date.now() });
    
    if (!this.isProcessingUpdates) {
      this.processRealTimeUpdates();
    }
  }

  async processRealTimeUpdates() {
    if (this.isProcessingUpdates || this.updateQueue.length === 0) return;

    this.isProcessingUpdates = true;
    const batch = this.updateQueue.splice(0, 10); // Process up to 10 updates at once

    try {
      const promises = batch.map(update => this.processSingleUpdate(update));
      await Promise.allSettled(promises);
    } catch (error) {
      this.logger.error('Real-time update processing failed', { error: error.message });
    } finally {
      this.isProcessingUpdates = false;
      
      // Process next batch if queue has items
      if (this.updateQueue.length > 0) {
        setTimeout(() => this.processRealTimeUpdates(), 100);
      }
    }
  }

  async processSingleUpdate(update) {
    const { playerId, behaviorData } = update;
    
    try {
      // Get current profile
      let profile = await this.getCachedProfile(playerId);
      if (!profile) {
        profile = await this.getPlayerProfile(playerId);
      }

      // Update profile with new behavior data
      this.updateProfileFromBehavior(profile, behaviorData);

      // Cache updated profile
      await this.setCachedProfile(playerId, profile);

      // Update ML models if needed
      this.queueModelUpdate(playerId, behaviorData);

      this.logger.debug('Real-time profile update processed', { playerId });
    } catch (error) {
      this.logger.error('Single update processing failed', { error: error.message, playerId });
    }
  }

  startRealTimeProcessor() {
    setInterval(() => {
      if (this.updateQueue.length > 0 && !this.isProcessingUpdates) {
        this.processRealTimeUpdates();
      }
    }, 1000); // Check every second
  }

  /**
   * Machine learning model optimization
   */
  queueModelUpdate(playerId, behaviorData) {
    this.modelTrainingQueue.push({ playerId, behaviorData, timestamp: Date.now() });
    
    // Start training if queue is large enough
    if (this.modelTrainingQueue.length >= 100 && !this.isTrainingModels) {
      this.startModelTraining();
    }
  }

  async startModelTraining() {
    if (this.isTrainingModels) return;

    this.isTrainingModels = true;
    const trainingData = this.modelTrainingQueue.splice(0, 100);

    try {
      await this.trainPersonalizationModels(trainingData);
      this.logger.info('ML models updated successfully', { 
        trainingSamples: trainingData.length 
      });
    } catch (error) {
      this.logger.error('Model training failed', { error: error.message });
    } finally {
      this.isTrainingModels = false;
      
      // Continue training if more data available
      if (this.modelTrainingQueue.length >= 100) {
        setTimeout(() => this.startModelTraining(), 5000);
      }
    }
  }

  async trainPersonalizationModels(trainingData) {
    // Train content recommendation model
    await this.trainContentRecommendationModel(trainingData);
    
    // Train difficulty adjustment model
    await this.trainDifficultyAdjustmentModel(trainingData);
    
    // Train churn prediction model
    await this.trainChurnPredictionModel(trainingData);
    
    // Train offer recommendation model
    await this.trainOfferRecommendationModel(trainingData);
  }

  async trainContentRecommendationModel(trainingData) {
    const modelId = 'content_recommendation';
    const features = this.extractFeatures(trainingData, 'content');
    const labels = this.extractLabels(trainingData, 'content');
    
    // Update model weights using gradient descent
    const model = this.mlModels.get(modelId) || { weights: {}, accuracy: 0 };
    const updatedWeights = this.updateModelWeights(model.weights, features, labels);
    
    model.weights = updatedWeights;
    model.accuracy = this.calculateModelAccuracy(features, labels, updatedWeights);
    model.lastTrained = new Date();
    
    this.mlModels.set(modelId, model);
  }

  async trainDifficultyAdjustmentModel(trainingData) {
    const modelId = 'difficulty_adjustment';
    const features = this.extractFeatures(trainingData, 'difficulty');
    const labels = this.extractLabels(trainingData, 'difficulty');
    
    const model = this.mlModels.get(modelId) || { weights: {}, accuracy: 0 };
    const updatedWeights = this.updateModelWeights(model.weights, features, labels);
    
    model.weights = updatedWeights;
    model.accuracy = this.calculateModelAccuracy(features, labels, updatedWeights);
    model.lastTrained = new Date();
    
    this.mlModels.set(modelId, model);
  }

  async trainChurnPredictionModel(trainingData) {
    const modelId = 'churn_prediction';
    const features = this.extractFeatures(trainingData, 'churn');
    const labels = this.extractLabels(trainingData, 'churn');
    
    const model = this.mlModels.get(modelId) || { weights: {}, accuracy: 0 };
    const updatedWeights = this.updateModelWeights(model.weights, features, labels);
    
    model.weights = updatedWeights;
    model.accuracy = this.calculateModelAccuracy(features, labels, updatedWeights);
    model.lastTrained = new Date();
    
    this.mlModels.set(modelId, model);
  }

  async trainOfferRecommendationModel(trainingData) {
    const modelId = 'offer_recommendation';
    const features = this.extractFeatures(trainingData, 'offers');
    const labels = this.extractLabels(trainingData, 'offers');
    
    const model = this.mlModels.get(modelId) || { weights: {}, accuracy: 0 };
    const updatedWeights = this.updateModelWeights(model.weights, features, labels);
    
    model.weights = updatedWeights;
    model.accuracy = this.calculateModelAccuracy(features, labels, updatedWeights);
    model.lastTrained = new Date();
    
    this.mlModels.set(modelId, model);
  }

  extractFeatures(trainingData, modelType) {
    return trainingData.map(data => {
      const features = {};
      
      switch (modelType) {
        case 'content':
          features.level = data.behaviorData.level || 0;
          features.completionRate = data.behaviorData.completionRate || 0;
          features.sessionDuration = data.behaviorData.sessionDuration || 0;
          features.engagementLevel = data.behaviorData.engagementLevel || 0;
          break;
        case 'difficulty':
          features.currentDifficulty = data.behaviorData.difficulty || 0;
          features.performance = data.behaviorData.performance || 0;
          features.movesUsed = data.behaviorData.movesUsed || 0;
          features.timeSpent = data.behaviorData.timeSpent || 0;
          break;
        case 'churn':
          features.sessionFrequency = data.behaviorData.sessionFrequency || 0;
          features.lastActive = data.behaviorData.lastActive || 0;
          features.engagementDrop = data.behaviorData.engagementDrop || 0;
          features.spendingDecrease = data.behaviorData.spendingDecrease || 0;
          break;
        case 'offers':
          features.spendingTendency = data.behaviorData.spendingTendency || 0;
          features.priceSensitivity = data.behaviorData.priceSensitivity || 0;
          features.purchaseHistory = data.behaviorData.purchaseHistory || 0;
          features.currencyBalance = data.behaviorData.currencyBalance || 0;
          break;
      }
      
      return features;
    });
  }

  extractLabels(trainingData, modelType) {
    return trainingData.map(data => {
      switch (modelType) {
        case 'content':
          return data.behaviorData.contentPreference || 0;
        case 'difficulty':
          return data.behaviorData.optimalDifficulty || 0;
        case 'churn':
          return data.behaviorData.churnRisk || 0;
        case 'offers':
          return data.behaviorData.offerAcceptance || 0;
        default:
          return 0;
      }
    });
  }

  updateModelWeights(weights, features, labels) {
    const learningRate = 0.01;
    const updatedWeights = { ...weights };
    
    features.forEach((featureSet, index) => {
      const prediction = this.predictWithWeights(updatedWeights, featureSet);
      const error = labels[index] - prediction;
      
      Object.keys(featureSet).forEach(feature => {
        if (!updatedWeights[feature]) {
          updatedWeights[feature] = 0;
        }
        updatedWeights[feature] += learningRate * error * featureSet[feature];
      });
    });
    
    return updatedWeights;
  }

  predictWithWeights(weights, features) {
    let prediction = 0;
    Object.keys(features).forEach(feature => {
      prediction += (weights[feature] || 0) * features[feature];
    });
    return Math.max(0, Math.min(1, prediction)); // Clamp between 0 and 1
  }

  calculateModelAccuracy(features, labels, weights) {
    let correct = 0;
    let total = features.length;
    
    features.forEach((featureSet, index) => {
      const prediction = this.predictWithWeights(weights, featureSet);
      const actual = labels[index];
      
      if (Math.abs(prediction - actual) < 0.1) {
        correct++;
      }
    });
    
    return total > 0 ? correct / total : 0;
  }

  /**
   * Performance monitoring
   */
  startPerformanceMonitor() {
    setInterval(() => {
      this.logPerformanceMetrics();
    }, 60000); // Every minute
  }

  logPerformanceMetrics() {
    const metrics = {
      ...this.performanceMetrics,
      cacheHitRate: this.performanceMetrics.cacheHits / 
        (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses) || 0,
      modelCount: this.mlModels.size,
      queueSize: this.updateQueue.length,
      uptime: Date.now() - this.performanceMetrics.lastReset,
    };

    this.logger.info('AI Personalization Engine Performance', metrics);

    // Reset metrics every hour
    if (Date.now() - this.performanceMetrics.lastReset > 3600000) {
      this.resetPerformanceMetrics();
    }
  }

  resetPerformanceMetrics() {
    this.performanceMetrics = {
      totalPersonalizations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averagePersonalizationTime: 0,
      predictionAccuracy: 0,
      lastReset: Date.now(),
    };
  }

  /**
   * Memory optimization
   */
  optimizeMemory() {
    // Clear old cached profiles
    const cutoff = Date.now() - 3600000; // 1 hour ago
    for (const [key, profile] of this.profileCache.entries()) {
      if (profile.lastUpdated && new Date(profile.lastUpdated).getTime() < cutoff) {
        this.profileCache.delete(key);
      }
    }

    // Clear old predictions
    for (const [key, prediction] of this.predictionCache.entries()) {
      if (prediction.timestamp && prediction.timestamp < cutoff) {
        this.predictionCache.delete(key);
      }
    }

    // Clear old real-time updates
    for (const [key, update] of this.realTimeUpdates.entries()) {
      if (update.timestamp < cutoff) {
        this.realTimeUpdates.delete(key);
      }
    }
  }

  // ==================== EXISTING HELPER METHODS ====================
  async storePersonalizedOffers(playerId, offers) {}
  async storeDifficultyOptimization(optimization) {}
  async storeChurnPrediction(prediction) {}
  async storePersonalizedOffers(playerId, offers) {}
}

export { AIPersonalizationEngine };
