import { Logger } from '../core/logger/index.js';
import { ServiceError } from '../core/errors/ErrorHandler.js';
import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';
import moment from 'moment-timezone';

/**
 * Real-Time Calendar Service
 * Provides comprehensive calendar management with timezone support and real-time updates
 */
class RealtimeCalendarService {
  constructor() {
    this.logger = new Logger('RealtimeCalendarService');

    this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    // Calendar configuration
    this.timezone = process.env.DEFAULT_TIMEZONE || 'UTC';
    this.calendarCache = new Map();
    this.eventCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes

    // Supported timezones
    this.supportedTimezones = [
      'UTC',
      'America/New_York',
      'America/Los_Angeles',
      'America/Chicago',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Asia/Kolkata',
      'Australia/Sydney',
      'Pacific/Auckland',
    ];

    // Calendar event types
    this.eventTypes = {
      GAME_EVENT: 'game_event',
      WEATHER_EVENT: 'weather_event',
      MAINTENANCE: 'maintenance',
      SPECIAL_OFFER: 'special_offer',
      TOURNAMENT: 'tournament',
      SEASONAL: 'seasonal',
      DAILY_RESET: 'daily_reset',
      WEEKLY_RESET: 'weekly_reset',
      MONTHLY_RESET: 'monthly_reset',
    };

    this.initializeCalendarService();
    this.startCalendarUpdates();
  }

  /**
   * Initialize calendar service
   */
  async initializeCalendarService() {
    this.logger.info('Initializing Real-Time Calendar Service');

    try {
      // Load cached calendar data
      await this.loadCachedCalendarData();

      // Setup calendar schedules
      this.setupCalendarSchedules();

      // Initialize timezone handling
      this.initializeTimezoneHandling();

      this.logger.info('Real-Time Calendar Service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Calendar Service', error);
      throw new ServiceError('Calendar service initialization failed', error);
    }
  }

  /**
   * Setup calendar update schedules
   */
  setupCalendarSchedules() {
    // Update calendar every minute
    cron.schedule('* * * * *', async () => {
      await this.updateCalendarEvents();
    });

    // Daily reset at midnight UTC
    cron.schedule('0 0 * * *', async () => {
      await this.handleDailyReset();
    });

    // Weekly reset on Monday at midnight UTC
    cron.schedule('0 0 * * 1', async () => {
      await this.handleWeeklyReset();
    });

    // Monthly reset on 1st at midnight UTC
    cron.schedule('0 0 1 * *', async () => {
      await this.handleMonthlyReset();
    });

    // Clean expired events every hour
    cron.schedule('0 * * * *', async () => {
      await this.cleanExpiredEvents();
    });
  }

  /**
   * Initialize timezone handling
   */
  initializeTimezoneHandling() {
    // Set default timezone
    moment.tz.setDefault(this.timezone);
    this.logger.info(`Calendar service initialized with timezone: ${this.timezone}`);
  }

  /**
   * Get current time in specified timezone
   */
  getCurrentTime(timezone = this.timezone) {
    return moment.tz(timezone);
  }

  /**
   * Convert time to timezone
   */
  convertToTimezone(time, fromTimezone, toTimezone) {
    return moment.tz(time, fromTimezone).tz(toTimezone);
  }

  /**
   * Get calendar events for a date range
   */
  async getCalendarEvents(startDate, endDate, timezone = this.timezone, eventTypes = null) {
    try {
      const cacheKey = `events_${startDate}_${endDate}_${timezone}_${eventTypes?.join(',') || 'all'}`;

      // Check cache first
      if (this.eventCache.has(cacheKey)) {
        const cached = this.eventCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.data;
        }
      }

      // Convert dates to UTC for database query
      const startUTC = moment.tz(startDate, timezone).utc().toISOString();
      const endUTC = moment.tz(endDate, timezone).utc().toISOString();

      let query = this.supabase
        .from('calendar_events')
        .select('*')
        .gte('start_time', startUTC)
        .lte('end_time', endUTC)
        .eq('is_active', true)
        .order('start_time', { ascending: true });

      if (eventTypes && eventTypes.length > 0) {
        query = query.in('event_type', eventTypes);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process events and convert to requested timezone
      const processedEvents = data.map((event) => this.processCalendarEvent(event, timezone));

      // Cache the result
      this.eventCache.set(cacheKey, {
        data: processedEvents,
        timestamp: Date.now(),
      });

      return processedEvents;
    } catch (error) {
      this.logger.error('Failed to get calendar events', error);
      throw new ServiceError('Failed to fetch calendar events', error);
    }
  }

