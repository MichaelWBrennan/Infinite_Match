/**
 * MonetizationService - handles all paid continue/skip/refill operations.
 */
export class MonetizationService {
    logger: Logger;
    streakFreezes: Map<any, any>;
    levelContinues: Map<any, any>;
    levelSkips: Map<any, any>;
    adGrants: Map<any, any>;
    maxAdGrantsPerDay: number;
    /**
     * Check if a player can continue a level (hasn't exceeded max continues).
     */
    canContinue(playerId: any, levelNumber: any): {
        canContinue: boolean;
        continuesUsed: number;
        remaining?: never;
    } | {
        canContinue: boolean;
        continuesUsed: any;
        remaining: number;
    };
    /**
     * Record a level continue. Deducts coins from the player's account.
     * Returns { success, continuesUsed, movesAdded, coinsDeducted } or error.
     */
    continueLevel(playerId: any, levelNumber: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): Promise<{
        success: boolean;
        error: string;
        required?: never;
        balance?: never;
        continuesUsed?: never;
        movesAdded?: never;
        coinsDeducted?: never;
        remaining?: never;
    } | {
        success: boolean;
        error: string;
        required: number;
        balance: any;
        continuesUsed?: never;
        movesAdded?: never;
        coinsDeducted?: never;
        remaining?: never;
    } | {
        success: boolean;
        continuesUsed: any;
        movesAdded: number;
        coinsDeducted: number;
        remaining: number;
        error?: never;
        required?: never;
        balance?: never;
    }>;
    /**
     * Check if a player has already skipped a level.
     */
    isLevelSkipped(playerId: any, levelNumber: any): boolean;
    /**
     * Skip a level. Deducts coins from the player's account.
     * Player keeps the stars they would have earned (treated as a win with 1 star).
     */
    skipLevel(playerId: any, levelNumber: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): Promise<{
        success: boolean;
        error: string;
        required?: never;
        balance?: never;
        levelSkipped?: never;
        coinsDeducted?: never;
        reward?: never;
    } | {
        success: boolean;
        error: string;
        required: number;
        balance: any;
        levelSkipped?: never;
        coinsDeducted?: never;
        reward?: never;
    } | {
        success: boolean;
        levelSkipped: any;
        coinsDeducted: number;
        reward: {
            stars: number;
            coins: number;
            xp: number;
        };
        error?: never;
        required?: never;
        balance?: never;
    }>;
    /**
     * Check if a player has an active streak freeze.
     */
    hasActiveStreakFreeze(playerId: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): boolean;
    /**
     * Purchase a streak freeze. Can be paid with coins or real money.
     */
    purchaseStreakFreeze(playerId: any, { payWith, nowMs }?: {
        payWith?: string | undefined;
        nowMs?: number | undefined;
    }): Promise<{
        success: boolean;
        error: string;
        required?: never;
        balance?: never;
        checkoutProduct?: never;
        freezeExpiresAt?: never;
        durationHours?: never;
        payWith?: never;
    } | {
        success: boolean;
        error: string;
        required: number;
        balance: any;
        checkoutProduct?: never;
        freezeExpiresAt?: never;
        durationHours?: never;
        payWith?: never;
    } | {
        success: boolean;
        error: string;
        checkoutProduct: string;
        required?: never;
        balance?: never;
        freezeExpiresAt?: never;
        durationHours?: never;
        payWith?: never;
    } | {
        success: boolean;
        freezeExpiresAt: number;
        durationHours: number;
        payWith: string;
        error?: never;
        required?: never;
        balance?: never;
        checkoutProduct?: never;
    }>;
    /**
     * Grant a streak freeze after a successful real-money purchase.
     * Called from the economy service's webhook handler.
     */
    grantStreakFreezeViaPurchase(playerId: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): {
        success: boolean;
        error: string;
        freezeExpiresAt?: never;
    } | {
        success: boolean;
        freezeExpiresAt: number;
        error?: never;
    };
    /**
     * Consume a streak freeze when a player misses a daily login.
     * Returns true if a freeze was consumed (streak preserved), false otherwise.
     */
    consumeStreakFreeze(playerId: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): boolean;
    /**
     * Create a Stripe checkout session for an instant life refill.
     * Price is set server-side from the catalog.
     */
    createLifeRefillCheckout(playerId: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): Promise<{
        success: boolean;
        error: string;
        productId?: never;
        url?: never;
        sessionId?: never;
        priceCents?: never;
        currency?: never;
    } | {
        success: boolean;
        productId: string;
        url: string | null | undefined;
        sessionId: string | undefined;
        priceCents: any;
        currency: any;
        error?: never;
    }>;
    /**
     * Create a Stripe checkout session for a streak freeze purchase ($0.99).
     */
    createStreakFreezeCheckout(playerId: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): Promise<{
        success: boolean;
        error: string;
        productId?: never;
        url?: never;
        sessionId?: never;
        priceCents?: never;
        currency?: never;
    } | {
        success: boolean;
        productId: string;
        url: string | null | undefined;
        sessionId: string | undefined;
        priceCents: any;
        currency: any;
        error?: never;
    }>;
    /**
     * Grant lives after a successful life refill purchase.
     * Called from the Stripe webhook handler after payment confirmation.
     */
    grantLifeRefill(playerId: any, amount?: number, { nowMs }?: {
        nowMs?: number | undefined;
    }): Promise<{
        success: boolean;
        livesAdded: number;
        livesRemaining: any;
        maxLives: number;
    }>;
    /**
     * Grant a reward for watching a rewarded ad.
     * Limited to maxAdGrantsPerDay per player to prevent abuse.
     * rewardType: 'coins' or 'lives'
     */
    grantAdReward(playerId: any, rewardType: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): Promise<{
        success: boolean;
        error: string;
        limit?: never;
        rewardType?: never;
        amount?: never;
        grantsToday?: never;
        remainingToday?: never;
    } | {
        success: boolean;
        error: string;
        limit: number;
        rewardType?: never;
        amount?: never;
        grantsToday?: never;
        remainingToday?: never;
    } | {
        success: boolean;
        rewardType: any;
        amount: number;
        grantsToday: any;
        remainingToday: number;
        error?: never;
        limit?: never;
    }>;
    /**
     * Get a player's monetization status (for the client UI).
     */
    getPlayerStatus(playerId: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): Promise<{
        playerId: any;
        canContinue: boolean;
        continuesRemaining: number | undefined;
        streakFreezeActive: boolean;
        adGrantsToday: any;
        adGrantsRemaining: number;
        continueCostCoins: number;
        skipCostCoins: number;
        streakFreezeCostCoins: number;
        streakFreezeCostUsdCents: number;
    }>;
    /**
     * Clear all in-memory state (testing only).
     */
    resetForTesting(): void;
}
export const monetizationService: MonetizationService;
export default MonetizationService;
import { Logger } from '../../core/logger/index.js';
//# sourceMappingURL=monetization-service.d.ts.map