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
        reason: string;
        platform?: never;
        status?: never;
        raw?: never;
        duplicate?: never;
        productId?: never;
        transactionId?: never;
    } | {
        success: boolean;
        platform: string;
        status: number;
        raw: any;
        reason?: never;
        duplicate?: never;
        productId?: never;
        transactionId?: never;
    } | {
        success: boolean;
        platform: string;
        duplicate: boolean;
        productId: any;
        transactionId: any;
        reason?: never;
        status?: never;
        raw?: never;
    } | {
        success: boolean;
        platform: string;
        productId: any;
        transactionId: any;
        raw: any;
        reason?: never;
        status?: never;
        duplicate?: never;
    } | {
        success: boolean;
        platform: string;
        reason: string;
        status?: never;
        raw?: never;
        duplicate?: never;
        productId?: never;
        transactionId?: never;
    } | {
        success: boolean;
        reason: string;
        platform?: never;
        state?: never;
        raw?: never;
        duplicate?: never;
        productId?: never;
        transactionId?: never;
        acknowledged?: never;
    } | {
        success: boolean;
        platform: string;
        reason: string;
        state?: never;
        raw?: never;
        duplicate?: never;
        productId?: never;
        transactionId?: never;
        acknowledged?: never;
    } | {
        success: boolean;
        platform: string;
        state: any;
        raw: any;
        reason?: never;
        duplicate?: never;
        productId?: never;
        transactionId?: never;
        acknowledged?: never;
    } | {
        success: boolean;
        platform: string;
        duplicate: boolean;
        productId: any;
        transactionId: string;
        reason?: never;
        state?: never;
        raw?: never;
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
        duplicate?: never;
    }>;
    static verifyIOSReceipt(payload: any): Promise<{
        success: boolean;
        reason: string;
        platform?: never;
        status?: never;
        raw?: never;
        duplicate?: never;
        productId?: never;
        transactionId?: never;
    } | {
        success: boolean;
        platform: string;
        status: number;
        raw: any;
        reason?: never;
        duplicate?: never;
        productId?: never;
        transactionId?: never;
    } | {
        success: boolean;
        platform: string;
        duplicate: boolean;
        productId: any;
        transactionId: any;
        reason?: never;
        status?: never;
        raw?: never;
    } | {
        success: boolean;
        platform: string;
        productId: any;
        transactionId: any;
        raw: any;
        reason?: never;
        status?: never;
        duplicate?: never;
    } | {
        success: boolean;
        platform: string;
        reason: string;
        status?: never;
        raw?: never;
        duplicate?: never;
        productId?: never;
        transactionId?: never;
    }>;
    static verifyAndroidPurchase(payload: any): Promise<{
        success: boolean;
        reason: string;
        platform?: never;
        state?: never;
        raw?: never;
        duplicate?: never;
        productId?: never;
        transactionId?: never;
        acknowledged?: never;
    } | {
        success: boolean;
        platform: string;
        reason: string;
        state?: never;
        raw?: never;
        duplicate?: never;
        productId?: never;
        transactionId?: never;
        acknowledged?: never;
    } | {
        success: boolean;
        platform: string;
        state: any;
        raw: any;
        reason?: never;
        duplicate?: never;
        productId?: never;
        transactionId?: never;
        acknowledged?: never;
    } | {
        success: boolean;
        platform: string;
        duplicate: boolean;
        productId: any;
        transactionId: string;
        reason?: never;
        state?: never;
        raw?: never;
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
        duplicate?: never;
    }>;
    static buildAndroidTransactionId({ productId, purchaseToken }: {
        productId: any;
        purchaseToken: any;
    }): string;
}
export default ReceiptVerificationService;
//# sourceMappingURL=ReceiptVerificationService.d.ts.map