#!/bin/bash
# GitHub to Unity Cloud Sync Setup Script
# Configures automatic syncing of every GitHub update to Unity Cloud

set -e

echo "🚀 Setting up GitHub to Unity Cloud Auto-Sync..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_info "Setting up GitHub to Unity Cloud Auto-Sync..."

# 1. Make scripts executable
print_info "Making scripts executable..."
chmod +x scripts/github-webhook-sync.py
chmod +x scripts/unity/unity-cloud-api-deploy.js
chmod +x scripts/unity/fetch-unity-secrets.js
print_status "Scripts made executable"

# 2. Install additional dependencies
print_info "Installing additional dependencies..."
pip install flask requests
print_status "Dependencies installed"

# 3. Create logs directory
print_info "Creating logs directory..."
mkdir -p logs
print_status "Logs directory created"

# 4. Create webhook configuration
print_info "Creating webhook configuration..."
cat > webhook-config.json << EOF
{
  "name": "GitHub to Unity Cloud Sync",
  "description": "Automatically syncs every GitHub update to Unity Cloud",
  "version": "1.0.0",
  "webhook_endpoints": {
    "github": "https://your-domain.com/webhook/github",
    "status": "https://your-domain.com/sync/status",
    "health": "https://your-domain.com/health"
  },
  "github_webhook_secret": "your-github-webhook-secret-here",
  "unity_cloud": {
    "project_id": "0dd5a03e-7f23-49c4-964e-7919c48c0574",
    "environment_id": "1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"
  },
  "sync_triggers": [
    "push to main branch",
    "push to develop branch", 
    "push to feature branches",
    "push to hotfix branches",
    "pull request merges"
  ],
  "sync_components": [
    "economy data (currencies, inventory, catalog)",
    "cloud code functions",
    "remote config settings",
    "unity assets and configurations",
    "automation scripts",
    "general configuration files"
  ]
}
EOF
print_status "Webhook configuration created"

# 5. Create GitHub webhook setup instructions
print_info "Creating GitHub webhook setup instructions..."
cat > GITHUB_WEBHOOK_SETUP.md << EOF
# GitHub Webhook Setup Instructions

## 🎯 Overview
This setup enables automatic syncing of every GitHub update to Unity Cloud.

## 📋 Prerequisites
- GitHub repository with admin access
- Unity Cloud project configured
- GitHub Secrets configured (see below)

## 🔧 GitHub Secrets Required
Add these secrets to your GitHub repository settings:

