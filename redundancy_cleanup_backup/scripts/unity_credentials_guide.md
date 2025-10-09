# Unity Cloud API Credentials Setup Guide

## 🎯 **To Get Real Unity Cloud API Working (Not Mock)**

You need to set up Unity Cloud API credentials. Here are your options:

### **Option 1: Unity Services API Credentials (Recommended)**

1. **Go to Unity Dashboard:**
   - Visit: https://dashboard.unity3d.com
   - Sign in with your Unity account

2. **Navigate to API Keys:**
   - Select your project
   - Go to **Settings** → **API Keys**
   - Click **"Create API Key"**

3. **Create API Key:**
   - Name: "Headless Deployment"
   - Description: "For automated Unity Cloud population"
   - Click **"Create"**

4. **Copy Credentials:**
   - Copy the **Client ID**
   - Copy the **Client Secret**

5. **Set Environment Variables:**
   ```bash
   export UNITY_CLIENT_ID="your_client_id_here"
   export UNITY_CLIENT_SECRET="your_client_secret_here"
   export UNITY_PROJECT_ID="0dd5a03e-7f23-49c4-964e-7919c48c0574"
   export UNITY_ENV_ID="1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"
   ```

6. **Run Real Deployment:**
   ```bash
   python3 scripts/unity_real_cloud_api.py
   ```

### **Option 2: Unity Account Credentials**

1. **Set Environment Variables:**
   ```bash
   export UNITY_EMAIL="your_unity_email@example.com"
   export UNITY_PASSWORD="your_unity_password"
   export UNITY_PROJECT_ID="0dd5a03e-7f23-49c4-964e-7919c48c0574"
   export UNITY_ENV_ID="1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"
   ```

2. **Run Real Deployment:**
   ```bash
   python3 scripts/unity_real_cloud_api.py
   ```

### **Option 3: Direct API Token**

1. **Get API Token:**
   - Use Unity CLI: `unity auth login`
   - Or get token from Unity Dashboard

2. **Set Environment Variable:**
   ```bash
   export UNITY_API_TOKEN="your_api_token_here"
   export UNITY_PROJECT_ID="0dd5a03e-7f23-49c4-964e-7919c48c0574"
   export UNITY_ENV_ID="1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"
   ```

3. **Run Real Deployment:**
   ```bash
   python3 scripts/unity_real_cloud_api.py
   ```

## 🚀 **Quick Setup Commands**

### **For API Credentials:**
```bash
# Set your credentials
export UNITY_CLIENT_ID="your_client_id"
export UNITY_CLIENT_SECRET="your_client_secret"
export UNITY_PROJECT_ID="0dd5a03e-7f23-49c4-964e-7919c48c0574"
export UNITY_ENV_ID="1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"

# Run real deployment
python3 scripts/unity_real_cloud_api.py
```

### **For Account Credentials:**
```bash
# Set your credentials
export UNITY_EMAIL="your_email@example.com"
export UNITY_PASSWORD="your_password"
export UNITY_PROJECT_ID="0dd5a03e-7f23-49c4-964e-7919c48c0574"
export UNITY_ENV_ID="1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"

# Run real deployment
python3 scripts/unity_real_cloud_api.py
```

## 🔍 **Verify Your Setup**

After setting credentials, test them:
```bash
# Test credentials
python3 -c "
import os
print('UNITY_CLIENT_ID:', 'SET' if os.getenv('UNITY_CLIENT_ID') else 'NOT SET')
print('UNITY_CLIENT_SECRET:', 'SET' if os.getenv('UNITY_CLIENT_SECRET') else 'NOT SET')
print('UNITY_EMAIL:', 'SET' if os.getenv('UNITY_EMAIL') else 'NOT SET')
print('UNITY_PASSWORD:', 'SET' if os.getenv('UNITY_PASSWORD') else 'NOT SET')
"
```

## 📊 **What Real Deployment Does**

When you run with real credentials, the script will:
- ✅ **Authenticate** with Unity Cloud API
- ✅ **Create 3 currencies** in your Unity project
- ✅ **Create 13 inventory items** in your Unity project  
- ✅ **Create 20 virtual purchases** in your Unity project
- ✅ **Deploy 4 Cloud Code functions** to your Unity project
- ✅ **Update Remote Config** in your Unity project
- ✅ **Generate deployment report** with real results

## 🎯 **Your Project Details**

- **Project ID:** `0dd5a03e-7f23-49c4-964e-7919c48c0574`
- **Environment ID:** `1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d`
- **Project Name:** Evergreen Puzzler

## ⚠️ **Important Notes**

1. **API Credentials** are the most reliable method
2. **Account Credentials** use browser automation (may be slower)
3. **Mock mode** is only for testing (no real changes)
4. **Real deployment** will make actual changes to your Unity Cloud project

## 🆘 **Need Help?**

If you need help getting your Unity Cloud API credentials:
1. Check the [Unity Cloud Services Documentation](https://docs.unity.com/cloud-services/)
2. Visit the [Unity Dashboard](https://dashboard.unity3d.com)
3. Contact Unity Support if needed

---

**Once you have your credentials set up, run the real deployment script to populate your Unity Cloud dashboard with actual data! 🚀**