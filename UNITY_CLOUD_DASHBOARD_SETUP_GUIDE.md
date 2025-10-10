# Unity Cloud Dashboard Setup Guide

## 🔍 Current Secrets Analysis

Based on testing your secrets, here's what you have configured and what you need to set up:

### ✅ **Secrets Currently Configured**

| Secret | Status | Value | Notes |
|--------|--------|-------|-------|
| `UNITY_PROJECT_ID` | ⚠️ Placeholder | `UNITY_PROJECT_ID` | **NEEDS REAL VALUE** |
| `UNITY_ENV_ID` | ✅ Real | `1d8c470b-d8d2-4a72-88f6` | Valid Environment ID |
| `UNITY_CLIENT_ID` | ✅ Real | `dcaaaf87-ec84-4858-a2ce-6c0d3d675d37` | Valid Client ID |
| `UNITY_CLIENT_SECRET` | ✅ Real | `cYXSmRDM4Vicmv7MuqT-U5pbqLXvTO8l` | Valid Client Secret |
| `UNITY_EMAIL` | ✅ Real | `michaelwilliambrennan@gmail.com` | Valid Email |
| `UNITY_PASSWORD` | ✅ Real | `zf&5AVOf3Oa6YUEEee8@wZIqu$iRJCt3u6b&bDufQY8eyXEDWVG%QC&67f#B1` | Valid Password |
| `UNITY_ORG_ID` | ✅ Real | `2473931369648` | Valid Organization ID |
| `UNITY_API_TOKEN` | ✅ Real | `a4c1d202-e774-4ac4-8387-861b29394f5e` | Valid API Token |
| `GITHUB_TOKEN` | ❌ Missing | Not Set | **NEEDS TO BE ADDED** |

### 🚨 **Critical Issues Found**

1. **`UNITY_PROJECT_ID` is a placeholder** - This is why API calls are failing with 404 errors
2. **`GITHUB_TOKEN` is missing** - Needed for GitHub Actions integration
3. **API authentication failing** - Due to placeholder Project ID

## 🎯 Unity Cloud Dashboard Setup Steps

### Step 1: Get Your Real Unity Project ID

1. **Go to Unity Cloud Dashboard**: https://dashboard.unity3d.com
2. **Sign in** with your credentials: `michaelwilliambrennan@gmail.com`
3. **Navigate to your project** (the one with Environment ID: `1d8c470b-d8d2-4a72-88f6`)
4. **Copy the Project ID** from the URL or project settings
5. **Update your environment variable**:
   ```bash
   export UNITY_PROJECT_ID="your-actual-project-id-here"
   ```

### Step 2: Verify API Key Configuration

1. **Go to Unity Cloud Dashboard** → **Settings** → **API Keys**
2. **Verify your API Key exists**:
   - Client ID: `dcaaaf87-ec84-4858-a2ce-6c0d3d675d37`
   - Client Secret: `cYXSmRDM4Vicmv7MuqT-U5pbqLXvTO8l`
3. **Check permissions** - Ensure it has access to:
   - Economy Service
   - Cloud Code
   - Remote Config
   - Project access

### Step 3: Set Up GitHub Token

1. **Go to GitHub** → **Settings** → **Developer settings** → **Personal access tokens**
2. **Generate new token** with these permissions:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
   - `write:packages` (Upload packages)
3. **Add to your environment**:
   ```bash
   export GITHUB_TOKEN="your-github-token-here"
   ```

### Step 4: Configure GitHub Secrets

1. **Go to your GitHub repository** → **Settings** → **Secrets and variables** → **Actions**
2. **Add these repository secrets**:
   ```
   UNITY_PROJECT_ID=your-actual-project-id
   UNITY_ENV_ID=1d8c470b-d8d2-4a72-88f6
   UNITY_CLIENT_ID=dcaaaf87-ec84-4858-a2ce-6c0d3d675d37
   UNITY_CLIENT_SECRET=cYXSmRDM4Vicmv7MuqT-U5pbqLXvTO8l
   UNITY_EMAIL=michaelwilliambrennan@gmail.com
   UNITY_PASSWORD=zf&5AVOf3Oa6YUEEee8@wZIqu$iRJCt3u6b&bDufQY8eyXEDWVG%QC&67f#B1
   UNITY_ORG_ID=2473931369648
   UNITY_API_TOKEN=a4c1d202-e774-4ac4-8387-861b29394f5e
   GITHUB_TOKEN=your-github-token
   ```

