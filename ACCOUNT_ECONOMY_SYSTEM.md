# Account Economy System Documentation

## Overview

The Account Economy System is a comprehensive, industry-standard match-3 economy solution that integrates Unity Economy with user accounts and cross-platform synchronization. It provides a complete progression system, monetization features, and social mechanics typical of successful match-3 games.

## Features

### 🪙 **Multi-Currency System**
- **Coins**: Primary soft currency earned through gameplay
- **Gems**: Premium hard currency for special purchases
- **Energy**: Consumable resource for playing levels
- **Stars**: Achievement currency for high scores
- **Hearts**: Lives system for level attempts

### 📈 **Progression System**
- **Level System**: Player level with XP progression
- **Achievements**: Unlockable rewards and milestones
- **Daily Rewards**: Streak-based daily login bonuses
- **Statistics**: Comprehensive player performance tracking

### 🎒 **Inventory Management**
- **Powerups**: Bomb, Rocket, Rainbow, Lightning
- **Boosters**: Extra moves, Color bomb, Striped candy
- **Decorations**: Castle, Garden, and cosmetic items
- **Stackable Items**: Support for quantity-based items

### 💰 **Monetization Features**
- **In-App Purchases**: Integrated with Unity Economy
- **Subscriptions**: Premium pass system
- **Battle Pass**: Seasonal progression rewards
- **Dynamic Offers**: AI-powered personalized offers

### 🌐 **Cross-Platform Sync**
- **Account Linking**: Sync across all platforms
- **Unity Integration**: Seamless Unity Economy integration
- **Platform Detection**: Automatic platform identification
- **Data Synchronization**: Real-time economy data sync

## Architecture

### Backend Services

#### AccountEconomyService
```javascript
// Core economy management
const accountEconomyService = new AccountEconomyService();

// Initialize player economy
await accountEconomyService.initializePlayerEconomy(playerId, platform);

// Update currency
await accountEconomyService.updateCurrency(playerId, 'coins', 100, 'add', 'level_complete');

// Update inventory
await accountEconomyService.updateInventory(playerId, 'powerups', 'bomb', 1, 'add');

// Complete level with rewards
await accountEconomyService.completeLevel(playerId, level, score, stars);
```

#### API Endpoints

**Initialize Economy**
```http
POST /api/account-economy/initialize
Content-Type: application/json
Authorization: Bearer <token>

{
  "platform": "kongregate"
}
```

**Update Currency**
```http
POST /api/account-economy/currency/update
Content-Type: application/json
Authorization: Bearer <token>

{
  "currencyId": "coins",
  "amount": 100,
  "operation": "add",
  "source": "level_complete"
}
```

**Complete Level**
```http
POST /api/account-economy/level/complete
Content-Type: application/json
Authorization: Bearer <token>

{
  "level": 1,
  "score": 1500,
  "stars": 3,
  "xpGained": 150
}
```

**Claim Daily Reward**
```http
POST /api/account-economy/daily-reward/claim
Authorization: Bearer <token>
```

### Unity Integration

#### UnityEconomyIntegration.cs
```csharp
// Initialize with account linking
await InitializeAuthentication();

// Sync with account system
await SyncWithAccount();

// Load from account
await LoadFromAccount();

// Purchase items
await PurchaseItem(purchaseId);

// Add currency
await AddCurrency(currencyId, amount);
```

### Frontend Integration

#### JavaScript API
```javascript
// Initialize economy
await game.initializeAccountEconomy();

// Update currency
await game.updateCurrency('coins', 100, 'add', 'level_complete');

// Complete level
await game.completeLevel(1, 1500, 3);

// Claim daily reward
await game.claimDailyReward();
```

## Industry Standards Implementation

### 1. **Progression Mechanics**
- **Exponential XP Scaling**: Each level requires more XP
- **Milestone Rewards**: Special rewards at level intervals
- **Prestige System**: High-level player advancement
- **Achievement System**: Unlockable goals and rewards

### 2. **Monetization Psychology**
- **Soft Currency Sinks**: Coins for basic items
- **Hard Currency Gates**: Gems for premium content
- **Energy System**: Time-gated progression
- **Lives System**: Limited attempts with regeneration

### 3. **Retention Features**
- **Daily Rewards**: Streak-based login bonuses
- **Comeback Rewards**: Special offers for returning players
- **Social Features**: Gifts, leaderboards, guilds
- **Events**: Time-limited special content

