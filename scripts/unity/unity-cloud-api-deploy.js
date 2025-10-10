#!/usr/bin/env node
/**
 * Unity Cloud Services API Deployment Script
 * Industry-standard headless deployment using Unity Cloud REST API
 */

import { Logger } from '../../src/core/logger/index.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

const logger = new Logger('UnityCloudAPI');

class UnityCloudAPIDeployer {
  constructor() {
    this.projectId = null;
    this.environmentId = null;
    this.clientId = null;
    this.clientSecret = null;
    this.baseUrl = 'https://services.api.unity.com';
    this.accessToken = null;
  }

  async loadSecretsFromCursor() {
    try {
      // Try to load secrets from Cursor if available
      if (typeof cursor !== 'undefined' && cursor.getSecret) {
        logger.info('Loading secrets from Cursor...');
        
        const secrets = [
          'UNITY_PROJECT_ID',
          'UNITY_ENV_ID', 
          'UNITY_CLIENT_ID',
          'UNITY_CLIENT_SECRET'
        ];

        for (const secret of secrets) {
          try {
            const value = await cursor.getSecret(secret);
            if (value) {
              if (secret === 'UNITY_PROJECT_ID') this.projectId = value;
              if (secret === 'UNITY_ENV_ID') this.environmentId = value;
              if (secret === 'UNITY_CLIENT_ID') this.clientId = value;
              if (secret === 'UNITY_CLIENT_SECRET') this.clientSecret = value;
              logger.info(`Loaded secret: ${secret}`);
            }
          } catch (err) {
            logger.warn(`Failed to load secret ${secret}:`, err.message);
          }
        }
      } else {
        // Fallback to environment variables
        this.projectId = process.env.UNITY_PROJECT_ID || '0dd5a03e-7f23-49c4-964e-7919c48c0574';
        this.environmentId = process.env.UNITY_ENV_ID || '1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d';
        this.clientId = process.env.UNITY_CLIENT_ID;
        this.clientSecret = process.env.UNITY_CLIENT_SECRET;
        logger.info('Loaded secrets from environment variables');
      }
    } catch (error) {
      logger.warn('Failed to load secrets from Cursor:', error.message);
      // Fallback to environment variables
      this.projectId = process.env.UNITY_PROJECT_ID || '0dd5a03e-7f23-49c4-964e-7919c48c0574';
      this.environmentId = process.env.UNITY_ENV_ID || '1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d';
      this.clientId = process.env.UNITY_CLIENT_ID;
      this.clientSecret = process.env.UNITY_CLIENT_SECRET;
    }
  }

  async authenticate() {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('UNITY_CLIENT_ID and UNITY_CLIENT_SECRET environment variables are required');
    }

    try {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
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
          // Token expired, re-authenticate and retry
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

  async createCurrency(currencyData) {
    const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/currencies`;
    
    try {
      const result = await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(currencyData),
      });
      
      logger.info(`Currency created: ${currencyData.id}`, { result });
      return result;
    } catch (error) {
      logger.error(`Failed to create currency: ${currencyData.id}`, { error: error.message });
      throw error;
    }
  }

  async createInventoryItem(itemData) {
    const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/inventory-items`;
    
    try {
      const result = await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(itemData),
      });
      
      logger.info(`Inventory item created: ${itemData.id}`, { result });
      return result;
    } catch (error) {
      logger.error(`Failed to create inventory item: ${itemData.id}`, { error: error.message });
      throw error;
    }
  }

  async createCatalogItem(catalogData) {
    const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/catalog-items`;
    
    try {
      const result = await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(catalogData),
      });
      
      logger.info(`Catalog item created: ${catalogData.id}`, { result });
      return result;
    } catch (error) {
      logger.error(`Failed to create catalog item: ${catalogData.id}`, { error: error.message });
      throw error;
    }
  }

  async loadEconomyData() {
    try {
      // Load currencies
      const currenciesCSV = await readFile(join(process.cwd(), 'economy', 'currencies.csv'), 'utf-8');
      const currencies = this.parseCSV(currenciesCSV, ['id', 'name', 'type', 'initial', 'maximum']);

      // Load inventory
      const inventoryCSV = await readFile(join(process.cwd(), 'economy', 'inventory.csv'), 'utf-8');
      const inventory = this.parseCSV(inventoryCSV, ['id', 'name', 'type', 'tradable', 'stackable']);

      // Load catalog
      const catalogCSV = await readFile(join(process.cwd(), 'economy', 'catalog.csv'), 'utf-8');
      const catalog = this.parseCSV(catalogCSV, ['id', 'name', 'cost_currency', 'cost_amount', 'rewards']);

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

        // Convert numeric values
        if (['initial', 'maximum', 'cost_amount'].includes(header)) {
          value = parseInt(value) || 0;
        }

        // Convert boolean values
        if (['tradable', 'stackable'].includes(header)) {
          value = value.toLowerCase() === 'true';
        }

        obj[header] = value;
      });

      result.push(obj);
    }

    return result;
  }

  async deployAll() {
    try {
      logger.info('Starting Unity Cloud Services API deployment...');

      // Load secrets from Cursor or environment
      await this.loadSecretsFromCursor();

      // Authenticate first
      await this.authenticate();

      // Load economy data
      const economyData = await this.loadEconomyData();
      
      const results = {
        currencies: [],
        inventory: [],
        catalog: [],
        errors: [],
      };

      // Deploy currencies
      logger.info(`Deploying ${economyData.currencies.length} currencies...`);
      for (const currency of economyData.currencies) {
        try {
          const result = await this.createCurrency(currency);
          results.currencies.push(result);
        } catch (error) {
          results.errors.push({
            type: 'currency',
            id: currency.id,
            error: error.message,
          });
        }
      }

      // Deploy inventory items
      logger.info(`Deploying ${economyData.inventory.length} inventory items...`);
      for (const item of economyData.inventory) {
        try {
          const result = await this.createInventoryItem(item);
          results.inventory.push(result);
        } catch (error) {
          results.errors.push({
            type: 'inventory',
            id: item.id,
            error: error.message,
          });
        }
      }

      // Deploy catalog items
      logger.info(`Deploying ${economyData.catalog.length} catalog items...`);
      for (const item of economyData.catalog) {
        try {
          const result = await this.createCatalogItem(item);
          results.catalog.push(result);
        } catch (error) {
          results.errors.push({
            type: 'catalog',
            id: item.id,
            error: error.message,
          });
        }
      }

      logger.info('Unity Cloud Services deployment completed', {
        currenciesDeployed: results.currencies.length,
        inventoryDeployed: results.inventory.length,
        catalogDeployed: results.catalog.length,
        errors: results.errors.length,
      });

      if (results.errors.length > 0) {
        logger.warn('Deployment completed with errors', { errors: results.errors });
      }

      return results;
    } catch (error) {
      logger.error('Unity Cloud Services deployment failed', { error: error.message });
      throw error;
    }
  }
}

// Run deployment
const deployer = new UnityCloudAPIDeployer();
deployer
  .deployAll()
  .then(() => {
    logger.info('Unity Cloud API deployment completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Unity Cloud API deployment failed', { error: error.message });
    process.exit(1);
  });