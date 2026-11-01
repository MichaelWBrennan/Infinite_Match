/**
 * Social Competition Routes
 *
 * POST /api/retention/social-competition/guild-event - Create a guild event (admin)
 * POST /api/retention/social-competition/guild-event/:eventId/join - Join a guild event
 * POST /api/retention/social-competition/guild-event/:eventId/score - Record event score
 * GET /api/retention/social-competition/guild-event/:eventId/standings - Get event standings
 * POST /api/retention/social-competition/guild-event/:eventId/end - End a guild event (admin)
 * GET /api/retention/social-competition/guild-events - Get player's active guild events
 * POST /api/retention/social-competition/friend-score - Update friend leaderboard score
 * GET /api/retention/social-competition/friend-score/:period - Get friend leaderboard
 * GET /api/retention/social-competition/stats - Get social competition stats (admin)
 */

import express from 'express';
import security from '../../core/security/index.js';
import { Logger } from '../../core/logger/index.js';
import { accountEconomy } from '../../services/economy/AccountEconomyService.js';
import { socialStore } from '../../services/social/social-store.js';
import SocialCompetitionService from '../../services/retention/social-competition-service.js';

const router = express.Router();
const logger = new Logger('SocialCompetitionRoutes');

const socialCompetition = new SocialCompetitionService(accountEconomy, socialStore);

router.use(security.sessionValidation);

/** Create a guild event (admin only). */
router.post('/guild-event', async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.playerId !== 'admin') {
      return res.status(403).json({ success: false, error: 'admin_required', requestId: req.requestId });
    }
    const { guildId, eventType } = req.body || {};
    if (!guildId || !eventType) {
      return res.status(400).json({ success: false, error: 'guildId and eventType required', requestId: req.requestId });
    }
    const result = await socialCompetition.createGuildEvent(guildId, eventType, { createdBy: req.user.playerId });
    res.json({ success: result.success, ...result, requestId: req.requestId });
  } catch (error) {
    logger.error('Create guild event failed', { error: error.message });
    res.status(500).json({ success: false, error: 'create_guild_event_error', requestId: req.requestId });
  }
});

/** Join a guild event. */
router.post('/guild-event/:eventId/join', async (req, res) => {
  try {
    const { playerId } = req.user;
    const { eventId } = req.params;
    const result = await socialCompetition.joinGuildEvent(playerId, eventId);
    res.json({ success: result.success, ...result, requestId: req.requestId });
  } catch (error) {
    logger.error('Join guild event failed', { error: error.message });
    res.status(500).json({ success: false, error: 'join_guild_event_error', requestId: req.requestId });
  }
});

/** Record a score for a player in a guild event. */
router.post('/guild-event/:eventId/score', async (req, res) => {
  try {
    const { playerId } = req.user;
    const { eventId } = req.params;
    const { score } = req.body || {};
    if (score === undefined) {
      return res.status(400).json({ success: false, error: 'score required', requestId: req.requestId });
    }
    const result = await socialCompetition.recordEventScore(playerId, eventId, score);
    res.json({ success: result.success, ...result, requestId: req.requestId });
  } catch (error) {
    logger.error('Record event score failed', { error: error.message });
    res.status(500).json({ success: false, error: 'record_event_score_error', requestId: req.requestId });
  }
});

/** Get event standings. */
router.get('/guild-event/:eventId/standings', async (req, res) => {
  try {
    const { eventId } = req.params;
    const standings = socialCompetition.getEventStandings(eventId);
    if (!standings) {
      return res.status(404).json({ success: false, error: 'event_not_found', requestId: req.requestId });
    }
    res.json({ success: true, ...standings, requestId: req.requestId });
  } catch (error) {
    logger.error('Get event standings failed', { error: error.message });
    res.status(500).json({ success: false, error: 'event_standings_error', requestId: req.requestId });
  }
});

/** End a guild event (admin only). */
router.post('/guild-event/:eventId/end', async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.playerId !== 'admin') {
      return res.status(403).json({ success: false, error: 'admin_required', requestId: req.requestId });
    }
    const { eventId } = req.params;
    const result = await socialCompetition.endGuildEvent(eventId);
    res.json({ success: result.success, ...result, requestId: req.requestId });
  } catch (error) {
    logger.error('End guild event failed', { error: error.message });
    res.status(500).json({ success: false, error: 'end_guild_event_error', requestId: req.requestId });
  }
});

/** Get player's active guild events. */
router.get('/guild-events', async (req, res) => {
  try {
    const { playerId } = req.user;
    const events = socialCompetition.getPlayerGuildEvents(playerId);
    res.json({ success: true, events, count: events.length, requestId: req.requestId });
  } catch (error) {
    logger.error('Get player guild events failed', { error: error.message });
    res.status(500).json({ success: false, error: 'player_guild_events_error', requestId: req.requestId });
  }
});

/** Update friend leaderboard score. */
router.post('/friend-score', async (req, res) => {
  try {
    const { playerId } = req.user;
    const { score, period = 'weekly' } = req.body || {};
    if (score === undefined) {
      return res.status(400).json({ success: false, error: 'score required', requestId: req.requestId });
    }
    const result = socialCompetition.updateFriendScore(playerId, score, period);
    res.json({ success: true, ...result, requestId: req.requestId });
  } catch (error) {
    logger.error('Update friend score failed', { error: error.message });
    res.status(500).json({ success: false, error: 'update_friend_score_error', requestId: req.requestId });
  }
});

/** Get friend leaderboard. */
router.get('/friend-score/:period', async (req, res) => {
  try {
    const { period } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const result = socialCompetition.getFriendLeaderboard(period, limit);
    res.json({ success: true, ...result, requestId: req.requestId });
  } catch (error) {
    logger.error('Get friend leaderboard failed', { error: error.message });
    res.status(500).json({ success: false, error: 'friend_leaderboard_error', requestId: req.requestId });
  }
});

/** Get social competition stats (admin only). */
router.get('/stats', async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.playerId !== 'admin') {
      return res.status(403).json({ success: false, error: 'admin_required', requestId: req.requestId });
    }
    const stats = socialCompetition.getStats();
    res.json({ success: true, ...stats, requestId: req.requestId });
  } catch (error) {
    logger.error('Get social competition stats failed', { error: error.message });
    res.status(500).json({ success: false, error: 'social_stats_error', requestId: req.requestId });
  }
});

export default router;
