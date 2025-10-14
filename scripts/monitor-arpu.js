#!/usr/bin/env node

/**
 * ARPU Monitoring Script
 * Monitors ARPU systems and provides real-time insights
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/arpu';

async function monitorARPU() {
  console.log('📊 ARPU Monitoring Dashboard\n');
  
  setInterval(async () => {
    try {
      const response = await fetch(`${BASE_URL}/statistics`);
      const data = await response.json();
      
      if (data.success) {
        const stats = data.statistics;
        console.clear();
        console.log('📊 ARPU Monitoring Dashboard\n');
        console.log(`Total Players: ${stats.totalPlayers}`);
        console.log(`Paying Players: ${stats.payingPlayers}`);
        console.log(`Total Revenue: $${stats.totalRevenue.toFixed(2)}`);
        console.log(`ARPU: $${stats.arpu.toFixed(2)}`);
        console.log(`Paying ARPU: $${stats.arpuPaying.toFixed(2)}`);
        console.log(`Conversion Rate: ${stats.conversionRate.toFixed(1)}%\n`);
        
        console.log('Revenue Sources:');
        Object.entries(stats.revenueBySource || {}).forEach(([source, percentage]) => {
          console.log(`  ${source}: ${percentage.toFixed(1)}%`);
        });
        
        console.log('\nPlayer Segments:');
        Object.entries(stats.segmentDistribution || {}).forEach(([segment, count]) => {
          console.log(`  ${segment}: ${count} players`);
        });
        
        console.log(`\nLast updated: ${new Date().toLocaleTimeString()}`);
      }
    } catch (error) {
      console.error('❌ Monitoring error:', error.message);
    }
  }, 5000);
}

monitorARPU();
