export namespace PurchaseLedgerDb {
    function recordPurchase(doc: any): Promise<void>;
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