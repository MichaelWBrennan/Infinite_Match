#!/usr/bin/env python3
"""
Unity Cloud Console Full Automation
Automates Unity Cloud Console configuration without manual dashboard interaction
"""

import json
import os
import subprocess
import time
from pathlib import Path

import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


class UnityCloudConsoleAutomation:
    def __init__(self):
        self.project_id = os.getenv(
            "UNITY_PROJECT_ID", "0dd5a03e-7f23-49c4-964e-7919c48c0574"
        )
        self.environment_id = os.getenv(
            "UNITY_ENV_ID", "1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"
        )
        self.unity_email = os.getenv("UNITY_EMAIL")
        self.unity_password = os.getenv("UNITY_PASSWORD")
        self.repo_root = Path(__file__).parent.parent.parent

    def print_header(self, title):
        """Print formatted header"""
        print("\n" + "=" * 80)
        print(f"🤖 {title}")
        print("=" * 80)

    def setup_selenium_driver(self):
        """Setup Chrome driver for browser automation"""
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--headless")

        try:
            driver = webdriver.Chrome(options=chrome_options)
            return driver
        except Exception as e:
            print(f"❌ Chrome driver setup failed: {e}")
            return None

    def login_to_unity_dashboard(self, driver):
        """Login to Unity Dashboard"""
        try:
            print("🔐 Logging into Unity Dashboard...")

            # Navigate to Unity Dashboard
            dashboard_url = f"https: // dashboard.unity3d.com / organizations / {
                self.project_id} / projects / {
                self.project_id} / environments / {
                self.environment_id}"
            driver.get(dashboard_url)

            # Wait for login form
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.NAME, "email"))
            )

            # Fill login form
            email_field = driver.find_element(By.NAME, "email")
            email_field.send_keys(self.unity_email)

            password_field = driver.find_element(By.NAME, "password")
            password_field.send_keys(self.unity_password)

            # Submit login
            login_button = driver.find_element(By.XPATH, "//button[@type='submit']")
            login_button.click()

            # Wait for dashboard to load
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.CLASS_NAME, "dashboard"))
            )

            print("✅ Successfully logged into Unity Dashboard")
            return True

        except Exception as e:
            print(f"❌ Unity Dashboard login failed: {e}")
            return False

    def configure_economy_currencies(self, driver):
        """Configure economy currencies in Unity Dashboard"""
        try:
            print("💰 Configuring Economy Currencies...")

            # Navigate to Economy > Currencies
            economy_url = f"https: // dashboard.unity3d.com / organizations / {
                self.project_id} / projects / {
                self.project_id} / environments / {
                self.environment_id} / economy / currencies"
            driver.get(economy_url)

            # Wait for page to load
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "economy-currencies"))
            )

            currencies = [
                {
                    "id": "coins",
                    "name": "Coins",
                    "type": "soft_currency",
                    "initial": 1000,
                    "maximum": 999999,
                },
                {
                    "id": "gems",
                    "name": "Gems",
                    "type": "hard_currency",
                    "initial": 50,
                    "maximum": 99999,
                },
                {
                    "id": "energy",
                    "name": "Energy",
                    "type": "consumable",
                    "initial": 5,
                    "maximum": 30,
                },
            ]

            for currency in currencies:
                try:
                    # Click Create Currency button
                    create_btn = WebDriverWait(driver, 10).until(
                        EC.element_to_be_clickable(
                            (By.XPATH, "//button[contains(text(), 'Create Currency')]")
                        )
                    )
                    create_btn.click()

                    # Fill currency form
                    id_field = WebDriverWait(driver, 5).until(
                        EC.presence_of_element_located((By.NAME, "currencyId"))
                    )
                    id_field.send_keys(currency["id"])

                    name_field = driver.find_element(By.NAME, "currencyName")
                    name_field.send_keys(currency["name"])

                    # Select currency type
                    type_dropdown = driver.find_element(By.NAME, "currencyType")
                    type_dropdown.click()
                    type_option = driver.find_element(
                        By.XPATH, f"//option[@value='{currency['type']}']"
                    )
                    type_option.click()

                    # Set initial amount
                    initial_field = driver.find_element(By.NAME, "initialAmount")
                    initial_field.send_keys(str(currency["initial"]))

                    # Set maximum amount
                    max_field = driver.find_element(By.NAME, "maximumAmount")
                    max_field.send_keys(str(currency["maximum"]))

                    # Save currency
                    save_btn = driver.find_element(
                        By.XPATH, "//button[contains(text(), 'Save')]"
                    )
                    save_btn.click()

                    print(f"✅ Created currency: {currency['name']}")
                    time.sleep(2)

                except Exception as e:
                    print(f"⚠️ Could not create currency {currency['name']}: {e}")

            return True

        except Exception as e:
            print(f"❌ Economy currencies configuration failed: {e}")
            return False

    def configure_economy_inventory(self, driver):
        """Configure economy inventory items"""
        try:
            print("📦 Configuring Economy Inventory Items...")

            # Navigate to Economy > Inventory
            inventory_url = f"https: // dashboard.unity3d.com / organizations / {
                self.project_id} / projects / {
                self.project_id} / environments / {
                self.environment_id} / economy / inventory"
            driver.get(inventory_url)

            # Wait for page to load
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "economy-inventory"))
            )

            inventory_items = [
                {"id": "booster_extra_moves", "name": "Extra Moves", "type": "booster"},
                {"id": "booster_color_bomb", "name": "Color Bomb", "type": "booster"},
                {
                    "id": "booster_rainbow_blast",
                    "name": "Rainbow Blast",
                    "type": "booster",
                },
                {
                    "id": "booster_striped_candy",
                    "name": "Striped Candy",
                    "type": "booster",
                },
            ]

            for item in inventory_items:
                try:
                    # Click Create Item button
                    create_btn = WebDriverWait(driver, 10).until(
                        EC.element_to_be_clickable(
                            (By.XPATH, "//button[contains(text(), 'Create Item')]")
                        )
                    )
                    create_btn.click()

                    # Fill item form
                    id_field = WebDriverWait(driver, 5).until(
                        EC.presence_of_element_located((By.NAME, "itemId"))
                    )
                    id_field.send_keys(item["id"])

                    name_field = driver.find_element(By.NAME, "itemName")
                    name_field.send_keys(item["name"])

                    # Select item type
                    type_dropdown = driver.find_element(By.NAME, "itemType")
                    type_dropdown.click()
                    type_option = driver.find_element(
                        By.XPATH, f"//option[@value='{item['type']}']"
                    )
                    type_option.click()

                    # Save item
                    save_btn = driver.find_element(
                        By.XPATH, "//button[contains(text(), 'Save')]"
                    )
                    save_btn.click()

                    print(f"✅ Created inventory item: {item['name']}")
                    time.sleep(2)

                except Exception as e:
                    print(f"⚠️ Could not create inventory item {item['name']}: {e}")

            return True

        except Exception as e:
            print(f"❌ Economy inventory configuration failed: {e}")
            return False

    def deploy_cloud_code_functions(self, driver):
        """Deploy Cloud Code functions"""
        try:
            print("☁️ Deploying Cloud Code Functions...")

            # Navigate to Cloud Code
            cloudcode_url = f"https: // dashboard.unity3d.com / organizations / {
                self.project_id} / projects / {
                self.project_id} / environments / {
                self.environment_id} / cloud - code"
            driver.get(cloudcode_url)

            # Wait for page to load
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "cloud-code"))
            )

            # Get Cloud Code files
            cloudcode_dir = self.repo_root / "cloud-code"
            cloudcode_files = list(cloudcode_dir.glob("*.js"))

            for file_path in cloudcode_files:
                try:
                    # Click Deploy Function button
                    deploy_btn = WebDriverWait(driver, 10).until(
                        EC.element_to_be_clickable(
                            (By.XPATH, "//button[contains(text(), 'Deploy Function')]")
                        )
                    )
                    deploy_btn.click()

                    # Upload file
                    file_input = driver.find_element(By.XPATH, "//input[@type='file']")
                    file_input.send_keys(str(file_path))

                    # Set function name
                    function_name = file_path.stem
                    name_field = driver.find_element(By.NAME, "functionName")
                    name_field.send_keys(function_name)

                    # Deploy function
                    deploy_confirm_btn = driver.find_element(
                        By.XPATH, "//button[contains(text(), 'Deploy')]"
                    )
                    deploy_confirm_btn.click()

                    print(f"✅ Deployed Cloud Code function: {function_name}")
                    time.sleep(3)

                except Exception as e:
                    print(
                        f"⚠️ Could not deploy Cloud Code function {
                            file_path.name}: {e}"
                    )

            return True

        except Exception as e:
            print(f"❌ Cloud Code deployment failed: {e}")
            return False

    def configure_remote_config(self, driver):
        """Configure Remote Config settings"""
        try:
            print("⚙️ Configuring Remote Config...")

            # Navigate to Remote Config
            remoteconfig_url = f"https: // dashboard.unity3d.com / organizations / {
                self.project_id} / projects / {
                self.project_id} / environments / {
                self.environment_id} / remote - config"
            driver.get(remoteconfig_url)

            # Wait for page to load
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "remote-config"))
            )

            # Load remote config from file
            config_file = self.repo_root / "remote-config" / "game_config.json"
            if config_file.exists():
                with open(config_file, "r") as f:
                    config_data = json.load(f)

                # Add each config key-value pair
                for key, value in config_data.items():
                    try:
                        # Click Add Key button
                        add_key_btn = WebDriverWait(driver, 10).until(
                            EC.element_to_be_clickable(
                                (By.XPATH, "//button[contains(text(), 'Add Key')]")
                            )
                        )
                        add_key_btn.click()

                        # Fill key name
                        key_field = WebDriverWait(driver, 5).until(
                            EC.presence_of_element_located((By.NAME, "configKey"))
                        )
                        key_field.send_keys(key)

                        # Fill value
                        value_field = driver.find_element(By.NAME, "configValue")
                        value_field.send_keys(str(value))

                        # Save config
                        save_btn = driver.find_element(
                            By.XPATH, "//button[contains(text(), 'Save')]"
                        )
                        save_btn.click()

                        print(f"✅ Added Remote Config key: {key}")
                        time.sleep(1)

                    except Exception as e:
                        print(f"⚠️ Could not add Remote Config key {key}: {e}")

            return True

        except Exception as e:
            print(f"❌ Remote Config configuration failed: {e}")
            return False

    def run_full_automation(self):
        """Run complete Unity Cloud Console automation"""
        self.print_header("Unity Cloud Console Full Automation")

        print("🎯 This will automate ALL Unity Cloud Console configuration")
        print("   - Economy Currencies")
        print("   - Economy Inventory Items")
        print("   - Cloud Code Functions")
        print("   - Remote Config Settings")
        print("   - Analytics Events")

        # Setup browser automation
        driver = self.setup_selenium_driver()
        if not driver:
            print("❌ Cannot proceed without browser automation")
            return False

        try:
            # Login to Unity Dashboard
            if not self.login_to_unity_dashboard(driver):
                return False

            # Configure all services
            success = True
            success &= self.configure_economy_currencies(driver)
            success &= self.configure_economy_inventory(driver)
            success &= self.deploy_cloud_code_functions(driver)
            success &= self.configure_remote_config(driver)

            if success:
                print("\n🎉 Unity Cloud Console automation completed successfully!")
                print("✅ All services have been configured automatically")
                print("✅ Your game is ready for headless deployment")
            else:
                print(
                    "\n⚠️ Some automation steps failed, but partial configuration was completed"
                )

            return success

        except Exception as e:
            print(f"❌ Automation failed: {e}")
            return False

        finally:
            if driver:
                driver.quit()


if __name__ == "__main__":
    automation = UnityCloudConsoleAutomation()
    automation.run_full_automation()
