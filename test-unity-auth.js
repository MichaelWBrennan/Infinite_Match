#!/usr/bin/env node
/**
 * Test Unity OAuth Authentication
 * Run this after setting up OAuth credentials
 */

import { AppConfig } from './src/core/config/index.js';
import { Logger } from './src/core/logger/index.js';

const logger = new Logger('UnityAuthTest');

async function testUnityAuth() {
  console.log('Testing Unity OAuth Authentication...\n');
  
  // Check if credentials are available
  if (!AppConfig.unity.clientId || !AppConfig.unity.clientSecret) {
    console.log('❌ Unity OAuth credentials not configured');
    console.log('Please set UNITY_CLIENT_ID and UNITY_CLIENT_SECRET environment variables');
    return;
  }
  
  console.log('✅ OAuth credentials found');
  console.log(`Project ID: ${AppConfig.unity.projectId}`);
  console.log(`Environment ID: ${AppConfig.unity.environmentId}`);
  console.log(`Client ID: ${AppConfig.unity.clientId}`);
  console.log(`Client Secret: ${'*'.repeat(AppConfig.unity.clientSecret.length)}`);
  
  // Test authentication
  try {
    const authUrl = 'https://services.api.unity.com/oauth/token';
    const authData = {
      grant_type: 'client_credentials',
      client_id: AppConfig.unity.clientId,
      client_secret: AppConfig.unity.clientSecret,
      scope: 'economy inventory cloudcode remoteconfig',
    };

    console.log('\n🔐 Attempting OAuth authentication...');
    
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(authData),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Authentication successful!');
      console.log(`Token type: ${data.token_type}`);
      console.log(`Expires in: ${data.expires_in} seconds`);
      console.log(`Scope: ${data.scope}`);
      
      // Test a simple API call
      console.log('\n🧪 Testing API call...');
      const apiResponse = await fetch(`https://services.api.unity.com/economy/v1/projects/${AppConfig.unity.projectId}/environments/${AppConfig.unity.environmentId}/currencies`, {
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (apiResponse.ok) {
        console.log('✅ API call successful!');
        const currencies = await apiResponse.json();
        console.log(`Found ${currencies.results?.length || 0} currencies`);
      } else {
        console.log(`❌ API call failed: ${apiResponse.status}`);
      }
      
    } else {
      const errorText = await response.text();
      console.log(`❌ Authentication failed: ${response.status}`);
      console.log(`Error: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
}

testUnityAuth();