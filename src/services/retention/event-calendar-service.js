/**
 * Event Calendar Service
 *
 * Schedules live-ops events in advance and sends advance notifications to build
 * player anticipation and habitual login patterns.
 *
 * Features:
 *  - Pre-scheduled event calendar (weekly recurring events, special events)
 *  - Advance notifications (24h, 1h before events start)
 *  - Event RSVP / reminders
 *  - Event history and completion tracking
 */

import { Logger } from '../../core/logger/index.js';
import { notifyPlayers } from '../push/push-service.js';

const logger = new Logger('EventCalendarService');

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Default event calendar. These are recurring events that players can expect.
 */
const DEFAULT_EVENT_CALENDAR = [
  {
    id: 'weekend_bonus',
    name: 'Weekend Bonus',
    type: 'recurring',
    recurrence: 'weekly',
    dayOfWeek: 5, // Friday
    startHour: 10, // 10 AM UTC
    durationHours: 48,
    description: '2x rewards all weekend long!',
    advanceNotify: [24, 1], // hours before event
  },
  {
    id: 'daily_challenge',
    name: 'Daily Challenge',
    type: 'recurring',
    recurrence: 'daily',
    startHour: 0, // Midnight UTC
    durationHours: 24,
    description: 'Complete today\'s challenge for exclusive rewards!',
    advanceNotify: [1],
  },
  {
    id: 'sky_race',
    name: "Sky Race",
    type: 'recurring',
    recurrence: 'weekly',
    dayOfWeek: 1, // Monday
    startHour: 12, // Noon UTC
    durationHours: 168, // 1 week
    description: 'Race to the top of the leaderboard!',
    advanceNotify: [24, 1],
  },
  {
    id: 'kings_cup',
    name: "King's Cup",
    type: 'recurring',
    recurrence: 'weekly',
    dayOfWeek: 3, // Wednesday
    startHour: 12, // Noon UTC
    durationHours: 72, // 3 days
    description: 'Compete with friends for amazing prizes!',
    advanceNotify: [24, 1],
  },
  {
    id: 'lightning_dash',
    name: 'Lightning Dash',
    type: 'recurring',
    recurrence: 'weekly',
    dayOfWeek: 6, // Sunday
    startHour: 15, // 3 PM UTC
    durationHours: 24,
    description: 'Fast-paced weekend event with boosted rewards!',
    advanceNotify: [6, 1],
  },
];

class EventCalendarService {
  constructor(accountEconomy) {
    this.accountEconomy = accountEconomy;

    // Event calendar: eventId -> event definition
    this.eventCalendar = new Map();

    // Scheduled events: eventId -> { startMs, endMs, status, playerIds }
    this.scheduledEvents = new Map();

    // Player RSVP/reminder preferences: playerId -> Set of eventIds they want reminders for
    this.playerReminders = new Map();

    // Advance notification history: playerId:eventId -> lastSentMs
    this.advanceNotifyHistory = new Map();

    // Initialize default calendar
    this.initializeDefaultCalendar();
  }

  /**
   * Initialize the default event calendar.
   */
  initializeDefaultCalendar() {
    const now = Date.now();
    for (const event of DEFAULT_EVENT_CALENDAR) {
      this.eventCalendar.set(event.id, {
        ...event,
        nextOccurrence: this.computeNextOccurrence(event, now),
      });
    }
    logger.info('Event calendar initialized', { eventCount: this.eventCalendar.size });
  }

  /**
   * Compute the next occurrence time for a recurring event.
   */
  computeNextOccurrence(event, fromMs = Date.now()) {
    const from = new Date(fromMs);

    if (event.recurrence === 'daily') {
      const next = new Date(from);
      next.setUTCHours(event.startHour, 0, 0, 0);
      if (next.getTime() <= fromMs) next.setUTCDate(next.getUTCDate() + 1);
      return next.getTime();
    }

    if (event.recurrence === 'weekly') {
      const next = new Date(from);
      next.setUTCHours(event.startHour, 0, 0, 0);
      let daysAhead = (event.dayOfWeek - next.getUTCDay() + 7) % 7;
      if (daysAhead === 0 && next.getTime() <= fromMs) daysAhead = 7;
      next.setUTCDate(next.getUTCDate() + daysAhead);
      return next.getTime();
    }

    // One-time event: use startHour today or tomorrow
    const next = new Date(from);
    next.setUTCHours(event.startHour, 0, 0, 0);
    if (next.getTime() <= fromMs) next.setUTCDate(next.getUTCDate() + 1);
    return next.getTime();
  }

  /**
   * Get the upcoming events calendar (next 30 days).
   */
  getUpcomingEvents(fromMs = Date.now(), days = 30) {
    const upcoming = [];
    const endMs = fromMs + days * DAY_MS;

    for (const [eventId, event] of this.eventCalendar.entries()) {
      let nextOccurrence = event.nextOccurrence || this.computeNextOccurrence(event, fromMs);

      // Generate all occurrences within the window
      while (nextOccurrence < endMs) {
        upcoming.push({
          eventId,
          ...event,
          startMs: nextOccurrence,
          endMs: nextOccurrence + event.durationHours * HOUR_MS,
        });

        // Compute next occurrence after this one
        if (event.recurrence === 'daily') {
          nextOccurrence += DAY_MS;
        } else if (event.recurrence === 'weekly') {
          nextOccurrence += 7 * DAY_MS;
        } else {
          break; // One-time event
        }
      }
    }

    upcoming.sort((a, b) => a.startMs - b.startMs);
    return upcoming;
  }

