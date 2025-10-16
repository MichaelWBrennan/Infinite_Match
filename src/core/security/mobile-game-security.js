/**
 * Mobile Game Security Module
 * Specialized security for mobile game applications
 */

import crypto from 'crypto';
import { Logger } from '../logger/index.js';

const logger = new Logger('MobileGameSecurity');

export class MobileGameSecurity {
  constructor() {
    this.cheatDetection = new Map();
    this.deviceFingerprints = new Map();
    this.suspiciousPlayers = new Map();
  }

  /**
   * Generate device fingerprint for mobile client
   * @param {Object} deviceInfo - Device information from client
   * @returns {string} Device fingerprint
   */
  generateDeviceFingerprint(deviceInfo) {
    const fingerprintData = {
      platform: deviceInfo.platform || 'unknown',
      deviceModel: deviceInfo.deviceModel || 'unknown',
      osVersion: deviceInfo.osVersion || 'unknown',
      appVersion: deviceInfo.appVersion || 'unknown',
      screenResolution: deviceInfo.screenResolution || 'unknown',
      timezone: deviceInfo.timezone || 'unknown',
      language: deviceInfo.language || 'unknown',
    };

    const fingerprint = crypto
      .createHash('sha256')
      .update(JSON.stringify(fingerprintData))
      .digest('hex');

    this.deviceFingerprints.set(fingerprint, {
      ...fingerprintData,
      firstSeen: new Date(),
      lastSeen: new Date(),
      requestCount: 1,
    });

    logger.info('Device fingerprint generated', {
      fingerprint: fingerprint.substring(0, 8) + '...',
      platform: fingerprintData.platform,
    });

    return fingerprint;
  }

  /**
   * Validate device fingerprint
   * @param {string} fingerprint - Device fingerprint
   * @param {Object} deviceInfo - Current device info
   * @returns {boolean} Whether fingerprint is valid
   */
  validateDeviceFingerprint(fingerprint, deviceInfo) {
    const storedInfo = this.deviceFingerprints.get(fingerprint);
    if (!storedInfo) {
      logger.warn('Unknown device fingerprint', {
        fingerprint: fingerprint.substring(0, 8) + '...',
      });
      return false;
    }

    // Update last seen and request count
    storedInfo.lastSeen = new Date();
    storedInfo.requestCount++;

    // Check for suspicious changes
    const suspiciousChanges = this.detectSuspiciousDeviceChanges(storedInfo, deviceInfo);
    if (suspiciousChanges.length > 0) {
      logger.warn('Suspicious device changes detected', {
        fingerprint: fingerprint.substring(0, 8) + '...',
        changes: suspiciousChanges,
      });
      return false;
    }

    return true;
  }

  /**
   * Detect suspicious device changes
   * @param {Object} storedInfo - Stored device info
   * @param {Object} currentInfo - Current device info
   * @returns {Array} List of suspicious changes
   */
  detectSuspiciousDeviceChanges(storedInfo, currentInfo) {
    const suspiciousChanges = [];

    // Check for impossible platform changes
    if (storedInfo.platform !== currentInfo.platform) {
      suspiciousChanges.push('platform_change');
    }

    // Check for device model changes (unusual)
    if (storedInfo.deviceModel !== currentInfo.deviceModel) {
      suspiciousChanges.push('device_model_change');
    }

    // Check for OS version downgrade (suspicious)
    if (this.isVersionDowngrade(storedInfo.osVersion, currentInfo.osVersion)) {
      suspiciousChanges.push('os_version_downgrade');
    }

    return suspiciousChanges;
  }

  /**
   * Check if version is a downgrade
   * @param {string} oldVersion - Old version
   * @param {string} newVersion - New version
   * @returns {boolean} Whether it's a downgrade
   */
  isVersionDowngrade(oldVersion, newVersion) {
    // Simple version comparison (can be enhanced)
    const oldParts = oldVersion.split('.').map(Number);
    const newParts = newVersion.split('.').map(Number);

    for (let i = 0; i < Math.min(oldParts.length, newParts.length); i++) {
      if (newParts[i] < oldParts[i]) return true;
      if (newParts[i] > oldParts[i]) return false;
    }

    return false;
  }

  /**
   * Detect potential cheating in game actions
   * @param {string} playerId - Player ID
   * @param {Object} gameAction - Game action data
   * @returns {Object} Cheat detection result
   */
  detectCheating(playerId, gameAction) {
    const cheatScore = {
      total: 0,
      reasons: [],
      suspicious: false,
    };

    // Check for impossible scores
    if (gameAction.score && gameAction.score > 1000000) {
      cheatScore.total += 30;
      cheatScore.reasons.push('impossibly_high_score');
    }

    // Check for impossible completion times
    if (gameAction.completionTime && gameAction.completionTime < 1000) {
      cheatScore.total += 25;
      cheatScore.reasons.push('impossibly_fast_completion');
    }

    // Check for impossible moves
    if (gameAction.moves && gameAction.moves < 5 && gameAction.score > 10000) {
      cheatScore.total += 35;
      cheatScore.reasons.push('impossible_moves_to_score_ratio');
    }

    // Check for rapid actions (bot-like behavior)
    const recentActions = this.getRecentActions(playerId);
    if (recentActions.length > 10) {
      const timeSpan =
        recentActions[0].timestamp - recentActions[recentActions.length - 1].timestamp;
      if (timeSpan < 10000) {
        // 10 seconds
        cheatScore.total += 20;
        cheatScore.reasons.push('rapid_actions');
      }
    }

    // Check for impossible currency gains
    if (gameAction.currencyGained && gameAction.currencyGained > 10000) {
      cheatScore.total += 40;
      cheatScore.reasons.push('impossible_currency_gain');
    }

    cheatScore.suspicious = cheatScore.total > 50;

    if (cheatScore.suspicious) {
      this.recordSuspiciousActivity(playerId, gameAction, cheatScore);
      logger.warn('Cheating detected', {
        playerId,
        score: cheatScore.total,
        reasons: cheatScore.reasons,
      });
    }

    return cheatScore;
  }

