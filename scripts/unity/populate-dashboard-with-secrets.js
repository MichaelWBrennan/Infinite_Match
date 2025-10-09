#!/usr/bin/env node
/**
 * Populate Unity Cloud Dashboard using Cursor Secrets
 * This script fetches secrets from Cursor and uses them to populate the dashboard
 */

import { Logger } from '../../src/core/logger/index.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

const logger = new Logger('UnityDashboardPopulator');

class UnityDashboardPopulator {
  constructor() {
    this.secrets = {};
    this.baseUrl = 'https://services.api.unity.com';
    this.accessToken = null;
  }

  async fetchSecrets() {
    try {
      logger.info('Fetching Unity Cloud secrets from Cursor...');
      
      const unitySecrets = [
        "UNITY_EMAIL",
        "UNITY_PASSWORD", 
        "UNITY_ORG_ID",
        "UNITY_PROJECT_ID",
        "UNITY_ENV_ID",
        "UNITY_API_TOKEN",
        "UNITY_CLIENT_SECRET",
        "UNITY_CLIENT_ID"
      ];

      for (const name of unitySecrets) {
        try {
          this.secrets[name] = await cursor.getSecret(name);
          if (this.secrets[name]) {
            logger.info(`Secret ${name} fetched successfully`);
          }
        } catch (err) {
          logger.error(`Failed to retrieve secret "${name}":`, err);
          this.secrets[name] = null;
        }
      }

      // Check if we have the required secrets
      if (!this.secrets.UNITY_CLIENT_ID || !this.secrets.UNITY_CLIENT_SECRET) {
        throw new Error('UNITY_CLIENT_ID and UNITY_CLIENT_SECRET are required');
      }

      logger.info('Unity Cloud secrets fetched successfully', {
        projectId: this.secrets.UNITY_PROJECT_ID,
        environmentId: this.secrets.UNITY_ENV_ID,
        hasClientId: !!this.secrets.UNITY_CLIENT_ID,
        hasClientSecret: !!this.secrets.UNITY_CLIENT_SECRET
      });

      return this.secrets;
    } catch (error) {
      logger.error('Failed to fetch Unity Cloud secrets', { error: error.message });
      throw error;
    }
  }

  async authenticate() {
    try {
      logger.info('Authenticating with Unity Cloud Services...');
      
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.secrets.UNITY_CLIENT_ID,
          client_secret: this.secrets.UNITY_CLIENT_SECRET,
          scope: 'economy inventory cloudcode remoteconfig',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OAuth failed: ${response.status} ${error}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      
      logger.info('Successfully authenticated with Unity Cloud Services', {
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        scope: data.scope,
      });

      return true;
    } catch (error) {
      logger.error('Unity Cloud API authentication failed', { error: error.message });
      throw error;
    }
  }

