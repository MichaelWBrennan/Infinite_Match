#!/bin/bash

# WebGL Asset Build Path Configuration
# Sets up proper build paths for Unity WebGL assets across all platforms

echo "🎮 Configuring WebGL Asset Build Paths..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Define build paths
ROOT_BUILD_PATH="/workspace/Build"
WEBGL_BUILD_PATH="/workspace/webgl/Build"
POKI_BUILD_PATH="/workspace/Builds/WebGL/poki/Build"
VERCEL_BUILD_PATH="/workspace/Build"

echo -e "${BLUE}📁 WebGL Build Paths Configuration${NC}"
echo "=================================="
echo ""

# Function to create build directory structure
create_build_structure() {
    local build_path="$1"
    local platform="$2"
    
    echo -e "${YELLOW}Creating build structure for $platform...${NC}"
    
    # Create main build directory
    mkdir -p "$build_path"
    
    # Create subdirectories for different asset types
    mkdir -p "$build_path/TemplateData"
    mkdir -p "$build_path/StreamingAssets"
    mkdir -p "$build_path/PlatformConfigs"
    
    echo -e "${GREEN}✅ Created structure: $build_path${NC}"
}

# Function to configure Unity build settings
configure_unity_build_settings() {
    echo -e "${BLUE}🔧 Configuring Unity Build Settings...${NC}"
    
    # Create Unity build configuration
    cat > /workspace/unity-build-config.json << 'EOF'
{
  "webgl_build_settings": {
    "memory_size": 256,
    "data_caching": true,
    "exception_support": "ExplicitlyThrownExceptionsOnly",
    "compression_format": "Gzip",
    "name_files_as_hashes": true,
    "threads_support": false,
    "template": "PROJECT:Default"
  },
  "build_paths": {
    "root": "/workspace/Build",
    "webgl": "/workspace/webgl/Build", 
    "poki": "/workspace/Builds/WebGL/poki/Build",
    "vercel": "/workspace/Build"
  },
  "asset_paths": {
    "template_data": "TemplateData/",
    "streaming_assets": "StreamingAssets/",
    "platform_configs": "PlatformConfigs/"
  }
}
EOF
    
    echo -e "${GREEN}✅ Unity build configuration created${NC}"
}

# Function to create WebGL asset structure
create_webgl_asset_structure() {
    local build_path="$1"
    local platform="$2"
    
    echo -e "${YELLOW}Creating WebGL asset structure for $platform...${NC}"
    
    # Create TemplateData directory with placeholder files
    mkdir -p "$build_path/TemplateData"
    
    # Create placeholder TemplateData files
    cat > "$build_path/TemplateData/unity-logo-dark.png" << 'EOF'
# Placeholder for Unity logo
# Replace with actual unity-logo-dark.png from Unity WebGL build
EOF
    
    cat > "$build_path/TemplateData/progress-bar-empty-dark.png" << 'EOF'
# Placeholder for progress bar empty
# Replace with actual progress-bar-empty-dark.png from Unity WebGL build
EOF
    
    cat > "$build_path/TemplateData/progress-bar-full-dark.png" << 'EOF'
# Placeholder for progress bar full
# Replace with actual progress-bar-full-dark.png from Unity WebGL build
EOF
    
    cat > "$build_path/TemplateData/webgl-logo.png" << 'EOF'
# Placeholder for WebGL logo
# Replace with actual webgl-logo.png from Unity WebGL build
EOF
    
    cat > "$build_path/TemplateData/fullscreen-button.png" << 'EOF'
# Placeholder for fullscreen button
# Replace with actual fullscreen-button.png from Unity WebGL build
EOF
    
    # Create StreamingAssets directory
    mkdir -p "$build_path/StreamingAssets"
    
    # Create PlatformConfigs directory
    mkdir -p "$build_path/PlatformConfigs"
    
    echo -e "${GREEN}✅ WebGL asset structure created for $platform${NC}"
}

