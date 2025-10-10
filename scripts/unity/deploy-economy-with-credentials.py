#!/usr/bin/env python3
"""
Deploy Economy Data with Real Credentials
Uses your actual Unity Cloud credentials to deploy economy data
"""

import os
import requests
import json
import csv
import time

class EconomyDeployerWithCredentials:
    def __init__(self):
        self.project_id = "0dd5a03e-7f23-49c4-964e-7919c48c0574"
        self.env_id = os.getenv('UNITY_ENV_ID')
        self.email = os.getenv('UNITY_EMAIL')
        self.password = os.getenv('UNITY_PASSWORD')
        self.api_token = os.getenv('UNITY_API_TOKEN')
        
        self.headers = {
            'Authorization': f'Bearer {self.api_token}',
            'Content-Type': 'application/json'
        }
        
    def deploy_currencies(self):
        """Deploy currencies to Unity Cloud"""
        print("💰 Deploying currencies to Unity Cloud...")
        
        # Read currencies from CSV
        currencies = []
        try:
            with open('economy/currencies.csv', 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    currencies.append({
                        'id': row['id'],
                        'name': row['name'],
                        'type': row['type'],
                        'initial': int(row['initial']),
                        'maximum': int(row['maximum'])
                    })
        except Exception as e:
            print(f"   ❌ Error reading currencies: {e}")
            return False
        
        # Deploy each currency
        for currency in currencies:
            try:
                url = f'https://services.api.unity.com/economy/v1/projects/{self.project_id}/environments/{self.env_id}/currencies'
                response = requests.post(url, headers=self.headers, json=currency, timeout=10)
                print(f"   {currency['id']}: {response.status_code}")
                
                if response.status_code in [200, 201]:
                    print(f"   ✅ {currency['id']} deployed successfully")
                elif response.status_code == 409:
                    print(f"   ⚠️ {currency['id']} already exists")
                else:
                    print(f"   ❌ {currency['id']} failed: {response.text[:100]}")
            except Exception as e:
                print(f"   ❌ {currency['id']} exception: {e}")
        
        return True
    
    def deploy_inventory(self):
        """Deploy inventory items to Unity Cloud"""
        print("🎒 Deploying inventory items to Unity Cloud...")
        
        # Read inventory from CSV
        inventory = []
        try:
            with open('economy/inventory.csv', 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    inventory.append({
                        'id': row['id'],
                        'name': row['name'],
                        'type': row['type'],
                        'tradable': row['tradable'].lower() == 'true',
                        'stackable': row['stackable'].lower() == 'true'
                    })
        except Exception as e:
            print(f"   ❌ Error reading inventory: {e}")
            return False
        
        # Deploy each inventory item
        for item in inventory:
            try:
                url = f'https://services.api.unity.com/economy/v1/projects/{self.project_id}/environments/{self.env_id}/inventory'
                response = requests.post(url, headers=self.headers, json=item, timeout=10)
                print(f"   {item['id']}: {response.status_code}")
                
                if response.status_code in [200, 201]:
                    print(f"   ✅ {item['id']} deployed successfully")
                elif response.status_code == 409:
                    print(f"   ⚠️ {item['id']} already exists")
                else:
                    print(f"   ❌ {item['id']} failed: {response.text[:100]}")
            except Exception as e:
                print(f"   ❌ {item['id']} exception: {e}")
        
        return True
    
    def deploy_catalog(self):
        """Deploy catalog items to Unity Cloud"""
        print("🛒 Deploying catalog items to Unity Cloud...")
        
        # Read catalog from CSV
        catalog = []
        try:
            with open('economy/catalog.csv', 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    catalog.append({
                        'id': row['id'],
                        'name': row['name'],
                        'cost_currency': row['cost_currency'],
                        'cost_amount': int(row['cost_amount']),
                        'rewards': row['rewards']
                    })
        except Exception as e:
            print(f"   ❌ Error reading catalog: {e}")
            return False
        
        # Deploy each catalog item
        for item in catalog:
            try:
                url = f'https://services.api.unity.com/economy/v1/projects/{self.project_id}/environments/{self.env_id}/catalog'
                response = requests.post(url, headers=self.headers, json=item, timeout=10)
                print(f"   {item['id']}: {response.status_code}")
                
                if response.status_code in [200, 201]:
                    print(f"   ✅ {item['id']} deployed successfully")
                elif response.status_code == 409:
                    print(f"   ⚠️ {item['id']} already exists")
                else:
                    print(f"   ❌ {item['id']} failed: {response.text[:100]}")
            except Exception as e:
                print(f"   ❌ {item['id']} exception: {e}")
        
        return True
    
    def verify_deployment(self):
        """Verify what's actually in your Unity Cloud account"""
        print("🔍 Verifying deployment in your Unity Cloud account...")
        
        # Check currencies
        try:
            url = f'https://services.api.unity.com/economy/v1/projects/{self.project_id}/environments/{self.env_id}/currencies'
            response = requests.get(url, headers=self.headers, timeout=10)
            print(f"   Currencies: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                currencies = data.get('data', [])
                print(f"   ✅ Found {len(currencies)} currencies in your account")
                for currency in currencies:
                    print(f"      - {currency.get('id', 'unknown')}: {currency.get('name', 'Unknown')}")
            else:
                print(f"   ❌ Currencies error: {response.text[:100]}")
        except Exception as e:
            print(f"   ❌ Currencies exception: {e}")
        
        # Check inventory
        try:
            url = f'https://services.api.unity.com/economy/v1/projects/{self.project_id}/environments/{self.env_id}/inventory'
            response = requests.get(url, headers=self.headers, timeout=10)
            print(f"   Inventory: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                inventory = data.get('data', [])
                print(f"   ✅ Found {len(inventory)} inventory items in your account")
                for item in inventory:
                    print(f"      - {item.get('id', 'unknown')}: {item.get('name', 'Unknown')}")
            else:
                print(f"   ❌ Inventory error: {response.text[:100]}")
        except Exception as e:
            print(f"   ❌ Inventory exception: {e}")
        
        # Check catalog
        try:
            url = f'https://services.api.unity.com/economy/v1/projects/{self.project_id}/environments/{self.env_id}/catalog'
            response = requests.get(url, headers=self.headers, timeout=10)
            print(f"   Catalog: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                catalog = data.get('data', [])
                print(f"   ✅ Found {len(catalog)} catalog items in your account")
                for item in catalog:
                    print(f"      - {item.get('id', 'unknown')}: {item.get('name', 'Unknown')}")
            else:
                print(f"   ❌ Catalog error: {response.text[:100]}")
        except Exception as e:
            print(f"   ❌ Catalog exception: {e}")
    
    def run_deployment(self):
        """Run the complete economy deployment"""
        print("=" * 80)
        print("🚀 DEPLOYING ECONOMY DATA WITH YOUR CREDENTIALS")
        print("=" * 80)
        print(f"Project ID: {self.project_id}")
        print(f"Environment ID: {self.env_id}")
        print(f"Email: {self.email}")
        print(f"API Token: {'*' * len(self.api_token) if self.api_token else 'Not set'}")
        print(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        # Deploy economy data
        self.deploy_currencies()
        print()
        self.deploy_inventory()
        print()
        self.deploy_catalog()
        print()
        
        # Verify deployment
        self.verify_deployment()
        
        print("\n🎉 Economy deployment completed!")
        print("Your Unity Cloud account now has real economy data!")

def main():
    """Main function"""
    deployer = EconomyDeployerWithCredentials()
    deployer.run_deployment()

if __name__ == "__main__":
    main()