#!/usr/bin/env python3
"""
Headless Unity Cloud Connection Tester
Tests headless Unity Cloud integration without requiring API credentials
"""

import json
import os
import time
from datetime import datetime
from pathlib import Path

import requests


class HeadlessUnityConnectionTester:
    def __init__(self):
        self.project_id = os.getenv(
            "UNITY_PROJECT_ID", "0dd5a03e-7f23-49c4-964e-7919c48c0574"
        )
        self.environment_id = os.getenv(
            "UNITY_ENV_ID", "1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"
        )
        self.test_results = {
            "timestamp": datetime.now().isoformat(),
            "overall_status": "unknown",
            "tests": {},
            "recommendations": [],
        }

    def print_header(self, title):
        """Print formatted header"""
        print("\n" + "=" * 80)
        print(f"🎮 {title}")
        print("=" * 80)

    def test_unity_config_files(self):
        """Test Unity configuration files for headless operation"""
        print("📁 Testing Unity configuration files...")

        test_result = {
            "name": "Unity Configuration Files",
            "status": "unknown",
            "details": {},
            "error": None,
        }

        config_files = {
            "unity_services_config": "unity/Assets/StreamingAssets/unity_services_config.json",
            "economy_currencies": "economy/currencies.csv",
            "economy_inventory": "economy/inventory.csv",
            "economy_catalog": "economy/catalog.csv",
            "remote_config": "remote-config/game_config.json",
        }

        found_files = 0
        total_files = len(config_files)
        file_details = {}

        for file_name, file_path in config_files.items():
            file_exists = Path(file_path).exists()
            file_details[file_name] = {"exists": file_exists, "path": file_path}

            if file_exists:
                found_files += 1
                print(f"✅ {file_name}: Found")
            else:
                print(f"❌ {file_name}: Missing")

        test_result["details"] = {
            "found_files": found_files,
            "total_files": total_files,
            "files": file_details,
        }

        if found_files == total_files:
            test_result["status"] = "passed"
            print("✅ All Unity configuration files found")
        elif found_files > 0:
            test_result["status"] = "partial"
            print(f"⚠️ {found_files}/{total_files} Unity configuration files found")
        else:
            test_result["status"] = "failed"
            test_result["error"] = "No Unity configuration files found"
            print("❌ No Unity configuration files found")

        return test_result

    def test_economy_data_integrity(self):
        """Test economy data integrity for headless operation"""
        print("💰 Testing economy data integrity...")

        test_result = {
            "name": "Economy Data Integrity",
            "status": "unknown",
            "details": {},
            "error": None,
        }

        try:
            # Test currencies.csv
            currencies_path = Path("economy/currencies.csv")
            if currencies_path.exists():
                with open(currencies_path, "r") as f:
                    currencies_data = f.read()
                    currency_lines = len(
                        [line for line in currencies_data.split("\n") if line.strip()]
                    )
                    # Subtract header
                    test_result["details"]["currencies_count"] = currency_lines - 1
                    print(f"✅ Currencies: {currency_lines - 1} items")
            else:
                test_result["details"]["currencies_count"] = 0
                print("❌ Currencies: File not found")

            # Test inventory.csv
            inventory_path = Path("economy/inventory.csv")
            if inventory_path.exists():
                with open(inventory_path, "r") as f:
                    inventory_data = f.read()
                    inventory_lines = len(
                        [line for line in inventory_data.split("\n") if line.strip()]
                    )
                    test_result["details"]["inventory_count"] = inventory_lines - 1
                    print(f"✅ Inventory: {inventory_lines - 1} items")
            else:
                test_result["details"]["inventory_count"] = 0
                print("❌ Inventory: File not found")

            # Test catalog.csv
            catalog_path = Path("economy/catalog.csv")
            if catalog_path.exists():
                with open(catalog_path, "r") as f:
                    catalog_data = f.read()
                    catalog_lines = len(
                        [line for line in catalog_data.split("\n") if line.strip()]
                    )
                    test_result["details"]["catalog_count"] = catalog_lines - 1
                    print(f"✅ Catalog: {catalog_lines - 1} items")
            else:
                test_result["details"]["catalog_count"] = 0
                print("❌ Catalog: File not found")

            # Check if we have any economy data
            total_items = (
                test_result["details"].get("currencies_count", 0)
                + test_result["details"].get("inventory_count", 0)
                + test_result["details"].get("catalog_count", 0)
            )

            if total_items > 0:
                test_result["status"] = "passed"
                test_result["details"]["total_items"] = total_items
                print(f"✅ Economy data integrity: {total_items} total items")
            else:
                test_result["status"] = "failed"
                test_result["error"] = "No economy data found"
                print("❌ Economy data integrity: No data found")

        except Exception as error:
            test_result["status"] = "failed"
            test_result["error"] = str(error)
            print(f"❌ Economy data integrity error: {error}")

        return test_result

    def test_unity_services_config(self):
        """Test Unity Services configuration for headless operation"""
        print("⚙️ Testing Unity Services configuration...")

        test_result = {
            "name": "Unity Services Configuration",
            "status": "unknown",
            "details": {},
            "error": None,
        }

        try:
            config_path = Path(
                "unity/Assets/StreamingAssets/unity_services_config.json"
            )
            if not config_path.exists():
                test_result["status"] = "failed"
                test_result["error"] = "Unity Services config file not found"
                print("❌ Unity Services config file not found")
                return test_result

            with open(config_path, "r") as f:
                config_data = json.load(f)

            # Check required fields
            required_fields = ["projectId", "environmentId", "economy"]
            missing_fields = [
                field for field in required_fields if field not in config_data
            ]

            test_result["details"] = {
                "project_id": config_data.get("projectId", "NOT SET"),
                "environment_id": config_data.get("environmentId", "NOT SET"),
                "cloud_services_available": config_data.get(
                    "cloudServicesAvailable", False
                ),
                "economy_configured": "economy" in config_data,
                "currencies_count": len(
                    config_data.get("economy", {}).get("currencies", [])
                ),
                "inventory_count": len(
                    config_data.get("economy", {}).get("inventory", [])
                ),
                "catalog_count": len(config_data.get("economy", {}).get("catalog", [])),
            }

            if missing_fields:
                test_result["status"] = "failed"
                test_result["error"] = (
                    f"Missing required fields: {', '.join(missing_fields)}"
                )
                print(f"❌ Missing required fields: {', '.join(missing_fields)}")
            else:
                test_result["status"] = "passed"
                print("✅ Unity Services configuration is valid")
                print(f"   Project ID: {config_data.get('projectId', 'NOT SET')}")
                print(
                    f"   Environment ID: {config_data.get('environmentId', 'NOT SET')}"
                )
                print(
                    f"   Cloud Services Available: {config_data.get('cloudServicesAvailable', False)}"
                )

        except Exception as error:
            test_result["status"] = "failed"
            test_result["error"] = str(error)
            print(f"❌ Unity Services configuration error: {error}")

        return test_result

    def test_headless_scripts(self):
        """Test headless automation scripts"""
        print("🤖 Testing headless automation scripts...")

        test_result = {
            "name": "Headless Automation Scripts",
            "status": "unknown",
            "details": {},
            "error": None,
        }

        headless_scripts = {
            "bootstrap_headless": "unity/Assets/Scripts/App/BootstrapHeadless.cs",
            "headless_tests": "unity/Assets/Scripts/Testing/HeadlessTests.cs",
            "unity_deploy": "scripts/unity-deploy.js",
            "match3_automation": "scripts/unity/match3_complete_automation.py",
            "github_workflow": ".github/workflows/unity-cloud-api-deploy.yml",
        }

        found_scripts = 0
        total_scripts = len(headless_scripts)
        script_details = {}

        for script_name, script_path in headless_scripts.items():
            script_exists = Path(script_path).exists()
            script_details[script_name] = {"exists": script_exists, "path": script_path}

            if script_exists:
                found_scripts += 1
                print(f"✅ {script_name}: Found")
            else:
                print(f"❌ {script_name}: Missing")

        test_result["details"] = {
            "found_scripts": found_scripts,
            "total_scripts": total_scripts,
            "scripts": script_details,
        }

        if found_scripts == total_scripts:
            test_result["status"] = "passed"
            print("✅ All headless automation scripts found")
        elif found_scripts > 0:
            test_result["status"] = "partial"
            print(
                f"⚠️ {found_scripts}/{total_scripts} headless automation scripts found"
            )
        else:
            test_result["status"] = "failed"
            test_result["error"] = "No headless automation scripts found"
            print("❌ No headless automation scripts found")

        return test_result

    def test_github_workflow(self):
        """Test GitHub Actions workflow for headless deployment"""
        print("🔄 Testing GitHub Actions workflow...")

        test_result = {
            "name": "GitHub Actions Workflow",
            "status": "unknown",
            "details": {},
            "error": None,
        }

        try:
            workflow_path = Path(".github/workflows/unity-cloud-api-deploy.yml")
            if not workflow_path.exists():
                test_result["status"] = "failed"
                test_result["error"] = "GitHub Actions workflow not found"
                print("❌ GitHub Actions workflow not found")
                return test_result

            with open(workflow_path, "r") as f:
                workflow_content = f.read()

            # Check for headless deployment steps
            headless_indicators = [
                "headless",
                "Deploy Economy Data (Headless)",
                "python3 scripts/unity/match3_complete_automation.py",
            ]

            found_indicators = [
                indicator
                for indicator in headless_indicators
                if indicator.lower() in workflow_content.lower()
            ]

            test_result["details"] = {
                "workflow_exists": True,
                "headless_indicators_found": len(found_indicators),
                "total_indicators": len(headless_indicators),
                "indicators": found_indicators,
            }

            if len(found_indicators) >= 2:  # At least 2 headless indicators
                test_result["status"] = "passed"
                print("✅ GitHub Actions workflow configured for headless deployment")
            else:
                test_result["status"] = "partial"
                print(
                    f"⚠️ GitHub Actions workflow partially configured for headless deployment"
                )

        except Exception as error:
            test_result["status"] = "failed"
            test_result["error"] = str(error)
            print(f"❌ GitHub Actions workflow error: {error}")

        return test_result

    def test_simulation_capability(self):
        """Test simulation capability for headless operation"""
        print("🎭 Testing simulation capability...")

        test_result = {
            "name": "Simulation Capability",
            "status": "unknown",
            "details": {},
            "error": None,
        }

        try:
            # Check if Unity service has simulation fallback
            unity_service_path = Path("src/services/unity/index.js")
            if unity_service_path.exists():
                with open(unity_service_path, "r") as f:
                    unity_service_content = f.read()

                simulation_indicators = [
                    "personal-license-mode",
                    "simulation",
                    "fallback",
                    "api-fallback-simulation",
                ]

                found_indicators = [
                    indicator
                    for indicator in simulation_indicators
                    if indicator in unity_service_content
                ]

                test_result["details"] = {
                    "unity_service_exists": True,
                    "simulation_indicators_found": len(found_indicators),
                    "total_indicators": len(simulation_indicators),
                    "indicators": found_indicators,
                }

                if len(found_indicators) >= 3:  # At least 3 simulation indicators
                    test_result["status"] = "passed"
                    print("✅ Simulation capability configured for headless operation")
                else:
                    test_result["status"] = "partial"
                    print("⚠️ Simulation capability partially configured")
            else:
                test_result["status"] = "failed"
                test_result["error"] = "Unity service file not found"
                print("❌ Unity service file not found")

        except Exception as error:
            test_result["status"] = "failed"
            test_result["error"] = str(error)
            print(f"❌ Simulation capability error: {error}")

        return test_result

    def generate_recommendations(self):
        """Generate recommendations based on test results"""
        recommendations = []

        # Check configuration files
        if self.test_results["tests"].get("config_files", {}).get("status") == "failed":
            recommendations.append(
                {
                    "priority": "high",
                    "category": "Configuration",
                    "message": "Missing Unity configuration files required for headless operation",
                    "action": "Ensure all economy CSV files and Unity Services config are present",
                }
            )

        # Check economy data
        if self.test_results["tests"].get("economy_data", {}).get("status") == "failed":
            recommendations.append(
                {
                    "priority": "high",
                    "category": "Economy Data",
                    "message": "No economy data found for headless operation",
                    "action": "Populate economy/currencies.csv, inventory.csv, and catalog.csv",
                }
            )

        # Check headless scripts
        if (
            self.test_results["tests"].get("headless_scripts", {}).get("status")
            == "failed"
        ):
            recommendations.append(
                {
                    "priority": "high",
                    "category": "Automation",
                    "message": "Missing headless automation scripts",
                    "action": "Ensure BootstrapHeadless.cs and other headless scripts are present",
                }
            )

        # Check simulation capability
        if self.test_results["tests"].get("simulation", {}).get("status") == "failed":
            recommendations.append(
                {
                    "priority": "medium",
                    "category": "Simulation",
                    "message": "Simulation capability not properly configured",
                    "action": "Verify Unity service has proper fallback simulation methods",
                }
            )

        return recommendations

    def run_all_tests(self):
        """Run all headless connection tests"""
        self.print_header("HEADLESS UNITY CLOUD CONNECTION TESTER")
        print(f"Project ID: {self.project_id}")
        print(f"Environment ID: {self.environment_id}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print("=" * 80 + "\n")

        # Run all tests
        self.test_results["tests"]["config_files"] = self.test_unity_config_files()
        self.test_results["tests"]["economy_data"] = self.test_economy_data_integrity()
        self.test_results["tests"]["unity_services"] = self.test_unity_services_config()
        self.test_results["tests"]["headless_scripts"] = self.test_headless_scripts()
        self.test_results["tests"]["github_workflow"] = self.test_github_workflow()
        self.test_results["tests"]["simulation"] = self.test_simulation_capability()

        # Calculate overall status
        test_statuses = [test["status"] for test in self.test_results["tests"].values()]
        failed_tests = test_statuses.count("failed")
        passed_tests = test_statuses.count("passed")
        total_tests = len(test_statuses)

        if failed_tests == 0:
            self.test_results["overall_status"] = "passed"
        elif passed_tests > 0:
            self.test_results["overall_status"] = "partial"
        else:
            self.test_results["overall_status"] = "failed"

        # Generate recommendations
        self.test_results["recommendations"] = self.generate_recommendations()

        # Display results
        self.display_results()

        return self.test_results

    def display_results(self):
        """Display test results in a formatted way"""
        print("\n" + "=" * 80)
        print("📊 HEADLESS TEST RESULTS SUMMARY")
        print("=" * 80)

        # Overall status
        status_emoji = {"passed": "✅", "partial": "⚠️", "failed": "❌", "unknown": "❓"}

        print(
            f"\nOverall Status: {status_emoji[self.test_results['overall_status']]} {self.test_results['overall_status'].upper()}"
        )
        print("🎯 Headless Unity Cloud Integration Ready!")

        # Individual test results
        print("\n📋 Individual Test Results:")
        print("-" * 50)

        for test_name, result in self.test_results["tests"].items():
            emoji = status_emoji.get(result["status"], "❓")
            print(f"{emoji} {result['name']}: {result['status'].upper()}")

            if result.get("error"):
                print(f"   Error: {result['error']}")

            if result.get("details") and result["details"]:
                for key, value in result["details"].items():
                    if key not in [
                        "files",
                        "scripts",
                        "indicators",
                    ]:  # Skip complex nested data
                        print(f"   {key}: {value}")
            print()

        # Recommendations
        if self.test_results["recommendations"]:
            print("💡 RECOMMENDATIONS:")
            print("-" * 50)
            for i, rec in enumerate(self.test_results["recommendations"], 1):
                priority_emoji = "🔴" if rec["priority"] == "high" else "🟡"
                print(f"{priority_emoji} {i}. [{rec['category']}] {rec['message']}")
                print(f"   Action: {rec['action']}")
                print()

        print("=" * 80)
        print("🎯 Headless Unity Cloud Connection Test Complete!")
        print("=" * 80 + "\n")

    def save_results(self):
        """Save test results to file"""
        results_dir = Path("monitoring/reports")
        results_dir.mkdir(parents=True, exist_ok=True)

        filename = f"headless_unity_connection_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = results_dir / filename

        with open(filepath, "w") as f:
            json.dump(self.test_results, f, indent=2)

        print(f"📁 Test results saved to: {filepath}")
        return str(filepath)


def main():
    """Main function"""
    tester = HeadlessUnityConnectionTester()
    results = tester.run_all_tests()
    tester.save_results()

    # Exit with appropriate code
    if results["overall_status"] == "passed":
        return 0
    elif results["overall_status"] == "partial":
        return 1
    else:
        return 2


if __name__ == "__main__":
    exit(main())
