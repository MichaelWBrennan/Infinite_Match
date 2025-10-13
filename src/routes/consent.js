import express from 'express';
import { Logger } from 'core/logger/index.js';
import ConsentService from 'services/consent/ConsentService.js';

const router = express.Router();
const logger = new Logger('ConsentRoutes');

router.post('/set', async (req, res) => {
  try {
    const { userId, adsAllowed, npa, gdpr, att } = req.body || {};
    if (!userId) return res.status(400).json({ success: false, error: 'userId required' });
    const updated = await ConsentService.setConsent(userId, { adsAllowed, npa, gdpr, att });
    res.json({ success: true, consent: updated });
  } catch (error) {
    logger.error('Set consent error', { error: error.message });
    res.status(500).json({ success: false });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const consent = await ConsentService.getConsent(req.params.userId);
    res.json({ success: true, consent });
  } catch (error) {
    logger.error('Get consent error', { error: error.message });
    res.status(500).json({ success: false });
  }
});

export default router;