  /**
   * Get events happening now
   */
  async getCurrentEvents(timezone = this.timezone) {
    const now = this.getCurrentTime(timezone);
    return await this.getCalendarEvents(
      now.format('YYYY-MM-DD HH:mm:ss'),
      now.format('YYYY-MM-DD HH:mm:ss'),
      timezone,
    );
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(hours = 24, timezone = this.timezone) {
    const now = this.getCurrentTime(timezone);
    const future = now.clone().add(hours, 'hours');

    return await this.getCalendarEvents(
      now.format('YYYY-MM-DD HH:mm:ss'),
      future.format('YYYY-MM-DD HH:mm:ss'),
      timezone,
    );
  }

  /**
   * Create a new calendar event
   */
  async createCalendarEvent(eventData) {
    try {
      const event = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: eventData.title,
        description: eventData.description,
        event_type: eventData.eventType || this.eventTypes.GAME_EVENT,
        start_time: moment
          .tz(eventData.startTime, eventData.timezone || this.timezone)
          .utc()
          .toISOString(),
        end_time: moment
          .tz(eventData.endTime, eventData.timezone || this.timezone)
          .utc()
          .toISOString(),
        timezone: eventData.timezone || this.timezone,
        is_recurring: eventData.isRecurring || false,
        recurrence_pattern: eventData.recurrencePattern || null,
        priority: eventData.priority || 1,
        is_active: true,
        metadata: eventData.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase.from('calendar_events').insert([event]);

      if (error) throw error;

      // Clear relevant cache
      this.clearEventCache();

      this.logger.info(`Created calendar event: ${event.title}`);
      return event;
    } catch (error) {
      this.logger.error('Failed to create calendar event', error);
      throw new ServiceError('Failed to create calendar event', error);
    }
  }

  /**
   * Update calendar event
   */
  async updateCalendarEvent(eventId, updateData) {
    try {
      const updateFields = {
        ...updateData,
        updated_at: new Date().toISOString(),
      };

      // Convert time fields to UTC if provided
      if (updateData.startTime) {
        updateFields.start_time = moment
          .tz(updateData.startTime, updateData.timezone || this.timezone)
          .utc()
          .toISOString();
      }
      if (updateData.endTime) {
        updateFields.end_time = moment
          .tz(updateData.endTime, updateData.timezone || this.timezone)
          .utc()
          .toISOString();
      }

      const { data, error } = await this.supabase
        .from('calendar_events')
        .update(updateFields)
        .eq('id', eventId);

      if (error) throw error;

      // Clear relevant cache
      this.clearEventCache();

      this.logger.info(`Updated calendar event: ${eventId}`);
      return data;
    } catch (error) {
      this.logger.error('Failed to update calendar event', error);
      throw new ServiceError('Failed to update calendar event', error);
    }
  }

  /**
   * Delete calendar event
   */
  async deleteCalendarEvent(eventId) {
    try {
      const { error } = await this.supabase
        .from('calendar_events')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', eventId);

      if (error) throw error;

      // Clear relevant cache
      this.clearEventCache();

      this.logger.info(`Deleted calendar event: ${eventId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to delete calendar event', error);
      throw new ServiceError('Failed to delete calendar event', error);
    }
  }

  /**
   * Process calendar event for timezone conversion
   */
  processCalendarEvent(event, targetTimezone) {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      eventType: event.event_type,
      startTime: moment
        .tz(event.start_time, 'UTC')
        .tz(targetTimezone)
        .format('YYYY-MM-DD HH:mm:ss'),
      endTime: moment.tz(event.end_time, 'UTC').tz(targetTimezone).format('YYYY-MM-DD HH:mm:ss'),
      timezone: targetTimezone,
      isRecurring: event.is_recurring,
      recurrencePattern: event.recurrence_pattern,
      priority: event.priority,
      isActive: event.is_active,
      metadata: event.metadata,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      // Additional computed fields
      duration: moment
        .tz(event.end_time, 'UTC')
        .diff(moment.tz(event.start_time, 'UTC'), 'minutes'),
      isOngoing: this.isEventOngoing(event, targetTimezone),
      isUpcoming: this.isEventUpcoming(event, targetTimezone),
      isExpired: this.isEventExpired(event, targetTimezone),
    };
  }

  /**
   * Check if event is currently ongoing
   */
  isEventOngoing(event, timezone) {
    const now = this.getCurrentTime(timezone);
    const start = moment.tz(event.start_time, 'UTC').tz(timezone);
    const end = moment.tz(event.end_time, 'UTC').tz(timezone);

    return now.isBetween(start, end, null, '[]');
  }

  /**
   * Check if event is upcoming
   */
  isEventUpcoming(event, timezone) {
    const now = this.getCurrentTime(timezone);
    const start = moment.tz(event.start_time, 'UTC').tz(timezone);

    return start.isAfter(now);
  }

  /**
   * Check if event is expired
   */
  isEventExpired(event, timezone) {
    const now = this.getCurrentTime(timezone);
    const end = moment.tz(event.end_time, 'UTC').tz(timezone);

    return end.isBefore(now);
  }

  /**
   * Update calendar events (called by cron)
   */
  async updateCalendarEvents() {
    try {
      const now = this.getCurrentTime();

      // Get all active events
      const { data: events, error } = await this.supabase
        .from('calendar_events')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      // Process recurring events
      for (const event of events) {
        if (event.is_recurring && event.recurrence_pattern) {
          await this.processRecurringEvent(event);
        }
      }

      // Clean expired events
      await this.cleanExpiredEvents();

      this.logger.debug('Calendar events updated');
    } catch (error) {
      this.logger.error('Failed to update calendar events', error);
    }
  }

  /**
   * Process recurring events
   */
  async processRecurringEvent(event) {
    try {
      const pattern = JSON.parse(event.recurrence_pattern);
      const now = this.getCurrentTime();
      const lastOccurrence = moment.tz(event.updated_at, 'UTC');

      // Check if it's time to create next occurrence
      let nextOccurrence = null;

      switch (pattern.type) {
        case 'daily':
          nextOccurrence = lastOccurrence.clone().add(1, 'day');
          break;
        case 'weekly':
          nextOccurrence = lastOccurrence.clone().add(1, 'week');
          break;
        case 'monthly':
          nextOccurrence = lastOccurrence.clone().add(1, 'month');
          break;
        case 'custom':
          nextOccurrence = lastOccurrence.clone().add(pattern.interval, pattern.unit);
          break;
      }

      if (nextOccurrence && now.isAfter(nextOccurrence)) {
        // Create new occurrence
        const newEvent = {
          ...event,
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          start_time: nextOccurrence.utc().toISOString(),
          end_time: nextOccurrence
            .clone()
            .add(event.duration || 60, 'minutes')
            .utc()
            .toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await this.supabase.from('calendar_events').insert([newEvent]);

        this.logger.info(`Created recurring event: ${event.title}`);
      }
    } catch (error) {
      this.logger.error('Failed to process recurring event', error);
    }
  }

  /**
   * Handle daily reset
   */
  async handleDailyReset() {
    try {
      this.logger.info('Handling daily reset');

      // Create daily reset event
      const dailyResetEvent = {
        title: 'Daily Reset',
        description: 'Daily rewards and challenges have been reset',
        eventType: this.eventTypes.DAILY_RESET,
        startTime: this.getCurrentTime().format('YYYY-MM-DD HH:mm:ss'),
        endTime: this.getCurrentTime().add(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        timezone: this.timezone,
        priority: 1,
        metadata: {
          resetType: 'daily',
          rewards: ['daily_energy', 'daily_coins', 'daily_gems'],
        },
      };

      await this.createCalendarEvent(dailyResetEvent);

      // Trigger daily reset logic
      await this.triggerDailyReset();
    } catch (error) {
      this.logger.error('Failed to handle daily reset', error);
    }
  }

  /**
   * Handle weekly reset
   */
  async handleWeeklyReset() {
    try {
      this.logger.info('Handling weekly reset');

      // Create weekly reset event
      const weeklyResetEvent = {
        title: 'Weekly Reset',
        description: 'Weekly challenges and tournaments have been reset',
        eventType: this.eventTypes.WEEKLY_RESET,
        startTime: this.getCurrentTime().format('YYYY-MM-DD HH:mm:ss'),
        endTime: this.getCurrentTime().add(2, 'hours').format('YYYY-MM-DD HH:mm:ss'),
        timezone: this.timezone,
        priority: 1,
        metadata: {
          resetType: 'weekly',
          rewards: ['weekly_energy', 'weekly_coins', 'weekly_gems', 'weekly_items'],
        },
      };

      await this.createCalendarEvent(weeklyResetEvent);

      // Trigger weekly reset logic
      await this.triggerWeeklyReset();
    } catch (error) {
      this.logger.error('Failed to handle weekly reset', error);
    }
  }

  /**
   * Handle monthly reset
   */
  async handleMonthlyReset() {
    try {
      this.logger.info('Handling monthly reset');

      // Create monthly reset event
      const monthlyResetEvent = {
        title: 'Monthly Reset',
        description: 'Monthly rewards and seasonal content have been reset',
        eventType: this.eventTypes.MONTHLY_RESET,
        startTime: this.getCurrentTime().format('YYYY-MM-DD HH:mm:ss'),
        endTime: this.getCurrentTime().add(4, 'hours').format('YYYY-MM-DD HH:mm:ss'),
        timezone: this.timezone,
        priority: 1,
        metadata: {
          resetType: 'monthly',
          rewards: [
            'monthly_energy',
            'monthly_coins',
            'monthly_gems',
            'monthly_items',
            'seasonal_rewards',
          ],
        },
      };

      await this.createCalendarEvent(monthlyResetEvent);

      // Trigger monthly reset logic
      await this.triggerMonthlyReset();
    } catch (error) {
      this.logger.error('Failed to handle monthly reset', error);
    }
  }

  /**
   * Clean expired events
   */
  async cleanExpiredEvents() {
    try {
      const now = this.getCurrentTime().utc().toISOString();

      const { error } = await this.supabase
        .from('calendar_events')
        .update({ is_active: false, updated_at: new Date().toISOString() })
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
   * Clear event cache
   */
  clearEventCache() {
    this.eventCache.clear();
  }

  /**
   * Load cached calendar data
   */
  async loadCachedCalendarData() {
    try {
      // Load recent events into cache
      const now = this.getCurrentTime();
      const startOfDay = now.clone().startOf('day');
      const endOfDay = now.clone().endOf('day');

      await this.getCalendarEvents(
        startOfDay.format('YYYY-MM-DD HH:mm:ss'),
        endOfDay.format('YYYY-MM-DD HH:mm:ss'),
      );

      this.logger.info('Calendar cache loaded');
    } catch (error) {
      this.logger.error('Failed to load cached calendar data', error);
    }
  }

  /**
   * Start calendar updates
   */
  startCalendarUpdates() {
    this.logger.info('Starting calendar update schedules');
  }

  /**
   * Get calendar statistics
   */
  async getCalendarStatistics() {
    try {
      const now = this.getCurrentTime();
      const startOfMonth = now.clone().startOf('month');
      const endOfMonth = now.clone().endOf('month');

      const { data, error } = await this.supabase
        .from('calendar_events')
        .select('event_type, is_active, start_time')
        .gte('start_time', startOfMonth.utc().toISOString())
        .lte('start_time', endOfMonth.utc().toISOString());

      if (error) throw error;

      const stats = {
        totalEvents: data.length,
        activeEvents: data.filter((e) => e.is_active).length,
        eventTypes: {},
        upcomingEvents: 0,
        ongoingEvents: 0,
      };

      for (const event of data) {
        stats.eventTypes[event.event_type] = (stats.eventTypes[event.event_type] || 0) + 1;

        const eventStart = moment.tz(event.start_time, 'UTC');
        if (eventStart.isAfter(now)) {
          stats.upcomingEvents++;
        } else if (
          eventStart.isBefore(now) &&
          moment.tz(event.start_time, 'UTC').add(1, 'hour').isAfter(now)
        ) {
          stats.ongoingEvents++;
        }
      }

      return stats;
    } catch (error) {
      this.logger.error('Failed to get calendar statistics', error);
      throw new ServiceError('Failed to get calendar statistics', error);
    }
  }

  /**
   * Trigger daily reset logic
   */
  async triggerDailyReset() {
    // This would integrate with your game systems
    this.logger.info('Daily reset logic triggered');
  }

  /**
   * Trigger weekly reset logic
   */
  async triggerWeeklyReset() {
    // This would integrate with your game systems
    this.logger.info('Weekly reset logic triggered');
  }

  /**
   * Trigger monthly reset logic
   */
  async triggerMonthlyReset() {
    // This would integrate with your game systems
    this.logger.info('Monthly reset logic triggered');
  }
}

export { RealtimeCalendarService };
