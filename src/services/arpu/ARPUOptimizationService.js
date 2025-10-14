/**
 * ARPU Optimization Service
 * Backend service for maximizing Average Revenue Per User
 */

import { Logger } from '../../core/logger/index.js';
import { ServiceError } from '../../core/errors/ErrorHandler.js';

const logger = new Logger('ARPUOptimizationService');

class ARPUOptimizationService {
  constructor() {
    this.playerProfiles = new Map();
    this.revenueEvents = new Map();
    this.offerTemplates = new Map();
    this.subscriptionTiers = new Map();
    this.energyPacks = new Map();
    this.socialChallenges = new Map();
    
    this.initializeData();
  }

  initializeData() {
    // Initialize offer templates
    this.offerTemplates.set('starter_pack', {
      id: 'starter_pack',
      name: 'Starter Pack',
      basePrice: 4.99,
      baseDiscount: 0.8,
      targetSegments: ['new_players', 'low_value'],
      conditions: {
        max_level: 10,
        max_spent: 5,
        days_since_install: 7
      },
      rewards: {
        coins: 1000,
        gems: 50,
        energy: 20
      }
    });

    this.offerTemplates.set('comeback_pack', {
      id: 'comeback_pack',
      name: 'Welcome Back!',
      basePrice: 9.99,
      baseDiscount: 0.7,
      targetSegments: ['returning_players', 'churn_risk'],
      conditions: {
        days_since_last_play: 3,
        max_days_since_last_play: 30
      },
      rewards: {
        coins: 2000,
        gems: 100,
        energy: 50
      }
    });

    // Initialize subscription tiers
    this.subscriptionTiers.set('basic', {
      id: 'basic',
      name: 'Basic Pass',
      price: 4.99,
      duration: 30,
      benefits: [
        { type: 'energy_multiplier', value: 1.5, description: '1.5x Energy Regeneration' },
        { type: 'coins_multiplier', value: 1.2, description: '1.2x Coin Rewards' },
        { type: 'daily_bonus', value: 100, description: 'Daily 100 Coins' }
      ]
    });

    this.subscriptionTiers.set('premium', {
      id: 'premium',
      name: 'Premium Pass',
      price: 9.99,
      duration: 30,
      benefits: [
        { type: 'energy_multiplier', value: 2.0, description: '2x Energy Regeneration' },
        { type: 'coins_multiplier', value: 1.5, description: '1.5x Coin Rewards' },
        { type: 'gems_multiplier', value: 1.3, description: '1.3x Gem Rewards' },
        { type: 'daily_bonus', value: 200, description: 'Daily 200 Coins + 10 Gems' },
        { type: 'exclusive_items', value: 1, description: 'Exclusive Items Access' }
      ]
    });

    // Initialize energy packs
    this.energyPacks.set('energy_small', {
      id: 'energy_small',
      name: 'Energy Boost',
      energy: 10,
      cost: 5,
      costType: 'gems'
    });

    this.energyPacks.set('energy_medium', {
      id: 'energy_medium',
      name: 'Energy Surge',
      energy: 25,
      cost: 10,
      costType: 'gems'
    });

    this.energyPacks.set('energy_large', {
      id: 'energy_large',
      name: 'Energy Rush',
      energy: 50,
      cost: 18,
      costType: 'gems'
    });
  }

  /**
   * Generate personalized offers for a player
   */
  async generatePersonalizedOffers(playerId, playerProfile) {
    try {
      const offers = [];
      const playerSegment = this.determinePlayerSegment(playerProfile);
      
      for (const [templateId, template] of this.offerTemplates) {
        if (this.shouldShowOffer(template, playerProfile, playerSegment)) {
          const offer = this.createPersonalizedOffer(template, playerProfile, playerSegment);
          offers.push(offer);
        }
      }
      
      // Sort by discount (highest first)
      offers.sort((a, b) => b.discount - a.discount);
      
      logger.info(`Generated ${offers.length} personalized offers for player ${playerId}`);
      return offers;
    } catch (error) {
      logger.error('Failed to generate personalized offers', { error: error.message, playerId });
      throw new ServiceError('Failed to generate personalized offers', 'ARPUOptimizationService');
    }
  }

