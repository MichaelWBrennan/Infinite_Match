#!/bin/bash

# Build Profile Manager
# Manages Unity WebGL build profile paths and configurations

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
UNITY_PROJECT_PATH="/workspace/unity"
CONFIG_DIRECTORY="/workspace/unity/Assets/Config"
BUILD_PROFILE_CONFIG="/workspace/build-profile-paths.json"

echo -e "${BLUE}🎮 Unity WebGL Build Profile Manager${NC}"
echo "======================================"

# Function to list all available profiles
list_profiles() {
    echo -e "${YELLOW}📋 Available Build Profiles:${NC}"
    echo ""
    
    if [ -d "$CONFIG_DIRECTORY" ]; then
        for profile_file in "$CONFIG_DIRECTORY"/*.json; do
            if [ -f "$profile_file" ]; then
                profile_name=$(basename "$profile_file" .json)
                echo -e "${GREEN}  ✅ $profile_name${NC}"
                echo "     Path: $profile_file"
                
                # Extract platform and target from profile
                platform=$(jq -r '.platform // "unknown"' "$profile_file" 2>/dev/null)
                target=$(jq -r '.build_settings.target_platform // "unknown"' "$profile_file" 2>/dev/null)
                echo "     Platform: $platform"
                echo "     Target: $target"
                echo ""
            fi
        done
    else
        echo -e "${RED}❌ Config directory not found: $CONFIG_DIRECTORY${NC}"
    fi
}

# Function to show profile details
show_profile() {
    local profile_name="$1"
    local profile_path="$CONFIG_DIRECTORY/$profile_name.json"
    
    if [ -f "$profile_path" ]; then
        echo -e "${YELLOW}📄 Profile Details: $profile_name${NC}"
        echo "=================================="
        echo ""
        echo -e "${BLUE}File Path:${NC} $profile_path"
        echo ""
        
        # Show key information
        echo -e "${BLUE}Platform Information:${NC}"
        jq -r '.platform, .name, .version' "$profile_path" 2>/dev/null | while read line; do
            echo "  $line"
        done
        echo ""
        
        echo -e "${BLUE}Build Settings:${NC}"
        jq -r '.build_settings | to_entries[] | "  \(.key): \(.value)"' "$profile_path" 2>/dev/null
        echo ""
        
        echo -e "${BLUE}Build Defines:${NC}"
        jq -r '.build_defines[]' "$profile_path" 2>/dev/null | while read define; do
            echo "  - $define"
        done
        echo ""
        
        echo -e "${BLUE}Compliance Checks:${NC}"
        jq -r '.compliance_checks | to_entries[] | "  \(.key): \(.value)"' "$profile_path" 2>/dev/null
        echo ""
        
    else
        echo -e "${RED}❌ Profile not found: $profile_name${NC}"
        echo "Available profiles:"
        list_profiles
    fi
}

# Function to validate profile
validate_profile() {
    local profile_name="$1"
    local profile_path="$CONFIG_DIRECTORY/$profile_name.json"
    
    echo -e "${YELLOW}🔍 Validating Profile: $profile_name${NC}"
    echo "=================================="
    
    if [ ! -f "$profile_path" ]; then
        echo -e "${RED}❌ Profile file not found: $profile_path${NC}"
        return 1
    fi
    
    # Check if JSON is valid
    if jq empty "$profile_path" 2>/dev/null; then
        echo -e "${GREEN}✅ JSON syntax is valid${NC}"
    else
        echo -e "${RED}❌ Invalid JSON syntax${NC}"
        return 1
    fi
    
    # Check required fields
    local required_fields=("platform" "name" "build_settings" "monetization" "analytics" "performance")
    local missing_fields=()
    
    for field in "${required_fields[@]}"; do
        if ! jq -e ".$field" "$profile_path" >/dev/null 2>&1; then
            missing_fields+=("$field")
        fi
    done
    
    if [ ${#missing_fields[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ All required fields present${NC}"
    else
        echo -e "${RED}❌ Missing required fields: ${missing_fields[*]}${NC}"
        return 1
    fi
    
    # Check build settings
    local build_settings_fields=("target_platform" "scripting_backend" "memory_size")
    local missing_build_settings=()
    
    for field in "${build_settings_fields[@]}"; do
        if ! jq -e ".build_settings.$field" "$profile_path" >/dev/null 2>&1; then
            missing_build_settings+=("$field")
        fi
    done
    
    if [ ${#missing_build_settings[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ Build settings complete${NC}"
    else
        echo -e "${RED}❌ Missing build settings: ${missing_build_settings[*]}${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Profile validation passed${NC}"
    return 0
}

# Function to get build path for profile
get_build_path() {
    local profile_name="$1"
    local profile_path="$CONFIG_DIRECTORY/$profile_name.json"
    
    if [ -f "$profile_path" ]; then
        local platform=$(jq -r '.platform' "$profile_path" 2>/dev/null)
        
        case "$platform" in
            "poki")
                echo "/workspace/Builds/WebGL/poki/Build"
                ;;
            "kongregate")
                echo "/workspace/Builds/WebGL/kongregate/Build"
                ;;
            "crazygames")
                echo "/workspace/Builds/WebGL/crazygames/Build"
                ;;
            "facebook")
                echo "/workspace/Builds/WebGL/facebook/Build"
                ;;
            "snap")
                echo "/workspace/Builds/WebGL/snap/Build"
                ;;
            "tiktok")
                echo "/workspace/Builds/WebGL/tiktok/Build"
                ;;
            *)
                echo "/workspace/Builds/WebGL/$platform/Build"
                ;;
        esac
    else
        echo -e "${RED}❌ Profile not found: $profile_name${NC}"
        return 1
    fi
}

# Function to build with profile
build_with_profile() {
    local profile_name="$1"
    local build_path=$(get_build_path "$profile_name")
    
    echo -e "${YELLOW}🔨 Building with profile: $profile_name${NC}"
    echo "=================================="
    
    # Validate profile first
    if ! validate_profile "$profile_name"; then
        echo -e "${RED}❌ Profile validation failed. Cannot build.${NC}"
        return 1
    fi
    
    echo -e "${BLUE}Build Path:${NC} $build_path"
    echo ""
    
    # Create build directory
    mkdir -p "$build_path"
    
    # Build using appropriate method
    case "$profile_name" in
        "poki")
            echo -e "${BLUE}Building Poki WebGL...${NC}"
            ./build-webgl-poki.sh
            ;;
        "kongregate")
            echo -e "${BLUE}Building Kongregate WebGL...${NC}"
            ./build-webgl.sh kongregate "$build_path"
            ;;
        "crazygames")
            echo -e "${BLUE}Building CrazyGames WebGL...${NC}"
            ./build-webgl.sh crazygames "$build_path"
            ;;
        *)
            echo -e "${BLUE}Building $profile_name WebGL...${NC}"
            ./build-webgl.sh "$profile_name" "$build_path"
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Build completed successfully!${NC}"
        echo -e "${BLUE}Build output:${NC} $build_path"
    else
        echo -e "${RED}❌ Build failed${NC}"
        return 1
    fi
}

# Function to show help
show_help() {
    echo -e "${YELLOW}Usage: $0 [command] [profile_name]${NC}"
    echo ""
    echo -e "${YELLOW}Commands:${NC}"
    echo "  list                    - List all available profiles"
    echo "  show <profile>          - Show profile details"
    echo "  validate <profile>      - Validate profile configuration"
    echo "  build <profile>         - Build with specific profile"
    echo "  path <profile>          - Get build path for profile"
    echo "  help                    - Show this help"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 list"
    echo "  $0 show poki"
    echo "  $0 validate poki"
    echo "  $0 build poki"
    echo "  $0 path poki"
    echo ""
    echo -e "${YELLOW}Profile Paths:${NC}"
    echo "  Config Directory: $CONFIG_DIRECTORY"
    echo "  Unity Project: $UNITY_PROJECT_PATH"
    echo "  Build Config: $BUILD_PROFILE_CONFIG"
}

# Main command handling
case "$1" in
    "list")
        list_profiles
        ;;
    "show")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Profile name required${NC}"
            echo "Usage: $0 show <profile_name>"
            exit 1
        fi
        show_profile "$2"
        ;;
    "validate")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Profile name required${NC}"
            echo "Usage: $0 validate <profile_name>"
            exit 1
        fi
        validate_profile "$2"
        ;;
    "build")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Profile name required${NC}"
            echo "Usage: $0 build <profile_name>"
            exit 1
        fi
        build_with_profile "$2"
        ;;
    "path")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Profile name required${NC}"
            echo "Usage: $0 path <profile_name>"
            exit 1
        fi
        get_build_path "$2"
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac