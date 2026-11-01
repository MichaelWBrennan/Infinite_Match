import express from 'express';
import security, { requireMinRole } from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';
import { validateLevelResult, runTuning, isNearMiss, nearMissUrgency } from '../services/level-tuning.js';
import { levelResultsStore } from '../services/level-results-store.js';
import { readLevelOverrides } from '../services/meta/level-overrides.js';

const router = express.Router();
const logger = new Logger('LevelResultsRoutes');

// Public: the tuning multipliers the game applies to its level targets.
router.get('/targets', (req, res) => {
  const overrides = readLevelOverrides();
  res.json({ success: true, levels: overrides.levels, updatedAt: overrides.updatedAt });
});

// Signed-in players report each finished level. The record has no player ID, so the
// tuning data does not identify anyone. When a loss is a near miss ("one step away"),
// the response includes a time-boxed urgency offer for discounted extra moves — the
// Royal Match loss-aversion monetization moment.
router.post('/', security.sessionValidation, async (req, res) => {
  const parsed = validateLevelResult(req.body);
  if (parsed.error) {
    return res.status(400).json({ success: false, error: parsed.error, requestId: req.requestId });
  }
  try {
    await levelResultsStore().append(parsed.value);

    // Costs are server-set; the client cannot override them.
    const CONTINUE_COST_COINS = 100;
    const CONTINUE_EXTRA_MOVES = 5;

    let urgencyOffer = null;
    if (isNearMiss(parsed.value)) {
      const urgency = nearMissUrgency(parsed.value);
      const discountedCost = Math.round(CONTINUE_COST_COINS * (1 - urgency.discountPercent / 100));
      urgencyOffer = {
        urgency: urgency.urgency,
        offer: urgency.offer,
        movesAdded: urgency.movesAdded,
        normalCostCoins: CONTINUE_COST_COINS,
        discountedCostCoins: Math.max(1, discountedCost),
        discountPercent: urgency.discountPercent,
        // Offer expires 10 minutes after the near-miss loss.
        expiresAt: Date.now() + 10 * 60 * 1000,
      };
    }

    res.json({ success: true, urgencyOffer, requestId: req.requestId });
  } catch (error) {
    logger.error('Failed to store level result', { error: error.message });
    res.status(500).json({ success: false, error: 'storage_failed', requestId: req.requestId });
  }
});

// Operator only. The step the tuning job would take now, without saving it. Each level counts
// only results since its last move.
router.get('/tuning', security.sessionValidation, requireMinRole('admin'), async (req, res) => {
  try {
    const plan = await runTuning({ store: levelResultsStore(), apply: false });
    res.json({
      success: true,
      proposals: plan.proposals,
      current: readLevelOverrides().levels,
      updatedAt: readLevelOverrides().updatedAt,
      source: 'legacy_client_reported_only',
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Tuning report failed', { error: error.message });
    res.status(500).json({ success: false, error: 'tuning_error', requestId: req.requestId });
  }
});

// Legacy tuning is opt-in, review-only by default. A human approves ONE previewed level
// with a preregistered review id; scheduled previews never change a paid target.
router.post('/tuning/apply', security.sessionValidation, requireMinRole('admin'), async (req, res) => {
  if (process.env.LEVEL_TUNING_MANUAL_ENABLED !== '1') {
    return res.status(403).json({ success: false, error: 'tuning_apply_disabled', requestId: req.requestId });
  }
  const { level, expectedFrom, expectedUpdatedAt, reviewId } = req.body || {};
  if (!Number.isSafeInteger(level) || level < 1 || level > 10000
    || typeof expectedFrom !== 'number' || expectedFrom < 0.8 || expectedFrom > 1.2
    || !Object.hasOwn(req.body || {}, 'expectedUpdatedAt')
    || !(expectedUpdatedAt === null || typeof expectedUpdatedAt === 'string')
    || typeof reviewId !== 'string' || !/^review-[a-z0-9-]{8,48}$/.test(reviewId)) {
    return res.status(400).json({ success: false, error: 'invalid_tuning_approval', requestId: req.requestId });
  }
  try {
    const plan = await runTuning({ store: levelResultsStore(), apply: true,
      approvedLevel: level, expectedFrom, expectedUpdatedAt });
    const saved = readLevelOverrides();
    security.logSecurityEvent('legacy_tuning_approved', { playerId: req.user.playerId, level, reviewId, changes: plan.proposals });
    res.json({ success: true, applied: plan.proposals, levels: saved.levels,
      updatedAt: saved.updatedAt, reviewId, requestId: req.requestId });
  } catch (error) {
    if (error.code === 'tuning_plan_stale' || error.code === 'tuning_approval_required') return res.status(409).json({ success: false, error: error.code, requestId: req.requestId });
    logger.error('Tuning apply failed', { error: error.message });
    res.status(500).json({ success: false, error: 'tuning_error', requestId: req.requestId });
  }
});

export default router;
