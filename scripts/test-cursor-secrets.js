#!/usr/bin/env node
/**
 * Test Cursor Secrets Integration
 * Verifies that secrets can be loaded from Cursor account
 */

import { Logger } from '../src/core/logger/index.js';

const logger = new Logger('CursorSecretsTest');

async function testCursorSecrets() {
  logger.info('Testing Cursor secrets integration...');

  const requiredSecrets = [
    'UNITY_PROJECT_ID',
    'UNITY_ENV_ID',
    'UNITY_CLIENT_ID', 
    'UNITY_CLIENT_SECRET'
  ];

  const optionalSecrets = [
    'UNITY_API_TOKEN',
    'UNITY_EMAIL',
    'UNITY_PASSWORD',
    'UNITY_ORG_ID',
    'GITHUB_TOKEN',
    'DEPLOYMENT_ENVIRONMENT'
  ];

  const results = {
    cursorAvailable: false,
    requiredSecrets: {},
    optionalSecrets: {},
    errors: []
  };

  // Check if Cursor is available
  try {
    results.cursorAvailable = typeof cursor !== 'undefined' && typeof cursor.getSecret === 'function';
    logger.info(`Cursor API available: ${results.cursorAvailable}`);
  } catch (error) {
    logger.warn('Cursor API not available:', error.message);
  }

  // Test required secrets
  logger.info('Testing required secrets...');
  for (const secretName of requiredSecrets) {
    try {
      let value = null;
      
      if (results.cursorAvailable) {
        value = await cursor.getSecret(secretName);
      }
      
      if (!value) {
        value = process.env[secretName];
      }

      results.requiredSecrets[secretName] = {
        found: !!value,
        source: results.cursorAvailable && value ? 'cursor' : 'environment',
        masked: value ? '***' + value.slice(-4) : 'Not found'
      };

      if (value) {
        logger.info(`✅ ${secretName}: Found (${results.requiredSecrets[secretName].source})`);
      } else {
        logger.warn(`❌ ${secretName}: Not found`);
        results.errors.push(`Missing required secret: ${secretName}`);
      }
    } catch (error) {
      logger.error(`Error testing ${secretName}:`, error.message);
      results.errors.push(`Error testing ${secretName}: ${error.message}`);
    }
  }

  // Test optional secrets
  logger.info('Testing optional secrets...');
  for (const secretName of optionalSecrets) {
    try {
      let value = null;
      
      if (results.cursorAvailable) {
        value = await cursor.getSecret(secretName);
      }
      
      if (!value) {
        value = process.env[secretName];
      }

      results.optionalSecrets[secretName] = {
        found: !!value,
        source: results.cursorAvailable && value ? 'cursor' : 'environment',
        masked: value ? '***' + value.slice(-4) : 'Not found'
      };

      if (value) {
        logger.info(`✅ ${secretName}: Found (${results.optionalSecrets[secretName].source})`);
      } else {
        logger.info(`ℹ️  ${secretName}: Not set (optional)`);
      }
    } catch (error) {
      logger.warn(`Error testing optional secret ${secretName}:`, error.message);
    }
  }

  // Summary
  const requiredFound = Object.values(results.requiredSecrets).filter(s => s.found).length;
  const requiredTotal = requiredSecrets.length;
  const optionalFound = Object.values(results.optionalSecrets).filter(s => s.found).length;
  const optionalTotal = optionalSecrets.length;

  logger.info('=== CURSOR SECRETS TEST SUMMARY ===');
  logger.info(`Cursor API Available: ${results.cursorAvailable ? '✅ Yes' : '❌ No'}`);
  logger.info(`Required Secrets: ${requiredFound}/${requiredTotal} found`);
  logger.info(`Optional Secrets: ${optionalFound}/${optionalTotal} found`);
  logger.info(`Errors: ${results.errors.length}`);

  if (results.errors.length > 0) {
    logger.error('Errors encountered:');
    results.errors.forEach(error => logger.error(`  - ${error}`));
  }

  if (requiredFound === requiredTotal) {
    logger.info('🎉 All required secrets are available! You can use Cursor web GUI for Unity Cloud updates.');
  } else {
    logger.warn('⚠️  Some required secrets are missing. Please set them up in Cursor settings.');
  }

  return results;
}

// Run the test
testCursorSecrets()
  .then((results) => {
    if (results.errors.length === 0 && Object.values(results.requiredSecrets).every(s => s.found)) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch((error) => {
    logger.error('Test failed:', error.message);
    process.exit(1);
  });