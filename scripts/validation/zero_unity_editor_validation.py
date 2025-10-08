#!/usr/bin/env python3
"""
Zero Unity Editor Validation Script
Comprehensive validation for complete headless Unity development
"""

import os
import sys
import json
import yaml
import subprocess
from pathlib import Path
import requests

class ZeroUnityEditorValidator:
    def __init__(self):
        self.repo_root = Path(__file__).parent.parent.parent
        self.validation_results = {
            "unity_editor": {"status": "pending", "details": []},
            "unity_cloud_console": {"status": "pending", "details": []},
            "storefront_automation": {"status": "pending", "details": []},
            "ci_cd_pipeline": {"status": "pending", "details": []},
            "webhook_integration": {"status": "pending", "details": []},
            "health_monitoring": {"status": "pending", "details": []}
        }
        
    def print_header(self, title):
        """Print formatted header"""
        print("\n" + "="*80)
        print(f"🔍 {title}")
        print("="*80)
    
    def validate_unity_editor_requirements(self):
        """Validate Unity Editor is not required"""
        print("🎮 Validating Unity Editor Requirements...")
        
        # Check if Unity Editor is installed
        unity_editor_paths = [
            "/Applications/Unity/Hub/Editor",
            "C:/Program Files/Unity/Hub/Editor",
            "/opt/Unity/Editor"
        ]
        
        unity_editor_found = False
        for path in unity_editor_paths:
            if os.path.exists(path):
                unity_editor_found = True
                break
        
        if unity_editor_found:
            self.validation_results["unity_editor"]["status"] = "warning"
            self.validation_results["unity_editor"]["details"].append(
                "Unity Editor found on system - not required for headless operation"
            )
        else:
            self.validation_results["unity_editor"]["status"] = "success"
            self.validation_results["unity_editor"]["details"].append(
                "Unity Editor not found - perfect for headless operation"
            )
        
        # Check headless build scripts
        build_script = self.repo_root / "unity" / "Assets" / "Scripts" / "Editor" / "BuildScript.cs"
        if build_script.exists():
            self.validation_results["unity_editor"]["status"] = "success"
            self.validation_results["unity_editor"]["details"].append(
                "Headless build scripts present"
            )
        else:
            self.validation_results["unity_editor"]["status"] = "error"
            self.validation_results["unity_editor"]["details"].append(
                "Headless build scripts missing"
            )
        
        # Check Unity CLI availability
        try:
            result = subprocess.run(['unity', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                self.validation_results["unity_editor"]["status"] = "success"
                self.validation_results["unity_editor"]["details"].append(
                    f"Unity CLI available: {result.stdout.strip()}"
                )
            else:
                self.validation_results["unity_editor"]["status"] = "error"
                self.validation_results["unity_editor"]["details"].append(
                    "Unity CLI not available"
                )
        except FileNotFoundError:
            self.validation_results["unity_editor"]["status"] = "error"
            self.validation_results["unity_editor"]["details"].append(
                "Unity CLI not found in PATH"
            )
    
    def validate_unity_cloud_console_integration(self):
        """Validate Unity Cloud Console integration"""
        print("☁️ Validating Unity Cloud Console Integration...")
        
        # Check Unity Cloud credentials
        required_env_vars = [
            'UNITY_PROJECT_ID',
            'UNITY_ENV_ID',
            'UNITY_EMAIL',
            'UNITY_PASSWORD'
        ]
        
        missing_vars = []
        for var in required_env_vars:
            if not os.getenv(var):
                missing_vars.append(var)
        
        if missing_vars:
            self.validation_results["unity_cloud_console"]["status"] = "error"
            self.validation_results["unity_cloud_console"]["details"].append(
                f"Missing environment variables: {', '.join(missing_vars)}"
            )
        else:
            self.validation_results["unity_cloud_console"]["status"] = "success"
            self.validation_results["unity_cloud_console"]["details"].append(
                "Unity Cloud credentials configured"
            )
        
        # Check Unity Cloud automation scripts
        cloud_automation_script = self.repo_root / "scripts" / "unity" / "unity_cloud_console_automation.py"
        if cloud_automation_script.exists():
            self.validation_results["unity_cloud_console"]["status"] = "success"
            self.validation_results["unity_cloud_console"]["details"].append(
                "Unity Cloud Console automation script present"
            )
        else:
            self.validation_results["unity_cloud_console"]["status"] = "error"
            self.validation_results["unity_cloud_console"]["details"].append(
                "Unity Cloud Console automation script missing"
            )
        
        # Check Cloud Code functions
        cloudcode_dir = self.repo_root / "cloud-code"
        if cloudcode_dir.exists():
            cloudcode_files = list(cloudcode_dir.glob("*.js"))
            if cloudcode_files:
                self.validation_results["unity_cloud_console"]["status"] = "success"
                self.validation_results["unity_cloud_console"]["details"].append(
                    f"Cloud Code functions present: {len(cloudcode_files)} files"
                )
            else:
                self.validation_results["unity_cloud_console"]["status"] = "warning"
                self.validation_results["unity_cloud_console"]["details"].append(
                    "Cloud Code directory exists but no functions found"
                )
        else:
            self.validation_results["unity_cloud_console"]["status"] = "error"
            self.validation_results["unity_cloud_console"]["details"].append(
                "Cloud Code directory missing"
            )
        
        # Check Remote Config
        remoteconfig_dir = self.repo_root / "remote-config"
        if remoteconfig_dir.exists():
            config_files = list(remoteconfig_dir.glob("*.json"))
            if config_files:
                self.validation_results["unity_cloud_console"]["status"] = "success"
                self.validation_results["unity_cloud_console"]["details"].append(
                    f"Remote Config files present: {len(config_files)} files"
                )
            else:
                self.validation_results["unity_cloud_console"]["status"] = "warning"
                self.validation_results["unity_cloud_console"]["details"].append(
                    "Remote Config directory exists but no config files found"
                )
        else:
            self.validation_results["unity_cloud_console"]["status"] = "error"
            self.validation_results["unity_cloud_console"]["details"].append(
                "Remote Config directory missing"
            )
    
    def validate_storefront_automation(self):
        """Validate storefront automation"""
        print("🛒 Validating Storefront Automation...")
        
        # Check storefront automation script
        storefront_script = self.repo_root / "scripts" / "storefront" / "storefront_automation.py"
        if storefront_script.exists():
            self.validation_results["storefront_automation"]["status"] = "success"
            self.validation_results["storefront_automation"]["details"].append(
                "Storefront automation script present"
            )
        else:
            self.validation_results["storefront_automation"]["status"] = "error"
            self.validation_results["storefront_automation"]["details"].append(
                "Storefront automation script missing"
            )
        
        # Check Fastlane configuration
        fastlane_file = self.repo_root / "deployment" / "fastlane" / "Fastfile"
        if fastlane_file.exists():
            self.validation_results["storefront_automation"]["status"] = "success"
            self.validation_results["storefront_automation"]["details"].append(
                "Fastlane configuration present"
            )
        else:
            self.validation_results["storefront_automation"]["status"] = "error"
            self.validation_results["storefront_automation"]["details"].append(
                "Fastlane configuration missing"
            )
        
        # Check storefront credentials
        storefront_credentials = {
            'Google Play': ['GOOGLE_PLAY_SERVICE_ACCOUNT_JSON'],
            'App Store': ['APP_STORE_CONNECT_API_KEY'],
            'Steam': ['STEAM_USERNAME', 'STEAM_PASSWORD'],
            'Itch.io': ['ITCH_USERNAME', 'ITCH_GAME', 'BUTLER_API_KEY']
        }
        
        for store, vars in storefront_credentials.items():
            missing_vars = [var for var in vars if not os.getenv(var)]
            if missing_vars:
                self.validation_results["storefront_automation"]["status"] = "warning"
                self.validation_results["storefront_automation"]["details"].append(
                    f"{store} credentials incomplete: {', '.join(missing_vars)}"
                )
            else:
                self.validation_results["storefront_automation"]["status"] = "success"
                self.validation_results["storefront_automation"]["details"].append(
                    f"{store} credentials configured"
                )
        
        # Check metadata directory
        metadata_dir = self.repo_root / "metadata"
        if metadata_dir.exists():
            self.validation_results["storefront_automation"]["status"] = "success"
            self.validation_results["storefront_automation"]["details"].append(
                "Metadata directory present"
            )
        else:
            self.validation_results["storefront_automation"]["status"] = "warning"
            self.validation_results["storefront_automation"]["details"].append(
                "Metadata directory missing"
            )
    
    def validate_ci_cd_pipeline(self):
        """Validate CI/CD pipeline"""
        print("🔄 Validating CI/CD Pipeline...")
        
        # Check GitHub Actions workflows
        workflows_dir = self.repo_root / ".github" / "workflows"
        if workflows_dir.exists():
            workflow_files = list(workflows_dir.glob("*.yml"))
            if workflow_files:
                self.validation_results["ci_cd_pipeline"]["status"] = "success"
                self.validation_results["ci_cd_pipeline"]["details"].append(
                    f"GitHub Actions workflows present: {len(workflow_files)} files"
                )
            else:
                self.validation_results["ci_cd_pipeline"]["status"] = "error"
                self.validation_results["ci_cd_pipeline"]["details"].append(
                    "No GitHub Actions workflows found"
                )
        else:
            self.validation_results["ci_cd_pipeline"]["status"] = "error"
            self.validation_results["ci_cd_pipeline"]["details"].append(
                "GitHub Actions workflows directory missing"
            )
        
        # Check zero Unity Editor workflow
        zero_unity_workflow = self.repo_root / ".github" / "workflows" / "zero-unity-editor.yml"
        if zero_unity_workflow.exists():
            self.validation_results["ci_cd_pipeline"]["status"] = "success"
            self.validation_results["ci_cd_pipeline"]["details"].append(
                "Zero Unity Editor workflow present"
            )
        else:
            self.validation_results["ci_cd_pipeline"]["status"] = "error"
            self.validation_results["ci_cd_pipeline"]["details"].append(
                "Zero Unity Editor workflow missing"
            )
        
        # Check build scripts
        build_scripts = [
            "unity/Assets/Scripts/Editor/BuildScript.cs",
            "scripts/unity/unity_cloud_console_automation.py",
            "scripts/storefront/storefront_automation.py"
        ]
        
        for script in build_scripts:
            script_path = self.repo_root / script
            if script_path.exists():
                self.validation_results["ci_cd_pipeline"]["status"] = "success"
                self.validation_results["ci_cd_pipeline"]["details"].append(
                    f"Build script present: {script}"
                )
            else:
                self.validation_results["ci_cd_pipeline"]["status"] = "error"
                self.validation_results["ci_cd_pipeline"]["details"].append(
                    f"Build script missing: {script}"
                )
    
    def validate_webhook_integration(self):
        """Validate webhook integration"""
        print("🔗 Validating Webhook Integration...")
        
        # Check webhook server
        webhook_server = self.repo_root / "scripts" / "webhooks" / "webhook_server.py"
        if webhook_server.exists():
            self.validation_results["webhook_integration"]["status"] = "success"
            self.validation_results["webhook_integration"]["details"].append(
                "Webhook server script present"
            )
        else:
            self.validation_results["webhook_integration"]["status"] = "error"
            self.validation_results["webhook_integration"]["details"].append(
                "Webhook server script missing"
            )
        
        # Check webhook endpoints
        webhook_endpoints = [
            "/webhook/unity-cloud",
            "/webhook/storefront",
            "/webhook/build",
            "/health"
        ]
        
        # Test webhook server if running
        try:
            response = requests.get("http://localhost:5000/health", timeout=5)
            if response.status_code == 200:
                self.validation_results["webhook_integration"]["status"] = "success"
                self.validation_results["webhook_integration"]["details"].append(
                    "Webhook server is running and healthy"
                )
            else:
                self.validation_results["webhook_integration"]["status"] = "warning"
                self.validation_results["webhook_integration"]["details"].append(
                    "Webhook server is running but not responding correctly"
                )
        except requests.exceptions.RequestException:
            self.validation_results["webhook_integration"]["status"] = "warning"
            self.validation_results["webhook_integration"]["details"].append(
                "Webhook server is not running (this is normal if not started)"
            )
    
    def validate_health_monitoring(self):
        """Validate health monitoring"""
        print("🏥 Validating Health Monitoring...")
        
        # Check health check script
        health_check_script = self.repo_root / "scripts" / "maintenance" / "health_check.py"
        if health_check_script.exists():
            self.validation_results["health_monitoring"]["status"] = "success"
            self.validation_results["health_monitoring"]["details"].append(
                "Health check script present"
            )
        else:
            self.validation_results["health_monitoring"]["status"] = "error"
            self.validation_results["health_monitoring"]["details"].append(
                "Health check script missing"
            )
        
        # Check logs directory
        logs_dir = self.repo_root / "logs"
        if logs_dir.exists():
            self.validation_results["health_monitoring"]["status"] = "success"
            self.validation_results["health_monitoring"]["details"].append(
                "Logs directory present"
            )
        else:
            self.validation_results["health_monitoring"]["status"] = "warning"
            self.validation_results["health_monitoring"]["details"].append(
                "Logs directory missing"
            )
        
        # Check monitoring configuration
        monitoring_dir = self.repo_root / "monitoring"
        if monitoring_dir.exists():
            self.validation_results["health_monitoring"]["status"] = "success"
            self.validation_results["health_monitoring"]["details"].append(
                "Monitoring directory present"
            )
        else:
            self.validation_results["health_monitoring"]["status"] = "warning"
            self.validation_results["health_monitoring"]["details"].append(
                "Monitoring directory missing"
            )
    
    def generate_validation_report(self):
        """Generate comprehensive validation report"""
        print("\n" + "="*80)
        print("📊 VALIDATION REPORT")
        print("="*80)
        
        total_checks = len(self.validation_results)
        passed_checks = sum(1 for result in self.validation_results.values() if result["status"] == "success")
        warning_checks = sum(1 for result in self.validation_results.values() if result["status"] == "warning")
        error_checks = sum(1 for result in self.validation_results.values() if result["status"] == "error")
        
        print(f"Total Checks: {total_checks}")
        print(f"✅ Passed: {passed_checks}")
        print(f"⚠️ Warnings: {warning_checks}")
        print(f"❌ Errors: {error_checks}")
        print()
        
        for category, result in self.validation_results.items():
            status_icon = {
                "success": "✅",
                "warning": "⚠️",
                "error": "❌",
                "pending": "⏳"
            }.get(result["status"], "❓")
            
            print(f"{status_icon} {category.replace('_', ' ').title()}: {result['status']}")
            for detail in result["details"]:
                print(f"   • {detail}")
            print()
        
        # Overall assessment
        if error_checks == 0 and warning_checks == 0:
            print("🎉 EXCELLENT! Zero Unity Editor setup is fully validated!")
            print("✅ All systems are ready for complete headless operation")
            return True
        elif error_checks == 0:
            print("✅ GOOD! Zero Unity Editor setup is mostly ready")
            print("⚠️ Some warnings should be addressed for optimal operation")
            return True
        else:
            print("❌ ISSUES FOUND! Zero Unity Editor setup needs attention")
            print("🔧 Please fix the errors above before proceeding")
            return False
    
    def run_full_validation(self):
        """Run complete validation"""
        self.print_header("Zero Unity Editor Validation")
        
        print("🎯 This will validate your complete headless Unity setup")
        print("   - Unity Editor requirements")
        print("   - Unity Cloud Console integration")
        print("   - Storefront automation")
        print("   - CI/CD pipeline")
        print("   - Webhook integration")
        print("   - Health monitoring")
        
        # Run all validations
        self.validate_unity_editor_requirements()
        self.validate_unity_cloud_console_integration()
        self.validate_storefront_automation()
        self.validate_ci_cd_pipeline()
        self.validate_webhook_integration()
        self.validate_health_monitoring()
        
        # Generate report
        return self.generate_validation_report()

if __name__ == "__main__":
    validator = ZeroUnityEditorValidator()
    success = validator.run_full_validation()
    sys.exit(0 if success else 1)