# 🎮 Unity WebGL Build Profile Paths - Complete Guide

## 📁 Build Profile Path Structure

### Unity Project Profile Paths
```
/workspace/unity/Assets/Config/
├── poki.json              # Poki WebGL Platform Profile
├── kongregate.json        # Kongregate WebGL Platform Profile
├── crazygames.json        # CrazyGames WebGL Platform Profile
├── facebook.json          # Facebook Instant Games Profile
├── snap.json              # Snap Mini Games Profile
├── tiktok.json            # TikTok Mini Games Profile
├── googleplay.json        # Google Play Store Profile
├── appstore.json          # Apple App Store Profile
├── steam.json             # Steam Platform Profile
├── epic.json              # Epic Games Store Profile
└── ps5.json               # PlayStation 5 Profile
```

### Build Output Paths
```
/workspace/
├── Build/                          # Root build (Vercel)
├── webgl/Build/                    # WebGL platform build
├── Builds/WebGL/poki/Build/        # Poki platform build
├── Builds/WebGL/kongregate/Build/  # Kongregate platform build
├── Builds/WebGL/crazygames/Build/  # CrazyGames platform build
├── Builds/WebGL/facebook/Build/    # Facebook platform build
├── Builds/WebGL/snap/Build/        # Snap platform build
└── Builds/WebGL/tiktok/Build/      # TikTok platform build
```

## 🛠️ Build Profile Manager Commands

### List All Profiles
```bash
./build-profile-manager.sh list
```

### Show Profile Details
```bash
./build-profile-manager.sh show poki
./build-profile-manager.sh show kongregate
./build-profile-manager.sh show crazygames
```

### Validate Profile
```bash
./build-profile-manager.sh validate poki
```

### Get Build Path
```bash
./build-profile-manager.sh path poki
# Output: /workspace/Builds/WebGL/poki/Build
```

### Build with Profile
```bash
./build-profile-manager.sh build poki
```

## 🎯 WebGL Platform Profiles

### Poki Platform Profile
- **Path**: `/workspace/unity/Assets/Config/poki.json`
- **Build Path**: `/workspace/Builds/WebGL/poki/Build`
- **Target**: WebGL
- **Memory**: 256MB
- **Compression**: Gzip
- **Scripting Backend**: IL2CPP
- **Defines**: `UNITY_WEBGL`, `POKI_PLATFORM`, `WEBGL_BUILD`, `NO_IAP`, `POKI_ADS_ONLY`

### Kongregate Platform Profile
- **Path**: `/workspace/unity/Assets/Config/kongregate.json`
- **Build Path**: `/workspace/Builds/WebGL/kongregate/Build`
- **Target**: WebGL
- **Features**: Social features, achievements, chat

### CrazyGames Platform Profile
- **Path**: `/workspace/unity/Assets/Config/crazygames.json`
- **Build Path**: `/workspace/Builds/WebGL/crazygames/Build`
- **Target**: WebGL
- **Features**: Leaderboards, social features

## 🔧 Unity Build Script Integration

### Headless WebGL Builder
- **Script**: `/workspace/unity/Assets/Scripts/Editor/HeadlessWebGLBuilder.cs`
- **Method**: `BuildWebGLHeadless`
- **Profile Loading**: `Assets/Config/{platform}.json`
- **Usage**: `Unity -executeMethod Evergreen.Editor.HeadlessWebGLBuilder.BuildWebGLHeadless -platform poki`

### Poki WebGL Build Script
- **Script**: `/workspace/unity/Assets/Editor/PokiWebGLBuildScript.cs`
- **Method**: `BuildPokiWebGL`
- **Profile Loading**: `Assets/Config/poki.json`
- **Usage**: Unity Editor menu: `Evergreen/Build/Poki WebGL Build`

### Platform Build Script
- **Script**: `/workspace/unity/Assets/Editor/PlatformBuildScript.cs`
- **Method**: `BuildForPlatform`
- **Profile Loading**: `Assets/Config/{platform}.json`
- **Usage**: Unity Editor menu: `Build/Platform Build`

## 📋 Profile Configuration Structure

### Required Fields
```json
{
  "platform": "poki",
  "name": "Poki WebGL Platform",
  "version": "1.0.0",
  "build_settings": {
    "target_platform": "WebGL",
    "scripting_backend": "IL2CPP",
    "api_compatibility_level": ".NET Standard 2.1",
    "memory_size": 256,
    "data_caching": true,
    "exception_support": "Explicitly Thrown Exceptions Only"
  },
  "monetization": { ... },
  "analytics": { ... },
  "performance": { ... },
  "content_restrictions": { ... },
  "technical_requirements": { ... },
  "compliance_checks": { ... },
  "build_defines": [ ... ]
}
```

