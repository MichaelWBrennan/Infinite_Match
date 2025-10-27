/**
 * Local Game Manager - Complete local game system
 * Provides all game features without requiring external APIs
 */

class LocalGameManager {
  constructor() {
    this.levelManager = new LocalLevelManager();
    this.tutorialEngine = new LocalTutorialEngine();
    this.settingsManager = new LocalSettingsManager();
    this.socialManager = new LocalSocialManager();
    this.eventsManager = new LocalEventsManager();
    this.inventoryManager = new LocalInventoryManager();
    this.economyManager = new LocalEconomyManager();
    this.notificationManager = new LocalNotificationManager();
    
    this.initialize();
  }

  async initialize() {
    console.log('🎮 Initializing Local Game Manager...');
    
    // Initialize all subsystems
    await this.levelManager.initialize();
    await this.tutorialEngine.initialize();
    await this.settingsManager.initialize();
    await this.socialManager.initialize();
    await this.eventsManager.initialize();
    await this.inventoryManager.initialize();
    await this.economyManager.initialize();
    await this.notificationManager.initialize();
    
    console.log('✅ Local Game Manager initialized successfully');
  }

  // ==================== LEVEL MANAGEMENT ====================
  
  getLevels() {
    return this.levelManager.getLevels();
  }

  getLevel(levelId) {
    return this.levelManager.getLevel(levelId);
  }

  unlockLevel(levelId) {
    return this.levelManager.unlockLevel(levelId);
  }

  completeLevel(levelId, score, stars, movesUsed, timeSpent) {
    const result = this.levelManager.completeLevel(levelId, score, stars, movesUsed, timeSpent);
    
    // Award economy rewards
    this.economyManager.addCoins(score * 10);
    this.economyManager.addXP(stars * 50);
    
    // Check for achievements
    this.checkAchievements('level_complete', { levelId, score, stars });
    
    return result;
  }

  getLevelProgress() {
    return this.levelManager.getProgress();
  }

  // ==================== TUTORIAL SYSTEM ====================
  
  getTutorialStatus() {
    return this.tutorialEngine.getStatus();
  }

  getCurrentTutorialStep() {
    return this.tutorialEngine.getCurrentStep();
  }

  completeTutorialStep(stepId) {
    return this.tutorialEngine.completeStep(stepId);
  }

  skipTutorial() {
    return this.tutorialEngine.skip();
  }

  getTutorialHints() {
    return this.tutorialEngine.getHints();
  }

  // ==================== SETTINGS MANAGEMENT ====================
  
  getSettings() {
    return this.settingsManager.getSettings();
  }

  updateSettings(category, key, value) {
    return this.settingsManager.setSetting(category, key, value);
  }

  getAudioSettings() {
    return this.settingsManager.getAudioSettings();
  }

  updateAudioSettings(settings) {
    return this.settingsManager.updateAudioSettings(settings);
  }

  getGraphicsSettings() {
    return this.settingsManager.getGraphicsSettings();
  }

  updateGraphicsSettings(settings) {
    return this.settingsManager.updateGraphicsSettings(settings);
  }

  // ==================== SOCIAL FEATURES ====================
  
  getFriends() {
    return this.socialManager.getFriends();
  }

  addFriend(friendId, friendName) {
    return this.socialManager.addFriend(friendId, friendName);
  }

  removeFriend(friendId) {
    return this.socialManager.removeFriend(friendId);
  }

  sendGift(friendId, giftType) {
    return this.socialManager.sendGift(friendId, giftType);
  }

  getGifts() {
    return this.socialManager.getGifts();
  }

  claimGift(giftId) {
    return this.socialManager.claimGift(giftId);
  }

  // ==================== EVENTS SYSTEM ====================
  
  getActiveEvents() {
    return this.eventsManager.getActiveEvents();
  }

  getEvent(eventId) {
    return this.eventsManager.getEvent(eventId);
  }

  participateInEvent(eventId) {
    return this.eventsManager.participate(eventId);
  }

  getEventLeaderboard(eventId) {
    return this.eventsManager.getLeaderboard(eventId);
  }

  getSpecialOffers() {
    return this.eventsManager.getSpecialOffers();
  }

  claimSpecialOffer(offerId) {
    return this.eventsManager.claimOffer(offerId);
  }

  // ==================== INVENTORY MANAGEMENT ====================
  
