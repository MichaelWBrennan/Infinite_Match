#!/usr/bin/env python3
"""
Test script for GitHub to Unity Cloud sync
"""

import requests
import json
import time

def test_webhook_server():
    """Test the webhook server endpoints"""
    base_url = "http://localhost:5001"
    
    print("🧪 Testing GitHub-Unity Cloud sync webhook server...")
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {e}")
    
    # Test sync status
    try:
        response = requests.get(f"{base_url}/sync/status")
        if response.status_code == 200:
            print("✅ Sync status check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Sync status check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Sync status check error: {e}")
    
    # Test manual sync trigger
    try:
        test_changes = {
            "economy": True,
            "cloud_code": True,
            "remote_config": True
        }
        response = requests.post(
            f"{base_url}/sync/trigger",
            json={"changes": test_changes}
        )
        if response.status_code == 200:
            print("✅ Manual sync trigger passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Manual sync trigger failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Manual sync trigger error: {e}")

def test_github_actions():
    """Test GitHub Actions workflow"""
    print("🧪 Testing GitHub Actions workflow...")
    print("ℹ️ To test GitHub Actions:")
    print("   1. Make a change to economy/currencies.csv")
    print("   2. Commit and push to main branch")
    print("   3. Check Actions tab for 'GitHub to Unity Cloud Auto-Sync' workflow")
    print("   4. Verify Unity Cloud gets updated")

if __name__ == "__main__":
    print("🚀 Starting GitHub-Unity Cloud sync tests...")
    
    # Test webhook server (if running)
    test_webhook_server()
    
    # Test GitHub Actions
    test_github_actions()
    
    print("✅ Tests completed!")
