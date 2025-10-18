#!/bin/bash

# WebGL Build Script - Run without Unity Editor
# Usage: ./build-webgl.sh [platform] [build-path] [development]

set -e

# Default values
PLATFORM=${1:-"poki"}
BUILD_PATH=${2:-"Builds/WebGL"}
DEVELOPMENT=${3:-"false"}

# Valid platforms
VALID_PLATFORMS=("poki" "facebook" "snap" "tiktok" "kongregate" "crazygames")

echo "🚀 WebGL Build Script"
echo "====================="
echo "Platform: $PLATFORM"
echo "Build Path: $BUILD_PATH"
echo "Development: $DEVELOPMENT"
echo ""

# Validate platform
if [[ ! " ${VALID_PLATFORMS[@]} " =~ " ${PLATFORM} " ]]; then
    echo "❌ Invalid platform: $PLATFORM"
    echo "Valid platforms: ${VALID_PLATFORMS[*]}"
    exit 1
fi

# Check if Unity is available
UNITY_PATH=""
if command -v unity &> /dev/null; then
    UNITY_PATH="unity"
elif command -v Unity &> /dev/null; then
    UNITY_PATH="Unity"
elif [ -f "/Applications/Unity/Hub/Editor/*/Unity.app/Contents/MacOS/Unity" ]; then
    UNITY_PATH="/Applications/Unity/Hub/Editor/*/Unity.app/Contents/MacOS/Unity"
elif [ -f "/opt/Unity/Editor/Unity" ]; then
    UNITY_PATH="/opt/Unity/Editor/Unity"
elif [ -f "C:/Program Files/Unity/Hub/Editor/*/Editor/Unity.exe" ]; then
    UNITY_PATH="C:/Program Files/Unity/Hub/Editor/*/Editor/Unity.exe"
else
    echo "❌ Unity not found. Please install Unity or add it to PATH."
    echo "Alternative: Use the Docker method (see build-webgl-docker.sh)"
    exit 1
fi

echo "✅ Found Unity: $UNITY_PATH"

# Create build directory
mkdir -p "$BUILD_PATH"

# Build WebGL using Unity command line
echo "🔨 Building WebGL for $PLATFORM..."

$UNITY_PATH \
    -batchmode \
    -quit \
    -projectPath "$(pwd)/unity" \
    -executeMethod InfiniteMatch.Editor.HeadlessWebGLBuilder.BuildWebGLHeadless \
    -platform "$PLATFORM" \
    -buildPath "$BUILD_PATH" \
    -development "$DEVELOPMENT" \
    -logFile "build-log.txt"

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo "✅ WebGL build completed successfully!"
    echo "📁 Build output: $BUILD_PATH"
    echo "🌐 Open index.html in a web browser to test"
    
    # List build contents
    echo ""
    echo "📋 Build contents:"
    ls -la "$BUILD_PATH"
    
    # Start local server if Python is available
    if command -v python3 &> /dev/null; then
        echo ""
        echo "🌐 Starting local server..."
        echo "Open http://localhost:8000 in your browser"
        cd "$BUILD_PATH" && python3 -m http.server 8000
    fi
else
    echo "❌ WebGL build failed. Check build-log.txt for details."
    exit 1
fi