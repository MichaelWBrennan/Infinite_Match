/**
 * Local IAP System - Simulates in-app purchases without external APIs
 */

class LocalIAPSystem {
  constructor() {
    this.products = [];
    this.purchases = [];
    this.promotions = [];
    this.subscriptions = [];
    this.currencyRates = {
      USD: 1.0,
      EUR: 0.85,
      GBP: 0.73,
      JPY: 110.0,
      CAD: 1.25,
      AUD: 1.35
    };
  }

  async initialize() {
    console.log('💳 Initializing Local IAP System...');
    
    this.loadData();
    this.createDefaultProducts();
    this.createDefaultPromotions();
    this.createDefaultSubscriptions();
    
    console.log('✅ Local IAP System initialized');
  }

  createDefaultProducts() {
    this.products = [
      {
        id: 'coins_100',
        name: '100 Coins',
        description: 'Small coin pack',
        type: 'consumable',
        price: 0.99,
        currency: 'USD',
        rewards: { coins: 100 },
        category: 'currency',
        popular: false,
        featured: false,
        available: true
      },
      {
        id: 'coins_500',
        name: '500 Coins',
        description: 'Medium coin pack',
        type: 'consumable',
        price: 4.99,
        currency: 'USD',
        rewards: { coins: 500 },
        category: 'currency',
        popular: true,
        featured: false,
        available: true
      },
      {
        id: 'coins_1000',
        name: '1000 Coins',
        description: 'Large coin pack',
        type: 'consumable',
        price: 9.99,
        currency: 'USD',
        rewards: { coins: 1000 },
        category: 'currency',
        popular: false,
        featured: true,
        available: true
      },
      {
        id: 'gems_50',
        name: '50 Gems',
        description: 'Small gem pack',
        type: 'consumable',
        price: 1.99,
        currency: 'USD',
        rewards: { gems: 50 },
        category: 'currency',
        popular: false,
        featured: false,
        available: true
      },
      {
        id: 'gems_200',
        name: '200 Gems',
        description: 'Medium gem pack',
        type: 'consumable',
        price: 7.99,
        currency: 'USD',
        rewards: { gems: 200 },
        category: 'currency',
        popular: true,
        featured: false,
        available: true
      },
      {
        id: 'gems_500',
        name: '500 Gems',
        description: 'Large gem pack',
        type: 'consumable',
        price: 19.99,
        currency: 'USD',
        rewards: { gems: 500 },
        category: 'currency',
        popular: false,
        featured: true,
        available: true
      },
      {
        id: 'energy_boost',
        name: 'Energy Boost',
        description: 'Instant energy refill',
        type: 'consumable',
        price: 0.99,
        currency: 'USD',
        rewards: { energy: 30 },
        category: 'boost',
        popular: false,
        featured: false,
        available: true
      },
      {
        id: 'starter_pack',
        name: 'Starter Pack',
        description: 'Perfect for new players',
        type: 'non_consumable',
        price: 4.99,
        currency: 'USD',
        rewards: { 
          coins: 1000, 
          gems: 100, 
          powerups: { bomb: 10, rainbow: 5, lightning: 5 },
          energy: 50
        },
        category: 'bundle',
        popular: true,
        featured: true,
        available: true
      },
      {
        id: 'premium_pack',
        name: 'Premium Pack',
        description: 'Best value for money',
        type: 'non_consumable',
        price: 19.99,
        currency: 'USD',
        rewards: { 
          coins: 5000, 
          gems: 500, 
          powerups: { bomb: 50, rainbow: 25, lightning: 25 },
          energy: 100,
          special: 'premium_badge'
        },
        category: 'bundle',
        popular: false,
        featured: true,
        available: true
      },
      {
        id: 'castle_theme',
        name: 'Castle Theme',
        description: 'Beautiful castle background theme',
        type: 'non_consumable',
        price: 2.99,
        currency: 'USD',
        rewards: { theme: 'castle' },
        category: 'cosmetic',
        popular: false,
        featured: false,
        available: true
      },
      {
        id: 'space_theme',
        name: 'Space Theme',
        description: 'Cosmic space background theme',
        type: 'non_consumable',
        price: 4.99,
        currency: 'USD',
        rewards: { theme: 'space' },
        category: 'cosmetic',
        popular: false,
        featured: false,
        available: true
      }
    ];

    this.saveData();
  }

