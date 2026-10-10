/**
 * Push notification transports.
 *
 * Replaces the `firebase-admin` SDK with small, pluggable transports so the
 * notification pipeline runs on free/open-source infrastructure by default:
 *
 *   - `ntfy`     -> self-hosted ntfy.sh server (ISC), unlimited free push to
 *                   phones via the ntfy app or any subscriber. Default when
 *                   `NTFY_URL` is set.
 *   - `webpush`  -> W3C Web Push (RFC 8030) with VAPID, delivered by any
 *                   self-hosted push service or the browser's own push
 *                   service. Default when VAPID keys are set.
 *   - `fcm`      -> Firebase Cloud Messaging HTTP v1 API called directly with
 *                   native `fetch` + a service-account JWT (no vendor SDK).
 *                   Optional compatibility path for Android/iOS devices that
 *                   still register FCM tokens.
 *   - `log`      -> always-available fallback that records notifications
 *                   without delivering them, so engagement features keep
 *                   working in development.
 *
 * Every transport exposes:
 *   send(payload)        -> Promise<messageId>
 *   sendBatch(payloads)  -> Promise<{ successCount, failureCount, responses }>
 *
 * The `payload` is the FCM-style message object the notification service
 * already builds: `{ token, notification: { title, body }, data, android, apns }`.
 */
