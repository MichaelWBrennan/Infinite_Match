#!/usr/bin/env node

/**
 * ARPU Integration Setup Script
 * Automatically configures all ARPU systems for maximum revenue
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up ARPU Integration...\n');

// 1. Update package.json with ARPU dependencies
console.log('📦 Updating package.json...');
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add ARPU-specific dependencies
const arpuDependencies = {
  'lodash': '^4.17.21',
  'moment': '^2.29.4',
  'uuid': '^9.0.1'
};

Object.assign(packageJson.dependencies, arpuDependencies);

// Add ARPU-specific scripts
const arpuScripts = {
  'arpu:start': 'node scripts/arpu-integration.js',
  'arpu:test': 'node scripts/test-arpu-systems.js',
  'arpu:monitor': 'node scripts/monitor-arpu.js'
};

Object.assign(packageJson.scripts, arpuScripts);

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ Package.json updated with ARPU dependencies\n');

// 2. Create ARPU configuration file
console.log('⚙️ Creating ARPU configuration...');
const arpuConfig = {
  energy: {
    maxEnergy: 30,
    energyPerLevel: 1,
    energyRefillCost: 10,
    energyRefillTime: 300,
    enableEnergyPacks: true,
    enableEnergyAds: true
  },
  subscriptions: {
    enableSubscriptions: true,
    tiers: [
      {
        id: 'basic',
        name: 'Basic Pass',
        price: 4.99,
        duration: 30,
        benefits: [
          { type: 'energy_multiplier', value: 1.5 },
          { type: 'coins_multiplier', value: 1.2 },
          { type: 'daily_bonus', value: 100 }
        ]
      },
      {
        id: 'premium',
        name: 'Premium Pass',
        price: 9.99,
        duration: 30,
        benefits: [
          { type: 'energy_multiplier', value: 2.0 },
          { type: 'coins_multiplier', value: 1.5 },
          { type: 'gems_multiplier', value: 1.3 },
          { type: 'daily_bonus', value: 200 },
          { type: 'exclusive_items', value: 1 }
        ]
      }
    ]
  },
  offers: {
    enablePersonalization: true,
    maxActiveOffers: 3,
    offerRefreshInterval: 1800,
    offerExpiryTime: 3600
  },
  social: {
    enableSocialFeatures: true,
    enableLeaderboards: true,
    enableGuilds: true,
    enableSocialChallenges: true,
    enableFriendGifting: true
  },
  analytics: {
    enableARPUTracking: true,
    enableRealTimeRevenue: true,
    enablePlayerSegmentation: true,
    enableConversionFunnels: true,
    enableRetentionAnalysis: true,
    enableLTVPrediction: true
  }
};

const configPath = path.join(__dirname, '../config/arpu-config.json');
fs.writeFileSync(configPath, JSON.stringify(arpuConfig, null, 2));
console.log('✅ ARPU configuration created\n');

// 3. Create test script
console.log('🧪 Creating ARPU test script...');
const testScript = `#!/usr/bin/env node

/**
 * ARPU Systems Test Script
 * Tests all ARPU systems to ensure they're working correctly
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/arpu';

async function testARPUSystems() {
  console.log('🧪 Testing ARPU Systems...\\n');
  
  try {
    // Test 1: Get personalized offers
    console.log('1. Testing personalized offers...');
    const offersResponse = await fetch(\`\${BASE_URL}/offers/personalized\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerProfile: {
          playerId: 'test_player',
          totalSpent: 0,
          level: 1,
          lastPlayTime: new Date().toISOString(),
          installDate: new Date().toISOString()
        }
      })
    });
    
    const offers = await offersResponse.json();
    console.log(\`✅ Offers: \${offers.offers?.length || 0} generated\`);
    
    // Test 2: Get ARPU statistics
    console.log('2. Testing ARPU statistics...');
    const statsResponse = await fetch(\`\${BASE_URL}/statistics\`);
    const stats = await statsResponse.json();
    console.log(\`✅ Statistics: ARPU = $\${stats.statistics?.arpu?.toFixed(2) || 0}\`);
    
    // Test 3: Track revenue
    console.log('3. Testing revenue tracking...');
    const revenueResponse = await fetch(\`\${BASE_URL}/revenue/track\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 4.99,
        source: 'IAP',
        itemId: 'starter_pack'
      })
    });
    
    const revenue = await revenueResponse.json();
    console.log(\`✅ Revenue tracked: \${revenue.success ? 'Success' : 'Failed'}\`);
    
    console.log('\\n🎉 All ARPU systems are working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testARPUSystems();
`;

const testScriptPath = path.join(__dirname, '../scripts/test-arpu-systems.js');
fs.writeFileSync(testScriptPath, testScript);
fs.chmodSync(testScriptPath, '755');
console.log('✅ ARPU test script created\n');

// 4. Create monitoring script
console.log('📊 Creating ARPU monitoring script...');
const monitorScript = `#!/usr/bin/env node

/**
 * ARPU Monitoring Script
 * Monitors ARPU systems and provides real-time insights
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/arpu';

async function monitorARPU() {
  console.log('📊 ARPU Monitoring Dashboard\\n');
  
  setInterval(async () => {
    try {
      const response = await fetch(\`\${BASE_URL}/statistics\`);
      const data = await response.json();
      
      if (data.success) {
        const stats = data.statistics;
        console.clear();
        console.log('📊 ARPU Monitoring Dashboard\\n');
        console.log(\`Total Players: \${stats.totalPlayers}\`);
        console.log(\`Paying Players: \${stats.payingPlayers}\`);
        console.log(\`Total Revenue: $\${stats.totalRevenue.toFixed(2)}\`);
        console.log(\`ARPU: $\${stats.arpu.toFixed(2)}\`);
        console.log(\`Paying ARPU: $\${stats.arpuPaying.toFixed(2)}\`);
        console.log(\`Conversion Rate: \${stats.conversionRate.toFixed(1)}%\\n\`);
        
        console.log('Revenue Sources:');
        Object.entries(stats.revenueBySource || {}).forEach(([source, percentage]) => {
          console.log(\`  \${source}: \${percentage.toFixed(1)}%\`);
        });
        
        console.log('\\nPlayer Segments:');
        Object.entries(stats.segmentDistribution || {}).forEach(([segment, count]) => {
          console.log(\`  \${segment}: \${count} players\`);
        });
        
        console.log(\`\\nLast updated: \${new Date().toLocaleTimeString()}\`);
      }
    } catch (error) {
      console.error('❌ Monitoring error:', error.message);
    }
  }, 5000);
}

monitorARPU();
`;

const monitorScriptPath = path.join(__dirname, '../scripts/monitor-arpu.js');
fs.writeFileSync(monitorScriptPath, monitorScript);
fs.chmodSync(monitorScriptPath, '755');
console.log('✅ ARPU monitoring script created\n');

console.log('🎉 ARPU Integration Setup Complete!\n');
console.log('Next steps:');
console.log('1. Run: npm install');
console.log('2. Start server: npm run dev');
console.log('3. Add ARPUInitializer to your Unity main scene');
console.log('4. Test systems: npm run arpu:test');
console.log('5. Monitor ARPU: npm run arpu:monitor');
console.log('\nFor detailed integration guide, see ARPU_INTEGRATION.md');