#!/usr/bin/env node

/**
 * API and Secrets Test Script
 * Tests all mobile game APIs and secrets
 */

const fetch = require('node-fetch');
const { Logger } = require('./src/core/logger/index.js');

const logger = new Logger('APITester');

// Test configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 5000;

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to run test
async function runTest(name, testFn) {
  testResults.total++;
  logger.info(`Running test: ${name}`);
  
  try {
    const result = await Promise.race([
      testFn(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test timeout')), TEST_TIMEOUT)
      )
    ]);
    
    testResults.passed++;
    testResults.details.push({ name, status: 'PASS', result });
    logger.info(`✅ ${name} - PASSED`);
    return result;
  } catch (error) {
    testResults.failed++;
    testResults.details.push({ name, status: 'FAIL', error: error.message });
    logger.error(`❌ ${name} - FAILED: ${error.message}`);
    return null;
  }
}

// Test 1: Environment Variables and Secrets
async function testEnvironmentVariables() {
  const requiredEnvVars = [
    'NODE_ENV',
    'DATABASE_URL',
    'REDIS_URL',
    'MONGODB_URI',
    'UNITY_PROJECT_ID',
    'UNITY_ENV_ID',
    'UNITY_ORG_ID',
    'UNITY_CLIENT_ID',
    'UNITY_CLIENT_SECRET',
    'UNITY_API_TOKEN',
    'JWT_SECRET',
    'ENCRYPTION_KEY'
  ];

  const missingVars = [];
  const presentVars = [];

  for (const varName of requiredEnvVars) {
    if (process.env[varName]) {
      presentVars.push(varName);
    } else {
      missingVars.push(varName);
    }
  }

  return {
    total: requiredEnvVars.length,
    present: presentVars.length,
    missing: missingVars.length,
    missingVars,
    presentVars
  };
}

// Test 2: API Gateway Health Check
async function testAPIGatewayHealth() {
  const response = await fetch(`${BASE_URL}/health`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.status !== 'healthy') {
    throw new Error(`API Gateway not healthy: ${data.status}`);
  }
  
  return data;
}

// Test 3: Mobile Game Health Check
async function testMobileGameHealth() {
  const response = await fetch(`${BASE_URL}/health/mobile`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.status !== 'healthy') {
    throw new Error(`Mobile game not healthy: ${data.status}`);
  }
  
  return data;
}

