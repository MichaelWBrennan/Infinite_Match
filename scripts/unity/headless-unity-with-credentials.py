#!/usr/bin/env python3
"""
Headless Unity Cloud Reader with Credentials
Reads what's actually on your Unity Cloud account using your stored credentials
"""

import json
import os
import sys
import requests
from datetime import datetime
from pathlib import Path
import re
from urllib.parse import urljoin, urlparse

class HeadlessUnityWithCredentials:
    def __init__(self):
        self.project_id = "0dd5a03e-7f23-49c4-964e-7919c48c0574"
        self.environment_id = "1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"
        self.organization_id = "2473931369648"
        self.email = "michaelwilliambrennan@gmail.com"
        
        # Unity Cloud API endpoints (using credentials)
        self.base_url = "https://services.api.unity.com"
        self.economy_url = f"{self.base_url}/economy/v1/projects/{self.project_id}"
        self.remote_config_url = f"{self.base_url}/remote-config/v1/projects/{self.project_id}/environments/{self.environment_id}"
        self.cloud_code_url = f"{self.base_url}/cloud-code/v1/projects/{self.project_id}"
        
        # Results
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "project_id": self.project_id,
            "environment_id": self.environment_id,
            "organization_id": self.organization_id,
            "email": self.email,
            "authenticated_account_data": {}
        }

    def print_header(self):
        print("=" * 80)
        print("🔐 HEADLESS UNITY CLOUD READER WITH CREDENTIALS")
        print("=" * 80)
        print(f"Project ID: {self.project_id}")
        print(f"Environment ID: {self.environment_id}")
        print(f"Organization ID: {self.organization_id}")
        print(f"Email: {self.email}")
        print(f"Timestamp: {self.results['timestamp']}")
        print("=" * 80)

    def get_unity_credentials(self):
        """Get Unity credentials from secrets"""
        print("\n🔐 Getting Unity credentials from secrets...")
        
        try:
            # Try to get credentials from Cursor secrets
            import subprocess
            result = subprocess.run(['cursor', 'getSecret', 'UNITY_CLIENT_ID'], 
                                 capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                client_id = result.stdout.strip()
                print("   ✅ UNITY_CLIENT_ID found")
            else:
                print("   ❌ UNITY_CLIENT_ID not found")
                return None
            
            result = subprocess.run(['cursor', 'getSecret', 'UNITY_CLIENT_SECRET'], 
                                 capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                client_secret = result.stdout.strip()
                print("   ✅ UNITY_CLIENT_SECRET found")
            else:
                print("   ❌ UNITY_CLIENT_SECRET not found")
                return None
            
            return {
                "client_id": client_id,
                "client_secret": client_secret
            }
            
        except Exception as e:
            print(f"   ❌ Error getting credentials: {e}")
            return None

    def authenticate_with_unity(self, credentials):
        """Authenticate with Unity Cloud using credentials"""
        print("\n🔑 Authenticating with Unity Cloud...")
        
        try:
            # Get access token from Unity
            auth_url = "https://services.api.unity.com/auth/v1/token"
            auth_data = {
                "grant_type": "client_credentials",
                "client_id": credentials["client_id"],
                "client_secret": credentials["client_secret"]
            }
            
            response = requests.post(auth_url, data=auth_data, timeout=15)
            
            if response.status_code == 200:
                token_data = response.json()
                access_token = token_data.get("access_token")
                print("   ✅ Authentication successful")
                return access_token
            else:
                print(f"   ❌ Authentication failed: HTTP {response.status_code}")
                print(f"   Response: {response.text}")
                return None
                
        except Exception as e:
            print(f"   ❌ Authentication error: {e}")
            return None

    def read_authenticated_economy_data(self, access_token):
        """Read economy data using authenticated access"""
        print("\n💰 Reading Economy Data (Authenticated)...")
        
        economy_data = {
            "service": "Economy",
            "method": "authenticated_api",
            "status": "unknown",
            "error": None,
            "authenticated_data": {}
        }
        
        try:
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            # Try to read currencies
            print("   - Reading currencies...")
            currencies_response = requests.get(
                f"{self.economy_url}/configs/currencies",
                headers=headers,
                timeout=15
            )
            
            if currencies_response.status_code == 200:
                currencies_data = currencies_response.json()
                economy_data["authenticated_data"]["currencies"] = currencies_data
                print(f"   ✅ Currencies: Found {len(currencies_data)} items")
                for currency in currencies_data:
                    print(f"     - {currency.get('id', 'N/A')}: {currency.get('name', 'N/A')}")
            else:
                print(f"   ❌ Currencies: HTTP {currencies_response.status_code} - {currencies_response.text}")
            
            # Try to read inventory
            print("   - Reading inventory...")
            inventory_response = requests.get(
                f"{self.economy_url}/configs/inventory",
                headers=headers,
                timeout=15
            )
            
            if inventory_response.status_code == 200:
                inventory_data = inventory_response.json()
                economy_data["authenticated_data"]["inventory"] = inventory_data
                print(f"   ✅ Inventory: Found {len(inventory_data)} items")
                for item in inventory_data:
                    print(f"     - {item.get('id', 'N/A')}: {item.get('name', 'N/A')}")
            else:
                print(f"   ❌ Inventory: HTTP {inventory_response.status_code} - {inventory_response.text}")
            
            # Try to read catalog
            print("   - Reading catalog...")
            catalog_response = requests.get(
                f"{self.economy_url}/configs/catalog",
                headers=headers,
                timeout=15
            )
            
            if catalog_response.status_code == 200:
                catalog_data = catalog_response.json()
                economy_data["authenticated_data"]["catalog"] = catalog_data
                print(f"   ✅ Catalog: Found {len(catalog_data)} items")
                for item in catalog_data:
                    print(f"     - {item.get('id', 'N/A')}: {item.get('name', 'N/A')}")
            else:
                print(f"   ❌ Catalog: HTTP {catalog_response.status_code} - {catalog_response.text}")
            
            # Determine status
            if economy_data["authenticated_data"]:
                economy_data["status"] = "success"
                print("✅ Economy Data: Successfully read from Unity Cloud with authentication")
            else:
                economy_data["status"] = "no_data"
                economy_data["error"] = "No economy data found in Unity Cloud"
                print("❌ Economy Data: No data found in Unity Cloud")
                
        except Exception as e:
            economy_data["status"] = "error"
            economy_data["error"] = str(e)
            print(f"❌ Economy Data: Error - {e}")
        
        self.results["authenticated_account_data"]["economy"] = economy_data
        return economy_data

    def read_authenticated_remote_config_data(self, access_token):
        """Read remote config data using authenticated access"""
        print("\n⚙️ Reading Remote Config Data (Authenticated)...")
        
        remote_config_data = {
            "service": "Remote Config",
            "method": "authenticated_api",
            "status": "unknown",
            "error": None,
            "authenticated_data": {}
        }
        
        try:
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            # Try to read remote config
            print("   - Reading remote config...")
            config_response = requests.get(
                f"{self.remote_config_url}/configs",
                headers=headers,
                timeout=15
            )
            
            if config_response.status_code == 200:
                config_data = config_response.json()
                remote_config_data["authenticated_data"]["configs"] = config_data
                print(f"   ✅ Remote Config: Found {len(config_data)} configurations")
                for config in config_data:
                    print(f"     - {config.get('key', 'N/A')}: {config.get('value', 'N/A')}")
            else:
                print(f"   ❌ Remote Config: HTTP {config_response.status_code} - {config_response.text}")
            
            # Determine status
            if remote_config_data["authenticated_data"]:
                remote_config_data["status"] = "success"
                print("✅ Remote Config Data: Successfully read from Unity Cloud with authentication")
            else:
                remote_config_data["status"] = "no_data"
                remote_config_data["error"] = "No remote config data found in Unity Cloud"
                print("❌ Remote Config Data: No data found in Unity Cloud")
                
        except Exception as e:
            remote_config_data["status"] = "error"
            remote_config_data["error"] = str(e)
            print(f"❌ Remote Config Data: Error - {e}")
        
        self.results["authenticated_account_data"]["remote_config"] = remote_config_data
        return remote_config_data

    def read_authenticated_cloud_code_data(self, access_token):
        """Read cloud code data using authenticated access"""
        print("\n☁️ Reading Cloud Code Data (Authenticated)...")
        
        cloud_code_data = {
            "service": "Cloud Code",
            "method": "authenticated_api",
            "status": "unknown",
            "error": None,
            "authenticated_data": {}
        }
        
        try:
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            # Try to read cloud code functions
            print("   - Reading cloud code functions...")
            functions_response = requests.get(
                f"{self.cloud_code_url}/scripts",
                headers=headers,
                timeout=15
            )
            
            if functions_response.status_code == 200:
                functions_data = functions_response.json()
                cloud_code_data["authenticated_data"]["functions"] = functions_data
                print(f"   ✅ Cloud Code: Found {len(functions_data)} functions")
                for func in functions_data:
                    print(f"     - {func.get('name', 'N/A')}: {func.get('description', 'N/A')}")
            else:
                print(f"   ❌ Cloud Code: HTTP {functions_response.status_code} - {functions_response.text}")
            
            # Determine status
            if cloud_code_data["authenticated_data"]:
                cloud_code_data["status"] = "success"
                print("✅ Cloud Code Data: Successfully read from Unity Cloud with authentication")
            else:
                cloud_code_data["status"] = "no_data"
                cloud_code_data["error"] = "No cloud code data found in Unity Cloud"
                print("❌ Cloud Code Data: No data found in Unity Cloud")
                
        except Exception as e:
            cloud_code_data["status"] = "error"
            cloud_code_data["error"] = str(e)
            print(f"❌ Cloud Code Data: Error - {e}")
        
        self.results["authenticated_account_data"]["cloud_code"] = cloud_code_data
        return cloud_code_data

    def generate_authenticated_report(self):
        """Generate authenticated report"""
        print("\n" + "=" * 80)
        print("📊 AUTHENTICATED UNITY CLOUD ACCOUNT REPORT")
        print("=" * 80)
        
        total_services = len(self.results["authenticated_account_data"])
        successful_services = 0
        no_data_services = 0
        error_services = 0
        
        for service_name, service_data in self.results["authenticated_account_data"].items():
            status = service_data.get("status", "unknown")
            if status == "success":
                successful_services += 1
                print(f"✅ {service_name}: SUCCESS - Data found in Unity Cloud")
            elif status == "no_data":
                no_data_services += 1
                print(f"❌ {service_name}: NO DATA - Nothing configured in Unity Cloud")
            elif status == "error":
                error_services += 1
                print(f"❌ {service_name}: ERROR - {service_data.get('error', 'Unknown error')}")
            else:
                print(f"⚠️ {service_name}: {status.upper()}")
        
        print(f"\n📈 Summary:")
        print(f"   Total Services: {total_services}")
        print(f"   Success: {successful_services}")
        print(f"   No Data: {no_data_services}")
        print(f"   Errors: {error_services}")
        print(f"   Success Rate: {(successful_services/total_services)*100:.1f}%")
        
        if successful_services == total_services:
            print("\n🎉 FULL SUCCESS - All services have data in Unity Cloud!")
        elif successful_services > 0:
            print(f"\n⚠️ PARTIAL SUCCESS - {successful_services}/{total_services} services have data")
        else:
            print("\n❌ NO DATA - No services have data configured in Unity Cloud")
        
        print("\n💡 What this means:")
        if successful_services > 0:
            print("   - Your Unity Cloud account has actual data configured")
            print("   - This is what's really on your account (read with authentication)")
            print("   - Your credentials are working correctly")
        else:
            print("   - Your Unity Cloud account may not have data configured yet")
            print("   - You may need to deploy your local data to Unity Cloud")
            print("   - Or there may be an issue with the API endpoints")
        
        print("=" * 80)

    def save_results(self):
        """Save test results to file"""
        results_dir = Path("/workspace/monitoring/reports")
        results_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = results_dir / f"authenticated_unity_cloud_reader_{timestamp}.json"
        
        with open(results_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n📁 Test results saved to: {results_file}")

    def run_all_reads(self):
        """Run all authenticated Unity Cloud reads"""
        self.print_header()
        
        # Get credentials
        credentials = self.get_unity_credentials()
        if not credentials:
            print("❌ Could not get Unity credentials. Exiting.")
            return
        
        # Authenticate
        access_token = self.authenticate_with_unity(credentials)
        if not access_token:
            print("❌ Could not authenticate with Unity Cloud. Exiting.")
            return
        
        # Read data from each service using authentication
        self.read_authenticated_economy_data(access_token)
        self.read_authenticated_remote_config_data(access_token)
        self.read_authenticated_cloud_code_data(access_token)
        
        # Generate report
        self.generate_authenticated_report()
        
        # Save results
        self.save_results()

def main():
    """Main function"""
    reader = HeadlessUnityWithCredentials()
    reader.run_all_reads()

if __name__ == "__main__":
    main()