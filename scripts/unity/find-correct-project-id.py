#!/usr/bin/env python3
"""
Find Correct Unity Project ID
Helps you find the correct Project ID that matches your Environment ID
"""

import requests
import json
import os
from datetime import datetime


class UnityProjectIdFinder:
    def __init__(self):
        self.email = os.getenv('UNITY_EMAIL', 'michaelwilliambrennan@gmail.com')
        self.client_id = os.getenv('UNITY_CLIENT_ID', 'dcaaaf87-ec84-4858-a2ce-6c0d3d675d37')
        self.client_secret = os.getenv('UNITY_CLIENT_SECRET', 'cYXSmRDM4Vicmv7MuqT-U5pbqLXvTO8l')
        self.environment_id = os.getenv('UNITY_ENV_ID', '1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d')
        self.organization_id = os.getenv('UNITY_ORG_ID', '2473931369648')
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
                print(f"❌ Authentication failed: {response.status_code}")
                print(f"   Error: {response.text}")
                return False
        except Exception as error:
            print(f"❌ Authentication error: {error}")
            return False

    def get_organization_projects(self):
        """Get all projects in the organization"""
        print(f"📋 Fetching projects for organization: {self.organization_id}")
        
        try:
            # Try to get projects by organization
            projects_url = f'https://services.api.unity.com/projects/v1/organizations/{self.organization_id}/projects'
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json',
            }

            response = requests.get(projects_url, headers=headers, timeout=30)

            if response.status_code == 200:
                projects = response.json()
                print(f"✅ Found {len(projects)} projects in organization")
                return projects
            else:
                print(f"⚠️ Organization projects failed: {response.status_code}")
                # Fallback to general projects list
                return self.get_all_projects()
        except Exception as error:
            print(f"⚠️ Organization projects error: {error}")
            # Fallback to general projects list
            return self.get_all_projects()

    def get_all_projects(self):
        """Get all projects (fallback method)"""
        print("📋 Fetching all available projects...")
        
        try:
            projects_url = 'https://services.api.unity.com/projects/v1/projects'
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json',
            }

            response = requests.get(projects_url, headers=headers, timeout=30)

            if response.status_code == 200:
                projects = response.json()
                print(f"✅ Found {len(projects)} total projects")
                return projects
            else:
                print(f"❌ Failed to fetch projects: {response.status_code}")
                print(f"   Error: {response.text}")
                return []
        except Exception as error:
            print(f"❌ Error fetching projects: {error}")
            return []

    def find_project_by_environment(self, projects):
        """Find project that contains the target environment"""
        print(f"🔍 Looking for project with environment ID: {self.environment_id}")
        
        target_project = None
        checked_projects = 0
        
        for project in projects:
            project_id = project.get('id')
            project_name = project.get('name', 'Unknown')
            project_org = project.get('organizationId', 'Unknown')
            
            print(f"   Checking project: {project_name}")
            print(f"     ID: {project_id}")
            print(f"     Organization: {project_org}")
            
            # Check if this project belongs to the right organization
            if project_org != self.organization_id:
                print(f"     ⚠️ Wrong organization (expected: {self.organization_id})")
                continue
            
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
                    env_names = [env.get('name', 'Unknown') for env in environments]
                    
                    print(f"     Environments: {env_names}")
                    
                    if self.environment_id in env_ids:
                        target_project = project
                        print(f"     ✅ FOUND MATCHING ENVIRONMENT!")
                        break
                    else:
                        print(f"     ⚠️ No matching environment")
                else:
                    print(f"     ❌ Failed to get environments: {env_response.status_code}")
                    
            except Exception as error:
                print(f"     ❌ Error checking environments: {error}")
            
            checked_projects += 1
            if checked_projects >= 10:  # Limit to prevent too many API calls
                print(f"     ⚠️ Limited to first 10 projects for safety")
                break
        
        return target_project

    def test_project_access(self, project_id):
        """Test if we can access the project"""
        print(f"🧪 Testing access to project: {project_id}")
        
        try:
            project_url = f'https://services.api.unity.com/projects/v1/projects/{project_id}'
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json',
            }

            response = requests.get(project_url, headers=headers, timeout=30)

            if response.status_code == 200:
                project_data = response.json()
                print(f"✅ Project access successful!")
                print(f"   Name: {project_data.get('name', 'Unknown')}")
                print(f"   Organization: {project_data.get('organizationId', 'Unknown')}")
                return True
            else:
                print(f"❌ Project access failed: {response.status_code}")
                print(f"   Error: {response.text}")
                return False
        except Exception as error:
            print(f"❌ Project access error: {error}")
            return False

    def run(self):
        """Run the project ID finder"""
        self.print_header("UNITY PROJECT ID FINDER")
        print(f"Email: {self.email}")
        print(f"Organization ID: {self.organization_id}")
        print(f"Environment ID: {self.environment_id}")
        print(f"Client ID: {self.client_id}")
        print("=" * 80 + "\n")

        # Step 1: Authenticate
        if not self.authenticate():
            print("\n❌ Cannot proceed without authentication")
            print("💡 This might mean your API credentials are invalid or expired")
            return None

        # Step 2: Get projects
        projects = self.get_organization_projects()
        if not projects:
            print("\n❌ No projects found")
            print("💡 This might mean you don't have access to any projects")
            return None

        # Step 3: Find project with matching environment
        target_project = self.find_project_by_environment(projects)
        
        if target_project:
            project_id = target_project.get('id')
            project_name = target_project.get('name')
            
            print(f"\n🎯 FOUND YOUR PROJECT!")
            print(f"   Project ID: {project_id}")
            print(f"   Project Name: {project_name}")
            
            # Step 4: Test project access
            if self.test_project_access(project_id):
                print(f"\n✅ Project access confirmed!")
                print(f"\n📝 To fix your configuration, run:")
                print(f"   export UNITY_PROJECT_ID=\"{project_id}\"")
                print(f"   npm run unity:test-connection")
                
                return project_id
            else:
                print(f"\n❌ Project access failed - you may not have permission")
                return None
        else:
            print(f"\n❌ No project found with environment ID: {self.environment_id}")
            print(f"\n💡 Possible solutions:")
            print(f"   1. Check if the environment ID is correct")
            print(f"   2. Verify you have access to the project")
            print(f"   3. Check if the project exists in your organization")
            print(f"   4. The project might be in a different organization")
            
            return None


def main():
    """Main function"""
    finder = UnityProjectIdFinder()
    project_id = finder.run()
    
    if project_id:
        print(f"\n🎉 Success! Your correct Unity Project ID is: {project_id}")
        return 0
    else:
        print(f"\n❌ Failed to find correct Unity Project ID")
        print(f"\n💡 Consider using headless mode instead:")
        print(f"   npm run unity:test-headless")
        return 1


if __name__ == "__main__":
    exit(main())