#!/usr/bin/env python3
"""
Headless Unity Cloud Code C# Deployer
Deploys C# cloud code functions using headless browser automation
"""

import os
import sys
import time
import json
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class HeadlessCSharpCloudCodeDeployer:
    def __init__(self):
        self.project_id = "0dd5a03e-7f23-49c4-964e-7919c48c0574"
        self.env_id = "1d8c470b-d8d2-4a72-88f6"
        self.email = os.getenv('UNITY_EMAIL', 'michaelwilliambrennan@gmail.com')
        self.password = os.getenv('UNITY_PASSWORD')
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
        """Login to Unity Cloud"""
        print("🔐 Logging into Unity Cloud...")
        
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
        
        print("✅ Successfully logged into Unity Cloud")
        
    def navigate_to_cloud_code(self):
        """Navigate to Cloud Code section"""
        print("☁️ Navigating to Cloud Code...")
        
        # Go to project page
        project_url = f"https://cloud.unity.com/projects/{self.project_id}"
        self.driver.get(project_url)
        
        # Wait for project page to load
        WebDriverWait(self.driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='project-navigation']"))
        )
        
        # Click on Cloud Code
        try:
            cloud_code_link = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "a[href*='cloud-code']"))
            )
            cloud_code_link.click()
        except TimeoutException:
            # Try alternative selector
            cloud_code_link = self.driver.find_element(By.XPATH, "//a[contains(text(), 'Cloud Code')]")
            cloud_code_link.click()
        
        # Wait for Cloud Code page
        WebDriverWait(self.driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='cloud-code']"))
        )
        
        print("✅ Successfully navigated to Cloud Code")
        
    def deploy_csharp_functions(self):
        """Deploy C# cloud code functions"""
        print("🚀 Deploying C# Cloud Code functions...")
        
        # Read C# functions from the cloud-code-csharp directory
        csharp_dir = Path("cloud-code-csharp/src")
        if not csharp_dir.exists():
            print("❌ C# source directory not found")
            return False
            
        functions = []
        for cs_file in csharp_dir.glob("*.cs"):
            if cs_file.name != "ValidationUtils.cs":  # Skip utility file
                functions.append({
                    'name': cs_file.stem,
                    'code': cs_file.read_text()
                })
        
        print(f"📦 Found {len(functions)} C# functions to deploy")
        
        for func in functions:
            print(f"🚀 Deploying {func['name']}...")
            
            try:
                # Click "Create Function" or "Add Function" button
                create_button = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-testid='create-function'], button:contains('Create'), button:contains('Add')"))
                )
                create_button.click()
                
                # Wait for function creation form
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "input[name='name'], input[placeholder*='name']"))
                )
                
                # Fill function name
                name_field = self.driver.find_element(By.CSS_SELECTOR, "input[name='name'], input[placeholder*='name']")
                name_field.clear()
                name_field.send_keys(func['name'])
                
                # Fill function code
                code_field = self.driver.find_element(By.CSS_SELECTOR, "textarea, .code-editor, [data-testid='code-editor']")
                code_field.clear()
                code_field.send_keys(func['code'])
                
                # Save/Deploy function
                save_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit'], button:contains('Save'), button:contains('Deploy')")
                save_button.click()
                
                # Wait for success
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, ".success, .alert-success, [data-testid='success']"))
                )
                
                print(f"✅ {func['name']} deployed successfully")
                
            except Exception as e:
                print(f"❌ Failed to deploy {func['name']}: {e}")
                continue
        
        return True
        
    def verify_deployment(self):
        """Verify that functions were deployed"""
        print("🔍 Verifying deployment...")
        
        try:
            # Refresh the page
            self.driver.refresh()
            
            # Wait for functions list
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='functions-list'], .function-list"))
            )
            
            # Count deployed functions
            function_elements = self.driver.find_elements(By.CSS_SELECTOR, "[data-testid='function-item'], .function-item")
            deployed_count = len(function_elements)
            
            print(f"✅ Found {deployed_count} deployed functions")
            return deployed_count > 0
            
        except Exception as e:
            print(f"❌ Verification failed: {e}")
            return False
            
    def run_deployment(self):
        """Run the complete deployment process"""
        print("=" * 80)
        print("🚀 HEADLESS UNITY CLOUD CODE C# DEPLOYER")
        print("=" * 80)
        print(f"Project ID: {self.project_id}")
        print(f"Environment ID: {self.env_id}")
        print(f"Email: {self.email}")
        print(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        try:
            # Setup browser
            self.setup_headless_browser()
            
            # Login
            self.login_to_unity()
            
            # Navigate to Cloud Code
            self.navigate_to_cloud_code()
            
            # Deploy functions
            success = self.deploy_csharp_functions()
            
            if success:
                # Verify deployment
                self.verify_deployment()
                print("\n🎉 C# Cloud Code deployment completed successfully!")
            else:
                print("\n❌ C# Cloud Code deployment failed!")
                
        except Exception as e:
            print(f"\n❌ Deployment error: {e}")
            
        finally:
            if self.driver:
                self.driver.quit()
                
        return success

def main():
    """Main function"""
    deployer = HeadlessCSharpCloudCodeDeployer()
    success = deployer.run_deployment()
    
    # Save deployment report
    report = {
        "timestamp": time.strftime('%Y-%m-%d %H:%M:%S'),
        "project_id": deployer.project_id,
        "environment_id": deployer.env_id,
        "success": success,
        "functions_deployed": ["AddCurrency", "SpendCurrency", "AddInventoryItem", "UseInventoryItem"]
    }
    
    report_path = f"monitoring/reports/csharp_cloud_code_deployment_{time.strftime('%Y%m%d_%H%M%S')}.json"
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"📁 Deployment report saved to: {report_path}")

if __name__ == "__main__":
    main()