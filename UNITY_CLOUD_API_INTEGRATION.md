# Unity Cloud API Integration

## 🎯 Overview

This document describes the comprehensive Unity Cloud API integration that has been added to your headless system. The integration provides direct API access to all Unity Cloud services without requiring browser automation or interactive authentication.

## 🚀 Features

### ✅ Complete API Coverage
- **Economy Service**: Currencies, Inventory, Catalog management
- **Remote Config Service**: Configuration management
- **Cloud Code Service**: Function deployment and execution
- **Analytics Service**: Event tracking and metrics
- **Project Management**: Project and environment information

### ✅ Headless Operation
- **No Browser Required**: Pure API-based integration
- **Automated Authentication**: Token-based authentication
- **Retry Logic**: Built-in retry mechanisms for reliability
- **Error Handling**: Comprehensive error handling and reporting

### ✅ CLI Interface
- **Command Line Tools**: Easy-to-use CLI for all operations
- **NPM Scripts**: Integrated with your existing npm scripts
- **Batch Operations**: Deploy all services at once
- **Status Monitoring**: Real-time service health checks

## 📁 File Structure

```
src/
├── unity-cloud-api-client.js          # Core API client
├── unity-cloud-headless-integration.js # Headless integration layer
└── unity-cloud-cli.js                 # Command-line interface
```

## 🔧 Installation

The integration is already set up in your project. To install dependencies:

```bash
npm install
```

## 🔐 Configuration

### Environment Variables

Set these environment variables for API authentication:

```bash
# Required for API access
export UNITY_CLIENT_ID="your-client-id"
export UNITY_CLIENT_SECRET="your-client-secret"

# Optional (will use defaults if not set)
export UNITY_PROJECT_ID="0dd5a03e-7f23-49c4-964e-7919c48c0574"
export UNITY_ENV_ID="1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"
export UNITY_ORG_ID="2473931369648"
```

### Cursor Secrets (Alternative)

You can also use Cursor secrets:

```bash
# Set secrets in Cursor
cursor setSecret UNITY_CLIENT_ID "your-client-id"
cursor setSecret UNITY_CLIENT_SECRET "your-client-secret"
```

## 🚀 Usage

### Command Line Interface

#### Deploy All Services
```bash
# Deploy everything
npm run unity:deploy-api

# Deploy specific service
npm run unity:deploy-api -- --economy
npm run unity:deploy-api -- --cloud-code
npm run unity:deploy-api -- --remote-config
npm run unity:deploy-api -- --analytics
```

#### Check Status
```bash
# Check overall status
npm run unity:status-api

# Check service health
npm run unity:health-api
```

#### Sync Data
```bash
# Sync local data with Unity Cloud
npm run unity:sync-api
```

#### Service-Specific Operations
```bash
# Economy service
npm run unity:economy-api

# Cloud Code service
npm run unity:cloud-code-api

# Remote Config service
npm run unity:remote-config-api

# Analytics service
npm run unity:analytics-api
```

### Programmatic Usage

#### Basic API Client
```javascript
import UnityCloudAPIClient from './src/unity-cloud-api-client.js';

const client = new UnityCloudAPIClient({
    projectId: 'your-project-id',
    environmentId: 'your-environment-id',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret'
});

// Authenticate
await client.authenticate();

// Get currencies
const currencies = await client.getCurrencies();

// Create currency
await client.createCurrency({
    id: 'gold',
    name: 'Gold',
    type: 'soft_currency',
    initial: 1000,
    maximum: 999999
});
```

#### Headless Integration
```javascript
import UnityCloudHeadlessIntegration from './src/unity-cloud-headless-integration.js';

const integration = new UnityCloudHeadlessIntegration();

// Deploy all services
await integration.deployAll();

// Sync data
await integration.syncData();

// Check status
const status = await integration.apiClient.generateStatusReport();
```

## 📊 API Reference

### Economy Service

#### Currencies
```javascript
// Get all currencies
const currencies = await client.getCurrencies();

// Create currency
await client.createCurrency({
    id: 'coins',
    name: 'Coins',
    type: 'soft_currency',
    initial: 1000,
    maximum: 999999
});

// Update currency
await client.updateCurrency('coins', {
    name: 'Gold Coins',
    maximum: 9999999
});

// Delete currency
await client.deleteCurrency('coins');
```

