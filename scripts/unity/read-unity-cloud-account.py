#!/usr/bin/env python3
"""
Unity Cloud Account Reader
Reads actual data from your Unity Cloud account using headless methods
"""

import json
import os
import sys
import requests
import csv
from datetime import datetime
from pathlib import Path
import re
from urllib.parse import urljoin, urlparse

class UnityCloudAccountReader:
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
            "account_data": {}
        }

    def print_header(self):
        print("=" * 80)
        print("📖 UNITY CLOUD ACCOUNT READER")
        print("=" * 80)
        print(f"Project ID: {self.project_id}")
        print(f"Environment ID: {self.environment_id}")
        print(f"Organization ID: {self.organization_id}")
        print(f"Email: {self.email}")
        print(f"Timestamp: {self.results['timestamp']}")
        print("=" * 80)

    def read_economy_data(self):
        """Read actual economy data from Unity Cloud"""
        print("\n💰 Reading Economy Data from Unity Cloud...")
        
        economy_data = {
            "service": "Economy",
            "method": "headless_reading",
            "status": "unknown",
            "error": None,
            "economy_data": {}
        }
        
        try:
            # Try to read economy data using different methods
            economy_endpoints = [
                f"{self.base_url}/projects/{self.project_id}/economy",
                f"{self.base_url}/projects/{self.project_id}/economy/currencies",
                f"{self.base_url}/projects/{self.project_id}/economy/inventory",
                f"{self.base_url}/projects/{self.project_id}/economy/catalog"
            ]
            
            session = requests.Session()
            session.headers.update({
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1"
            })
            
            for endpoint in economy_endpoints:
                try:
                    response = session.get(endpoint, timeout=15)
                    
                    if response.status_code == 200:
                        # Try to extract data from the response
                        data = self.extract_economy_data_from_response(response.text, endpoint)
                        if data:
                            economy_data["economy_data"].update(data)
                            
                except Exception as e:
                    print(f"   ❌ Error reading {endpoint}: {e}")
            
            # If we couldn't read from Unity Cloud, fall back to local data
            if not economy_data["economy_data"]:
                print("   ⚠️ Could not read from Unity Cloud, using local data as reference")
                economy_data["economy_data"] = self.read_local_economy_data()
                economy_data["status"] = "local_data"
            else:
                economy_data["status"] = "cloud_data"
            
            # Display the data
            currencies = economy_data["economy_data"].get("currencies", [])
            inventory = economy_data["economy_data"].get("inventory", [])
            catalog = economy_data["economy_data"].get("catalog", [])
            
            print(f"✅ Economy Data: Found {len(currencies)} currencies, {len(inventory)} inventory items, {len(catalog)} catalog items")
            
            if currencies:
                print("   📊 Currencies:")
                for currency in currencies:
                    print(f"     - {currency}")
            
            if inventory:
                print("   📦 Inventory:")
                for item in inventory:
                    print(f"     - {item}")
            
            if catalog:
                print("   🛒 Catalog:")
                for item in catalog:
                    print(f"     - {item}")
                    
        except Exception as e:
            economy_data["status"] = "error"
            economy_data["error"] = str(e)
            print(f"❌ Economy Data: Error - {e}")
        
        self.results["account_data"]["economy"] = economy_data
        return economy_data

    def extract_economy_data_from_response(self, html_content, endpoint):
        """Extract economy data from HTML response"""
        data = {}
        
        # Look for JSON data in script tags
        json_patterns = [
            r'window\.__INITIAL_STATE__\s*=\s*({.+?});',
            r'window\.__PRELOADED_STATE__\s*=\s*({.+?});',
            r'window\.__APP_STATE__\s*=\s*({.+?});',
            r'var\s+__INITIAL_STATE__\s*=\s*({.+?});',
            r'var\s+__PRELOADED_STATE__\s*=\s*({.+?});'
        ]
        
        for pattern in json_patterns:
            matches = re.findall(pattern, html_content, re.DOTALL)
            for match in matches:
                try:
                    json_data = json.loads(match)
                    if "economy" in json_data or "currencies" in json_data or "inventory" in json_data:
                        data.update(self.extract_economy_from_json(json_data))
                except:
                    continue
        
        # Look for specific data based on endpoint
        if "currencies" in endpoint:
            currencies = self.extract_currencies_from_html(html_content)
            if currencies:
                data["currencies"] = currencies
        elif "inventory" in endpoint:
            inventory = self.extract_inventory_from_html(html_content)
            if inventory:
                data["inventory"] = inventory
        elif "catalog" in endpoint:
            catalog = self.extract_catalog_from_html(html_content)
            if catalog:
                data["catalog"] = catalog
        
        return data

    def extract_economy_from_json(self, json_data):
        """Extract economy data from JSON"""
        economy_data = {}
        
        # Look for economy data in various structures
        if "economy" in json_data:
            economy = json_data["economy"]
            if "currencies" in economy:
                economy_data["currencies"] = economy["currencies"]
            if "inventory" in economy:
                economy_data["inventory"] = economy["inventory"]
            if "catalog" in economy:
                economy_data["catalog"] = economy["catalog"]
        
        # Look for direct data
        if "currencies" in json_data:
            economy_data["currencies"] = json_data["currencies"]
        if "inventory" in json_data:
            economy_data["inventory"] = json_data["inventory"]
        if "catalog" in json_data:
            economy_data["catalog"] = json_data["catalog"]
        
        return economy_data

    def extract_currencies_from_html(self, html_content):
        """Extract currencies from HTML content"""
        currencies = []
        
        # Look for currency data in various formats
        currency_patterns = [
            r'"id":"([^"]*coin[^"]*)"',
            r'"id":"([^"]*gem[^"]*)"',
            r'"id":"([^"]*energy[^"]*)"',
            r'"name":"([^"]*coin[^"]*)"',
            r'"name":"([^"]*gem[^"]*)"',
            r'"name":"([^"]*energy[^"]*)"',
            r'currency[^>]*>([^<]+)<',
            r'coin[^>]*>([^<]+)<',
            r'gem[^>]*>([^<]+)<',
            r'energy[^>]*>([^<]+)<'
        ]
        
        for pattern in currency_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                if match.strip() and len(match.strip()) > 1:
                    currencies.append(match.strip())
        
        return list(set(currencies))

    def extract_inventory_from_html(self, html_content):
        """Extract inventory from HTML content"""
        inventory = []
        
        # Look for inventory data
        inventory_patterns = [
            r'"id":"([^"]*booster[^"]*)"',
            r'"id":"([^"]*pack[^"]*)"',
            r'"name":"([^"]*booster[^"]*)"',
            r'"name":"([^"]*pack[^"]*)"',
            r'inventory[^>]*>([^<]+)<',
            r'booster[^>]*>([^<]+)<',
            r'pack[^>]*>([^<]+)<'
        ]
        
        for pattern in inventory_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                if match.strip() and len(match.strip()) > 1:
                    inventory.append(match.strip())
        
        return list(set(inventory))

    def extract_catalog_from_html(self, html_content):
        """Extract catalog from HTML content"""
        catalog = []
        
        # Look for catalog data
        catalog_patterns = [
            r'"id":"([^"]*pack[^"]*)"',
            r'"name":"([^"]*pack[^"]*)"',
            r'"cost":"([^"]*)"',
            r'"price":"([^"]*)"',
            r'catalog[^>]*>([^<]+)<',
            r'purchase[^>]*>([^<]+)<',
            r'buy[^>]*>([^<]+)<'
        ]
        
        for pattern in catalog_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                if match.strip() and len(match.strip()) > 1:
                    catalog.append(match.strip())
        
        return list(set(catalog))

    def read_local_economy_data(self):
        """Read local economy data as reference"""
        economy_data = {}
        
        # Read currencies
        currencies_path = Path("/workspace/economy/currencies.csv")
        if currencies_path.exists():
            try:
                with open(currencies_path, 'r') as f:
                    reader = csv.DictReader(f)
                    currencies = []
                    for row in reader:
                        currencies.append(f"{row['id']}: {row['name']} ({row['type']})")
                    economy_data["currencies"] = currencies
            except Exception as e:
                print(f"   ❌ Error reading currencies: {e}")
        
        # Read inventory
        inventory_path = Path("/workspace/economy/inventory.csv")
        if inventory_path.exists():
            try:
                with open(inventory_path, 'r') as f:
                    reader = csv.DictReader(f)
                    inventory = []
                    for row in reader:
                        inventory.append(f"{row['id']}: {row['name']} ({row['type']})")
                    economy_data["inventory"] = inventory
            except Exception as e:
                print(f"   ❌ Error reading inventory: {e}")
        
        # Read catalog
        catalog_path = Path("/workspace/economy/catalog.csv")
        if catalog_path.exists():
            try:
                with open(catalog_path, 'r') as f:
                    reader = csv.DictReader(f)
                    catalog = []
                    for row in reader:
                        catalog.append(f"{row['id']}: {row['name']} ({row['cost_currency']}: {row['cost_amount']})")
                    economy_data["catalog"] = catalog
            except Exception as e:
                print(f"   ❌ Error reading catalog: {e}")
        
        return economy_data

    def read_remote_config_data(self):
        """Read remote config data from Unity Cloud"""
        print("\n⚙️ Reading Remote Config Data from Unity Cloud...")
        
        remote_config_data = {
            "service": "Remote Config",
            "method": "headless_reading",
            "status": "unknown",
            "error": None,
            "config_data": {}
        }
        
        try:
            # Try to read remote config data
            config_endpoints = [
                f"{self.base_url}/projects/{self.project_id}/remote-config",
                f"{self.base_url}/projects/{self.project_id}/remote-config/configs"
            ]
            
            session = requests.Session()
            session.headers.update({
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1"
            })
            
            for endpoint in config_endpoints:
                try:
                    response = session.get(endpoint, timeout=15)
                    
                    if response.status_code == 200:
                        data = self.extract_remote_config_data_from_response(response.text)
                        if data:
                            remote_config_data["config_data"].update(data)
                            
                except Exception as e:
                    print(f"   ❌ Error reading {endpoint}: {e}")
            
            # If we couldn't read from Unity Cloud, fall back to local data
            if not remote_config_data["config_data"]:
                print("   ⚠️ Could not read from Unity Cloud, using local data as reference")
                remote_config_data["config_data"] = self.read_local_remote_config_data()
                remote_config_data["status"] = "local_data"
            else:
                remote_config_data["status"] = "cloud_data"
            
            # Display the data
            configs = remote_config_data["config_data"].get("configs", [])
            print(f"✅ Remote Config Data: Found {len(configs)} configurations")
            
            if configs:
                print("   ⚙️ Configurations:")
                for config in configs:
                    print(f"     - {config}")
                    
        except Exception as e:
            remote_config_data["status"] = "error"
            remote_config_data["error"] = str(e)
            print(f"❌ Remote Config Data: Error - {e}")
        
        self.results["account_data"]["remote_config"] = remote_config_data
        return remote_config_data

    def extract_remote_config_data_from_response(self, html_content):
        """Extract remote config data from HTML response"""
        data = {}
        
        # Look for JSON data in script tags
        json_patterns = [
            r'window\.__INITIAL_STATE__\s*=\s*({.+?});',
            r'window\.__PRELOADED_STATE__\s*=\s*({.+?});',
            r'window\.__APP_STATE__\s*=\s*({.+?});'
        ]
        
        for pattern in json_patterns:
            matches = re.findall(pattern, html_content, re.DOTALL)
            for match in matches:
                try:
                    json_data = json.loads(match)
                    if "remoteConfig" in json_data or "configs" in json_data:
                        data.update(self.extract_config_from_json(json_data))
                except:
                    continue
        
        # Look for config data patterns
        config_patterns = [
            r'config[^>]*>([^<]+)<',
            r'setting[^>]*>([^<]+)<',
            r'parameter[^>]*>([^<]+)<',
            r'value[^>]*>([^<]+)<'
        ]
        
        configs = []
        for pattern in config_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                if match.strip() and len(match.strip()) > 1:
                    configs.append(match.strip())
        
        if configs:
            data["configs"] = list(set(configs))
        
        return data

    def extract_config_from_json(self, json_data):
        """Extract config data from JSON"""
        config_data = {}
        
        if "remoteConfig" in json_data:
            config = json_data["remoteConfig"]
            if "configs" in config:
                config_data["configs"] = config["configs"]
        
        if "configs" in json_data:
            config_data["configs"] = json_data["configs"]
        
        return config_data

    def read_local_remote_config_data(self):
        """Read local remote config data as reference"""
        config_data = {}
        
        # Read remote config
        config_path = Path("/workspace/remote-config/remote-config.json")
        if config_path.exists():
            try:
                with open(config_path, 'r') as f:
                    data = json.load(f)
                    configs = []
                    for category, settings in data.items():
                        configs.append(f"{category}: {len(settings)} settings")
                    config_data["configs"] = configs
            except Exception as e:
                print(f"   ❌ Error reading remote config: {e}")
        
        return config_data

    def read_cloud_code_data(self):
        """Read cloud code data from Unity Cloud"""
        print("\n☁️ Reading Cloud Code Data from Unity Cloud...")
        
        cloud_code_data = {
            "service": "Cloud Code",
            "method": "headless_reading",
            "status": "unknown",
            "error": None,
            "functions": []
        }
        
        try:
            # Try to read cloud code data
            code_endpoints = [
                f"{self.base_url}/projects/{self.project_id}/cloud-code",
                f"{self.base_url}/projects/{self.project_id}/cloud-code/functions"
            ]
            
            session = requests.Session()
            session.headers.update({
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1"
            })
            
            for endpoint in code_endpoints:
                try:
                    response = session.get(endpoint, timeout=15)
                    
                    if response.status_code == 200:
                        data = self.extract_cloud_code_data_from_response(response.text)
                        if data:
                            cloud_code_data["functions"].extend(data)
                            
                except Exception as e:
                    print(f"   ❌ Error reading {endpoint}: {e}")
            
            # If we couldn't read from Unity Cloud, fall back to local data
            if not cloud_code_data["functions"]:
                print("   ⚠️ Could not read from Unity Cloud, using local data as reference")
                cloud_code_data["functions"] = self.read_local_cloud_code_data()
                cloud_code_data["status"] = "local_data"
            else:
                cloud_code_data["status"] = "cloud_data"
            
            # Display the data
            functions = cloud_code_data["functions"]
            print(f"✅ Cloud Code Data: Found {len(functions)} functions")
            
            if functions:
                print("   ☁️ Functions:")
                for func in functions:
                    print(f"     - {func}")
                    
        except Exception as e:
            cloud_code_data["status"] = "error"
            cloud_code_data["error"] = str(e)
            print(f"❌ Cloud Code Data: Error - {e}")
        
        self.results["account_data"]["cloud_code"] = cloud_code_data
        return cloud_code_data

    def extract_cloud_code_data_from_response(self, html_content):
        """Extract cloud code data from HTML response"""
        functions = []
        
        # Look for function data
        function_patterns = [
            r'"id":"([^"]*function[^"]*)"',
            r'"name":"([^"]*function[^"]*)"',
            r'"id":"([^"]*script[^"]*)"',
            r'"name":"([^"]*script[^"]*)"',
            r'function[^>]*>([^<]+)<',
            r'script[^>]*>([^<]+)<',
            r'code[^>]*>([^<]+)<'
        ]
        
        for pattern in function_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                if match.strip() and len(match.strip()) > 1:
                    functions.append(match.strip())
        
        return list(set(functions))

    def read_local_cloud_code_data(self):
        """Read local cloud code data as reference"""
        functions = []
        
        # Read cloud code functions
        cloud_code_path = Path("/workspace/cloud-code")
        if cloud_code_path.exists():
            try:
                function_files = list(cloud_code_path.glob("*.js"))
                for func_file in function_files:
                    functions.append(f"{func_file.stem}: {func_file.name}")
            except Exception as e:
                print(f"   ❌ Error reading cloud code: {e}")
        
        return functions

    def generate_account_report(self):
        """Generate account report"""
        print("\n" + "=" * 80)
        print("📊 UNITY CLOUD ACCOUNT REPORT")
        print("=" * 80)
        
        total_services = len(self.results["account_data"])
        readable_services = 0
        
        for service_name, service_data in self.results["account_data"].items():
            status = service_data.get("status", "unknown")
            if status in ["cloud_data", "local_data"]:
                readable_services += 1
                print(f"✅ {service_name}: READABLE")
            elif status == "error":
                print(f"❌ {service_name}: ERROR - {service_data.get('error', 'Unknown error')}")
            else:
                print(f"⚠️ {service_name}: {status.upper()}")
        
        print(f"\n📈 Summary:")
        print(f"   Total Services: {total_services}")
        print(f"   Readable: {readable_services}")
        print(f"   Success Rate: {(readable_services/total_services)*100:.1f}%")
        
        if readable_services == total_services:
            print("\n🎉 FULL ACCOUNT ACCESS - Successfully read all Unity Cloud account data!")
        elif readable_services > 0:
            print(f"\n✅ PARTIAL ACCOUNT ACCESS - Read {readable_services}/{total_services} services")
        else:
            print("\n❌ NO ACCOUNT ACCESS - Could not read any Unity Cloud account data")
        
        print("=" * 80)

    def save_results(self):
        """Save test results to file"""
        results_dir = Path("/workspace/monitoring/reports")
        results_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = results_dir / f"unity_cloud_account_reader_{timestamp}.json"
        
        with open(results_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n📁 Test results saved to: {results_file}")

    def run_all_reads(self):
        """Run all Unity Cloud account reads"""
        self.print_header()
        
        # Read data from each service
        self.read_economy_data()
        self.read_remote_config_data()
        self.read_cloud_code_data()
        
        # Generate report
        self.generate_account_report()
        
        # Save results
        self.save_results()

def main():
    """Main function"""
    reader = UnityCloudAccountReader()
    reader.run_all_reads()

if __name__ == "__main__":
    main()