export namespace PurchaseLedgerDb {
    /**
     * Stores one purchase, keyed on transactionId. Resolves { inserted } and throws on
     * failure, so a caller never grants an entitlement that was not saved.
     */
    function recordPurchase(doc: any): Promise<{
        inserted: boolean;
    }>;
    /**
     * Atomically takes the right to fulfil an unfulfilled purchase. Resolves true for one caller only.
     */
    function claimFulfillment(transactionId: any): Promise<boolean>;
    /** Gives back a claim after a failed credit, so a retry can take it again. */
    function releaseFulfillment(transactionId: any): Promise<void>;
    function markFulfilled(transactionId: any): Promise<void>;
    /**
     * Reverses a consumable that was never credited. Atomic with the grant's claim: whichever of
     * the two runs first wins, and the other one refuses. Resolves true only for the reversal.
     */
    function reverseUnfulfilled(transactionId: any, reason: any): Promise<boolean>;
    /** Takes the right to debit a reversed consumable's coins. Resolves true for one caller only. */
    function claimReversal(transactionId: any): Promise<boolean>;
    /** Gives back a reversal claim after a failed debit, so a retry can take it again. */
    function releaseReversal(transactionId: any): Promise<void>;
    function markReversed(transactionId: any, { shortfall, reason }?: {
        shortfall?: number | undefined;
        reason?: string | undefined;
    }): Promise<void>;
    function findPurchaseByTransaction(transactionId: any): Promise<any>;
    function recordRefund(doc: any): Promise<void>;
    function recordSubscriptionEvent(doc: any): Promise<void>;
    function revenueSince(days?: number): Promise<{
        revenue: any;
        payers: any;
    }>;
    function hasPurchase(playerId: any, productId: any): Promise<boolean>;
    function listPurchases(playerId: any): Promise<any>;
}
export default PurchaseLedgerDb;
//# sourceMappingURL=PurchaseLedgerDb.d.ts.map