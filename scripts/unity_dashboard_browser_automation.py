
#!/usr/bin/env python3
'''
Unity Dashboard Browser Automation
Uses Selenium to automate Unity Dashboard interactions
'''

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
import time
import json

class UnityDashboardAutomation:
    def __init__(self):
        self.driver = None
        self.project_id = "0dd5a03e-7f23-49c4-964e-7919c48c0574"
        self.environment_id = "1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"
        
    def setup_driver(self):
        """Setup Chrome driver"""
        from selenium.webdriver.chrome.options import Options
        
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            return True
        except Exception as e:
            print(f"❌ Chrome driver setup failed: {e}")
            print("Please install Chrome and ChromeDriver")
            return False
    
    def login_to_unity(self):
        """Login to Unity Dashboard"""
        try:
            # Navigate to Unity Dashboard
            dashboard_url = f"https://dashboard.unity3d.com/organizations/{self.project_id}/projects/{self.project_id}/environments/{self.environment_id}"
            self.driver.get(dashboard_url)
            
            # Wait for page to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            print("✅ Unity Dashboard loaded")
            return True
            
        except Exception as e:
            print(f"❌ Unity Dashboard login failed: {e}")
            return False
    
    def create_currencies(self):
        """Create currencies in Unity Dashboard"""
        try:
            # Navigate to Economy > Currencies
            economy_url = f"https://dashboard.unity3d.com/organizations/{self.project_id}/projects/{self.project_id}/environments/{self.environment_id}/economy/currencies"
            self.driver.get(economy_url)
            
            currencies = [
                {"id": "coins", "name": "Coins", "type": "soft_currency", "initial": 1000, "maximum": 999999},
                {"id": "gems", "name": "Gems", "type": "hard_currency", "initial": 50, "maximum": 99999},
                {"id": "energy", "name": "Energy", "type": "consumable", "initial": 5, "maximum": 30}
            ]
            
            for currency in currencies:
                try:
                    # Click Create Currency button
                    create_btn = WebDriverWait(self.driver, 10).until(
                        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Create') or contains(text(), 'Add')]"))
                    )
                    create_btn.click()
                    
                    # Fill form fields
                    id_field = self.driver.find_element(By.NAME, "id")
                    id_field.clear()
                    id_field.send_keys(currency["id"])
                    
                    name_field = self.driver.find_element(By.NAME, "name")
                    name_field.clear()
                    name_field.send_keys(currency["name"])
                    
                    # Select type
                    type_select = self.driver.find_element(By.NAME, "type")
                    type_select.click()
                    type_option = self.driver.find_element(By.XPATH, f"//option[contains(text(), '{currency['type']}')]")
                    type_option.click()
                    
                    # Fill initial amount
                    initial_field = self.driver.find_element(By.NAME, "initial")
                    initial_field.clear()
                    initial_field.send_keys(str(currency["initial"]))
                    
                    # Fill maximum amount
                    max_field = self.driver.find_element(By.NAME, "maximum")
                    max_field.clear()
                    max_field.send_keys(str(currency["maximum"]))
                    
                    # Submit form
                    submit_btn = self.driver.find_element(By.XPATH, "//button[@type='submit']")
                    submit_btn.click()
                    
                    print(f"✅ Created currency: {currency['name']}")
                    time.sleep(2)  # Wait for form submission
                    
                except Exception as e:
                    print(f"⚠️ Could not create currency {currency['name']}: {e}")
            
            return True
            
        except Exception as e:
            print(f"❌ Currency creation failed: {e}")
            return False
    
    def run_automation(self):
        """Run the complete automation"""
        print("🤖 Starting Unity Dashboard automation...")
        
        if not self.setup_driver():
            return False
        
        try:
            if self.login_to_unity():
                self.create_currencies()
                # Add more automation methods here
                
            print("🎉 Automation completed!")
            return True
            
        except Exception as e:
            print(f"❌ Automation failed: {e}")
            return False
        
        finally:
            if self.driver:
                self.driver.quit()

if __name__ == "__main__":
    automation = UnityDashboardAutomation()
    automation.run_automation()
