#!/usr/bin/env node

/**
 * Free AI Content Generator Example
 * Demonstrates how to use the 100% free AI content generation system
 */

import { FreeAIContentGenerator } from '../src/services/free-ai-content-generator.js';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function demonstrateLevelGeneration() {
  log('\n🎮 Generating Match-3 Level...', 'cyan');
  
  const ai = new FreeAIContentGenerator();
  
  try {
    const playerProfile = {
      id: 'demo-player-1',
      currentLevel: 15,
      preferredColors: ['red', 'blue', 'green'],
      recentPerformance: 'good',
      segment: 'casual',
      playStyle: 'relaxed'
    };

    const level = await ai.generateLevel(15, 6, playerProfile);
    
    log('✅ Level Generated Successfully!', 'green');
    log(`📊 Level ${level.levelNumber} - Difficulty: ${level.difficulty}`, 'blue');
    log(`🎯 Moves: ${level.moves}, Objectives: ${level.objectives.length}`, 'blue');
    log(`🎨 Theme: ${level.theme}`, 'blue');
    log(`⏱️  Estimated Duration: ${level.estimatedDuration}s`, 'blue');
    
    if (level.board) {
      log(`📐 Board Size: ${level.board.width}x${level.board.height}`, 'blue');
      log(`💎 Special Tiles: ${level.board.specialTiles.length}`, 'blue');
    }
    
    if (level.aiEnhancements) {
      log(`🧠 AI Enhancements:`, 'magenta');
      log(`   Engagement Prediction: ${(level.aiEnhancements.engagementPrediction * 100).toFixed(1)}%`, 'magenta');
      log(`   Difficulty Adjustment: ${level.aiEnhancements.difficultyAdjustment.toFixed(2)}`, 'magenta');
      log(`   Profile Match: ${(level.aiEnhancements.playerProfileMatch * 100).toFixed(1)}%`, 'magenta');
    }
    
    return level;
  } catch (error) {
    log(`❌ Error generating level: ${error.message}`, 'red');
    throw error;
  }
}

async function demonstrateEventGeneration() {
  log('\n🎉 Generating Game Event...', 'cyan');
  
  const ai = new FreeAIContentGenerator();
  
  try {
    const marketTrends = {
      popularThemes: ['Fantasy', 'Sci-Fi', 'Adventure'],
      engagementPatterns: 'Peak hours: 7-9 PM, Weekend spikes',
      revenueTrends: 'Weekend spikes, Holiday boosts',
      competitorAnalysis: 'Focus on social features and live events'
    };

    const event = await ai.generateEvent('weekly', 'casual', marketTrends);
    
    log('✅ Event Generated Successfully!', 'green');
    log(`🎪 ${event.name}`, 'blue');
    log(`📝 ${event.description}`, 'blue');
    log(`⏰ Duration: ${event.duration} days`, 'blue');
    log(`🎨 Theme: ${event.theme}`, 'blue');
    log(`🎯 Objectives: ${event.objectives.length}`, 'blue');
    log(`🏆 Reward Tiers: ${event.rewards.length}`, 'blue');
    
    if (event.marketOptimization) {
      log(`📈 Market Optimization:`, 'magenta');
      log(`   Trend Alignment: ${(event.marketOptimization.trendAlignment * 100).toFixed(1)}%`, 'magenta');
      log(`   Revenue Potential: ${(event.marketOptimization.revenuePotential * 100).toFixed(1)}%`, 'magenta');
      log(`   Engagement Score: ${(event.marketOptimization.engagementScore * 100).toFixed(1)}%`, 'magenta');
    }
    
    return event;
  } catch (error) {
    log(`❌ Error generating event: ${error.message}`, 'red');
    throw error;
  }
}

async function demonstrateVisualGeneration() {
  log('\n🎨 Generating Visual Asset...', 'cyan');
  
  const ai = new FreeAIContentGenerator();
  
  try {
    const visual = await ai.generateVisualAsset('icon', 'magic crystal with glowing aura', 'fantasy');
    
    log('✅ Visual Asset Generated Successfully!', 'green');
    log(`🖼️  Type: ${visual.type}`, 'blue');
    log(`📐 Formats: ${Object.keys(visual.formats).join(', ')}`, 'blue');
    log(`📏 Sizes: ${Object.keys(visual.sizes).join(', ')}`, 'blue');
    log(`🔗 Generated URL: ${visual.originalUrl ? 'Available' : 'Not available'}`, 'blue');
    
    return visual;
  } catch (error) {
    log(`❌ Error generating visual: ${error.message}`, 'red');
    throw error;
  }
}

