import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Logger } from '../../core/logger/index.js';
import { mongoService } from '../../services/database/MongoService.js';
import { redisService } from '../../services/cache/RedisService.js';

const logger = new Logger('AIService');

const app = express();
const PORT = process.env.PORT || 3007;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Initialize services
await mongoService.connect();
await redisService.connect();

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// AI-powered player behavior analysis
app.post('/api/analyze-behavior', async (req, res) => {
  try {
    const { playerId, sessionData } = req.body;

    if (!playerId || !sessionData) {
      return res.status(400).json({ error: 'Player ID and session data required' });
    }

    // Analyze player behavior patterns
    const behaviorAnalysis = await analyzePlayerBehavior(playerId, sessionData);

    // Cache the analysis
    await redisService.setJSON(`behavior:${playerId}`, behaviorAnalysis, 3600);

    // Save to MongoDB
    await mongoService.savePlayerBehavior({
      playerId,
      ...behaviorAnalysis,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      analysis: behaviorAnalysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Behavior analysis error', error);
    res.status(500).json({ error: 'Failed to analyze behavior' });
  }
});

// AI-powered cheat detection
app.post('/api/detect-cheating', async (req, res) => {
  try {
    const { playerId, gameData } = req.body;

    if (!playerId || !gameData) {
      return res.status(400).json({ error: 'Player ID and game data required' });
    }

    // Use AI to detect cheating patterns
    const cheatDetection = await detectCheatingAI(playerId, gameData);

    // Cache the detection result
    await redisService.setJSON(`cheat:${playerId}`, cheatDetection, 1800);

    // Save security event if cheating detected
    if (cheatDetection.suspicious) {
      await mongoService.saveGameEvent({
        type: 'cheat_detected',
        playerId,
        data: cheatDetection,
        timestamp: new Date(),
      });
    }

    res.json({
      success: true,
      detection: cheatDetection,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Cheat detection error', error);
    res.status(500).json({ error: 'Failed to detect cheating' });
  }
});

// AI-powered recommendation engine
app.get('/api/recommendations/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;

    // Get cached recommendations
    const cached = await redisService.getJSON(`recommendations:${playerId}`);
    if (cached) {
      return res.json({
        success: true,
        recommendations: cached,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Generate AI recommendations
    const recommendations = await generateRecommendations(playerId);

    // Cache recommendations for 1 hour
    await redisService.setJSON(`recommendations:${playerId}`, recommendations, 3600);

    res.json({
      success: true,
      recommendations,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Recommendation generation error', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// AI-powered A/B testing
app.post('/api/ab-test', async (req, res) => {
  try {
    const { testId, playerId, variant, results } = req.body;

    if (!testId || !playerId || !variant || !results) {
      return res.status(400).json({ error: 'Test ID, player ID, variant, and results required' });
    }

    // Analyze A/B test results with AI
    const analysis = await analyzeABTest(testId, playerId, variant, results);

    // Save analysis to MongoDB
    await mongoService.saveABTestResult({
      testId,
      playerId,
      variant,
      results,
      analysis,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('A/B test analysis error', error);
    res.status(500).json({ error: 'Failed to analyze A/B test' });
  }
});

// AI-powered game balancing
app.post('/api/balance-game', async (req, res) => {
  try {
    const { levelData, playerMetrics } = req.body;

    if (!levelData || !playerMetrics) {
      return res.status(400).json({ error: 'Level data and player metrics required' });
    }

    // Use AI to balance game difficulty
    const balanceRecommendations = await balanceGameAI(levelData, playerMetrics);

    res.json({
      success: true,
      recommendations: balanceRecommendations,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Game balancing error', error);
    res.status(500).json({ error: 'Failed to balance game' });
  }
});

// AI-powered fraud detection
app.post('/api/detect-fraud', async (req, res) => {
  try {
    const { transactionData, playerData } = req.body;

    if (!transactionData || !playerData) {
      return res.status(400).json({ error: 'Transaction data and player data required' });
    }

    // Use AI to detect fraudulent transactions
    const fraudDetection = await detectFraudAI(transactionData, playerData);

    // Save fraud detection result
    if (fraudDetection.suspicious) {
      await mongoService.saveGameEvent({
        type: 'fraud_detected',
        playerId: playerData.id,
        data: fraudDetection,
        timestamp: new Date(),
      });
    }

    res.json({
      success: true,
      detection: fraudDetection,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Fraud detection error', error);
    res.status(500).json({ error: 'Failed to detect fraud' });
  }
});

// AI helper functions
async function analyzePlayerBehavior(playerId: string, sessionData: any) {
  // Simulate AI analysis of player behavior
  const patterns = {
    playTime: sessionData.duration || 0,
    frequency: sessionData.frequency || 0,
    difficulty: sessionData.difficulty || 'medium',
    preferences: {
      powerUps: sessionData.powerUpsUsed || 0,
      levels: sessionData.levelsCompleted || 0,
      timeOfDay: new Date().getHours(),
    },
    engagement: {
      score: sessionData.score || 0,
      moves: sessionData.moves || 0,
      efficiency: sessionData.score / Math.max(sessionData.moves, 1),
    },
  };

  return {
    patterns,
    insights: generateInsights(patterns),
    recommendations: generatePlayerRecommendations(patterns),
  };
}

async function detectCheatingAI(playerId: string, gameData: any) {
  // Simulate AI-powered cheat detection
  const suspiciousPatterns = [];
  let suspiciousScore = 0;

  // Check for impossible scores
  if (gameData.score > 100000) {
    suspiciousPatterns.push('impossible_score');
    suspiciousScore += 50;
  }

  // Check for impossible completion times
  if (gameData.completionTime < 1000) {
    suspiciousPatterns.push('impossible_speed');
    suspiciousScore += 40;
  }

  // Check for bot-like behavior
  if (gameData.moves < 5 && gameData.score > 10000) {
    suspiciousPatterns.push('bot_behavior');
    suspiciousScore += 60;
  }

  return {
    suspicious: suspiciousScore > 50,
    score: suspiciousScore,
    patterns: suspiciousPatterns,
    confidence: Math.min(suspiciousScore / 100, 1),
  };
}

async function generateRecommendations(playerId: string) {
  // Simulate AI-powered recommendations
  return {
    levels: [
      { id: 1, difficulty: 'easy', reason: 'Good for practice' },
      { id: 5, difficulty: 'medium', reason: 'Matches your skill level' },
    ],
    powerUps: [
      { id: 'bomb', reason: 'Effective for your play style' },
      { id: 'lightning', reason: 'High success rate for you' },
    ],
    tips: ['Try to create more horizontal matches', 'Use power-ups when you have 3+ moves left'],
  };
}

async function analyzeABTest(testId: string, playerId: string, variant: string, results: any) {
  // Simulate AI analysis of A/B test results
  return {
    variant,
    performance: {
      conversion: results.conversion || 0,
      engagement: results.engagement || 0,
      retention: results.retention || 0,
    },
    significance: Math.random() > 0.5 ? 'significant' : 'not_significant',
    recommendation: variant === 'A' ? 'keep_variant_a' : 'switch_to_variant_b',
  };
}

async function balanceGameAI(levelData: any, playerMetrics: any) {
  // Simulate AI-powered game balancing
  return {
    difficulty: {
      current: levelData.difficulty,
      recommended: playerMetrics.averageScore > 50000 ? 'harder' : 'easier',
    },
    rewards: {
      coins: Math.floor(playerMetrics.averageScore / 1000),
      gems: Math.floor(playerMetrics.averageScore / 10000),
    },
    obstacles: {
      count: Math.floor(playerMetrics.averageMoves / 10),
      type: playerMetrics.powerUpUsage > 0.5 ? 'chain' : 'rock',
    },
  };
}

async function detectFraudAI(transactionData: any, playerData: any) {
  // Simulate AI-powered fraud detection
  const fraudIndicators = [];
  let fraudScore = 0;

  // Check for unusual transaction amounts
  if (transactionData.amount > 1000) {
    fraudIndicators.push('high_amount');
    fraudScore += 30;
  }

  // Check for rapid transactions
  if (transactionData.frequency > 10) {
    fraudIndicators.push('rapid_transactions');
    fraudScore += 40;
  }

  // Check for unusual patterns
  if (playerData.level < 5 && transactionData.amount > 100) {
    fraudIndicators.push('new_player_high_spend');
    fraudScore += 50;
  }

  return {
    suspicious: fraudScore > 50,
    score: fraudScore,
    indicators: fraudIndicators,
    confidence: Math.min(fraudScore / 100, 1),
  };
}

function generateInsights(patterns: any) {
  return [
    `Player plays ${patterns.playTime} minutes per session`,
    `Prefers ${patterns.difficulty} difficulty`,
    `Most active at ${patterns.preferences.timeOfDay}:00`,
  ];
}

function generatePlayerRecommendations(patterns: any) {
  return [
    'Try harder levels to increase challenge',
    'Use power-ups more strategically',
    'Play during peak hours for better performance',
  ];
}

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('AI Service error', { error: err.message, stack: err.stack, url: req.url });
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  logger.info(`AI Service running on port ${PORT}`);
});

export default app;
