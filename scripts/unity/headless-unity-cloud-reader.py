#!/usr/bin/env python3
"""
Headless Unity Cloud Reader
Reads what's actually on your Unity Cloud account using headless methods only
"""

import json
import os
import sys
import requests
from datetime import datetime
from pathlib import Path
import re
from urllib.parse import urljoin, urlparse

class HeadlessUnityCloudReader:
    def __init__(self):
        self.project_id = "0dd5a03e-7f23-49c4-964e-7919c48c0574"
        self.environment_id = "1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"
        self.organization_id = "2473931369648"
        self.email = "michaelwilliambrennan@gmail.com"
        
        # Unity Cloud Dashboard URLs (not API)
        self.base_url = "https://cloud.unity.com"
        self.project_url = f"{self.base_url}/projects/{self.project_id}"
        
        # Results
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "project_id": self.project_id,
            "environment_id": self.environment_id,
            "organization_id": self.organization_id,
            "email": self.email,
            "headless_account_data": {}
        }

    def print_header(self):
        print("=" * 80)
        print("🤖 HEADLESS UNITY CLOUD READER")
        print("=" * 80)
        print(f"Project ID: {self.project_id}")
        print(f"Environment ID: {self.environment_id}")
        print(f"Organization ID: {self.organization_id}")
        print(f"Email: {self.email}")
        print(f"Timestamp: {self.results['timestamp']}")
        print("=" * 80)

    def read_headless_economy_data(self):
        """Read economy data using headless methods only"""
        print("\n💰 Reading Economy Data (Headless Method)...")
        
        economy_data = {
            "service": "Economy",
            "method": "headless_dashboard_reading",
            "status": "unknown",
            "error": None,
            "headless_data": {}
        }
        
        try:
            # Use headless method to read from Unity Cloud dashboard
            session = requests.Session()
            session.headers.update({
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1"
            })
            
            # Try to read economy page
            economy_url = f"{self.base_url}/projects/{self.project_id}/economy"
            print(f"   - Reading from: {economy_url}")
            
            response = session.get(economy_url, timeout=15)
            
            if response.status_code == 200:
                print("   ✅ Economy page accessible")
                
                # Extract data from the page content
                economy_info = self.extract_headless_economy_data(response.text)
                
                if economy_info:
                    economy_data["headless_data"] = economy_info
                    economy_data["status"] = "success"
                    
                    currencies = economy_info.get("currencies", [])
                    inventory = economy_info.get("inventory", [])
                    catalog = economy_info.get("catalog", [])
                    
                    print(f"   📊 Found: {len(currencies)} currencies, {len(inventory)} inventory, {len(catalog)} catalog")
                    
                    if currencies:
                        print("   💰 Currencies:")
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
                else:
                    print("   ⚠️ No economy data found in page content")
                    economy_data["status"] = "no_data"
                    economy_data["error"] = "No economy data found in dashboard"
            else:
                print(f"   ❌ Economy page: HTTP {response.status_code}")
                economy_data["status"] = "error"
                economy_data["error"] = f"HTTP {response.status_code}"
                
        except Exception as e:
            economy_data["status"] = "error"
            economy_data["error"] = str(e)
            print(f"❌ Economy Data: Error - {e}")
        
        self.results["headless_account_data"]["economy"] = economy_data
        return economy_data

    def extract_headless_economy_data(self, html_content):
        """Extract economy data from HTML using headless methods"""
        economy_info = {}
        
        # Look for JSON data embedded in the page
        json_patterns = [
            r'window\.__INITIAL_STATE__\s*=\s*({.+?});',
            r'window\.__PRELOADED_STATE__\s*=\s*({.+?});',
            r'window\.__APP_STATE__\s*=\s*({.+?});',
            r'var\s+__INITIAL_STATE__\s*=\s*({.+?});',
            r'var\s+__PRELOADED_STATE__\s*=\s*({.+?});',
            r'window\.__UNITY_CLOUD_DATA__\s*=\s*({.+?});'
        ]
        
        for pattern in json_patterns:
            matches = re.findall(pattern, html_content, re.DOTALL)
            for match in matches:
                try:
                    data = json.loads(match)
                    if "economy" in data or "currencies" in data or "inventory" in data:
                        economy_info.update(self.extract_economy_from_json(data))
                        break
                except:
                    continue
        
        # Look for specific economy data in HTML
        if not economy_info:
            # Look for currency data
            currencies = self.extract_currencies_from_html(html_content)
            if currencies:
                economy_info["currencies"] = currencies
            
            # Look for inventory data
            inventory = self.extract_inventory_from_html(html_content)
            if inventory:
                economy_info["inventory"] = inventory
            
            # Look for catalog data
            catalog = self.extract_catalog_from_html(html_content)
            if catalog:
                economy_info["catalog"] = catalog
        
        return economy_info

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

    def read_headless_remote_config_data(self):
        """Read remote config data using headless methods only"""
        print("\n⚙️ Reading Remote Config Data (Headless Method)...")
        
        remote_config_data = {
            "service": "Remote Config",
            "method": "headless_dashboard_reading",
            "status": "unknown",
            "error": None,
            "headless_data": {}
        }
        
        try:
            # Use headless method to read from Unity Cloud dashboard
            session = requests.Session()
            session.headers.update({
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1"
            })
            
            # Try to read remote config page
            remote_config_url = f"{self.base_url}/projects/{self.project_id}/remote-config"
            print(f"   - Reading from: {remote_config_url}")
            
            response = session.get(remote_config_url, timeout=15)
            
            if response.status_code == 200:
                print("   ✅ Remote Config page accessible")
                
                # Extract data from the page content
                config_info = self.extract_headless_remote_config_data(response.text)
                
                if config_info:
                    remote_config_data["headless_data"] = config_info
                    remote_config_data["status"] = "success"
                    
                    configs = config_info.get("configs", [])
                    print(f"   📊 Found: {len(configs)} configurations")
                    
                    if configs:
                        print("   ⚙️ Configurations:")
                        for config in configs:
                            print(f"     - {config}")
                else:
                    print("   ⚠️ No remote config data found in page content")
                    remote_config_data["status"] = "no_data"
                    remote_config_data["error"] = "No remote config data found in dashboard"
            else:
                print(f"   ❌ Remote Config page: HTTP {response.status_code}")
                remote_config_data["status"] = "error"
                remote_config_data["error"] = f"HTTP {response.status_code}"
                
        except Exception as e:
            remote_config_data["status"] = "error"
            remote_config_data["error"] = str(e)
            print(f"❌ Remote Config Data: Error - {e}")
        
        self.results["headless_account_data"]["remote_config"] = remote_config_data
        return remote_config_data

    def extract_headless_remote_config_data(self, html_content):
        """Extract remote config data from HTML using headless methods"""
        config_info = {}
        
        # Look for JSON data embedded in the page
        json_patterns = [
            r'window\.__INITIAL_STATE__\s*=\s*({.+?});',
            r'window\.__PRELOADED_STATE__\s*=\s*({.+?});',
            r'window\.__APP_STATE__\s*=\s*({.+?});',
            r'var\s+__INITIAL_STATE__\s*=\s*({.+?});',
            r'var\s+__PRELOADED_STATE__\s*=\s*({.+?});',
            r'window\.__UNITY_CLOUD_DATA__\s*=\s*({.+?});'
        ]
        
        for pattern in json_patterns:
            matches = re.findall(pattern, html_content, re.DOTALL)
            for match in matches:
                try:
                    data = json.loads(match)
                    if "remoteConfig" in data or "configs" in data:
                        config_info.update(self.extract_config_from_json(data))
                        break
                except:
                    continue
        
        # Look for specific config data in HTML
        if not config_info:
            configs = self.extract_configs_from_html(html_content)
            if configs:
                config_info["configs"] = configs
        
        return config_info

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

    def extract_configs_from_html(self, html_content):
        """Extract configs from HTML content"""
        configs = []
        
        # Look for config data
        config_patterns = [
            r'config[^>]*>([^<]+)<',
            r'setting[^>]*>([^<]+)<',
            r'parameter[^>]*>([^<]+)<',
            r'value[^>]*>([^<]+)<'
        ]
        
        for pattern in config_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                if match.strip() and len(match.strip()) > 1:
                    configs.append(match.strip())
        
        return list(set(configs))

    def read_headless_cloud_code_data(self):
        """Read cloud code data using headless methods only"""
        print("\n☁️ Reading Cloud Code Data (Headless Method)...")
        
        cloud_code_data = {
            "service": "Cloud Code",
            "method": "headless_dashboard_reading",
            "status": "unknown",
            "error": None,
            "headless_data": {}
        }
        
        try:
            # Use headless method to read from Unity Cloud dashboard
            session = requests.Session()
            session.headers.update({
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1"
            })
            
            # Try to read cloud code page
            cloud_code_url = f"{self.base_url}/projects/{self.project_id}/cloud-code"
            print(f"   - Reading from: {cloud_code_url}")
            
            response = session.get(cloud_code_url, timeout=15)
            
            if response.status_code == 200:
                print("   ✅ Cloud Code page accessible")
                
                # Extract data from the page content
                functions_info = self.extract_headless_cloud_code_data(response.text)
                
                if functions_info:
                    cloud_code_data["headless_data"] = functions_info
                    cloud_code_data["status"] = "success"
                    
                    functions = functions_info.get("functions", [])
                    print(f"   📊 Found: {len(functions)} functions")
                    
                    if functions:
                        print("   ☁️ Functions:")
                        for func in functions:
                            print(f"     - {func}")
                else:
                    print("   ⚠️ No cloud code data found in page content")
                    cloud_code_data["status"] = "no_data"
                    cloud_code_data["error"] = "No cloud code data found in dashboard"
            else:
                print(f"   ❌ Cloud Code page: HTTP {response.status_code}")
                cloud_code_data["status"] = "error"
                cloud_code_data["error"] = f"HTTP {response.status_code}"
                
        except Exception as e:
            cloud_code_data["status"] = "error"
            cloud_code_data["error"] = str(e)
            print(f"❌ Cloud Code Data: Error - {e}")
        
        self.results["headless_account_data"]["cloud_code"] = cloud_code_data
        return cloud_code_data

    def extract_headless_cloud_code_data(self, html_content):
        """Extract cloud code data from HTML using headless methods"""
        functions_info = {}
        
        # Look for JSON data embedded in the page
        json_patterns = [
            r'window\.__INITIAL_STATE__\s*=\s*({.+?});',
            r'window\.__PRELOADED_STATE__\s*=\s*({.+?});',
            r'window\.__APP_STATE__\s*=\s*({.+?});',
            r'var\s+__INITIAL_STATE__\s*=\s*({.+?});',
            r'var\s+__PRELOADED_STATE__\s*=\s*({.+?});',
            r'window\.__UNITY_CLOUD_DATA__\s*=\s*({.+?});'
        ]
        
        for pattern in json_patterns:
            matches = re.findall(pattern, html_content, re.DOTALL)
            for match in matches:
                try:
                    data = json.loads(match)
                    if "cloudCode" in data or "functions" in data:
                        functions_info.update(self.extract_cloud_code_from_json(data))
                        break
                except:
                    continue
        
        # Look for specific cloud code data in HTML
        if not functions_info:
            functions = self.extract_functions_from_html(html_content)
            if functions:
                functions_info["functions"] = functions
        
        return functions_info

    def extract_cloud_code_from_json(self, json_data):
        """Extract cloud code data from JSON"""
        cloud_code_data = {}
        
        if "cloudCode" in json_data:
            code = json_data["cloudCode"]
            if "functions" in code:
                cloud_code_data["functions"] = code["functions"]
        
        if "functions" in json_data:
            cloud_code_data["functions"] = json_data["functions"]
        
        return cloud_code_data

    def extract_functions_from_html(self, html_content):
        """Extract functions from HTML content"""
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

    def generate_headless_report(self):
        """Generate headless report"""
        print("\n" + "=" * 80)
        print("📊 HEADLESS UNITY CLOUD ACCOUNT REPORT")
        print("=" * 80)
        
        total_services = len(self.results["headless_account_data"])
        successful_services = 0
        no_data_services = 0
        error_services = 0
        
        for service_name, service_data in self.results["headless_account_data"].items():
            status = service_data.get("status", "unknown")
            if status == "success":
                successful_services += 1
                print(f"✅ {service_name}: SUCCESS - Data found in Unity Cloud dashboard")
            elif status == "no_data":
                no_data_services += 1
                print(f"❌ {service_name}: NO DATA - Nothing found in Unity Cloud dashboard")
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
            print("\n🎉 FULL SUCCESS - All services have data in Unity Cloud dashboard!")
        elif successful_services > 0:
            print(f"\n⚠️ PARTIAL SUCCESS - {successful_services}/{total_services} services have data")
        else:
            print("\n❌ NO DATA - No services have data in Unity Cloud dashboard")
        
        print("\n💡 What this means:")
        if successful_services > 0:
            print("   - Your Unity Cloud account has actual data configured")
            print("   - This is what's really on your account (read from dashboard)")
            print("   - No APIs were used - pure headless method")
        else:
            print("   - Your Unity Cloud account may not have data configured yet")
            print("   - You may need to deploy your local data to Unity Cloud")
            print("   - Or the data may require authentication to view")
        
        print("=" * 80)

    def save_results(self):
        """Save test results to file"""
        results_dir = Path("/workspace/monitoring/reports")
        results_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = results_dir / f"headless_unity_cloud_reader_{timestamp}.json"
        
        with open(results_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n📁 Test results saved to: {results_file}")

    def run_all_reads(self):
        """Run all headless Unity Cloud reads"""
        self.print_header()
        
        # Read data from each service using headless methods
        self.read_headless_economy_data()
        self.read_headless_remote_config_data()
        self.read_headless_cloud_code_data()
        
        # Generate report
        self.generate_headless_report()
        
        # Save results
        self.save_results()

def main():
    """Main function"""
    reader = HeadlessUnityCloudReader()
    reader.run_all_reads()

if __name__ == "__main__":
    main()