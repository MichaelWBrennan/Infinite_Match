/**
 * Local Notification Manager - Handles notifications locally
 */

class LocalNotificationManager {
  constructor() {
    this.notifications = [];
    this.settings = {
      enabled: true,
      sound: true,
      vibration: true,
      popup: true,
      types: {
        achievement: true,
        dailyReward: true,
        energy: true,
        friend: true,
        event: true,
        offer: true,
        system: true
      }
    };
  }

  async initialize() {
    console.log('🔔 Initializing Notification Manager...');
    
    this.loadData();
    this.createDefaultNotifications();
    
    console.log(`✅ Notification Manager initialized with ${this.notifications.length} notifications`);
  }

  createDefaultNotifications() {
    if (this.notifications.length === 0) {
      this.notifications = [
        {
          id: 'welcome',
          type: 'system',
          title: 'Welcome to Infinite Match!',
          message: 'Start your journey by completing the tutorial.',
          timestamp: Date.now(),
          read: false,
          priority: 'high',
          actions: [
            { id: 'start_tutorial', label: 'Start Tutorial', action: 'navigate', target: 'tutorial' },
            { id: 'skip', label: 'Skip', action: 'dismiss' }
          ]
        },
        {
          id: 'daily_reward_available',
          type: 'dailyReward',
          title: 'Daily Reward Available!',
          message: 'Your daily reward is ready to claim.',
          timestamp: Date.now(),
          read: false,
          priority: 'medium',
          actions: [
            { id: 'claim', label: 'Claim Reward', action: 'navigate', target: 'daily_reward' },
            { id: 'later', label: 'Later', action: 'dismiss' }
          ]
        }
      ];
      
      this.saveData();
    }
  }

  // ==================== NOTIFICATION MANAGEMENT ====================
  
  getNotifications(limit = 50) {
    return this.notifications
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  getUnreadNotifications() {
    return this.notifications.filter(notification => !notification.read);
  }

  getNotification(notificationId) {
    return this.notifications.find(n => n.id === notificationId);
  }

  createNotification(type, title, message, options = {}) {
    if (!this.settings.enabled || !this.settings.types[type]) {
      return { success: false, error: 'Notifications disabled for this type' };
    }

    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      title: title,
      message: message,
      timestamp: Date.now(),
      read: false,
      priority: options.priority || 'medium',
      actions: options.actions || [],
      data: options.data || {},
      expiresAt: options.expiresAt || null
    };

    this.notifications.push(notification);
    
    // Show notification if popup is enabled
    if (this.settings.popup) {
      this.showNotification(notification);
    }
    
    this.saveData();
    
    return { success: true, notification: notification };
  }

  markNotificationRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (!notification) {
      return { success: false, error: 'Notification not found' };
    }

    notification.read = true;
    this.saveData();
    
