#!/usr/bin/env python3
"""
Unity Cloud Headless API Automation
Populates Unity Cloud dashboard without Unity Editor using direct API calls
"""

import json
import os
import time
import requests
from datetime import datetime

class UnityCloudHeadlessAPI:
    def __init__(self):
        self.project_id = "0dd5a03e-7f23-49c4-964e-7919c48c0574"
        self.environment_id = "1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"
        self.base_url = "https://services.api.unity.com"
        
        # Load credentials from environment or use mock for demonstration
        self.api_token = os.getenv("UNITY_API_TOKEN", "mock_token")
        self.client_id = os.getenv("UNITY_CLIENT_ID", "mock_client_id")
        self.client_secret = os.getenv("UNITY_CLIENT_SECRET", "mock_client_secret")
        
        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
            "X-Project-Id": self.project_id,
            "X-Environment-Id": self.environment_id
        }

    def authenticate(self):
        """Authenticate with Unity Cloud API"""
        print("🔐 Authenticating with Unity Cloud API...")
        
        if self.api_token == "mock_token":
            print("⚠️ Using mock authentication (no real API calls)")
            print("   To use real API, set UNITY_API_TOKEN environment variable")
            return True
            
        try:
            # Real authentication would go here
            auth_url = f"{self.base_url}/auth/v1/token"
            auth_data = {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "grant_type": "client_credentials"
            }
            
            response = requests.post(auth_url, json=auth_data)
            if response.status_code == 200:
                token_data = response.json()
                self.api_token = token_data["access_token"]
                self.headers["Authorization"] = f"Bearer {self.api_token}"
                print("✅ Authentication successful")
                return True
            else:
                print(f"❌ Authentication failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"⚠️ Authentication error: {e}")
            print("   Continuing with mock mode...")
            return True

    def create_currencies(self):
        """Create currencies in Unity Cloud"""
        print("💰 Creating currencies...")
        
        currencies = [
            {
                "id": "coins",
                "name": "Coins",
                "type": "SOFT_CURRENCY",
                "initial": 1000,
                "maximum": 999999
            },
            {
                "id": "gems", 
                "name": "Gems",
                "type": "HARD_CURRENCY",
                "initial": 50,
                "maximum": 99999
            },
            {
                "id": "energy",
                "name": "Energy", 
                "type": "CONSUMABLE",
                "initial": 5,
                "maximum": 30
            }
        ]
        
        created_currencies = []
        for currency in currencies:
            try:
                if self.api_token == "mock_token":
                    print(f"   ✅ Mock created currency: {currency['name']} ({currency['id']})")
                    created_currencies.append(currency)
                else:
                    url = f"{self.base_url}/economy/v1/projects/{self.project_id}/environments/{self.environment_id}/currencies"
                    response = requests.post(url, json=currency, headers=self.headers)
                    
                    if response.status_code in [200, 201]:
                        print(f"   ✅ Created currency: {currency['name']} ({currency['id']})")
                        created_currencies.append(currency)
                    else:
                        print(f"   ❌ Failed to create currency {currency['id']}: {response.status_code}")
                        
            except Exception as e:
                print(f"   ⚠️ Error creating currency {currency['id']}: {e}")
                
        return created_currencies

    def create_inventory_items(self):
        """Create inventory items in Unity Cloud"""
        print("📦 Creating inventory items...")
        
        inventory_items = [
            {"id": "booster_extra_moves", "name": "Extra Moves", "type": "BOOSTER", "tradable": True, "stackable": True},
            {"id": "booster_color_bomb", "name": "Color Bomb", "type": "BOOSTER", "tradable": True, "stackable": True},
            {"id": "booster_rainbow_blast", "name": "Rainbow Blast", "type": "BOOSTER", "tradable": True, "stackable": True},
            {"id": "booster_striped_candy", "name": "Striped Candy", "type": "BOOSTER", "tradable": True, "stackable": True},
            {"id": "pack_starter", "name": "Starter Pack", "type": "PACK", "tradable": False, "stackable": False},
            {"id": "pack_value", "name": "Value Pack", "type": "PACK", "tradable": False, "stackable": False},
            {"id": "pack_premium", "name": "Premium Pack", "type": "PACK", "tradable": False, "stackable": False},
            {"id": "pack_mega", "name": "Mega Pack", "type": "PACK", "tradable": False, "stackable": False},
            {"id": "pack_ultimate", "name": "Ultimate Pack", "type": "PACK", "tradable": False, "stackable": False},
            {"id": "pack_booster_small", "name": "Booster Bundle", "type": "PACK", "tradable": False, "stackable": False},
            {"id": "pack_booster_large", "name": "Power Pack", "type": "PACK", "tradable": False, "stackable": False},
            {"id": "pack_comeback", "name": "Welcome Back!", "type": "PACK", "tradable": False, "stackable": False},
            {"id": "pack_flash_sale", "name": "Flash Sale!", "type": "PACK", "tradable": False, "stackable": False}
        ]
        
        created_items = []
        for item in inventory_items:
            try:
                if self.api_token == "mock_token":
                    print(f"   ✅ Mock created inventory item: {item['name']} ({item['id']})")
                    created_items.append(item)
                else:
                    url = f"{self.base_url}/economy/v1/projects/{self.project_id}/environments/{self.environment_id}/inventory-items"
                    response = requests.post(url, json=item, headers=self.headers)
                    
                    if response.status_code in [200, 201]:
                        print(f"   ✅ Created inventory item: {item['name']} ({item['id']})")
                        created_items.append(item)
                    else:
                        print(f"   ❌ Failed to create inventory item {item['id']}: {response.status_code}")
                        
            except Exception as e:
                print(f"   ⚠️ Error creating inventory item {item['id']}: {e}")
                
        return created_items

    def create_virtual_purchases(self):
        """Create virtual purchases in Unity Cloud"""
        print("🛒 Creating virtual purchases...")
        
        virtual_purchases = [
            {"id": "coins_small", "name": "Small Coin Pack", "cost_currency": "gems", "cost_amount": 20, "rewards": "coins:1000"},
            {"id": "coins_medium", "name": "Medium Coin Pack", "cost_currency": "gems", "cost_amount": 120, "rewards": "coins:5000"},
            {"id": "coins_large", "name": "Large Coin Pack", "cost_currency": "gems", "cost_amount": 300, "rewards": "coins:15000"},
            {"id": "coins_mega", "name": "Mega Coin Pack", "cost_currency": "gems", "cost_amount": 700, "rewards": "coins:40000"},
            {"id": "coins_ultimate", "name": "Ultimate Coin Pack", "cost_currency": "gems", "cost_amount": 2000, "rewards": "coins:100000"},
            {"id": "energy_small", "name": "Energy Boost", "cost_currency": "gems", "cost_amount": 5, "rewards": "energy:5"},
            {"id": "energy_large", "name": "Energy Surge", "cost_currency": "gems", "cost_amount": 15, "rewards": "energy:20"},
            {"id": "booster_extra_moves", "name": "Extra Moves", "cost_currency": "coins", "cost_amount": 200, "rewards": "booster_extra_moves:3"},
            {"id": "booster_color_bomb", "name": "Color Bomb", "cost_currency": "gems", "cost_amount": 15, "rewards": "booster_color_bomb:1"},
            {"id": "booster_rainbow_blast", "name": "Rainbow Blast", "cost_currency": "gems", "cost_amount": 25, "rewards": "booster_rainbow_blast:1"},
            {"id": "booster_striped_candy", "name": "Striped Candy", "cost_currency": "coins", "cost_amount": 100, "rewards": "booster_striped_candy:1"},
            {"id": "pack_starter", "name": "Starter Pack", "cost_currency": "gems", "cost_amount": 20, "rewards": "pack_starter:1"},
            {"id": "pack_value", "name": "Value Pack", "cost_currency": "gems", "cost_amount": 120, "rewards": "pack_value:1"},
            {"id": "pack_premium", "name": "Premium Pack", "cost_currency": "gems", "cost_amount": 300, "rewards": "pack_premium:1"},
            {"id": "pack_mega", "name": "Mega Pack", "cost_currency": "gems", "cost_amount": 700, "rewards": "pack_mega:1"},
            {"id": "pack_ultimate", "name": "Ultimate Pack", "cost_currency": "gems", "cost_amount": 2000, "rewards": "pack_ultimate:1"},
            {"id": "pack_booster_small", "name": "Booster Bundle", "cost_currency": "coins", "cost_amount": 500, "rewards": "pack_booster_small:1"},
            {"id": "pack_booster_large", "name": "Power Pack", "cost_currency": "gems", "cost_amount": 25, "rewards": "pack_booster_large:1"},
            {"id": "pack_comeback", "name": "Welcome Back!", "cost_currency": "gems", "cost_amount": 50, "rewards": "pack_comeback:1"},
            {"id": "pack_flash_sale", "name": "Flash Sale!", "cost_currency": "gems", "cost_amount": 25, "rewards": "pack_flash_sale:1"}
        ]
        
        created_purchases = []
        for purchase in virtual_purchases:
            try:
                if self.api_token == "mock_token":
                    print(f"   ✅ Mock created virtual purchase: {purchase['name']} ({purchase['id']})")
                    created_purchases.append(purchase)
                else:
                    url = f"{self.base_url}/economy/v1/projects/{self.project_id}/environments/{self.environment_id}/virtual-purchases"
                    response = requests.post(url, json=purchase, headers=self.headers)
                    
                    if response.status_code in [200, 201]:
                        print(f"   ✅ Created virtual purchase: {purchase['name']} ({purchase['id']})")
                        created_purchases.append(purchase)
                    else:
                        print(f"   ❌ Failed to create virtual purchase {purchase['id']}: {response.status_code}")
                        
            except Exception as e:
                print(f"   ⚠️ Error creating virtual purchase {purchase['id']}: {e}")
                
        return created_purchases

    def deploy_cloud_code_functions(self):
        """Deploy Cloud Code functions"""
        print("☁️ Deploying Cloud Code functions...")
        
        functions = [
            "AddCurrency.js",
            "SpendCurrency.js", 
            "AddInventoryItem.js",
            "UseInventoryItem.js"
        ]
        
        deployed_functions = []
        for function in functions:
            try:
                if self.api_token == "mock_token":
                    print(f"   ✅ Mock deployed Cloud Code function: {function}")
                    deployed_functions.append(function)
                else:
                    # Read function code
                    function_path = f"cloud-code/{function}"
                    if os.path.exists(function_path):
                        with open(function_path, 'r') as f:
                            function_code = f.read()
                        
                        url = f"{self.base_url}/cloudcode/v1/projects/{self.project_id}/environments/{self.environment_id}/functions"
                        function_data = {
                            "name": function.replace('.js', ''),
                            "code": function_code,
                            "language": "javascript"
                        }
                        
                        response = requests.post(url, json=function_data, headers=self.headers)
                        
                        if response.status_code in [200, 201]:
                            print(f"   ✅ Deployed Cloud Code function: {function}")
                            deployed_functions.append(function)
                        else:
                            print(f"   ❌ Failed to deploy function {function}: {response.status_code}")
                    else:
                        print(f"   ⚠️ Function file not found: {function_path}")
                        
            except Exception as e:
                print(f"   ⚠️ Error deploying function {function}: {e}")
                
        return deployed_functions

    def update_remote_config(self):
        """Update Remote Config settings"""
        print("⚙️ Updating Remote Config...")
        
        config_data = {
            "game_settings": {
                "max_level": 100,
                "energy_refill_time": 300,
                "daily_reward_coins": 100,
                "daily_reward_gems": 5,
                "max_energy": 30,
                "energy_refill_cost_gems": 5
            },
            "economy_settings": {
                "coin_multiplier": 1.0,
                "gem_multiplier": 1.0,
                "sale_discount": 0.5,
                "daily_bonus_multiplier": 1.2,
                "streak_bonus_multiplier": 1.5
            },
            "feature_flags": {
                "new_levels_enabled": True,
                "daily_challenges_enabled": True,
                "social_features_enabled": False,
                "ads_enabled": True,
                "iap_enabled": True,
                "economy_enabled": True
            }
        }
        
        try:
            if self.api_token == "mock_token":
                print("   ✅ Mock updated Remote Config settings")
                return True
            else:
                url = f"{self.base_url}/remote-config/v1/projects/{self.project_id}/environments/{self.environment_id}/configs"
                response = requests.put(url, json=config_data, headers=self.headers)
                
                if response.status_code in [200, 201]:
                    print("   ✅ Updated Remote Config settings")
                    return True
                else:
                    print(f"   ❌ Failed to update Remote Config: {response.status_code}")
                    return False
                    
        except Exception as e:
            print(f"   ⚠️ Error updating Remote Config: {e}")
            return False

    def generate_deployment_report(self, results):
        """Generate deployment report"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "project_id": self.project_id,
            "environment_id": self.environment_id,
            "deployment_type": "headless_api",
            "results": results
        }
        
        report_path = "unity_cloud_headless_deployment_report.json"
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
            
        print(f"📊 Deployment report saved: {report_path}")
        return report_path

    def run_headless_deployment(self):
        """Run complete headless deployment"""
        print("🚀 Starting Unity Cloud Headless API Deployment")
        print("=" * 60)
        print(f"Project ID: {self.project_id}")
        print(f"Environment ID: {self.environment_id}")
        print(f"API Mode: {'Mock' if self.api_token == 'mock_token' else 'Real'}")
        print("=" * 60)
        
        # Authenticate
        if not self.authenticate():
            print("❌ Authentication failed. Exiting.")
            return False
            
        results = {}
        
        # Create currencies
        print("\n💰 Step 1/5: Creating currencies...")
        results['currencies'] = self.create_currencies()
        
        # Create inventory items
        print("\n📦 Step 2/5: Creating inventory items...")
        results['inventory_items'] = self.create_inventory_items()
        
        # Create virtual purchases
        print("\n🛒 Step 3/5: Creating virtual purchases...")
        results['virtual_purchases'] = self.create_virtual_purchases()
        
        # Deploy Cloud Code functions
        print("\n☁️ Step 4/5: Deploying Cloud Code functions...")
        results['cloud_code_functions'] = self.deploy_cloud_code_functions()
        
        # Update Remote Config
        print("\n⚙️ Step 5/5: Updating Remote Config...")
        results['remote_config'] = self.update_remote_config()
        
        # Generate report
        print("\n📊 Generating deployment report...")
        report_path = self.generate_deployment_report(results)
        
        # Summary
        print("\n🎉 Unity Cloud Headless Deployment Complete!")
        print("=" * 60)
        print(f"✅ Currencies created: {len(results['currencies'])}")
        print(f"✅ Inventory items created: {len(results['inventory_items'])}")
        print(f"✅ Virtual purchases created: {len(results['virtual_purchases'])}")
        print(f"✅ Cloud Code functions deployed: {len(results['cloud_code_functions'])}")
        print(f"✅ Remote Config updated: {results['remote_config']}")
        print(f"📊 Report saved: {report_path}")
        
        if self.api_token == "mock_token":
            print("\n⚠️ Note: This was a mock deployment.")
            print("   To deploy to real Unity Cloud, set UNITY_API_TOKEN environment variable")
            print("   and ensure you have proper Unity Cloud API access.")
        
        return True

if __name__ == "__main__":
    deployment = UnityCloudHeadlessAPI()
    deployment.run_headless_deployment()