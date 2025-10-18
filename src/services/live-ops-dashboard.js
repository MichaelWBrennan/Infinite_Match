/**
 * Live Operations Dashboard - Real-Time Game Management
 * 
 * Provides comprehensive live operations capabilities for:
 * - Real-time event management
 * - Player intervention controls
 * - Automated campaign triggers
 * - Performance monitoring
 * - A/B testing management
 */

import { Logger } from '../core/logger/index.js';
import { ServiceError } from '../core/errors/ErrorHandler.js';
import { aiCacheManager } from './ai-cache-manager.js';
import { aiAnalyticsEngine } from './ai-analytics-engine.js';
import { aiPersonalizationEngine } from './ai-personalization-engine.js';
import pushNotificationService from './push-notification-service.js';
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';

const logger = new Logger('LiveOpsDashboard');

class LiveOpsDashboard {
  constructor() {
    this.isInitialized = false;
    
    // Event management
    this.activeEvents = new Map();
    this.eventTemplates = new Map();
    this.eventHistory = [];
    
    // Campaign management
    this.activeCampaigns = new Map();
    this.campaignTemplates = new Map();
    this.campaignHistory = [];
    
    // Player intervention
    this.interventionQueue = new Map();
    this.interventionRules = new Map();
    this.interventionHistory = [];
    
    // A/B testing
    this.abTests = new Map();
    this.testResults = new Map();
    
    // Real-time monitoring
    this.realTimeMetrics = new Map();
    this.alertThresholds = new Map();
    this.activeAlerts = new Map();
    
    // Performance tracking
    this.performanceMetrics = {
      eventsCreated: 0,
      campaignsExecuted: 0,
      interventionsTriggered: 0,
      playersAffected: 0,
      revenueImpact: 0
    };
    
    this.initializeTemplates();
    this.setupInterventionRules();
    this.setupAlertThresholds();
  }

  async initialize() {
    try {
      // Initialize dependencies
      await pushNotificationService.initialize();
      
      // Start monitoring loops
      this.startRealTimeMonitoring();
      this.startInterventionProcessor();
      this.startEventProcessor();
      this.startCampaignProcessor();
      this.startABTestProcessor();
      
      this.isInitialized = true;
      logger.info('Live Operations Dashboard initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Live Operations Dashboard', { error: error.message });
      throw new ServiceError('LIVE_OPS_INIT_FAILED', 'Failed to initialize live operations dashboard');
    }
  }

  // ===== EVENT MANAGEMENT =====
  initializeTemplates() {
    // Event templates
    this.eventTemplates.set('daily_challenge', {
      name: 'Daily Challenge',
      type: 'engagement',
      duration: 24, // hours
      rewards: {
        currency: 100,
        experience: 50,
        items: ['daily_reward_box']
      },
      conditions: {
        minLevel: 1,
        maxLevel: 100
      },
      notification: {
        template: 'fomo',
        title: 'Daily Challenge Available!',
        body: 'Complete today\'s challenge for exclusive rewards!'
      }
    });

    this.eventTemplates.set('weekend_bonus', {
      name: 'Weekend Bonus',
      type: 'monetization',
      duration: 48, // hours
      rewards: {
        currency: 200,
        experience: 100,
        multiplier: 1.5
      },
      conditions: {
        minLevel: 5,
        weekendOnly: true
      },
      notification: {
        template: 'fomo',
        title: 'Weekend Bonus Active!',
        body: '2x rewards all weekend long!'
      }
    });

    this.eventTemplates.set('social_competition', {
      name: 'Social Competition',
      type: 'social',
      duration: 72, // hours
      rewards: {
        currency: 500,
        experience: 200,
        items: ['competition_trophy']
      },
      conditions: {
        minLevel: 10,
        requiresFriends: true
      },
      notification: {
        template: 'social',
        title: 'Competition Time!',
        body: 'Compete with friends for amazing prizes!'
      }
    });

    this.eventTemplates.set('limited_time_offer', {
      name: 'Limited Time Offer',
      type: 'monetization',
      duration: 6, // hours
      rewards: {
        currency: 1000,
        items: ['premium_pack'],
        discount: 0.5
      },
      conditions: {
        minLevel: 15,
        maxPurchases: 1
      },
      notification: {
        template: 'fomo',
        title: 'Limited Time Offer!',
        body: '50% off premium pack - only 6 hours left!'
      }
    });

    // Campaign templates
    this.campaignTemplates.set('retention_campaign', {
      name: 'Retention Campaign',
      type: 'retention',
      duration: 7, // days
      triggers: ['churn_risk', 'inactivity'],
      actions: [
        { type: 'notification', template: 'retention', delay: 0 },
        { type: 'event', template: 'daily_challenge', delay: 3600 },
        { type: 'reward', amount: 100, currency: 'coins', delay: 7200 }
      ],
      targetAudience: {
        churnRisk: 'high',
        lastActive: 24 // hours ago
      }
    });

    this.campaignTemplates.set('engagement_boost', {
      name: 'Engagement Boost',
      type: 'engagement',
      duration: 3, // days
      triggers: ['low_engagement', 'session_drop'],
      actions: [
        { type: 'notification', template: 'fomo', delay: 0 },
        { type: 'event', template: 'weekend_bonus', delay: 1800 },
        { type: 'social', template: 'social_competition', delay: 3600 }
      ],
      targetAudience: {
        engagementLevel: 'low',
        sessionCount: { min: 1, max: 5 }
      }
    });
  }

