# Unity Cloud Services Credentials Setup

This guide explains how to set up Unity Cloud Services credentials for your headless Unity update system.

## 🔑 Types of Unity Credentials

### 1. Unity Account Credentials (Email/Password)
**What it's for**: Unity Dashboard access, project management, browser automation
**Best for**: Personal projects, dashboard interactions, browser-based automation

### 2. Unity Services API Credentials (Client ID/Secret)
**What it's for**: Direct API access to Unity Cloud Services
**Best for**: Programmatic access, CI/CD pipelines, automated deployments

### 3. Project/Environment IDs
**What it's for**: Targeting specific Unity projects and environments
**Best for**: Multi-project setups, environment-specific deployments

## 🚀 Setup Instructions

### Option 1: Unity Account Credentials (Recommended for Personal Use)

1. **Set Repository Secrets** in your GitHub repository:
   ```
   UNITY_EMAIL=your-unity-email@example.com
   UNITY_PASSWORD=your-unity-password
   UNITY_PROJECT_ID=your-project-id
   UNITY_ENV_ID=your-environment-id
   ```

2. **How to get Project/Environment IDs**:
   - Go to [Unity Dashboard](https://dashboard.unity3d.com)
   - Select your project
   - Go to Services > Economy (or any service)
   - The URLs will show your Project ID and Environment ID

### Option 2: Unity Services API Credentials (For Production)

1. **Create Unity Services API Key**:
   - Go to [Unity Dashboard](https://dashboard.unity3d.com)
   - Select your project
   - Go to Settings > API Keys
   - Create a new API key
   - Note the Client ID and Client Secret

2. **Set Repository Secrets**:
   ```
   UNITY_CLIENT_ID=your-client-id
   UNITY_CLIENT_SECRET=your-client-secret
   UNITY_PROJECT_ID=your-project-id
   UNITY_ENV_ID=your-environment-id
   ```

### Option 3: Both (Maximum Compatibility)

Set all credentials for maximum compatibility:
```
UNITY_EMAIL=your-unity-email@example.com
UNITY_PASSWORD=your-unity-password
UNITY_CLIENT_ID=your-client-id
UNITY_CLIENT_SECRET=your-client-secret
UNITY_PROJECT_ID=your-project-id
UNITY_ENV_ID=your-environment-id
```

## 🔄 How the System Uses Credentials

### Authentication Priority:
1. **API Credentials** (if available) → Direct Unity Cloud Services API
2. **Unity Account** (if available) → Browser automation with Unity Dashboard
3. **Personal License** (fallback) → Local simulation

### What Each Mode Does:

#### API Mode (UNITY_CLIENT_ID + UNITY_CLIENT_SECRET)
- ✅ Direct API calls to Unity Cloud Services
- ✅ Real-time economy data deployment
- ✅ Actual Cloud Code deployment
- ✅ Real Remote Config updates
- ✅ Fastest and most reliable

#### Unity Account Mode (UNITY_EMAIL + UNITY_PASSWORD)
- ✅ Browser automation with Unity Dashboard
- ✅ Real economy data deployment via UI
- ✅ Simulated Cloud Code (ready for Unity project)
- ✅ Simulated Remote Config (ready for Unity project)
- ✅ Good for personal projects

#### Personal License Mode (No credentials)
- ✅ Local simulation of all services
- ✅ Configuration files ready for Unity project
- ✅ Perfect for development and testing
- ✅ No Unity Cloud Services required

## 🧪 Testing Your Setup

### Test with Unity Account Credentials:
```bash
# Set environment variables
export UNITY_EMAIL="your-email@example.com"
export UNITY_PASSWORD="your-password"
export UNITY_PROJECT_ID="your-project-id"
export UNITY_ENV_ID="your-environment-id"

# Test the system
npm run unity:deploy
```

### Test with API Credentials:
```bash
# Set environment variables
export UNITY_CLIENT_ID="your-client-id"
export UNITY_CLIENT_SECRET="your-client-secret"
export UNITY_PROJECT_ID="your-project-id"
export UNITY_ENV_ID="your-environment-id"

# Test the system
npm run unity:deploy
```

## 🔧 GitHub Actions Setup

### 1. Go to your repository settings
### 2. Navigate to Secrets and Variables > Actions
### 3. Add the following secrets:

```
UNITY_EMAIL
UNITY_PASSWORD
UNITY_CLIENT_ID
UNITY_CLIENT_SECRET
UNITY_PROJECT_ID
UNITY_ENV_ID
```

### 4. The CI/CD pipeline will automatically use these credentials

## 🎯 Recommended Setup

### For Personal Projects:
- Use **Unity Account Credentials** (email/password)
- Set `UNITY_EMAIL`, `UNITY_PASSWORD`, `UNITY_PROJECT_ID`, `UNITY_ENV_ID`
- This gives you real Unity Cloud Services access via browser automation

### For Production/Team Projects:
- Use **API Credentials** (client ID/secret)
- Set `UNITY_CLIENT_ID`, `UNITY_CLIENT_SECRET`, `UNITY_PROJECT_ID`, `UNITY_ENV_ID`
- This gives you direct API access for maximum reliability

### For Development/Testing:
- Use **Personal License Mode** (no credentials)
- The system will simulate all services locally
- Perfect for development and testing

## 🆘 Troubleshooting

### Common Issues:

1. **"Personal license mode detected"**
   - Solution: Add Unity credentials to environment variables

2. **"Browser automation failed"**
   - Solution: Install Chrome and ChromeDriver, or use API credentials

3. **"API request failed: 401"**
   - Solution: Check your API credentials are correct

4. **"Project not found"**
   - Solution: Verify your Project ID and Environment ID

### Debug Tips:
- Enable debug mode in the system
- Check the logs for specific error messages
- Verify your credentials are set correctly
- Test with a simple deployment first

## 📞 Support

If you need help with Unity Cloud Services setup:
- [Unity Cloud Services Documentation](https://docs.unity.com/cloud-services/)
- [Unity Dashboard](https://dashboard.unity3d.com)
- [Unity Community Forums](https://forum.unity.com/)

---

**Your headless Unity update system is ready to work with any Unity credentials setup! 🚀**
