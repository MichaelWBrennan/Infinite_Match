#!/usr/bin/env python3
"""
Automated Dependency Management System
Manages Unity packages, npm dependencies, and system requirements
"""

import json
import os
import re
import subprocess
from datetime import datetime
from typing import Any, Dict, List, Optional

import requests
import yaml


class DependencyManager:
    def __init__(self):
        self.unity_packages = self._load_unity_packages()
        self.npm_packages = self._load_npm_packages()
        self.system_requirements = self._load_system_requirements()
        self.update_log = []

    def _load_unity_packages(self) -> Dict[str, Any]:
        """Load Unity package dependencies"""
        manifest_path = "unity/Packages/manifest.json"
        if os.path.exists(manifest_path):
            with open(manifest_path, "r") as f:
                return json.load(f)
        return {"dependencies": {}}

    def _load_npm_packages(self) -> Dict[str, Any]:
        """Load npm package dependencies"""
        package_path = "package.json"
        if os.path.exists(package_path):
            with open(package_path, "r") as f:
                return json.load(f)
        return {"dependencies": {}}

    def _load_system_requirements(self) -> Dict[str, Any]:
        """Load system requirements"""
        return {
            "unity_version": "2022.3.0f1",
            "python_version": "3.8+",
            "node_version": "16+",
            "git_version": "2.30+",
            "disk_space": "10GB",
            "ram": "8GB",
        }

    def check_unity_package_updates(self) -> List[Dict[str, Any]]:
        """Check for Unity package updates"""
        updates = []

        # Simulate checking for package updates
        # In a real implementation, this would query Unity Package Manager API
        package_versions = {
            "com.unity.analytics": "3.8.0",
            "com.unity.ads": "4.4.0",
            "com.unity.cloudbuild": "1.0.0",
            "com.unity.collab-proxy": "2.0.0",
            "com.unity.feature.2d": "2.0.0",
            "com.unity.ide.rider": "3.0.0",
            "com.unity.ide.visualstudio": "2.0.0",
            "com.unity.ide.vscode": "1.2.0",
            "com.unity.inputsystem": "1.5.0",
            "com.unity.multiplayer.tools": "1.0.0",
            "com.unity.netcode.gameobjects": "1.5.0",
            "com.unity.probuilder": "5.0.0",
            "com.unity.progrids": "3.0.0",
            "com.unity.render-pipelines.universal": "14.0.0",
            "com.unity.test-framework": "1.3.0",
            "com.unity.textmeshpro": "3.0.0",
            "com.unity.timeline": "1.7.0",
            "com.unity.ugui": "1.0.0",
            "com.unity.visualscripting": "1.8.0",
            "com.unity.xr.management": "4.2.0",
        }

        for package, current_version in self.unity_packages.get(
            "dependencies", {}
        ).items():
            if package in package_versions:
                latest_version = package_versions[package]
                if self._compare_versions(current_version, latest_version) < 0:
                    updates.append(
                        {
                            "package": package,
                            "current_version": current_version,
                            "latest_version": latest_version,
                            "update_type": self._get_update_type(
                                current_version, latest_version
                            ),
                        }
                    )

        return updates

    def check_npm_package_updates(self) -> List[Dict[str, Any]]:
        """Check for npm package updates"""
        updates = []

        try:
            # Run npm outdated command
            result = subprocess.run(
                ["npm", "outdated", "--json"], capture_output=True, text=True, cwd="."
            )

            if result.returncode == 0:
                outdated_packages = json.loads(result.stdout)
                for package, info in outdated_packages.items():
                    updates.append(
                        {
                            "package": package,
                            "current_version": info.get("current", "unknown"),
                            "latest_version": info.get("latest", "unknown"),
                            "wanted_version": info.get("wanted", "unknown"),
                            "update_type": self._get_update_type(
                                info.get("current", "0.0.0"),
                                info.get("latest", "0.0.0"),
                            ),
                        }
                    )
        except Exception as e:
            print(f"Error checking npm updates: {e}")

        return updates

    def check_system_requirements(self) -> Dict[str, Any]:
        """Check if system meets requirements"""
        status = {
            "unity_version": self._check_unity_version(),
            "python_version": self._check_python_version(),
            "node_version": self._check_node_version(),
            "git_version": self._check_git_version(),
            "disk_space": self._check_disk_space(),
            "ram": self._check_ram(),
        }

        return status

    def _check_unity_version(self) -> Dict[str, Any]:
        """Check Unity version"""
        try:
            result = subprocess.run(
                ["unity", "--version"], capture_output=True, text=True
            )
            if result.returncode == 0:
                version = result.stdout.strip()
                return {
                    "installed": True,
                    "version": version,
                    "meets_requirement": True,  # Simplified check
                }
        except BaseException:
            pass

        return {
            "installed": False,
            "version": "Not installed",
            "meets_requirement": False,
        }

    def _check_python_version(self) -> Dict[str, Any]:
        """Check Python version"""
        import sys

        version = f"{
            sys.version_info.major}.{
            sys.version_info.minor}.{
            sys.version_info.micro}"
        required_major, required_minor = 3, 8

        return {
            "installed": True,
            "version": version,
            "meets_requirement": sys.version_info >= (required_major, required_minor),
        }

    def _check_node_version(self) -> Dict[str, Any]:
        """Check Node.js version"""
        try:
            result = subprocess.run(
                ["node", "--version"], capture_output=True, text=True
            )
            if result.returncode == 0:
                version = result.stdout.strip().lstrip("v")
                major, minor = map(int, version.split(".")[:2])
                return {
                    "installed": True,
                    "version": version,
                    "meets_requirement": (major, minor) >= (16, 0),
                }
        except BaseException:
            pass

        return {
            "installed": False,
            "version": "Not installed",
            "meets_requirement": False,
        }

    def _check_git_version(self) -> Dict[str, Any]:
        """Check Git version"""
        try:
            result = subprocess.run(
                ["git", "--version"], capture_output=True, text=True
            )
            if result.returncode == 0:
                version = result.stdout.strip()
                # Extract version number
                version_match = re.search(r"(\d+)\.(\d+)\.(\d+)", version)
                if version_match:
                    major, minor, patch = map(int, version_match.groups())
                    return {
                        "installed": True,
                        "version": version,
                        "meets_requirement": (major, minor) >= (2, 30),
                    }
        except BaseException:
            pass

        return {
            "installed": False,
            "version": "Not installed",
            "meets_requirement": False,
        }

    def _check_disk_space(self) -> Dict[str, Any]:
        """Check available disk space"""
        import shutil

        try:
            total, used, free = shutil.disk_usage(".")
            free_gb = free // (1024**3)
            required_gb = 10

            return {
                "available_gb": free_gb,
                "required_gb": required_gb,
                "meets_requirement": free_gb >= required_gb,
            }
        except BaseException:
            return {"available_gb": 0, "required_gb": 10, "meets_requirement": False}

    def _check_ram(self) -> Dict[str, Any]:
        """Check available RAM"""
        import psutil

        try:
            ram_gb = psutil.virtual_memory().total // (1024**3)
            required_gb = 8

            return {
                "available_gb": ram_gb,
                "required_gb": required_gb,
                "meets_requirement": ram_gb >= required_gb,
            }
        except BaseException:
            return {"available_gb": 0, "required_gb": 8, "meets_requirement": False}

    def _compare_versions(self, v1: str, v2: str) -> int:
        """Compare version strings"""

        def version_tuple(v):
            return tuple(map(int, v.split(".")))

        try:
            t1 = version_tuple(v1)
            t2 = version_tuple(v2)
            if t1 < t2:
                return -1
            elif t1 > t2:
                return 1
            else:
                return 0
        except BaseException:
            return 0

    def _get_update_type(self, current: str, latest: str) -> str:
        """Determine update type (patch, minor, major)"""
        try:
            current_parts = list(map(int, current.split(".")))
            latest_parts = list(map(int, latest.split(".")))

            if current_parts[0] < latest_parts[0]:
                return "major"
            elif current_parts[1] < latest_parts[1]:
                return "minor"
            else:
                return "patch"
        except BaseException:
            return "unknown"

    def update_unity_packages(self, updates: List[Dict[str, Any]]) -> List[str]:
        """Update Unity packages"""
        updated_packages = []

        for update in updates:
            if update["update_type"] in [
                "patch",
                "minor",
            ]:  # Only auto-update safe updates
                try:
                    # Update package in manifest
                    package_name = update["package"]
                    new_version = update["latest_version"]

                    if package_name in self.unity_packages["dependencies"]:
                        self.unity_packages["dependencies"][package_name] = new_version
                        updated_packages.append(f"{package_name} -> {new_version}")
                        self.update_log.append(
                            {
                                "timestamp": datetime.now().isoformat(),
                                "type": "unity_package",
                                "package": package_name,
                                "old_version": update["current_version"],
                                "new_version": new_version,
                            }
                        )
                except Exception as e:
                    print(f"Error updating {update['package']}: {e}")

        # Save updated manifest
        if updated_packages:
            with open("unity/Packages/manifest.json", "w") as f:
                json.dump(self.unity_packages, f, indent=2)

        return updated_packages

    def update_npm_packages(self, updates: List[Dict[str, Any]]) -> List[str]:
        """Update npm packages"""
        updated_packages = []

        for update in updates:
            if update["update_type"] in [
                "patch",
                "minor",
            ]:  # Only auto-update safe updates
                try:
                    package_name = update["package"]
                    new_version = update["latest_version"]

                    # Update package.json
                    if package_name in self.npm_packages["dependencies"]:
                        self.npm_packages["dependencies"][
                            package_name
                        ] = f"^{new_version}"
                        updated_packages.append(f"{package_name} -> {new_version}")
                        self.update_log.append(
                            {
                                "timestamp": datetime.now().isoformat(),
                                "type": "npm_package",
                                "package": package_name,
                                "old_version": update["current_version"],
                                "new_version": new_version,
                            }
                        )
                except Exception as e:
                    print(f"Error updating {update['package']}: {e}")

        # Save updated package.json
        if updated_packages:
            with open("package.json", "w") as f:
                json.dump(self.npm_packages, f, indent=2)

        return updated_packages

    def generate_dependency_report(self) -> Dict[str, Any]:
        """Generate comprehensive dependency report"""
        unity_updates = self.check_unity_package_updates()
        npm_updates = self.check_npm_package_updates()
        system_status = self.check_system_requirements()

        report = {
            "timestamp": datetime.now().isoformat(),
            "unity_packages": {
                "total_packages": len(self.unity_packages.get("dependencies", {})),
                "updates_available": len(unity_updates),
                "updates": unity_updates,
            },
            "npm_packages": {
                "total_packages": len(self.npm_packages.get("dependencies", {})),
                "updates_available": len(npm_updates),
                "updates": npm_updates,
            },
            "system_requirements": system_status,
            "update_log": self.update_log,
            "recommendations": self._generate_recommendations(
                unity_updates, npm_updates, system_status
            ),
        }

        return report

    def _generate_recommendations(
        self, unity_updates: List, npm_updates: List, system_status: Dict
    ) -> List[str]:
        """Generate dependency management recommendations"""
        recommendations = []

        # Unity package recommendations
        if unity_updates:
            major_updates = [u for u in unity_updates if u["update_type"] == "major"]
            if major_updates:
                recommendations.append(
                    f"Consider updating {
                        len(major_updates)} major Unity packages after testing"
                )

            safe_updates = [
                u for u in unity_updates if u["update_type"] in ["patch", "minor"]
            ]
            if safe_updates:
                recommendations.append(
                    f"Auto-update {len(safe_updates)} safe Unity package updates"
                )

        # NPM package recommendations
        if npm_updates:
            major_updates = [u for u in npm_updates if u["update_type"] == "major"]
            if major_updates:
                recommendations.append(
                    f"Review {
                        len(major_updates)} major npm package updates"
                )

        # System requirements recommendations
        failed_requirements = [
            k for k, v in system_status.items() if not v.get("meets_requirement", False)
        ]
        if failed_requirements:
            recommendations.append(
                f"Address system requirements: {
                    ', '.join(failed_requirements)}"
            )

        if not recommendations:
            recommendations.append(
                "All dependencies are up to date and system meets requirements"
            )

        return recommendations

    def save_report(self, report: Dict[str, Any], filepath: str):
        """Save dependency report to file"""
        with open(filepath, "w") as f:
            json.dump(report, f, indent=2)
        print(f"Dependency report saved to {filepath}")