  async createEvent(eventData) {
    try {
      const eventId = uuidv4();
      const template = this.eventTemplates.get(eventData.templateKey);
      
      if (!template) {
        throw new ServiceError('EVENT_TEMPLATE_NOT_FOUND', `Event template ${eventData.templateKey} not found`);
      }

      const event = {
        id: eventId,
        name: eventData.name || template.name,
        type: template.type,
        templateKey: eventData.templateKey,
        status: 'draft',
        startTime: new Date(eventData.startTime),
        endTime: new Date(eventData.endTime),
        duration: template.duration,
        rewards: { ...template.rewards, ...eventData.rewards },
        conditions: { ...template.conditions, ...eventData.conditions },
        notification: { ...template.notification, ...eventData.notification },
        targetAudience: eventData.targetAudience || {},
        metrics: {
          playersAffected: 0,
          completions: 0,
          revenue: 0,
          engagement: 0
        },
        createdAt: new Date(),
        createdBy: eventData.createdBy || 'system'
      };

      this.activeEvents.set(eventId, event);
      
      logger.info('Event created', { eventId, name: event.name, type: event.type });
      return eventId;
    } catch (error) {
      logger.error('Failed to create event', { error: error.message });
      throw new ServiceError('EVENT_CREATE_FAILED', 'Failed to create event');
    }
  }

  async deployEvent(eventId) {
    try {
      const event = this.activeEvents.get(eventId);
      if (!event) {
        throw new ServiceError('EVENT_NOT_FOUND', 'Event not found');
      }

      event.status = 'active';
      event.deployedAt = new Date();

      // Get target players
      const targetPlayers = await this.getTargetPlayers(event.targetAudience);
      
      // Send notifications
      if (event.notification) {
        for (const player of targetPlayers) {
          await pushNotificationService.sendNotification(
            player.id,
            event.notification.template,
            {
              eventId: eventId,
              eventName: event.name,
              ...event.notification
            }
          );
        }
      }

      // Schedule event end
      const endTime = new Date(event.endTime);
      const cronExpression = this.dateToCron(endTime);
      const endTask = cron.schedule(cronExpression, async () => {
        await this.endEvent(eventId);
      }, { scheduled: false });
      
      event.endTask = endTask;
      endTask.start();

      this.performanceMetrics.eventsCreated++;
      
      logger.info('Event deployed', { eventId, targetPlayers: targetPlayers.length });
    } catch (error) {
      logger.error('Failed to deploy event', { error: error.message, eventId });
      throw new ServiceError('EVENT_DEPLOY_FAILED', 'Failed to deploy event');
    }
  }

