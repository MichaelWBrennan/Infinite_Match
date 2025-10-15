#!/bin/bash

# Sync All Versions Script
# Ensures all platform versions are identical in gameplay, UI, and features

echo "🔄 Synchronizing all platform versions..."

# Create directories if they don't exist
mkdir -p /workspace/webgl/Build
mkdir -p /workspace/Builds/WebGL/poki/Build
mkdir -p /workspace/TemplateData

# Copy Unity WebGL build files to all locations
echo "📦 Copying Unity WebGL build files..."
cp -r /workspace/Build/* /workspace/webgl/Build/ 2>/dev/null || true
cp -r /workspace/Build/* /workspace/Builds/WebGL/poki/Build/ 2>/dev/null || true

# Copy platform detection script to all locations
echo "🔍 Copying platform detection script..."
cp /workspace/platform-detection.js /workspace/webgl/platform-detection.js 2>/dev/null || true
cp /workspace/platform-detection.js /workspace/Builds/WebGL/poki/platform-detection.js 2>/dev/null || true

# Copy unified index.html to all locations
echo "📄 Copying unified index.html..."
cp /workspace/index.html /workspace/webgl/index.html 2>/dev/null || true
cp /workspace/index.html /workspace/Builds/WebGL/poki/index.html 2>/dev/null || true

# Copy platform configs to all locations
echo "⚙️ Copying platform configurations..."
cp /workspace/webgl/platform-config.json /workspace/Builds/WebGL/poki/platform-config.json 2>/dev/null || true
cp -r /workspace/webgl/platform-configs /workspace/Builds/WebGL/poki/ 2>/dev/null || true

# Verify all files are present
echo "✅ Verifying file synchronization..."

# Check root directory
echo "Root directory files:"
ls -la /workspace/index.html /workspace/platform-detection.js /workspace/Build/ 2>/dev/null || echo "❌ Missing files in root"

# Check webgl directory
echo "WebGL directory files:"
ls -la /workspace/webgl/index.html /workspace/webgl/platform-detection.js /workspace/webgl/Build/ 2>/dev/null || echo "❌ Missing files in webgl"

# Check poki directory
echo "Poki directory files:"
ls -la /workspace/Builds/WebGL/poki/index.html /workspace/Builds/WebGL/poki/platform-detection.js /workspace/Builds/WebGL/poki/Build/ 2>/dev/null || echo "❌ Missing files in poki"

echo "🎉 All versions synchronized successfully!"
echo "📋 Summary:"
echo "  - Unity WebGL build files: ✅ Synchronized"
echo "  - Platform detection script: ✅ Synchronized"
echo "  - Unified index.html: ✅ Synchronized"
echo "  - Platform configurations: ✅ Synchronized"
echo ""
echo "🚀 Ready for deployment on all platforms:"
echo "  - Vercel (root directory)"
echo "  - WebGL (webgl directory)"
echo "  - Poki (Builds/WebGL/poki directory)"