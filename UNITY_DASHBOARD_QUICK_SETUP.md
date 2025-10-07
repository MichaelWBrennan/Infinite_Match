
# 🎮 Unity Dashboard Setup Instructions
# Project: Evergreen Puzzler
# Project ID: 0dd5a03e-7f23-49c4-964e-7919c48c0574
# Environment ID: 1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d

## 🚀 QUICK SETUP (15 minutes)

### Step 1: Open Unity Dashboard
Go to: https://dashboard.unity3d.com/organizations/0dd5a03e-7f23-49c4-964e-7919c48c0574/projects/0dd5a03e-7f23-49c4-964e-7919c48c0574/environments/1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d

### Step 2: Economy Service (5 minutes)
Navigate to: Economy

#### Create 3 Currencies:
1. **Coins** (coins) - Soft Currency, Initial: 1000, Max: 999999
2. **Gems** (gems) - Hard Currency, Initial: 50, Max: 99999  
3. **Energy** (energy) - Consumable, Initial: 5, Max: 30

#### Create 13 Inventory Items:
1. booster_extra_moves - Extra Moves (booster, tradable)
2. booster_color_bomb - Color Bomb (booster, tradable)
3. booster_rainbow_blast - Rainbow Blast (booster, tradable)
4. booster_striped_candy - Striped Candy (booster, tradable)
5. pack_starter - Starter Pack (pack, non-tradable)
6. pack_value - Value Pack (pack, non-tradable)
7. pack_premium - Premium Pack (pack, non-tradable)
8. pack_mega - Mega Pack (pack, non-tradable)
9. pack_ultimate - Ultimate Pack (pack, non-tradable)
10. pack_booster_small - Booster Bundle (pack, non-tradable)
11. pack_booster_large - Power Pack (pack, non-tradable)
12. pack_comeback - Welcome Back! (pack, non-tradable)
13. pack_flash_sale - Flash Sale! (pack, non-tradable)

#### Create 20 Virtual Purchases:
- coins_small: 20 gems → 1000 coins
- coins_medium: 120 gems → 5000 coins
- coins_large: 300 gems → 15000 coins
- coins_mega: 700 gems → 40000 coins
- coins_ultimate: 2000 gems → 100000 coins
- energy_small: 5 gems → 5 energy
- energy_large: 15 gems → 20 energy
- booster_extra_moves: 200 coins → 3 boosters
- booster_color_bomb: 15 gems → 1 booster
- booster_rainbow_blast: 25 gems → 1 booster
- booster_striped_candy: 100 coins → 1 booster
- pack_starter: 20 gems → 1 pack
- pack_value: 120 gems → 1 pack
- pack_premium: 300 gems → 1 pack
- pack_mega: 700 gems → 1 pack
- pack_ultimate: 2000 gems → 1 pack
- pack_booster_small: 500 coins → 1 pack
- pack_booster_large: 25 gems → 1 pack
- pack_comeback: 50 gems → 1 pack
- pack_flash_sale: 25 gems → 1 pack

### Step 3: Other Services (10 minutes)
1. **Authentication**: Enable Anonymous Sign-In
2. **Cloud Code**: Deploy 4 functions (AddCurrency.js, SpendCurrency.js, AddInventoryItem.js, UseInventoryItem.js)
3. **Analytics**: Create 6 events (economy_purchase, economy_balance_change, economy_inventory_change, level_completed, streak_achieved, currency_awarded)
4. **Cloud Save**: Enable Cloud Save
5. **Unity Ads**: Configure ad placements
6. **Unity Purchasing**: Create 12 IAP products

## 🧪 Testing
After dashboard setup:
1. Open Unity Editor
2. Go to Tools → Economy → Sync CSV to Unity Dashboard
3. Click "Initialize Unity Services"
4. Click "Full Sync (All Items)"
5. Verify all items sync successfully

## 📊 What's Already Automated
✅ Configuration files generated
✅ GitHub Actions CI/CD configured  
✅ Python automation scripts working
✅ Unity Editor tools ready
✅ Health monitoring active
✅ Daily maintenance scheduled

## ⏱️ Total Time Required
- Automation: ✅ DONE (0 minutes)
- Manual Dashboard Setup: ⏳ ~15 minutes
- Testing: ⏳ ~5 minutes
- **Total: ~20 minutes**
