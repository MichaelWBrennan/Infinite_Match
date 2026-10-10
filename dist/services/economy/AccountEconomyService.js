/**
 * Account-Linked Economy Service
 * Industry-standard match-3 economy system with account synchronization
 * Integrates Unity Economy with user accounts and cross-platform sync
 */
import { Logger } from '../../core/logger/index.js';
import { ServiceError } from '../../core/errors/ErrorHandler.js';
import { aiCacheManager } from '../ai-cache-manager.js';
import crypto from 'crypto';
import { pickWheelReward, LEVEL_LIMITS } from './item-catalog.js';
import { PlayerEconomyDb, isDurableEconomy } from './PlayerEconomyDb.js';
import { ensureKingdom, initialKingdom, planRenovation, roomById, MILESTONE_REWARDS } from '../meta/kingdom.js';
import { LOOTBOXES, pickLootReward, ENERGY_PRICE_COINS } from '../meta/lootbox.js';
import { ATTEMPT_ENERGY_COST, ATTEMPT_MAX_AGE_MS, regenerateEnergy, nextRegenInMs } from '../meta/energy.js';
/** A rule the player cannot meet (not enough coins, room maxed). `code` is safe to show. */
export class EconomyRuleError extends Error {
    constructor(code, message = code) {
        super(message);
        this.code = code;
    }
}
const logger = new Logger('AccountEconomyService');
class AccountEconomyService {
    constructor() {
        this.cacheManager = aiCacheManager;
        this.cache = new Map();
        this.cacheStats = {
            hits: 0,
            misses: 0,
            sets: 0,
        };
        // Industry-standard match-3 economy features
        this.economyFeatures = {
            currencies: ['coins', 'stars', 'energy'],
            progression: ['levels', 'xp', 'achievements', 'daily_rewards'],
            monetization: ['iap', 'ads', 'subscriptions', 'battle_pass'],
            social: ['gifts', 'leaderboards', 'guilds', 'events'],
            retention: ['daily_login', 'comeback_rewards', 'streaks', 'challenges']
        };
        // Account economy data structure
        this.accountEconomyData = new Map();
    }
    /**
     * Initialize player economy data for account
     */
    async initializePlayerEconomy(playerId, platform = 'local') {
        try {
            const cacheKey = `player_economy:${playerId}`;
            // Check cache first
            const cached = await this.cacheManager.get(cacheKey, 'content');
            if (cached) {
                this.cacheStats.hits++;
                return cached;
            }
            this.cacheStats.misses++;
            // A saved economy wins over a new one, so re-initialising never resets a balance.
            if (isDurableEconomy()) {
                const saved = await PlayerEconomyDb.load(playerId);
                if (saved) {
                    ensureKingdom(saved);
                    this.accountEconomyData.set(playerId, saved);
                    await this.cacheManager.set(cacheKey, saved, 'content', 300);
                    return saved;
                }
            }
            // Create new player economy profile
            const playerEconomy = {
                playerId,
                platform,
                currencies: this.initializeCurrencies(),
                progression: this.initializeProgression(),
                inventory: this.initializeInventory(),
                achievements: this.initializeAchievements(),
                dailyRewards: this.initializeDailyRewards(),
                subscription: this.initializeSubscription(),
                battlePass: this.initializeBattlePass(),
                social: this.initializeSocial(),
                settings: this.initializeSettings(),
                statistics: this.initializeStatistics(),
                kingdom: initialKingdom(),
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                version: '1.0.0'
            };
            // Store durably first when configured, so a new economy is never lost on restart.
            if (isDurableEconomy())
                await PlayerEconomyDb.save(playerId, playerEconomy);
            // Cache the data
            await this.cacheManager.set(cacheKey, playerEconomy, 'content', 300);
            this.setCachedData(cacheKey, playerEconomy, 300000);
            // Store in memory for quick access
            this.accountEconomyData.set(playerId, playerEconomy);
            logger.info('Player economy initialized', { playerId, platform });
            return playerEconomy;
        }
        catch (error) {
            logger.error('Failed to initialize player economy', { error: error.message, playerId });
            throw new ServiceError(`Failed to initialize player economy: ${error.message}`, 'AccountEconomyService');
        }
    }
    /**
     * Initialize currencies with industry standards
     */
    initializeCurrencies() {
        return {
            coins: {
                id: 'coins',
                name: 'Coins',
                type: 'soft_currency',
                amount: 1000,
                maxAmount: 999999,
                earned: 0,
                spent: 0,
                icon: 'coin_icon',
                color: '#FFD700',
                description: 'Primary soft currency earned through gameplay'
            },
            stars: {
                id: 'stars',
                name: 'Stars',
                type: 'hard_currency',
                amount: 0,
                maxAmount: 99999,
                earned: 0,
                spent: 0,
                icon: 'star_icon',
                color: '#FFA500',
                description: 'Premium hard currency for special purchases'
            },
            energy: {
                id: 'energy',
                name: 'Energy',
                type: 'consumable',
                amount: 100,
                maxAmount: 100,
                earned: 0,
                spent: 0,
                icon: 'energy_icon',
                color: '#32CD32',
                description: 'Energy required to play levels',
                regenRate: 1, // per minute
                lastRegen: Date.now()
            }
        };
    }
    /**
     * Initialize progression system
     */
    initializeProgression() {
        return {
            level: 1,
            xp: 0,
            xpToNext: 100,
            totalXp: 0,
            prestige: 0,
            rank: 'Rookie',
            levelRewards: [],
            milestones: [],
            lastLevelUp: null
        };
    }
    /**
     * Initialize inventory system
     */
    initializeInventory() {
        return {
            powerups: {
                bomb: { id: 'bomb', name: 'Bomb', count: 3, maxCount: 99, type: 'powerup', rarity: 'common' },
                rocket: { id: 'rocket', name: 'Rocket', count: 2, maxCount: 99, type: 'powerup', rarity: 'common' },
                rainbow: { id: 'rainbow', name: 'Rainbow', count: 1, maxCount: 99, type: 'powerup', rarity: 'rare' },
                lightning: { id: 'lightning', name: 'Lightning', count: 1, maxCount: 99, type: 'powerup', rarity: 'rare' },
                target: { id: 'target', name: 'Target Gem', count: 0, maxCount: 99, type: 'powerup', rarity: 'rare' },
                diamond: { id: 'diamond', name: 'Diamond', count: 0, maxCount: 99, type: 'powerup', rarity: 'epic' },
                star: { id: 'star', name: 'Star', count: 0, maxCount: 99, type: 'powerup', rarity: 'epic' }
            },
            boosters: {
                extra_moves: { id: 'extra_moves', name: 'Extra Moves', count: 0, maxCount: 99, type: 'booster', rarity: 'common' },
                color_bomb: { id: 'color_bomb', name: 'Color Bomb', count: 0, maxCount: 99, type: 'booster', rarity: 'rare' },
                striped_candy: { id: 'striped_candy', name: 'Striped Candy', count: 0, maxCount: 99, type: 'booster', rarity: 'common' }
            },
            decorations: {
                castle: { id: 'castle', name: 'Castle', count: 1, maxCount: 1, type: 'decoration', rarity: 'legendary' },
                garden: { id: 'garden', name: 'Garden', count: 0, maxCount: 1, type: 'decoration', rarity: 'epic' }
            }
        };
    }
    /**
     * Initialize achievements system
     */
    initializeAchievements() {
        return {
            completed: [],
            inProgress: [
                {
                    id: 'first_level',
                    name: 'First Steps',
                    description: 'Complete your first level',
                    progress: 0,
                    maxProgress: 1,
                    reward: { coins: 100, xp: 50 },
                    rarity: 'common'
                },
                {
                    id: 'level_master',
                    name: 'Level Master',
                    description: 'Complete 10 levels',
                    progress: 0,
                    maxProgress: 10,
                    reward: { gems: 10, xp: 200 },
                    rarity: 'uncommon'
                }
            ],
            totalCompleted: 0,
            totalPoints: 0
        };
    }
    /**
     * Initialize daily rewards system
     */
    initializeDailyRewards() {
        return {
            streak: 0,
            lastClaimed: null,
            nextReward: 1,
            rewards: [
                { day: 1, coins: 100, xp: 50 },
                { day: 2, coins: 150, xp: 75 },
                { day: 3, stars: 5, xp: 100 },
                { day: 4, coins: 200, xp: 125 },
                { day: 5, stars: 10, xp: 150 },
                { day: 6, coins: 300, xp: 175 },
                { day: 7, stars: 20, xp: 200, bonus: 'mega_reward' }
            ],
            canClaim: true
        };
    }
    /**
     * Initialize subscription system
     */
    initializeSubscription() {
        return {
            active: false,
            type: null,
            startDate: null,
            endDate: null,
            benefits: [],
            autoRenew: false
        };
    }
    /**
     * Initialize battle pass system
     */
    initializeBattlePass() {
        return {
            active: false,
            level: 1,
            xp: 0,
            xpToNext: 100,
            rewards: [],
            premium: false,
            season: 1
        };
    }
    /**
     * Initialize social features
     */
    initializeSocial() {
        return {
            friends: [],
            gifts: {
                sent: [],
                received: [],
                dailyLimit: 5,
                sentToday: 0
            },
            leaderboards: {
                weekly: { rank: 0, score: 0 },
                monthly: { rank: 0, score: 0 },
                allTime: { rank: 0, score: 0 }
            },
            guild: null
        };
    }
    /**
     * Initialize settings
     */
    initializeSettings() {
        return {
            notifications: true,
            sound: true,
            music: true,
            vibration: true,
            language: 'en',
            currency: 'USD',
            timezone: 'UTC'
        };
    }
    /**
     * Initialize statistics
     */
    initializeStatistics() {
        return {
            gamesPlayed: 0,
            levelsCompleted: 0,
            totalScore: 0,
            averageScore: 0,
            bestScore: 0,
            timePlayed: 0,
            purchases: 0,
            totalSpent: 0,
            lastPlayed: null,
            createdAt: new Date().toISOString()
        };
    }
    /**
     * Get player economy data
     */
    async getPlayerEconomy(playerId) {
        try {
            const cacheKey = `player_economy:${playerId}`;
            // Check memory cache first
            if (this.accountEconomyData.has(playerId)) {
                this.cacheStats.hits++;
                const inMemory = this.accountEconomyData.get(playerId);
                ensureKingdom(inMemory);
                return inMemory;
            }
            // Check AI cache
            const cached = await this.cacheManager.get(cacheKey, 'content');
            if (cached) {
                this.cacheStats.hits++;
                ensureKingdom(cached);
                this.accountEconomyData.set(playerId, cached);
                return cached;
            }
            this.cacheStats.misses++;
            // The durable store is the source of truth after a restart.
            if (isDurableEconomy()) {
                const saved = await PlayerEconomyDb.load(playerId);
                if (saved) {
                    ensureKingdom(saved);
                    this.accountEconomyData.set(playerId, saved);
                    return saved;
                }
            }
            // Initialize if not found
            return await this.initializePlayerEconomy(playerId);
        }
        catch (error) {
            logger.error('Failed to get player economy', { error: error.message, playerId });
            throw new ServiceError(`Failed to get player economy: ${error.message}`, 'AccountEconomyService');
        }
    }
    /**
     * Update player currency
     */
    async updateCurrency(playerId, currencyId, amount, operation = 'add', source = 'unknown') {
        // Amounts must be whole numbers. A negative 'spend' would otherwise add currency.
        // Zero is allowed: level-up rewards can legitimately be 0 (e.g. stars below level 5).
        if (!Number.isSafeInteger(amount) || amount < 0) {
            throw new Error('Amount must be a whole number within range');
        }
        try {
            const playerEconomy = await this.getPlayerEconomy(playerId);
            if (!playerEconomy.currencies[currencyId]) {
                throw new Error(`Currency ${currencyId} not found`);
            }
            const currency = playerEconomy.currencies[currencyId];
            const oldAmount = currency.amount;
            if (operation === 'add') {
                currency.amount = Math.min(currency.amount + amount, currency.maxAmount);
                currency.earned += amount;
            }
            else if (operation === 'spend') {
                if (currency.amount < amount) {
                    throw new Error(`Insufficient ${currencyId}`);
                }
                currency.amount = Math.max(currency.amount - amount, 0);
                currency.spent += amount;
            }
            else if (operation === 'set') {
                currency.amount = Math.min(Math.max(amount, 0), currency.maxAmount);
            }
            playerEconomy.lastUpdated = new Date().toISOString();
            // Update cache
            await this.updatePlayerEconomyCache(playerId, playerEconomy);
            logger.info('Currency updated', {
                playerId,
                currencyId,
                oldAmount,
                newAmount: currency.amount,
                operation,
                source
            });
            return {
                success: true,
                currencyId,
                oldAmount,
                newAmount: currency.amount,
                operation,
                source
            };
        }
        catch (error) {
            logger.error('Failed to update currency', { error: error.message, playerId, currencyId });
            throw new ServiceError(`Failed to update currency: ${error.message}`, 'AccountEconomyService');
        }
    }
    /**
     * Update player inventory
     */
    async updateInventory(playerId, category, itemId, quantity, operation = 'add') {
        if (!Number.isSafeInteger(quantity) || quantity < 0) {
            throw new Error('Quantity must be a whole number within range');
        }
        try {
            const playerEconomy = await this.getPlayerEconomy(playerId);
            if (!playerEconomy.inventory[category]) {
                throw new Error(`Inventory category ${category} not found`);
            }
            const categoryItems = playerEconomy.inventory[category];
            if (!categoryItems[itemId]) {
                throw new Error(`Item ${itemId} not found in category ${category}`);
            }
            const item = categoryItems[itemId];
            const oldCount = item.count;
            if (operation === 'add') {
                item.count = Math.min(item.count + quantity, item.maxCount);
            }
            else if (operation === 'remove') {
                if (item.count < quantity) {
                    throw new Error(`Insufficient ${itemId}`);
                }
                item.count = Math.max(item.count - quantity, 0);
            }
            else if (operation === 'set') {
                item.count = Math.min(Math.max(quantity, 0), item.maxCount);
            }
            playerEconomy.lastUpdated = new Date().toISOString();
            // Update cache
            await this.updatePlayerEconomyCache(playerId, playerEconomy);
            logger.info('Inventory updated', {
                playerId,
                category,
                itemId,
                oldCount,
                newCount: item.count,
                operation
            });
            return {
                success: true,
                category,
                itemId,
                oldCount,
                newCount: item.count,
                operation
            };
        }
        catch (error) {
            logger.error('Failed to update inventory', { error: error.message, playerId, category, itemId });
            throw new ServiceError(`Failed to update inventory: ${error.message}`, 'AccountEconomyService');
        }
    }
    /**
     * Update player progression
     */
    async updateProgression(playerId, xpGained, levelCompleted = false) {
        try {
            const playerEconomy = await this.getPlayerEconomy(playerId);
            const progression = playerEconomy.progression;
            progression.xp += xpGained;
            progression.totalXp += xpGained;
            // Check for level up
            let leveledUp = false;
            while (progression.xp >= progression.xpToNext) {
                progression.xp -= progression.xpToNext;
                progression.level++;
                progression.xpToNext = Math.floor(progression.xpToNext * 1.2); // Exponential growth
                progression.lastLevelUp = new Date().toISOString();
                leveledUp = true;
                // Give level up rewards
                await this.giveLevelUpRewards(playerId, progression.level);
            }
            if (levelCompleted) {
                progression.milestones.push({
                    level: progression.level,
                    xp: progression.totalXp,
                    timestamp: new Date().toISOString()
                });
            }
            playerEconomy.lastUpdated = new Date().toISOString();
            // Update cache
            await this.updatePlayerEconomyCache(playerId, playerEconomy);
            logger.info('Progression updated', {
                playerId,
                level: progression.level,
                xp: progression.xp,
                leveledUp
            });
            return {
                success: true,
                level: progression.level,
                xp: progression.xp,
                xpToNext: progression.xpToNext,
                leveledUp,
                rewards: leveledUp ? await this.getLevelUpRewards(progression.level) : []
            };
        }
        catch (error) {
            logger.error('Failed to update progression', { error: error.message, playerId });
            throw new ServiceError(`Failed to update progression: ${error.message}`, 'AccountEconomyService');
        }
    }
    /**
     * Give level up rewards
     */
    async giveLevelUpRewards(playerId, level) {
        const rewards = this.getLevelUpRewards(level);
        for (const reward of rewards) {
            if (reward.type === 'currency') {
                await this.updateCurrency(playerId, reward.currencyId, reward.amount, 'add', 'level_up');
            }
            else if (reward.type === 'inventory') {
                await this.updateInventory(playerId, reward.category, reward.itemId, reward.amount, 'add');
            }
        }
    }
    /**
     * Get level up rewards
     */
    getLevelUpRewards(level) {
        const rewards = [];
        // Base rewards
        rewards.push({ type: 'currency', currencyId: 'coins', amount: level * 50 });
        rewards.push({ type: 'currency', currencyId: 'stars', amount: Math.floor(level / 5) });
        // Special rewards for milestone levels
        if (level % 10 === 0) {
            rewards.push({ type: 'inventory', category: 'powerups', itemId: 'rainbow', amount: 1 });
        }
        if (level % 25 === 0) {
            rewards.push({ type: 'inventory', category: 'powerups', itemId: 'lightning', amount: 1 });
        }
        return rewards;
    }
    /**
     * Claim daily reward
     */
    /**
     * Serialise work for one player. Used so two requests cannot both pass a
     * once-per-day check before either has written its result.
     */
    withPlayerLock(playerId, fn) {
        if (!this._playerLocks)
            this._playerLocks = new Map();
        const previous = this._playerLocks.get(playerId) || Promise.resolve();
        const run = previous.catch(() => { }).then(async () => {
            try {
                return await fn();
            }
            catch (error) {
                // The operation may have changed the cached economy before it failed. Drop it so the
                // unsaved change is not written by a later save.
                await this.discardUnsaved(playerId);
                throw error;
            }
        });
        const tail = run.catch(() => { });
        this._playerLocks.set(playerId, tail);
        tail.then(() => {
            if (this._playerLocks.get(playerId) === tail)
                this._playerLocks.delete(playerId);
        });
        return run;
    }
    /**
     * Drops the in-memory and AI-cache copies of a player's economy, so the next read reloads the
     * last saved state. Durable mode only: without a store, memory is the only copy and is kept.
     */
    async discardUnsaved(playerId) {
        if (!isDurableEconomy())
            return;
        this.accountEconomyData.delete(playerId);
        try {
            await this.cacheManager.delete(`player_economy:${playerId}`, 'content');
        }
        catch (error) {
            logger.error('Failed to evict cached economy', { error: error.message, playerId });
        }
    }
    /** Adds a reward to a loaded economy object. Does not save. */
    applyReward(playerEconomy, reward) {
        if (reward.type === 'currency') {
            const currency = playerEconomy.currencies[reward.currencyId];
            if (!currency)
                throw new EconomyRuleError('unknown_currency');
            currency.amount = Math.min(currency.amount + reward.amount, currency.maxAmount);
            currency.earned += reward.amount;
        }
        else {
            const item = playerEconomy.inventory[reward.category]?.[reward.itemId];
            if (!item)
                throw new EconomyRuleError('unknown_item');
            item.count = Math.min(item.count + reward.amount, item.maxCount);
        }
    }
    /**
     * Takes back a refunded grant, down to zero. The balance cannot go negative, so coins a player
     * already spent are not recovered. Returns what was taken and what could not be.
     */
    async reverseCurrency(playerId, currencyId, amount, source = 'reversal') {
        if (!Number.isInteger(amount) || amount < 0)
            throw new EconomyRuleError('invalid_amount');
        return this.withPlayerLock(playerId, async () => {
            const playerEconomy = await this.getPlayerEconomy(playerId);
            const currency = playerEconomy.currencies[currencyId];
            if (!currency)
                throw new EconomyRuleError('unknown_currency');
            const taken = Math.min(amount, currency.amount);
            currency.amount -= taken;
            playerEconomy.lastUpdated = new Date().toISOString();
            await this.updatePlayerEconomyCache(playerId, playerEconomy);
            logger.info('Currency reversed', { playerId, currencyId, taken, shortfall: amount - taken, source });
            return { taken, shortfall: amount - taken };
        });
    }
    /** Takes coins from a loaded economy object. Does not save. */
    spendCoins(playerEconomy, amount) {
        const coins = playerEconomy.currencies.coins;
        if (coins.amount < amount)
            throw new EconomyRuleError('insufficient_coins');
        coins.amount -= amount;
        coins.spent += amount;
    }
    /**
     * Upgrades one kingdom room one level. The price and star gate come from kingdom.js.
     * The whole change is saved in one write.
     */
    async renovateRoom(playerId, roomId) {
        return this.withPlayerLock(playerId, async () => {
            const playerEconomy = await this.getPlayerEconomy(playerId);
            const kingdom = ensureKingdom(playerEconomy);
            const room = roomById(roomId);
            if (!room)
                throw new EconomyRuleError('unknown_room');
            const plan = planRenovation({
                kingdom,
                room,
                coins: playerEconomy.currencies.coins.amount,
                lifetimeStars: playerEconomy.currencies.stars.earned,
            });
            if (!plan.ok)
                throw new EconomyRuleError(plan.reason);
            this.spendCoins(playerEconomy, plan.costCoins);
            kingdom.rooms[room.id] = plan.targetLevel;
            kingdom.renovations += 1;
            const milestone = MILESTONE_REWARDS[plan.targetLevel] || null;
            if (milestone) {
                this.applyReward(playerEconomy, { type: 'inventory', ...milestone });
            }
            playerEconomy.lastUpdated = new Date().toISOString();
            await this.updatePlayerEconomyCache(playerId, playerEconomy);
            logger.info('Kingdom room renovated', { playerId, roomId, level: plan.targetLevel });
            return {
                roomId,
                level: plan.targetLevel,
                costCoins: plan.costCoins,
                milestone,
                coins: playerEconomy.currencies.coins.amount,
            };
        });
    }
    /** Buys one loot box. The reward is rolled on the server and granted in the same save. */
    async openLootbox(playerId, type, randomInt = (max) => crypto.randomInt(max)) {
        const box = Object.prototype.hasOwnProperty.call(LOOTBOXES, type) ? LOOTBOXES[type] : null;
        if (!box)
            throw new EconomyRuleError('unknown_lootbox');
        return this.withPlayerLock(playerId, async () => {
            const playerEconomy = await this.getPlayerEconomy(playerId);
            this.spendCoins(playerEconomy, box.costCoins);
            const reward = pickLootReward(box.rewards, randomInt);
            this.applyReward(playerEconomy, reward);
            playerEconomy.lastUpdated = new Date().toISOString();
            await this.updatePlayerEconomyCache(playerId, playerEconomy);
            logger.info('Loot box opened', { playerId, type, reward: reward.id });
            return {
                type,
                reward,
                costCoins: box.costCoins,
                coins: playerEconomy.currencies.coins.amount,
                energy: playerEconomy.currencies.energy.amount,
            };
        });
    }
    /**
     * Spends the energy for one attempt at a level and issues the attempt id. This is the only place
     * attempt energy is taken, so the client cannot skip it. Regeneration is applied first, so a
     * player is never charged for points that have already come back. A new attempt replaces any
     * earlier one that was not completed.
     */
    async spendAttemptEnergy(playerId, level, nowMs = Date.now()) {
        if (!Number.isInteger(level) || level < 1 || level > LEVEL_LIMITS.maxLevel) {
            throw new EconomyRuleError('invalid_level');
        }
        return this.withPlayerLock(playerId, async () => {
            const playerEconomy = await this.getPlayerEconomy(playerId);
            const energy = regenerateEnergy(playerEconomy.currencies.energy, nowMs);
            if (energy.amount < ATTEMPT_ENERGY_COST)
                throw new EconomyRuleError('energy_empty');
            energy.amount -= ATTEMPT_ENERGY_COST;
            energy.spent += ATTEMPT_ENERGY_COST;
            const attemptId = crypto.randomUUID();
            playerEconomy.pendingAttempt = { id: attemptId, level, issuedAt: nowMs };
            playerEconomy.lastUpdated = new Date(nowMs).toISOString();
            await this.updatePlayerEconomyCache(playerId, playerEconomy);
            return {
                attemptId,
                level,
                energy: energy.amount,
                maxEnergy: energy.maxAmount,
                nextRegenInMs: nextRegenInMs(energy, nowMs),
            };
        });
    }
    /**
     * Consumes a spent attempt so its level can be rewarded once. Runs under the player lock and is
     * saved before any reward is granted, so a repeated or forged completion finds no attempt.
     */
    async consumeAttempt(playerId, attemptId, level, nowMs = Date.now()) {
        return this.withPlayerLock(playerId, async () => {
            const playerEconomy = await this.getPlayerEconomy(playerId);
            const pending = playerEconomy.pendingAttempt;
            if (!pending || typeof attemptId !== 'string' || pending.id !== attemptId) {
                throw new EconomyRuleError('attempt_not_found');
            }
            if (pending.level !== level)
                throw new EconomyRuleError('attempt_level_mismatch');
            if (nowMs - pending.issuedAt > ATTEMPT_MAX_AGE_MS)
                throw new EconomyRuleError('attempt_expired');
            playerEconomy.pendingAttempt = null;
            playerEconomy.lastUpdated = new Date(nowMs).toISOString();
            await this.updatePlayerEconomyCache(playerId, playerEconomy);
            return { level };
        });
    }
    /**
     * The economy as the player should see it now: energy is brought up to date for the time that
     * has passed, without saving. Internal fields (the pending attempt) are left out.
     */
    async getPlayerEconomyView(playerId, nowMs = Date.now()) {
        const playerEconomy = await this.getPlayerEconomy(playerId);
        const view = structuredClone(playerEconomy);
        delete view.pendingAttempt;
        regenerateEnergy(view.currencies.energy, nowMs);
        view.currencies.energy.nextRegenInMs = nextRegenInMs(view.currencies.energy, nowMs);
        return view;
    }
    /** Refills energy to its maximum. Charges only for the energy that is missing. */
    async refillEnergy(playerId) {
        return this.withPlayerLock(playerId, async () => {
            const playerEconomy = await this.getPlayerEconomy(playerId);
            const energy = regenerateEnergy(playerEconomy.currencies.energy, Date.now());
            const missing = energy.maxAmount - energy.amount;
            if (missing <= 0)
                throw new EconomyRuleError('energy_full');
            const costCoins = missing * ENERGY_PRICE_COINS;
            this.spendCoins(playerEconomy, costCoins);
            energy.amount = energy.maxAmount;
            energy.lastRegen = Date.now();
            playerEconomy.lastUpdated = new Date().toISOString();
            await this.updatePlayerEconomyCache(playerId, playerEconomy);
            return { costCoins, energy: energy.amount, coins: playerEconomy.currencies.coins.amount };
        });
    }
    /**
     * Lucky wheel: one free spin per calendar day. The reward is chosen and granted
     * on the server.
     */
    async spinLuckyWheel(playerId, randomInt = (max) => crypto.randomInt(max)) {
        return this.withPlayerLock(playerId, async () => {
            const playerEconomy = await this.getPlayerEconomy(playerId);
            const now = new Date();
            const lastSpin = playerEconomy.wheel?.lastSpin ? new Date(playerEconomy.wheel.lastSpin) : null;
            if (lastSpin && this.isSameDay(now, lastSpin)) {
                throw new Error('Lucky wheel already spun today');
            }
            const reward = pickWheelReward(randomInt);
            // Record the spin before granting, so a failed grant still counts as a spin.
            playerEconomy.wheel = { ...(playerEconomy.wheel || {}), lastSpin: now.toISOString() };
            await this.updatePlayerEconomyCache(playerId, playerEconomy);
            if (reward.type === 'currency') {
                await this.updateCurrency(playerId, reward.currencyId, reward.amount, 'add', 'lucky_wheel');
            }
            else {
                await this.updateInventory(playerId, reward.category, reward.itemId, reward.amount, 'add');
            }
            return { reward, spunAt: now.toISOString() };
        });
    }
    async claimDailyReward(playerId) {
        try {
            const playerEconomy = await this.getPlayerEconomy(playerId);
            const dailyRewards = playerEconomy.dailyRewards;
            const now = new Date();
            const lastClaimed = dailyRewards.lastClaimed ? new Date(dailyRewards.lastClaimed) : null;
            // Check if can claim
            if (lastClaimed && this.isSameDay(now, lastClaimed)) {
                throw new Error('Daily reward already claimed today');
            }
            // Reset streak if more than 1 day has passed
            if (lastClaimed && this.getDaysDifference(now, lastClaimed) > 1) {
                dailyRewards.streak = 0;
            }
            // Increment streak
            dailyRewards.streak++;
            dailyRewards.lastClaimed = now.toISOString();
            // Get reward
            const rewardIndex = Math.min(dailyRewards.streak - 1, dailyRewards.rewards.length - 1);
            const reward = dailyRewards.rewards[rewardIndex];
            // Give rewards
            if (reward.coins) {
                await this.updateCurrency(playerId, 'coins', reward.coins, 'add', 'daily_reward');
            }
            if (reward.stars) {
                await this.updateCurrency(playerId, 'stars', reward.stars, 'add', 'daily_reward');
            }
            if (reward.xp) {
                await this.updateProgression(playerId, reward.xp);
            }
            // Set next reward
            dailyRewards.nextReward = Math.min(dailyRewards.streak + 1, dailyRewards.rewards.length);
            dailyRewards.canClaim = false;
            playerEconomy.lastUpdated = new Date().toISOString();
            // Update cache
            await this.updatePlayerEconomyCache(playerId, playerEconomy);
            logger.info('Daily reward claimed', {
                playerId,
                streak: dailyRewards.streak,
                reward
            });
            return {
                success: true,
                streak: dailyRewards.streak,
                reward,
                nextReward: dailyRewards.nextReward
            };
        }
        catch (error) {
            logger.error('Failed to claim daily reward', { error: error.message, playerId });
            throw new ServiceError(`Failed to claim daily reward: ${error.message}`, 'AccountEconomyService');
        }
    }
    /**
     * Update player economy cache
     */
    async updatePlayerEconomyCache(playerId, playerEconomy) {
        const cacheKey = `player_economy:${playerId}`;
        if (isDurableEconomy()) {
            try {
                await PlayerEconomyDb.save(playerId, playerEconomy);
            }
            catch (error) {
                // The unsaved change is still on the cached object, so drop the AI-cache copy as well.
                await this.discardUnsaved(playerId);
                throw error;
            }
        }
        // Update memory cache
        this.accountEconomyData.set(playerId, playerEconomy);
        // Update AI cache
        await this.cacheManager.set(cacheKey, playerEconomy, 'content', 300);
        // Update local cache
        this.setCachedData(cacheKey, playerEconomy, 300000);
        this.cacheStats.sets++;
    }
    /**
     * Sync economy with Unity
     */
    async syncWithUnity(playerId, unityData) {
        try {
            const playerEconomy = await this.getPlayerEconomy(playerId);
            // Balances are never written from the client. Currency and inventory change
            // only through server flows (level results, purchases, rewards), so a sync
            // cannot set arbitrary balances.
            playerEconomy.lastUpdated = new Date().toISOString();
            // Update cache
            await this.updatePlayerEconomyCache(playerId, playerEconomy);
            logger.info('Economy synced with Unity', { playerId });
            return {
                success: true,
                syncedAt: new Date().toISOString()
            };
        }
        catch (error) {
            logger.error('Failed to sync with Unity', { error: error.message, playerId });
            throw new ServiceError(`Failed to sync with Unity: ${error.message}`, 'AccountEconomyService');
        }
    }
    /**
     * Get economy statistics
     */
    async getEconomyStats(playerId) {
        try {
            const playerEconomy = await this.getPlayerEconomy(playerId);
            return {
                currencies: Object.values(playerEconomy.currencies).map(c => ({
                    id: c.id,
                    name: c.name,
                    amount: c.amount,
                    maxAmount: c.maxAmount,
                    earned: c.earned,
                    spent: c.spent
                })),
                progression: {
                    level: playerEconomy.progression.level,
                    xp: playerEconomy.progression.xp,
                    xpToNext: playerEconomy.progression.xpToNext,
                    totalXp: playerEconomy.progression.totalXp
                },
                inventory: playerEconomy.inventory,
                achievements: {
                    completed: playerEconomy.achievements.completed.length,
                    inProgress: playerEconomy.achievements.inProgress.length,
                    totalPoints: playerEconomy.achievements.totalPoints
                },
                dailyRewards: {
                    streak: playerEconomy.dailyRewards.streak,
                    canClaim: playerEconomy.dailyRewards.canClaim,
                    nextReward: playerEconomy.dailyRewards.nextReward
                },
                statistics: playerEconomy.statistics
            };
        }
        catch (error) {
            logger.error('Failed to get economy stats', { error: error.message, playerId });
            throw new ServiceError(`Failed to get economy stats: ${error.message}`, 'AccountEconomyService');
        }
    }
    /**
     * Helper methods
     */
    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    }
    getDaysDifference(date1, date2) {
        const diffTime = Math.abs(date1 - date2);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    setCachedData(key, data, ttl = 300000) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
        });
    }
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
            return cached.data;
        }
        return null;
    }
    /**
     * Get service statistics
     */
    getStats() {
        return {
            cacheStats: this.cacheStats,
            activePlayers: this.accountEconomyData.size,
            features: this.economyFeatures,
            version: '1.0.0'
        };
    }
}
/** The one economy instance. Every route and the purchase path must share it, or balances diverge. */
export const accountEconomy = new AccountEconomyService();
export default AccountEconomyService;
export { AccountEconomyService };
//# sourceMappingURL=AccountEconomyService.js.map