  /**
   * Get events starting soon (within the next 24 hours) for advance notifications.
   */
  getEventsStartingSoon(fromMs = Date.now(), windowMs = 24 * HOUR_MS) {
    const upcoming = this.getUpcomingEvents(fromMs, 7);
    const soon = [];
    const endMs = fromMs + windowMs;

    for (const event of upcoming) {
      if (event.startMs >= fromMs && event.startMs <= endMs) {
        soon.push(event);
      }
    }

    return soon;
  }

  /**
   * Register a player's interest in an event (they want reminders).
   */
  registerReminder(playerId, eventId) {
    if (!this.playerReminders.has(playerId)) {
      this.playerReminders.set(playerId, new Set());
    }
    this.playerReminders.get(playerId).add(eventId);
    logger.info('Event reminder registered', { playerId, eventId });
  }

  /**
   * Unregister a player's interest in an event.
   */
  unregisterReminder(playerId, eventId) {
    const reminders = this.playerReminders.get(playerId);
    if (reminders) {
      reminders.delete(eventId);
      if (reminders.size === 0) this.playerReminders.delete(playerId);
    }
  }

  /**
   * Get a player's event reminders.
   */
  getPlayerReminders(playerId) {
    const reminders = this.playerReminders.get(playerId);
    return reminders ? Array.from(reminders) : [];
  }

  /**
   * Send advance notifications for events starting soon.
   * Called by the scheduler before each event.
   */
  async sendAdvanceNotifications(playerEconomies, fromMs = Date.now()) {
    const upcoming = this.getEventsStartingSoon(fromMs);
    let totalSent = 0;
    const notificationsSent = [];

    for (const event of upcoming) {
      const hoursUntil = (event.startMs - fromMs) / HOUR_MS;

      // Check which advance-notify intervals apply
      for (const notifyHours of event.advanceNotify) {
        const notifyWindow = hoursUntil >= notifyHours - 0.5 && hoursUntil <= notifyHours + 0.5;
        if (!notifyWindow) continue;

        // Find players who want reminders for this event, or all active players
        const targetPlayers = this.getTargetPlayersForEvent(event, playerEconomies);

        for (const playerId of targetPlayers) {
          const cooldownKey = `${playerId}:${event.id}:${notifyHours}h`;
          const lastSent = this.advanceNotifyHistory.get(cooldownKey);
          if (lastSent && fromMs - lastSent < HOUR_MS) continue; // Don't spam within 1 hour

          try {
            await notifyPlayers({
              userIds: [playerId],
              title: `${event.name} starts in ${notifyHours} hours!`,
              body: `${event.description} Don't miss out!`,
              data: {
                type: 'event_advance_notify',
                eventId: event.id,
                eventName: event.name,
                startMs: event.startMs,
                notifyHours,
              },
            });

            this.advanceNotifyHistory.set(cooldownKey, fromMs);
            totalSent++;
            notificationsSent.push({ playerId, eventId: event.id, notifyHours });
          } catch (error) {
            logger.error('Failed to send advance notification', { playerId, eventId: event.id, error: error.message });
          }
        }
      }
    }

    logger.info('Advance notifications sent', { count: totalSent, eventCount: upcoming.length });
    return { sent: totalSent, notifications: notificationsSent };
  }

  /**
   * Get target players for an event (players who have opted in or are active).
   */
  getTargetPlayersForEvent(event, playerEconomies) {
    const targetPlayers = [];

    for (const [playerId, economy] of playerEconomies) {
      const stats = economy.statistics || {};
      const lastPlayed = stats.lastPlayed ? new Date(stats.lastPlayed).getTime() : 0;
      const daysInactive = lastPlayed > 0 ? (Date.now() - lastPlayed) / DAY_MS : Infinity;

      // Target active players (played in last 7 days) or players who registered for reminders
      const hasReminder = this.playerReminders.get(playerId)?.has(event.id);
      if (hasReminder || daysInactive <= 7) {
        targetPlayers.push(playerId);
      }
    }

    return targetPlayers;
  }

  /**
   * Schedule a one-time special event.
   */
  scheduleSpecialEvent(eventData, { nowMs = Date.now() } = {}) {
    const eventId = `special_${Date.now()}`;
    const startMs = new Date(eventData.startMs).getTime();
    const endMs = startMs + (eventData.durationHours || 24) * HOUR_MS;

    this.scheduledEvents.set(eventId, {
      id: eventId,
      ...eventData,
      startMs,
      endMs,
      status: 'scheduled',
      createdAt: nowMs,
    });

    logger.info('Special event scheduled', { eventId, name: eventData.name, startMs });
    return eventId;
  }

  /**
   * Get all scheduled special events.
   */
  getScheduledEvents() {
    return Array.from(this.scheduledEvents.values());
  }

  /**
   * Get calendar stats for admin dashboard.
   */
  getStats() {
    const now = Date.now();
    const upcoming = this.getUpcomingEvents(now, 30);
    const activeEvents = Array.from(this.scheduledEvents.values()).filter((e) => e.status === 'active').length;
    const totalReminders = Array.from(this.playerReminders.values()).reduce((sum, s) => sum + s.size, 0);

    return {
      totalEvents: this.eventCalendar.size,
      upcomingEvents: upcoming.length,
      activeSpecialEvents: activeEvents,
      totalPlayerReminders: totalReminders,
    };
  }
}

export default EventCalendarService;
export { EventCalendarService, DEFAULT_EVENT_CALENDAR };
