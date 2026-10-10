import express from 'express';
import { Logger } from '../core/logger/index.js';
import DeviceTokenDb from '../services/push/DeviceTokenDb.js';
import security from '../core/security/index.js';
import { adminAuth } from '../middleware/admin-auth.js';
import { createPushTransport } from '../services/push/push-transports.js';
const router = express.Router();
const logger = new Logger('PushRoutes');
// Pluggable push transports (ntfy / web-push / FCM HTTP v1 / log). The
// transport is chosen from the environment — see services/push/push-transports.js.
const pushTransport = createPushTransport(logger);
router.post('/register', security.sessionValidation, async (req, res) => {
    try {
        const userId = req.user.playerId;
        const { token, platform, locale } = req.body || {};
        if (!token)
            return res.status(400).json({ success: false, error: 'token required' });
        await DeviceTokenDb.upsert({ userId, token, platform, locale });
        res.json({ success: true, stored: true });
    }
    catch (error) {
        logger.error('Token register error', { error: error.message });
        res.status(500).json({ success: false });
    }
});
router.post('/send', adminAuth, async (req, res) => {
    try {
        const { token, title, body, data } = req.body || {};
        if (!token || !title || !body) {
            return res.status(400).json({ success: false, error: 'token, title, body required' });
        }
        const message = { token, notification: { title, body }, data: data || {} };
        const id = await pushTransport.send(message);
        if (pushTransport.name === 'log') {
            logger.warn('No push transport configured; mock delivery');
            return res.json({ success: true, id, mocked: true });
        }
        res.json({ success: true, id });
    }
    catch (error) {
        logger.error('Push send error', { error: error.message });
        res.status(500).json({ success: false });
    }
});
export default router;
//# sourceMappingURL=push.js.map