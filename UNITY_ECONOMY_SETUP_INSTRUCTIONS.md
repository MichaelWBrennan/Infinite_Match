
# Unity Economy Service Setup Instructions

## Overview
This configuration was automatically generated from your CSV data.
Total items: 33

## 1. Unity Dashboard Configuration

### Project Setup
1. Go to Unity Dashboard (https://dashboard.unity3d.com)
2. Select your project or create a new one
3. Note your Project ID and Environment ID
4. Update the configuration file with your actual IDs

### Economy Service Setup
1. Go to Unity Dashboard → Economy
2. Create the following currencies:
   - Coins (coins): soft_currency
   - Gems (gems): hard_currency
   - Energy (energy): consumable

3. Create 13 inventory items:
   - Extra Moves (booster_extra_moves): booster
   - Color Bomb (booster_color_bomb): booster
   - Rainbow Blast (booster_rainbow_blast): booster
   - Striped Candy (booster_striped_candy): booster
   - Starter Pack (pack_starter): pack
   - Value Pack (pack_value): pack
   - Premium Pack (pack_premium): pack
   - Mega Pack (pack_mega): pack
   - Ultimate Pack (pack_ultimate): pack
   - Booster Bundle (pack_booster_small): pack
   - Power Pack (pack_booster_large): pack
   - Welcome Back! (pack_comeback): pack
   - Flash Sale! (pack_flash_sale): pack

4. Create 20 virtual purchases:
   - Small Coin Pack (coins_small): 20 gems
   - Medium Coin Pack (coins_medium): 120 gems
   - Large Coin Pack (coins_large): 300 gems
   - Mega Coin Pack (coins_mega): 700 gems
   - Ultimate Coin Pack (coins_ultimate): 2000 gems
   - Energy Boost (energy_small): 5 gems
   - Energy Surge (energy_large): 15 gems
   - Extra Moves (booster_extra_moves): 200 coins
   - Color Bomb (booster_color_bomb): 15 gems
   - Rainbow Blast (booster_rainbow_blast): 25 gems
   - Striped Candy (booster_striped_candy): 100 coins
   - Starter Pack (pack_starter): 20 gems
   - Value Pack (pack_value): 120 gems
   - Premium Pack (pack_premium): 300 gems
   - Mega Pack (pack_mega): 700 gems
   - Ultimate Pack (pack_ultimate): 2000 gems
   - Booster Bundle (pack_booster_small): 500 coins
   - Power Pack (pack_booster_large): 25 gems
   - Welcome Back! (pack_comeback): 50 gems
   - Flash Sale! (pack_flash_sale): 25 gems

### Authentication Service Setup
1. Go to Unity Dashboard → Authentication
2. Enable Anonymous Sign-In
3. Configure authentication settings

### Cloud Code Service Setup
1. Go to Unity Dashboard → Cloud Code
2. Deploy the following functions:
   - AddCurrency
   - SpendCurrency
   - AddInventoryItem
   - UseInventoryItem

### Analytics Service Setup
1. Go to Unity Dashboard → Analytics
2. Configure custom events:
   - economy_purchase
   - economy_balance_change
   - economy_inventory_change
   - level_completed
   - streak_achieved
   - currency_awarded

## 2. Unity Project Configuration

### Update Project Settings
1. Open Unity Project Settings
2. Go to Services tab
3. Link to your Unity project
4. Enable all required services

### Update Configuration File
Update the following file with your actual project details:
`unity/Assets/StreamingAssets/unity_services_config.json`

Replace:
- `your-unity-project-id` with your actual project ID
- `your-environment-id` with your actual environment ID

## 3. Testing

### Test Unity Services Integration
1. Open Unity Editor
2. Go to Tools → Economy → Sync CSV to Unity Dashboard
3. Click "Initialize Unity Services"
4. Click "Full Sync (All Items)"
5. Verify all items are created successfully

### Test Cloud Code Functions
1. Deploy Cloud Code functions
2. Test each function with sample data
3. Verify functions work correctly

## 4. Automation

### CI/CD Integration
The system is already integrated with your CI/CD pipeline:
- CSV changes trigger automatic processing
- Unity Dashboard sync happens during builds
- All configurations are generated automatically

### Manual Sync
You can manually sync at any time:
1. Open Unity Editor
2. Go to Tools → Economy → Sync CSV to Unity Dashboard
3. Use the sync tools as needed

## 5. Troubleshooting

### Common Issues
1. **Authentication Failed**: Check Unity Services configuration
2. **Items Not Created**: Verify CSV data format
3. **Sync Failed**: Check Unity Services permissions
4. **Build Errors**: Verify all dependencies are installed

### Debug Mode
Enable debug logging in Unity Editor:
1. Go to Tools → Economy → Sync CSV to Unity Dashboard
2. Check debug options
3. Review console output for errors

## Support
For issues or questions:
1. Check Unity Services documentation
2. Review generated configuration files
3. Check Unity Console for error messages
4. Contact development team

Generated on: {config['generatedAt']}
Version: {config['version']}
