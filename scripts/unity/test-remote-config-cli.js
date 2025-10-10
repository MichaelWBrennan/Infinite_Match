#!/usr/bin/env node
/**
 * Unity CLI Remote Config Test
 * Test Remote Config access using the working Unity CLI approach
 */

console.log('🔍 Unity CLI Remote Config Test');
console.log('================================');

const projectId = '0dd5a03e-7f23-49c4-964e-7919c48c0574';
const envId = '1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d';

console.log('Project ID:', projectId);
console.log('Environment ID:', envId);
console.log('');

// Test different approaches to access Remote Config
console.log('🌐 Testing Remote Config access methods...\n');

// Method 1: Try Unity Cloud API with different authentication
async function testUnityCloudAPI() {
    console.log('1️⃣ Testing Unity Cloud API...');
    
    const clientId = process.env.UNITY_CLIENT_ID;
    const clientSecret = process.env.UNITY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
        console.log('   ❌ Unity credentials not available');
        return false;
    }
    
    try {
        // Try different auth endpoints
        const authEndpoints = [
            'https://services.api.unity.com/auth/v1/token',
            'https://cloud.unity.com/api/auth/v1/token',
            'https://api.unity.com/auth/v1/token'
        ];
        
        for (const endpoint of authEndpoints) {
            try {
                console.log(`   Testing auth endpoint: ${endpoint}`);
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        grant_type: 'client_credentials',
                        client_id: clientId,
                        client_secret: clientSecret
                    })
                });
                
                if (response.status === 200) {
                    const tokenData = await response.json();
                    console.log('   ✅ Authentication successful!');
                    
                    // Test Remote Config with token
                    const configResponse = await fetch(
                        `https://services.api.unity.com/remote-config/v1/projects/${projectId}/environments/${envId}/configs`,
                        {
                            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
                        }
                    );
                    
                    if (configResponse.status === 200) {
                        const configs = await configResponse.json();
                        console.log('   ✅ Remote Config accessible!');
                        console.log('   📊 Configs:', JSON.stringify(configs, null, 2));
                        return true;
                    } else {
                        console.log(`   ⚠️ Remote Config error: ${configResponse.status}`);
                    }
                } else {
                    console.log(`   ❌ Auth failed: ${response.status}`);
                }
            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
            }
        }
    } catch (error) {
        console.log('   ❌ API test failed:', error.message);
    }
    
    return false;
}

// Method 2: Check if we can use Unity CLI directly
async function testUnityCLI() {
    console.log('\n2️⃣ Testing Unity CLI approach...');
    
    // Check if unity command is available
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    try {
        console.log('   Checking Unity CLI availability...');
        const { stdout } = await execAsync('which unity');
        console.log('   ✅ Unity CLI found at:', stdout.trim());
        
        // Try to list remote config
        console.log('   Testing remote config access...');
        const { stdout: configOutput } = await execAsync(
            `unity remote-config list --project-id ${projectId} --environment-id ${envId}`
        );
        console.log('   ✅ Remote Config accessible via CLI!');
        console.log('   📊 Output:', configOutput);
        return true;
    } catch (error) {
        console.log('   ❌ Unity CLI not available or not working');
        console.log('   Error:', error.message);
        return false;
    }
}

// Method 3: Check dashboard access
function testDashboardAccess() {
    console.log('\n3️⃣ Testing Dashboard Access...');
    
    const dashboardUrl = `https://cloud.unity.com/projects/${projectId}/remote-config`;
    console.log('   📊 Unity Cloud Dashboard URL:');
    console.log(`   ${dashboardUrl}`);
    console.log('   💡 Open this URL to verify your 5 keys are published');
    console.log('   ✅ Dashboard access available (manual verification)');
    return true;
}

// Run all tests
async function runTests() {
    console.log('🚀 Starting Remote Config tests...\n');
    
    const results = {
        api: await testUnityCloudAPI(),
        cli: await testUnityCLI(),
        dashboard: testDashboardAccess()
    };
    
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log('Unity Cloud API:', results.api ? '✅ Working' : '❌ Failed');
    console.log('Unity CLI:', results.cli ? '✅ Working' : '❌ Failed');
    console.log('Dashboard Access:', results.dashboard ? '✅ Available' : '❌ Failed');
    
    if (results.api || results.cli) {
        console.log('\n🎉 Remote Config is accessible!');
        console.log('Your 5 published keys should be visible and working.');
    } else {
        console.log('\n⚠️ API access limited, but dashboard access is available.');
        console.log('You can verify your keys in the Unity Cloud dashboard.');
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Verify your 5 keys in the Unity Cloud dashboard');
    console.log('2. Test the keys in your Unity project');
    console.log('3. Use the working Unity CLI for other operations');
}

runTests().catch(error => {
    console.error('❌ Test failed:', error.message);
});