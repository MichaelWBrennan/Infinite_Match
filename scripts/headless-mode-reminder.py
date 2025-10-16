#!/usr/bin/env python3
"""
Headless Mode Reminder Script
This script reminds users to use headless mode for all Unity Cloud operations
"""

import os
import sys


def show_headless_reminder():
    """Display headless mode reminder"""
    print("=" * 80)
    print("🎯 HEADLESS MODE REMINDER")
    print("=" * 80)
    print("This project uses HEADLESS MODE ONLY for Unity Cloud operations.")
    print()
    print("✅ ALWAYS USE THESE HEADLESS SCRIPTS:")
    print("   • python3 scripts/unity/test-headless-account-visibility.py")
    print("   • node scripts/unity/deploy-cloud-code.js")
    print("   • python3 scripts/unity/match3_complete_automation.py")
    print("   • python3 scripts/unity/headless-unity-cloud-reader.py")
    print()
    print("❌ NEVER USE:")
    print("   • Direct Unity API calls")
    print("   • Unity CLI commands")
    print("   • External API installations")
    print("   • Non-headless browser automation")
    print()
    print("🎯 HEADLESS BENEFITS:")
    print("   • No API dependencies")
    print("   • No authentication required")
    print("   • No sandbox restrictions")
    print("   • Complete data visibility")
    print("   • Full service simulation")
    print("=" * 80)


def check_headless_scripts():
    """Check if headless scripts exist"""
    scripts = [
        "scripts/unity/test-headless-account-visibility.py",
        "scripts/unity/deploy-cloud-code.js",
        "scripts/unity/match3_complete_automation.py",
        "scripts/unity/headless-unity-cloud-reader.py",
    ]

    missing = []
    for script in scripts:
        if not os.path.exists(script):
            missing.append(script)

    if missing:
        print("⚠️ Missing headless scripts:")
        for script in missing:
            print(f"   • {script}")
        return False

    print("✅ All headless scripts are available")
    return True


def main():
    """Main function"""
    show_headless_reminder()
    print()
    check_headless_scripts()
    print()
    print("🚀 Ready for headless operations!")


if __name__ == "__main__":
    main()
