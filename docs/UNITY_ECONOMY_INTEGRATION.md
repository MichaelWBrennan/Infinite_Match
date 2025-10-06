# Unity Economy Integration Documentation

## Overview

This system provides a complete automated pipeline for managing game economy data from CSV to Unity Economy Service. It eliminates manual data entry and ensures consistency across builds and runtime.

## Architecture

```
CSV File → Parser → ScriptableObjects + JSON → Unity Economy Service → Runtime Manager
     ↓
GitHub Actions → Cloud Build → Automated Deployment
```

## Components

### 1. CSV Parser (`EconomyCSVParser.cs`)
- Parses `economy_items.csv` at build time
- Generates ScriptableObjects for Unity Editor
- Creates JSON data for runtime loading
- Generates Unity Economy configuration
- Validates data integrity

### 2. ScriptableObject Generator (`EconomyItemSO.cs`)
- Runtime data structure for economy items
- Loads from generated ScriptableObjects
- Provides utility methods for pricing and validation

### 3. Unity Economy Integration (`UnityEconomyIntegration.cs`)
- Handles Unity Authentication SDK integration
- Manages player balances and inventory
- Processes purchases through Unity Economy Service
- Provides Cloud Code integration

### 4. Runtime Economy Manager (`RuntimeEconomyManager.cs`)
- Unified interface for economy operations
- Loads data from multiple sources
- Provides fallback for offline mode
- Manages local balances and inventory

### 5. Cloud Build Processor (`CloudBuildEconomyProcessor.cs`)
- Automatically runs during Unity Cloud Build
- Ensures economy data is always up-to-date
- Validates generated assets
- Generates build reports

## CSV Format

The `economy_items.csv` file must contain the following columns:

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| id | string | Yes | Unique identifier for the item |
| type | string | Yes | Item type (currency, booster, pack) |
| name | string | Yes | Display name |
| cost_gems | int | Yes | Cost in gems (0 if not applicable) |
| cost_coins | int | Yes | Cost in coins (0 if not applicable) |
| quantity | int | Yes | Quantity/amount provided |
| description | string | Yes | Item description |
| rarity | string | No | Item rarity (common, uncommon, rare, epic, legendary) |
| category | string | No | Item category for grouping |
| is_purchasable | bool | No | Whether item can be purchased |
| is_consumable | bool | No | Whether item is consumed when used |
| is_tradeable | bool | No | Whether item can be traded |
| icon_path | string | No | Path to icon resource |

### Example CSV Entry
```csv
id,type,name,cost_gems,cost_coins,quantity,description,rarity,category,is_purchasable,is_consumable,is_tradeable,icon_path
coins_small,currency,Small Coin Pack,20,0,1000,Perfect for new players! Great value!,common,currency,true,false,true,UI/Currency/Coins
```

## Setup Instructions

### 1. Install Unity Services
1. Open Unity Project Settings
2. Go to Services tab
3. Link to Unity Project
4. Enable Economy Service
5. Enable Authentication Service
6. Enable Cloud Code Service

### 2. Configure Economy Service
1. Go to Unity Dashboard → Economy
2. Create currencies (coins, gems, energy)
3. Create inventory items (boosters, packs)
4. Set up virtual purchases
5. Configure real money purchases

### 3. Set Up Cloud Code
1. Deploy Cloud Code functions to Unity Services
2. Configure function permissions
3. Test functions in Unity Dashboard

### 4. Configure GitHub Actions
1. Set up repository secrets for Unity Services
2. Configure Cloud Build settings
3. Enable automated builds on push

## Usage

### Adding New Economy Items

1. **Edit CSV File**
   ```csv
   new_item,booster,New Booster,50,0,1,Amazing new booster!,rare,booster,true,true,true,UI/Boosters/NewBooster
   ```

2. **Commit Changes**
   ```bash
   git add unity/Assets/StreamingAssets/economy_items.csv
   git commit -m "Add new booster item"
   git push origin main
   ```

3. **Automatic Processing**
   - GitHub Actions validates CSV
   - Cloud Build processes data
   - ScriptableObjects generated
   - Unity Economy updated
   - Build artifacts created

### Runtime Usage

```csharp
// Get economy manager
var economyManager = RuntimeEconomyManager.Instance;

// Get player balance
int coins = economyManager.GetPlayerBalance("coins");
int gems = economyManager.GetPlayerBalance("gems");

// Purchase item
bool success = await economyManager.PurchaseItem("coins_small");

// Add currency
await economyManager.AddCurrency("coins", 1000);

// Use inventory item
await economyManager.UseInventoryItem("booster_extra_moves", 1);
```

