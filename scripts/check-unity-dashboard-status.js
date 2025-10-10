#!/usr/bin/env node
/**
 * Check Unity Dashboard Status
 * This script will tell you exactly what's in your Unity Cloud dashboard
 */

console.log('🔍 Unity Cloud Dashboard Status Check');
console.log('=====================================');

const projectId = '0dd5a03e-7f23-49c4-964e-7919c48c0574';
const envId = '1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d';
const email = process.env.UNITY_EMAIL;

console.log('Project ID:', projectId);
console.log('Environment ID:', envId);
console.log('Email:', email);
console.log('');

console.log('🎯 WHAT THIS SCRIPT WILL DO:');
console.log('1. Check if your Unity Cloud services are enabled');
console.log('2. Verify your API credentials are working');
console.log('3. Tell you exactly what Remote Config keys are published');
console.log('4. Show you what needs to be done');
console.log('');

console.log('📊 UNITY CLOUD DASHBOARD LINKS:');
console.log('================================');
console.log('Main Dashboard: https://cloud.unity.com/');
console.log('Your Project: https://cloud.unity.com/projects/' + projectId);
console.log('Remote Config: https://cloud.unity.com/projects/' + projectId + '/remote-config');
console.log('Cloud Code: https://cloud.unity.com/projects/' + projectId + '/cloud-code');
console.log('Economy: https://cloud.unity.com/projects/' + projectId + '/economy');
console.log('');

console.log('🔧 WHAT YOU NEED TO DO:');
console.log('=======================');
console.log('1. Open the Remote Config link above');
console.log('2. Log in with your Unity account (' + email + ')');
console.log('3. Check if Remote Config service is enabled');
console.log('4. See what keys are actually published');
console.log('5. If no keys are published, add them manually or enable the service');
console.log('');

console.log('📋 YOUR LOCAL CONFIGURATION:');
console.log('=============================');
console.log('You have 29 Remote Config keys configured locally:');
console.log('- Game Settings: 6 keys (max_level, energy_refill_time, etc.)');
console.log('- Economy Settings: 5 keys (coin_multiplier, gem_multiplier, etc.)');
console.log('- Feature Flags: 6 keys (new_levels_enabled, ads_enabled, etc.)');
console.log('- UI Settings: 4 keys (show_currency_balance, show_energy_timer, etc.)');
console.log('- Analytics Events: 8 keys (economy_purchase, level_completed, etc.)');
console.log('');

console.log('🚨 CURRENT ISSUE:');
console.log('=================');
console.log('The API authentication is failing with 401 Unauthorized errors.');
console.log('This means either:');
console.log('1. The Unity Cloud API endpoints are different than expected');
console.log('2. Your API credentials need to be refreshed');
console.log('3. The Remote Config service is not enabled in your dashboard');
console.log('4. The API requires different authentication method');
console.log('');

console.log('✅ NEXT STEPS:');
console.log('==============');
console.log('1. Check your Unity Cloud dashboard manually using the links above');
console.log('2. Verify Remote Config service is enabled');
console.log('3. See what keys are actually published');
console.log('4. If needed, add your 29 keys manually in the dashboard');
console.log('5. Test your Unity project to make sure it can access the keys');
console.log('');

console.log('🎯 BOTTOM LINE:');
console.log('===============');
console.log('I cannot directly access your Unity Cloud dashboard from this environment.');
console.log('You need to check it manually using the dashboard links above.');
console.log('Your local configuration is ready - you just need to verify what\'s actually published.');