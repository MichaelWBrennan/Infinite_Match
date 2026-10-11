import { starsForTarget } from '../meta/rewards.js';
import { objectiveCompletionError, objectiveStars } from '../levels/objective-rules.js';
import { replayLevelAttempt } from '../levels/attempt-replay.js';
import { REPLAY_POWERUPS } from '../levels/inventory-replay.js';
/**
 * Account-Linked Economy Service
 * Industry-standard match-3 economy system with account synchronization
 * Integrates Unity Economy with user accounts and cross-platform sync
 */

import { Logger } from '../../core/logger/index.js';
import { ServiceError } from '../../core/errors/ErrorHandler.js';
import { aiCacheManager } from '../ai-cache-manager.js';
import crypto from 'crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import { pickWheelReward, ITEM_CATALOG, LEVEL_LIMITS } from './item-catalog.js';
import { PlayerEconomyDb, isDurableEconomy } from './PlayerEconomyDb.js';
import { ensureKingdom, initialKingdom, planRenovation, roomById, MILESTONE_REWARDS, kingdomCoinMultiplier } from '../meta/kingdom.js';
import { LOOTBOXES, pickLootReward, ENERGY_PRICE_COINS } from '../meta/lootbox.js';
import { ATTEMPT_ENERGY_COST, ATTEMPT_MAX_AGE_MS, regenerateEnergy, nextRegenInMs } from '../meta/energy.js';
import { endlessRewards, winRewards } from '../meta/rewards.js';
import { addSeasonXp } from '../meta/battlepass.js';
import { applyVip } from '../meta/vip.js';
import { loadLiveOps } from '../live-ops/live-ops.js';
import { MAX_PRIZE_COINS } from '../live-ops/competitions.js';
import { recordWeeklyWin } from '../live-ops/weekly-event.js';
import { observationMeta, observeAttempt } from '../levels/attempt-observations.js';

/** A rule the player cannot meet (not enough coins, room maxed). `code` is safe to show. */
export class EconomyRuleError extends Error {
  constructor(code, message = code) {
    super(message);
    this.code = code;
  }
}

