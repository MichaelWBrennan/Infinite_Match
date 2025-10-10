#!/bin/bash
# Deploy Unity Cloud Code using UGS CLI
# Run this on your local machine where UGS CLI is installed

echo "🚀 Deploying Unity Cloud Code with UGS CLI"
echo "=========================================="

# Check if Unity CLI is installed
if ! command -v unity &> /dev/null; then
    echo "❌ Unity CLI not found. Installing..."
    npm install -g @unity/cloud-code-cli
fi

# Check if user is logged in
echo "🔐 Checking Unity authentication..."
if ! unity auth status &> /dev/null; then
    echo "🔑 Please login to Unity..."
    unity auth login
fi

# Project details
PROJECT_ID="0dd5a03e-7f23-49c4-964e-7919c48c0574"
ENV_ID="1d8c470b-d8d2-4a72-88f6"

echo "📦 Deploying C# Cloud Code functions..."

# Deploy C# cloud code functions
cd cloud-code-csharp
unity cloud-code deploy \
  --project-id $PROJECT_ID \
  --environment-id $ENV_ID \
  --source-dir src \
  --function-config cloud-code-config.json

if [ $? -eq 0 ]; then
    echo "✅ C# Cloud Code functions deployed successfully!"
else
    echo "❌ C# Cloud Code deployment failed!"
    exit 1
fi

cd ..

echo "💰 Deploying Economy data..."

# Deploy currencies
unity economy currencies create \
  --project-id $PROJECT_ID \
  --environment-id $ENV_ID \
  --file economy/currencies.csv

# Deploy inventory
unity economy inventory create \
  --project-id $PROJECT_ID \
  --environment-id $ENV_ID \
  --file economy/inventory.csv

# Deploy catalog
unity economy catalog create \
  --project-id $PROJECT_ID \
  --environment-id $ENV_ID \
  --file economy/catalog.csv

if [ $? -eq 0 ]; then
    echo "✅ Economy data deployed successfully!"
else
    echo "❌ Economy data deployment failed!"
    exit 1
fi

echo "⚙️ Deploying Remote Config..."

# Deploy remote config
unity remote-config deploy \
  --project-id $PROJECT_ID \
  --environment-id $ENV_ID \
  --file remote-config/remote-config.json

if [ $? -eq 0 ]; then
    echo "✅ Remote Config deployed successfully!"
else
    echo "❌ Remote Config deployment failed!"
    exit 1
fi

echo ""
echo "🔍 Verifying deployment..."

# List deployed functions
echo "☁️ Cloud Code Functions:"
unity cloud-code list \
  --project-id $PROJECT_ID \
  --environment-id $ENV_ID

# List economy data
echo ""
echo "💰 Economy Data:"
unity economy list \
  --project-id $PROJECT_ID \
  --environment-id $ENV_ID

# List remote config
echo ""
echo "⚙️ Remote Config:"
unity remote-config list \
  --project-id $PROJECT_ID \
  --environment-id $ENV_ID

echo ""
echo "🎉 Deployment completed successfully!"
echo "Your Unity Cloud account now has all the data deployed via UGS CLI!"