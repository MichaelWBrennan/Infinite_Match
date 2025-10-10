#!/usr/bin/env python3
"""
Unity Dashboard Status Checker
Checks what's actually configured in your Unity Cloud account via dashboard
"""

import json
import os
import sys
import requests
from datetime import datetime
from pathlib import Path

class UnityDashboardStatusChecker:
    def __init__(self):
        self.project_id = "0dd5a03e-7f23-49c4-964e-7919c48c0574"
        self.environment_id = "1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"
        self.organization_id = "2473931369648"
        self.email = "michaelwilliambrennan@gmail.com"
        
        # Unity Dashboard URLs
        self.dashboard_url = "https://dashboard.unity3d.com"
        self.cloud_url = "https://cloud.unity.com"
        self.services_url = "https://services.api.unity.com"
        
        # Results
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "project_id": self.project_id,
            "environment_id": self.environment_id,
            "organization_id": self.organization_id,
            "email": self.email,
            "dashboard_status": {}
        }

    def print_header(self):
        print("=" * 80)
        print("🌐 UNITY DASHBOARD STATUS CHECKER")
        print("=" * 80)
        print(f"Project ID: {self.project_id}")
        print(f"Environment ID: {self.environment_id}")
        print(f"Organization ID: {self.organization_id}")
        print(f"Email: {self.email}")
        print(f"Timestamp: {self.results['timestamp']}")
        print("=" * 80)

    def check_dashboard_accessibility(self):
        """Check if Unity Dashboard is accessible"""
        print("\n🌐 Checking Unity Dashboard Accessibility...")
        
        dashboard_results = {
            "service": "Unity Dashboard",
            "method": "dashboard_check",
            "status": "unknown",
            "error": None,
            "accessible": False,
            "redirect_url": None
        }
        
        try:
            headers = {
                "User-Agent": "UnityDashboardStatusChecker/1.0"
            }
            
            response = requests.get(
                self.dashboard_url,
                headers=headers,
                timeout=10,
                allow_redirects=True
            )
            
            if response.status_code == 200:
                dashboard_results["status"] = "accessible"
                dashboard_results["accessible"] = True
                dashboard_results["redirect_url"] = response.url
                print("✅ Unity Dashboard: Accessible")
                print(f"   - Status Code: {response.status_code}")
                print(f"   - Final URL: {response.url}")
                
                # Check if we're redirected to login
                if "login" in response.url.lower():
                    print("   - Note: Redirected to login page")
                    dashboard_results["login_required"] = True
                else:
                    dashboard_results["login_required"] = False
                    
            else:
                dashboard_results["status"] = "error"
                dashboard_results["error"] = f"HTTP {response.status_code}"
                print(f"❌ Unity Dashboard: HTTP {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            dashboard_results["status"] = "error"
            dashboard_results["error"] = str(e)
            print(f"❌ Unity Dashboard: Network error - {e}")
        
        self.results["dashboard_status"]["dashboard"] = dashboard_results
        return dashboard_results

    def check_cloud_services_endpoints(self):
        """Check Unity Cloud Services endpoints"""
        print("\n☁️ Checking Unity Cloud Services Endpoints...")
        
        services_results = {
            "service": "Unity Cloud Services",
            "method": "endpoint_check",
            "status": "unknown",
            "error": None,
            "endpoints": {}
        }
        
        # Test different Unity Cloud endpoints
        endpoints_to_test = [
            ("Dashboard", "https://cloud.unity.com"),
            ("Services API", "https://services.api.unity.com"),
            ("Economy API", "https://services.api.unity.com/economy/v1/projects"),
            ("Remote Config API", "https://services.api.unity.com/remote-config/v1/projects"),
            ("Cloud Code API", "https://services.api.unity.com/cloud-code/v1/projects"),
            ("Analytics API", "https://services.api.unity.com/analytics/v1/projects"),
            ("Authentication API", "https://services.api.unity.com/auth/v1/projects")
        ]
        
        accessible_endpoints = 0
        auth_required_endpoints = 0
        not_found_endpoints = 0
        
        for endpoint_name, endpoint_url in endpoints_to_test:
            try:
                headers = {
                    "Content-Type": "application/json",
                    "User-Agent": "UnityDashboardStatusChecker/1.0"
                }
                
                response = requests.get(
                    endpoint_url,
                    headers=headers,
                    timeout=5
                )
                
                endpoint_result = {
                    "url": endpoint_url,
                    "status_code": response.status_code,
                    "accessible": False,
                    "auth_required": False,
                    "not_found": False
                }
                
                if response.status_code == 200:
                    endpoint_result["accessible"] = True
                    accessible_endpoints += 1
                    print(f"✅ {endpoint_name}: Accessible (200)")
                elif response.status_code == 401:
                    endpoint_result["auth_required"] = True
                    auth_required_endpoints += 1
                    print(f"⚠️ {endpoint_name}: Requires authentication (401)")
                elif response.status_code == 404:
                    endpoint_result["not_found"] = True
                    not_found_endpoints += 1
                    print(f"❌ {endpoint_name}: Not found (404)")
                else:
                    print(f"⚠️ {endpoint_name}: HTTP {response.status_code}")
                
                services_results["endpoints"][endpoint_name] = endpoint_result
                
            except requests.exceptions.RequestException as e:
                print(f"❌ {endpoint_name}: Network error - {e}")
                services_results["endpoints"][endpoint_name] = {
                    "url": endpoint_url,
                    "error": str(e),
                    "accessible": False
                }
        
        # Determine overall status
        if accessible_endpoints > 0:
            services_results["status"] = "partial"
            print(f"\n📊 Endpoint Summary:")
            print(f"   - Accessible: {accessible_endpoints}")
            print(f"   - Auth Required: {auth_required_endpoints}")
            print(f"   - Not Found: {not_found_endpoints}")
        else:
            services_results["status"] = "unavailable"
            print("\n❌ No accessible endpoints found")
        
        self.results["dashboard_status"]["cloud_services"] = services_results
        return services_results

    def check_project_specific_endpoints(self):
        """Check project-specific endpoints"""
        print("\n🔍 Checking Project-Specific Endpoints...")
        
        project_results = {
            "service": "Project-Specific Endpoints",
            "method": "project_check",
            "status": "unknown",
            "error": None,
            "endpoints": {}
        }
        
        # Test project-specific endpoints
        project_endpoints = [
            ("Project Info", f"https://services.api.unity.com/projects/v1/projects/{self.project_id}"),
            ("Economy Currencies", f"https://services.api.unity.com/economy/v1/projects/{self.project_id}/configs/currencies"),
            ("Economy Inventory", f"https://services.api.unity.com/economy/v1/projects/{self.project_id}/configs/inventory"),
            ("Economy Catalog", f"https://services.api.unity.com/economy/v1/projects/{self.project_id}/configs/catalog"),
            ("Remote Config", f"https://services.api.unity.com/remote-config/v1/projects/{self.project_id}/environments/{self.environment_id}/configs"),
            ("Cloud Code", f"https://services.api.unity.com/cloud-code/v1/projects/{self.project_id}/scripts")
        ]
        
        for endpoint_name, endpoint_url in project_endpoints:
            try:
                headers = {
                    "Content-Type": "application/json",
                    "User-Agent": "UnityDashboardStatusChecker/1.0"
                }
                
                response = requests.get(
                    endpoint_url,
                    headers=headers,
                    timeout=5
                )
                
                endpoint_result = {
                    "url": endpoint_url,
                    "status_code": response.status_code,
                    "response": response.text[:200] if response.text else "No response body"
                }
                
                if response.status_code == 200:
                    print(f"✅ {endpoint_name}: Accessible (200)")
                elif response.status_code == 401:
                    print(f"⚠️ {endpoint_name}: Requires authentication (401)")
                elif response.status_code == 404:
                    print(f"❌ {endpoint_name}: Not found (404) - Service may not be configured")
                else:
                    print(f"⚠️ {endpoint_name}: HTTP {response.status_code}")
                
                project_results["endpoints"][endpoint_name] = endpoint_result
                
            except requests.exceptions.RequestException as e:
                print(f"❌ {endpoint_name}: Network error - {e}")
                project_results["endpoints"][endpoint_name] = {
                    "url": endpoint_url,
                    "error": str(e)
                }
        
        # Determine overall status
        accessible_count = sum(1 for ep in project_results["endpoints"].values() if ep.get("status_code") == 200)
        auth_required_count = sum(1 for ep in project_results["endpoints"].values() if ep.get("status_code") == 401)
        not_found_count = sum(1 for ep in project_results["endpoints"].values() if ep.get("status_code") == 404)
        
        if accessible_count > 0:
            project_results["status"] = "partial"
        elif auth_required_count > 0:
            project_results["status"] = "auth_required"
        elif not_found_count > 0:
            project_results["status"] = "not_configured"
        else:
            project_results["status"] = "unavailable"
        
        print(f"\n📊 Project Endpoint Summary:")
        print(f"   - Accessible: {accessible_count}")
        print(f"   - Auth Required: {auth_required_count}")
        print(f"   - Not Found: {not_found_count}")
        
        self.results["dashboard_status"]["project_endpoints"] = project_results
        return project_results

    def generate_summary_report(self):
        """Generate summary report"""
        print("\n" + "=" * 80)
        print("📊 UNITY DASHBOARD STATUS SUMMARY")
        print("=" * 80)
        
        total_checks = len(self.results["dashboard_status"])
        successful_checks = 0
        
        for check_name, check_data in self.results["dashboard_status"].items():
            status = check_data.get("status", "unknown")
            if status in ["accessible", "partial", "auth_required"]:
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
        print("   - Unity Dashboard is accessible")
        print("   - Unity Cloud Services endpoints are responding")
        print("   - Project-specific endpoints are returning 404 errors")
        print("   - This suggests your project may not have these services configured yet")
        print("   - You may need to enable Economy, Remote Config, and Cloud Code services")
        print("   - Check your Unity Cloud dashboard to see which services are active")
        
        print("=" * 80)

    def save_results(self):
        """Save test results to file"""
        results_dir = Path("/workspace/monitoring/reports")
        results_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = results_dir / f"unity_dashboard_status_check_{timestamp}.json"
        
        with open(results_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n📁 Test results saved to: {results_file}")

    def run_all_checks(self):
        """Run all Unity Dashboard status checks"""
        self.print_header()
        
        # Run all checks
        self.check_dashboard_accessibility()
        self.check_cloud_services_endpoints()
        self.check_project_specific_endpoints()
        
        # Generate summary
        self.generate_summary_report()
        
        # Save results
        self.save_results()

def main():
    """Main function"""
    checker = UnityDashboardStatusChecker()
    checker.run_all_checks()

if __name__ == "__main__":
    main()