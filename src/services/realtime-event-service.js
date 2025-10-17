import { Logger } from '../core/logger/index.js';
import { ServiceError } from '../core/errors/ErrorHandler.js';
import { createClient } from '@supabase/supabase-js';
import { WeatherService } from './weather-service.js';
import { RealtimeCalendarService } from './realtime-calendar-service.js';
import cron from 'node-cron';
import moment from 'moment-timezone';
import { Server } from 'socket.io';

/**
 * Real-Time Event Service
 * Provides comprehensive event management with real-time updates and notifications
 */
class RealtimeEventService {
  constructor(io = null) {
    this.logger = new Logger('RealtimeEventService');

    this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    // Services
    this.weatherService = new WeatherService();
    this.calendarService = new RealtimeCalendarService();
    this.io = io; // Socket.IO instance for real-time updates

    // Event configuration
    this.eventCache = new Map();
    this.notificationCache = new Map();
    this.cacheExpiry = 2 * 60 * 1000; // 2 minutes

    // Event types and their configurations
    this.eventTypes = {
      DAILY_CHALLENGE: {
        type: 'daily_challenge',
        duration: 24 * 60 * 60 * 1000, // 24 hours
        priority: 1,
        autoCreate: true,
        rewards: { coins: 500, gems: 50, energy: 5 },
      },
      WEEKLY_TOURNAMENT: {
        type: 'weekly_tournament',
        duration: 7 * 24 * 60 * 60 * 1000, // 7 days
        priority: 2,
        autoCreate: true,
        rewards: {
          first: { gems: 1000, coins: 10000 },
          second: { gems: 500, coins: 5000 },
          third: { gems: 250, coins: 2500 },
        },
      },
      WEATHER_EVENT: {
        type: 'weather_event',
        duration: 4 * 60 * 60 * 1000, // 4 hours
        priority: 3,
        autoCreate: false,
        weatherDependent: true,
      },
      SPECIAL_OFFER: {
        type: 'special_offer',
        duration: 2 * 60 * 60 * 1000, // 2 hours
        priority: 4,
        autoCreate: false,
        limitedTime: true,
      },
      SEASONAL_EVENT: {
        type: 'seasonal_event',
        duration: 30 * 24 * 60 * 60 * 1000, // 30 days
        priority: 2,
        autoCreate: true,
        seasonal: true,
      },
      LIVE_EVENT: {
        type: 'live_event',
        duration: 1 * 60 * 60 * 1000, // 1 hour
        priority: 5,
        autoCreate: false,
        realTime: true,
      },
    };

    this.initializeEventService();
    this.startEventUpdates();
  }

  /**
   * Initialize event service
   */
  async initializeEventService() {
    this.logger.info('Initializing Real-Time Event Service');

    try {
      // Load cached event data
      await this.loadCachedEventData();

      // Setup event schedules
      this.setupEventSchedules();

      // Initialize real-time notifications
      this.initializeRealtimeNotifications();

      this.logger.info('Real-Time Event Service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Event Service', error);
      throw new ServiceError('Event service initialization failed', error);
    }
  }

