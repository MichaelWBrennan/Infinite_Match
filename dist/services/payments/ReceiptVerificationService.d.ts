export class ReceiptVerificationService {
    static get iosEndpoints(): {
        production: string;
        sandbox: string;
    };
    static verify({ platform, payload }: {
        platform: any;
        payload: any;
    }): Promise<{
        success: boolean;
        platform: string;
        reason: string | undefined;
        productId?: never;
        transactionId?: never;
        environment?: never;
    } | {
        success: boolean;
        platform: string;
        productId: any;
        transactionId: string;
        environment: any;
        reason?: never;
    } | {
        success: boolean;
        reason: string;
        platform?: never;
        status?: never;
        raw?: never;
        productId?: never;
        transactionId?: never;
    } | {
        success: boolean;
        platform: string;
        status: number;
        raw: any;
        reason?: never;
        productId?: never;
        transactionId?: never;
    } | {
        success: boolean;
        platform: string;
        reason: string | undefined;
        status?: never;
        raw?: never;
        productId?: never;
        transactionId?: never;
    } | {
        success: boolean;
        platform: string;
        productId: any;
        transactionId: any;
        raw: any;
        reason?: never;
        status?: never;
    } | {
        success: boolean;
        reason: string;
        platform?: never;
        state?: never;
        raw?: never;
        productId?: never;
        transactionId?: never;
        acknowledged?: never;
    } | {
        success: boolean;
        platform: string;
        reason: string;
        state?: never;
        raw?: never;
        productId?: never;
        transactionId?: never;
        acknowledged?: never;
    } | {
        success: boolean;
        platform: string;
        state: any;
        raw: any;
        reason?: never;
        productId?: never;
        transactionId?: never;
        acknowledged?: never;
    } | {
        success: boolean;
        platform: string;
        productId: any;
        transactionId: string;
        acknowledged: boolean;
        raw: any;
        reason?: never;
        state?: never;
    }>;
    static verifyIOSReceipt(payload: any): Promise<{
        success: boolean;
        reason: string;
        platform?: never;
        status?: never;
        raw?: never;
        productId?: never;
        transactionId?: never;
    } | {
        success: boolean;
        platform: string;
        status: number;
        raw: any;
        reason?: never;
        productId?: never;
        transactionId?: never;
    } | {
        success: boolean;
        platform: string;
        reason: string | undefined;
        status?: never;
        raw?: never;
        productId?: never;
        transactionId?: never;
    } | {
        success: boolean;
        platform: string;
        productId: any;
        transactionId: any;
        raw: any;
        reason?: never;
        status?: never;
    }>;
    /**
     * Checks a StoreKit 2 signed transaction (Transaction.jwsRepresentation) offline:
     * the Apple signature chain is verified against the pinned root, then the bundle,
     * environment and revocation fields are checked. Needs no network call to Apple.
     */
    static verifyAppleSignedTransaction(signedTransaction: any): {
        success: boolean;
        platform: string;
        reason: string | undefined;
        productId?: never;
        transactionId?: never;
        environment?: never;
    } | {
        success: boolean;
        platform: string;
        productId: any;
        transactionId: string;
        environment: any;
        reason?: never;
    };
    /** The app must be ours, and sandbox purchases are accepted only when explicitly allowed. */
    static checkAppleBundleAndEnvironment({ bundleId, environment }: {
        bundleId: any;
        environment: any;
    }): {
        ok: boolean;
        reason: string;
    } | {
        ok: boolean;
        reason?: never;
    };
    static verifyAndroidPurchase(payload: any): Promise<{
        success: boolean;
        reason: string;
        platform?: never;
        state?: never;
        raw?: never;
        productId?: never;
        transactionId?: never;
        acknowledged?: never;
    } | {
        success: boolean;
        platform: string;
        reason: string;
        state?: never;
        raw?: never;
        productId?: never;
        transactionId?: never;
        acknowledged?: never;
    } | {
        success: boolean;
        platform: string;
        state: any;
        raw: any;
        reason?: never;
        productId?: never;
        transactionId?: never;
        acknowledged?: never;
    } | {
        success: boolean;
        platform: string;
        productId: any;
        transactionId: string;
        acknowledged: boolean;
        raw: any;
        reason?: never;
        state?: never;
    }>;
    static buildAndroidTransactionId({ productId, purchaseToken }: {
        productId: any;
        purchaseToken: any;
    }): string;
}
export default ReceiptVerificationService;
//# sourceMappingURL=ReceiptVerificationService.d.ts.map