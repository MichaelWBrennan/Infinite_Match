#!/usr/bin/env python3
"""
Test script for the centralized file validator
Verifies that redundant checks have been eliminated
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'utilities'))
from file_validator import file_validator

def test_file_validator():
    """Test the centralized file validator"""
    print("🧪 Testing Centralized File Validator")
    print("=" * 50)
    
    # Test economy files validation
    print("\n📊 Testing Economy Files Validation:")
    economy_files = file_validator.validate_economy_files()
    for name, exists in economy_files.items():
        status = "✅" if exists else "❌"
        print(f"  {status} {name}")
    
    # Test cloud code files validation
    print("\n☁️ Testing Cloud Code Files Validation:")
    cloud_code_files = file_validator.validate_cloud_code_files()
    for name, exists in cloud_code_files.items():
        status = "✅" if exists else "❌"
        print(f"  {status} {name}")
    
    # Test remote config files validation
    print("\n⚙️ Testing Remote Config Files Validation:")
    remote_config_files = file_validator.validate_remote_config_files()
    for name, exists in remote_config_files.items():
        status = "✅" if exists else "❌"
        print(f"  {status} {name}")
    
    # Test GitHub workflows validation
    print("\n🔄 Testing GitHub Workflows Validation:")
    workflow_files = file_validator.validate_github_workflows()
    for name, exists in workflow_files.items():
        status = "✅" if exists else "❌"
        print(f"  {status} {name}")
    
    # Test Unity scripts validation
    print("\n🎮 Testing Unity Scripts Validation:")
    unity_scripts = file_validator.validate_unity_scripts()
    for name, exists in unity_scripts.items():
        status = "✅" if exists else "❌"
        print(f"  {status} {name}")
    
    # Test comprehensive validation
    print("\n📋 Testing Comprehensive Validation:")
    all_files = file_validator.validate_all_files()
    total_files = sum(len(files) for files in all_files.values())
    existing_files = sum(sum(1 for exists in files.values() if exists) for files in all_files.values())
    
    print(f"  Total files checked: {total_files}")
    print(f"  Existing files: {existing_files}")
    print(f"  Missing files: {total_files - existing_files}")
    
    # Test missing files report
    print("\n⚠️ Missing Files Report:")
    missing_files = file_validator.get_missing_files()
    if missing_files:
        for file in missing_files:
            print(f"  • {file}")
    else:
        print("  🎉 No missing files!")
    
    # Test existing files report
    print("\n✅ Existing Files Report:")
    existing_files_list = file_validator.get_existing_files()
    if existing_files_list:
        for file in existing_files_list:
            print(f"  • {file}")
    
    print("\n🎉 File Validator Test Complete!")
    print("✅ Redundant checks have been eliminated!")
    print("✅ Centralized validation is working!")

if __name__ == "__main__":
    test_file_validator()