# Function to create build script for each platform
create_platform_build_script() {
    local platform="$1"
    local build_path="$2"
    
    cat > "/workspace/build-webgl-${platform}.sh" << EOF
#!/bin/bash

# WebGL Build Script for $platform
# Usage: ./build-webgl-${platform}.sh

echo "🎮 Building WebGL for $platform..."

# Set build path
BUILD_PATH="$build_path"

# Create build directory
mkdir -p "\$BUILD_PATH"

# Copy Unity WebGL build files
if [ -d "/workspace/unity/Builds/WebGL" ]; then
    echo "📦 Copying Unity WebGL build files..."
    cp -r /workspace/unity/Builds/WebGL/* "\$BUILD_PATH/"
else
    echo "⚠️ No Unity WebGL build found, using minimal build..."
    /workspace/create-minimal-webgl-build.sh
    cp -r /workspace/Build/* "\$BUILD_PATH/"
fi

# Copy platform-specific files
if [ -f "/workspace/webgl/platform-configs/${platform}.json" ]; then
    cp "/workspace/webgl/platform-configs/${platform}.json" "\$BUILD_PATH/PlatformConfigs/"
fi

# Copy platform detection script
cp /workspace/platform-detection.js "\$BUILD_PATH/"

# Copy index.html
cp /workspace/index.html "\$BUILD_PATH/"

echo "✅ WebGL build for $platform completed!"
echo "📁 Build output: \$BUILD_PATH"
ls -la "\$BUILD_PATH"
EOF
    
    chmod +x "/workspace/build-webgl-${platform}.sh"
    echo -e "${GREEN}✅ Created build script for $platform${NC}"
}

# Main execution
echo -e "${BLUE}🚀 Starting WebGL Asset Build Path Configuration...${NC}"
echo ""

# Create build structures for all platforms
create_build_structure "$ROOT_BUILD_PATH" "Root (Vercel)"
create_build_structure "$WEBGL_BUILD_PATH" "WebGL"
create_build_structure "$POKI_BUILD_PATH" "Poki"
create_build_structure "$VERCEL_BUILD_PATH" "Vercel"

echo ""

# Configure Unity build settings
configure_unity_build_settings

echo ""

# Create WebGL asset structures
create_webgl_asset_structure "$ROOT_BUILD_PATH" "Root"
create_webgl_asset_structure "$WEBGL_BUILD_PATH" "WebGL"
create_webgl_asset_structure "$POKI_BUILD_PATH" "Poki"

echo ""

# Create platform-specific build scripts
create_platform_build_script "poki" "$POKI_BUILD_PATH"
create_platform_build_script "webgl" "$WEBGL_BUILD_PATH"
create_platform_build_script "vercel" "$VERCEL_BUILD_PATH"

echo ""

# Create master build script
cat > /workspace/build-all-webgl.sh << 'EOF'
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
EOF

chmod +x /workspace/build-all-webgl.sh

echo -e "${GREEN}🎉 WebGL Asset Build Path Configuration Complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Summary:${NC}"
echo "  - Root Build Path: $ROOT_BUILD_PATH"
echo "  - WebGL Build Path: $WEBGL_BUILD_PATH"
echo "  - Poki Build Path: $POKI_BUILD_PATH"
echo "  - Vercel Build Path: $VERCEL_BUILD_PATH"
echo ""
echo -e "${YELLOW}🛠️ Available Commands:${NC}"
echo "  ./build-webgl-vercel.sh  - Build for Vercel deployment"
echo "  ./build-webgl-webgl.sh   - Build for WebGL deployment"
echo "  ./build-webgl-poki.sh    - Build for Poki platform"
echo "  ./build-all-webgl.sh     - Build for all platforms"
echo "  ./sync-all-versions.sh   - Synchronize all versions"
echo ""
echo -e "${YELLOW}📁 Asset Structure:${NC}"
echo "  Each build directory contains:"
echo "    - Build/ (Unity WebGL build files)"
echo "    - TemplateData/ (Unity UI assets)"
echo "    - StreamingAssets/ (Game assets)"
echo "    - PlatformConfigs/ (Platform-specific configs)"
echo "    - index.html (Platform-specific HTML)"
echo "    - platform-detection.js (Cross-platform detection)"
echo ""
echo -e "${GREEN}🚀 Ready for Unity WebGL builds!${NC}"