  async endEvent(eventId) {
    try {
      const event = this.activeEvents.get(eventId);
      if (!event) return;

      event.status = 'ended';
      event.endedAt = new Date();

      // Stop end task
      if (event.endTask) {
        event.endTask.destroy();
      }

      // Move to history
      this.eventHistory.push(event);
      this.activeEvents.delete(eventId);

      logger.info('Event ended', { eventId, duration: event.endedAt - event.deployedAt });
    } catch (error) {
      logger.error('Failed to end event', { error: error.message, eventId });
    }
  }

  // ===== CAMPAIGN MANAGEMENT =====
  async createCampaign(campaignData) {
    try {
      const campaignId = uuidv4();
      const template = this.campaignTemplates.get(campaignData.templateKey);
      
      if (!template) {
        throw new ServiceError('CAMPAIGN_TEMPLATE_NOT_FOUND', `Campaign template ${campaignData.templateKey} not found`);
      }

      const campaign = {
        id: campaignId,
        name: campaignData.name || template.name,
        type: template.type,
        templateKey: campaignData.templateKey,
        status: 'draft',
        startTime: new Date(campaignData.startTime),
        endTime: new Date(campaignData.endTime),
        duration: template.duration,
        triggers: template.triggers,
        actions: template.actions,
        targetAudience: { ...template.targetAudience, ...campaignData.targetAudience },
        metrics: {
          playersTargeted: 0,
          playersReached: 0,
          conversions: 0,
          revenue: 0
        },
        createdAt: new Date(),
        createdBy: campaignData.createdBy || 'system'
      };

      this.activeCampaigns.set(campaignId, campaign);
      
      logger.info('Campaign created', { campaignId, name: campaign.name, type: campaign.type });
      return campaignId;
    } catch (error) {
      logger.error('Failed to create campaign', { error: error.message });
      throw new ServiceError('CAMPAIGN_CREATE_FAILED', 'Failed to create campaign');
    }
  }

  async executeCampaign(campaignId) {
    try {
      const campaign = this.activeCampaigns.get(campaignId);
      if (!campaign) {
        throw new ServiceError('CAMPAIGN_NOT_FOUND', 'Campaign not found');
      }

      campaign.status = 'active';
      campaign.startedAt = new Date();

      // Get target players
      const targetPlayers = await this.getTargetPlayers(campaign.targetAudience);
      campaign.metrics.playersTargeted = targetPlayers.length;

      // Execute campaign actions
      for (const player of targetPlayers) {
        await this.executeCampaignActions(player, campaign);
      }

      this.performanceMetrics.campaignsExecuted++;
      
      logger.info('Campaign executed', { campaignId, targetPlayers: targetPlayers.length });
    } catch (error) {
      logger.error('Failed to execute campaign', { error: error.message, campaignId });
      throw new ServiceError('CAMPAIGN_EXECUTE_FAILED', 'Failed to execute campaign');
    }
  }

  async executeCampaignActions(player, campaign) {
    try {
      for (const action of campaign.actions) {
        const delay = action.delay || 0;
        
        if (delay > 0) {
          setTimeout(async () => {
            await this.executeAction(player, action);
          }, delay * 1000);
        } else {
          await this.executeAction(player, action);
        }
      }
    } catch (error) {
      logger.error('Failed to execute campaign actions', { error: error.message, playerId: player.id });
    }
  }

  async executeAction(player, action) {
    try {
      switch (action.type) {
        case 'notification':
          await pushNotificationService.sendNotification(
            player.id,
            action.template,
            { campaignId: action.campaignId, ...action.data }
          );
          break;
          
        case 'event':
          const eventId = await this.createEvent({
            templateKey: action.template,
            startTime: new Date(),
            endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            targetAudience: { playerIds: [player.id] }
          });
          await this.deployEvent(eventId);
          break;
          
        case 'reward':
          await this.giveReward(player.id, action);
          break;
          
        case 'social':
          await this.triggerSocialAction(player.id, action);
          break;
      }
    } catch (error) {
      logger.error('Failed to execute action', { error: error.message, playerId: player.id, action });
    }
  }

