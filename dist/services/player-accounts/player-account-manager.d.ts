/**
 * Player Account Manager
 * Handles player accounts, authentication, and profile management
 */
export class PlayerAccountManager {
    logger: Logger;
    accounts: Map<any, any>;
    sessions: Map<any, any>;
    deviceTokens: Map<any, any>;
    config: {
        passwordMinLength: number;
        sessionTimeout: number;
        maxSessionsPerPlayer: number;
        maxDevicesPerPlayer: number;
        jwtSecret: string;
        jwtExpiry: string;
    };
    /**
     * Initialize account manager
     */
    initializeAccountManager(): void;
    /**
     * Create a new player account
     */
    createAccount(accountData: any): Promise<{
        success: boolean;
        account: {
            playerId: any;
            email: any;
            displayName: any;
            platform: any;
            createdAt: any;
            lastLogin: any;
            isActive: any;
            isVerified: any;
            profile: any;
            social: any;
            purchases: {
                totalSpent: any;
                currency: any;
                purchaseCount: any;
            };
        };
        message: string;
    }>;
    /**
     * Authenticate player
     */
    authenticatePlayer(playerId: any, password: any, deviceInfo?: {}): Promise<{
        success: boolean;
        session: {
            sessionId: `${string}-${string}-${string}-${string}-${string}`;
            token: string;
            expiresAt: number;
            deviceInfo: {};
        };
        account: {
            playerId: any;
            email: any;
            displayName: any;
            platform: any;
            createdAt: any;
            lastLogin: any;
            isActive: any;
            isVerified: any;
            profile: any;
            social: any;
            purchases: {
                totalSpent: any;
                currency: any;
                purchaseCount: any;
            };
        };
        message: string;
    }>;
    /**
     * Create a new session
     */
    createSession(playerId: any, deviceInfo?: {}): Promise<{
        sessionId: `${string}-${string}-${string}-${string}-${string}`;
        token: string;
        expiresAt: number;
        deviceInfo: {};
    }>;
    /**
     * Validate session
     */
    validateSession(sessionId: any, token: any): Promise<{
        success: boolean;
        session: any;
        playerId: any;
    }>;
    /**
     * Get player account
     */
    getAccount(playerId: any): Promise<{
        success: boolean;
        account: {
            playerId: any;
            email: any;
            displayName: any;
            platform: any;
            createdAt: any;
            lastLogin: any;
            isActive: any;
            isVerified: any;
            profile: any;
            social: any;
            purchases: {
                totalSpent: any;
                currency: any;
                purchaseCount: any;
            };
        };
    }>;
    /**
     * Update player profile
     */
    updateProfile(playerId: any, profileData: any): Promise<{
        success: boolean;
        account: {
            playerId: any;
            email: any;
            displayName: any;
            platform: any;
            createdAt: any;
            lastLogin: any;
            isActive: any;
            isVerified: any;
            profile: any;
            social: any;
            purchases: {
                totalSpent: any;
                currency: any;
                purchaseCount: any;
            };
        };
        message: string;
    }>;
    /**
     * Update player statistics
     */
    updateStatistics(playerId: any, statsData: any): Promise<{
        success: boolean;
        account: {
            playerId: any;
            email: any;
            displayName: any;
            platform: any;
            createdAt: any;
            lastLogin: any;
            isActive: any;
            isVerified: any;
            profile: any;
            social: any;
            purchases: {
                totalSpent: any;
                currency: any;
                purchaseCount: any;
            };
        };
        message: string;
    }>;
    /**
     * Add purchase to account
     */
    addPurchase(playerId: any, purchaseData: any): Promise<{
        success: boolean;
        purchase: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            productId: any;
            productType: any;
            amount: any;
            currency: any;
            platform: any;
            transactionId: any;
            timestamp: number;
            status: string;
        };
        message: string;
    }>;
    /**
     * Get player purchases
     */
    getPurchases(playerId: any, filters?: {}): Promise<{
        success: boolean;
        purchases: any;
        totalSpent: any;
        currency: any;
    }>;
    /**
     * Check player entitlements
     */
    getEntitlements(playerId: any): Promise<{
        success: boolean;
        entitlements: {
            subscriptions: any;
            entitlements: any;
            hasProduct: (productId: any) => any;
            hasActiveSubscription: (subscriptionId: any) => any;
        };
    }>;
    /**
     * Logout player
     */
    logoutPlayer(sessionId: any): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Deactivate account
     */
    deactivateAccount(playerId: any, reason?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Get public account data (without sensitive information)
     */
    getPublicAccountData(account: any): {
        playerId: any;
        email: any;
        displayName: any;
        platform: any;
        createdAt: any;
        lastLogin: any;
        isActive: any;
        isVerified: any;
        profile: any;
        social: any;
        purchases: {
            totalSpent: any;
            currency: any;
            purchaseCount: any;
        };
    };
    /**
     * Cleanup expired sessions
     */
    cleanupExpiredSessions(): void;
    /**
     * Get account statistics
     */
    getAccountStatistics(): {
        totalAccounts: number;
        activeAccounts: number;
        activeSessions: number;
        totalSessions: number;
    };
}
import { Logger } from '../../core/logger/index.js';
//# sourceMappingURL=player-account-manager.d.ts.map