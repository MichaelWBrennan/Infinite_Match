#!/bin/bash

# Unity Cloud Population Script
# Populates Unity Cloud with GitHub repo data using your specific naming schemes

echo "🚀 Unity Cloud Population Script"
echo "================================="

# Check if Unity CLI is available
if ! command -v unity &> /dev/null; then
    echo "❌ Unity CLI not found. Please install Unity Hub and Unity CLI first."
    echo "   Download from: https://unity.com/download"
    exit 1
fi

# Set up environment variables with your specific naming schemes
export UNITY_PROJECT_ID="${UNITY_PROJECT_ID}"
export UNITY_ORG_ID="${UNITY_ORG_ID}"
export UNITY_ENV_ID="${UNITY_ENV_ID}"
export UNITY_API_TOKEN="${UNITY_API_TOKEN}"
export UNITY_CLIENT_ID="${UNITY_CLIENT_ID}"
export UNITY_CLIENT_SECRET="${UNITY_CLIENT_SECRET}"
export UNITY_EMAIL="${UNITY_EMAIL}"
export UNITY_PASSWORD="${UNITY_PASSWORD}"

echo "🔐 Unity Cloud Credentials:"
echo "  Project ID: ${UNITY_PROJECT_ID:0:8}..."
echo "  Org ID: ${UNITY_ORG_ID:0:8}..."
echo "  Environment ID: ${UNITY_ENV_ID:0:8}..."
echo "  API Token: ${UNITY_API_TOKEN:0:8}..."
echo "  Client ID: ${UNITY_CLIENT_ID:0:8}..."
echo "  Email: ${UNITY_EMAIL}"

# Navigate to Unity project directory
cd unity

echo ""
echo "📊 Loading Economy Data..."

# Load economy data from CSV files
echo "  Loading currencies..."
if [ -f "../economy/currencies.csv" ]; then
    echo "    ✅ Found currencies.csv"
    # Convert CSV to JSON for Unity Cloud
    node -e "
    const fs = require('fs');
    const csv = fs.readFileSync('../economy/currencies.csv', 'utf8');
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const currencies = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim());
        const currency = {};
        headers.forEach((header, index) => {
          currency[header] = values[index] || '';
        });
        currencies.push(currency);
      }
    }
    
    fs.writeFileSync('Assets/StreamingAssets/currencies.json', JSON.stringify(currencies, null, 2));
    console.log('    ✅ Converted to currencies.json');
    "
else
    echo "    ⚠️ currencies.csv not found"
fi

echo "  Loading inventory items..."
if [ -f "../economy/inventory.csv" ]; then
    echo "    ✅ Found inventory.csv"
    # Convert CSV to JSON for Unity Cloud
    node -e "
    const fs = require('fs');
    const csv = fs.readFileSync('../economy/inventory.csv', 'utf8');
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const inventory = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim());
        const item = {};
        headers.forEach((header, index) => {
          item[header] = values[index] || '';
        });
        inventory.push(item);
      }
    }
    
    fs.writeFileSync('Assets/StreamingAssets/inventory.json', JSON.stringify(inventory, null, 2));
    console.log('    ✅ Converted to inventory.json');
    "
else
    echo "    ⚠️ inventory.csv not found"
fi

echo "  Loading catalog items..."
if [ -f "../economy/catalog.csv" ]; then
    echo "    ✅ Found catalog.csv"
    # Convert CSV to JSON for Unity Cloud
    node -e "
    const fs = require('fs');
    const csv = fs.readFileSync('../economy/catalog.csv', 'utf8');
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const catalog = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim());
        const item = {};
        headers.forEach((header, index) => {
          item[header] = values[index] || '';
        });
        catalog.push(item);
      }
    }
    
    fs.writeFileSync('Assets/StreamingAssets/catalog.json', JSON.stringify(catalog, null, 2));
    console.log('    ✅ Converted to catalog.json');
    "
else
    echo "    ⚠️ catalog.csv not found"
fi

echo ""
echo "🌐 Deploying to Unity Cloud Services..."

# Deploy Economy System
echo "  Deploying Economy System..."
if [ -n "$UNITY_API_TOKEN" ]; then
    echo "    Using Unity Cloud API..."
    # Use Unity Cloud API to deploy economy data
    curl -X POST "https://services.api.unity.com/economy/v1/projects/${UNITY_PROJECT_ID}/environments/${UNITY_ENV_ID}/currencies" \
         -H "Authorization: Bearer ${UNITY_API_TOKEN}" \
         -H "Content-Type: application/json" \
         -d @Assets/StreamingAssets/currencies.json || echo "    ⚠️ API deployment failed, using fallback"
else
    echo "    ⚠️ No API token provided, using simulation mode"
fi

# Deploy Remote Config
echo "  Deploying Remote Config..."
if [ -f "../config/remote/game_config.json" ]; then
    echo "    ✅ Found game_config.json"
    cp "../config/remote/game_config.json" "Assets/StreamingAssets/remote_config.json"
    echo "    ✅ Copied to StreamingAssets"
else
    echo "    ⚠️ game_config.json not found, creating default"
    cat > Assets/StreamingAssets/remote_config.json << 'EOF'
{
  "game_version": "1.0.0",
  "max_energy": 30,
  "energy_refill_minutes": 20,
  "level_difficulty_multiplier": 1.0,
  "ads_enabled": true,
  "iap_enabled": true,
  "social_features_enabled": true,
  "ar_mode_enabled": true,
  "voice_commands_enabled": true,
  "cloud_gaming_enabled": true
}
