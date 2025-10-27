/**
 * Local Game API - Integration layer for Unity WebGL
 * Provides a unified API interface for the local game system
 */

class LocalGameAPI {
  constructor() {
    this.gameManager = null;
    this.initialized = false;
    this.eventListeners = new Map();
  }

  async initialize() {
    if (this.initialized) {
      return { success: true, message: 'Already initialized' };
    }

    try {
      console.log('🚀 Initializing Local Game API...');
      
      // Initialize the main game manager
      this.gameManager = new LocalGameManager();
      await this.gameManager.initialize();
      
      // Set up global API
      this.setupGlobalAPI();
      
      // Load existing game data
      this.gameManager.loadGame();
      
      this.initialized = true;
      console.log('✅ Local Game API initialized successfully');
      
      return { success: true, message: 'Local Game API initialized' };
    } catch (error) {
      console.error('Failed to initialize Local Game API:', error);
      return { success: false, error: error.message };
    }
  }

  setupGlobalAPI() {
    // Make the API globally available
    window.gameAPI = {
      // Initialization
      initialize: () => this.initialize(),
      isReady: () => this.initialized,
      
      // Level Management
      getLevels: () => this.gameManager.getLevels(),
      getLevel: (levelId) => this.gameManager.getLevel(levelId),
      unlockLevel: (levelId) => this.gameManager.unlockLevel(levelId),
      completeLevel: (levelId, score, stars, movesUsed, timeSpent) => 
        this.gameManager.completeLevel(levelId, score, stars, movesUsed, timeSpent),
      getLevelProgress: () => this.gameManager.getLevelProgress(),
      
      // Tutorial System
      getTutorialStatus: () => this.gameManager.getTutorialStatus(),
      getCurrentTutorialStep: () => this.gameManager.getCurrentTutorialStep(),
      completeTutorialStep: (stepId) => this.gameManager.completeTutorialStep(stepId),
      skipTutorial: () => this.gameManager.skipTutorial(),
      getTutorialHints: () => this.gameManager.getTutorialHints(),
      
      // Settings Management
      getSettings: () => this.gameManager.getSettings(),
      updateSettings: (category, key, value) => this.gameManager.updateSettings(category, key, value),
      getAudioSettings: () => this.gameManager.getAudioSettings(),
      updateAudioSettings: (settings) => this.gameManager.updateAudioSettings(settings),
      getGraphicsSettings: () => this.gameManager.getGraphicsSettings(),
      updateGraphicsSettings: (settings) => this.gameManager.updateGraphicsSettings(settings),
      
      // Social Features
      getFriends: () => this.gameManager.getFriends(),
      addFriend: (friendId, friendName) => this.gameManager.addFriend(friendId, friendName),
      removeFriend: (friendId) => this.gameManager.removeFriend(friendId),
      sendGift: (friendId, giftType) => this.gameManager.sendGift(friendId, giftType),
      getGifts: () => this.gameManager.getGifts(),
      claimGift: (giftId) => this.gameManager.claimGift(giftId),
      
      // Events System
      getActiveEvents: () => this.gameManager.getActiveEvents(),
      getEvent: (eventId) => this.gameManager.getEvent(eventId),
      participateInEvent: (eventId) => this.gameManager.participateInEvent(eventId),
      getEventLeaderboard: (eventId) => this.gameManager.getEventLeaderboard(eventId),
      getSpecialOffers: () => this.gameManager.getSpecialOffers(),
      claimSpecialOffer: (offerId) => this.gameManager.claimSpecialOffer(offerId),
      
      // Inventory Management
      getInventory: () => this.gameManager.getInventory(),
      useItem: (itemId, quantity) => this.gameManager.useItem(itemId, quantity),
      equipItem: (itemId) => this.gameManager.equipItem(itemId),
      getAvailableItems: () => this.gameManager.getAvailableItems(),
      getItemDetails: (itemId) => this.gameManager.getItemDetails(itemId),
      
      // Economy Management
      getCurrency: (type) => this.gameManager.getCurrency(type),
      addCurrency: (type, amount, source) => this.gameManager.addCurrency(type, amount, source),
      spendCurrency: (type, amount, reason) => this.gameManager.spendCurrency(type, amount, reason),
      getDailyReward: () => this.gameManager.getDailyReward(),
      claimDailyReward: () => this.gameManager.claimDailyReward(),
      getEconomyData: () => this.gameManager.getEconomyData(),
      
      // Notifications
      getNotifications: () => this.gameManager.getNotifications(),
      markNotificationRead: (notificationId) => this.gameManager.markNotificationRead(notificationId),
      clearAllNotifications: () => this.gameManager.clearAllNotifications(),
      
      // Achievements
      getAchievements: () => this.gameManager.getAchievements(),
      checkAchievements: (type, data) => this.gameManager.checkAchievements(type, data),
      
      // Save/Load
      saveGame: () => this.gameManager.saveGame(),
      loadGame: () => this.gameManager.loadGame(),
      resetGame: () => this.gameManager.resetGame(),
      exportSaveData: () => this.gameManager.exportSaveData(),
      importSaveData: (saveData) => this.gameManager.importSaveData(saveData),
      
      // Event System
      on: (event, callback) => this.addEventListener(event, callback),
      off: (event, callback) => this.removeEventListener(event, callback),
      emit: (event, data) => this.emitEvent(event, data),
      
      // Utility
      getGameStats: () => this.getGameStats(),
      getVersion: () => '1.0.0',
      getPlatform: () => 'webgl'
    };

    // Legacy compatibility
    window.LocalGameAPI = this;
  }