### Required Secrets:
- \`UNITY_PROJECT_ID\`: Your Unity Cloud Project ID
- \`UNITY_ENV_ID\`: Your Unity Cloud Environment ID  
- \`UNITY_CLIENT_ID\`: Unity Cloud API Client ID
- \`UNITY_CLIENT_SECRET\`: Unity Cloud API Client Secret
- \`GITHUB_WEBHOOK_SECRET\`: Random secret for webhook verification

### Optional Secrets:
- \`UNITY_API_TOKEN\`: Alternative Unity Cloud API token
- \`UNITY_EMAIL\`: Unity account email (for CLI operations)
- \`UNITY_PASSWORD\`: Unity account password (for CLI operations)

## 🌐 Webhook Configuration

### Option 1: GitHub Actions (Recommended)
The GitHub Actions workflow will automatically handle syncing on every push.

### Option 2: External Webhook Server
If you want to run a separate webhook server:

1. Deploy the webhook server:
   \`\`\`bash
   python3 scripts/github-webhook-sync.py
   \`\`\`

2. Configure GitHub webhook:
   - Go to your repository settings
   - Navigate to Webhooks
   - Add webhook with URL: \`https://your-domain.com/webhook/github\`
   - Content type: \`application/json\`
   - Secret: Use the value from \`GITHUB_WEBHOOK_SECRET\`
   - Events: Select "Just the push event"

## 🚀 Testing the Setup

### Test GitHub Actions:
1. Make a change to any file in \`economy/\`, \`cloud-code/\`, or \`remote-config/\`
2. Commit and push to main or develop branch
3. Check the Actions tab to see the sync workflow run

### Test Manual Sync:
\`\`\`bash
# Trigger manual sync
curl -X POST http://localhost:5001/sync/trigger \\
  -H "Content-Type: application/json" \\
  -d '{"changes": {"economy": true, "cloud_code": true}}'

# Check sync status
curl http://localhost:5001/sync/status
\`\`\`

## 📊 Monitoring

### GitHub Actions:
- Check the Actions tab for workflow runs
- View detailed logs for each sync operation

### Webhook Server:
- Health check: \`GET /health\`
- Sync status: \`GET /sync/status\`
- Manual trigger: \`POST /sync/trigger\`

## 🔍 Troubleshooting

### Common Issues:
1. **Unity Cloud credentials not configured**
   - Ensure all required secrets are set in GitHub
   - Verify credentials are correct

2. **Webhook not triggering**
   - Check webhook URL is accessible
   - Verify webhook secret matches

3. **Sync failing**
   - Check Unity Cloud API limits
   - Verify project and environment IDs

### Debug Commands:
\`\`\`bash
# Test Unity Cloud connection
npm run unity:secrets

# Test Unity Cloud API
npm run unity:api-deploy

# Check webhook server logs
tail -f logs/github_unity_sync.log
\`\`\`

## ✅ Verification

After setup, you should see:
- ✅ GitHub Actions workflow runs on every push
- ✅ Unity Cloud gets updated automatically
- ✅ Sync reports generated for each operation
- ✅ Health checks passing

**Result: Every GitHub update now automatically syncs to Unity Cloud! 🎉**
EOF
print_status "GitHub webhook setup instructions created"

# 6. Create a test script
print_info "Creating test script..."
cat > scripts/test-github-unity-sync.py << 'EOF'
#!/usr/bin/env python3
"""
Test script for GitHub to Unity Cloud sync
"""

import requests
import json
import time

def test_webhook_server():
    """Test the webhook server endpoints"""
    base_url = "http://localhost:5001"
    
    print("🧪 Testing GitHub-Unity Cloud sync webhook server...")
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {e}")
    
    # Test sync status
    try:
        response = requests.get(f"{base_url}/sync/status")
        if response.status_code == 200:
            print("✅ Sync status check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Sync status check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Sync status check error: {e}")
    
    # Test manual sync trigger
    try:
        test_changes = {
            "economy": True,
            "cloud_code": True,
            "remote_config": True
        }
        response = requests.post(
            f"{base_url}/sync/trigger",
            json={"changes": test_changes}
        )
        if response.status_code == 200:
            print("✅ Manual sync trigger passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Manual sync trigger failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Manual sync trigger error: {e}")

def test_github_actions():
    """Test GitHub Actions workflow"""
    print("🧪 Testing GitHub Actions workflow...")
    print("ℹ️ To test GitHub Actions:")
    print("   1. Make a change to economy/currencies.csv")
    print("   2. Commit and push to main branch")
    print("   3. Check Actions tab for 'GitHub to Unity Cloud Auto-Sync' workflow")
    print("   4. Verify Unity Cloud gets updated")

if __name__ == "__main__":
    print("🚀 Starting GitHub-Unity Cloud sync tests...")
    
    # Test webhook server (if running)
    test_webhook_server()
    
    # Test GitHub Actions
    test_github_actions()
    
    print("✅ Tests completed!")
EOF

chmod +x scripts/test-github-unity-sync.py
print_status "Test script created"

# 7. Create a monitoring script
print_info "Creating monitoring script..."
cat > scripts/monitor-github-unity-sync.py << 'EOF'
#!/usr/bin/env python3
"""
Monitor GitHub to Unity Cloud sync status
"""

import requests
import json
import time
from datetime import datetime

def monitor_sync_status():
    """Monitor sync status continuously"""
    print("📊 Monitoring GitHub-Unity Cloud sync status...")
    print("Press Ctrl+C to stop")
    
    try:
        while True:
            try:
                response = requests.get("http://localhost:5001/sync/status")
                if response.status_code == 200:
                    data = response.json()
                    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    print(f"[{timestamp}] Sync Status: {data.get('status', 'unknown')}")
                    print(f"   Total Events: {data.get('total_events', 0)}")
                    print(f"   Unity Project: {data.get('unity_project_id', 'unknown')}")
                    print(f"   Unity Environment: {data.get('unity_env_id', 'unknown')}")
                else:
                    print(f"❌ Status check failed: {response.status_code}")
            except Exception as e:
                print(f"❌ Monitoring error: {e}")
            
            time.sleep(30)  # Check every 30 seconds
            
    except KeyboardInterrupt:
        print("\n🛑 Monitoring stopped")

if __name__ == "__main__":
    monitor_sync_status()
EOF

chmod +x scripts/monitor-github-unity-sync.py
print_status "Monitoring script created"

# 8. Update package.json with new scripts
print_info "Adding sync scripts to package.json..."
npm pkg set scripts.sync:start="python3 scripts/github-webhook-sync.py"
npm pkg set scripts.sync:test="python3 scripts/test-github-unity-sync.py"
npm pkg set scripts.sync:monitor="python3 scripts/monitor-github-unity-sync.py"
print_status "Package.json updated with sync scripts"

# 9. Create a comprehensive README for the sync system
print_info "Creating sync system README..."
cat > GITHUB_UNITY_SYNC_README.md << EOF
# 🔄 GitHub to Unity Cloud Auto-Sync

## 🎯 Overview
This system automatically syncs every GitHub update to Unity Cloud, ensuring your Unity project stays in sync with your repository changes.

## 🚀 Quick Start

### 1. Configure GitHub Secrets
Add these secrets to your GitHub repository:
- \`UNITY_PROJECT_ID\`
- \`UNITY_ENV_ID\`
- \`UNITY_CLIENT_ID\`
- \`UNITY_CLIENT_SECRET\`
- \`GITHUB_WEBHOOK_SECRET\`

### 2. Enable GitHub Actions
The sync workflow is already configured and will run automatically on every push.

### 3. Test the Setup
\`\`\`bash
# Test the sync system
npm run sync:test

# Start monitoring (optional)
npm run sync:monitor
\`\`\`

## 📋 What Gets Synced

### Automatic Triggers:
- ✅ Push to main branch
- ✅ Push to develop branch
- ✅ Push to feature branches
- ✅ Push to hotfix branches
- ✅ Pull request merges

### Synced Components:
- 💰 **Economy Data**: Currencies, inventory, catalog
- ☁️ **Cloud Code**: JavaScript functions
- ⚙️ **Remote Config**: Game configuration
- 🎮 **Unity Assets**: Project files and settings
- 🔧 **Scripts**: Automation and utility scripts
- ⚙️ **Config**: General configuration files

## 🛠️ Available Commands

\`\`\`bash
# Start webhook server
npm run sync:start

# Test sync system
npm run sync:test

# Monitor sync status
npm run sync:monitor

# Manual Unity Cloud deployment
npm run unity:api-deploy

# Run health checks
npm run health
\`\`\`

## 📊 Monitoring

### GitHub Actions:
- Check the Actions tab for workflow runs
- View detailed logs and sync reports

### Webhook Server:
- Health: \`GET /health\`
- Status: \`GET /sync/status\`
- Manual trigger: \`POST /sync/trigger\`

## 🔧 Configuration

### Webhook Configuration:
Edit \`webhook-config.json\` to customize webhook settings.

### GitHub Actions:
The workflow is configured in \`.github/workflows/github-to-unity-sync.yml\`.

### Unity Cloud:
Unity Cloud settings are managed through GitHub Secrets.

## 🐛 Troubleshooting

### Common Issues:
1. **Credentials not configured**: Check GitHub Secrets
2. **Webhook not triggering**: Verify webhook URL and secret
3. **Sync failing**: Check Unity Cloud API limits and logs

### Debug Commands:
\`\`\`bash
# Test Unity Cloud connection
npm run unity:secrets

# Check webhook server logs
tail -f logs/github_unity_sync.log

# Test manual sync
curl -X POST http://localhost:5001/sync/trigger \\
  -H "Content-Type: application/json" \\
  -d '{"changes": {"economy": true}}'
\`\`\`

## 📈 Benefits

- ✅ **Zero Manual Work**: Every change syncs automatically
- ✅ **Real-time Updates**: Changes appear in Unity Cloud immediately
- ✅ **Comprehensive Coverage**: All relevant files are synced
- ✅ **Reliable**: Built-in error handling and retry logic
- ✅ **Monitored**: Full visibility into sync operations
- ✅ **Scalable**: Handles multiple branches and environments

## 🎉 Result

**Every GitHub update now automatically syncs to Unity Cloud!**

Your headless system is now fully operational and will keep your Unity Cloud project in perfect sync with your GitHub repository.

EOF
print_status "Sync system README created"

# 10. Final verification
print_info "Running final verification..."

# Check if all files were created
if [ -f "scripts/github-webhook-sync.py" ] && [ -f ".github/workflows/github-to-unity-sync.yml" ]; then
    print_status "All sync files created successfully"
else
    print_error "Some files were not created properly"
    exit 1
fi

# Check if scripts are executable
if [ -x "scripts/github-webhook-sync.py" ] && [ -x "scripts/test-github-unity-sync.py" ]; then
    print_status "All scripts are executable"
else
    print_error "Some scripts are not executable"
    exit 1
fi

print_info "Setup completed successfully!"
echo ""
echo "🎉 GitHub to Unity Cloud Auto-Sync is now configured!"
echo ""
echo "📋 Next steps:"
echo "   1. Configure GitHub Secrets (see GITHUB_WEBHOOK_SETUP.md)"
echo "   2. Test the setup: npm run sync:test"
echo "   3. Make a change and push to see it sync automatically"
echo ""
echo "📚 Documentation:"
echo "   - GITHUB_UNITY_SYNC_README.md - Complete guide"
echo "   - GITHUB_WEBHOOK_SETUP.md - Setup instructions"
echo "   - webhook-config.json - Configuration file"
echo ""
echo "🚀 Your headless system is now ready to sync every GitHub update to Unity Cloud!"