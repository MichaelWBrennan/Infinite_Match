/**
 * Push Notification Service - 24/7 Engagement Engine
 * 
 * Provides comprehensive push notification capabilities for:
 * - Real-time engagement triggers
 * - Retention campaigns
 * - FOMO event notifications
 * - Social engagement prompts
 * - Automated intervention
 */

import { Logger } from '../core/logger/index.js';
import { ServiceError } from '../core/errors/ErrorHandler.js';
import { aiCacheManager } from './ai-cache-manager.js';
import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';

const logger = new Logger('PushNotificationService');

class PushNotificationService {
  constructor() {
    this.fcm = null;
    this.apns = null;
    this.isInitialized = false;
    
    // Notification queues and scheduling
    this.notificationQueue = new Map();
    this.scheduledNotifications = new Map();
    this.campaigns = new Map();
    this.userPreferences = new Map();
    
    // Engagement tracking
    this.engagementMetrics = {
      notificationsSent: 0,
      notificationsDelivered: 0,
      notificationsOpened: 0,
      engagementRate: 0,
      retentionImpact: 0
    };
    
    // Notification templates
    this.templates = new Map();
    this.initializeTemplates();
    
    // A/B testing
    this.abTests = new Map();
    this.testGroups = new Map();
    
    // Real-time intervention triggers
    this.interventionTriggers = new Map();
    this.setupInterventionTriggers();
  }

  async initialize() {
    try {
      // Initialize Firebase Admin SDK
      if (!admin.apps.length) {
        const serviceAccount = {
          type: "service_account",
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: "https://accounts.google.com/o/oauth2/auth",
          token_uri: "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
        };

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: process.env.FIREBASE_DATABASE_URL
        });
      }

      this.fcm = admin.messaging();
      this.isInitialized = true;
      
      // Start notification processing
      this.startNotificationProcessor();
      this.startScheduledNotifications();
      this.startEngagementMonitoring();
      
