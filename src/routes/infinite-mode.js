/**
 * Infinite Mode Routes - makes "Infinite Match" live up to its name.
 *
 * Endpoints:
 *   GET    /api/infinite-mode/level           - Generate next endless level (no cap)
 *   POST   /api/infinite-mode/run/complete    - Complete an endless run (verified)
 *   GET    /api/infinite-mode/state/:playerId - Player infinite progression state
 *   GET    /api/infinite-mode/leaderboard     - Global endless leaderboard
 *   GET    /api/infinite-mode/events          - Perpetual rotating live events
 *   POST   /api/infinite-mode/prestige        - Manually trigger prestige
 */

import express from 'express';
import { Logger } from '../core/logger/index.js';
import { InfiniteModeService } from '../services/meta/infinite-mode-service.js';

const router = express.Router();
const logger = new Logger('InfiniteModeRoutes');

const infiniteModeService = new InfiniteModeService();

/**
 * GET /api/infinite-mode/level
 * Generate the next endless level for a player. No level cap - scales forever.
 * Query params: playerId, lat, lon, timezone, country
 */
router.get('/level', async (req, res) => {
  try {
    const { playerId, lat, lon, timezone, country } = req.query;
    if (!playerId) {
      return res.status(400).json({ success: false, error: 'playerId is required' });
    }

    const context = {
      lat: lat !== undefined ? parseFloat(lat) : undefined,
      lon: lon !== undefined ? parseFloat(lon) : undefined,
      timezone: timezone || 'UTC',
      country: country || 'US',
    };

    const level = await infiniteModeService.generateEndlessLevel(playerId, { context });
    return res.json({ success: true, level, infinite: true });
  } catch (error) {
    logger.error('Failed to generate endless level', { error: error.message });
    return res.status(500).json({ success: false, error: 'Endless level generation failed' });
  }
});

/**
 * POST /api/infinite-mode/run/complete
 * Complete an endless run. Server-authoritative - verifies the replay before
 * awarding XP/coins and updating paragon/prestige progression.
 */
router.post('/run/complete', async (req, res) => {
  try {
    const { playerId, score, levelReached, movesMade, timeMs, verified } = req.body || {};

    if (!playerId) {
      return res.status(400).json({ success: false, error: 'playerId is required' });
    }
    if (!Number.isInteger(score) || score < 0) {
      return res.status(400).json({ success: false, error: 'Invalid score' });
    }
    if (!Number.isInteger(levelReached) || levelReached < 1) {
      return res.status(400).json({ success: false, error: 'Invalid level reached' });
    }

    const result = await infiniteModeService.completeEndlessRun(playerId, {
      score,
      levelReached,
      movesMade,
      timeMs,
      verified: verified === true,
    });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Failed to complete endless run', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to complete endless run' });
  }
});

/**
 * GET /api/infinite-mode/state/:playerId
 * Get a player's infinite mode progression state (paragon, prestige, streak, etc.)
 */
router.get('/state/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const summary = infiniteModeService.getPlayerSummary(playerId);
    return res.json({ success: true, ...summary, infinite: true });
  } catch (error) {
    logger.error('Failed to get player state', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to get player state' });
  }
});

/**
 * GET /api/infinite-mode/leaderboard
 * Get the global endless leaderboard (top 1000, no cap on players).
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit } = req.query;
    const leaderboard = infiniteModeService.getLeaderboard({
      limit: limit ? parseInt(limit) : 100,
    });
    return res.json({ success: true, leaderboard, infinite: true });
  } catch (error) {
    logger.error('Failed to get leaderboard', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to get leaderboard' });
  }
});

/**
 * GET /api/infinite-mode/events
 * Get perpetual rotating live events. The rotation never ends - new events
 * are AI-generated on demand.
 */
router.get('/events', async (req, res) => {
  try {
    const { count } = req.query;
    const events = await infiniteModeService.getPerpetualEvents({
      count: count ? parseInt(count) : 3,
    });
    return res.json({ success: true, events, count: events.length, perpetual: true });
  } catch (error) {
    logger.error('Failed to get perpetual events', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to get perpetual events' });
  }
});

/**
 * POST /api/infinite-mode/prestige
 * Manually trigger prestige if available.
 */
router.post('/prestige', async (req, res) => {
  try {
    const { playerId } = req.body || {};
    if (!playerId) {
      return res.status(400).json({ success: false, error: 'playerId is required' });
    }

    const state = infiniteModeService.getPlayerState(playerId);
    const available = infiniteModeService.checkPrestigeAvailable(state);

    if (!available) {
      const tier = infiniteModeService.getPrestigeTier(state.prestige);
      return res.status(400).json({
        success: false,
        error: 'prestige_not_available',
        requiredLevel: tier.requiredLevel,
        currentLevel: state.totalEndlessLevels,
      });
    }

    state.prestige += 1;
    state.prestigePoints += 1;
    state.endlessLevel = 1;
    state.totalEndlessLevels = 0;

    logger.info('Manual prestige triggered', { playerId, newPrestige: state.prestige });

    return res.json({
      success: true,
      prestige: state.prestige,
      prestigePoints: state.prestigePoints,
      endlessLevel: state.endlessLevel,
      message: 'Prestiged! Endless level reset, paragon and prestige points kept.',
    });
  } catch (error) {
    logger.error('Failed to prestige', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to prestige' });
  }
});

export default router;
