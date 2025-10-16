#!/usr/bin/env python3
"""
Unity Cloud Data Extractor
Extracts actual data from Unity Cloud dashboard without using APIs
"""

import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests


class UnityCloudDataExtractor:
    def __init__(self):
        self.project_id = "0dd5a03e-7f23-49c4-964e-7919c48c0574"
        self.environment_id = "1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"
        self.organization_id = "2473931369648"
        self.email = "michaelwilliambrennan@gmail.com"

        # Unity Cloud Dashboard URLs
        self.base_url = "https://cloud.unity.com"
        self.project_url = f"{self.base_url}/projects/{self.project_id}"
        self.economy_url = f"{self.base_url}/projects/{self.project_id}/economy"
        self.remote_config_url = (
            f"{self.base_url}/projects/{self.project_id}/remote-config"
        )
        self.cloud_code_url = f"{self.base_url}/projects/{self.project_id}/cloud-code"
        self.analytics_url = f"{self.base_url}/projects/{self.project_id}/analytics"

        # Results
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "project_id": self.project_id,
            "environment_id": self.environment_id,
            "organization_id": self.organization_id,
            "email": self.email,
            "extracted_data": {},
        }

    def print_header(self):
        print("=" * 80)
        print("🔍 UNITY CLOUD DATA EXTRACTOR")
        print("=" * 80)
        print(f"Project ID: {self.project_id}")
        print(f"Environment ID: {self.environment_id}")
        print(f"Organization ID: {self.organization_id}")
        print(f"Email: {self.email}")
        print(f"Timestamp: {self.results['timestamp']}")
        print("=" * 80)

    def extract_project_info(self):
        """Extract project information from Unity Cloud dashboard"""
        print("\n🔍 Extracting Project Information...")

        project_info = {
            "service": "Project Information",
            "method": "dashboard_extraction",
            "status": "unknown",
            "error": None,
            "project_data": {},
        }

        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
            }

            response = requests.get(
                self.project_url, headers=headers, timeout=15, allow_redirects=True
            )

            if response.status_code == 200:
                html_content = response.text

                # Extract project information
                project_data = self.parse_project_html(html_content)
                project_info["project_data"] = project_data
                project_info["status"] = "extracted"

                print("✅ Project Information: Extracted from dashboard")
                print(f"   - Project Name: {project_data.get('name', 'N/A')}")
                print(f"   - Project ID: {project_data.get('id', 'N/A')}")
                print(
                    f"   - Organization ID: {project_data.get('organization_id', 'N/A')}"
                )
                print(
                    f"   - Services Configured: {len(project_data.get('services', []))}"
                )

                for service in project_data.get("services", []):
                    print(f"     - {service}")

            elif response.status_code == 404:
                project_info["status"] = "not_found"
                project_info["error"] = "Project not found"
                print("❌ Project Information: Project not found (404)")
            elif response.status_code == 401:
                project_info["status"] = "unauthorized"
                project_info["error"] = "Login required"
                print("⚠️ Project Information: Login required (401)")
            else:
                project_info["status"] = "error"
                project_info["error"] = f"HTTP {response.status_code}"
                print(f"❌ Project Information: HTTP {response.status_code}")

        except requests.exceptions.RequestException as e:
            project_info["status"] = "error"
            project_info["error"] = str(e)
            print(f"❌ Project Information: Network error - {e}")

        self.results["extracted_data"]["project"] = project_info
        return project_info

    def parse_project_html(self, html_content):
        """Parse project information from HTML content"""
        project_data = {
            "name": "Unknown",
            "id": self.project_id,
            "organization_id": self.organization_id,
            "services": [],
        }

        # Extract project name
        name_patterns = [
            r"<title>([^<]+)</title>",
            r'"projectName":"([^"]+)"',
            r"<h1[^>]*>([^<]+)</h1>",
            r'class="project-name"[^>]*>([^<]+)<',
            r'<span[^>]*class="[^"]*project[^"]*"[^>]*>([^<]+)</span>',
        ]

        for pattern in name_patterns:
            match = re.search(pattern, html_content, re.IGNORECASE)
            if match:
                project_data["name"] = match.group(1).strip()
                break

        # Extract services
        service_patterns = {
            "Economy": [r"economy", r"Economy", r"ECONOMY"],
            "Remote Config": [r"remote.config", r"Remote Config", r"REMOTE_CONFIG"],
            "Cloud Code": [r"cloud.code", r"Cloud Code", r"CLOUD_CODE"],
            "Analytics": [r"analytics", r"Analytics", r"ANALYTICS"],
            "Authentication": [r"authentication", r"Authentication", r"AUTHENTICATION"],
        }

        for service_name, patterns in service_patterns.items():
            for pattern in patterns:
                if re.search(pattern, html_content, re.IGNORECASE):
                    project_data["services"].append(service_name)
                    break

        return project_data

    def extract_economy_data(self):
        """Extract economy data from Unity Cloud dashboard"""
        print("\n💰 Extracting Economy Data...")

        economy_data = {
            "service": "Economy",
            "method": "dashboard_extraction",
            "status": "unknown",
            "error": None,
            "economy_data": {},
        }

        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
            }

            response = requests.get(
                self.economy_url, headers=headers, timeout=15, allow_redirects=True
            )

            if response.status_code == 200:
                html_content = response.text

                # Extract economy data
                economy_info = self.parse_economy_html(html_content)
                economy_data["economy_data"] = economy_info
                economy_data["status"] = "extracted"

                print("✅ Economy Data: Extracted from dashboard")
                print(f"   - Currencies: {len(economy_info.get('currencies', []))}")
                print(f"   - Inventory Items: {len(economy_info.get('inventory', []))}")
                print(f"   - Catalog Items: {len(economy_info.get('catalog', []))}")

                for currency in economy_info.get("currencies", []):
                    print(f"     - {currency}")

            elif response.status_code == 404:
                economy_data["status"] = "not_configured"
                economy_data["error"] = "Economy service not configured"
                print("❌ Economy Data: Service not configured (404)")
            elif response.status_code == 401:
                economy_data["status"] = "unauthorized"
                economy_data["error"] = "Login required"
                print("⚠️ Economy Data: Login required (401)")
            else:
                economy_data["status"] = "error"
                economy_data["error"] = f"HTTP {response.status_code}"
                print(f"❌ Economy Data: HTTP {response.status_code}")

        except requests.exceptions.RequestException as e:
            economy_data["status"] = "error"
            economy_data["error"] = str(e)
            print(f"❌ Economy Data: Network error - {e}")

        self.results["extracted_data"]["economy"] = economy_data
        return economy_data

    def parse_economy_html(self, html_content):
        """Parse economy data from HTML content"""
        economy_info = {"currencies": [], "inventory": [], "catalog": []}

        # Look for currency data
        currency_patterns = [
            r"currency[^>]*>([^<]+)<",
            r"coin[^>]*>([^<]+)<",
            r"gem[^>]*>([^<]+)<",
            r"energy[^>]*>([^<]+)<",
        ]

        for pattern in currency_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                if match.strip() and len(match.strip()) > 1:
                    economy_info["currencies"].append(match.strip())

        # Look for inventory data
        inventory_patterns = [
            r"inventory[^>]*>([^<]+)<",
            r"booster[^>]*>([^<]+)<",
            r"pack[^>]*>([^<]+)<",
        ]

        for pattern in inventory_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                if match.strip() and len(match.strip()) > 1:
                    economy_info["inventory"].append(match.strip())

        # Look for catalog data
        catalog_patterns = [
            r"catalog[^>]*>([^<]+)<",
            r"purchase[^>]*>([^<]+)<",
            r"buy[^>]*>([^<]+)<",
        ]

        for pattern in catalog_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                if match.strip() and len(match.strip()) > 1:
                    economy_info["catalog"].append(match.strip())

        return economy_info

    def extract_remote_config_data(self):
        """Extract remote config data from Unity Cloud dashboard"""
        print("\n⚙️ Extracting Remote Config Data...")

        remote_config_data = {
            "service": "Remote Config",
            "method": "dashboard_extraction",
            "status": "unknown",
            "error": None,
            "config_data": {},
        }

        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
            }

            response = requests.get(
                self.remote_config_url,
                headers=headers,
                timeout=15,
                allow_redirects=True,
            )

            if response.status_code == 200:
                html_content = response.text

                # Extract remote config data
                config_info = self.parse_remote_config_html(html_content)
                remote_config_data["config_data"] = config_info
                remote_config_data["status"] = "extracted"

                print("✅ Remote Config Data: Extracted from dashboard")
                print(f"   - Configurations: {len(config_info.get('configs', []))}")

                for config in config_info.get("configs", []):
                    print(f"     - {config}")

            elif response.status_code == 404:
                remote_config_data["status"] = "not_configured"
                remote_config_data["error"] = "Remote Config service not configured"
                print("❌ Remote Config Data: Service not configured (404)")
            elif response.status_code == 401:
                remote_config_data["status"] = "unauthorized"
                remote_config_data["error"] = "Login required"
                print("⚠️ Remote Config Data: Login required (401)")
            else:
                remote_config_data["status"] = "error"
                remote_config_data["error"] = f"HTTP {response.status_code}"
                print(f"❌ Remote Config Data: HTTP {response.status_code}")

        except requests.exceptions.RequestException as e:
            remote_config_data["status"] = "error"
            remote_config_data["error"] = str(e)
            print(f"❌ Remote Config Data: Network error - {e}")

        self.results["extracted_data"]["remote_config"] = remote_config_data
        return remote_config_data

    def parse_remote_config_html(self, html_content):
        """Parse remote config data from HTML content"""
        config_info = {"configs": []}

        # Look for configuration data
        config_patterns = [
            r"config[^>]*>([^<]+)<",
            r"setting[^>]*>([^<]+)<",
            r"parameter[^>]*>([^<]+)<",
            r"value[^>]*>([^<]+)<",
        ]

        for pattern in config_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                if match.strip() and len(match.strip()) > 1:
                    config_info["configs"].append(match.strip())

        return config_info

    def extract_cloud_code_data(self):
        """Extract cloud code data from Unity Cloud dashboard"""
        print("\n☁️ Extracting Cloud Code Data...")

        cloud_code_data = {
            "service": "Cloud Code",
            "method": "dashboard_extraction",
            "status": "unknown",
            "error": None,
            "functions": [],
        }

        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
            }

            response = requests.get(
                self.cloud_code_url, headers=headers, timeout=15, allow_redirects=True
            )

            if response.status_code == 200:
                html_content = response.text

                # Extract cloud code data
                functions_info = self.parse_cloud_code_html(html_content)
                cloud_code_data["functions"] = functions_info
                cloud_code_data["status"] = "extracted"

                print("✅ Cloud Code Data: Extracted from dashboard")
                print(f"   - Functions: {len(functions_info)}")

                for func in functions_info:
                    print(f"     - {func}")

            elif response.status_code == 404:
                cloud_code_data["status"] = "not_configured"
                cloud_code_data["error"] = "Cloud Code service not configured"
                print("❌ Cloud Code Data: Service not configured (404)")
            elif response.status_code == 401:
                cloud_code_data["status"] = "unauthorized"
                cloud_code_data["error"] = "Login required"
                print("⚠️ Cloud Code Data: Login required (401)")
            else:
                cloud_code_data["status"] = "error"
                cloud_code_data["error"] = f"HTTP {response.status_code}"
                print(f"❌ Cloud Code Data: HTTP {response.status_code}")

        except requests.exceptions.RequestException as e:
            cloud_code_data["status"] = "error"
            cloud_code_data["error"] = str(e)
            print(f"❌ Cloud Code Data: Network error - {e}")

        self.results["extracted_data"]["cloud_code"] = cloud_code_data
        return cloud_code_data

    def parse_cloud_code_html(self, html_content):
        """Parse cloud code data from HTML content"""
        functions = []

        # Look for function data
        function_patterns = [
            r"function[^>]*>([^<]+)<",
            r"script[^>]*>([^<]+)<",
            r"code[^>]*>([^<]+)<",
            r"cloud.code[^>]*>([^<]+)<",
        ]

        for pattern in function_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                if match.strip() and len(match.strip()) > 1:
                    functions.append(match.strip())

        return functions

    def generate_extraction_report(self):
        """Generate extraction report"""
        print("\n" + "=" * 80)
        print("📊 UNITY CLOUD DATA EXTRACTION REPORT")
        print("=" * 80)

        total_services = len(self.results["extracted_data"])
        extracted_services = 0

        for service_name, service_data in self.results["extracted_data"].items():
            status = service_data.get("status", "unknown")
            if status == "extracted":
                extracted_services += 1
                print(f"✅ {service_name}: EXTRACTED")
            elif status == "not_configured":
                print(f"❌ {service_name}: NOT CONFIGURED")
            elif status == "unauthorized":
                print(f"⚠️ {service_name}: LOGIN REQUIRED")
            elif status == "error":
                print(
                    f"❌ {service_name}: ERROR - {service_data.get('error', 'Unknown error')}"
                )
            else:
                print(f"⚠️ {service_name}: {status.upper()}")

        print(f"\n📈 Summary:")
        print(f"   Total Services: {total_services}")
        print(f"   Extracted: {extracted_services}")
        print(f"   Success Rate: {(extracted_services/total_services)*100:.1f}%")

        if extracted_services == total_services:
            print("\n🎉 FULL EXTRACTION - Successfully extracted all Unity Cloud data!")
        elif extracted_services > 0:
            print(
                f"\n⚠️ PARTIAL EXTRACTION - Extracted {extracted_services}/{total_services} services"
            )
        else:
            print("\n❌ NO EXTRACTION - Could not extract any Unity Cloud data")

        print("\n💡 Next Steps:")
        print(
            "   - If services show 'LOGIN REQUIRED', you need to login to Unity Cloud Dashboard"
        )
        print(
            "   - If services show 'NOT CONFIGURED', you need to enable them in your project"
        )
        print(
            "   - If services show 'ERROR', check your internet connection and try again"
        )

        print("=" * 80)

    def save_results(self):
        """Save test results to file"""
        results_dir = Path("/workspace/monitoring/reports")
        results_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = results_dir / f"unity_cloud_data_extraction_{timestamp}.json"

        with open(results_file, "w") as f:
            json.dump(self.results, f, indent=2)

        print(f"\n📁 Test results saved to: {results_file}")

    def run_all_extractions(self):
        """Run all Unity Cloud data extractions"""
        self.print_header()

        # Extract data from each service
        self.extract_project_info()
        self.extract_economy_data()
        self.extract_remote_config_data()
        self.extract_cloud_code_data()

        # Generate report
        self.generate_extraction_report()

        # Save results
        self.save_results()


def main():
    """Main function"""
    extractor = UnityCloudDataExtractor()
    extractor.run_all_extractions()


if __name__ == "__main__":
    main()
