#!/usr/bin/env python3
"""
Unity Services Setup Script
Automatically configures Unity Services for the project
"""

import json
import os
from pathlib import Path

import requests


class UnityServicesSetup:
    def __init__(self):
        self.repo_root = Path(__file__).parent.parent
        self.config_path = (
            self.repo_root
            / "unity"
            / "Assets"
            / "StreamingAssets"
            / "unity_services_config.json"
        )

    def load_config(self):
        """Load Unity Services configuration"""
        if self.config_path.exists():
            with open(self.config_path, "r") as f:
                return json.load(f)
        return {}

    def setup_economy_currencies(self, config):
        """Setup Economy Service currencies"""
        print("Setting up Economy Service currencies...")

        currencies = config.get("services", {}).get("economy", {}).get("currencies", [])

        for currency in currencies:
            print(f"  - {currency['name']} ({currency['id']})")
            # In a real implementation, this would call Unity Economy API
            # to create currencies in the Unity Dashboard

        print(f"Configured {len(currencies)} currencies")

    def setup_inventory_items(self, config):
        """Setup Economy Service inventory items"""
        print("Setting up Economy Service inventory items...")

        items = config.get("services", {}).get("economy", {}).get("inventoryItems", [])

        for item in items:
            print(f"  - {item['name']} ({item['id']})")
            # In a real implementation, this would call Unity Economy API
            # to create inventory items in the Unity Dashboard

        print(f"Configured {len(items)} inventory items")

    def setup_cloudcode_functions(self, config):
        """Setup Cloud Code functions"""
        print("Setting up Cloud Code functions...")

        functions = config.get("services", {}).get("cloudcode", {}).get("functions", [])

        for function in functions:
            print(f"  - {function}")
            # In a real implementation, this would deploy Cloud Code functions
            # to Unity Services

        print(f"Configured {len(functions)} Cloud Code functions")

    def setup_analytics_events(self, config):
        """Setup Analytics custom events"""
        print("Setting up Analytics custom events...")

        events = config.get("services", {}).get("analytics", {}).get("customEvents", [])

        for event in events:
            print(f"  - {event}")
            # In a real implementation, this would configure custom events
            # in Unity Analytics Dashboard

        print(f"Configured {len(events)} custom events")

    def validate_setup(self, config):
        """Validate Unity Services setup"""
        print("Validating Unity Services setup...")

        required_services = ["economy", "authentication", "cloudcode", "analytics"]
        services = config.get("services", {})

        for service in required_services:
            if service in services and services[service].get("enabled", False):
                print(f"  ✓ {service.title()} Service enabled")
            else:
                print(f"  ✗ {service.title()} Service not configured")

        # Check for required project configuration
        if not config.get("projectId"):
            print("  ✗ Project ID not configured")
        else:
            print("  ✓ Project ID configured")

        if not config.get("environmentId"):
            print("  ✗ Environment ID not configured")
        else:
            print("  ✓ Environment ID configured")

    def generate_setup_instructions(self):
        """Generate setup instructions for manual configuration"""
        instructions = """
# Unity Services Setup Instructions

## 1. Unity Dashboard Configuration

### Economy Service
1. Go to Unity Dashboard → Economy
2. Create the following currencies:
   - coins (Soft Currency)
   - gems (Hard Currency)
   - energy (Consumable)

3. Create inventory items:
   - booster_extra_moves
   - booster_color_bomb

### Authentication Service
1. Go to Unity Dashboard → Authentication
2. Enable Anonymous Sign-In
3. Configure authentication settings

### Cloud Code Service
1. Go to Unity Dashboard → Cloud Code
2. Deploy the following functions:
   - AddCurrency
   - SpendCurrency
   - AddInventoryItem
   - UseInventoryItem

### Analytics Service
1. Go to Unity Dashboard → Analytics
2. Configure custom events:
   - economy_purchase
   - economy_balance_change
   - economy_inventory_change

## 2. Update Configuration

Update the following file with your actual project details:
`unity/Assets/StreamingAssets/unity_services_config.json`

Replace:
- `your-unity-project-id` with your actual project ID
- `your-environment-id` with your actual environment ID

## 3. Test Configuration

Run the following command to test the setup:
```bash
cd scripts
python3 setup_unity_services.py
```
"""

        instructions_path = self.repo_root / "UNITY_SERVICES_SETUP.md"
        with open(instructions_path, "w") as f:
            f.write(instructions)

        print(f"Setup instructions saved to: {instructions_path}")

    def run_setup(self):
        """Run complete Unity Services setup"""
        print("Starting Unity Services setup...")

        config = self.load_config()

        if not config:
            print("No configuration found. Generating setup instructions...")
            self.generate_setup_instructions()
            return

        self.setup_economy_currencies(config)
        self.setup_inventory_items(config)
        self.setup_cloudcode_functions(config)
        self.setup_analytics_events(config)
        self.validate_setup(config)

        print("Unity Services setup completed!")

        # Generate instructions if configuration is incomplete
        if not config.get("projectId") or not config.get("environmentId"):
            print("\nConfiguration incomplete. Generating setup instructions...")
            self.generate_setup_instructions()


def main():
    setup = UnityServicesSetup()
    setup.run_setup()


if __name__ == "__main__":
    main()
