/**
 * AI-First Live Ops Routes - Phase 8.
 *
 * Endpoints:
 *   POST   /api/ai/levels/adaptive          - Generate AI-adaptive level for a player
 *   POST   /api/ai/levels/record-attempt    - Record attempt outcome for skill tracking
 *   GET    /api/ai/levels/skill-profile     - Get player's skill profile
 *   GET    /api/ai/offers/personalized      - Get personalized dynamic offers
 *   POST   /api/ai/offers/validate          - Validate a dynamic offer before purchase
 *   GET    /api/ai/events/generated         - Get active AI-generated live events
 *   POST   /api/ai/events/schedule          - Schedule a series of AI events (admin)
 *   GET    /api/ai/pricing/market-adjusted  - Get market-adjusted pricing catalog
 *   POST   /api/ai/pricing/refresh          - Refresh competitor market data (admin)
 */

import express from 'express';
import { Logger } from '../core/logger/index.js';
import { AdaptiveLevelService } from '../services/ai/adaptive-level-service.js';
import { DynamicOffersService } from '../services/ai/dynamic-offers-service.js';
import { EventGeneratorService } from '../services/ai/event-generator-service.js';
import { MarketPricingService } from '../services/ai/market-pricing-service.js';

const router = express.Router();
const logger = new Logger('AIAdaptiveRoutes');

// Singleton service instances (shared across requests)
const adaptiveLevelService = new AdaptiveLevelService();
const dynamicOffersService = new DynamicOffersService();
const eventGeneratorService = new EventGeneratorService();
const marketPricingService = new MarketPricingService();

/**
 * POST /api/ai/levels/adaptive
 * Generate an AI-adaptive level tuned to the player's skill.
 */
router.post('/levels/adaptive', async (req, res) => {
  try {
    const { playerId, levelNumber, mode, context } = req.body;
    if (!playerId) {
      return res.status(400).json({ success: false, error: 'playerId is required' });
    }

    const level = await adaptiveLevelService.generateAdaptiveLevel(playerId, {
      levelNumber: levelNumber || 1,
      mode: mode || 'classic',
      context,
    });

    return res.json({ success: true, level });
  } catch (error) {
    logger.error('Failed to generate adaptive level', { error: error.message });
    return res.status(500).json({ success: false, error: 'Adaptive level generation failed' });
  }
});

/**
 * POST /api/ai/levels/record-attempt
 * Record a completed attempt for adaptive skill tracking.
 */
router.post('/levels/record-attempt', async (req, res) => {
  try {
    const { playerId, level, stars, moves, timeMs, boosterUsed, won } = req.body;
    if (!playerId) {
      return res.status(400).json({ success: false, error: 'playerId is required' });
    }

    adaptiveLevelService.recordAttempt(playerId, {
      level, stars, moves, timeMs, boosterUsed, won,
    });

    const profile = adaptiveLevelService.getSkillProfile(playerId);
    return res.json({
      success: true,
      skillProfile: {
        gamesPlayed: profile.gamesPlayed,
        gamesWon: profile.gamesWon,
        winRate: profile.winRate,
        avgStars: profile.avgStars,
        skillScore: profile.skillScore,
        difficultyTier: adaptiveLevelService.getDifficultyTier(profile.skillScore),
      },
    });
  } catch (error) {
    logger.error('Failed to record attempt', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to record attempt' });
  }
});

/**
 * GET /api/ai/levels/skill-profile
 * Get a player's adaptive skill profile.
 */
router.get('/levels/skill-profile', async (req, res) => {
  try {
    const { playerId } = req.query;
    if (!playerId) {
      return res.status(400).json({ success: false, error: 'playerId is required' });
    }

    const profile = adaptiveLevelService.getSkillProfile(playerId);
    return res.json({
      success: true,
      playerId,
      gamesPlayed: profile.gamesPlayed,
      gamesWon: profile.gamesWon,
      winRate: profile.winRate,
      avgStars: profile.avgStars,
      skillScore: profile.skillScore,
      difficultyTier: adaptiveLevelService.getDifficultyTier(profile.skillScore),
    });
  } catch (error) {
    logger.error('Failed to get skill profile', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to get skill profile' });
  }
});

/**
 * GET /api/ai/offers/personalized
 * Get personalized dynamic offers for a player.
 */
router.get('/offers/personalized', async (req, res) => {
  try {
    const { playerId } = req.query;
    if (!playerId) {
      return res.status(400).json({ success: false, error: 'playerId is required' });
    }

    const context = {
      spendHistory: req.body?.spendHistory || [],
      sessionCount: parseInt(req.query.sessionCount) || 0,
      lastSessionMs: parseInt(req.query.lastSessionMs) || Date.now(),
      winRate: parseFloat(req.query.winRate) || 0.5,
    };

    const result = await dynamicOffersService.getPersonalizedOffers(playerId, { context });
    return res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Failed to get personalized offers', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to get personalized offers' });
  }
});

