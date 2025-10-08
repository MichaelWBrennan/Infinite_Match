#!/usr/bin/env python3
"""
Centralized File Validation Utility
Eliminates redundant file existence checks across all scripts
"""

import os
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional, Tuple


class FileValidator:
    """Centralized file validation utility to eliminate redundant checks"""

    def __init__(self, repo_root: Optional[Path] = None):
        self.repo_root = repo_root or Path(__file__).parent.parent.parent
        self._cache = {}

    @lru_cache(maxsize=128)
    def file_exists(self, file_path: str) -> bool:
        """Check if a file exists with caching to avoid redundant checks"""
        full_path = self.repo_root / file_path
        return full_path.exists()

    @lru_cache(maxsize=128)
    def dir_exists(self, dir_path: str) -> bool:
        """Check if a directory exists with caching to avoid redundant checks"""
        full_path = self.repo_root / dir_path
        return full_path.is_dir()

    def validate_economy_files(self) -> Dict[str, bool]:
        """Validate all economy-related files in one go"""
        economy_files = {
            "currencies.csv": "economy/currencies.csv",
            "inventory.csv": "economy/inventory.csv",
            "catalog.csv": "economy/catalog.csv",
        }

        results = {}
        for name, path in economy_files.items():
            results[name] = self.file_exists(path)

        return results

    def validate_cloud_code_files(self) -> Dict[str, bool]:
        """Validate all cloud code files in one go"""
        cloud_code_files = {
            "AddCurrency.js": "cloud-code/AddCurrency.js",
            "SpendCurrency.js": "cloud-code/SpendCurrency.js",
            "AddInventoryItem.js": "cloud-code/AddInventoryItem.js",
            "UseInventoryItem.js": "cloud-code/UseInventoryItem.js",
        }

        results = {}
        for name, path in cloud_code_files.items():
            results[name] = self.file_exists(path)

        return results

    def validate_remote_config_files(self) -> Dict[str, bool]:
        """Validate all remote config files in one go"""
        remote_config_files = {
            "game_config.json": "remote-config/game_config.json",
            "events.json": "config/events.json",
            "rotation.json": "config/rotation.json",
        }

        results = {}
        for name, path in remote_config_files.items():
            results[name] = self.file_exists(path)

        return results

    def validate_github_workflows(self) -> Dict[str, bool]:
        """Validate all GitHub workflow files in one go"""
        workflow_files = {
            "unity-build.yml": ".github/workflows/unity-build.yml",
            "zero-unity-editor.yml": ".github/workflows/zero-unity-editor.yml",
            "unity-100-percent-automation.yml": ".github/workflows/unity-100-percent-automation.yml",
            "unity-100-percent-working-automation.yml": ".github/workflows/unity-100-percent-working-automation.yml",
        }

        results = {}
        for name, path in workflow_files.items():
            results[name] = self.file_exists(path)

        return results

    def validate_unity_scripts(self) -> Dict[str, bool]:
        """Validate all Unity-related scripts in one go"""
        unity_scripts = {
            "BuildScript.cs": "unity/Assets/Scripts/Editor/BuildScript.cs",
            "BootstrapHeadless.cs": "unity/Assets/Scripts/App/BootstrapHeadless.cs",
            "GameManager.cs": "unity/Assets/Scripts/Core/GameManager.cs",
            "HeadlessTests.cs": "unity/Assets/Scripts/Testing/HeadlessTests.cs",
        }

        results = {}
        for name, path in unity_scripts.items():
            results[name] = self.file_exists(path)

        return results

    def validate_all_files(self) -> Dict[str, Dict[str, bool]]:
        """Validate all files in one comprehensive check"""
        return {
            "economy": self.validate_economy_files(),
            "cloud_code": self.validate_cloud_code_files(),
            "remote_config": self.validate_remote_config_files(),
            "github_workflows": self.validate_github_workflows(),
            "unity_scripts": self.validate_unity_scripts(),
        }

    def get_missing_files(self, category: str = None) -> List[str]:
        """Get list of missing files, optionally filtered by category"""
        all_files = self.validate_all_files()
        missing = []

        if category and category in all_files:
            for name, exists in all_files[category].items():
                if not exists:
                    missing.append(f"{category}/{name}")
        else:
            for cat, files in all_files.items():
                for name, exists in files.items():
                    if not exists:
                        missing.append(f"{cat}/{name}")

        return missing

    def get_existing_files(self, category: str = None) -> List[str]:
        """Get list of existing files, optionally filtered by category"""
        all_files = self.validate_all_files()
        existing = []

        if category and category in all_files:
            for name, exists in all_files[category].items():
                if exists:
                    existing.append(f"{category}/{name}")
        else:
            for cat, files in all_files.items():
                for name, exists in files.items():
                    if exists:
                        existing.append(f"{cat}/{name}")

        return existing

    def print_validation_report(self, category: str = None):
        """Print a formatted validation report"""
        all_files = self.validate_all_files()

        if category and category in all_files:
            files_to_check = {category: all_files[category]}
        else:
            files_to_check = all_files

        print("📋 File Validation Report")
        print("=" * 50)

        for cat, files in files_to_check.items():
            print(f"\n{cat.replace('_', ' ').title()}:")
            for name, exists in files.items():
                status = "✅" if exists else "❌"
                print(f"  {status} {name}")

        missing = self.get_missing_files(category)
        if missing:
            print(f"\n⚠️ Missing files: {len(missing)}")
            for file in missing:
                print(f"  • {file}")
        else:
            print("\n🎉 All files present!")


# Global instance for easy importing
file_validator = FileValidator()

# Convenience functions for backward compatibility


def check_economy_files():
    """Check economy files and return results"""
    return file_validator.validate_economy_files()


def check_cloud_code_files():
    """Check cloud code files and return results"""
    return file_validator.validate_cloud_code_files()


def check_remote_config_files():
    """Check remote config files and return results"""
    return file_validator.validate_remote_config_files()


def check_github_workflows():
    """Check GitHub workflow files and return results"""
    return file_validator.validate_github_workflows()


def check_unity_scripts():
    """Check Unity script files and return results"""
    return file_validator.validate_unity_scripts()


def check_all_files():
    """Check all files and return comprehensive results"""
    return file_validator.validate_all_files()


if __name__ == "__main__":
    # Run validation report when script is executed directly
    validator = FileValidator()
    validator.print_validation_report()
