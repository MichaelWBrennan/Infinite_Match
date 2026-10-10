export function productFor(productId: any): any;
/** Maps a store product ID (per platform) back to a catalog product ID, or null. */
export function productIdForSku(platform: any, sku: any): string | null;
export const PRODUCTS: Readonly<{
    remove_ads: Readonly<{
        kind: "entitlement";
        priceCents: 499;
        currency: "usd";
        label: "Remove ads";
        skus: Readonly<{
            ios: any;
            android: any;
        }>;
    }>;
    unlock_all_themes: Readonly<{
        kind: "entitlement";
        priceCents: 799;
        currency: "usd";
        label: "Unlock all themes";
        skus: Readonly<{
            ios: any;
            android: any;
        }>;
    }>;
    coins_small: Readonly<{
        kind: "consumable";
        priceCents: 99;
        currency: "usd";
        label: "500 coins";
        grants: Readonly<{
            currency: "coins";
            amount: 500;
        }>;
        skus: Readonly<{
            ios: any;
            android: any;
        }>;
    }>;
    coins_medium: Readonly<{
        kind: "consumable";
        priceCents: 499;
        currency: "usd";
        label: "3,000 coins";
        grants: Readonly<{
            currency: "coins";
            amount: 3000;
        }>;
        skus: Readonly<{
            ios: any;
            android: any;
        }>;
    }>;
    coins_large: Readonly<{
        kind: "consumable";
        priceCents: 999;
        currency: "usd";
        label: "8,000 coins";
        grants: Readonly<{
            currency: "coins";
            amount: 8000;
        }>;
        skus: Readonly<{
            ios: any;
            android: any;
        }>;
    }>;
}>;
declare namespace _default {
    export { PRODUCTS };
    export { productFor };
    export { productIdForSku };
}
export default _default;
//# sourceMappingURL=product-catalog.d.ts.map