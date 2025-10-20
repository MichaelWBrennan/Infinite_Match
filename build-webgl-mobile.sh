#!/bin/bash

# Mobile WebGL Build Script
# Builds WebGL with mobile device support and optimizations
# Usage: ./build-webgl-mobile.sh [platform] [build-path] [development]

set -e

# Default values
PLATFORM=${1:-"mobile"}
BUILD_PATH=${2:-"Builds/WebGL/mobile"}
DEVELOPMENT=${3:-"false"}

# Valid platforms
VALID_PLATFORMS=("mobile" "poki" "facebook" "snap" "tiktok" "kongregate" "crazygames")

echo "📱 Mobile WebGL Build Script"
echo "============================"
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

# Copy mobile WebGL support files
echo "📱 Copying mobile WebGL support files..."
cp -f "unity/Assets/StreamingAssets/mobile-webgl-support.js" "$BUILD_PATH/" 2>/dev/null || echo "⚠️ Mobile WebGL support JS not found, skipping..."

# Build WebGL using Unity command line with mobile optimizations
echo "🔨 Building Mobile WebGL for $PLATFORM..."

$UNITY_PATH \
    -batchmode \
    -quit \
    -projectPath "$(pwd)/unity" \
    -executeMethod InfiniteMatch.Editor.HeadlessWebGLBuilder.BuildWebGLHeadless \
    -platform "$PLATFORM" \
    -buildPath "$BUILD_PATH" \
    -development "$DEVELOPMENT" \
    -mobileWebGLSupport "true" \
    -mobileOptimization "true" \
    -touchInputSupport "true" \
    -mobileMemoryLimit "128" \
    -mobileTargetFramerate "30" \
    -logFile "build-mobile-log.txt"

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo "✅ Mobile WebGL build completed successfully!"
    echo "📁 Build output: $BUILD_PATH"
    echo "📱 Mobile optimizations enabled"
    echo "🌐 Open index.html in a web browser to test"
    
    # List build contents
    echo ""
    echo "📋 Build contents:"
    ls -la "$BUILD_PATH"
    
    # Create mobile-specific index.html if it doesn't exist
    if [ ! -f "$BUILD_PATH/index.html" ]; then
        echo "📱 Creating mobile-optimized index.html..."
        create_mobile_index_html
    fi
    
    # Start local server if Python is available
    if command -v python3 &> /dev/null; then
        echo ""
        echo "🌐 Starting local server..."
        echo "Open http://localhost:8000 in your browser"
        echo "📱 Test on mobile device by accessing this IP from your mobile browser"
        cd "$BUILD_PATH" && python3 -m http.server 8000
    fi
else
    echo "❌ Mobile WebGL build failed. Check build-mobile-log.txt for details."
    exit 1
fi

# Function to create mobile-optimized index.html
create_mobile_index_html() {
    cat > "$BUILD_PATH/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="description" content="Infinite Match - Mobile WebGL Match 3 Game">
    <title>Infinite Match - Mobile WebGL</title>
    <link rel="shortcut icon" href="TemplateData/favicon.ico">
    
    <!-- Mobile WebGL Support -->
    <script src="mobile-webgl-support.js"></script>
    
    <style>
        body {
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            font-family: Arial, sans-serif;
            overflow: hidden;
        }
        
        #unity-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            position: relative;
        }
        
        #unity-canvas {
            max-width: 100%;
            max-height: 100vh;
            border-radius: 10px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }
        
        #unity-loading-bar {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            z-index: 1000;
        }
        
        .mobile-warning-content {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        
        .mobile-warning-content h3 {
            margin: 0 0 15px 0;
            font-size: 24px;
            font-weight: bold;
        }
        
        .mobile-warning-content p {
            margin: 0 0 20px 0;
            font-size: 16px;
            opacity: 0.9;
        }
        
        .mobile-optimization-status {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 20px;
        }
        
        .status-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: rgba(255,255,255,0.1);
            border-radius: 6px;
            font-size: 14px;
        }
        
        .status-label {
            font-weight: 500;
        }
        
        .status-value {
            font-weight: bold;
            color: #4CAF50;
        }
        
        @media (max-width: 768px) {
            .mobile-optimization-status {
                flex-direction: column;
            }
            
            .status-item {
                flex-direction: column;
                text-align: center;
                gap: 5px;
            }
        }
    </style>
