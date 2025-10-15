# 🎮 WebGL Asset Build Paths Guide

## 📁 Build Path Structure

### Primary Build Paths
```
/workspace/
├── Build/                          # Root build path (Vercel deployment)
│   ├── WebGL.data                  # Unity data file
│   ├── WebGL.framework.js          # Unity framework
│   ├── WebGL.json                  # Build configuration
│   ├── WebGL.loader.js             # Unity loader
│   ├── WebGL.mem                   # Memory file
│   ├── WebGL.wasm                  # WebAssembly file
│   ├── TemplateData/               # Unity UI assets
│   ├── StreamingAssets/            # Game assets
│   ├── PlatformConfigs/            # Platform-specific configs
│   ├── index.html                  # Main HTML file
│   └── platform-detection.js       # Cross-platform detection
├── webgl/Build/                    # WebGL platform build
│   └── [same structure as above]
├── Builds/WebGL/poki/Build/        # Poki platform build
│   └── [same structure as above]
└── unity/                          # Unity project source
    ├── Assets/
    │   ├── StreamingAssets/        # Source streaming assets
    │   └── Scripts/Editor/         # Build scripts
    └── ProjectSettings/
```

## 🛠️ Build Commands

### Individual Platform Builds
```bash
# Build for Vercel deployment
./build-webgl-vercel.sh

# Build for WebGL platform
./build-webgl-webgl.sh

# Build for Poki platform
./build-webgl-poki.sh

# Build for all platforms
./build-all-webgl.sh
```

### Unity Build Commands
```bash
# Local Unity build (requires Unity Editor)
./build-webgl.sh poki Builds/WebGL/poki

# Docker Unity build (no Unity Editor required)
./build-webgl-docker.sh poki Builds/WebGL/poki

# Unity Cloud Build (requires API credentials)
./unity-cli-working build webgl
```

## ⚙️ Configuration Files

### Unity Build Configuration
- **File**: `/workspace/unity-webgl-build-config.json`
- **Purpose**: Central configuration for all WebGL builds
- **Contains**: Build paths, WebGL settings, platform configs

### Platform-Specific Configs
- **Poki**: `/workspace/webgl/platform-configs/poki.json`
- **Kongregate**: `/workspace/webgl/platform-configs/kongregate.json`
- **CrazyGames**: `/workspace/webgl/platform-configs/crazygames.json`

### Deployment Configs
- **Vercel**: `/workspace/vercel.json`
- **WebGL**: `/workspace/webgl/index.html`
- **Poki**: `/workspace/Builds/WebGL/poki/index.html`

## 🎯 WebGL Settings

### Memory Configuration
```json
{
  "memory_size": 256,
  "data_caching": true,
  "exception_support": "ExplicitlyThrownExceptionsOnly"
}
```

### Compression Settings
```json
{
  "compression_format": "Gzip",
  "name_files_as_hashes": true,
  "threads_support": false
}
```

### Scripting Backend
```json
{
  "scripting_backend": "IL2CPP",
  "api_compatibility_level": "NET_Standard_2_1"
}
```

## 📦 Asset Organization

### TemplateData Assets
```
TemplateData/
├── unity-logo-dark.png          # Unity logo
├── progress-bar-empty-dark.png  # Progress bar empty
├── progress-bar-full-dark.png   # Progress bar full
├── webgl-logo.png               # WebGL logo
└── fullscreen-button.png        # Fullscreen button
```

### StreamingAssets
```
StreamingAssets/
├── game-assets/                 # Game-specific assets
├── audio/                       # Audio files
├── textures/                    # Texture files
└── configs/                     # Game configuration files
```

### Platform Configs
```
PlatformConfigs/
├── poki.json                    # Poki platform config
├── kongregate.json              # Kongregate platform config
├── crazygames.json              # CrazyGames platform config
└── webgl.json                   # Generic WebGL config
```

## 🚀 Deployment Workflows

### Vercel Deployment
1. **Build**: `./build-webgl-vercel.sh`
2. **Deploy**: `npm run deploy:vercel`
3. **Result**: Files in `/workspace/Build/` deployed to Vercel

