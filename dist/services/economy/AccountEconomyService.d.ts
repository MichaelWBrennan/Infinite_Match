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
    _playerLockContext: AsyncLocalStorage<any>;
    /**
     * Initialize player economy data for account
     */
    initializePlayerEconomy(playerId: any, platform?: string): Promise<any>;
    /**
     * Initialize currencies with industry standards. `isVip` applies VIP benefits.
     */
    initializeCurrencies(isVip?: boolean): {
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
        lives: {
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
    updateCurrency(playerId: any, currencyId: any, amount: any, operation?: string, source?: string): Promise<any>;
    _updateCurrencyUnlocked(playerId: any, currencyId: any, amount: any, operation?: string, source?: string): Promise<{
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
    updateInventory(playerId: any, category: any, itemId: any, quantity: any, operation?: string): Promise<any>;
    _updateInventoryUnlocked(playerId: any, category: any, itemId: any, quantity: any, operation?: string): Promise<{
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
    updateProgression(playerId: any, xpGained: any, levelCompleted?: boolean): Promise<any>;
    /** Apply XP and every level-up grant to a draft, without writing it. */
    applyXp(playerEconomy: any, xpGained: any, nowMs?: number): {
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
    };
    _updateProgressionUnlocked(playerId: any, xpGained: any, levelCompleted?: boolean): Promise<{
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
    /** A purchase ledger claim can be released after an ambiguous save. A permanent economy
     * receipt prevents the same verified provider transaction from crediting coins twice.
     */
    creditPurchaseOnce(playerId: any, transactionId: any, grants: any): Promise<any>;
    /**
     * Grant a streak freeze after a successful Stripe purchase.
     * Called from the webhook handler for the streak_freeze product.
     */
    grantStreakFreeze(playerId: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): Promise<any>;
    /** Bypass per-process caches when reconciling a held provider claim. No state is changed. */
    getPurchaseCreditReceipt(playerId: any, transactionId: any): Promise<any>;
    /** A refund debits only once even if the ledger update or Mongo acknowledgement is lost. */
    reversePurchaseOnce(playerId: any, transactionId: any, grants: any): Promise<any>;
    getPurchaseDebitReceipt(playerId: any, transactionId: any): Promise<any>;
    /** Community/tournament prizes span a social file and the economy. The social
     * reservation is not a transaction: this permanent receipt makes any later retry
     * idempotent, including when a save committed but its acknowledgement was lost.
     */
    grantCompetitionRewardOnce(playerId: any, key: any, amount: any, season?: null): Promise<any>;
    /** Bypass caches for cross-store reconciliation. No absent receipt proves nonpayment. */
    getCompetitionPayoutReceipt(playerId: any, key: any, amount: any): Promise<any>;
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
    spendAttemptEnergy(playerId: any, level: any, nowMs?: number, definition?: null, legacyTarget?: null): Promise<any>;
    /** Spend one life for a failed level attempt. Regeneration is applied first. */
    spendLife(playerId: any, nowMs?: number): Promise<any>;
    /** Buy lives with coins. Returns { livesAdded, livesRemaining, coinsSpent, coinsRemaining }. */
    buyLives(playerId: any, amount?: number, nowMs?: number): Promise<any>;
    /** Atomically spend one inventory item and, when requested, bind an effect receipt to
     * the pending paid attempt. A legacy spend during a run is marked unranked, not silently
     * treated as a no-booster attempt. The lock also serialises spends with completion.
     */
    spendPowerUp(playerId: any, powerupId: any, quantity?: number, attemptId?: undefined, nowMs?: number, useId?: undefined): Promise<any>;
    /** Settle an Endless attempt, its capped payout and a bounded retry receipt in one write.
     * The receipt is checked BEFORE pendingAttempt, so a later paid run is not affected by a retry.
     * Local locks serialize requests in this process; Mongo's pending-id predicate prevents two
     * workers from claiming the same pending attempt. All economy writes now guard a shared
     * revision; conflicts are re-evaluated here but unrelated multi-save workflows are still
     * not atomic across replicas.
     */
    settleEndlessAttempt(playerId: any, attemptId: any, score: any, nowMs?: number): Promise<any>;
    /** Validate the paid definition and optional deterministic replay without saving anything. */
    validateAttemptCompletion(economy: any, attemptId: any, level: any, nowMs: any, completion: any): {
        pending: any;
        definition: any;
        stars: number | undefined;
        replay: {
            error: any;
        } | {
            verified: boolean;
            score: number;
        } | null;
    };
    /** Pays a classic/daily win in one guarded document write, including its replay receipt.
     * Side effects outside the economy (boards and observation logs) remain best-effort.
     */
    settleLevelAttempt(playerId: any, attemptId: any, level: any, completion: any, policies?: {}, nowMs?: number): Promise<any>;
    /**
     * Legacy low-level consume helper retained for existing internal callers/tests. New HTTP
     * classic/daily payouts use settleLevelAttempt instead, so attempt and rewards save together.
     */
    consumeAttempt(playerId: any, attemptId: any, level: any, nowMs?: number, completion?: null): Promise<any>;
    /** A reported loss/quit ends only the matching paid attempt. No rewards are granted.
     * These reports are diagnostics, not server proof that the board was played or lost. */
    closeAttempt(playerId: any, attemptId: any, outcome: any, signals?: {}, nowMs?: number): Promise<any>;
    /**
     * The economy as the player should see it now: energy is brought up to date for the time that
     * has passed, without saving. Internal fields (the pending attempt) are left out.
     */
    getPlayerEconomyView(playerId: any, nowMs?: number): Promise<any>;
    /**
     * Credits one energy gift to the receiver, once per giftId. Energy never goes above the maximum,
     * so `credited` can be less than `amount` (or 0) for a full receiver. Saved in one write.
     */
    creditEnergyGift(playerId: any, giftId: any, amount: any, nowMs?: number): Promise<any>;
    /**
     * Credits one booster gift to the receiver, once per giftId. The booster count never goes
     * above maxCount (99), so `credited` can be less than `amount` (or 0) for a full inventory.
     * Saved in one write.
     */
    creditBoosterGift(playerId: any, giftId: any, boosterId: any, amount?: number, nowMs?: number): Promise<any>;
    /**
     * Grants one guild-milestone reward of coins, once per milestone key for this player (S3).
     * Like the weekly event, it refuses rather than clip when the coin wallet would overflow, so
     * the player can claim later. Nothing is granted on a retry.
     */
    creditMilestoneReward(playerId: any, milestoneKey: any, amount: any, nowMs?: number): Promise<any>;
    /** Refills energy to its maximum. Charges only for the energy that is missing. */
    refillEnergy(playerId: any): Promise<any>;
    /**
     * Lucky wheel: one free spin per calendar day. The reward is chosen and granted
     * on the server.
     */
    spinLuckyWheel(playerId: any, randomInt?: (max: any) => number): Promise<any>;
    claimDailyReward(playerId: any, season?: null): Promise<any>;
    _claimDailyRewardUnlocked(playerId: any, season: any): Promise<{
        success: boolean;
        streak: any;
        reward: any;
        nextReward: any;
    }>;
    /** Get the player's current daily quests, resetting to a new day if needed. */
    getDailyQuests(playerId: any): Promise<{
        quests: {
            id: string;
            type: string;
            target: number;
            progress: number;
            claimed: boolean;
            reward: {
                coins: number;
                xp: number;
            };
        }[];
        dayStartMs: number;
    }>;
    /** Update daily quest progress for an event. Returns the updated quests. */
    updateDailyQuestProgress(playerId: any, event: any, amount?: number): Promise<any>;
    /** Claim a daily quest reward. Grants the reward and marks the quest claimed. */
    claimDailyQuest(playerId: any, questId: any): Promise<any>;
    /** One coin debit and inventory grant; a save failure leaves both unchanged. */
    purchaseCatalogItem(playerId: any, itemId: any): Promise<any>;
    /**
     * Update player economy cache
     */
    updatePlayerEconomyCache(playerId: any, playerEconomy: any, expectedAttemptId?: null): Promise<boolean>;
    /**
     * Sync economy with Unity
     */
    syncWithUnity(playerId: any, unityData: any): Promise<any>;
    _syncWithUnityUnlocked(playerId: any, unityData: any): Promise<{
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
import { AsyncLocalStorage } from 'node:async_hooks';
//# sourceMappingURL=AccountEconomyService.d.ts.map