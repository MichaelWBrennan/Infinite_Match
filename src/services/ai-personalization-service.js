import { v4 as uuidv4 } from 'uuid';
import * as Sentry from '@sentry/node';
import { createClient } from 'redis';
import { MongoClient } from 'mongodb';

class AIPersonalizationService {
    constructor() {
        this.redis = null;
        this.mongodb = null;
        this.isInitialized = false;
        this.mlModels = new Map();
        this.playerProfiles = new Map();
        this.personalizationRules = new Map();
        this.predictionCache = new Map();
    }

    async initialize() {
        try {
            console.log('🚀 Initializing AI Personalization Service...');
            
            // Initialize Redis for real-time data
            await this.initializeRedis();
            
            // Initialize MongoDB for historical data
            await this.mongodb.initialize();
            
            // Initialize ML models
            await this.initializeMLModels();
            
            // Load personalization rules
            await this.loadPersonalizationRules();
            
            // Start model training
            this.startModelTraining();
            
            this.isInitialized = true;
            console.log('✅ AI Personalization Service initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize AI Personalization Service:', error);
            Sentry.captureException(error);
            throw error;
        }
    }

    async initializeRedis() {
        try {
            this.redis = createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379'
            });
            
            await this.redis.connect();
            console.log('✅ Redis connected for AI personalization');
        } catch (error) {
            console.error('❌ Redis connection failed:', error);
        }
    }

    async initializeMongoDB() {
        try {
            const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
            await client.connect();
            this.mongodb = client.db('match3_ai');
            console.log('✅ MongoDB connected for AI personalization');
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error);
        }
    }

    async initializeMLModels() {
        try {
            // Initialize churn prediction model
            this.mlModels.set('churn_prediction', {
                type: 'classification',
                features: ['session_frequency', 'spending_behavior', 'engagement_level', 'days_since_last_play'],
                model: null,
                accuracy: 0,
                lastTrained: null
            });
            
            // Initialize LTV prediction model
            this.mlModels.set('ltv_prediction', {
                type: 'regression',
                features: ['total_spent', 'session_duration', 'purchase_frequency', 'level_progress'],
                model: null,
                accuracy: 0,
                lastTrained: null
            });
            
            // Initialize difficulty adjustment model
            this.mlModels.set('difficulty_adjustment', {
                type: 'regression',
                features: ['level_completion_time', 'moves_used', 'powerups_used', 'player_skill'],
                model: null,
                accuracy: 0,
                lastTrained: null
            });
            
            // Initialize offer targeting model
            this.mlModels.set('offer_targeting', {
                type: 'classification',
                features: ['spending_tier', 'engagement_level', 'purchase_history', 'churn_risk'],
                model: null,
                accuracy: 0,
                lastTrained: null
            });
            
            console.log('✅ ML models initialized');
        } catch (error) {
            console.error('❌ ML models initialization failed:', error);
        }
    }

    async loadPersonalizationRules() {
        try {
            if (this.mongodb) {
                const rules = await this.mongodb.collection('personalization_rules').find({}).toArray();
                rules.forEach(rule => {
                    this.personalizationRules.set(rule.id, rule);
                });
            }
            console.log(`✅ Loaded ${this.personalizationRules.size} personalization rules`);
        } catch (error) {
            console.error('❌ Failed to load personalization rules:', error);
        }
    }

    startModelTraining() {
        // Train models every 6 hours
        setInterval(() => {
            this.trainAllModels();
        }, 6 * 60 * 60 * 1000);
        
        // Initial training
        setTimeout(() => {
            this.trainAllModels();
        }, 5000);
    }

    async trainAllModels() {
        try {
            console.log('🤖 Starting model training...');
            
            for (const [modelName, modelConfig] of this.mlModels) {
                await this.trainModel(modelName, modelConfig);
            }
            
            console.log('✅ Model training completed');
        } catch (error) {
            console.error('❌ Model training failed:', error);
        }
    }

    async trainModel(modelName, modelConfig) {
        try {
            // Get training data
            const trainingData = await this.getTrainingData(modelName);
            
            if (trainingData.length < 100) {
                console.warn(`Insufficient training data for ${modelName}: ${trainingData.length} samples`);
                return;
            }
            
            // Train model (simplified implementation)
            const model = await this.trainMLModel(modelName, trainingData);
            
            // Update model
            modelConfig.model = model;
            modelConfig.accuracy = this.calculateModelAccuracy(model, trainingData);
            modelConfig.lastTrained = new Date();
            
            // Store model
            if (this.mongodb) {
                await this.mongodb.collection('ml_models').updateOne(
                    { name: modelName },
                    { $set: { ...modelConfig, trainedAt: new Date() } },
                    { upsert: true }
                );
            }
            
            console.log(`✅ Model ${modelName} trained with accuracy: ${modelConfig.accuracy.toFixed(3)}`);
            
        } catch (error) {
            console.error(`❌ Failed to train model ${modelName}:`, error);
        }
    }

    async getTrainingData(modelName) {
        try {
            if (!this.mongodb) return [];
            
            const collection = this.mongodb.collection('player_behavior');
            const data = await collection.find({}).limit(10000).toArray();
            
            // Transform data based on model requirements
            return data.map(record => this.transformTrainingData(record, modelName));
            
        } catch (error) {
            console.error('Failed to get training data:', error);
            return [];
        }
    }

    transformTrainingData(record, modelName) {
        const modelConfig = this.mlModels.get(modelName);
        const features = {};
        
        modelConfig.features.forEach(feature => {
            features[feature] = this.extractFeature(record, feature);
        });
        
        return {
            features,
            target: this.extractTarget(record, modelName),
            timestamp: record.timestamp
        };
    }

    extractFeature(record, feature) {
        switch (feature) {
            case 'session_frequency':
                return record.sessionsPerDay || 0;
            case 'spending_behavior':
                return record.totalSpent || 0;
            case 'engagement_level':
                return record.engagementScore || 0;
            case 'days_since_last_play':
                return record.daysSinceLastPlay || 0;
            case 'total_spent':
                return record.totalSpent || 0;
            case 'session_duration':
                return record.avgSessionDuration || 0;
            case 'purchase_frequency':
                return record.purchaseFrequency || 0;
            case 'level_progress':
                return record.levelProgress || 0;
            case 'level_completion_time':
                return record.avgLevelCompletionTime || 0;
            case 'moves_used':
                return record.avgMovesUsed || 0;
            case 'powerups_used':
                return record.powerupsUsed || 0;
            case 'player_skill':
                return record.skillLevel || 0;
            case 'spending_tier':
                return record.spendingTier || 0;
            case 'purchase_history':
                return record.purchaseHistory || [];
            case 'churn_risk':
                return record.churnRisk || 0;
            default:
                return 0;
        }
    }

    extractTarget(record, modelName) {
        switch (modelName) {
            case 'churn_prediction':
                return record.churned ? 1 : 0;
            case 'ltv_prediction':
                return record.ltv || 0;
            case 'difficulty_adjustment':
                return record.optimalDifficulty || 0.5;
            case 'offer_targeting':
                return record.offerAccepted ? 1 : 0;
            default:
                return 0;
        }
    }

    async trainMLModel(modelName, trainingData) {
        // Simplified ML model training
        // In production, you would use a proper ML library like TensorFlow.js or scikit-learn
        
        const model = {
            name: modelName,
            weights: this.initializeWeights(trainingData[0].features),
            bias: 0,
            learningRate: 0.01,
            epochs: 100
        };
        
        // Simple gradient descent training
        for (let epoch = 0; epoch < model.epochs; epoch++) {
            for (const sample of trainingData) {
                const prediction = this.predict(model, sample.features);
                const error = sample.target - prediction;
                
                // Update weights
                Object.keys(model.weights).forEach(feature => {
                    model.weights[feature] += model.learningRate * error * sample.features[feature];
                });
                
                model.bias += model.learningRate * error;
            }
        }
        
        return model;
    }

    initializeWeights(features) {
        const weights = {};
        Object.keys(features).forEach(feature => {
            weights[feature] = Math.random() - 0.5;
        });
        return weights;
    }

    predict(model, features) {
        let prediction = model.bias;
        Object.keys(model.weights).forEach(feature => {
            prediction += model.weights[feature] * features[feature];
        });
        
        // Apply activation function based on model type
        if (model.name.includes('classification')) {
            return 1 / (1 + Math.exp(-prediction)); // Sigmoid
        } else {
            return prediction; // Linear
        }
    }

    calculateModelAccuracy(model, testData) {
        let correct = 0;
        let total = 0;
        
        for (const sample of testData) {
            const prediction = this.predict(model, sample.features);
            const actual = sample.target;
            
            if (model.name.includes('classification')) {
                if ((prediction > 0.5 && actual === 1) || (prediction <= 0.5 && actual === 0)) {
                    correct++;
                }
            } else {
                // For regression, use R² score
                const error = Math.abs(prediction - actual);
                if (error < 0.1) { // 10% tolerance
                    correct++;
                }
            }
            
            total++;
        }
        
        return total > 0 ? correct / total : 0;
    }

    async predictChurn(userId) {
        try {
            const cacheKey = `churn:${userId}`;
            
            // Check cache first
            if (this.predictionCache.has(cacheKey)) {
                const cached = this.predictionCache.get(cacheKey);
                if (Date.now() - cached.timestamp < 3600000) { // 1 hour cache
                    return cached.prediction;
                }
            }
            
            // Get player data
            const playerData = await this.getPlayerData(userId);
            if (!playerData) return 0.5;
            
            // Get model
            const model = this.mlModels.get('churn_prediction');
            if (!model.model) return 0.5;
            
            // Prepare features
            const features = {};
            model.features.forEach(feature => {
                features[feature] = this.extractFeature(playerData, feature);
            });
            
            // Make prediction
            const prediction = this.predict(model.model, features);
            
            // Cache result
            this.predictionCache.set(cacheKey, {
                prediction,
                timestamp: Date.now()
            });
            
            return prediction;
            
        } catch (error) {
            console.error('Failed to predict churn:', error);
            return 0.5;
        }
    }

    async predictLTV(userId) {
        try {
            const cacheKey = `ltv:${userId}`;
            
            // Check cache first
            if (this.predictionCache.has(cacheKey)) {
                const cached = this.predictionCache.get(cacheKey);
                if (Date.now() - cached.timestamp < 3600000) { // 1 hour cache
                    return cached.prediction;
                }
            }
            
            // Get player data
            const playerData = await this.getPlayerData(userId);
            if (!playerData) return 0;
            
            // Get model
            const model = this.mlModels.get('ltv_prediction');
            if (!model.model) return 0;
            
            // Prepare features
            const features = {};
            model.features.forEach(feature => {
                features[feature] = this.extractFeature(playerData, feature);
            });
            
            // Make prediction
            const prediction = this.predict(model.model, features);
            
            // Cache result
            this.predictionCache.set(cacheKey, {
                prediction,
                timestamp: Date.now()
            });
            
            return Math.max(0, prediction);
            
        } catch (error) {
            console.error('Failed to predict LTV:', error);
            return 0;
        }
    }

    async adjustDifficulty(userId, level, currentDifficulty) {
        try {
            // Get player data
            const playerData = await this.getPlayerData(userId);
            if (!playerData) return currentDifficulty;
            
            // Get model
            const model = this.mlModels.get('difficulty_adjustment');
            if (!model.model) return currentDifficulty;
            
            // Prepare features
            const features = {
                level_completion_time: playerData.avgLevelCompletionTime || 0,
                moves_used: playerData.avgMovesUsed || 0,
                powerups_used: playerData.powerupsUsed || 0,
                player_skill: playerData.skillLevel || 0
            };
            
            // Make prediction
            const optimalDifficulty = this.predict(model.model, features);
            
            // Clamp between 0.1 and 1.0
            return Math.max(0.1, Math.min(1.0, optimalDifficulty));
            
        } catch (error) {
            console.error('Failed to adjust difficulty:', error);
            return currentDifficulty;
        }
    }

    async targetOffer(userId, availableOffers) {
        try {
            // Get player data
            const playerData = await this.getPlayerData(userId);
            if (!playerData) return availableOffers[0];
            
            // Get model
            const model = this.mlModels.get('offer_targeting');
            if (!model.model) return availableOffers[0];
            
            let bestOffer = availableOffers[0];
            let bestScore = 0;
            
            // Score each offer
            for (const offer of availableOffers) {
                const features = {
                    spending_tier: playerData.spendingTier || 0,
                    engagement_level: playerData.engagementScore || 0,
                    purchase_history: playerData.purchaseHistory || [],
                    churn_risk: playerData.churnRisk || 0
                };
                
                // Add offer-specific features
                features.offer_type = offer.type || 0;
                features.offer_discount = offer.discount || 0;
                features.offer_price = offer.price || 0;
                
                const score = this.predict(model.model, features);
                
                if (score > bestScore) {
                    bestScore = score;
                    bestOffer = offer;
                }
            }
            
            return bestOffer;
            
        } catch (error) {
            console.error('Failed to target offer:', error);
            return availableOffers[0];
        }
    }

    async getPlayerData(userId) {
        try {
            if (this.mongodb) {
                const player = await this.mongodb.collection('player_behavior').findOne({ userId });
                return player;
            }
            return null;
        } catch (error) {
            console.error('Failed to get player data:', error);
            return null;
        }
    }

    async updatePlayerProfile(userId, eventData) {
        try {
            // Get current profile
            let profile = this.playerProfiles.get(userId) || {
                userId,
                totalSpent: 0,
                sessionsPerDay: 0,
                engagementScore: 0,
                skillLevel: 0,
                churnRisk: 0,
                ltv: 0,
                lastUpdated: new Date()
            };
            
            // Update profile based on event
            switch (eventData.eventName) {
                case 'purchase_made':
                    profile.totalSpent += eventData.properties.amount || 0;
                    break;
                case 'game_started':
                    profile.sessionsPerDay += 1;
                    break;
                case 'level_completed':
                    profile.skillLevel = Math.min(profile.skillLevel + 0.1, 1.0);
                    break;
                case 'match_made':
                    profile.engagementScore = Math.min(profile.engagementScore + 0.01, 1.0);
                    break;
            }
            
            // Update timestamps
            profile.lastUpdated = new Date();
            profile.lastActivity = new Date();
            
            // Store profile
            this.playerProfiles.set(userId, profile);
            
            // Store in database
            if (this.mongodb) {
                await this.mongodb.collection('player_behavior').updateOne(
                    { userId },
                    { $set: profile },
                    { upsert: true }
                );
            }
            
            // Update predictions
            await this.updatePlayerPredictions(userId, profile);
            
        } catch (error) {
            console.error('Failed to update player profile:', error);
        }
    }

    async updatePlayerPredictions(userId, profile) {
        try {
            // Update churn prediction
            const churnRisk = await this.predictChurn(userId);
            profile.churnRisk = churnRisk;
            
            // Update LTV prediction
            const ltv = await this.predictLTV(userId);
            profile.ltv = ltv;
            
            // Update profile
            this.playerProfiles.set(userId, profile);
            
        } catch (error) {
            console.error('Failed to update player predictions:', error);
        }
    }

    async getPersonalizedRecommendations(userId) {
        try {
            const profile = this.playerProfiles.get(userId);
            if (!profile) return [];
            
            const recommendations = [];
            
            // Churn prevention recommendations
            if (profile.churnRisk > 0.7) {
                recommendations.push({
                    type: 'churn_prevention',
                    priority: 'high',
                    message: 'Player at high risk of churning',
                    actions: ['send_retention_offer', 'create_comeback_bonus', 'send_push_notification']
                });
            }
            
            // Monetization recommendations
            if (profile.totalSpent > 0 && profile.ltv > 50) {
                recommendations.push({
                    type: 'monetization',
                    priority: 'medium',
                    message: 'High-value player - offer premium features',
                    actions: ['offer_premium_subscription', 'create_exclusive_offer']
                });
            }
            
            // Engagement recommendations
            if (profile.engagementScore < 0.3) {
                recommendations.push({
                    type: 'engagement',
                    priority: 'medium',
                    message: 'Low engagement - increase game appeal',
                    actions: ['adjust_difficulty', 'add_social_features', 'create_achievements']
                });
            }
            
            // Skill-based recommendations
            if (profile.skillLevel > 0.8) {
                recommendations.push({
                    type: 'skill',
                    priority: 'low',
                    message: 'High-skill player - offer advanced content',
                    actions: ['unlock_expert_levels', 'create_leaderboards', 'offer_competitions']
                });
            }
            
            return recommendations;
            
        } catch (error) {
            console.error('Failed to get personalized recommendations:', error);
            return [];
        }
    }

    async createPersonalizationRule(ruleData) {
        try {
            const rule = {
                id: uuidv4(),
                name: ruleData.name,
                description: ruleData.description,
                conditions: ruleData.conditions,
                actions: ruleData.actions,
                priority: ruleData.priority || 'medium',
                enabled: true,
                createdAt: new Date()
            };
            
            this.personalizationRules.set(rule.id, rule);
            
            if (this.mongodb) {
                await this.mongodb.collection('personalization_rules').insertOne(rule);
            }
            
            return rule;
            
        } catch (error) {
            console.error('Failed to create personalization rule:', error);
            throw error;
        }
    }

    async evaluatePersonalizationRules(userId) {
        try {
            const profile = this.playerProfiles.get(userId);
            if (!profile) return [];
            
            const triggeredRules = [];
            
            for (const [ruleId, rule] of this.personalizationRules) {
                if (!rule.enabled) continue;
                
                // Check if rule conditions are met
                if (this.evaluateRuleConditions(rule.conditions, profile)) {
                    triggeredRules.push({
                        ruleId,
                        rule,
                        actions: rule.actions
                    });
                }
            }
            
            return triggeredRules;
            
        } catch (error) {
            console.error('Failed to evaluate personalization rules:', error);
            return [];
        }
    }

    evaluateRuleConditions(conditions, profile) {
        for (const condition of conditions) {
            const value = this.getProfileValue(profile, condition.field);
            
            switch (condition.operator) {
                case 'gt':
                    if (value <= condition.value) return false;
                    break;
                case 'lt':
                    if (value >= condition.value) return false;
                    break;
                case 'eq':
                    if (value !== condition.value) return false;
                    break;
                case 'gte':
                    if (value < condition.value) return false;
                    break;
                case 'lte':
                    if (value > condition.value) return false;
                    break;
                default:
                    return false;
            }
        }
        
        return true;
    }

    getProfileValue(profile, field) {
        switch (field) {
            case 'totalSpent':
                return profile.totalSpent || 0;
            case 'sessionsPerDay':
                return profile.sessionsPerDay || 0;
            case 'engagementScore':
                return profile.engagementScore || 0;
            case 'skillLevel':
                return profile.skillLevel || 0;
            case 'churnRisk':
                return profile.churnRisk || 0;
            case 'ltv':
                return profile.ltv || 0;
            default:
                return 0;
        }
    }

    async getAIMetrics() {
        try {
            const metrics = {
                models: {},
                totalPlayers: this.playerProfiles.size,
                predictions: this.predictionCache.size,
                rules: this.personalizationRules.size
            };
            
            // Add model metrics
            for (const [modelName, modelConfig] of this.mlModels) {
                metrics.models[modelName] = {
                    accuracy: modelConfig.accuracy,
                    lastTrained: modelConfig.lastTrained,
                    features: modelConfig.features.length
                };
            }
            
            return metrics;
            
        } catch (error) {
            console.error('Failed to get AI metrics:', error);
            return null;
        }
    }
}

export default new AIPersonalizationService();