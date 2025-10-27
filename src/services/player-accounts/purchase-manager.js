import { Logger } from '../../core/logger/index.js';
import { ServiceError } from '../../core/errors/ErrorHandler.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Purchase Manager
 * Handles in-game purchases, subscriptions, and entitlements
 */
class PurchaseManager {
  constructor(accountManager) {
    this.logger = new Logger('PurchaseManager');
    this.accountManager = accountManager;
    
    // Purchase configuration
    this.config = {
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'],
      defaultCurrency: 'USD',
      maxPurchaseAmount: 1000, // $1000 max per purchase
      refundWindow: 7 * 24 * 60 * 60 * 1000, // 7 days
      subscriptionGracePeriod: 3 * 24 * 60 * 60 * 1000 // 3 days
    };
    
    // Product catalog
    this.productCatalog = this.initializeProductCatalog();
    
    // Purchase validation rules
    this.validationRules = this.initializeValidationRules();
    
    this.initializePurchaseManager();
  }

  /**
   * Initialize purchase manager
   */
  initializePurchaseManager() {
    this.logger.info('Initializing Purchase Manager');
    
    // Process subscription renewals every hour
    setInterval(() => {
      this.processSubscriptionRenewals();
    }, 60 * 60 * 1000);
    
    // Cleanup expired purchases every day
    setInterval(() => {
      this.cleanupExpiredPurchases();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Initialize product catalog
   */
  initializeProductCatalog() {
    return {
      // Currency packs
      currency_packs: {
        'coins_100': {
          id: 'coins_100',
          name: '100 Coins',
          type: 'currency',
          price: 0.99,
          currency: 'USD',
          rewards: { coins: 100 },
          description: 'Small coin pack for casual players',
          category: 'currency',
          isActive: true
        },
        'coins_500': {
          id: 'coins_500',
          name: '500 Coins',
          type: 'currency',
          price: 4.99,
          currency: 'USD',
          rewards: { coins: 500 },
          description: 'Medium coin pack with bonus',
          category: 'currency',
          isActive: true
        },
        'coins_1000': {
          id: 'coins_1000',
          name: '1000 Coins',
          type: 'currency',
          price: 9.99,
          currency: 'USD',
          rewards: { coins: 1000, bonus: 100 },
          description: 'Large coin pack with 10% bonus',
          category: 'currency',
          isActive: true
        },
        'gems_50': {
          id: 'gems_50',
          name: '50 Gems',
          type: 'currency',
          price: 1.99,
          currency: 'USD',
          rewards: { gems: 50 },
          description: 'Premium currency for special items',
          category: 'currency',
          isActive: true
        },
        'gems_200': {
          id: 'gems_200',
          name: '200 Gems',
          type: 'currency',
          price: 7.99,
          currency: 'USD',
          rewards: { gems: 200, bonus: 20 },
          description: 'Premium currency with bonus',
          category: 'currency',
          isActive: true
        }
      },
      
      // Power-ups and boosters
      powerups: {
        'extra_moves': {
          id: 'extra_moves',
          name: 'Extra Moves',
          type: 'powerup',
          price: 0.99,
          currency: 'USD',
          rewards: { extra_moves: 5 },
          description: 'Add 5 extra moves to your current level',
          category: 'powerup',
          isActive: true,
          consumable: true
        },
        'bomb_boost': {
          id: 'bomb_boost',
          name: 'Bomb Boost',
          type: 'powerup',
          price: 1.99,
          currency: 'USD',
          rewards: { bomb_boost: 3 },
          description: 'Add 3 bomb power-ups to your inventory',
          category: 'powerup',
          isActive: true,
          consumable: true
        },
        'rainbow_boost': {
          id: 'rainbow_boost',
          name: 'Rainbow Boost',
          type: 'powerup',
          price: 2.99,
          currency: 'USD',
          rewards: { rainbow_boost: 2 },
          description: 'Add 2 rainbow power-ups to your inventory',
          category: 'powerup',
          isActive: true,
          consumable: true
        }
      },
      
      // Subscriptions
      subscriptions: {
        'premium_monthly': {
          id: 'premium_monthly',
          name: 'Premium Monthly',
          type: 'subscription',
          price: 9.99,
          currency: 'USD',
          duration: 30 * 24 * 60 * 60 * 1000, // 30 days
          rewards: {
            daily_coins: 100,
            daily_gems: 10,
            ad_free: true,
            exclusive_themes: true,
            priority_support: true
          },
          description: 'Monthly premium subscription with daily rewards',
          category: 'subscription',
          isActive: true,
          recurring: true
        },
        'premium_yearly': {
          id: 'premium_yearly',
          name: 'Premium Yearly',
          type: 'subscription',
          price: 99.99,
          currency: 'USD',
          duration: 365 * 24 * 60 * 60 * 1000, // 365 days
          rewards: {
            daily_coins: 150,
            daily_gems: 15,
            ad_free: true,
            exclusive_themes: true,
            priority_support: true,
            bonus_gems: 500
          },
          description: 'Yearly premium subscription with 2 months free',
          category: 'subscription',
          isActive: true,
          recurring: true
        }
      },
      
      // Entitlements
      entitlements: {
        'remove_ads': {
          id: 'remove_ads',
          name: 'Remove Ads',
          type: 'entitlement',
          price: 4.99,
          currency: 'USD',
          rewards: { ad_free: true },
          description: 'Remove all advertisements permanently',
          category: 'entitlement',
          isActive: true,
          permanent: true
        },
        'unlock_all_themes': {
          id: 'unlock_all_themes',
          name: 'All Themes Pack',
          type: 'entitlement',
          price: 7.99,
          currency: 'USD',
          rewards: { all_themes: true },
          description: 'Unlock all available themes',
          category: 'entitlement',
          isActive: true,
          permanent: true
        }
      }
    };
  }

  /**
   * Initialize validation rules
   */
  initializeValidationRules() {
    return {
      // Age restrictions
      ageRestrictions: {
        'coins_100': 13,
        'coins_500': 13,
        'coins_1000': 13,
        'gems_50': 13,
        'gems_200': 13,
        'premium_monthly': 18,
        'premium_yearly': 18
      },
      
      // Purchase limits
      purchaseLimits: {
        'coins_100': { daily: 10, weekly: 50 },
        'coins_500': { daily: 5, weekly: 20 },
        'coins_1000': { daily: 3, weekly: 10 },
        'gems_50': { daily: 20, weekly: 100 },
        'gems_200': { daily: 10, weekly: 50 }
      },
      
      // Regional restrictions
      regionalRestrictions: {
        'premium_monthly': ['US', 'CA', 'GB', 'AU', 'DE', 'FR'],
        'premium_yearly': ['US', 'CA', 'GB', 'AU', 'DE', 'FR']
      }
    };
  }

  /**
   * Process a purchase
   */
  async processPurchase(playerId, productId, paymentData) {
    try {
      // Get player account
      const accountResult = await this.accountManager.getAccount(playerId);
      if (!accountResult.success) {
        throw new ServiceError('Player account not found');
      }

      // Get product information
      const product = this.getProduct(productId);
      if (!product) {
        throw new ServiceError('Product not found');
      }

      // Validate purchase
      const validation = await this.validatePurchase(playerId, product, paymentData);
      if (!validation.valid) {
        throw new ServiceError(validation.error);
      }

      // Process payment
      const paymentResult = await this.processPayment(product, paymentData);
      if (!paymentResult.success) {
        throw new ServiceError('Payment processing failed');
      }

      // Create purchase record
      const purchase = {
        id: uuidv4(),
        productId: product.id,
        productType: product.type,
        amount: product.price,
        currency: product.currency,
        platform: paymentData.platform || 'unknown',
        transactionId: paymentResult.transactionId,
        timestamp: Date.now(),
        status: 'completed',
        paymentMethod: paymentData.paymentMethod || 'unknown',
        region: paymentData.region || 'unknown'
      };

      // Add to player account
      await this.accountManager.addPurchase(playerId, purchase);

      // Grant rewards
      await this.grantRewards(playerId, product.rewards, purchase);

      // Track analytics
      await this.trackPurchaseAnalytics(playerId, purchase, product);

      this.logger.info(`Purchase processed: ${productId} for player ${playerId}`);
      
      return {
        success: true,
        purchase,
        rewards: product.rewards,
        message: 'Purchase completed successfully'
      };
    } catch (error) {
      this.logger.error('Failed to process purchase:', error);
      throw error;
    }
  }

  /**
   * Get product information
   */
  getProduct(productId) {
    // Search in all product categories
    for (const category of Object.values(this.productCatalog)) {
      if (category[productId]) {
        return category[productId];
      }
    }
    return null;
  }

  /**
   * Validate purchase
   */
  async validatePurchase(playerId, product, paymentData) {
    try {
      // Check if product is active
      if (!product.isActive) {
        return { valid: false, error: 'Product is not available' };
      }

      // Check age restrictions
      if (this.validationRules.ageRestrictions[product.id]) {
        const minAge = this.validationRules.ageRestrictions[product.id];
        if (paymentData.age && paymentData.age < minAge) {
          return { valid: false, error: 'Age restriction not met' };
        }
      }

      // Check purchase limits
      if (this.validationRules.purchaseLimits[product.id]) {
        const limits = this.validationRules.purchaseLimits[product.id];
        const playerPurchases = await this.getPlayerPurchases(playerId, {
          productId: product.id,
          dateFrom: Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
        });
        
        if (playerPurchases.length >= limits.daily) {
          return { valid: false, error: 'Daily purchase limit reached' };
        }
      }

      // Check regional restrictions
      if (this.validationRules.regionalRestrictions[product.id]) {
        const allowedRegions = this.validationRules.regionalRestrictions[product.id];
        if (paymentData.region && !allowedRegions.includes(paymentData.region)) {
          return { valid: false, error: 'Product not available in your region' };
        }
      }

      // Check maximum purchase amount
      if (product.price > this.config.maxPurchaseAmount) {
        return { valid: false, error: 'Purchase amount exceeds maximum limit' };
      }

      return { valid: true };
    } catch (error) {
      this.logger.error('Failed to validate purchase:', error);
      return { valid: false, error: 'Validation failed' };
    }
  }

  /**
   * Process payment
   */
  async processPayment(product, paymentData) {
    try {
      // In a real implementation, this would integrate with payment processors
      // For now, we'll simulate payment processing
      
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate payment success (95% success rate)
      const success = Math.random() > 0.05;
      
      if (!success) {
        return {
          success: false,
          error: 'Payment processing failed',
          transactionId: null
        };
      }

      return {
        success: true,
        transactionId,
        amount: product.price,
        currency: product.currency
      };
    } catch (error) {
      this.logger.error('Failed to process payment:', error);
      return {
        success: false,
        error: 'Payment processing failed',
        transactionId: null
      };
    }
  }

  /**
   * Grant rewards to player
   */
  async grantRewards(playerId, rewards, purchase) {
    try {
      const account = await this.accountManager.getAccount(playerId);
      if (!account.success) {
        throw new ServiceError('Player account not found');
      }

      // Process different types of rewards
      for (const [rewardType, rewardValue] of Object.entries(rewards)) {
        switch (rewardType) {
          case 'coins':
            await this.grantCurrency(playerId, 'coins', rewardValue);
            break;
          case 'gems':
            await this.grantCurrency(playerId, 'gems', rewardValue);
            break;
          case 'extra_moves':
            await this.grantPowerUp(playerId, 'extra_moves', rewardValue);
            break;
          case 'bomb_boost':
            await this.grantPowerUp(playerId, 'bomb_boost', rewardValue);
            break;
          case 'rainbow_boost':
            await this.grantPowerUp(playerId, 'rainbow_boost', rewardValue);
            break;
          case 'ad_free':
            await this.grantEntitlement(playerId, 'ad_free', true);
            break;
          case 'all_themes':
            await this.grantEntitlement(playerId, 'all_themes', true);
            break;
          case 'daily_coins':
            await this.grantDailyReward(playerId, 'coins', rewardValue);
            break;
          case 'daily_gems':
            await this.grantDailyReward(playerId, 'gems', rewardValue);
            break;
        }
      }

      this.logger.info(`Rewards granted to player ${playerId}:`, rewards);
    } catch (error) {
      this.logger.error('Failed to grant rewards:', error);
      throw error;
    }
  }

  /**
   * Grant currency to player
   */
  async grantCurrency(playerId, currencyType, amount) {
    // This would integrate with your economy system
    this.logger.info(`Granted ${amount} ${currencyType} to player ${playerId}`);
  }

  /**
   * Grant power-up to player
   */
  async grantPowerUp(playerId, powerUpType, amount) {
    // This would integrate with your inventory system
    this.logger.info(`Granted ${amount} ${powerUpType} to player ${playerId}`);
  }

  /**
   * Grant entitlement to player
   */
  async grantEntitlement(playerId, entitlementType, value) {
    // This would integrate with your entitlements system
    this.logger.info(`Granted ${entitlementType} to player ${playerId}`);
  }

  /**
   * Grant daily reward to player
   */
  async grantDailyReward(playerId, rewardType, amount) {
    // This would integrate with your daily reward system
    this.logger.info(`Granted daily ${amount} ${rewardType} to player ${playerId}`);
  }

  /**
   * Get player purchases
   */
  async getPlayerPurchases(playerId, filters = {}) {
    try {
      const result = await this.accountManager.getPurchases(playerId, filters);
      return result.purchases;
    } catch (error) {
      this.logger.error('Failed to get player purchases:', error);
      return [];
    }
  }

  /**
   * Process subscription renewals
   */
  async processSubscriptionRenewals() {
    try {
      // This would check for subscriptions that need renewal
      // and process automatic renewals
      this.logger.info('Processing subscription renewals');
    } catch (error) {
      this.logger.error('Failed to process subscription renewals:', error);
    }
  }

  /**
   * Cleanup expired purchases
   */
  async cleanupExpiredPurchases() {
    try {
      // This would clean up expired purchase data
      this.logger.info('Cleaning up expired purchases');
    } catch (error) {
      this.logger.error('Failed to cleanup expired purchases:', error);
    }
  }

  /**
   * Track purchase analytics
   */
  async trackPurchaseAnalytics(playerId, purchase, product) {
    try {
      // This would integrate with your analytics system
      const analyticsData = {
        event: 'purchase_completed',
        playerId,
        productId: product.id,
        productType: product.type,
        amount: purchase.amount,
        currency: purchase.currency,
        platform: purchase.platform,
        timestamp: purchase.timestamp
      };

      this.logger.info('Purchase analytics tracked:', analyticsData);
    } catch (error) {
      this.logger.error('Failed to track purchase analytics:', error);
    }
  }

  /**
   * Get product catalog
   */
  getProductCatalog(category = null) {
    if (category) {
      return this.productCatalog[category] || {};
    }
    return this.productCatalog;
  }

  /**
   * Get purchase statistics
   */
  getPurchaseStatistics() {
    return {
      totalProducts: Object.values(this.productCatalog).reduce(
        (total, category) => total + Object.keys(category).length, 0
      ),
      activeProducts: Object.values(this.productCatalog).reduce(
        (total, category) => total + Object.values(category).filter(p => p.isActive).length, 0
      ),
      categories: Object.keys(this.productCatalog),
      supportedCurrencies: this.config.supportedCurrencies
    };
  }
}

export { PurchaseManager };