      logger.info('Push Notification Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Push Notification Service', { error: error.message });
      throw new ServiceError('PUSH_NOTIFICATION_INIT_FAILED', 'Failed to initialize push notification service');
    }
  }

  // ===== NOTIFICATION TEMPLATES =====
  initializeTemplates() {
    this.templates.set('retention', {
      title: "We miss you! 🎮",
      body: "Your daily streak is waiting for you!",
      data: { type: 'retention', action: 'daily_streak' },
      priority: 'high',
      ttl: 3600
    });

    this.templates.set('fomo', {
      title: "Limited Time Event! ⏰",
      body: "Special rewards available for the next 2 hours!",
      data: { type: 'fomo', action: 'limited_event' },
      priority: 'high',
      ttl: 7200
    });

    this.templates.set('social', {
      title: "Your friend is playing! 👥",
      body: "Join them for a multiplayer challenge!",
      data: { type: 'social', action: 'friend_activity' },
      priority: 'medium',
      ttl: 1800
    });

    this.templates.set('progression', {
      title: "Need help? 💡",
      body: "We've got tips to help you advance!",
      data: { type: 'progression', action: 'help_tips' },
      priority: 'medium',
      ttl: 3600
    });

    this.templates.set('comeback', {
      title: "Welcome back! 🎉",
      body: "Special comeback bonus waiting for you!",
      data: { type: 'comeback', action: 'welcome_bonus' },
      priority: 'high',
      ttl: 86400
    });

    this.templates.set('achievement', {
      title: "Achievement Unlocked! 🏆",
      body: "You've earned a new achievement!",
      data: { type: 'achievement', action: 'view_achievement' },
      priority: 'low',
      ttl: 86400
    });
  }

  // ===== CORE NOTIFICATION METHODS =====
  async sendNotification(userId, templateKey, customData = {}) {
    try {
      if (!this.isInitialized) {
        throw new ServiceError('SERVICE_NOT_INITIALIZED', 'Push notification service not initialized');
      }

      const template = this.templates.get(templateKey);
      if (!template) {
        throw new ServiceError('TEMPLATE_NOT_FOUND', `Template ${templateKey} not found`);
      }

      // Get user's FCM token
      const userToken = await this.getUserFCMToken(userId);
      if (!userToken) {
        logger.warn('No FCM token found for user', { userId });
        return false;
      }

      // Check user preferences
      const preferences = await this.getUserPreferences(userId);
      if (!this.shouldSendNotification(userId, templateKey, preferences)) {
        logger.debug('Notification blocked by user preferences', { userId, templateKey });
        return false;
      }

      // Apply A/B testing
      const abTestResult = await this.applyABTesting(userId, templateKey);
      const finalTemplate = { ...template, ...abTestResult };

      // Create notification payload
      const payload = {
        token: userToken,
        notification: {
          title: finalTemplate.title,
          body: finalTemplate.body,
          icon: 'ic_notification',
          sound: 'default',
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        data: {
          ...finalTemplate.data,
          ...customData,
          userId: userId,
          timestamp: Date.now().toString(),
          campaignId: customData.campaignId || 'default'
        },
        android: {
          priority: finalTemplate.priority,
          ttl: finalTemplate.ttl * 1000,
          notification: {
            icon: 'ic_notification',
            color: '#FF6B6B',
            sound: 'default',
            channel_id: 'game_notifications'
          }
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: finalTemplate.title,
                body: finalTemplate.body
              },
              sound: 'default',
              badge: 1,
              category: 'GAME_NOTIFICATION'
            }
          }
        }
      };

      // Send notification
      const response = await this.fcm.send(payload);
      
      // Track metrics
      this.engagementMetrics.notificationsSent++;
      await this.trackNotificationSent(userId, templateKey, response);
      
      logger.info('Push notification sent successfully', { 
        userId, 
        templateKey, 
        messageId: response 
      });

      return true;
    } catch (error) {
      logger.error('Failed to send push notification', { 
        error: error.message, 
        userId, 
        templateKey 
      });
      throw new ServiceError('PUSH_NOTIFICATION_SEND_FAILED', 'Failed to send push notification');
    }
  }

  // ===== BATCH NOTIFICATIONS =====
  async sendBatchNotifications(notifications) {
    try {
      const validNotifications = [];
      
      for (const notification of notifications) {
        const { userId, templateKey, customData } = notification;
        const userToken = await this.getUserFCMToken(userId);
        
        if (userToken) {
          const template = this.templates.get(templateKey);
          if (template) {
            validNotifications.push({
              token: userToken,
              notification: {
                title: template.title,
                body: template.body
              },
              data: {
                ...template.data,
                ...customData,
                userId: userId
              }
            });
          }
        }
      }

      if (validNotifications.length === 0) {
        logger.warn('No valid notifications to send in batch');
        return { successCount: 0, failureCount: 0 };
      }

      // Send batch notifications
      const response = await this.fcm.sendAll(validNotifications);
      
      this.engagementMetrics.notificationsSent += response.successCount;
      
      logger.info('Batch notifications sent', { 
        successCount: response.successCount, 
        failureCount: response.failureCount 
      });

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses
      };
    } catch (error) {
      logger.error('Failed to send batch notifications', { error: error.message });
      throw new ServiceError('BATCH_NOTIFICATION_SEND_FAILED', 'Failed to send batch notifications');
    }
  }

  // ===== SCHEDULED NOTIFICATIONS =====
  async scheduleNotification(userId, templateKey, scheduleTime, customData = {}) {
    try {
      const notificationId = uuidv4();
      const scheduledNotification = {
        id: notificationId,
        userId,
        templateKey,
        scheduleTime: new Date(scheduleTime),
        customData,
        status: 'scheduled',
        createdAt: new Date()
      };

      this.scheduledNotifications.set(notificationId, scheduledNotification);
      
      // Schedule with cron
      const cronExpression = this.dateToCron(scheduleTime);
      const task = cron.schedule(cronExpression, async () => {
        await this.sendScheduledNotification(notificationId);
      }, { scheduled: false });

      scheduledNotification.cronTask = task;
      task.start();

      logger.info('Notification scheduled', { 
        notificationId, 
        userId, 
        scheduleTime 
      });

      return notificationId;
    } catch (error) {
      logger.error('Failed to schedule notification', { error: error.message });
      throw new ServiceError('NOTIFICATION_SCHEDULE_FAILED', 'Failed to schedule notification');
    }
  }

  async sendScheduledNotification(notificationId) {
    try {
      const scheduledNotification = this.scheduledNotifications.get(notificationId);
      if (!scheduledNotification) {
        logger.warn('Scheduled notification not found', { notificationId });
        return;
      }

      const { userId, templateKey, customData } = scheduledNotification;
      
      // Check if user is still active (not playing)
      const isUserActive = await this.isUserCurrentlyActive(userId);
      if (isUserActive) {
        logger.debug('User is active, skipping scheduled notification', { userId });
        scheduledNotification.status = 'skipped';
        return;
      }

      // Send notification
      const success = await this.sendNotification(userId, templateKey, customData);
      
      scheduledNotification.status = success ? 'sent' : 'failed';
      scheduledNotification.sentAt = new Date();
      
      // Clean up
      if (scheduledNotification.cronTask) {
        scheduledNotification.cronTask.destroy();
      }

      logger.info('Scheduled notification processed', { 
        notificationId, 
        success 
      });
    } catch (error) {
      logger.error('Failed to send scheduled notification', { 
        error: error.message, 
        notificationId 
      });
    }
  }

  // ===== CAMPAIGN MANAGEMENT =====
  async createCampaign(campaignData) {
    try {
      const campaignId = uuidv4();
      const campaign = {
        id: campaignId,
        name: campaignData.name,
        type: campaignData.type, // retention, engagement, monetization
        targetAudience: campaignData.targetAudience,
        notifications: campaignData.notifications,
        schedule: campaignData.schedule,
        status: 'draft',
        createdAt: new Date(),
        metrics: {
          sent: 0,
          delivered: 0,
          opened: 0,
          converted: 0
        }
      };

      this.campaigns.set(campaignId, campaign);
      
      logger.info('Campaign created', { campaignId, name: campaign.name });
      return campaignId;
    } catch (error) {
      logger.error('Failed to create campaign', { error: error.message });
      throw new ServiceError('CAMPAIGN_CREATE_FAILED', 'Failed to create campaign');
    }
  }

  async executeCampaign(campaignId) {
    try {
      const campaign = this.campaigns.get(campaignId);
      if (!campaign) {
        throw new ServiceError('CAMPAIGN_NOT_FOUND', 'Campaign not found');
      }

      campaign.status = 'running';
      campaign.startedAt = new Date();

      // Get target users
      const targetUsers = await this.getTargetUsers(campaign.targetAudience);
      
      // Send notifications
      for (const user of targetUsers) {
        for (const notification of campaign.notifications) {
          const delay = notification.delay || 0;
          
          if (delay > 0) {
            await this.scheduleNotification(
              user.id,
              notification.templateKey,
              new Date(Date.now() + delay * 1000),
              { ...notification.customData, campaignId }
            );
          } else {
            await this.sendNotification(
              user.id,
              notification.templateKey,
              { ...notification.customData, campaignId }
            );
          }
        }
      }

      logger.info('Campaign executed', { campaignId, targetUsers: targetUsers.length });
    } catch (error) {
      logger.error('Failed to execute campaign', { error: error.message, campaignId });
      throw new ServiceError('CAMPAIGN_EXECUTE_FAILED', 'Failed to execute campaign');
    }
  }

  // ===== INTERVENTION SYSTEM =====
  setupInterventionTriggers() {
    this.interventionTriggers.set('churn_risk', {
      threshold: 0.7,
      action: 'send_retention_notification',
      template: 'retention',
      priority: 'high'
    });

    this.interventionTriggers.set('progression_stall', {
      threshold: 3, // days without progress
      action: 'send_help_notification',
      template: 'progression',
      priority: 'medium'
    });

    this.interventionTriggers.set('social_isolation', {
      threshold: 7, // days without social activity
      action: 'send_social_notification',
      template: 'social',
      priority: 'medium'
    });

    this.interventionTriggers.set('high_value_player', {
      threshold: 100, // high spending
      action: 'send_premium_notification',
      template: 'achievement',
      priority: 'low'
    });
  }

  async checkInterventionTriggers(userId, playerData) {
    try {
      const interventions = [];

      for (const [triggerName, trigger] of this.interventionTriggers.entries()) {
        const shouldTrigger = await this.evaluateTrigger(userId, triggerName, playerData);
        
        if (shouldTrigger) {
          interventions.push({
            trigger: triggerName,
            action: trigger.action,
            template: trigger.template,
            priority: trigger.priority,
            playerData
          });
        }
      }

      // Execute interventions
      for (const intervention of interventions) {
        await this.executeIntervention(userId, intervention);
      }

      return interventions;
    } catch (error) {
      logger.error('Failed to check intervention triggers', { error: error.message, userId });
      return [];
    }
  }

  async executeIntervention(userId, intervention) {
    try {
      const { action, template, priority } = intervention;
      
      switch (action) {
        case 'send_retention_notification':
          await this.sendNotification(userId, template, {
            intervention: true,
            priority,
            data: intervention.playerData
          });
          break;
          
        case 'send_help_notification':
          await this.sendNotification(userId, template, {
            intervention: true,
            priority,
            data: intervention.playerData
          });
          break;
          
        case 'send_social_notification':
          await this.sendNotification(userId, template, {
            intervention: true,
            priority,
            data: intervention.playerData
          });
          break;
          
        case 'send_premium_notification':
          await this.sendNotification(userId, template, {
            intervention: true,
            priority,
            data: intervention.playerData
          });
          break;
      }

      logger.info('Intervention executed', { userId, action, template });
    } catch (error) {
      logger.error('Failed to execute intervention', { error: error.message, userId, action });
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
        variants: testData.variants,
        targetAudience: testData.targetAudience,
        startDate: new Date(testData.startDate),
        endDate: new Date(testData.endDate),
        status: 'draft',
        metrics: {
          impressions: 0,
          clicks: 0,
          conversions: 0
        }
      };

      this.abTests.set(testId, abTest);
      
      logger.info('A/B test created', { testId, name: abTest.name });
      return testId;
    } catch (error) {
      logger.error('Failed to create A/B test', { error: error.message });
      throw new ServiceError('AB_TEST_CREATE_FAILED', 'Failed to create A/B test');
    }
  }

  async applyABTesting(userId, templateKey) {
    try {
      // Find active A/B tests for this template
      const activeTests = Array.from(this.abTests.values()).filter(
        test => test.status === 'running' && 
                test.variants.some(v => v.templateKey === templateKey)
      );

      if (activeTests.length === 0) {
        return {}; // No A/B testing for this template
      }

      // Select test and variant
      const test = activeTests[0];
      const userGroup = this.getUserTestGroup(userId, test.id);
      const variant = test.variants[userGroup];

      // Track impression
      test.metrics.impressions++;

      return {
        title: variant.title,
        body: variant.body,
        data: variant.data
      };
    } catch (error) {
      logger.error('Failed to apply A/B testing', { error: error.message, userId, templateKey });
      return {};
    }
  }

  getUserTestGroup(userId, testId) {
    // Simple hash-based grouping
    const hash = this.hashString(userId + testId);
    return hash % 2; // 0 or 1 for A/B split
  }

  // ===== UTILITY METHODS =====
  async getUserFCMToken(userId) {
    try {
      const cacheKey = `fcm_token:${userId}`;
      let token = await aiCacheManager.get(cacheKey, 'user_tokens');
      
      if (!token) {
        // This would typically come from your user database
        // For now, we'll simulate it
        token = `fcm_token_${userId}_${Date.now()}`;
        await aiCacheManager.set(cacheKey, token, 'user_tokens', 86400);
      }
      
      return token;
    } catch (error) {
      logger.error('Failed to get FCM token', { error: error.message, userId });
      return null;
    }
  }

  async getUserPreferences(userId) {
    try {
      const cacheKey = `notification_prefs:${userId}`;
      let preferences = await aiCacheManager.get(cacheKey, 'user_preferences');
      
      if (!preferences) {
        preferences = {
          enabled: true,
          retention: true,
          fomo: true,
          social: true,
          progression: true,
          achievement: true,
          quietHours: { start: '22:00', end: '08:00' },
          timezone: 'UTC'
        };
        await aiCacheManager.set(cacheKey, preferences, 'user_preferences', 86400);
      }
      
      return preferences;
    } catch (error) {
      logger.error('Failed to get user preferences', { error: error.message, userId });
      return { enabled: true };
    }
  }

  shouldSendNotification(userId, templateKey, preferences) {
    if (!preferences.enabled) return false;
    
    // Check quiet hours
    const now = new Date();
    const userTime = new Date(now.toLocaleString("en-US", { timeZone: preferences.timezone }));
    const currentHour = userTime.getHours();
    const quietStart = parseInt(preferences.quietHours.start.split(':')[0]);
    const quietEnd = parseInt(preferences.quietHours.end.split(':')[0]);
    
    if (currentHour >= quietStart || currentHour < quietEnd) {
      return false;
    }
    
    // Check template-specific preferences
    switch (templateKey) {
      case 'retention': return preferences.retention;
      case 'fomo': return preferences.fomo;
      case 'social': return preferences.social;
      case 'progression': return preferences.progression;
      case 'achievement': return preferences.achievement;
      default: return true;
    }
  }

  async isUserCurrentlyActive(userId) {
    try {
      const cacheKey = `user_activity:${userId}`;
      const lastActivity = await aiCacheManager.get(cacheKey, 'user_activity');
      
      if (!lastActivity) return false;
      
      const timeSinceActivity = Date.now() - lastActivity;
      return timeSinceActivity < 300000; // 5 minutes
    } catch (error) {
      logger.error('Failed to check user activity', { error: error.message, userId });
      return false;
    }
  }

  async getTargetUsers(targetAudience) {
    try {
      // This would typically query your user database
      // For now, we'll simulate it
      const users = [];
      
      // Simulate user data based on target audience
      for (let i = 0; i < targetAudience.count || 100; i++) {
        users.push({
          id: `user_${i}`,
          preferences: await this.getUserPreferences(`user_${i}`)
        });
      }
      
      return users;
    } catch (error) {
      logger.error('Failed to get target users', { error: error.message });
      return [];
    }
  }

  async evaluateTrigger(userId, triggerName, playerData) {
    try {
      const trigger = this.interventionTriggers.get(triggerName);
      if (!trigger) return false;

      switch (triggerName) {
        case 'churn_risk':
          return playerData.churnProbability >= trigger.threshold;
        case 'progression_stall':
          return playerData.daysWithoutProgress >= trigger.threshold;
        case 'social_isolation':
          return playerData.daysWithoutSocial >= trigger.threshold;
        case 'high_value_player':
          return playerData.totalSpent >= trigger.threshold;
        default:
          return false;
      }
    } catch (error) {
      logger.error('Failed to evaluate trigger', { error: error.message, userId, triggerName });
      return false;
    }
  }

  async trackNotificationSent(userId, templateKey, response) {
    try {
      const trackingData = {
        userId,
        templateKey,
        messageId: response,
        timestamp: Date.now(),
        status: 'sent'
      };

      // Store in analytics
      await aiCacheManager.set(
        `notification_tracking:${response}`,
        trackingData,
        'notification_analytics',
        604800 // 7 days
      );

      this.engagementMetrics.notificationsSent++;
    } catch (error) {
      logger.error('Failed to track notification', { error: error.message, userId });
    }
  }

  // ===== PROCESSING LOOPS =====
  startNotificationProcessor() {
    setInterval(async () => {
      try {
        await this.processNotificationQueue();
      } catch (error) {
        logger.error('Notification processor error', { error: error.message });
      }
    }, 5000); // Process every 5 seconds
  }

  startScheduledNotifications() {
    setInterval(async () => {
      try {
        await this.processScheduledNotifications();
      } catch (error) {
        logger.error('Scheduled notification processor error', { error: error.message });
      }
    }, 60000); // Check every minute
  }

  startEngagementMonitoring() {
    setInterval(async () => {
      try {
        await this.updateEngagementMetrics();
      } catch (error) {
        logger.error('Engagement monitoring error', { error: error.message });
      }
    }, 300000); // Update every 5 minutes
  }

  async processNotificationQueue() {
    // Process queued notifications
    const queueSize = this.notificationQueue.size;
    if (queueSize > 0) {
      logger.debug('Processing notification queue', { queueSize });
      // Implementation for queue processing
    }
  }

  async processScheduledNotifications() {
    const now = new Date();
    const toProcess = [];

    for (const [id, notification] of this.scheduledNotifications.entries()) {
      if (notification.status === 'scheduled' && notification.scheduleTime <= now) {
        toProcess.push(id);
      }
    }

    for (const id of toProcess) {
      await this.sendScheduledNotification(id);
    }
  }

  async updateEngagementMetrics() {
    try {
      // Calculate engagement rate
      if (this.engagementMetrics.notificationsSent > 0) {
        this.engagementMetrics.engagementRate = 
          this.engagementMetrics.notificationsOpened / this.engagementMetrics.notificationsSent;
      }

      // Store metrics
      await aiCacheManager.set(
        'push_notification_metrics',
        this.engagementMetrics,
        'analytics',
        3600
      );

      logger.debug('Engagement metrics updated', this.engagementMetrics);
    } catch (error) {
      logger.error('Failed to update engagement metrics', { error: error.message });
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
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // ===== PUBLIC API =====
  async getMetrics() {
    return {
      ...this.engagementMetrics,
      activeCampaigns: this.campaigns.size,
      scheduledNotifications: this.scheduledNotifications.size,
      activeABTests: Array.from(this.abTests.values()).filter(t => t.status === 'running').length
    };
  }

  async getCampaigns() {
    return Array.from(this.campaigns.values());
  }

  async getABTests() {
    return Array.from(this.abTests.values());
  }

  async updateUserPreferences(userId, preferences) {
    try {
      const cacheKey = `notification_prefs:${userId}`;
      await aiCacheManager.set(cacheKey, preferences, 'user_preferences', 86400);
      
      logger.info('User preferences updated', { userId, preferences });
    } catch (error) {
      logger.error('Failed to update user preferences', { error: error.message, userId });
      throw new ServiceError('PREFERENCES_UPDATE_FAILED', 'Failed to update user preferences');
    }
  }

  async registerFCMToken(userId, token) {
    try {
      const cacheKey = `fcm_token:${userId}`;
      await aiCacheManager.set(cacheKey, token, 'user_tokens', 86400);
      
      logger.info('FCM token registered', { userId });
    } catch (error) {
      logger.error('Failed to register FCM token', { error: error.message, userId });
      throw new ServiceError('TOKEN_REGISTRATION_FAILED', 'Failed to register FCM token');
    }
  }

  async handleNotificationClick(userId, messageId, action) {
    try {
      // Track notification click
      this.engagementMetrics.notificationsOpened++;
      
      // Update campaign metrics if applicable
      const trackingData = await aiCacheManager.get(
        `notification_tracking:${messageId}`,
        'notification_analytics'
      );
      
      if (trackingData && trackingData.campaignId) {
        const campaign = this.campaigns.get(trackingData.campaignId);
        if (campaign) {
          campaign.metrics.opened++;
        }
      }

      logger.info('Notification click tracked', { userId, messageId, action });
    } catch (error) {
      logger.error('Failed to track notification click', { error: error.message, userId });
    }
  }
}

export default new PushNotificationService();
export { PushNotificationService };