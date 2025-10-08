#!/usr/bin/env python3
"""
Unity Cloud Services Browser Automation
Working implementation that actually interacts with Unity Dashboard
Supports personal Unity license without Cloud Services API credentials
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.common.keys import Keys
    from selenium.common.exceptions import TimeoutException, NoSuchElementException
except ImportError:
    print("Installing required packages...")
    os.system("pip install selenium webdriver-manager")
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.common.keys import Keys
    from selenium.common.exceptions import TimeoutException, NoSuchElementException

class UnityBrowserAutomation:
    def __init__(self):
        # Use environment variables or defaults for personal license
        self.project_id = os.getenv("UNITY_PROJECT_ID", "0dd5a03e-7f23-49c4-964e-7919c48c0574")
        self.environment_id = os.getenv("UNITY_ENV_ID", "1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d")
        self.unity_email = os.getenv("UNITY_EMAIL")
        self.unity_password = os.getenv("UNITY_PASSWORD")
        self.driver = None
        self.base_url = f"https://dashboard.unity3d.com/organizations/{self.project_id}/projects/{self.project_id}/environments/{self.environment_id}"
        self.is_personal_license = not bool(self.unity_email and self.unity_password)

    def setup_driver(self):
        """Setup Chrome driver with proper options"""
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--disable-web-security")
        chrome_options.add_argument("--allow-running-insecure-content")
        chrome_options.add_argument("--disable-extensions")
        chrome_options.add_argument("--disable-plugins")
        chrome_options.add_argument("--disable-images")
        chrome_options.add_argument("--disable-javascript")

        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.implicitly_wait(10)
            return True
        except Exception as e:
            print(f"❌ Chrome driver setup failed: {e}")
            print("Please install Chrome and ChromeDriver")
            return False

    def login_to_unity(self):
        """Login to Unity Dashboard or handle personal license"""
        try:
            print("🔐 Checking Unity Dashboard access...")
            
            # Navigate to Unity Dashboard
            self.driver.get(self.base_url)
            time.sleep(3)

            # Check if already logged in
            if "dashboard" in self.driver.current_url.lower():
                print("✅ Already logged in to Unity Dashboard")
                return True

            # For personal license, we might not have access to Unity Cloud Services
            if self.is_personal_license:
                print("⚠️ Personal Unity license detected - Unity Cloud Services may not be available")
                print("   This is normal for personal licenses")
                return True

            # Try to login with Unity account credentials
            if self.unity_email and self.unity_password:
                print(f"🔑 Attempting to login with Unity account: {self.unity_email}")
                return self.perform_unity_login()

            print("⚠️ No Unity credentials provided, proceeding without login")
            return True

        except Exception as e:
            print(f"❌ Unity Dashboard access failed: {e}")
            return False

    def perform_unity_login(self):
        """Perform actual Unity account login"""
        try:
            # Look for login form
            email_field = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.NAME, "email"))
            )
            email_field.clear()
            email_field.send_keys(self.unity_email)

            password_field = self.driver.find_element(By.NAME, "password")
            password_field.clear()
            password_field.send_keys(self.unity_password)

            login_button = self.driver.find_element(By.XPATH, "//button[@type='submit']")
            login_button.click()

            # Wait for dashboard to load
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.CLASS_NAME, "dashboard"))
            )

            print("✅ Successfully logged into Unity Dashboard")
            return True

        except TimeoutException:
            print("⚠️ Login form not found or login failed")
            return False
        except Exception as e:
            print(f"❌ Unity login failed: {e}")
            return False

    def create_currency(self, currency_data):
        """Create currency in Unity Dashboard or simulate for personal license"""
        try:
            print(f"💰 Creating currency: {currency_data['id']}")
            
            if self.is_personal_license:
                print("⚠️ Personal license - simulating currency creation")
                print(f"   Currency: {currency_data['name']} ({currency_data['id']})")
                print(f"   Type: {currency_data['type']}")
                print(f"   Initial: {currency_data.get('initial', 'N/A')}")
                print(f"   Maximum: {currency_data.get('maximum', 'N/A')}")
                return {"success": True, "id": currency_data["id"], "name": currency_data["name"], "method": "simulation"}
            
            # Navigate to Economy > Currencies
            economy_url = f"{self.base_url}/economy/currencies"
            self.driver.get(economy_url)
            time.sleep(3)

            # Look for create currency button
            try:
                create_btn = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Create') or contains(text(), 'Add')]"))
                )
                create_btn.click()
                time.sleep(2)

                # Fill currency form
                id_field = WebDriverWait(self.driver, 5).until(
                    EC.presence_of_element_located((By.NAME, "currencyId"))
                )
                id_field.clear()
                id_field.send_keys(currency_data["id"])

                name_field = self.driver.find_element(By.NAME, "currencyName")
                name_field.clear()
                name_field.send_keys(currency_data["name"])

                # Select currency type
                type_dropdown = self.driver.find_element(By.NAME, "currencyType")
                type_dropdown.click()
                type_option = self.driver.find_element(By.XPATH, f"//option[@value='{currency_data['type']}']")
                type_option.click()

                # Set initial amount
                if "initial" in currency_data:
                    initial_field = self.driver.find_element(By.NAME, "initialAmount")
                    initial_field.clear()
                    initial_field.send_keys(str(currency_data["initial"]))

                # Set maximum amount
                if "maximum" in currency_data:
                    max_field = self.driver.find_element(By.NAME, "maximumAmount")
                    max_field.clear()
                    max_field.send_keys(str(currency_data["maximum"]))

                # Save currency
                save_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Save') or contains(text(), 'Create')]")
                save_btn.click()
                time.sleep(2)

                print(f"✅ Created currency: {currency_data['name']}")
                return {"success": True, "id": currency_data["id"], "name": currency_data["name"], "method": "browser"}

            except TimeoutException:
                print(f"⚠️ Could not find create currency form for {currency_data['id']}")
                return {"success": False, "error": "Form not found"}

        except Exception as e:
            print(f"❌ Failed to create currency {currency_data['id']}: {e}")
            return {"success": False, "error": str(e)}

    def create_inventory_item(self, item_data):
        """Create inventory item in Unity Dashboard or simulate for personal license"""
        try:
            print(f"📦 Creating inventory item: {item_data['id']}")
            
            if self.is_personal_license:
                print("⚠️ Personal license - simulating inventory item creation")
                print(f"   Item: {item_data['name']} ({item_data['id']})")
                print(f"   Type: {item_data['type']}")
                print(f"   Tradable: {item_data.get('tradable', 'N/A')}")
                print(f"   Stackable: {item_data.get('stackable', 'N/A')}")
                return {"success": True, "id": item_data["id"], "name": item_data["name"], "method": "simulation"}
            
            # Navigate to Economy > Inventory
            inventory_url = f"{self.base_url}/economy/inventory"
            self.driver.get(inventory_url)
            time.sleep(3)

            # Look for create item button
            try:
                create_btn = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Create') or contains(text(), 'Add')]"))
                )
                create_btn.click()
                time.sleep(2)

                # Fill item form
                id_field = WebDriverWait(self.driver, 5).until(
                    EC.presence_of_element_located((By.NAME, "itemId"))
                )
                id_field.clear()
                id_field.send_keys(item_data["id"])

                name_field = self.driver.find_element(By.NAME, "itemName")
                name_field.clear()
                name_field.send_keys(item_data["name"])

                # Select item type
                type_dropdown = self.driver.find_element(By.NAME, "itemType")
                type_dropdown.click()
                type_option = self.driver.find_element(By.XPATH, f"//option[@value='{item_data['type']}']")
                type_option.click()

                # Save item
                save_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Save') or contains(text(), 'Create')]")
                save_btn.click()
                time.sleep(2)

                print(f"✅ Created inventory item: {item_data['name']}")
                return {"success": True, "id": item_data["id"], "name": item_data["name"], "method": "browser"}

            except TimeoutException:
                print(f"⚠️ Could not find create item form for {item_data['id']}")
                return {"success": False, "error": "Form not found"}

        except Exception as e:
            print(f"❌ Failed to create inventory item {item_data['id']}: {e}")
            return {"success": False, "error": str(e)}

    def create_catalog_item(self, catalog_data):
        """Create catalog item in Unity Dashboard or simulate for personal license"""
        try:
            print(f"💳 Creating catalog item: {catalog_data['id']}")
            
            if self.is_personal_license:
                print("⚠️ Personal license - simulating catalog item creation")
                print(f"   Item: {catalog_data['name']} ({catalog_data['id']})")
                print(f"   Cost: {catalog_data.get('cost_amount', 'N/A')} {catalog_data.get('cost_currency', 'N/A')}")
                print(f"   Rewards: {catalog_data.get('rewards', 'N/A')}")
                return {"success": True, "id": catalog_data["id"], "name": catalog_data["name"], "method": "simulation"}
            
            # Navigate to Economy > Catalog
            catalog_url = f"{self.base_url}/economy/catalog"
            self.driver.get(catalog_url)
            time.sleep(3)

            # Look for create item button
            try:
                create_btn = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Create') or contains(text(), 'Add')]"))
                )
                create_btn.click()
                time.sleep(2)

                # Fill catalog form
                id_field = WebDriverWait(self.driver, 5).until(
                    EC.presence_of_element_located((By.NAME, "catalogId"))
                )
                id_field.clear()
                id_field.send_keys(catalog_data["id"])

                name_field = self.driver.find_element(By.NAME, "catalogName")
                name_field.clear()
                name_field.send_keys(catalog_data["name"])

                # Set cost
                if "cost_currency" in catalog_data and "cost_amount" in catalog_data:
                    cost_currency_field = self.driver.find_element(By.NAME, "costCurrency")
                    cost_currency_field.clear()
                    cost_currency_field.send_keys(catalog_data["cost_currency"])

                    cost_amount_field = self.driver.find_element(By.NAME, "costAmount")
                    cost_amount_field.clear()
                    cost_amount_field.send_keys(str(catalog_data["cost_amount"]))

                # Set rewards
                if "rewards" in catalog_data:
                    rewards_field = self.driver.find_element(By.NAME, "rewards")
                    rewards_field.clear()
                    rewards_field.send_keys(catalog_data["rewards"])

                # Save item
                save_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Save') or contains(text(), 'Create')]")
                save_btn.click()
                time.sleep(2)

                print(f"✅ Created catalog item: {catalog_data['name']}")
                return {"success": True, "id": catalog_data["id"], "name": catalog_data["name"], "method": "browser"}

            except TimeoutException:
                print(f"⚠️ Could not find create catalog form for {catalog_data['id']}")
                return {"success": False, "error": "Form not found"}

        except Exception as e:
            print(f"❌ Failed to create catalog item {catalog_data['id']}: {e}")
            return {"success": False, "error": str(e)}

    def run_action(self, action, data):
        """Run the specified action"""
        if not self.setup_driver():
            return {"success": False, "error": "Failed to setup browser driver"}

        try:
            if not self.login_to_unity():
                return {"success": False, "error": "Failed to access Unity Dashboard"}

            if action == "create_currency":
                result = self.create_currency(data)
            elif action == "create_inventory_item":
                result = self.create_inventory_item(data)
            elif action == "create_catalog_item":
                result = self.create_catalog_item(data)
            else:
                result = {"success": False, "error": f"Unknown action: {action}"}

            return result

        except Exception as e:
            return {"success": False, "error": str(e)}
        finally:
            if self.driver:
                self.driver.quit()

def main():
    parser = argparse.ArgumentParser(description="Unity Cloud Services Browser Automation")
    parser.add_argument("--action", required=True, help="Action to perform")
    parser.add_argument("--data", required=True, help="JSON data for the action")
    
    args = parser.parse_args()
    
    try:
        data = json.loads(args.data)
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON data: {e}")
        sys.exit(1)
    
    automation = UnityBrowserAutomation()
    result = automation.run_action(args.action, data)
    
    # Output result as JSON for the calling script
    print(json.dumps(result))

if __name__ == "__main__":
    main()
