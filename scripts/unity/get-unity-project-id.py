#!/usr/bin/env python3
"""
Unity Project ID Finder
Helps you find your real Unity Project ID from the dashboard
"""

import requests
import json
import os
from datetime import datetime


class UnityProjectIdFinder:
    def __init__(self):
        self.email = os.getenv('UNITY_EMAIL', 'michaelwilliambrennan@gmail.com')
        self.password = os.getenv('UNITY_PASSWORD', '')
        self.client_id = os.getenv('UNITY_CLIENT_ID', 'dcaaaf87-ec84-4858-a2ce-6c0d3d675d37')
        self.client_secret = os.getenv('UNITY_CLIENT_SECRET', 'cYXSmRDM4Vicmv7MuqT-U5pbqLXvTO8l')
        self.environment_id = os.getenv('UNITY_ENV_ID', '1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d')
        self.access_token = None

    def print_header(self, title):
        """Print formatted header"""
        print("\n" + "=" * 80)
        print(f"🎮 {title}")
        print("=" * 80)

    def authenticate(self):
        """Authenticate with Unity Cloud API"""
        print("🔐 Authenticating with Unity Cloud API...")
        
        try:
            auth_url = 'https://services.api.unity.com/oauth/token'
            auth_data = {
                'grant_type': 'client_credentials',
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'scope': 'economy inventory cloudcode remoteconfig',
            }

            response = requests.post(auth_url, data=auth_data, timeout=30)

            if response.status_code == 200:
                data = response.json()
                self.access_token = data['access_token']
                print("✅ Authentication successful")
                return True
            else:
                print(f"❌ Authentication failed: {response.status_code} - {response.text}")
                return False
        except Exception as error:
            print(f"❌ Authentication error: {error}")
            return False

    def get_projects(self):
        """Get list of projects from Unity Cloud"""
        print("📋 Fetching Unity Cloud projects...")
        
        try:
            projects_url = 'https://services.api.unity.com/projects/v1/projects'
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json',
            }

            response = requests.get(projects_url, headers=headers, timeout=30)

            if response.status_code == 200:
                projects = response.json()
                print(f"✅ Found {len(projects)} projects")
                return projects
            else:
                print(f"❌ Failed to fetch projects: {response.status_code} - {response.text}")
                return []
        except Exception as error:
            print(f"❌ Error fetching projects: {error}")
            return []

    def find_project_by_environment(self, projects):
        """Find project that contains the target environment"""
        print(f"🔍 Looking for project with environment ID: {self.environment_id}")
        
        target_project = None
        
        for project in projects:
            project_id = project.get('id')
            project_name = project.get('name', 'Unknown')
            
            print(f"   Checking project: {project_name} ({project_id})")
            
            # Get environments for this project
            try:
                env_url = f'https://services.api.unity.com/projects/v1/projects/{project_id}/environments'
                headers = {
                    'Authorization': f'Bearer {self.access_token}',
                    'Content-Type': 'application/json',
                }
                
                env_response = requests.get(env_url, headers=headers, timeout=30)
                
                if env_response.status_code == 200:
                    environments = env_response.json()
                    env_ids = [env.get('id') for env in environments]
                    
                    if self.environment_id in env_ids:
                        target_project = project
                        print(f"   ✅ Found matching environment in project: {project_name}")
                        break
                    else:
                        print(f"   ⚠️ No matching environment (found: {env_ids})")
                else:
                    print(f"   ❌ Failed to get environments: {env_response.status_code}")
                    
            except Exception as error:
                print(f"   ❌ Error checking environments: {error}")
        
        return target_project

    def get_project_details(self, project):
        """Get detailed information about the project"""
        if not project:
            return None
            
        print(f"\n📊 Project Details:")
        print(f"   Name: {project.get('name', 'Unknown')}")
        print(f"   ID: {project.get('id', 'Unknown')}")
        print(f"   Organization ID: {project.get('organizationId', 'Unknown')}")
        print(f"   Created: {project.get('createdAt', 'Unknown')}")
        print(f"   Updated: {project.get('updatedAt', 'Unknown')}")
        
        return project

    def run(self):
        """Run the project ID finder"""
        self.print_header("UNITY PROJECT ID FINDER")
        print(f"Email: {self.email}")
        print(f"Environment ID: {self.environment_id}")
        print(f"Client ID: {self.client_id}")
        print("=" * 80 + "\n")

        # Step 1: Authenticate
        if not self.authenticate():
            print("\n❌ Cannot proceed without authentication")
            return None

        # Step 2: Get projects
        projects = self.get_projects()
        if not projects:
            print("\n❌ No projects found")
            return None

        # Step 3: Find project with matching environment
        target_project = self.find_project_by_environment(projects)
        
        if target_project:
            # Step 4: Display project details
            self.get_project_details(target_project)
            
            print(f"\n🎯 FOUND YOUR PROJECT!")
            print(f"   Project ID: {target_project.get('id')}")
            print(f"   Project Name: {target_project.get('name')}")
            
            print(f"\n📝 To fix your configuration, run:")
            print(f"   export UNITY_PROJECT_ID=\"{target_project.get('id')}\"")
            
            return target_project.get('id')
        else:
            print(f"\n❌ No project found with environment ID: {self.environment_id}")
            print(f"\n💡 Possible solutions:")
            print(f"   1. Check if the environment ID is correct")
            print(f"   2. Verify you have access to the project")
            print(f"   3. Check if the project exists in your organization")
            
            return None


def main():
    """Main function"""
    finder = UnityProjectIdFinder()
    project_id = finder.run()
    
    if project_id:
        print(f"\n✅ Success! Your Unity Project ID is: {project_id}")
        return 0
    else:
        print(f"\n❌ Failed to find Unity Project ID")
        return 1


if __name__ == "__main__":
    exit(main())