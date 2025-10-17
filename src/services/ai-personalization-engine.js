import { Logger } from '../core/logger/index.js';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

/**
 * AI Personalization Engine - Industry Leading Player Personalization
 * Uses machine learning and AI to create unique experiences for every player
 */
class AIPersonalizationEngine {
    constructor() {
        this.logger = new Logger('AIPersonalizationEngine');
        
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        
        this.playerProfiles = new Map();
        this.personalizationModels = new Map();
        this.behaviorPatterns = new Map();
        
        this.initializePersonalizationModels();
    }

    /**
     * Initialize personalization models and algorithms
     */
    initializePersonalizationModels() {
        this.personalizationModels.set('difficulty_adjustment', {
            algorithm: 'adaptive_difficulty',
            parameters: {
                baseDifficulty: 0.5,
                adjustmentRate: 0.1,
                maxDifficulty: 1.0,
                minDifficulty: 0.1
            }
        });

        this.personalizationModels.set('content_recommendation', {
            algorithm: 'collaborative_filtering',
            parameters: {
                similarityThreshold: 0.7,
                recommendationCount: 10,
                diversityFactor: 0.3
            }
        });

        this.personalizationModels.set('offer_personalization', {
            algorithm: 'behavioral_analysis',
            parameters: {
                spendingPatternWeight: 0.4,
                engagementWeight: 0.3,
                preferenceWeight: 0.3
            }
        });

        this.personalizationModels.set('timing_optimization', {
            algorithm: 'temporal_analysis',
            parameters: {
                peakHoursWeight: 0.5,
                playerScheduleWeight: 0.3,
                engagementHistoryWeight: 0.2
            }
        });
    }

    /**
     * Generate personalized content for a player
     */
    async generatePersonalizedContent(playerId, contentType, preferences = {}) {
        try {
            this.logger.info(`Generating personalized ${contentType} for player ${playerId}`);
            
            const playerProfile = await this.getPlayerProfile(playerId);
            const behaviorPattern = await this.getBehaviorPattern(playerId);
            const marketTrends = await this.getMarketTrends();
            
            const personalizationContext = this.buildPersonalizationContext(
                playerProfile, 
                behaviorPattern, 
                marketTrends, 
                preferences
            );
            
            const personalizedContent = await this.generateContentWithAI(
                contentType, 
                personalizationContext
            );
            
            // Store personalized content
            await this.storePersonalizedContent(playerId, contentType, personalizedContent);
            
            // Update player profile with new preferences
            await this.updatePlayerProfile(playerId, personalizedContent);
            
            this.logger.info(`Generated personalized ${contentType} for player ${playerId}`);
            return personalizedContent;

        } catch (error) {
            this.logger.error('Failed to generate personalized content', { 
                error: error.message, 
                playerId, 
                contentType 
            });
            throw error;
        }
    }

    /**
     * Personalize game difficulty in real-time
     */
    async personalizeDifficulty(playerId, levelId, currentPerformance) {
        try {
            const playerProfile = await this.getPlayerProfile(playerId);
            const difficultyModel = this.personalizationModels.get('difficulty_adjustment');
            
            // Calculate personalized difficulty
            const personalizedDifficulty = this.calculatePersonalizedDifficulty(
                playerProfile, 
                currentPerformance, 
                difficultyModel.parameters
            );
            
            // Update level difficulty
            await this.updateLevelDifficulty(levelId, personalizedDifficulty);
            
            // Store difficulty adjustment
            await this.storeDifficultyAdjustment(playerId, levelId, personalizedDifficulty);
            
            this.logger.info(`Personalized difficulty for player ${playerId} on level ${levelId}`);
            return personalizedDifficulty;

        } catch (error) {
            this.logger.error('Failed to personalize difficulty', { 
                error: error.message, 
                playerId, 
                levelId 
            });
            throw error;
        }
    }

