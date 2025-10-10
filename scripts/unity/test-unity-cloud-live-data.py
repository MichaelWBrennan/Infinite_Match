#!/usr/bin/env python3
"""
Unity Cloud Live Data Tester
Tests what's actually configured in your Unity Cloud account (not local files)
"""

import json
import os
import sys
import requests
from datetime import datetime
from pathlib import Path

class UnityCloudLiveDataTester:
    def __init__(self):
        self.project_id = "0dd5a03e-7f23-49c4-964e-7919c48c0574"
        self.environment_id = "1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"
        self.organization_id = "2473931369648"
        self.email = "michaelwilliambrennan@gmail.com"
        
        # Unity Cloud API endpoints
        self.base_url = "https://services.api.unity.com"
        self.economy_url = f"{self.base_url}/economy/v1/projects/{self.project_id}/configs"
        self.remote_config_url = f"{self.base_url}/remote-config/v1/projects/{self.project_id}/environments/{self.environment_id}"
        self.cloud_code_url = f"{self.base_url}/cloud-code/v1/projects/{self.project_id}/scripts"
        
        # Results
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "project_id": self.project_id,
            "environment_id": self.environment_id,
            "organization_id": self.organization_id,
            "email": self.email,
            "live_data": {}
        }

    def print_header(self):
        print("=" * 80)
        print("🌐 UNITY CLOUD LIVE DATA TESTER")
        print("=" * 80)
        print(f"Project ID: {self.project_id}")
        print(f"Environment ID: {self.environment_id}")
        print(f"Organization ID: {self.organization_id}")
        print(f"Email: {self.email}")
        print(f"Timestamp: {self.results['timestamp']}")
        print("=" * 80)

    def test_economy_live_data(self):
        """Test what's actually configured in Unity Cloud Economy service"""
        print("\n💰 Testing Unity Cloud Economy Live Data...")
        
        economy_results = {
            "service": "Economy",
            "method": "api_call",
            "currencies": [],
            "inventory": [],
            "catalog": [],
            "status": "unknown",
            "error": None
        }
        
        try:
            # Test Economy API endpoint
            headers = {
                "Content-Type": "application/json",
                "User-Agent": "UnityCloudLiveDataTester/1.0"
            }
            
            response = requests.get(
                f"{self.economy_url}/currencies",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                economy_results["currencies"] = data
                economy_results["status"] = "accessible"
                print(f"✅ Economy Currencies: {len(data)} items found in Unity Cloud")
                for currency in data:
                    print(f"   - {currency.get('id', 'N/A')}: {currency.get('name', 'N/A')}")
            else:
                economy_results["status"] = "error"
                economy_results["error"] = f"HTTP {response.status_code}: {response.text}"
                print(f"❌ Economy Currencies: HTTP {response.status_code} - {response.text}")
                
        except requests.exceptions.RequestException as e:
            economy_results["status"] = "error"
            economy_results["error"] = str(e)
            print(f"❌ Economy Currencies: Network error - {e}")
        
        # Test inventory
        try:
            response = requests.get(
                f"{self.economy_url}/inventory",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                economy_results["inventory"] = data
                print(f"✅ Economy Inventory: {len(data)} items found in Unity Cloud")
                for item in data:
                    print(f"   - {item.get('id', 'N/A')}: {item.get('name', 'N/A')}")
            else:
                print(f"❌ Economy Inventory: HTTP {response.status_code} - {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Economy Inventory: Network error - {e}")
        
        # Test catalog
        try:
            response = requests.get(
                f"{self.economy_url}/catalog",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                economy_results["catalog"] = data
                print(f"✅ Economy Catalog: {len(data)} items found in Unity Cloud")
                for item in data:
                    print(f"   - {item.get('id', 'N/A')}: {item.get('name', 'N/A')}")
            else:
                print(f"❌ Economy Catalog: HTTP {response.status_code} - {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Economy Catalog: Network error - {e}")
        
        self.results["live_data"]["economy"] = economy_results
        return economy_results

    def test_remote_config_live_data(self):
        """Test what's actually configured in Unity Cloud Remote Config service"""
        print("\n⚙️ Testing Unity Cloud Remote Config Live Data...")
        
        remote_config_results = {
            "service": "Remote Config",
            "method": "api_call",
            "configs": [],
            "status": "unknown",
            "error": None
        }
        
        try:
            headers = {
                "Content-Type": "application/json",
                "User-Agent": "UnityCloudLiveDataTester/1.0"
            }
            
            response = requests.get(
                f"{self.remote_config_url}/configs",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                remote_config_results["configs"] = data
                remote_config_results["status"] = "accessible"
                print(f"✅ Remote Config: {len(data)} configurations found in Unity Cloud")
                for config in data:
                    print(f"   - {config.get('key', 'N/A')}: {config.get('value', 'N/A')}")
            else:
                remote_config_results["status"] = "error"
                remote_config_results["error"] = f"HTTP {response.status_code}: {response.text}"
                print(f"❌ Remote Config: HTTP {response.status_code} - {response.text}")
                
        except requests.exceptions.RequestException as e:
            remote_config_results["status"] = "error"
            remote_config_results["error"] = str(e)
            print(f"❌ Remote Config: Network error - {e}")
        
        self.results["live_data"]["remote_config"] = remote_config_results
        return remote_config_results

    def test_cloud_code_live_data(self):
        """Test what's actually configured in Unity Cloud Code service"""
        print("\n☁️ Testing Unity Cloud Code Live Data...")
        
        cloud_code_results = {
            "service": "Cloud Code",
            "method": "api_call",
            "functions": [],
            "status": "unknown",
            "error": None
        }
        
        try:
            headers = {
                "Content-Type": "application/json",
                "User-Agent": "UnityCloudLiveDataTester/1.0"
            }
            
            response = requests.get(
                f"{self.cloud_code_url}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                cloud_code_results["functions"] = data
                cloud_code_results["status"] = "accessible"
                print(f"✅ Cloud Code: {len(data)} functions found in Unity Cloud")
                for func in data:
                    print(f"   - {func.get('name', 'N/A')}: {func.get('description', 'N/A')}")
            else:
                cloud_code_results["status"] = "error"
                cloud_code_results["error"] = f"HTTP {response.status_code}: {response.text}"
                print(f"❌ Cloud Code: HTTP {response.status_code} - {response.text}")
                
        except requests.exceptions.RequestException as e:
            cloud_code_results["status"] = "error"
            cloud_code_results["error"] = str(e)
            print(f"❌ Cloud Code: Network error - {e}")
        
        self.results["live_data"]["cloud_code"] = cloud_code_results
        return cloud_code_results

    def test_project_info(self):
        """Test Unity Cloud project information"""
        print("\n🔍 Testing Unity Cloud Project Information...")
        
        project_results = {
            "service": "Project Info",
            "method": "api_call",
            "project_data": {},
            "status": "unknown",
            "error": None
        }
        
        try:
            headers = {
                "Content-Type": "application/json",
                "User-Agent": "UnityCloudLiveDataTester/1.0"
            }
            
            # Try to get project info
            response = requests.get(
                f"{self.base_url}/projects/v1/projects/{self.project_id}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                project_results["project_data"] = data
                project_results["status"] = "accessible"
                print("✅ Project Info: Found in Unity Cloud")
                print(f"   - Project Name: {data.get('name', 'N/A')}")
                print(f"   - Project ID: {data.get('id', 'N/A')}")
                print(f"   - Organization ID: {data.get('organizationId', 'N/A')}")
            else:
                project_results["status"] = "error"
                project_results["error"] = f"HTTP {response.status_code}: {response.text}"
                print(f"❌ Project Info: HTTP {response.status_code} - {response.text}")
                
        except requests.exceptions.RequestException as e:
            project_results["status"] = "error"
            project_results["error"] = str(e)
            print(f"❌ Project Info: Network error - {e}")
        
        self.results["live_data"]["project_info"] = project_results
        return project_results

    def generate_summary_report(self):
        """Generate summary report"""
        print("\n" + "=" * 80)
        print("📊 UNITY CLOUD LIVE DATA SUMMARY")
        print("=" * 80)
        
        total_services = len(self.results["live_data"])
        accessible_services = 0
        failed_services = 0
        
        for service_name, service_data in self.results["live_data"].items():
            status = service_data.get("status", "unknown")
            if status == "accessible":
                accessible_services += 1
                print(f"✅ {service_name}: ACCESSIBLE")
            elif status == "error":
                failed_services += 1
                print(f"❌ {service_name}: ERROR - {service_data.get('error', 'Unknown error')}")
            else:
                print(f"⚠️ {service_name}: {status.upper()}")
        
        print(f"\n📈 Summary:")
        print(f"   Total Services: {total_services}")
        print(f"   Accessible: {accessible_services}")
        print(f"   Failed: {failed_services}")
        print(f"   Success Rate: {(accessible_services/total_services)*100:.1f}%")
        
        if accessible_services == total_services:
            print("\n🎉 ALL SERVICES ACCESSIBLE - Your Unity Cloud account is fully accessible!")
        elif accessible_services > 0:
            print(f"\n⚠️ PARTIAL ACCESS - {accessible_services}/{total_services} services accessible")
        else:
            print("\n❌ NO ACCESS - Your Unity Cloud account is not accessible")
        
        print("=" * 80)

    def save_results(self):
        """Save test results to file"""
        results_dir = Path("/workspace/monitoring/reports")
        results_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = results_dir / f"unity_cloud_live_data_test_{timestamp}.json"
        
        with open(results_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n📁 Test results saved to: {results_file}")

    def run_all_tests(self):
        """Run all Unity Cloud live data tests"""
        self.print_header()
        
        # Test each service
        self.test_project_info()
        self.test_economy_live_data()
        self.test_remote_config_live_data()
        self.test_cloud_code_live_data()
        
        # Generate summary
        self.generate_summary_report()
        
        # Save results
        self.save_results()

def main():
    """Main function"""
    tester = UnityCloudLiveDataTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()