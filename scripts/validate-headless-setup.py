#!/usr/bin/env python3
"""
Validation script for headless Unity setup
This script checks if all required components are in place for headless builds
"""

import json
import os
import sys
from pathlib import Path

import yaml
from file_validator import file_validator

sys.path.append(os.path.join(os.path.dirname(__file__), "utilities"))


def check_file_exists(file_path, description):
    """Check if a file exists and report status"""
    if os.path.exists(file_path):
        print(f"✅ {description}: {file_path}")
        return True
    else:
        print(f"❌ {description}: {file_path} - MISSING")
        return False


def check_directory_exists(dir_path, description):
    """Check if a directory exists and report status"""
    if os.path.isdir(dir_path):
        print(f"✅ {description}: {dir_path}")
        return True
    else:
        print(f"❌ {description}: {dir_path} - MISSING")
        return False


def validate_unity_project():
    """Validate Unity project structure using centralized validator"""
    print("🔍 Validating Unity project structure...")

    # Use centralized validator for Unity scripts
    unity_scripts = file_validator.validate_unity_scripts()

    all_good = True

    # Check Unity scripts using centralized validator
    for script_name, exists in unity_scripts.items():
        if exists:
            print(f"✅ {script_name}: Found")
        else:
            print(f"❌ {script_name}: Missing")
            all_good = False

    # Check other Unity-specific files
    unity_root = Path("unity")
    other_files = [
        (
            unity_root / "ProjectSettings" / "ProjectSettings.asset",
            "Unity Project Settings",
        ),
        (unity_root / "Packages" / "manifest.json", "Unity Package Manifest"),
        (unity_root / "Assets" / "Scenes" / "Bootstrap.unity", "Bootstrap Scene"),
    ]

    required_dirs = [
        (unity_root / "Assets" / "Scenes", "Scenes Directory"),
        (unity_root / "Assets" / "Scripts", "Scripts Directory"),
        (unity_root / "Assets" / "Scripts" / "App", "App Scripts Directory"),
        (unity_root / "Assets" / "Scripts" / "Core", "Core Scripts Directory"),
        (unity_root / "Assets" / "Scripts" / "Editor", "Editor Scripts Directory"),
        (unity_root / "Assets" / "Scripts" / "Testing", "Testing Scripts Directory"),
    ]

    for file_path, description in other_files:
        if not check_file_exists(file_path, description):
            all_good = False

    for dir_path, description in required_dirs:
        if not check_directory_exists(dir_path, description):
            all_good = False

    return all_good


def validate_github_workflows():
    """Validate GitHub Actions workflows using centralized validator"""
    print("\n🔍 Validating GitHub Actions workflows...")

    # Use centralized validator for GitHub workflows
    workflow_files = file_validator.validate_github_workflows()

    if not workflow_files["unity-build.yml"]:
        print("❌ Unity Build Workflow: Missing")
        return False

    print("✅ Unity Build Workflow: Found")

    # Check if workflow has required sections
    try:
        with open(".github/workflows/unity-build.yml", "r") as f:
            content = f.read()

        required_sections = [
            "test:",
            "build-windows:",
            "build-linux:",
            "build-webgl:",
            "build-android:",
            "build-ios:",
            "UNITY_LICENSE:",
            "UNITY_EMAIL:",
            "UNITY_PASSWORD:",
        ]

        all_sections_found = True
        for section in required_sections:
            if section in content:
                print(f"✅ Workflow contains: {section}")
            else:
                print(f"❌ Workflow missing: {section}")
                all_sections_found = False

        return all_sections_found

    except Exception as e:
        print(f"❌ Error reading workflow file: {e}")
        return False


def validate_package_manifest():
    """Validate Unity package manifest"""
    print("\n🔍 Validating Unity package manifest...")

    manifest_file = Path("unity/Packages/manifest.json")
    if not check_file_exists(manifest_file, "Package Manifest"):
        return False

    try:
        with open(manifest_file, "r") as f:
            manifest = json.load(f)

        required_packages = [
            "com.unity.test-framework",
            "com.unity.testtools.codecoverage",
            "com.unity.ugui",
        ]

        dependencies = manifest.get("dependencies", {})
        all_packages_found = True

        for package in required_packages:
            if package in dependencies:
                print(f"✅ Package found: {package}")
            else:
                print(f"❌ Package missing: {package}")
                all_packages_found = False

        return all_packages_found

    except Exception as e:
        print(f"❌ Error reading package manifest: {e}")
        return False


def validate_build_script():
    """Validate build script functionality"""
    print("\n🔍 Validating build script...")

    build_script = Path("unity/Assets/Scripts/Editor/BuildScript.cs")
    if not check_file_exists(build_script, "Build Script"):
        return False

    try:
        with open(build_script, "r") as f:
            content = f.read()

        required_methods = [
            "BuildWindows",
            "BuildLinux",
            "BuildWebGL",
            "BuildAndroid",
            "BuildiOS",
        ]

        all_methods_found = True
        for method in required_methods:
            if f"public static void {method}" in content:
                print(f"✅ Build method found: {method}")
            else:
                print(f"❌ Build method missing: {method}")
                all_methods_found = False

        return all_methods_found

    except Exception as e:
        print(f"❌ Error reading build script: {e}")
        return False


def validate_test_script():
    """Validate test script functionality"""
    print("\n🔍 Validating test script...")

    test_script = Path("unity/Assets/Scripts/Testing/HeadlessTests.cs")
    if not check_file_exists(test_script, "Test Script"):
        return False

    try:
        with open(test_script, "r") as f:
            content = f.read()

        required_elements = [
            "[Test]",
            "[UnityTest]",
            "Assert.",
            "BootstrapHeadless",
            "GameManager",
        ]

        all_elements_found = True
        for element in required_elements:
            if element in content:
                print(f"✅ Test element found: {element}")
            else:
                print(f"❌ Test element missing: {element}")
                all_elements_found = False

        return all_elements_found

    except Exception as e:
        print(f"❌ Error reading test script: {e}")
        return False


def main():
    """Main validation function"""
    print("🚀 Validating Headless Unity Setup")
    print("=" * 50)

    all_valid = True

    # Run all validations
    validations = [
        validate_unity_project,
        validate_github_workflows,
        validate_package_manifest,
        validate_build_script,
        validate_test_script,
    ]

    for validation in validations:
        if not validation():
            all_valid = False

    print("\n" + "=" * 50)
    if all_valid:
        print("🎉 All validations passed! Your headless Unity setup is ready!")
        print("\n📋 Next steps:")
        print("1. Add Unity secrets to GitHub repository")
        print("2. Push to main branch to trigger first build")
        print("3. Check Actions tab for build results")
        print("4. Download builds from Artifacts section")
        return 0
    else:
        print("❌ Some validations failed. Please fix the issues above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
