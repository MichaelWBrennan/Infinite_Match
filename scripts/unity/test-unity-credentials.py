#!/usr/bin/env python3
"""
Unity Credentials Tester
Tests different Unity Cloud authentication methods to identify the issue
"""

import requests
import json
import os
from datetime import datetime


class UnityCredentialsTester:
    def __init__(self):
        self.email = os.getenv('UNITY_EMAIL', 'michaelwilliambrennan@gmail.com')
        self.password = os.getenv('UNITY_PASSWORD', '')
        self.client_id = os.getenv('UNITY_CLIENT_ID', 'dcaaaf87-ec84-4858-a2ce-6c0d3d675d37')
        self.client_secret = os.getenv('UNITY_CLIENT_SECRET', 'cYXSmRDM4Vicmv7MuqT-U5pbqLXvTO8l')
        self.api_token = os.getenv('UNITY_API_TOKEN', 'a4c1d202-e774-4ac4-8387-861b29394f5e')
        self.organization_id = os.getenv('UNITY_ORG_ID', '2473931369648')

    def print_header(self, title):
        """Print formatted header"""
        print("\n" + "=" * 80)
        print(f"🎮 {title}")
        print("=" * 80)

    def test_oauth_authentication(self):
        """Test OAuth2 client credentials flow"""
        print("🔐 Testing OAuth2 Client Credentials Authentication...")
        
        try:
            auth_url = 'https://services.api.unity.com/oauth/token'
            auth_data = {
                'grant_type': 'client_credentials',
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'scope': 'economy inventory cloudcode remoteconfig',
            }

            response = requests.post(auth_url, data=auth_data, timeout=30)

            print(f"   Status Code: {response.status_code}")
            print(f"   Response: {response.text}")

            if response.status_code == 200:
                data = response.json()
                print("   ✅ OAuth2 authentication successful")
                return data.get('access_token')
            else:
                print(f"   ❌ OAuth2 authentication failed")
                return None
        except Exception as error:
            print(f"   ❌ OAuth2 authentication error: {error}")
            return None

    def test_api_token_authentication(self):
        """Test API token authentication"""
        print("🔑 Testing API Token Authentication...")
        
        try:
            # Try to use the API token directly
            headers = {
                'Authorization': f'Bearer {self.api_token}',
                'Content-Type': 'application/json',
            }

            # Test with a simple endpoint
            test_url = 'https://services.api.unity.com/projects/v1/projects'
            response = requests.get(test_url, headers=headers, timeout=30)

            print(f"   Status Code: {response.status_code}")
            print(f"   Response: {response.text[:200]}...")

            if response.status_code == 200:
                print("   ✅ API token authentication successful")
                return True
            else:
                print(f"   ❌ API token authentication failed")
                return False
        except Exception as error:
            print(f"   ❌ API token authentication error: {error}")
            return False

    def test_alternative_endpoints(self):
        """Test alternative Unity Cloud API endpoints"""
        print("🌐 Testing Alternative Unity Cloud API Endpoints...")
        
        endpoints = [
            'https://services.api.unity.com/oauth/token',
            'https://api.unity.com/oauth/token',
            'https://cloud.unity.com/api/oauth/token',
            'https://dashboard.unity3d.com/api/oauth/token'
        ]

        for endpoint in endpoints:
            try:
                print(f"   Testing: {endpoint}")
                auth_data = {
                    'grant_type': 'client_credentials',
                    'client_id': self.client_id,
                    'client_secret': self.client_secret,
                    'scope': 'economy inventory cloudcode remoteconfig',
                }

                response = requests.post(endpoint, data=auth_data, timeout=10)
                print(f"     Status: {response.status_code}")
                
                if response.status_code != 404:
                    print(f"     Response: {response.text[:100]}...")
                    
            except Exception as error:
                print(f"     Error: {error}")

    def test_credentials_format(self):
        """Test if credentials are in the correct format"""
        print("📋 Testing Credentials Format...")
        
        print(f"   Client ID: {self.client_id}")
        print(f"   Client ID Length: {len(self.client_id)}")
        print(f"   Client ID Format: {'UUID-like' if len(self.client_id) == 36 and '-' in self.client_id else 'Not UUID-like'}")
        
        print(f"   Client Secret: {self.client_secret}")
        print(f"   Client Secret Length: {len(self.client_secret)}")
        print(f"   Client Secret Format: {'Alphanumeric' if self.client_secret.replace('-', '').isalnum() else 'Contains special chars'}")
        
        print(f"   API Token: {self.api_token}")
        print(f"   API Token Length: {len(self.api_token)}")
        print(f"   API Token Format: {'UUID-like' if len(self.api_token) == 36 and '-' in self.api_token else 'Not UUID-like'}")

    def test_unity_dashboard_access(self):
        """Test if we can access Unity Dashboard"""
        print("🌐 Testing Unity Dashboard Access...")
        
        try:
            dashboard_url = 'https://dashboard.unity3d.com'
            response = requests.get(dashboard_url, timeout=10)
            
            print(f"   Dashboard Status: {response.status_code}")
            if response.status_code == 200:
                print("   ✅ Unity Dashboard is accessible")
                return True
            else:
                print("   ⚠️ Unity Dashboard returned non-200 status")
                return False
        except Exception as error:
            print(f"   ❌ Unity Dashboard access error: {error}")
            return False

    def test_organization_access(self):
        """Test if we can access the organization"""
        print("🏢 Testing Organization Access...")
        
        try:
            # Try to access organization info
            org_url = f'https://services.api.unity.com/organizations/v1/organizations/{self.organization_id}'
            headers = {
                'Authorization': f'Bearer {self.api_token}',
                'Content-Type': 'application/json',
            }

            response = requests.get(org_url, headers=headers, timeout=30)
            
            print(f"   Organization Status: {response.status_code}")
            print(f"   Organization Response: {response.text[:200]}...")
            
            if response.status_code == 200:
                print("   ✅ Organization access successful")
                return True
            else:
                print("   ❌ Organization access failed")
                return False
        except Exception as error:
            print(f"   ❌ Organization access error: {error}")
            return False

    def run_all_tests(self):
        """Run all credential tests"""
        self.print_header("UNITY CREDENTIALS TESTER")
        print(f"Email: {self.email}")
        print(f"Client ID: {self.client_id}")
        print(f"Organization ID: {self.organization_id}")
        print("=" * 80 + "\n")

        # Test credentials format
        self.test_credentials_format()
        print()

        # Test dashboard access
        self.test_unity_dashboard_access()
        print()

        # Test OAuth authentication
        oauth_token = self.test_oauth_authentication()
        print()

        # Test API token authentication
        api_token_works = self.test_api_token_authentication()
        print()

        # Test organization access
        org_access = self.test_organization_access()
        print()

        # Test alternative endpoints
        self.test_alternative_endpoints()
        print()

        # Summary
        print("=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        print(f"OAuth Authentication: {'✅ Success' if oauth_token else '❌ Failed'}")
        print(f"API Token Authentication: {'✅ Success' if api_token_works else '❌ Failed'}")
        print(f"Organization Access: {'✅ Success' if org_access else '❌ Failed'}")
        
        if not oauth_token and not api_token_works:
            print("\n💡 RECOMMENDATIONS:")
            print("1. Check if the API credentials are correctly configured in Unity Dashboard")
            print("2. Verify the Client ID and Secret are active and not expired")
            print("3. Ensure the API key has the correct permissions")
            print("4. Check if your Unity account has the necessary access rights")
            print("5. Consider using headless mode instead: npm run unity:test-headless")

        return oauth_token or api_token_works


def main():
    """Main function"""
    tester = UnityCredentialsTester()
    success = tester.run_all_tests()
    
    if success:
        print(f"\n✅ At least one authentication method is working!")
        return 0
    else:
        print(f"\n❌ All authentication methods failed")
        print(f"\n💡 Consider using headless mode: npm run unity:test-headless")
        return 1


if __name__ == "__main__":
    exit(main())