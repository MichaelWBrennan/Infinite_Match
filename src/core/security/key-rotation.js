/**
 * Key Rotation System
 * Provides automatic key rotation for enhanced security
 */

import crypto from 'crypto';
import { Logger } from '../logger/index.js';
import { AppConfig } from '../config/index.js';

const logger = new Logger('KeyRotation');

export class KeyRotationManager {
  constructor() {
    this.rotationInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.keyHistory = new Map();
    this.currentKeys = new Map();
    this.rotationCallbacks = new Map();

    // Initialize with current keys
    this.initializeKeys();

    // Start rotation timer
    this.startRotationTimer();
  }

  /**
   * Initialize current keys from configuration
   */
  initializeKeys() {
    const jwtSecret = AppConfig.security.jwt.secret;
    const encryptionKey = AppConfig.security.encryption.key;

    this.currentKeys.set('jwt', {
      key: jwtSecret,
      createdAt: new Date(),
      version: 1,
      active: true,
    });

    this.currentKeys.set('encryption', {
      key: encryptionKey,
      createdAt: new Date(),
      version: 1,
      active: true,
    });

    logger.info('Keys initialized', {
      jwtVersion: 1,
      encryptionVersion: 1,
    });
  }

  /**
   * Generate a new secure key
   * @param {string} type - Type of key (jwt, encryption, etc.)
   * @param {number} length - Key length in bytes
   * @returns {string} Generated key
   */
  generateKey(type, length = 32) {
    const key = crypto.randomBytes(length).toString('hex');

    logger.info('New key generated', {
      type,
      length: key.length,
    });

    return key;
  }

  /**
   * Rotate a specific key
   * @param {string} keyType - Type of key to rotate
   * @returns {Object} Rotation result
   */
  rotateKey(keyType) {
    try {
      const currentKey = this.currentKeys.get(keyType);
      if (!currentKey) {
        throw new Error(`Key type ${keyType} not found`);
      }

      // Generate new key
      const newKey = this.generateKey(keyType);
      const newVersion = currentKey.version + 1;

      // Store old key in history
      this.keyHistory.set(`${keyType}_${currentKey.version}`, {
        ...currentKey,
        active: false,
        rotatedAt: new Date(),
      });

      // Update current key
      this.currentKeys.set(keyType, {
        key: newKey,
        createdAt: new Date(),
        version: newVersion,
        active: true,
      });

      // Notify callbacks
      this.notifyKeyRotation(keyType, newKey, newVersion);

      logger.info('Key rotated successfully', {
        keyType,
        version: newVersion,
        previousVersion: currentKey.version,
      });

      return {
        success: true,
        keyType,
        newVersion,
        previousVersion: currentKey.version,
      };
    } catch (error) {
      logger.error('Key rotation failed', {
        error: error.message,
        keyType,
      });

      return {
        success: false,
        error: error.message,
        keyType,
      };
    }
  }

  /**
   * Rotate all keys
   * @returns {Object} Rotation results
   */
  rotateAllKeys() {
    const results = {};

    for (const keyType of this.currentKeys.keys()) {
      results[keyType] = this.rotateKey(keyType);
    }

    logger.info('All keys rotated', {
      results: Object.keys(results).length,
    });

    return results;
  }

  /**
   * Get current key for a type
   * @param {string} keyType - Type of key
   * @returns {string|null} Current key or null
   */
  getCurrentKey(keyType) {
    const keyData = this.currentKeys.get(keyType);
    return keyData ? keyData.key : null;
  }

  /**
   * Get key by version
   * @param {string} keyType - Type of key
   * @param {number} version - Key version
   * @returns {string|null} Key or null
   */
  getKeyByVersion(keyType, version) {
    const keyData = this.keyHistory.get(`${keyType}_${version}`);
    return keyData ? keyData.key : null;
  }

  /**
   * Register callback for key rotation events
   * @param {string} keyType - Type of key
   * @param {Function} callback - Callback function
   */
  onKeyRotation(keyType, callback) {
    if (!this.rotationCallbacks.has(keyType)) {
      this.rotationCallbacks.set(keyType, []);
    }

    this.rotationCallbacks.get(keyType).push(callback);

    logger.info('Key rotation callback registered', { keyType });
  }

  /**
   * Notify callbacks of key rotation
   * @param {string} keyType - Type of key
   * @param {string} newKey - New key
   * @param {number} version - New version
   */
  notifyKeyRotation(keyType, newKey, version) {
    const callbacks = this.rotationCallbacks.get(keyType) || [];

    callbacks.forEach((callback) => {
      try {
        callback(keyType, newKey, version);
      } catch (error) {
        logger.error('Key rotation callback failed', {
          error: error.message,
          keyType,
        });
      }
    });
  }

  /**
   * Start automatic key rotation timer
   */
  startRotationTimer() {
    setInterval(() => {
      this.rotateAllKeys();
    }, this.rotationInterval);

    logger.info('Key rotation timer started', {
      interval: this.rotationInterval,
    });
  }

  /**
   * Get rotation statistics
   * @returns {Object} Rotation statistics
   */
  getRotationStats() {
    const stats = {
      totalKeys: this.currentKeys.size,
      totalHistory: this.keyHistory.size,
      rotationInterval: this.rotationInterval,
      keys: {},
    };

    for (const [keyType, keyData] of this.currentKeys.entries()) {
      stats.keys[keyType] = {
        version: keyData.version,
        createdAt: keyData.createdAt,
        active: keyData.active,
      };
    }

    return stats;
  }

  /**
   * Clean up old keys from history
   * @param {number} maxAge - Maximum age in milliseconds
   */
  cleanupOldKeys(maxAge = 7 * 24 * 60 * 60 * 1000) {
    // 7 days
    const cutoff = new Date(Date.now() - maxAge);
    let cleaned = 0;

    for (const [key, keyData] of this.keyHistory.entries()) {
      if (keyData.rotatedAt < cutoff) {
        this.keyHistory.delete(key);
        cleaned++;
      }
    }

    logger.info('Old keys cleaned up', { cleaned });
  }

  /**
   * Force immediate rotation of all keys
   * @returns {Object} Rotation results
   */
  forceRotation() {
    logger.info('Forcing immediate key rotation');
    return this.rotateAllKeys();
  }

  /**
   * Get key rotation schedule
   * @returns {Object} Next rotation information
   */
  getNextRotation() {
    const nextRotation = new Date(Date.now() + this.rotationInterval);

    return {
      nextRotation,
      interval: this.rotationInterval,
      timeUntilRotation: nextRotation.getTime() - Date.now(),
    };
  }
}

export const keyRotationManager = new KeyRotationManager();
export default keyRotationManager;
