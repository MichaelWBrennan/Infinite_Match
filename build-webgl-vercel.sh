#!/bin/bash

# WebGL Build Script for vercel
# Usage: ./build-webgl-vercel.sh

echo "🎮 Building WebGL for vercel..."

# Set build path
BUILD_PATH="/workspace/Build"

# Create build directory
mkdir -p "$BUILD_PATH"

# Copy Unity WebGL build files
if [ -d "/workspace/unity/Builds/WebGL" ]; then
    echo "📦 Copying Unity WebGL build files..."
    cp -r /workspace/unity/Builds/WebGL/* "$BUILD_PATH/"
else
    echo "⚠️ No Unity WebGL build found, using minimal build..."
    /workspace/create-minimal-webgl-build.sh
    cp -r /workspace/Build/* "$BUILD_PATH/"
fi

# Copy platform-specific files
if [ -f "/workspace/webgl/platform-configs/vercel.json" ]; then
    cp "/workspace/webgl/platform-configs/vercel.json" "$BUILD_PATH/PlatformConfigs/"
fi

# Copy platform detection script
cp /workspace/platform-detection.js "$BUILD_PATH/"

# Copy index.html
cp /workspace/index.html "$BUILD_PATH/"

echo "✅ WebGL build for vercel completed!"
echo "📁 Build output: $BUILD_PATH"
ls -la "$BUILD_PATH"
