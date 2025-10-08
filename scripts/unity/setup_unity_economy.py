#!/usr/bin/env python3
"""
Unity Economy Service Automated Setup Script
Automatically configures Unity Economy Service from CSV data
"""

import csv
import json
import os
import sys
from pathlib import Path


class UnityEconomySetup:
    def __init__(self):
        self.repo_root = Path(__file__).parent.parent
        self.csv_path = (
            self.repo_root
            / "unity"
            / "Assets"
            / "StreamingAssets"
            / "economy_items.csv"
        )
        self.config_path = (
            self.repo_root
            / "unity"
            / "Assets"
            / "StreamingAssets"
            / "unity_services_config.json"
        )

    def load_csv_data(self):
        """Load economy data from CSV file"""
        if not self.csv_path.exists():
            print(f"ERROR: CSV file not found at {self.csv_path}")
            return None

        items = []
        with open(self.csv_path, "r", encoding="utf-8") as file:
            reader = csv.DictReader(file)
            for row in reader:
                items.append(row)

        print(f"Loaded {len(items)} items from CSV")
        return items

    def generate_currencies_config(self):
        """Generate currencies configuration"""
        return [
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

    def generate_inventory_items_config(self, items):
        """Generate inventory items configuration from CSV"""
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

        return inventory_items

    def generate_virtual_purchases_config(self, items):
        """Generate virtual purchases configuration from CSV"""
        virtual_purchases = []

        for item in items:
            if item["is_purchasable"] == "true":
                cost_gems = int(item["cost_gems"])
                cost_coins = int(item["cost_coins"])

                virtual_purchases.append(
                    {
                        "id": item["id"],
                        "name": item["name"],
                        "cost": {
                            "currency": "gems" if cost_gems > 0 else "coins",
                            "amount": cost_gems if cost_gems > 0 else cost_coins,
                        },
                        "rewards": [
                            {
                                "currency": (
                                    "coins" if item["type"] == "currency" else "gems"
                                ),
                                "amount": int(item["quantity"]),
                            }
                        ],
                    }
                )

        return virtual_purchases

    def generate_cloudcode_functions_config(self):
        """Generate Cloud Code functions configuration"""
        return ["AddCurrency", "SpendCurrency", "AddInventoryItem", "UseInventoryItem"]

    def generate_analytics_events_config(self):
        """Generate Analytics events configuration"""
        return [
            "economy_purchase",
            "economy_balance_change",
            "economy_inventory_change",
            "level_completed",
            "streak_achieved",
            "currency_awarded",
        ]

    def generate_unity_services_config(self):
        """Generate complete Unity Services configuration"""
        items = self.load_csv_data()
        if not items:
            return None

        config = {
            "projectId": "your-unity-project-id",
            "environmentId": "your-environment-id",
            "services": {
                "economy": {
                    "enabled": True,
                    "currencies": self.generate_currencies_config(),
                    "inventoryItems": self.generate_inventory_items_config(items),
                    "virtualPurchases": self.generate_virtual_purchases_config(items),
                },
                "authentication": {"enabled": True, "anonymousSignIn": True},
                "cloudcode": {
                    "enabled": True,
                    "functions": self.generate_cloudcode_functions_config(),
                },
                "analytics": {
                    "enabled": True,
                    "customEvents": self.generate_analytics_events_config(),
                },
            },
            "generatedAt": "2024-01-01T00:00:00Z",
            "version": "1.0.0",
        }

        return config

    def save_config(self, config):
        """Save configuration to file"""
        config_json = json.dumps(config, indent=2)

        with open(self.config_path, "w", encoding="utf-8") as file:
            file.write(config_json)

        print(f"Configuration saved to: {self.config_path}")

    def generate_setup_instructions(self, config):
        """Generate setup instructions for Unity Dashboard"""
        instructions = f"""
# Unity Economy Service Setup Instructions

## Overview
This configuration was automatically generated from your CSV data.
Total items: {len(config['services']['economy']['inventoryItems']) + len(config['services']['economy']['virtualPurchases'])}

## 1. Unity Dashboard Configuration

### Project Setup
1. Go to Unity Dashboard (https://dashboard.unity3d.com)
2. Select your project or create a new one
3. Note your Project ID and Environment ID
4. Update the configuration file with your actual IDs

### Economy Service Setup
1. Go to Unity Dashboard → Economy
2. Create the following currencies:
"""

        for currency in config["services"]["economy"]["currencies"]:
            instructions += f"   - {
                currency['name']} ({
                currency['id']}): {
                currency['type']}\n"

        instructions += f"""
3. Create {len(config['services']['economy']['inventoryItems'])} inventory items:
"""

        for item in config["services"]["economy"]["inventoryItems"]:
            instructions += f"   - {item['name']} ({item['id']}): {item['type']}\n"

        instructions += f"""
4. Create {len(config['services']['economy']['virtualPurchases'])} virtual purchases:
"""

        for purchase in config["services"]["economy"]["virtualPurchases"]:
            instructions += f"   - {
                purchase['name']} ({
                purchase['id']}): {
                purchase['cost']['amount']} {
                purchase['cost']['currency']}\n"

        instructions += """
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
"""

        instructions_path = self.repo_root / "UNITY_ECONOMY_SETUP_INSTRUCTIONS.md"
        with open(instructions_path, "w", encoding="utf-8") as file:
            file.write(instructions)

        print(f"Setup instructions saved to: {instructions_path}")

    def run_setup(self):
        """Run complete Unity Economy setup"""
        print("Starting Unity Economy Service setup...")

        # Generate configuration
        config = self.generate_unity_services_config()
        if not config:
            print("ERROR: Failed to generate configuration")
            return False

        # Save configuration
        self.save_config(config)

        # Generate setup instructions
        self.generate_setup_instructions(config)

        print("Unity Economy Service setup completed successfully!")
        print(f"Configuration saved to: {self.config_path}")
        print("Next steps:")
        print("1. Update Project ID and Environment ID in configuration")
        print("2. Follow the setup instructions in UNITY_ECONOMY_SETUP_INSTRUCTIONS.md")
        print("3. Test the integration in Unity Editor")

        return True


def main():
    setup = UnityEconomySetup()
    success = setup.run_setup()

    if success:
        print("\n✅ Unity Economy Service setup completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Unity Economy Service setup failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()