### Build Settings Configuration
- **Target Platform**: WebGL, Android, iOS, StandaloneWindows, PS5
- **Scripting Backend**: IL2CPP, Mono
- **API Compatibility**: .NET Standard 2.1, .NET Framework
- **Memory Size**: 256MB (WebGL), 512MB+ (Mobile/Desktop)
- **Compression**: Gzip, Brotli, Disabled
- **Data Caching**: true/false
- **Exception Support**: None, Explicitly Thrown Exceptions Only

## 🚀 Build Commands with Profiles

### Unity Editor Commands
```bash
# Headless WebGL build with profile
Unity -batchmode -quit -projectPath /workspace/unity \
  -executeMethod Evergreen.Editor.HeadlessWebGLBuilder.BuildWebGLHeadless \
  -platform poki -buildPath /workspace/Builds/WebGL/poki/Build

# Poki WebGL build
Unity -batchmode -quit -projectPath /workspace/unity \
  -executeMethod Evergreen.Editor.PokiWebGLBuildScript.BuildPokiWebGL
```

### Docker Build Commands
```bash
# Build with Docker
./build-webgl-docker.sh poki /workspace/Builds/WebGL/poki/Build
```

### Local Build Commands
```bash
# Build with local Unity
./build-webgl.sh poki /workspace/Builds/WebGL/poki/Build
```

### Cloud Build Commands
```bash
# Unity Cloud Build
./unity-cli-working build webgl
```

## 📊 Profile Validation

### Validation Checks
- ✅ **File Exists**: Profile file exists in config directory
- ✅ **JSON Valid**: Valid JSON syntax
- ✅ **Required Fields**: All required fields present
- ✅ **Build Settings**: Build settings complete
- ✅ **Platform Compatible**: Platform settings compatible

### Required Fields Validation
- `platform` - Platform identifier
- `name` - Platform display name
- `build_settings` - Build configuration
- `monetization` - Monetization settings
- `analytics` - Analytics configuration
- `performance` - Performance requirements
- `content_restrictions` - Content policy
- `technical_requirements` - Technical specs
- `compliance_checks` - Compliance validation
- `build_defines` - Compiler defines

## 🎮 Platform-Specific Features

### Poki Platform
- **Ads**: Poki SDK integration
- **Monetization**: Virtual currency only
- **Social**: Leaderboards, achievements
- **Analytics**: Poki analytics + Unity analytics

### Kongregate Platform
- **Ads**: Kongregate ads API
- **Monetization**: IAP + virtual currency
- **Social**: Chat, achievements, social features
- **Analytics**: Kongregate stats + Unity analytics

### CrazyGames Platform
- **Ads**: CrazyGames ads API
- **Monetization**: Virtual currency only
- **Social**: Leaderboards
- **Analytics**: CrazyGames analytics + Unity analytics

## 🔍 Troubleshooting

### Common Issues
1. **Profile Not Found**: Check profile exists in `/workspace/unity/Assets/Config/`
2. **Invalid JSON**: Validate JSON syntax with `jq`
3. **Missing Fields**: Check required fields with validation
4. **Build Path Not Found**: Create build directory structure
5. **Unity Not Found**: Install Unity Editor or use Docker

### Debug Commands
```bash
# List all profiles
./build-profile-manager.sh list

# Validate specific profile
./build-profile-manager.sh validate poki

# Show profile details
./build-profile-manager.sh show poki

# Get build path
./build-profile-manager.sh path poki
```

## 📈 Current Status

### ✅ Available Profiles
- **Poki**: WebGL platform with Poki SDK
- **Kongregate**: WebGL platform with social features
- **CrazyGames**: WebGL platform with leaderboards
- **Facebook**: WebGL platform for Instant Games
- **Snap**: WebGL platform for Mini Games
- **TikTok**: WebGL platform for Mini Games
- **Google Play**: Android platform
- **App Store**: iOS platform
- **Steam**: Windows platform
- **Epic**: Windows platform
- **PS5**: PlayStation 5 platform

### ✅ Build Paths Configured
- All platform build paths configured
- Profile loading system working
- Validation system active
- Build commands ready

---

**Status**: ✅ **COMPLETE** - Build profile paths fully configured and ready for Unity builds!