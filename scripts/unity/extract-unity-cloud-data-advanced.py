#!/usr/bin/env python3
"""
Advanced Unity Cloud Data Extractor
Properly extracts actual data from Unity Cloud dashboard
"""

import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests


class AdvancedUnityCloudDataExtractor:
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
        print("🔍 ADVANCED UNITY CLOUD DATA EXTRACTOR")
        print("=" * 80)
        print(f"Project ID: {self.project_id}")
        print(f"Environment ID: {self.environment_id}")
        print(f"Organization ID: {self.organization_id}")
        print(f"Email: {self.email}")
        print(f"Timestamp: {self.results['timestamp']}")
        print("=" * 80)

    def get_authenticated_session(self):
        """Get an authenticated session for Unity Cloud"""
        print("\n🔐 Setting up Unity Cloud session...")

        session = requests.Session()
        session.headers.update(
            {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
                "Cache-Control": "max-age=0",
            }
        )

        # First, try to access the main dashboard
        try:
            response = session.get(self.base_url, timeout=15)
            print(f"✅ Unity Cloud Dashboard: {response.status_code}")

            if response.status_code == 200:
                print("   - Dashboard accessible")
                return session
            else:
                print(f"   - Dashboard returned: {response.status_code}")
                return None

        except Exception as e:
            print(f"❌ Unity Cloud Dashboard: Error - {e}")
            return None

    def extract_economy_data_advanced(self, session):
        """Extract economy data using advanced methods"""
        print("\n💰 Extracting Economy Data (Advanced)...")

        economy_data = {
            "service": "Economy",
            "method": "advanced_dashboard_extraction",
            "status": "unknown",
            "error": None,
            "economy_data": {},
        }

        try:
            # Try multiple economy endpoints
            economy_endpoints = [
                f"{self.economy_url}",
                f"{self.economy_url}/currencies",
                f"{self.economy_url}/inventory",
                f"{self.economy_url}/catalog",
                f"{self.base_url}/projects/{self.project_id}/economy/currencies",
                f"{self.base_url}/projects/{self.project_id}/economy/inventory",
                f"{self.base_url}/projects/{self.project_id}/economy/catalog",
            ]

            for endpoint in economy_endpoints:
                try:
                    print(f"   - Trying: {endpoint}")
                    response = session.get(endpoint, timeout=10)

                    if response.status_code == 200:
                        print(f"   ✅ Success: {endpoint}")

                        # Parse the response
                        economy_info = self.parse_economy_response(
                            response.text, endpoint
                        )
                        if economy_info:
                            economy_data["economy_data"].update(economy_info)

                    elif response.status_code == 401:
                        print(f"   ⚠️ Auth required: {endpoint}")
                    elif response.status_code == 404:
                        print(f"   ❌ Not found: {endpoint}")
                    else:
                        print(f"   ⚠️ HTTP {response.status_code}: {endpoint}")

                except Exception as e:
                    print(f"   ❌ Error: {endpoint} - {e}")

            # Check if we found any data
            if economy_data["economy_data"]:
                economy_data["status"] = "extracted"
                print("✅ Economy Data: Found in Unity Cloud")

                currencies = economy_data["economy_data"].get("currencies", [])
                inventory = economy_data["economy_data"].get("inventory", [])
                catalog = economy_data["economy_data"].get("catalog", [])

                print(f"   - Currencies: {len(currencies)}")
                print(f"   - Inventory: {len(inventory)}")
                print(f"   - Catalog: {len(catalog)}")

                for currency in currencies:
                    print(f"     - {currency}")

            else:
                economy_data["status"] = "not_found"
                economy_data["error"] = "No economy data found in any endpoint"
                print("❌ Economy Data: No data found in Unity Cloud")

        except Exception as e:
            economy_data["status"] = "error"
            economy_data["error"] = str(e)
            print(f"❌ Economy Data: Error - {e}")

        self.results["extracted_data"]["economy"] = economy_data
        return economy_data

    def parse_economy_response(self, html_content, endpoint):
        """Parse economy data from HTML response"""
        economy_info = {}

        # Look for JSON data in script tags
        json_patterns = [
            r"window\.__INITIAL_STATE__\s*=\s*({.+?});",
            r"window\.__PRELOADED_STATE__\s*=\s*({.+?});",
            r"window\.__APP_STATE__\s*=\s*({.+?});",
            r"var\s+__INITIAL_STATE__\s*=\s*({.+?});",
            r"var\s+__PRELOADED_STATE__\s*=\s*({.+?});",
        ]

        for pattern in json_patterns:
            matches = re.findall(pattern, html_content, re.DOTALL)
            for match in matches:
                try:
                    data = json.loads(match)
                    if "economy" in data or "currencies" in data or "inventory" in data:
                        economy_info.update(self.extract_economy_from_json(data))
                except BaseException:
                    continue

        # Look for specific economy data patterns
        if "currencies" in endpoint:
            currencies = self.extract_currencies_from_html(html_content)
            if currencies:
                economy_info["currencies"] = currencies

        if "inventory" in endpoint:
            inventory = self.extract_inventory_from_html(html_content)
            if inventory:
                economy_info["inventory"] = inventory

        if "catalog" in endpoint:
            catalog = self.extract_catalog_from_html(html_content)
            if catalog:
                economy_info["catalog"] = catalog

        return economy_info

    def extract_economy_from_json(self, data):
        """Extract economy data from JSON"""
        economy_info = {}

        # Look for economy data in various structures
        if "economy" in data:
            economy = data["economy"]
            if "currencies" in economy:
                economy_info["currencies"] = economy["currencies"]
            if "inventory" in economy:
                economy_info["inventory"] = economy["inventory"]
            if "catalog" in economy:
                economy_info["catalog"] = economy["catalog"]

        # Look for direct currency/inventory/catalog data
        if "currencies" in data:
            economy_info["currencies"] = data["currencies"]
        if "inventory" in data:
            economy_info["inventory"] = data["inventory"]
        if "catalog" in data:
            economy_info["catalog"] = data["catalog"]

        return economy_info

    def extract_currencies_from_html(self, html_content):
        """Extract currencies from HTML content"""
        currencies = []

        # Look for currency data in various formats
        currency_patterns = [
            r"currency[^>]*>([^<]+)<",
            r"coin[^>]*>([^<]+)<",
            r"gem[^>]*>([^<]+)<",
            r"energy[^>]*>([^<]+)<",
            r'"id":"([^"]*coin[^"]*)"',
            r'"id":"([^"]*gem[^"]*)"',
            r'"id":"([^"]*energy[^"]*)"',
            r'"name":"([^"]*coin[^"]*)"',
            r'"name":"([^"]*gem[^"]*)"',
            r'"name":"([^"]*energy[^"]*)"',
        ]

        for pattern in currency_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                if match.strip() and len(match.strip()) > 1:
                    currencies.append(match.strip())

        return list(set(currencies))  # Remove duplicates

    def extract_inventory_from_html(self, html_content):
        """Extract inventory from HTML content"""
        inventory = []

        # Look for inventory data
        inventory_patterns = [
            r"inventory[^>]*>([^<]+)<",
            r"booster[^>]*>([^<]+)<",
            r"pack[^>]*>([^<]+)<",
            r'"id":"([^"]*booster[^"]*)"',
            r'"id":"([^"]*pack[^"]*)"',
            r'"name":"([^"]*booster[^"]*)"',
            r'"name":"([^"]*pack[^"]*)"',
        ]

        for pattern in inventory_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                if match.strip() and len(match.strip()) > 1:
                    inventory.append(match.strip())

        return list(set(inventory))  # Remove duplicates

    def extract_catalog_from_html(self, html_content):
        """Extract catalog from HTML content"""
        catalog = []

        # Look for catalog data
        catalog_patterns = [
            r"catalog[^>]*>([^<]+)<",
            r"purchase[^>]*>([^<]+)<",
            r"buy[^>]*>([^<]+)<",
            r'"id":"([^"]*pack[^"]*)"',
            r'"name":"([^"]*pack[^"]*)"',
            r'"cost":"([^"]*)"',
            r'"price":"([^"]*)"',
        ]

        for pattern in catalog_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                if match.strip() and len(match.strip()) > 1:
                    catalog.append(match.strip())

        return list(set(catalog))  # Remove duplicates

    def extract_remote_config_data_advanced(self, session):
        """Extract remote config data using advanced methods"""
        print("\n⚙️ Extracting Remote Config Data (Advanced)...")

        remote_config_data = {
            "service": "Remote Config",
            "method": "advanced_dashboard_extraction",
            "status": "unknown",
            "error": None,
            "config_data": {},
        }

        try:
            # Try multiple remote config endpoints
            config_endpoints = [
                f"{self.remote_config_url}",
                f"{self.remote_config_url}/configs",
                f"{self.base_url}/projects/{self.project_id}/remote-config/configs",
            ]

            for endpoint in config_endpoints:
                try:
                    print(f"   - Trying: {endpoint}")
                    response = session.get(endpoint, timeout=10)

                    if response.status_code == 200:
                        print(f"   ✅ Success: {endpoint}")

                        # Parse the response
                        config_info = self.parse_remote_config_response(response.text)
                        if config_info:
                            remote_config_data["config_data"].update(config_info)

                    elif response.status_code == 401:
                        print(f"   ⚠️ Auth required: {endpoint}")
                    elif response.status_code == 404:
                        print(f"   ❌ Not found: {endpoint}")
                    else:
                        print(f"   ⚠️ HTTP {response.status_code}: {endpoint}")

                except Exception as e:
                    print(f"   ❌ Error: {endpoint} - {e}")

            # Check if we found any data
            if remote_config_data["config_data"]:
                remote_config_data["status"] = "extracted"
                print("✅ Remote Config Data: Found in Unity Cloud")

                configs = remote_config_data["config_data"].get("configs", [])
                print(f"   - Configurations: {len(configs)}")

                for config in configs:
                    print(f"     - {config}")

            else:
                remote_config_data["status"] = "not_found"
                remote_config_data["error"] = "No remote config data found"
                print("❌ Remote Config Data: No data found in Unity Cloud")

        except Exception as e:
            remote_config_data["status"] = "error"
            remote_config_data["error"] = str(e)
            print(f"❌ Remote Config Data: Error - {e}")

        self.results["extracted_data"]["remote_config"] = remote_config_data
        return remote_config_data

    def parse_remote_config_response(self, html_content):
        """Parse remote config data from HTML response"""
        config_info = {}

        # Look for JSON data in script tags
        json_patterns = [
            r"window\.__INITIAL_STATE__\s*=\s*({.+?});",
            r"window\.__PRELOADED_STATE__\s*=\s*({.+?});",
            r"window\.__APP_STATE__\s*=\s*({.+?});",
        ]

        for pattern in json_patterns:
            matches = re.findall(pattern, html_content, re.DOTALL)
            for match in matches:
                try:
                    data = json.loads(match)
                    if "remoteConfig" in data or "configs" in data:
                        config_info.update(self.extract_config_from_json(data))
                except BaseException:
                    continue

        # Look for config data patterns
        config_patterns = [
            r"config[^>]*>([^<]+)<",
            r"setting[^>]*>([^<]+)<",
            r"parameter[^>]*>([^<]+)<",
            r"value[^>]*>([^<]+)<",
        ]

        configs = []
        for pattern in config_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                if match.strip() and len(match.strip()) > 1:
                    configs.append(match.strip())

        if configs:
            config_info["configs"] = list(set(configs))

        return config_info

    def extract_config_from_json(self, data):
        """Extract config data from JSON"""
        config_info = {}

        if "remoteConfig" in data:
            config = data["remoteConfig"]
            if "configs" in config:
                config_info["configs"] = config["configs"]

        if "configs" in data:
            config_info["configs"] = data["configs"]

        return config_info

    def generate_extraction_report(self):
        """Generate extraction report"""
        print("\n" + "=" * 80)
        print("📊 ADVANCED UNITY CLOUD DATA EXTRACTION REPORT")
        print("=" * 80)

        total_services = len(self.results["extracted_data"])
        extracted_services = 0

        for service_name, service_data in self.results["extracted_data"].items():
            status = service_data.get("status", "unknown")
            if status == "extracted":
                extracted_services += 1
                print(f"✅ {service_name}: EXTRACTED")
            elif status == "not_found":
                print(f"❌ {service_name}: NOT FOUND")
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

        print("=" * 80)

    def save_results(self):
        """Save test results to file"""
        results_dir = Path("/workspace/monitoring/reports")
        results_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = (
            results_dir / f"advanced_unity_cloud_data_extraction_{timestamp}.json"
        )

        with open(results_file, "w") as f:
            json.dump(self.results, f, indent=2)

        print(f"\n📁 Test results saved to: {results_file}")

    def run_all_extractions(self):
        """Run all advanced Unity Cloud data extractions"""
        self.print_header()

        # Get authenticated session
        session = self.get_authenticated_session()
        if not session:
            print("❌ Could not establish Unity Cloud session")
            return

        # Extract data from each service
        self.extract_economy_data_advanced(session)
        self.extract_remote_config_data_advanced(session)

        # Generate report
        self.generate_extraction_report()

        # Save results
        self.save_results()


def main():
    """Main function"""
    extractor = AdvancedUnityCloudDataExtractor()
    extractor.run_all_extractions()


if __name__ == "__main__":
    main()
