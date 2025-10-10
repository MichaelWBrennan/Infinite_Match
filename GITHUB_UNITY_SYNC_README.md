# 🔄 GitHub to Unity Cloud Auto-Sync

## 🎯 Overview
This system automatically syncs every GitHub update to Unity Cloud, ensuring your Unity project stays in sync with your repository changes.

## 🚀 Quick Start

### 1. Configure GitHub Secrets
Add these secrets to your GitHub repository:
- `UNITY_PROJECT_ID`
- `UNITY_ENV_ID`
- `UNITY_CLIENT_ID`
- `UNITY_CLIENT_SECRET`
- `GITHUB_WEBHOOK_SECRET`

### 2. Enable GitHub Actions
The sync workflow is already configured and will run automatically on every push.

### 3. Test the Setup
```bash
# Test the sync system
npm run sync:test

# Start monitoring (optional)
npm run sync:monitor
```

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

```bash
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
```

## 📊 Monitoring

### GitHub Actions:
- Check the Actions tab for workflow runs
- View detailed logs and sync reports

### Webhook Server:
- Health: `GET /health`
- Status: `GET /sync/status`
- Manual trigger: `POST /sync/trigger`

## 🔧 Configuration

### Webhook Configuration:
Edit `webhook-config.json` to customize webhook settings.

### GitHub Actions:
The workflow is configured in `.github/workflows/github-to-unity-sync.yml`.

### Unity Cloud:
Unity Cloud settings are managed through GitHub Secrets.

## 🐛 Troubleshooting

### Common Issues:
1. **Credentials not configured**: Check GitHub Secrets
2. **Webhook not triggering**: Verify webhook URL and secret
3. **Sync failing**: Check Unity Cloud API limits and logs

### Debug Commands:
```bash
# Test Unity Cloud connection
npm run unity:secrets

# Check webhook server logs
tail -f logs/github_unity_sync.log

# Test manual sync
curl -X POST http://localhost:5001/sync/trigger \
  -H "Content-Type: application/json" \
  -d '{"changes": {"economy": true}}'
```

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

