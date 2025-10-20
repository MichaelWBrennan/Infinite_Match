#!/bin/bash

# Unified WebGL Build Script for All Platforms
# Usage: ./build-webgl-unified.sh

echo "🎮 Building Unified WebGL for All Platforms..."

# Set build path
BUILD_PATH="/workspace/WebGL"

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

# Copy shared files
echo "📋 Copying shared files..."
cp /workspace/webgl-unified.html "$BUILD_PATH/index.html"
cp /workspace/shared-ui.css "$BUILD_PATH/"
cp /workspace/shared-game.js "$BUILD_PATH/"
cp /workspace/platform-detection.js "$BUILD_PATH/"
cp /workspace/platform-selector.js "$BUILD_PATH/"

# Copy platform configurations
echo "🔧 Copying platform configurations..."
mkdir -p "$BUILD_PATH/platforms"
cp /workspace/WebGL/platforms/*.json "$BUILD_PATH/platforms/"

# Copy TemplateData
echo "🎨 Copying TemplateData..."
if [ -d "/workspace/Build/TemplateData" ]; then
    cp -r /workspace/Build/TemplateData "$BUILD_PATH/"
fi

echo "✅ Unified WebGL build completed!"
echo "📁 Build output: $BUILD_PATH"
echo "🌐 All platforms now use the same WebGL directory!"
ls -la "$BUILD_PATH"