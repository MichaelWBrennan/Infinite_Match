# Unity Cloud Real Deployment Setup & Trigger Guide

## 🎯 **Goal: Use Your GitHub Repository Secrets for Real Unity Cloud Deployment**

Since your Unity Cloud credentials are stored as GitHub repository secrets, we need to trigger a GitHub Actions workflow to use them.

## 📋 **Step 1: Commit and Push the Workflow File**

The workflow file I created needs to be committed to your repository:

```bash
# Add the workflow file
git add .github/workflows/unity-cloud-real-deployment.yml

# Commit the changes
git commit -m "Add Unity Cloud real deployment workflow with GitHub secrets support"

# Push to repository
git push origin main
```

## 🚀 **Step 2: Trigger the Real Deployment**

Once the workflow is pushed, you can trigger it in several ways:

### **Option A: Using GitHub CLI (if authenticated)**
```bash
# Authenticate with GitHub CLI
gh auth login

# Trigger the workflow
gh workflow run unity-cloud-real-deployment.yml --ref main
```

### **Option B: Using the Python Script**
```bash
# Run the trigger script
python3 scripts/trigger_unity_cloud_deployment.py
```

### **Option C: Manual Trigger via GitHub Web Interface**
1. Go to: https://github.com/MichaelWBrennan/MobileGameSDK/actions
2. Find "Unity Cloud Real Deployment" workflow
3. Click "Run workflow"
4. Select "real" deployment type
5. Click "Run workflow"

### **Option D: Automatic Trigger**
The workflow will also run automatically when:
- You push changes to `main` or `develop` branch
- You push changes to economy files or Unity Cloud scripts
- Daily at 2 AM (scheduled)

## 🔍 **Step 3: Monitor the Deployment**

Once triggered, you can monitor the deployment:

1. **GitHub Actions Page**: https://github.com/MichaelWBrennan/MobileGameSDK/actions
2. **Look for**: "Unity Cloud Real Deployment" workflow
3. **Check status**: Running → Success/Failure
4. **View logs**: Click on the workflow run to see detailed logs

## 📊 **What the Real Deployment Will Do**

When the workflow runs with your GitHub secrets, it will:

### **✅ Authentication**
- Use your `UNITY_CLIENT_ID` and `UNITY_CLIENT_SECRET` (or other credentials)
- Authenticate with Unity Cloud API

### **✅ Deploy Economy Data**
- **3 Currencies**: Coins, Gems, Energy
- **13 Inventory Items**: Boosters and Packs
- **20 Virtual Purchases**: Coin packs, Energy packs, Boosters, Packs

### **✅ Deploy Cloud Code**
- **4 Functions**: AddCurrency, SpendCurrency, AddInventoryItem, UseInventoryItem

### **✅ Update Remote Config**
- Game settings, economy settings, feature flags

### **✅ Generate Reports**
- Deployment reports with real results
- Uploaded as GitHub Actions artifacts

## 🎯 **Your GitHub Secrets (Already Set)**

The workflow will use these secrets from your repository:
- `UNITY_PROJECT_ID`
- `UNITY_ENV_ID` 
- `UNITY_API_TOKEN` (if set)
- `UNITY_CLIENT_ID` (if set)
- `UNITY_CLIENT_SECRET` (if set)
- `UNITY_EMAIL` (if set)
- `UNITY_PASSWORD` (if set)

## 🔧 **Troubleshooting**

### **If Workflow Fails:**
1. Check the workflow logs in GitHub Actions
2. Verify your Unity Cloud credentials are correct
3. Ensure your Unity project is properly configured
4. Check that the project ID and environment ID are correct

### **If Workflow Not Found:**
1. Make sure you've pushed the workflow file
2. Check the file is in `.github/workflows/` directory
3. Verify the file is named `unity-cloud-real-deployment.yml`

### **If Authentication Fails:**
1. Check your Unity Cloud API credentials
2. Verify the project ID and environment ID
3. Ensure your Unity account has proper permissions

## 🎉 **Expected Results**

After successful deployment, you should see:
- ✅ **Real currencies** created in your Unity Cloud project
- ✅ **Real inventory items** created in your Unity Cloud project
- ✅ **Real virtual purchases** created in your Unity Cloud project
- ✅ **Real Cloud Code functions** deployed to your Unity Cloud project
- ✅ **Real Remote Config** updated in your Unity Cloud project
- ✅ **Deployment reports** generated and uploaded as artifacts

## 📞 **Need Help?**

If you encounter any issues:
1. Check the GitHub Actions logs for specific error messages
2. Verify your Unity Cloud credentials in the repository secrets
3. Ensure your Unity project is properly set up
4. Contact Unity support if needed

---

**Once you push the workflow file and trigger it, your Unity Cloud dashboard will be populated with real data using your repository secrets! 🚀**