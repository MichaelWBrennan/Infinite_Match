#!/bin/bash

# Mobile WebGL Testing Script
# Tests mobile WebGL builds on various devices and browsers
# Usage: ./test-mobile-webgl.sh [build-path] [test-type]

set -e

# Default values
BUILD_PATH=${1:-"Builds/WebGL/mobile"}
TEST_TYPE=${2:-"local"}

echo "🧪 Mobile WebGL Testing Script"
echo "=============================="
echo "Build Path: $BUILD_PATH"
echo "Test Type: $TEST_TYPE"
echo ""

# Check if build exists
if [ ! -d "$BUILD_PATH" ]; then
    echo "❌ Build directory not found: $BUILD_PATH"
    echo "Please build the mobile WebGL version first using: ./build-webgl-mobile.sh"
    exit 1
fi

# Check if required files exist
REQUIRED_FILES=("index.html" "Build/WebGL.loader.js" "mobile-webgl-support.js")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$BUILD_PATH/$file" ]; then
        echo "❌ Required file not found: $file"
        exit 1
    fi
done

echo "✅ Build files found"

# Function to test local server
test_local_server() {
    echo "🌐 Testing local server..."
    
    # Start local server in background
    cd "$BUILD_PATH"
    python3 -m http.server 8000 &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 2
    
    # Test server response
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000 | grep -q "200"; then
        echo "✅ Local server is running on http://localhost:8000"
        echo "📱 Test on mobile devices by accessing:"
        echo "   http://$(hostname -I | awk '{print $1}'):8000"
        echo "   or"
        echo "   http://localhost:8000 (if testing on same machine)"
    else
        echo "❌ Local server failed to start"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
    
    # Keep server running for manual testing
    echo ""
    echo "🔍 Server is running. Press Ctrl+C to stop testing."
    echo "📱 Open the URL above on your mobile device to test."
    
    # Wait for user to stop
    trap "kill $SERVER_PID 2>/dev/null || true; exit 0" INT
    wait $SERVER_PID
}

# Function to test mobile WebGL features
test_mobile_features() {
    echo "📱 Testing mobile WebGL features..."
    
    # Test JavaScript mobile detection
    echo "🔍 Testing mobile device detection..."
    if grep -q "detectMobileDevice" "$BUILD_PATH/mobile-webgl-support.js"; then
        echo "✅ Mobile device detection found"
    else
        echo "❌ Mobile device detection not found"
    fi
    
    # Test touch support
    echo "👆 Testing touch support..."
    if grep -q "touchstart\|touchend\|touchmove" "$BUILD_PATH/mobile-webgl-support.js"; then
        echo "✅ Touch support found"
    else
        echo "❌ Touch support not found"
    fi
    
    # Test performance monitoring
    echo "📊 Testing performance monitoring..."
    if grep -q "performance\|fps\|memory" "$BUILD_PATH/mobile-webgl-support.js"; then
        echo "✅ Performance monitoring found"
    else
        echo "❌ Performance monitoring not found"
    fi
    
    # Test adaptive quality
    echo "🎨 Testing adaptive quality..."
    if grep -q "quality\|adaptive" "$BUILD_PATH/mobile-webgl-support.js"; then
        echo "✅ Adaptive quality found"
    else
        echo "❌ Adaptive quality not found"
    fi
}

# Function to test HTML template
test_html_template() {
    echo "📄 Testing HTML template..."
    
    # Check for mobile viewport
    if grep -q "viewport.*width=device-width" "$BUILD_PATH/index.html"; then
        echo "✅ Mobile viewport meta tag found"
    else
        echo "❌ Mobile viewport meta tag not found"
    fi
    
    # Check for mobile WebGL support script
    if grep -q "mobile-webgl-support.js" "$BUILD_PATH/index.html"; then
        echo "✅ Mobile WebGL support script included"
    else
        echo "❌ Mobile WebGL support script not included"
    fi
    
    # Check for mobile warning display
    if grep -q "mobile-warning-content" "$BUILD_PATH/index.html"; then
        echo "✅ Mobile warning display found"
    else
        echo "❌ Mobile warning display not found"
    fi
    
    # Check for touch optimizations
    if grep -q "touchstart\|touchend" "$BUILD_PATH/index.html"; then
        echo "✅ Touch event handling found"
    else
        echo "❌ Touch event handling not found"
    fi
}

