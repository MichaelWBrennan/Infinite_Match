#!/usr/bin/env node
/**
 * Cursor Secrets Manager
 * Provides secure access to secrets stored in Cursor account
 * Falls back to environment variables if Cursor is not available
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { Logger } from '../logger/index.js';

const logger = new Logger('CursorSecrets');

class CursorSecretsManager {
  constructor() {
    this.config = null;
    this.secrets = new Map();
    this.isCursorAvailable = false;
    this.initialized = false;
  }

  /**
   * Initialize the secrets manager
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Load configuration
      const configPath = join(process.cwd(), 'cursor-secrets-config.json');
      const configData = await readFile(configPath, 'utf-8');
      this.config = JSON.parse(configData);

      // Check if Cursor is available
      this.isCursorAvailable = this.checkCursorAvailability();

      logger.info('Cursor Secrets Manager initialized', {
        cursorAvailable: this.isCursorAvailable,
        configLoaded: !!this.config
      });

      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize Cursor Secrets Manager', { error: error.message });
      throw error;
    }
  }

  /**
   * Check if Cursor's secret API is available
   */
  checkCursorAvailability() {
    try {
      return typeof cursor !== 'undefined' && 
             typeof cursor.getSecret === 'function';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get a secret value from Cursor or environment
   * @param {string} secretName - Name of the secret to retrieve
   * @returns {Promise<string|null>} Secret value or null if not found
   */
  async getSecret(secretName) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Check cache first
    if (this.secrets.has(secretName)) {
      return this.secrets.get(secretName);
    }

    let value = null;

    try {
      // Try Cursor first if available
      if (this.isCursorAvailable) {
        value = await this.getSecretFromCursor(secretName);
        if (value) {
          logger.debug(`Retrieved secret from Cursor: ${secretName}`);
        }
      }

      // Fallback to environment variable
      if (!value) {
        value = await this.getSecretFromEnvironment(secretName);
        if (value) {
          logger.debug(`Retrieved secret from environment: ${secretName}`);
        }
      }

      // Use default value if configured
      if (!value && this.config?.secrets) {
        const secretConfig = this.findSecretConfig(secretName);
        if (secretConfig?.default) {
          value = secretConfig.default;
          logger.debug(`Using default value for secret: ${secretName}`);
        }
      }

      // Cache the value
      if (value) {
        this.secrets.set(secretName, value);
      }

      return value;
    } catch (error) {
      logger.error(`Failed to retrieve secret: ${secretName}`, { error: error.message });
      return null;
    }
  }

  /**
   * Get secret from Cursor's secret management
   */
  async getSecretFromCursor(secretName) {
    try {
      if (!this.isCursorAvailable) {
        return null;
      }

      const value = await cursor.getSecret(secretName);
      return value || null;
    } catch (error) {
      logger.warn(`Failed to get secret from Cursor: ${secretName}`, { error: error.message });
      return null;
    }
  }

  /**
   * Get secret from environment variables
   */
  async getSecretFromEnvironment(secretName) {
    return process.env[secretName] || null;
  }

  /**
   * Find secret configuration by name
   */
  findSecretConfig(secretName) {
    if (!this.config?.secrets) return null;

    for (const category of Object.values(this.config.secrets)) {
      for (const [key, config] of Object.entries(category)) {
        if (config.cursorKey === secretName || config.envKey === secretName) {
          return config;
        }
      }
    }
    return null;
  }

  /**
   * Get all Unity Cloud secrets
   */
  async getUnitySecrets() {
    const unitySecrets = {};
    const secretNames = [
      'UNITY_PROJECT_ID',
      'UNITY_ENV_ID',
      'UNITY_CLIENT_ID',
      'UNITY_CLIENT_SECRET',
      'UNITY_API_TOKEN',
      'UNITY_EMAIL',
      'UNITY_PASSWORD',
      'UNITY_ORG_ID'
    ];

    for (const secretName of secretNames) {
      unitySecrets[secretName] = await this.getSecret(secretName);
    }

    return unitySecrets;
  }

  /**
   * Validate required secrets
   */
  async validateRequiredSecrets() {
    if (!this.config?.validation?.requiredSecrets) {
      return { valid: true, missing: [] };
    }

    const missing = [];
    const requiredSecrets = this.config.validation.requiredSecrets;

    for (const secretName of requiredSecrets) {
      const value = await this.getSecret(secretName);
      if (!value) {
        missing.push(secretName);
      }
    }

    const valid = missing.length === 0;

    if (!valid) {
      logger.error('Required secrets are missing', { missing });
    } else {
      logger.info('All required secrets are available');
    }

    return { valid, missing };
  }

  /**
   * Get deployment configuration
   */
  async getDeploymentConfig() {
    const unitySecrets = await this.getUnitySecrets();
    const environment = await this.getSecret('DEPLOYMENT_ENVIRONMENT') || 'staging';

    return {
      ...unitySecrets,
      environment,
      apiEndpoints: this.config?.apiEndpoints || {}
    };
  }

  /**
   * Clear cached secrets (useful for testing)
   */
  clearCache() {
    this.secrets.clear();
    logger.debug('Secret cache cleared');
  }

  /**
   * Get configuration info
   */
  getConfigInfo() {
    return {
      initialized: this.initialized,
      cursorAvailable: this.isCursorAvailable,
      configLoaded: !!this.config,
      cachedSecrets: Array.from(this.secrets.keys())
    };
  }
}

// Export singleton instance
export const cursorSecrets = new CursorSecretsManager();

// Export class for testing
export { CursorSecretsManager };