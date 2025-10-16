#!/usr/bin/env python3
"""
Headless Real Account Access
Uses your actual Unity Cloud credentials to show real account data
"""

import json
import os
import time

import requests


class HeadlessRealAccountAccess:
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

    def check_account_access(self):
        """Check if we can access your Unity Cloud account"""
        print("🔐 Checking Unity Cloud account access...")

        # Test basic project access
        project_url = f"https://cloud.unity.com/api/projects/{self.project_id}"
        try:
            response = requests.get(project_url, headers=self.headers, timeout=10)
            if response.status_code == 200:
                print("   ✅ Project accessible")
                return True
            else:
                print(f"   ❌ Project access failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"   ❌ Project access exception: {e}")
            return False

    def initialize_services(self):
        """Initialize Unity Cloud services"""
        print("🔧 Initializing Unity Cloud services...")

        services = ["economy", "cloud-code", "remote-config"]
        initialized = []

        for service in services:
            try:
                init_url = f"https://cloud.unity.com/api/projects/{self.project_id}/environments/{self.env_id}/{service}/init"
                response = requests.post(
                    init_url, headers=self.headers, json={}, timeout=10
                )

                if response.status_code in [200, 201]:
                    print(f"   ✅ {service} service initialized")
                    initialized.append(service)
                else:
                    print(f"   ⚠️ {service} service: {response.status_code}")
            except Exception as e:
                print(f"   ❌ {service} service exception: {e}")

        return initialized

    def get_economy_data(self):
        """Get real economy data from your account"""
        print("💰 Getting real economy data...")

        economy_data = {
            "currencies": [],
            "inventory": [],
            "catalog": [],
            "source": "real_unity_cloud",
        }

        # Check currencies
        try:
            url = f"https://services.api.unity.com/economy/v1/projects/{self.project_id}/environments/{self.env_id}/currencies"
            response = requests.get(url, headers=self.headers, timeout=10)
            print(f"   Currencies: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                economy_data["currencies"] = data.get("data", [])
                print(f"   ✅ Found {len(economy_data['currencies'])} currencies")
            elif response.status_code == 404:
                print("   ❌ No currencies found (account is empty)")
            else:
                print(f"   ⚠️ Currencies error: {response.text[:100]}")
        except Exception as e:
            print(f"   ❌ Currencies exception: {e}")

        # Check inventory
        try:
            url = f"https://services.api.unity.com/economy/v1/projects/{self.project_id}/environments/{self.env_id}/inventory"
            response = requests.get(url, headers=self.headers, timeout=10)
            print(f"   Inventory: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                economy_data["inventory"] = data.get("data", [])
                print(f"   ✅ Found {len(economy_data['inventory'])} inventory items")
            elif response.status_code == 404:
                print("   ❌ No inventory found (account is empty)")
            else:
                print(f"   ⚠️ Inventory error: {response.text[:100]}")
        except Exception as e:
            print(f"   ❌ Inventory exception: {e}")

        # Check catalog
        try:
            url = f"https://services.api.unity.com/economy/v1/projects/{self.project_id}/environments/{self.env_id}/catalog"
            response = requests.get(url, headers=self.headers, timeout=10)
            print(f"   Catalog: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                economy_data["catalog"] = data.get("data", [])
                print(f"   ✅ Found {len(economy_data['catalog'])} catalog items")
            elif response.status_code == 404:
                print("   ❌ No catalog found (account is empty)")
            else:
                print(f"   ⚠️ Catalog error: {response.text[:100]}")
        except Exception as e:
            print(f"   ❌ Catalog exception: {e}")

        return economy_data

    def get_cloud_code_data(self):
        """Get real cloud code data from your account"""
        print("☁️ Getting real cloud code data...")

        cloud_code_data = {"functions": [], "source": "real_unity_cloud"}

        # Try different endpoints
        endpoints = [
            f"https://services.api.unity.com/cloud-code/v1/projects/{self.project_id}/environments/{self.env_id}/functions",
            f"https://cloud.unity.com/api/cloud-code/v1/projects/{self.project_id}/environments/{self.env_id}/functions",
        ]

        for endpoint in endpoints:
            try:
                response = requests.get(endpoint, headers=self.headers, timeout=10)
                print(
                    f"   Cloud Code ({endpoint.split('/')[-1]}): {response.status_code}"
                )

                if response.status_code == 200:
                    data = response.json()
                    functions = data.get("data", []) if isinstance(data, dict) else data
                    cloud_code_data["functions"] = functions
                    print(f"   ✅ Found {len(functions)} functions")
                    break
                elif response.status_code == 404:
                    print("   ❌ No functions found (account is empty)")
                else:
                    print(f"   ⚠️ Cloud Code error: {response.text[:100]}")
            except Exception as e:
                print(f"   ❌ Cloud Code exception: {e}")

        return cloud_code_data

    def get_remote_config_data(self):
        """Get real remote config data from your account"""
        print("⚙️ Getting real remote config data...")

        remote_config_data = {"configs": [], "source": "real_unity_cloud"}

        # Try different endpoints
        endpoints = [
            f"https://services.api.unity.com/remote-config/v1/projects/{self.project_id}/environments/{self.env_id}/configs",
            f"https://cloud.unity.com/api/remote-config/v1/projects/{self.project_id}/environments/{self.env_id}/configs",
        ]

        for endpoint in endpoints:
            try:
                response = requests.get(endpoint, headers=self.headers, timeout=10)
                print(
                    f"   Remote Config ({endpoint.split('/')[-1]}): {response.status_code}"
                )

                if response.status_code == 200:
                    data = response.json()
                    configs = data.get("data", []) if isinstance(data, dict) else data
                    remote_config_data["configs"] = configs
                    print(f"   ✅ Found {len(configs)} configs")
                    break
                elif response.status_code == 404:
                    print("   ❌ No configs found (account is empty)")
                elif response.status_code == 401:
                    print("   ❌ Unauthorized (auth issue)")
                else:
                    print(f"   ⚠️ Remote Config error: {response.text[:100]}")
            except Exception as e:
                print(f"   ❌ Remote Config exception: {e}")

        return remote_config_data

    def run_real_account_access(self):
        """Run real account access"""
        print("=" * 80)
        print("🔐 HEADLESS REAL UNITY CLOUD ACCOUNT ACCESS")
        print("=" * 80)
        print(f"Project ID: {self.project_id}")
        print(f"Environment ID: {self.env_id}")
        print(f"Email: {self.email}")
        print(
            f"API Token: {'*' * len(self.api_token) if self.api_token else 'Not set'}"
        )
        print(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)

        # Check account access
        if not self.check_account_access():
            print("\n❌ Cannot access Unity Cloud account")
            return None

        # Initialize services
        initialized = self.initialize_services()
        print(f"\n✅ Initialized {len(initialized)} services: {', '.join(initialized)}")

        # Get real data
        economy_data = self.get_economy_data()
        cloud_code_data = self.get_cloud_code_data()
        remote_config_data = self.get_remote_config_data()

        # Display results
        print("\n📊 REAL UNITY CLOUD ACCOUNT DATA:")
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
                f"      - {func.get('name', 'unknown')}: {func.get('status', 'Unknown')}"
            )

        print(f"\n⚙️ Remote Config Data ({remote_config_data['source']}):")
        print(f"   Configs: {len(remote_config_data['configs'])}")
        for config in remote_config_data["configs"]:
            print(
                f"      - {config.get('name', 'unknown')}: {config.get('value', 'Unknown')}"
            )

        # Summary
        total_items = (
            len(economy_data["currencies"])
            + len(economy_data["inventory"])
            + len(economy_data["catalog"])
            + len(cloud_code_data["functions"])
            + len(remote_config_data["configs"])
        )

        print(f"\n🎯 ACCOUNT SUMMARY:")
        print(f"   Total Items: {total_items}")
        if total_items == 0:
            print("   Status: EMPTY - Your account has no data configured")
            print("   Next Step: Deploy your local data to Unity Cloud")
        else:
            print("   Status: HAS DATA - Your account contains configured data")

        # Save results
        results = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "project_id": self.project_id,
            "environment_id": self.env_id,
            "email": self.email,
            "account_accessible": True,
            "services_initialized": initialized,
            "economy": economy_data,
            "cloud_code": cloud_code_data,
            "remote_config": remote_config_data,
            "total_items": total_items,
        }

        report_path = f"monitoring/reports/real_account_access_{time.strftime('%Y%m%d_%H%M%S')}.json"
        os.makedirs(os.path.dirname(report_path), exist_ok=True)

        with open(report_path, "w") as f:
            json.dump(results, f, indent=2)

        print(f"\n📁 Real account data saved to: {report_path}")
        print("\n🎉 Real Unity Cloud account access completed!")

        return results


def main():
    """Main function"""
    access = HeadlessRealAccountAccess()
    results = access.run_real_account_access()

    if results:
        print("\n✅ Successfully accessed your real Unity Cloud account!")
    else:
        print("\n❌ Failed to access your real Unity Cloud account")


if __name__ == "__main__":
    main()
