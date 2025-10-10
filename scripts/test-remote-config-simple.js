#!/usr/bin/env node
/**
 * Simple Remote Config Test
 * Test if we can access Remote Config using basic HTTP requests
 */

console.log('🔍 Simple Remote Config Test');
console.log('============================');

const projectId = '0dd5a03e-7f23-49c4-964e-7919c48c0574';
const envId = '1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d';

// Try different Unity Cloud API endpoints for Remote Config
const endpoints = [
    `https://services.api.unity.com/remote-config/v1/projects/${projectId}/environments/${envId}/configs`,
    `https://services.api.unity.com/remote-config/v1/projects/${projectId}/configs`,
    `https://cloud.unity.com/api/remote-config/v1/projects/${projectId}/environments/${envId}/configs`,
    `https://cloud.unity.com/api/remote-config/v1/projects/${projectId}/configs`,
    `https://api.unity.com/remote-config/v1/projects/${projectId}/environments/${envId}/configs`
];

console.log('Testing Remote Config endpoints...\n');

async function testEndpoint(url) {
    try {
        console.log(`Testing: ${url}`);
        
        // Try without authentication first
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`  Status: ${response.status}`);
        console.log(`  Headers:`, Object.fromEntries(response.headers.entries()));
        
        if (response.status === 200) {
            const data = await response.json();
            console.log(`  ✅ SUCCESS! Data:`, JSON.stringify(data, null, 2));
            return { url, success: true, data };
        } else if (response.status === 401) {
            console.log(`  🔐 Requires authentication`);
            return { url, success: false, requiresAuth: true };
        } else {
            const text = await response.text();
            console.log(`  ❌ Failed: ${text.substring(0, 200)}...`);
        }
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
    }
    return { url, success: false };
}

// Test all endpoints
Promise.all(endpoints.map(testEndpoint)).then(results => {
    console.log('\n📊 Results Summary:');
    console.log('==================');
    
    const successful = results.filter(r => r.success);
    const requiresAuth = results.filter(r => r.requiresAuth);
    
    if (successful.length > 0) {
        console.log('✅ Working endpoints:', successful.length);
        successful.forEach(r => console.log(`  - ${r.url}`));
    }
    
    if (requiresAuth.length > 0) {
        console.log('🔐 Endpoints requiring authentication:', requiresAuth.length);
        requiresAuth.forEach(r => console.log(`  - ${r.url}`));
    }
    
    if (successful.length === 0 && requiresAuth.length === 0) {
        console.log('❌ No accessible endpoints found');
        console.log('\n💡 This suggests:');
        console.log('1. The Remote Config service might not be enabled');
        console.log('2. The API endpoints might be different');
        console.log('3. Authentication might be required');
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Check the Unity Cloud dashboard to verify your 5 keys are published');
    console.log('2. Verify the Remote Config service is enabled');
    console.log('3. Check if the API credentials are correct');
    console.log('4. Consider using the Unity Cloud dashboard directly for now');
});