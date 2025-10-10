#!/bin/bash
"""
Unity Cloud Ping Script
Quick script to test Unity Cloud connection and verify secrets
"""

echo "🎮 Unity Cloud Connection Tester"
echo "================================="
echo ""

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

# Check if requests module is available
if ! python3 -c "import requests" &> /dev/null; then
    echo "⚠️  Installing required Python packages..."
    pip3 install requests
fi

# Run the connection test
echo "🚀 Starting Unity Cloud connection test..."
echo ""

python3 "$(dirname "$0")/test-unity-cloud-connection.py"

# Capture exit code
exit_code=$?

echo ""
echo "================================="
if [ $exit_code -eq 0 ]; then
    echo "✅ Unity Cloud connection test completed successfully!"
elif [ $exit_code -eq 1 ]; then
    echo "⚠️  Unity Cloud connection test completed with warnings"
else
    echo "❌ Unity Cloud connection test failed"
fi
echo "================================="

exit $exit_code