  /**
   * Setup event update schedules
   */
  setupEventSchedules() {
    // Update events every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
      await this.updateAllEvents();
    });

    // Check for new events every minute
    cron.schedule('* * * * *', async () => {
      await this.checkForNewEvents();
    });

    // Clean expired events every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.cleanExpiredEvents();
    });

    // Generate weather-based events every hour
    cron.schedule('0 * * * *', async () => {
      await this.generateWeatherEvents();
    });

    // Generate special events every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      await this.generateSpecialEvents();
    });
  }

  /**
   * Initialize real-time notifications
   */
  initializeRealtimeNotifications() {
    if (this.io) {
      this.logger.info('Real-time notifications initialized');
    } else {
      this.logger.warn('Socket.IO not provided - real-time notifications disabled');
    }
  }

  /**
   * Get active events
   */
  async getActiveEvents(timezone = 'UTC', eventTypes = null) {
    try {
      const cacheKey = `active_events_${timezone}_${eventTypes?.join(',') || 'all'}`;

      // Check cache first
      if (this.eventCache.has(cacheKey)) {
        const cached = this.eventCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.data;
        }
      }

      const now = moment.tz(timezone);
      const nowUTC = now.utc().toISOString();

      let query = this.supabase
        .from('game_events')
        .select('*')
        .eq('is_active', true)
        .lte('start_time', nowUTC)
        .gte('end_time', nowUTC)
        .order('priority', { ascending: false })
        .order('start_time', { ascending: true });

      if (eventTypes && eventTypes.length > 0) {
        query = query.in('event_type', eventTypes);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process events for timezone
      const processedEvents = data.map((event) => this.processEvent(event, timezone));

      // Cache the result
      this.eventCache.set(cacheKey, {
        data: processedEvents,
        timestamp: Date.now(),
      });

      return processedEvents;
    } catch (error) {
      this.logger.error('Failed to get active events', error);
      throw new ServiceError('Failed to fetch active events', error);
    }
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(hours = 24, timezone = 'UTC') {
    try {
      const now = moment.tz(timezone);
      const future = now.clone().add(hours, 'hours');
      const nowUTC = now.utc().toISOString();
      const futureUTC = future.utc().toISOString();

      const { data, error } = await this.supabase
        .from('game_events')
        .select('*')
        .eq('is_active', true)
        .gte('start_time', nowUTC)
        .lte('start_time', futureUTC)
        .order('start_time', { ascending: true });

      if (error) throw error;

      return data.map((event) => this.processEvent(event, timezone));
    } catch (error) {
      this.logger.error('Failed to get upcoming events', error);
      throw new ServiceError('Failed to fetch upcoming events', error);
    }
  }

  /**
   * Create a new event
   */
  async createEvent(eventData) {
    try {
      const event = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: eventData.title,
        description: eventData.description,
        event_type: eventData.eventType,
        start_time: moment
          .tz(eventData.startTime, eventData.timezone || 'UTC')
          .utc()
          .toISOString(),
        end_time: moment
          .tz(eventData.endTime, eventData.timezone || 'UTC')
          .utc()
          .toISOString(),
        timezone: eventData.timezone || 'UTC',
        priority: eventData.priority || 1,
        is_active: true,
        is_recurring: eventData.isRecurring || false,
        recurrence_pattern: eventData.recurrencePattern || null,
        requirements: eventData.requirements || {},
        rewards: eventData.rewards || {},
        metadata: eventData.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase.from('game_events').insert([event]);

      if (error) throw error;

      // Clear cache
      this.clearEventCache();

      // Send real-time notification
      this.sendEventNotification('event_created', event);

      this.logger.info(`Created event: ${event.title}`);
      return event;
    } catch (error) {
      this.logger.error('Failed to create event', error);
      throw new ServiceError('Failed to create event', error);
    }
  }

  /**
   * Update event progress
   */
  async updateEventProgress(eventId, playerId, progressData) {
    try {
      // Get event
      const { data: event, error: eventError } = await this.supabase
        .from('game_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      // Update player progress
      const { data: existingProgress, error: progressError } = await this.supabase
        .from('event_progress')
        .select('*')
        .eq('event_id', eventId)
        .eq('player_id', playerId)
        .single();

      if (progressError && progressError.code !== 'PGRST116') throw progressError;

      const progress = {
        event_id: eventId,
        player_id: playerId,
        progress_data: existingProgress
          ? { ...existingProgress.progress_data, ...progressData }
          : progressData,
        updated_at: new Date().toISOString(),
      };

      if (existingProgress) {
        const { error: updateError } = await this.supabase
          .from('event_progress')
          .update(progress)
          .eq('id', existingProgress.id);

        if (updateError) throw updateError;
      } else {
        progress.id = `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        progress.created_at = new Date().toISOString();

        const { error: insertError } = await this.supabase
          .from('event_progress')
          .insert([progress]);

        if (insertError) throw insertError;
      }

      // Check if event is completed
      if (this.isEventCompleted(event, progress.progress_data)) {
        await this.completeEvent(eventId, playerId);
      }

      // Send real-time update
      this.sendEventNotification('event_progress_updated', {
        eventId,
        playerId,
        progress: progress.progress_data,
      });

      return progress;
    } catch (error) {
      this.logger.error('Failed to update event progress', error);
      throw new ServiceError('Failed to update event progress', error);
    }
  }

  /**
   * Complete event for player
   */
  async completeEvent(eventId, playerId) {
    try {
      // Get event
      const { data: event, error: eventError } = await this.supabase
        .from('game_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      // Mark as completed
      const { error: completeError } = await this.supabase.from('event_completions').upsert({
        event_id: eventId,
        player_id: playerId,
        completed_at: new Date().toISOString(),
        rewards_claimed: false,
      });

      if (completeError) throw completeError;

      // Grant rewards
      await this.grantEventRewards(event, playerId);

      // Send completion notification
      this.sendEventNotification('event_completed', {
        eventId,
        playerId,
        eventTitle: event.title,
        rewards: event.rewards,
      });

      this.logger.info(`Event completed: ${event.title} by player ${playerId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to complete event', error);
      throw new ServiceError('Failed to complete event', error);
    }
  }

  /**
   * Check if event is completed
   */
  isEventCompleted(event, progressData) {
    const requirements = event.requirements || {};

    for (const [key, requiredValue] of Object.entries(requirements)) {
      const currentValue = progressData[key] || 0;
      if (currentValue < requiredValue) {
        return false;
      }
    }

    return true;
  }

  /**
   * Grant event rewards
   */
  async grantEventRewards(event, playerId) {
    try {
      const rewards = event.rewards || {};

      // This would integrate with your economy system
      for (const [rewardType, amount] of Object.entries(rewards)) {
        await this.grantReward(playerId, rewardType, amount);
      }

      this.logger.info(`Granted rewards to player ${playerId} for event ${event.title}`);
    } catch (error) {
      this.logger.error('Failed to grant event rewards', error);
    }
  }

  /**
   * Grant reward to player
   */
  async grantReward(playerId, rewardType, amount) {
    // This would integrate with your economy/currency system
    this.logger.info(`Granting ${amount} ${rewardType} to player ${playerId}`);
  }

  /**
   * Update all events
   */
  async updateAllEvents() {
    try {
      const now = moment.utc();
      const nowUTC = now.toISOString();

      // Update event statuses
      const { error: updateError } = await this.supabase
        .from('game_events')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .lt('end_time', nowUTC)
        .eq('is_active', true);

      if (updateError) throw updateError;

      // Clear cache
      this.clearEventCache();
    } catch (error) {
      this.logger.error('Failed to update events', error);
    }
  }

  /**
   * Check for new events
   */
  async checkForNewEvents() {
    try {
      // Auto-create daily events
      await this.createDailyEvents();

      // Auto-create weekly events
      await this.createWeeklyEvents();

      // Auto-create seasonal events
      await this.createSeasonalEvents();
    } catch (error) {
      this.logger.error('Failed to check for new events', error);
    }
  }

  /**
   * Create daily events
   */
  async createDailyEvents() {
    try {
      const now = moment.tz('UTC');
      const today = now.format('YYYY-MM-DD');

      // Check if daily events already exist for today
      const { data: existingEvents, error } = await this.supabase
        .from('game_events')
        .select('id')
        .eq('event_type', this.eventTypes.DAILY_CHALLENGE.type)
        .gte('start_time', now.startOf('day').toISOString())
        .lt('start_time', now.endOf('day').toISOString());

      if (error) throw error;

      if (existingEvents.length === 0) {
        // Create daily challenge
        const dailyChallenge = {
          title: 'Daily Challenge',
          description: 'Complete 5 levels to earn bonus rewards!',
          eventType: this.eventTypes.DAILY_CHALLENGE.type,
          startTime: now.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
          endTime: now.endOf('day').format('YYYY-MM-DD HH:mm:ss'),
          timezone: 'UTC',
          priority: this.eventTypes.DAILY_CHALLENGE.priority,
          requirements: { levels_completed: 5 },
          rewards: this.eventTypes.DAILY_CHALLENGE.rewards,
        };

        await this.createEvent(dailyChallenge);
      }
    } catch (error) {
      this.logger.error('Failed to create daily events', error);
    }
  }

  /**
   * Create weekly events
   */
  async createWeeklyEvents() {
    try {
      const now = moment.tz('UTC');
      const startOfWeek = now.clone().startOf('isoWeek');

      // Check if weekly events already exist for this week
      const { data: existingEvents, error } = await this.supabase
        .from('game_events')
        .select('id')
        .eq('event_type', this.eventTypes.WEEKLY_TOURNAMENT.type)
        .gte('start_time', startOfWeek.toISOString())
        .lt('start_time', startOfWeek.clone().add(1, 'week').toISOString());

      if (error) throw error;

      if (existingEvents.length === 0) {
        // Create weekly tournament
        const weeklyTournament = {
          title: 'Weekly Tournament',
          description: 'Compete for the top spot and win amazing rewards!',
          eventType: this.eventTypes.WEEKLY_TOURNAMENT.type,
          startTime: startOfWeek.format('YYYY-MM-DD HH:mm:ss'),
          endTime: startOfWeek.clone().add(1, 'week').format('YYYY-MM-DD HH:mm:ss'),
          timezone: 'UTC',
          priority: this.eventTypes.WEEKLY_TOURNAMENT.priority,
          requirements: { score_achieved: 10000 },
          rewards: this.eventTypes.WEEKLY_TOURNAMENT.rewards,
        };

        await this.createEvent(weeklyTournament);
      }
    } catch (error) {
      this.logger.error('Failed to create weekly events', error);
    }
  }

  /**
   * Create seasonal events
   */
  async createSeasonalEvents() {
    try {
      const now = moment.tz('UTC');
      const month = now.month();

      // Check if seasonal events already exist for this month
      const { data: existingEvents, error } = await this.supabase
        .from('game_events')
        .select('id')
        .eq('event_type', this.eventTypes.SEASONAL_EVENT.type)
        .gte('start_time', now.startOf('month').toISOString())
        .lt('start_time', now.endOf('month').toISOString());

      if (error) throw error;

      if (existingEvents.length === 0) {
        const seasonNames = ['Spring', 'Summer', 'Autumn', 'Winter'];
        const seasonName = seasonNames[Math.floor(month / 3)];

        const seasonalEvent = {
          title: `${seasonName} Festival`,
          description: `Celebrate the ${seasonName.toLowerCase()} season with special rewards!`,
          eventType: this.eventTypes.SEASONAL_EVENT.type,
          startTime: now.startOf('month').format('YYYY-MM-DD HH:mm:ss'),
          endTime: now.endOf('month').format('YYYY-MM-DD HH:mm:ss'),
          timezone: 'UTC',
          priority: this.eventTypes.SEASONAL_EVENT.priority,
          requirements: { seasonal_tasks: 10 },
          rewards: { coins: 2000, gems: 200, seasonal_items: 5 },
        };

        await this.createEvent(seasonalEvent);
      }
    } catch (error) {
      this.logger.error('Failed to create seasonal events', error);
    }
  }

  /**
   * Generate weather-based events
   */
  async generateWeatherEvents() {
    try {
      // Get current weather
      const weatherData = await this.weatherService.getCurrentWeather(51.5074, -0.1278, 'London');

      if (weatherData && weatherData.weather.type !== 'clear') {
        const weatherType = weatherData.weather.type;
        const eventTitle = this.getWeatherEventTitle(weatherType);
        const eventDescription = this.getWeatherEventDescription(weatherType);

        const weatherEvent = {
          title: eventTitle,
          description: eventDescription,
          eventType: this.eventTypes.WEATHER_EVENT.type,
          startTime: moment.tz('UTC').format('YYYY-MM-DD HH:mm:ss'),
          endTime: moment.tz('UTC').add(4, 'hours').format('YYYY-MM-DD HH:mm:ss'),
          timezone: 'UTC',
          priority: this.eventTypes.WEATHER_EVENT.priority,
          requirements: { weather_matches: 1 },
          rewards: this.getWeatherEventRewards(weatherType),
          metadata: {
            weatherType,
            weatherData: weatherData.weather,
            gameplayEffects: weatherData.gameplay,
          },
        };

        await this.createEvent(weatherEvent);
      }
    } catch (error) {
      this.logger.error('Failed to generate weather events', error);
    }
  }

  /**
   * Generate special events
   */
  async generateSpecialEvents() {
    try {
      const specialEvents = [
        {
          title: 'Double Coins Hour',
          description: 'Earn double coins for the next hour!',
          eventType: this.eventTypes.SPECIAL_OFFER.type,
          duration: 1,
          requirements: { matches_made: 10 },
          rewards: { coins: 1000, coin_multiplier: 2 },
        },
        {
          title: 'Energy Boost',
          description: 'Get bonus energy refills!',
          eventType: this.eventTypes.SPECIAL_OFFER.type,
          duration: 2,
          requirements: { energy_used: 5 },
          rewards: { energy: 10, energy_multiplier: 1.5 },
        },
        {
          title: 'Lucky Day',
          description: 'Increased chance for special tiles!',
          eventType: this.eventTypes.SPECIAL_OFFER.type,
          duration: 3,
          requirements: { special_tiles: 5 },
          rewards: { gems: 100, special_chance: 2.0 },
        },
      ];

      const randomEvent = specialEvents[Math.floor(Math.random() * specialEvents.length)];

      const specialEvent = {
        title: randomEvent.title,
        description: randomEvent.description,
        eventType: randomEvent.eventType,
        startTime: moment.tz('UTC').format('YYYY-MM-DD HH:mm:ss'),
        endTime: moment.tz('UTC').add(randomEvent.duration, 'hours').format('YYYY-MM-DD HH:mm:ss'),
        timezone: 'UTC',
        priority: this.eventTypes.SPECIAL_OFFER.priority,
        requirements: randomEvent.requirements,
        rewards: randomEvent.rewards,
      };

      await this.createEvent(specialEvent);
    } catch (error) {
      this.logger.error('Failed to generate special events', error);
    }
  }

  /**
   * Get weather event title
   */
  getWeatherEventTitle(weatherType) {
    const titles = {
      rain: 'Rainy Day Bonus',
      snow: 'Winter Wonderland',
      thunderstorm: 'Stormy Weather Challenge',
      fog: 'Mysterious Fog Event',
      clouds: 'Cloudy Day Special',
    };
    return titles[weatherType] || 'Weather Event';
  }

  /**
   * Get weather event description
   */
  getWeatherEventDescription(weatherType) {
    const descriptions = {
      rain: 'The rain brings extra rewards! Complete matches to earn bonus coins!',
      snow: 'Snow is falling! Enjoy the winter atmosphere and special rewards!',
      thunderstorm: 'Thunder and lightning! High energy events with amazing rewards!',
      fog: 'Mysterious fog has appeared! Uncover hidden rewards!',
      clouds: 'Cloudy skies bring special opportunities!',
    };
    return descriptions[weatherType] || 'Weather-based event is active!';
  }

  /**
   * Get weather event rewards
   */
  getWeatherEventRewards(weatherType) {
    const rewards = {
      rain: { coins: 800, gems: 80, energy: 3 },
      snow: { coins: 600, gems: 60, winter_items: 2 },
      thunderstorm: { coins: 1200, gems: 120, energy: 5 },
      fog: { coins: 500, gems: 50, mystery_items: 1 },
      clouds: { coins: 400, gems: 40, energy: 2 },
    };
    return rewards[weatherType] || { coins: 300, gems: 30 };
  }

  /**
   * Clean expired events
   */
  async cleanExpiredEvents() {
    try {
      const now = moment.utc().toISOString();

      const { error } = await this.supabase
        .from('game_events')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .lt('end_time', now)
        .eq('is_active', true);

      if (error) throw error;

      // Clear cache
      this.clearEventCache();
    } catch (error) {
      this.logger.error('Failed to clean expired events', error);
    }
  }

  /**
   * Process event for timezone
   */
  processEvent(event, timezone) {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      eventType: event.event_type,
      startTime: moment.tz(event.start_time, 'UTC').tz(timezone).format('YYYY-MM-DD HH:mm:ss'),
      endTime: moment.tz(event.end_time, 'UTC').tz(timezone).format('YYYY-MM-DD HH:mm:ss'),
      timezone: timezone,
      priority: event.priority,
      isActive: event.is_active,
      isRecurring: event.is_recurring,
      requirements: event.requirements || {},
      rewards: event.rewards || {},
      metadata: event.metadata || {},
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      // Computed fields
      duration: moment
        .tz(event.end_time, 'UTC')
        .diff(moment.tz(event.start_time, 'UTC'), 'minutes'),
      isOngoing: this.isEventOngoing(event, timezone),
      isUpcoming: this.isEventUpcoming(event, timezone),
      timeRemaining: this.getTimeRemaining(event, timezone),
    };
  }

  /**
   * Check if event is ongoing
   */
  isEventOngoing(event, timezone) {
    const now = moment.tz(timezone);
    const start = moment.tz(event.start_time, 'UTC').tz(timezone);
    const end = moment.tz(event.end_time, 'UTC').tz(timezone);

    return now.isBetween(start, end, null, '[]');
  }

  /**
   * Check if event is upcoming
   */
  isEventUpcoming(event, timezone) {
    const now = moment.tz(timezone);
    const start = moment.tz(event.start_time, 'UTC').tz(timezone);

    return start.isAfter(now);
  }

  /**
   * Get time remaining for event
   */
  getTimeRemaining(event, timezone) {
    const now = moment.tz(timezone);
    const end = moment.tz(event.end_time, 'UTC').tz(timezone);

    if (end.isBefore(now)) return 0;

    return end.diff(now, 'minutes');
  }

  /**
   * Send event notification
   */
  sendEventNotification(type, data) {
    if (this.io) {
      this.io.emit('event_update', {
        type,
        data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Clear event cache
   */
  clearEventCache() {
    this.eventCache.clear();
  }

  /**
   * Load cached event data
   */
  async loadCachedEventData() {
    try {
      // Load active events into cache
      await this.getActiveEvents();
      this.logger.info('Event cache loaded');
    } catch (error) {
      this.logger.error('Failed to load cached event data', error);
    }
  }

  /**
   * Start event updates
   */
  startEventUpdates() {
    this.logger.info('Starting event update schedules');
  }

  /**
   * Get event statistics
   */
  async getEventStatistics() {
    try {
      const now = moment.utc();
      const startOfMonth = now.clone().startOf('month');
      const endOfMonth = now.clone().endOf('month');

      const { data, error } = await this.supabase
        .from('game_events')
        .select('event_type, is_active, start_time, end_time')
        .gte('start_time', startOfMonth.toISOString())
        .lte('start_time', endOfMonth.toISOString());

      if (error) throw error;

      const stats = {
        totalEvents: data.length,
        activeEvents: data.filter((e) => e.is_active).length,
        eventTypes: {},
        upcomingEvents: 0,
        ongoingEvents: 0,
        completedEvents: 0,
      };

      for (const event of data) {
        stats.eventTypes[event.event_type] = (stats.eventTypes[event.event_type] || 0) + 1;

        const eventStart = moment.tz(event.start_time, 'UTC');
        const eventEnd = moment.tz(event.end_time, 'UTC');

        if (eventStart.isAfter(now)) {
          stats.upcomingEvents++;
        } else if (eventStart.isBefore(now) && eventEnd.isAfter(now)) {
          stats.ongoingEvents++;
        } else if (eventEnd.isBefore(now)) {
          stats.completedEvents++;
        }
      }

      return stats;
    } catch (error) {
      this.logger.error('Failed to get event statistics', error);
      throw new ServiceError('Failed to get event statistics', error);
    }
  }
}

export { RealtimeEventService };
