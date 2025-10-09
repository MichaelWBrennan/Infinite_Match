#!/usr/bin/env python3
"""
Unified Economy CSV Processor
Consolidates CSV conversion, Unity Services config generation, and dashboard instructions
Replaces: convert_economy_csv.py, csv_to_dashboard_importer.py, setup_unity_economy.py
"""

import csv
import json
import os
import sys
from pathlib import Path


class EconomyCSVConverter:
    def __init__(self):
        self.repo_root = Path(__file__).parent.parent.parent
        self.source_csv = (
            self.repo_root
            / "unity"
            / "Assets"
            / "StreamingAssets"
            / "economy_items.csv"
        )
        self.output_dir = self.repo_root / "economy"
        self.config_path = (
            self.repo_root
            / "unity"
            / "Assets"
            / "StreamingAssets"
            / "unity_services_config.json"
        )
        self.project_id = "0dd5a03e-7f23-49c4-964e-7919c48c0574"
        self.environment_id = "1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"

    def load_economy_data(self):
        """Load economy data from CSV"""
        if not self.source_csv.exists():
            print(f"ERROR: Source CSV not found at {self.source_csv}")
            return None

        items = []
        with open(self.source_csv, "r", encoding="utf-8") as file:
            reader = csv.DictReader(file)
            for row in reader:
                items.append(row)

        print(f"Loaded {len(items)} items from {self.source_csv}")
        return items

    def create_currencies_csv(self, items):
        """Create currencies.csv for Unity CLI"""
        currencies = []

        # Extract unique currencies from the data
        currency_types = set()
        for item in items:
            if item["type"] == "currency":
                currency_types.add(item["id"])

        # Define base currencies (these should exist in Unity Dashboard)
        base_currencies = [
            {
                "id": "coins",
                "name": "Coins",
                "type": "soft_currency",
                "initial": 1000,
                "maximum": 999999,
            },
            {
                "id": "gems",
                "name": "Gems",
                "type": "hard_currency",
                "initial": 50,
                "maximum": 99999,
            },
            {
                "id": "energy",
                "name": "Energy",
                "type": "consumable",
                "initial": 5,
                "maximum": 30,
            },
        ]

        currencies.extend(base_currencies)

        # Write currencies CSV
        currencies_file = self.output_dir / "currencies.csv"
        with open(currencies_file, "w", newline="", encoding="utf-8") as file:
            fieldnames = ["id", "name", "type", "initial", "maximum"]
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(currencies)

        print(f"Created currencies.csv with {len(currencies)} currencies")
        return currencies_file

    def create_inventory_csv(self, items):
        """Create inventory.csv for Unity CLI"""
        inventory_items = []

        for item in items:
            if item["type"] in ["booster", "pack"]:
                inventory_items.append(
                    {
                        "id": item["id"],
                        "name": item["name"],
                        "type": item["type"],
                        "tradable": item["is_tradeable"] == "true",
                        "stackable": item["is_consumable"] == "true",
                    }
                )

        # Write inventory CSV
        inventory_file = self.output_dir / "inventory.csv"
        with open(inventory_file, "w", newline="", encoding="utf-8") as file:
            fieldnames = ["id", "name", "type", "tradable", "stackable"]
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(inventory_items)

        print(f"Created inventory.csv with {len(inventory_items)} items")
        return inventory_file

    def create_catalog_csv(self, items):
        """Create catalog.csv for Unity CLI"""
        catalog_items = []

        for item in items:
            if item["is_purchasable"] == "true":
                cost_gems = int(item["cost_gems"])
                cost_coins = int(item["cost_coins"])
                quantity = int(item["quantity"])

                # Determine cost currency and amount
                if cost_gems > 0:
                    cost_currency = "gems"
                    cost_amount = cost_gems
                else:
                    cost_currency = "coins"
                    cost_amount = cost_coins

                # Determine reward currency and amount
                if item["type"] == "currency":
                    if "coins" in item["id"]:
                        reward_currency = "coins"
                        reward_amount = quantity
                    elif "energy" in item["id"]:
                        reward_currency = "energy"
                        reward_amount = quantity
                    else:
                        reward_currency = "gems"
                        reward_amount = quantity
                else:
                    # For boosters and packs, reward the item itself
                    reward_currency = item["id"]
                    reward_amount = quantity

                catalog_items.append(
                    {
                        "id": item["id"],
                        "name": item["name"],
                        "cost_currency": cost_currency,
                        "cost_amount": cost_amount,
                        "rewards": f"{reward_currency}:{reward_amount}",
                    }
                )

        # Write catalog CSV
        catalog_file = self.output_dir / "catalog.csv"
        with open(catalog_file, "w", newline="", encoding="utf-8") as file:
            fieldnames = ["id", "name", "cost_currency", "cost_amount", "rewards"]
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(catalog_items)

        print(f"Created catalog.csv with {len(catalog_items)} items")
        return catalog_file

    def create_remote_config(self):
        """Create remote config JSON"""
        config = {
            "game_settings": {
                "max_level": 100,
                "energy_refill_time": 300,
                "daily_reward_coins": 100,
                "daily_reward_gems": 5,
                "max_energy": 30,
                "energy_refill_cost_gems": 5,
            },
            "economy_settings": {
                "coin_multiplier": 1.0,
                "gem_multiplier": 1.0,
                "sale_discount": 0.5,
                "daily_bonus_multiplier": 1.2,
                "streak_bonus_multiplier": 1.5,
            },
            "feature_flags": {
                "new_levels_enabled": True,
                "daily_challenges_enabled": True,
                "social_features_enabled": False,
                "ads_enabled": True,
                "iap_enabled": True,
                "economy_enabled": True,
            },
            "ui_settings": {
                "show_currency_balance": True,
                "show_energy_timer": True,
                "show_daily_rewards": True,
                "show_shop_notifications": True,
            },
            "analytics_events": {
                "economy_purchase": True,
                "economy_balance_change": True,
                "economy_inventory_change": True,
                "level_completed": True,
                "streak_achieved": True,
                "currency_awarded": True,
                "booster_used": True,
                "pack_opened": True,
            },
        }

        # Write remote config
        config_file = self.repo_root / "remote-config" / "game_config.json"
        config_file.parent.mkdir(exist_ok=True)

        with open(config_file, "w", encoding="utf-8") as file:
            json.dump(config, file, indent=2)

        print(f"Created remote config: {config_file}")
        return config_file

    def create_cloud_code_functions(self):
        """Create Cloud Code functions"""
        cloud_code_dir = self.repo_root / "cloud-code"
        cloud_code_dir.mkdir(exist_ok=True)

        # AddCurrency function
        add_currency_js = """// AddCurrency Cloud Code Function
const { EconomyApi } = require("@unity-services/economy-1.0");

module.exports = async ({ params, context, logger }) => {
  try {
    const { currencyId, amount } = params;

    if (!currencyId || !amount) {
      throw new Error("Missing required parameters: currencyId, amount");
    }

    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }

    // Add currency to player
    await EconomyApi.addCurrency({
      currencyId: currencyId,
      amount: amount
    });

    logger.info(`Added ${amount} ${currencyId} to player`);

    return {
      success: true,
      currencyId: currencyId,
      amount: amount
    };
  } catch (error) {
    logger.error(`AddCurrency failed: ${error.message}`);
    throw error;
  }
};"""

        # SpendCurrency function
        spend_currency_js = """// SpendCurrency Cloud Code Function
const { EconomyApi } = require("@unity-services/economy-1.0");

module.exports = async ({ params, context, logger }) => {
  try {
    const { currencyId, amount } = params;

    if (!currencyId || !amount) {
      throw new Error("Missing required parameters: currencyId, amount");
    }

    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }

    // Check if player has enough currency
    const balance = await EconomyApi.getCurrencyBalance({
      currencyId: currencyId
    });

    if (balance.amount < amount) {
      throw new Error("Insufficient funds");
    }

    // Spend currency
    await EconomyApi.spendCurrency({
      currencyId: currencyId,
      amount: amount
    });

    logger.info(`Spent ${amount} ${currencyId} from player`);

    return {
      success: true,
      currencyId: currencyId,
      amount: amount,
      newBalance: balance.amount - amount
    };
  } catch (error) {
    logger.error(`SpendCurrency failed: ${error.message}`);
    throw error;
  }
};"""

        # AddInventoryItem function
        add_inventory_js = """// AddInventoryItem Cloud Code Function
const { EconomyApi } = require("@unity-services/economy-1.0");

module.exports = async ({ params, context, logger }) => {
  try {
    const { itemId, quantity = 1 } = params;

    if (!itemId) {
      throw new Error("Missing required parameter: itemId");
    }

    if (quantity <= 0) {
      throw new Error("Quantity must be positive");
    }

    // Add inventory item to player
    await EconomyApi.addInventoryItem({
      itemId: itemId,
      quantity: quantity
    });

    logger.info(`Added ${quantity} ${itemId} to player inventory`);

    return {
      success: true,
      itemId: itemId,
      quantity: quantity
    };
  } catch (error) {
    logger.error(`AddInventoryItem failed: ${error.message}`);
    throw error;
  }
};"""

        # UseInventoryItem function
        use_inventory_js = """// UseInventoryItem Cloud Code Function
const { EconomyApi } = require("@unity-services/economy-1.0");

module.exports = async ({ params, context, logger }) => {
  try {
    const { itemId, quantity = 1 } = params;

    if (!itemId) {
      throw new Error("Missing required parameter: itemId");
    }

    if (quantity <= 0) {
      throw new Error("Quantity must be positive");
    }

    // Check if player has the item
    const inventory = await EconomyApi.getInventoryItems();
    const item = inventory.find(i => i.id === itemId);

    if (!item || item.quantity < quantity) {
      throw new Error("Insufficient inventory items");
    }

    // Use inventory item
    await EconomyApi.useInventoryItem({
      itemId: itemId,
      quantity: quantity
    });

    logger.info(`Used ${quantity} ${itemId} from player inventory`);

    return {
      success: true,
      itemId: itemId,
      quantity: quantity,
      remainingQuantity: item.quantity - quantity
    };
  } catch (error) {
    logger.error(`UseInventoryItem failed: ${error.message}`);
    throw error;
  }
};"""

        # Write Cloud Code functions
        functions = [
            ("AddCurrency.js", add_currency_js),
            ("SpendCurrency.js", spend_currency_js),
            ("AddInventoryItem.js", add_inventory_js),
            ("UseInventoryItem.js", use_inventory_js),
        ]

        for filename, content in functions:
            file_path = cloud_code_dir / filename
            with open(file_path, "w", encoding="utf-8") as file:
                file.write(content)
            print(f"Created Cloud Code function: {filename}")

        return cloud_code_dir

    def create_conversion_report(
        self, items, currencies_file, inventory_file, catalog_file
    ):
        """Create conversion report"""
        report = f"""# Economy CSV Conversion Report

## Source Data
- **Source File**: {self.source_csv}
- **Total Items**: {len(items)}
- **Currency Items**: {len([i for i in items if i['type'] == 'currency'])}
- **Booster Items**: {len([i for i in items if i['type'] == 'booster'])}
- **Pack Items**: {len([i for i in items if i['type'] == 'pack'])}

## Generated Files
- **Currencies**: {currencies_file} (3 base currencies)
- **Inventory**: {inventory_file} ({len([i for i in items if i['type'] in ['booster', 'pack']])} items)
- **Catalog**: {catalog_file} ({len([i for i in items if i['is_purchasable'] == 'true'])} purchasable items)

## Currency Breakdown
- **Coins**: {len([i for i in items if 'coins' in i['id']])} coin packs
- **Energy**: {len([i for i in items if 'energy' in i['id']])} energy packs
- **Boosters**: {len([i for i in items if i['type'] == 'booster'])} booster types
- **Packs**: {len([i for i in items if i['type'] == 'pack'])} pack types

## Cost Analysis
- **Gem Costs**: {len([i for i in items if int(i['cost_gems']) > 0])} items cost gems
- **Coin Costs**: {len([i for i in items if int(i['cost_coins']) > 0])} items cost coins
- **Free Items**: {len([i for i in items if int(i['cost_gems']) == 0 and int(i['cost_coins']) == 0])} free items

## Rarity Distribution
- **Common**: {len([i for i in items if i['rarity'] == 'common'])} items
- **Uncommon**: {len([i for i in items if i['rarity'] == 'uncommon'])} items
- **Rare**: {len([i for i in items if i['rarity'] == 'rare'])} items
- **Epic**: {len([i for i in items if i['rarity'] == 'epic'])} items
- **Legendary**: {len([i for i in items if i['rarity'] == 'legendary'])} items

## Conversion Complete! ✅
All economy data has been successfully converted to Unity CLI format.
"""

        report_file = self.repo_root / "economy_conversion_report.md"
        with open(report_file, "w", encoding="utf-8") as file:
            file.write(report)

        print(f"Created conversion report: {report_file}")
        return report_file

    def generate_unity_services_config(self, items):
        """Generate Unity Services configuration (from setup_unity_economy.py)"""
        print("🔧 Generating Unity Services configuration...")
        
        config = {
            "projectId": self.project_id,
            "environmentId": self.environment_id,
            "licenseType": "personal",
            "cloudServicesAvailable": True,
            "economy": {
                "currencies": [
                    {"id": "coins", "name": "Coins", "type": "soft_currency", "initial": 1000, "maximum": 999999},
                    {"id": "gems", "name": "Gems", "type": "hard_currency", "initial": 50, "maximum": 99999},
                    {"id": "energy", "name": "Energy", "type": "consumable", "initial": 5, "maximum": 30}
                ],
                "inventory": [
                    {
                        "id": item["id"],
                        "name": item["name"],
                        "type": item["type"],
                        "tradable": item["is_tradeable"] == "true",
                        "stackable": item["is_consumable"] == "true"
                    }
                    for item in items if item["type"] in ["booster", "pack"]
                ],
                "catalog": [
                    {
                        "id": item["id"],
                        "name": item["name"],
                        "cost_currency": "gems" if int(item["cost_gems"]) > 0 else "coins",
                        "cost_amount": int(item["cost_gems"]) if int(item["cost_gems"]) > 0 else int(item["cost_coins"]),
                        "rewards": f"{item['id']}:{item['quantity']}" if item["type"] in ["booster", "pack"] else f"coins:{item['quantity']}"
                    }
                    for item in items if item["is_purchasable"] == "true"
                ]
            }
        }
        
        with open(self.config_path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)
        
        print(f"✅ Unity Services configuration saved to: {self.config_path}")
        return True

    def generate_dashboard_instructions(self, items):
        """Generate Unity Dashboard setup instructions (from csv_to_dashboard_importer.py)"""
        print("📋 Generating Unity Dashboard instructions...")
        
        instructions = f"""# Unity Dashboard Setup Instructions

## Project Information
- **Project ID**: {self.project_id}
- **Environment ID**: {self.environment_id}
- **Total Items**: {len(items)}

## Step 1: Access Unity Dashboard
1. Go to: https://dashboard.unity3d.com
2. Navigate to your project
3. Go to Economy section

## Step 2: Create Currencies (3 items)
1. Go to Economy → Currencies
2. Create: coins, gems, energy

## Step 3: Create Inventory Items ({len([i for i in items if i['type'] in ['booster', 'pack']])} items)
1. Go to Economy → Inventory Items
2. Create all boosters and packs from your CSV

## Step 4: Create Virtual Purchases ({len([i for i in items if i['is_purchasable'] == 'true'])} items)
1. Go to Economy → Virtual Purchases
2. Create all purchasable items from your CSV

## Step 5: Deploy Cloud Code Functions
1. Go to Cloud Code → Functions
2. Deploy functions from cloud-code/ folder

## ✅ Setup Complete!
Your Unity Cloud Economy Service is now fully configured!
"""
        
        instructions_file = self.repo_root / "UNITY_DASHBOARD_SETUP_INSTRUCTIONS.md"
        with open(instructions_file, "w", encoding="utf-8") as f:
            f.write(instructions)
        
        print(f"✅ Instructions saved to: {instructions_file}")
        return True

    def run_conversion(self):
        """Run the complete conversion process with all functionality"""
        print("=" * 80)
        print("🚀 Unified Economy CSV Processor")
        print("=" * 80)

        # Load source data
        items = self.load_economy_data()
        if not items:
            return False

        print(f"\n📊 Processing {len(items)} items:")
        print(f"   - Currency items: {len([i for i in items if i['type'] == 'currency'])}")
        print(f"   - Booster items: {len([i for i in items if i['type'] == 'booster'])}")
        print(f"   - Pack items: {len([i for i in items if i['type'] == 'pack'])}")
        print(f"   - Purchasable items: {len([i for i in items if i['is_purchasable'] == 'true'])}")

        # Create output directory
        self.output_dir.mkdir(exist_ok=True)

        # Convert to Unity CLI format
        currencies_file = self.create_currencies_csv(items)
        inventory_file = self.create_inventory_csv(items)
        catalog_file = self.create_catalog_csv(items)

        # Create additional files
        config_file = self.create_remote_config()
        cloud_code_dir = self.create_cloud_code_functions()

        # Generate Unity Services config and dashboard instructions
        self.generate_unity_services_config(items)
        self.generate_dashboard_instructions(items)

        # Generate report
        report_file = self.create_conversion_report(
            items, currencies_file, inventory_file, catalog_file
        )

        print("\n🎉 Unified processing completed successfully!")
        print(f"📁 Output directory: {self.output_dir}")
        print(f"📄 Currencies: {currencies_file}")
        print(f"📦 Inventory: {inventory_file}")
        print(f"🛒 Catalog: {catalog_file}")
        print(f"⚙️  Remote Config: {config_file}")
        print(f"☁️  Cloud Code: {cloud_code_dir}")
        print(f"🔧 Unity Services Config: {self.config_path}")
        print(f"📋 Dashboard Instructions: UNITY_DASHBOARD_SETUP_INSTRUCTIONS.md")
        print(f"📊 Report: {report_file}")

        return True


def main():
    converter = EconomyCSVConverter()
    success = converter.run_conversion()

    if success:
        print("\n🎉 Economy CSV conversion completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Economy CSV conversion failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()
