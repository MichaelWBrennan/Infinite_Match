#!/bin/bash

# Mobile WebGL Test Script
# Tests mobile WebGL functionality and starts local server
# Usage: ./test-mobile-webgl.sh [build-path] [test-type]

set -e

BUILD_PATH=${1:-"Build"}
TEST_TYPE=${2:-"local"}

echo "📱 Mobile WebGL Test Script"
echo "=========================="
echo "Build Path: $BUILD_PATH"
echo "Test Type: $TEST_TYPE"
echo ""

# Check if build directory exists
if [ ! -d "$BUILD_PATH" ]; then
    echo "❌ Build directory not found: $BUILD_PATH"
    echo "Please build the WebGL project first using build-webgl-mobile.sh"
    exit 1
fi

# Check if mobile.html exists
if [ ! -f "$BUILD_PATH/mobile.html" ]; then
    echo "📱 Creating mobile.html from template..."
    cp mobile.html "$BUILD_PATH/"
fi

# Check if Unity build files exist
REQUIRED_FILES=("WebGL.loader.js" "WebGL.data" "WebGL.framework.js" "WebGL.wasm")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$BUILD_PATH/$file" ]; then
        echo "❌ Required Unity build file not found: $file"
        echo "Please build the Unity WebGL project first"
        exit 1
    fi
done

echo "✅ All required files found"

# Test mobile features
if [ "$TEST_TYPE" = "features" ]; then
    echo "🧪 Testing mobile features..."
    
    # Check if mobile.html is valid
    if command -v node &> /dev/null; then
        echo "📄 Validating mobile.html..."
        node -e "
            const fs = require('fs');
            const html = fs.readFileSync('$BUILD_PATH/mobile.html', 'utf8');
            if (html.includes('mobile-cursor-prompt') && html.includes('unityContainer')) {
                console.log('✅ mobile.html structure is valid');
            } else {
                console.log('❌ mobile.html structure is invalid');
                process.exit(1);
            }
        "
    fi
    
    # Check mobile viewport meta tag
    if grep -q 'viewport.*user-scalable=no' "$BUILD_PATH/mobile.html"; then
        echo "✅ Mobile viewport meta tag found"
    else
        echo "❌ Mobile viewport meta tag not found"
    fi
    
    # Check touch event handling
    if grep -q 'touchstart\|touchend\|touchmove' "$BUILD_PATH/mobile.html"; then
        echo "✅ Touch event handling found"
    else
        echo "❌ Touch event handling not found"
    fi
    
    # Check orientation change handling
    if grep -q 'orientationchange' "$BUILD_PATH/mobile.html"; then
        echo "✅ Orientation change handling found"
    else
        echo "❌ Orientation change handling not found"
    fi
    
    echo "✅ Mobile features test completed"
fi

# Start local server
if [ "$TEST_TYPE" = "local" ] || [ "$TEST_TYPE" = "server" ]; then
    echo "🌐 Starting local server..."
    echo "📱 Mobile URL: http://localhost:8000/mobile.html"
    echo "🖥️  Desktop URL: http://localhost:8000/index.html"
    echo ""
    echo "📱 To test on mobile device:"
    echo "1. Find your computer's IP address"
    echo "2. Open http://[your-ip]:8000/mobile.html on your mobile device"
    echo "3. Make sure both devices are on the same network"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    cd "$BUILD_PATH"
    
    # Try different Python versions
    if command -v python3 &> /dev/null; then
        python3 -m http.server 8000
    elif command -v python &> /dev/null; then
        python -m SimpleHTTPServer 8000
    else
        echo "❌ Python not found. Please install Python to start the server."
        echo "Alternatively, you can open the HTML files directly in a browser."
        exit 1
    fi
fi

echo "✅ Mobile WebGL test completed"