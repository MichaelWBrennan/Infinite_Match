#!/usr/bin/env python3
"""
Unity Cloud Code C# Build and Deploy Script
This script builds the C# project and prepares it for deployment
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def run_command(command, cwd=None):
    """Run a command and return the result"""
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            cwd=cwd, 
            capture_output=True, 
            text=True, 
            check=True
        )
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def check_dotnet():
    """Check if .NET is installed"""
    success, output = run_command("dotnet --version")
    if success:
        print(f"✅ .NET found: {output.strip()}")
        return True
    else:
        print("❌ .NET not found. Please install .NET 6.0 or later.")
        return False

def build_project():
    """Build the C# project"""
    print("🔨 Building C# project...")
    success, output = run_command("dotnet build cloud-code.csproj --configuration Release", cwd="cloud-code-csharp")
    
    if success:
        print("✅ Build successful!")
        return True
    else:
        print(f"❌ Build failed: {output}")
        return False

def create_deployment_package():
    """Create a deployment package"""
    print("📦 Creating deployment package...")
    
    # Create deployment directory
    deploy_dir = Path("cloud-code-csharp/deploy")
    deploy_dir.mkdir(exist_ok=True)
    
    # Copy source files
    src_dir = Path("cloud-code-csharp/src")
    for file in src_dir.glob("*.cs"):
        deploy_dir.joinpath(file.name).write_text(file.read_text())
    
    # Copy project file
    project_file = Path("cloud-code-csharp/cloud-code.csproj")
    deploy_dir.joinpath("cloud-code.csproj").write_text(project_file.read_text())
    
    # Copy config file
    config_file = Path("cloud-code-csharp/cloud-code-config.json")
    deploy_dir.joinpath("cloud-code-config.json").write_text(config_file.read_text())
    
    print("✅ Deployment package created!")
    return True

def show_deployment_instructions():
    """Show deployment instructions"""
    print("\n🚀 Deployment Instructions:")
    print("=" * 50)
    print("1. Install Unity CLI:")
    print("   npm install -g @unity/cloud-code-cli")
    print()
    print("2. Login to Unity:")
    print("   unity auth login")
    print()
    print("3. Deploy functions:")
    print("   cd cloud-code-csharp/deploy")
    print("   unity cloud-code deploy \\")
    print("     --project-id 0dd5a03e-7f23-49c4-964e-7919c48c0574 \\")
    print("     --environment-id 1d8c470b-d8d2-4a72-88f6 \\")
    print("     --source-dir . \\")
    print("     --function-config cloud-code-config.json")
    print()
    print("4. Or use the deploy script:")
    print("   cd cloud-code-csharp")
    print("   ./deploy.sh")

def main():
    """Main function"""
    print("🎯 Unity Cloud Code C# Setup")
    print("=" * 40)
    
    # Change to the cloud-code-csharp directory
    os.chdir("cloud-code-csharp")
    
    # Check prerequisites
    if not check_dotnet():
        sys.exit(1)
    
    # Build project
    if not build_project():
        sys.exit(1)
    
    # Create deployment package
    if not create_deployment_package():
        sys.exit(1)
    
    # Show deployment instructions
    show_deployment_instructions()
    
    print("\n🎉 Setup complete! Your C# cloud code is ready for deployment.")

if __name__ == "__main__":
    main()