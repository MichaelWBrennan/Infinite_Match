import express from 'express';
import { Logger } from '../core/logger/index.js';
import PurchaseLedger from '../services/payments/PurchaseLedger.js';
import {
  verifyAppleSignedPayload,
  verifyGooglePubSubToken,
} from '../services/payments/store-notifications.js';

const router = express.Router();
const logger = new Logger('SubscriptionsRoutes');

// Events are recorded only after the sender is verified. Unverified bodies are rejected,
// not stored. A missing configuration returns 503 so the store retries once it is fixed.

// Apple App Store Server Notifications V2
router.post('/apple', async (req, res) => {
  const rootCertPem = process.env.APPLE_ROOT_CA_G3;
  if (!rootCertPem) {
    return res.status(503).json({ ok: false, error: 'apple_verification_not_configured' });
  }
  try {
    const payload = verifyAppleSignedPayload(req.body?.signedPayload, { rootCertPem });
    const eventType = payload.notificationType || 'unknown';
    await PurchaseLedger.recordSubscriptionEvent({
      provider: 'apple',
      eventType,
      notificationUUID: payload.notificationUUID || null,
      raw: payload,
    });
    res.json({ ok: true });
  } catch (error) {
    logger.warn('Rejected Apple subscription notification', { error: error.message });
    res.status(401).json({ ok: false, error: 'invalid_signature' });
  }
});

// Google Real-time Developer Notifications, delivered by Pub/Sub push
router.post('/google', async (req, res) => {
  const audience = process.env.GOOGLE_RTDN_AUDIENCE;
  const serviceAccountEmail = process.env.GOOGLE_RTDN_SERVICE_ACCOUNT;
  if (!audience || !serviceAccountEmail) {
    return res.status(503).json({ ok: false, error: 'google_verification_not_configured' });
  }
  try {
    await verifyGooglePubSubToken(req.headers.authorization, { audience, serviceAccountEmail });
  } catch (error) {
    logger.warn('Rejected Google subscription notification', { error: error.message });
    return res.status(401).json({ ok: false, error: 'invalid_token' });
  }
  try {
    const message = req.body?.message || {};
    let decoded = null;
    try {
      if (message.data) {
        decoded = JSON.parse(Buffer.from(String(message.data), 'base64').toString('utf-8'));
      }
    } catch (_) {
      // Authenticated but not decodable: keep the envelope so it can be inspected, and ack it.
    }
    await PurchaseLedger.recordSubscriptionEvent({
      provider: 'google',
      eventType: 'rtdn',
      messageId: message.messageId || null,
      raw: decoded,
    });
    res.json({ ok: true });
  } catch (error) {
    logger.error('Google subscription webhook error', { error: error.message });
    res.status(500).json({ ok: false });
  }
});

export default router;
