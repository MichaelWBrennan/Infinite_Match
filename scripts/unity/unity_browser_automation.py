#!/usr/bin/env python3
"""
Unity Cloud Browser Automation Script
Automates Unity Cloud Services via browser automation
"""

import argparse
import json
import sys
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class UnityCloudAutomation:
    def __init__(self):
        self.driver = None
        self.wait = None
        
    def setup_driver(self):
        """Setup Chrome driver with headless options"""
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.wait = WebDriverWait(self.driver, 10)
            return True
        except Exception as e:
            print(json.dumps({
                "success": False,
                "error": f"Failed to setup Chrome driver: {str(e)}",
                "method": "browser-automation"
            }))
            return False
    
    def login(self, email, password):
        """Login to Unity Cloud Services"""
        try:
            self.driver.get("https://dashboard.unity3d.com/")
            
            # Wait for login form
            email_field = self.wait.until(
                EC.presence_of_element_located((By.NAME, "email"))
            )
            password_field = self.driver.find_element(By.NAME, "password")
            
            email_field.send_keys(email)
            password_field.send_keys(password)
            
            # Submit login form
            login_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            login_button.click()
            
            # Wait for dashboard to load
            self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='dashboard']"))
            )
            
            return True
        except Exception as e:
            print(json.dumps({
                "success": False,
                "error": f"Login failed: {str(e)}",
                "method": "browser-automation"
            }))
            return False
    
    def create_currency(self, currency_data):
        """Create a currency in Unity Cloud Services"""
        try:
            # Navigate to Economy service
            self.driver.get("https://dashboard.unity3d.com/organizations/your-org/projects/your-project/economy/currencies")
            
            # Click "Create Currency" button
            create_button = self.wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid='create-currency']"))
            )
            create_button.click()
            
            # Fill currency form
            id_field = self.wait.until(
                EC.presence_of_element_located((By.NAME, "id"))
            )
            id_field.send_keys(currency_data["id"])
            
            name_field = self.driver.find_element(By.NAME, "name")
            name_field.send_keys(currency_data["name"])
            
            type_field = self.driver.find_element(By.NAME, "type")
            type_field.send_keys(currency_data["type"])
            
            if "initial" in currency_data:
                initial_field = self.driver.find_element(By.NAME, "initial")
                initial_field.send_keys(str(currency_data["initial"]))
            
            if "maximum" in currency_data:
                max_field = self.driver.find_element(By.NAME, "maximum")
                max_field.send_keys(str(currency_data["maximum"]))
            
            # Submit form
            submit_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            submit_button.click()
            
            # Wait for success
            self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='success-message']"))
            )
            
            return {
                "success": True,
                "id": currency_data["id"],
                "name": currency_data["name"],
                "method": "browser-automation"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to create currency: {str(e)}",
                "method": "browser-automation"
            }
    
    def create_inventory_item(self, item_data):
        """Create an inventory item in Unity Cloud Services"""
        try:
            # Navigate to Economy service inventory
            self.driver.get("https://dashboard.unity3d.com/organizations/your-org/projects/your-project/economy/inventory")
            
            # Click "Create Item" button
            create_button = self.wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid='create-item']"))
            )
            create_button.click()
            
            # Fill item form
            id_field = self.wait.until(
                EC.presence_of_element_located((By.NAME, "id"))
            )
            id_field.send_keys(item_data["id"])
            
            name_field = self.driver.find_element(By.NAME, "name")
            name_field.send_keys(item_data["name"])
            
            type_field = self.driver.find_element(By.NAME, "type")
            type_field.send_keys(item_data["type"])
            
            if "tradable" in item_data:
                tradable_checkbox = self.driver.find_element(By.NAME, "tradable")
                if item_data["tradable"]:
                    tradable_checkbox.click()
            
            if "stackable" in item_data:
                stackable_checkbox = self.driver.find_element(By.NAME, "stackable")
                if item_data["stackable"]:
                    stackable_checkbox.click()
            
            # Submit form
            submit_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            submit_button.click()
            
            # Wait for success
            self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='success-message']"))
            )
            
            return {
                "success": True,
                "id": item_data["id"],
                "name": item_data["name"],
                "method": "browser-automation"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to create inventory item: {str(e)}",
                "method": "browser-automation"
            }
    
    def create_catalog_item(self, catalog_data):
        """Create a catalog item in Unity Cloud Services"""
        try:
            # Navigate to Economy service catalog
            self.driver.get("https://dashboard.unity3d.com/organizations/your-org/projects/your-project/economy/catalog")
            
            # Click "Create Item" button
            create_button = self.wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid='create-catalog-item']"))
            )
            create_button.click()
            
            # Fill catalog form
            id_field = self.wait.until(
                EC.presence_of_element_located((By.NAME, "id"))
            )
            id_field.send_keys(catalog_data["id"])
            
            name_field = self.driver.find_element(By.NAME, "name")
            name_field.send_keys(catalog_data["name"])
            
            cost_currency_field = self.driver.find_element(By.NAME, "cost_currency")
            cost_currency_field.send_keys(catalog_data["cost_currency"])
            
            cost_amount_field = self.driver.find_element(By.NAME, "cost_amount")
            cost_amount_field.send_keys(str(catalog_data["cost_amount"]))
            
            if "rewards" in catalog_data:
                rewards_field = self.driver.find_element(By.NAME, "rewards")
                rewards_field.send_keys(catalog_data["rewards"])
            
            # Submit form
            submit_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            submit_button.click()
            
            # Wait for success
            self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='success-message']"))
            )
            
            return {
                "success": True,
                "id": catalog_data["id"],
                "name": catalog_data["name"],
                "method": "browser-automation"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to create catalog item: {str(e)}",
                "method": "browser-automation"
            }
    
    def cleanup(self):
        """Clean up resources"""
        if self.driver:
            self.driver.quit()

def main():
    parser = argparse.ArgumentParser(description="Unity Cloud Browser Automation")
    parser.add_argument("--action", required=True, choices=["create_currency", "create_inventory_item", "create_catalog_item"])
    parser.add_argument("--data", required=True, help="JSON data for the action")
    parser.add_argument("--email", help="Unity account email")
    parser.add_argument("--password", help="Unity account password")
    
    args = parser.parse_args()
    
    try:
        data = json.loads(args.data)
    except json.JSONDecodeError as e:
        print(json.dumps({
            "success": False,
            "error": f"Invalid JSON data: {str(e)}",
            "method": "browser-automation"
        }))
        sys.exit(1)
    
    automation = UnityCloudAutomation()
    
    try:
        if not automation.setup_driver():
            sys.exit(1)
        
        # Login if credentials provided
        if args.email and args.password:
            if not automation.login(args.email, args.password):
                sys.exit(1)
        
        # Perform the requested action
        if args.action == "create_currency":
            result = automation.create_currency(data)
        elif args.action == "create_inventory_item":
            result = automation.create_inventory_item(data)
        elif args.action == "create_catalog_item":
            result = automation.create_catalog_item(data)
        else:
            result = {
                "success": False,
                "error": f"Unknown action: {args.action}",
                "method": "browser-automation"
            }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Unexpected error: {str(e)}",
            "method": "browser-automation"
        }))
        sys.exit(1)
    finally:
        automation.cleanup()

if __name__ == "__main__":
    main()