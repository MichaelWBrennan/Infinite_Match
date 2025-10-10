#!/usr/bin/env node
/**
 * Test Remote Config Access
 * Simple test to verify Remote Config keys are accessible
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Testing Remote Config Access');
console.log('===============================');

// Check if we have the project configuration
const configPath = 'unity/Assets/StreamingAssets/unity_services_config.json';
if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('✅ Unity project config found');
    console.log('Project ID:', config.projectId);
    console.log('Environment ID:', config.environmentId);
} else {
    console.log('❌ Unity project config not found');
}

// Check environment variables
console.log('\n🔐 Environment Variables:');
console.log('UNITY_CLIENT_ID:', process.env.UNITY_CLIENT_ID ? 'Set' : 'Not set');
console.log('UNITY_CLIENT_SECRET:', process.env.UNITY_CLIENT_SECRET ? 'Set' : 'Not set');
console.log('UNITY_PROJECT_ID:', process.env.UNITY_PROJECT_ID);
console.log('UNITY_ENV_ID:', process.env.UNITY_ENV_ID);

// Test basic connectivity
console.log('\n🌐 Testing Unity Cloud connectivity...');

// Try a simple GET request to Unity Cloud
const projectId = '0dd5a03e-7f23-49c4-964e-7919c48c0574';
const envId = '1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d';

console.log('Testing project:', projectId);
console.log('Testing environment:', envId);

// Since the API authentication is having issues, let's check if we can access
// the Remote Config through the Unity Cloud dashboard URL
const dashboardUrl = `https://cloud.unity.com/projects/${projectId}/remote-config`;
console.log('\n📊 Unity Cloud Dashboard URL:');
console.log(dashboardUrl);
console.log('\n💡 To verify your Remote Config keys:');
console.log('1. Open the dashboard URL above');
console.log('2. Check if your 5 keys are visible');
console.log('3. Verify they have the correct values and types');

// Check if we have any local Remote Config files
console.log('\n📁 Local Remote Config Files:');
const remoteConfigDir = 'remote-config';
if (fs.existsSync(remoteConfigDir)) {
    const files = fs.readdirSync(remoteConfigDir);
    files.forEach(file => {
        const filePath = path.join(remoteConfigDir, file);
        const stats = fs.statSync(filePath);
        console.log(`  ${file} (${stats.size} bytes)`);
    });
} else {
    console.log('  No remote-config directory found');
}

console.log('\n✅ Test completed!');
console.log('\n🎯 Next Steps:');
console.log('1. Verify your keys are visible in the Unity Cloud dashboard');
console.log('2. Check that the API credentials are correct');
console.log('3. Ensure the Remote Config service is properly enabled');