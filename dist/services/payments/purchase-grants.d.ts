/**
 * Returns { granted: true, duplicate } or { granted: false, reason }.
 * Options `credit` and `durable` exist for tests; production uses the defaults.
 */
export function grantPurchase({ playerId, productId, transactionId, platform, atMs, credit, durable, }: {
    playerId: any;
    productId: any;
    transactionId: any;
    platform: any;
    atMs?: number | undefined;
    credit?: ((playerId: any, grants: any) => Promise<{
        success: boolean;
        currencyId: any;
        oldAmount: any;
        newAmount: any;
        operation: string;
        source: string;
    }>) | undefined;
    durable?: boolean | undefined;
}): Promise<{
    granted: boolean;
    reason: string;
    duplicate?: never;
} | {
    granted: boolean;
    duplicate: boolean;
    reason?: never;
}>;
/** Thrown when the grant cannot finish now but should be retried. */
export class GrantRetryableError extends Error {
    constructor(reason: any);
    reason: any;
}
declare namespace _default {
    export { grantPurchase };
    export { GrantRetryableError };
}
export default _default;
//# sourceMappingURL=purchase-grants.d.ts.map