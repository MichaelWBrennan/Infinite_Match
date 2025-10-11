# Setup Guide

## Quick Setup (5 minutes)

### 1. Unity Cloud Setup
- **Project ID:** `0dd5a03e-7f23-49c4-964e-7919c48c0574`
- **Environment ID:** `1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d`
- **Dashboard:** https://dashboard.unity3d.com/organizations/0dd5a03e-7f23-49c4-964e-7919c48c0574/projects/0dd5a03e-7f23-49c4-964e-7919c48c0574/environments/1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d

### 2. Economy Service
Create 3 currencies:
- **Coins** (coins) - Soft Currency, Initial: 1000, Max: 999999
- **Gems** (gems) - Hard Currency, Initial: 50, Max: 99999  
- **Energy** (energy) - Consumable, Initial: 5, Max: 30

Create 13 inventory items (all consumable, max 99):
- Hammer, Bomb, Lightning, Color Bomb, Extra Moves, Shield, Multiplier, Rainbow, Stripe, Wrapped, Jelly, Key, Chest

### 3. Remote Config
Create these keys:
- `interstitial_on_gameover_pct` (Float): 0.3
- `rv_prelevel_booster_enabled` (Bool): true
- `booster_mastery_hammer` (Int): 5
- `booster_mastery_bomb` (Int): 3
- `booster_mastery_lightning` (Int): 2
- `dda_difficulty_multiplier` (Float): 1.0
- `rescue_bundle_moves` (Int): 5
- `rescue_bundle_booster` (String): "hammer"

### 4. Cloud Code
Deploy these functions:
- `AddCurrency.js` - Add currency to player
- `SpendCurrency.js` - Spend currency from player
- `AddInventoryItem.js` - Add item to player inventory
- `UseInventoryItem.js` - Use item from player inventory

### 5. GitHub Secrets
Add to repository settings:
- `UNITY_PROJECT_ID`
- `UNITY_ENV_ID` 
- `UNITY_CLIENT_ID`
- `UNITY_CLIENT_SECRET`

### 6. Verify Setup
```bash
npm run health
```
Expected score: 0.75/1.0 or higher