  /**
   * Get recent actions for a player
   * @param {string} playerId - Player ID
   * @returns {Array} Recent actions
   */
  getRecentActions(playerId) {
    // In production, this would query a database
    return this.cheatDetection.get(playerId) || [];
  }

  /**
   * Record suspicious activity
   * @param {string} playerId - Player ID
   * @param {Object} gameAction - Game action
   * @param {Object} cheatScore - Cheat detection score
   */
  recordSuspiciousActivity(playerId, gameAction, cheatScore) {
    if (!this.suspiciousPlayers.has(playerId)) {
      this.suspiciousPlayers.set(playerId, {
        firstDetection: new Date(),
        totalDetections: 0,
        actions: [],
      });
    }

    const playerData = this.suspiciousPlayers.get(playerId);
    playerData.totalDetections++;
    playerData.actions.push({
      action: gameAction,
      cheatScore,
      timestamp: new Date(),
    });

    // Store recent actions for cheat detection
    if (!this.cheatDetection.has(playerId)) {
      this.cheatDetection.set(playerId, []);
    }

    const recentActions = this.cheatDetection.get(playerId);
    recentActions.unshift({
      ...gameAction,
      timestamp: Date.now(),
    });

    // Keep only last 20 actions
    if (recentActions.length > 20) {
      recentActions.splice(20);
    }
  }

  /**
   * Validate in-app purchase
   * @param {Object} purchaseData - Purchase data
   * @returns {Object} Validation result
   */
  validatePurchase(purchaseData) {
    const validation = {
      valid: true,
      reasons: [],
      suspicious: false,
    };

    // Check for duplicate purchases
    if (this.isDuplicatePurchase(purchaseData)) {
      validation.valid = false;
      validation.reasons.push('duplicate_purchase');
    }

    // Check for impossible purchase amounts
    if (purchaseData.amount && purchaseData.amount > 1000) {
      validation.suspicious = true;
      validation.reasons.push('high_purchase_amount');
    }

    // Check for rapid purchases
    if (this.hasRapidPurchases(purchaseData.playerId)) {
      validation.suspicious = true;
      validation.reasons.push('rapid_purchases');
    }

    return validation;
  }

  /**
   * Check for duplicate purchases
   * @param {Object} purchaseData - Purchase data
   * @returns {boolean} Whether purchase is duplicate
   */
  isDuplicatePurchase(purchaseData) {
    // In production, this would check against a database
    const purchaseKey = `${purchaseData.playerId}_${purchaseData.transactionId}`;
    return this.duplicatePurchases && this.duplicatePurchases.has(purchaseKey);
  }

  /**
   * Check for rapid purchases
   * @param {string} playerId - Player ID
   * @returns {boolean} Whether player has rapid purchases
   */
  hasRapidPurchases(playerId) {
    // In production, this would query purchase history
    return false; // Placeholder
  }

  /**
   * Validate cloud save data
   * @param {string} playerId - Player ID
   * @param {Object} saveData - Save data
   * @returns {Object} Validation result
   */
  validateCloudSave(playerId, saveData) {
    const validation = {
      valid: true,
      reasons: [],
      suspicious: false,
    };

    // Check for impossible progress
    if (saveData.level && saveData.level > 1000) {
      validation.suspicious = true;
      validation.reasons.push('impossible_level');
    }

    // Check for impossible currency amounts
    if (saveData.currency && saveData.currency > 1000000) {
      validation.suspicious = true;
      validation.reasons.push('impossible_currency_amount');
    }

    // Check for save data tampering
    if (this.isSaveDataTampered(saveData)) {
      validation.valid = false;
      validation.reasons.push('save_data_tampered');
    }

    return validation;
  }

  /**
   * Check if save data has been tampered with
   * @param {Object} saveData - Save data
   * @returns {boolean} Whether data is tampered
   */
  isSaveDataTampered(saveData) {
    // Check for missing required fields
    const requiredFields = ['level', 'currency', 'inventory', 'timestamp'];
    for (const field of requiredFields) {
      if (!saveData.hasOwnProperty(field)) {
        return true;
      }
    }

    // Check for invalid data types
    if (typeof saveData.level !== 'number' || saveData.level < 0) {
      return true;
    }

    if (typeof saveData.currency !== 'number' || saveData.currency < 0) {
      return true;
    }

    return false;
  }

  /**
   * Get security statistics for mobile game
   * @returns {Object} Security statistics
   */
  getMobileGameSecurityStats() {
    return {
      totalDevices: this.deviceFingerprints.size,
      suspiciousPlayers: this.suspiciousPlayers.size,
      cheatDetections: Array.from(this.cheatDetection.values()).reduce(
        (sum, actions) => sum + actions.length,
        0,
      ),
      timestamp: new Date().toISOString(),
    };
  }
}

export const mobileGameSecurity = new MobileGameSecurity();
export default mobileGameSecurity;
