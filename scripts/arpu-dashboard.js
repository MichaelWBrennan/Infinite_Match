#!/usr/bin/env node

/**
 * ARPU Dashboard
 * Real-time monitoring dashboard for ARPU optimization
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Mock ARPU data (in production, this would come from your analytics service)
let arpuData = {
  totalPlayers: 1000,
  payingPlayers: 150,
  totalRevenue: 5000,
  arpu: 5.0,
  arpuPaying: 33.33,
  conversionRate: 15.0,
  revenueBySource: {
    IAP: 60,
    Subscription: 30,
    Ad: 10
  },
  segmentDistribution: {
    non_payer: 850,
    low_value: 100,
    medium_value: 35,
    high_value: 12,
    whale: 3
  },
  retentionRates: {
    'Day 1': 85.5,
    'Day 3': 65.2,
    'Day 7': 45.8,
    'Day 14': 32.1,
    'Day 30': 18.7
  },
  energySystem: {
    active: true,
    averageEnergy: 15,
    energyPurchases: 45
  },
  subscriptionSystem: {
    active: true,
    activeSubscriptions: 25,
    monthlyRevenue: 1500
  },
  personalizedOffers: {
    active: true,
    activeOffers: 12,
    conversionRate: 8.5
  },
  socialFeatures: {
    active: true,
    activeGuilds: 8,
    socialEngagement: 0.65
  }
};

// WebSocket connection for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected to ARPU Dashboard');
  
  // Send initial data
  socket.emit('arpu-data', arpuData);
  
  // Simulate real-time updates
  const updateInterval = setInterval(() => {
    // Simulate data changes
    arpuData.totalPlayers += Math.floor(Math.random() * 5);
    arpuData.payingPlayers += Math.floor(Math.random() * 2);
    arpuData.totalRevenue += Math.floor(Math.random() * 100);
    arpuData.arpu = arpuData.totalRevenue / arpuData.totalPlayers;
    arpuData.arpuPaying = arpuData.totalRevenue / arpuData.payingPlayers;
    arpuData.conversionRate = (arpuData.payingPlayers / arpuData.totalPlayers) * 100;
    
    // Update energy system data
    arpuData.energySystem.averageEnergy = Math.floor(Math.random() * 30);
    arpuData.energySystem.energyPurchases += Math.floor(Math.random() * 3);
    
    // Update subscription data
    arpuData.subscriptionSystem.activeSubscriptions += Math.floor(Math.random() * 2);
    arpuData.subscriptionSystem.monthlyRevenue += Math.floor(Math.random() * 50);
    
    // Update offer data
    arpuData.personalizedOffers.conversionRate += (Math.random() - 0.5) * 0.5;
    arpuData.personalizedOffers.conversionRate = Math.max(0, Math.min(20, arpuData.personalizedOffers.conversionRate));
    
    // Send updated data
    socket.emit('arpu-data', arpuData);
  }, 5000);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected from ARPU Dashboard');
    clearInterval(updateInterval);
  });
});

// API endpoints
app.get('/api/arpu-data', (req, res) => {
  res.json(arpuData);
});

app.get('/api/arpu-report', (req, res) => {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalPlayers: arpuData.totalPlayers,
      totalRevenue: arpuData.totalRevenue,
      arpu: arpuData.arpu,
      conversionRate: arpuData.conversionRate
    },
    systems: {
      energy: arpuData.energySystem,
      subscription: arpuData.subscriptionSystem,
      offers: arpuData.personalizedOffers,
      social: arpuData.socialFeatures
    },
    recommendations: generateRecommendations(arpuData)
  };
  
  res.json(report);
});

function generateRecommendations(data) {
  const recommendations = [];
  
  if (data.conversionRate < 10) {
    recommendations.push({
      type: 'conversion',
      priority: 'high',
      message: 'Low conversion rate detected. Consider implementing more aggressive monetization strategies.',
      action: 'Increase offer frequency and improve targeting'
    });
  }
  
  if (data.arpu < 3) {
    recommendations.push({
      type: 'arpu',
      priority: 'high',
      message: 'ARPU is below industry average. Focus on increasing player value.',
      action: 'Implement subscription system and premium features'
    });
  }
  
  if (data.retentionRates['Day 7'] < 40) {
    recommendations.push({
      type: 'retention',
      priority: 'medium',
      message: 'Low 7-day retention. Improve onboarding and early game experience.',
      action: 'Enhance tutorial and add early rewards'
    });
  }
  
  if (data.energySystem.energyPurchases < 20) {
    recommendations.push({
      type: 'energy',
      priority: 'medium',
      message: 'Low energy purchase rate. Consider adjusting energy system balance.',
      action: 'Reduce energy regeneration time or increase energy costs'
    });
  }
  
  if (data.subscriptionSystem.activeSubscriptions < 20) {
    recommendations.push({
      type: 'subscription',
      priority: 'high',
      message: 'Low subscription adoption. Improve subscription value proposition.',
      action: 'Add exclusive benefits and reduce subscription price'
    });
  }
  
  return recommendations;
}

// Serve dashboard HTML
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ARPU Dashboard</title>
        <script src="/socket.io/socket.io.js"></script>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; }
            .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
            .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .metric { font-size: 2em; font-weight: bold; color: #2c3e50; }
            .label { color: #7f8c8d; margin-bottom: 10px; }
            .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; }
            .status.active { background: #2ecc71; color: white; }
            .status.inactive { background: #e74c3c; color: white; }
            .recommendations { background: #f39c12; color: white; padding: 15px; border-radius: 8px; margin-top: 20px; }
            .recommendation { margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>ARPU Optimization Dashboard</h1>
                <p>Real-time monitoring of revenue optimization systems</p>
            </div>
            
            <div class="grid">
                <div class="card">
                    <div class="label">Total Players</div>
                    <div class="metric" id="totalPlayers">-</div>
                </div>
                
                <div class="card">
                    <div class="label">ARPU</div>
                    <div class="metric" id="arpu">-</div>
                </div>
                
                <div class="card">
                    <div class="label">Conversion Rate</div>
                    <div class="metric" id="conversionRate">-</div>
                </div>
                
                <div class="card">
                    <div class="label">Total Revenue</div>
                    <div class="metric" id="totalRevenue">-</div>
                </div>
                
                <div class="card">
                    <div class="label">Energy System</div>
                    <div class="status" id="energyStatus">-</div>
                    <div>Avg Energy: <span id="avgEnergy">-</span></div>
                    <div>Purchases: <span id="energyPurchases">-</span></div>
                </div>
                
                <div class="card">
                    <div class="label">Subscription System</div>
                    <div class="status" id="subscriptionStatus">-</div>
                    <div>Active: <span id="activeSubscriptions">-</span></div>
                    <div>Revenue: $<span id="subscriptionRevenue">-</span></div>
                </div>
                
                <div class="card">
                    <div class="label">Personalized Offers</div>
                    <div class="status" id="offersStatus">-</div>
                    <div>Active Offers: <span id="activeOffers">-</span></div>
                    <div>Conversion: <span id="offerConversion">-</span>%</div>
                </div>
                
                <div class="card">
                    <div class="label">Social Features</div>
                    <div class="status" id="socialStatus">-</div>
                    <div>Guilds: <span id="activeGuilds">-</span></div>
                    <div>Engagement: <span id="socialEngagement">-</span>%</div>
                </div>
            </div>
            
            <div class="recommendations" id="recommendations">
                <h3>Recommendations</h3>
                <div id="recommendationsList">Loading...</div>
            </div>
        </div>
        
        <script>
            const socket = io();
            
            socket.on('arpu-data', (data) => {
                document.getElementById('totalPlayers').textContent = data.totalPlayers.toLocaleString();
                document.getElementById('arpu').textContent = '$' + data.arpu.toFixed(2);
                document.getElementById('conversionRate').textContent = data.conversionRate.toFixed(1) + '%';
                document.getElementById('totalRevenue').textContent = '$' + data.totalRevenue.toLocaleString();
                
                document.getElementById('energyStatus').textContent = data.energySystem.active ? 'Active' : 'Inactive';
                document.getElementById('energyStatus').className = 'status ' + (data.energySystem.active ? 'active' : 'inactive');
                document.getElementById('avgEnergy').textContent = data.energySystem.averageEnergy;
                document.getElementById('energyPurchases').textContent = data.energySystem.energyPurchases;
                
                document.getElementById('subscriptionStatus').textContent = data.subscriptionSystem.active ? 'Active' : 'Inactive';
                document.getElementById('subscriptionStatus').className = 'status ' + (data.subscriptionSystem.active ? 'active' : 'inactive');
                document.getElementById('activeSubscriptions').textContent = data.subscriptionSystem.activeSubscriptions;
                document.getElementById('subscriptionRevenue').textContent = data.subscriptionSystem.monthlyRevenue;
                
                document.getElementById('offersStatus').textContent = data.personalizedOffers.active ? 'Active' : 'Inactive';
                document.getElementById('offersStatus').className = 'status ' + (data.personalizedOffers.active ? 'active' : 'inactive');
                document.getElementById('activeOffers').textContent = data.personalizedOffers.activeOffers;
                document.getElementById('offerConversion').textContent = data.personalizedOffers.conversionRate.toFixed(1);
                
                document.getElementById('socialStatus').textContent = data.socialFeatures.active ? 'Active' : 'Inactive';
                document.getElementById('socialStatus').className = 'status ' + (data.socialFeatures.active ? 'active' : 'inactive');
                document.getElementById('activeGuilds').textContent = data.socialFeatures.activeGuilds;
                document.getElementById('socialEngagement').textContent = (data.socialFeatures.socialEngagement * 100).toFixed(1);
            });
            
            // Load recommendations
            fetch('/api/arpu-report')
                .then(response => response.json())
                .then(data => {
                    const recommendationsList = document.getElementById('recommendationsList');
                    recommendationsList.innerHTML = data.recommendations.map(rec => 
                        \`<div class="recommendation">
                            <strong>\${rec.type.toUpperCase()}</strong> - \${rec.message}
                            <br><em>Action: \${rec.action}</em>
                        </div>\`
                    ).join('');
                });
        </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`ARPU Dashboard running on http://localhost:${PORT}`);
  console.log('Real-time monitoring enabled');
});