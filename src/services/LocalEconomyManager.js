/**
 * Local Economy Manager - Handles currency and economy
 */

import { Logger } from '../core/logger/index.js';

class LocalEconomyManager {
  constructor() {
    this.logger = new Logger('LocalEconomyManager');
    this.currencies = {
      coins: 1000,
      gems: 50,
      energy: 30,
      stars: 0,
      hearts: 5
    };
    
    this.maxCurrencies = {
      coins: 999999,
      gems: 99999,
      energy: 30,
      stars: 9999,
      hearts: 5
    };
    
    this.dailyReward = {
      lastClaimed: null,
      streak: 0,
      maxStreak: 7,
      rewards: [
        { day: 1, coins: 100, gems: 5 },
        { day: 2, coins: 150, gems: 8 },
        { day: 3, coins: 200, gems: 10, powerups: { bomb: 1 } },
        { day: 4, coins: 250, gems: 12, powerups: { rainbow: 1 } },
        { day: 5, coins: 300, gems: 15, powerups: { lightning: 1 } },
        { day: 6, coins: 400, gems: 20, powerups: { bomb: 2, rainbow: 1 } },
        { day: 7, coins: 500, gems: 25, powerups: { bomb: 3, rainbow: 2, lightning: 1 } }
      ]
    };
    
    this.achievements = [];
    this.transactions = [];
  }

  async initialize() {
    this.logger.info('Initializing Economy Manager...');
    
    this.loadData();
    this.initializeAchievements();
    this.updateEnergyRegeneration();
    
    this.logger.info('Economy Manager initialized');
  }

  initializeAchievements() {
    this.achievements = [
      {
        id: 'first_coin',
        name: 'First Coin',
        description: 'Earn your first coin',
        type: 'currency',
        target: { currency: 'coins', amount: 1 },
        progress: 0,
        completed: false,
        rewards: { coins: 10 },
        unlockedAt: null
      },
      {
        id: 'coin_collector',
        name: 'Coin Collector',
        description: 'Earn 10,000 coins',
        type: 'currency',
        target: { currency: 'coins', amount: 10000 },
        progress: 0,
        completed: false,
        rewards: { coins: 1000, gems: 10 },
        unlockedAt: null
      },
      {
        id: 'gem_hunter',
        name: 'Gem Hunter',
        description: 'Collect 100 gems',
        type: 'currency',
        target: { currency: 'gems', amount: 100 },
        progress: 0,
        completed: false,
        rewards: { gems: 20, powerups: { bomb: 5 } },
        unlockedAt: null
      },
      {
        id: 'level_master',
        name: 'Level Master',
        description: 'Complete 50 levels',
        type: 'level',
        target: { levels: 50 },
        progress: 0,
        completed: false,
        rewards: { coins: 2000, gems: 50 },
        unlockedAt: null
      },
      {
        id: 'powerup_user',
        name: 'Power-up User',
        description: 'Use 100 power-ups',
        type: 'powerup',
        target: { powerups: 100 },
        progress: 0,
        completed: false,
        rewards: { coins: 1500, gems: 30 },
        unlockedAt: null
      },
      {
        id: 'daily_player',
        name: 'Daily Player',
        description: 'Claim daily reward 7 days in a row',
        type: 'daily',
        target: { days: 7 },
        progress: 0,
        completed: false,
        rewards: { coins: 3000, gems: 100 },
        unlockedAt: null
      }
    ];
    
    this.saveData();
  }

  // ==================== CURRENCY MANAGEMENT ====================
  
  getCurrency(type) {
    return this.currencies[type] || 0;
  }

  getAllCurrencies() {
    return { ...this.currencies };
  }

  addCurrency(type, amount, source = 'gameplay') {
    if (!this.currencies.hasOwnProperty(type)) {
      return { success: false, error: 'Invalid currency type' };
    }

    const oldAmount = this.currencies[type];
    const newAmount = Math.min(oldAmount + amount, this.maxCurrencies[type]);
    const actualAdded = newAmount - oldAmount;

    this.currencies[type] = newAmount;
    
    // Record transaction
    this.recordTransaction(type, actualAdded, 'add', source);
    
    // Check achievements
    this.checkAchievements('currency', { currency: type, amount: actualAdded });
    
    this.saveData();
    
    return { 
      success: true, 
      oldAmount: oldAmount, 
      newAmount: newAmount, 
      added: actualAdded 
    };
  }

  spendCurrency(type, amount, reason = 'purchase') {
    if (!this.currencies.hasOwnProperty(type)) {
      return { success: false, error: 'Invalid currency type' };
    }

    if (this.currencies[type] < amount) {
      return { success: false, error: 'Insufficient funds' };
    }

    const oldAmount = this.currencies[type];
    this.currencies[type] = oldAmount - amount;
    
    // Record transaction
    this.recordTransaction(type, amount, 'spend', reason);
    
    this.saveData();
    
    return { 
      success: true, 
      oldAmount: oldAmount, 
      newAmount: this.currencies[type], 
      spent: amount 
    };
  }

