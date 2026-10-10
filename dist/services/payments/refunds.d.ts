/**
 * Reverses the purchase stored under any of `transactionIds`. A provider can key one purchase by
 * more than one id (Apple: original and per-transaction), so each candidate is tried.
 * Returns { reversed: false, reason } or { reversed: true, kind, shortfall }.
 */
export function reverseTransaction({ transactionIds, reason, durable, debit, }: {
    transactionIds: any;
    reason: any;
    durable?: boolean | undefined;
    debit?: ((playerId: any, grants: any) => Promise<any>) | undefined;
}): Promise<{
    reversed: boolean;
    reason: string;
    kind?: never;
    shortfall?: never;
    taken?: never;
} | {
    reversed: boolean;
    kind: string;
    shortfall: number;
    reason?: never;
    taken?: never;
} | {
    reversed: boolean;
    kind: string;
    shortfall: any;
    taken: any;
    reason?: never;
}>;
/** The ids Apple may have used for a purchase, from a verified signedTransactionInfo. */
export function appleTransactionIds(transactionInfo: any): string[];
/**
 * The ids Google may have used for a purchase, from its purchase token. The ledger keys an Android
 * purchase by a hash of its SKU and token, so each catalog SKU is tried.
 */
export function googleTransactionIds(purchaseToken: any): string[];
declare namespace _default {
    export { reverseTransaction };
    export { appleTransactionIds };
    export { googleTransactionIds };
}
export default _default;
//# sourceMappingURL=refunds.d.ts.map