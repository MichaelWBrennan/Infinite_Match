#!/usr/bin/env node
/**
 * Unity Cloud API Client
 * Comprehensive API client for Unity Cloud Services
 * Provides headless access to all Unity Cloud services
 */

// Using built-in fetch API (Node.js 18+)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class UnityCloudAPIClient {
    constructor(options = {}) {
        // Read from environment variables (secrets are already set)
        // Use actual project ID from Unity services config
        this.projectId = options.projectId || "0dd5a03e-7f23-49c4-964e-7919c48c0574";
        this.environmentId = options.environmentId || "1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d";
        this.organizationId = options.organizationId || process.env.UNITY_ORG_ID || "2473931369648";
        this.clientId = options.clientId || process.env.UNITY_CLIENT_ID;
        this.clientSecret = options.clientSecret || process.env.UNITY_CLIENT_SECRET;
        this.accessToken = options.accessToken || process.env.UNITY_API_TOKEN;
        
        this.baseURL = "https://services.api.unity.com";
        this.authURL = "https://services.api.unity.com/auth/v1";
        
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

    /**
     * Get secret from Cursor secrets or environment variables
     */
    getSecret(name) {
        try {
            // Try to get from Cursor secrets first
            if (typeof cursor !== 'undefined' && cursor.getSecret) {
                return cursor.getSecret(name);
            }
        } catch (error) {
            // Cursor secrets not available, fall back to environment variables
        }
        
        // Fall back to environment variables
        return process.env[name];
    }

    /**
     * Authenticate with Unity Cloud using client credentials
     */
    async authenticate() {
        // Load secrets first
        await this.secrets.loadSecrets();
        
        // Update credentials from secrets if not provided in constructor
        if (!this.projectId) {
            const config = this.secrets.getProjectConfig();
            this.projectId = config.projectId;
            this.environmentId = config.environmentId;
            this.organizationId = config.organizationId;
        }
        
        if (!this.clientId || !this.clientSecret) {
            const auth = this.secrets.getAuthCredentials();
            this.clientId = auth.clientId;
            this.clientSecret = auth.clientSecret;
            this.accessToken = auth.accessToken;
        }

        if (this.accessToken) {
            this.headers['Authorization'] = `Bearer ${this.accessToken}`;
            return this.accessToken;
        }

        if (!this.clientId || !this.clientSecret) {
            throw new Error('Unity Cloud credentials not provided. Please configure UNITY_CLIENT_ID and UNITY_CLIENT_SECRET in Cursor secrets or environment variables.');
        }

        try {
            const response = await fetch(`${this.authURL}/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: this.clientId,
                    client_secret: this.clientSecret
                })
            });

            if (!response.ok) {
                throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
            }

            const tokenData = await response.json();
            this.accessToken = tokenData.access_token;
            this.headers['Authorization'] = `Bearer ${this.accessToken}`;
            
            console.log('✅ Unity Cloud authentication successful');
            return this.accessToken;
        } catch (error) {
            console.error('❌ Unity Cloud authentication failed:', error.message);
            throw error;
        }
    }

    /**
     * Make authenticated API request with retry logic
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const requestOptions = {
            ...options,
            headers: {
                ...this.headers,
                ...options.headers
            }
        };

        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const response = await fetch(url, requestOptions);
                
                if (response.status === 401 && attempt < this.retryAttempts) {
                    // Token expired, re-authenticate
                    await this.authenticate();
                    requestOptions.headers['Authorization'] = `Bearer ${this.accessToken}`;
                    continue;
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
                }

                return await response.json();
            } catch (error) {
                if (attempt === this.retryAttempts) {
                    throw error;
                }
                console.warn(`⚠️ API request attempt ${attempt} failed, retrying...`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            }
        }
    }

    // ============================================================================
    // ECONOMY SERVICE APIs
    // ============================================================================

    /**
     * Get all currencies
     */
    async getCurrencies() {
        const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/currencies`;
        return await this.makeRequest(endpoint);
    }

    /**
     * Create or update currency
     */
    async createCurrency(currencyData) {
        const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/currencies`;
        return await this.makeRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(currencyData)
        });
    }

    /**
     * Update currency
     */
    async updateCurrency(currencyId, currencyData) {
        const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/currencies/${currencyId}`;
        return await this.makeRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify(currencyData)
        });
    }

    /**
     * Delete currency
     */
    async deleteCurrency(currencyId) {
        const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/currencies/${currencyId}`;
        return await this.makeRequest(endpoint, {
            method: 'DELETE'
        });
    }

    /**
     * Get all inventory items
     */
    async getInventoryItems() {
        const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/inventory`;
        return await this.makeRequest(endpoint);
    }

    /**
     * Create or update inventory item
     */
    async createInventoryItem(itemData) {
        const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/inventory`;
        return await this.makeRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(itemData)
        });
    }

    /**
     * Update inventory item
     */
    async updateInventoryItem(itemId, itemData) {
        const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/inventory/${itemId}`;
        return await this.makeRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify(itemData)
        });
    }

    /**
     * Delete inventory item
     */
    async deleteInventoryItem(itemId) {
        const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/inventory/${itemId}`;
        return await this.makeRequest(endpoint, {
            method: 'DELETE'
        });
    }

    /**
     * Get all catalog items
     */
    async getCatalogItems() {
        const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/catalog`;
        return await this.makeRequest(endpoint);
    }

    /**
     * Create or update catalog item
     */
    async createCatalogItem(itemData) {
        const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/catalog`;
        return await this.makeRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(itemData)
        });
    }

    /**
     * Update catalog item
     */
    async updateCatalogItem(itemId, itemData) {
        const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/catalog/${itemId}`;
        return await this.makeRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify(itemData)
        });
    }

    /**
     * Delete catalog item
     */
    async deleteCatalogItem(itemId) {
        const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/catalog/${itemId}`;
        return await this.makeRequest(endpoint, {
            method: 'DELETE'
        });
    }

    // ============================================================================
    // REMOTE CONFIG SERVICE APIs
    // ============================================================================

    /**
     * Get all remote config entries
     */
    async getRemoteConfigs() {
        const endpoint = `/remote-config/v1/projects/${this.projectId}/environments/${this.environmentId}/configs`;
        return await this.makeRequest(endpoint);
    }

    /**
     * Create or update remote config entry
     */
    async createRemoteConfig(configData) {
        const endpoint = `/remote-config/v1/projects/${this.projectId}/environments/${this.environmentId}/configs`;
        return await this.makeRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(configData)
        });
    }

    /**
     * Update remote config entry
     */
    async updateRemoteConfig(configKey, configData) {
        const endpoint = `/remote-config/v1/projects/${this.projectId}/environments/${this.environmentId}/configs/${configKey}`;
        return await this.makeRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify(configData)
        });
    }

    /**
     * Delete remote config entry
     */
    async deleteRemoteConfig(configKey) {
        const endpoint = `/remote-config/v1/projects/${this.projectId}/environments/${this.environmentId}/configs/${configKey}`;
        return await this.makeRequest(endpoint, {
            method: 'DELETE'
        });
    }

    // ============================================================================
    // CLOUD CODE SERVICE APIs
    // ============================================================================

    /**
     * Get all cloud code functions
     */
    async getCloudCodeFunctions() {
        const endpoint = `/cloud-code/v1/projects/${this.projectId}/environments/${this.environmentId}/scripts`;
        return await this.makeRequest(endpoint);
    }

    /**
     * Create or update cloud code function
     */
    async createCloudCodeFunction(functionData) {
        const endpoint = `/cloud-code/v1/projects/${this.projectId}/environments/${this.environmentId}/scripts`;
        return await this.makeRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(functionData)
        });
    }

    /**
     * Update cloud code function
     */
    async updateCloudCodeFunction(functionId, functionData) {
        const endpoint = `/cloud-code/v1/projects/${this.projectId}/environments/${this.environmentId}/scripts/${functionId}`;
        return await this.makeRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify(functionData)
        });
    }

    /**
     * Delete cloud code function
     */
    async deleteCloudCodeFunction(functionId) {
        const endpoint = `/cloud-code/v1/projects/${this.projectId}/environments/${this.environmentId}/scripts/${functionId}`;
        return await this.makeRequest(endpoint, {
            method: 'DELETE'
        });
    }

    /**
     * Execute cloud code function
     */
    async executeCloudCodeFunction(functionId, parameters = {}) {
        const endpoint = `/cloud-code/v1/projects/${this.projectId}/environments/${this.environmentId}/scripts/${functionId}/execute`;
        return await this.makeRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify({ parameters })
        });
    }

    // ============================================================================
    // ANALYTICS SERVICE APIs
    // ============================================================================

    /**
     * Get analytics events
     */
    async getAnalyticsEvents(filters = {}) {
        const endpoint = `/analytics/v1/projects/${this.projectId}/environments/${this.environmentId}/events`;
        const queryParams = new URLSearchParams(filters);
        const fullEndpoint = queryParams.toString() ? `${endpoint}?${queryParams}` : endpoint;
        return await this.makeRequest(fullEndpoint);
    }

    /**
     * Send custom analytics event
     */
    async sendAnalyticsEvent(eventData) {
        const endpoint = `/analytics/v1/projects/${this.projectId}/environments/${this.environmentId}/events`;
        return await this.makeRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(eventData)
        });
    }

    /**
     * Get analytics metrics
     */
    async getAnalyticsMetrics(metricType, filters = {}) {
        const endpoint = `/analytics/v1/projects/${this.projectId}/environments/${this.environmentId}/metrics/${metricType}`;
        const queryParams = new URLSearchParams(filters);
        const fullEndpoint = queryParams.toString() ? `${endpoint}?${queryParams}` : endpoint;
        return await this.makeRequest(fullEndpoint);
    }

    // ============================================================================
    // PROJECT MANAGEMENT APIs
    // ============================================================================

    /**
     * Get project information
     */
    async getProjectInfo() {
        const endpoint = `/projects/${this.projectId}`;
        return await this.makeRequest(endpoint);
    }

    /**
     * Get environment information
     */
    async getEnvironmentInfo() {
        const endpoint = `/projects/${this.projectId}/environments/${this.environmentId}`;
        return await this.makeRequest(endpoint);
    }

    /**
     * Get organization information
     */
    async getOrganizationInfo() {
        const endpoint = `/organizations/${this.organizationId}`;
        return await this.makeRequest(endpoint);
    }

    // ============================================================================
    // BULK OPERATIONS
    // ============================================================================

    /**
     * Deploy economy data from local files
     */
    async deployEconomyFromFiles(economyDir = 'economy') {
        console.log('💰 Deploying economy data from local files...');
        
        const results = {
            currencies: { created: 0, updated: 0, errors: 0 },
            inventory: { created: 0, updated: 0, errors: 0 },
            catalog: { created: 0, updated: 0, errors: 0 }
        };

        try {
            // Deploy currencies
            const currenciesFile = path.join(economyDir, 'currencies.csv');
            if (fs.existsSync(currenciesFile)) {
                const currencies = this.parseCSV(currenciesFile);
                for (const currency of currencies) {
                    try {
                        await this.createCurrency(currency);
                        results.currencies.created++;
                        console.log(`   ✅ Created currency: ${currency.id}`);
                    } catch (error) {
                        results.currencies.errors++;
                        console.error(`   ❌ Failed to create currency ${currency.id}: ${error.message}`);
                    }
                }
            }

            // Deploy inventory
            const inventoryFile = path.join(economyDir, 'inventory.csv');
            if (fs.existsSync(inventoryFile)) {
                const inventory = this.parseCSV(inventoryFile);
                for (const item of inventory) {
                    try {
                        await this.createInventoryItem(item);
                        results.inventory.created++;
                        console.log(`   ✅ Created inventory item: ${item.id}`);
                    } catch (error) {
                        results.inventory.errors++;
                        console.error(`   ❌ Failed to create inventory item ${item.id}: ${error.message}`);
                    }
                }
            }

            // Deploy catalog
            const catalogFile = path.join(economyDir, 'catalog.csv');
            if (fs.existsSync(catalogFile)) {
                const catalog = this.parseCSV(catalogFile);
                for (const item of catalog) {
                    try {
                        await this.createCatalogItem(item);
                        results.catalog.created++;
                        console.log(`   ✅ Created catalog item: ${item.id}`);
                    } catch (error) {
                        results.catalog.errors++;
                        console.error(`   ❌ Failed to create catalog item ${item.id}: ${error.message}`);
                    }
                }
            }

            console.log('✅ Economy data deployment completed');
            return results;
        } catch (error) {
            console.error('❌ Economy data deployment failed:', error.message);
            throw error;
        }
    }

    /**
     * Deploy cloud code from local files
     */
    async deployCloudCodeFromFiles(cloudCodeDir = 'cloud-code') {
        console.log('☁️ Deploying cloud code from local files...');
        
        const results = { created: 0, updated: 0, errors: 0 };

        try {
            if (!fs.existsSync(cloudCodeDir)) {
                console.log('   ⚠️ Cloud code directory not found');
                return results;
            }

            const files = fs.readdirSync(cloudCodeDir).filter(file => file.endsWith('.js'));
            
            for (const file of files) {
                try {
                    const filePath = path.join(cloudCodeDir, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    const functionName = path.basename(file, '.js');
                    
                    const functionData = {
                        name: functionName,
                        code: content,
                        language: 'javascript'
                    };

                    await this.createCloudCodeFunction(functionData);
                    results.created++;
                    console.log(`   ✅ Deployed cloud code function: ${functionName}`);
                } catch (error) {
                    results.errors++;
                    console.error(`   ❌ Failed to deploy cloud code function ${file}: ${error.message}`);
                }
            }

            console.log('✅ Cloud code deployment completed');
            return results;
        } catch (error) {
            console.error('❌ Cloud code deployment failed:', error.message);
            throw error;
        }
    }

    /**
     * Deploy remote config from local files
     */
    async deployRemoteConfigFromFiles(remoteConfigDir = 'remote-config') {
        console.log('⚙️ Deploying remote config from local files...');
        
        const results = { created: 0, updated: 0, errors: 0 };

        try {
            const configFile = path.join(remoteConfigDir, 'game_config.json');
            if (!fs.existsSync(configFile)) {
                console.log('   ⚠️ Remote config file not found');
                return results;
            }

            const configData = JSON.parse(fs.readFileSync(configFile, 'utf8'));
            
            for (const [key, value] of Object.entries(configData)) {
                try {
                    const configEntry = {
                        key: key,
                        value: value,
                        type: typeof value
                    };

                    await this.createRemoteConfig(configEntry);
                    results.created++;
                    console.log(`   ✅ Deployed remote config: ${key}`);
                } catch (error) {
                    results.errors++;
                    console.error(`   ❌ Failed to deploy remote config ${key}: ${error.message}`);
                }
            }

            console.log('✅ Remote config deployment completed');
            return results;
        } catch (error) {
            console.error('❌ Remote config deployment failed:', error.message);
            throw error;
        }
    }

    /**
     * Parse CSV file to JSON
     */
    parseCSV(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        
        return lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const obj = {};
            headers.forEach((header, index) => {
                let value = values[index] || '';
                // Try to parse as number
                if (!isNaN(value) && value !== '') {
                    value = Number(value);
                }
                // Try to parse as boolean
                if (value === 'true') value = true;
                if (value === 'false') value = false;
                obj[header] = value;
            });
            return obj;
        });
    }

    // ============================================================================
    // HEALTH CHECK AND MONITORING
    // ============================================================================

    /**
     * Check Unity Cloud service health
     */
    async checkServiceHealth() {
        console.log('🔍 Checking Unity Cloud service health...');
        
        const health = {
            timestamp: new Date().toISOString(),
            projectId: this.projectId,
            environmentId: this.environmentId,
            services: {}
        };

        try {
            // Check authentication
            await this.authenticate();
            health.authentication = { status: 'healthy', message: 'Authentication successful' };
        } catch (error) {
            health.authentication = { status: 'unhealthy', message: error.message };
        }

        // Check Economy service
        try {
            await this.getCurrencies();
            health.services.economy = { status: 'healthy', message: 'Economy service accessible' };
        } catch (error) {
            health.services.economy = { status: 'unhealthy', message: error.message };
        }

        // Check Remote Config service
        try {
            await this.getRemoteConfigs();
            health.services.remoteConfig = { status: 'healthy', message: 'Remote Config service accessible' };
        } catch (error) {
            health.services.remoteConfig = { status: 'unhealthy', message: error.message };
        }

        // Check Cloud Code service
        try {
            await this.getCloudCodeFunctions();
            health.services.cloudCode = { status: 'healthy', message: 'Cloud Code service accessible' };
        } catch (error) {
            health.services.cloudCode = { status: 'unhealthy', message: error.message };
        }

        // Check Analytics service
        try {
            await this.getAnalyticsEvents();
            health.services.analytics = { status: 'healthy', message: 'Analytics service accessible' };
        } catch (error) {
            health.services.analytics = { status: 'unhealthy', message: error.message };
        }

        return health;
    }

    /**
     * Generate comprehensive status report
     */
    async generateStatusReport() {
        console.log('📊 Generating Unity Cloud status report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            projectId: this.projectId,
            environmentId: this.environmentId,
            health: await this.checkServiceHealth(),
            data: {}
        };

        try {
            // Get economy data
            report.data.currencies = await this.getCurrencies();
            report.data.inventory = await this.getInventoryItems();
            report.data.catalog = await this.getCatalogItems();
        } catch (error) {
            console.warn('⚠️ Could not fetch economy data:', error.message);
        }

        try {
            // Get remote config data
            report.data.remoteConfig = await this.getRemoteConfigs();
        } catch (error) {
            console.warn('⚠️ Could not fetch remote config data:', error.message);
        }

        try {
            // Get cloud code data
            report.data.cloudCode = await this.getCloudCodeFunctions();
        } catch (error) {
            console.warn('⚠️ Could not fetch cloud code data:', error.message);
        }

        return report;
    }
}

export default UnityCloudAPIClient;