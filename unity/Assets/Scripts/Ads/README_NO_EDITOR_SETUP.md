# Unity Ads Setup Without Unity Editor

This guide shows you how to set up Unity Ads entirely without using the Unity editor. Everything is automated through scripts and configuration files.

## 🚀 Quick Start (No Editor Required)

### 1. Automatic Setup
The system will automatically configure itself when you run your game. No editor interaction needed!

### 2. Command Line Setup
Run your game with command line arguments to configure Unity Ads:

```bash
# Basic setup with test mode
YourGame.exe -gameid 1234567 -testmode -platforms android,ios

# Production setup
YourGame.exe -gameid 1234567 -production -debug

# Custom configuration
YourGame.exe -gamename "My Game" -bundleid com.mycompany.mygame -platforms android,ios,webgl
```

### 3. Environment Variables
Set environment variables for automatic configuration:

```bash
# Windows
set UNITY_ADS_GAME_ID=1234567
set UNITY_ADS_GAME_NAME=My Game
set UNITY_ADS_BUNDLE_ID=com.mycompany.mygame
set UNITY_ADS_TEST_MODE=true
set UNITY_ADS_DEBUG_MODE=true

# Linux/Mac
export UNITY_ADS_GAME_ID=1234567
export UNITY_ADS_GAME_NAME="My Game"
export UNITY_ADS_BUNDLE_ID=com.mycompany.mygame
export UNITY_ADS_TEST_MODE=true
export UNITY_ADS_DEBUG_MODE=true
```

## 📁 Files Created Automatically

The system automatically creates these files in your game's data directory:

### Configuration Files
- `unity_ads_config.json` - Main configuration
- `unity_ads_manifest.json` - Unity Ads manifest
- `unity_ads_android.json` - Android-specific config
- `unity_ads_ios.json` - iOS-specific config
- `unity_ads_webgl.json` - WebGL-specific config

### Build Files
- `build_config.json` - Build configuration
- `build_manifest.json` - Build manifest
- `android_config.json` - Android build config
- `ios_config.json` - iOS build config
- `webgl_config.json` - WebGL build config

## 🎮 Game Integration

### Automatic Integration
The system automatically integrates with your game through these components:

1. **UnityAdsAutoSetup** - Handles automatic configuration
2. **UnityAdsCommandLineSetup** - Processes command line arguments
3. **UnityAdsBuildScript** - Manages build-time configuration
4. **UnityAdsGameIntegration** - Provides game integration examples

### Manual Integration
If you want to integrate manually, use these methods:

```csharp
// Get the ad system
var adSystem = UnityAdsNoKeys.Instance;

// Show interstitial ad
if (adSystem.CanShowAd("interstitial"))
{
    adSystem.ShowInterstitialAd((result) =>
    {
        if (result.success)
        {
            Debug.Log($"Ad shown, Revenue: ${result.revenue:F4}");
        }
    });
}

// Show rewarded ad
if (adSystem.CanShowAd("rewarded"))
{
    adSystem.ShowRewardedAd((result) =>
    {
        if (result.success)
        {
            Debug.Log($"Rewarded ad shown, Revenue: ${result.revenue:F4}");
            // Give reward to player
        }
    });
}

// Show banner ad
if (adSystem.CanShowAd("banner"))
{
    adSystem.ShowBannerAd();
}
```

## 🔧 Configuration Options

### Command Line Arguments

| Argument | Description | Example |
|----------|-------------|---------|
| `-gameid` | Set Unity Ads Game ID | `-gameid 1234567` |
| `-gamename` | Set game name | `-gamename "My Game"` |
| `-bundleid` | Set bundle identifier | `-bundleid com.mycompany.mygame` |
| `-testmode` | Enable test mode | `-testmode` |
| `-production` | Enable production mode | `-production` |
| `-debug` | Enable debug logging | `-debug` |
| `-platforms` | Set platforms | `-platforms android,ios,webgl` |
| `-help` | Show help | `-help` |

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `UNITY_ADS_GAME_ID` | Unity Ads Game ID | `1234567` |
| `UNITY_ADS_GAME_NAME` | Game name | `My Game` |
| `UNITY_ADS_BUNDLE_ID` | Bundle identifier | `com.mycompany.mygame` |
| `UNITY_ADS_TEST_MODE` | Test mode | `true` or `false` |
| `UNITY_ADS_DEBUG_MODE` | Debug mode | `true` or `false` |