### 4. **Data Analytics**
- **Player Behavior Tracking**: Comprehensive analytics
- **Economy Metrics**: ARPU, ARPPU, conversion rates
- **A/B Testing**: Dynamic offer optimization
- **Predictive Analytics**: Churn prediction and prevention

## Configuration

### Economy Settings
```javascript
const economyFeatures = {
  currencies: ['coins', 'gems', 'energy', 'stars', 'hearts'],
  progression: ['levels', 'xp', 'achievements', 'daily_rewards'],
  monetization: ['iap', 'ads', 'subscriptions', 'battle_pass'],
  social: ['gifts', 'leaderboards', 'guilds', 'events'],
  retention: ['daily_login', 'comeback_rewards', 'streaks', 'challenges']
};
```

### Currency Configuration
```javascript
const currencies = {
  coins: {
    id: 'coins',
    name: 'Coins',
    type: 'soft_currency',
    amount: 1000,
    maxAmount: 999999,
    icon: 'coin_icon',
    color: '#FFD700'
  },
  gems: {
    id: 'gems',
    name: 'Gems',
    type: 'hard_currency',
    amount: 50,
    maxAmount: 99999,
    icon: 'gem_icon',
    color: '#00BFFF'
  }
  // ... other currencies
};
```

## Testing

### Test Page
Access the test page at `/test-account-economy.html` to:
- Initialize player economy
- Test currency operations
- Test inventory management
- Test level completion
- Test daily rewards
- Verify cross-platform sync

### Test Commands
```javascript
// Initialize economy
await initializeEconomy();

// Add coins
await addCoins();

// Complete level
await completeLevel();

// Claim daily reward
await claimDailyReward();
```

## Security

### Authentication
- JWT token-based authentication
- Session validation for all requests
- Rate limiting on sensitive operations
- Input validation and sanitization

### Data Protection
- Encrypted sensitive data
- Secure API endpoints
- Audit logging for all operations
- GDPR compliance features

## Performance

### Caching
- AI-optimized caching system
- Multi-layer cache strategy
- Automatic cache invalidation
- Performance metrics tracking

### Optimization
- Lazy loading of economy data
- Batch operations for multiple updates
- Efficient database queries
- Real-time synchronization

## Monitoring

### Analytics
- Real-time economy metrics
- Player behavior tracking
- Performance monitoring
- Error tracking and alerting

### Dashboards
- Economy health dashboard
- Player progression analytics
- Monetization metrics
- A/B testing results

## Deployment

### Prerequisites
- Node.js 20+
- MongoDB or compatible database
- Redis for caching
- Unity Services account

### Installation
```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start the server
npm start
```

### Environment Variables
```env
# Database
MONGODB_URI=mongodb://localhost:27017/game-economy
REDIS_URL=redis://localhost:6379

# Unity Services
UNITY_PROJECT_ID=your-project-id
UNITY_ENVIRONMENT_ID=your-environment-id
UNITY_API_KEY=your-api-key

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
```

## API Reference

### Account Economy Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/account-economy/initialize` | Initialize player economy |
| GET | `/api/account-economy/data` | Get player economy data |
| POST | `/api/account-economy/currency/update` | Update currency |
| POST | `/api/account-economy/inventory/update` | Update inventory |
| POST | `/api/account-economy/progression/update` | Update progression |
| POST | `/api/account-economy/daily-reward/claim` | Claim daily reward |
| POST | `/api/account-economy/level/complete` | Complete level |
| POST | `/api/account-economy/sync/unity` | Sync with Unity |
| GET | `/api/account-economy/stats` | Get economy statistics |

## Troubleshooting

### Common Issues

1. **Economy not initializing**
   - Check authentication token
   - Verify database connection
   - Check Unity Services configuration

2. **Currency updates failing**
   - Verify currency ID exists
   - Check amount validation
   - Ensure sufficient balance

3. **Sync issues with Unity**
   - Check Unity Services authentication
   - Verify platform detection
   - Check network connectivity

### Debug Mode
Enable debug logging by setting:
```javascript
const DEBUG_MODE = true;
```

## Support

For technical support or questions:
- Check the test page for functionality verification
- Review server logs for error details
- Consult the API documentation
- Contact the development team

## Changelog

### Version 1.0.0
- Initial release
- Complete economy system implementation
- Unity integration
- Cross-platform synchronization
- Industry-standard features
- Comprehensive testing suite