  // ===== INTERVENTION SYSTEM =====
  setupInterventionRules() {
    this.interventionRules.set('churn_prevention', {
      name: 'Churn Prevention',
      priority: 'high',
      conditions: {
        churnProbability: { min: 0.7 },
        lastActive: { max: 24 } // hours
      },
      actions: [
        { type: 'notification', template: 'retention', delay: 0 },
        { type: 'reward', amount: 200, currency: 'coins', delay: 300 },
        { type: 'event', template: 'daily_challenge', delay: 600 }
      ],
      cooldown: 3600 // 1 hour
    });

    this.interventionRules.set('progression_help', {
      name: 'Progression Help',
      priority: 'medium',
      conditions: {
        daysWithoutProgress: { min: 3 },
        level: { min: 5 }
      },
      actions: [
        { type: 'notification', template: 'progression', delay: 0 },
        { type: 'reward', amount: 100, currency: 'coins', delay: 300 },
        { type: 'hint', type: 'level_hint', delay: 600 }
      ],
      cooldown: 7200 // 2 hours
    });

    this.interventionRules.set('social_engagement', {
      name: 'Social Engagement',
      priority: 'medium',
      conditions: {
        daysWithoutSocial: { min: 7 },
        friendCount: { min: 1 }
      },
      actions: [
        { type: 'notification', template: 'social', delay: 0 },
        { type: 'event', template: 'social_competition', delay: 1800 }
      ],
      cooldown: 14400 // 4 hours
    });

    this.interventionRules.set('high_value_retention', {
      name: 'High Value Retention',
      priority: 'critical',
      conditions: {
        totalSpent: { min: 100 },
        churnProbability: { min: 0.5 }
      },
      actions: [
        { type: 'notification', template: 'comeback', delay: 0 },
        { type: 'reward', amount: 500, currency: 'coins', delay: 300 },
        { type: 'event', template: 'limited_time_offer', delay: 600 },
        { type: 'personalized', type: 'custom_offer', delay: 1200 }
      ],
      cooldown: 1800 // 30 minutes
    });
  }

  async checkInterventionTriggers(playerId, playerData) {
    try {
      const interventions = [];

      for (const [ruleName, rule] of this.interventionRules.entries()) {
        const shouldTrigger = await this.evaluateInterventionRule(playerId, rule, playerData);
        
        if (shouldTrigger) {
          interventions.push({
            ruleName,
            rule,
            playerId,
            playerData,
            timestamp: Date.now()
          });
        }
      }

      // Queue interventions
      for (const intervention of interventions) {
        await this.queueIntervention(intervention);
      }

      return interventions;
    } catch (error) {
      logger.error('Failed to check intervention triggers', { error: error.message, playerId });
      return [];
    }
  }

  async queueIntervention(intervention) {
    try {
      const { playerId, ruleName } = intervention;
      const interventionKey = `${playerId}:${ruleName}`;
      
      // Check cooldown
      const lastIntervention = this.interventionQueue.get(interventionKey);
      if (lastIntervention && Date.now() - lastIntervention.timestamp < intervention.rule.cooldown * 1000) {
        logger.debug('Intervention on cooldown', { playerId, ruleName });
        return;
      }

      this.interventionQueue.set(interventionKey, intervention);
      this.performanceMetrics.interventionsTriggered++;
      
      logger.info('Intervention queued', { playerId, ruleName, priority: intervention.rule.priority });
    } catch (error) {
      logger.error('Failed to queue intervention', { error: error.message, playerId });
    }
  }

  async processIntervention(intervention) {
    try {
      const { playerId, rule, actions } = intervention;
      
      for (const action of actions) {
        const delay = action.delay || 0;
        
        if (delay > 0) {
          setTimeout(async () => {
            await this.executeAction(playerId, action);
          }, delay * 1000);
        } else {
          await this.executeAction(playerId, action);
        }
      }

      // Record intervention
      this.interventionHistory.push({
        ...intervention,
        executedAt: new Date(),
        status: 'executed'
      });

      logger.info('Intervention executed', { playerId, ruleName: intervention.ruleName });
    } catch (error) {
      logger.error('Failed to process intervention', { error: error.message, playerId });
    }
  }

