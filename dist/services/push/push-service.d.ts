/**
 * Send a push notification to one player's registered devices.
 * Returns { successCount, failureCount }. Never throws: DB or transport
 * failures are logged and treated as zero sends.
 */
export function notifyPlayer({ userId, title, body, data }: {
    userId: any;
    title: any;
    body: any;
    data?: {} | undefined;
}): Promise<any>;
/** Notify all players in a list (e.g. guild members). */
export function notifyPlayers({ userIds, title, body, data }: {
    userIds: any;
    title: any;
    body: any;
    data?: {} | undefined;
}): Promise<{
    successCount: number;
    failureCount: number;
}>;
declare namespace _default {
    export { notifyPlayer };
    export { notifyPlayers };
}
export default _default;
//# sourceMappingURL=push-service.d.ts.map