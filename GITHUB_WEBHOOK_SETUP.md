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
- `UNITY_PROJECT_ID`: Your Unity Cloud Project ID (get from Unity Dashboard)
- `UNITY_ENV_ID`: Your Unity Cloud Environment ID (get from Unity Dashboard)
- `UNITY_CLIENT_ID`: Unity Cloud API Client ID (create in Unity Dashboard)
- `UNITY_CLIENT_SECRET`: Unity Cloud API Client Secret (create in Unity Dashboard)
- `GITHUB_WEBHOOK_SECRET`: Random secret for webhook verification

### Optional Secrets:
- `UNITY_API_TOKEN`: Alternative Unity Cloud API token
- `UNITY_EMAIL`: Unity account email (for CLI operations)
- `UNITY_PASSWORD`: Unity account password (for CLI operations)

## 🌐 Webhook Configuration

### Option 1: GitHub Actions (Recommended)
The GitHub Actions workflow will automatically handle syncing on every push.

### Option 2: External Webhook Server
If you want to run a separate webhook server:

1. Deploy the webhook server:
   ```bash
   python3 scripts/github-webhook-sync.py
   ```

2. Configure GitHub webhook:
   - Go to your repository settings
   - Navigate to Webhooks
   - Add webhook with URL: `https://your-domain.com/webhook/github`
   - Content type: `application/json`
   - Secret: Use the value from `GITHUB_WEBHOOK_SECRET`
   - Events: Select "Just the push event"

## 🚀 Testing the Setup

### Test GitHub Actions:
1. Make a change to any file in `economy/`, `cloud-code/`, or `remote-config/`
2. Commit and push to main or develop branch
3. Check the Actions tab to see the sync workflow run

### Test Manual Sync:
```bash
# Trigger manual sync
curl -X POST http://localhost:5001/sync/trigger \
  -H "Content-Type: application/json" \
  -d '{"changes": {"economy": true, "cloud_code": true}}'

# Check sync status
curl http://localhost:5001/sync/status
```

## 📊 Monitoring

### GitHub Actions:
- Check the Actions tab for workflow runs
- View detailed logs for each sync operation

### Webhook Server:
- Health check: `GET /health`
- Sync status: `GET /sync/status`
- Manual trigger: `POST /sync/trigger`

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
```bash
# Test Unity Cloud connection
npm run unity:secrets

# Test Unity Cloud API
npm run unity:api-deploy

# Check webhook server logs
tail -f logs/github_unity_sync.log
```

## ✅ Verification

After setup, you should see:
- ✅ GitHub Actions workflow runs on every push
- ✅ Unity Cloud gets updated automatically
- ✅ Sync reports generated for each operation
- ✅ Health checks passing

**Result: Every GitHub update now automatically syncs to Unity Cloud! 🎉**
