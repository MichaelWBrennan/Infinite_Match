/**
 * Push notification service for game events.
 *
 * Wraps the pluggable push transport (ntfy / webpush / fcm / log) and the
 * device token store, so game events can notify players across devices.
 *
 * Falls back silently to the log transport when no push credentials are
 * configured, so game features keep working without push set up.
 */
import { createPushTransport } from './push-transports.js';
import DeviceTokenDb from './DeviceTokenDb.js';
import { Logger } from '../../core/logger/index.js';
const logger = new Logger('PushService');
let transport = null;
/** Lazily create the transport once. */
function getTransport() {
    if (!transport)
        transport = createPushTransport(logger);
}
/** All device tokens registered for a user. */
async function getTokensForUser(userId) {
    const docs = await DeviceTokenDb.findByUserId(userId);
    return docs.map((d) => d.token);
}
/**
 * Send a push notification to one player's registered devices.
 * Returns { successCount, failureCount }. Never throws: DB or transport
 * failures are logged and treated as zero sends.
 */
export async function notifyPlayer({ userId, title, body, data = {} }) {
    let tokens = [];
    try {
        tokens = await getTokensForUser(userId);
    }
    catch (error) {
        logger.warn('Push token lookup failed, skipping notification', {
            userId,
            error: error.message,
        });
        return { successCount: 0, failureCount: 0, skipped: 'token_lookup_failed' };
    }
    if (!tokens.length)
        return { successCount: 0, failureCount: 0, skipped: 'no_tokens' };
    const payloads = tokens.map((token) => ({
        token,
        notification: { title, body },
        data: { ...data, playerId: userId },
    }));
    getTransport();
    try {
        const result = await transport.sendBatch(payloads);
        logger.info('Push notifications sent', {
            userId,
            successCount: result.successCount,
            failureCount: result.failureCount,
        });
        return result;
    }
    catch (error) {
        logger.error('Push notification batch failed', { userId, error: error.message });
        return { successCount: 0, failureCount: tokens.length, error: error.message };
    }
}
/** Notify all players in a list (e.g. guild members). */
export async function notifyPlayers({ userIds, title, body, data = {} }) {
    let totalSuccess = 0;
    let totalFailure = 0;
    for (const userId of userIds) {
        const result = await notifyPlayer({ userId, title, body, data });
        totalSuccess += result.successCount || 0;
        totalFailure += result.failureCount || 0;
    }
    return { successCount: totalSuccess, failureCount: totalFailure };
}
/** Default export for convenience. */
export default { notifyPlayer, notifyPlayers };
//# sourceMappingURL=push-service.js.map