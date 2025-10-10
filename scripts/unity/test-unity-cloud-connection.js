#!/usr/bin/env node
/**
 * Unity Cloud Connection Tester
 * Tests Unity Cloud dashboard connection and verifies all secrets are working
 */

import { Logger } from '../../src/core/logger/index.js';
import { AppConfig } from '../../src/core/config/index.js';

const logger = new Logger('UnityCloudTester');

class UnityCloudConnectionTester {
  constructor() {
    this.projectId = AppConfig.unity.projectId;
    this.environmentId = AppConfig.unity.environmentId;
    this.clientId = AppConfig.unity.clientId;
    this.clientSecret = AppConfig.unity.clientSecret;
    this.baseUrl = 'https://services.api.unity.com';
    this.accessToken = null;
    this.testResults = {
      timestamp: new Date().toISOString(),
      overallStatus: 'unknown',
      tests: {},
      recommendations: []
    };
  }

  /**
   * Test Unity Cloud OAuth authentication
   */
  async testAuthentication() {
    logger.info('🔐 Testing Unity Cloud OAuth authentication...');
    
    const testResult = {
      name: 'OAuth Authentication',
      status: 'unknown',
      details: {},
      error: null
    };

    try {
      if (!this.clientId || !this.clientSecret) {
        testResult.status = 'failed';
        testResult.error = 'Missing client credentials';
        testResult.details = {
          clientId: this.clientId ? 'SET' : 'NOT SET',
          clientSecret: this.clientSecret ? 'SET' : 'NOT SET'
        };
        return testResult;
      }

      const authUrl = 'https://services.api.unity.com/oauth/token';
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

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.access_token;
        testResult.status = 'passed';
        testResult.details = {
          tokenType: data.token_type,
          expiresIn: data.expires_in,
          scope: data.scope,
          projectId: this.projectId,
          environmentId: this.environmentId
        };
        logger.info('✅ OAuth authentication successful');
      } else {
        const errorText = await response.text();
        testResult.status = 'failed';
        testResult.error = `HTTP ${response.status}: ${errorText}`;
        testResult.details = {
          status: response.status,
          statusText: response.statusText
        };
        logger.error('❌ OAuth authentication failed', testResult.details);
      }
    } catch (error) {
      testResult.status = 'failed';
      testResult.error = error.message;
      logger.error('❌ OAuth authentication error', { error: error.message });
    }

