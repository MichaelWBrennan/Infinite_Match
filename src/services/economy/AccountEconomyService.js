/**
 * Account-Linked Economy Service
 * Industry-standard match-3 economy system with account synchronization
 * Integrates Unity Economy with user accounts and cross-platform sync
 */

import { Logger } from '../../core/logger/index.js';
import { AppConfig } from '../../core/config/index.js';
import { ServiceError } from '../../core/errors/ErrorHandler.js';
import { aiCacheManager } from '../ai-cache-manager.js';
import security from '../../core/security/index.js';

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
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      };

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
        amount: 30,
        maxAmount: 30,
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
        lightning: { id: 'lightning', name: 'Lightning', count: 1, maxCount: 99, type: 'powerup', rarity: 'rare' }
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
        return this.accountEconomyData.get(playerId);
      }

      // Check AI cache
      const cached = await this.cacheManager.get(cacheKey, 'content');
      if (cached) {
        this.cacheStats.hits++;
        this.accountEconomyData.set(playerId, cached);
        return cached;
      }

      this.cacheStats.misses++;
      
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
    } catch (error) {
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
      } else if (reward.type === 'inventory') {
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
    } catch (error) {
      logger.error('Failed to claim daily reward', { error: error.message, playerId });
      throw new ServiceError(`Failed to claim daily reward: ${error.message}`, 'AccountEconomyService');
    }
  }

  /**
   * Update player economy cache
   */
  async updatePlayerEconomyCache(playerId, playerEconomy) {
    const cacheKey = `player_economy:${playerId}`;
    
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
      
      // Sync currencies
      if (unityData.currencies) {
        for (const [currencyId, amount] of Object.entries(unityData.currencies)) {
          if (playerEconomy.currencies[currencyId]) {
            playerEconomy.currencies[currencyId].amount = amount;
          }
        }
      }
      
      // Sync inventory
      if (unityData.inventory) {
        for (const [category, items] of Object.entries(unityData.inventory)) {
          if (playerEconomy.inventory[category]) {
            for (const [itemId, count] of Object.entries(items)) {
              if (playerEconomy.inventory[category][itemId]) {
                playerEconomy.inventory[category][itemId].count = count;
              }
            }
          }
        }
      }
      
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

export default AccountEconomyService;
export { AccountEconomyService };