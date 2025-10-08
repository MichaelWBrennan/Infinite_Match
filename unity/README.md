# Unity Economy System Integration

This Unity project is fully integrated with the headless Unity update system and includes a complete economy system for Match-3 games.

## 🎯 Features

- **Complete Economy System**: Currencies, inventory, and catalog management
- **Cloud Code Integration**: Simulated Unity Cloud Code functions
- **Remote Config**: Game settings and configuration management
- **UI System**: Ready-to-use UI components for economy display
- **Personal License Support**: Works without Unity Cloud Services credentials

## 📁 Project Structure

```
Assets/
├── Scripts/
│   ├── Economy/
│   │   └── EconomyManager.cs          # Main economy system
│   ├── CloudCode/
│   │   └── CloudCodeManager.cs       # Cloud Code simulation
│   ├── RemoteConfig/
│   │   └── RemoteConfigManager.cs    # Remote Config management
│   ├── UI/
│   │   └── EconomyUI.cs              # Economy UI components
│   └── GameManager.cs                # Main game manager
├── StreamingAssets/
│   └── unity_services_config.json    # Economy configuration
└── Packages/
    └── manifest.json                 # Unity package dependencies
```

## 🚀 Quick Start

### 1. Open in Unity
1. Open Unity Hub
2. Create a new 3D project or open existing project
3. Copy the contents of this folder to your Unity project

### 2. Install Dependencies
The project will automatically install required packages:
- Unity Services Core
- Unity Economy
- Unity Remote Config
- Unity Cloud Code
- TextMeshPro

### 3. Set Up Scene
1. Create an empty GameObject in your scene
2. Add the `GameManager` component
3. The system will automatically initialize all managers

### 4. Configure UI (Optional)
1. Create UI Canvas
2. Add `EconomyUI` component to a GameObject
3. Assign UI references in the inspector

## 🎮 Usage

### Basic Economy Operations
```csharp
// Add currency
GameManager.Instance.AddCurrency("coins", 100);

// Spend currency
GameManager.Instance.SpendCurrency("gems", 50);

// Add inventory item
GameManager.Instance.AddInventoryItem("booster_extra_moves", 2);

// Use inventory item
GameManager.Instance.UseInventoryItem("booster_extra_moves", 1);

// Purchase from catalog
GameManager.Instance.PurchaseItem("coins_small");
```

### Cloud Code Functions
```csharp
// Simulated Cloud Code calls
CloudCodeManager.Instance.AddCurrency("player_id", "coins", 100);
CloudCodeManager.Instance.SpendCurrency("player_id", "gems", 25);
CloudCodeManager.Instance.AddInventoryItem("player_id", "booster_extra_moves", 1);
CloudCodeManager.Instance.UseInventoryItem("player_id", "booster_color_bomb", 1);
```

### Remote Config
```csharp
// Get configuration values
bool adsEnabled = RemoteConfigManager.Instance.GetBool("ads_enabled");
int maxEnergy = RemoteConfigManager.Instance.GetInt("max_energy");
float difficulty = RemoteConfigManager.Instance.GetFloat("level_difficulty_multiplier");
```

## 📊 Economy Data

The system includes pre-configured economy data:

### Currencies
- **Coins**: Soft currency (1000 initial, 999999 max)
- **Gems**: Hard currency (50 initial, 99999 max)
- **Energy**: Consumable (5 initial, 30 max)

### Inventory Items
- **Boosters**: Extra Moves, Color Bomb, Rainbow Blast, Striped Candy
- **Packs**: Various starter, value, premium, and mega packs

### Catalog Items
- **Coin Packs**: Small, Medium, Large, Mega, Ultimate
- **Energy Packs**: Small and Large energy boosts
- **Booster Packs**: Individual and bundle boosters

## 🔧 Configuration

### Economy Settings
Edit `StreamingAssets/unity_services_config.json` to modify:
- Currency amounts and limits
- Inventory item properties
- Catalog item prices and rewards
- Remote Config values

### Debug Mode
Enable debug mode in the GameManager to see detailed logs:
```csharp
public bool debugMode = true;
```

## 🔄 Integration with Headless System

This Unity project automatically syncs with the headless update system:

1. **Automatic Updates**: Economy data updates on each push
2. **CSV Integration**: Data loaded from economy CSV files
3. **Configuration Sync**: Remote Config values updated automatically
4. **Cloud Code Deploy**: Functions deployed automatically

## 🧪 Testing

### Test Economy System
1. Enable debug mode
2. Run the scene
3. Check Console for economy status logs
4. Use the test button in EconomyUI (if configured)

### Test Cloud Code
```csharp
CloudCodeManager.Instance.TestAllCloudCodeFunctions();
```

## 📱 UI Components

The EconomyUI component provides:
- Currency display (coins, gems, energy)
- Inventory management
- Shop interface
- Test and refresh buttons

## 🎯 Next Steps

1. **Customize Economy**: Modify the configuration file for your game's needs
2. **Create UI**: Build your own UI using the provided components
3. **Add Game Logic**: Integrate economy with your Match-3 gameplay
4. **Test Thoroughly**: Use the debug tools to test all functionality

## 🆘 Troubleshooting

### Common Issues
1. **Configuration not loading**: Check StreamingAssets folder exists
2. **UI not updating**: Ensure EconomyUI is properly configured
3. **Events not firing**: Check that managers are initialized

### Debug Tips
- Enable debug mode for detailed logging
- Check Console for error messages
- Verify all manager references are assigned

## 📞 Support

For issues with the headless update system, check the main project documentation.
For Unity-specific issues, refer to Unity's documentation or community forums.

---

**Happy Game Development! 🎮**
