#!/usr/bin/env python3
"""
Headless Unity Cloud API with Real Credentials
Uses actual Unity Cloud API token to access your real account data
"""

import json
import os
import time

import requests


class HeadlessUnityAPIWithCredentials:
    def __init__(self):
        self.project_id = "0dd5a03e-7f23-49c4-964e-7919c48c0574"
        self.env_id = os.getenv("UNITY_ENV_ID")
        self.email = os.getenv("UNITY_EMAIL")
        self.password = os.getenv("UNITY_PASSWORD")
        self.api_token = os.getenv("UNITY_API_TOKEN")

        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }

    def get_economy_data(self):
        """Get real economy data using API token"""
        print("💰 Getting real economy data from Unity Cloud API...")

        economy_data = {
            "currencies": [],
            "inventory": [],
            "catalog": [],
            "source": "real_unity_cloud_api",
        }

        # Try to get currencies
        try:
            currencies_url = f"https://services.api.unity.com/economy/v1/projects/{self.project_id}/environments/{self.env_id}/currencies"
            response = requests.get(currencies_url, headers=self.headers, timeout=10)
            print(f"   Currencies API: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                if "data" in data:
                    economy_data["currencies"] = data["data"]
                print(f"   ✅ Found {len(economy_data['currencies'])} currencies")
            else:
                print(f"   ⚠️ Currencies API error: {response.text[:100]}")
        except Exception as e:
            print(f"   ❌ Currencies API exception: {e}")

        # Try to get inventory
        try:
            inventory_url = f"https://services.api.unity.com/economy/v1/projects/{self.project_id}/environments/{self.env_id}/inventory"
            response = requests.get(inventory_url, headers=self.headers, timeout=10)
            print(f"   Inventory API: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                if "data" in data:
                    economy_data["inventory"] = data["data"]
                print(f"   ✅ Found {len(economy_data['inventory'])} inventory items")
            else:
                print(f"   ⚠️ Inventory API error: {response.text[:100]}")
        except Exception as e:
            print(f"   ❌ Inventory API exception: {e}")

        # Try to get catalog
        try:
            catalog_url = f"https://services.api.unity.com/economy/v1/projects/{self.project_id}/environments/{self.env_id}/catalog"
            response = requests.get(catalog_url, headers=self.headers, timeout=10)
            print(f"   Catalog API: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                if "data" in data:
                    economy_data["catalog"] = data["data"]
                print(f"   ✅ Found {len(economy_data['catalog'])} catalog items")
            else:
                print(f"   ⚠️ Catalog API error: {response.text[:100]}")
        except Exception as e:
            print(f"   ❌ Catalog API exception: {e}")

        return economy_data

    def get_cloud_code_data(self):
        """Get real cloud code data using API token"""
        print("☁️ Getting real cloud code data from Unity Cloud API...")

        cloud_code_data = {"functions": [], "source": "real_unity_cloud_api"}

        # Try different API endpoints for cloud code
        endpoints = [
            f"https://services.api.unity.com/cloud-code/v1/projects/{self.project_id}/environments/{self.env_id}/functions",
            f"https://services.api.unity.com/cloud-code/v1/projects/{self.project_id}/functions",
            f"https://cloud.unity.com/api/cloud-code/v1/projects/{self.project_id}/environments/{self.env_id}/functions",
            f"https://cloud.unity.com/api/cloud-code/v1/projects/{self.project_id}/functions",
        ]

        for endpoint in endpoints:
            try:
                response = requests.get(endpoint, headers=self.headers, timeout=10)
                print(f"   Cloud Code API ({endpoint}): {response.status_code}")

                if response.status_code == 200:
                    data = response.json()
                    if "data" in data and data["data"]:
                        cloud_code_data["functions"] = data["data"]
                        print(
                            f"   ✅ Found {len(cloud_code_data['functions'])} functions"
                        )
                        break
                    elif isinstance(data, list):
                        cloud_code_data["functions"] = data
                        print(
                            f"   ✅ Found {len(cloud_code_data['functions'])} functions"
                        )
                        break
                else:
                    print(f"   ⚠️ Cloud Code API error: {response.text[:100]}")
            except Exception as e:
                print(f"   ❌ Cloud Code API exception: {e}")

        return cloud_code_data

    def get_remote_config_data(self):
        """Get real remote config data using API token"""
        print("⚙️ Getting real remote config data from Unity Cloud API...")

        remote_config_data = {"configs": [], "source": "real_unity_cloud_api"}

        # Try different API endpoints for remote config
        endpoints = [
            f"https://services.api.unity.com/remote-config/v1/projects/{self.project_id}/environments/{self.env_id}/configs",
            f"https://services.api.unity.com/remote-config/v1/projects/{self.project_id}/configs",
            f"https://cloud.unity.com/api/remote-config/v1/projects/{self.project_id}/environments/{self.env_id}/configs",
            f"https://cloud.unity.com/api/remote-config/v1/projects/{self.project_id}/configs",
        ]

        for endpoint in endpoints:
            try:
                response = requests.get(endpoint, headers=self.headers, timeout=10)
                print(f"   Remote Config API ({endpoint}): {response.status_code}")

                if response.status_code == 200:
                    data = response.json()
                    if "data" in data and data["data"]:
                        remote_config_data["configs"] = data["data"]
                        print(
                            f"   ✅ Found {len(remote_config_data['configs'])} configs"
                        )
                        break
                    elif isinstance(data, list):
                        remote_config_data["configs"] = data
                        print(
                            f"   ✅ Found {len(remote_config_data['configs'])} configs"
                        )
                        break
                else:
                    print(f"   ⚠️ Remote Config API error: {response.text[:100]}")
            except Exception as e:
                print(f"   ❌ Remote Config API exception: {e}")

        return remote_config_data

    def test_api_connection(self):
        """Test API connection and authentication"""
        print("🔐 Testing Unity Cloud API connection...")

        # Test basic API access
        test_url = f"https://services.api.unity.com/projects/{self.project_id}"
        try:
            response = requests.get(test_url, headers=self.headers, timeout=10)
            print(f"   Project API: {response.status_code}")

            if response.status_code == 200:
                print("   ✅ API connection successful")
                return True
            else:
                print(f"   ❌ API connection failed: {response.text[:200]}")
                return False
        except Exception as e:
            print(f"   ❌ API connection exception: {e}")
            return False

    def run_real_data_collection(self):
        """Run real data collection from Unity Cloud API"""
        print("=" * 80)
        print("🔐 HEADLESS UNITY CLOUD API WITH REAL CREDENTIALS")
        print("=" * 80)
        print(f"Project ID: {self.project_id}")
        print(f"Environment ID: {self.env_id}")
        print(f"Email: {self.email}")
        print(
            f"API Token: {'*' * len(self.api_token) if self.api_token else 'Not set'}"
        )
        print(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)

        # Test API connection first
        if not self.test_api_connection():
            print("\n❌ API connection failed. Cannot access real Unity Cloud data.")
            return None

        # Get real data
        economy_data = self.get_economy_data()
        cloud_code_data = self.get_cloud_code_data()
        remote_config_data = self.get_remote_config_data()

        # Display results
        print("\n📊 REAL UNITY CLOUD DATA COLLECTED:")
        print("=" * 50)

        print(f"\n💰 Economy Data ({economy_data['source']}):")
        print(f"   Currencies: {len(economy_data['currencies'])}")
        for currency in economy_data["currencies"]:
            print(
                f"      - {currency.get('id', 'unknown')}: {currency.get('name', 'Unknown')}"
            )

        print(f"   Inventory: {len(economy_data['inventory'])}")
        for item in economy_data["inventory"]:
            print(f"      - {item.get('id', 'unknown')}: {item.get('name', 'Unknown')}")

        print(f"   Catalog: {len(economy_data['catalog'])}")
        for item in economy_data["catalog"]:
            print(f"      - {item.get('id', 'unknown')}: {item.get('name', 'Unknown')}")

        print(f"\n☁️ Cloud Code Data ({cloud_code_data['source']}):")
        print(f"   Functions: {len(cloud_code_data['functions'])}")
        for func in cloud_code_data["functions"]:
            print(
                f"      - {func.get('name', 'unknown')}: {func.get('status', 'unknown')}"
            )

        print(f"\n⚙️ Remote Config Data ({remote_config_data['source']}):")
        print(f"   Configs: {len(remote_config_data['configs'])}")
        for config in remote_config_data["configs"]:
            print(
                f"      - {config.get('name', 'unknown')}: {config.get('value', 'unknown')}"
            )

        # Save results
        results = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "project_id": self.project_id,
            "environment_id": self.env_id,
            "email": self.email,
            "api_token_used": bool(self.api_token),
            "economy": economy_data,
            "cloud_code": cloud_code_data,
            "remote_config": remote_config_data,
        }

        report_path = f"monitoring/reports/real_unity_cloud_api_data_{time.strftime('%Y%m%d_%H%M%S')}.json"
        os.makedirs(os.path.dirname(report_path), exist_ok=True)

        with open(report_path, "w") as f:
            json.dump(results, f, indent=2)

        print(f"\n📁 Real data saved to: {report_path}")
        print("\n🎉 Real Unity Cloud data collection completed!")

        return results


def main():
    """Main function"""
    collector = HeadlessUnityAPIWithCredentials()
    results = collector.run_real_data_collection()

    if results:
        print("\n✅ Successfully collected real Unity Cloud data using your API token!")
    else:
        print("\n❌ Failed to collect real Unity Cloud data")


if __name__ == "__main__":
    main()