  getInventory() {
    return this.inventoryManager.getInventory();
  }

  useItem(itemId, quantity = 1) {
    return this.inventoryManager.useItem(itemId, quantity);
  }

  equipItem(itemId) {
    return this.inventoryManager.equipItem(itemId);
  }

  getAvailableItems() {
    return this.inventoryManager.getAvailableItems();
  }

  getItemDetails(itemId) {
    return this.inventoryManager.getItemDetails(itemId);
  }

  // ==================== ECONOMY MANAGEMENT ====================
  
  getCurrency(type) {
    return this.economyManager.getCurrency(type);
  }

  addCurrency(type, amount, source = 'gameplay') {
    return this.economyManager.addCurrency(type, amount, source);
  }

  spendCurrency(type, amount, reason = 'purchase') {
    return this.economyManager.spendCurrency(type, amount, reason);
  }

  getDailyReward() {
    return this.economyManager.getDailyReward();
  }

  claimDailyReward() {
    return this.economyManager.claimDailyReward();
  }

  getEconomyData() {
    return this.economyManager.getData();
  }

  // ==================== NOTIFICATIONS ====================
  
  getNotifications() {
    return this.notificationManager.getNotifications();
  }

  markNotificationRead(notificationId) {
    return this.notificationManager.markRead(notificationId);
  }

  clearAllNotifications() {
    return this.notificationManager.clearAll();
  }

  // ==================== ACHIEVEMENTS ====================
  
  getAchievements() {
    return this.economyManager.getAchievements();
  }

  checkAchievements(type, data) {
    return this.economyManager.checkAchievements(type, data);
  }

  // ==================== UTILITY METHODS ====================
  
  saveGame() {
    const gameData = {
      levels: this.levelManager.export(),
      tutorial: this.tutorialEngine.export(),
      settings: this.settingsManager.export(),
      social: this.socialManager.export(),
      events: this.eventsManager.export(),
      inventory: this.inventoryManager.export(),
      economy: this.economyManager.export(),
      notifications: this.notificationManager.export(),
      timestamp: Date.now()
    };
    
    localStorage.setItem('game_save_data', JSON.stringify(gameData));
    return true;
  }

  loadGame() {
    try {
      const gameData = JSON.parse(localStorage.getItem('game_save_data') || '{}');
      
      if (gameData.levels) this.levelManager.import(gameData.levels);
      if (gameData.tutorial) this.tutorialEngine.import(gameData.tutorial);
      if (gameData.settings) this.settingsManager.import(gameData.settings);
      if (gameData.social) this.socialManager.import(gameData.social);
      if (gameData.events) this.eventsManager.import(gameData.events);
      if (gameData.inventory) this.inventoryManager.import(gameData.inventory);
      if (gameData.economy) this.economyManager.import(gameData.economy);
      if (gameData.notifications) this.notificationManager.import(gameData.notifications);
      
      return true;
    } catch (error) {
      console.error('Failed to load game data:', error);
      return false;
    }
  }

  resetGame() {
    localStorage.removeItem('game_save_data');
    this.initialize();
  }

  exportSaveData() {
    return JSON.stringify({
      levels: this.levelManager.export(),
      tutorial: this.tutorialEngine.export(),
      settings: this.settingsManager.export(),
      social: this.socialManager.export(),
      events: this.eventsManager.export(),
      inventory: this.inventoryManager.export(),
      economy: this.economyManager.export(),
      notifications: this.notificationManager.export(),
      timestamp: Date.now()
    });
  }

  importSaveData(saveData) {
    try {
      const gameData = JSON.parse(saveData);
      
      if (gameData.levels) this.levelManager.import(gameData.levels);
      if (gameData.tutorial) this.tutorialEngine.import(gameData.tutorial);
      if (gameData.settings) this.settingsManager.import(gameData.settings);
      if (gameData.social) this.socialManager.import(gameData.social);
      if (gameData.events) this.eventsManager.import(gameData.events);
      if (gameData.inventory) this.inventoryManager.import(gameData.inventory);
      if (gameData.economy) this.economyManager.import(gameData.economy);
      if (gameData.notifications) this.notificationManager.import(gameData.notifications);
      
      return true;
    } catch (error) {
      console.error('Failed to import save data:', error);
      return false;
    }
  }
}

// Make it globally available
window.LocalGameManager = LocalGameManager;