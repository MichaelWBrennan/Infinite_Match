/**
 * Unity Services Integration
 * Centralized Unity Cloud Services API client
 */

import { AppConfig } from 'core/config/index.js';
import { Logger } from 'core/logger/index.js';

const logger = new Logger('UnityService');

class UnityService {
  constructor() {
    this.projectId = AppConfig.unity.projectId;
    this.environmentId = AppConfig.unity.environmentId;
    this.clientId = AppConfig.unity.clientId;
    this.clientSecret = AppConfig.unity.clientSecret;
    this.baseUrl = 'https://services.api.unity.com';
    this.accessToken = null;
  }

  /**
   * Authenticate with Unity Services
   */
  async authenticate() {
    try {
      const authUrl = `${this.baseUrl}/oauth/token`;
      const authData = {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'economy inventory cloudcode remoteconfig',
      };

      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(authData),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;

      logger.info('Unity authentication successful');
      return true;
    } catch (error) {
      logger.error('Unity authentication failed', { error: error.message });
      return false;
    }
  }

  /**
   * Make authenticated request to Unity API
   */
  async makeRequest(endpoint, options = {}) {
    // Ensure we have a valid access token
    if (!this.accessToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error('Failed to authenticate with Unity Services');
      }
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, re-authenticate and retry once
          this.accessToken = null;
          const reAuthenticated = await this.authenticate();
          if (!reAuthenticated) {
            throw new Error('Failed to re-authenticate with Unity Services');
          }

          // Retry with new token
          const retryHeaders = {
            ...headers,
            Authorization: `Bearer ${this.accessToken}`,
          };

          const retryResponse = await fetch(url, {
            ...options,
            headers: retryHeaders,
          });

          if (!retryResponse.ok) {
            throw new Error(
              `API request failed after re-authentication: ${retryResponse.status}`
            );
          }

          return await retryResponse.json();
        }
        throw new Error(`API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Unity API request failed', {
        endpoint,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Economy Service Methods
   */
  async createCurrency(currencyData) {
    const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/currencies`;
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(currencyData),
    });
  }

  async createInventoryItem(itemData) {
    const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/inventory-items`;
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  async createCatalogItem(catalogData) {
    const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/catalog-items`;
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(catalogData),
    });
  }

  async getCurrencies() {
    const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/currencies`;
    return this.makeRequest(endpoint);
  }

  async getInventoryItems() {
    const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/inventory-items`;
    return this.makeRequest(endpoint);
  }

  async getCatalogItems() {
    const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/catalog-items`;
    return this.makeRequest(endpoint);
  }

  /**
   * Cloud Code Service Methods
   */
  async deployCloudCodeFunction(functionData) {
    const endpoint = `/cloudcode/v1/projects/${this.projectId}/environments/${this.environmentId}/functions`;
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(functionData),
    });
  }

  async getCloudCodeFunctions() {
    const endpoint = `/cloudcode/v1/projects/${this.projectId}/environments/${this.environmentId}/functions`;
    return this.makeRequest(endpoint);
  }

  /**
   * Remote Config Service Methods
   */
  async updateRemoteConfig(configData) {
    const endpoint = `/remote-config/v1/projects/${this.projectId}/environments/${this.environmentId}/configs`;
    return this.makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(configData),
    });
  }

  async getRemoteConfig() {
    const endpoint = `/remote-config/v1/projects/${this.projectId}/environments/${this.environmentId}/configs`;
    return this.makeRequest(endpoint);
  }

  /**
   * Batch operations for efficiency
   */
  async deployEconomyData(economyData) {
    const results = {
      currencies: [],
      inventory: [],
      catalog: [],
      errors: [],
    };

    try {
      // Deploy currencies
      if (economyData.currencies?.length > 0) {
        for (const currency of economyData.currencies) {
          try {
            const result = await this.createCurrency(currency);
            results.currencies.push(result);
            logger.info(`Created currency: ${currency.id}`);
          } catch (error) {
            results.errors.push({
              type: 'currency',
              id: currency.id,
              error: error.message,
            });
            logger.error(`Failed to create currency: ${currency.id}`, {
              error: error.message,
            });
          }
        }
      }

      // Deploy inventory items
      if (economyData.inventory?.length > 0) {
        for (const item of economyData.inventory) {
          try {
            const result = await this.createInventoryItem(item);
            results.inventory.push(result);
            logger.info(`Created inventory item: ${item.id}`);
          } catch (error) {
            results.errors.push({
              type: 'inventory',
              id: item.id,
              error: error.message,
            });
            logger.error(`Failed to create inventory item: ${item.id}`, {
              error: error.message,
            });
          }
        }
      }

      // Deploy catalog items
      if (economyData.catalog?.length > 0) {
        for (const item of economyData.catalog) {
          try {
            const result = await this.createCatalogItem(item);
            results.catalog.push(result);
            logger.info(`Created catalog item: ${item.id}`);
          } catch (error) {
            results.errors.push({
              type: 'catalog',
              id: item.id,
              error: error.message,
            });
            logger.error(`Failed to create catalog item: ${item.id}`, {
              error: error.message,
            });
          }
        }
      }

      return results;
    } catch (error) {
      logger.error('Economy data deployment failed', { error: error.message });
      throw error;
    }
  }
}

export default UnityService;
