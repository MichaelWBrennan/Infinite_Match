#!/usr/bin/env python3
"""
Unity API 100% Automation
Uses Unity's internal APIs for complete automation
"""

import json
import os
import time

import requests


class UnityAPIAutomation:
    def __init__(self):
        self.base_url = "https://services.api.unity.com"
        self.project_id = os.getenv("UNITY_PROJECT_ID")
        self.environment_id = os.getenv("UNITY_ENV_ID")
        self.client_id = os.getenv("UNITY_CLIENT_ID")
        self.client_secret = os.getenv("UNITY_CLIENT_SECRET")
        self.access_token = None

    def authenticate(self):
        """Authenticate with Unity Services API"""
        try:
            auth_url = f"{self.base_url}/oauth/token"
            auth_data = {
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "scope": "economy inventory cloudcode remoteconfig",
            }

            response = requests.post(auth_url, data=auth_data)
            if response.status_code == 200:
                self.access_token = response.json()["access_token"]
                print("✅ Unity API authentication successful")
                return True
            else:
                print(f"❌ Authentication failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Authentication error: {e}")
            return False

    def create_currency(self, currency_data):
        """Create currency via API"""
        try:
            url = f"{self.base_url}/economy/v1/projects/{self.project_id}/environments/{self.environment_id}/currencies"
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json",
            }

            response = requests.post(url, headers=headers, json=currency_data)
            if response.status_code in [200, 201]:
                print(f"✅ Created currency: {currency_data['id']}")
                return True
            else:
                print(f"⚠️ Currency creation failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Currency creation error: {e}")
            return False

    def create_inventory_item(self, item_data):
        """Create inventory item via API"""
        try:
            url = f"{
                self.base_url} / economy / v1 / projects / {
                self.project_id} / environments / {
                self.environment_id} / inventory - items"
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json",
            }

            response = requests.post(url, headers=headers, json=item_data)
            if response.status_code in [200, 201]:
                print(f"✅ Created inventory item: {item_data['id']}")
                return True
            else:
                print(f"⚠️ Inventory item creation failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Inventory item creation error: {e}")
            return False

    def create_catalog_item(self, catalog_data):
        """Create catalog item via API"""
        try:
            url = f"{self.base_url}/economy/v1/projects/{self.project_id}/environments/{self.environment_id}/catalog-items"
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json",
            }

            response = requests.post(url, headers=headers, json=catalog_data)
            if response.status_code in [200, 201]:
                print(f"✅ Created catalog item: {catalog_data['id']}")
                return True
            else:
                print(f"⚠️ Catalog item creation failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Catalog item creation error: {e}")
            return False

    def deploy_cloud_code(self, function_data):
        """Deploy Cloud Code function via API"""
        try:
            url = f"{self.base_url}/cloudcode/v1/projects/{self.project_id}/environments/{self.environment_id}/functions"
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json",
            }

            response = requests.post(url, headers=headers, json=function_data)
            if response.status_code in [200, 201]:
                print(f"✅ Deployed Cloud Code function: {function_data['name']}")
                return True
            else:
                print(f"⚠️ Cloud Code deployment failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Cloud Code deployment error: {e}")
            return False

    def run_full_automation(self):
        """Run complete API automation"""
        print("🚀 Starting Unity API 100% Automation...")

        if not self.authenticate():
            return False

        # Load economy data
        with open("economy/currencies.csv", "r") as f:
            currencies = self.parse_csv(f)

        with open("economy/inventory.csv", "r") as f:
            inventory = self.parse_csv(f)

        with open("economy/catalog.csv", "r") as f:
            catalog = self.parse_csv(f)

        # Create currencies
        for currency in currencies:
            self.create_currency(currency)
            time.sleep(0.5)  # Rate limiting

        # Create inventory items
        for item in inventory:
            self.create_inventory_item(item)
            time.sleep(0.5)

        # Create catalog items
        for item in catalog:
            self.create_catalog_item(item)
            time.sleep(0.5)

        print("🎉 API automation completed!")
        return True

    def parse_csv(self, file):
        """Parse CSV file to JSON"""
        lines = file.readlines()
        headers = lines[0].strip().split(",")
        data = []

        for line in lines[1:]:
            values = line.strip().split(",")
            item = dict(zip(headers, values))
            data.append(item)

        return data


if __name__ == "__main__":
    automation = UnityAPIAutomation()
    automation.run_full_automation()
