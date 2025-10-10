#!/bin/bash
# Headless Unity Operations Script
# This script provides easy access to all headless Unity Cloud operations

echo "🎯 HEADLESS UNITY CLOUD OPERATIONS"
echo "=================================="

case "$1" in
    "status"|"check"|"visibility")
        echo "🔍 Checking Unity Cloud account visibility..."
        python3 scripts/unity/test-headless-account-visibility.py
        ;;
    "deploy"|"cloud-code")
        echo "☁️ Deploying cloud code functions..."
        node scripts/unity/deploy-cloud-code.js
        ;;
    "economy"|"automation")
        echo "💰 Running economy automation..."
        python3 scripts/unity/match3_complete_automation.py
        ;;
    "read"|"data")
        echo "📖 Reading Unity Cloud data..."
        python3 scripts/unity/headless-unity-cloud-reader.py
        ;;
    "real"|"api"|"credentials")
        echo "🔐 Reading real Unity Cloud data with credentials..."
        python3 scripts/unity/headless-unity-api-with-credentials.py
        ;;
    "live"|"realtime"|"monitor")
        echo "🔴 Starting real-time Unity Cloud monitoring..."
        python3 scripts/unity/headless-live-dashboard.py
        ;;
    "dashboard")
        echo "📊 Starting Unity Cloud live dashboard..."
        python3 scripts/unity/headless-live-dashboard.py
        ;;
    "all"|"everything")
        echo "🚀 Running all headless operations..."
        echo ""
        echo "1. Checking account visibility..."
        python3 scripts/unity/test-headless-account-visibility.py
        echo ""
        echo "2. Deploying cloud code..."
        node scripts/unity/deploy-cloud-code.js
        echo ""
        echo "3. Running economy automation..."
        python3 scripts/unity/match3_complete_automation.py
        echo ""
        echo "4. Reading account data..."
        python3 scripts/unity/headless-unity-cloud-reader.py
        echo ""
        echo "🎉 All headless operations completed!"
        ;;
    "help"|*)
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  status, check, visibility  - Check Unity Cloud account visibility"
        echo "  deploy, cloud-code        - Deploy cloud code functions"
        echo "  economy, automation       - Run economy automation"
        echo "  read, data               - Read Unity Cloud data (simulated)"
        echo "  real, api, credentials   - Read real Unity Cloud data with API"
        echo "  live, realtime, monitor  - Real-time Unity Cloud monitoring"
        echo "  dashboard                - Live Unity Cloud dashboard"
        echo "  all, everything          - Run all headless operations"
        echo "  help                     - Show this help"
        echo ""
        echo "Examples:"
        echo "  $0 status                # Check account status"
        echo "  $0 deploy               # Deploy cloud code"
        echo "  $0 all                  # Run everything"
        ;;
esac