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
            web: any;
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
            web: any;
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
            web: any;
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
            web: any;
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
            web: any;
            ios: any;
            android: any;
        }>;
    }>;
    coins_extra_small: Readonly<{
        kind: "consumable";
        priceCents: 199;
        currency: "usd";
        label: "1,200 coins";
        grants: Readonly<{
            currency: "coins";
            amount: 1200;
        }>;
        skus: Readonly<{
            web: any;
            ios: any;
            android: any;
        }>;
    }>;
    coins_extra_large: Readonly<{
        kind: "consumable";
        priceCents: 1999;
        currency: "usd";
        label: "20,000 coins";
        grants: Readonly<{
            currency: "coins";
            amount: 20000;
        }>;
        skus: Readonly<{
            web: any;
            ios: any;
            android: any;
        }>;
    }>;
    coins_mega: Readonly<{
        kind: "consumable";
        priceCents: 4999;
        currency: "usd";
        label: "55,000 coins";
        grants: Readonly<{
            currency: "coins";
            amount: 55000;
        }>;
        skus: Readonly<{
            web: any;
            ios: any;
            android: any;
        }>;
    }>;
    lives_refill: Readonly<{
        kind: "consumable";
        priceCents: 199;
        currency: "usd";
        label: "Instant Life Refill (5 lives)";
        grants: Readonly<{
            currency: "lives";
            amount: 5;
        }>;
        skus: Readonly<{
            web: any;
            ios: any;
            android: any;
        }>;
    }>;
    streak_freeze: Readonly<{
        kind: "consumable";
        priceCents: 99;
        currency: "usd";
        label: "Streak Freeze (24 hours)";
        grants: Readonly<{
            currency: "streak_freeze";
            amount: 1;
        }>;
        skus: Readonly<{
            web: any;
            ios: any;
            android: any;
        }>;
    }>;
    vip: Readonly<{
        kind: "entitlement";
        priceCents: 499;
        currency: "usd";
        label: "VIP Month";
        skus: Readonly<{
            web: any;
            ios: any;
            android: any;
        }>;
    }>;
    season_pass_premium: Readonly<{
        kind: "entitlement";
        priceCents: 999;
        currency: "usd";
        label: "Season Pass Premium";
        skus: Readonly<{
            web: any;
            ios: any;
            android: any;
        }>;
    }>;
    tournament_entry_100: Readonly<{
        kind: "consumable";
        priceCents: 99;
        currency: "usd";
        label: "Tournament Entry (100 coins)";
        grants: Readonly<{
            currency: "coins";
            amount: 100;
        }>;
        skus: Readonly<{
            web: any;
            ios: any;
            android: any;
        }>;
        tournamentEntry: true;
    }>;
    pvp_booster_extra_moves: Readonly<{
        kind: "consumable";
        priceCents: 49;
        currency: "usd";
        label: "PvP Booster: Extra Moves (+3)";
        grants: Readonly<{
            currency: "coins";
            amount: 0;
        }>;
        skus: Readonly<{
            web: any;
            ios: any;
            android: any;
        }>;
        pvpBooster: true;
    }>;
    pvp_booster_color_bomb: Readonly<{
        kind: "consumable";
        priceCents: 79;
        currency: "usd";
        label: "PvP Booster: Color Bomb";
        grants: Readonly<{
            currency: "coins";
            amount: 0;
        }>;
        skus: Readonly<{
            web: any;
            ios: any;
            android: any;
        }>;
        pvpBooster: true;
    }>;
    pvp_booster_extra_time: Readonly<{
        kind: "consumable";
        priceCents: 59;
        currency: "usd";
        label: "PvP Booster: Extra Time (+30s)";
        grants: Readonly<{
            currency: "coins";
            amount: 0;
        }>;
        skus: Readonly<{
            web: any;
            ios: any;
            android: any;
        }>;
        pvpBooster: true;
    }>;
}>;
declare namespace _default {
    export { PRODUCTS };
    export { productFor };
    export { productIdForSku };
}
export default _default;
//# sourceMappingURL=product-catalog.d.ts.map