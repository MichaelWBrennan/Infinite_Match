#!/usr/bin/env python3
"""
Headless Real-Time Unity Cloud Monitor
Shows live data from your Unity Cloud account in real-time
"""

import json
import os
import threading
import time
from datetime import datetime

import requests


class HeadlessRealtimeMonitor:
    def __init__(self):
        self.project_id = "0dd5a03e-7f23-49c4-964e-7919c48c0574"
        self.env_id = os.getenv("UNITY_ENV_ID")
        self.email = os.getenv("UNITY_EMAIL")
        self.api_token = os.getenv("UNITY_API_TOKEN")
        self.running = False

        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }

        # Data storage
        self.economy_data = {"currencies": [], "inventory": [], "catalog": []}
        self.cloud_code_data = {"functions": []}
        self.remote_config_data = {"configs": []}
        self.last_update = None

    def get_economy_data(self):
        """Get real-time economy data"""
        try:
            # Get currencies
            currencies_url = f"https://services.api.unity.com/economy/v1/projects/{self.project_id}/environments/{self.env_id}/currencies"
            currencies_response = requests.get(
                currencies_url, headers=self.headers, timeout=5
            )

            # Get inventory
            inventory_url = f"https://services.api.unity.com/economy/v1/projects/{self.project_id}/environments/{self.env_id}/inventory"
            inventory_response = requests.get(
                inventory_url, headers=self.headers, timeout=5
            )

            # Get catalog
            catalog_url = f"https://services.api.unity.com/economy/v1/projects/{self.project_id}/environments/{self.env_id}/catalog"
            catalog_response = requests.get(
                catalog_url, headers=self.headers, timeout=5
            )

            return {
                "currencies": (
                    currencies_response.json().get("data", [])
                    if currencies_response.status_code == 200
                    else []
                ),
                "inventory": (
                    inventory_response.json().get("data", [])
                    if inventory_response.status_code == 200
                    else []
                ),
                "catalog": (
                    catalog_response.json().get("data", [])
                    if catalog_response.status_code == 200
                    else []
                ),
                "status": {
                    "currencies": currencies_response.status_code,
                    "inventory": inventory_response.status_code,
                    "catalog": catalog_response.status_code,
                },
            }
        except Exception as e:
            return {"currencies": [], "inventory": [], "catalog": [], "error": str(e)}

    def get_cloud_code_data(self):
        """Get real-time cloud code data"""
        try:
            url = f"https://services.api.unity.com/cloud-code/v1/projects/{self.project_id}/environments/{self.env_id}/functions"
            response = requests.get(url, headers=self.headers, timeout=5)

            if response.status_code == 200:
                data = response.json()
                return {
                    "functions": data.get("data", []),
                    "status": response.status_code,
                }
            else:
                return {"functions": [], "status": response.status_code}
        except Exception as e:
            return {"functions": [], "error": str(e)}

    def get_remote_config_data(self):
        """Get real-time remote config data"""
        try:
            url = f"https://services.api.unity.com/remote-config/v1/projects/{self.project_id}/environments/{self.env_id}/configs"
            response = requests.get(url, headers=self.headers, timeout=5)

            if response.status_code == 200:
                data = response.json()
                return {"configs": data.get("data", []), "status": response.status_code}
            else:
                return {"configs": [], "status": response.status_code}
        except Exception as e:
            return {"configs": [], "error": str(e)}

    def update_data(self):
        """Update all data from Unity Cloud"""
        self.last_update = datetime.now()

        # Get economy data
        economy = self.get_economy_data()
        self.economy_data = economy

        # Get cloud code data
        cloud_code = self.get_cloud_code_data()
        self.cloud_code_data = cloud_code

        # Get remote config data
        remote_config = self.get_remote_config_data()
        self.remote_config_data = remote_config

    def display_data(self):
        """Display current data in a nice format"""
        # Clear screen safely
        if os.name == "posix":
            subprocess.run(["clear"], check=False)
        else:
            subprocess.run(["cls"], check=False, shell=True)

        print("=" * 80)
        print("🔴 HEADLESS REAL-TIME UNITY CLOUD MONITOR")
        print("=" * 80)
        print(f"Project ID: {self.project_id}")
        print(f"Environment ID: {self.env_id}")
        print(f"Email: {self.email}")
        print(
            f"Last Update: {self.last_update.strftime('%Y-%m-%d %H:%M:%S') if self.last_update else 'Never'}"
        )
        print("=" * 80)

        # Economy Data
        print("\n💰 ECONOMY DATA (Real-Time):")
        print("-" * 40)
        currencies = self.economy_data.get("currencies", [])
        inventory = self.economy_data.get("inventory", [])
        catalog = self.economy_data.get("catalog", [])

        print(f"   Currencies: {len(currencies)}")
        for currency in currencies[:3]:
            print(
                f"      • {currency.get('id', 'unknown')}: {currency.get('name', 'Unknown')}"
            )
        if len(currencies) > 3:
            print(f"      ... and {len(currencies) - 3} more")

        print(f"   Inventory: {len(inventory)}")
        for item in inventory[:3]:
            print(f"      • {item.get('id', 'unknown')}: {item.get('name', 'Unknown')}")
        if len(inventory) > 3:
            print(f"      ... and {len(inventory) - 3} more")

        print(f"   Catalog: {len(catalog)}")
        for item in catalog[:3]:
            print(f"      • {item.get('id', 'unknown')}: {item.get('name', 'Unknown')}")
        if len(catalog) > 3:
            print(f"      ... and {len(catalog) - 3} more")

        # Cloud Code Data
        print("\n☁️ CLOUD CODE DATA (Real-Time):")
        print("-" * 40)
        functions = self.cloud_code_data.get("functions", [])
        print(f"   Functions: {len(functions)}")
        for func in functions[:3]:
            print(
                f"      • {func.get('name', 'unknown')}: {func.get('status', 'Unknown')}"
            )
        if len(functions) > 3:
            print(f"      ... and {len(functions) - 3} more")

        # Remote Config Data
        print("\n⚙️ REMOTE CONFIG DATA (Real-Time):")
        print("-" * 40)
        configs = self.remote_config_data.get("configs", [])
        print(f"   Configs: {len(configs)}")
        for config in configs[:3]:
            print(
                f"      • {config.get('name', 'unknown')}: {config.get('value', 'Unknown')}"
            )
        if len(configs) > 3:
            print(f"      ... and {len(configs) - 3} more")

        # Summary
        total_items = (
            len(currencies)
            + len(inventory)
            + len(catalog)
            + len(functions)
            + len(configs)
        )
        print(f"\n📊 TOTAL ITEMS: {total_items}")

        if total_items == 0:
            print("   Status: 🔴 EMPTY - No data in your Unity Cloud account")
        else:
            print("   Status: 🟢 ACTIVE - Data found in your Unity Cloud account")

        print("\n" + "=" * 80)
        print("Press Ctrl+C to stop monitoring")
        print("=" * 80)

    def monitor_loop(self):
        """Main monitoring loop"""
        while self.running:
            try:
                self.update_data()
                self.display_data()
                time.sleep(5)  # Update every 5 seconds
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"\n❌ Error in monitoring loop: {e}")
                time.sleep(5)

    def start_monitoring(self):
        """Start real-time monitoring"""
        print("🚀 Starting real-time Unity Cloud monitoring...")
        print("   Using your actual credentials for live data access")
        print("   Updates every 5 seconds")
        print("\nPress Ctrl+C to stop...")

        self.running = True
        try:
            self.monitor_loop()
        except KeyboardInterrupt:
            print("\n\n🛑 Monitoring stopped by user")
        finally:
            self.running = False
            print("✅ Real-time monitoring ended")

    def single_update(self):
        """Do a single data update and display"""
        print("🔄 Getting single real-time update...")
        self.update_data()
        self.display_data()

    def continuous_monitoring(self):
        """Start continuous monitoring with threading"""
        print("🔄 Starting continuous real-time monitoring...")

        def monitor_thread():
            while self.running:
                try:
                    self.update_data()
                    time.sleep(10)  # Update every 10 seconds
                except Exception as e:
                    print(f"❌ Monitor thread error: {e}")
                    time.sleep(5)

        self.running = True
        monitor_thread_obj = threading.Thread(target=monitor_thread)
        monitor_thread_obj.daemon = True
        monitor_thread_obj.start()

        try:
            while True:
                self.display_data()
                time.sleep(2)  # Display update every 2 seconds
        except KeyboardInterrupt:
            print("\n\n🛑 Monitoring stopped by user")
        finally:
            self.running = False
            print("✅ Continuous monitoring ended")


def main():
    """Main function"""
    monitor = HeadlessRealtimeMonitor()

    print("🔴 HEADLESS REAL-TIME UNITY CLOUD MONITOR")
    print("=" * 50)
    print("1. Single update")
    print("2. Continuous monitoring")
    print("3. Live monitoring (updates every 5 seconds)")
    print("=" * 50)

    try:
        choice = input("Choose monitoring mode (1-3): ").strip()

        if choice == "1":
            monitor.single_update()
        elif choice == "2":
            monitor.continuous_monitoring()
        elif choice == "3":
            monitor.start_monitoring()
        else:
            print("Invalid choice. Running single update...")
            monitor.single_update()

    except KeyboardInterrupt:
        print("\n\n🛑 Monitoring stopped by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")


if __name__ == "__main__":
    main()
