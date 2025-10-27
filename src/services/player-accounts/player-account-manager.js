import { Logger } from '../../core/logger/index.js';
import { ServiceError } from '../../core/errors/ErrorHandler.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * Player Account Manager
 * Handles player accounts, authentication, and profile management
 */
class PlayerAccountManager {
  constructor() {
    this.logger = new Logger('PlayerAccountManager');
    
    // Account storage (in production, this would be in PostgreSQL)
    this.accounts = new Map(); // playerId -> account data
    this.sessions = new Map(); // sessionId -> session data
    this.deviceTokens = new Map(); // deviceId -> playerId
    
    // Account configuration
    this.config = {
      passwordMinLength: 8,
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      maxSessionsPerPlayer: 5,
      maxDevicesPerPlayer: 3,
      jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
      jwtExpiry: '24h'
    };
    
    this.initializeAccountManager();
  }

  /**
   * Initialize account manager
   */
  initializeAccountManager() {
    this.logger.info('Initializing Player Account Manager');
    
    // Cleanup expired sessions every hour
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60 * 60 * 1000);
  }

  /**
   * Create a new player account
   */
  async createAccount(accountData) {
    try {
      const { playerId, email, password, displayName, platform, deviceInfo } = accountData;

      // Validate required fields
      if (!playerId || !email || !password) {
        throw new ServiceError('Player ID, email, and password are required');
      }

      // Check if account already exists
      if (this.accounts.has(playerId)) {
        throw new ServiceError('Account already exists');
      }

      // Validate password strength
      if (password.length < this.config.passwordMinLength) {
        throw new ServiceError(`Password must be at least ${this.config.passwordMinLength} characters`);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create account
      const account = {
        playerId,
        email: email.toLowerCase(),
        password: hashedPassword,
        displayName: displayName || playerId,
        platform: platform || 'unknown',
        createdAt: Date.now(),
        lastLogin: null,
        isActive: true,
        isVerified: false,
        profile: {
          level: 1,
          xp: 0,
          totalPlayTime: 0,
          gamesPlayed: 0,
          highScore: 0,
          achievements: [],
          preferences: {
            language: 'en',
            theme: 'default',
            notifications: true,
            privacy: 'public'
          },
          statistics: {
            totalSessions: 0,
            averageSessionTime: 0,
            favoriteGameMode: 'classic',
            lastActive: Date.now()
          }
        },
        security: {
          twoFactorEnabled: false,
          loginAttempts: 0,
          lastFailedLogin: null,
          trustedDevices: [],
          securityQuestions: []
        },
        purchases: {
          totalSpent: 0,
          currency: 'USD',
          purchaseHistory: [],
          subscriptions: [],
          entitlements: []
        },
        social: {
          friends: [],
          blockedUsers: [],
          guildId: null,
          socialScore: 0
        }
      };

      this.accounts.set(playerId, account);

      this.logger.info(`Account created for player: ${playerId}`);
      
      return {
        success: true,
        account: this.getPublicAccountData(account),
        message: 'Account created successfully'
      };
    } catch (error) {
      this.logger.error('Failed to create account:', error);
      throw error;
    }
  }

  /**
   * Authenticate player
   */
  async authenticatePlayer(playerId, password, deviceInfo = {}) {
    try {
      const account = this.accounts.get(playerId);
      if (!account) {
        throw new ServiceError('Account not found');
      }

      if (!account.isActive) {
        throw new ServiceError('Account is deactivated');
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, account.password);
      if (!isValidPassword) {
        // Increment failed login attempts
        account.security.loginAttempts++;
        account.security.lastFailedLogin = Date.now();
        
        if (account.security.loginAttempts >= 5) {
          account.isActive = false;
          this.logger.warn(`Account locked due to failed login attempts: ${playerId}`);
          throw new ServiceError('Account locked due to multiple failed login attempts');
        }
        
        throw new ServiceError('Invalid password');
      }

      // Reset failed login attempts on successful login
      account.security.loginAttempts = 0;
      account.lastLogin = Date.now();
      account.profile.statistics.lastActive = Date.now();

      // Create session
      const session = await this.createSession(playerId, deviceInfo);

      this.logger.info(`Player authenticated: ${playerId}`);
      
      return {
        success: true,
        session,
        account: this.getPublicAccountData(account),
        message: 'Authentication successful'
      };
    } catch (error) {
      this.logger.error('Failed to authenticate player:', error);
      throw error;
    }
  }

  /**
   * Create a new session
   */
  async createSession(playerId, deviceInfo = {}) {
    try {
      const account = this.accounts.get(playerId);
      if (!account) {
        throw new ServiceError('Account not found');
      }

      // Check session limit
      const playerSessions = Array.from(this.sessions.values())
        .filter(session => session.playerId === playerId && session.isActive);
      
      if (playerSessions.length >= this.config.maxSessionsPerPlayer) {
        // Remove oldest session
        const oldestSession = playerSessions.sort((a, b) => a.createdAt - b.createdAt)[0];
        this.sessions.delete(oldestSession.sessionId);
      }

      const sessionId = uuidv4();
      const session = {
        sessionId,
        playerId,
        deviceInfo,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        isActive: true,
        ipAddress: deviceInfo.ipAddress || 'unknown',
        userAgent: deviceInfo.userAgent || 'unknown'
      };

      this.sessions.set(sessionId, session);

      // Generate JWT token
      const token = jwt.sign(
        { 
          playerId, 
          sessionId,
          type: 'player_session'
        },
        this.config.jwtSecret,
        { expiresIn: this.config.jwtExpiry }
      );

      return {
        sessionId,
        token,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        deviceInfo
      };
    } catch (error) {
      this.logger.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Validate session
   */
  async validateSession(sessionId, token) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session || !session.isActive) {
        throw new ServiceError('Invalid session');
      }

      // Check if session is expired
      if (Date.now() - session.lastActivity > this.config.sessionTimeout) {
        session.isActive = false;
        throw new ServiceError('Session expired');
      }

      // Verify JWT token
      try {
        const decoded = jwt.verify(token, this.config.jwtSecret);
        if (decoded.sessionId !== sessionId || decoded.playerId !== session.playerId) {
          throw new ServiceError('Invalid token');
        }
      } catch (jwtError) {
        throw new ServiceError('Invalid token');
      }

      // Update last activity
      session.lastActivity = Date.now();

      return {
        success: true,
        session,
        playerId: session.playerId
      };
    } catch (error) {
      this.logger.error('Failed to validate session:', error);
      throw error;
    }
  }

  /**
   * Get player account
   */
  async getAccount(playerId) {
    try {
      const account = this.accounts.get(playerId);
      if (!account) {
        throw new ServiceError('Account not found');
      }

      return {
        success: true,
        account: this.getPublicAccountData(account)
      };
    } catch (error) {
      this.logger.error('Failed to get account:', error);
      throw error;
    }
  }

  /**
   * Update player profile
   */
  async updateProfile(playerId, profileData) {
    try {
      const account = this.accounts.get(playerId);
      if (!account) {
        throw new ServiceError('Account not found');
      }

      // Update profile data
      if (profileData.displayName) {
        account.displayName = profileData.displayName;
      }

      if (profileData.preferences) {
        account.profile.preferences = {
          ...account.profile.preferences,
          ...profileData.preferences
        };
      }

      if (profileData.statistics) {
        account.profile.statistics = {
          ...account.profile.statistics,
          ...profileData.statistics
        };
      }

      this.logger.info(`Profile updated for player: ${playerId}`);
      
      return {
        success: true,
        account: this.getPublicAccountData(account),
        message: 'Profile updated successfully'
      };
    } catch (error) {
      this.logger.error('Failed to update profile:', error);
      throw error;
    }
  }

  /**
   * Update player statistics
   */
  async updateStatistics(playerId, statsData) {
    try {
      const account = this.accounts.get(playerId);
      if (!account) {
        throw new ServiceError('Account not found');
      }

      // Update statistics
      if (statsData.level !== undefined) {
        account.profile.level = Math.max(account.profile.level, statsData.level);
      }

      if (statsData.xp !== undefined) {
        account.profile.xp += statsData.xp;
      }

      if (statsData.totalPlayTime !== undefined) {
        account.profile.totalPlayTime += statsData.totalPlayTime;
      }

      if (statsData.gamesPlayed !== undefined) {
        account.profile.gamesPlayed += statsData.gamesPlayed;
      }

      if (statsData.highScore !== undefined) {
        account.profile.highScore = Math.max(account.profile.highScore, statsData.highScore);
      }

      if (statsData.achievements) {
        account.profile.achievements = [
          ...account.profile.achievements,
          ...statsData.achievements.filter(achievement => 
            !account.profile.achievements.some(a => a.id === achievement.id)
          )
        ];
      }

      // Update last active
      account.profile.statistics.lastActive = Date.now();

      return {
        success: true,
        account: this.getPublicAccountData(account),
        message: 'Statistics updated successfully'
      };
    } catch (error) {
      this.logger.error('Failed to update statistics:', error);
      throw error;
    }
  }

  /**
   * Add purchase to account
   */
  async addPurchase(playerId, purchaseData) {
    try {
      const account = this.accounts.get(playerId);
      if (!account) {
        throw new ServiceError('Account not found');
      }

      const purchase = {
        id: uuidv4(),
        productId: purchaseData.productId,
        productType: purchaseData.productType || 'item',
        amount: purchaseData.amount,
        currency: purchaseData.currency || 'USD',
        platform: purchaseData.platform || 'unknown',
        transactionId: purchaseData.transactionId,
        timestamp: Date.now(),
        status: 'completed'
      };

      // Add to purchase history
      account.purchases.purchaseHistory.push(purchase);
      account.purchases.totalSpent += purchase.amount;

      // Handle different product types
      if (purchaseData.productType === 'subscription') {
        account.purchases.subscriptions.push({
          ...purchase,
          status: 'active',
          expiresAt: purchaseData.expiresAt
        });
      } else if (purchaseData.productType === 'entitlement') {
        account.purchases.entitlements.push({
          ...purchase,
          status: 'active'
        });
      }

      this.logger.info(`Purchase added for player ${playerId}: ${purchase.productId}`);
      
      return {
        success: true,
        purchase,
        message: 'Purchase recorded successfully'
      };
    } catch (error) {
      this.logger.error('Failed to add purchase:', error);
      throw error;
    }
  }

  /**
   * Get player purchases
   */
  async getPurchases(playerId, filters = {}) {
    try {
      const account = this.accounts.get(playerId);
      if (!account) {
        throw new ServiceError('Account not found');
      }

      let purchases = account.purchases.purchaseHistory;

      // Apply filters
      if (filters.productType) {
        purchases = purchases.filter(p => p.productType === filters.productType);
      }

      if (filters.platform) {
        purchases = purchases.filter(p => p.platform === filters.platform);
      }

      if (filters.dateFrom) {
        purchases = purchases.filter(p => p.timestamp >= filters.dateFrom);
      }

      if (filters.dateTo) {
        purchases = purchases.filter(p => p.timestamp <= filters.dateTo);
      }

      // Sort by timestamp (newest first)
      purchases.sort((a, b) => b.timestamp - a.timestamp);

      return {
        success: true,
        purchases,
        totalSpent: account.purchases.totalSpent,
        currency: account.purchases.currency
      };
    } catch (error) {
      this.logger.error('Failed to get purchases:', error);
      throw error;
    }
  }

  /**
   * Check player entitlements
   */
  async getEntitlements(playerId) {
    try {
      const account = this.accounts.get(playerId);
      if (!account) {
        throw new ServiceError('Account not found');
      }

      const entitlements = {
        // Check active subscriptions
        subscriptions: account.purchases.subscriptions.filter(sub => 
          sub.status === 'active' && (!sub.expiresAt || sub.expiresAt > Date.now())
        ),
        
        // Check active entitlements
        entitlements: account.purchases.entitlements.filter(ent => 
          ent.status === 'active'
        ),
        
        // Check specific product purchases
        hasProduct: (productId) => {
          return account.purchases.purchaseHistory.some(p => 
            p.productId === productId && p.status === 'completed'
          );
        },
        
        // Check subscription status
        hasActiveSubscription: (subscriptionId) => {
          return account.purchases.subscriptions.some(sub => 
            sub.productId === subscriptionId && 
            sub.status === 'active' && 
            (!sub.expiresAt || sub.expiresAt > Date.now())
          );
        }
      };

      return {
        success: true,
        entitlements
      };
    } catch (error) {
      this.logger.error('Failed to get entitlements:', error);
      throw error;
    }
  }

  /**
   * Logout player
   */
  async logoutPlayer(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.isActive = false;
        this.logger.info(`Player logged out: ${session.playerId}`);
      }

      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      this.logger.error('Failed to logout player:', error);
      throw error;
    }
  }

  /**
   * Deactivate account
   */
  async deactivateAccount(playerId, reason = 'user_request') {
    try {
      const account = this.accounts.get(playerId);
      if (!account) {
        throw new ServiceError('Account not found');
      }

      account.isActive = false;
      account.deactivatedAt = Date.now();
      account.deactivationReason = reason;

      // Deactivate all sessions
      for (const session of this.sessions.values()) {
        if (session.playerId === playerId) {
          session.isActive = false;
        }
      }

      this.logger.info(`Account deactivated: ${playerId}, reason: ${reason}`);
      
      return {
        success: true,
        message: 'Account deactivated successfully'
      };
    } catch (error) {
      this.logger.error('Failed to deactivate account:', error);
      throw error;
    }
  }

  /**
   * Get public account data (without sensitive information)
   */
  getPublicAccountData(account) {
    return {
      playerId: account.playerId,
      email: account.email,
      displayName: account.displayName,
      platform: account.platform,
      createdAt: account.createdAt,
      lastLogin: account.lastLogin,
      isActive: account.isActive,
      isVerified: account.isVerified,
      profile: account.profile,
      social: account.social,
      purchases: {
        totalSpent: account.purchases.totalSpent,
        currency: account.purchases.currency,
        purchaseCount: account.purchases.purchaseHistory.length
      }
    };
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    const expiredSessions = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.config.sessionTimeout) {
        session.isActive = false;
        expiredSessions.push(sessionId);
      }
    }

    if (expiredSessions.length > 0) {
      this.logger.info(`Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  /**
   * Get account statistics
   */
  getAccountStatistics() {
    const totalAccounts = this.accounts.size;
    const activeAccounts = Array.from(this.accounts.values())
      .filter(account => account.isActive).length;
    const activeSessions = Array.from(this.sessions.values())
      .filter(session => session.isActive).length;

    return {
      totalAccounts,
      activeAccounts,
      activeSessions,
      totalSessions: this.sessions.size
    };
  }
}

export { PlayerAccountManager };