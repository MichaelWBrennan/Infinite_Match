#!/bin/bash

# Unity Cloud Code C# Deployment Script
# This script builds and deploys the C# cloud code functions

set -e

echo "🚀 Unity Cloud Code C# Deployment"
echo "=================================="

# Check if Unity CLI is installed
if ! command -v unity &> /dev/null; then
    echo "❌ Unity CLI not found. Installing..."
    npm install -g @unity/cloud-code-cli
fi

# Check if .NET is installed
if ! command -v dotnet &> /dev/null; then
    echo "❌ .NET not found. Please install .NET 6.0 or later."
    exit 1
fi

# Build the project
echo "🔨 Building C# project..."
dotnet build cloud-code.csproj --configuration Release

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Check if user is logged in
echo "🔐 Checking Unity authentication..."
if ! unity auth status &> /dev/null; then
    echo "🔑 Please login to Unity..."
    unity auth login
fi

# Deploy functions
echo "☁️ Deploying cloud code functions..."
unity cloud-code deploy \
    --project-id 0dd5a03e-7f23-49c4-964e-7919c48c0574 \
    --environment-id 1d8c470b-d8d2-4a72-88f6 \
    --source-dir src \
    --function-config cloud-code-config.json

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "📋 Deployed functions:"
    echo "   - AddCurrency"
    echo "   - SpendCurrency"
    echo "   - AddInventoryItem"
    echo "   - UseInventoryItem"
    echo ""
    echo "🎉 Your C# cloud code functions are now live!"
else
    echo "❌ Deployment failed!"
    exit 1
fi