  createDefaultPromotions() {
    this.promotions = [
      {
        id: 'first_purchase_bonus',
        name: 'First Purchase Bonus',
        description: 'Get 50% bonus on your first purchase!',
        type: 'percentage',
        value: 50,
        applicableProducts: ['coins_100', 'coins_500', 'coins_1000'],
        startTime: null,
        endTime: null,
        maxUses: 1,
        usedCount: 0,
        active: true
      },
      {
        id: 'weekend_discount',
        name: 'Weekend Discount',
        description: '20% off all gem packs this weekend!',
        type: 'percentage',
        value: 20,
        applicableProducts: ['gems_50', 'gems_200', 'gems_500'],
        startTime: this.getNextWeekendStart(),
        endTime: this.getNextWeekendEnd(),
        maxUses: 999,
        usedCount: 0,
        active: true
      },
      {
        id: 'bundle_special',
        name: 'Bundle Special',
        description: 'Buy any bundle and get free energy!',
        type: 'bonus',
        value: { energy: 25 },
        applicableProducts: ['starter_pack', 'premium_pack'],
        startTime: null,
        endTime: null,
        maxUses: 999,
        usedCount: 0,
        active: true
      }
    ];

    this.saveData();
  }

  createDefaultSubscriptions() {
    this.subscriptions = [
      {
        id: 'premium_monthly',
        name: 'Premium Monthly',
        description: 'Premium benefits for one month',
        type: 'subscription',
        price: 9.99,
        currency: 'USD',
        duration: 30 * 24 * 60 * 60 * 1000, // 30 days
        benefits: {
          dailyCoins: 100,
          dailyGems: 10,
          energyRegen: 2.0, // 2x energy regeneration
          adFree: true,
          exclusiveThemes: true,
          prioritySupport: true
        },
        popular: true,
        featured: true,
        available: true
      },
      {
        id: 'premium_yearly',
        name: 'Premium Yearly',
        description: 'Premium benefits for one year (2 months free!)',
        type: 'subscription',
        price: 99.99,
        currency: 'USD',
        duration: 365 * 24 * 60 * 60 * 1000, // 365 days
        benefits: {
          dailyCoins: 150,
          dailyGems: 15,
          energyRegen: 2.5, // 2.5x energy regeneration
          adFree: true,
          exclusiveThemes: true,
          prioritySupport: true,
          specialBadge: true
        },
        popular: false,
        featured: true,
        available: true
      }
    ];

    this.saveData();
  }

  getNextWeekendStart() {
    const now = new Date();
    const saturday = new Date(now);
    saturday.setDate(now.getDate() + (6 - now.getDay()));
    saturday.setHours(0, 0, 0, 0);
    return saturday.getTime();
  }

  getNextWeekendEnd() {
    const start = this.getNextWeekendStart();
    return start + (2 * 24 * 60 * 60 * 1000); // 2 days later
  }

  // ==================== PRODUCT MANAGEMENT ====================
  
  getProducts(category = null) {
    let products = this.products.filter(p => p.available);
    
    if (category) {
      products = products.filter(p => p.category === category);
    }
    
    return products;
  }

  getProduct(productId) {
    return this.products.find(p => p.id === productId);
  }

  getFeaturedProducts() {
    return this.products.filter(p => p.available && p.featured);
  }

  getPopularProducts() {
    return this.products.filter(p => p.available && p.popular);
  }

  // ==================== PURCHASE PROCESSING ====================
  