## 🏗️ Build Process

### Automatic Build Configuration
The system automatically configures Unity Ads during the build process:

1. **Platform Detection** - Automatically detects target platform
2. **Configuration Generation** - Creates platform-specific configs
3. **File Generation** - Generates all necessary files
4. **Manifest Creation** - Creates Unity Ads manifest

### Build Scripts
Use these build scripts for automated builds:

```bash
# Windows
build.bat -gameid 1234567 -platforms android,ios -production

# Linux/Mac
./build.sh -gameid 1234567 -platforms android,ios -production
```

## 📊 Revenue Tracking

### Automatic Revenue Tracking
The system automatically tracks:

- Total revenue generated
- Number of ad views
- Average revenue per ad
- Revenue per platform
- Revenue per ad type

### Access Revenue Data
```csharp
var adSystem = UnityAdsNoKeys.Instance;

// Get total revenue
float totalRevenue = adSystem.GetTotalRevenue();

// Get total ad views
int totalViews = adSystem.GetTotalAdViews();

// Get average revenue per ad
float avgRevenue = adSystem.GetAverageRevenuePerAd();

// Generate revenue report
adSystem.LogRevenueReport();
```

## 🐛 Troubleshooting

### Common Issues

1. **Ads not showing**
   - Check Game ID is correct
   - Verify ad unit IDs match Unity Dashboard
   - Ensure test mode is enabled for testing

2. **Configuration not loading**
   - Check environment variables are set
   - Verify command line arguments are correct
   - Check configuration files are created

3. **Build errors**
   - Verify platform settings are correct
   - Check bundle ID is valid
   - Ensure all required files are present

### Debug Mode
Enable debug mode for detailed logging:

```bash
YourGame.exe -debug
```

Or set environment variable:
```bash
set UNITY_ADS_DEBUG_MODE=true
```

## 📈 Performance Optimization

### Ad Frequency Control
```csharp
var adSystem = UnityAdsNoKeys.Instance;

// Set ad frequency multiplier (1.0 = normal, 2.0 = double frequency)
adSystem.SetAdFrequencyMultiplier(1.5f);
```

### Platform-Specific Optimization
The system automatically optimizes for each platform:

- **Android**: Higher ad frequency, optimized for mobile
- **iOS**: Balanced frequency, optimized for iOS
- **WebGL**: Lower frequency, optimized for web

## 🔒 Security

### No API Keys Required
The system uses Unity's built-in ad system, so no external API keys are needed.

### Test Mode Safety
Always use test mode during development to avoid invalid ad requests.

### Production Checklist
Before going to production:

1. ✅ Set production mode: `-production`
2. ✅ Verify Game ID is correct
3. ✅ Test on target platforms
4. ✅ Monitor Unity Dashboard
5. ✅ Check revenue tracking

## 📞 Support

### Unity Ads Documentation
- [Unity Ads Documentation](https://docs.unity3d.com/Manual/UnityAds.html)
- [Unity Dashboard](https://operate.dashboard.unity3d.com/)

### Unity Forums
- [Unity Ads Forum](https://forum.unity.com/forums/unity-ads.67/)

### Unity Support
- [Unity Support](https://support.unity3d.com/)

## 🎯 Expected Results

With this setup, you should see:

- **Immediate Setup** - Works without Unity editor
- **Automatic Configuration** - No manual setup required
- **Revenue Tracking** - Complete analytics
- **Platform Support** - Android, iOS, WebGL
- **Test Mode** - Safe testing environment
- **Production Ready** - Easy production deployment

## 🚀 Next Steps

1. **Get Unity Dashboard Game ID** from https://operate.dashboard.unity3d.com/
2. **Run your game** with command line arguments
3. **Test ads** in test mode
4. **Deploy to production** when ready
5. **Monitor revenue** in Unity Dashboard

That's it! Your Unity Ads system is now fully automated and requires no Unity editor interaction.