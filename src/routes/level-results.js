import express from 'express';
import { Logger } from '../core/logger/index.js';
import security from '../core/security/index.js';
import { validateLevelResult, appendLevelResult } from '../services/level-tuning.js';

const router = express.Router();
const logger = new Logger('LevelResultsRoutes');

// Signed-in players report each finished level. The record has no player ID, so the
// tuning data does not identify anyone.
router.post('/', security.sessionValidation, async (req, res) => {
  const parsed = validateLevelResult(req.body);
  if (parsed.error) {
    return res.status(400).json({ success: false, error: parsed.error, requestId: req.requestId });
  }
  try {
    await appendLevelResult(parsed.value);
    res.json({ success: true, requestId: req.requestId });
  } catch (error) {
    logger.error('Failed to store level result', { error: error.message });
    res.status(500).json({ success: false, error: 'storage_failed', requestId: req.requestId });
  }
});

export default router;