    /**
     * Generate personalized offers
     */
    async generatePersonalizedOffers(playerId, offerCount = 5) {
        try {
            const playerProfile = await this.getPlayerProfile(playerId);
            const behaviorPattern = await this.getBehaviorPattern(playerId);
            const marketTrends = await this.getMarketTrends();
            
            const offerContext = this.buildOfferContext(
                playerProfile, 
                behaviorPattern, 
                marketTrends
            );
            
            const personalizedOffers = await this.generateOffersWithAI(
                offerContext, 
                offerCount
            );
            
            // Store personalized offers
            await this.storePersonalizedOffers(playerId, personalizedOffers);
            
            this.logger.info(`Generated ${personalizedOffers.length} personalized offers for player ${playerId}`);
            return personalizedOffers;

        } catch (error) {
            this.logger.error('Failed to generate personalized offers', { 
                error: error.message, 
                playerId 
            });
            throw error;
        }
    }

    /**
     * Optimize content timing for maximum engagement
     */
    async optimizeContentTiming(playerId, contentType, contentData) {
        try {
            const playerProfile = await this.getPlayerProfile(playerId);
            const behaviorPattern = await this.getBehaviorPattern(playerId);
            const timingModel = this.personalizationModels.get('timing_optimization');
            
            const optimalTiming = this.calculateOptimalTiming(
                playerProfile, 
                behaviorPattern, 
                timingModel.parameters
            );
            
            // Schedule content for optimal time
            await this.scheduleContent(playerId, contentType, contentData, optimalTiming);
            
            this.logger.info(`Optimized timing for ${contentType} for player ${playerId}`);
            return optimalTiming;

        } catch (error) {
            this.logger.error('Failed to optimize content timing', { 
                error: error.message, 
                playerId, 
                contentType 
            });
            throw error;
        }
    }

    /**
     * Personalize social features
     */
    async personalizeSocialFeatures(playerId) {
        try {
            const playerProfile = await this.getPlayerProfile(playerId);
            const socialPreferences = await this.getSocialPreferences(playerId);
            
            const personalizedSocial = {
                recommendedFriends: await this.recommendFriends(playerId),
                suggestedGuilds: await this.recommendGuilds(playerId),
                socialChallenges: await this.generateSocialChallenges(playerId),
                leaderboardPreferences: await this.getLeaderboardPreferences(playerId)
            };
            
            // Store personalized social features
            await this.storePersonalizedSocial(playerId, personalizedSocial);
            
            this.logger.info(`Personalized social features for player ${playerId}`);
            return personalizedSocial;

        } catch (error) {
            this.logger.error('Failed to personalize social features', { 
                error: error.message, 
                playerId 
            });
            throw error;
        }
    }

    /**
     * Build personalization context for AI
     */
    buildPersonalizationContext(playerProfile, behaviorPattern, marketTrends, preferences) {
        return {
            player: {
                id: playerProfile.id,
                level: playerProfile.level,
                experience: playerProfile.experience,
                preferences: playerProfile.preferences,
                playStyle: playerProfile.playStyle,
                spendingPattern: playerProfile.spendingPattern,
                engagementLevel: playerProfile.engagementLevel
            },
            behavior: {
                sessionLength: behaviorPattern.avgSessionLength,
                playFrequency: behaviorPattern.playFrequency,
                preferredTimes: behaviorPattern.preferredTimes,
                difficultyPreference: behaviorPattern.difficultyPreference,
                contentPreferences: behaviorPattern.contentPreferences,
                socialActivity: behaviorPattern.socialActivity
            },
            market: {
                trends: marketTrends,
                popularContent: marketTrends.popularContent,
                emergingFeatures: marketTrends.emergingFeatures
            },
            preferences: preferences
        };
    }

    /**
     * Generate content using AI with personalization
     */
    async generateContentWithAI(contentType, context) {
        try {
            const systemPrompt = this.buildContentSystemPrompt(contentType);
            const userPrompt = this.buildContentUserPrompt(contentType, context);
            
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: userPrompt
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.7
            });

            const content = JSON.parse(response.choices[0].message.content);
            content.id = uuidv4();
            content.generatedAt = new Date().toISOString();
            content.personalized = true;