## API Reference

### RuntimeEconomyManager

#### Methods
- `GetEconomyItem(string itemId)` - Get economy item by ID
- `GetAllEconomyItems()` - Get all economy items
- `GetEconomyItemsByType(string type)` - Get items by type
- `GetEconomyItemsByCategory(string category)` - Get items by category
- `GetPlayerBalance(string currencyId)` - Get player balance
- `GetPlayerInventoryCount(string itemId)` - Get inventory count
- `PurchaseItem(string itemId)` - Purchase an item
- `AddCurrency(string currencyId, int amount)` - Add currency
- `SpendCurrency(string currencyId, int amount)` - Spend currency
- `UseInventoryItem(string itemId, int quantity)` - Use inventory item
- `GetAvailablePurchases()` - Get purchasable items
- `GetEconomyStatus()` - Get economy status

#### Events
- `OnBalanceChanged` - Fired when balance changes
- `OnInventoryChanged` - Fired when inventory changes
- `OnItemPurchased` - Fired when item is purchased
- `OnEconomyDataLoaded` - Fired when data is loaded

### EconomyItemSO

#### Properties
- `itemId` - Unique identifier
- `itemType` - Item type (currency, booster, pack)
- `itemName` - Display name
- `description` - Item description
- `costGems` - Cost in gems
- `costCoins` - Cost in coins
- `quantity` - Quantity provided
- `rarity` - Item rarity
- `category` - Item category
- `isPurchasable` - Whether purchasable
- `isConsumable` - Whether consumable
- `isTradeable` - Whether tradeable

#### Methods
- `GetTotalCostInGems()` - Get total cost in gems
- `CanAfford(int gems, int coins)` - Check if affordable
- `GetDisplayPrice()` - Get formatted price string
- `GetRarityColor()` - Get rarity color
- `IsCurrency()` - Check if currency
- `IsBooster()` - Check if booster
- `IsPack()` - Check if pack
- `IsValid()` - Validate item data

## Troubleshooting

### Common Issues

1. **CSV Parsing Errors**
   - Check column names match exactly
   - Ensure no empty required fields
   - Validate numeric fields are numbers
   - Check for duplicate IDs

2. **ScriptableObject Generation Fails**
   - Ensure Resources/Economy directory exists
   - Check file permissions
   - Verify CSV data is valid

3. **Unity Economy Integration Issues**
   - Verify Unity Services are enabled
   - Check authentication status
   - Ensure Cloud Code functions are deployed
   - Verify project configuration

4. **Build Failures**
   - Check Cloud Build logs
   - Verify all dependencies are installed
   - Ensure CSV file is valid
   - Check Unity version compatibility

### Debug Mode

Enable debug logging in `RuntimeEconomyManager`:
```csharp
[SerializeField] private bool enableDebugLogs = true;
```

### Validation

Run CSV validation manually:
```csharp
var items = EconomyCSVParser.ParseCSVFile();
var errors = EconomyCSVParser.ValidateCSVData(items);
```

## Best Practices

### CSV Management
- Use descriptive IDs (e.g., `coins_small` not `item1`)
- Keep descriptions concise but informative
- Use consistent naming conventions
- Validate data before committing

### Economy Design
- Start with low-cost items for new players
- Use industry-standard pricing tiers ($0.99, $4.99, $9.99, $19.99)
- Implement proper currency sinks to prevent inflation
- Balance free vs. paid content

### Performance
- Load economy data once at startup
- Cache frequently accessed items
- Use async/await for Unity Economy calls
- Implement proper error handling

### Security
- Validate all purchases server-side
- Use Unity Economy for real money transactions
- Implement proper authentication
- Log all economy events

## Extending the System

### Adding New Item Types
1. Update CSV parser to handle new type
2. Add validation rules
3. Update ScriptableObject properties
4. Modify runtime manager logic

### Adding New Currencies
1. Add currency to CSV
2. Update Unity Economy configuration
3. Add to local fallback system
4. Update UI components

### Custom Purchase Logic
1. Extend `RuntimeEconomyManager`
2. Override purchase methods
3. Add custom validation
4. Implement special offers

## Support

For issues or questions:
1. Check this documentation
2. Review Unity Economy Service docs
3. Check GitHub Issues
4. Contact development team

## Changelog

### Version 1.0.0
- Initial implementation
- CSV parsing and validation
- ScriptableObject generation
- Unity Economy integration
- Cloud Build automation
- GitHub Actions workflow