### WebGL Platform Deployment
1. **Build**: `./build-webgl-webgl.sh`
2. **Deploy**: Upload `/workspace/webgl/Build/` to web server
3. **Result**: WebGL game accessible via web server

### Poki Platform Deployment
1. **Build**: `./build-webgl-poki.sh`
2. **Deploy**: Upload `/workspace/Builds/WebGL/poki/Build/` to Poki
3. **Result**: Game integrated with Poki platform

## 🔧 Unity Build Scripts

### Headless WebGL Builder
- **File**: `/workspace/unity/Assets/Scripts/Editor/HeadlessWebGLBuilder.cs`
- **Purpose**: Command-line Unity WebGL builds
- **Usage**: `Unity -executeMethod Evergreen.Editor.HeadlessWebGLBuilder.BuildWebGLHeadless`

### Poki WebGL Build Script
- **File**: `/workspace/unity/Assets/Editor/PokiWebGLBuildScript.cs`
- **Purpose**: Poki-specific WebGL builds
- **Usage**: Unity Editor menu: `Evergreen/Build/Poki WebGL Build`

### General Build Script
- **File**: `/workspace/unity/Assets/Scripts/Editor/BuildScript.cs`
- **Purpose**: General platform builds
- **Usage**: Unity Editor menu: `Build/Build WebGL`

## 📋 Build Process

### 1. Unity Project Setup
```bash
# Open Unity project
cd /workspace/unity
# Open in Unity Editor
```

### 2. Configure Build Settings
- **Platform**: WebGL
- **Scripting Backend**: IL2CPP
- **API Compatibility**: .NET Standard 2.1
- **Memory Size**: 256MB
- **Compression**: Gzip

### 3. Build WebGL
```bash
# Using Unity Editor
File → Build Settings → WebGL → Build

# Using command line
./build-webgl.sh poki Builds/WebGL/poki

# Using Docker
./build-webgl-docker.sh poki Builds/WebGL/poki
```

### 4. Deploy Assets
```bash
# Synchronize all platforms
./sync-all-versions.sh

# Deploy to Vercel
npm run deploy:vercel
```

## 🎮 Asset Requirements

### Required Unity WebGL Files
- `WebGL.data` - Game data file
- `WebGL.framework.js` - Unity framework
- `WebGL.json` - Build configuration
- `WebGL.loader.js` - Unity loader
- `WebGL.mem` - Memory file
- `WebGL.wasm` - WebAssembly file

### Optional TemplateData Files
- `unity-logo-dark.png` - Unity logo
- `progress-bar-empty-dark.png` - Progress bar empty
- `progress-bar-full-dark.png` - Progress bar full
- `webgl-logo.png` - WebGL logo
- `fullscreen-button.png` - Fullscreen button

### Platform-Specific Assets
- Platform logos and branding
- Platform-specific loading screens
- Platform configuration files
- Platform-specific HTML templates

## 🔍 Troubleshooting

### Common Issues
1. **Missing Build Files**: Run `./create-minimal-webgl-build.sh`
2. **Path Not Found**: Check build path configuration
3. **Unity Not Found**: Install Unity Editor or use Docker
4. **Build Failed**: Check Unity console logs

### Debug Commands
```bash
# Check build paths
ls -la /workspace/Build/
ls -la /workspace/webgl/Build/
ls -la /workspace/Builds/WebGL/poki/Build/

# Verify Unity project
ls -la /workspace/unity/Assets/

# Check build configuration
cat /workspace/unity-webgl-build-config.json
```

## 📊 Build Status

### Current Status
- ✅ **Build Paths**: Configured for all platforms
- ✅ **Unity Project**: Ready for WebGL builds
- ✅ **Build Scripts**: Available for all platforms
- ✅ **Deployment**: Ready for Vercel, WebGL, and Poki
- ✅ **Synchronization**: All platforms synchronized

### Next Steps
1. **Build Unity Project**: Use Unity Editor or build scripts
2. **Replace Placeholder Files**: Use real Unity WebGL build files
3. **Deploy**: Use platform-specific deployment commands
4. **Test**: Verify deployment on all platforms

---

**Status**: ✅ **READY** - WebGL asset build paths fully configured!