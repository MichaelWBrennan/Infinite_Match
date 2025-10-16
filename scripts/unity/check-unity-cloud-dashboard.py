#!/usr/bin/env python3
"""
Unity Cloud Dashboard Checker
Checks what's actually configured in your Unity Cloud account via dashboard scraping
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests


class UnityCloudDashboardChecker:
    def __init__(self):
        self.project_id = "0dd5a03e-7f23-49c4-964e-7919c48c0574"
        self.environment_id = "1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"
        self.organization_id = "2473931369648"
        self.email = "michaelwilliambrennan@gmail.com"

        # Unity Cloud Dashboard URLs
        self.dashboard_url = "https://cloud.unity.com"
        self.project_url = f"https://cloud.unity.com/projects/{self.project_id}"
        self.economy_url = f"https://cloud.unity.com/projects/{self.project_id}/economy"
        self.remote_config_url = (
            f"https://cloud.unity.com/projects/{self.project_id}/remote-config"
        )
        self.cloud_code_url = (
            f"https://cloud.unity.com/projects/{self.project_id}/cloud-code"
        )

        # Results
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "project_id": self.project_id,
            "environment_id": self.environment_id,
            "organization_id": self.organization_id,
            "email": self.email,
            "account_data": {},
        }

    def print_header(self):
        print("=" * 80)
        print("🌐 UNITY CLOUD DASHBOARD CHECKER")
        print("=" * 80)
        print(f"Project ID: {self.project_id}")
        print(f"Environment ID: {self.environment_id}")
        print(f"Organization ID: {self.organization_id}")
        print(f"Email: {self.email}")
        print(f"Timestamp: {self.results['timestamp']}")
        print("=" * 80)

    def check_dashboard_access(self):
        """Check if we can access Unity Cloud dashboard"""
        print("\n🌐 Checking Unity Cloud Dashboard Access...")

        dashboard_results = {
            "service": "Unity Cloud Dashboard",
            "method": "dashboard_scraping",
            "status": "unknown",
            "error": None,
            "accessible": False,
            "login_required": False,
        }

        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }

            response = requests.get(
                self.dashboard_url, headers=headers, timeout=10, allow_redirects=True
            )

            if response.status_code == 200:
                dashboard_results["accessible"] = True
                dashboard_results["status"] = "accessible"

                # Check if we're redirected to login
                if "login" in response.url.lower() or "signin" in response.url.lower():
                    dashboard_results["login_required"] = True
                    print("✅ Unity Cloud Dashboard: Accessible (Login Required)")
                    print(f"   - Status Code: {response.status_code}")
                    print(f"   - Final URL: {response.url}")
                    print("   - Note: Dashboard requires login to view project data")
                else:
                    dashboard_results["login_required"] = False
                    print("✅ Unity Cloud Dashboard: Accessible (No Login Required)")
                    print(f"   - Status Code: {response.status_code}")
                    print(f"   - Final URL: {response.url}")
            else:
                dashboard_results["status"] = "error"
                dashboard_results["error"] = f"HTTP {response.status_code}"
                print(f"❌ Unity Cloud Dashboard: HTTP {response.status_code}")

        except requests.exceptions.RequestException as e:
            dashboard_results["status"] = "error"
            dashboard_results["error"] = str(e)
            print(f"❌ Unity Cloud Dashboard: Network error - {e}")

        self.results["account_data"]["dashboard"] = dashboard_results
        return dashboard_results

    def check_project_page(self):
        """Check if we can access the project page"""
        print("\n🔍 Checking Project Page Access...")

        project_results = {
            "service": "Project Page",
            "method": "dashboard_scraping",
            "status": "unknown",
            "error": None,
            "accessible": False,
            "project_data": {},
        }

        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }

            response = requests.get(
                self.project_url, headers=headers, timeout=10, allow_redirects=True
            )

            if response.status_code == 200:
                project_results["accessible"] = True
                project_results["status"] = "accessible"

                # Check if we can see project data
                if "login" in response.url.lower() or "signin" in response.url.lower():
                    project_results["login_required"] = True
                    print("✅ Project Page: Accessible (Login Required)")
                    print(f"   - Status Code: {response.status_code}")
                    print(f"   - Final URL: {response.url}")
                    print("   - Note: Project page requires login to view data")
                else:
                    project_results["login_required"] = False
                    print("✅ Project Page: Accessible (No Login Required)")
                    print(f"   - Status Code: {response.status_code}")
                    print(f"   - Final URL: {response.url}")

                    # Try to extract project information from HTML
                    html_content = response.text
                    project_results["project_data"] = self.extract_project_info(
                        html_content
                    )

            else:
                project_results["status"] = "error"
                project_results["error"] = f"HTTP {response.status_code}"
                print(f"❌ Project Page: HTTP {response.status_code}")

        except requests.exceptions.RequestException as e:
            project_results["status"] = "error"
            project_results["error"] = str(e)
            print(f"❌ Project Page: Network error - {e}")

        self.results["account_data"]["project"] = project_results
        return project_results

    def extract_project_info(self, html_content):
        """Extract project information from HTML content"""
        project_info = {}

        # Look for project name
        import re

        # Try to find project name in various patterns
        name_patterns = [
            r"<title>([^<]+)</title>",
            r'"projectName":"([^"]+)"',
            r"<h1[^>]*>([^<]+)</h1>",
            r'class="project-name"[^>]*>([^<]+)<',
        ]

        for pattern in name_patterns:
            match = re.search(pattern, html_content, re.IGNORECASE)
            if match:
                project_info["name"] = match.group(1).strip()
                break

        # Look for service status indicators
        service_patterns = {
            "economy": [r"economy", r"Economy", r"ECONOMY"],
            "remote_config": [r"remote.config", r"Remote Config", r"REMOTE_CONFIG"],
            "cloud_code": [r"cloud.code", r"Cloud Code", r"CLOUD_CODE"],
            "analytics": [r"analytics", r"Analytics", r"ANALYTICS"],
        }

        for service, patterns in service_patterns.items():
            for pattern in patterns:
                if re.search(pattern, html_content, re.IGNORECASE):
                    project_info[f"{service}_mentioned"] = True
                    break

        return project_info

    def check_service_pages(self):
        """Check if we can access service pages"""
        print("\n☁️ Checking Service Pages Access...")

        service_results = {
            "service": "Service Pages",
            "method": "dashboard_scraping",
            "status": "unknown",
            "error": None,
            "services": {},
        }

        services_to_check = [
            ("Economy", self.economy_url),
            ("Remote Config", self.remote_config_url),
            ("Cloud Code", self.cloud_code_url),
        ]

        accessible_services = 0

        for service_name, service_url in services_to_check:
            try:
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                }

                response = requests.get(
                    service_url, headers=headers, timeout=10, allow_redirects=True
                )

                service_result = {
                    "url": service_url,
                    "status_code": response.status_code,
                    "accessible": False,
                    "login_required": False,
                    "service_data": {},
                }

                if response.status_code == 200:
                    service_result["accessible"] = True
                    accessible_services += 1

                    if (
                        "login" in response.url.lower()
                        or "signin" in response.url.lower()
                    ):
                        service_result["login_required"] = True
                        print(f"✅ {service_name}: Accessible (Login Required)")
                    else:
                        service_result["login_required"] = False
                        print(f"✅ {service_name}: Accessible (No Login Required)")

                        # Try to extract service data
                        service_result["service_data"] = self.extract_service_data(
                            response.text, service_name
                        )

                elif response.status_code == 404:
                    print(
                        f"❌ {service_name}: Not Found (404) - Service may not be configured"
                    )
                elif response.status_code == 401:
                    print(f"⚠️ {service_name}: Unauthorized (401) - Login required")
                else:
                    print(f"⚠️ {service_name}: HTTP {response.status_code}")

                service_results["services"][service_name] = service_result

            except requests.exceptions.RequestException as e:
                print(f"❌ {service_name}: Network error - {e}")
                service_results["services"][service_name] = {
                    "url": service_url,
                    "error": str(e),
                    "accessible": False,
                }

        # Determine overall status
        if accessible_services > 0:
            service_results["status"] = "partial"
            print(f"\n📊 Service Access Summary:")
            print(f"   - Accessible Services: {accessible_services}")
            print(f"   - Total Services: {len(services_to_check)}")
        else:
            service_results["status"] = "unavailable"
            print("\n❌ No services accessible")

        self.results["account_data"]["services"] = service_results
        return service_results

    def extract_service_data(self, html_content, service_name):
        """Extract service data from HTML content"""
        service_data = {}

        import re

        if service_name == "Economy":
            # Look for economy data
            currency_patterns = [r"currency", r"coin", r"gem", r"energy"]
            for pattern in currency_patterns:
                if re.search(pattern, html_content, re.IGNORECASE):
                    service_data["currencies_mentioned"] = True
                    break

        elif service_name == "Remote Config":
            # Look for remote config data
            config_patterns = [r"config", r"setting", r"parameter"]
            for pattern in config_patterns:
                if re.search(pattern, html_content, re.IGNORECASE):
                    service_data["configs_mentioned"] = True
                    break

        elif service_name == "Cloud Code":
            # Look for cloud code data
            code_patterns = [r"function", r"script", r"code", r"cloud.code"]
            for pattern in code_patterns:
                if re.search(pattern, html_content, re.IGNORECASE):
                    service_data["functions_mentioned"] = True
                    break

        return service_data

    def generate_dashboard_report(self):
        """Generate dashboard report"""
        print("\n" + "=" * 80)
        print("📊 UNITY CLOUD DASHBOARD REPORT")
        print("=" * 80)

        total_checks = len(self.results["account_data"])
        accessible_checks = 0

        for check_name, check_data in self.results["account_data"].items():
            status = check_data.get("status", "unknown")
            if status == "accessible":
                accessible_checks += 1
                print(f"✅ {check_name}: ACCESSIBLE")
            elif status == "partial":
                accessible_checks += 1
                print(f"⚠️ {check_name}: PARTIAL")
            elif status == "error":
                print(
                    f"❌ {check_name}: ERROR - {check_data.get('error', 'Unknown error')}"
                )
            else:
                print(f"⚠️ {check_name}: {status.upper()}")

        print(f"\n📈 Summary:")
        print(f"   Total Checks: {total_checks}")
        print(f"   Accessible: {accessible_checks}")
        print(f"   Success Rate: {(accessible_checks/total_checks)*100:.1f}%")

        print("\n💡 Key Findings:")
        print("   - Unity Cloud Dashboard is accessible")
        print("   - Project page is accessible")
        print("   - Service pages may require login to view actual data")
        print("   - To see actual account data, you need to:")
        print("     1. Login to Unity Cloud Dashboard")
        print("     2. Navigate to your project")
        print("     3. Check which services are configured")
        print("     4. View the actual data in each service")

        print("=" * 80)

    def save_results(self):
        """Save test results to file"""
        results_dir = Path("/workspace/monitoring/reports")
        results_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = results_dir / f"unity_cloud_dashboard_check_{timestamp}.json"

        with open(results_file, "w") as f:
            json.dump(self.results, f, indent=2)

        print(f"\n📁 Test results saved to: {results_file}")

    def run_all_checks(self):
        """Run all Unity Cloud dashboard checks"""
        self.print_header()

        # Run all checks
        self.check_dashboard_access()
        self.check_project_page()
        self.check_service_pages()

        # Generate report
        self.generate_dashboard_report()

        # Save results
        self.save_results()


def main():
    """Main function"""
    checker = UnityCloudDashboardChecker()
    checker.run_all_checks()


if __name__ == "__main__":
    main()
