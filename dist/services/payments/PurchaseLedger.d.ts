export const PurchaseLedger: PurchaseLedgerImpl;
export default PurchaseLedger;
declare class PurchaseLedgerImpl {
    seenTransactionIds: Set<any>;
    initialized: boolean;
    init(): Promise<void>;
    appendJsonl(prefix: any, obj: any): Promise<void>;
    recordPurchase(evt: any): Promise<void>;
    recordRefund(evt: any): Promise<void>;
    recordSubscriptionEvent(evt: any): Promise<void>;
    hasTransaction(transactionId: any): boolean;
}
//# sourceMappingURL=PurchaseLedger.d.ts.map