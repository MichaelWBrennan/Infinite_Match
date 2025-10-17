import { Logger } from '../core/logger/index.js';
import { AppConfig } from '../core/config/index.js';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

/**
 * AI Content Generator - Industry Leading Infinite Content Machine
 * Uses OpenAI GPT-4, DALL-E 3, and advanced AI for perpetual content creation
 */
class AIContentGenerator {
    constructor() {
        this.logger = new Logger('AIContentGenerator');
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        
        this.s3Client = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });
        
        this.contentTemplates = new Map();
        this.generatedContent = new Map();
        this.playerPreferences = new Map();
        this.marketTrends = new Map();
        
        this.initializeContentTemplates();
    }

    /**
     * Initialize content generation templates based on industry analysis
     */
    async initializeContentTemplates() {
        this.logger.info('Initializing AI content generation templates');
        
        // Level generation templates
        this.contentTemplates.set('level_generation', {
            systemPrompt: `You are an expert match-3 level designer. Generate levels that:
            - Follow industry best practices from Candy Crush, Gardenscapes, and Toon Blast
            - Have clear objectives and progressive difficulty
            - Include strategic elements and power-up opportunities
            - Are optimized for mobile gameplay
            - Include psychological hooks for engagement`,
            outputFormat: 'json',
            schema: {
                levelId: 'string',
                difficulty: 'number (1-10)',
                objective: 'string',
                moves: 'number',
                specialElements: 'array',
                powerUpOpportunities: 'array',
                psychologicalHooks: 'array'
            }
        });

        // Story content templates
        this.contentTemplates.set('story_generation', {
            systemPrompt: `You are a master storyteller for mobile games. Create engaging narratives that:
            - Follow successful patterns from Gardenscapes, Homescapes, and Royal Match
            - Include character development and emotional hooks
            - Have branching storylines for replayability
            - Include collectible elements and progression rewards
            - Are optimized for short play sessions`,
            outputFormat: 'json',
            schema: {
                storyId: 'string',
                chapter: 'number',
                title: 'string',
                content: 'string',
                characters: 'array',
                choices: 'array',
                rewards: 'array'
            }
        });

        // Visual asset generation
        this.contentTemplates.set('visual_generation', {
            systemPrompt: `You are a professional game artist. Create visual assets that:
            - Match the style of successful match-3 games
            - Are optimized for mobile screens
            - Include proper contrast and accessibility
            - Follow current design trends
            - Are culturally appropriate and inclusive`,
            outputFormat: 'image',
            style: 'mobile game art, colorful, friendly, accessible'
        });

        // Event content generation
        this.contentTemplates.set('event_generation', {
            systemPrompt: `You are a live operations expert. Create events that:
            - Follow successful patterns from top mobile games
            - Include FOMO elements and time pressure
            - Have clear progression and rewards
            - Are optimized for player retention
            - Include social and competitive elements`,
            outputFormat: 'json',
            schema: {
                eventId: 'string',
                name: 'string',
                type: 'string',
                duration: 'number',
                objectives: 'array',
                rewards: 'array',
                socialElements: 'array'
            }
        });
    }

    /**
     * Generate infinite levels using AI
     */
    async generateLevel(playerId, preferences = {}) {
        try {
            const playerProfile = await this.getPlayerProfile(playerId);
            const marketTrends = await this.getMarketTrends();
            
            const prompt = this.buildLevelPrompt(playerProfile, preferences, marketTrends);
            
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: this.contentTemplates.get('level_generation').systemPrompt
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.7
            });

            const levelData = JSON.parse(response.choices[0].message.content);
            levelData.id = uuidv4();
            levelData.generatedAt = new Date().toISOString();
            levelData.playerId = playerId;

            // Store in database
            await this.storeGeneratedContent('level', levelData);
            
            // Generate visual assets for the level
            await this.generateLevelVisuals(levelData);

            this.logger.info(`Generated level ${levelData.id} for player ${playerId}`);
            return levelData;

        } catch (error) {
            this.logger.error('Failed to generate level', { error: error.message, playerId });
            throw error;
        }
    }

    /**
     * Generate infinite story content using AI
     */
    async generateStoryContent(playerId, chapter = 1) {
        try {
            const playerProfile = await this.getPlayerProfile(playerId);
            const storyContext = await this.getStoryContext(playerId);
            
            const prompt = this.buildStoryPrompt(playerProfile, storyContext, chapter);
            
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: this.contentTemplates.get('story_generation').systemPrompt
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.8
            });

            const storyData = JSON.parse(response.choices[0].message.content);
            storyData.id = uuidv4();
            storyData.generatedAt = new Date().toISOString();
            storyData.playerId = playerId;

            // Store in database
            await this.storeGeneratedContent('story', storyData);
            
            // Generate character images
            await this.generateCharacterImages(storyData);

            this.logger.info(`Generated story content ${storyData.id} for player ${playerId}`);
            return storyData;

        } catch (error) {
            this.logger.error('Failed to generate story content', { error: error.message, playerId });
            throw error;
        }
    }

    /**
     * Generate visual assets using DALL-E 3
     */
    async generateVisualAsset(prompt, style = 'mobile game art') {
        try {
            const response = await this.openai.images.generate({
                model: "dall-e-3",
                prompt: `${prompt}, ${style}, high quality, mobile game asset, 1024x1024`,
                n: 1,
                size: "1024x1024",
                quality: "hd"
            });

            const imageUrl = response.data[0].url;
            
            // Download and store in S3
            const imageBuffer = await this.downloadImage(imageUrl);
            const s3Key = `generated-assets/${uuidv4()}.png`;
            
            await this.s3Client.send(new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: s3Key,
                Body: imageBuffer,
                ContentType: 'image/png'
            }));

            return {
                url: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${s3Key}`,
                prompt: prompt,
                generatedAt: new Date().toISOString()
            };

        } catch (error) {
            this.logger.error('Failed to generate visual asset', { error: error.message });
            throw error;
        }
    }

    /**
     * Generate live events using AI
     */
    async generateLiveEvent(playerSegment = 'all') {
        try {
            const marketTrends = await this.getMarketTrends();
            const currentEvents = await this.getCurrentEvents();
            
            const prompt = this.buildEventPrompt(playerSegment, marketTrends, currentEvents);
            
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: this.contentTemplates.get('event_generation').systemPrompt
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.9
            });

            const eventData = JSON.parse(response.choices[0].message.content);
            eventData.id = uuidv4();
            eventData.generatedAt = new Date().toISOString();
            eventData.status = 'scheduled';

            // Store in database
            await this.storeGeneratedContent('event', eventData);
            
            // Generate event visuals
            await this.generateEventVisuals(eventData);

            this.logger.info(`Generated live event ${eventData.id} for segment ${playerSegment}`);
            return eventData;

        } catch (error) {
            this.logger.error('Failed to generate live event', { error: error.message });
            throw error;
        }
    }

    /**
     * Generate personalized offers using AI
     */
    async generatePersonalizedOffer(playerId) {
        try {
            const playerProfile = await this.getPlayerProfile(playerId);
            const marketTrends = await this.getMarketTrends();
            const competitorOffers = await this.getCompetitorOffers();
            
            const prompt = this.buildOfferPrompt(playerProfile, marketTrends, competitorOffers);
            
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: `You are an expert in mobile game monetization. Create offers that:
                        - Are personalized to the player's behavior and preferences
                        - Follow successful patterns from top-grossing games
                        - Include psychological triggers for conversion
                        - Are priced optimally for the player's segment
                        - Include urgency and scarcity elements`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.6
            });

            const offerData = JSON.parse(response.choices[0].message.content);
            offerData.id = uuidv4();
            offerData.playerId = playerId;
            offerData.generatedAt = new Date().toISOString();

            // Store in database
            await this.storeGeneratedContent('offer', offerData);

            this.logger.info(`Generated personalized offer ${offerData.id} for player ${playerId}`);
            return offerData;

        } catch (error) {
            this.logger.error('Failed to generate personalized offer', { error: error.message, playerId });
            throw error;
        }
    }

    /**
     * Build level generation prompt based on player profile and market trends
     */
    buildLevelPrompt(playerProfile, preferences, marketTrends) {
        return `
        Generate a match-3 level for a player with these characteristics:
        
        Player Profile:
        - Level: ${playerProfile.level || 1}
        - Preferred difficulty: ${playerProfile.preferredDifficulty || 'medium'}
        - Favorite power-ups: ${playerProfile.favoritePowerUps?.join(', ') || 'none'}
        - Play style: ${playerProfile.playStyle || 'casual'}
        - Session length: ${playerProfile.avgSessionLength || 5} minutes
        
        Market Trends:
        - Popular mechanics: ${marketTrends.popularMechanics?.join(', ') || 'standard'}
        - Trending themes: ${marketTrends.trendingThemes?.join(', ') || 'fantasy'}
        - Player preferences: ${marketTrends.playerPreferences?.join(', ') || 'variety'}
        
        Preferences:
        - Theme: ${preferences.theme || 'fantasy'}
        - Special elements: ${preferences.specialElements?.join(', ') || 'none'}
        - Objective type: ${preferences.objectiveType || 'score'}
        
        Create a level that maximizes engagement and follows industry best practices.
        `;
    }

    /**
     * Build story generation prompt
     */
    buildStoryPrompt(playerProfile, storyContext, chapter) {
        return `
        Generate story content for chapter ${chapter} based on:
        
        Player Profile:
        - Character name: ${playerProfile.characterName || 'Player'}
        - Story progress: ${storyContext.currentChapter || 1}
        - Choices made: ${storyContext.previousChoices?.join(', ') || 'none'}
        - Relationships: ${storyContext.relationships?.join(', ') || 'none'}
        
        Story Context:
        - Previous events: ${storyContext.previousEvents?.join(', ') || 'none'}
        - Current location: ${storyContext.currentLocation || 'unknown'}
        - Active quests: ${storyContext.activeQuests?.join(', ') || 'none'}
        
        Create engaging narrative content that continues the story naturally.
        `;
    }

    /**
     * Build event generation prompt
     */
    buildEventPrompt(playerSegment, marketTrends, currentEvents) {
        return `
        Generate a live event for player segment "${playerSegment}" considering:
        
        Market Trends:
        - Popular event types: ${marketTrends.popularEventTypes?.join(', ') || 'tournament'}
        - Trending themes: ${marketTrends.trendingThemes?.join(', ') || 'seasonal'}
        - Player engagement patterns: ${marketTrends.engagementPatterns?.join(', ') || 'daily'}
        
        Current Events:
        - Active events: ${currentEvents.active?.length || 0}
        - Recent events: ${currentEvents.recent?.join(', ') || 'none'}
        - Event gaps: ${currentEvents.gaps?.join(', ') || 'none'}
        
        Create an event that fills market gaps and maximizes player engagement.
        `;
    }

    /**
     * Build offer generation prompt
     */
    buildOfferPrompt(playerProfile, marketTrends, competitorOffers) {
        return `
        Generate a personalized offer for a player with:
        
        Player Profile:
        - Spending history: ${playerProfile.spendingHistory || 'low'}
        - Purchase frequency: ${playerProfile.purchaseFrequency || 'rare'}
        - Preferred items: ${playerProfile.preferredItems?.join(', ') || 'none'}
        - Price sensitivity: ${playerProfile.priceSensitivity || 'medium'}
        
        Market Trends:
        - Popular offer types: ${marketTrends.popularOfferTypes?.join(', ') || 'starter_pack'}
        - Average prices: ${marketTrends.averagePrices || 'unknown'}
        - Conversion rates: ${marketTrends.conversionRates || 'unknown'}
        
        Competitor Offers:
        - Similar offers: ${competitorOffers.similar?.join(', ') || 'none'}
        - Price points: ${competitorOffers.pricePoints?.join(', ') || 'unknown'}
        
        Create an offer that converts this specific player type.
        `;
    }

    /**
     * Get player profile for personalization
     */
    async getPlayerProfile(playerId) {
        try {
            const { data, error } = await this.supabase
                .from('player_profiles')
                .select('*')
                .eq('player_id', playerId)
                .single();

            if (error) {
                this.logger.warn('Player profile not found, using defaults', { playerId });
                return this.getDefaultPlayerProfile();
            }

            return data;
        } catch (error) {
            this.logger.error('Failed to get player profile', { error: error.message, playerId });
            return this.getDefaultPlayerProfile();
        }
    }

    /**
     * Get market trends from various sources
     */
    async getMarketTrends() {
        try {
            // This would integrate with market research APIs
            // For now, return cached trends
            return this.marketTrends.get('current') || {
                popularMechanics: ['special_combos', 'power_ups', 'obstacles'],
                trendingThemes: ['fantasy', 'space', 'underwater'],
                playerPreferences: ['variety', 'challenge', 'rewards'],
                popularEventTypes: ['tournament', 'limited_time', 'seasonal'],
                popularOfferTypes: ['starter_pack', 'energy_pack', 'premium_currency'],
                averagePrices: { starter_pack: 4.99, energy_pack: 1.99, premium_currency: 9.99 }
            };
        } catch (error) {
            this.logger.error('Failed to get market trends', { error: error.message });
            return {};
        }
    }

    /**
     * Store generated content in database
     */
    async storeGeneratedContent(type, content) {
        try {
            const { error } = await this.supabase
                .from('generated_content')
                .insert({
                    id: content.id,
                    type: type,
                    content: content,
                    generated_at: content.generatedAt,
                    player_id: content.playerId || null
                });

            if (error) {
                throw error;
            }

            this.logger.info(`Stored generated ${type} content`, { id: content.id });
        } catch (error) {
            this.logger.error('Failed to store generated content', { error: error.message });
            throw error;
        }
    }

    /**
     * Download image from URL
     */
    async downloadImage(url) {
        const response = await fetch(url);
        return Buffer.from(await response.arrayBuffer());
    }

    /**
     * Get default player profile
     */
    getDefaultPlayerProfile() {
        return {
            level: 1,
            preferredDifficulty: 'medium',
            favoritePowerUps: [],
            playStyle: 'casual',
            avgSessionLength: 5,
            characterName: 'Player',
            spendingHistory: 'low',
            purchaseFrequency: 'rare',
            preferredItems: [],
            priceSensitivity: 'medium'
        };
    }

    /**
     * Get story context for player
     */
    async getStoryContext(playerId) {
        try {
            const { data, error } = await this.supabase
                .from('story_progress')
                .select('*')
                .eq('player_id', playerId)
                .single();

            if (error) {
                return {
                    currentChapter: 1,
                    previousChoices: [],
                    relationships: [],
                    previousEvents: [],
                    currentLocation: 'starting_area',
                    activeQuests: []
                };
            }

            return data;
        } catch (error) {
            this.logger.error('Failed to get story context', { error: error.message, playerId });
            return {};
        }
    }

    /**
     * Get current events
     */
    async getCurrentEvents() {
        try {
            const { data, error } = await this.supabase
                .from('live_events')
                .select('*')
                .eq('status', 'active');

            if (error) {
                return { active: [], recent: [], gaps: [] };
            }

            return {
                active: data.map(e => e.name),
                recent: [],
                gaps: ['tournament', 'limited_time', 'seasonal']
            };
        } catch (error) {
            this.logger.error('Failed to get current events', { error: error.message });
            return { active: [], recent: [], gaps: [] };
        }
    }

    /**
     * Get competitor offers
     */
    async getCompetitorOffers() {
        // This would integrate with competitor analysis APIs
        return {
            similar: ['starter_pack', 'energy_pack'],
            pricePoints: ['1.99', '4.99', '9.99']
        };
    }

    /**
     * Generate level visuals
     */
    async generateLevelVisuals(levelData) {
        try {
            const visualPrompt = `Match-3 game level background, ${levelData.theme || 'fantasy'} theme, mobile game art style, colorful, engaging`;
            const visuals = await this.generateVisualAsset(visualPrompt);
            levelData.visuals = visuals;
        } catch (error) {
            this.logger.error('Failed to generate level visuals', { error: error.message });
        }
    }

    /**
     * Generate character images
     */
    async generateCharacterImages(storyData) {
        try {
            for (const character of storyData.characters || []) {
                const visualPrompt = `Game character, ${character.name}, ${character.description}, mobile game art style, friendly, colorful`;
                const visuals = await this.generateVisualAsset(visualPrompt);
                character.image = visuals;
            }
        } catch (error) {
            this.logger.error('Failed to generate character images', { error: error.message });
        }
    }

    /**
     * Generate event visuals
     */
    async generateEventVisuals(eventData) {
        try {
            const visualPrompt = `Game event banner, ${eventData.name}, ${eventData.type} event, mobile game art style, exciting, colorful`;
            const visuals = await this.generateVisualAsset(visualPrompt);
            eventData.visuals = visuals;
        } catch (error) {
            this.logger.error('Failed to generate event visuals', { error: error.message });
        }
    }
}

export { AIContentGenerator };