import { randomUUID } from 'node:crypto';
import { SignJWT, importPKCS8 } from 'jose';
const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
/* ------------------------------------------------------------------ */
/* ntfy (self-hosted, ISC licensed)                                    */
/* ------------------------------------------------------------------ */
class NtfyTransport {
    /** @param {{ baseUrl: string }} options */
    constructor({ baseUrl }) {
        this.name = 'ntfy';
        this.baseUrl = baseUrl.replace(/\/+$/, '');
        this.authToken = process.env.NTFY_TOKEN;
    }
    /** Device tokens double as ntfy topic names (or full topic URLs). */
    topicFor(token) {
        if (/^https?:\/\//.test(token)) {
            return token;
        }
        const topic = String(token).replace(/[^a-zA-Z0-9_-]/g, '-');
        return `${this.baseUrl}/${encodeURIComponent(topic)}`;
    }
    async send(payload) {
        const headers = {
            Title: payload.notification?.title || 'Infinite Match',
            Priority: payload.android?.priority === 'high' ? 'high' : 'default',
            Tags: 'video_game',
        };
        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        const clickUrl = payload.data?.url || payload.data?.click_action;
        if (clickUrl) {
            headers['Click'] = String(clickUrl);
        }
        const response = await fetch(this.topicFor(payload.token), {
            method: 'POST',
            headers,
            body: payload.notification?.body || '',
            signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) {
            throw new Error(`ntfy publish failed: HTTP ${response.status}`);
        }
        const result = await response.json().catch(() => ({}));
        return result.id || randomUUID();
    }
    async sendBatch(payloads) {
        let successCount = 0;
        let failureCount = 0;
        const responses = [];
        for (const payload of payloads) {
            try {
                const id = await this.send(payload);
                successCount++;
                responses.push({ success: true, messageId: id });
            }
            catch (error) {
                failureCount++;
                responses.push({ success: false, error: error.message });
            }
        }
        return { successCount, failureCount, responses };
    }
}
/* ------------------------------------------------------------------ */
/* W3C Web Push (VAPID)                                                */
/* ------------------------------------------------------------------ */
class WebPushTransport {
    constructor() {
        this.name = 'webpush';
        this.webpush = null;
    }
    async init() {
        // Lazy import keeps `web-push` optional at boot.
        const webpush = (await import('web-push')).default;
        webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:ops@infinite-match.local', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
        this.webpush = webpush;
    }
    /** Tokens are PushSubscription JSON (endpoint + keys) from the browser. */
    subscriptionFor(token) {
        try {
            const parsed = JSON.parse(token);
            if (parsed && parsed.endpoint) {
                return parsed;
            }
        }
        catch {
            // not JSON — fall through
        }
        throw new Error('webpush token is not a PushSubscription JSON object');
    }
    async send(payload) {
        if (!this.webpush) {
            await this.init();
        }
        const body = JSON.stringify({
            title: payload.notification?.title || 'Infinite Match',
            body: payload.notification?.body || '',
            data: payload.data || {},
        });
        const result = await this.webpush.sendNotification(this.subscriptionFor(payload.token), body, { TTL: payload.android?.ttl ? Math.floor(payload.android.ttl / 1000) : 3600 });
        return result.headers?.['location'] || randomUUID();
    }
    async sendBatch(payloads) {
        let successCount = 0;
        let failureCount = 0;
        const responses = [];
        for (const payload of payloads) {
            try {
                const id = await this.send(payload);
                successCount++;
                responses.push({ success: true, messageId: id });
            }
            catch (error) {
                failureCount++;
                responses.push({ success: false, error: error.message });
            }
        }
        return { successCount, failureCount, responses };
    }
}
/* ------------------------------------------------------------------ */
/* Firebase Cloud Messaging HTTP v1 (no firebase-admin SDK)             */
/* ------------------------------------------------------------------ */
class FcmTransport {
    constructor() {
        this.name = 'fcm';
        this.projectId = process.env.FIREBASE_PROJECT_ID;
        this.clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        this.privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
        this.accessToken = null;
        this.tokenExpiresAt = 0;
    }
    async getAccessToken() {
        if (this.accessToken && Date.now() < this.tokenExpiresAt) {
            return this.accessToken;
        }
        const now = Math.floor(Date.now() / 1000);
        const key = await importPKCS8(this.privateKey, 'RS256');
        const assertion = await new SignJWT({
            scope: FCM_SCOPE,
        })
            .setProtectedHeader({ alg: 'RS256' })
            .setIssuer(this.clientEmail)
            .setAudience('https://oauth2.googleapis.com/token')
            .setIssuedAt(now)
            .setExpirationTime(now + 3600)
            .sign(key);
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion,
            }),
            signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) {
            throw new Error(`FCM OAuth token exchange failed: HTTP ${response.status}`);
        }
        const data = await response.json();
        this.accessToken = data.access_token;
        this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
        return this.accessToken;
    }
    toV1Message(payload) {
        const message = {
            token: payload.token,
            notification: payload.notification
                ? {
                    title: payload.notification.title,
                    body: payload.notification.body,
                    image: payload.notification.image,
                }
                : undefined,
            data: payload.data,
            android: payload.android
                ? {
                    priority: payload.android.priority === 'high' ? 'HIGH' : 'NORMAL',
                    ttl: payload.android.ttl ? `${Math.floor(payload.android.ttl / 1000)}s` : undefined,
                    notification: payload.android.notification,
                }
                : undefined,
            apns: payload.apns,
        };
        // Drop undefined keys — the v1 API rejects unknown/empty fields.
        return JSON.parse(JSON.stringify(message));
    }
    async send(payload) {
        const accessToken = await this.getAccessToken();
        const response = await fetch(`https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ message: this.toV1Message(payload) }),
            signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) {
            const detail = await response.text().catch(() => '');
            throw new Error(`FCM send failed: HTTP ${response.status} ${detail}`);
        }
        const data = await response.json();
        return data.name || randomUUID();
    }
    async sendBatch(payloads) {
        let successCount = 0;
        let failureCount = 0;
        const responses = [];
        for (const payload of payloads) {
            try {
                const id = await this.send(payload);
                successCount++;
                responses.push({ success: true, messageId: id });
            }
            catch (error) {
                failureCount++;
                responses.push({ success: false, error: error.message });
            }
        }
        return { successCount, failureCount, responses };
    }
}
/* ------------------------------------------------------------------ */
/* Logging fallback                                                    */
/* ------------------------------------------------------------------ */
class LogTransport {
    constructor(logger) {
        this.name = 'log';
        this.logger = logger;
    }
    async send(payload) {
        const messageId = randomUUID();
        this.logger.info('push suppressed (no transport configured)', {
            messageId,
            to: payload.token,
            title: payload.notification?.title,
        });
        return messageId;
    }
    async sendBatch(payloads) {
        const responses = [];
        for (const payload of payloads) {
            responses.push({ success: true, messageId: await this.send(payload) });
        }
        return { successCount: responses.length, failureCount: 0, responses };
    }
}
/**
 * Pick a transport from the environment:
 *   PUSH_TRANSPORT = ntfy | webpush | fcm | log   (explicit choice)
 * Otherwise the first fully configured option wins: fcm -> webpush -> ntfy -> log.
 *
 * @param {{ info: Function, warn: Function }} logger
 */
export function createPushTransport(logger) {
    const explicit = (process.env.PUSH_TRANSPORT || '').toLowerCase();
    const hasFcm = process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY;
    const hasWebpush = process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY;
    const hasNtfy = process.env.NTFY_URL;
    const make = (choice) => {
        switch (choice) {
            case 'ntfy':
                return new NtfyTransport({ baseUrl: process.env.NTFY_URL || 'http://localhost:8080' });
            case 'webpush':
                return new WebPushTransport();
            case 'fcm':
                return new FcmTransport();
            default:
                return new LogTransport(logger);
        }
    };
    let choice = explicit;
    if (!choice) {
        if (hasFcm)
            choice = 'fcm';
        else if (hasWebpush)
            choice = 'webpush';
        else if (hasNtfy)
            choice = 'ntfy';
        else
            choice = 'log';
    }
    const transport = make(choice);
    if (choice === 'fcm' && !hasFcm) {
        logger.warn('PUSH_TRANSPORT=fcm but FIREBASE_* credentials are incomplete; using log transport');
        return new LogTransport(logger);
    }
    if (choice === 'webpush' && !hasWebpush) {
        logger.warn('PUSH_TRANSPORT=webpush but VAPID keys are missing; using log transport');
        return new LogTransport(logger);
    }
    return transport;
}
export { NtfyTransport, WebPushTransport, FcmTransport, LogTransport };
//# sourceMappingURL=push-transports.js.map