#### Inventory Items
```javascript
// Get all inventory items
const inventory = await client.getInventoryItems();

// Create inventory item
await client.createInventoryItem({
    id: 'sword',
    name: 'Magic Sword',
    type: 'weapon',
    tradable: true,
    stackable: false
});

// Update inventory item
await client.updateInventoryItem('sword', {
    name: 'Legendary Sword',
    tradable: false
});

// Delete inventory item
await client.deleteInventoryItem('sword');
```

#### Catalog Items
```javascript
// Get all catalog items
const catalog = await client.getCatalogItems();

// Create catalog item
await client.createCatalogItem({
    id: 'coins_pack',
    name: 'Coin Pack',
    cost_currency: 'gems',
    cost_amount: 10,
    rewards: 'coins:1000'
});

// Update catalog item
await client.updateCatalogItem('coins_pack', {
    cost_amount: 5,
    rewards: 'coins:500'
});

// Delete catalog item
await client.deleteCatalogItem('coins_pack');
```

### Remote Config Service

```javascript
// Get all remote config entries
const configs = await client.getRemoteConfigs();

// Create remote config entry
await client.createRemoteConfig({
    key: 'max_level',
    value: 100,
    type: 'number'
});

// Update remote config entry
await client.updateRemoteConfig('max_level', {
    value: 200,
    type: 'number'
});

// Delete remote config entry
await client.deleteRemoteConfig('max_level');
```

### Cloud Code Service

```javascript
// Get all cloud code functions
const functions = await client.getCloudCodeFunctions();

// Create cloud code function
await client.createCloudCodeFunction({
    name: 'addCurrency',
    code: `
        function addCurrency(amount) {
            return { success: true, amount: amount };
        }
    `,
    language: 'javascript'
});

// Execute cloud code function
const result = await client.executeCloudCodeFunction('addCurrency', {
    amount: 100
});

// Update cloud code function
await client.updateCloudCodeFunction('addCurrency', {
    code: '/* updated code */'
});

// Delete cloud code function
await client.deleteCloudCodeFunction('addCurrency');
```

### Analytics Service

```javascript
// Get analytics events
const events = await client.getAnalyticsEvents({
    startDate: '2024-01-01',
    endDate: '2024-01-31'
});

// Send analytics event
await client.sendAnalyticsEvent({
    eventName: 'player_level_up',
    timestamp: new Date().toISOString(),
    properties: {
        level: 10,
        playerId: 'player123'
    }
});

// Get analytics metrics
const metrics = await client.getAnalyticsMetrics('retention', {
    period: '7d'
});
```

## 🔄 Bulk Operations

### Deploy from Local Files

The integration automatically reads from your local files and deploys to Unity Cloud:

```javascript
// Deploy economy data from CSV files
await client.deployEconomyFromFiles('economy');

// Deploy cloud code from JS files
await client.deployCloudCodeFromFiles('cloud-code');

// Deploy remote config from JSON files
await client.deployRemoteConfigFromFiles('remote-config');
```

### File Formats

#### Economy Data (CSV)
```csv
# currencies.csv
id,name,type,initial,maximum
coins,Coins,soft_currency,1000,999999
gems,Gems,hard_currency,50,99999
energy,Energy,consumable,5,30

# inventory.csv
id,name,type,tradable,stackable
sword,Magic Sword,weapon,true,false
potion,Health Potion,consumable,true,true

# catalog.csv
id,name,cost_currency,cost_amount,rewards
coins_pack,Coin Pack,gems,10,coins:1000
gem_pack,Gem Pack,coins,1000,gems:10
```

#### Remote Config (JSON)
```json
{
  "max_level": 100,
  "starting_health": 100,
  "difficulty_multiplier": 1.5,
  "feature_flags": {
    "new_ui": true,
    "beta_features": false
  }
}
```

#### Cloud Code (JavaScript)
```javascript
// AddCurrency.js
function addCurrency(amount) {
    // Add currency logic
    return { success: true, amount: amount };
}

// SpendCurrency.js
function spendCurrency(amount) {
    // Spend currency logic
    return { success: true, amount: amount };
}
```

## 🔍 Monitoring and Health Checks

