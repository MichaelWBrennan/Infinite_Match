#!/usr/bin/env python3
"""
Real Unity Cloud API Deployment
Uses GitHub secrets or environment variables for real Unity Cloud deployment
"""

import os
import sys
from pathlib import Path

def check_credentials():
    """Check if Unity Cloud credentials are available"""
    print("🔍 Checking Unity Cloud credentials...")
    
    # Check for API credentials
    api_credentials = {
        "UNITY_API_TOKEN": os.getenv("UNITY_API_TOKEN"),
        "UNITY_CLIENT_ID": os.getenv("UNITY_CLIENT_ID"),
        "UNITY_CLIENT_SECRET": os.getenv("UNITY_CLIENT_SECRET"),
    }
    
    # Check for account credentials
    account_credentials = {
        "UNITY_EMAIL": os.getenv("UNITY_EMAIL"),
        "UNITY_PASSWORD": os.getenv("UNITY_PASSWORD"),
    }
    
    # Check project/environment IDs
    project_ids = {
        "UNITY_PROJECT_ID": os.getenv("UNITY_PROJECT_ID", "0dd5a03e-7f23-49c4-964e-7919c48c0574"),
        "UNITY_ENV_ID": os.getenv("UNITY_ENV_ID", "1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"),
    }
    
    print(f"Project ID: {project_ids['UNITY_PROJECT_ID']}")
    print(f"Environment ID: {project_ids['UNITY_ENV_ID']}")
    
    # Check API credentials
    api_available = any(api_credentials.values())
    if api_available:
        print("✅ API credentials found:")
        for key, value in api_credentials.items():
            if value:
                print(f"   {key}: {'*' * 10}...")
    
    # Check account credentials
    account_available = all(account_credentials.values())
    if account_available:
        print("✅ Account credentials found:")
        for key, value in account_credentials.items():
            if value:
                print(f"   {key}: {'*' * 10}...")
    
    if not api_available and not account_available:
        print("❌ No Unity Cloud credentials found")
        print("\nTo use real Unity Cloud API, set one of:")
        print("  UNITY_API_TOKEN=your_api_token")
        print("  UNITY_CLIENT_ID=your_client_id + UNITY_CLIENT_SECRET=your_client_secret")
        print("  UNITY_EMAIL=your_email + UNITY_PASSWORD=your_password")
        return False
    
    return True

def run_real_deployment():
    """Run the real Unity Cloud API deployment"""
    print("\n🚀 Starting Real Unity Cloud API Deployment")
    print("=" * 60)
    
    if not check_credentials():
        print("\n⚠️ Switching to mock deployment...")
        print("To use real deployment, set Unity Cloud credentials as environment variables")
        
        # Run mock deployment
        import subprocess
        result = subprocess.run([sys.executable, "scripts/unity_headless_cloud_api.py"], 
                              capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print("Errors:", result.stderr)
        return False
    
    # Run real deployment
    try:
        import subprocess
        result = subprocess.run([sys.executable, "scripts/unity_real_cloud_api.py"], 
                              capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print("Errors:", result.stderr)
        return result.returncode == 0
    except Exception as e:
        print(f"❌ Error running real deployment: {e}")
        return False

def main():
    """Main function"""
    print("🎮 Unity Cloud Real Deployment")
    print("=" * 40)
    
    # Check if we're in a GitHub Actions environment
    if os.getenv("GITHUB_ACTIONS"):
        print("🔄 Running in GitHub Actions environment")
        print("📋 GitHub secrets should be available as environment variables")
    else:
        print("💻 Running in local environment")
        print("📋 Make sure to set Unity Cloud credentials as environment variables")
    
    # Run deployment
    success = run_real_deployment()
    
    if success:
        print("\n🎉 Real Unity Cloud deployment completed successfully!")
        print("✅ Your Unity Cloud dashboard has been populated with real data")
    else:
        print("\n⚠️ Deployment completed with issues")
        print("📋 Check the output above for details")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)