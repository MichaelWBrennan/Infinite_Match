import express from 'express';
import { Logger } from '../core/logger/index.js';
import PurchaseLedger from '../services/payments/PurchaseLedger.js';
import { verifyAppleSignedPayload, verifyGooglePubSubToken, } from '../services/payments/store-notifications.js';
import { reverseTransaction, appleTransactionIds, googleTransactionIds, } from '../services/payments/refunds.js';
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
    let payload;
    try {
        payload = verifyAppleSignedPayload(req.body?.signedPayload, { rootCertPem });
        const eventType = payload.notificationType || 'unknown';
        await PurchaseLedger.recordSubscriptionEvent({
            provider: 'apple',
            eventType,
            notificationUUID: payload.notificationUUID || null,
            raw: payload,
        });
    }
    catch (error) {
        logger.warn('Rejected Apple subscription notification', { error: error.message });
        return res.status(401).json({ ok: false, error: 'invalid_signature' });
    }
    // A refund or revocation takes back a one-time purchase. Apple names the purchase in a second
    // signed payload. Its failure is not retried. A reversal that fails is retried by Apple.
    if (payload.notificationType === 'REFUND' || payload.notificationType === 'REVOKE') {
        let transactionInfo = null;
        try {
            transactionInfo = verifyAppleSignedPayload(payload.data?.signedTransactionInfo, { rootCertPem });
        }
        catch (error) {
            logger.error('Apple refund notification has no verifiable transaction', { error: error.message });
        }
        if (transactionInfo) {
            try {
                await reverseTransaction({
                    transactionIds: appleTransactionIds(transactionInfo),
                    reason: `apple_${payload.notificationType.toLowerCase()}`,
                });
            }
            catch (error) {
                logger.error('Apple refund reversal failed; Apple will retry', { error: error.message });
                return res.status(500).json({ ok: false, error: 'reversal_failed' });
            }
        }
    }
    res.json({ ok: true });
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
    }
    catch (error) {
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
        }
        catch (_) {
            // Authenticated but not decodable: keep the envelope so it can be inspected, and ack it.
        }
        await PurchaseLedger.recordSubscriptionEvent({
            provider: 'google',
            eventType: 'rtdn',
            messageId: message.messageId || null,
            raw: decoded,
        });
        // A voided purchase takes back a one-time purchase. Failure makes Google retry the message.
        const voided = decoded?.voidedPurchaseNotification;
        if (voided?.purchaseToken) {
            await reverseTransaction({ transactionIds: googleTransactionIds(voided.purchaseToken), reason: 'google_voided' });
        }
        res.json({ ok: true });
    }
    catch (error) {
        logger.error('Google subscription webhook error', { error: error.message });
        res.status(500).json({ ok: false });
    }
});
export default router;
//# sourceMappingURL=subscriptions.js.map