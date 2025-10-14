#!/bin/bash

# Poki WebGL Build Script
# This script helps build and deploy Unity WebGL builds for Poki platform

echo "🎮 Poki WebGL Build Script"
echo "=========================="

# Check if Unity is available
if ! command -v unity &> /dev/null; then
    echo "❌ Unity command not found. Please ensure Unity is in your PATH."
    echo "   You can also run this script from Unity Editor using the Poki WebGL Build Script."
    exit 1
fi

# Set build parameters
BUILD_PATH="webgl"
UNITY_PROJECT_PATH="unity"
BUILD_TARGET="WebGL"

echo "📁 Build Path: $BUILD_PATH"
echo "🎯 Build Target: $BUILD_TARGET"
echo ""

# Create build directory if it doesn't exist
if [ ! -d "$BUILD_PATH" ]; then
    echo "📁 Creating build directory: $BUILD_PATH"
    mkdir -p "$BUILD_PATH"
fi

# Check if Unity project exists
if [ ! -d "$UNITY_PROJECT_PATH" ]; then
    echo "❌ Unity project not found at: $UNITY_PROJECT_PATH"
    exit 1
fi

echo "🔧 Building Poki WebGL..."
echo ""

# Build Unity WebGL for Poki
unity -batchmode -quit -projectPath "$UNITY_PROJECT_PATH" -buildTarget "$BUILD_TARGET" -buildPath "$BUILD_PATH" -executeMethod PokiWebGLBuildScript.BuildPokiWebGL

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Poki WebGL build completed successfully!"
    echo ""
    
    # List build contents
    echo "📁 Build contents:"
    ls -la "$BUILD_PATH"
    echo ""
    
    # Check for required files
    echo "🔍 Checking for required files..."
    
    if [ -f "$BUILD_PATH/index.html" ]; then
        echo "✅ index.html found"
    else
        echo "❌ index.html not found"
    fi
    
    if [ -d "$BUILD_PATH/Build" ]; then
        echo "✅ Build directory found"
    else
        echo "❌ Build directory not found"
    fi
    
    if [ -d "$BUILD_PATH/TemplateData" ]; then
        echo "✅ TemplateData directory found"
    else
        echo "❌ TemplateData directory not found"
    fi
    
    echo ""
    echo "🚀 Ready for Vercel deployment!"
    echo ""
    echo "📋 Next steps:"
    echo "1. cd $BUILD_PATH"
    echo "2. vercel --prod"
    echo "   OR"
    echo "2. Upload the $BUILD_PATH folder to Vercel Dashboard"
    echo ""
    echo "🎮 Poki WebGL build ready!"
    
else
    echo "❌ Poki WebGL build failed!"
    echo "Please check Unity console for errors."
    exit 1
fi