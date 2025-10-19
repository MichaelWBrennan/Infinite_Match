#!/bin/bash

echo "Unity Ads Setup Script"
echo "====================="
echo

# Check if game executable exists
if [ ! -f "YourGame" ]; then
    echo "Error: YourGame executable not found!"
    echo "Please make sure your game executable is in the same directory as this script."
    exit 1
fi

echo "Setting up Unity Ads..."
echo

# Set environment variables
export UNITY_ADS_GAME_ID=1234567
export UNITY_ADS_GAME_NAME="My Unity Game"
export UNITY_ADS_BUNDLE_ID="com.yourcompany.yourgame"
export UNITY_ADS_TEST_MODE=true
export UNITY_ADS_DEBUG_MODE=true

echo "Environment variables set:"
echo "  UNITY_ADS_GAME_ID=$UNITY_ADS_GAME_ID"
echo "  UNITY_ADS_GAME_NAME=$UNITY_ADS_GAME_NAME"
echo "  UNITY_ADS_BUNDLE_ID=$UNITY_ADS_BUNDLE_ID"
echo "  UNITY_ADS_TEST_MODE=$UNITY_ADS_TEST_MODE"
echo "  UNITY_ADS_DEBUG_MODE=$UNITY_ADS_DEBUG_MODE"
echo

# Run the game with Unity Ads setup
echo "Starting game with Unity Ads setup..."
./YourGame -gameid $UNITY_ADS_GAME_ID -gamename "$UNITY_ADS_GAME_NAME" -bundleid $UNITY_ADS_BUNDLE_ID -testmode -debug -platforms android,ios

echo
echo "Unity Ads setup complete!"
echo "Check the game console for setup status."