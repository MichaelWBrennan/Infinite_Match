import { Logger } from '../core/logger/index.js';
import { ServiceError } from '../core/errors/ErrorHandler.js';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

/**
 * AI Personalization Engine - Advanced player personalization using ML and AI
 * Creates unique experiences for every player using behavioral analysis and predictive modeling
 */
class AIPersonalizationEngine {
  constructor() {
    this.logger = new Logger('AIPersonalizationEngine');

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    this.playerProfiles = new Map();
    this.behaviorModels = new Map();
    this.personalizationRules = new Map();
    this.predictionModels = new Map();

    this.initializePersonalizationModels();
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
  async storePersonalizedOffers(playerId, offers) {}
  async storeDifficultyOptimization(optimization) {}
  async storeChurnPrediction(prediction) {}
  async storePersonalizedOffers(playerId, offers) {}
}

export { AIPersonalizationEngine };
