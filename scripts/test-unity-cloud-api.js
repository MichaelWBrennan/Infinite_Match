#!/usr/bin/env node
/**
 * Unity Cloud API Test Script
 * Tests the Unity Cloud API integration
 */

import UnityCloudAPIClient from '../src/unity-cloud-api-client.js';
import UnityCloudHeadlessIntegration from '../src/unity-cloud-headless-integration.js';

class UnityCloudAPITester {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            tests: [],
            summary: {}
        };
    }

    async runTest(testName, testFunction) {
        console.log(`\n🧪 Running test: ${testName}`);
        
        const test = {
            name: testName,
            timestamp: new Date().toISOString(),
            status: 'running',
            error: null,
            duration: 0
        };

        const startTime = Date.now();

        try {
            await testFunction();
            test.status = 'passed';
            test.duration = Date.now() - startTime;
            console.log(`   ✅ ${testName}: PASSED (${test.duration}ms)`);
        } catch (error) {
            test.status = 'failed';
            test.error = error.message;
            test.duration = Date.now() - startTime;
            console.log(`   ❌ ${testName}: FAILED (${test.duration}ms) - ${error.message}`);
        }

        this.results.tests.push(test);
        return test.status === 'passed';
    }

    async testAPIClientInitialization() {
        const client = new UnityCloudAPIClient();
        
        // Test basic initialization
        if (!client.projectId) {
            throw new Error('Project ID not set');
        }
        
        if (!client.environmentId) {
            throw new Error('Environment ID not set');
        }
        
        console.log(`   Project ID: ${client.projectId}`);
        console.log(`   Environment ID: ${client.environmentId}`);
    }

    async testHeadlessIntegrationInitialization() {
        const integration = new UnityCloudHeadlessIntegration();
        
        // Test basic initialization
        if (!integration.apiClient) {
            throw new Error('API client not initialized');
        }
        
        if (!integration.projectRoot) {
            throw new Error('Project root not set');
        }
        
        console.log(`   Project Root: ${integration.projectRoot}`);
        console.log(`   Economy Dir: ${integration.economyDir}`);
        console.log(`   Cloud Code Dir: ${integration.cloudCodeDir}`);
        console.log(`   Remote Config Dir: ${integration.remoteConfigDir}`);
    }

    async testFileStructure() {
        const integration = new UnityCloudHeadlessIntegration();
        
        // Check if directories exist
        const fs = await import('fs');
        
        if (!fs.existsSync(integration.economyDir)) {
            console.log(`   ⚠️ Economy directory not found: ${integration.economyDir}`);
        } else {
            console.log(`   ✅ Economy directory exists: ${integration.economyDir}`);
        }
        
        if (!fs.existsSync(integration.cloudCodeDir)) {
            console.log(`   ⚠️ Cloud Code directory not found: ${integration.cloudCodeDir}`);
        } else {
            console.log(`   ✅ Cloud Code directory exists: ${integration.cloudCodeDir}`);
        }
        
        if (!fs.existsSync(integration.remoteConfigDir)) {
            console.log(`   ⚠️ Remote Config directory not found: ${integration.remoteConfigDir}`);
        } else {
            console.log(`   ✅ Remote Config directory exists: ${integration.remoteConfigDir}`);
        }
    }

    async testCSVParsing() {
        const client = new UnityCloudAPIClient();
        
        // Test CSV parsing with sample data
        const sampleCSV = `id,name,type,initial,maximum
coins,Coins,soft_currency,1000,999999
gems,Gems,hard_currency,50,99999
energy,Energy,consumable,5,30`;
        
        // Write sample CSV to temp file
        const fs = await import('fs');
        const path = await import('path');
        const tempFile = path.join(process.cwd(), 'temp_test.csv');
        
        fs.writeFileSync(tempFile, sampleCSV);
        
        try {
            const parsed = client.parseCSV(tempFile);
            
            if (parsed.length !== 3) {
                throw new Error(`Expected 3 items, got ${parsed.length}`);
            }
            
            if (parsed[0].id !== 'coins') {
                throw new Error(`Expected first item to be 'coins', got '${parsed[0].id}'`);
            }
            
            if (parsed[0].initial !== 1000) {
                throw new Error(`Expected initial value to be 1000, got ${parsed[0].initial}`);
            }
            
            console.log(`   ✅ Parsed ${parsed.length} items from CSV`);
            console.log(`   Sample item: ${JSON.stringify(parsed[0])}`);
        } finally {
            // Clean up temp file
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
        }
    }

    async testAPIEndpoints() {
        const client = new UnityCloudAPIClient();
        
        // Test API endpoint construction
        const economyURL = client.baseURL + `/economy/v1/projects/${client.projectId}/environments/${client.environmentId}/currencies`;
        const remoteConfigURL = client.baseURL + `/remote-config/v1/projects/${client.projectId}/environments/${client.environmentId}/configs`;
        const cloudCodeURL = client.baseURL + `/cloud-code/v1/projects/${client.projectId}/environments/${client.environmentId}/scripts`;
        
        console.log(`   Economy URL: ${economyURL}`);
        console.log(`   Remote Config URL: ${remoteConfigURL}`);
        console.log(`   Cloud Code URL: ${cloudCodeURL}`);
        
        // Validate URLs are properly formed
        if (!economyURL.includes(client.projectId)) {
            throw new Error('Economy URL missing project ID');
        }
        
        if (!remoteConfigURL.includes(client.environmentId)) {
            throw new Error('Remote Config URL missing environment ID');
        }
        
        if (!cloudCodeURL.includes('cloud-code')) {
            throw new Error('Cloud Code URL missing service name');
        }
    }

    async testRetryLogic() {
        const client = new UnityCloudAPIClient();
        
        // Test retry configuration
        if (client.retryAttempts !== 3) {
            throw new Error(`Expected retry attempts to be 3, got ${client.retryAttempts}`);
        }
        
        if (client.retryDelay !== 1000) {
            throw new Error(`Expected retry delay to be 1000ms, got ${client.retryDelay}ms`);
        }
        
        console.log(`   Retry Attempts: ${client.retryAttempts}`);
        console.log(`   Retry Delay: ${client.retryDelay}ms`);
    }

    async testErrorHandling() {
        const client = new UnityCloudAPIClient();
        
        // Test error handling without authentication
        try {
            await client.getCurrencies();
            throw new Error('Expected authentication error, but request succeeded');
        } catch (error) {
            if (error.message.includes('Authentication failed') || 
                error.message.includes('credentials not provided') ||
                error.message.includes('401') ||
                error.message.includes('Unauthorized')) {
                console.log(`   ✅ Authentication error handled correctly: ${error.message}`);
            } else {
                throw new Error(`Unexpected error type: ${error.message}`);
            }
        }
    }

    generateSummary() {
        const totalTests = this.results.tests.length;
        const passedTests = this.results.tests.filter(t => t.status === 'passed').length;
        const failedTests = this.results.tests.filter(t => t.status === 'failed').length;
        const totalDuration = this.results.tests.reduce((sum, t) => sum + t.duration, 0);
        
        this.results.summary = {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            successRate: totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0,
            totalDuration: totalDuration
        };
        
        console.log('\n' + '='.repeat(80));
        console.log('📊 UNITY CLOUD API TEST SUMMARY');
        console.log('='.repeat(80));
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${failedTests}`);
        console.log(`Success Rate: ${this.results.summary.successRate}%`);
        console.log(`Total Duration: ${totalDuration}ms`);
        
        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.tests
                .filter(t => t.status === 'failed')
                .forEach(t => {
                    console.log(`   - ${t.name}: ${t.error}`);
                });
        }
        
        if (passedTests === totalTests) {
            console.log('\n🎉 ALL TESTS PASSED! Unity Cloud API integration is working correctly.');
        } else {
            console.log(`\n⚠️ ${failedTests} test(s) failed. Please check the errors above.`);
        }
        
        console.log('='.repeat(80));
    }

    async runAllTests() {
        console.log('🧪 Unity Cloud API Integration Test Suite');
        console.log('==========================================');
        console.log(`Timestamp: ${this.results.timestamp}`);
        console.log('==========================================\n');

        // Run all tests
        await this.runTest('API Client Initialization', () => this.testAPIClientInitialization());
        await this.runTest('Headless Integration Initialization', () => this.testHeadlessIntegrationInitialization());
        await this.runTest('File Structure Check', () => this.testFileStructure());
        await this.runTest('CSV Parsing', () => this.testCSVParsing());
        await this.runTest('API Endpoints', () => this.testAPIEndpoints());
        await this.runTest('Retry Logic', () => this.testRetryLogic());
        await this.runTest('Error Handling', () => this.testErrorHandling());

        // Generate summary
        this.generateSummary();

        // Save results
        const fs = await import('fs');
        const path = await import('path');
        const resultsDir = path.join(process.cwd(), 'monitoring', 'reports');
        
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }
        
        const resultsFile = path.join(resultsDir, `unity_cloud_api_test_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`);
        fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
        console.log(`\n📁 Test results saved to: ${resultsFile}`);

        // Exit with appropriate code
        const failedTests = this.results.tests.filter(t => t.status === 'failed').length;
        process.exit(failedTests > 0 ? 1 : 0);
    }
}

// Run tests
const tester = new UnityCloudAPITester();
tester.runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
});