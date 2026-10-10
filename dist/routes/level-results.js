import express from 'express';
import security, { requireMinRole } from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';
import { validateLevelResult, runTuning } from '../services/level-tuning.js';
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
// tuning data does not identify anyone.
router.post('/', security.sessionValidation, async (req, res) => {
    const parsed = validateLevelResult(req.body);
    if (parsed.error) {
        return res.status(400).json({ success: false, error: parsed.error, requestId: req.requestId });
    }
    try {
        await levelResultsStore().append(parsed.value);
        res.json({ success: true, requestId: req.requestId });
    }
    catch (error) {
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
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger.error('Tuning report failed', { error: error.message });
        res.status(500).json({ success: false, error: 'tuning_error', requestId: req.requestId });
    }
});
// Operator only. Applies the step: each flagged level moves one 5% step, within the cap.
// It runs when an operator calls it, or on the optional schedule (LEVEL_TUNING_INTERVAL_HOURS).
router.post('/tuning/apply', security.sessionValidation, requireMinRole('admin'), async (req, res) => {
    try {
        const plan = await runTuning({ store: levelResultsStore(), apply: true });
        const saved = readLevelOverrides();
        res.json({
            success: true,
            applied: plan.proposals,
            levels: saved.levels,
            updatedAt: saved.updatedAt,
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger.error('Tuning apply failed', { error: error.message });
        res.status(500).json({ success: false, error: 'tuning_error', requestId: req.requestId });
    }
});
export default router;
//# sourceMappingURL=level-results.js.map