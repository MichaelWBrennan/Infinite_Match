#!/usr/bin/env node

/**
 * Stripe Integration Test Script
 * Tests the Stripe integration endpoints and functionality
 */

import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/stripe';
const TEST_EMAIL = 'test@example.com';
const TEST_NAME = 'Test User';

// Test configuration
const TESTS = {
  initialization: {
    name: 'Stripe Initialization',
    endpoint: '/publishable-key',
    method: 'GET',
    expectedStatus: 200,
  },
  createCustomer: {
    name: 'Create Customer',
    endpoint: '/customer',
    method: 'POST',
    body: {
      email: TEST_EMAIL,
      name: TEST_NAME,
      metadata: {
        playerId: 'test_player_123',
        gameVersion: '1.0.0',
      },
    },
    expectedStatus: 200,
  },
  createPaymentIntent: {
    name: 'Create Payment Intent',
    endpoint: '/payment-intent',
    method: 'POST',
    body: {
      amount: 9.99,
      currency: 'usd',
      productId: 'gems_1000',
      metadata: {
        playerId: 'test_player_123',
        gameVersion: '1.0.0',
      },
    },
    expectedStatus: 200,
  },
  createProduct: {
    name: 'Create Product',
    endpoint: '/product',
    method: 'POST',
    body: {
      name: 'Test Product',
      description: 'A test product for integration testing',
      metadata: {
        gameItemId: 'test_item_123',
      },
    },
    expectedStatus: 200,
  },
  createPrice: {
    name: 'Create Price',
    endpoint: '/price',
    method: 'POST',
    body: {
      productId: 'prod_test_123', // This would be replaced with actual product ID
      unitAmount: 4.99,
      currency: 'usd',
      metadata: {
        gameItemId: 'test_item_123',
      },
    },
    expectedStatus: 200,
  },
  getPurchaseHistory: {
    name: 'Get Purchase History',
    endpoint: '/purchases?limit=10&offset=0',
    method: 'GET',
    expectedStatus: 200,
  },
};

// Test results storage
let testResults = [];
let customerId = null;
let productId = null;

/**
 * Run a single test
 */
async function runTest(testName, testConfig) {
  console.log(`\n🧪 Running test: ${testName}`);
  
  try {
    const url = `${API_BASE_URL}${testConfig.endpoint}`;
    const options = {
      method: testConfig.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (testConfig.body) {
      options.body = JSON.stringify(testConfig.body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    const success = response.status === testConfig.expectedStatus && data.success;

    if (success) {
      console.log(`✅ ${testName} - PASSED`);
      
      // Store important IDs for dependent tests
      if (testName === 'Create Customer' && data.customerId) {
        customerId = data.customerId;
        console.log(`   Customer ID: ${customerId}`);
      }
      
      if (testName === 'Create Product' && data.productId) {
        productId = data.productId;
        console.log(`   Product ID: ${productId}`);
      }
    } else {
      console.log(`❌ ${testName} - FAILED`);
      console.log(`   Expected status: ${testConfig.expectedStatus}, got: ${response.status}`);
      console.log(`   Response:`, JSON.stringify(data, null, 2));
    }

    testResults.push({
      name: testName,
      success,
      status: response.status,
      expectedStatus: testConfig.expectedStatus,
      response: data,
    });

    return success;
  } catch (error) {
    console.log(`❌ ${testName} - ERROR`);
    console.log(`   Error: ${error.message}`);
    
    testResults.push({
      name: testName,
      success: false,
      error: error.message,
    });

    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🎮 Starting Stripe Integration Tests');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log('=' .repeat(50));

  let passedTests = 0;
  let totalTests = Object.keys(TESTS).length;

  // Run tests in order
  for (const [testKey, testConfig] of Object.entries(TESTS)) {
    const success = await runTest(testConfig.name, testConfig);
    if (success) passedTests++;
  }

  // Update dependent tests with actual IDs
  if (productId) {
    TESTS.createPrice.body.productId = productId;
  }

  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results Summary');
  console.log('=' .repeat(50));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Stripe integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
  }

  return passedTests === totalTests;
}

/**
 * Test webhook endpoint (requires manual testing)
 */
function testWebhookEndpoint() {
  console.log('\n🔔 Webhook Testing');
  console.log('=' .repeat(50));
  console.log('To test webhooks:');
  console.log('1. Start webhook listener: stripe listen --forward-to localhost:3000/api/stripe/webhook');
  console.log('2. Trigger test events: stripe trigger payment_intent.succeeded');
  console.log('3. Check server logs for webhook processing');
  console.log('4. Verify purchase ledger entries');
}

/**
 * Test Stripe CLI integration
 */
async function testStripeCLI() {
  console.log('\n🛠️  Stripe CLI Testing');
  console.log('=' .repeat(50));
  
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    // Test if Stripe CLI is installed
    try {
      const { stdout } = await execAsync('stripe --version');
      console.log(`✅ Stripe CLI installed: ${stdout.trim()}`);
    } catch (error) {
      console.log('❌ Stripe CLI not installed or not in PATH');
      console.log('   Install from: https://stripe.com/docs/stripe-cli');
      return false;
    }

    // Test if logged in
    try {
      const { stdout } = await execAsync('stripe config --list');
      console.log('✅ Stripe CLI logged in');
      console.log('   Configuration:', stdout.trim());
    } catch (error) {
      console.log('❌ Stripe CLI not logged in');
      console.log('   Run: stripe login');
      return false;
    }

    return true;
  } catch (error) {
    console.log('❌ Error testing Stripe CLI:', error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🎮 Stripe Integration Test Suite');
  console.log('================================\n');

  // Check environment variables
  const requiredEnvVars = ['STRIPE_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    console.log('❌ Missing required environment variables:');
    missingEnvVars.forEach(envVar => console.log(`   - ${envVar}`));
    console.log('\nPlease set these in your .env file');
    process.exit(1);
  }

  console.log('✅ Environment variables configured');

  // Test Stripe CLI
  const cliWorking = await testStripeCLI();

  // Run API tests
  const allTestsPassed = await runAllTests();

  // Test webhook endpoint
  testWebhookEndpoint();

  // Final summary
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Final Summary');
  console.log('=' .repeat(50));
  
  if (allTestsPassed && cliWorking) {
    console.log('🎉 Stripe integration is fully functional!');
    console.log('\nNext steps:');
    console.log('1. Test payments using stripe-test.html');
    console.log('2. Set up webhook listeners for production');
    console.log('3. Configure live Stripe keys for production');
  } else {
    console.log('⚠️  Some issues detected. Please review the output above.');
    process.exit(1);
  }
}

// Run the tests
main().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});