            return content;

        } catch (error) {
            this.logger.error('Failed to generate content with AI', { error: error.message });
            throw error;
        }
    }

    /**
     * Build system prompt for content generation
     */
    buildContentSystemPrompt(contentType) {
        const prompts = {
            level: `You are an expert match-3 level designer. Create levels that are perfectly personalized for each player based on their:
            - Skill level and progression
            - Preferred difficulty and play style
            - Content preferences and engagement patterns
            - Spending behavior and monetization preferences
            - Social activity and competitive nature
            
            Generate levels that maximize engagement, retention, and monetization for this specific player.`,
            
            story: `You are a master storyteller for mobile games. Create story content that is perfectly personalized for each player based on their:
            - Character preferences and story engagement
            - Reading habits and content consumption patterns
            - Emotional triggers and narrative preferences
            - Social sharing behavior and viral potential
            - Progression goals and achievement motivation
            
            Generate story content that creates emotional connection and drives long-term engagement.`,
            
            event: `You are a live operations expert. Create events that are perfectly personalized for each player based on their:
            - Engagement patterns and play frequency
            - Competitive nature and social preferences
            - Spending behavior and offer responsiveness
            - Time availability and session patterns
            - Achievement motivation and progression goals
            
            Generate events that maximize participation, retention, and monetization.`,
            
            offer: `You are a monetization expert. Create offers that are perfectly personalized for each player based on their:
            - Spending history and price sensitivity
            - Purchase patterns and item preferences
            - Engagement level and retention risk
            - Social status and competitive nature
            - Progression needs and current goals
            
            Generate offers that maximize conversion while maintaining player satisfaction.`
        };

        return prompts[contentType] || prompts.level;
    }

    /**
     * Build user prompt for content generation
     */
    buildContentUserPrompt(contentType, context) {
        return `
        Generate personalized ${contentType} for this player:
        
        Player Profile:
        - Level: ${context.player.level}
        - Experience: ${context.player.experience}
        - Play Style: ${context.player.playStyle}
        - Spending Pattern: ${context.player.spendingPattern}
        - Engagement Level: ${context.player.engagementLevel}
        
        Behavior Patterns:
        - Session Length: ${context.behavior.sessionLength} minutes
        - Play Frequency: ${context.behavior.playFrequency} times per day
        - Preferred Times: ${context.behavior.preferredTimes?.join(', ')}
        - Difficulty Preference: ${context.behavior.difficultyPreference}
        - Content Preferences: ${context.behavior.contentPreferences?.join(', ')}
        
        Market Trends:
        - Popular Content: ${context.market.popularContent?.join(', ')}
        - Emerging Features: ${context.market.emergingFeatures?.join(', ')}
        
        Create content that maximizes engagement and retention for this specific player.
        `;
    }

    /**
     * Calculate personalized difficulty
     */
    calculatePersonalizedDifficulty(playerProfile, currentPerformance, parameters) {
        const baseDifficulty = parameters.baseDifficulty;
        const adjustmentRate = parameters.adjustmentRate;
        
        // Calculate difficulty adjustment based on performance
        let adjustment = 0;
        
        if (currentPerformance.winRate > 0.8) {
            adjustment = adjustmentRate; // Increase difficulty
        } else if (currentPerformance.winRate < 0.4) {
            adjustment = -adjustmentRate; // Decrease difficulty
        }
        
        // Factor in player preferences
        const preferenceAdjustment = (playerProfile.difficultyPreference - 0.5) * 0.2;
        
        // Calculate final difficulty
        const personalizedDifficulty = Math.max(
            parameters.minDifficulty,
            Math.min(
                parameters.maxDifficulty,
                baseDifficulty + adjustment + preferenceAdjustment
            )
        );
        
        return personalizedDifficulty;
    }

    /**
     * Calculate optimal timing for content
     */
    calculateOptimalTiming(playerProfile, behaviorPattern, parameters) {
        const peakHours = behaviorPattern.preferredTimes || ['19:00', '20:00', '21:00'];
        const playerSchedule = behaviorPattern.playSchedule || {};
        const engagementHistory = behaviorPattern.engagementHistory || {};
        
        // Calculate optimal time based on multiple factors
        let optimalTime = peakHours[0]; // Default to first peak hour
        
        // Adjust based on player's historical engagement
        if (engagementHistory.mostEngagingHour) {
            optimalTime = engagementHistory.mostEngagingHour;
        }
        
        // Adjust based on player's schedule
        if (playerSchedule.availableHours) {
            const availablePeakHours = peakHours.filter(hour => 
                playerSchedule.availableHours.includes(hour)
            );
            if (availablePeakHours.length > 0) {
                optimalTime = availablePeakHours[0];
            }
        }
        
        return optimalTime;
    }

    /**
     * Generate offers using AI
     */
    async generateOffersWithAI(context, offerCount) {
        try {
            const systemPrompt = this.buildContentSystemPrompt('offer');
            const userPrompt = this.buildContentUserPrompt('offer', context);
            
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: `${userPrompt}\n\nGenerate ${offerCount} personalized offers.`
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.6
            });

            const offers = JSON.parse(response.choices[0].message.content);
            return offers.offers || [];

        } catch (error) {
            this.logger.error('Failed to generate offers with AI', { error: error.message });
            return [];
        }
    }

    /**
     * Get player profile
     */
    async getPlayerProfile(playerId) {
        try {
            const { data, error } = await this.supabase
                .from('player_profiles')
                .select('*')
                .eq('player_id', playerId)
                .single();

            if (error) {
                return this.getDefaultPlayerProfile();
            }

            return data;

        } catch (error) {
            this.logger.error('Failed to get player profile', { error: error.message, playerId });
            return this.getDefaultPlayerProfile();
        }
    }

    /**
     * Get behavior pattern for player
     */
    async getBehaviorPattern(playerId) {
        try {
            const { data, error } = await this.supabase
                .from('player_behavior')
                .select('*')
                .eq('player_id', playerId)
                .single();

            if (error) {
                return this.getDefaultBehaviorPattern();
            }

            return data;

        } catch (error) {
            this.logger.error('Failed to get behavior pattern', { error: error.message, playerId });
            return this.getDefaultBehaviorPattern();
        }
    }

    /**
     * Get market trends
     */
    async getMarketTrends() {
        try {
            const { data, error } = await this.supabase
                .from('market_trends')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                return this.getDefaultMarketTrends();
            }

            return data.trends;

        } catch (error) {
            this.logger.error('Failed to get market trends', { error: error.message });
            return this.getDefaultMarketTrends();
        }
    }

    /**
     * Store personalized content
     */
    async storePersonalizedContent(playerId, contentType, content) {
        try {
            const { error } = await this.supabase
                .from('personalized_content')
                .insert({
                    id: content.id,
                    player_id: playerId,
                    content_type: contentType,
                    content: content,
                    generated_at: content.generatedAt,
                    personalized: true
                });

            if (error) {
                throw error;
            }

        } catch (error) {
            this.logger.error('Failed to store personalized content', { error: error.message });
            throw error;
        }
    }

    /**
     * Update player profile
     */
    async updatePlayerProfile(playerId, content) {
        try {
            // Update player preferences based on content interaction
            const preferences = this.extractPreferencesFromContent(content);
            
            const { error } = await this.supabase
                .from('player_profiles')
                .update({
                    preferences: preferences,
                    updated_at: new Date().toISOString()
                })
                .eq('player_id', playerId);

            if (error) {
                throw error;
            }

        } catch (error) {
            this.logger.error('Failed to update player profile', { error: error.message });
        }
    }

    /**
     * Extract preferences from content
     */
    extractPreferencesFromContent(content) {
        const preferences = {};
        
        if (content.difficulty) {
            preferences.difficultyPreference = content.difficulty;
        }
        
        if (content.theme) {
            preferences.themePreference = content.theme;
        }
        
        if (content.socialElements) {
            preferences.socialPreference = content.socialElements;
        }
        
        return preferences;
    }

    /**
     * Get default player profile
     */
    getDefaultPlayerProfile() {
        return {
            id: 'default',
            level: 1,
            experience: 0,
            preferences: {},
            playStyle: 'casual',
            spendingPattern: 'low',
            engagementLevel: 'medium',
            difficultyPreference: 0.5
        };
    }

    /**
     * Get default behavior pattern
     */
    getDefaultBehaviorPattern() {
        return {
            avgSessionLength: 5,
            playFrequency: 1,
            preferredTimes: ['19:00', '20:00'],
            difficultyPreference: 0.5,
            contentPreferences: [],
            socialActivity: 'low'
        };
    }

    /**
     * Get default market trends
     */
    getDefaultMarketTrends() {
        return {
            popularContent: ['levels', 'events', 'story'],
            emergingFeatures: ['ai_personalization', 'real_time_multiplayer'],
            trends: {
                personalization: 'high',
                social: 'medium',
                monetization: 'high'
            }
        };
    }

    /**
     * Recommend friends for player
     */
    async recommendFriends(playerId) {
        try {
            // This would implement friend recommendation algorithm
            return [];
        } catch (error) {
            this.logger.error('Failed to recommend friends', { error: error.message, playerId });
            return [];
        }
    }

    /**
     * Recommend guilds for player
     */
    async recommendGuilds(playerId) {
        try {
            // This would implement guild recommendation algorithm
            return [];
        } catch (error) {
            this.logger.error('Failed to recommend guilds', { error: error.message, playerId });
            return [];
        }
    }

    /**
     * Generate social challenges
     */
    async generateSocialChallenges(playerId) {
        try {
            // This would implement social challenge generation
            return [];
        } catch (error) {
            this.logger.error('Failed to generate social challenges', { error: error.message, playerId });
            return [];
        }
    }

    /**
     * Get leaderboard preferences
     */
    async getLeaderboardPreferences(playerId) {
        try {
            // This would implement leaderboard preference analysis
            return {};
        } catch (error) {
            this.logger.error('Failed to get leaderboard preferences', { error: error.message, playerId });
            return {};
        }
    }

    /**
     * Get social preferences
     */
    async getSocialPreferences(playerId) {
        try {
            const { data, error } = await this.supabase
                .from('social_preferences')
                .select('*')
                .eq('player_id', playerId)
                .single();

            if (error) {
                return {};
            }

            return data;

        } catch (error) {
            this.logger.error('Failed to get social preferences', { error: error.message, playerId });
            return {};
        }
    }

    /**
     * Store personalized social features
     */
    async storePersonalizedSocial(playerId, socialFeatures) {
        try {
            const { error } = await this.supabase
                .from('personalized_social')
                .insert({
                    id: uuidv4(),
                    player_id: playerId,
                    social_features: socialFeatures,
                    created_at: new Date().toISOString()
                });

            if (error) {
                throw error;
            }

        } catch (error) {
            this.logger.error('Failed to store personalized social', { error: error.message });
            throw error;
        }
    }

    /**
     * Update level difficulty
     */
    async updateLevelDifficulty(levelId, difficulty) {
        try {
            const { error } = await this.supabase
                .from('levels')
                .update({
                    difficulty: difficulty,
                    updated_at: new Date().toISOString()
                })
                .eq('id', levelId);

            if (error) {
                throw error;
            }

        } catch (error) {
            this.logger.error('Failed to update level difficulty', { error: error.message });
            throw error;
        }
    }

    /**
     * Store difficulty adjustment
     */
    async storeDifficultyAdjustment(playerId, levelId, difficulty) {
        try {
            const { error } = await this.supabase
                .from('difficulty_adjustments')
                .insert({
                    id: uuidv4(),
                    player_id: playerId,
                    level_id: levelId,
                    difficulty: difficulty,
                    adjusted_at: new Date().toISOString()
                });

            if (error) {
                throw error;
            }

        } catch (error) {
            this.logger.error('Failed to store difficulty adjustment', { error: error.message });
            throw error;
        }
    }

    /**
     * Store personalized offers
     */
    async storePersonalizedOffers(playerId, offers) {
        try {
            const { error } = await this.supabase
                .from('personalized_offers')
                .insert({
                    id: uuidv4(),
                    player_id: playerId,
                    offers: offers,
                    created_at: new Date().toISOString()
                });

            if (error) {
                throw error;
            }

        } catch (error) {
            this.logger.error('Failed to store personalized offers', { error: error.message });
            throw error;
        }
    }

    /**
     * Schedule content for optimal time
     */
    async scheduleContent(playerId, contentType, contentData, optimalTime) {
        try {
            const { error } = await this.supabase
                .from('scheduled_content')
                .insert({
                    id: uuidv4(),
                    player_id: playerId,
                    content_type: contentType,
                    content_data: contentData,
                    scheduled_time: optimalTime,
                    created_at: new Date().toISOString()
                });

            if (error) {
                throw error;
            }

        } catch (error) {
            this.logger.error('Failed to schedule content', { error: error.message });
            throw error;
        }
    }
}

export { AIPersonalizationEngine };