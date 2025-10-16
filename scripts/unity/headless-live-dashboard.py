#!/usr/bin/env python3
"""
Headless Live Dashboard
Shows live Unity Cloud data in a dashboard format
"""

import json
import os
import time
from datetime import datetime

import requests


class HeadlessLiveDashboard:
    def __init__(self):
        self.project_id = "0dd5a03e-7f23-49c4-964e-7919c48c0574"
        self.env_id = os.getenv("UNITY_ENV_ID")
        self.email = os.getenv("UNITY_EMAIL")
        self.api_token = os.getenv("UNITY_API_TOKEN")

        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }

    def get_live_data(self):
        """Get live data from Unity Cloud"""
        data = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "economy": {"currencies": [], "inventory": [], "catalog": []},
            "cloud_code": {"functions": []},
            "remote_config": {"configs": []},
            "status": "unknown",
        }

        # Get economy data
        try:
            currencies_url = f"https://services.api.unity.com/economy/v1/projects/{self.project_id}/environments/{self.env_id}/currencies"
            currencies_response = requests.get(
                currencies_url, headers=self.headers, timeout=5
            )

            inventory_url = f"https://services.api.unity.com/economy/v1/projects/{self.project_id}/environments/{self.env_id}/inventory"
            inventory_response = requests.get(
                inventory_url, headers=self.headers, timeout=5
            )

            catalog_url = f"https://services.api.unity.com/economy/v1/projects/{self.project_id}/environments/{self.env_id}/catalog"
            catalog_response = requests.get(
                catalog_url, headers=self.headers, timeout=5
            )

            if currencies_response.status_code == 200:
                data["economy"]["currencies"] = currencies_response.json().get(
                    "data", []
                )
            if inventory_response.status_code == 200:
                data["economy"]["inventory"] = inventory_response.json().get("data", [])
            if catalog_response.status_code == 200:
                data["economy"]["catalog"] = catalog_response.json().get("data", [])

        except Exception as e:
            data["economy"]["error"] = str(e)

        # Get cloud code data
        try:
            cloud_code_url = f"https://services.api.unity.com/cloud-code/v1/projects/{self.project_id}/environments/{self.env_id}/functions"
            cloud_code_response = requests.get(
                cloud_code_url, headers=self.headers, timeout=5
            )

            if cloud_code_response.status_code == 200:
                data["cloud_code"]["functions"] = cloud_code_response.json().get(
                    "data", []
                )

        except Exception as e:
            data["cloud_code"]["error"] = str(e)

        # Get remote config data
        try:
            remote_config_url = f"https://services.api.unity.com/remote-config/v1/projects/{self.project_id}/environments/{self.env_id}/configs"
            remote_config_response = requests.get(
                remote_config_url, headers=self.headers, timeout=5
            )

            if remote_config_response.status_code == 200:
                data["remote_config"]["configs"] = remote_config_response.json().get(
                    "data", []
                )

        except Exception as e:
            data["remote_config"]["error"] = str(e)

        # Determine status
        total_items = (
            len(data["economy"]["currencies"])
            + len(data["economy"]["inventory"])
            + len(data["economy"]["catalog"])
            + len(data["cloud_code"]["functions"])
            + len(data["remote_config"]["configs"])
        )

        if total_items == 0:
            data["status"] = "empty"
        else:
            data["status"] = "active"

        return data

    def display_dashboard(self, data):
        """Display live dashboard"""
        # Clear screen safely
        if os.name == "posix":
            subprocess.run(["clear"], check=False)
        else:
            subprocess.run(["cls"], check=False, shell=True)

        print("🔴 UNITY CLOUD LIVE DASHBOARD")
        print("=" * 60)
        print(f"📅 Time: {data['timestamp']}")
        print(f"👤 Account: {self.email}")
        print(f"🆔 Project: {self.project_id[:8]}...")
        print(f"🌍 Environment: {self.env_id[:8]}...")
        print("=" * 60)

        # Economy Section
        print("\n💰 ECONOMY SERVICE")
        print("-" * 30)
        currencies = data["economy"]["currencies"]
        inventory = data["economy"]["inventory"]
        catalog = data["economy"]["catalog"]

        print(f"   💰 Currencies: {len(currencies)}")
        if currencies:
            for currency in currencies[:2]:
                print(
                    f"      • {currency.get('id', 'unknown')}: {currency.get('name', 'Unknown')}"
                )
        else:
            print("      • No currencies configured")

        print(f"   🎒 Inventory: {len(inventory)}")
        if inventory:
            for item in inventory[:2]:
                print(
                    f"      • {item.get('id', 'unknown')}: {item.get('name', 'Unknown')}"
                )
        else:
            print("      • No inventory items configured")

        print(f"   🛒 Catalog: {len(catalog)}")
        if catalog:
            for item in catalog[:2]:
                print(
                    f"      • {item.get('id', 'unknown')}: {item.get('name', 'Unknown')}"
                )
        else:
            print("      • No catalog items configured")

        # Cloud Code Section
        print("\n☁️ CLOUD CODE SERVICE")
        print("-" * 30)
        functions = data["cloud_code"]["functions"]
        print(f"   🔧 Functions: {len(functions)}")
        if functions:
            for func in functions[:2]:
                print(
                    f"      • {func.get('name', 'unknown')}: {func.get('status', 'Unknown')}"
                )
        else:
            print("      • No functions deployed")

        # Remote Config Section
        print("\n⚙️ REMOTE CONFIG SERVICE")
        print("-" * 30)
        configs = data["remote_config"]["configs"]
        print(f"   ⚙️ Configs: {len(configs)}")
        if configs:
            for config in configs[:2]:
                print(
                    f"      • {config.get('name', 'unknown')}: {config.get('value', 'Unknown')}"
                )
        else:
            print("      • No configurations set")

        # Status Summary
        print("\n📊 ACCOUNT STATUS")
        print("-" * 30)
        total_items = (
            len(currencies)
            + len(inventory)
            + len(catalog)
            + len(functions)
            + len(configs)
        )

        if data["status"] == "empty":
            print("   🔴 Status: EMPTY")
            print("   💡 Next: Deploy your local data to Unity Cloud")
        else:
            print("   🟢 Status: ACTIVE")
            print(f"   📈 Total Items: {total_items}")

        print("\n" + "=" * 60)
        print("Press Ctrl+C to stop monitoring")
        print("=" * 60)

    def run_live_dashboard(self):
        """Run live dashboard"""
        print("🚀 Starting Unity Cloud Live Dashboard...")
        print("   Using your real credentials for live data access")
        print("   Updates every 10 seconds")
        print("\nPress Ctrl+C to stop...")

        try:
            while True:
                data = self.get_live_data()
                self.display_dashboard(data)
                time.sleep(10)  # Update every 10 seconds
        except KeyboardInterrupt:
            print("\n\n🛑 Live dashboard stopped by user")
            print("✅ Dashboard monitoring ended")


def main():
    """Main function"""
    dashboard = HeadlessLiveDashboard()
    dashboard.run_live_dashboard()


if __name__ == "__main__":
    main()
