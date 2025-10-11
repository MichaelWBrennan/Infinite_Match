# 🎮 Unity Dashboard Setup Guide

## 🚀 Quick Setup (15 minutes)

### Project Information
- **Project:** Evergreen Puzzler
- **Project ID:** 0dd5a03e-7f23-49c4-964e-7919c48c0574
- **Environment ID:** 1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d

### Step 1: Access Unity Dashboard
Go to: https://dashboard.unity3d.com/organizations/0dd5a03e-7f23-49c4-964e-7919c48c0574/projects/0dd5a03e-7f23-49c4-964e-7919c48c0574/environments/1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d

### Step 2: Economy Service Setup
Navigate to: Economy

#### Create 3 Currencies:
1. **Coins** (coins) - Soft Currency, Initial: 1000, Max: 999999
2. **Gems** (gems) - Hard Currency, Initial: 50, Max: 99999  
3. **Energy** (energy) - Consumable, Initial: 5, Max: 30

#### Create 13 Inventory Items:
1. **Hammer** (hammer) - Consumable, Max: 99
2. **Bomb** (bomb) - Consumable, Max: 99
3. **Lightning** (lightning) - Consumable, Max: 99
4. **Color Bomb** (color_bomb) - Consumable, Max: 99
5. **Extra Moves** (extra_moves) - Consumable, Max: 99
6. **Shield** (shield) - Consumable, Max: 99
7. **Multiplier** (multiplier) - Consumable, Max: 99
8. **Rainbow** (rainbow) - Consumable, Max: 99
9. **Stripe** (stripe) - Consumable, Max: 99
10. **Wrapped** (wrapped) - Consumable, Max: 99
11. **Jelly** (jelly) - Consumable, Max: 99
12. **Key** (key) - Consumable, Max: 99
13. **Chest** (chest) - Consumable, Max: 99

### Step 3: Remote Config Setup
Navigate to: Remote Config

#### Create Remote Config Keys:
- `interstitial_on_gameover_pct` (Float): 0.3
- `rv_prelevel_booster_enabled` (Bool): true
- `booster_mastery_hammer` (Int): 5
- `booster_mastery_bomb` (Int): 3
- `booster_mastery_lightning` (Int): 2
- `dda_difficulty_multiplier` (Float): 1.0
- `rescue_bundle_moves` (Int): 5
- `rescue_bundle_booster` (String): "hammer"

### Step 4: Cloud Code Setup
Navigate to: Cloud Code

#### Deploy Cloud Code Functions:
- `AddCurrency.js` - Add currency to player
- `SpendCurrency.js` - Spend currency from player
- `AddInventoryItem.js` - Add item to player inventory
- `UseInventoryItem.js` - Use item from player inventory

### Step 5: Analytics Setup
Navigate to: Analytics

#### Enable Analytics Events:
- `level_start` - Track level start
- `level_complete` - Track level completion
- `level_fail` - Track level failure
- `purchase_made` - Track in-app purchases
- `ad_watched` - Track ad views

## 🔧 Automation Systems

### ✅ Pre-configured Systems
- **CSV to Unity Dashboard Sync** - Ready to use
- **GitHub Actions CI/CD** - Fully configured
- **Python Automation Scripts** - All working
- **Unity Editor Tools** - Ready for use

### Health Check
Run the health check to verify setup:
```bash
npm run health
```

Expected score: 0.75/1.0 or higher

## 📊 Economy Integration

### CSV Data Processing
The system automatically processes economy data from CSV files:
- Currency definitions
- Inventory item configurations
- Pricing structures
- Remote config values

### Automated Deployment
All economy data is automatically deployed to Unity Dashboard through:
- GitHub Actions workflows
- Python automation scripts
- Unity Cloud Code functions

## 🚀 Next Steps

1. **Verify Setup** - Run health checks
2. **Test Economy** - Create test purchases
3. **Deploy Cloud Code** - Ensure functions are active
4. **Monitor Analytics** - Check event tracking
5. **Test Remote Config** - Verify configuration updates

---
*This consolidated setup guide replaces multiple individual setup documents.*