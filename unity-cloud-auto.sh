#!/bin/bash
# Unity Cloud Automated Deployment
# One command to rule them all - no manual intervention required

echo "🚀 Unity Cloud Automated Deployment"
echo "==================================="
echo "This script will handle everything automatically:"
echo "  ✅ Authenticate with your Unity account"
echo "  ✅ Deploy Cloud Code functions"
echo "  ✅ Deploy Remote Config keys"
echo "  ✅ Deploy Economy data"
echo "  ✅ Verify all deployments"
echo "  ✅ Generate reports"
echo ""
echo "No manual steps required - everything is automated!"
echo ""

# Check if credentials are available
if [ -z "$UNITY_EMAIL" ] || [ -z "$UNITY_PASSWORD" ]; then
    echo "❌ Unity credentials not found in environment variables"
    echo "Please ensure UNITY_EMAIL and UNITY_PASSWORD are set"
    exit 1
fi

echo "✅ Unity credentials found - proceeding with automated deployment..."
echo ""

# Run the automated Unity Cloud manager
node scripts/unity/automated-unity-cloud-manager.js

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 AUTOMATED DEPLOYMENT COMPLETED SUCCESSFULLY!"
    echo "=============================================="
    echo "All Unity Cloud services have been deployed automatically:"
    echo "  ✅ Cloud Code functions deployed"
    echo "  ✅ Remote Config keys published"
    echo "  ✅ Economy data deployed"
    echo "  ✅ All services verified"
    echo ""
    echo "Your Unity project is ready to use all services!"
    echo "No manual intervention was required."
else
    echo ""
    echo "❌ AUTOMATED DEPLOYMENT FAILED"
    echo "============================="
    echo "Some services may not have deployed successfully."
    echo "Check the logs above for details."
    exit 1
fi