  setCurrency(type, amount) {
    if (!this.currencies.hasOwnProperty(type)) {
      return { success: false, error: 'Invalid currency type' };
    }

    const oldAmount = this.currencies[type];
    this.currencies[type] = Math.min(amount, this.maxCurrencies[type]);
    
    this.saveData();
    
    return { 
      success: true, 
      oldAmount: oldAmount, 
      newAmount: this.currencies[type] 
    };
  }

  // ==================== DAILY REWARDS ====================
  
  getDailyReward() {
    const now = Date.now();
    const today = new Date(now).toDateString();
    const lastClaimed = this.dailyReward.lastClaimed ? new Date(this.dailyReward.lastClaimed).toDateString() : null;
    
    const canClaim = lastClaimed !== today;
    const currentStreak = this.dailyReward.streak;
    const nextReward = this.dailyReward.rewards[currentStreak % this.dailyReward.maxStreak];
    
    return {
      canClaim,
      currentStreak,
      maxStreak: this.dailyReward.maxStreak,
      nextReward,
      lastClaimed: this.dailyReward.lastClaimed
    };
  }

  claimDailyReward() {
    const dailyReward = this.getDailyReward();
    
    if (!dailyReward.canClaim) {
      return { success: false, error: 'Daily reward already claimed today' };
    }

    const now = Date.now();
    const yesterday = new Date(now - 24 * 60 * 60 * 1000).toDateString();
    const lastClaimed = this.dailyReward.lastClaimed ? new Date(this.dailyReward.lastClaimed).toDateString() : null;
    
    // Check if streak should continue or reset
    if (lastClaimed === yesterday) {
      this.dailyReward.streak = (this.dailyReward.streak + 1) % this.dailyReward.maxStreak;
    } else if (lastClaimed !== null) {
      this.dailyReward.streak = 0; // Reset streak if not consecutive
    }
    
    const reward = this.dailyReward.rewards[this.dailyReward.streak];
    this.dailyReward.lastClaimed = now;
    
    // Apply rewards
    const rewards = {};
    if (reward.coins) {
      this.addCurrency('coins', reward.coins, 'daily_reward');
      rewards.coins = reward.coins;
    }
    if (reward.gems) {
      this.addCurrency('gems', reward.gems, 'daily_reward');
      rewards.gems = reward.gems;
    }
    if (reward.powerups) {
      // This would be handled by inventory manager
      rewards.powerups = reward.powerups;
    }
    
    // Check daily achievement
    this.checkAchievements('daily', { streak: this.dailyReward.streak + 1 });
    
    this.saveData();
    
    return { 
      success: true, 
      rewards: rewards, 
      streak: this.dailyReward.streak + 1 
    };
  }

  // ==================== ENERGY SYSTEM ====================
  
  updateEnergyRegeneration() {
    const now = Date.now();
    const lastUpdate = this.currencies.lastEnergyUpdate || now;
    const timePassed = now - lastUpdate;
    
    // Energy regenerates every 5 minutes
    const energyRegenRate = 5 * 60 * 1000; // 5 minutes in milliseconds
    const energyToAdd = Math.floor(timePassed / energyRegenRate);
    
    if (energyToAdd > 0) {
      this.addCurrency('energy', energyToAdd, 'regeneration');
      this.currencies.lastEnergyUpdate = now;
      this.saveData();
    }
  }

  useEnergy(amount = 1) {
    return this.spendCurrency('energy', amount, 'level_play');
  }

  getEnergyRegenerationTime() {
    const now = Date.now();
    const lastUpdate = this.currencies.lastEnergyUpdate || now;
    const timeSinceLastUpdate = now - lastUpdate;
    const energyRegenRate = 5 * 60 * 1000; // 5 minutes
    
    const timeUntilNextEnergy = energyRegenRate - (timeSinceLastUpdate % energyRegenRate);
    return timeUntilNextEnergy;
  }

  // ==================== ACHIEVEMENTS ====================
  
  getAchievements() {
    return this.achievements.map(achievement => ({
      ...achievement,
      progressPercentage: this.calculateProgressPercentage(achievement)
    }));
  }

  getCompletedAchievements() {
    return this.achievements.filter(achievement => achievement.completed);
  }

  getUnlockedAchievements() {
    return this.achievements.filter(achievement => achievement.completed && achievement.unlockedAt);
  }

