#!/usr/bin/env python3
"""
Headless Mode Check
This script runs before any Unity Cloud operations to ensure headless mode is used
"""

import os
import sys


def check_headless_mode():
    """Check if we should use headless mode"""
    # Check for headless mode configuration
    if os.path.exists("HEADLESS_ONLY_MODE"):
        with open("HEADLESS_ONLY_MODE", "r") as f:
            content = f.read()
            if "HEADLESS_MODE_ONLY=true" in content:
                return True

    # Check for headless scripts
    headless_scripts = [
        "scripts/unity/test-headless-account-visibility.py",
        "scripts/unity/deploy-cloud-code.js",
        "scripts/unity/match3_complete_automation.py",
        "scripts/unity/headless-unity-cloud-reader.py",
    ]

    return all(os.path.exists(script) for script in headless_scripts)


def show_headless_reminder():
    """Show headless mode reminder"""
    print("🎯 HEADLESS MODE ACTIVE")
    print("=" * 50)
    print("This project uses HEADLESS MODE ONLY for Unity Cloud operations.")
    print("✅ Use: ./scripts/headless-unity-ops.sh [command]")
    print("❌ Never use: APIs, CLI, or external installations")
    print("=" * 50)


def main():
    """Main function"""
    if check_headless_mode():
        show_headless_reminder()
        return True
    else:
        print("⚠️ Headless mode not properly configured")
        return False


if __name__ == "__main__":
    main()
