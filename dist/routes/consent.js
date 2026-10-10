import express from 'express';
import { Logger } from '../core/logger/index.js';
import ConsentService from '../services/consent/ConsentService.js';
import security from '../core/security/index.js';
const router = express.Router();
const logger = new Logger('ConsentRoutes');
// Consent is per player: the session decides whose consent is read or written.
router.use(security.sessionValidation);
router.post('/set', async (req, res) => {
    try {
        const userId = req.user.playerId;
        const { adsAllowed, npa, gdpr, att } = req.body || {};
        const updated = await ConsentService.setConsent(userId, { adsAllowed, npa, gdpr, att });
        res.json({ success: true, consent: updated });
    }
    catch (error) {
        logger.error('Set consent error', { error: error.message });
        res.status(500).json({ success: false });
    }
});
router.get('/:userId', async (req, res) => {
    if (req.params.userId !== req.user.playerId) {
        return res.status(403).json({ success: false, error: 'forbidden' });
    }
    try {
        const consent = await ConsentService.getConsent(req.params.userId);
        res.json({ success: true, consent });
    }
    catch (error) {
        logger.error('Get consent error', { error: error.message });
        res.status(500).json({ success: false });
    }
});
export default router;
//# sourceMappingURL=consent.js.map