### Service Health Check
```javascript
const health = await client.checkServiceHealth();
console.log(health);
```

### Status Report
```javascript
const report = await client.generateStatusReport();
console.log(report);
```

### CLI Health Check
```bash
npm run unity:health-api
```

## 🚨 Error Handling

The API client includes comprehensive error handling:

- **Authentication Errors**: Automatic token refresh
- **Rate Limiting**: Built-in retry logic
- **Network Errors**: Retry with exponential backoff
- **API Errors**: Detailed error messages and logging

## 📈 Performance

### Optimizations
- **Connection Pooling**: Reuses HTTP connections
- **Request Batching**: Groups multiple requests
- **Caching**: Caches authentication tokens
- **Retry Logic**: Handles transient failures

### Monitoring
- **Request Timing**: Tracks API response times
- **Error Rates**: Monitors failure rates
- **Success Rates**: Tracks operation success
- **Health Status**: Real-time service health

## 🔧 Troubleshooting

### Common Issues

#### Authentication Failed
```bash
# Check credentials
echo $UNITY_CLIENT_ID
echo $UNITY_CLIENT_SECRET

# Test authentication
npm run unity:health-api
```

#### Service Not Available
```bash
# Check service status
npm run unity:status-api

# Check specific service
npm run unity:economy-api
```

#### Deployment Failed
```bash
# Check logs
npm run unity:deploy-api

# Deploy specific service
npm run unity:deploy-api -- --economy
```

### Debug Mode

Enable debug logging:

```javascript
const client = new UnityCloudAPIClient({
    debug: true
});
```

## 🎯 Integration with Existing System

### GitHub Actions Integration

The API integration works seamlessly with your existing GitHub Actions:

```yaml
- name: Deploy Unity Cloud Services (API)
  run: |
    npm run unity:deploy-api
```

### Headless Automation

The API client can be used in your existing headless automation:

```javascript
// In your existing automation scripts
import UnityCloudHeadlessIntegration from './src/unity-cloud-headless-integration.js';

const integration = new UnityCloudHeadlessIntegration();
await integration.deployAll();
```

## 📚 Examples

### Complete Deployment Example
```javascript
import UnityCloudHeadlessIntegration from './src/unity-cloud-headless-integration.js';

async function deployToUnityCloud() {
    const integration = new UnityCloudHeadlessIntegration();
    
    try {
        // Initialize
        await integration.initialize();
        
        // Deploy all services
        const results = await integration.deployAll();
        
        // Sync data
        await integration.syncData();
        
        // Check status
        const status = await integration.apiClient.generateStatusReport();
        
        console.log('✅ Deployment completed successfully!');
        console.log('Status:', status);
        
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
}

deployToUnityCloud();
```

### Economy Management Example
```javascript
import UnityCloudAPIClient from './src/unity-cloud-api-client.js';

async function manageEconomy() {
    const client = new UnityCloudAPIClient();
    await client.authenticate();
    
    // Create currencies
    await client.createCurrency({
        id: 'gold',
        name: 'Gold',
        type: 'soft_currency',
        initial: 1000,
        maximum: 999999
    });
    
    // Create inventory items
    await client.createInventoryItem({
        id: 'sword',
        name: 'Magic Sword',
        type: 'weapon',
        tradable: true,
        stackable: false
    });
    
    // Create catalog items
    await client.createCatalogItem({
        id: 'gold_pack',
        name: 'Gold Pack',
        cost_currency: 'gems',
        cost_amount: 10,
        rewards: 'gold:1000'
    });
    
    console.log('✅ Economy setup completed!');
}

manageEconomy();
```

## 🎉 Summary

Your headless system now has complete Unity Cloud API integration with:

✅ **Full API Coverage**: All Unity Cloud services accessible via API
✅ **Headless Operation**: No browser or interactive authentication required
✅ **CLI Interface**: Easy-to-use command-line tools
✅ **Bulk Operations**: Deploy entire services from local files
✅ **Error Handling**: Comprehensive error handling and retry logic
✅ **Monitoring**: Real-time health checks and status reporting
✅ **Integration**: Seamless integration with existing automation

The integration provides a robust, reliable way to manage your Unity Cloud services programmatically, perfect for your headless automation needs!