/**
 * POST /api/ai/offers/validate
 * Validate a dynamic offer before purchase (server-authoritative price check).
 */
router.post('/offers/validate', async (req, res) => {
  try {
    const { playerId, offerId } = req.body;
    if (!playerId || !offerId) {
      return res.status(400).json({ success: false, error: 'playerId and offerId are required' });
    }

    const result = dynamicOffersService.validateDynamicOffer(playerId, offerId);
    return res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Failed to validate offer', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to validate offer' });
  }
});

/**
 * GET /api/ai/events/generated
 * Get active AI-generated live events.
 */
router.get('/events/generated', async (req, res) => {
  try {
    const events = eventGeneratorService.getActiveEvents();
    return res.json({ success: true, events, count: events.length });
  } catch (error) {
    logger.error('Failed to get events', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to get events' });
  }
});

/**
 * POST /api/ai/events/schedule
 * Schedule a rotating series of AI events (admin/operator).
 */
router.post('/events/schedule', async (req, res) => {
  try {
    const { startMs, intervalMs, count } = req.body;
    const events = await eventGeneratorService.scheduleEvents({
      startMs: startMs || Date.now(),
      intervalMs: intervalMs || 24 * 60 * 60 * 1000,
      count: count || 7,
    });
    return res.json({ success: true, events, count: events.length });
  } catch (error) {
    logger.error('Failed to schedule events', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to schedule events' });
  }
});

/**
 * POST /api/ai/events/:eventId/score
 * Record a player's score in an event leaderboard.
 */
router.post('/events/:eventId/score', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { playerId, score, verified } = req.body;
    if (!playerId || score === undefined) {
      return res.status(400).json({ success: false, error: 'playerId and score are required' });
    }

    const result = eventGeneratorService.recordEventScore(eventId, playerId, score, { verified });
    return res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Failed to record event score', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to record event score' });
  }
});

/**
 * GET /api/ai/pricing/market-adjusted
 * Get market-adjusted pricing catalog.
 */
router.get('/pricing/market-adjusted', async (req, res) => {
  try {
    const baseCatalog = [
      { id: 'starter-pack', type: 'bundle', name: 'Starter Pack', baseCostCents: 99, discountPercent: 0 },
      { id: 'booster-bundle', type: 'boosters', name: 'Booster Bundle', baseCostCents: 299, discountPercent: 10 },
      { id: 'life-refill', type: 'consumable', name: 'Life Refill', baseCostCents: 199, discountPercent: 0 },
    ];

    const catalog = await marketPricingService.getMarketPricingCatalog(baseCatalog);
    return res.json({ success: true, catalog, count: catalog.length });
  } catch (error) {
    logger.error('Failed to get market pricing', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to get market pricing' });
  }
});

/**
 * POST /api/ai/pricing/refresh
 * Refresh competitor market data (admin/operator).
 */
router.post('/pricing/refresh', async (req, res) => {
  try {
    const result = await marketPricingService.refreshMarketData();
    return res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Failed to refresh market data', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to refresh market data' });
  }
});

/**
 * GET /api/ai/pricing/market-summary
 * Get market context summary (admin dashboard).
 */
router.get('/pricing/market-summary', async (req, res) => {
  try {
    const summary = marketPricingService.getMarketSummary();
    return res.json({ success: true, ...summary });
  } catch (error) {
    logger.error('Failed to get market summary', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to get market summary' });
  }
});

export default router;