  async makeRequest(endpoint, options = {}) {
    if (!this.accessToken) {
      await this.authenticate();
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
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
          this.accessToken = null;
          await this.authenticate();
          
          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              ...headers,
              'Authorization': `Bearer ${this.accessToken}`,
            },
          });

          if (!retryResponse.ok) {
            throw new Error(`API request failed after re-authentication: ${retryResponse.status}`);
          }

          return await retryResponse.json();
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Unity Cloud API request failed', { endpoint, error: error.message });
      throw error;
    }
  }

  async loadEconomyData() {
    try {
      logger.info('Loading economy data from CSV files...');
      
      // Load currencies
      const currenciesCSV = await readFile(join(process.cwd(), 'economy', 'currencies.csv'), 'utf-8');
      const currencies = this.parseCSV(currenciesCSV, ['id', 'name', 'type', 'initial', 'maximum']);

      // Load inventory
      const inventoryCSV = await readFile(join(process.cwd(), 'economy', 'inventory.csv'), 'utf-8');
      const inventory = this.parseCSV(inventoryCSV, ['id', 'name', 'type', 'tradable', 'stackable']);

      // Load catalog
      const catalogCSV = await readFile(join(process.cwd(), 'economy', 'catalog.csv'), 'utf-8');
      const catalog = this.parseCSV(catalogCSV, ['id', 'name', 'cost_currency', 'cost_amount', 'rewards']);

      logger.info('Economy data loaded successfully', {
        currencies: currencies.length,
        inventory: inventory.length,
        catalog: catalog.length
      });

      return { currencies, inventory, catalog };
    } catch (error) {
      logger.error('Failed to load economy data', { error: error.message });
      throw error;
    }
  }

  parseCSV(csvData, headers) {
    const lines = csvData.trim().split('\n');
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const obj = {};

      headers.forEach((header, index) => {
        let value = values[index] || '';

        if (['initial', 'maximum', 'cost_amount'].includes(header)) {
          value = parseInt(value) || 0;
        }

        if (['tradable', 'stackable'].includes(header)) {
          value = value.toLowerCase() === 'true';
        }

        obj[header] = value;
      });

      result.push(obj);
    }

    return result;
  }

  async deployEconomyData() {
    try {
      logger.info('Deploying economy data to Unity Cloud...');
      
      const { currencies, inventory, catalog } = await this.loadEconomyData();
      const results = {
        currencies: [],
        inventory: [],
        catalog: [],
        errors: []
      };

      // Deploy currencies
      for (const currency of currencies) {
        try {
          const result = await this.createCurrency(currency);
          results.currencies.push(result);
          logger.info(`Currency deployed: ${currency.name} (${currency.id})`);
        } catch (error) {
          results.errors.push({
            type: 'currency',
            id: currency.id,
            error: error.message,
          });
          logger.error(`Failed to deploy currency: ${currency.id}`, { error: error.message });
        }
      }

      // Deploy inventory items
      for (const item of inventory) {
        try {
          const result = await this.createInventoryItem(item);
          results.inventory.push(result);
          logger.info(`Inventory item deployed: ${item.name} (${item.id})`);
        } catch (error) {
          results.errors.push({
            type: 'inventory',
            id: item.id,
            error: error.message,
          });
          logger.error(`Failed to deploy inventory item: ${item.id}`, { error: error.message });
        }
      }

      // Deploy catalog items
      for (const item of catalog) {
        try {
          const result = await this.createCatalogItem(item);
          results.catalog.push(result);
          logger.info(`Catalog item deployed: ${item.name} (${item.id})`);
        } catch (error) {
          results.errors.push({
            type: 'catalog',
            id: item.id,
            error: error.message,
          });
          logger.error(`Failed to deploy catalog item: ${item.id}`, { error: error.message });
        }
      }

      logger.info('Economy data deployment completed', {
        currenciesDeployed: results.currencies.length,
        inventoryDeployed: results.inventory.length,
        catalogDeployed: results.catalog.length,
        errors: results.errors.length
      });

      return results;
    } catch (error) {
      logger.error('Economy data deployment failed', { error: error.message });
      throw error;
    }
  }

  async createCurrency(currencyData) {
    const endpoint = `/economy/v1/projects/${this.secrets.UNITY_PROJECT_ID}/environments/${this.secrets.UNITY_ENV_ID}/currencies`;
    
    const result = await this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(currencyData),
    });
    
    return result;
  }

  async createInventoryItem(itemData) {
    const endpoint = `/economy/v1/projects/${this.secrets.UNITY_PROJECT_ID}/environments/${this.secrets.UNITY_ENV_ID}/inventory-items`;
    
    const result = await this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
    
    return result;
  }

  async createCatalogItem(catalogData) {
    const endpoint = `/economy/v1/projects/${this.secrets.UNITY_PROJECT_ID}/environments/${this.secrets.UNITY_ENV_ID}/catalog-items`;
    
    const result = await this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(catalogData),
    });
    
    return result;
  }

  async populateDashboard() {
    try {
      logger.info('Starting Unity Cloud Dashboard population...');

      // Fetch secrets from Cursor
      await this.fetchSecrets();

      // Deploy economy data
      const deploymentResults = await this.deployEconomyData();

      logger.info('Unity Cloud Dashboard population completed successfully', {
        economyDeployed: {
          currencies: deploymentResults.currencies.length,
          inventory: deploymentResults.inventory.length,
          catalog: deploymentResults.catalog.length
        },
        errors: deploymentResults.errors.length
      });

      return {
        success: true,
        deploymentResults
      };
    } catch (error) {
      logger.error('Unity Cloud Dashboard population failed', { error: error.message });
      throw error;
    }
  }
}

// Run dashboard population
const populator = new UnityDashboardPopulator();
populator
  .populateDashboard()
  .then((result) => {
    logger.info('Dashboard population completed successfully', result);
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Dashboard population failed', { error: error.message });
    process.exit(1);
  });