#!/bin/bash

# Trigger Unity Cloud Real Deployment
# Uses existing optimized-ci-cd.yml workflow with GitHub secrets

echo "🚀 Triggering Unity Cloud Real Deployment"
echo "========================================"

# Check if GitHub CLI is available
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found. Please install it first:"
    echo "   https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI. Please run:"
    echo "   gh auth login"
    exit 1
fi

echo "✅ GitHub CLI authenticated"

# Trigger the existing optimized-ci-cd workflow
echo "🎯 Triggering optimized-ci-cd workflow..."
gh workflow run optimized-ci-cd.yml --ref main

if [ $? -eq 0 ]; then
    echo "✅ Workflow triggered successfully!"
    echo "🔗 View workflow: https://github.com/MichaelWBrennan/MobileGameSDK/actions"
    echo ""
    echo "📋 The workflow will:"
    echo "   ✅ Use your GitHub repository secrets"
    echo "   ✅ Run real Unity Cloud API calls"
    echo "   ✅ Deploy economy data (currencies, inventory, catalog)"
    echo "   ✅ Deploy Unity Services (Cloud Code, Remote Config)"
    echo "   ✅ Run automation scripts"
    echo "   ✅ Generate deployment reports"
else
    echo "❌ Failed to trigger workflow"
    exit 1
fi