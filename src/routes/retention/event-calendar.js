/**
 * Event Calendar Routes
 *
 * GET /api/retention/event-calendar/upcoming - Get upcoming events
 * GET /api/retention/event-calendar/soon - Get events starting soon
 * POST /api/retention/event-calendar/reminder - Register for event reminders
 * DELETE /api/retention/event-calendar/reminder - Unregister event reminders
 * GET /api/retention/event-calendar/reminders - Get player's reminders
 * POST /api/retention/event-calendar/special - Schedule a special event (admin)
 * GET /api/retention/event-calendar/special - Get scheduled special events (admin)
 */

import express from 'express';
import security from '../../core/security/index.js';
import { Logger } from '../../core/logger/index.js';
import { accountEconomy } from '../../services/economy/AccountEconomyService.js';
import EventCalendarService from '../../services/retention/event-calendar-service.js';

const router = express.Router();
const logger = new Logger('EventCalendarRoutes');

const eventCalendar = new EventCalendarService(accountEconomy);

router.use(security.sessionValidation);

/** Get upcoming events (next 30 days). */
router.get('/upcoming', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const upcoming = eventCalendar.getUpcomingEvents(Date.now(), days);
    res.json({ success: true, events: upcoming, count: upcoming.length, requestId: req.requestId });
  } catch (error) {
    logger.error('Get upcoming events failed', { error: error.message });
    res.status(500).json({ success: false, error: 'upcoming_events_error', requestId: req.requestId });
  }
});

/** Get events starting soon (within 24 hours). */
router.get('/soon', async (req, res) => {
  try {
    const soon = eventCalendar.getEventsStartingSoon(Date.now());
    res.json({ success: true, events: soon, count: soon.length, requestId: req.requestId });
  } catch (error) {
    logger.error('Get events starting soon failed', { error: error.message });
    res.status(500).json({ success: false, error: 'events_soon_error', requestId: req.requestId });
  }
});

/** Register for event reminders. */
router.post('/reminder', async (req, res) => {
  try {
    const { playerId } = req.user;
    const { eventId } = req.body || {};
    if (!eventId) {
      return res.status(400).json({ success: false, error: 'eventId required', requestId: req.requestId });
    }
    eventCalendar.registerReminder(playerId, eventId);
    res.json({ success: true, eventId, requestId: req.requestId });
  } catch (error) {
    logger.error('Register event reminder failed', { error: error.message });
    res.status(500).json({ success: false, error: 'register_reminder_error', requestId: req.requestId });
  }
});

/** Unregister event reminders. */
router.delete('/reminder', async (req, res) => {
  try {
    const { playerId } = req.user;
    const { eventId } = req.body || {};
    eventCalendar.unregisterReminder(playerId, eventId);
    res.json({ success: true, eventId, requestId: req.requestId });
  } catch (error) {
    logger.error('Unregister event reminder failed', { error: error.message });
    res.status(500).json({ success: false, error: 'unregister_reminder_error', requestId: req.requestId });
  }
});

/** Get player's event reminders. */
router.get('/reminders', async (req, res) => {
  try {
    const { playerId } = req.user;
    const reminders = eventCalendar.getPlayerReminders(playerId);
    res.json({ success: true, reminders, requestId: req.requestId });
  } catch (error) {
    logger.error('Get player reminders failed', { error: error.message });
    res.status(500).json({ success: false, error: 'get_reminders_error', requestId: req.requestId });
  }
});

/** Schedule a special event (admin only). */
router.post('/special', async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.playerId !== 'admin') {
      return res.status(403).json({ success: false, error: 'admin_required', requestId: req.requestId });
    }
    const eventId = eventCalendar.scheduleSpecialEvent(req.body || {});
    res.json({ success: true, eventId, requestId: req.requestId });
  } catch (error) {
    logger.error('Schedule special event failed', { error: error.message });
    res.status(500).json({ success: false, error: 'schedule_event_error', requestId: req.requestId });
  }
});

/** Get scheduled special events (admin only). */
router.get('/special', async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.playerId !== 'admin') {
      return res.status(403).json({ success: false, error: 'admin_required', requestId: req.requestId });
    }
    const events = eventCalendar.getScheduledEvents();
    res.json({ success: true, events, count: events.length, requestId: req.requestId });
  } catch (error) {
    logger.error('Get scheduled events failed', { error: error.message });
    res.status(500).json({ success: false, error: 'get_scheduled_events_error', requestId: req.requestId });
  }
});

/** Get calendar stats (admin only). */
router.get('/stats', async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.playerId !== 'admin') {
      return res.status(403).json({ success: false, error: 'admin_required', requestId: req.requestId });
    }
    const stats = eventCalendar.getStats();
    res.json({ success: true, ...stats, requestId: req.requestId });
  } catch (error) {
    logger.error('Get calendar stats failed', { error: error.message });
    res.status(500).json({ success: false, error: 'calendar_stats_error', requestId: req.requestId });
  }
});

export default router;
