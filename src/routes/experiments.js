import express from 'express';
import { promises as fs } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { Logger } from 'core/logger/index.js';

const router = express.Router();
const logger = new Logger('ExperimentsRoutes');
const REPORTS_DIR = 'monitoring/reports';

function jsonl(file, obj) {
  return fs.appendFile(join(REPORTS_DIR, file), JSON.stringify(obj) + '\n', 'utf-8');
}

function stickyAssign(key, variants) {
  const h = createHash('sha1').update(String(key)).digest('hex').slice(0, 8);
  const n = parseInt(h, 16);
  const idx = n % variants.length;
  return variants[idx];
}

router.post('/assign', async (req, res) => {
  try {
    const { userId, experiment, variants } = req.body || {};
    if (!userId || !experiment || !Array.isArray(variants) || variants.length < 2) {
      return res
        .status(400)
        .json({ success: false, error: 'userId, experiment, variants[] required' });
    }
    const variant = stickyAssign(userId, variants);
    const evt = { type: 'assign', userId, experiment, variant, ts: Date.now() };
    await jsonl('experiments.jsonl', evt);
    res.json({ success: true, variant });
  } catch (error) {
    logger.error('Assign error', { error: error.message });
    res.status(500).json({ success: false });
  }
});

router.post('/funnel', async (req, res) => {
  try {
    const { userId, step, context } = req.body || {};
    if (!userId || !step) {
      return res.status(400).json({ success: false, error: 'userId and step required' });
    }
    const evt = { type: 'funnel', userId, step, context: context || null, ts: Date.now() };
    await jsonl('paywall_funnel.jsonl', evt);
    res.json({ success: true });
  } catch (error) {
    logger.error('Funnel error', { error: error.message });
    res.status(500).json({ success: false });
  }
});

export default router;
