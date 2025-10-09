#!/usr/bin/env python3
"""
Trigger Unity Cloud Real Deployment via GitHub API
This script will trigger the GitHub Actions workflow that uses your repository secrets
"""

import json
import os
import requests
import subprocess
import sys
from pathlib import Path

class UnityCloudDeploymentTrigger:
    def __init__(self):
        self.repo_owner = "MichaelWBrennan"
        self.repo_name = "MobileGameSDK"
        self.workflow_file = "unity-cloud-real-deployment.yml"
        self.github_token = os.getenv("GITHUB_TOKEN")

    def get_repo_info(self):
        """Get repository information from git"""
        try:
            result = subprocess.run(
                ["git", "config", "--get", "remote.origin.url"],
                capture_output=True, text=True, check=True
            )
            url = result.stdout.strip()
            if "github.com" in url:
                # Extract owner/repo from URL
                parts = url.replace("https://github.com/", "").replace("git@github.com:", "").replace(".git", "")
                if "/" in parts:
                    owner, repo = parts.split("/", 1)
                    return owner, repo
        except:
            pass
        return self.repo_owner, self.repo_name

    def check_workflow_exists(self):
        """Check if the workflow file exists in the repository"""
        try:
            url = f"https://api.github.com/repos/{self.repo_owner}/{self.repo_name}/contents/.github/workflows/{self.workflow_file}"
            headers = {}
            if self.github_token:
                headers["Authorization"] = f"token {self.github_token}"
            
            response = requests.get(url, headers=headers)
            return response.status_code == 200
        except Exception as e:
            print(f"Error checking workflow: {e}")
            return False

    def trigger_workflow(self, deployment_type="real"):
        """Trigger the Unity Cloud deployment workflow"""
        try:
            url = f"https://api.github.com/repos/{self.repo_owner}/{self.repo_name}/actions/workflows/{self.workflow_file}/dispatches"
            
            headers = {
                "Accept": "application/vnd.github.v3+json",
                "Content-Type": "application/json"
            }
            
            if self.github_token:
                headers["Authorization"] = f"token {self.github_token}"
            
            payload = {
                "ref": "main",
                "inputs": {
                    "deployment_type": deployment_type
                }
            }
            
            response = requests.post(url, headers=headers, json=payload)
            
            if response.status_code == 204:
                print(f"✅ Successfully triggered Unity Cloud {deployment_type} deployment workflow!")
                print(f"🔗 View workflow: https://github.com/{self.repo_owner}/{self.repo_name}/actions")
                return True
            else:
                print(f"❌ Failed to trigger workflow: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error triggering workflow: {e}")
            return False

    def check_workflow_status(self):
        """Check the status of recent workflow runs"""
        try:
            url = f"https://api.github.com/repos/{self.repo_owner}/{self.repo_name}/actions/runs"
            headers = {}
            if self.github_token:
                headers["Authorization"] = f"token {self.github_token}"
            
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                runs = response.json().get("workflow_runs", [])
                unity_runs = [run for run in runs if "Unity Cloud" in run.get("name", "")]
                
                if unity_runs:
                    latest_run = unity_runs[0]
                    status = latest_run.get("status", "unknown")
                    conclusion = latest_run.get("conclusion", "unknown")
                    html_url = latest_run.get("html_url", "")
                    
                    print(f"📊 Latest Unity Cloud workflow run:")
                    print(f"   Status: {status}")
                    print(f"   Conclusion: {conclusion}")
                    print(f"   URL: {html_url}")
                    return latest_run
                else:
                    print("📊 No Unity Cloud workflow runs found")
                    return None
            else:
                print(f"❌ Failed to check workflow status: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Error checking workflow status: {e}")
            return None

    def run(self):
        """Run the deployment trigger"""
        print("🚀 Unity Cloud Real Deployment Trigger")
        print("=" * 50)
        
        # Get repository info
        self.repo_owner, self.repo_name = self.get_repo_info()
        print(f"Repository: {self.repo_owner}/{self.repo_name}")
        
        # Check if workflow exists
        if not self.check_workflow_exists():
            print(f"❌ Workflow file not found: {self.workflow_file}")
            print("   Please ensure the workflow file is committed and pushed to the repository")
            return False
        
        print(f"✅ Workflow file found: {self.workflow_file}")
        
        # Check GitHub token
        if not self.github_token:
            print("⚠️ No GITHUB_TOKEN found - using public API (may have rate limits)")
        else:
            print("✅ GitHub token found - using authenticated API")
        
        # Check recent workflow runs
        print("\n📊 Checking recent workflow runs...")
        self.check_workflow_status()
        
        # Trigger workflow
        print(f"\n🎯 Triggering Unity Cloud real deployment...")
        if self.trigger_workflow("real"):
            print("\n🎉 Workflow triggered successfully!")
            print("📋 The workflow will:")
            print("   ✅ Use your GitHub repository secrets")
            print("   ✅ Run real Unity Cloud API calls")
            print("   ✅ Deploy currencies, inventory, and catalog items")
            print("   ✅ Deploy Cloud Code functions")
            print("   ✅ Update Remote Config")
            print("   ✅ Generate deployment reports")
            
            print(f"\n🔗 Monitor progress: https://github.com/{self.repo_owner}/{self.repo_name}/actions")
            return True
        else:
            print("\n❌ Failed to trigger workflow")
            return False

def main():
    trigger = UnityCloudDeploymentTrigger()
    success = trigger.run()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()