    return testResult;
  }

  /**
   * Test Unity Cloud API endpoints
   */
  async testApiEndpoints() {
    logger.info('🌐 Testing Unity Cloud API endpoints...');
    
    const testResult = {
      name: 'API Endpoints',
      status: 'unknown',
      endpoints: {},
      error: null
    };

    if (!this.accessToken) {
      testResult.status = 'skipped';
      testResult.error = 'No access token available';
      return testResult;
    }

    const endpoints = [
      {
        name: 'Economy Currencies',
        url: `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/currencies`,
        method: 'GET'
      },
      {
        name: 'Economy Inventory',
        url: `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/inventory-items`,
        method: 'GET'
      },
      {
        name: 'Economy Catalog',
        url: `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/catalog-items`,
        method: 'GET'
      },
      {
        name: 'Cloud Code Functions',
        url: `/cloudcode/v1/projects/${this.projectId}/environments/${this.environmentId}/functions`,
        method: 'GET'
      },
      {
        name: 'Remote Config',
        url: `/remote-config/v1/projects/${this.projectId}/environments/${this.environmentId}/configs`,
        method: 'GET'
      }
    ];

    let passedEndpoints = 0;
    let totalEndpoints = endpoints.length;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint.url}`, {
          method: endpoint.method,
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        const endpointResult = {
          status: response.ok ? 'passed' : 'failed',
          statusCode: response.status,
          responseTime: Date.now()
        };

        if (response.ok) {
          const data = await response.json();
          endpointResult.dataCount = Array.isArray(data) ? data.length : 1;
          passedEndpoints++;
          logger.info(`✅ ${endpoint.name}: OK (${endpointResult.dataCount} items)`);
        } else {
          const errorText = await response.text();
          endpointResult.error = errorText;
          logger.warn(`⚠️ ${endpoint.name}: ${response.status} - ${errorText}`);
        }

        testResult.endpoints[endpoint.name] = endpointResult;
      } catch (error) {
        testResult.endpoints[endpoint.name] = {
          status: 'failed',
          error: error.message
        };
        logger.error(`❌ ${endpoint.name}: ${error.message}`);
      }
    }

    testResult.status = passedEndpoints === totalEndpoints ? 'passed' : 
                       passedEndpoints > 0 ? 'partial' : 'failed';
    testResult.details = {
      passed: passedEndpoints,
      total: totalEndpoints,
      successRate: `${Math.round((passedEndpoints / totalEndpoints) * 100)}%`
    };

    return testResult;
  }

  /**
   * Test project and environment access
   */
  async testProjectAccess() {
    logger.info('🏗️ Testing project and environment access...');
    
    const testResult = {
      name: 'Project Access',
      status: 'unknown',
      details: {},
      error: null
    };

    try {
      // Test project info endpoint
      const projectUrl = `https://services.api.unity.com/projects/v1/projects/${this.projectId}`;
      const response = await fetch(projectUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const projectData = await response.json();
        testResult.status = 'passed';
        testResult.details = {
          projectName: projectData.name || 'Unknown',
          projectId: projectData.id,
          environmentId: this.environmentId,
          accessLevel: 'Full API Access'
        };
        logger.info('✅ Project access confirmed');
      } else {
        testResult.status = 'failed';
        testResult.error = `HTTP ${response.status}: ${await response.text()}`;
        logger.error('❌ Project access failed', { status: response.status });
      }
    } catch (error) {
      testResult.status = 'failed';
      testResult.error = error.message;
      logger.error('❌ Project access error', { error: error.message });
    }

    return testResult;
  }

  /**
   * Test secrets configuration
   */
  testSecretsConfiguration() {
    logger.info('🔑 Testing secrets configuration...');
    
    const testResult = {
      name: 'Secrets Configuration',
      status: 'unknown',
      details: {},
      error: null
    };

    const secrets = {
      'UNITY_PROJECT_ID': this.projectId,
      'UNITY_ENV_ID': this.environmentId,
      'UNITY_CLIENT_ID': this.clientId,
      'UNITY_CLIENT_SECRET': this.clientSecret
    };

    const requiredSecrets = ['UNITY_PROJECT_ID', 'UNITY_ENV_ID', 'UNITY_CLIENT_ID', 'UNITY_CLIENT_SECRET'];
    const missingSecrets = requiredSecrets.filter(secret => !secrets[secret] || secrets[secret] === '');

    testResult.details = {
      configured: Object.keys(secrets).length - missingSecrets.length,
      total: Object.keys(secrets).length,
      missing: missingSecrets,
      projectId: this.projectId ? 'SET' : 'NOT SET',
      environmentId: this.environmentId ? 'SET' : 'NOT SET',
      clientId: this.clientId ? 'SET' : 'NOT SET',
      clientSecret: this.clientSecret ? 'SET' : 'NOT SET'
    };

    if (missingSecrets.length === 0) {
      testResult.status = 'passed';
      logger.info('✅ All required secrets are configured');
    } else {
      testResult.status = 'failed';
      testResult.error = `Missing secrets: ${missingSecrets.join(', ')}`;
      logger.error('❌ Missing required secrets', { missing: missingSecrets });
    }

    return testResult;
  }

  /**
   * Test Unity Cloud dashboard ping
   */
  async testDashboardPing() {
    logger.info('📊 Testing Unity Cloud dashboard ping...');
    
    const testResult = {
      name: 'Dashboard Ping',
      status: 'unknown',
      details: {},
      error: null
    };

    try {
      // Test Unity Cloud dashboard connectivity
      const dashboardUrl = 'https://dashboard.unity3d.com';
      const response = await fetch(dashboardUrl, {
        method: 'HEAD',
        timeout: 10000
      });

      if (response.ok) {
        testResult.status = 'passed';
        testResult.details = {
          dashboardUrl: dashboardUrl,
          responseTime: Date.now(),
          statusCode: response.status,
          accessible: true
        };
        logger.info('✅ Unity Cloud dashboard is accessible');
      } else {
        testResult.status = 'failed';
        testResult.error = `HTTP ${response.status}`;
        testResult.details = {
          statusCode: response.status,
          accessible: false
        };
        logger.warn('⚠️ Unity Cloud dashboard returned non-200 status');
      }
    } catch (error) {
      testResult.status = 'failed';
      testResult.error = error.message;
      testResult.details = {
        accessible: false,
        error: error.message
      };
      logger.error('❌ Unity Cloud dashboard ping failed', { error: error.message });
    }

    return testResult;
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations() {
    const recommendations = [];

    // Check authentication
    if (this.testResults.tests.authentication?.status === 'failed') {
      recommendations.push({
        priority: 'high',
        category: 'Authentication',
        message: 'Fix Unity Cloud OAuth credentials - check UNITY_CLIENT_ID and UNITY_CLIENT_SECRET',
        action: 'Verify credentials in Unity Dashboard > Settings > API Keys'
      });
    }

    // Check API endpoints
    if (this.testResults.tests.apiEndpoints?.status === 'failed') {
      recommendations.push({
        priority: 'high',
        category: 'API Access',
        message: 'Unity Cloud API endpoints are not accessible - check project permissions',
        action: 'Verify project ID and environment ID are correct'
      });
    }

    // Check secrets
    if (this.testResults.tests.secrets?.status === 'failed') {
      recommendations.push({
        priority: 'high',
        category: 'Configuration',
        message: 'Missing required Unity Cloud secrets',
        action: 'Set up secrets in Cursor settings or environment variables'
      });
    }

    // Check dashboard access
    if (this.testResults.tests.dashboard?.status === 'failed') {
      recommendations.push({
        priority: 'medium',
        category: 'Connectivity',
        message: 'Unity Cloud dashboard is not accessible',
        action: 'Check internet connection and Unity Cloud service status'
      });
    }

    return recommendations;
  }

  /**
   * Run all connection tests
   */
  async runAllTests() {
    logger.info('🚀 Starting Unity Cloud connection tests...');
    console.log('\n' + '='.repeat(80));
    console.log('🎮 UNITY CLOUD CONNECTION TESTER');
    console.log('='.repeat(80));
    console.log(`Project ID: ${this.projectId}`);
    console.log(`Environment ID: ${this.environmentId}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('='.repeat(80) + '\n');

    // Run all tests
    this.testResults.tests.secrets = this.testSecretsConfiguration();
    this.testResults.tests.dashboard = await this.testDashboardPing();
    this.testResults.tests.authentication = await this.testAuthentication();
    this.testResults.tests.apiEndpoints = await this.testApiEndpoints();
    this.testResults.tests.projectAccess = await this.testProjectAccess();

    // Calculate overall status
    const testStatuses = Object.values(this.testResults.tests).map(test => test.status);
    const failedTests = testStatuses.filter(status => status === 'failed').length;
    const passedTests = testStatuses.filter(status => status === 'passed').length;
    const totalTests = testStatuses.length;

    if (failedTests === 0) {
      this.testResults.overallStatus = 'passed';
    } else if (passedTests > 0) {
      this.testResults.overallStatus = 'partial';
    } else {
      this.testResults.overallStatus = 'failed';
    }

    // Generate recommendations
    this.testResults.recommendations = this.generateRecommendations();

    // Display results
    this.displayResults();

    return this.testResults;
  }

  /**
   * Display test results in a formatted way
   */
  displayResults() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(80));

    // Overall status
    const statusEmoji = {
      'passed': '✅',
      'partial': '⚠️',
      'failed': '❌',
      'unknown': '❓'
    };

    console.log(`\nOverall Status: ${statusEmoji[this.testResults.overallStatus]} ${this.testResults.overallStatus.toUpperCase()}`);

    // Individual test results
    console.log('\n📋 Individual Test Results:');
    console.log('-'.repeat(50));

    Object.entries(this.testResults.tests).forEach(([testName, result]) => {
      const emoji = statusEmoji[result.status] || '❓';
      console.log(`${emoji} ${result.name}: ${result.status.toUpperCase()}`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.details && Object.keys(result.details).length > 0) {
        Object.entries(result.details).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      }
      console.log('');
    });

    // Recommendations
    if (this.testResults.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS:');
      console.log('-'.repeat(50));
      this.testResults.recommendations.forEach((rec, index) => {
        const priorityEmoji = rec.priority === 'high' ? '🔴' : '🟡';
        console.log(`${priorityEmoji} ${index + 1}. [${rec.category}] ${rec.message}`);
        console.log(`   Action: ${rec.action}`);
        console.log('');
      });
    }

    console.log('='.repeat(80));
    console.log('🎯 Unity Cloud Connection Test Complete!');
    console.log('='.repeat(80) + '\n');
  }

  /**
   * Save test results to file
   */
  async saveResults() {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const resultsDir = path.join(process.cwd(), 'monitoring', 'reports');
    await fs.mkdir(resultsDir, { recursive: true });
    
    const filename = `unity_cloud_connection_test_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(resultsDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(this.testResults, null, 2));
    logger.info(`📁 Test results saved to: ${filepath}`);
    
    return filepath;
  }
}

// Run the tests
const tester = new UnityCloudConnectionTester();
tester.runAllTests()
  .then(async (results) => {
    await tester.saveResults();
    
    // Exit with appropriate code
    if (results.overallStatus === 'passed') {
      process.exit(0);
    } else if (results.overallStatus === 'partial') {
      process.exit(1);
    } else {
      process.exit(2);
    }
  })
  .catch((error) => {
    logger.error('❌ Test execution failed', { error: error.message });
    process.exit(3);
  });