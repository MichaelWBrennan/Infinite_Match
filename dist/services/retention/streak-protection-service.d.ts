export default StreakProtectionService;
export class StreakProtectionService {
    constructor(accountEconomy: any, monetizationService: any);
    accountEconomy: any;
    monetizationService: any;
    gracePeriods: Map<any, any>;
    repairOffers: Map<any, any>;
    /**
     * Get streak protection status for a player.
     * Returns { streak, hasFreeze, freezeExpiresAt, inGracePeriod, graceDaysRemaining, canRepair, repairCost }.
     */
    getStreakStatus(playerId: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): Promise<{
        playerId: any;
        streak: any;
        lastClaimed: any;
        daysSinceLastClaim: number;
        hasFreeze: any;
        freezeExpiresAt: number | null;
        inGracePeriod: any;
        graceDaysRemaining: number;
        canRepair: boolean;
        repairCost: number;
        streakAtRisk: boolean;
    }>;
    /**
     * Purchase a streak freeze for a player.
     * Returns { success, freezeExpiresAt, cost, payWith }.
     */
    purchaseStreakFreeze(playerId: any, { payWith, nowMs }?: {
        payWith?: string | undefined;
        nowMs?: number | undefined;
    }): Promise<any>;
    /**
     * Start a grace period for a player (after a missed day, before streak breaks).
     */
    startGracePeriod(playerId: any, graceExpiresAt: any): void;
    /**
     * Check if a player is in their grace period and hasn't exceeded it.
     * Returns { inGracePeriod, daysRemaining, willBreakAt }.
     */
    checkGracePeriod(playerId: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): {
        inGracePeriod: boolean;
        daysRemaining: number;
        willBreakAt: any;
    };
    /**
     * Offer to repair a broken streak.
     * Returns { success, offer, cost, expiresAt }.
     */
    offerStreakRepair(playerId: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): {
        success: boolean;
        error: string;
        offer?: never;
        cost?: never;
        expiresAt?: never;
        previousStreak?: never;
    } | {
        success: boolean;
        offer: string;
        cost: number;
        expiresAt: number;
        previousStreak: any;
        error?: never;
    };
    /**
     * Accept a streak repair offer. Restores the streak to its previous length.
     * Returns { success, restoredStreak, cost }.
     */
    acceptStreakRepair(playerId: any, { payWith, nowMs }?: {
        payWith?: string | undefined;
        nowMs?: number | undefined;
    }): Promise<{
        success: boolean;
        error: string;
        required?: never;
        balance?: never;
        restoredStreak?: never;
        cost?: never;
        payWith?: never;
    } | {
        success: boolean;
        error: string;
        required: any;
        balance: any;
        restoredStreak?: never;
        cost?: never;
        payWith?: never;
    } | {
        success: boolean;
        restoredStreak: number;
        cost: any;
        payWith: string;
        error?: never;
        required?: never;
        balance?: never;
    }>;
    /**
     * Check if a player's streak is at risk (about to break) and return a warning.
     * Called before daily reward claim to warn the player.
     */
    checkStreakAtRisk(playerId: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): {
        atRisk: boolean;
        message?: never;
        daysRemaining?: never;
    } | {
        atRisk: boolean;
        message: string;
        daysRemaining: number;
    };
    /**
     * Get all active streak protection data for admin dashboard.
     */
    getProtectionStats(): {
        activeFreezes: number;
        activeGracePeriods: number;
        activeRepairOffers: number;
    };
}
export const STREAK_FREEZE_COST_COINS: 150;
export const STREAK_FREEZE_COST_STARS: 20;
export function streakRepairCost(streakLength: any): number;
//# sourceMappingURL=streak-protection-service.d.ts.map