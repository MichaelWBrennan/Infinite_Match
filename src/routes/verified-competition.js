/**
 * Verified Competitive Play Routes - Phase 9.
 *
 * Endpoints:
 *   POST   /api/competition/tournaments          - Create a tournament
 *   GET    /api/competition/tournaments/active   - Get active tournaments
 *   GET    /api/competition/tournaments/:id      - Get a tournament (with level definition)
 *   POST   /api/competition/tournaments/:id/result - Submit a replay-verified tournament result
 *   GET    /api/competition/tournaments/:id/leaderboard - Get verified leaderboard
 *   POST   /api/competition/tournaments/:id/finalize - Finalize a completed tournament (admin)
 *   GET    /api/competition/player/:playerId     - Get player's tournament entries
 *   POST   /api/cross-platform/sync              - Sync progress from a platform
 *   GET    /api/cross-platform/state/:playerId   - Get unified merged state
 *   GET    /api/cross-platform/summary/:playerId - Get cross-platform progress summary
 */

import express from 'express';
import { Logger } from '../core/logger/index.js';
import { VerifiedTournamentService } from '../services/competition/verified-tournament-service.js';
import { ProgressionSyncService } from '../services/cross-platform/progression-sync-service.js';

const router = express.Router();
const logger = new Logger('VerifiedCompetitionRoutes');

const tournamentService = new VerifiedTournamentService();
const syncService = new ProgressionSyncService();

/**
 * POST /api/competition/tournaments
 * Create a new tournament.
 */
router.post('/tournaments', async (req, res) => {
  try {
    const { name, levelNumber, mode, startsAt, endsAt, entryFee, prizePool, maxEntries } = req.body;
    if (!levelNumber) {
      return res.status(400).json({ success: false, error: 'levelNumber is required' });
    }

    const tournament = tournamentService.createTournament({
      name, levelNumber, mode, startsAt, endsAt, entryFee, prizePool, maxEntries,
    });

    return res.status(201).json({ success: true, tournament });
  } catch (error) {
    logger.error('Failed to create tournament', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to create tournament' });
  }
});

/**
 * GET /api/competition/tournaments/active
 * Get all active tournaments at the current time.
 */
router.get('/tournaments/active', async (req, res) => {
  try {
    const nowMs = req.query.nowMs ? parseInt(req.query.nowMs) : Date.now();
    const tournaments = tournamentService.getActiveTournaments({ nowMs });
    return res.json({ success: true, tournaments, count: tournaments.length });
  } catch (error) {
    logger.error('Failed to get active tournaments', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to get active tournaments' });
  }
});

/**
 * GET /api/competition/tournaments/:id
 * Get a tournament by ID. Includes level definition if active.
 */
router.get('/tournaments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tournament = tournamentService.getTournament(id);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    return res.json({ success: true, tournament });
  } catch (error) {
    logger.error('Failed to get tournament', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to get tournament' });
  }
});

/**
 * POST /api/competition/tournaments/:id/result
 * Submit a replay-verified tournament match result.
 * The replay is verified server-side before the result is accepted.
 */
router.post('/tournaments/:id/result', async (req, res) => {
  try {
    const { id: tournamentId } = req.params;
    const { playerId, moves, reportedScore, reportedProgress, receipts } = req.body;

    if (!playerId) {
      return res.status(400).json({ success: false, error: 'playerId is required' });
    }
    if (!Array.isArray(moves)) {
      return res.status(400).json({ success: false, error: 'moves array is required' });
    }

    const result = await tournamentService.submitTournamentResult(tournamentId, playerId, {
      moves,
      reportedScore,
      reportedProgress,
      receipts,
    });

    if (!result.accepted) {
      return res.status(400).json({ success: false, ...result });
    }

    return res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Failed to submit tournament result', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to submit tournament result' });
  }
});

/**
 * GET /api/competition/tournaments/:id/leaderboard
 * Get the verified leaderboard for a tournament.
 */
router.get('/tournaments/:id/leaderboard', async (req, res) => {
  try {
    const { id: tournamentId } = req.params;
    const { limit } = req.query;
    const leaderboard = tournamentService.getLeaderboard(tournamentId, {
      limit: limit ? parseInt(limit) : 100,
    });
    return res.json({ success: true, ...leaderboard });
  } catch (error) {
    logger.error('Failed to get leaderboard', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to get leaderboard' });
  }
});

/**
 * POST /api/competition/tournaments/:id/finalize
 * Finalize a completed tournament and compute winners (admin/operator).
 */
router.post('/tournaments/:id/finalize', async (req, res) => {
  try {
    const { id: tournamentId } = req.params;
    const nowMs = req.body?.nowMs ? parseInt(req.body.nowMs) : Date.now();
    const result = tournamentService.finalizeTournament(tournamentId, { nowMs });
    return res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Failed to finalize tournament', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to finalize tournament' });
  }
});

/**
 * GET /api/competition/player/:playerId
 * Get all tournaments a player has entered.
 */
router.get('/player/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const tournaments = tournamentService.getPlayerTournaments(playerId);
    return res.json({ success: true, playerId, tournaments, count: tournaments.length });
  } catch (error) {
    logger.error('Failed to get player tournaments', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to get player tournaments' });
  }
});

/**
 * POST /api/cross-platform/sync
 * Sync progress from a specific platform (WebGL, iOS, Android, Facebook).
 */
router.post('/cross-platform/sync', async (req, res) => {
  try {
    const { playerId, platform, data } = req.body;
    if (!playerId || !platform || !data) {
      return res.status(400).json({ success: false, error: 'playerId, platform, and data are required' });
    }

    const result = syncService.syncPlatformProgress(playerId, platform, data);
    return res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Failed to sync platform progress', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to sync platform progress' });
  }
});

/**
 * GET /api/cross-platform/state/:playerId
 * Get the unified merged state (source of truth) for a player.
 */
router.get('/cross-platform/state/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const state = syncService.getMergedState(playerId);
    return res.json({ success: true, ...state });
  } catch (error) {
    logger.error('Failed to get merged state', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to get merged state' });
  }
});

/**
 * GET /api/cross-platform/summary/:playerId
 * Get cross-platform progress summary.
 */
router.get('/cross-platform/summary/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const summary = syncService.getProgressSummary(playerId);
    return res.json({ success: true, ...summary });
  } catch (error) {
    logger.error('Failed to get progress summary', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to get progress summary' });
  }
});

export default router;
