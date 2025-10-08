/**
 * Unity Services Integration
 * Centralized Unity Cloud Services API client
 */

import { AppConfig } from '../../core/config/index.js';
import { Logger } from '../../core/logger/index.js';

// Polyfill for fetch and URLSearchParams in Node.js
const fetch = globalThis.fetch || require('node-fetch');
const URLSearchParams =
  globalThis.URLSearchParams || require('url').URLSearchParams;

const logger = new Logger('UnityService');

class UnityService {
  constructor(cacheManager) {
    this.projectId = AppConfig.unity.projectId;
    this.environmentId = AppConfig.unity.environmentId;
    this.clientId = AppConfig.unity.clientId;
    this.clientSecret = AppConfig.unity.clientSecret;
    this.baseUrl = 'https://services.api.unity.com';
    this.accessToken = null;
    this.cacheManager = cacheManager;
  }

  /**
   * Authenticate with Unity Services
   * Note: For Cloud Code deployment, we don't need OAuth authentication
   * The Cloud Code functions are deployed directly to Unity's servers
   */
  async authenticate() {
    try {
      // Check if we have the required credentials
      if (!this.clientId || !this.clientSecret) {
        logger.warn(
          'Unity OAuth credentials not configured - using Cloud Code mode'
        );
        // For Cloud Code, we don't need authentication
        // The functions are deployed directly to Unity's servers
        this.accessToken = 'cloud-code-mode';
        return true;
      }

      // Try OAuth authentication for direct API access
      const authUrl = 'https://services.api.unity.com/oauth/token';
      const authData = {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'economy inventory cloudcode remoteconfig',
      };

      logger.info('Attempting Unity Services OAuth authentication', {
        projectId: this.projectId,
        environmentId: this.environmentId,
        clientId: this.clientId ? '***SET***' : 'NOT SET',
        clientSecret: this.clientSecret ? '***SET***' : 'NOT SET',
      });

      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(authData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.warn(
          'Unity OAuth authentication failed, falling back to Cloud Code mode',
          {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
          }
        );
        // Fall back to Cloud Code mode
        this.accessToken = 'cloud-code-mode';
        return true;
      }

      const data = await response.json();
      this.accessToken = data.access_token;

      logger.info('Unity OAuth authentication successful', {
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        scope: data.scope,
      });
      return true;
    } catch (error) {
      logger.warn('Unity OAuth authentication failed, using Cloud Code mode', {
        error: error.message,
      });
      // Fall back to Cloud Code mode
      this.accessToken = 'cloud-code-mode';
      return true;
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
   * Uses Unity Cloud Services API with fallback to browser automation
   */
  async createCurrency(currencyData) {
    try {
      // Try Unity Cloud Services API first
      if (this.accessToken && this.accessToken !== 'cloud-code-mode') {
        const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/currencies`;
        const result = await this.makeRequest(endpoint, {
          method: 'POST',
          body: JSON.stringify(currencyData),
        });
        logger.info(`Currency created via API: ${currencyData.id}`);
        return result;
      }
    } catch (error) {
      logger.warn(`API creation failed for currency ${currencyData.id}, trying browser automation: ${error.message}`);
    }

    // Fallback to browser automation
    try {
      const result = await this.createCurrencyViaBrowser(currencyData);
      logger.info(`Currency created via browser automation: ${currencyData.id}`);
      return result;
    } catch (error) {
      logger.error(`Failed to create currency ${currencyData.id}: ${error.message}`);
      throw error;
    }
  }

  async createInventoryItem(itemData) {
    try {
      // Try Unity Cloud Services API first
      if (this.accessToken && this.accessToken !== 'cloud-code-mode') {
        const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/inventory-items`;
        const result = await this.makeRequest(endpoint, {
          method: 'POST',
          body: JSON.stringify(itemData),
        });
        logger.info(`Inventory item created via API: ${itemData.id}`);
        return result;
      }
    } catch (error) {
      logger.warn(`API creation failed for inventory item ${itemData.id}, trying browser automation: ${error.message}`);
    }

    // Fallback to browser automation
    try {
      const result = await this.createInventoryItemViaBrowser(itemData);
      logger.info(`Inventory item created via browser automation: ${itemData.id}`);
      return result;
    } catch (error) {
      logger.error(`Failed to create inventory item ${itemData.id}: ${error.message}`);
      throw error;
    }
  }

  async createCatalogItem(catalogData) {
    try {
      // Try Unity Cloud Services API first
      if (this.accessToken && this.accessToken !== 'cloud-code-mode') {
        const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/catalog-items`;
        const result = await this.makeRequest(endpoint, {
          method: 'POST',
          body: JSON.stringify(catalogData),
        });
        logger.info(`Catalog item created via API: ${catalogData.id}`);
        return result;
      }
    } catch (error) {
      logger.warn(`API creation failed for catalog item ${catalogData.id}, trying browser automation: ${error.message}`);
    }

    // Fallback to browser automation
    try {
      const result = await this.createCatalogItemViaBrowser(catalogData);
      logger.info(`Catalog item created via browser automation: ${catalogData.id}`);
      return result;
    } catch (error) {
      logger.error(`Failed to create catalog item ${catalogData.id}: ${error.message}`);
      throw error;
    }
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

  /**
   * Browser Automation Methods
   * Fallback when Unity Cloud Services API is not available
   */
  async createCurrencyViaBrowser(currencyData) {
    const { spawn } = await import('child_process');
    const { promisify } = await import('util');
    const exec = promisify((await import('child_process')).exec);

    try {
      // Use Python browser automation script
      const scriptPath = './scripts/unity/unity_browser_automation.py';
      const command = `python3 ${scriptPath} --action=create_currency --data='${JSON.stringify(currencyData)}'`;
      
      const { stdout, stderr } = await exec(command);
      
      if (stderr) {
        logger.warn(`Browser automation stderr: ${stderr}`);
      }

      const result = JSON.parse(stdout);
      return {
        id: currencyData.id,
        name: currencyData.name,
        type: currencyData.type,
        status: 'created',
        method: 'browser-automation',
        ...result
      };
    } catch (error) {
      logger.error(`Browser automation failed for currency ${currencyData.id}: ${error.message}`);
      throw error;
    }
  }

  async createInventoryItemViaBrowser(itemData) {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      const scriptPath = './scripts/unity/unity_browser_automation.py';
      const command = `python3 ${scriptPath} --action=create_inventory_item --data='${JSON.stringify(itemData)}'`;
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        logger.warn(`Browser automation stderr: ${stderr}`);
      }

      const result = JSON.parse(stdout);
      return {
        id: itemData.id,
        name: itemData.name,
        type: itemData.type,
        status: 'created',
        method: 'browser-automation',
        ...result
      };
    } catch (error) {
      logger.error(`Browser automation failed for inventory item ${itemData.id}: ${error.message}`);
      throw error;
    }
  }

  async createCatalogItemViaBrowser(catalogData) {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      const scriptPath = './scripts/unity/unity_browser_automation.py';
      const command = `python3 ${scriptPath} --action=create_catalog_item --data='${JSON.stringify(catalogData)}'`;
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        logger.warn(`Browser automation stderr: ${stderr}`);
      }

      const result = JSON.parse(stdout);
      return {
        id: catalogData.id,
        name: catalogData.name,
        type: catalogData.type,
        status: 'created',
        method: 'browser-automation',
        ...result
      };
    } catch (error) {
      logger.error(`Browser automation failed for catalog item ${catalogData.id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Unity CLI Integration
   * Alternative method using Unity CLI if available
   */
  async deployViaUnityCLI() {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      logger.info('Attempting Unity CLI deployment...');
      
      // Check if Unity CLI is available
      try {
        await execAsync('unity --version');
      } catch (error) {
        logger.info('Unity CLI not found, installing...');
        await execAsync('npm install -g @unity-services/cli@latest');
      }

      // Deploy using Unity CLI
      const command = `unity services deploy --project-id=${this.projectId} --environment-id=${this.environmentId}`;
      const { stdout, stderr } = await execAsync(command);
      
      logger.info('Unity CLI deployment completed', { stdout, stderr });
      return { success: true, method: 'unity-cli', output: stdout };
    } catch (error) {
      logger.error(`Unity CLI deployment failed: ${error.message}`);
      throw error;
    }
  }
}

export default UnityService;
