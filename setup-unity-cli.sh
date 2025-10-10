#!/bin/bash
# Setup Unity CLI for this repository
# Run this on your local machine

echo "🚀 Setting up Unity CLI for this repository"
echo "==========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this from your project root directory"
    exit 1
fi

echo "📦 Installing Unity CLI as dev dependency..."

# Install Unity CLI as a dev dependency
npm install --save-dev @unity/cloud-code-cli

if [ $? -eq 0 ]; then
    echo "✅ Unity CLI installed successfully!"
else
    echo "❌ Failed to install Unity CLI"
    exit 1
fi

echo "🔧 Adding Unity CLI scripts to package.json..."

# Add Unity CLI scripts to package.json
npm pkg set scripts.unity:auth="unity auth login"
npm pkg set scripts.unity:status="unity auth status"
npm pkg set scripts.unity:deploy:cloud-code="unity cloud-code deploy --project-id 0dd5a03e-7f23-49c4-964e-7919c48c0574 --environment-id 1d8c470b-d8d2-4a72-88f6 --source-dir cloud-code-csharp/src --function-config cloud-code-csharp/cloud-code-config.json"
npm pkg set scripts.unity:deploy:economy="unity economy currencies create --project-id 0dd5a03e-7f23-49c4-964e-7919c48c0574 --environment-id 1d8c470b-d8d2-4a72-88f6 --file economy/currencies.csv && unity economy inventory create --project-id 0dd5a03e-7f23-49c4-964e-7919c48c0574 --environment-id 1d8c470b-d8d2-4a72-88f6 --file economy/inventory.csv && unity economy catalog create --project-id 0dd5a03e-7f23-49c4-964e-7919c48c0574 --environment-id 1d8c470b-d8d2-4a72-88f6 --file economy/catalog.csv"
npm pkg set scripts.unity:deploy:all="npm run unity:deploy:cloud-code && npm run unity:deploy:economy"
npm pkg set scripts.unity:list:functions="unity cloud-code list --project-id 0dd5a03e-7f23-49c4-964e-7919c48c0574 --environment-id 1d8c470b-d8d2-4a72-88f6"
npm pkg set scripts.unity:list:economy="unity economy list --project-id 0dd5a03e-7f23-49c4-964e-7919c48c0574 --environment-id 1d8c470b-d8d2-4a72-88f6"

echo "✅ Unity CLI scripts added to package.json!"

echo ""
echo "🎯 Available Unity CLI commands:"
echo "================================"
echo "npm run unity:auth              # Login to Unity"
echo "npm run unity:status            # Check auth status"
echo "npm run unity:deploy:cloud-code # Deploy C# cloud code functions"
echo "npm run unity:deploy:economy    # Deploy economy data"
echo "npm run unity:deploy:all        # Deploy everything"
echo "npm run unity:list:functions    # List cloud code functions"
echo "npm run unity:list:economy      # List economy data"
echo ""

echo "🔐 Next steps:"
echo "1. Run: npm run unity:auth"
echo "2. Run: npm run unity:deploy:all"
echo ""

echo "✅ Unity CLI setup completed!"
echo "You can now use Unity CLI commands with your repository!"