  /**
   * Determine player segment based on spending behavior
   */
  determinePlayerSegment(playerProfile) {
    const totalSpent = playerProfile.totalSpent || 0;
    const spendingThresholds = [0, 5, 25, 100, 500];
    const segments = ['non_payer', 'low_value', 'medium_value', 'high_value', 'whale'];
    
    for (let i = spendingThresholds.length - 1; i >= 0; i--) {
      if (totalSpent >= spendingThresholds[i]) {
        return segments[i];
      }
    }
    
    return segments[0]; // non_payer
  }

  /**
   * Check if offer should be shown to player
   */
  shouldShowOffer(template, playerProfile, playerSegment) {
    // Check target segments
    if (!template.targetSegments.includes(playerSegment)) {
      return false;
    }
    
    // Check conditions
    for (const [condition, value] of Object.entries(template.conditions)) {
      if (!this.evaluateCondition(condition, value, playerProfile)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Evaluate offer condition
   */
  evaluateCondition(conditionType, conditionValue, playerProfile) {
    switch (conditionType) {
      case 'max_level':
        return (playerProfile.level || 0) <= conditionValue;
      case 'min_level':
        return (playerProfile.level || 0) >= conditionValue;
      case 'max_spent':
        return (playerProfile.totalSpent || 0) <= conditionValue;
      case 'min_spent':
        return (playerProfile.totalSpent || 0) >= conditionValue;
      case 'days_since_install':
        const installDate = new Date(playerProfile.installDate || Date.now());
        const daysSinceInstall = (Date.now() - installDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceInstall <= conditionValue;
      case 'days_since_last_play':
        const lastPlayDate = new Date(playerProfile.lastPlayTime || Date.now());
        const daysSinceLastPlay = (Date.now() - lastPlayDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLastPlay >= conditionValue;
      case 'max_days_since_last_play':
        const lastPlayDate2 = new Date(playerProfile.lastPlayTime || Date.now());
        const daysSinceLastPlay2 = (Date.now() - lastPlayDate2.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLastPlay2 <= conditionValue;
      default:
        return true;
    }
  }

  /**
   * Create personalized offer
   */
  createPersonalizedOffer(template, playerProfile, playerSegment) {
    const personalizedPrice = this.calculatePersonalizedPrice(template, playerProfile, playerSegment);
    const personalizedDiscount = this.calculatePersonalizedDiscount(template, playerProfile, playerSegment);
    
    return {
      id: this.generateId(),
      templateId: template.id,
      name: template.name,
      originalPrice: template.basePrice,
      personalizedPrice: personalizedPrice,
      discount: personalizedDiscount,
      rewards: { ...template.rewards },
      playerId: playerProfile.playerId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      isActive: true,
      personalizationFactors: {
        playerSegment,
        totalSpent: playerProfile.totalSpent || 0,
        level: playerProfile.level || 0
      }
    };
  }

  /**
   * Calculate personalized price
   */
  calculatePersonalizedPrice(template, playerProfile, playerSegment) {
    let basePrice = template.basePrice;
    let multiplier = 1;
    
    // High-value players get higher prices
    if ((playerProfile.totalSpent || 0) > 100) {
      multiplier *= 1.2;
    }
    // Low-value players get lower prices
    else if ((playerProfile.totalSpent || 0) < 10) {
      multiplier *= 0.8;
    }
    
    // Churn risk players get discounts
    if (playerProfile.churnRisk > 0.7) {
      multiplier *= 0.7;
    }
    
    // New players get discounts
    if (playerSegment === 'new_players') {
      multiplier *= 0.6;
    }
    
    return basePrice * multiplier;
  }

  /**
   * Calculate personalized discount
   */
  calculatePersonalizedDiscount(template, playerProfile, playerSegment) {
    let baseDiscount = template.baseDiscount;
    let additionalDiscount = 0;
    
    // Churn risk players get extra discount
    if (playerProfile.churnRisk > 0.7) {
      additionalDiscount += 0.2;
    }
    
    // New players get extra discount
    if (playerSegment === 'new_players') {
      additionalDiscount += 0.1;
    }
    
    // Low-value players get extra discount
    if ((playerProfile.totalSpent || 0) < 10) {
      additionalDiscount += 0.1;
    }
    
    return Math.min(1, baseDiscount + additionalDiscount);
  }

  /**
   * Process offer purchase
   */
  async processOfferPurchase(offerId, playerId, amount) {
    try {
      // Track revenue event
      this.trackRevenue(playerId, amount, 'IAP', offerId);
      
      // Update player profile
      const profile = this.getPlayerProfile(playerId);
      profile.totalSpent = (profile.totalSpent || 0) + amount;
      profile.lastPurchaseTime = new Date().toISOString();
      profile.purchaseCount = (profile.purchaseCount || 0) + 1;
      
      this.playerProfiles.set(playerId, profile);
      
      logger.info(`Processed offer purchase`, { offerId, playerId, amount });
      
      return { success: true, offerId, amount };
    } catch (error) {
      logger.error('Failed to process offer purchase', { error: error.message, offerId, playerId });
      throw new ServiceError('Failed to process offer purchase', 'ARPUOptimizationService');
    }
  }

  /**
   * Track revenue event
   */
  trackRevenue(playerId, amount, source, itemId = '') {
    const revenueEvent = {
      id: this.generateId(),
      playerId,
      amount,
      source,
      itemId,
      timestamp: new Date().toISOString()
    };
    
    this.revenueEvents.set(revenueEvent.id, revenueEvent);
    
    logger.info('Revenue tracked', { playerId, amount, source, itemId });
  }

  /**
   * Get player profile
   */
  getPlayerProfile(playerId) {
    if (!this.playerProfiles.has(playerId)) {
      this.playerProfiles.set(playerId, {
        playerId,
        totalSpent: 0,
        purchaseCount: 0,
        lastPurchaseTime: null,
        installDate: new Date().toISOString(),
        lastPlayTime: new Date().toISOString(),
        level: 1,
        churnRisk: 0
      });
    }
    
    return this.playerProfiles.get(playerId);
  }

  /**
   * Update player profile
   */
  updatePlayerProfile(playerId, updates) {
    const profile = this.getPlayerProfile(playerId);
    Object.assign(profile, updates);
    this.playerProfiles.set(playerId, profile);
  }

  /**
   * Get ARPU statistics
   */
  getARPUStatistics() {
    const totalPlayers = this.playerProfiles.size;
    const payingPlayers = Array.from(this.playerProfiles.values()).filter(p => p.totalSpent > 0).length;
    const totalRevenue = Array.from(this.revenueEvents.values()).reduce((sum, e) => sum + e.amount, 0);
    
    return {
      totalPlayers,
      payingPlayers,
      totalRevenue,
      arpu: totalPlayers > 0 ? totalRevenue / totalPlayers : 0,
      arpuPaying: payingPlayers > 0 ? totalRevenue / payingPlayers : 0,
      conversionRate: totalPlayers > 0 ? (payingPlayers / totalPlayers) * 100 : 0,
      revenueBySource: this.getRevenueBySource(),
      segmentDistribution: this.getSegmentDistribution()
    };
  }

  /**
   * Get revenue by source
   */
  getRevenueBySource() {
    const revenueBySource = {};
    const totalRevenue = Array.from(this.revenueEvents.values()).reduce((sum, e) => sum + e.amount, 0);
    
    if (totalRevenue > 0) {
      for (const event of this.revenueEvents.values()) {
        if (!revenueBySource[event.source]) {
          revenueBySource[event.source] = 0;
        }
        revenueBySource[event.source] += event.amount;
      }
      
      // Convert to percentages
      for (const source in revenueBySource) {
        revenueBySource[source] = (revenueBySource[source] / totalRevenue) * 100;
      }
    }
    
    return revenueBySource;
  }

  /**
   * Get segment distribution
   */
  getSegmentDistribution() {
    const distribution = {};
    
    for (const profile of this.playerProfiles.values()) {
      const segment = this.determinePlayerSegment(profile);
      distribution[segment] = (distribution[segment] || 0) + 1;
    }
    
    return distribution;
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default ARPUOptimizationService;