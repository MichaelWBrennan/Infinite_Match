#!/usr/bin/env python3
"""
Unity Dashboard Setup Assistant
Consolidates Unity setup functionality from multiple scripts
Replaces: unity_dashboard_setup_assistant.py, one_click_unity_setup.py
"""

import csv
import json
import os
import subprocess
import sys
import time
import webbrowser
from pathlib import Path


class UnityDashboardSetupAssistant:
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
        self.project_id = "0dd5a03e-7f23-49c4-964e-7919c48c0574"
        self.environment_id = "1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"

    def load_config(self):
        """Load Unity Services configuration"""
        with open(self.config_path, "r") as f:
            return json.load(f)

    def load_csv_data(self):
        """Load economy data from CSV"""
        items = []
        with open(self.csv_path, "r", encoding="utf-8") as file:
            reader = csv.DictReader(file)
            for row in reader:
                items.append(row)
        return items

    def print_header(self, title):
        """Print a formatted header"""
        print("\n" + "=" * 80)
        print(f"🎮 {title}")
        print("=" * 80)

    def print_step(self, step_num, title, description=""):
        """Print a formatted step"""
        print(f"\n📋 STEP {step_num}: {title}")
        if description:
            print(f"   {description}")
        print("-" * 60)

    def wait_for_user(self, message="Press Enter when ready to continue..."):
        """Wait for user input"""
        input(f"\n⏳ {message}")

    def open_dashboard_section(self, section, url_suffix=""):
        """Open Unity Dashboard section"""
        base_url = f"https: // dashboard.unity3d.com / organizations / {
            self.project_id} / projects / {
            self.project_id} / environments / {
            self.environment_id}"
        full_url = f"{base_url}/{url_suffix}"

        print(f"🌐 Opening Unity Dashboard: {section}")
        print(f"   URL: {full_url}")

        try:
            webbrowser.open(full_url)
            print("   ✅ Dashboard opened in your browser")
        except BaseException:
            print("   ⚠️  Could not open browser automatically")
            print(f"   Please manually navigate to: {full_url}")

    def setup_economy_currencies(self, config):
        """Guide through currency setup"""
        self.print_step(
            1, "Create Currencies", "Setting up 3 currencies in Unity Dashboard"
        )

        currencies = config["services"]["economy"]["currencies"]

        for i, currency in enumerate(currencies, 1):
            print(f"\n💰 Currency {i}/3: {currency['name']} ({currency['id']})")
            print(f"   Type: {currency['type']}")
            print(f"   Initial: {currency['initial']:,}")
            print(f"   Maximum: {currency['maximum']:,}")
            print(f"   Steps:")
            print(f"   1. Click 'Create Currency'")
            print(f"   2. ID: {currency['id']}")
            print(f"   3. Name: {currency['name']}")
            print(f"   4. Type: {currency['type']}")
            print(f"   5. Initial Amount: {currency['initial']}")
            print(f"   6. Maximum Amount: {currency['maximum']}")
            print(f"   7. Click 'Create'")

        self.open_dashboard_section("Economy", "economy/currencies")
        self.wait_for_user("Create all 3 currencies, then press Enter...")

    def setup_economy_inventory(self, config):
        """Guide through inventory items setup"""
        self.print_step(2, "Create Inventory Items", "Setting up 13 inventory items")

        inventory_items = config["services"]["economy"]["inventoryItems"]

        print(f"\n📦 Creating {len(inventory_items)} inventory items:")

        for i, item in enumerate(inventory_items, 1):
            print(
                f"\n📦 Item {i}/{len(inventory_items)}: {item['name']} ({item['id']})"
            )
            print(f"   Type: {item['type']}")
            print(f"   Tradable: {item['tradable']}")
            print(f"   Stackable: {item['stackable']}")
            print(f"   Steps:")
            print(f"   1. Click 'Create Inventory Item'")
            print(f"   2. ID: {item['id']}")
            print(f"   3. Name: {item['name']}")
            print(f"   4. Type: {item['type']}")
            print(f"   5. Tradable: {item['tradable']}")
            print(f"   6. Stackable: {item['stackable']}")
            print(f"   7. Click 'Create'")

        self.open_dashboard_section("Economy", "economy/inventory-items")
        self.wait_for_user("Create all 13 inventory items, then press Enter...")

    def setup_economy_purchases(self, config):
        """Guide through virtual purchases setup"""
        self.print_step(
            3, "Create Virtual Purchases", "Setting up 20 virtual purchases"
        )

        virtual_purchases = config["services"]["economy"]["virtualPurchases"]

        print(f"\n💳 Creating {len(virtual_purchases)} virtual purchases:")

        for i, purchase in enumerate(virtual_purchases, 1):
            print(
                f"\n💳 Purchase {i}/{len(virtual_purchases)}: {purchase['name']} ({purchase['id']})"
            )
            print(
                f"   Cost: {
                    purchase['cost']['amount']} {
                    purchase['cost']['currency']}"
            )
            print(
                f"   Rewards: {
                    purchase['rewards'][0]['amount']} {
                    purchase['rewards'][0]['currency']}"
            )
            print(f"   Steps:")
            print(f"   1. Click 'Create Virtual Purchase'")
            print(f"   2. ID: {purchase['id']}")
            print(f"   3. Name: {purchase['name']}")
            print(f"   4. Cost Currency: {purchase['cost']['currency']}")
            print(f"   5. Cost Amount: {purchase['cost']['amount']}")
            print(f"   6. Reward Currency: {purchase['rewards'][0]['currency']}")
            print(f"   7. Reward Amount: {purchase['rewards'][0]['amount']}")
            print(f"   8. Click 'Create'")

        self.open_dashboard_section("Economy", "economy/virtual-purchases")
        self.wait_for_user("Create all 20 virtual purchases, then press Enter...")

    def setup_authentication(self):
        """Guide through authentication setup"""
        self.print_step(4, "Setup Authentication", "Enable Anonymous Sign-In")

        print("\n🔐 Authentication Setup:")
        print("   1. Go to Authentication section")
        print("   2. Enable 'Anonymous Sign-In'")
        print("   3. Configure any additional settings")
        print("   4. Save changes")

        self.open_dashboard_section("Authentication", "authentication")
        self.wait_for_user("Enable Anonymous Sign-In, then press Enter...")

    def setup_cloud_code(self):
        """Guide through Cloud Code setup"""
        self.print_step(
            5, "Deploy Cloud Code Functions", "Deploy 4 Cloud Code functions"
        )

        functions = [
            "AddCurrency.js",
            "SpendCurrency.js",
            "AddInventoryItem.js",
            "UseInventoryItem.js",
        ]

        print("\n☁️ Cloud Code Functions to Deploy:")
        for i, func in enumerate(functions, 1):
            print(f"   {i}. {func}")

        print("\n📁 Function files are located at:")
        print(f"   /workspace/unity/Assets/CloudCode/")

        print("\n🔧 Steps for each function:")
        print("   1. Go to Cloud Code section")
        print("   2. Click 'Create Function'")
        print("   3. Copy the code from the .js file")
        print("   4. Paste into the function editor")
        print("   5. Set function name (without .js)")
        print("   6. Deploy the function")

        self.open_dashboard_section("Cloud Code", "cloud-code")
        self.wait_for_user("Deploy all 4 Cloud Code functions, then press Enter...")

    def setup_analytics(self, config):
        """Guide through analytics setup"""
        self.print_step(6, "Setup Analytics Events", "Configure 6 custom events")

        events = config["services"]["analytics"]["customEvents"]

        print("\n📊 Analytics Events to Create:")
        for i, event in enumerate(events, 1):
            print(f"   {i}. {event}")

        print("\n🔧 Steps:")
        print("   1. Go to Analytics section")
        print("   2. Navigate to Custom Events")
        print("   3. Create each event listed above")
        print("   4. Configure event parameters as needed")

        self.open_dashboard_section("Analytics", "analytics")
        self.wait_for_user("Create all 6 analytics events, then press Enter...")

    def setup_cloud_save(self):
        """Guide through Cloud Save setup"""
        self.print_step(7, "Setup Cloud Save", "Enable Cloud Save service")

        print("\n💾 Cloud Save Setup:")
        print("   1. Go to Cloud Save section")
        print("   2. Enable Cloud Save")
        print("   3. Configure save data structure")
        print("   4. Set up data retention policies")
        print("   5. Save changes")

        self.open_dashboard_section("Cloud Save", "cloud-save")
        self.wait_for_user("Enable Cloud Save, then press Enter...")

    def setup_ads(self):
        """Guide through Unity Ads setup"""
        self.print_step(8, "Setup Unity Ads", "Configure ad placements and mediation")

        print("\n📺 Unity Ads Setup:")
        print("   1. Go to Monetization → Ads")
        print("   2. Configure ad placements")
        print("   3. Set up mediation")
        print("   4. Configure ad revenue tracking")
        print("   5. Save changes")

        self.open_dashboard_section("Unity Ads", "monetization/ads")
        self.wait_for_user("Configure Unity Ads, then press Enter...")

    def setup_purchasing(self):
        """Guide through Unity Purchasing setup"""
        self.print_step(9, "Setup Unity Purchasing", "Configure IAP products")

        iap_products = [
            "remove_ads (Non-Consumable)",
            "starter_pack_small (Consumable)",
            "starter_pack_large (Consumable)",
            "coins_small (Consumable)",
            "coins_medium (Consumable)",
            "coins_large (Consumable)",
            "coins_huge (Consumable)",
            "energy_refill (Consumable)",
            "booster_bundle (Consumable)",
            "comeback_bundle (Consumable)",
            "season_pass_premium (Non-Consumable)",
            "vip_sub_monthly (Subscription)",
        ]

        print("\n💳 IAP Products to Create:")
        for i, product in enumerate(iap_products, 1):
            print(f"   {i}. {product}")

        print("\n🔧 Steps:")
        print("   1. Go to Monetization → In-App Purchases")
        print("   2. Create each IAP product listed above")
        print("   3. Set appropriate product types")
        print("   4. Configure pricing")
        print("   5. Save changes")

        self.open_dashboard_section("Unity Purchasing", "monetization/iap")
        self.wait_for_user("Create all IAP products, then press Enter...")

    def run_setup(self):
        """Run the complete setup process"""
        self.print_header("Unity Dashboard Setup Assistant")

        print(
            "🎯 This assistant will guide you through setting up Unity Cloud Services"
        )
        print("   for your 'Evergreen Puzzler' project.")
        print(f"\n📋 Project Details:")
        print(f"   Project ID: {self.project_id}")
        print(f"   Environment ID: {self.environment_id}")
        print(f"   Project Name: Evergreen Puzzler")

        self.wait_for_user("Ready to start? Press Enter to begin...")

        # Load configuration
        config = self.load_config()

        # Run setup steps
        self.setup_economy_currencies(config)
        self.setup_economy_inventory(config)
        self.setup_economy_purchases(config)
        self.setup_authentication()
        self.setup_cloud_code()
        self.setup_analytics(config)
        self.setup_cloud_save()
        self.setup_ads()
        self.setup_purchasing()

        # Final summary
        self.print_header("Setup Complete! 🎉")
        print("✅ All Unity Cloud Services have been configured!")
        print("\n🧪 Next Steps:")
        print("   1. Open Unity Editor")
        print("   2. Go to Tools → Economy → Sync CSV to Unity Dashboard")
        print("   3. Click 'Initialize Unity Services'")
        print("   4. Click 'Full Sync (All Items)'")
        print("   5. Test your integration!")

        print("\n📊 Summary:")
        print("   ✅ 3 Currencies created")
        print("   ✅ 13 Inventory items created")
        print("   ✅ 20 Virtual purchases created")
        print("   ✅ Authentication configured")
        print("   ✅ 4 Cloud Code functions deployed")
        print("   ✅ 6 Analytics events configured")
        print("   ✅ Cloud Save enabled")
        print("   ✅ Unity Ads configured")
        print("   ✅ 12 IAP products created")

        print("\n🎮 Your Unity Cloud integration is now complete!")

    def run_automation_scripts(self):
        """Run automation scripts (from one_click_unity_setup.py)"""
        self.print_header("Running Automation Scripts")

        scripts = ["convert_economy_csv.py", "health_check.py", "auto_maintenance.py"]

        for script in scripts:
            if script == "convert_economy_csv.py":
                script_path = self.repo_root / "scripts" / "utilities" / script
            else:
                script_path = self.repo_root / "scripts" / script

            if script_path.exists():
                print(f"🔄 Running {script}...")
                try:
                    result = subprocess.run(
                        [sys.executable, str(script_path)],
                        capture_output=True,
                        text=True,
                        cwd=self.repo_root,
                    )
                    if result.returncode == 0:
                        print(f"   ✅ {script} completed successfully")
                    else:
                        print(f"   ⚠️  {script} completed with warnings")
                        print(f"   Output: {result.stdout}")
                except Exception as e:
                    print(f"   ❌ {script} failed: {e}")
            else:
                print(f"   ⚠️  {script} not found, skipping...")

    def run_complete_setup(self):
        """Run complete setup with automation (consolidated functionality)"""
        self.print_header("Complete Unity Cloud Setup")

        print("🎯 Running complete Unity Cloud Services setup...")
        print("   This includes CSV processing, configuration, and dashboard setup.")

        # Run automation scripts first
        self.run_automation_scripts()

        # Then run manual setup
        self.run_setup()

        return True


if __name__ == "__main__":
    assistant = UnityDashboardSetupAssistant()

    # Check if user wants complete setup or just manual setup
    if len(sys.argv) > 1 and sys.argv[1] == "--complete":
        assistant.run_complete_setup()
    else:
        assistant.run_setup()
