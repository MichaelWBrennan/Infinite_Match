import express from 'express';
import { promises as fs } from 'fs';
import { join } from 'path';
import { Logger } from 'core/logger/index.js';

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

export default router;
