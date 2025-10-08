#!/bin/bash
# Unity CLI 100% Automation Script

set -e

echo "🚀 Starting 100% Unity Cloud Automation..."

# Install Unity CLI if not present
if ! command -v unity &> /dev/null; then
    echo "Installing Unity CLI..."
    npm install -g @unity-services/cli@latest
fi

# Login to Unity CLI
echo "🔐 Logging into Unity CLI..."
unity login --client-id $UNITY_CLIENT_ID --client-secret $UNITY_CLIENT_SECRET

# Verify project access
echo "✅ Verifying project access..."
unity projects get $UNITY_PROJECT_ID

# Create backup directory
mkdir -p backups/$(date +%Y%m%d_%H%M%S)

# Deploy Economy Configuration
echo "💰 Deploying Economy Configuration..."

# Deploy currencies
if [ -f "economy/currencies.csv" ]; then
    echo "Deploying currencies..."
    unity economy currencies import economy/currencies.csv --project-id $UNITY_PROJECT_ID --environment-id $UNITY_ENV_ID
fi

# Deploy inventory items
if [ -f "economy/inventory.csv" ]; then
    echo "Deploying inventory items..."
    unity economy inventory-items import economy/inventory.csv --project-id $UNITY_PROJECT_ID --environment-id $UNITY_ENV_ID
fi

# Deploy catalog items
if [ -f "economy/catalog.csv" ]; then
    echo "Deploying catalog items..."
    unity economy catalog-items import economy/catalog.csv --project-id $UNITY_PROJECT_ID --environment-id $UNITY_ENV_ID
fi

# Deploy Remote Config
echo "⚙️ Deploying Remote Config..."
if [ -f "remote-config/game_config.json" ]; then
    unity remote-config import remote-config/game_config.json --project-id $UNITY_PROJECT_ID --environment-id $UNITY_ENV_ID
fi

# Deploy Cloud Code
echo "☁️ Deploying Cloud Code..."
for file in cloud-code/*.js; do
    if [ -f "$file" ]; then
        echo "Deploying $file..."
        unity cloud-code functions deploy "$file" --project-id $UNITY_PROJECT_ID --environment-id $UNITY_ENV_ID
    fi
done

# Verify deployment
echo "✅ Verifying deployment..."
unity economy currencies list --project-id $UNITY_PROJECT_ID --environment-id $UNITY_ENV_ID --format table
unity economy inventory-items list --project-id $UNITY_PROJECT_ID --environment-id $UNITY_ENV_ID --format table
unity economy catalog-items list --project-id $UNITY_PROJECT_ID --environment-id $UNITY_ENV_ID --format table

echo "🎉 100% Automation completed successfully!"
