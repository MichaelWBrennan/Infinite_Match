#!/usr/bin/env python3
"""
Unity CLI Wrapper - Python implementation that can work within sandbox restrictions
This provides a command-line interface similar to the Unity CLI but using Python
"""

import os
import sys
import json
import requests
import argparse
from pathlib import Path

class UnityCLIWrapper:
    def __init__(self):
        self.project_id = "0dd5a03e-7f23-49c4-964e-7919c48c0574"
        self.environment_id = os.getenv('UNITY_ENV_ID', '1d8c470b-d8d2-4a72-88f6')
        self.base_url = "https://services.api.unity.com"
        self.api_token = os.getenv('UNITY_API_TOKEN')
        
        if not self.api_token:
            print("❌ UNITY_API_TOKEN environment variable not set")
            sys.exit(1)
    
    def get_headers(self):
        return {
            'Authorization': f'Bearer {self.api_token}',
            'Content-Type': 'application/json'
        }
    
    def auth_status(self):
        """Check authentication status"""
        try:
            # Try to access economy service to check auth
            response = requests.get(
                f"{self.base_url}/economy/v1/projects/{self.project_id}/environments/{self.environment_id}/currencies",
                headers=self.get_headers()
            )
            if response.status_code == 200:
                print("✅ Authenticated successfully")
                return True
            else:
                print(f"❌ Authentication failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Authentication error: {e}")
            return False
    
    def deploy_cloud_code(self, source_dir, config_file):
        """Deploy cloud code functions"""
        print("☁️ Deploying Cloud Code functions...")
        
        # Read function config
        if not os.path.exists(config_file):
            print(f"❌ Config file not found: {config_file}")
            return False
        
        with open(config_file, 'r') as f:
            config = json.load(f)
        
        # Read source files
        source_path = Path(source_dir)
        if not source_path.exists():
            print(f"❌ Source directory not found: {source_dir}")
            return False
        
        functions = []
        for func_config in config.get('functions', []):
            func_name = func_config['name']
            func_file = source_path / f"{func_name}.cs"
            
            if func_file.exists():
                with open(func_file, 'r') as f:
                    func_code = f.read()
                
                functions.append({
                    'name': func_name,
                    'code': func_code,
                    'language': 'csharp',
                    'description': func_config.get('description', ''),
                    'parameters': func_config.get('parameters', [])
                })
                print(f"  ✅ Found function: {func_name}")
            else:
                print(f"  ❌ Function file not found: {func_file}")
        
        if not functions:
            print("❌ No functions found to deploy")
            return False
        
        # Deploy each function
        for func in functions:
            try:
                response = requests.post(
                    f"{self.base_url}/cloud-code/v1/projects/{self.project_id}/environments/{self.environment_id}/functions",
                    headers=self.get_headers(),
                    json=func
                )
                
                if response.status_code in [200, 201]:
                    print(f"  ✅ Deployed: {func['name']}")
                else:
                    print(f"  ❌ Failed to deploy {func['name']}: {response.status_code}")
                    print(f"     Response: {response.text}")
            except Exception as e:
                print(f"  ❌ Error deploying {func['name']}: {e}")
        
        return True
    
    def deploy_economy_currencies(self, csv_file):
        """Deploy economy currencies"""
        print("💰 Deploying Economy currencies...")
        
        if not os.path.exists(csv_file):
            print(f"❌ CSV file not found: {csv_file}")
            return False
        
        # Read CSV and convert to JSON
        currencies = []
        with open(csv_file, 'r') as f:
            lines = f.readlines()
            headers = lines[0].strip().split(',')
            
            for line in lines[1:]:
                values = line.strip().split(',')
                currency = dict(zip(headers, values))
                currencies.append(currency)
        
        # Deploy currencies
        for currency in currencies:
            try:
                response = requests.post(
                    f"{self.base_url}/economy/v1/projects/{self.project_id}/environments/{self.environment_id}/currencies",
                    headers=self.get_headers(),
                    json=currency
                )
                
                if response.status_code in [200, 201]:
                    print(f"  ✅ Deployed currency: {currency['id']}")
                else:
                    print(f"  ❌ Failed to deploy currency {currency['id']}: {response.status_code}")
            except Exception as e:
                print(f"  ❌ Error deploying currency {currency['id']}: {e}")
        
        return True
    
    def deploy_economy_inventory(self, csv_file):
        """Deploy economy inventory items"""
        print("📦 Deploying Economy inventory items...")
        
        if not os.path.exists(csv_file):
            print(f"❌ CSV file not found: {csv_file}")
            return False
        
        # Read CSV and convert to JSON
        items = []
        with open(csv_file, 'r') as f:
            lines = f.readlines()
            headers = lines[0].strip().split(',')
            
            for line in lines[1:]:
                values = line.strip().split(',')
                item = dict(zip(headers, values))
                items.append(item)
        
        # Deploy inventory items
        for item in items:
            try:
                response = requests.post(
                    f"{self.base_url}/economy/v1/projects/{self.project_id}/environments/{self.environment_id}/inventory",
                    headers=self.get_headers(),
                    json=item
                )
                
                if response.status_code in [200, 201]:
                    print(f"  ✅ Deployed inventory item: {item['id']}")
                else:
                    print(f"  ❌ Failed to deploy inventory item {item['id']}: {response.status_code}")
            except Exception as e:
                print(f"  ❌ Error deploying inventory item {item['id']}: {e}")
        
        return True
    
    def deploy_economy_catalog(self, csv_file):
        """Deploy economy catalog items"""
        print("🛒 Deploying Economy catalog items...")
        
        if not os.path.exists(csv_file):
            print(f"❌ CSV file not found: {csv_file}")
            return False
        
        # Read CSV and convert to JSON
        items = []
        with open(csv_file, 'r') as f:
            lines = f.readlines()
            headers = lines[0].strip().split(',')
            
            for line in lines[1:]:
                values = line.strip().split(',')
                item = dict(zip(headers, values))
                items.append(item)
        
        # Deploy catalog items
        for item in items:
            try:
                response = requests.post(
                    f"{self.base_url}/economy/v1/projects/{self.project_id}/environments/{self.environment_id}/catalog",
                    headers=self.get_headers(),
                    json=item
                )
                
                if response.status_code in [200, 201]:
                    print(f"  ✅ Deployed catalog item: {item['id']}")
                else:
                    print(f"  ❌ Failed to deploy catalog item {item['id']}: {response.status_code}")
            except Exception as e:
                print(f"  ❌ Error deploying catalog item {item['id']}: {e}")
        
        return True
    
    def list_cloud_code_functions(self):
        """List cloud code functions"""
        print("☁️ Listing Cloud Code functions...")
        
        try:
            response = requests.get(
                f"{self.base_url}/cloud-code/v1/projects/{self.project_id}/environments/{self.environment_id}/functions",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                functions = response.json()
                if functions:
                    for func in functions:
                        print(f"  📝 {func.get('name', 'Unknown')} - {func.get('description', 'No description')}")
                else:
                    print("  No functions found")
            else:
                print(f"❌ Failed to list functions: {response.status_code}")
        except Exception as e:
            print(f"❌ Error listing functions: {e}")
    
    def list_economy_data(self):
        """List economy data"""
        print("💰 Listing Economy data...")
        
        # List currencies
        try:
            response = requests.get(
                f"{self.base_url}/v1/projects/{self.project_id}/environments/{self.environment_id}/economy/currencies",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                currencies = response.json()
                print(f"  💰 Currencies: {len(currencies)}")
                for currency in currencies:
                    print(f"    - {currency.get('id', 'Unknown')}: {currency.get('name', 'No name')}")
            else:
                print(f"  ❌ Failed to list currencies: {response.status_code}")
        except Exception as e:
            print(f"  ❌ Error listing currencies: {e}")

def main():
    parser = argparse.ArgumentParser(description='Unity CLI Wrapper')
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Auth commands
    subparsers.add_parser('auth', help='Authentication commands')
    auth_parser = subparsers.add_parser('auth-status', help='Check authentication status')
    
    # Cloud Code commands
    cloud_code_parser = subparsers.add_parser('cloud-code', help='Cloud Code commands')
    cloud_code_subparsers = cloud_code_parser.add_subparsers(dest='cloud_code_action')
    cloud_code_subparsers.add_parser('deploy', help='Deploy cloud code functions')
    cloud_code_subparsers.add_parser('list', help='List cloud code functions')
    
    # Economy commands
    economy_parser = subparsers.add_parser('economy', help='Economy commands')
    economy_subparsers = economy_parser.add_subparsers(dest='economy_action')
    economy_subparsers.add_parser('deploy', help='Deploy economy data')
    economy_subparsers.add_parser('list', help='List economy data')
    
    # Deploy all
    subparsers.add_parser('deploy-all', help='Deploy everything')
    
    args = parser.parse_args()
    
    cli = UnityCLIWrapper()
    
    if args.command == 'auth-status':
        cli.auth_status()
    elif args.command == 'cloud-code':
        if args.cloud_code_action == 'deploy':
            cli.deploy_cloud_code('cloud-code-csharp/src', 'cloud-code-csharp/cloud-code-config.json')
        elif args.cloud_code_action == 'list':
            cli.list_cloud_code_functions()
    elif args.command == 'economy':
        if args.economy_action == 'deploy':
            cli.deploy_economy_currencies('economy/currencies.csv')
            cli.deploy_economy_inventory('economy/inventory.csv')
            cli.deploy_economy_catalog('economy/catalog.csv')
        elif args.economy_action == 'list':
            cli.list_economy_data()
    elif args.command == 'deploy-all':
        print("🚀 Deploying everything to Unity Cloud...")
        cli.deploy_cloud_code('cloud-code-csharp/src', 'cloud-code-csharp/cloud-code-config.json')
        cli.deploy_economy_currencies('economy/currencies.csv')
        cli.deploy_economy_inventory('economy/inventory.csv')
        cli.deploy_economy_catalog('economy/catalog.csv')
        print("✅ All deployments completed!")
    else:
        parser.print_help()

if __name__ == '__main__':
    main()