  // ==================== EVENT SYSTEM ====================
  
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  removeEventListener(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emitEvent(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // ==================== GAME STATISTICS ====================
  
  getGameStats() {
    if (!this.gameManager) {
      return null;
    }

    const levelProgress = this.gameManager.getLevelProgress();
    const economyData = this.gameManager.getEconomyData();
    const socialStats = this.gameManager.socialManager.getSocialStats();
    const inventoryStats = this.gameManager.inventoryManager.getInventoryStats();
    const notificationStats = this.gameManager.notificationManager.getNotificationStats();

    return {
      level: {
        currentLevel: levelProgress.currentLevel,
        totalLevels: levelProgress.totalLevels,
        levelsCompleted: levelProgress.levelsCompleted,
        totalStars: levelProgress.totalStars,
        completionPercentage: levelProgress.completionPercentage
      },
      economy: {
        coins: economyData.currencies.coins,
        gems: economyData.currencies.gems,
        energy: economyData.currencies.energy,
        stars: economyData.currencies.stars,
        hearts: economyData.currencies.hearts
      },
      social: socialStats,
      inventory: inventoryStats,
      notifications: notificationStats,
      achievements: {
        completed: this.gameManager.getAchievements().filter(a => a.completed).length,
        total: this.gameManager.getAchievements().length
      }
    };
  }

  // ==================== UNITY INTEGRATION HELPERS ====================
  
  // These methods provide Unity-specific integration
  getUnityGameData() {
    if (!this.gameManager) {
      return null;
    }

    return {
      playerData: {
        level: this.gameManager.getLevelProgress().currentLevel,
        score: this.gameManager.getLevelProgress().totalScore,
        coins: this.gameManager.getCurrency('coins'),
        gems: this.gameManager.getCurrency('gems'),
        energy: this.gameManager.getCurrency('energy')
      },
      levelData: this.gameManager.getLevels(),
      settings: this.gameManager.getSettings(),
      inventory: this.gameManager.getInventory(),
      achievements: this.gameManager.getAchievements()
    };
  }

  updateUnityGameData(unityData) {
    if (!this.gameManager) {
      return { success: false, error: 'Game manager not initialized' };
    }

    try {
      // Update player data from Unity
      if (unityData.playerData) {
        const playerData = unityData.playerData;
        
        if (playerData.coins !== undefined) {
          this.gameManager.setCurrency('coins', playerData.coins);
        }
        if (playerData.gems !== undefined) {
          this.gameManager.setCurrency('gems', playerData.gems);
        }
        if (playerData.energy !== undefined) {
          this.gameManager.setCurrency('energy', playerData.energy);
        }
      }

      // Update level data from Unity
      if (unityData.levelData) {
        // This would sync level progress with Unity
        // Implementation depends on Unity's data structure
      }

      this.gameManager.saveGame();
      
      return { success: true };
    } catch (error) {
      console.error('Failed to update Unity game data:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== DEBUGGING AND TESTING ====================
  
  enableDebugMode() {
    window.gameAPIDebug = true;
    console.log('🐛 Debug mode enabled for Local Game API');
  }

  disableDebugMode() {
    window.gameAPIDebug = false;
    console.log('🐛 Debug mode disabled for Local Game API');
  }

  getDebugInfo() {
    return {
      initialized: this.initialized,
      gameManager: !!this.gameManager,
      eventListeners: Array.from(this.eventListeners.keys()),
      localStorage: {
        gameLevels: !!localStorage.getItem('game_levels'),
        gameTutorial: !!localStorage.getItem('game_tutorial'),
        gameSettings: !!localStorage.getItem('game_settings'),
        gameSocial: !!localStorage.getItem('game_social'),
        gameEvents: !!localStorage.getItem('game_events'),
        gameInventory: !!localStorage.getItem('game_inventory'),
        gameEconomy: !!localStorage.getItem('game_economy'),
        gameNotifications: !!localStorage.getItem('game_notifications')
      }
    };
  }

  // ==================== UTILITY METHODS ====================
  
  async waitForInitialization(timeout = 5000) {
    const startTime = Date.now();
    
    while (!this.initialized && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return this.initialized;
  }

  isFeatureAvailable(feature) {
    const availableFeatures = [
      'levels', 'tutorial', 'settings', 'social', 'events', 
      'inventory', 'economy', 'notifications', 'achievements'
    ];
    
    return availableFeatures.includes(feature);
  }

  getFeatureStatus() {
    return {
      levels: !!this.gameManager?.levelManager,
      tutorial: !!this.gameManager?.tutorialEngine,
      settings: !!this.gameManager?.settingsManager,
      social: !!this.gameManager?.socialManager,
      events: !!this.gameManager?.eventsManager,
      inventory: !!this.gameManager?.inventoryManager,
      economy: !!this.gameManager?.economyManager,
      notifications: !!this.gameManager?.notificationManager
    };
  }
}

// Auto-initialize when the script loads
document.addEventListener('DOMContentLoaded', async () => {
  const api = new LocalGameAPI();
  await api.initialize();
  
  // Emit ready event
  if (window.gameAPI) {
    window.gameAPI.emit('ready', { version: '1.0.0' });
  }
});

// Make it globally available
window.LocalGameAPI = LocalGameAPI;