import express from 'express';
import { promises as fs } from 'fs';

import { Logger } from '../core/logger/index.js';
import { requireEntitlement } from '../middleware/entitlements.js';

const router = express.Router();
const logger = new Logger('BattlePassRoutes');

const CONFIG_PATH = 'config/battlepass/config.json';

router.get('/config', async (req, res) => {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    const json = JSON.parse(raw);
    res.json({ success: true, pass: json });
  } catch (error) {
    logger.error('Failed to load battle pass config', { error: error.message });
    res.status(500).json({ success: false, error: 'config_error' });
  }
});

// Claiming premium rewards is not built yet. Returning success here would tell the
// player a reward was granted when nothing changed, so this stays 501 until it grants items.
router.post('/premium/reward', requireEntitlement('season_pass_premium'), (req, res) => {
  res.status(501).json({ success: false, error: 'not_implemented' });
});

export default router;
