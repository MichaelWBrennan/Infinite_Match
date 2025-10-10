# Unity Cloud Connection Testing Guide

This guide provides comprehensive tools to test your Unity Cloud dashboard connection and verify that your secrets are working properly.

## 🎯 Quick Start

### Option 1: Using NPM Scripts (Recommended)
```bash
# Test Unity Cloud connection
npm run unity:test-connection

# Quick ping test
npm run unity:ping

# Health check
npm run unity:health
```

### Option 2: Direct Script Execution
```bash
# Python version (recommended)
python3 scripts/unity/test-unity-cloud-connection.py

# Shell script wrapper
./scripts/unity/ping-unity-cloud.sh

# Node.js version
node scripts/unity/test-unity-cloud-connection.js
```

## 🔧 What Gets Tested

The connection tester performs the following comprehensive tests:

### 1. **Secrets Configuration** 🔑
- Verifies all required Unity Cloud secrets are configured
- Checks: `UNITY_PROJECT_ID`, `UNITY_ENV_ID`, `UNITY_CLIENT_ID`, `UNITY_CLIENT_SECRET`
- Reports missing or empty secrets

### 2. **Dashboard Connectivity** 📊
- Pings Unity Cloud dashboard (`https://dashboard.unity3d.com`)
- Tests basic internet connectivity to Unity services
- Verifies Unity Cloud services are accessible

### 3. **OAuth Authentication** 🔐
- Tests Unity Cloud OAuth2 authentication flow
- Validates client credentials
- Retrieves access token for API operations
- Reports authentication success/failure

### 4. **API Endpoints** 🌐
Tests all major Unity Cloud API endpoints:
- **Economy Currencies**: `/economy/v1/projects/{projectId}/environments/{envId}/currencies`
- **Economy Inventory**: `/economy/v1/projects/{projectId}/environments/{envId}/inventory-items`
- **Economy Catalog**: `/economy/v1/projects/{projectId}/environments/{envId}/catalog-items`
- **Cloud Code Functions**: `/cloudcode/v1/projects/{projectId}/environments/{envId}/functions`
- **Remote Config**: `/remote-config/v1/projects/{projectId}/environments/{envId}/configs`

### 5. **Project Access** 🏗️
- Verifies project-level access permissions
- Tests project information retrieval
- Confirms environment access rights

## 📊 Test Results

The tester provides detailed results including:

- **Overall Status**: ✅ Passed, ⚠️ Partial, ❌ Failed
- **Individual Test Results**: Detailed status for each test
- **Error Messages**: Specific error details for failed tests
- **Recommendations**: Actionable steps to fix issues
- **Performance Metrics**: Response times and data counts

## 🔧 Configuration

### Required Secrets

Set these environment variables or configure them in Cursor secrets:

```bash
# Required Unity Cloud secrets
export UNITY_PROJECT_ID="your-project-id"
export UNITY_ENV_ID="your-environment-id"
export UNITY_CLIENT_ID="your-client-id"
export UNITY_CLIENT_SECRET="your-client-secret"
```

### Current Configuration

Your repository is configured with:
- **Project ID**: `0dd5a03e-7f23-49c4-964e-7919c48c0574`
- **Environment ID**: `1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d`

## 📁 Output Files

Test results are automatically saved to:
- **Location**: `monitoring/reports/`
- **Format**: JSON with timestamp
- **Filename**: `unity_cloud_connection_test_YYYYMMDD_HHMMSS.json`

## 🚨 Troubleshooting

### Common Issues and Solutions

#### 1. **Missing Secrets Error**
```
❌ Missing required secrets: UNITY_CLIENT_ID, UNITY_CLIENT_SECRET
```
**Solution**: Configure Unity Cloud API credentials in Cursor settings or environment variables.

#### 2. **Authentication Failed**
```
❌ OAuth authentication failed: HTTP 401
```
**Solution**: 
- Verify `UNITY_CLIENT_ID` and `UNITY_CLIENT_SECRET` are correct
- Check credentials in Unity Dashboard > Settings > API Keys
- Ensure credentials have proper permissions

#### 3. **API Endpoints Failed**
```
❌ API Endpoints: FAILED
```
**Solution**:
- Verify `UNITY_PROJECT_ID` and `UNITY_ENV_ID` are correct
- Check project permissions in Unity Dashboard
- Ensure your account has access to the project

#### 4. **Dashboard Ping Failed**
```
❌ Unity Cloud dashboard ping failed
```
**Solution**:
- Check internet connection
- Verify Unity Cloud services are operational
- Check firewall/proxy settings

## 🔄 Integration with CI/CD

The connection tester integrates with your existing CI/CD pipeline:

### GitHub Actions
```yaml
- name: Test Unity Cloud Connection
  run: npm run unity:test-connection
  env:
    UNITY_PROJECT_ID: ${{ secrets.UNITY_PROJECT_ID }}
    UNITY_ENV_ID: ${{ secrets.UNITY_ENV_ID }}
    UNITY_CLIENT_ID: ${{ secrets.UNITY_CLIENT_ID }}
    UNITY_CLIENT_SECRET: ${{ secrets.UNITY_CLIENT_SECRET }}
```

### Health Monitoring
The tester can be run as part of your health monitoring:
```bash
# Add to your health check routine
npm run health && npm run unity:test-connection
```

## 📈 Monitoring and Alerts

### Automated Monitoring
Set up automated monitoring by running the tester periodically:

```bash
# Add to crontab for hourly checks
0 * * * * cd /path/to/your/repo && npm run unity:test-connection
```

### Alert Integration
The tester returns appropriate exit codes for integration with monitoring systems:
- **0**: All tests passed
- **1**: Partial success (some tests failed)
- **2**: All tests failed
- **3**: Test execution error

## 🛠️ Advanced Usage

### Custom Configuration
You can customize the tester by modifying the configuration in the script:

```python
# Customize test endpoints
endpoints = [
    {
        'name': 'Custom Endpoint',
        'url': '/your/custom/endpoint',
        'method': 'GET'
    }
]
```

### Integration with Existing Health Checks
The tester integrates with your existing health check system:

```python
# In your health check script
from scripts.unity.test_unity_cloud_connection import UnityCloudConnectionTester

def check_unity_cloud():
    tester = UnityCloudConnectionTester()
    results = tester.run_all_tests()
    return results['overall_status'] == 'passed'
```

## 📚 Related Documentation

- [Unity Cloud Services Documentation](https://docs.unity.com/cloud-services/)
- [Unity Cloud API Reference](https://services.api.unity.com/)
- [Cursor Secrets Setup Guide](./cursor-secrets-setup.json)
- [GitHub Actions Unity Cloud Deploy](./.github/workflows/unity-cloud-api-deploy.yml)

## 🎯 Summary

This Unity Cloud connection testing solution provides:

✅ **Comprehensive Testing**: All major Unity Cloud services and endpoints  
✅ **Easy Execution**: Multiple ways to run tests (NPM, Python, Shell)  
✅ **Detailed Reporting**: Clear status reports and actionable recommendations  
✅ **CI/CD Integration**: Works with your existing automation pipeline  
✅ **Monitoring Ready**: Appropriate exit codes for monitoring systems  
✅ **Troubleshooting**: Clear error messages and solutions  

Use this tool to ensure your Unity Cloud integration is working properly and your secrets are configured correctly!