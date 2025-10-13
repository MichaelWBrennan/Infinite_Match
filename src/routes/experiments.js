import express from 'express';
import { promises as fs } from 'fs';
import { join } from 'path';
import { Logger } from 'core/logger/index.js';

const router = express.Router();
const logger = new Logger('ExperimentsRoutes');
const REPORTS_DIR = 'monitoring/reports';

function jsonl(file, obj) {
  return fs.appendFile(join(REPORTS_DIR, file), JSON.stringify(obj) + '\n', 'utf-8');
}

router.post('/assign', async (req, res) => {
  try {
    const { userId, experiment, variant } = req.body || {};
    if (!userId || !experiment || !variant) {
      return res.status(400).json({ success: false, error: 'userId, experiment, variant required' });
    }
    const evt = { type: 'assign', userId, experiment, variant, ts: Date.now() };
    await jsonl('experiments.jsonl', evt);
    res.json({ success: true });
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