## 🔧 Unity Cloud Services Configuration

### Economy Service Setup

1. **Go to Unity Cloud Dashboard** → **Economy**
2. **Verify your economy configuration**:
   - Currencies: 3 items (coins, gems, energy)
   - Inventory: 13 items (boosters, packs)
   - Catalog: 20 items (purchases)
3. **Check that data matches** your local CSV files

### Cloud Code Setup

1. **Go to Unity Cloud Dashboard** → **Cloud Code**
2. **Verify functions are deployed**:
   - `AddCurrency.js`
   - `AddInventoryItem.js`
   - `SpendCurrency.js`
   - `UseInventoryItem.js`
3. **Check function permissions** and execution settings

### Remote Config Setup

1. **Go to Unity Cloud Dashboard** → **Remote Config**
2. **Verify configuration** matches your `remote-config/game_config.json`
3. **Check environment targeting** (should target your environment ID)

## 🧪 Testing Your Setup

After completing the dashboard setup, run these tests:

### 1. Test Secrets Configuration
```bash
npm run test:cursor-secrets
```

### 2. Test Unity Cloud Connection
```bash
npm run unity:test-connection
```

### 3. Test Headless Operation
```bash
npm run unity:test-headless
```

### 4. Test GitHub Actions
```bash
# Make a small change and push to trigger GitHub Actions
git add .
git commit -m "Test Unity Cloud integration"
git push
```

## 🎯 Expected Results After Setup

Once properly configured, you should see:

### ✅ **Secrets Test**
- All required secrets found
- Cursor API available (if using Cursor)
- No missing secrets

### ✅ **Unity Cloud Connection Test**
- OAuth authentication successful
- API endpoints accessible
- Project access confirmed
- Dashboard ping successful

### ✅ **Headless Test**
- All configuration files found
- Economy data integrity confirmed
- Headless scripts operational
- Simulation capability ready

### ✅ **GitHub Actions**
- Workflow runs successfully
- Unity Cloud deployment works
- No authentication errors

## 🚨 Troubleshooting Common Issues

### Issue 1: "Object could not be found" (404 errors)
**Cause**: Wrong Project ID or insufficient permissions
**Solution**: 
- Verify Project ID is correct
- Check API key permissions
- Ensure project exists and is accessible

### Issue 2: OAuth authentication fails
**Cause**: Invalid Client ID/Secret or expired credentials
**Solution**:
- Regenerate API key in Unity Dashboard
- Update Client ID and Secret
- Check API key permissions

### Issue 3: GitHub Actions fails
**Cause**: Missing GitHub secrets or invalid tokens
**Solution**:
- Add all required secrets to GitHub repository
- Verify GitHub token permissions
- Check workflow configuration

### Issue 4: Economy data not syncing
**Cause**: Mismatch between local CSV and Unity Cloud data
**Solution**:
- Verify CSV file format
- Check economy service configuration
- Run manual sync via GitHub Actions

## 📊 Current Status Summary

| Component | Status | Action Needed |
|-----------|--------|---------------|
| Unity Project ID | ❌ Placeholder | Get real Project ID from dashboard |
| Unity API Credentials | ✅ Valid | No action needed |
| Unity Organization | ✅ Valid | No action needed |
| GitHub Token | ❌ Missing | Generate and add GitHub token |
| GitHub Secrets | ❌ Not configured | Add all secrets to GitHub repository |
| Economy Data | ✅ Valid | No action needed |
| Headless Scripts | ✅ Valid | No action needed |

## 🎉 Next Steps

1. **Get your real Unity Project ID** from the dashboard
2. **Generate a GitHub token** and add it to your environment
3. **Configure GitHub repository secrets** with all your Unity credentials
4. **Test the complete integration** with the provided test commands
5. **Verify GitHub Actions workflow** runs successfully

Once these steps are completed, your Unity Cloud integration will work flawlessly with both API access and headless fallback capabilities!