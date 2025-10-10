# Unity Cloud Code Setup Guide

## 🎯 **Complete Cloud Code Setup for Your Project**

This guide will help you set up Cloud Code in your Unity Cloud account and deploy your existing functions.

## 📋 **Prerequisites**

- Unity Cloud account with project access
- Project ID: `0dd5a03e-7f23-49c4-964e-7919c48c0574`
- Environment ID: `1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d`
- Organization ID: `2473931369648`

## 🚀 **Step 1: Enable Cloud Code in Unity Cloud Dashboard**

### **1.1 Access Unity Cloud Dashboard**
1. Go to [Unity Cloud Dashboard](https://cloud.unity.com)
2. Log in with your account: `michaelwilliambrennan@gmail.com`
3. Navigate to your project: `0dd5a03e-7f23-49c4-964e-7919c48c0574`

### **1.2 Enable Cloud Code Service**
1. In your project dashboard, look for **"Cloud Code"** in the services list
2. Click **"Enable"** or **"Set up"** next to Cloud Code
3. Follow the setup wizard to enable the service
4. Note down any API keys or configuration details provided

### **1.3 Verify Service Status**
- Cloud Code should show as **"Active"** or **"Enabled"** in your project dashboard
- You should see a Cloud Code section with options to manage functions

## 🔧 **Step 2: Prepare Your Cloud Code Functions**

### **2.1 Your Existing Functions**
You already have these Cloud Code functions ready:
- `AddCurrency.js` - Add currency to player
- `AddInventoryItem.js` - Add items to player inventory
- `SpendCurrency.js` - Deduct currency from player
- `UseInventoryItem.js` - Consume inventory items
- `validationUtils.js` - Validation utilities

### **2.2 Function Structure**
Each function follows this pattern:
```javascript
// Function name: AddCurrency
// Description: Add currency to player account
// Parameters: playerId, currencyId, amount
// Returns: success status and new balance
```

## 📤 **Step 3: Deploy Cloud Code Functions**

### **3.1 Manual Deployment via Dashboard**
1. Go to your project's Cloud Code section
2. Click **"Create Function"** or **"Upload Function"**
3. For each function:
   - Upload the `.js` file
   - Set the function name
   - Configure parameters
   - Set up triggers (if needed)

### **3.2 Automated Deployment (Recommended)**
Use the deployment script to automatically deploy all functions:

```bash
npm run unity:deploy
```

## 🧪 **Step 4: Test Cloud Code Functions**

### **4.1 Test Individual Functions**
```bash
# Test Cloud Code deployment
npm run unity:test-cloud-code

# Test specific function
npm run unity:test-function -- --function=AddCurrency
```

### **4.2 Verify Function Status**
1. Go to Cloud Code dashboard
2. Check that all functions show as **"Deployed"** or **"Active"**
3. Test each function with sample data

## 🔍 **Step 5: Monitor and Debug**

### **5.1 Cloud Code Logs**
- Access logs in the Unity Cloud dashboard
- Monitor function execution and errors
- Set up alerts for failed executions

### **5.2 Function Performance**
- Monitor execution times
- Track success/failure rates
- Optimize functions based on usage patterns

## 📊 **Step 6: Integration with Your Game**

### **6.1 Unity Client Integration**
Your Unity project should already be configured to call these functions:
- Economy functions for currency management
- Inventory functions for item management
- Validation functions for data integrity

### **6.2 API Endpoints**
Once deployed, your functions will be available at:
- `https://services.api.unity.com/cloud-code/v1/projects/{projectId}/functions/{functionName}`

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Issue 1: Cloud Code Service Not Available**
- **Solution**: Enable Cloud Code in your Unity Cloud dashboard
- **Check**: Verify your Unity plan includes Cloud Code

#### **Issue 2: Functions Not Deploying**
- **Solution**: Check function syntax and parameters
- **Check**: Verify API credentials and permissions

#### **Issue 3: Functions Not Executing**
- **Solution**: Check function triggers and parameters
- **Check**: Verify Unity client configuration

#### **Issue 4: Authentication Errors**
- **Solution**: Update API credentials in your project
- **Check**: Verify project ID and environment ID

### **Debug Steps**
1. Check Unity Cloud dashboard for service status
2. Verify function deployment status
3. Test functions with sample data
4. Check Unity client logs for errors
5. Verify API endpoints are accessible

## 📈 **Next Steps After Setup**

### **1. Enable Other Services**
- Economy Service
- Remote Config Service
- Analytics Service

### **2. Deploy Complete System**
```bash
npm run unity:deploy
```

### **3. Test Full Integration**
```bash
npm run unity:test-headless
```

### **4. Monitor Performance**
- Set up monitoring and alerts
- Track function usage and performance
- Optimize based on real usage data

## 🎯 **Success Criteria**

Your Cloud Code setup is successful when:
- ✅ Cloud Code service is enabled in Unity Cloud dashboard
- ✅ All 5 functions are deployed and active
- ✅ Functions can be called from Unity client
- ✅ Functions return expected results
- ✅ No authentication or permission errors

## 📞 **Support Resources**

- [Unity Cloud Code Documentation](https://docs.unity.com/cloud-code/)
- [Unity Cloud Dashboard](https://cloud.unity.com)
- [Unity Support](https://support.unity.com)

---

**Ready to set up Cloud Code? Start with Step 1 and follow the guide!**