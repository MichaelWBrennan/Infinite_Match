#!/usr/bin/env node
/**
 * Test Unity Cloud API Authentication
 * This script tests if Unity Cloud API credentials are working
 */

import { Logger } from '../src/core/logger/index.js';
import { registerServices, getService } from '../src/core/services/ServiceRegistry.js';

const logger = new Logger('UnityAuthTest');

async function testUnityAuth() {
  try {
    logger.info('Testing Unity Cloud API authentication...');
    
    // Register services
    registerServices();
    
    // Get Unity service
    const unityService = getService('unityService');
    
    // Log current configuration
    logger.info('Unity configuration:', {
      projectId: unityService.projectId,
      environmentId: unityService.environmentId,
      clientId: unityService.clientId ? '***SET***' : 'NOT SET',
      clientSecret: unityService.clientSecret ? '***SET***' : 'NOT SET',
      hasCredentials: !!(unityService.clientId && unityService.clientSecret)
    });
    
    // Test authentication
    const authenticated = await unityService.authenticate();
    
    if (authenticated) {
      logger.info('✅ Unity authentication successful!');
      
      // Test a simple API call
      try {
        const currencies = await unityService.getCurrencies();
        logger.info('✅ API call successful!', { currenciesCount: currencies?.length || 0 });
      } catch (apiError) {
        logger.warn('⚠️ API call failed, but authentication worked', { error: apiError.message });
      }
    } else {
      logger.error('❌ Unity authentication failed');
    }
    
  } catch (error) {
    logger.error('❌ Test failed', { error: error.message });
  }
}

testUnityAuth();