/**
 * Purchase Manager
 * Handles in-game purchases, subscriptions, and entitlements
 */
export class PurchaseManager {
    constructor(accountManager: any);
    logger: Logger;
    accountManager: any;
    config: {
        supportedCurrencies: string[];
        defaultCurrency: string;
        maxPurchaseAmount: number;
        refundWindow: number;
        subscriptionGracePeriod: number;
    };
    productCatalog: {
        currency_packs: {
            coins_100: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    coins: number;
                };
                description: string;
                category: string;
                isActive: boolean;
            };
            coins_500: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    coins: number;
                };
                description: string;
                category: string;
                isActive: boolean;
            };
            coins_1000: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    coins: number;
                    bonus: number;
                };
                description: string;
                category: string;
                isActive: boolean;
            };
            gems_50: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    gems: number;
                };
                description: string;
                category: string;
                isActive: boolean;
            };
            gems_200: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    gems: number;
                    bonus: number;
                };
                description: string;
                category: string;
                isActive: boolean;
            };
        };
        powerups: {
            extra_moves: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    extra_moves: number;
                };
                description: string;
                category: string;
                isActive: boolean;
                consumable: boolean;
            };
            bomb_boost: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    bomb_boost: number;
                };
                description: string;
                category: string;
                isActive: boolean;
                consumable: boolean;
            };
            rainbow_boost: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    rainbow_boost: number;
                };
                description: string;
                category: string;
                isActive: boolean;
                consumable: boolean;
            };
        };
        subscriptions: {
            premium_monthly: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                duration: number;
                rewards: {
                    daily_coins: number;
                    daily_gems: number;
                    ad_free: boolean;
                    exclusive_themes: boolean;
                    priority_support: boolean;
                };
                description: string;
                category: string;
                isActive: boolean;
                recurring: boolean;
            };
            premium_yearly: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                duration: number;
                rewards: {
                    daily_coins: number;
                    daily_gems: number;
                    ad_free: boolean;
                    exclusive_themes: boolean;
                    priority_support: boolean;
                    bonus_gems: number;
                };
                description: string;
                category: string;
                isActive: boolean;
                recurring: boolean;
            };
        };
        entitlements: {
            remove_ads: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    ad_free: boolean;
                };
                description: string;
                category: string;
                isActive: boolean;
                permanent: boolean;
            };
            unlock_all_themes: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    all_themes: boolean;
                };
                description: string;
                category: string;
                isActive: boolean;
                permanent: boolean;
            };
        };
    };
    validationRules: {
        ageRestrictions: {
            coins_100: number;
            coins_500: number;
            coins_1000: number;
            gems_50: number;
            gems_200: number;
            premium_monthly: number;
            premium_yearly: number;
        };
        purchaseLimits: {
            coins_100: {
                daily: number;
                weekly: number;
            };
            coins_500: {
                daily: number;
                weekly: number;
            };
            coins_1000: {
                daily: number;
                weekly: number;
            };
            gems_50: {
                daily: number;
                weekly: number;
            };
            gems_200: {
                daily: number;
                weekly: number;
            };
        };
        regionalRestrictions: {
            premium_monthly: string[];
            premium_yearly: string[];
        };
    };
    /**
     * Initialize purchase manager
     */
    initializePurchaseManager(): void;
    /**
     * Initialize product catalog
     */
    initializeProductCatalog(): {
        currency_packs: {
            coins_100: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    coins: number;
                };
                description: string;
                category: string;
                isActive: boolean;
            };
            coins_500: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    coins: number;
                };
                description: string;
                category: string;
                isActive: boolean;
            };
            coins_1000: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    coins: number;
                    bonus: number;
                };
                description: string;
                category: string;
                isActive: boolean;
            };
            gems_50: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    gems: number;
                };
                description: string;
                category: string;
                isActive: boolean;
            };
            gems_200: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    gems: number;
                    bonus: number;
                };
                description: string;
                category: string;
                isActive: boolean;
            };
        };
        powerups: {
            extra_moves: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    extra_moves: number;
                };
                description: string;
                category: string;
                isActive: boolean;
                consumable: boolean;
            };
            bomb_boost: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    bomb_boost: number;
                };
                description: string;
                category: string;
                isActive: boolean;
                consumable: boolean;
            };
            rainbow_boost: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    rainbow_boost: number;
                };
                description: string;
                category: string;
                isActive: boolean;
                consumable: boolean;
            };
        };
        subscriptions: {
            premium_monthly: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                duration: number;
                rewards: {
                    daily_coins: number;
                    daily_gems: number;
                    ad_free: boolean;
                    exclusive_themes: boolean;
                    priority_support: boolean;
                };
                description: string;
                category: string;
                isActive: boolean;
                recurring: boolean;
            };
            premium_yearly: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                duration: number;
                rewards: {
                    daily_coins: number;
                    daily_gems: number;
                    ad_free: boolean;
                    exclusive_themes: boolean;
                    priority_support: boolean;
                    bonus_gems: number;
                };
                description: string;
                category: string;
                isActive: boolean;
                recurring: boolean;
            };
        };
        entitlements: {
            remove_ads: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    ad_free: boolean;
                };
                description: string;
                category: string;
                isActive: boolean;
                permanent: boolean;
            };
            unlock_all_themes: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    all_themes: boolean;
                };
                description: string;
                category: string;
                isActive: boolean;
                permanent: boolean;
            };
        };
    };
    /**
     * Initialize validation rules
     */
    initializeValidationRules(): {
        ageRestrictions: {
            coins_100: number;
            coins_500: number;
            coins_1000: number;
            gems_50: number;
            gems_200: number;
            premium_monthly: number;
            premium_yearly: number;
        };
        purchaseLimits: {
            coins_100: {
                daily: number;
                weekly: number;
            };
            coins_500: {
                daily: number;
                weekly: number;
            };
            coins_1000: {
                daily: number;
                weekly: number;
            };
            gems_50: {
                daily: number;
                weekly: number;
            };
            gems_200: {
                daily: number;
                weekly: number;
            };
        };
        regionalRestrictions: {
            premium_monthly: string[];
            premium_yearly: string[];
        };
    };
    /**
     * Process a purchase
     */
    processPurchase(playerId: any, productId: any, paymentData: any): Promise<{
        success: boolean;
        purchase: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            productId: any;
            productType: any;
            amount: any;
            currency: any;
            platform: any;
            transactionId: string | null;
            timestamp: number;
            status: string;
            paymentMethod: any;
            region: any;
        };
        rewards: any;
        message: string;
    }>;
    /**
     * Get product information
     */
    getProduct(productId: any): any;
    /**
     * Validate purchase
     */
    validatePurchase(playerId: any, product: any, paymentData: any): Promise<{
        valid: boolean;
        error: string;
    } | {
        valid: boolean;
        error?: never;
    }>;
    /**
     * Process payment
     */
    processPayment(product: any, paymentData: any): Promise<{
        success: boolean;
        error: string;
        transactionId: null;
        amount?: never;
        currency?: never;
    } | {
        success: boolean;
        transactionId: string;
        amount: any;
        currency: any;
        error?: never;
    }>;
    /**
     * Grant rewards to player
     */
    grantRewards(playerId: any, rewards: any, purchase: any): Promise<void>;
    /**
     * Grant currency to player
     */
    grantCurrency(playerId: any, currencyType: any, amount: any): Promise<void>;
    /**
     * Grant power-up to player
     */
    grantPowerUp(playerId: any, powerUpType: any, amount: any): Promise<void>;
    /**
     * Grant entitlement to player
     */
    grantEntitlement(playerId: any, entitlementType: any, value: any): Promise<void>;
    /**
     * Grant daily reward to player
     */
    grantDailyReward(playerId: any, rewardType: any, amount: any): Promise<void>;
    /**
     * Get player purchases
     */
    getPlayerPurchases(playerId: any, filters?: {}): Promise<any>;
    /**
     * Process subscription renewals
     */
    processSubscriptionRenewals(): Promise<void>;
    /**
     * Cleanup expired purchases
     */
    cleanupExpiredPurchases(): Promise<void>;
    /**
     * Track purchase analytics
     */
    trackPurchaseAnalytics(playerId: any, purchase: any, product: any): Promise<void>;
    /**
     * Get product catalog
     */
    getProductCatalog(category?: null): {
        currency_packs: {
            coins_100: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    coins: number;
                };
                description: string;
                category: string;
                isActive: boolean;
            };
            coins_500: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    coins: number;
                };
                description: string;
                category: string;
                isActive: boolean;
            };
            coins_1000: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    coins: number;
                    bonus: number;
                };
                description: string;
                category: string;
                isActive: boolean;
            };
            gems_50: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    gems: number;
                };
                description: string;
                category: string;
                isActive: boolean;
            };
            gems_200: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    gems: number;
                    bonus: number;
                };
                description: string;
                category: string;
                isActive: boolean;
            };
        };
        powerups: {
            extra_moves: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    extra_moves: number;
                };
                description: string;
                category: string;
                isActive: boolean;
                consumable: boolean;
            };
            bomb_boost: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    bomb_boost: number;
                };
                description: string;
                category: string;
                isActive: boolean;
                consumable: boolean;
            };
            rainbow_boost: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    rainbow_boost: number;
                };
                description: string;
                category: string;
                isActive: boolean;
                consumable: boolean;
            };
        };
        subscriptions: {
            premium_monthly: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                duration: number;
                rewards: {
                    daily_coins: number;
                    daily_gems: number;
                    ad_free: boolean;
                    exclusive_themes: boolean;
                    priority_support: boolean;
                };
                description: string;
                category: string;
                isActive: boolean;
                recurring: boolean;
            };
            premium_yearly: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                duration: number;
                rewards: {
                    daily_coins: number;
                    daily_gems: number;
                    ad_free: boolean;
                    exclusive_themes: boolean;
                    priority_support: boolean;
                    bonus_gems: number;
                };
                description: string;
                category: string;
                isActive: boolean;
                recurring: boolean;
            };
        };
        entitlements: {
            remove_ads: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    ad_free: boolean;
                };
                description: string;
                category: string;
                isActive: boolean;
                permanent: boolean;
            };
            unlock_all_themes: {
                id: string;
                name: string;
                type: string;
                price: number;
                currency: string;
                rewards: {
                    all_themes: boolean;
                };
                description: string;
                category: string;
                isActive: boolean;
                permanent: boolean;
            };
        };
    };
    /**
     * Get purchase statistics
     */
    getPurchaseStatistics(): {
        totalProducts: number;
        activeProducts: number;
        categories: string[];
        supportedCurrencies: string[];
    };
}
import { Logger } from '../../core/logger/index.js';
//# sourceMappingURL=purchase-manager.d.ts.map