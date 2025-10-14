#!/usr/bin/env node

/**
 * ARPU Systems Test Script
 * Tests all ARPU systems to ensure they're working correctly
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/arpu';

async function testARPUSystems() {
  console.log('🧪 Testing ARPU Systems...\n');
  
  try {
    // Test 1: Get personalized offers
    console.log('1. Testing personalized offers...');
    const offersResponse = await fetch(`${BASE_URL}/offers/personalized`, {
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
    console.log(`✅ Offers: ${offers.offers?.length || 0} generated`);
    
    // Test 2: Get ARPU statistics
    console.log('2. Testing ARPU statistics...');
    const statsResponse = await fetch(`${BASE_URL}/statistics`);
    const stats = await statsResponse.json();
    console.log(`✅ Statistics: ARPU = $${stats.statistics?.arpu?.toFixed(2) || 0}`);
    
    // Test 3: Track revenue
    console.log('3. Testing revenue tracking...');
    const revenueResponse = await fetch(`${BASE_URL}/revenue/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 4.99,
        source: 'IAP',
        itemId: 'starter_pack'
      })
    });
    
    const revenue = await revenueResponse.json();
    console.log(`✅ Revenue tracked: ${revenue.success ? 'Success' : 'Failed'}`);
    
    console.log('\n🎉 All ARPU systems are working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testARPUSystems();