const logger = new Logger('AccountEconomyService');
const XP_GROWTH_RATE = 1.2;
const MAX_PAYMENT_RECEIPTS = 4096; // Never evict a payment receipt and permit a second grant/debit.
const MAX_COMPETITION_RECEIPTS = 4096; // Never evict a paid prize and permit a second payout.
const paymentKey = (transactionId) => {
  if (typeof transactionId !== 'string' || !transactionId) throw new EconomyRuleError('invalid_transaction_id');
  return crypto.createHash('sha256').update(transactionId).digest('hex');
};

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
    this._playerLockContext = new AsyncLocalStorage();
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
      let playerEconomy = {
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
      if (isDurableEconomy()) {
        const inserted = await PlayerEconomyDb.insertIfAbsent(playerId, playerEconomy);
        if (!inserted) {
          const winner = await PlayerEconomyDb.load(playerId);
          if (!winner) throw new Error('economy_initialization_conflict');
          // Never put the losing freshly minted profile into any cache.
          playerEconomy = winner;
        } else {
          playerEconomy.writeRevision = 0;
        }
      }

      // Cache the data
      await this.cacheManager.set(cacheKey, playerEconomy, 'content', 300);
      this.setCachedData(cacheKey, playerEconomy, 300000);

      // Store in memory for quick access
      this.accountEconomyData.set(playerId, playerEconomy);

      logger.info('Player economy initialized', { playerId, platform });
      return playerEconomy;
    } catch (error) {
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
    } catch (error) {
      logger.error('Failed to get player economy', { error: error.message, playerId });
      throw new ServiceError(`Failed to get player economy: ${error.message}`, 'AccountEconomyService');
    }
  }

  /**
   * Update player currency
   */
  async updateCurrency(playerId, currencyId, amount, operation = 'add', source = 'unknown') {
    return this.withPlayerLock(playerId, () => this._updateCurrencyUnlocked(playerId, currencyId, amount, operation, source));
  }

  async _updateCurrencyUnlocked(playerId, currencyId, amount, operation = 'add', source = 'unknown') {
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
      } else if (operation === 'spend') {
        if (currency.amount < amount) {
          throw new Error(`Insufficient ${currencyId}`);
        }
        currency.amount = Math.max(currency.amount - amount, 0);
        currency.spent += amount;
      } else if (operation === 'set') {
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
    } catch (error) {
      logger.error('Failed to update currency', { error: error.message, playerId, currencyId });
      throw new ServiceError(`Failed to update currency: ${error.message}`, 'AccountEconomyService');
    }
  }

  /**
   * Update player inventory
   */
  async updateInventory(playerId, category, itemId, quantity, operation = 'add') {
    return this.withPlayerLock(playerId, () => this._updateInventoryUnlocked(playerId, category, itemId, quantity, operation));
  }

  async _updateInventoryUnlocked(playerId, category, itemId, quantity, operation = 'add') {
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
      } else if (operation === 'remove') {
        if (item.count < quantity) {
          throw new Error(`Insufficient ${itemId}`);
        }
        item.count = Math.max(item.count - quantity, 0);
      } else if (operation === 'set') {
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
    } catch (error) {
      logger.error('Failed to update inventory', { error: error.message, playerId, category, itemId });
      throw new ServiceError(`Failed to update inventory: ${error.message}`, 'AccountEconomyService');
    }
  }

  /**
   * Update player progression
   */
  async updateProgression(playerId, xpGained, levelCompleted = false) {
    return this.withPlayerLock(playerId, () => this._updateProgressionUnlocked(playerId, xpGained, levelCompleted));
  }

  /** Apply XP and every level-up grant to a draft, without writing it. */
  applyXp(playerEconomy, xpGained, nowMs = Date.now()) {
    if (!Number.isSafeInteger(xpGained) || xpGained < 0) throw new EconomyRuleError('invalid_xp');
    const progression = playerEconomy.progression;
    progression.xp += xpGained;
    progression.totalXp += xpGained;
    let leveledUp = false;
    if (!Number.isFinite(progression.xpToNext) || progression.xpToNext < 1) {
      throw new EconomyRuleError('invalid_progression');
    }
    while (progression.xp >= progression.xpToNext) {
      progression.xp -= progression.xpToNext;
      progression.level++;
      progression.xpToNext = Math.floor(progression.xpToNext * XP_GROWTH_RATE);
      progression.lastLevelUp = new Date(nowMs).toISOString();
      leveledUp = true;
      for (const reward of this.getLevelUpRewards(progression.level)) this.applyReward(playerEconomy, reward);
    }
    return { success: true, level: progression.level, xp: progression.xp,
      xpToNext: progression.xpToNext, leveledUp,
      rewards: leveledUp ? this.getLevelUpRewards(progression.level) : [] };
  }

  async _updateProgressionUnlocked(playerId, xpGained, levelCompleted = false) {
    try {
      const playerEconomy = structuredClone(await this.getPlayerEconomy(playerId));
      const nowMs = Date.now();
      const result = this.applyXp(playerEconomy, xpGained, nowMs);
      if (levelCompleted) playerEconomy.progression.milestones.push({
        level: result.level, xp: playerEconomy.progression.totalXp, timestamp: new Date(nowMs).toISOString(),
      });
      playerEconomy.lastUpdated = new Date(nowMs).toISOString();
      await this.updatePlayerEconomyCache(playerId, playerEconomy);
      logger.info('Progression updated', { playerId, level: result.level, xp: result.xp, leveledUp: result.leveledUp });
      return result;
    } catch (error) {
      logger.error('Failed to update progression', { error: error.message, playerId });
      throw new ServiceError(`Failed to update progression: ${error.message}`, 'AccountEconomyService');
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
    // Reward flows such as progression and daily grants call other economy methods while
    // holding the lock. Only the same async call chain may re-enter; independent requests wait.
    if (this._playerLockContext.getStore() === playerId) return Promise.resolve().then(fn);
    if (!this._playerLocks) this._playerLocks = new Map();
    const previous = this._playerLocks.get(playerId) || Promise.resolve();
    const run = previous.catch(() => {}).then(() => this._playerLockContext.run(playerId, async () => {
      try {
        return await fn();
      } catch (error) {
        // The operation may have changed the cached economy before it failed. Drop it so the
        // unsaved change is not written by a later save.
        await this.discardUnsaved(playerId);
        throw error;
      }
    }));
    const tail = run.catch(() => {});
    this._playerLocks.set(playerId, tail);
    tail.then(() => {
      if (this._playerLocks.get(playerId) === tail) this._playerLocks.delete(playerId);
    });
    return run;
  }

  /**
   * Drops the in-memory and AI-cache copies of a player's economy, so the next read reloads the
   * last saved state. Durable mode only: without a store, memory is the only copy and is kept.
   */
  async discardUnsaved(playerId) {
    if (!isDurableEconomy()) return;
    this.accountEconomyData.delete(playerId);
    try {
      await this.cacheManager.delete(`player_economy:${playerId}`, 'content');
    } catch (error) {
      logger.error('Failed to evict cached economy', { error: error.message, playerId });
    }
  }

  /** Adds a reward to a loaded economy object. Does not save. */
  applyReward(playerEconomy, reward) {
    if (reward.type === 'currency') {
      const currency = playerEconomy.currencies[reward.currencyId];
      if (!currency) throw new EconomyRuleError('unknown_currency');
      currency.amount = Math.min(currency.amount + reward.amount, currency.maxAmount);
      currency.earned += reward.amount;
    } else {
      const item = playerEconomy.inventory[reward.category]?.[reward.itemId];
      if (!item) throw new EconomyRuleError('unknown_item');
      item.count = Math.min(item.count + reward.amount, item.maxCount);
    }
  }

  /**
   * Takes back a refunded grant, down to zero. The balance cannot go negative, so coins a player
   * already spent are not recovered. Returns what was taken and what could not be.
   */
  async reverseCurrency(playerId, currencyId, amount, source = 'reversal') {
    if (!Number.isInteger(amount) || amount < 0) throw new EconomyRuleError('invalid_amount');
    return this.withPlayerLock(playerId, async () => {
      const playerEconomy = await this.getPlayerEconomy(playerId);
      const currency = playerEconomy.currencies[currencyId];
      if (!currency) throw new EconomyRuleError('unknown_currency');
      const taken = Math.min(amount, currency.amount);
      currency.amount -= taken;
      playerEconomy.lastUpdated = new Date().toISOString();
      await this.updatePlayerEconomyCache(playerId, playerEconomy);
      logger.info('Currency reversed', { playerId, currencyId, taken, shortfall: amount - taken, source });
      return { taken, shortfall: amount - taken };
    });
  }

  /** A purchase ledger claim can be released after an ambiguous save. A permanent economy
   * receipt prevents the same verified provider transaction from crediting coins twice.
   */
  async creditPurchaseOnce(playerId, transactionId, grants) {
    const key = paymentKey(transactionId);
    if (grants?.currency !== 'coins' || !Number.isSafeInteger(grants.amount) || grants.amount <= 0) {
      throw new EconomyRuleError('invalid_purchase_grant');
    }
    return this.withPlayerLock(playerId, async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        const original = await this.getPlayerEconomy(playerId);
        const receipt = original.purchaseCredits?.[key];
        if (receipt) {
          if (receipt.currency !== grants.currency || receipt.amount !== grants.amount) {
            throw new EconomyRuleError('purchase_receipt_mismatch');
          }
          return { duplicate: true, balance: original.currencies.coins.amount };
        }
        if (Object.keys(original.purchaseCredits || {}).length >= MAX_PAYMENT_RECEIPTS) {
          throw new EconomyRuleError('purchase_receipt_limit');
        }
        const economy = structuredClone(original);
        const wallet = economy.currencies.coins;
        const credited = Math.max(0, Math.min(grants.amount, wallet.maxAmount - wallet.amount));
        wallet.amount += credited;
        wallet.earned += credited;
        economy.purchaseCredits = { ...(economy.purchaseCredits || {}),
          [key]: { currency: grants.currency, amount: grants.amount, credited } };
        economy.lastUpdated = new Date().toISOString();
        try {
          await this.updatePlayerEconomyCache(playerId, economy);
          return { duplicate: false, balance: economy.currencies.coins.amount };
        } catch (error) {
          if (error.code !== 'economy_conflict' || attempt === 2) throw error;
          // Another writer won. Reload and re-evaluate the receipt, never reapply blindly.
        }
      }
      throw new EconomyRuleError('economy_conflict');
    });
  }

  /** Bypass per-process caches when reconciling a held provider claim. No state is changed. */
  async getPurchaseCreditReceipt(playerId, transactionId) {
    const key = paymentKey(transactionId);
    const economy = isDurableEconomy() ? await PlayerEconomyDb.load(playerId) : await this.getPlayerEconomy(playerId);
    return economy?.purchaseCredits?.[key] || null;
  }

  /** A refund debits only once even if the ledger update or Mongo acknowledgement is lost. */
  async reversePurchaseOnce(playerId, transactionId, grants) {
    const key = paymentKey(transactionId);
    if (grants?.currency !== 'coins' || !Number.isSafeInteger(grants.amount) || grants.amount <= 0) {
      throw new EconomyRuleError('invalid_purchase_grant');
    }
    return this.withPlayerLock(playerId, async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        const original = await this.getPlayerEconomy(playerId);
        const prior = original.purchaseDebits?.[key];
        if (prior) {
          if (prior.currency !== grants.currency || prior.amount !== grants.amount) {
            throw new EconomyRuleError('purchase_receipt_mismatch');
          }
          return { taken: prior.taken, shortfall: prior.shortfall, duplicate: true };
        }
        if (Object.keys(original.purchaseDebits || {}).length >= MAX_PAYMENT_RECEIPTS) {
          throw new EconomyRuleError('purchase_receipt_limit');
        }
        const economy = structuredClone(original);
        const credit = original.purchaseCredits?.[key];
        if (credit && (credit.currency !== grants.currency || credit.amount !== grants.amount)) {
          throw new EconomyRuleError('purchase_receipt_mismatch');
        }
        // Only reclaim coins actually awarded; the wallet may have been at its cap.
        // Pre-receipt historical grants conservatively retain the legacy catalog amount.
        const reclaimable = credit?.credited ?? grants.amount;
        if (!Number.isSafeInteger(reclaimable) || reclaimable < 0 || reclaimable > grants.amount) {
          throw new EconomyRuleError('purchase_receipt_mismatch');
        }
        const wallet = economy.currencies[grants.currency];
        if (!wallet) throw new EconomyRuleError('unknown_currency');
        const taken = Math.min(reclaimable, wallet.amount);
        const shortfall = reclaimable - taken;
        wallet.amount -= taken;
        economy.purchaseDebits = { ...(economy.purchaseDebits || {}),
          [key]: { currency: grants.currency, amount: grants.amount, taken, shortfall } };
        economy.lastUpdated = new Date().toISOString();
        try {
          await this.updatePlayerEconomyCache(playerId, economy);
          return { taken, shortfall, duplicate: false };
        } catch (error) {
          if (error.code !== 'economy_conflict' || attempt === 2) throw error;
        }
      }
      throw new EconomyRuleError('economy_conflict');
    });
  }

  async getPurchaseDebitReceipt(playerId, transactionId) {
    const key = paymentKey(transactionId);
    const economy = isDurableEconomy() ? await PlayerEconomyDb.load(playerId) : await this.getPlayerEconomy(playerId);
    return economy?.purchaseDebits?.[key] || null;
  }

  /** Community/tournament prizes span a social file and the economy. The social
   * reservation is not a transaction: this permanent receipt makes any later retry
   * idempotent, including when a save committed but its acknowledgement was lost.
   */
  async grantCompetitionRewardOnce(playerId, key, amount, season = null) {
    if (typeof key !== 'string' || !/^(challenge|tournament):[a-zA-Z0-9_-]{1,64}$/.test(key)
      || !Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_PRIZE_COINS) {
      throw new EconomyRuleError('invalid_competition_reward');
    }
    const receiptKey = paymentKey(`competition:${key}`);
    return this.withPlayerLock(playerId, async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        const original = await this.getPlayerEconomy(playerId);
        const prior = original.competitionPayouts?.[receiptKey];
        if (prior) {
          if (prior.key !== key || prior.amount !== amount ||
              !Number.isSafeInteger(prior.credited) || prior.credited < 0 || prior.credited > amount) {
            throw new EconomyRuleError('competition_receipt_mismatch');
          }
          return { duplicate: true, balance: original.currencies.coins.amount };
        }
        if (Object.keys(original.competitionPayouts || {}).length >= MAX_COMPETITION_RECEIPTS) {
          throw new EconomyRuleError('competition_receipt_limit');
        }
        const economy = structuredClone(original);
        const wallet = economy.currencies.coins;
        const credited = Math.max(0, Math.min(amount, wallet.maxAmount - wallet.amount));
        wallet.amount += credited;
        wallet.earned += credited;
        // The challenge XP and coin award commit together, instead of a separate grant.
        const seasonXp = key.startsWith('challenge:') && season
          ? addSeasonXp(economy, season, 'challenge_complete') : null;
        economy.competitionPayouts = { ...(economy.competitionPayouts || {}),
          [receiptKey]: { key, amount, credited, seasonXp } };
        economy.lastUpdated = new Date().toISOString();
        try {
          await this.updatePlayerEconomyCache(playerId, economy);
          return { duplicate: false, balance: economy.currencies.coins.amount, credited, seasonXp };
        } catch (error) {
          if (error.code !== 'economy_conflict' || attempt === 2) throw error;
        }
      }
      throw new EconomyRuleError('economy_conflict');
    });
  }

  /** Bypass caches for cross-store reconciliation. No absent receipt proves nonpayment. */
  async getCompetitionPayoutReceipt(playerId, key, amount) {
    if (typeof key !== 'string' || !/^(challenge|tournament):[a-zA-Z0-9_-]{1,64}$/.test(key)) {
      throw new EconomyRuleError('invalid_competition_reward');
    }
    const receiptKey = paymentKey(`competition:${key}`);
    const economy = isDurableEconomy() ? await PlayerEconomyDb.load(playerId) : await this.getPlayerEconomy(playerId);
    const receipt = economy?.competitionPayouts?.[receiptKey] || null;
    if (receipt && (receipt.key !== key || receipt.amount !== amount ||
        !Number.isSafeInteger(receipt.credited) || receipt.credited < 0 || receipt.credited > amount)) {
      throw new EconomyRuleError('competition_receipt_mismatch');
    }
    return receipt;
  }

  /** Takes coins from a loaded economy object. Does not save. */
  spendCoins(playerEconomy, amount) {
    const coins = playerEconomy.currencies.coins;
    if (coins.amount < amount) throw new EconomyRuleError('insufficient_coins');
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
      if (!room) throw new EconomyRuleError('unknown_room');

      const plan = planRenovation({
        kingdom,
        room,
        coins: playerEconomy.currencies.coins.amount,
        lifetimeStars: playerEconomy.currencies.stars.earned,
      });
      if (!plan.ok) throw new EconomyRuleError(plan.reason);

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
    if (!box) throw new EconomyRuleError('unknown_lootbox');
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
  async spendAttemptEnergy(playerId, level, nowMs = Date.now(), definition = null, legacyTarget = null) {
    if (!Number.isSafeInteger(level) || level < 1 || level > LEVEL_LIMITS.maxLevel) {
      throw new EconomyRuleError('invalid_level');
    }
    return this.withPlayerLock(playerId, async () => {
      const playerEconomy = await this.getPlayerEconomy(playerId);
      const energy = regenerateEnergy(playerEconomy.currencies.energy, nowMs);
      if (energy.amount < ATTEMPT_ENERGY_COST) throw new EconomyRuleError('energy_empty');
      energy.amount -= ATTEMPT_ENERGY_COST;
      energy.spent += ATTEMPT_ENERGY_COST;
      const previous = playerEconomy.pendingAttempt;
      const observation = observationMeta(definition, playerEconomy.observedStarts || 0);
      if (observation) playerEconomy.observedStarts = (playerEconomy.observedStarts || 0) + 1;
      const attemptId = crypto.randomUUID();
      playerEconomy.pendingAttempt = {
        id: attemptId, level, issuedAt: nowMs,
        ...(definition ? { generatedLevel: structuredClone(definition) } : {}),
        ...(!definition && Number.isSafeInteger(legacyTarget) ? { legacyTarget } : {}),
        ...(observation ? { observation } : {}),
      };
      playerEconomy.lastUpdated = new Date(nowMs).toISOString();
      await this.updatePlayerEconomyCache(playerId, playerEconomy);
      if (previous?.observation) await observeAttempt(previous.observation,
        nowMs - previous.issuedAt > ATTEMPT_MAX_AGE_MS ? 'expired' : 'replaced', {}, nowMs);
      if (observation) await observeAttempt(observation, 'started', {}, nowMs);
      return {
        attemptId,
        level,
        energy: energy.amount,
        maxEnergy: energy.maxAmount,
        nextRegenInMs: nextRegenInMs(energy, nowMs),
        ...(definition ? { generatedLevel: structuredClone(definition) } : {}),
        ...(!definition && Number.isSafeInteger(legacyTarget) ? { legacyTarget } : {}),
      };
    });
  }

  /** Atomically spend one inventory item and, when requested, bind an effect receipt to
   * the pending paid attempt. A legacy spend during a run is marked unranked, not silently
   * treated as a no-booster attempt. The lock also serialises spends with completion.
   */
  async spendPowerUp(playerId, powerupId, quantity = 1, attemptId = undefined, nowMs = Date.now(), useId = undefined) {
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 20) throw new EconomyRuleError('invalid_powerup_quantity');
    if (useId !== undefined && (attemptId === undefined || typeof useId !== 'string'
      || !/^[a-zA-Z0-9_-]{8,64}$/.test(useId))) throw new EconomyRuleError('invalid_powerup_use_id');
    return this.withPlayerLock(playerId, async () => {
      const economy = await this.getPlayerEconomy(playerId);
      const pending = economy.pendingAttempt;
      if (attemptId !== undefined && (!pending || typeof attemptId !== 'string' || pending.id !== attemptId)) {
        throw new EconomyRuleError('attempt_not_found');
      }
      if (attemptId !== undefined && nowMs - pending.issuedAt > ATTEMPT_MAX_AGE_MS) {
        throw new EconomyRuleError('attempt_expired');
      }
      if (attemptId !== undefined && (quantity !== 1 || !REPLAY_POWERUPS.includes(powerupId)
        || pending.generatedLevel?.generatorVersion < 4
        || !['classic', 'daily'].includes(pending.generatedLevel?.mode))) {
        throw new EconomyRuleError('replay_unsupported');
      }
      // A retry after a lost response returns the original receipt, even if that
      // charge exhausted the item. Never mint a second receipt or decrement twice.
      const prior = useId === undefined ? null : pending.powerupReceipts?.find((receipt) => receipt.useId === useId);
      if (prior) {
        if (prior.type !== powerupId) throw new EconomyRuleError('powerup_use_mismatch');
        return { success: true, category: 'powerups', itemId: powerupId, oldCount: prior.oldCount,
          newCount: prior.newCount, operation: 'remove', receiptId: prior.id, reused: true };
      }
      const powerups = economy.inventory?.powerups;
      if (typeof powerupId !== 'string' || !powerups || !Object.hasOwn(powerups, powerupId)) {
        throw new EconomyRuleError('unknown_powerup');
      }
      const item = powerups[powerupId];
      if (!Number.isSafeInteger(item.count) || item.count < quantity) throw new EconomyRuleError('powerup_empty');
      const oldCount = item.count;
      // Check every rule before changing balances or the pending attempt.
      if (attemptId !== undefined && (pending.powerupReceipts?.length || 0) >= 20) {
        throw new EconomyRuleError('powerup_receipt_limit');
      }
      item.count -= quantity;
      let receiptId;
      if (attemptId !== undefined) {
        receiptId = crypto.randomUUID();
        (pending.powerupReceipts ??= []).push({ id: receiptId, type: powerupId,
          ...(useId === undefined ? {} : { useId, oldCount, newCount: item.count }) });
      } else if (pending) {
        pending.untrackedPowerup = true;
      }
      economy.lastUpdated = new Date(nowMs).toISOString();
      await this.updatePlayerEconomyCache(playerId, economy);
      return { success: true, category: 'powerups', itemId: powerupId, oldCount,
        newCount: item.count, operation: 'remove', ...(receiptId ? { receiptId } : {}) };
    });
  }

  /** Settle an Endless attempt, its capped payout and a bounded retry receipt in one write.
   * The receipt is checked BEFORE pendingAttempt, so a later paid run is not affected by a retry.
   * Local locks serialize requests in this process; Mongo's pending-id predicate prevents two
   * workers from claiming the same pending attempt. All economy writes now guard a shared
   * revision; conflicts are re-evaluated here but unrelated multi-save workflows are still
   * not atomic across replicas.
   */
  async settleEndlessAttempt(playerId, attemptId, score, nowMs = Date.now()) {
    return this.withPlayerLock(playerId, async () => {
      for (let tryNumber = 0; tryNumber < 3; tryNumber++) {
        const original = await this.getPlayerEconomy(playerId);
        const existing = original.endlessReceipts?.find((receipt) => receipt.attemptId === attemptId);
        if (existing) {
          if (existing.score !== score) throw new EconomyRuleError('attempt_score_mismatch');
          return { ...existing.result, duplicate: true };
        }
        const pending = original.pendingAttempt;
        if (!pending || pending.id !== attemptId) throw new EconomyRuleError('attempt_not_found');
        if (pending.level !== 1) throw new EconomyRuleError('attempt_level_mismatch');
        if (nowMs - pending.issuedAt > ATTEMPT_MAX_AGE_MS) throw new EconomyRuleError('attempt_expired');
        if (pending.generatedLevel && pending.generatedLevel.mode !== 'endless') {
          throw new EconomyRuleError('attempt_mode_mismatch');
        }

        // Do not mutate the cached economy: a failed save must leave the attempt claimable.
        const economy = structuredClone(original);
        const reward = endlessRewards(score);
        if (reward.xp > 0) this.applyXp(economy, reward.xp, nowMs);
        if (reward.coins > 0) this.applyReward(economy, {
          type: 'currency', currencyId: 'coins', amount: reward.coins,
        });
        economy.statistics.endlessRuns = (economy.statistics.endlessRuns || 0) + 1;
        economy.statistics.endlessBest = Math.max(economy.statistics.endlessBest || 0, score);
        economy.pendingAttempt = null;
        economy.lastUpdated = new Date(nowMs).toISOString();
        const result = { reward, endlessBest: economy.statistics.endlessBest,
          balances: { coins: economy.currencies.coins.amount } };
        // Retain the last 32 claims, including zero-score banks. Eviction means a very late
        // duplicate is rejected, never paid again. The pending attempt has already been consumed.
        economy.endlessReceipts = [...(economy.endlessReceipts || []).slice(-31),
          { attemptId, score, result, settledAt: economy.lastUpdated }];
        const saved = await this.updatePlayerEconomyCache(playerId, economy, attemptId);
        if (!saved) {
          // A competing worker won the conditional write. Reload the durable receipt.
          await this.discardUnsaved(playerId);
          const fresh = await this.getPlayerEconomy(playerId);
          const receipt = fresh.endlessReceipts?.find((item) => item.attemptId === attemptId);
          if (receipt) {
            if (receipt.score !== score) throw new EconomyRuleError('attempt_score_mismatch');
            return { ...receipt.result, duplicate: true };
          }
          if (fresh.pendingAttempt?.id === attemptId) {
            if (tryNumber < 2) continue; // unrelated write won: re-evaluate reward on fresh balances
            throw new EconomyRuleError('economy_conflict');
          }
          throw new EconomyRuleError('attempt_not_found');
        }
        return result;
      }
      throw new EconomyRuleError('economy_conflict');
    });
  }

  /** Validate the paid definition and optional deterministic replay without saving anything. */
  validateAttemptCompletion(economy, attemptId, level, nowMs, completion) {
    const pending = economy.pendingAttempt;
    if (!pending || typeof attemptId !== 'string' || pending.id !== attemptId) {
      throw new EconomyRuleError('attempt_not_found');
    }
    if (pending.level !== level) throw new EconomyRuleError('attempt_level_mismatch');
    if (nowMs - pending.issuedAt > ATTEMPT_MAX_AGE_MS) throw new EconomyRuleError('attempt_expired');
    const definition = pending.generatedLevel;
    if (definition && completion && ((completion.mode === 'endless') !== (definition.mode === 'endless'))) {
      throw new EconomyRuleError('attempt_mode_mismatch');
    }
    let stars;
    let replay = null;
    if (completion && completion.mode === 'level') {
      // Pinned-goal validation and consumption happen together under the player lock.
      // Date/weather/tuning changes and client-authored goals cannot alter the attempt.
      if (definition?.generatorVersion >= 4) {
        const reason = objectiveCompletionError(definition, completion.score, completion.objectiveProgress);
        if (reason) throw new EconomyRuleError(reason);
        stars = objectiveStars(definition, completion.score, completion.objectiveProgress);
        if (completion.moves !== undefined) {
          replay = replayLevelAttempt(definition, completion.moves, completion.score, completion.objectiveProgress,
            pending.powerupReceipts || []);
          if (replay.error) throw new EconomyRuleError(replay.error);
        }
      } else {
        stars = starsForTarget(completion.score, definition?.targetScore ?? pending.legacyTarget ?? completion.legacyTarget);
        if (!stars) throw new EconomyRuleError('score_below_target');
      }
    }
    return { pending, definition, stars, replay };
  }

  /** Pays a classic/daily win in one guarded document write, including its replay receipt.
   * Side effects outside the economy (boards and observation logs) remain best-effort.
   */
  async settleLevelAttempt(playerId, attemptId, level, completion, policies = {}, nowMs = Date.now()) {
    // No raw moves/counters are retained in the receipt: only a digest of the submitted claim.
    // A different score or transcript cannot turn a previously unverified result into ranked play.
    const fingerprint = crypto.createHash('sha256').update(JSON.stringify({ level, score: completion.score,
      objectiveProgress: completion.objectiveProgress ?? null, moves: completion.moves ?? null,
      hintsUsed: completion.hintsUsed ?? null })).digest('hex');
    return this.withPlayerLock(playerId, async () => {
      for (let tryNumber = 0; tryNumber < 3; tryNumber++) {
        const original = await this.getPlayerEconomy(playerId);
        const existing = original.levelReceipts?.find((item) => item.attemptId === attemptId);
        if (existing) {
          if (existing.fingerprint !== fingerprint) throw new EconomyRuleError('attempt_result_mismatch');
          return { result: { ...existing.result, duplicate: true }, rankedScore: existing.rankedScore ?? null,
            competitionIds: existing.competitionIds ?? { tournamentIds: [], challengeIds: [] } };
        }
        const economy = structuredClone(original);
        const { pending, definition, stars, replay } = this.validateAttemptCompletion(
          economy, attemptId, level, nowMs, completion);
        const { isVip = false, season = null, competitionIds = { tournamentIds: [], challengeIds: [] } } =
          typeof policies === 'function' ? await policies() : policies;
        const weekly = replay?.verified === true ? recordWeeklyWin(economy, loadLiveOps(), nowMs) : null;
        const base = winRewards(stars);
        const roomBoosted = { ...base, coins: Math.floor(base.coins * kingdomCoinMultiplier(economy.kingdom)) };
        const reward = applyVip(roomBoosted, isVip);
        const progression = this.applyXp(economy, reward.xp, nowMs);
        economy.progression.milestones.push({ level: progression.level, xp: economy.progression.totalXp,
          timestamp: new Date(nowMs).toISOString() });
        this.applyReward(economy, { type: 'currency', currencyId: 'coins', amount: reward.coins });
        this.applyReward(economy, { type: 'currency', currencyId: 'stars', amount: reward.stars });
        const stats = economy.statistics;
        stats.gamesPlayed++;
        stats.levelsCompleted++;
        stats.totalScore += completion.score;
        stats.averageScore = Math.floor(stats.totalScore / stats.gamesPlayed);
        stats.bestScore = Math.max(stats.bestScore, completion.score);
        stats.lastPlayed = new Date(nowMs).toISOString();
        if (season) addSeasonXp(economy, season, 'level_complete', nowMs);
        economy.pendingAttempt = null;
        economy.lastUpdated = new Date(nowMs).toISOString();
        const ranked = replay?.verified === true && !pending.untrackedPowerup && !(pending.powerupReceipts?.length);
        const result = { progression,
          rewards: [{ type: 'currency', currencyId: 'coins', amount: reward.coins },
            { type: 'currency', currencyId: 'stars', amount: reward.stars }],
          stars, verified: replay?.verified === true, ranked, vip: isVip,
          balances: { coins: economy.currencies.coins.amount, stars: economy.currencies.stars.amount },
          statistics: { gamesPlayed: stats.gamesPlayed, levelsCompleted: stats.levelsCompleted,
            totalScore: stats.totalScore, averageScore: stats.averageScore, bestScore: stats.bestScore } };
        economy.levelReceipts = [...(economy.levelReceipts || []).slice(-31),
          { attemptId, fingerprint, result, rankedScore: ranked ? replay.score : null,
            competitionIds: ranked ? competitionIds : { tournamentIds: [], challengeIds: [] },
            settledAt: economy.lastUpdated }];
        const saved = await this.updatePlayerEconomyCache(playerId, economy, attemptId);
        if (!saved) {
          await this.discardUnsaved(playerId);
          const fresh = await this.getPlayerEconomy(playerId);
          const receipt = fresh.levelReceipts?.find((item) => item.attemptId === attemptId);
          if (receipt) {
            if (receipt.fingerprint !== fingerprint) throw new EconomyRuleError('attempt_result_mismatch');
            return { result: { ...receipt.result, duplicate: true }, rankedScore: receipt.rankedScore ?? null,
              competitionIds: receipt.competitionIds ?? { tournamentIds: [], challengeIds: [] } };
          }
          if (fresh.pendingAttempt?.id === attemptId) {
            if (tryNumber < 2) continue;
            throw new EconomyRuleError('economy_conflict');
          }
          throw new EconomyRuleError('attempt_not_found');
        }
        // Saving the payout is authoritative. A diagnostic write must never turn it into
        // a 500 response; clients can always recover from a lost response via the receipt.
        if (pending.observation) {
          try {
            await observeAttempt(pending.observation, replay?.verified ? 'verified_win' : 'unverified_win', {
              inventoryUses: pending.powerupReceipts?.length || 0, hintsUsed: completion.hintsUsed,
              movesUsed: replay?.verified ? completion.moves?.length : null, moveBudget: definition?.moves,
            }, nowMs);
          } catch (error) {
            logger.warn('Could not record level observation', { playerId, error: error.message });
          }
        }
        if (weekly) logger.info('Weekly event win recorded', { playerId, ...weekly });
        return { result, rankedScore: ranked ? replay.score : null, competitionIds };
      }
      throw new EconomyRuleError('economy_conflict');
    });
  }

  /**
   * Legacy low-level consume helper retained for existing internal callers/tests. New HTTP
   * classic/daily payouts use settleLevelAttempt instead, so attempt and rewards save together.
   */
  async consumeAttempt(playerId, attemptId, level, nowMs = Date.now(), completion = null) {
    return this.withPlayerLock(playerId, async () => {
      const playerEconomy = await this.getPlayerEconomy(playerId);
      const { pending, definition, stars, replay } = this.validateAttemptCompletion(
        playerEconomy, attemptId, level, nowMs, completion);
      // Count only a verified replay, in the same locked save that consumes its attempt.
      // A retried completion cannot enter here twice; unverified legacy/timed/endless
      // payouts never advance the free weekly event.
      const weekly = completion?.mode === 'level' && replay?.verified === true
        ? recordWeeklyWin(playerEconomy, loadLiveOps(), nowMs) : null;
      playerEconomy.pendingAttempt = null;
      playerEconomy.lastUpdated = new Date(nowMs).toISOString();
      await this.updatePlayerEconomyCache(playerId, playerEconomy);
      if (pending.observation && completion?.mode === 'level') await observeAttempt(pending.observation,
        replay?.verified ? 'verified_win' : 'unverified_win', {
          inventoryUses: pending.powerupReceipts?.length || 0, hintsUsed: completion.hintsUsed,
          movesUsed: replay?.verified ? completion.moves?.length : null, moveBudget: definition?.moves,
        }, nowMs);
      if (weekly) logger.info('Weekly event win recorded', { playerId, ...weekly });
      return { level, ...(weekly ? { weekly } : {}), ...(stars === undefined ? {} : { stars }),
        ...(completion?.mode === 'level' ? { verified: replay?.verified === true,
          ranked: replay?.verified === true && !pending.untrackedPowerup && !(pending.powerupReceipts?.length) } : {}),
        ...(replay?.verified ? { score: replay.score } : {}) };
    });
  }

  /** A reported loss/quit ends only the matching paid attempt. No rewards are granted.
   * These reports are diagnostics, not server proof that the board was played or lost. */
  async closeAttempt(playerId, attemptId, outcome, signals = {}, nowMs = Date.now()) {
    if (!['lost', 'quit'].includes(outcome)) throw new EconomyRuleError('invalid_attempt_outcome');
    return this.withPlayerLock(playerId, async () => {
      const economy = await this.getPlayerEconomy(playerId);
      const pending = economy.pendingAttempt;
      if (!pending || typeof attemptId !== 'string' || pending.id !== attemptId) {
        throw new EconomyRuleError('attempt_not_found');
      }
      economy.pendingAttempt = null;
      economy.lastUpdated = new Date(nowMs).toISOString();
      await this.updatePlayerEconomyCache(playerId, economy);
      await observeAttempt(pending.observation, nowMs - pending.issuedAt > ATTEMPT_MAX_AGE_MS
        ? 'expired' : outcome === 'lost' ? 'reported_loss' : 'reported_quit', {
        hintsUsed: signals.hintsUsed, movesUsed: signals.movesUsed, moveBudget: pending.generatedLevel?.moves,
        inventoryUses: pending.powerupReceipts?.length || 0,
      }, nowMs);
      return { closed: true };
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
    delete view.endlessReceipts;
    delete view.levelReceipts;
    delete view.purchaseCredits;
    delete view.purchaseDebits;
    delete view.competitionPayouts;
    delete view.writeRevision;
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
      if (missing <= 0) throw new EconomyRuleError('energy_full');
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
      const economy = structuredClone(await this.getPlayerEconomy(playerId));
      const now = new Date();
      const lastSpin = economy.wheel?.lastSpin ? new Date(economy.wheel.lastSpin) : null;
      if (lastSpin && this.isSameDay(now, lastSpin)) throw new Error('Lucky wheel already spun today');
      const reward = pickWheelReward(randomInt);
      this.applyReward(economy, reward);
      economy.wheel = { ...(economy.wheel || {}), lastSpin: now.toISOString() };
      economy.lastUpdated = now.toISOString();
      await this.updatePlayerEconomyCache(playerId, economy);
      return { reward, spunAt: now.toISOString() };
    });
  }

  async claimDailyReward(playerId, season = null) {
    return this.withPlayerLock(playerId, () => this._claimDailyRewardUnlocked(playerId, season));
  }

  async _claimDailyRewardUnlocked(playerId, season) {
    try {
      const economy = structuredClone(await this.getPlayerEconomy(playerId));
      const dailyRewards = economy.dailyRewards;
      const now = new Date();
      const lastClaimed = dailyRewards.lastClaimed ? new Date(dailyRewards.lastClaimed) : null;
      if (lastClaimed && this.isSameDay(now, lastClaimed)) throw new Error('Daily reward already claimed today');
      if (lastClaimed && this.getDaysDifference(now, lastClaimed) > 1) dailyRewards.streak = 0;
      dailyRewards.streak++;
      dailyRewards.lastClaimed = now.toISOString();
      const rewardIndex = Math.min(dailyRewards.streak - 1, dailyRewards.rewards.length - 1);
      const reward = dailyRewards.rewards[rewardIndex];
      if (reward.coins) this.applyReward(economy, { type: 'currency', currencyId: 'coins', amount: reward.coins });
      if (reward.stars) this.applyReward(economy, { type: 'currency', currencyId: 'stars', amount: reward.stars });
      if (reward.xp) this.applyXp(economy, reward.xp, now.getTime());
      if (season) addSeasonXp(economy, season, 'daily_login', now.getTime());
      dailyRewards.nextReward = Math.min(dailyRewards.streak + 1, dailyRewards.rewards.length);
      dailyRewards.canClaim = false;
      economy.lastUpdated = now.toISOString();
      await this.updatePlayerEconomyCache(playerId, economy);
      logger.info('Daily reward claimed', { playerId, streak: dailyRewards.streak, reward });
      return { success: true, streak: dailyRewards.streak, reward, nextReward: dailyRewards.nextReward };
    } catch (error) {
      logger.error('Failed to claim daily reward', { error: error.message, playerId });
      throw new ServiceError(`Failed to claim daily reward: ${error.message}`, 'AccountEconomyService');
    }
  }

  /** One coin debit and inventory grant; a save failure leaves both unchanged. */
  async purchaseCatalogItem(playerId, itemId) {
    const item = Object.hasOwn(ITEM_CATALOG, itemId) ? ITEM_CATALOG[itemId] : null;
    if (!item) throw new EconomyRuleError('unknown_item');
    return this.withPlayerLock(playerId, async () => {
      const economy = structuredClone(await this.getPlayerEconomy(playerId));
      const currency = economy.currencies[item.currencyId];
      const owned = economy.inventory[item.category]?.[itemId];
      if (!currency || !owned) throw new EconomyRuleError('unknown_item');
      if (currency.amount < item.price) throw new EconomyRuleError('insufficient_coins');
      if (owned.count >= owned.maxCount) throw new EconomyRuleError('item_full');
      const oldAmount = currency.amount;
      const oldCount = owned.count;
      currency.amount -= item.price;
      currency.spent += item.price;
      owned.count++;
      economy.lastUpdated = new Date().toISOString();
      await this.updatePlayerEconomyCache(playerId, economy);
      return {
        currency: { success: true, currencyId: item.currencyId, oldAmount,
          newAmount: currency.amount, operation: 'spend', source: 'purchase' },
        inventory: { success: true, category: item.category, itemId, oldCount,
          newCount: owned.count, operation: 'add' },
      };
    });
  }

  /**
   * Update player economy cache
   */
  async updatePlayerEconomyCache(playerId, playerEconomy, expectedAttemptId = null) {
    const cacheKey = `player_economy:${playerId}`;

    if (isDurableEconomy()) {
      try {
        if (expectedAttemptId !== null) {
          const saved = await PlayerEconomyDb.saveIfPending(playerId, expectedAttemptId, playerEconomy);
          if (!saved) return false;
        } else {
          const saved = await PlayerEconomyDb.save(playerId, playerEconomy);
          if (!saved) throw new EconomyRuleError('economy_conflict');
        }
        playerEconomy.writeRevision = (playerEconomy.writeRevision ?? 0) + 1;
      } catch (error) {
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
    return true;
  }

  /**
   * Sync economy with Unity
   */
  async syncWithUnity(playerId, unityData) {
    return this.withPlayerLock(playerId, () => this._syncWithUnityUnlocked(playerId, unityData));
  }

  async _syncWithUnityUnlocked(playerId, unityData) {
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
    } catch (error) {
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
    } catch (error) {
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