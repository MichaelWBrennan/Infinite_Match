/**
 * Generates personalized offers for a player profile.
 * Returns an array of offers with computed prices, discounts, and eligibility.
 */
export class OffersService {
    getOffers(profile?: {}): {
        sku: string;
        label: string;
        productId: string;
        priceCents: number;
        basePriceUsd: number;
        currency: string;
        discount: number;
        reason: any;
        matchedSegment: any;
        maxPurchases: number;
        alreadyPurchased: any;
        expiresInSeconds: number | null;
    }[];
    /**
     * Validates that an offer can be purchased by a player at the given time.
     * Returns { valid: true, priceCents, discount } or { valid: false, reason }.
     * This is the server-side enforcement used at purchase time.
     */
    validateOffer(sku: any, profile?: {}, nowMs?: number): {
        valid: boolean;
        reason: string;
        priceCents?: never;
        discount?: never;
        productId?: never;
    } | {
        valid: boolean;
        priceCents: number;
        discount: number;
        productId: string;
        reason?: never;
    };
}
export default OffersService;
/**
 * Base offer catalog. Each offer:
 *   sku            - unique offer identifier
 *   label          - display name
 *   productId      - catalog product this maps to (for purchase)
 *   basePriceUsd   - base price in USD
 *   currency       - 'usd'
 *   segments       - segment ids eligible for this offer
 *   segmentDiscounts - optional map of segmentId -> discount fraction (0-1)
 *   maxPurchases   - optional limit on how many times a player can buy this
 *   reasonTemplate - human-readable reason for why the offer is shown
 */
export const OFFER_CATALOG: readonly ({
    sku: string;
    label: string;
    productId: string;
    basePriceUsd: number;
    currency: string;
    segments: string[];
    segmentDiscounts: {
        newbie: number;
        nonpayer: number;
        payer?: never;
        whale?: never;
        lapsed_7d?: never;
        lapsed_30d?: never;
        streak_keeper?: never;
        vip?: never;
    };
    maxPurchases: number;
    reasonTemplate: string;
    expiresInSeconds?: never;
} | {
    sku: string;
    label: string;
    productId: string;
    basePriceUsd: number;
    currency: string;
    segments: string[];
    segmentDiscounts: {
        payer: number;
        newbie?: never;
        nonpayer?: never;
        whale?: never;
        lapsed_7d?: never;
        lapsed_30d?: never;
        streak_keeper?: never;
        vip?: never;
    };
    maxPurchases: number;
    reasonTemplate: string;
    expiresInSeconds?: never;
} | {
    sku: string;
    label: string;
    productId: string;
    basePriceUsd: number;
    currency: string;
    segments: string[];
    segmentDiscounts: {
        whale: number;
        newbie?: never;
        nonpayer?: never;
        payer?: never;
        lapsed_7d?: never;
        lapsed_30d?: never;
        streak_keeper?: never;
        vip?: never;
    };
    maxPurchases: number;
    reasonTemplate: string;
    expiresInSeconds?: never;
} | {
    sku: string;
    label: string;
    productId: string;
    basePriceUsd: number;
    currency: string;
    segments: string[];
    segmentDiscounts: {
        lapsed_7d: number;
        lapsed_30d: number;
        newbie?: never;
        nonpayer?: never;
        payer?: never;
        whale?: never;
        streak_keeper?: never;
        vip?: never;
    };
    maxPurchases: number;
    reasonTemplate: string;
    expiresInSeconds?: never;
} | {
    sku: string;
    label: string;
    productId: string;
    basePriceUsd: number;
    currency: string;
    segments: string[];
    segmentDiscounts: {
        streak_keeper: number;
        newbie?: never;
        nonpayer?: never;
        payer?: never;
        whale?: never;
        lapsed_7d?: never;
        lapsed_30d?: never;
        vip?: never;
    };
    maxPurchases: number;
    reasonTemplate: string;
    expiresInSeconds?: never;
} | {
    sku: string;
    label: string;
    productId: string;
    basePriceUsd: number;
    currency: string;
    segments: string[];
    segmentDiscounts: {
        vip: number;
        newbie?: never;
        nonpayer?: never;
        payer?: never;
        whale?: never;
        lapsed_7d?: never;
        lapsed_30d?: never;
        streak_keeper?: never;
    };
    maxPurchases: number;
    reasonTemplate: string;
    expiresInSeconds?: never;
} | {
    sku: string;
    label: string;
    productId: string;
    basePriceUsd: number;
    currency: string;
    segments: never[];
    segmentDiscounts: {
        newbie?: never;
        nonpayer?: never;
        payer?: never;
        whale?: never;
        lapsed_7d?: never;
        lapsed_30d?: never;
        streak_keeper?: never;
        vip?: never;
    };
    maxPurchases: number;
    reasonTemplate: string;
    expiresInSeconds: number;
})[];
//# sourceMappingURL=OffersService.d.ts.map