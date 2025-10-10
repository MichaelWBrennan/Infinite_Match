#!/bin/bash
# Run this on YOUR LOCAL MACHINE to deploy Unity Cloud Code

echo "🚀 Unity Cloud Code Deployment - Local Machine"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "economy/currencies.csv" ]; then
    echo "❌ Please run this from your project root directory"
    echo "   (where economy/ folder exists)"
    exit 1
fi

# Install UGS CLI if not already installed
echo "📦 Checking UGS CLI installation..."
if ! command -v unity &> /dev/null; then
    echo "Installing Unity CLI..."
    npm install -g @unity/cloud-code-cli
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Unity CLI"
        exit 1
    fi
fi

# Login to Unity
echo "🔐 Checking Unity authentication..."
if ! unity auth status &> /dev/null; then
    echo "Please login to Unity..."
    unity auth login
fi

# Project details
PROJECT_ID="0dd5a03e-7f23-49c4-964e-7919c48c0574"
ENV_ID="1d8c470b-d8d2-4a72-88f6"

echo "🎯 Deploying to Unity Cloud..."
echo "   Project ID: $PROJECT_ID"
echo "   Environment ID: $ENV_ID"

# Deploy C# Cloud Code functions
echo ""
echo "☁️ Deploying C# Cloud Code functions..."
if [ -d "cloud-code-csharp" ]; then
    cd cloud-code-csharp
    unity cloud-code deploy \
        --project-id $PROJECT_ID \
        --environment-id $ENV_ID \
        --source-dir src \
        --function-config cloud-code-config.json
    cd ..
    echo "✅ C# Cloud Code deployed"
else
    echo "⚠️ cloud-code-csharp directory not found, skipping..."
fi

# Deploy Economy data
echo ""
echo "💰 Deploying Economy data..."

# Deploy currencies
echo "   Deploying currencies..."
unity economy currencies create \
    --project-id $PROJECT_ID \
    --environment-id $ENV_ID \
    --file economy/currencies.csv

# Deploy inventory
echo "   Deploying inventory..."
unity economy inventory create \
    --project-id $PROJECT_ID \
    --environment-id $ENV_ID \
    --file economy/inventory.csv

# Deploy catalog
echo "   Deploying catalog..."
unity economy catalog create \
    --project-id $PROJECT_ID \
    --environment-id $ENV_ID \
    --file economy/catalog.csv

echo "✅ Economy data deployed"

# Deploy Remote Config
echo ""
echo "⚙️ Deploying Remote Config..."
if [ -f "remote-config/remote-config.json" ]; then
    unity remote-config deploy \
        --project-id $PROJECT_ID \
        --environment-id $ENV_ID \
        --file remote-config/remote-config.json
    echo "✅ Remote Config deployed"
else
    echo "⚠️ remote-config.json not found, skipping..."
fi

# Verify deployment
echo ""
echo "🔍 Verifying deployment..."

echo "☁️ Cloud Code Functions:"
unity cloud-code list \
    --project-id $PROJECT_ID \
    --environment-id $ENV_ID

echo ""
echo "💰 Economy Data:"
unity economy list \
    --project-id $PROJECT_ID \
    --environment-id $ENV_ID

echo ""
echo "⚙️ Remote Config:"
unity remote-config list \
    --project-id $PROJECT_ID \
    --environment-id $ENV_ID

echo ""
echo "🎉 Deployment completed!"
echo "Your Unity Cloud account now has all data deployed via UGS CLI!"