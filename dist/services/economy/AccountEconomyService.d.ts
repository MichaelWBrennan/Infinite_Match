/** A rule the player cannot meet (not enough coins, room maxed). `code` is safe to show. */
export class EconomyRuleError extends Error {
    constructor(code: any, message?: any);
    code: any;
}
/** The one economy instance. Every route and the purchase path must share it, or balances diverge. */
export const accountEconomy: AccountEconomyService;
export default AccountEconomyService;
export class AccountEconomyService {
    cacheManager: import("../ai-cache-manager.js").AICacheManager;
    cache: Map<any, any>;
    cacheStats: {
        hits: number;
        misses: number;
        sets: number;
    };
    economyFeatures: {
        currencies: string[];
        progression: string[];
        monetization: string[];
        social: string[];
        retention: string[];
    };
    accountEconomyData: Map<any, any>;
    /**
     * Initialize player economy data for account
     */
    initializePlayerEconomy(playerId: any, platform?: string): Promise<any>;
    /**
     * Initialize currencies with industry standards
     */
    initializeCurrencies(): {
        coins: {
            id: string;
            name: string;
            type: string;
            amount: number;
            maxAmount: number;
            earned: number;
            spent: number;
            icon: string;
            color: string;
            description: string;
        };
        stars: {
            id: string;
            name: string;
            type: string;
            amount: number;
            maxAmount: number;
            earned: number;
            spent: number;
            icon: string;
            color: string;
            description: string;
        };
        energy: {
            id: string;
            name: string;
            type: string;
            amount: number;
            maxAmount: number;
            earned: number;
            spent: number;
            icon: string;
            color: string;
            description: string;
            regenRate: number;
            lastRegen: number;
        };
    };
    /**
     * Initialize progression system
     */
    initializeProgression(): {
        level: number;
        xp: number;
        xpToNext: number;
        totalXp: number;
        prestige: number;
        rank: string;
        levelRewards: never[];
        milestones: never[];
        lastLevelUp: null;
    };
    /**
     * Initialize inventory system
     */
    initializeInventory(): {
        powerups: {
            bomb: {
                id: string;
                name: string;
                count: number;
                maxCount: number;
                type: string;
                rarity: string;
            };
            rocket: {
                id: string;
                name: string;
                count: number;
                maxCount: number;
                type: string;
                rarity: string;
            };
            rainbow: {
                id: string;
                name: string;
                count: number;
                maxCount: number;
                type: string;
                rarity: string;
            };
            lightning: {
                id: string;
                name: string;
                count: number;
                maxCount: number;
                type: string;
                rarity: string;
            };
            target: {
                id: string;
                name: string;
                count: number;
                maxCount: number;
                type: string;
                rarity: string;
            };
            diamond: {
                id: string;
                name: string;
                count: number;
                maxCount: number;
                type: string;
                rarity: string;
            };
            star: {
                id: string;
                name: string;
                count: number;
                maxCount: number;
                type: string;
                rarity: string;
            };
        };
        boosters: {
            extra_moves: {
                id: string;
                name: string;
                count: number;
                maxCount: number;
                type: string;
                rarity: string;
            };
            color_bomb: {
                id: string;
                name: string;
                count: number;
                maxCount: number;
                type: string;
                rarity: string;
            };
            striped_candy: {
                id: string;
                name: string;
                count: number;
                maxCount: number;
                type: string;
                rarity: string;
            };
        };
        decorations: {
            castle: {
                id: string;
                name: string;
                count: number;
                maxCount: number;
                type: string;
                rarity: string;
            };
            garden: {
                id: string;
                name: string;
                count: number;
                maxCount: number;
                type: string;
                rarity: string;
            };
        };
    };
    /**
     * Initialize achievements system
     */
    initializeAchievements(): {
        completed: never[];
        inProgress: ({
            id: string;
            name: string;
            description: string;
            progress: number;
            maxProgress: number;
            reward: {
                coins: number;
                xp: number;
                gems?: never;
            };
            rarity: string;
        } | {
            id: string;
            name: string;
            description: string;
            progress: number;
            maxProgress: number;
            reward: {
                gems: number;
                xp: number;
                coins?: never;
            };
            rarity: string;
        })[];
        totalCompleted: number;
        totalPoints: number;
    };
    /**
     * Initialize daily rewards system
     */
    initializeDailyRewards(): {
        streak: number;
        lastClaimed: null;
        nextReward: number;
        rewards: ({
            day: number;
            coins: number;
            xp: number;
            stars?: never;
            bonus?: never;
        } | {
            day: number;
            stars: number;
            xp: number;
            coins?: never;
            bonus?: never;
        } | {
            day: number;
            stars: number;
            xp: number;
            bonus: string;
            coins?: never;
        })[];
        canClaim: boolean;
    };
    /**
     * Initialize subscription system
     */
    initializeSubscription(): {
        active: boolean;
        type: null;
        startDate: null;
        endDate: null;
        benefits: never[];
        autoRenew: boolean;
    };
    /**
     * Initialize battle pass system
     */
    initializeBattlePass(): {
        active: boolean;
        level: number;
        xp: number;
        xpToNext: number;
        rewards: never[];
        premium: boolean;
        season: number;
    };
    /**
     * Initialize social features
     */
    initializeSocial(): {
        friends: never[];
        gifts: {
            sent: never[];
            received: never[];
            dailyLimit: number;
            sentToday: number;
        };
        leaderboards: {
            weekly: {
                rank: number;
                score: number;
            };
            monthly: {
                rank: number;
                score: number;
            };
            allTime: {
                rank: number;
                score: number;
            };
        };
        guild: null;
    };
    /**
     * Initialize settings
     */
    initializeSettings(): {
        notifications: boolean;
        sound: boolean;
        music: boolean;
        vibration: boolean;
        language: string;
        currency: string;
        timezone: string;
    };
    /**
     * Initialize statistics
     */
    initializeStatistics(): {
        gamesPlayed: number;
        levelsCompleted: number;
        totalScore: number;
        averageScore: number;
        bestScore: number;
        timePlayed: number;
        purchases: number;
        totalSpent: number;
        lastPlayed: null;
        createdAt: string;
    };
    /**
     * Get player economy data
     */
    getPlayerEconomy(playerId: any): Promise<any>;
    /**
     * Update player currency
     */
    updateCurrency(playerId: any, currencyId: any, amount: any, operation?: string, source?: string): Promise<{
        success: boolean;
        currencyId: any;
        oldAmount: any;
        newAmount: any;
        operation: string;
        source: string;
    }>;
    /**
     * Update player inventory
     */
    updateInventory(playerId: any, category: any, itemId: any, quantity: any, operation?: string): Promise<{
        success: boolean;
        category: any;
        itemId: any;
        oldCount: any;
        newCount: any;
        operation: string;
    }>;
    /**
     * Update player progression
     */
    updateProgression(playerId: any, xpGained: any, levelCompleted?: boolean): Promise<{
        success: boolean;
        level: any;
        xp: any;
        xpToNext: any;
        leveledUp: boolean;
        rewards: ({
            type: string;
            currencyId: string;
            amount: number;
            category?: never;
            itemId?: never;
        } | {
            type: string;
            category: string;
            itemId: string;
            amount: number;
            currencyId?: never;
        })[];
    }>;
    /**
     * Give level up rewards
     */
    giveLevelUpRewards(playerId: any, level: any): Promise<void>;
    /**
     * Get level up rewards
     */
    getLevelUpRewards(level: any): ({
        type: string;
        currencyId: string;
        amount: number;
        category?: never;
        itemId?: never;
    } | {
        type: string;
        category: string;
        itemId: string;
        amount: number;
        currencyId?: never;
    })[];
    /**
     * Claim daily reward
     */
    /**
     * Serialise work for one player. Used so two requests cannot both pass a
     * once-per-day check before either has written its result.
     */
    withPlayerLock(playerId: any, fn: any): any;
    _playerLocks: Map<any, any> | undefined;
    /**
     * Drops the in-memory and AI-cache copies of a player's economy, so the next read reloads the
     * last saved state. Durable mode only: without a store, memory is the only copy and is kept.
     */
    discardUnsaved(playerId: any): Promise<void>;
    /** Adds a reward to a loaded economy object. Does not save. */
    applyReward(playerEconomy: any, reward: any): void;
    /**
     * Takes back a refunded grant, down to zero. The balance cannot go negative, so coins a player
     * already spent are not recovered. Returns what was taken and what could not be.
     */
    reverseCurrency(playerId: any, currencyId: any, amount: any, source?: string): Promise<any>;
    /** Takes coins from a loaded economy object. Does not save. */
    spendCoins(playerEconomy: any, amount: any): void;
    /**
     * Upgrades one kingdom room one level. The price and star gate come from kingdom.js.
     * The whole change is saved in one write.
     */
    renovateRoom(playerId: any, roomId: any): Promise<any>;
    /** Buys one loot box. The reward is rolled on the server and granted in the same save. */
    openLootbox(playerId: any, type: any, randomInt?: (max: any) => number): Promise<any>;
    /**
     * Spends the energy for one attempt at a level and issues the attempt id. This is the only place
     * attempt energy is taken, so the client cannot skip it. Regeneration is applied first, so a
     * player is never charged for points that have already come back. A new attempt replaces any
     * earlier one that was not completed.
     */
    spendAttemptEnergy(playerId: any, level: any, nowMs?: number): Promise<any>;
    /**
     * Consumes a spent attempt so its level can be rewarded once. Runs under the player lock and is
     * saved before any reward is granted, so a repeated or forged completion finds no attempt.
     */
    consumeAttempt(playerId: any, attemptId: any, level: any, nowMs?: number): Promise<any>;
    /**
     * The economy as the player should see it now: energy is brought up to date for the time that
     * has passed, without saving. Internal fields (the pending attempt) are left out.
     */
    getPlayerEconomyView(playerId: any, nowMs?: number): Promise<any>;
    /** Refills energy to its maximum. Charges only for the energy that is missing. */
    refillEnergy(playerId: any): Promise<any>;
    /**
     * Lucky wheel: one free spin per calendar day. The reward is chosen and granted
     * on the server.
     */
    spinLuckyWheel(playerId: any, randomInt?: (max: any) => number): Promise<any>;
    claimDailyReward(playerId: any): Promise<{
        success: boolean;
        streak: any;
        reward: any;
        nextReward: any;
    }>;
    /**
     * Update player economy cache
     */
    updatePlayerEconomyCache(playerId: any, playerEconomy: any): Promise<void>;
    /**
     * Sync economy with Unity
     */
    syncWithUnity(playerId: any, unityData: any): Promise<{
        success: boolean;
        syncedAt: string;
    }>;
    /**
     * Get economy statistics
     */
    getEconomyStats(playerId: any): Promise<{
        currencies: {
            id: any;
            name: any;
            amount: any;
            maxAmount: any;
            earned: any;
            spent: any;
        }[];
        progression: {
            level: any;
            xp: any;
            xpToNext: any;
            totalXp: any;
        };
        inventory: any;
        achievements: {
            completed: any;
            inProgress: any;
            totalPoints: any;
        };
        dailyRewards: {
            streak: any;
            canClaim: any;
            nextReward: any;
        };
        statistics: any;
    }>;
    /**
     * Helper methods
     */
    isSameDay(date1: any, date2: any): boolean;
    getDaysDifference(date1: any, date2: any): number;
    setCachedData(key: any, data: any, ttl?: number): void;
    getCachedData(key: any): any;
    /**
     * Get service statistics
     */
    getStats(): {
        cacheStats: {
            hits: number;
            misses: number;
            sets: number;
        };
        activePlayers: number;
        features: {
            currencies: string[];
            progression: string[];
            monetization: string[];
            social: string[];
            retention: string[];
        };
        version: string;
    };
}
//# sourceMappingURL=AccountEconomyService.d.ts.map