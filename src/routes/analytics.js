import express from 'express';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import security from 'core/security/index.js';
import { Logger } from 'core/logger/index.js';

const logger = new Logger('AnalyticsRoutes');
const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPORTS_DIR = join(__dirname, '..', '..', 'monitoring', 'reports');

const FX = {
  USD: 1,
  EUR: 1.09,
  GBP: 1.27,
  JPY: 0.0067,
  KRW: 0.00073,
  INR: 0.012,
  BRL: 0.18,
  IDR: 0.000064,
};

function toUsd(amount, currency) {
  const rate = FX[String(currency || 'USD').toUpperCase()] || 1;
  return Number(amount) * rate;
}

async function appendJsonl(filename, obj) {
  await fs.mkdir(REPORTS_DIR, { recursive: true });
  const path = join(REPORTS_DIR, filename);
  await fs.appendFile(path, JSON.stringify(obj) + '\n', 'utf-8');
}

function getPeriodFilename(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `purchases-${y}-${m}.jsonl`;
}

router.post('/purchase', security.sessionValidation, async (req, res) => {
  try {
    const { sku, amount, currency, platform } = req.body || {};
    const playerId = req.user?.playerId || req.body?.playerId || 'anon';

    if (!sku || amount == null || !currency) {
      return res.status(400).json({ success: false, error: 'sku, amount, currency required' });
    }

    const amountUsd = toUsd(amount, currency);
    const event = {
      type: 'purchase',
      playerId,
      sku,
      amount,
      currency,
      amountUsd,
      platform: platform || null,
      timestamp: new Date().toISOString(),
    };

    await appendJsonl(getPeriodFilename(), event);
    logger.info('Recorded purchase', { playerId, sku, amountUsd });
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to record purchase', { error: error.message });
    res.status(500).json({ success: false, error: 'record_error' });
  }
});

router.get('/arpu', security.sessionValidation, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, parseInt(req.query.days) || 30));
    const activeUsers = req.query.activeUsers ? parseInt(req.query.activeUsers) : null;

    const end = new Date();
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    const filenames = new Set();
    while (cursor <= end) {
      filenames.add(getPeriodFilename(cursor));
      cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
    }

    let totalRevenueUsd = 0;
    const payerIds = new Set();

    for (const file of filenames) {
      const path = join(REPORTS_DIR, file);
      try {
        const content = await fs.readFile(path, 'utf-8');
        const lines = content.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const evt = JSON.parse(line);
            if (evt.type !== 'purchase') continue;
            const ts = new Date(evt.timestamp).getTime();
            if (ts >= start.getTime() && ts <= end.getTime()) {
              totalRevenueUsd += Number(evt.amountUsd || 0);
              if (evt.playerId) payerIds.add(evt.playerId);
            }
          } catch (_) {}
        }
      } catch (_) {
        // file may not exist yet
      }
    }

    const arppu = payerIds.size > 0 ? totalRevenueUsd / payerIds.size : 0;
    const arpu = activeUsers ? totalRevenueUsd / activeUsers : null;

    res.json({ success: true, days, totalRevenueUsd, payers: payerIds.size, arppu, arpu, activeUsers });
  } catch (error) {
    logger.error('Failed to compute ARPU', { error: error.message });
    res.status(500).json({ success: false, error: 'compute_error' });
  }
});

export default router;