# Function to test Unity build files
test_unity_build() {
    echo "🎮 Testing Unity build files..."
    
    # Check for WebGL loader
    if [ -f "$BUILD_PATH/Build/WebGL.loader.js" ]; then
        echo "✅ WebGL loader found"
    else
        echo "❌ WebGL loader not found"
    fi
    
    # Check for WebGL data files
    WEBGL_FILES=("WebGL.data" "WebGL.framework.js" "WebGL.wasm" "WebGL.mem")
    for file in "${WEBGL_FILES[@]}"; do
        if [ -f "$BUILD_PATH/Build/$file" ]; then
            echo "✅ $file found"
        else
            echo "❌ $file not found"
        fi
    done
    
    # Check file sizes (should be reasonable for mobile)
    echo "📏 Checking file sizes..."
    for file in "${WEBGL_FILES[@]}"; do
        if [ -f "$BUILD_PATH/Build/$file" ]; then
            size=$(du -h "$BUILD_PATH/Build/$file" | cut -f1)
            echo "   $file: $size"
        fi
    done
}

# Function to generate test report
generate_test_report() {
    echo "📋 Generating test report..."
    
    REPORT_FILE="$BUILD_PATH/mobile-webgl-test-report.txt"
    
    cat > "$REPORT_FILE" << EOF
Mobile WebGL Test Report
========================
Generated: $(date)
Build Path: $BUILD_PATH
Test Type: $TEST_TYPE

File Structure:
$(find "$BUILD_PATH" -type f -name "*.js" -o -name "*.html" -o -name "*.wasm" -o -name "*.data" | sort)

WebGL Build Files:
$(ls -la "$BUILD_PATH/Build/" 2>/dev/null || echo "Build directory not found")

Mobile WebGL Support Features:
- Mobile device detection: $(grep -q "detectMobileDevice" "$BUILD_PATH/mobile-webgl-support.js" && echo "✅" || echo "❌")
- Touch support: $(grep -q "touchstart" "$BUILD_PATH/mobile-webgl-support.js" && echo "✅" || echo "❌")
- Performance monitoring: $(grep -q "performance" "$BUILD_PATH/mobile-webgl-support.js" && echo "✅" || echo "❌")
- Adaptive quality: $(grep -q "quality" "$BUILD_PATH/mobile-webgl-support.js" && echo "✅" || echo "❌")

HTML Template Features:
- Mobile viewport: $(grep -q "viewport.*width=device-width" "$BUILD_PATH/index.html" && echo "✅" || echo "❌")
- Mobile WebGL script: $(grep -q "mobile-webgl-support.js" "$BUILD_PATH/index.html" && echo "✅" || echo "❌")
- Mobile warning display: $(grep -q "mobile-warning-content" "$BUILD_PATH/index.html" && echo "✅" || echo "❌")

Test Instructions:
1. Start local server: python3 -m http.server 8000
2. Open http://localhost:8000 on desktop browser
3. Open http://[your-ip]:8000 on mobile device
4. Test touch controls and performance
5. Check browser console for any errors

Mobile Testing URLs:
- Local: http://localhost:8000
- Network: http://$(hostname -I | awk '{print $1}'):8000

EOF

    echo "✅ Test report generated: $REPORT_FILE"
}

# Main testing logic
case $TEST_TYPE in
    "local")
        test_mobile_features
        test_html_template
        test_unity_build
        generate_test_report
        test_local_server
        ;;
    "features")
        test_mobile_features
        test_html_template
        test_unity_build
        generate_test_report
        ;;
    "server")
        test_local_server
        ;;
    *)
        echo "❌ Unknown test type: $TEST_TYPE"
        echo "Valid test types: local, features, server"
        exit 1
        ;;
esac

echo ""
echo "✅ Mobile WebGL testing completed!"
echo "📱 Remember to test on actual mobile devices for best results."