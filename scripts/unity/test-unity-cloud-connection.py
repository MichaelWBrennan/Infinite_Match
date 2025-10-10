#!/usr/bin/env python3
"""
Unity Cloud Connection Tester
Tests Unity Cloud dashboard connection and verifies all secrets are working
"""

import json
import os
import requests
import time
from datetime import datetime
from pathlib import Path


class UnityCloudConnectionTester:
    def __init__(self):
        self.project_id = os.getenv('UNITY_PROJECT_ID', '0dd5a03e-7f23-49c4-964e-7919c48c0574')
        self.environment_id = os.getenv('UNITY_ENV_ID', '1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d')
        self.client_id = os.getenv('UNITY_CLIENT_ID', '')
        self.client_secret = os.getenv('UNITY_CLIENT_SECRET', '')
        self.base_url = 'https://services.api.unity.com'
        self.access_token = None
        self.test_results = {
            'timestamp': datetime.now().isoformat(),
            'overall_status': 'unknown',
            'tests': {},
            'recommendations': []
        }

    def print_header(self, title):
        """Print formatted header"""
        print("\n" + "=" * 80)
        print(f"🎮 {title}")
        print("=" * 80)

    def test_authentication(self):
        """Test Unity Cloud OAuth authentication"""
        print("🔐 Testing Unity Cloud OAuth authentication...")
        
        test_result = {
            'name': 'OAuth Authentication',
            'status': 'unknown',
            'details': {},
            'error': None
        }

        try:
            if not self.client_id or not self.client_secret:
                test_result['status'] = 'failed'
                test_result['error'] = 'Missing client credentials'
                test_result['details'] = {
                    'client_id': 'SET' if self.client_id else 'NOT SET',
                    'client_secret': 'SET' if self.client_secret else 'NOT SET'
                }
                return test_result

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
                test_result['status'] = 'passed'
                test_result['details'] = {
                    'token_type': data.get('token_type'),
                    'expires_in': data.get('expires_in'),
                    'scope': data.get('scope'),
                    'project_id': self.project_id,
                    'environment_id': self.environment_id
                }
                print("✅ OAuth authentication successful")
            else:
                test_result['status'] = 'failed'
                test_result['error'] = f"HTTP {response.status_code}: {response.text}"
                test_result['details'] = {
                    'status_code': response.status_code,
                    'status_text': response.reason
                }
                print(f"❌ OAuth authentication failed: {response.status_code}")
        except Exception as error:
            test_result['status'] = 'failed'
            test_result['error'] = str(error)
            print(f"❌ OAuth authentication error: {error}")

        return test_result

    def test_api_endpoints(self):
        """Test Unity Cloud API endpoints"""
        print("🌐 Testing Unity Cloud API endpoints...")
        
        test_result = {
            'name': 'API Endpoints',
            'status': 'unknown',
            'endpoints': {},
            'error': None
        }

        if not self.access_token:
            test_result['status'] = 'skipped'
            test_result['error'] = 'No access token available'
            return test_result

        endpoints = [
            {
                'name': 'Economy Currencies',
                'url': f'/economy/v1/projects/{self.project_id}/environments/{self.environment_id}/currencies',
                'method': 'GET'
            },
            {
                'name': 'Economy Inventory',
                'url': f'/economy/v1/projects/{self.project_id}/environments/{self.environment_id}/inventory-items',
                'method': 'GET'
            },
            {
                'name': 'Economy Catalog',
                'url': f'/economy/v1/projects/{self.project_id}/environments/{self.environment_id}/catalog-items',
                'method': 'GET'
            },
            {
                'name': 'Cloud Code Functions',
                'url': f'/cloudcode/v1/projects/{self.project_id}/environments/{self.environment_id}/functions',
                'method': 'GET'
            },
            {
                'name': 'Remote Config',
                'url': f'/remote-config/v1/projects/{self.project_id}/environments/{self.environment_id}/configs',
                'method': 'GET'
            }
        ]

        passed_endpoints = 0
        total_endpoints = len(endpoints)

        for endpoint in endpoints:
            try:
                url = f"{self.base_url}{endpoint['url']}"
                headers = {
                    'Authorization': f'Bearer {self.access_token}',
                    'Content-Type': 'application/json',
                }

                response = requests.get(url, headers=headers, timeout=30)

                endpoint_result = {
                    'status': 'passed' if response.status_code == 200 else 'failed',
                    'status_code': response.status_code,
                    'response_time': time.time()
                }

                if response.status_code == 200:
                    data = response.json()
                    endpoint_result['data_count'] = len(data) if isinstance(data, list) else 1
                    passed_endpoints += 1
                    print(f"✅ {endpoint['name']}: OK ({endpoint_result['data_count']} items)")
                else:
                    endpoint_result['error'] = response.text
                    print(f"⚠️ {endpoint['name']}: {response.status_code} - {response.text[:100]}")

                test_result['endpoints'][endpoint['name']] = endpoint_result
            except Exception as error:
                test_result['endpoints'][endpoint['name']] = {
                    'status': 'failed',
                    'error': str(error)
                }
                print(f"❌ {endpoint['name']}: {error}")

        test_result['status'] = 'passed' if passed_endpoints == total_endpoints else \
                               'partial' if passed_endpoints > 0 else 'failed'
        test_result['details'] = {
            'passed': passed_endpoints,
            'total': total_endpoints,
            'success_rate': f"{round((passed_endpoints / total_endpoints) * 100)}%"
        }

        return test_result

    def test_project_access(self):
        """Test project and environment access"""
        print("🏗️ Testing project and environment access...")
        
        test_result = {
            'name': 'Project Access',
            'status': 'unknown',
            'details': {},
            'error': None
        }

        try:
            # Test project info endpoint
            project_url = f'https://services.api.unity.com/projects/v1/projects/{self.project_id}'
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json',
            }

            response = requests.get(project_url, headers=headers, timeout=30)

            if response.status_code == 200:
                project_data = response.json()
                test_result['status'] = 'passed'
                test_result['details'] = {
                    'project_name': project_data.get('name', 'Unknown'),
                    'project_id': project_data.get('id'),
                    'environment_id': self.environment_id,
                    'access_level': 'Full API Access'
                }
                print("✅ Project access confirmed")
            else:
                test_result['status'] = 'failed'
                test_result['error'] = f"HTTP {response.status_code}: {response.text}"
                print(f"❌ Project access failed: {response.status_code}")
        except Exception as error:
            test_result['status'] = 'failed'
            test_result['error'] = str(error)
            print(f"❌ Project access error: {error}")

        return test_result

    def test_secrets_configuration(self):
        """Test secrets configuration"""
        print("🔑 Testing secrets configuration...")
        
        test_result = {
            'name': 'Secrets Configuration',
            'status': 'unknown',
            'details': {},
            'error': None
        }

        secrets = {
            'UNITY_PROJECT_ID': self.project_id,
            'UNITY_ENV_ID': self.environment_id,
            'UNITY_CLIENT_ID': self.client_id,
            'UNITY_CLIENT_SECRET': self.client_secret
        }

        required_secrets = ['UNITY_PROJECT_ID', 'UNITY_ENV_ID', 'UNITY_CLIENT_ID', 'UNITY_CLIENT_SECRET']
        missing_secrets = [secret for secret in required_secrets if not secrets[secret] or secrets[secret] == '']

        test_result['details'] = {
            'configured': len(secrets) - len(missing_secrets),
            'total': len(secrets),
            'missing': missing_secrets,
            'project_id': 'SET' if self.project_id else 'NOT SET',
            'environment_id': 'SET' if self.environment_id else 'NOT SET',
            'client_id': 'SET' if self.client_id else 'NOT SET',
            'client_secret': 'SET' if self.client_secret else 'NOT SET'
        }

        if len(missing_secrets) == 0:
            test_result['status'] = 'passed'
            print("✅ All required secrets are configured")
        else:
            test_result['status'] = 'failed'
            test_result['error'] = f"Missing secrets: {', '.join(missing_secrets)}"
            print(f"❌ Missing required secrets: {', '.join(missing_secrets)}")

        return test_result

    def test_dashboard_ping(self):
        """Test Unity Cloud dashboard ping"""
        print("📊 Testing Unity Cloud dashboard ping...")
        
        test_result = {
            'name': 'Dashboard Ping',
            'status': 'unknown',
            'details': {},
            'error': None
        }

        try:
            # Test Unity Cloud dashboard connectivity
            dashboard_url = 'https://dashboard.unity3d.com'
            response = requests.head(dashboard_url, timeout=10)

            if response.status_code == 200:
                test_result['status'] = 'passed'
                test_result['details'] = {
                    'dashboard_url': dashboard_url,
                    'response_time': time.time(),
                    'status_code': response.status_code,
                    'accessible': True
                }
                print("✅ Unity Cloud dashboard is accessible")
            else:
                test_result['status'] = 'failed'
                test_result['error'] = f"HTTP {response.status_code}"
                test_result['details'] = {
                    'status_code': response.status_code,
                    'accessible': False
                }
                print(f"⚠️ Unity Cloud dashboard returned non-200 status: {response.status_code}")
        except Exception as error:
            test_result['status'] = 'failed'
            test_result['error'] = str(error)
            test_result['details'] = {
                'accessible': False,
                'error': str(error)
            }
            print(f"❌ Unity Cloud dashboard ping failed: {error}")

        return test_result

    def generate_recommendations(self):
        """Generate recommendations based on test results"""
        recommendations = []

        # Check authentication
        if self.test_results['tests'].get('authentication', {}).get('status') == 'failed':
            recommendations.append({
                'priority': 'high',
                'category': 'Authentication',
                'message': 'Fix Unity Cloud OAuth credentials - check UNITY_CLIENT_ID and UNITY_CLIENT_SECRET',
                'action': 'Verify credentials in Unity Dashboard > Settings > API Keys'
            })

        # Check API endpoints
        if self.test_results['tests'].get('api_endpoints', {}).get('status') == 'failed':
            recommendations.append({
                'priority': 'high',
                'category': 'API Access',
                'message': 'Unity Cloud API endpoints are not accessible - check project permissions',
                'action': 'Verify project ID and environment ID are correct'
            })

        # Check secrets
        if self.test_results['tests'].get('secrets', {}).get('status') == 'failed':
            recommendations.append({
                'priority': 'high',
                'category': 'Configuration',
                'message': 'Missing required Unity Cloud secrets',
                'action': 'Set up secrets in Cursor settings or environment variables'
            })

        # Check dashboard access
        if self.test_results['tests'].get('dashboard', {}).get('status') == 'failed':
            recommendations.append({
                'priority': 'medium',
                'category': 'Connectivity',
                'message': 'Unity Cloud dashboard is not accessible',
                'action': 'Check internet connection and Unity Cloud service status'
            })

        return recommendations

    def run_all_tests(self):
        """Run all connection tests"""
        self.print_header("UNITY CLOUD CONNECTION TESTER")
        print(f"Project ID: {self.project_id}")
        print(f"Environment ID: {self.environment_id}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print("=" * 80 + "\n")

        # Run all tests
        self.test_results['tests']['secrets'] = self.test_secrets_configuration()
        self.test_results['tests']['dashboard'] = self.test_dashboard_ping()
        self.test_results['tests']['authentication'] = self.test_authentication()
        self.test_results['tests']['api_endpoints'] = self.test_api_endpoints()
        self.test_results['tests']['project_access'] = self.test_project_access()

        # Calculate overall status
        test_statuses = [test['status'] for test in self.test_results['tests'].values()]
        failed_tests = test_statuses.count('failed')
        passed_tests = test_statuses.count('passed')
        total_tests = len(test_statuses)

        if failed_tests == 0:
            self.test_results['overall_status'] = 'passed'
        elif passed_tests > 0:
            self.test_results['overall_status'] = 'partial'
        else:
            self.test_results['overall_status'] = 'failed'

        # Generate recommendations
        self.test_results['recommendations'] = self.generate_recommendations()

        # Display results
        self.display_results()

        return self.test_results

    def display_results(self):
        """Display test results in a formatted way"""
        print("\n" + "=" * 80)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 80)

        # Overall status
        status_emoji = {
            'passed': '✅',
            'partial': '⚠️',
            'failed': '❌',
            'unknown': '❓'
        }

        print(f"\nOverall Status: {status_emoji[self.test_results['overall_status']]} {self.test_results['overall_status'].upper()}")

        # Individual test results
        print("\n📋 Individual Test Results:")
        print("-" * 50)

        for test_name, result in self.test_results['tests'].items():
            emoji = status_emoji.get(result['status'], '❓')
            print(f"{emoji} {result['name']}: {result['status'].upper()}")
            
            if result.get('error'):
                print(f"   Error: {result['error']}")
            
            if result.get('details') and result['details']:
                for key, value in result['details'].items():
                    print(f"   {key}: {value}")
            print()

        # Recommendations
        if self.test_results['recommendations']:
            print("💡 RECOMMENDATIONS:")
            print("-" * 50)
            for i, rec in enumerate(self.test_results['recommendations'], 1):
                priority_emoji = '🔴' if rec['priority'] == 'high' else '🟡'
                print(f"{priority_emoji} {i}. [{rec['category']}] {rec['message']}")
                print(f"   Action: {rec['action']}")
                print()

        print("=" * 80)
        print("🎯 Unity Cloud Connection Test Complete!")
        print("=" * 80 + "\n")

    def save_results(self):
        """Save test results to file"""
        results_dir = Path('monitoring/reports')
        results_dir.mkdir(parents=True, exist_ok=True)
        
        filename = f"unity_cloud_connection_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = results_dir / filename
        
        with open(filepath, 'w') as f:
            json.dump(self.test_results, f, indent=2)
        
        print(f"📁 Test results saved to: {filepath}")
        return str(filepath)


def main():
    """Main function"""
    tester = UnityCloudConnectionTester()
    results = tester.run_all_tests()
    tester.save_results()
    
    # Exit with appropriate code
    if results['overall_status'] == 'passed':
        return 0
    elif results['overall_status'] == 'partial':
        return 1
    else:
        return 2


if __name__ == "__main__":
    exit(main())