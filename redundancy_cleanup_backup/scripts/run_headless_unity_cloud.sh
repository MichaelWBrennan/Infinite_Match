#!/bin/bash

# Unity Cloud Headless Deployment Script
# Runs Unity Cloud population without Unity Editor

echo "🚀 Unity Cloud Headless Deployment"
echo "=================================="

# Check if Unity API credentials are available
if [ -n "$UNITY_API_TOKEN" ] || ([ -n "$UNITY_CLIENT_ID" ] && [ -n "$UNITY_CLIENT_SECRET" ]); then
    echo "✅ Unity Cloud API credentials found"
    echo "🌐 Running real Unity Cloud API deployment..."
    python3 scripts/unity_real_cloud_api.py
else
    echo "⚠️ No Unity Cloud API credentials found"
    echo "🔧 Running mock deployment (for testing)..."
    echo ""
    echo "To use real Unity Cloud API, set:"
    echo "  export UNITY_API_TOKEN=your_api_token"
    echo "  OR"
    echo "  export UNITY_CLIENT_ID=your_client_id"
    echo "  export UNITY_CLIENT_SECRET=your_client_secret"
    echo ""
    python3 scripts/unity_headless_cloud_api.py
fi

echo ""
echo "🎉 Headless deployment completed!"
echo "📊 Check the generated report files for details"