#!/usr/bin/env python3
"""
Unity Cloud Credentials Setup Helper
Helps you configure Unity Cloud API credentials for real deployment
"""

import os
import json
from pathlib import Path

class UnityCredentialsSetup:
    def __init__(self):
        self.env_file = Path(".env")
        self.project_id = "0dd5a03e-7f23-49c4-964e-7919c48c0574"
        self.environment_id = "1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"

    def check_existing_credentials(self):
        """Check if credentials are already set"""
        print("🔍 Checking existing Unity Cloud credentials...")
        
        credentials = {
            "UNITY_API_TOKEN": os.getenv("UNITY_API_TOKEN"),
            "UNITY_CLIENT_ID": os.getenv("UNITY_CLIENT_ID"),
            "UNITY_CLIENT_SECRET": os.getenv("UNITY_CLIENT_SECRET"),
            "UNITY_EMAIL": os.getenv("UNITY_EMAIL"),
            "UNITY_PASSWORD": os.getenv("UNITY_PASSWORD"),
        }
        
        found_credentials = []
        for key, value in credentials.items():
            if value and value != f"${{{key}}}":
                found_credentials.append(key)
                print(f"   ✅ {key}: {'*' * 10}...")
            else:
                print(f"   ❌ {key}: Not set")
        
        return found_credentials

    def setup_api_credentials(self):
        """Setup API credentials interactively"""
        print("\n🔑 Setting up Unity Cloud API Credentials")
        print("=" * 50)
        print("To get your API credentials:")
        print("1. Go to https://dashboard.unity3d.com")
        print("2. Select your project")
        print("3. Go to Settings > API Keys")
        print("4. Create a new API key")
        print("5. Copy the Client ID and Client Secret")
        print("=" * 50)
        
        client_id = input("Enter your Unity Client ID (or press Enter to skip): ").strip()
        client_secret = input("Enter your Unity Client Secret (or press Enter to skip): ").strip()
        
        if client_id and client_secret:
            return {
                "UNITY_CLIENT_ID": client_id,
                "UNITY_CLIENT_SECRET": client_secret,
                "UNITY_PROJECT_ID": self.project_id,
                "UNITY_ENV_ID": self.environment_id
            }
        return {}

    def setup_account_credentials(self):
        """Setup Unity account credentials"""
        print("\n📧 Setting up Unity Account Credentials")
        print("=" * 50)
        print("This will use browser automation to access Unity Dashboard")
        print("=" * 50)
        
        email = input("Enter your Unity email (or press Enter to skip): ").strip()
        password = input("Enter your Unity password (or press Enter to skip): ").strip()
        
        if email and password:
            return {
                "UNITY_EMAIL": email,
                "UNITY_PASSWORD": password,
                "UNITY_PROJECT_ID": self.project_id,
                "UNITY_ENV_ID": self.environment_id
            }
        return {}

    def update_env_file(self, credentials):
        """Update .env file with credentials"""
        if not credentials:
            print("⚠️ No credentials provided, skipping .env update")
            return
        
        print(f"\n📝 Updating .env file with {len(credentials)} credentials...")
        
        # Read existing .env file
        env_content = []
        if self.env_file.exists():
            with open(self.env_file, 'r') as f:
                env_content = f.readlines()
        
        # Update or add credentials
        updated_lines = []
        updated_keys = set()
        
        for line in env_content:
            if '=' in line:
                key = line.split('=')[0].strip()
                if key in credentials:
                    updated_lines.append(f"{key}={credentials[key]}\n")
                    updated_keys.add(key)
                else:
                    updated_lines.append(line)
            else:
                updated_lines.append(line)
        
        # Add new credentials
        for key, value in credentials.items():
            if key not in updated_keys:
                updated_lines.append(f"{key}={value}\n")
        
        # Write updated .env file
        with open(self.env_file, 'w') as f:
            f.writelines(updated_lines)
        
        print(f"✅ Updated .env file with credentials: {', '.join(credentials.keys())}")

    def test_credentials(self, credentials):
        """Test the credentials by running a simple API call"""
        if not credentials:
            print("⚠️ No credentials to test")
            return False
        
        print("\n🧪 Testing credentials...")
        
        # Set environment variables for testing
        for key, value in credentials.items():
            os.environ[key] = value
        
        try:
            # Import and test the real API script
            import sys
            sys.path.append('scripts')
            from unity_real_cloud_api import UnityCloudRealAPI
            
            api = UnityCloudRealAPI()
            if api.authenticate():
                print("✅ Credentials are valid!")
                return True
            else:
                print("❌ Credentials are invalid")
                return False
        except Exception as e:
            print(f"❌ Error testing credentials: {e}")
            return False

    def run_setup(self):
        """Run the complete setup process"""
        print("🚀 Unity Cloud Credentials Setup")
        print("=" * 40)
        
        # Check existing credentials
        existing = self.check_existing_credentials()
        
        if existing:
            print(f"\n✅ Found existing credentials: {', '.join(existing)}")
            use_existing = input("Use existing credentials? (y/n): ").strip().lower()
            if use_existing == 'y':
                print("✅ Using existing credentials")
                return True
        
        print("\nChoose setup method:")
        print("1. API Credentials (Client ID/Secret) - Recommended")
        print("2. Unity Account (Email/Password) - Browser automation")
        print("3. Skip setup (use mock mode)")
        
        choice = input("Enter your choice (1-3): ").strip()
        
        credentials = {}
        
        if choice == "1":
            credentials.update(self.setup_api_credentials())
        elif choice == "2":
            credentials.update(self.setup_account_credentials())
        elif choice == "3":
            print("⚠️ Skipping setup - will use mock mode")
            return False
        else:
            print("❌ Invalid choice")
            return False
        
        if credentials:
            self.update_env_file(credentials)
            
            # Test credentials
            if self.test_credentials(credentials):
                print("\n🎉 Setup complete! Credentials are working.")
                return True
            else:
                print("\n❌ Setup failed. Please check your credentials.")
                return False
        else:
            print("\n⚠️ No credentials provided")
            return False

if __name__ == "__main__":
    setup = UnityCredentialsSetup()
    setup.run_setup()