  checkAchievements(type, data) {
    const achievements = this.achievements.filter(achievement => 
      !achievement.completed && achievement.type === type
    );
    
    const completedAchievements = [];
    
    achievements.forEach(achievement => {
      if (this.checkAchievementCompletion(achievement, data)) {
        achievement.completed = true;
        achievement.unlockedAt = Date.now();
        completedAchievements.push(achievement);
        
        // Apply rewards
        this.applyAchievementRewards(achievement);
      }
    });
    
    if (completedAchievements.length > 0) {
      this.saveData();
    }
    
    return completedAchievements;
  }

  checkAchievementCompletion(achievement, data) {
    switch (achievement.type) {
      case 'currency':
        if (achievement.target.currency === data.currency) {
          achievement.progress += data.amount;
          return achievement.progress >= achievement.target.amount;
        }
        break;
      case 'level':
        if (data.levelId) {
          achievement.progress += 1;
          return achievement.progress >= achievement.target.levels;
        }
        break;
      case 'powerup':
        if (data.powerupType) {
          achievement.progress += 1;
          return achievement.progress >= achievement.target.powerups;
        }
        break;
      case 'daily':
        if (data.streak) {
          achievement.progress = data.streak;
          return achievement.progress >= achievement.target.days;
        }
        break;
    }
    
    return false;
  }

  applyAchievementRewards(achievement) {
    if (achievement.rewards.coins) {
      this.addCurrency('coins', achievement.rewards.coins, 'achievement');
    }
    if (achievement.rewards.gems) {
      this.addCurrency('gems', achievement.rewards.gems, 'achievement');
    }
    if (achievement.rewards.powerups) {
      // This would be handled by inventory manager
    }
  }

  calculateProgressPercentage(achievement) {
    if (achievement.completed) return 100;
    
    switch (achievement.type) {
      case 'currency':
        return Math.min(100, Math.round((achievement.progress / achievement.target.amount) * 100));
      case 'level':
        return Math.min(100, Math.round((achievement.progress / achievement.target.levels) * 100));
      case 'powerup':
        return Math.min(100, Math.round((achievement.progress / achievement.target.powerups) * 100));
      case 'daily':
        return Math.min(100, Math.round((achievement.progress / achievement.target.days) * 100));
      default:
        return 0;
    }
  }

  // ==================== TRANSACTIONS ====================
  
  recordTransaction(currency, amount, type, reason) {
    const transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      currency: currency,
      amount: amount,
      type: type, // 'add' or 'spend'
      reason: reason,
      timestamp: Date.now(),
      balance: this.currencies[currency]
    };
    
    this.transactions.push(transaction);
    
    // Keep only last 1000 transactions
    if (this.transactions.length > 1000) {
      this.transactions = this.transactions.slice(-1000);
    }
  }

  getTransactionHistory(limit = 50) {
    return this.transactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // ==================== ECONOMY DATA ====================
  
  getData() {
    return {
      currencies: this.currencies,
      dailyReward: this.dailyReward,
      achievements: this.achievements,
      transactions: this.transactions.slice(-100) // Last 100 transactions
    };
  }

  getEconomyStats() {
    const totalEarned = this.transactions
      .filter(t => t.type === 'add')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalSpent = this.transactions
      .filter(t => t.type === 'spend')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const completedAchievements = this.achievements.filter(a => a.completed).length;
    const totalAchievements = this.achievements.length;
    
    return {
      totalEarned,
      totalSpent,
      netWorth: totalEarned - totalSpent,
      completedAchievements,
      totalAchievements,
      achievementProgress: Math.round((completedAchievements / totalAchievements) * 100),
      dailyStreak: this.dailyReward.streak
    };
  }

  // ==================== UTILITY METHODS ====================
  
  loadData() {
    try {
      const data = JSON.parse(localStorage.getItem('game_economy') || '{}');
      this.currencies = { ...this.currencies, ...data.currencies };
      this.dailyReward = { ...this.dailyReward, ...data.dailyReward };
      this.achievements = data.achievements || this.achievements;
      this.transactions = data.transactions || [];
    } catch (error) {
      console.error('Failed to load economy data:', error);
    }
  }

  saveData() {
    const data = {
      currencies: this.currencies,
      dailyReward: this.dailyReward,
      achievements: this.achievements,
      transactions: this.transactions,
      lastSaved: Date.now()
    };
    localStorage.setItem('game_economy', JSON.stringify(data));
  }

  export() {
    return {
      currencies: this.currencies,
      dailyReward: this.dailyReward,
      achievements: this.achievements,
      transactions: this.transactions
    };
  }

  import(data) {
    if (data.currencies) this.currencies = { ...this.currencies, ...data.currencies };
    if (data.dailyReward) this.dailyReward = { ...this.dailyReward, ...data.dailyReward };
    if (data.achievements) this.achievements = data.achievements;
    if (data.transactions) this.transactions = data.transactions;
    this.saveData();
  }
}

// Make it globally available
window.LocalEconomyManager = LocalEconomyManager;