// Test 4: Game Service API
async function testGameServiceAPI() {
  const response = await fetch(`${BASE_URL}/api/game/health`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
}

// Test 5: Economy Service API
async function testEconomyServiceAPI() {
  const response = await fetch(`${BASE_URL}/api/economy/health`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
}

// Test 6: Analytics Service API
async function testAnalyticsServiceAPI() {
  const response = await fetch(`${BASE_URL}/api/analytics/health`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
}

// Test 7: Security Service API
async function testSecurityServiceAPI() {
  const response = await fetch(`${BASE_URL}/api/security/health`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
}

// Test 8: Unity Service API
async function testUnityServiceAPI() {
  const response = await fetch(`${BASE_URL}/api/unity/health`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
}

// Test 9: AI Service API
async function testAIServiceAPI() {
  const response = await fetch(`${BASE_URL}/api/ai/health`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
}

// Test 10: Mobile Game Configuration
async function testMobileGameConfig() {
  const response = await fetch(`${BASE_URL}/api/mobile/config`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.gameVersion || !data.apiVersion) {
    throw new Error('Missing required configuration fields');
  }
  
  return data;
}

// Test 11: Mobile Game Status
async function testMobileGameStatus() {
  const response = await fetch(`${BASE_URL}/api/mobile/status`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.status !== 'healthy') {
    throw new Error(`Mobile game status not healthy: ${data.status}`);
  }
  
  return data;
}

// Test 12: Database Connection Test
async function testDatabaseConnection() {
  // This would test actual database connectivity
  // For now, we'll check if the environment variables are set
  const dbUrl = process.env.DATABASE_URL;
  const redisUrl = process.env.REDIS_URL;
  const mongoUrl = process.env.MONGODB_URI;
  
  if (!dbUrl || !redisUrl || !mongoUrl) {
    throw new Error('Database connection URLs not configured');
  }
  
  return {
    postgres: dbUrl ? 'configured' : 'missing',
    redis: redisUrl ? 'configured' : 'missing',
    mongodb: mongoUrl ? 'configured' : 'missing'
  };
}

// Test 13: Unity Cloud Integration Test
async function testUnityCloudIntegration() {
  const unityVars = [
    'UNITY_PROJECT_ID',
    'UNITY_ENV_ID',
    'UNITY_ORG_ID',
    'UNITY_CLIENT_ID',
    'UNITY_CLIENT_SECRET',
    'UNITY_API_TOKEN'
  ];
  
  const configuredVars = unityVars.filter(varName => process.env[varName]);
  
  if (configuredVars.length !== unityVars.length) {
    throw new Error(`Unity Cloud not fully configured. Missing: ${unityVars.filter(v => !process.env[v]).join(', ')}`);
  }
  
  return {
    configured: configuredVars.length,
    total: unityVars.length,
    status: 'configured'
  };
}

// Test 14: Security Configuration Test
async function testSecurityConfiguration() {
  const securityVars = [
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'ADMIN_TOKEN'
  ];
  
  const configuredVars = securityVars.filter(varName => process.env[varName]);
  
  if (configuredVars.length !== securityVars.length) {
    throw new Error(`Security not fully configured. Missing: ${securityVars.filter(v => !process.env[v]).join(', ')}`);
  }
  
  return {
    configured: configuredVars.length,
    total: securityVars.length,
    status: 'configured'
  };
}

// Test 15: Mobile Game Security Test
async function testMobileGameSecurity() {
  const response = await fetch(`${BASE_URL}/api/mobile/device/fingerprint`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      deviceInfo: {
        platform: 'test',
        deviceModel: 'test-device',
        osVersion: 'test-os',
        appVersion: '1.0.0'
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
}

// Main test runner
async function runAllTests() {
  logger.info('🚀 Starting API and Secrets Test Suite');
  logger.info('=====================================');
  
  // Test environment variables first
  await runTest('Environment Variables', testEnvironmentVariables);
  
  // Test database connections
  await runTest('Database Connection', testDatabaseConnection);
  
  // Test Unity Cloud integration
  await runTest('Unity Cloud Integration', testUnityCloudIntegration);
  
  // Test security configuration
  await runTest('Security Configuration', testSecurityConfiguration);
  
  // Test API endpoints (these will fail if server is not running)
  await runTest('API Gateway Health', testAPIGatewayHealth);
  await runTest('Mobile Game Health', testMobileGameHealth);
  await runTest('Game Service API', testGameServiceAPI);
  await runTest('Economy Service API', testEconomyServiceAPI);
  await runTest('Analytics Service API', testAnalyticsServiceAPI);
  await runTest('Security Service API', testSecurityServiceAPI);
  await runTest('Unity Service API', testUnityServiceAPI);
  await runTest('AI Service API', testAIServiceAPI);
  await runTest('Mobile Game Config', testMobileGameConfig);
  await runTest('Mobile Game Status', testMobileGameStatus);
  await runTest('Mobile Game Security', testMobileGameSecurity);
  
  // Generate test report
  generateTestReport();
}

// Generate test report
function generateTestReport() {
  logger.info('\n📊 Test Results Summary');
  logger.info('======================');
  logger.info(`Total Tests: ${testResults.total}`);
  logger.info(`Passed: ${testResults.passed}`);
  logger.info(`Failed: ${testResults.failed}`);
  logger.info(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  logger.info('\n📋 Detailed Results');
  logger.info('==================');
  
  testResults.details.forEach(test => {
    const status = test.status === 'PASS' ? '✅' : '❌';
    logger.info(`${status} ${test.name}`);
    if (test.status === 'FAIL') {
      logger.info(`   Error: ${test.error}`);
    }
  });
  
  // Save results to file
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: (testResults.passed / testResults.total) * 100
    },
    details: testResults.details
  };
  
  const fs = require('fs');
  fs.writeFileSync('api-test-results.json', JSON.stringify(report, null, 2));
  logger.info('\n💾 Test results saved to api-test-results.json');
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run the tests
runAllTests().catch(error => {
  logger.error('Test suite failed:', error);
  process.exit(1);
});