  async purchaseProduct(productId, paymentMethod = 'simulated') {
    const product = this.getProduct(productId);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    if (!product.available) {
      return { success: false, error: 'Product not available' };
    }

    // Check if already purchased (for non-consumable items)
    if (product.type === 'non_consumable') {
      const existingPurchase = this.purchases.find(p => 
        p.productId === productId && p.status === 'completed'
      );
      
      if (existingPurchase) {
        return { success: false, error: 'Product already purchased' };
      }
    }

    // Apply promotions
    const finalPrice = this.applyPromotions(product);
    const promotion = this.getApplicablePromotion(productId);

    // Simulate payment processing
    const paymentResult = await this.processPayment(product, finalPrice, paymentMethod);
    
    if (!paymentResult.success) {
      return paymentResult;
    }

    // Create purchase record
    const purchase = {
      id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productId: productId,
      product: product,
      originalPrice: product.price,
      finalPrice: finalPrice,
      currency: product.currency,
      paymentMethod: paymentMethod,
      promotion: promotion,
      rewards: product.rewards,
      status: 'completed',
      timestamp: Date.now(),
      transactionId: paymentResult.transactionId
    };

    this.purchases.push(purchase);
    this.saveData();

    // Apply rewards
    this.applyRewards(product.rewards);

    // Update promotion usage
    if (promotion) {
      promotion.usedCount++;
    }

    this.emitPurchaseCompleted(purchase);

    return { 
      success: true, 
      purchase: purchase,
      rewards: product.rewards
    };
  }

  async processPayment(product, amount, paymentMethod) {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate payment success (95% success rate)
    if (Math.random() < 0.95) {
      return {
        success: true,
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: amount,
        currency: product.currency
      };
    } else {
      return {
        success: false,
        error: 'Payment failed',
        code: 'PAYMENT_FAILED'
      };
    }
  }

  applyPromotions(product) {
    const promotion = this.getApplicablePromotion(product.id);
    if (!promotion) {
      return product.price;
    }

    switch (promotion.type) {
      case 'percentage':
        return product.price * (1 - promotion.value / 100);
      case 'fixed':
        return Math.max(0, product.price - promotion.value);
      default:
        return product.price;
    }
  }

  getApplicablePromotion(productId) {
    const now = Date.now();
    
    return this.promotions.find(promotion => 
      promotion.active &&
      promotion.applicableProducts.includes(productId) &&
      (!promotion.startTime || now >= promotion.startTime) &&
      (!promotion.endTime || now <= promotion.endTime) &&
      promotion.usedCount < promotion.maxUses
    );
  }

  applyRewards(rewards) {
    if (typeof window !== 'undefined' && window.gameAPI) {
      Object.entries(rewards).forEach(([type, amount]) => {
        if (type === 'coins' || type === 'gems' || type === 'energy') {
          window.gameAPI.addCurrency(type, amount, 'purchase');
        } else if (type === 'powerups') {
          Object.entries(amount).forEach(([powerupType, powerupAmount]) => {
            window.gameAPI.addItem(powerupType, powerupAmount, 'purchase');
          });
        } else if (type === 'theme') {
          window.gameAPI.addItem(`${amount}_theme`, 1, 'purchase');
        }
      });
    }
  }

  // ==================== SUBSCRIPTION MANAGEMENT ====================
  
  getSubscriptions() {
    return this.subscriptions.filter(s => s.available);
  }

  getSubscription(subscriptionId) {
    return this.subscriptions.find(s => s.id === subscriptionId);
  }

  async purchaseSubscription(subscriptionId, paymentMethod = 'simulated') {
    const subscription = this.getSubscription(subscriptionId);
    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    // Check if already subscribed
    const existingSubscription = this.purchases.find(p => 
      p.productId === subscriptionId && 
      p.status === 'active' &&
      p.type === 'subscription'
    );
    
    if (existingSubscription) {
      return { success: false, error: 'Already subscribed' };
    }

    // Process payment
    const paymentResult = await this.processPayment(subscription, subscription.price, paymentMethod);
    
    if (!paymentResult.success) {
      return paymentResult;
    }

    // Create subscription record
    const purchase = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productId: subscriptionId,
      product: subscription,
      price: subscription.price,
      currency: subscription.currency,
      paymentMethod: paymentMethod,
      type: 'subscription',
      status: 'active',
      startTime: Date.now(),
      endTime: Date.now() + subscription.duration,
      benefits: subscription.benefits,
      timestamp: Date.now(),
      transactionId: paymentResult.transactionId
    };

