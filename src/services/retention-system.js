import { v4 as uuidv4 } from 'uuid';
import * as Sentry from '@sentry/node';
import { createClient } from 'redis';
import { MongoClient } from 'mongodb';

class RetentionSystem {
    constructor() {
        this.redis = null;
        this.mongodb = null;
        this.isInitialized = false;
        this.pushNotificationService = null;
        this.emailService = null;
        this.smsService = null;
        this.retentionCampaigns = new Map();
        this.playerStates = new Map();
    }

    async initialize() {
        try {
            console.log('🚀 Initializing Retention System...');
            
            // Initialize Redis for real-time data
            await this.initializeRedis();
            
            // Initialize MongoDB for historical data
            await this.initializeMongoDB();
            
            // Initialize notification services
            await this.initializeNotificationServices();
            
            // Load retention campaigns
            await this.loadRetentionCampaigns();
            
            // Start retention monitoring
            this.startRetentionMonitoring();
            
            this.isInitialized = true;
            console.log('✅ Retention System initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Retention System:', error);
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
            console.log('✅ Redis connected for retention system');
        } catch (error) {
            console.error('❌ Redis connection failed:', error);
        }
    }

    async initializeMongoDB() {
        try {
            const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
            await client.connect();
            this.mongodb = client.db('match3_retention');
            console.log('✅ MongoDB connected for retention system');
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error);
        }
    }

    async initializeNotificationServices() {
        // Initialize push notification service
        this.pushNotificationService = {
            send: async (userId, message, data = {}) => {
                console.log(`📱 Push notification sent to ${userId}: ${message}`);
                // Implement actual push notification service
            }
        };
        
        // Initialize email service
        this.emailService = {
            send: async (email, subject, template, data = {}) => {
                console.log(`📧 Email sent to ${email}: ${subject}`);
                // Implement actual email service
            }
        };
        
        // Initialize SMS service
        this.smsService = {
            send: async (phone, message) => {
                console.log(`📱 SMS sent to ${phone}: ${message}`);
                // Implement actual SMS service
            }
        };
    }

    async loadRetentionCampaigns() {
        try {
            if (this.mongodb) {
                const campaigns = await this.mongodb.collection('retention_campaigns').find({ status: 'active' }).toArray();
                campaigns.forEach(campaign => {
                    this.retentionCampaigns.set(campaign.id, campaign);
                });
            }
            console.log(`✅ Loaded ${this.retentionCampaigns.size} retention campaigns`);
        } catch (error) {
            console.error('❌ Failed to load retention campaigns:', error);
        }
    }

    startRetentionMonitoring() {
        // Check for at-risk players every 30 minutes
        setInterval(() => {
            this.checkAtRiskPlayers();
        }, 1800000);
        
        // Run retention campaigns every hour
        setInterval(() => {
            this.runRetentionCampaigns();
        }, 3600000);
        
        // Update player states every 5 minutes
        setInterval(() => {
            this.updatePlayerStates();
        }, 300000);
    }

    async checkAtRiskPlayers() {
        try {
            if (!this.mongodb) return;
            
            // Find players who haven't played in the last 24 hours
            const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
            
            const atRiskPlayers = await this.mongodb.collection('player_activity')
                .find({
                    lastActivity: { $lt: cutoffTime },
                    status: { $ne: 'churned' }
                })
                .toArray();
            
            for (const player of atRiskPlayers) {
                await this.analyzePlayerRisk(player);
            }
            
        } catch (error) {
            console.error('Failed to check at-risk players:', error);
        }
    }

    async analyzePlayerRisk(player) {
        try {
            const riskScore = await this.calculateRiskScore(player.userId);
            const riskLevel = this.determineRiskLevel(riskScore);
            
            // Update player state
            this.playerStates.set(player.userId, {
                ...player,
                riskScore,
                riskLevel,
                lastAnalyzed: new Date()
            });
            
            // Trigger appropriate retention action
            if (riskLevel === 'high') {
                await this.triggerRetentionAction(player.userId, 'high_risk');
            } else if (riskLevel === 'medium') {
                await this.triggerRetentionAction(player.userId, 'medium_risk');
            }
            
        } catch (error) {
            console.error('Failed to analyze player risk:', error);
        }
    }

    async calculateRiskScore(userId) {
        try {
            if (!this.mongodb) return 0;
            
            // Get player activity data
            const activities = await this.mongodb.collection('player_activity')
                .find({ userId })
                .sort({ timestamp: -1 })
                .limit(100)
                .toArray();
            
            if (activities.length === 0) return 1.0;
            
            let riskScore = 0;
            
            // Days since last activity
            const daysSinceLastActivity = (Date.now() - new Date(activities[0].timestamp).getTime()) / (1000 * 60 * 60 * 24);
            riskScore += Math.min(daysSinceLastActivity / 7, 1.0) * 0.4;
            
            // Session frequency trend
            const sessionFrequency = this.calculateSessionFrequency(activities);
            riskScore += (1 - sessionFrequency) * 0.3;
            
            // Spending behavior
            const spendingBehavior = this.calculateSpendingBehavior(activities);
            riskScore += (1 - spendingBehavior) * 0.2;
            
            // Engagement level
            const engagementLevel = this.calculateEngagementLevel(activities);
            riskScore += (1 - engagementLevel) * 0.1;
            
            return Math.min(riskScore, 1.0);
            
        } catch (error) {
            console.error('Failed to calculate risk score:', error);
            return 0.5;
        }
    }

    calculateSessionFrequency(activities) {
        const sessions = activities.filter(a => a.type === 'session_start');
        if (sessions.length < 2) return 0;
        
        const timeSpan = (new Date(sessions[0].timestamp) - new Date(sessions[sessions.length - 1].timestamp)) / (1000 * 60 * 60 * 24);
        return Math.min(sessions.length / timeSpan, 1.0);
    }

    calculateSpendingBehavior(activities) {
        const purchases = activities.filter(a => a.type === 'purchase');
        const totalSpent = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        // Normalize spending behavior (0-1 scale)
        return Math.min(totalSpent / 100, 1.0);
    }

    calculateEngagementLevel(activities) {
        const gameEvents = activities.filter(a => a.type === 'game_event');
        const avgSessionDuration = this.calculateAvgSessionDuration(activities);
        
        // Normalize engagement level (0-1 scale)
        const eventScore = Math.min(gameEvents.length / 100, 1.0);
        const durationScore = Math.min(avgSessionDuration / 1800, 1.0); // 30 minutes = 1.0
        
        return (eventScore + durationScore) / 2;
    }

    calculateAvgSessionDuration(activities) {
        const sessions = [];
        let currentSession = null;
        
        for (const activity of activities) {
            if (activity.type === 'session_start') {
                currentSession = { start: new Date(activity.timestamp) };
            } else if (activity.type === 'session_end' && currentSession) {
                currentSession.duration = new Date(activity.timestamp) - currentSession.start;
                sessions.push(currentSession);
                currentSession = null;
            }
        }
        
        if (sessions.length === 0) return 0;
        return sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length;
    }

    determineRiskLevel(riskScore) {
        if (riskScore >= 0.8) return 'high';
        if (riskScore >= 0.5) return 'medium';
        return 'low';
    }

    async triggerRetentionAction(userId, riskLevel) {
        try {
            const player = this.playerStates.get(userId);
            if (!player) return;
            
            // Select appropriate retention campaign
            const campaign = this.selectRetentionCampaign(riskLevel, player);
            if (!campaign) return;
            
            // Execute retention action
            await this.executeRetentionAction(userId, campaign);
            
            // Track retention action
            await this.trackRetentionAction(userId, campaign, riskLevel);
            
        } catch (error) {
            console.error('Failed to trigger retention action:', error);
        }
    }

    selectRetentionCampaign(riskLevel, player) {
        const campaigns = Array.from(this.retentionCampaigns.values())
            .filter(c => c.riskLevel === riskLevel && c.status === 'active');
        
        if (campaigns.length === 0) return null;
        
        // Select campaign based on player segment and preferences
        return campaigns.find(c => this.isCampaignSuitable(c, player)) || campaigns[0];
    }

    isCampaignSuitable(campaign, player) {
        // Check if campaign is suitable for player
        if (campaign.segments && !campaign.segments.includes(player.segment)) {
            return false;
        }
        
        if (campaign.minSpending && player.totalSpent < campaign.minSpending) {
            return false;
        }
        
        if (campaign.maxSpending && player.totalSpent > campaign.maxSpending) {
            return false;
        }
        
        return true;
    }

    async executeRetentionAction(userId, campaign) {
        try {
            switch (campaign.type) {
                case 'push_notification':
                    await this.sendPushNotification(userId, campaign);
                    break;
                case 'email':
                    await this.sendEmail(userId, campaign);
                    break;
                case 'sms':
                    await this.sendSMS(userId, campaign);
                    break;
                case 'in_game_offer':
                    await this.createInGameOffer(userId, campaign);
                    break;
                case 'comeback_bonus':
                    await this.createComebackBonus(userId, campaign);
                    break;
                default:
                    console.warn(`Unknown campaign type: ${campaign.type}`);
            }
        } catch (error) {
            console.error('Failed to execute retention action:', error);
        }
    }

    async sendPushNotification(userId, campaign) {
        const message = this.personalizeMessage(campaign.message, userId);
        await this.pushNotificationService.send(userId, message, campaign.data);
    }

    async sendEmail(userId, campaign) {
        const player = this.playerStates.get(userId);
        if (!player.email) return;
        
        const subject = this.personalizeMessage(campaign.subject, userId);
        const body = this.personalizeMessage(campaign.body, userId);
        
        await this.emailService.send(player.email, subject, 'retention', {
            body,
            playerName: player.name || 'Player',
            campaignData: campaign.data
        });
    }

    async sendSMS(userId, campaign) {
        const player = this.playerStates.get(userId);
        if (!player.phone) return;
        
        const message = this.personalizeMessage(campaign.message, userId);
        await this.smsService.send(player.phone, message);
    }

    async createInGameOffer(userId, campaign) {
        // Create in-game offer for player
        const offer = {
            id: uuidv4(),
            userId,
            type: campaign.offerType,
            title: this.personalizeMessage(campaign.title, userId),
            description: this.personalizeMessage(campaign.description, userId),
            discount: campaign.discount,
            originalPrice: campaign.originalPrice,
            discountedPrice: campaign.discountedPrice,
            expiresAt: new Date(Date.now() + campaign.duration * 1000),
            createdAt: new Date()
        };
        
        // Store offer in database
        if (this.mongodb) {
            await this.mongodb.collection('in_game_offers').insertOne(offer);
        }
        
        // Store in Redis for real-time access
        if (this.redis) {
            await this.redis.setex(`offer:${userId}`, campaign.duration, JSON.stringify(offer));
        }
    }

    async createComebackBonus(userId, campaign) {
        // Create comeback bonus for player
        const bonus = {
            id: uuidv4(),
            userId,
            type: 'comeback_bonus',
            rewards: campaign.rewards,
            expiresAt: new Date(Date.now() + campaign.duration * 1000),
            createdAt: new Date()
        };
        
        // Store bonus in database
        if (this.mongodb) {
            await this.mongodb.collection('comeback_bonuses').insertOne(bonus);
        }
        
        // Store in Redis for real-time access
        if (this.redis) {
            await this.redis.setex(`bonus:${userId}`, campaign.duration, JSON.stringify(bonus));
        }
    }

    personalizeMessage(template, userId) {
        const player = this.playerStates.get(userId);
        if (!player) return template;
        
        return template
            .replace('{playerName}', player.name || 'Player')
            .replace('{daysAway}', this.calculateDaysAway(player))
            .replace('{lastScore}', player.lastScore || 0)
            .replace('{level}', player.level || 1);
    }

    calculateDaysAway(player) {
        if (!player.lastActivity) return 0;
        return Math.floor((Date.now() - new Date(player.lastActivity).getTime()) / (1000 * 60 * 60 * 24));
    }

    async trackRetentionAction(userId, campaign, riskLevel) {
        try {
            const action = {
                id: uuidv4(),
                userId,
                campaignId: campaign.id,
                campaignType: campaign.type,
                riskLevel,
                timestamp: new Date(),
                status: 'sent'
            };
            
            if (this.mongodb) {
                await this.mongodb.collection('retention_actions').insertOne(action);
            }
            
        } catch (error) {
            console.error('Failed to track retention action:', error);
        }
    }

    async runRetentionCampaigns() {
        try {
            for (const [campaignId, campaign] of this.retentionCampaigns) {
                if (campaign.status === 'active' && this.shouldRunCampaign(campaign)) {
                    await this.executeCampaign(campaign);
                }
            }
        } catch (error) {
            console.error('Failed to run retention campaigns:', error);
        }
    }

    shouldRunCampaign(campaign) {
        const now = new Date();
        const lastRun = campaign.lastRun ? new Date(campaign.lastRun) : new Date(0);
        const interval = campaign.interval || 24 * 60 * 60 * 1000; // 24 hours default
        
        return (now - lastRun) >= interval;
    }

    async executeCampaign(campaign) {
        try {
            // Find target players
            const targetPlayers = await this.findTargetPlayers(campaign);
            
            // Execute campaign for each player
            for (const player of targetPlayers) {
                await this.executeRetentionAction(player.userId, campaign);
            }
            
            // Update campaign last run time
            campaign.lastRun = new Date();
            if (this.mongodb) {
                await this.mongodb.collection('retention_campaigns').updateOne(
                    { id: campaign.id },
                    { $set: { lastRun: campaign.lastRun } }
                );
            }
            
        } catch (error) {
            console.error('Failed to execute campaign:', error);
        }
    }

    async findTargetPlayers(campaign) {
        try {
            if (!this.mongodb) return [];
            
            const query = {
                status: { $ne: 'churned' }
            };
            
            // Add campaign-specific filters
            if (campaign.segments) {
                query.segment = { $in: campaign.segments };
            }
            
            if (campaign.minSpending) {
                query.totalSpent = { $gte: campaign.minSpending };
            }
            
            if (campaign.maxSpending) {
                query.totalSpent = { $lte: campaign.maxSpending };
            }
            
            return await this.mongodb.collection('player_activity').find(query).toArray();
            
        } catch (error) {
            console.error('Failed to find target players:', error);
            return [];
        }
    }

    async updatePlayerStates() {
        try {
            if (!this.mongodb) return;
            
            // Update player states based on recent activity
            const recentActivity = await this.mongodb.collection('player_activity')
                .find({
                    timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
                })
                .toArray();
            
            for (const activity of recentActivity) {
                await this.updatePlayerState(activity.userId, activity);
            }
            
        } catch (error) {
            console.error('Failed to update player states:', error);
        }
    }

    async updatePlayerState(userId, activity) {
        try {
            const currentState = this.playerStates.get(userId) || {
                userId,
                lastActivity: new Date(),
                status: 'active',
                riskScore: 0,
                riskLevel: 'low'
            };
            
            // Update state based on activity
            currentState.lastActivity = new Date(activity.timestamp);
            currentState.status = 'active';
            
            // Update specific fields based on activity type
            switch (activity.type) {
                case 'purchase':
                    currentState.totalSpent = (currentState.totalSpent || 0) + (activity.amount || 0);
                    break;
                case 'level_complete':
                    currentState.level = activity.level;
                    currentState.lastScore = activity.score;
                    break;
                case 'session_start':
                    currentState.sessionCount = (currentState.sessionCount || 0) + 1;
                    break;
            }
            
            this.playerStates.set(userId, currentState);
            
            // Store in database
            if (this.mongodb) {
                await this.mongodb.collection('player_activity').updateOne(
                    { userId },
                    { $set: currentState },
                    { upsert: true }
                );
            }
            
        } catch (error) {
            console.error('Failed to update player state:', error);
        }
    }

    async createRetentionCampaign(campaignData) {
        try {
            const campaign = {
                id: uuidv4(),
                name: campaignData.name,
                description: campaignData.description,
                type: campaignData.type,
                riskLevel: campaignData.riskLevel,
                segments: campaignData.segments || [],
                minSpending: campaignData.minSpending || 0,
                maxSpending: campaignData.maxSpending || Infinity,
                message: campaignData.message,
                subject: campaignData.subject,
                body: campaignData.body,
                offerType: campaignData.offerType,
                discount: campaignData.discount,
                originalPrice: campaignData.originalPrice,
                discountedPrice: campaignData.discountedPrice,
                rewards: campaignData.rewards || [],
                duration: campaignData.duration || 86400, // 24 hours
                interval: campaignData.interval || 86400, // 24 hours
                status: 'active',
                createdAt: new Date()
            };
            
            this.retentionCampaigns.set(campaign.id, campaign);
            
            if (this.mongodb) {
                await this.mongodb.collection('retention_campaigns').insertOne(campaign);
            }
            
            return campaign;
            
        } catch (error) {
            console.error('Failed to create retention campaign:', error);
            throw error;
        }
    }

    async getRetentionMetrics() {
        try {
            if (!this.mongodb) return null;
            
            const metrics = {
                totalPlayers: await this.mongodb.collection('player_activity').countDocuments(),
                activePlayers: await this.mongodb.collection('player_activity').countDocuments({
                    lastActivity: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                }),
                atRiskPlayers: await this.mongodb.collection('player_activity').countDocuments({
                    lastActivity: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                    status: { $ne: 'churned' }
                }),
                churnedPlayers: await this.mongodb.collection('player_activity').countDocuments({
                    status: 'churned'
                }),
                retentionRate: 0,
                churnRate: 0
            };
            
            metrics.retentionRate = metrics.totalPlayers > 0 ? metrics.activePlayers / metrics.totalPlayers : 0;
            metrics.churnRate = metrics.totalPlayers > 0 ? metrics.churnedPlayers / metrics.totalPlayers : 0;
            
            return metrics;
            
        } catch (error) {
            console.error('Failed to get retention metrics:', error);
            return null;
        }
    }

    async getPlayerRetentionData(userId) {
        try {
            const player = this.playerStates.get(userId);
            if (!player) return null;
            
            const metrics = await this.getRetentionMetrics();
            
            return {
                player,
                metrics,
                recommendations: this.generateRetentionRecommendations(player),
                campaigns: Array.from(this.retentionCampaigns.values())
                    .filter(c => this.isCampaignSuitable(c, player))
            };
            
        } catch (error) {
            console.error('Failed to get player retention data:', error);
            return null;
        }
    }

    generateRetentionRecommendations(player) {
        const recommendations = [];
        
        if (player.riskLevel === 'high') {
            recommendations.push('Send immediate retention offer');
            recommendations.push('Create personalized comeback bonus');
            recommendations.push('Send push notification with special offer');
        } else if (player.riskLevel === 'medium') {
            recommendations.push('Send engagement-focused content');
            recommendations.push('Offer limited-time discount');
            recommendations.push('Create social challenge');
        } else {
            recommendations.push('Maintain current engagement level');
            recommendations.push('Offer premium features');
            recommendations.push('Create achievement goals');
        }
        
        return recommendations;
    }
}

export default new RetentionSystem();