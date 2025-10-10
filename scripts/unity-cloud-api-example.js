#!/usr/bin/env node
/**
 * Unity Cloud API Example
 * Demonstrates how to use the Unity Cloud API integration
 */

import UnityCloudAPIClient from '../src/unity-cloud-api-client.js';
import UnityCloudHeadlessIntegration from '../src/unity-cloud-headless-integration.js';

class UnityCloudAPIExample {
    constructor() {
        this.apiClient = new UnityCloudAPIClient();
        this.integration = new UnityCloudHeadlessIntegration();
    }

    async demonstrateBasicAPIUsage() {
        console.log('🎯 Unity Cloud API Example - Basic Usage');
        console.log('==========================================\n');

        try {
            // Initialize API client
            console.log('1. Initializing API client...');
            console.log(`   Project ID: ${this.apiClient.projectId}`);
            console.log(`   Environment ID: ${this.apiClient.environmentId}`);
            console.log(`   Base URL: ${this.apiClient.baseURL}`);

            // Note: Authentication requires credentials
            console.log('\n2. Authentication (requires credentials):');
            console.log('   To authenticate, set these environment variables:');
            console.log('   - UNITY_CLIENT_ID');
            console.log('   - UNITY_CLIENT_SECRET');
            console.log('   Or use Cursor secrets:');
            console.log('   - cursor setSecret UNITY_CLIENT_ID "your-client-id"');
            console.log('   - cursor setSecret UNITY_CLIENT_SECRET "your-client-secret"');

            // Demonstrate API endpoint construction
            console.log('\n3. API Endpoints:');
            console.log(`   Economy: ${this.apiClient.baseURL}/economy/v1/projects/${this.apiClient.projectId}/environments/${this.apiClient.environmentId}/currencies`);
            console.log(`   Remote Config: ${this.apiClient.baseURL}/remote-config/v1/projects/${this.apiClient.projectId}/environments/${this.apiClient.environmentId}/configs`);
            console.log(`   Cloud Code: ${this.apiClient.baseURL}/cloud-code/v1/projects/${this.apiClient.projectId}/environments/${this.apiClient.environmentId}/scripts`);

            // Demonstrate CSV parsing
            console.log('\n4. CSV Parsing Example:');
            const sampleCSV = `id,name,type,initial,maximum
coins,Coins,soft_currency,1000,999999
gems,Gems,hard_currency,50,99999
energy,Energy,consumable,5,30`;

            // Write sample CSV to temp file
            const fs = await import('fs');
            const path = await import('path');
            const tempFile = path.join(process.cwd(), 'temp_sample.csv');
            
            fs.writeFileSync(tempFile, sampleCSV);
            
            try {
                const parsed = this.apiClient.parseCSV(tempFile);
                console.log(`   Parsed ${parsed.length} items:`);
                parsed.forEach((item, index) => {
                    console.log(`     ${index + 1}. ${item.id}: ${item.name} (${item.type})`);
                });
            } finally {
                // Clean up temp file
                if (fs.existsSync(tempFile)) {
                    fs.unlinkSync(tempFile);
                }
            }

            // Demonstrate headless integration
            console.log('\n5. Headless Integration:');
            console.log(`   Project Root: ${this.integration.projectRoot}`);
            console.log(`   Economy Directory: ${this.integration.economyDir}`);
            console.log(`   Cloud Code Directory: ${this.integration.cloudCodeDir}`);
            console.log(`   Remote Config Directory: ${this.integration.remoteConfigDir}`);

            // Check if directories exist
            const directories = [
                { name: 'Economy', path: this.integration.economyDir },
                { name: 'Cloud Code', path: this.integration.cloudCodeDir },
                { name: 'Remote Config', path: this.integration.remoteConfigDir }
            ];

            directories.forEach(dir => {
                const exists = fs.existsSync(dir.path);
                const status = exists ? '✅' : '⚠️';
                console.log(`   ${status} ${dir.name}: ${dir.path}`);
            });

            console.log('\n✅ Basic API usage demonstration completed!');

        } catch (error) {
            console.error('❌ Error in basic API usage:', error.message);
        }
    }

