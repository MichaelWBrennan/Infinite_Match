/**
 * Push notification trigger routes.
 *
 * Players can view and manage which automatic push notification triggers they
 * want to receive (energy full, streak reminder, battle pass ending, etc.).
 * Triggers are evaluated by the PushTriggerService when game events occur.
 */
import express from 'express';
import security from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';
import { getAllTriggers, getAll, setEnabled, isEnabled, sendTrigger, } from '../services/push/push-triggers.js';
const router = express.Router();
const logger = new Logger('PushTriggerRoutes');
// List all available trigger types and the player's current preferences.
router.get('/', security.sessionValidation, async (req, res) => {
    try {
        const { playerId } = req.user;
        const allTriggers = getAllTriggers();
        const preferences = getAll(playerId);
        res.json({
            success: true,
            triggers: Object.entries(allTriggers).map(([type, def]) => ({
                ...def,
                enabled: preferences[type] ?? false,
            })),
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger.error('List push triggers failed', { error: error.message });
        res.status(500).json({ success: false, error: 'trigger_list_error', requestId: req.requestId });
    }
});
// Enable or disable a single trigger type for the player.
router.post('/:triggerType', security.sessionValidation, async (req, res) => {
    try {
        const { playerId } = req.user;
        const { triggerType } = req.params;
        const { enabled } = req.body || {};
        if (typeof enabled !== 'boolean') {
            return res
                .status(400)
                .json({ success: false, error: 'enabled must be a boolean', requestId: req.requestId });
        }
        // Validate the trigger type exists
        if (!isEnabled(playerId, triggerType) && !Object.keys(require('../services/push/push-triggers.js').getAllTriggers()).includes(triggerType)) {
            return res
                .status(400)
                .json({ success: false, error: 'unknown_trigger_type', requestId: req.requestId });
        }
        setEnabled(playerId, triggerType, enabled);
        logger.info('Push trigger preference updated', { playerId, triggerType, enabled });
        res.json({
            success: true,
            triggerType,
            enabled,
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger.error('Update push trigger failed', { error: error.message });
        res.status(500).json({ success: false, error: 'trigger_update_error', requestId: req.requestId });
    }
});
// Test-send a specific trigger to the player (development only).
router.post('/:triggerType/test', security.sessionValidation, async (req, res) => {
    try {
        const { playerId } = req.user;
        const { triggerType } = req.params;
        const templateVars = req.body || {};
        const result = await sendTrigger(playerId, triggerType, templateVars);
        res.json({
            success: result.sent,
            result,
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger.error('Test push trigger failed', { error: error.message });
        res.status(500).json({ success: false, error: 'trigger_test_error', requestId: req.requestId });
    }
});
export default router;
//# sourceMappingURL=push-triggers.js.map