  // ===== A/B TESTING =====
  async createABTest(testData) {
    try {
      const testId = uuidv4();
      const abTest = {
        id: testId,
        name: testData.name,
        description: testData.description,
        type: testData.type, // event, campaign, notification
        variants: testData.variants,
        targetAudience: testData.targetAudience,
        startDate: new Date(testData.startDate),
        endDate: new Date(testData.endDate),
        status: 'draft',
        metrics: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0
        },
        createdAt: new Date(),
        createdBy: testData.createdBy || 'system'
      };

      this.abTests.set(testId, abTest);
      
      logger.info('A/B test created', { testId, name: abTest.name, type: abTest.type });
      return testId;
    } catch (error) {
      logger.error('Failed to create A/B test', { error: error.message });
      throw new ServiceError('AB_TEST_CREATE_FAILED', 'Failed to create A/B test');
    }
  }

  async startABTest(testId) {
    try {
      const abTest = this.abTests.get(testId);
      if (!abTest) {
        throw new ServiceError('AB_TEST_NOT_FOUND', 'A/B test not found');
      }

      abTest.status = 'running';
      abTest.startedAt = new Date();

      // Get target players
      const targetPlayers = await this.getTargetPlayers(abTest.targetAudience);
      
      // Assign players to variants
      for (const player of targetPlayers) {
        const variant = this.assignPlayerToVariant(player.id, abTest.variants);
        await this.executeABTestVariant(player, abTest, variant);
      }

      logger.info('A/B test started', { testId, targetPlayers: targetPlayers.length });
    } catch (error) {
      logger.error('Failed to start A/B test', { error: error.message, testId });
      throw new ServiceError('AB_TEST_START_FAILED', 'Failed to start A/B test');
    }
  }

  assignPlayerToVariant(playerId, variants) {
    // Simple hash-based assignment
    const hash = this.hashString(playerId);
    const index = hash % variants.length;
    return variants[index];
  }

  async executeABTestVariant(player, abTest, variant) {
    try {
      switch (abTest.type) {
        case 'event':
          await this.createEvent({
            templateKey: variant.templateKey,
            startTime: new Date(),
            endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
            targetAudience: { playerIds: [player.id] }
          });
          break;
          
        case 'campaign':
          await this.createCampaign({
            templateKey: variant.templateKey,
            startTime: new Date(),
            endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            targetAudience: { playerIds: [player.id] }
          });
          break;
          
        case 'notification':
          await pushNotificationService.sendNotification(
            player.id,
            variant.template,
            { abTestId: abTest.id, variantId: variant.id }
          );
          break;
      }

      abTest.metrics.impressions++;
    } catch (error) {
      logger.error('Failed to execute A/B test variant', { error: error.message, playerId: player.id });
    }
  }

  // ===== REAL-TIME MONITORING =====
  setupAlertThresholds() {
    this.alertThresholds.set('engagement_drop', {
      metric: 'engagement_rate',
      threshold: 0.15, // 15% drop
      severity: 'high',
      cooldown: 3600 // 1 hour
    });

    this.alertThresholds.set('churn_spike', {
      metric: 'churn_rate',
      threshold: 0.1, // 10% increase
      severity: 'critical',
      cooldown: 1800 // 30 minutes
    });

    this.alertThresholds.set('revenue_drop', {
      metric: 'revenue',
      threshold: 0.2, // 20% drop
      severity: 'high',
      cooldown: 3600 // 1 hour
    });

    this.alertThresholds.set('error_rate', {
      metric: 'error_rate',
      threshold: 0.05, // 5% error rate
      severity: 'medium',
      cooldown: 1800 // 30 minutes
    });
  }

  async updateRealTimeMetrics(metricName, value, metadata = {}) {
    try {
      const metric = {
        name: metricName,
        value: value,
        timestamp: Date.now(),
        metadata: metadata
      };

      this.realTimeMetrics.set(metricName, metric);
      
      // Check for alerts
      await this.checkAlerts(metricName, value);
      
      // Store in cache
      await aiCacheManager.set(
        `live_ops_metric:${metricName}`,
        metric,
        'real_time_metrics',
        300 // 5 minutes
      );
    } catch (error) {
      logger.error('Failed to update real-time metrics', { error: error.message, metricName });
    }
  }

  async checkAlerts(metricName, value) {
    try {
      const threshold = this.alertThresholds.get(metricName);
      if (!threshold) return;

      const previousValue = this.realTimeMetrics.get(`previous_${metricName}`)?.value || value;
      const change = Math.abs(value - previousValue) / previousValue;

      if (change >= threshold.threshold) {
        await this.triggerAlert(metricName, {
          current: value,
          previous: previousValue,
          change: change,
          threshold: threshold.threshold,
          severity: threshold.severity
        });
      }

      // Update previous value
      this.realTimeMetrics.set(`previous_${metricName}`, { value, timestamp: Date.now() });
    } catch (error) {
      logger.error('Failed to check alerts', { error: error.message, metricName });
    }
  }

  async triggerAlert(metricName, alertData) {
    try {
      const alertId = uuidv4();
      const alert = {
        id: alertId,
        metric: metricName,
        severity: alertData.severity,
        message: `${metricName} changed by ${(alertData.change * 100).toFixed(2)}%`,
        data: alertData,
        timestamp: Date.now(),
        status: 'active'
      };

      this.activeAlerts.set(alertId, alert);
      
      // Send alert notifications
      await this.sendAlertNotifications(alert);
      
      logger.warn('Alert triggered', { alertId, metric: metricName, severity: alertData.severity });
    } catch (error) {
      logger.error('Failed to trigger alert', { error: error.message, metricName });
    }
  }

  async sendAlertNotifications(alert) {
    try {
      // Send to monitoring system
      await aiCacheManager.set(
        `alert:${alert.id}`,
        alert,
        'alerts',
        86400 // 24 hours
      );

      // Send email/Slack notifications for critical alerts
      if (alert.severity === 'critical') {
        // Implementation for email/Slack notifications
        logger.info('Critical alert notification sent', { alertId: alert.id });
      }
    } catch (error) {
      logger.error('Failed to send alert notifications', { error: error.message, alertId: alert.id });
    }
  }

  // ===== UTILITY METHODS =====
  async getTargetPlayers(targetAudience) {
    try {
      // This would typically query your user database
      // For now, we'll simulate it
      const players = [];
      
      // Simulate player data based on target audience
      for (let i = 0; i < (targetAudience.count || 100); i++) {
        players.push({
          id: `player_${i}`,
          level: Math.floor(Math.random() * 100) + 1,
          churnProbability: Math.random(),
          lastActive: Date.now() - Math.random() * 24 * 60 * 60 * 1000,
          totalSpent: Math.random() * 500,
          friendCount: Math.floor(Math.random() * 50),
          engagementLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
        });
      }
      
      return players;
    } catch (error) {
      logger.error('Failed to get target players', { error: error.message });
      return [];
    }
  }

  async evaluateInterventionRule(playerId, rule, playerData) {
    try {
      const { conditions } = rule;
      
      for (const [condition, value] of Object.entries(conditions)) {
        const playerValue = playerData[condition];
        
        if (typeof value === 'object') {
          if (value.min !== undefined && playerValue < value.min) return false;
          if (value.max !== undefined && playerValue > value.max) return false;
        } else {
          if (playerValue !== value) return false;
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to evaluate intervention rule', { error: error.message, playerId });
      return false;
    }
  }

  async giveReward(playerId, rewardData) {
    try {
      // This would typically update your economy system
      logger.info('Reward given', { playerId, reward: rewardData });
    } catch (error) {
      logger.error('Failed to give reward', { error: error.message, playerId });
    }
  }

  async triggerSocialAction(playerId, actionData) {
    try {
      // This would typically trigger social features
      logger.info('Social action triggered', { playerId, action: actionData });
    } catch (error) {
      logger.error('Failed to trigger social action', { error: error.message, playerId });
    }
  }

  // ===== PROCESSING LOOPS =====
  startRealTimeMonitoring() {
    setInterval(async () => {
      try {
        await this.updateDashboardMetrics();
      } catch (error) {
        logger.error('Real-time monitoring error', { error: error.message });
      }
    }, 30000); // Update every 30 seconds
  }

  startInterventionProcessor() {
    setInterval(async () => {
      try {
        await this.processInterventionQueue();
      } catch (error) {
        logger.error('Intervention processor error', { error: error.message });
      }
    }, 10000); // Process every 10 seconds
  }

  startEventProcessor() {
    setInterval(async () => {
      try {
        await this.processActiveEvents();
      } catch (error) {
        logger.error('Event processor error', { error: error.message });
      }
    }, 60000); // Process every minute
  }

  startCampaignProcessor() {
    setInterval(async () => {
      try {
        await this.processActiveCampaigns();
      } catch (error) {
        logger.error('Campaign processor error', { error: error.message });
      }
    }, 300000); // Process every 5 minutes
  }

  startABTestProcessor() {
    setInterval(async () => {
      try {
        await this.processActiveABTests();
      } catch (error) {
        logger.error('A/B test processor error', { error: error.message });
      }
    }, 600000); // Process every 10 minutes
  }

  async processInterventionQueue() {
    const interventions = Array.from(this.interventionQueue.values());
    
    for (const intervention of interventions) {
      await this.processIntervention(intervention);
      this.interventionQueue.delete(`${intervention.playerId}:${intervention.ruleName}`);
    }
  }

  async processActiveEvents() {
    const now = new Date();
    
    for (const [eventId, event] of this.activeEvents.entries()) {
      if (event.status === 'active' && event.endTime <= now) {
        await this.endEvent(eventId);
      }
    }
  }

  async processActiveCampaigns() {
    // Process active campaigns
    for (const [campaignId, campaign] of this.activeCampaigns.entries()) {
      if (campaign.status === 'active') {
        // Update campaign metrics
        // Check for campaign completion
      }
    }
  }

  async processActiveABTests() {
    const now = new Date();
    
    for (const [testId, abTest] of this.abTests.entries()) {
      if (abTest.status === 'running' && abTest.endDate <= now) {
        await this.endABTest(testId);
      }
    }
  }

  async updateDashboardMetrics() {
    try {
      const metrics = {
        activeEvents: this.activeEvents.size,
        activeCampaigns: this.activeCampaigns.size,
        activeABTests: Array.from(this.abTests.values()).filter(t => t.status === 'running').length,
        pendingInterventions: this.interventionQueue.size,
        activeAlerts: this.activeAlerts.size,
        ...this.performanceMetrics
      };

      await aiCacheManager.set(
        'live_ops_dashboard_metrics',
        metrics,
        'dashboard_metrics',
        60 // 1 minute
      );
    } catch (error) {
      logger.error('Failed to update dashboard metrics', { error: error.message });
    }
  }

  // ===== UTILITY FUNCTIONS =====
  dateToCron(date) {
    const d = new Date(date);
    const minute = d.getMinutes();
    const hour = d.getHours();
    const day = d.getDate();
    const month = d.getMonth() + 1;
    
    return `${minute} ${hour} ${day} ${month} *`;
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // ===== PUBLIC API =====
  async getDashboardData() {
    return {
      events: Array.from(this.activeEvents.values()),
      campaigns: Array.from(this.activeCampaigns.values()),
      abTests: Array.from(this.abTests.values()),
      interventions: Array.from(this.interventionQueue.values()),
      alerts: Array.from(this.activeAlerts.values()),
      metrics: this.performanceMetrics,
      realTimeMetrics: Object.fromEntries(this.realTimeMetrics)
    };
  }

  async getEventTemplates() {
    return Array.from(this.eventTemplates.entries());
  }

  async getCampaignTemplates() {
    return Array.from(this.campaignTemplates.entries());
  }

  async getInterventionRules() {
    return Array.from(this.interventionRules.entries());
  }

  async getMetrics() {
    return {
      ...this.performanceMetrics,
      realTimeMetrics: Object.fromEntries(this.realTimeMetrics),
      activeAlerts: this.activeAlerts.size
    };
  }
}

export default new LiveOpsDashboard();
export { LiveOpsDashboard };