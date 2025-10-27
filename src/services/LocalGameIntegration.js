/**
 * Local Game Integration - Unity WebGL Integration Layer
 * This file provides the integration between the local game system and Unity WebGL
 */

import { Logger } from '../core/logger/index.js';

class LocalGameIntegration {
  constructor() {
    this.logger = new Logger('LocalGameIntegration');
    this.gameAPI = null;
    this.unityInstance = null;
    this.initialized = false;
  }

  async initialize() {
    this.logger.info('Initializing Local Game Integration...');
    
    try {
      // Wait for the game API to be ready
      if (window.gameAPI) {
        this.gameAPI = window.gameAPI;
      } else {
        // Wait for the API to load
        await this.waitForGameAPI();
      }
      
      // Set up Unity integration
      this.setupUnityIntegration();
      
      this.initialized = true;
      this.logger.info('Local Game Integration initialized successfully');
      
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize Local Game Integration:', error);
      return { success: false, error: error.message };
    }
  }

  async waitForGameAPI(timeout = 10000) {
    const startTime = Date.now();
    
    while (!window.gameAPI && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (window.gameAPI) {
      this.gameAPI = window.gameAPI;
      return true;
    } else {
      throw new Error('Game API not available after timeout');
    }
  }

  setupUnityIntegration() {
    // Create the Unity integration object
    window.UnityGameIntegration = {
      // Initialize Unity integration
      initialize: () => this.initializeUnity(),
      
      // Level Management
      getLevels: () => this.gameAPI.getLevels(),
      getLevel: (levelId) => this.gameAPI.getLevel(levelId),
      unlockLevel: (levelId) => this.gameAPI.unlockLevel(levelId),
      completeLevel: (levelId, score, stars, movesUsed, timeSpent) => 
        this.gameAPI.completeLevel(levelId, score, stars, movesUsed, timeSpent),
      getLevelProgress: () => this.gameAPI.getLevelProgress(),
      
      // Tutorial System
      getTutorialStatus: () => this.gameAPI.getTutorialStatus(),
      getCurrentTutorialStep: () => this.gameAPI.getCurrentTutorialStep(),
      completeTutorialStep: (stepId) => this.gameAPI.completeTutorialStep(stepId),
      skipTutorial: () => this.gameAPI.skipTutorial(),
      getTutorialHints: () => this.gameAPI.getTutorialHints(),
      
      // Settings Management
      getSettings: () => this.gameAPI.getSettings(),
      updateSettings: (category, key, value) => this.gameAPI.updateSettings(category, key, value),
      getAudioSettings: () => this.gameAPI.getAudioSettings(),
      updateAudioSettings: (settings) => this.gameAPI.updateAudioSettings(settings),
      getGraphicsSettings: () => this.gameAPI.getGraphicsSettings(),
      updateGraphicsSettings: (settings) => this.gameAPI.updateGraphicsSettings(settings),
      
      // Social Features
      getFriends: () => this.gameAPI.getFriends(),
      addFriend: (friendId, friendName) => this.gameAPI.addFriend(friendId, friendName),
      removeFriend: (friendId) => this.gameAPI.removeFriend(friendId),
      sendGift: (friendId, giftType) => this.gameAPI.sendGift(friendId, giftType),
      getGifts: () => this.gameAPI.getGifts(),
      claimGift: (giftId) => this.gameAPI.claimGift(giftId),
      
      // Events System
      getActiveEvents: () => this.gameAPI.getActiveEvents(),
      getEvent: (eventId) => this.gameAPI.getEvent(eventId),
      participateInEvent: (eventId) => this.gameAPI.participateInEvent(eventId),
      getEventLeaderboard: (eventId) => this.gameAPI.getEventLeaderboard(eventId),
      getSpecialOffers: () => this.gameAPI.getSpecialOffers(),
      claimSpecialOffer: (offerId) => this.gameAPI.claimSpecialOffer(offerId),
      
      // Inventory Management
      getInventory: () => this.gameAPI.getInventory(),
      useItem: (itemId, quantity) => this.gameAPI.useItem(itemId, quantity),
      equipItem: (itemId) => this.gameAPI.equipItem(itemId),
      getAvailableItems: () => this.gameAPI.getAvailableItems(),
      getItemDetails: (itemId) => this.gameAPI.getItemDetails(itemId),
      
      // Economy Management
      getCurrency: (type) => this.gameAPI.getCurrency(type),
      addCurrency: (type, amount, source) => this.gameAPI.addCurrency(type, amount, source),
      spendCurrency: (type, amount, reason) => this.gameAPI.spendCurrency(type, amount, reason),
      getDailyReward: () => this.gameAPI.getDailyReward(),
      claimDailyReward: () => this.gameAPI.claimDailyReward(),
      getEconomyData: () => this.gameAPI.getEconomyData(),
      
      // Notifications
      getNotifications: () => this.gameAPI.getNotifications(),
      markNotificationRead: (notificationId) => this.gameAPI.markNotificationRead(notificationId),
      clearAllNotifications: () => this.gameAPI.clearAllNotifications(),
      
      // Achievements
      getAchievements: () => this.gameAPI.getAchievements(),
      checkAchievements: (type, data) => this.gameAPI.checkAchievements(type, data),
      
      // Save/Load
      saveGame: () => this.gameAPI.saveGame(),
      loadGame: () => this.gameAPI.loadGame(),
      resetGame: () => this.gameAPI.resetGame(),
      exportSaveData: () => this.gameAPI.exportSaveData(),
      importSaveData: (saveData) => this.gameAPI.importSaveData(saveData),
      
      // Unity-specific methods
      getUnityGameData: () => this.getUnityGameData(),
      updateUnityGameData: (unityData) => this.updateUnityGameData(unityData),
      onUnityReady: (callback) => this.onUnityReady(callback),
      
      // Event System
      on: (event, callback) => this.gameAPI.on(event, callback),
      off: (event, callback) => this.gameAPI.off(event, callback),
      emit: (event, data) => this.gameAPI.emit(event, data)
    };

    // Set up Unity message handling
    this.setupUnityMessageHandling();
  }

  setupUnityMessageHandling() {
    // Listen for Unity messages
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'unity') {
        this.handleUnityMessage(event.data);
      }
    });

    // Set up Unity instance detection
    this.detectUnityInstance();
  }

  detectUnityInstance() {
    // Check if Unity instance is available
    if (window.unityInstance) {
      this.unityInstance = window.unityInstance;
      this.onUnityReady();
    } else {
      // Wait for Unity to load
      const checkUnity = setInterval(() => {
        if (window.unityInstance) {
          this.unityInstance = window.unityInstance;
          this.onUnityReady();
          clearInterval(checkUnity);
        }
      }, 100);
    }
  }

  onUnityReady(callback) {
    if (this.unityInstance) {
      if (callback) callback();
      this.gameAPI.emit('unity_ready', { instance: this.unityInstance });
    } else {
      // Store callback for when Unity is ready
      this.unityReadyCallbacks = this.unityReadyCallbacks || [];
      this.unityReadyCallbacks.push(callback);
    }
  }

  handleUnityMessage(data) {
    this.logger.info('Received Unity message:', { data });
    
    switch (data.action) {
      case 'get_game_data':
        this.sendUnityMessage('game_data', this.getUnityGameData());
        break;
      case 'update_game_data':
        this.updateUnityGameData(data.data);
        break;
      case 'level_complete':
        this.handleLevelComplete(data.data);
        break;
      case 'tutorial_step_complete':
        this.handleTutorialStepComplete(data.data);
        break;
      case 'use_item':
        this.handleUseItem(data.data);
        break;
      case 'claim_daily_reward':
        this.handleClaimDailyReward();
        break;
      default:
        this.logger.warn('Unknown Unity message action:', { action: data.action });
    }
  }

  sendUnityMessage(action, data) {
    if (this.unityInstance) {
      this.unityInstance.SendMessage('GameManager', 'OnWebGLMessage', JSON.stringify({
        action: action,
        data: data,
        timestamp: Date.now()
      }));
    }
  }

  getUnityGameData() {
    if (!this.gameAPI) {
      return null;
    }

    const levelProgress = this.gameAPI.getLevelProgress();
    const economyData = this.gameAPI.getEconomyData();
    const settings = this.gameAPI.getSettings();
    const inventory = this.gameAPI.getInventory();
    const achievements = this.gameAPI.getAchievements();

    return {
      playerData: {
        level: levelProgress.currentLevel,
        score: levelProgress.totalScore,
        coins: economyData.currencies.coins,
        gems: economyData.currencies.gems,
        energy: economyData.currencies.energy,
        stars: economyData.currencies.stars,
        hearts: economyData.currencies.hearts
      },
      levelData: this.gameAPI.getLevels(),
      settings: settings,
      inventory: inventory,
      achievements: achievements,
      tutorial: {
        status: this.gameAPI.getTutorialStatus(),
        currentStep: this.gameAPI.getCurrentTutorialStep()
      },
      social: {
        friends: this.gameAPI.getFriends(),
        gifts: this.gameAPI.getGifts()
      },
      events: {
        active: this.gameAPI.getActiveEvents(),
        offers: this.gameAPI.getSpecialOffers()
      }
    };
  }

  updateUnityGameData(unityData) {
    if (!this.gameAPI) {
      return { success: false, error: 'Game API not available' };
    }

    try {
      // Update player data from Unity
      if (unityData.playerData) {
        const playerData = unityData.playerData;
        
        if (playerData.coins !== undefined) {
          this.gameAPI.setCurrency('coins', playerData.coins);
        }
        if (playerData.gems !== undefined) {
          this.gameAPI.setCurrency('gems', playerData.gems);
        }
        if (playerData.energy !== undefined) {
          this.gameAPI.setCurrency('energy', playerData.energy);
        }
        if (playerData.stars !== undefined) {
          this.gameAPI.setCurrency('stars', playerData.stars);
        }
        if (playerData.hearts !== undefined) {
          this.gameAPI.setCurrency('hearts', playerData.hearts);
        }
      }

      // Update settings from Unity
      if (unityData.settings) {
        Object.entries(unityData.settings).forEach(([category, settings]) => {
          Object.entries(settings).forEach(([key, value]) => {
            this.gameAPI.updateSettings(category, key, value);
          });
        });
      }

      this.gameAPI.saveGame();
      
      return { success: true };
    } catch (error) {
      console.error('Failed to update Unity game data:', error);
      return { success: false, error: error.message };
    }
  }

  handleLevelComplete(data) {
    const { levelId, score, stars, movesUsed, timeSpent } = data;
    const result = this.gameAPI.completeLevel(levelId, score, stars, movesUsed, timeSpent);
    
    // Send result back to Unity
    this.sendUnityMessage('level_complete_result', result);
    
    // Check for achievements
    const achievements = this.gameAPI.checkAchievements('level', { levelId, score, stars });
    if (achievements.length > 0) {
      this.sendUnityMessage('achievements_unlocked', achievements);
    }
  }

  handleTutorialStepComplete(data) {
    const { stepId } = data;
    const result = this.gameAPI.completeTutorialStep(stepId);
    
    // Send result back to Unity
    this.sendUnityMessage('tutorial_step_complete_result', result);
  }

  handleUseItem(data) {
    const { itemId, quantity } = data;
    const result = this.gameAPI.useItem(itemId, quantity);
    
    // Send result back to Unity
    this.sendUnityMessage('use_item_result', result);
  }

  handleClaimDailyReward() {
    const result = this.gameAPI.claimDailyReward();
    
    // Send result back to Unity
    this.sendUnityMessage('daily_reward_result', result);
  }

  // Unity-specific helper methods
  getUnityInstance() {
    return this.unityInstance;
  }

  isUnityReady() {
    return !!this.unityInstance;
  }

  // Event handling for Unity
  onUnityEvent(event, callback) {
    this.gameAPI.on(`unity_${event}`, callback);
  }

  emitUnityEvent(event, data) {
    this.gameAPI.emit(`unity_${event}`, data);
  }

  // Debug methods
  getIntegrationStatus() {
    return {
      initialized: this.initialized,
      gameAPI: !!this.gameAPI,
      unityInstance: !!this.unityInstance,
      unityReady: this.isUnityReady()
    };
  }

  enableDebugMode() {
    this.debugMode = true;
    this.logger.info('Debug mode enabled for Local Game Integration');
  }

  disableDebugMode() {
    this.debugMode = false;
    this.logger.info('Debug mode disabled for Local Game Integration');
  }
}

// Auto-initialize when the script loads
document.addEventListener('DOMContentLoaded', async () => {
  const integration = new LocalGameIntegration();
  await integration.initialize();
  
  // Make it globally available
  window.LocalGameIntegration = integration;
});

// Make it globally available
window.LocalGameIntegration = LocalGameIntegration;