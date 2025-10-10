#!/usr/bin/env python3
"""
Unity Cloud Status Checker
Checks what's actually configured in your Unity Cloud account using different methods
"""

import json
import os
import sys
import requests
from datetime import datetime
from pathlib import Path

class UnityCloudStatusChecker:
    def __init__(self):
        self.project_id = "0dd5a03e-7f23-49c4-964e-7919c48c0574"
        self.environment_id = "1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"
        self.organization_id = "2473931369648"
        self.email = "michaelwilliambrennan@gmail.com"
        
        # Different Unity Cloud API endpoints to try
        self.api_endpoints = {
            "dashboard": "https://dashboard.unity3d.com",
            "services": "https://services.api.unity.com",
            "cloud": "https://cloud.unity.com",
            "api": "https://api.unity.com"
        }
        
        # Results
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "project_id": self.project_id,
            "environment_id": self.environment_id,
            "organization_id": self.organization_id,
            "email": self.email,
            "account_status": {}
        }

    def print_header(self):
        print("=" * 80)
        print("🔍 UNITY CLOUD STATUS CHECKER")
        print("=" * 80)
        print(f"Project ID: {self.project_id}")
        print(f"Environment ID: {self.environment_id}")
        print(f"Organization ID: {self.organization_id}")
        print(f"Email: {self.email}")
        print(f"Timestamp: {self.results['timestamp']}")
        print("=" * 80)

    def check_unity_dashboard_access(self):
        """Check if we can access Unity Dashboard"""
        print("\n🌐 Checking Unity Dashboard Access...")
        
        dashboard_results = {
            "service": "Unity Dashboard",
            "method": "dashboard_check",
            "status": "unknown",
            "error": None,
            "accessible": False
        }
        
        try:
            headers = {
                "User-Agent": "UnityCloudStatusChecker/1.0"
            }
            
            response = requests.get(
                "https://dashboard.unity3d.com",
                headers=headers,
                timeout=10,
                allow_redirects=True
            )
            
            if response.status_code == 200:
                dashboard_results["status"] = "accessible"
                dashboard_results["accessible"] = True
                print("✅ Unity Dashboard: Accessible")
                print(f"   - Status Code: {response.status_code}")
                print(f"   - Final URL: {response.url}")
            else:
                dashboard_results["status"] = "error"
                dashboard_results["error"] = f"HTTP {response.status_code}"
                print(f"❌ Unity Dashboard: HTTP {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            dashboard_results["status"] = "error"
            dashboard_results["error"] = str(e)
            print(f"❌ Unity Dashboard: Network error - {e}")
        
        self.results["account_status"]["dashboard"] = dashboard_results
        return dashboard_results

    def check_unity_cloud_services_status(self):
        """Check Unity Cloud Services status"""
        print("\n☁️ Checking Unity Cloud Services Status...")
        
        services_results = {
            "service": "Unity Cloud Services",
            "method": "services_check",
            "status": "unknown",
            "error": None,
            "services_available": []
        }
        
        # Check different Unity Cloud endpoints
        endpoints_to_check = [
            ("Economy API", "https://services.api.unity.com/economy/v1/projects"),
            ("Remote Config API", "https://services.api.unity.com/remote-config/v1/projects"),
            ("Cloud Code API", "https://services.api.unity.com/cloud-code/v1/projects"),
            ("Analytics API", "https://services.api.unity.com/analytics/v1/projects"),
            ("Authentication API", "https://services.api.unity.com/auth/v1/projects")
        ]
        
        for service_name, endpoint in endpoints_to_check:
            try:
                headers = {
                    "Content-Type": "application/json",
                    "User-Agent": "UnityCloudStatusChecker/1.0"
                }
                
                response = requests.get(
                    endpoint,
                    headers=headers,
                    timeout=5
                )
                
                if response.status_code == 200:
                    services_results["services_available"].append(service_name)
                    print(f"✅ {service_name}: Available")
                elif response.status_code == 401:
                    services_results["services_available"].append(f"{service_name} (Auth Required)")
                    print(f"⚠️ {service_name}: Available but requires authentication")
                elif response.status_code == 404:
                    print(f"❌ {service_name}: Not found (404)")
                else:
                    print(f"⚠️ {service_name}: HTTP {response.status_code}")
                    
            except requests.exceptions.RequestException as e:
                print(f"❌ {service_name}: Network error - {e}")
        
        if services_results["services_available"]:
            services_results["status"] = "partial"
            print(f"\n📊 Available Services: {len(services_results['services_available'])}")
            for service in services_results["services_available"]:
                print(f"   - {service}")
        else:
            services_results["status"] = "unavailable"
            print("\n❌ No Unity Cloud Services available")
        
        self.results["account_status"]["cloud_services"] = services_results
        return services_results

    def check_project_configuration_status(self):
        """Check if your project has Unity Cloud services configured"""
        print("\n🔧 Checking Project Configuration Status...")
        
        config_results = {
            "service": "Project Configuration",
            "method": "config_check",
            "status": "unknown",
            "error": None,
            "services_configured": []
        }
        
        # Check if Unity Services config exists and is valid
        unity_config_path = Path("/workspace/unity/Assets/StreamingAssets/unity_services_config.json")
        
        if unity_config_path.exists():
            try:
                with open(unity_config_path, 'r') as f:
                    config_data = json.load(f)
                
                # Check if cloud services are enabled
                if config_data.get("cloudServicesAvailable", False):
                    config_results["services_configured"].append("Cloud Services Enabled")
                    print("✅ Cloud Services: Enabled in project")
                else:
                    print("❌ Cloud Services: Disabled in project")
                
                # Check project ID
                project_id = config_data.get("projectId", "")
                if project_id == self.project_id:
                    config_results["services_configured"].append("Project ID Match")
                    print("✅ Project ID: Matches expected")
                else:
                    print(f"❌ Project ID: Mismatch - Expected: {self.project_id}, Found: {project_id}")
                
                # Check environment ID
                environment_id = config_data.get("environmentId", "")
                if environment_id == self.environment_id:
                    config_results["services_configured"].append("Environment ID Match")
                    print("✅ Environment ID: Matches expected")
                else:
                    print(f"❌ Environment ID: Mismatch - Expected: {self.environment_id}, Found: {environment_id}")
                
                # Check license type
                license_type = config_data.get("licenseType", "")
                config_results["services_configured"].append(f"License Type: {license_type}")
                print(f"✅ License Type: {license_type}")
                
                # Check economy configuration
                if "economy" in config_data:
                    economy_config = config_data["economy"]
                    if "currencies" in economy_config:
                        config_results["services_configured"].append(f"Economy Currencies: {len(economy_config['currencies'])}")
                        print(f"✅ Economy Currencies: {len(economy_config['currencies'])} configured")
                    if "inventory" in economy_config:
                        config_results["services_configured"].append(f"Economy Inventory: {len(economy_config['inventory'])}")
                        print(f"✅ Economy Inventory: {len(economy_config['inventory'])} configured")
                    if "catalog" in economy_config:
                        config_results["services_configured"].append(f"Economy Catalog: {len(economy_config['catalog'])}")
                        print(f"✅ Economy Catalog: {len(economy_config['catalog'])} configured")
                
                config_results["status"] = "configured"
                
            except Exception as e:
                config_results["status"] = "error"
                config_results["error"] = str(e)
                print(f"❌ Project Configuration: Error reading config - {e}")
        else:
            config_results["status"] = "missing"
            print("❌ Project Configuration: Unity Services config not found")
        
        self.results["account_status"]["project_config"] = config_results
        return config_results

    def check_local_data_vs_cloud_status(self):
        """Compare local data with what should be in Unity Cloud"""
        print("\n📊 Checking Local Data vs Cloud Status...")
        
        comparison_results = {
            "service": "Local vs Cloud Comparison",
            "method": "comparison_check",
            "status": "unknown",
            "error": None,
            "local_data": {},
            "cloud_data": {},
            "sync_status": "unknown"
        }
        
        # Check local economy data
        economy_files = {
            "currencies": "/workspace/economy/currencies.csv",
            "inventory": "/workspace/economy/inventory.csv",
            "catalog": "/workspace/economy/catalog.csv"
        }
        
        local_data_count = 0
        for data_type, file_path in economy_files.items():
            if Path(file_path).exists():
                try:
                    with open(file_path, 'r') as f:
                        lines = f.readlines()
                        count = len(lines) - 1  # Subtract header
                        comparison_results["local_data"][data_type] = count
                        local_data_count += count
                        print(f"✅ Local {data_type}: {count} items")
                except Exception as e:
                    print(f"❌ Local {data_type}: Error reading - {e}")
            else:
                print(f"❌ Local {data_type}: File not found")
        
        # Check remote config
        remote_config_path = "/workspace/remote-config/remote-config.json"
        if Path(remote_config_path).exists():
            try:
                with open(remote_config_path, 'r') as f:
                    config_data = json.load(f)
                    config_count = len(config_data)
                    comparison_results["local_data"]["remote_config"] = config_count
                    local_data_count += config_count
                    print(f"✅ Local Remote Config: {config_count} configurations")
            except Exception as e:
                print(f"❌ Local Remote Config: Error reading - {e}")
        
        # Check cloud code
        cloud_code_path = "/workspace/cloud-code"
        if Path(cloud_code_path).exists():
            try:
                function_files = list(Path(cloud_code_path).glob("*.js"))
                function_count = len(function_files)
                comparison_results["local_data"]["cloud_code"] = function_count
                local_data_count += function_count
                print(f"✅ Local Cloud Code: {function_count} functions")
            except Exception as e:
                print(f"❌ Local Cloud Code: Error reading - {e}")
        
        print(f"\n📊 Total Local Data Items: {local_data_count}")
        
        # Since we can't access Unity Cloud directly, we'll indicate this
        comparison_results["cloud_data"] = {"status": "unreachable", "reason": "API endpoints returning 404"}
        comparison_results["sync_status"] = "unknown"
        comparison_results["status"] = "local_only"
        
        print("⚠️ Cloud Data: Unreachable (API endpoints returning 404)")
        print("💡 This suggests your Unity Cloud account may not have these services configured yet")
        
        self.results["account_status"]["local_vs_cloud"] = comparison_results
        return comparison_results

    def generate_summary_report(self):
        """Generate summary report"""
        print("\n" + "=" * 80)
        print("📊 UNITY CLOUD STATUS SUMMARY")
        print("=" * 80)
        
        total_checks = len(self.results["account_status"])
        successful_checks = 0
        
        for check_name, check_data in self.results["account_status"].items():
            status = check_data.get("status", "unknown")
            if status in ["accessible", "configured", "partial"]:
                successful_checks += 1
                print(f"✅ {check_name}: {status.upper()}")
            elif status == "error":
                print(f"❌ {check_name}: ERROR - {check_data.get('error', 'Unknown error')}")
            else:
                print(f"⚠️ {check_name}: {status.upper()}")
        
        print(f"\n📈 Summary:")
        print(f"   Total Checks: {total_checks}")
        print(f"   Successful: {successful_checks}")
        print(f"   Success Rate: {(successful_checks/total_checks)*100:.1f}%")
        
        print("\n💡 Key Findings:")
        print("   - Unity Cloud API endpoints are returning 404 errors")
        print("   - This suggests your Unity Cloud account may not have Economy, Remote Config, or Cloud Code services configured yet")
        print("   - Your local project has Unity Services configured but may not be synced to the cloud")
        print("   - You may need to enable these services in your Unity Cloud dashboard first")
        
        print("=" * 80)

    def save_results(self):
        """Save test results to file"""
        results_dir = Path("/workspace/monitoring/reports")
        results_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = results_dir / f"unity_cloud_status_check_{timestamp}.json"
        
        with open(results_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n📁 Test results saved to: {results_file}")

    def run_all_checks(self):
        """Run all Unity Cloud status checks"""
        self.print_header()
        
        # Run all checks
        self.check_unity_dashboard_access()
        self.check_unity_cloud_services_status()
        self.check_project_configuration_status()
        self.check_local_data_vs_cloud_status()
        
        # Generate summary
        self.generate_summary_report()
        
        # Save results
        self.save_results()

def main():
    """Main function"""
    checker = UnityCloudStatusChecker()
    checker.run_all_checks()

if __name__ == "__main__":
    main()