</head>
<body>
    <div id="unity-container">
        <canvas id="unity-canvas" tabindex="-1"></canvas>
        <div id="unity-loading-bar">
            <div id="unity-logo"></div>
            <div id="unity-progress-bar-empty">
                <div id="unity-progress-bar-full"></div>
            </div>
            <div class="loading-text">Loading Infinite Match Mobile...</div>
        </div>
        <div id="unity-mobile-warning" style="display: none;">
            <div class="mobile-warning-content">
                <h3>📱 Mobile WebGL Support</h3>
                <p>This game now supports mobile devices! Optimizing for your device...</p>
                <div class="mobile-optimization-status">
                    <div class="status-item">
                        <span class="status-label">Device Detection:</span>
                        <span class="status-value" id="device-status">Checking...</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">Performance Level:</span>
                        <span class="status-value" id="performance-status">Detecting...</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">Touch Support:</span>
                        <span class="status-value" id="touch-status">Enabling...</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Mobile WebGL initialization
        var container = document.querySelector("#unity-container");
        var canvas = document.querySelector("#unity-canvas");
        var loadingBar = document.querySelector("#unity-loading-bar");
        var progressBarFull = document.querySelector("#unity-progress-bar-full");
        var mobileWarning = document.querySelector("#unity-mobile-warning");
        
        // Initialize mobile WebGL support
        function initMobileWebGL() {
            if (window.MobileWebGLSupport) {
                MobileWebGLSupport.init();
                updateMobileStatus();
                loadUnityWebGL();
            } else {
                console.error('❌ Mobile WebGL support not available');
                showError('Mobile WebGL support not available');
            }
        }
        
        // Update mobile status display
        function updateMobileStatus() {
            if (!window.MobileWebGLSupport) return;
            
            const deviceInfo = MobileWebGLSupport.getDeviceInfo();
            const isMobile = MobileWebGLSupport.isMobileDevice;
            
            document.getElementById('device-status').textContent = isMobile ? 'Mobile Detected' : 'Desktop Detected';
            document.getElementById('performance-status').textContent = deviceInfo ? deviceInfo.platform : 'Unknown';
            document.getElementById('touch-status').textContent = deviceInfo && deviceInfo.touchSupport ? 'Enabled' : 'Disabled';
        }
        
        // Load Unity WebGL build
        function loadUnityWebGL() {
            var buildUrl = "Build";
            var loaderUrl = buildUrl + "/WebGL.loader.js";
            
            var script = document.createElement("script");
            script.src = loaderUrl;
            script.onload = () => {
                console.log('📦 Unity loader loaded for mobile, initializing...');
                
                if (typeof createUnityInstance === 'function') {
                    const mobileConfig = {
                        dataUrl: buildUrl + "/WebGL.data",
                        frameworkUrl: buildUrl + "/WebGL.framework.js",
                        codeUrl: buildUrl + "/WebGL.wasm",
                        streamingAssetsUrl: "StreamingAssets",
                        companyName: "Infinite Match",
                        productName: "Infinite Match Mobile",
                        productVersion: "1.0.0",
                        matchWebGLToCanvasSize: false,
                        devicePixelRatio: window.devicePixelRatio || 1
                    };
                    
                    createUnityInstance(canvas, mobileConfig, (progress) => {
                        progressBarFull.style.width = 100 * progress + "%";
                        console.log('📊 Mobile loading progress:', Math.round(progress * 100) + '%');
                    }).then((unityInstance) => {
                        loadingBar.style.display = "none";
                        mobileWarning.style.display = "none";
                        
                        // Set up mobile features
                        if (unityInstance.SendMessage) {
                            const deviceInfo = MobileWebGLSupport.getDeviceInfo();
                            unityInstance.SendMessage('MobileWebGLSupport', 'SetDeviceInfo', JSON.stringify(deviceInfo));
                            unityInstance.SendMessage('MobileWebGLSupport', 'SetMobileQuality', '1');
                            unityInstance.SendMessage('MobileWebGLSupport', 'SetMobileFrameRate', '30');
                        }
                        
                        console.log('✅ Mobile Unity game loaded successfully');
                    }).catch((message) => {
                        console.error('❌ Mobile Unity game load failed:', message);
                        showError('Failed to load game: ' + message);
                    });
                } else {
                    console.error('❌ createUnityInstance function not found');
                    showError('Unity loader not properly loaded');
                }
            };
            
            script.onerror = () => {
                console.error('❌ Failed to load Unity WebGL loader');
                showError('Failed to load Unity WebGL loader');
            };
            
            document.body.appendChild(script);
        }
        
        // Show error message
        function showError(message) {
            loadingBar.innerHTML = '<div class="error">' + message + '</div>';
        }
        
        // Initialize when page loads
        window.addEventListener('load', initMobileWebGL);
    </script>
</body>
</html>
EOF
    echo "✅ Mobile index.html created"
}