    return { success: true, notification: notification };
  }

  markAllRead() {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    
    this.saveData();
    
    return { success: true, count: this.notifications.length };
  }

  deleteNotification(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index === -1) {
      return { success: false, error: 'Notification not found' };
    }

    this.notifications.splice(index, 1);
    this.saveData();
    
    return { success: true };
  }

  clearAllNotifications() {
    this.notifications = [];
    this.saveData();
    
    return { success: true };
  }

  clearExpiredNotifications() {
    const now = Date.now();
    const beforeCount = this.notifications.length;
    
    this.notifications = this.notifications.filter(notification => 
      !notification.expiresAt || notification.expiresAt > now
    );
    
    const afterCount = this.notifications.length;
    const cleared = beforeCount - afterCount;
    
    if (cleared > 0) {
      this.saveData();
    }
    
    return { success: true, cleared: cleared };
  }

  // ==================== NOTIFICATION TYPES ====================
  
  createAchievementNotification(achievement) {
    return this.createNotification(
      'achievement',
      'Achievement Unlocked!',
      `You've unlocked the "${achievement.name}" achievement!`,
      {
        priority: 'high',
        actions: [
          { id: 'view_achievement', label: 'View Achievement', action: 'navigate', target: 'achievements' },
          { id: 'claim_reward', label: 'Claim Reward', action: 'claim_reward', data: { achievementId: achievement.id } }
        ],
        data: { achievementId: achievement.id }
      }
    );
  }

  createDailyRewardNotification() {
    return this.createNotification(
      'dailyReward',
      'Daily Reward Ready!',
      'Your daily reward is ready to claim. Don\'t miss out!',
      {
        priority: 'medium',
        actions: [
          { id: 'claim_daily', label: 'Claim Reward', action: 'navigate', target: 'daily_reward' }
        ]
      }
    );
  }

  createEnergyNotification() {
    return this.createNotification(
      'energy',
      'Energy Restored!',
      'Your energy has been fully restored. Ready to play!',
      {
        priority: 'low',
        actions: [
          { id: 'play_now', label: 'Play Now', action: 'navigate', target: 'levels' }
        ]
      }
    );
  }

  createFriendNotification(friendName, type) {
    let title, message;
    
    switch (type) {
      case 'gift':
        title = 'Gift Received!';
        message = `${friendName} sent you a gift!`;
        break;
      case 'request':
        title = 'Friend Request';
        message = `${friendName} wants to be your friend!`;
        break;
      case 'online':
        title = 'Friend Online';
        message = `${friendName} is now online!`;
        break;
      default:
        title = 'Friend Update';
        message = `Update from ${friendName}`;
    }
    
    return this.createNotification(
      'friend',
      title,
      message,
      {
        priority: 'medium',
        actions: [
          { id: 'view_friends', label: 'View Friends', action: 'navigate', target: 'friends' }
        ],
        data: { friendName, type }
      }
    );
  }

  createEventNotification(event) {
    return this.createNotification(
      'event',
      'New Event Available!',
      `"${event.name}" event is now live!`,
      {
        priority: 'high',
        actions: [
          { id: 'view_event', label: 'View Event', action: 'navigate', target: 'events' },
          { id: 'participate', label: 'Participate', action: 'participate_event', data: { eventId: event.id } }
        ],
        data: { eventId: event.id }
      }
    );
  }

  createOfferNotification(offer) {
    return this.createNotification(
      'offer',
      'Special Offer!',
      `Limited time offer: ${offer.name} - ${offer.discount}% off!`,
      {
        priority: 'medium',
        actions: [
          { id: 'view_offer', label: 'View Offer', action: 'navigate', target: 'shop' },
          { id: 'buy_now', label: 'Buy Now', action: 'purchase', data: { offerId: offer.id } }
        ],
        data: { offerId: offer.id },
        expiresAt: offer.endTime
      }
    );
  }

  createSystemNotification(title, message, priority = 'medium') {
    return this.createNotification(
      'system',
      title,
      message,
      {
        priority: priority,
        actions: [
          { id: 'dismiss', label: 'Dismiss', action: 'dismiss' }
        ]
      }
    );
  }

  // ==================== NOTIFICATION DISPLAY ====================
  
  showNotification(notification) {
    if (typeof window !== 'undefined' && window.gameAPI) {
      // Show in-game notification
      window.gameAPI.showNotification({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        actions: notification.actions
      });
    } else {
      // Fallback to browser notification
      this.showBrowserNotification(notification);
    }
  }

  showBrowserNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
      
      browserNotification.onclick = () => {
        this.handleNotificationAction(notification.id, 'click');
        browserNotification.close();
      };
      
      // Auto-close after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  }

  requestNotificationPermission() {
    if ('Notification' in window) {
      return Notification.requestPermission();
    }
    return Promise.resolve('denied');
  }

  // ==================== NOTIFICATION ACTIONS ====================
  
  handleNotificationAction(notificationId, actionId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (!notification) {
      return { success: false, error: 'Notification not found' };
    }

    const action = notification.actions.find(a => a.id === actionId);
    if (!action) {
      return { success: false, error: 'Action not found' };
    }

    // Mark notification as read
    notification.read = true;
    this.saveData();

    // Handle action
    switch (action.action) {
      case 'navigate':
        this.navigateTo(action.target);
        break;
      case 'dismiss':
        this.deleteNotification(notificationId);
        break;
      case 'claim_reward':
        this.claimReward(action.data);
        break;
      case 'participate_event':
        this.participateInEvent(action.data);
        break;
      case 'purchase':
        this.purchaseItem(action.data);
        break;
    }

    return { success: true, action: action };
  }

  navigateTo(target) {
    if (typeof window !== 'undefined' && window.gameAPI) {
      window.gameAPI.navigateTo(target);
    }
  }

  claimReward(data) {
    if (typeof window !== 'undefined' && window.gameAPI) {
      window.gameAPI.claimReward(data);
    }
  }

  participateInEvent(data) {
    if (typeof window !== 'undefined' && window.gameAPI) {
      window.gameAPI.participateInEvent(data);
    }
  }

  purchaseItem(data) {
    if (typeof window !== 'undefined' && window.gameAPI) {
      window.gameAPI.purchaseItem(data);
    }
  }

  // ==================== NOTIFICATION SETTINGS ====================
  
  getSettings() {
    return { ...this.settings };
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveData();
    return { success: true };
  }

  enableNotifications() {
    this.settings.enabled = true;
    this.saveData();
    return { success: true };
  }

  disableNotifications() {
    this.settings.enabled = false;
    this.saveData();
    return { success: true };
  }

  setNotificationTypeEnabled(type, enabled) {
    if (this.settings.types[type] !== undefined) {
      this.settings.types[type] = enabled;
      this.saveData();
      return { success: true };
    }
    return { success: false, error: 'Invalid notification type' };
  }

  // ==================== NOTIFICATION STATISTICS ====================
  
  getNotificationStats() {
    const total = this.notifications.length;
    const unread = this.notifications.filter(n => !n.read).length;
    const byType = {};
    
    this.notifications.forEach(notification => {
      byType[notification.type] = (byType[notification.type] || 0) + 1;
    });

    return {
      total,
      unread,
      read: total - unread,
      byType,
      unreadPercentage: total > 0 ? Math.round((unread / total) * 100) : 0
    };
  }

  // ==================== UTILITY METHODS ====================
  
  loadData() {
    try {
      const data = JSON.parse(localStorage.getItem('game_notifications') || '{}');
      this.notifications = data.notifications || [];
      this.settings = { ...this.settings, ...data.settings };
    } catch (error) {
      console.error('Failed to load notification data:', error);
      this.notifications = [];
    }
  }

  saveData() {
    const data = {
      notifications: this.notifications,
      settings: this.settings,
      lastSaved: Date.now()
    };
    localStorage.setItem('game_notifications', JSON.stringify(data));
  }

  export() {
    return {
      notifications: this.notifications,
      settings: this.settings
    };
  }

  import(data) {
    if (data.notifications) this.notifications = data.notifications;
    if (data.settings) this.settings = { ...this.settings, ...data.settings };
    this.saveData();
  }
}

// Make it globally available
window.LocalNotificationManager = LocalNotificationManager;