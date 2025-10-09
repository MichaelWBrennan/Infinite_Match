#!/bin/bash
# Unity CLI Deployment Script for GitHub Actions
# Uses Unity CLI to deploy economy data to Unity Cloud Services

set -e

echo "🚀 Starting Unity CLI deployment..."

# Configuration from environment variables
UNITY_PROJECT_ID="${UNITY_PROJECT_ID:-0dd5a03e-7f23-49c4-964e-7919c48c0574}"
UNITY_ENV_ID="${UNITY_ENV_ID:-1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d}"
UNITY_EMAIL="${UNITY_EMAIL:-}"
UNITY_PASSWORD="${UNITY_PASSWORD:-}"

# Check if Unity CLI is installed
if ! command -v unity &> /dev/null; then
    echo "📦 Installing Unity CLI..."
    npm install -g @unity-services/cli@latest
fi

# Authenticate with Unity
if [ -n "$UNITY_EMAIL" ] && [ -n "$UNITY_PASSWORD" ]; then
    echo "🔐 Authenticating with Unity Cloud Services..."
    unity auth login --email "$UNITY_EMAIL" --password "$UNITY_PASSWORD"
    
    # Set project and environment
    unity project set --project-id "$UNITY_PROJECT_ID" --environment-id "$UNITY_ENV_ID"
    
    echo "✅ Authenticated successfully"
else
    echo "⚠️ No Unity credentials provided - using simulation mode"
    echo "   Set UNITY_EMAIL and UNITY_PASSWORD environment variables for real deployment"
fi

# Deploy currencies
echo "💰 Deploying currencies..."
if [ -f "economy/currencies.csv" ]; then
    while IFS=',' read -r id name type initial maximum; do
        if [ "$id" != "id" ]; then
            echo "   Creating currency: $name ($id)"
            if [ -n "$UNITY_EMAIL" ] && [ -n "$UNITY_PASSWORD" ]; then
                unity economy currency create \
                    --id "$id" \
                    --name "$name" \
                    --type "$type" \
                    --initial "$initial" \
                    --maximum "$maximum" || echo "   ⚠️ Failed to create currency: $id"
            else
                echo "   📝 Simulated: $name ($id) - $type, initial: $initial, max: $maximum"
            fi
        fi
    done < economy/currencies.csv
fi

# Deploy inventory items
echo "📦 Deploying inventory items..."
if [ -f "economy/inventory.csv" ]; then
    while IFS=',' read -r id name type tradable stackable; do
        if [ "$id" != "id" ]; then
            echo "   Creating inventory item: $name ($id)"
            if [ -n "$UNITY_EMAIL" ] && [ -n "$UNITY_PASSWORD" ]; then
                unity economy inventory create \
                    --id "$id" \
                    --name "$name" \
                    --type "$type" \
                    --tradable "$tradable" \
                    --stackable "$stackable" || echo "   ⚠️ Failed to create inventory item: $id"
            else
                echo "   📝 Simulated: $name ($id) - $type, tradable: $tradable, stackable: $stackable"
            fi
        fi
    done < economy/inventory.csv
fi

# Deploy catalog items
echo "💳 Deploying catalog items..."
if [ -f "economy/catalog.csv" ]; then
    while IFS=',' read -r id name cost_currency cost_amount rewards; do
        if [ "$id" != "id" ]; then
            echo "   Creating catalog item: $name ($id)"
            if [ -n "$UNITY_EMAIL" ] && [ -n "$UNITY_PASSWORD" ]; then
                unity economy catalog create \
                    --id "$id" \
                    --name "$name" \
                    --cost-currency "$cost_currency" \
                    --cost-amount "$cost_amount" \
                    --rewards "$rewards" || echo "   ⚠️ Failed to create catalog item: $id"
            else
                echo "   📝 Simulated: $name ($id) - $cost_amount $cost_currency -> $rewards"
            fi
        fi
    done < economy/catalog.csv
fi

echo "✅ Unity CLI deployment completed!"