import express from 'express';
import { Logger } from 'core/logger/index.js';
import PurchaseLedger from 'services/payments/PurchaseLedger.js';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const router = express.Router();
const logger = new Logger('SubscriptionsRoutes');

// Apple Server-to-Server Notifications (legacy V1 and V2 JSON supported loosely)
router.post('/apple', async (req, res) => {
  try {
    const body = req.body || {};
    let eventType = body.notification_type || body.notificationType || 'unknown';
    if (body.signedPayload) {
      try {
        const JWKS = createRemoteJWKSet(new URL('https://api.storekit.itunes.apple.com/inApps/v1/notifications/jwsKeys'));
        const { payload } = await jwtVerify(String(body.signedPayload), JWKS, { algorithms: ['ES256'] });
        eventType = payload.notificationType || payload.eventType || eventType;
        await PurchaseLedger.recordSubscriptionEvent({ provider: 'apple', eventType, raw: payload });
        return res.json({ ok: true });
      } catch (_) {}
    }
    await PurchaseLedger.recordSubscriptionEvent({ provider: 'apple', eventType, raw: body });
    res.json({ ok: true });
  } catch (error) {
    logger.error('Apple subscription webhook error', { error: error.message });
    res.status(500).json({ ok: false });
  }
});

// Google Real-time Developer Notifications (RTDN)
router.post('/google', async (req, res) => {
  try {
    const body = req.body || {};
    const message = body.message || {};
    let decoded = null;
    try {
      if (message.data) {
        const json = Buffer.from(String(message.data), 'base64').toString('utf-8');
        decoded = JSON.parse(json);
      }
    } catch (_) {}
    await PurchaseLedger.recordSubscriptionEvent({ provider: 'google', eventType: 'rtdn', raw: body, message, decoded });
    res.json({ ok: true });
  } catch (error) {
    logger.error('Google subscription webhook error', { error: error.message });
    res.status(500).json({ ok: false });
  }
});

export default router;
