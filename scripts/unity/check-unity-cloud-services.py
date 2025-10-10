#!/usr/bin/env python3
"""
Unity Cloud Services Checker
Checks what services are actually enabled in your Unity Cloud account
"""

import json
import os
import sys
import requests
from datetime import datetime
from pathlib import Path
import re

class UnityCloudServicesChecker:
    def __init__(self):
        self.project_id = "0dd5a03e-7f23-49c4-964e-7919c48c0574"
        self.environment_id = "1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"
        self.organization_id = "2473931369648"
        self.email = "michaelwilliambrennan@gmail.com"
        
        # Unity Cloud Dashboard URLs
        self.base_url = "https://cloud.unity.com"
        self.project_url = f"{self.base_url}/projects/{self.project_id}"
        
        # Results
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "project_id": self.project_id,
            "environment_id": self.environment_id,
            "organization_id": self.organization_id,
            "email": self.email,
            "services_status": {}
        }

    def print_header(self):
        print("=" * 80)
        print("🔍 UNITY CLOUD SERVICES CHECKER")
        print("=" * 80)
        print(f"Project ID: {self.project_id}")
        print(f"Environment ID: {self.environment_id}")
        print(f"Organization ID: {self.organization_id}")
        print(f"Email: {self.email}")
        print(f"Timestamp: {self.results['timestamp']}")
        print("=" * 80)

    def check_service_endpoints(self):
        """Check if service endpoints are accessible"""
        print("\n🔍 Checking Unity Cloud Service Endpoints...")
        
        services_to_check = {
            "Economy": [
                f"{self.base_url}/projects/{self.project_id}/economy",
                f"{self.base_url}/projects/{self.project_id}/economy/currencies",
                f"{self.base_url}/projects/{self.project_id}/economy/inventory",
                f"{self.base_url}/projects/{self.project_id}/economy/catalog"
            ],
            "Remote Config": [
                f"{self.base_url}/projects/{self.project_id}/remote-config",
                f"{self.base_url}/projects/{self.project_id}/remote-config/configs"
            ],
            "Cloud Code": [
                f"{self.base_url}/projects/{self.project_id}/cloud-code",
                f"{self.base_url}/projects/{self.project_id}/cloud-code/functions"
            ],
            "Analytics": [
                f"{self.base_url}/projects/{self.project_id}/analytics"
            ]
        }
        
        service_status = {}
        
        for service_name, endpoints in services_to_check.items():
            print(f"\n📊 Checking {service_name}...")
            
            service_result = {
                "service": service_name,
                "endpoints": {},
                "status": "unknown",
                "enabled": False
            }
            
            accessible_endpoints = 0
            auth_required_endpoints = 0
            not_found_endpoints = 0
            
            for endpoint in endpoints:
                try:
                    headers = {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                        "Accept-Language": "en-US,en;q=0.9",
                        "Accept-Encoding": "gzip, deflate, br",
                        "Connection": "keep-alive",
                        "Upgrade-Insecure-Requests": "1"
                    }
                    
                    response = requests.get(endpoint, headers=headers, timeout=10)
                    
                    endpoint_result = {
                        "url": endpoint,
                        "status_code": response.status_code,
                        "accessible": False,
                        "auth_required": False,
                        "not_found": False,
                        "service_enabled": False
                    }
                    
                    if response.status_code == 200:
                        endpoint_result["accessible"] = True
                        accessible_endpoints += 1
                        
                        # Check if the response contains service-specific content
                        if self.check_service_content(response.text, service_name):
                            endpoint_result["service_enabled"] = True
                            print(f"   ✅ {endpoint}: Accessible and service enabled")
                        else:
                            print(f"   ✅ {endpoint}: Accessible but service may not be configured")
                            
                    elif response.status_code == 401:
                        endpoint_result["auth_required"] = True
                        auth_required_endpoints += 1
                        print(f"   ⚠️ {endpoint}: Requires authentication (401)")
                    elif response.status_code == 404:
                        endpoint_result["not_found"] = True
                        not_found_endpoints += 1
                        print(f"   ❌ {endpoint}: Not found (404) - Service may not be enabled")
                    else:
                        print(f"   ⚠️ {endpoint}: HTTP {response.status_code}")
                    
                    service_result["endpoints"][endpoint] = endpoint_result
                    
                except requests.exceptions.RequestException as e:
                    print(f"   ❌ {endpoint}: Network error - {e}")
                    service_result["endpoints"][endpoint] = {
                        "url": endpoint,
                        "error": str(e),
                        "accessible": False
                    }
            
            # Determine service status
            if accessible_endpoints > 0:
                service_result["status"] = "accessible"
                service_result["enabled"] = True
                print(f"   📊 {service_name}: ACCESSIBLE ({accessible_endpoints} endpoints)")
            elif auth_required_endpoints > 0:
                service_result["status"] = "auth_required"
                service_result["enabled"] = True  # Likely enabled but needs auth
                print(f"   📊 {service_name}: AUTH REQUIRED ({auth_required_endpoints} endpoints)")
            elif not_found_endpoints > 0:
                service_result["status"] = "not_enabled"
                service_result["enabled"] = False
                print(f"   📊 {service_name}: NOT ENABLED ({not_found_endpoints} endpoints)")
            else:
                service_result["status"] = "unknown"
                service_result["enabled"] = False
                print(f"   📊 {service_name}: UNKNOWN STATUS")
            
            service_status[service_name] = service_result
        
        self.results["services_status"] = service_status
        return service_status

    def check_service_content(self, html_content, service_name):
        """Check if HTML content indicates the service is enabled"""
        if service_name == "Economy":
            # Look for economy-specific content
            economy_indicators = [
                r'economy',
                r'currency',
                r'coin',
                r'gem',
                r'inventory',
                r'catalog',
                r'purchase',
                r'buy'
            ]
            
            for indicator in economy_indicators:
                if re.search(indicator, html_content, re.IGNORECASE):
                    return True
                    
        elif service_name == "Remote Config":
            # Look for remote config-specific content
            config_indicators = [
                r'remote.config',
                r'config',
                r'setting',
                r'parameter',
                r'value'
            ]
            
            for indicator in config_indicators:
                if re.search(indicator, html_content, re.IGNORECASE):
                    return True
                    
        elif service_name == "Cloud Code":
            # Look for cloud code-specific content
            code_indicators = [
                r'cloud.code',
                r'function',
                r'script',
                r'code',
                r'javascript'
            ]
            
            for indicator in code_indicators:
                if re.search(indicator, html_content, re.IGNORECASE):
                    return True
                    
        elif service_name == "Analytics":
            # Look for analytics-specific content
            analytics_indicators = [
                r'analytics',
                r'event',
                r'tracking',
                r'metric',
                r'data'
            ]
            
            for indicator in analytics_indicators:
                if re.search(indicator, html_content, re.IGNORECASE):
                    return True
        
        return False

    def generate_services_report(self):
        """Generate services report"""
        print("\n" + "=" * 80)
        print("📊 UNITY CLOUD SERVICES REPORT")
        print("=" * 80)
        
        total_services = len(self.results["services_status"])
        enabled_services = 0
        accessible_services = 0
        
        for service_name, service_data in self.results["services_status"].items():
            status = service_data.get("status", "unknown")
            enabled = service_data.get("enabled", False)
            
            if enabled:
                enabled_services += 1
                print(f"✅ {service_name}: ENABLED")
            elif status == "accessible":
                accessible_services += 1
                print(f"⚠️ {service_name}: ACCESSIBLE (may need configuration)")
            elif status == "auth_required":
                print(f"⚠️ {service_name}: AUTH REQUIRED (likely enabled)")
            elif status == "not_enabled":
                print(f"❌ {service_name}: NOT ENABLED")
            else:
                print(f"⚠️ {service_name}: {status.upper()}")
        
        print(f"\n📈 Summary:")
        print(f"   Total Services: {total_services}")
        print(f"   Enabled: {enabled_services}")
        print(f"   Accessible: {accessible_services}")
        print(f"   Success Rate: {((enabled_services + accessible_services)/total_services)*100:.1f}%")
        
        if enabled_services == total_services:
            print("\n🎉 ALL SERVICES ENABLED - Your Unity Cloud account has all services configured!")
        elif enabled_services > 0:
            print(f"\n✅ PARTIAL ENABLEMENT - {enabled_services}/{total_services} services are enabled")
        else:
            print("\n❌ NO SERVICES ENABLED - You need to enable services in Unity Cloud Dashboard")
        
        print("\n💡 Next Steps:")
        if enabled_services < total_services:
            print("   1. Go to Unity Cloud Dashboard")
            print("   2. Navigate to your project")
            print("   3. Enable the missing services")
            print("   4. Run this check again to verify")
        else:
            print("   1. Your services are enabled!")
            print("   2. You can now deploy your local data")
            print("   3. Run: npm run unity:deploy")
        
        print("=" * 80)

    def save_results(self):
        """Save test results to file"""
        results_dir = Path("/workspace/monitoring/reports")
        results_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = results_dir / f"unity_cloud_services_check_{timestamp}.json"
        
        with open(results_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n📁 Test results saved to: {results_file}")

    def run_all_checks(self):
        """Run all Unity Cloud services checks"""
        self.print_header()
        
        # Check all services
        self.check_service_endpoints()
        
        # Generate report
        self.generate_services_report()
        
        # Save results
        self.save_results()

def main():
    """Main function"""
    checker = UnityCloudServicesChecker()
    checker.run_all_checks()

if __name__ == "__main__":
    main()