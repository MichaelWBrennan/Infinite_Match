import express from 'express';
import { Logger } from 'core/logger/index.js';

const router = express.Router();
const logger = new Logger('CRMRoutes');

router.post('/webhook', async (req, res) => {
  try {
    const { event, userId, campaignId, metadata } = req.body || {};
    if (!event || !userId) {
      return res.status(400).json({ success: false, error: 'missing event or userId' });
    }
    logger.info('CRM event', { event, userId, campaignId, metadata });
    res.json({ success: true });
  } catch (error) {
    logger.error('CRM webhook error', { error: error.message });
    res.status(500).json({ success: false });
  }
});

router.post('/push/send', async (req, res) => {
  try {
    const { userId, title, body } = req.body || {};
    if (!userId || !title || !body) {
      return res.status(400).json({ success: false, error: 'userId, title, body required' });
    }
    logger.info('Push queued', { userId, title });
    res.json({ success: true, queued: true });
  } catch (error) {
    logger.error('Push send error', { error: error.message });
    res.status(500).json({ success: false });
  }
});

export default router;