    async demonstrateAdvancedUsage() {
        console.log('\n🚀 Unity Cloud API Example - Advanced Usage');
        console.log('============================================\n');

        try {
            // Demonstrate error handling
            console.log('1. Error Handling Example:');
            try {
                // This will fail without authentication
                await this.apiClient.getCurrencies();
            } catch (error) {
                console.log(`   ✅ Caught expected error: ${error.message}`);
            }

            // Demonstrate retry configuration
            console.log('\n2. Retry Configuration:');
            console.log(`   Retry Attempts: ${this.apiClient.retryAttempts}`);
            console.log(`   Retry Delay: ${this.apiClient.retryDelay}ms`);

            // Demonstrate bulk operations
            console.log('\n3. Bulk Operations:');
            console.log('   Available bulk operations:');
            console.log('   - deployEconomyFromFiles()');
            console.log('   - deployCloudCodeFromFiles()');
            console.log('   - deployRemoteConfigFromFiles()');
            console.log('   - syncData()');

            // Demonstrate monitoring
            console.log('\n4. Monitoring and Health Checks:');
            console.log('   Available monitoring functions:');
            console.log('   - checkServiceHealth()');
            console.log('   - generateStatusReport()');

            // Demonstrate CLI integration
            console.log('\n5. CLI Integration:');
            console.log('   Available CLI commands:');
            console.log('   - npm run unity:deploy-api');
            console.log('   - npm run unity:sync-api');
            console.log('   - npm run unity:status-api');
            console.log('   - npm run unity:health-api');
            console.log('   - npm run unity:economy-api');
            console.log('   - npm run unity:cloud-code-api');
            console.log('   - npm run unity:remote-config-api');
            console.log('   - npm run unity:analytics-api');

            console.log('\n✅ Advanced usage demonstration completed!');

        } catch (error) {
            console.error('❌ Error in advanced usage:', error.message);
        }
    }

    async demonstrateRealWorldScenario() {
        console.log('\n🌍 Unity Cloud API Example - Real World Scenario');
        console.log('==================================================\n');

        try {
            // Simulate a real-world deployment scenario
            console.log('Scenario: Deploying a Match-3 game economy to Unity Cloud');
            console.log('');

            // Step 1: Check current status
            console.log('Step 1: Check current Unity Cloud status');
            console.log('   Command: npm run unity:status-api');
            console.log('   This would check the current state of all services');

            // Step 2: Deploy economy data
            console.log('\nStep 2: Deploy economy data from local files');
            console.log('   Command: npm run unity:deploy-api -- --economy');
            console.log('   This would deploy currencies, inventory, and catalog from CSV files');

            // Step 3: Deploy cloud code
            console.log('\nStep 3: Deploy cloud code functions');
            console.log('   Command: npm run unity:deploy-api -- --cloud-code');
            console.log('   This would deploy JavaScript functions for game logic');

            // Step 4: Deploy remote config
            console.log('\nStep 4: Deploy remote configuration');
            console.log('   Command: npm run unity:deploy-api -- --remote-config');
            console.log('   This would deploy game configuration settings');

            // Step 5: Verify deployment
            console.log('\nStep 5: Verify deployment');
            console.log('   Command: npm run unity:health-api');
            console.log('   This would check that all services are healthy');

            // Step 6: Monitor analytics
            console.log('\nStep 6: Monitor analytics');
            console.log('   Command: npm run unity:analytics-api');
            console.log('   This would check analytics events and metrics');

            console.log('\n✅ Real-world scenario demonstration completed!');

        } catch (error) {
            console.error('❌ Error in real-world scenario:', error.message);
        }
    }

    async run() {
        console.log('🎮 Unity Cloud API Integration Example');
        console.log('======================================');
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.log('======================================\n');

        await this.demonstrateBasicAPIUsage();
        await this.demonstrateAdvancedUsage();
        await this.demonstrateRealWorldScenario();

        console.log('\n🎉 All examples completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Set up your Unity Cloud credentials');
        console.log('2. Run: npm run unity:test-api');
        console.log('3. Run: npm run unity:deploy-api');
        console.log('4. Check status: npm run unity:status-api');
    }
}

// Run the example
const example = new UnityCloudAPIExample();
example.run().catch(error => {
    console.error('❌ Example failed:', error);
    process.exit(1);
});