def main():
    """Main function to run dependency management"""
    manager = DependencyManager()

    print("Starting dependency management...")

    # Generate dependency report
    report = manager.generate_dependency_report()

    # Auto-update safe packages
    unity_updates = report["unity_packages"]["updates"]
    npm_updates = report["npm_packages"]["updates"]

    safe_unity_updates = [
        u for u in unity_updates if u["update_type"] in ["patch", "minor"]
    ]
    safe_npm_updates = [
        u for u in npm_updates if u["update_type"] in ["patch", "minor"]
    ]

    if safe_unity_updates:
        print(f"Auto-updating {len(safe_unity_updates)} Unity packages...")
        updated = manager.update_unity_packages(safe_unity_updates)
        print(f"Updated: {', '.join(updated)}")

    if safe_npm_updates:
        print(f"Auto-updating {len(safe_npm_updates)} npm packages...")
        updated = manager.update_npm_packages(safe_npm_updates)
        print(f"Updated: {', '.join(updated)}")

    # Save report
    os.makedirs("reports", exist_ok=True)
    manager.save_report(
        report,
        f"reports/dependency_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
    )

    print("Dependency management completed!")

    return (
        len(report["unity_packages"]["updates"])
        + len(report["npm_packages"]["updates"])
        == 0
    )


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
