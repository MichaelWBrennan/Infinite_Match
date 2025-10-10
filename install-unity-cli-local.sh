#!/bin/bash
# Install Unity CLI locally for this repository
# This creates a local installation that can be used with npx

echo "🚀 Installing Unity CLI locally for this repository"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this from your project root directory"
    exit 1
fi

echo "📦 Installing Unity CLI locally..."

# Install Unity CLI locally (not globally)
npm install @unity/cloud-code-cli

if [ $? -eq 0 ]; then
    echo "✅ Unity CLI installed locally!"
else
    echo "❌ Failed to install Unity CLI"
    exit 1
fi

echo "🔧 Creating Unity CLI wrapper scripts..."

# Create wrapper scripts that use npx
cat > scripts/unity-cli.sh << 'EOF'
#!/bin/bash
# Unity CLI wrapper script
# Uses npx to run the locally installed Unity CLI

npx @unity/cloud-code-cli "$@"
EOF

chmod +x scripts/unity-cli.sh

# Create specific deployment scripts
cat > scripts/deploy-cloud-code.sh << 'EOF'
#!/bin/bash
# Deploy cloud code using local Unity CLI

echo "☁️ Deploying C# Cloud Code functions..."
npx @unity/cloud-code-cli cloud-code deploy \
  --project-id 0dd5a03e-7f23-49c4-964e-7919c48c0574 \
  --environment-id 1d8c470b-d8d2-4a72-88f6 \
  --source-dir cloud-code-csharp/src \
  --function-config cloud-code-csharp/cloud-code-config.json
EOF

chmod +x scripts/deploy-cloud-code.sh

cat > scripts/deploy-economy.sh << 'EOF'
#!/bin/bash
# Deploy economy data using local Unity CLI

echo "💰 Deploying Economy data..."

echo "   Deploying currencies..."
npx @unity/cloud-code-cli economy currencies create \
  --project-id 0dd5a03e-7f23-49c4-964e-7919c48c0574 \
  --environment-id 1d8c470b-d8d2-4a72-88f6 \
  --file economy/currencies.csv

echo "   Deploying inventory..."
npx @unity/cloud-code-cli economy inventory create \
  --project-id 0dd5a03e-7f23-49c4-964e-7919c48c0574 \
  --environment-id 1d8c470b-d8d2-4a72-88f6 \
  --file economy/inventory.csv

echo "   Deploying catalog..."
npx @unity/cloud-code-cli economy catalog create \
  --project-id 0dd5a03e-7f23-49c4-964e-7919c48c0574 \
  --environment-id 1d8c470b-d8d2-4a72-88f6 \
  --file economy/catalog.csv
EOF

chmod +x scripts/deploy-economy.sh

cat > scripts/deploy-all.sh << 'EOF'
#!/bin/bash
# Deploy everything using local Unity CLI

echo "🚀 Deploying everything to Unity Cloud..."

# Deploy cloud code
./scripts/deploy-cloud-code.sh

# Deploy economy
./scripts/deploy-economy.sh

echo "✅ All deployments completed!"
EOF

chmod +x scripts/deploy-all.sh

echo "✅ Unity CLI installed locally!"
echo ""
echo "🎯 Available commands:"
echo "====================="
echo "npx @unity/cloud-code-cli --help           # Unity CLI help"
echo "npx @unity/cloud-code-cli auth login       # Login to Unity"
echo "./scripts/deploy-cloud-code.sh             # Deploy cloud code"
echo "./scripts/deploy-economy.sh                # Deploy economy data"
echo "./scripts/deploy-all.sh                    # Deploy everything"
echo ""
echo "🔐 Next steps:"
echo "1. Run: npx @unity/cloud-code-cli auth login"
echo "2. Run: ./scripts/deploy-all.sh"
echo ""
echo "✅ Local Unity CLI setup completed!"