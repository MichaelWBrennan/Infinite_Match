import express from 'express';
import { Logger } from '../core/logger/index.js';
import DeviceTokenDb from '../services/push/DeviceTokenDb.js';

let admin = null;
try {
  // Lazy load
  admin = await import('firebase-admin');
  if (!admin.apps || admin.apps.length === 0) {
    const serviceAccountJson = process.env.FCM_SERVICE_ACCOUNT_JSON || null;
    if (serviceAccountJson) {
      const credential = admin.credential.cert(JSON.parse(serviceAccountJson));
      admin.initializeApp({ credential });
    }
  }
} catch (_) {}

const router = express.Router();
const logger = new Logger('PushRoutes');

router.post('/register', async (req, res) => {
  try {
    const { userId, token, platform, locale } = req.body || {};
    if (!userId || !token)
      return res.status(400).json({ success: false, error: 'userId, token required' });
    await DeviceTokenDb.upsert({ userId, token, platform, locale });
    res.json({ success: true, stored: true });
  } catch (error) {
    logger.error('Token register error', { error: error.message });
    res.status(500).json({ success: false });
  }
});

router.post('/send', async (req, res) => {
  try {
    const { token, title, body, data } = req.body || {};
    if (!token || !title || !body) {
      return res.status(400).json({ success: false, error: 'token, title, body required' });
    }
    if (!admin || !admin.messaging) {
      logger.warn('FCM not configured; mock delivery');
      return res.json({ success: true, mocked: true });
    }
    const message = { token, notification: { title, body }, data: data || {} };
    const id = await admin.messaging().send(message);
    res.json({ success: true, id });
  } catch (error) {
    logger.error('Push send error', { error: error.message });
    res.status(500).json({ success: false });
  }
});

export default router;
