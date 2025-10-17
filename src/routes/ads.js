import express from 'express';
import security from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';
import AdEventDb from '../services/ads/AdEventDb.js';

const router = express.Router();
const logger = new Logger('AdsRoutes');

router.post('/event', security.sessionValidation, async (req, res) => {
  try {
    const { network, format, event, revenueUsd, placement, country } = req.body || {};
    const userId = req.user?.playerId;
    if (!network || !format || !event)
      return res.status(400).json({ success: false, error: 'network, format, event required' });
    await AdEventDb.record({
      userId,
      network,
      format,
      event,
      revenueUsd: Number(revenueUsd || 0),
      placement,
      country,
    });
    res.json({ success: true });
  } catch (error) {
    logger.error('ad event error', { error: error.message });
    res.status(500).json({ success: false });
  }
});

router.get('/metrics', security.sessionValidation, async (req, res) => {
  try {
    const days = parseInt(req.query.days || '7');
    const country = req.query.country;
    const format = req.query.format;
    const data = await AdEventDb.metrics({ days, country, format });
    res.json({ success: true, data });
  } catch (error) {
    logger.error('ad metrics error', { error: error.message });
    res.status(500).json({ success: false });
  }
});

export default router;
