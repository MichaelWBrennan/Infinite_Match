/**
 * Push Preferences Routes
 *
 * GET /api/retention/push-preferences - Get player's push trigger preferences
 * POST /api/retention/push-preferences/:triggerType - Set a trigger preference
 * GET /api/retention/push-preferences/all - Get all preferences with defaults
 * POST /api/retention/push-preferences - Set multiple preferences
 * POST /api/retention/push-preferences/reset - Reset to defaults
 */

import express from 'express';
import security from '../../core/security/index.js';
import { Logger } from '../../core/logger/index.js';
import { accountEconomy } from '../../services/economy/AccountEconomyService.js';
import PushPreferencesService from '../../services/push/push-preferences-service.js';

const router = express.Router();
const logger = new Logger('PushPreferencesRoutes');

const pushPreferences = new PushPreferencesService(accountEconomy);

router.use(security.sessionValidation);

/** Get player's push trigger preferences. */
router.get('/', async (req, res) => {
  try {
    const { playerId } = req.user;
    const prefs = await pushPreferences.getPreferences(playerId);
    res.json({ success: true, preferences: prefs, requestId: req.requestId });
  } catch (error) {
    logger.error('Get push preferences failed', { error: error.message });
    res.status(500).json({ success: false, error: 'get_preferences_error', requestId: req.requestId });
  }
});

/** Set a single trigger preference. */
router.post('/:triggerType', async (req, res) => {
  try {
    const { playerId } = req.user;
    const { triggerType } = req.params;
    const { enabled } = req.body || {};
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ success: false, error: 'enabled must be a boolean', requestId: req.requestId });
    }
    const result = await pushPreferences.setEnabled(playerId, triggerType, enabled);
    res.json({ success: true, ...result, requestId: req.requestId });
  } catch (error) {
    logger.error('Set push preference failed', { error: error.message });
    res.status(500).json({ success: false, error: 'set_preference_error', requestId: req.requestId });
  }
});

/** Get all preferences with defaults applied. */
router.get('/all', async (req, res) => {
  try {
    const { playerId } = req.user;
    const all = await pushPreferences.getAll(playerId);
    res.json({ success: true, preferences: all, requestId: req.requestId });
  } catch (error) {
    logger.error('Get all push preferences failed', { error: error.message });
    res.status(500).json({ success: false, error: 'get_all_preferences_error', requestId: req.requestId });
  }
});

/** Set multiple trigger preferences at once. */
router.post('/', async (req, res) => {
  try {
    const { playerId } = req.user;
    const { preferences } = req.body || {};
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ success: false, error: 'preferences object required', requestId: req.requestId });
    }
    const result = await pushPreferences.setMultiple(playerId, preferences);
    res.json({ success: true, ...result, requestId: req.requestId });
  } catch (error) {
    logger.error('Set multiple push preferences failed', { error: error.message });
    res.status(500).json({ success: false, error: 'set_multiple_preferences_error', requestId: req.requestId });
  }
});

/** Reset preferences to defaults. */
router.post('/reset', async (req, res) => {
  try {
    const { playerId } = req.user;
    const result = await pushPreferences.resetToDefaults(playerId);
    res.json({ success: true, ...result, requestId: req.requestId });
  } catch (error) {
    logger.error('Reset push preferences failed', { error: error.message });
    res.status(500).json({ success: false, error: 'reset_preferences_error', requestId: req.requestId });
  }
});

/** Get trigger preference definitions. */
router.get('/definitions', async (_req, res) => {
  try {
    const definitions = pushPreferences.getAllTriggerDefinitions();
    res.json({ success: true, definitions, requestId: undefined });
  } catch (error) {
    logger.error('Get push preference definitions failed', { error: error.message });
    res.status(500).json({ success: false, error: 'definitions_error', requestId: undefined });
  }
});

export default router;
