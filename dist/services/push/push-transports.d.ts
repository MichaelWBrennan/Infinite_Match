/**
 * Pick a transport from the environment:
 *   PUSH_TRANSPORT = ntfy | webpush | fcm | log   (explicit choice)
 * Otherwise the first fully configured option wins: fcm -> webpush -> ntfy -> log.
 *
 * @param {{ info: Function, warn: Function }} logger
 */
export function createPushTransport(logger: {
    info: Function;
    warn: Function;
}): LogTransport | NtfyTransport | WebPushTransport | FcmTransport;
export class LogTransport {
    constructor(logger: any);
    name: string;
    logger: any;
    send(payload: any): Promise<`${string}-${string}-${string}-${string}-${string}`>;
    sendBatch(payloads: any): Promise<{
        successCount: number;
        failureCount: number;
        responses: {
            success: boolean;
            messageId: `${string}-${string}-${string}-${string}-${string}`;
        }[];
    }>;
}
export class NtfyTransport {
    /** @param {{ baseUrl: string }} options */
    constructor({ baseUrl }: {
        baseUrl: string;
    });
    name: string;
    baseUrl: string;
    authToken: string | undefined;
    /** Device tokens double as ntfy topic names (or full topic URLs). */
    topicFor(token: any): any;
    send(payload: any): Promise<any>;
    sendBatch(payloads: any): Promise<{
        successCount: number;
        failureCount: number;
        responses: ({
            success: boolean;
            messageId: any;
            error?: never;
        } | {
            success: boolean;
            error: any;
            messageId?: never;
        })[];
    }>;
}
export class WebPushTransport {
    name: string;
    webpush: any;
    init(): Promise<void>;
    /** Tokens are PushSubscription JSON (endpoint + keys) from the browser. */
    subscriptionFor(token: any): any;
    send(payload: any): Promise<any>;
    sendBatch(payloads: any): Promise<{
        successCount: number;
        failureCount: number;
        responses: ({
            success: boolean;
            messageId: any;
            error?: never;
        } | {
            success: boolean;
            error: any;
            messageId?: never;
        })[];
    }>;
}
export class FcmTransport {
    name: string;
    projectId: string | undefined;
    clientEmail: string | undefined;
    privateKey: string;
    accessToken: any;
    tokenExpiresAt: number;
    getAccessToken(): Promise<any>;
    toV1Message(payload: any): any;
    send(payload: any): Promise<any>;
    sendBatch(payloads: any): Promise<{
        successCount: number;
        failureCount: number;
        responses: ({
            success: boolean;
            messageId: any;
            error?: never;
        } | {
            success: boolean;
            error: any;
            messageId?: never;
        })[];
    }>;
}
//# sourceMappingURL=push-transports.d.ts.map