    this.purchases.push(purchase);
    this.saveData();

    this.emitSubscriptionActivated(purchase);

    return { 
      success: true, 
      subscription: purchase,
      benefits: subscription.benefits
    };
  }

  getActiveSubscriptions() {
    const now = Date.now();
    return this.purchases.filter(p => 
      p.type === 'subscription' && 
      p.status === 'active' && 
      p.endTime > now
    );
  }

  checkSubscriptionBenefits() {
    const activeSubscriptions = this.getActiveSubscriptions();
    const benefits = {
      dailyCoins: 0,
      dailyGems: 0,
      energyRegen: 1.0,
      adFree: false,
      exclusiveThemes: false,
      prioritySupport: false,
      specialBadge: false
    };

    activeSubscriptions.forEach(sub => {
      Object.entries(sub.benefits).forEach(([key, value]) => {
        if (typeof value === 'number') {
          benefits[key] = Math.max(benefits[key], value);
        } else if (typeof value === 'boolean') {
          benefits[key] = benefits[key] || value;
        }
      });
    });

    return benefits;
  }

  // ==================== PURCHASE HISTORY ====================
  
  getPurchaseHistory(limit = 50) {
    return this.purchases
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  getPurchasesByProduct(productId) {
    return this.purchases.filter(p => p.productId === productId);
  }

  getTotalSpent() {
    return this.purchases
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.finalPrice, 0);
  }

  // ==================== CURRENCY CONVERSION ====================
  
  convertPrice(price, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return price;
    
    const fromRate = this.currencyRates[fromCurrency] || 1.0;
    const toRate = this.currencyRates[toCurrency] || 1.0;
    
    return (price / fromRate) * toRate;
  }

  getLocalizedPrice(productId, currency = 'USD') {
    const product = this.getProduct(productId);
    if (!product) return null;
    
    const convertedPrice = this.convertPrice(product.price, product.currency, currency);
    return {
      amount: convertedPrice,
      currency: currency,
      formatted: this.formatPrice(convertedPrice, currency)
    };
  }

  formatPrice(amount, currency) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // ==================== EVENT EMISSIONS ====================
  
  emitPurchaseCompleted(purchase) {
    if (typeof window !== 'undefined' && window.gameAPI) {
      window.gameAPI.emit('purchase_completed', purchase);
    }
  }

  emitSubscriptionActivated(subscription) {
    if (typeof window !== 'undefined' && window.gameAPI) {
      window.gameAPI.emit('subscription_activated', subscription);
    }
  }

  // ==================== UTILITY METHODS ====================
  
  loadData() {
    try {
      const data = JSON.parse(localStorage.getItem('game_iap') || '{}');
      this.products = data.products || [];
      this.purchases = data.purchases || [];
      this.promotions = data.promotions || [];
      this.subscriptions = data.subscriptions || [];
    } catch (error) {
      console.error('Failed to load IAP data:', error);
      this.products = [];
      this.purchases = [];
      this.promotions = [];
      this.subscriptions = [];
    }
  }

  saveData() {
    const data = {
      products: this.products,
      purchases: this.purchases,
      promotions: this.promotions,
      subscriptions: this.subscriptions,
      lastSaved: Date.now()
    };
    localStorage.setItem('game_iap', JSON.stringify(data));
  }

  export() {
    return {
      products: this.products,
      purchases: this.purchases,
      promotions: this.promotions,
      subscriptions: this.subscriptions
    };
  }

  import(data) {
    if (data.products) this.products = data.products;
    if (data.purchases) this.purchases = data.purchases;
    if (data.promotions) this.promotions = data.promotions;
    if (data.subscriptions) this.subscriptions = data.subscriptions;
    this.saveData();
  }
}

// Make it globally available
window.LocalIAPSystem = LocalIAPSystem;