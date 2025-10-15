#!/bin/bash

# Master WebGL Build Script
# Builds WebGL for all platforms

echo "🎮 Building WebGL for all platforms..."

# Build for each platform
./build-webgl-vercel.sh
./build-webgl-webgl.sh  
./build-webgl-poki.sh

# Synchronize all versions
./sync-all-versions.sh

echo "✅ All WebGL builds completed!"
