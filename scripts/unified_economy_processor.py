#!/usr/bin/env python3
"""
Unified Economy Processor
Consolidates all CSV processing, Unity Dashboard import, and setup functionality
"""

import csv
import json
import time
import sys
from pathlib import Path
from typing import Dict, List, Optional

class UnifiedEconomyProcessor:
    def __init__(self):
        self.repo_root = Path(__file__).parent.parent
        self.project_id = "0dd5a03e-7f23-49c4-964e-7919c48c0574"
        self.environment_id = "1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"
        self.csv_path = self.repo_root / "unity" / "Assets" / "StreamingAssets" / "economy_items.csv"
        self.config_path = self.repo_root / "unity" / "Assets" / "StreamingAssets" / "unity_services_config.json"
        
    def print_header(self, title):
        """Print formatted header"""
        print("\n" + "=" * 80)
        print(f"🚀 {title}")
        print("=" * 80)
        
    def load_csv_data(self) -> List[Dict]:
        """Load economy data from CSV file"""
        try:
            items = []
            with open(self.csv_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    items.append(row)
            print(f"✅ Loaded {len(items)} items from CSV")
            return items
        except Exception as e:
            print(f"❌ Failed to load CSV: {e}")
            return []
    
    def convert_csv_to_unity_format(self, items: List[Dict]) -> bool:
        """Convert CSV to Unity CLI format"""
        self.print_header("Converting CSV to Unity Format")
        
        # Create output directory
        economy_dir = self.repo_root / "economy"
        economy_dir.mkdir(exist_ok=True)
        
        # Create currencies CSV
        currencies = [
            {"id": "coins", "name": "Coins", "type": "soft_currency", "initial": 1000, "maximum": 999999},
            {"id": "gems", "name": "Gems", "type": "hard_currency", "initial": 50, "maximum": 99999},
            {"id": "energy", "name": "Energy", "type": "consumable", "initial": 5, "maximum": 30}
        ]
        
        with open(economy_dir / "currencies.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["id", "name", "type", "initial", "maximum"])
            writer.writeheader()
            writer.writerows(currencies)
        
        # Create inventory CSV
        inventory_items = []
        for item in items:
            if item["type"] in ["booster", "pack"]:
                inventory_items.append({
                    "id": item["id"],
                    "name": item["name"],
                    "type": item["type"],
                    "tradable": item["is_tradeable"] == "true",
                    "stackable": item["is_consumable"] == "true"
                })
        
        with open(economy_dir / "inventory.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["id", "name", "type", "tradable", "stackable"])
            writer.writeheader()
            writer.writerows(inventory_items)
        
        # Create catalog CSV
        catalog_items = []
        for item in items:
            if item["is_purchasable"] == "true":
                cost_gems = int(item["cost_gems"])
                cost_coins = int(item["cost_coins"])
                quantity = int(item["quantity"])
                
                if cost_gems > 0:
                    cost_currency = "gems"
                    cost_amount = cost_gems
                else:
                    cost_currency = "coins"
                    cost_amount = cost_coins
                
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
                    reward_currency = item["id"]
                    reward_amount = quantity
                
                catalog_items.append({
                    "id": item["id"],
                    "name": item["name"],
                    "cost_currency": cost_currency,
                    "cost_amount": cost_amount,
                    "rewards": f"{reward_currency}:{reward_amount}"
                })
        
        with open(economy_dir / "catalog.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["id", "name", "cost_currency", "cost_amount", "rewards"])
            writer.writeheader()
            writer.writerows(catalog_items)
        
        print(f"✅ Created currencies.csv ({len(currencies)} items)")
        print(f"✅ Created inventory.csv ({len(inventory_items)} items)")
        print(f"✅ Created catalog.csv ({len(catalog_items)} items)")
        return True
    
    def generate_unity_services_config(self, items: List[Dict]) -> bool:
        """Generate Unity Services configuration"""
        self.print_header("Generating Unity Services Configuration")
        
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
        
        print(f"✅ Unity Services configuration saved")
        return True
    
    def generate_dashboard_instructions(self, items: List[Dict]) -> bool:
        """Generate Unity Dashboard setup instructions"""
        self.print_header("Generating Unity Dashboard Instructions")
        
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
    
    def create_cloud_code_functions(self) -> bool:
        """Create Cloud Code functions"""
        self.print_header("Creating Cloud Code Functions")
        
        cloud_code_dir = self.repo_root / "cloud-code"
        cloud_code_dir.mkdir(exist_ok=True)
        
        functions = {
            "AddCurrency.js": """// AddCurrency Cloud Code Function
const { EconomyApi } = require("@unity-services/economy-1.0");

module.exports = async ({ params, context, logger }) => {
  try {
    const { currencyId, amount } = params;
    if (!currencyId || !amount) throw new Error("Missing required parameters");
    if (amount <= 0) throw new Error("Amount must be positive");
    
    await EconomyApi.addCurrency({ currencyId, amount });
    logger.info(`Added ${amount} ${currencyId} to player`);
    
    return { success: true, currencyId, amount };
  } catch (error) {
    logger.error(`AddCurrency failed: ${error.message}`);
    throw error;
  }
};""",
            
            "SpendCurrency.js": """// SpendCurrency Cloud Code Function
const { EconomyApi } = require("@unity-services/economy-1.0");

module.exports = async ({ params, context, logger }) => {
  try {
    const { currencyId, amount } = params;
    if (!currencyId || !amount) throw new Error("Missing required parameters");
    if (amount <= 0) throw new Error("Amount must be positive");
    
    const balance = await EconomyApi.getCurrencyBalance({ currencyId });
    if (balance.amount < amount) throw new Error("Insufficient funds");
    
    await EconomyApi.spendCurrency({ currencyId, amount });
    logger.info(`Spent ${amount} ${currencyId} from player`);
    
    return { success: true, currencyId, amount, newBalance: balance.amount - amount };
  } catch (error) {
    logger.error(`SpendCurrency failed: ${error.message}`);
    throw error;
  }
};""",
            
            "AddInventoryItem.js": """// AddInventoryItem Cloud Code Function
const { EconomyApi } = require("@unity-services/economy-1.0");

module.exports = async ({ params, context, logger }) => {
  try {
    const { itemId, quantity = 1 } = params;
    if (!itemId) throw new Error("Missing required parameter: itemId");
    if (quantity <= 0) throw new Error("Quantity must be positive");
    
    await EconomyApi.addInventoryItem({ itemId, quantity });
    logger.info(`Added ${quantity} ${itemId} to player inventory`);
    
    return { success: true, itemId, quantity };
  } catch (error) {
    logger.error(`AddInventoryItem failed: ${error.message}`);
    throw error;
  }
};""",
            
            "UseInventoryItem.js": """// UseInventoryItem Cloud Code Function
const { EconomyApi } = require("@unity-services/economy-1.0");

module.exports = async ({ params, context, logger }) => {
  try {
    const { itemId, quantity = 1 } = params;
    if (!itemId) throw new Error("Missing required parameter: itemId");
    if (quantity <= 0) throw new Error("Quantity must be positive");
    
    const inventory = await EconomyApi.getInventoryItems();
    const item = inventory.find(i => i.id === itemId);
    
    if (!item || item.quantity < quantity) throw new Error("Insufficient inventory items");
    
    await EconomyApi.useInventoryItem({ itemId, quantity });
    logger.info(`Used ${quantity} ${itemId} from player inventory`);
    
    return { success: true, itemId, quantity, remainingQuantity: item.quantity - quantity };
  } catch (error) {
    logger.error(`UseInventoryItem failed: ${error.message}`);
    throw error;
  }
};"""
        }
        
        for filename, content in functions.items():
            with open(cloud_code_dir / filename, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"✅ Created {filename}")
        
        return True
    
    def run_complete_processing(self) -> bool:
        """Run the complete economy processing pipeline"""
        self.print_header("Unified Economy Processing")
        
        # Load CSV data
        items = self.load_csv_data()
        if not items:
            return False
        
        print(f"\n📊 Processing {len(items)} items:")
        print(f"   - Currency items: {len([i for i in items if i['type'] == 'currency'])}")
        print(f"   - Booster items: {len([i for i in items if i['type'] == 'booster'])}")
        print(f"   - Pack items: {len([i for i in items if i['type'] == 'pack'])}")
        print(f"   - Purchasable items: {len([i for i in items if i['is_purchasable'] == 'true'])}")
        
        # Run all processing steps
        success = True
        success &= self.convert_csv_to_unity_format(items)
        success &= self.generate_unity_services_config(items)
        success &= self.generate_dashboard_instructions(items)
        success &= self.create_cloud_code_functions()
        
        if success:
            print(f"\n🎉 Unified processing completed successfully!")
            print(f"📄 Check UNITY_DASHBOARD_SETUP_INSTRUCTIONS.md for next steps")
        else:
            print(f"\n⚠️ Processing completed with some issues")
        
        return success

def main():
    """Main function"""
    processor = UnifiedEconomyProcessor()
    success = processor.run_complete_processing()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
