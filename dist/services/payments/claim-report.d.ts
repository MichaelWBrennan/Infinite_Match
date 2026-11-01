export function reportStalePaymentClaims(nowMs?: number): Promise<{
    minimumAgeMinutes: number;
    sampled: number;
    hasMore: boolean;
    fulfillment: {
        confirmedReceipt: number;
        noConfirmedReceipt: number;
        mismatch: number;
    };
    reversal: {
        confirmedReceipt: number;
        noConfirmedReceipt: number;
        mismatch: number;
    };
    invalidRows: number;
}>;
export const CLAIM_REPORT_MIN_AGE_MS: number;
export const CLAIM_REPORT_LIMIT: 100;
//# sourceMappingURL=claim-report.d.ts.map