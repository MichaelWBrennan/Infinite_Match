#!/usr/bin/env node
/**
 * Unity Gaming Services (UGS) Headless Integration
 * Provides headless access to UGS services using the API client
 * Designed for automated deployment and management
 */

import UnityGamingServicesAPIClient from './unity-cloud-api-client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class UnityGamingServicesHeadlessIntegration {
    constructor(options = {}) {
        this.apiClient = new UnityGamingServicesAPIClient(options);
        this.projectRoot = options.projectRoot || path.join(__dirname, '..');
        this.economyDir = path.join(this.projectRoot, 'economy');
        this.cloudCodeDir = path.join(this.projectRoot, 'cloud-code');
        this.remoteConfigDir = path.join(this.projectRoot, 'remote-config');
        this.monitoringDir = path.join(this.projectRoot, 'monitoring');
        
        this.results = {
            timestamp: new Date().toISOString(),
            projectId: this.apiClient.projectId,
            environmentId: this.apiClient.environmentId,
            operations: [],
            summary: {}
        };
    }

    /**
     * Initialize the headless integration
     */
    async initialize() {
        console.log('🚀 Initializing Unity Cloud Headless Integration...');
        
        try {
            // Authenticate with Unity Cloud
            await this.apiClient.authenticate();
            
            // Check service health
            const health = await this.apiClient.checkServiceHealth();
            console.log('✅ Unity Cloud services health check completed');
            
            // Log health status
            Object.entries(health.services).forEach(([service, status]) => {
                const statusIcon = status.status === 'healthy' ? '✅' : '❌';
                console.log(`   ${statusIcon} ${service}: ${status.message}`);
            });
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Unity Cloud integration:', error.message);
            return false;
        }
    }

    /**
     * Deploy all Unity Cloud services from local files
     */
    async deployAll() {
        console.log('\n🎯 Starting complete Unity Cloud deployment...');
        
        const deploymentResults = {
            economy: null,
            cloudCode: null,
            remoteConfig: null,
            analytics: null
        };

        try {
            // Deploy Economy service
            console.log('\n💰 Deploying Economy service...');
            deploymentResults.economy = await this.deployEconomy();
            
            // Deploy Cloud Code service
            console.log('\n☁️ Deploying Cloud Code service...');
            deploymentResults.cloudCode = await this.deployCloudCode();
            
            // Deploy Remote Config service
            console.log('\n⚙️ Deploying Remote Config service...');
            deploymentResults.remoteConfig = await this.deployRemoteConfig();
            
            // Deploy Analytics events
            console.log('\n📊 Deploying Analytics events...');
            deploymentResults.analytics = await this.deployAnalytics();
            
            // Generate deployment summary
            this.generateDeploymentSummary(deploymentResults);
            
            return deploymentResults;
        } catch (error) {
            console.error('❌ Deployment failed:', error.message);
            throw error;
        }
    }

    /**
     * Deploy Economy service
     */
    async deployEconomy() {
        const operation = {
            service: 'Economy',
            timestamp: new Date().toISOString(),
            status: 'in_progress',
            results: {}
        };

        try {
            console.log('   📁 Checking economy data files...');
            
            // Check if economy directory exists
            if (!fs.existsSync(this.economyDir)) {
                console.log('   ⚠️ Economy directory not found, creating...');
                fs.mkdirSync(this.economyDir, { recursive: true });
            }

            // Deploy from files
            const results = await this.apiClient.deployEconomyFromFiles(this.economyDir);
            
            operation.status = 'completed';
            operation.results = results;
            
            console.log(`   ✅ Economy deployment completed:`);
            console.log(`      - Currencies: ${results.currencies.created} created, ${results.currencies.errors} errors`);
            console.log(`      - Inventory: ${results.inventory.created} created, ${results.inventory.errors} errors`);
            console.log(`      - Catalog: ${results.catalog.created} created, ${results.catalog.errors} errors`);
            
        } catch (error) {
            operation.status = 'failed';
            operation.error = error.message;
            console.error(`   ❌ Economy deployment failed: ${error.message}`);
        }

        this.results.operations.push(operation);
        return operation;
    }

    /**
     * Deploy Cloud Code service
     */
    async deployCloudCode() {
        const operation = {
            service: 'Cloud Code',
            timestamp: new Date().toISOString(),
            status: 'in_progress',
            results: {}
        };

        try {
            console.log('   📁 Checking cloud code files...');
            
            // Check if cloud code directory exists
            if (!fs.existsSync(this.cloudCodeDir)) {
                console.log('   ⚠️ Cloud code directory not found, creating...');
                fs.mkdirSync(this.cloudCodeDir, { recursive: true });
            }

            // Deploy from files
            const results = await this.apiClient.deployCloudCodeFromFiles(this.cloudCodeDir);
            
            operation.status = 'completed';
            operation.results = results;
            
            console.log(`   ✅ Cloud Code deployment completed:`);
            console.log(`      - Functions: ${results.created} created, ${results.errors} errors`);
            
        } catch (error) {
            operation.status = 'failed';
            operation.error = error.message;
            console.error(`   ❌ Cloud Code deployment failed: ${error.message}`);
        }

        this.results.operations.push(operation);
        return operation;
    }

    /**
     * Deploy Remote Config service
     */
    async deployRemoteConfig() {
        const operation = {
            service: 'Remote Config',
            timestamp: new Date().toISOString(),
            status: 'in_progress',
            results: {}
        };

        try {
            console.log('   📁 Checking remote config files...');
            
            // Check if remote config directory exists
            if (!fs.existsSync(this.remoteConfigDir)) {
                console.log('   ⚠️ Remote config directory not found, creating...');
                fs.mkdirSync(this.remoteConfigDir, { recursive: true });
            }

            // Deploy from files
            const results = await this.apiClient.deployRemoteConfigFromFiles(this.remoteConfigDir);
            
            operation.status = 'completed';
            operation.results = results;
            
            console.log(`   ✅ Remote Config deployment completed:`);
            console.log(`      - Configs: ${results.created} created, ${results.errors} errors`);
            
        } catch (error) {
            operation.status = 'failed';
            operation.error = error.message;
            console.error(`   ❌ Remote Config deployment failed: ${error.message}`);
        }

        this.results.operations.push(operation);
        return operation;
    }

    /**
     * Deploy Analytics events
     */
    async deployAnalytics() {
        const operation = {
            service: 'Analytics',
            timestamp: new Date().toISOString(),
            status: 'in_progress',
            results: {}
        };

        try {
            console.log('   📊 Sending analytics events...');
            
            // Send deployment event
            const deploymentEvent = {
                eventName: 'headless_deployment',
                timestamp: new Date().toISOString(),
                properties: {
                    projectId: this.apiClient.projectId,
                    environmentId: this.apiClient.environmentId,
                    deploymentType: 'headless_automation'
                }
            };

            await this.apiClient.sendAnalyticsEvent(deploymentEvent);
            
            operation.status = 'completed';
            operation.results = { eventsSent: 1 };
            
            console.log(`   ✅ Analytics deployment completed: 1 event sent`);
            
        } catch (error) {
            operation.status = 'failed';
            operation.error = error.message;
            console.error(`   ❌ Analytics deployment failed: ${error.message}`);
        }

        this.results.operations.push(operation);
        return operation;
    }

    /**
     * Sync local data with Unity Cloud
     */
    async syncData() {
        console.log('\n🔄 Syncing local data with Unity Cloud...');
        
        try {
            // Get current Unity Cloud data
            const cloudData = await this.apiClient.generateStatusReport();
            
            // Compare with local data
            const syncResults = await this.compareAndSyncData(cloudData);
            
            console.log('✅ Data sync completed');
            return syncResults;
        } catch (error) {
            console.error('❌ Data sync failed:', error.message);
            throw error;
        }
    }

    /**
     * Compare local and cloud data and sync differences
     */
    async compareAndSyncData(cloudData) {
        const syncResults = {
            currencies: { synced: 0, conflicts: 0 },
            inventory: { synced: 0, conflicts: 0 },
            catalog: { synced: 0, conflicts: 0 },
            remoteConfig: { synced: 0, conflicts: 0 },
            cloudCode: { synced: 0, conflicts: 0 }
        };

        // Sync currencies
        try {
            const localCurrencies = this.loadLocalEconomyData('currencies');
            const cloudCurrencies = cloudData.data.currencies || [];
            
            for (const localCurrency of localCurrencies) {
                const cloudCurrency = cloudCurrencies.find(c => c.id === localCurrency.id);
                if (!cloudCurrency || JSON.stringify(cloudCurrency) !== JSON.stringify(localCurrency)) {
                    await this.apiClient.createCurrency(localCurrency);
                    syncResults.currencies.synced++;
                }
            }
        } catch (error) {
            console.warn('⚠️ Currency sync failed:', error.message);
        }

        // Sync inventory
        try {
            const localInventory = this.loadLocalEconomyData('inventory');
            const cloudInventory = cloudData.data.inventory || [];
            
            for (const localItem of localInventory) {
                const cloudItem = cloudInventory.find(i => i.id === localItem.id);
                if (!cloudItem || JSON.stringify(cloudItem) !== JSON.stringify(localItem)) {
                    await this.apiClient.createInventoryItem(localItem);
                    syncResults.inventory.synced++;
                }
            }
        } catch (error) {
            console.warn('⚠️ Inventory sync failed:', error.message);
        }

        // Sync catalog
        try {
            const localCatalog = this.loadLocalEconomyData('catalog');
            const cloudCatalog = cloudData.data.catalog || [];
            
            for (const localItem of localCatalog) {
                const cloudItem = cloudCatalog.find(i => i.id === localItem.id);
                if (!cloudItem || JSON.stringify(cloudItem) !== JSON.stringify(localItem)) {
                    await this.apiClient.createCatalogItem(localItem);
                    syncResults.catalog.synced++;
                }
            }
        } catch (error) {
            console.warn('⚠️ Catalog sync failed:', error.message);
        }

        return syncResults;
    }

    /**
     * Load local economy data from CSV files
     */
    loadLocalEconomyData(type) {
        const filePath = path.join(this.economyDir, `${type}.csv`);
        if (!fs.existsSync(filePath)) {
            return [];
        }

        return this.apiClient.parseCSV(filePath);
    }

    /**
     * Generate deployment summary
     */
    generateDeploymentSummary(results) {
        console.log('\n' + '='.repeat(80));
        console.log('📊 UNITY CLOUD DEPLOYMENT SUMMARY');
        console.log('='.repeat(80));
        
        let totalOperations = 0;
        let successfulOperations = 0;
        let failedOperations = 0;

        Object.entries(results).forEach(([service, result]) => {
            if (result) {
                totalOperations++;
                if (result.status === 'completed') {
                    successfulOperations++;
                    console.log(`✅ ${service}: SUCCESS`);
                } else {
                    failedOperations++;
                    console.log(`❌ ${service}: FAILED - ${result.error || 'Unknown error'}`);
                }
            }
        });

        console.log(`\n📈 Summary:`);
        console.log(`   Total Services: ${totalOperations}`);
        console.log(`   Successful: ${successfulOperations}`);
        console.log(`   Failed: ${failedOperations}`);
        console.log(`   Success Rate: ${totalOperations > 0 ? ((successfulOperations / totalOperations) * 100).toFixed(1) : 0}%`);

        if (successfulOperations === totalOperations) {
            console.log('\n🎉 ALL SERVICES DEPLOYED SUCCESSFULLY!');
        } else if (successfulOperations > 0) {
            console.log(`\n⚠️ PARTIAL SUCCESS - ${successfulOperations}/${totalOperations} services deployed`);
        } else {
            console.log('\n❌ DEPLOYMENT FAILED - No services deployed successfully');
        }

        console.log('='.repeat(80));
    }

    /**
     * Save deployment results
     */
    saveResults() {
        const resultsDir = path.join(this.monitoringDir, 'reports');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const resultsFile = path.join(resultsDir, `unity_cloud_headless_deployment_${timestamp}.json`);

        fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
        console.log(`\n📁 Deployment results saved to: ${resultsFile}`);
    }

    /**
     * Run complete headless integration
     */
    async run() {
        console.log('🎯 Unity Cloud Headless Integration');
        console.log('=====================================');
        console.log(`Project ID: ${this.apiClient.projectId}`);
        console.log(`Environment ID: ${this.apiClient.environmentId}`);
        console.log(`Timestamp: ${this.results.timestamp}`);
        console.log('=====================================\n');

        try {
            // Initialize
            const initialized = await this.initialize();
            if (!initialized) {
                throw new Error('Failed to initialize Unity Cloud integration');
            }

            // Deploy all services
            const deploymentResults = await this.deployAll();

            // Sync data
            await this.syncData();

            // Save results
            this.saveResults();

            console.log('\n🎉 Unity Cloud Headless Integration completed successfully!');
            return true;
        } catch (error) {
            console.error('\n❌ Unity Cloud Headless Integration failed:', error.message);
            this.saveResults();
            return false;
        }
    }
}

export default UnityGamingServicesHeadlessIntegration;