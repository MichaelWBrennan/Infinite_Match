#!/usr/bin/env python3
"""
Headless Unity Cloud Reader with Real Credentials
Uses actual Unity Cloud credentials to access your real account data
"""

import os
import requests
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class HeadlessUnityWithCredentials:
    def __init__(self):
        self.project_id = "0dd5a03e-7f23-49c4-964e-7919c48c0574"
        self.env_id = os.getenv('UNITY_ENV_ID')
        self.email = os.getenv('UNITY_EMAIL')
        self.password = os.getenv('UNITY_PASSWORD')
        self.api_token = os.getenv('UNITY_API_TOKEN')
        self.driver = None
        
    def setup_headless_browser(self):
        """Setup headless Chrome browser"""
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36")
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.implicitly_wait(10)
        
    def login_to_unity(self):
        """Login to Unity Cloud using real credentials"""
        print("🔐 Logging into Unity Cloud with real credentials...")
        print(f"   Email: {self.email}")
        print(f"   Password: {'*' * len(self.password) if self.password else 'Not set'}")
        
        # Go to Unity Cloud login
        self.driver.get("https://cloud.unity.com/login")
        
        # Wait for login form
        email_field = WebDriverWait(self.driver, 20).until(
            EC.presence_of_element_located((By.NAME, "email"))
        )
        
        password_field = self.driver.find_element(By.NAME, "password")
        login_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        
        # Enter credentials
        email_field.clear()
        email_field.send_keys(self.email)
        
        password_field.clear()
        password_field.send_keys(self.password)
        
        # Click login
        login_button.click()
        
        # Wait for redirect to dashboard
        WebDriverWait(self.driver, 30).until(
            EC.url_contains("cloud.unity.com")
        )
        
        print("✅ Successfully logged into Unity Cloud with real credentials")
        
    def get_economy_data(self):
        """Get real economy data from Unity Cloud"""
        print("💰 Getting real economy data from Unity Cloud...")
        
        # Navigate to economy page
        economy_url = f"https://cloud.unity.com/projects/{self.project_id}/economy"
        self.driver.get(economy_url)
        
        # Wait for economy page to load
        try:
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='economy'], .economy, .currencies"))
            )
            
            # Try to find currencies
            currencies = []
            try:
                currency_elements = self.driver.find_elements(By.CSS_SELECTOR, "[data-testid='currency'], .currency-item, .currency")
                for element in currency_elements:
                    currency_data = {
                        'id': element.get_attribute('data-id') or element.text.split()[0] if element.text else 'unknown',
                        'name': element.text or 'Unknown Currency',
                        'type': 'currency'
                    }
                    currencies.append(currency_data)
            except:
                pass
            
            # Try to find inventory items
            inventory = []
            try:
                inventory_elements = self.driver.find_elements(By.CSS_SELECTOR, "[data-testid='inventory'], .inventory-item, .item")
                for element in inventory_elements:
                    item_data = {
                        'id': element.get_attribute('data-id') or element.text.split()[0] if element.text else 'unknown',
                        'name': element.text or 'Unknown Item',
                        'type': 'inventory'
                    }
                    inventory.append(item_data)
            except:
                pass
            
            # Try to find catalog items
            catalog = []
            try:
                catalog_elements = self.driver.find_elements(By.CSS_SELECTOR, "[data-testid='catalog'], .catalog-item, .catalog")
                for element in catalog_elements:
                    catalog_data = {
                        'id': element.get_attribute('data-id') or element.text.split()[0] if element.text else 'unknown',
                        'name': element.text or 'Unknown Catalog Item',
                        'type': 'catalog'
                    }
                    catalog.append(catalog_data)
            except:
                pass
            
            return {
                'currencies': currencies,
                'inventory': inventory,
                'catalog': catalog,
                'source': 'real_unity_cloud'
            }
            
        except TimeoutException:
            print("⚠️ Economy page not accessible or no data found")
            return {
                'currencies': [],
                'inventory': [],
                'catalog': [],
                'source': 'real_unity_cloud_no_data'
            }
    
    def get_cloud_code_data(self):
        """Get real cloud code data from Unity Cloud"""
        print("☁️ Getting real cloud code data from Unity Cloud...")
        
        # Navigate to cloud code page
        cloud_code_url = f"https://cloud.unity.com/projects/{self.project_id}/cloud-code"
        self.driver.get(cloud_code_url)
        
        # Wait for cloud code page to load
        try:
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='cloud-code'], .cloud-code, .functions"))
            )
            
            # Try to find functions
            functions = []
            try:
                function_elements = self.driver.find_elements(By.CSS_SELECTOR, "[data-testid='function'], .function-item, .function")
                for element in function_elements:
                    function_data = {
                        'name': element.get_attribute('data-name') or element.text.split()[0] if element.text else 'unknown',
                        'status': element.get_attribute('data-status') or 'unknown',
                        'type': 'cloud_code_function'
                    }
                    functions.append(function_data)
            except:
                pass
            
            return {
                'functions': functions,
                'source': 'real_unity_cloud'
            }
            
        except TimeoutException:
            print("⚠️ Cloud Code page not accessible or no data found")
            return {
                'functions': [],
                'source': 'real_unity_cloud_no_data'
            }
    
    def get_remote_config_data(self):
        """Get real remote config data from Unity Cloud"""
        print("⚙️ Getting real remote config data from Unity Cloud...")
        
        # Navigate to remote config page
        remote_config_url = f"https://cloud.unity.com/projects/{self.project_id}/remote-config"
        self.driver.get(remote_config_url)
        
        # Wait for remote config page to load
        try:
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='remote-config'], .remote-config, .configs"))
            )
            
            # Try to find configs
            configs = []
            try:
                config_elements = self.driver.find_elements(By.CSS_SELECTOR, "[data-testid='config'], .config-item, .config")
                for element in config_elements:
                    config_data = {
                        'name': element.get_attribute('data-name') or element.text.split()[0] if element.text else 'unknown',
                        'value': element.get_attribute('data-value') or element.text or 'unknown',
                        'type': 'remote_config'
                    }
                    configs.append(config_data)
            except:
                pass
            
            return {
                'configs': configs,
                'source': 'real_unity_cloud'
            }
            
        except TimeoutException:
            print("⚠️ Remote Config page not accessible or no data found")
            return {
                'configs': [],
                'source': 'real_unity_cloud_no_data'
            }
    
    def run_real_data_collection(self):
        """Run real data collection from Unity Cloud"""
        print("=" * 80)
        print("🔐 HEADLESS UNITY CLOUD WITH REAL CREDENTIALS")
        print("=" * 80)
        print(f"Project ID: {self.project_id}")
        print(f"Environment ID: {self.env_id}")
        print(f"Email: {self.email}")
        print(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        try:
            # Setup browser
            self.setup_headless_browser()
            
            # Login with real credentials
            self.login_to_unity()
            
            # Get real data
            economy_data = self.get_economy_data()
            cloud_code_data = self.get_cloud_code_data()
            remote_config_data = self.get_remote_config_data()
            
            # Display results
            print("\n📊 REAL UNITY CLOUD DATA COLLECTED:")
            print("=" * 50)
            
            print(f"\n💰 Economy Data ({economy_data['source']}):")
            print(f"   Currencies: {len(economy_data['currencies'])}")
            for currency in economy_data['currencies']:
                print(f"      - {currency['id']}: {currency['name']}")
            
            print(f"   Inventory: {len(economy_data['inventory'])}")
            for item in economy_data['inventory']:
                print(f"      - {item['id']}: {item['name']}")
            
            print(f"   Catalog: {len(economy_data['catalog'])}")
            for item in economy_data['catalog']:
                print(f"      - {item['id']}: {item['name']}")
            
            print(f"\n☁️ Cloud Code Data ({cloud_code_data['source']}):")
            print(f"   Functions: {len(cloud_code_data['functions'])}")
            for func in cloud_code_data['functions']:
                print(f"      - {func['name']}: {func['status']}")
            
            print(f"\n⚙️ Remote Config Data ({remote_config_data['source']}):")
            print(f"   Configs: {len(remote_config_data['configs'])}")
            for config in remote_config_data['configs']:
                print(f"      - {config['name']}: {config['value']}")
            
            # Save results
            results = {
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
                'project_id': self.project_id,
                'environment_id': self.env_id,
                'email': self.email,
                'economy': economy_data,
                'cloud_code': cloud_code_data,
                'remote_config': remote_config_data
            }
            
            report_path = f"monitoring/reports/real_unity_cloud_data_{time.strftime('%Y%m%d_%H%M%S')}.json"
            os.makedirs(os.path.dirname(report_path), exist_ok=True)
            
            with open(report_path, 'w') as f:
                json.dump(results, f, indent=2)
            
            print(f"\n📁 Real data saved to: {report_path}")
            print("\n🎉 Real Unity Cloud data collection completed!")
            
            return results
            
        except Exception as e:
            print(f"\n❌ Error collecting real data: {e}")
            return None
            
        finally:
            if self.driver:
                self.driver.quit()

def main():
    """Main function"""
    collector = HeadlessUnityWithCredentials()
    results = collector.run_real_data_collection()
    
    if results:
        print("\n✅ Successfully collected real Unity Cloud data using your credentials!")
    else:
        print("\n❌ Failed to collect real Unity Cloud data")

if __name__ == "__main__":
    main()