# Unity Dashboard Manual Setup Instructions

## Project Information
- **Project ID**: 0dd5a03e-7f23-49c4-964e-7919c48c0574
- **Environment ID**: 1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d
- **Total Items**: 20

## Step 1: Access Unity Dashboard
1. Go to: https://dashboard.unity3d.com
2. Navigate to your project
3. Go to Economy section

## Step 2: Create Currencies (3 items)
1. Go to Economy → Currencies
2. Click "Create Currency" and add:

### Coins (Soft Currency)
- **ID**: coins
- **Name**: Coins
- **Type**: Soft Currency
- **Initial Amount**: 1000
- **Maximum Amount**: 999999

### Gems (Hard Currency)
- **ID**: gems
- **Name**: Gems
- **Type**: Hard Currency
- **Initial Amount**: 50
- **Maximum Amount**: 99999

### Energy (Consumable)
- **ID**: energy
- **Name**: Energy
- **Type**: Consumable
- **Initial Amount**: 5
- **Maximum Amount**: 30

## Step 3: Create Inventory Items (13 items)
1. Go to Economy → Inventory Items
2. Click "Create Item" for each:

### Extra Moves
- **ID**: booster_extra_moves
- **Name**: Extra Moves
- **Type**: Booster
- **Tradable**: true
- **Stackable**: true

### Color Bomb
- **ID**: booster_color_bomb
- **Name**: Color Bomb
- **Type**: Booster
- **Tradable**: true
- **Stackable**: true

### Rainbow Blast
- **ID**: booster_rainbow_blast
- **Name**: Rainbow Blast
- **Type**: Booster
- **Tradable**: true
- **Stackable**: true

### Striped Candy
- **ID**: booster_striped_candy
- **Name**: Striped Candy
- **Type**: Booster
- **Tradable**: true
- **Stackable**: true

### Starter Pack
- **ID**: pack_starter
- **Name**: Starter Pack
- **Type**: Pack
- **Tradable**: false
- **Stackable**: false

### Value Pack
- **ID**: pack_value
- **Name**: Value Pack
- **Type**: Pack
- **Tradable**: false
- **Stackable**: false

### Premium Pack
- **ID**: pack_premium
- **Name**: Premium Pack
- **Type**: Pack
- **Tradable**: false
- **Stackable**: false

### Mega Pack
- **ID**: pack_mega
- **Name**: Mega Pack
- **Type**: Pack
- **Tradable**: false
- **Stackable**: false

### Ultimate Pack
- **ID**: pack_ultimate
- **Name**: Ultimate Pack
- **Type**: Pack
- **Tradable**: false
- **Stackable**: false

### Booster Bundle
- **ID**: pack_booster_small
- **Name**: Booster Bundle
- **Type**: Pack
- **Tradable**: false
- **Stackable**: false

### Power Pack
- **ID**: pack_booster_large
- **Name**: Power Pack
- **Type**: Pack
- **Tradable**: false
- **Stackable**: false

### Welcome Back!
- **ID**: pack_comeback
- **Name**: Welcome Back!
- **Type**: Pack
- **Tradable**: false
- **Stackable**: false

### Flash Sale!
- **ID**: pack_flash_sale
- **Name**: Flash Sale!
- **Type**: Pack
- **Tradable**: false
- **Stackable**: false

## Step 4: Create Virtual Purchases (20 items)
1. Go to Economy → Virtual Purchases
2. Click "Create Purchase" for each:

### Small Coin Pack
- **ID**: coins_small
- **Name**: Small Coin Pack
- **Cost**: 20 gems
- **Reward**: 1000 coins

### Medium Coin Pack
- **ID**: coins_medium
- **Name**: Medium Coin Pack
- **Cost**: 120 gems
- **Reward**: 5000 coins

### Large Coin Pack
- **ID**: coins_large
- **Name**: Large Coin Pack
- **Cost**: 300 gems
- **Reward**: 15000 coins

### Mega Coin Pack
- **ID**: coins_mega
- **Name**: Mega Coin Pack
- **Cost**: 700 gems
- **Reward**: 40000 coins

### Ultimate Coin Pack
- **ID**: coins_ultimate
- **Name**: Ultimate Coin Pack
- **Cost**: 2000 gems
- **Reward**: 100000 coins

### Energy Boost
- **ID**: energy_small
- **Name**: Energy Boost
- **Cost**: 5 gems
- **Reward**: 5 energy

### Energy Surge
- **ID**: energy_large
- **Name**: Energy Surge
- **Cost**: 15 gems
- **Reward**: 20 energy

### Extra Moves
- **ID**: booster_extra_moves
- **Name**: Extra Moves
- **Cost**: 200 coins
- **Reward**: 3 booster_extra_moves

### Color Bomb
- **ID**: booster_color_bomb
- **Name**: Color Bomb
- **Cost**: 15 gems
- **Reward**: 1 booster_color_bomb

### Rainbow Blast
- **ID**: booster_rainbow_blast
- **Name**: Rainbow Blast
- **Cost**: 25 gems
- **Reward**: 1 booster_rainbow_blast

### Striped Candy
- **ID**: booster_striped_candy
- **Name**: Striped Candy
- **Cost**: 100 coins
- **Reward**: 1 booster_striped_candy

### Starter Pack
- **ID**: pack_starter
- **Name**: Starter Pack
- **Cost**: 20 gems
- **Reward**: 1 pack_starter

### Value Pack
- **ID**: pack_value
- **Name**: Value Pack
- **Cost**: 120 gems
- **Reward**: 1 pack_value

### Premium Pack
- **ID**: pack_premium
- **Name**: Premium Pack
- **Cost**: 300 gems
- **Reward**: 1 pack_premium

### Mega Pack
- **ID**: pack_mega
- **Name**: Mega Pack
- **Cost**: 700 gems
- **Reward**: 1 pack_mega

### Ultimate Pack
- **ID**: pack_ultimate
- **Name**: Ultimate Pack
- **Cost**: 2000 gems
- **Reward**: 1 pack_ultimate

### Booster Bundle
- **ID**: pack_booster_small
- **Name**: Booster Bundle
- **Cost**: 500 coins
- **Reward**: 1 pack_booster_small

### Power Pack
- **ID**: pack_booster_large
- **Name**: Power Pack
- **Cost**: 25 gems
- **Reward**: 1 pack_booster_large

### Welcome Back!
- **ID**: pack_comeback
- **Name**: Welcome Back!
- **Cost**: 50 gems
- **Reward**: 1 pack_comeback

### Flash Sale!
- **ID**: pack_flash_sale
- **Name**: Flash Sale!
- **Cost**: 25 gems
- **Reward**: 1 pack_flash_sale

## Step 5: Deploy Cloud Code Functions
1. Go to Cloud Code → Functions
2. Deploy these functions from cloud-code/ folder:
   - AddCurrency.js
   - SpendCurrency.js
   - AddInventoryItem.js
   - UseInventoryItem.js

## Step 6: Configure Remote Config
1. Go to Remote Config
2. Import the settings from remote-config/game_config.json

## Step 7: Test Your Setup
1. Go to Economy → Test
2. Verify all currencies, items, and purchases are working
3. Test purchases and inventory management

## ✅ Setup Complete!
Your Unity Cloud Economy Service is now fully configured!