async function demonstratePersonalizedContent() {
  log('\n🎯 Generating Personalized Content...', 'cyan');
  
  const ai = new FreeAIContentGenerator();
  
  try {
    const playerId = 'demo-player-2';
    const preferences = {
      preferredColors: ['purple', 'gold', 'silver'],
      difficultyPreference: 'hard',
      playStyle: 'competitive',
      favoriteThemes: ['space', 'cyberpunk']
    };

    const personalizedContent = await ai.generatePersonalizedContent(
      playerId,
      'level',
      preferences
    );
    
    log('✅ Personalized Content Generated Successfully!', 'green');
    log(`👤 Player: ${playerId}`, 'blue');
    log(`🎮 Content Type: Level`, 'blue');
    log(`🎨 Preferences Applied: ${Object.keys(preferences).join(', ')}`, 'blue');
    
    return personalizedContent;
  } catch (error) {
    log(`❌ Error generating personalized content: ${error.message}`, 'red');
    throw error;
  }
}

async function demonstrateServiceStatus() {
  log('\n📊 Checking Service Status...', 'cyan');
  
  const ai = new FreeAIContentGenerator();
  
  try {
    const status = ai.getServiceStatus();
    
    log('✅ Service Status Retrieved!', 'green');
    log(`🔄 Status: ${status.status}`, 'blue');
    log(`🤖 Ollama: ${status.services.ollama}`, 'blue');
    log(`☁️  Hugging Face: ${status.services.huggingface}`, 'blue');
    log(`🧠 Local ML: ${status.services.localML}`, 'blue');
    log(`📦 Generated Content: ${status.generatedContent}`, 'blue');
    log(`💾 Cache Size: ${status.cacheSize}`, 'blue');
    
    return status;
  } catch (error) {
    log(`❌ Error checking service status: ${error.message}`, 'red');
    throw error;
  }
}

async function runPerformanceTest() {
  log('\n⚡ Running Performance Test...', 'cyan');
  
  const ai = new FreeAIContentGenerator();
  const iterations = 5;
  const results = [];
  
  try {
    log(`🔄 Running ${iterations} iterations...`, 'yellow');
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      const level = await ai.generateLevel(i + 1, 5, {
        id: `perf-test-${i}`,
        currentLevel: i + 1,
        preferredColors: ['red', 'blue'],
        recentPerformance: 'good',
        segment: 'casual'
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      results.push(duration);
      log(`   Iteration ${i + 1}: ${duration}ms`, 'blue');
    }
    
    const avgDuration = results.reduce((a, b) => a + b, 0) / results.length;
    const minDuration = Math.min(...results);
    const maxDuration = Math.max(...results);
    
    log('✅ Performance Test Complete!', 'green');
    log(`📊 Average: ${avgDuration.toFixed(2)}ms`, 'blue');
    log(`⚡ Fastest: ${minDuration}ms`, 'blue');
    log(`🐌 Slowest: ${maxDuration}ms`, 'blue');
    
    return { avgDuration, minDuration, maxDuration, results };
  } catch (error) {
    log(`❌ Error in performance test: ${error.message}`, 'red');
    throw error;
  }
}

async function main() {
  log('🚀 Free AI Content Generator Demo', 'bright');
  log('=====================================', 'bright');
  log('This demo showcases 100% free AI content generation', 'yellow');
  log('No subscriptions, no trials, no API keys required!', 'yellow');
  
  try {
    // Check service status first
    await demonstrateServiceStatus();
    
    // Demonstrate different content types
    await demonstrateLevelGeneration();
    await demonstrateEventGeneration();
    await demonstrateVisualGeneration();
    await demonstratePersonalizedContent();
    
    // Run performance test
    await runPerformanceTest();
    
    log('\n🎉 Demo Complete!', 'green');
    log('All content was generated using 100% free AI services:', 'yellow');
    log('• Ollama (local LLM)', 'yellow');
    log('• Hugging Face (free tier)', 'yellow');
    log('• Local ML models', 'yellow');
    log('• Template-based fallbacks', 'yellow');
    
    log('\n📚 Next Steps:', 'cyan');
    log('1. Check the generated content above', 'blue');
    log('2. Modify the examples to suit your needs', 'blue');
    log('3. Integrate into your game project', 'blue');
    log('4. Enjoy infinite free AI-generated content!', 'blue');
    
  } catch (error) {
    log(`\n❌ Demo failed: ${error.message}`, 'red');
    log('This might be because:', 'yellow');
    log('• Ollama is not running (run: ollama serve)', 'yellow');
    log('• Models are not downloaded (run: ollama pull llama3.1:8b)', 'yellow');
    log('• Network issues with Hugging Face', 'yellow');
    log('• Check the setup script: ./scripts/setup-free-ai.sh', 'yellow');
    process.exit(1);
  }
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as runDemo };