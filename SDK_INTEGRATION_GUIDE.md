# 🎮 Match 3 Game SDK Integration Guide

This comprehensive guide shows you how to use all the integrated SDKs in your Match 3 game for analytics, monitoring, cloud services, and more.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Unity Integration](#unity-integration)
3. [Node.js Backend Integration](#nodejs-backend-integration)
4. [Analytics & Monitoring](#analytics--monitoring)
5. [Cloud Services](#cloud-services)
6. [WebGL Integration](#webgl-integration)
7. [Configuration](#configuration)
8. [API Reference](#api-reference)
9. [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### 1. Environment Setup

Copy the environment configuration:
```bash
cp .env.example .env
```

Update the `.env` file with your API keys and configuration.

### 2. Install Dependencies

```bash
# Node.js dependencies
npm install

# Python dependencies (for automation scripts)
pip install -r requirements.txt
```

### 3. Start the Server

```bash
npm run dev
```

### 4. Build Unity Game

```bash
# Build WebGL version
npm run build:webgl:all
```

## 🎯 Unity Integration

### Game Analytics Manager

The `GameAnalyticsManager` handles all analytics tracking in Unity:

```csharp
// Get the analytics manager
GameAnalyticsManager analytics = FindObjectOfType<GameAnalyticsManager>();

// Track game events
analytics.TrackGameStart();
analytics.TrackLevelStart(1);
analytics.TrackLevelComplete(1, 1000, 120.5f, 15);
analytics.TrackMatch(1, 3, new Vector3(2, 3, 0));
analytics.TrackPowerUpUsed("bomb", 1, new Vector3(1, 1, 0));
analytics.TrackPurchase("extra_lives", "coins", 50);
```

### Cloud Save Manager

The `CloudSaveManager` handles cloud synchronization:

```csharp
// Get the cloud save manager
CloudSaveManager cloudSave = FindObjectOfType<CloudSaveManager>();

// Save player progress
PlayerProgressData progress = new PlayerProgressData
{
    currentLevel = 5,
    totalScore = 10000,
    starsEarned = 15,
    livesRemaining = 3
};
await cloudSave.SavePlayerProgress(progress);

// Load player progress
PlayerProgressData loadedProgress = await cloudSave.LoadPlayerProgress();
```

### Game Manager Integration

The main `GameManagerIntegration` class coordinates everything:

```csharp
// Get the game manager
GameManagerIntegration gameManager = FindObjectOfType<GameManagerIntegration>();

// Start a new game
gameManager.StartGame();

// Complete a level
gameManager.CompleteLevel(score, timeSpent, movesUsed, starsEarned);

// Track a match
gameManager.TrackMatch(matchType, piecesMatched, position, scoreGained);

// Use a power-up
gameManager.UsePowerUp("bomb", position, cost);
```

## 🔧 Node.js Backend Integration

### Analytics Service

Track comprehensive analytics with the `AnalyticsService`:

```javascript
import analyticsService from './src/services/analytics-service.js';

// Initialize analytics
await analyticsService.initialize();

// Track game events
await analyticsService.trackGameStart(userId, {
    level: 1,
    difficulty: 'normal',
    platform: 'web'
});

await analyticsService.trackLevelComplete(userId, {
    level: 1,
    score: 1000,
    timeSpent: 120.5,
    movesUsed: 15,
    starsEarned: 3,
    powerupsUsed: 2
});

await analyticsService.trackMatchMade(userId, {
    matchType: 1,
    piecesMatched: 3,
    position: { x: 2, y: 3 },
    level: 1,
    scoreGained: 100
});

await analyticsService.trackPowerUpUsed(userId, {
    type: 'bomb',
    level: 1,
    position: { x: 1, y: 1 },
    cost: 50
});

await analyticsService.trackPurchase(userId, {
    itemId: 'extra_lives',
    itemType: 'consumable',
    currency: 'coins',
    amount: 50,
    transactionId: 'txn_123',
    platform: 'web'
});
```

### Cloud Services Manager

Use the `CloudServicesManager` for cloud operations:

```javascript
import cloudServices from './src/services/cloud-services.js';

// Initialize cloud services
await cloudServices.initialize();

// Save game state to multiple cloud providers
await cloudServices.saveGameState(playerId, {
    level: 5,
    score: 10000,
    lives: 3,
    powerups: ['bomb', 'lightning']
});

// Send notifications
await cloudServices.sendGameEventNotification('level_completed', playerId, {
    level: 5,
    score: 1000,
    timeSpent: 120
});

// Save to specific cloud services
await cloudServices.savePlayerDataToDynamoDB('players', {
    playerId: 'player123',
    level: 5,
    score: 10000,
    gameData: { lives: 3, powerups: ['bomb'] }
});

await cloudServices.savePlayerDataToFirestore('players', 'player123', {
    level: 5,
    score: 10000,
    lastUpdated: new Date()
});
```

## 📊 Analytics & Monitoring

### Sentry Error Tracking

Automatic error tracking is enabled. Errors are automatically captured and sent to Sentry:

```javascript
// Manual error tracking
Sentry.captureException(new Error('Game logic error'), {
    tags: {
        level: 5,
        gameState: 'playing'
    },
    extra: {
        playerId: 'player123',
        score: 1000
    }
});
```

### OpenTelemetry Observability

Distributed tracing and metrics are automatically collected:

```javascript
// Custom metrics
const { metrics } = require('@opentelemetry/api');
const meter = metrics.getMeter('match3-game');

const gameScoreCounter = meter.createCounter('game_score_total', {
    description: 'Total score earned in the game'
});

// Record metrics
gameScoreCounter.add(100, { level: 5, player: 'player123' });
```

### New Relic Monitoring

Application performance monitoring is automatically enabled:

```javascript
// Custom New Relic events
newrelic.recordCustomEvent('GameEvent', {
    eventType: 'level_completed',
    level: 5,
    score: 1000,
    playerId: 'player123'
});

// Custom metrics
newrelic.recordMetric('Custom/GameScore', 1000);
```

### Datadog RUM

Real User Monitoring for browser-based games:

```javascript
// Track user actions
DD_RUM.addAction('level_completed', {
    level: 5,
    score: 1000,
    timeSpent: 120
});

// Track performance
DD_RUM.addTiming('level_load_time', 1500);
```

## ☁️ Cloud Services

### AWS Services

```javascript
// S3 - Save game data
await cloudServices.saveGameDataToS3('my-game-bucket', 'player123/save.json', gameData);

// SES - Send email notifications
await cloudServices.sendEmailNotification(
    'player@example.com',
    'Level Completed!',
    'Congratulations on completing level 5!',
    '<h1>Congratulations!</h1><p>You completed level 5!</p>'
);

// SNS - Publish game events
await cloudServices.publishToSNS(
    'arn:aws:sns:us-east-1:123456789012:game-events',
    { eventType: 'level_completed', level: 5, playerId: 'player123' }
);

// DynamoDB - Store player data
await cloudServices.savePlayerDataToDynamoDB('players', {
    playerId: 'player123',
    level: 5,
    score: 10000,
    gameData: { lives: 3 }
});
```

### Google Cloud Services

```javascript
// Cloud Storage - Save game data
await cloudServices.saveGameDataToGCS('my-game-bucket', 'player123/save.json', gameData);

// Firestore - Store player data
await cloudServices.savePlayerDataToFirestore('players', 'player123', {
    level: 5,
    score: 10000,
    lastUpdated: new Date()
});

// Pub/Sub - Publish events
await cloudServices.publishToPubSub('game-events', {
    eventType: 'level_completed',
    level: 5,
    playerId: 'player123'
});
```

### Azure Services

```javascript
// Blob Storage - Save game data
await cloudServices.saveGameDataToAzureBlob('game-data', 'player123/save.json', gameData);

// Key Vault - Get secrets
const apiKey = await cloudServices.getSecretFromKeyVault('game-api-key');

// Service Bus - Send messages
await cloudServices.sendToServiceBus('game-events', {
    eventType: 'level_completed',
    level: 5,
    playerId: 'player123'
});

// Cosmos DB - Store player data
await cloudServices.savePlayerDataToCosmos('game-db', 'players', {
    playerId: 'player123',
    level: 5,
    score: 10000
});
```

## 🌐 WebGL Integration

### JavaScript Integration

For WebGL builds, include the analytics script in your `index.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Match 3 Game</title>
    <script src="WebGLAnalytics.js"></script>
</head>
<body>
    <!-- Unity WebGL build -->
    <script>
        // Initialize analytics when Unity is ready
        window.webglAnalytics.initialize();
    </script>
</body>
</html>
```

### Unity to JavaScript Communication

In Unity, call JavaScript functions:

```csharp
#if UNITY_WEBGL && !UNITY_EDITOR
[DllImport("__Internal")]
private static extern void TrackWebGLEvent(string eventName, string eventData);

// Track events from Unity
TrackWebGLEvent("level_completed", JsonUtility.ToJson(new {
    level = 5,
    score = 1000,
    timeSpent = 120.5
}));
#endif
```

## ⚙️ Configuration

### Environment Variables

Key environment variables to configure:

```bash
# Analytics
SENTRY_DSN=your-sentry-dsn
AMPLITUDE_API_KEY=your-amplitude-key
MIXPANEL_TOKEN=your-mixpanel-token
DATADOG_APPLICATION_ID=your-datadog-app-id
DATADOG_CLIENT_TOKEN=your-datadog-token

# Cloud Services
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project
AZURE_STORAGE_ACCOUNT=your-azure-account

# Game Configuration
GAME_VERSION=1.0.0
MAX_LEVELS=100
DEFAULT_LIVES=5
```

### Unity Package Manager

Ensure all Unity packages are installed:

```json
{
  "dependencies": {
    "com.unity.services.analytics": "5.0.0",
    "com.unity.services.authentication": "3.0.0",
    "com.unity.services.cloudcode": "3.0.0",
    "com.unity.services.core": "2.0.0",
    "com.unity.services.economy": "3.0.0",
    "com.unity.services.remote-config": "4.0.0"
  }
}
```

## 📚 API Reference

### Game Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/game/start` | Start a new game |
| POST | `/api/game/level-complete` | Complete a level |
| POST | `/api/game/match-made` | Track a match |
| POST | `/api/game/powerup-used` | Track power-up usage |
| POST | `/api/game/purchase` | Handle in-game purchase |
| POST | `/api/game/error` | Track game errors |
| GET | `/api/game/analytics/summary` | Get analytics summary |

### WebSocket Events

| Event | Description |
|-------|-------------|
| `game_event` | Send game event data |
| `performance_metric` | Send performance metrics |
| `websocket_connected` | Client connected |
| `websocket_disconnected` | Client disconnected |

## 🔧 Troubleshooting

### Common Issues

1. **Analytics not tracking**
   - Check API keys in environment variables
   - Verify network connectivity
   - Check browser console for errors

2. **Cloud save not working**
   - Verify cloud service credentials
   - Check Unity Services configuration
   - Ensure proper authentication

3. **Performance issues**
   - Check OpenTelemetry configuration
   - Monitor New Relic dashboards
   - Review Sentry performance data

4. **WebGL build issues**
   - Ensure WebGLAnalytics.js is included
   - Check browser compatibility
   - Verify CORS settings

### Debug Mode

Enable debug logging:

```javascript
// In your .env file
NODE_ENV=development
DEBUG=analytics,cloud-services

// In Unity
Debug.Log("Analytics Debug: " + analyticsManager.GetAnalyticsSummary());
```

### Monitoring Dashboards

Access your monitoring dashboards:

- **Sentry**: https://sentry.io/
- **New Relic**: https://one.newrelic.com/
- **Datadog**: https://app.datadoghq.com/
- **Amplitude**: https://amplitude.com/
- **Mixpanel**: https://mixpanel.com/

## 🎯 Best Practices

1. **Analytics**
   - Track meaningful events
   - Use consistent naming conventions
   - Include relevant context data

2. **Cloud Services**
   - Implement retry logic
   - Use multiple providers for redundancy
   - Monitor costs and usage

3. **Performance**
   - Monitor key metrics regularly
   - Set up alerts for anomalies
   - Optimize based on data

4. **Security**
   - Keep API keys secure
   - Use environment variables
   - Implement proper authentication

## 📞 Support

For additional help:

1. Check the troubleshooting section
2. Review the API documentation
3. Check service-specific documentation
4. Contact support for your cloud providers

---

**Happy Gaming! 🎮✨**