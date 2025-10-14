#!/bin/bash

# WebGL Build Script using Docker - No Unity installation required
# Usage: ./build-webgl-docker.sh [platform] [build-path]

set -e

# Default values
PLATFORM=${1:-"poki"}
BUILD_PATH=${2:-"Builds/WebGL"}

# Valid platforms
VALID_PLATFORMS=("poki" "facebook" "snap" "tiktok" "kongregate" "crazygames")

echo "🐳 WebGL Build Script (Docker)"
echo "=============================="
echo "Platform: $PLATFORM"
echo "Build Path: $BUILD_PATH"
echo ""

# Validate platform
if [[ ! " ${VALID_PLATFORMS[@]} " =~ " ${PLATFORM} " ]]; then
    echo "❌ Invalid platform: $PLATFORM"
    echo "Valid platforms: ${VALID_PLATFORMS[*]}"
    exit 1
fi

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

echo "✅ Docker found"

# Create build directory
mkdir -p "$BUILD_PATH"

# Build Docker image if it doesn't exist
if ! docker image inspect unity-webgl-builder &> /dev/null; then
    echo "🔨 Building Docker image (this may take a while)..."
    docker build -f Dockerfile.unity -t unity-webgl-builder .
fi

echo "✅ Docker image ready"

# Run build in Docker container
echo "🚀 Building WebGL for $PLATFORM in Docker..."

docker run --rm \
    -v "$(pwd)/$BUILD_PATH:/workspace/builds/$PLATFORM" \
    -v "$(pwd)/unity:/workspace/unity" \
    unity-webgl-builder \
    /workspace/build-webgl-docker.sh "$PLATFORM"

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo "✅ WebGL build completed successfully!"
    echo "📁 Build output: $BUILD_PATH/$PLATFORM"
    
    # List build contents
    echo ""
    echo "📋 Build contents:"
    ls -la "$BUILD_PATH/$PLATFORM"
    
    # Start local server if Python is available
    if command -v python3 &> /dev/null; then
        echo ""
        echo "🌐 Starting local server..."
        echo "Open http://localhost:8000 in your browser"
        cd "$BUILD_PATH/$PLATFORM" && python3 -m http.server 8000
    fi
else
    echo "❌ WebGL build failed."
    exit 1
fi