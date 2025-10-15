using UnityEngine;
using UnityEditor;
using UnityEditor.Build.Reporting;
using System.IO;
using System;

namespace Evergreen.Editor
{
    /// <summary>
    /// Unity build script for headless builds via GitHub Actions
    /// This script handles building for all supported platforms
    /// </summary>
    public static class BuildScript
    {
        private static readonly string[] Scenes = {
            "Assets/Scenes/Bootstrap.unity",
            "Assets/Scenes/MainMenu.unity",
            "Assets/Scenes/Gameplay.unity"
        };

        private static readonly string BuildPath = "build";
        private static readonly string ProductName = "EvergreenPuzzler";
        private static readonly string CompanyName = "Evergreen";

        [MenuItem("Build/Build All Platforms")]
        public static void BuildAllPlatforms()
        {
            Debug.Log("Starting build for all platforms...");
            
            // Set common build settings
            SetCommonBuildSettings();
            
            // Build each platform
            BuildWindows();
            BuildLinux();
            BuildWebGL();
            BuildAndroid();
            BuildiOS();
            
            Debug.Log("All platform builds completed!");
        }

        [MenuItem("Build/Build Windows")]
        public static void BuildWindows()
        {
            Debug.Log("Building for Windows...");
            
            SetCommonBuildSettings();
            SetWindowsSettings();
            
            string buildPath = Path.Combine(BuildPath, "Windows", $"{ProductName}.exe");
            BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions
            {
                scenes = Scenes,
                locationPathName = buildPath,
                target = BuildTarget.StandaloneWindows64,
                options = BuildOptions.None
            };

            BuildReport report = BuildPipeline.BuildPlayer(buildPlayerOptions);
            HandleBuildResult(report, "Windows");
        }

        [MenuItem("Build/Build Linux")]
        public static void BuildLinux()
        {
            Debug.Log("Building for Linux...");
            
            SetCommonBuildSettings();
            SetLinuxSettings();
            
            string buildPath = Path.Combine(BuildPath, "Linux", $"{ProductName}.x86_64");
            BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions
            {
                scenes = Scenes,
                locationPathName = buildPath,
                target = BuildTarget.StandaloneLinux64,
                options = BuildOptions.None
            };

            BuildReport report = BuildPipeline.BuildPlayer(buildPlayerOptions);
            HandleBuildResult(report, "Linux");
        }

        [MenuItem("Build/Build WebGL")]
        public static void BuildWebGL()
        {
            Debug.Log("Building for WebGL...");
            
            SetCommonBuildSettings();
            SetWebGLSettings();
            
            string buildPath = Path.Combine(BuildPath, "WebGL");
            BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions
            {
                scenes = Scenes,
                locationPathName = buildPath,
                target = BuildTarget.WebGL,
                options = BuildOptions.None
            };

            BuildReport report = BuildPipeline.BuildPlayer(buildPlayerOptions);
            HandleBuildResult(report, "WebGL");
        }

        [MenuItem("Build/Build Android")]
        public static void BuildAndroid()
        {
            Debug.Log("Building for Android...");
            
            SetCommonBuildSettings();
            SetAndroidSettings();
            
            string buildPath = Path.Combine(BuildPath, "Android", $"{ProductName}.aab");
            BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions
            {
                scenes = Scenes,
                locationPathName = buildPath,
                target = BuildTarget.Android,
                options = BuildOptions.None
            };

            BuildReport report = BuildPipeline.BuildPlayer(buildPlayerOptions);
            HandleBuildResult(report, "Android");
        }

        [MenuItem("Build/Build iOS")]
        public static void BuildiOS()
        {
            Debug.Log("Building for iOS...");
            
            SetCommonBuildSettings();
            SetiOSSettings();
            
            string buildPath = Path.Combine(BuildPath, "iOS");
            BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions
            {
                scenes = Scenes,
                locationPathName = buildPath,
                target = BuildTarget.iOS,
                options = BuildOptions.None
            };

            BuildReport report = BuildPipeline.BuildPlayer(buildPlayerOptions);
            HandleBuildResult(report, "iOS");
        }

        private static void SetCommonBuildSettings()
        {
            // Set common player settings
            PlayerSettings.companyName = CompanyName;
            PlayerSettings.productName = ProductName;
            PlayerSettings.bundleVersion = GetVersion();
            PlayerSettings.Android.bundleVersionCode = GetBuildNumber();
            PlayerSettings.iOS.buildNumber = GetBuildNumber().ToString();
            
            // Set common build settings
            EditorUserBuildSettings.development = IsDevelopmentBuild();
            EditorUserBuildSettings.allowDebugging = IsDevelopmentBuild();
            EditorUserBuildSettings.connectProfiler = IsDevelopmentBuild();
            
            Debug.Log($"Build Settings - Version: {GetVersion()}, Build: {GetBuildNumber()}, Development: {IsDevelopmentBuild()}");
        }

        private static void SetWindowsSettings()
        {
            PlayerSettings.SetScriptingBackend(BuildTargetGroup.Standalone, ScriptingImplementation.Mono);
            PlayerSettings.SetApiCompatibilityLevel(BuildTargetGroup.Standalone, ApiCompatibilityLevel.NET_Standard_2_1);
            PlayerSettings.stripEngineCode = !IsDevelopmentBuild();
        }

        private static void SetLinuxSettings()
        {
            PlayerSettings.SetScriptingBackend(BuildTargetGroup.Standalone, ScriptingImplementation.Mono);
            PlayerSettings.SetApiCompatibilityLevel(BuildTargetGroup.Standalone, ApiCompatibilityLevel.NET_Standard_2_1);
            PlayerSettings.stripEngineCode = !IsDevelopmentBuild();
        }

        private static void SetWebGLSettings()
        {
            PlayerSettings.SetScriptingBackend(BuildTargetGroup.WebGL, ScriptingImplementation.IL2CPP);
            PlayerSettings.SetApiCompatibilityLevel(BuildTargetGroup.WebGL, ApiCompatibilityLevel.NET_Standard_2_1);
            PlayerSettings.stripEngineCode = !IsDevelopmentBuild();
            
            // WebGL specific settings
            PlayerSettings.WebGL.dataCaching = true;
            PlayerSettings.WebGL.memorySize = 256;
            PlayerSettings.WebGL.exceptionSupport = WebGLExceptionSupport.ExplicitlyThrownExceptionsOnly;
            PlayerSettings.WebGL.nameFilesAsHashes = true;
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Gzip;
        }

        private static void SetAndroidSettings()
        {
            PlayerSettings.SetScriptingBackend(BuildTargetGroup.Android, ScriptingImplementation.IL2CPP);
            PlayerSettings.SetApiCompatibilityLevel(BuildTargetGroup.Android, ApiCompatibilityLevel.NET_Standard_2_1);
            PlayerSettings.stripEngineCode = !IsDevelopmentBuild();
            
            // Android specific settings for Google Play Store compliance
            PlayerSettings.Android.targetSdkVersion = AndroidSdkVersions.AndroidApiLevel34; // Required for 2024
            PlayerSettings.Android.minSdkVersion = AndroidSdkVersions.AndroidApiLevel21; // Android 5.0+
            PlayerSettings.Android.bundleVersionCode = GetBuildNumber();
            
            // Keystore configuration (use environment variables for CI)
            string keystoreName = Environment.GetEnvironmentVariable("KEYSTORE_NAME") ?? "user.keystore";
            string keyaliasName = Environment.GetEnvironmentVariable("KEYALIAS_NAME") ?? "user";
            PlayerSettings.Android.keystoreName = keystoreName;
            PlayerSettings.Android.keyaliasName = keyaliasName;
            
            // Set package name
            PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.Android, "com.evergreen.match3");
            
            // Google Play Store compliance settings
            PlayerSettings.Android.useCustomKeystore = true;
            PlayerSettings.Android.keystorePass = Environment.GetEnvironmentVariable("KEYSTORE_PASS") ?? "";
            PlayerSettings.Android.keyaliasPass = Environment.GetEnvironmentVariable("KEYALIAS_PASS") ?? "";
            
            // App Bundle settings (required for Google Play)
            EditorUserBuildSettings.buildAppBundle = true;
            EditorUserBuildSettings.androidBuildSystem = AndroidBuildSystem.Gradle;
            
            // Performance and compatibility settings
            PlayerSettings.Android.preferredInstallLocation = AndroidPreferredInstallLocation.Auto;
            PlayerSettings.Android.forceInternetPermission = true;
            PlayerSettings.Android.forceSDCardPermission = false;
            PlayerSettings.Android.useCustomMainManifest = true;
            PlayerSettings.Android.useCustomLauncherManifest = false;
            PlayerSettings.Android.useCustomMainGradleTemplate = false;
            PlayerSettings.Android.useCustomLauncherGradleManifest = false;
            PlayerSettings.Android.useCustomBaseGradleTemplate = false;
            PlayerSettings.Android.useCustomGradlePropertiesTemplate = false;
            PlayerSettings.Android.useCustomGradleSettingsTemplate = false;
            
            // Graphics and rendering
            PlayerSettings.Android.blitType = AndroidBlitType.Never;
            PlayerSettings.Android.muteOtherAudioSources = false;
            PlayerSettings.Android.androidSplashScreenScale = AndroidSplashScreenScale.Center;
            PlayerSettings.Android.androidUseSwappy = true;
            PlayerSettings.Android.androidUseCustomKeystore = true;
            
            // Security settings
            PlayerSettings.Android.androidTVCompatibility = false;
            PlayerSettings.Android.chromeosInputEmulation = false;
            PlayerSettings.Android.androidIsGame = true;
            PlayerSettings.Android.androidEnableTango = false;
            PlayerSettings.Android.androidEnableBanner = false;
            PlayerSettings.Android.androidUseLowAccuracyLocation = false;
            PlayerSettings.Android.androidUseCustomKeystore = true;
            
            // Splash screen
            PlayerSettings.Android.splashScreenScale = AndroidSplashScreenScale.Center;
            PlayerSettings.Android.showActivityIndicatorOnStart = true;
            PlayerSettings.Android.activityIndicatorStyle = AndroidActivityIndicatorStyle.Large;
            
            // Debugging (disabled for release)
            PlayerSettings.Android.useCustomKeystore = !IsDevelopmentBuild();
            PlayerSettings.Android.keystorePass = IsDevelopmentBuild() ? "" : Environment.GetEnvironmentVariable("KEYSTORE_PASS") ?? "";
            PlayerSettings.Android.keyaliasPass = IsDevelopmentBuild() ? "" : Environment.GetEnvironmentVariable("KEYALIAS_PASS") ?? "";
        }

        private static void SetiOSSettings()
        {
            PlayerSettings.SetScriptingBackend(BuildTargetGroup.iOS, ScriptingImplementation.IL2CPP);
            PlayerSettings.SetApiCompatibilityLevel(BuildTargetGroup.iOS, ApiCompatibilityLevel.NET_Standard_2_1);
            PlayerSettings.stripEngineCode = !IsDevelopmentBuild();
            
            // iOS specific settings for App Store compliance
            PlayerSettings.iOS.buildNumber = GetBuildNumber().ToString();
            PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.iOS, "com.evergreen.match3");
            PlayerSettings.iOS.targetOSVersionString = "12.0"; // iOS 12.0+ support
            PlayerSettings.iOS.sdkVersion = iOSSdkVersion.DeviceSDK;
            
            // App Store compliance settings
            PlayerSettings.iOS.appleDeveloperTeamID = Environment.GetEnvironmentVariable("APPLE_TEAM_ID") ?? "";
            PlayerSettings.iOS.appleEnableAutomaticSigning = true;
            PlayerSettings.iOS.iOSManualProvisioningProfileID = Environment.GetEnvironmentVariable("PROVISIONING_PROFILE_ID") ?? "";
            PlayerSettings.iOS.iOSManualProvisioningProfileType = ProvisioningProfileType.Distribution;
            
            // Bundle settings
            PlayerSettings.iOS.bundleVersion = GetVersion();
            PlayerSettings.iOS.shortBundleVersion = GetVersion();
            
            // App Store optimization
            PlayerSettings.iOS.privacyDescription = "This app uses data to provide personalized gaming experience and analytics.";
            PlayerSettings.iOS.requiresFullScreen = false;
            PlayerSettings.iOS.statusBarHidden = false;
            PlayerSettings.iOS.statusBarStyle = iOSStatusBarStyle.Default;
            
            // Performance and compatibility
            PlayerSettings.iOS.scriptingBackend = ScriptingImplementation.IL2CPP;
            PlayerSettings.iOS.targetDevice = iOSTargetDevice.iPhoneAndiPad;
            PlayerSettings.iOS.sdkVersion = iOSSdkVersion.DeviceSDK;
            PlayerSettings.iOS.targetOSVersionString = "12.0";
            
            // Graphics and rendering
            PlayerSettings.iOS.appleTVSplashScreen = null;
            PlayerSettings.iOS.appleTVSplashScreen2x = null;
            PlayerSettings.iOS.iPadSplashScreen = null;
            PlayerSettings.iOS.iPadSplashScreen2x = null;
            PlayerSettings.iOS.iPhoneSplashScreen = null;
            PlayerSettings.iOS.iPhoneSplashScreen2x = null;
            PlayerSettings.iOS.iPhoneSplashScreen640x960 = null;
            PlayerSettings.iOS.iPhoneSplashScreen640x1136 = null;
            PlayerSettings.iOS.iPhoneSplashScreen750x1334 = null;
            PlayerSettings.iOS.iPhoneSplashScreen1125x2436 = null;
            PlayerSettings.iOS.iPhoneSplashScreen1242x2208 = null;
            PlayerSettings.iOS.iPhoneSplashScreen2436x1125 = null;
            PlayerSettings.iOS.iPhoneSplashScreen2688x1242 = null;
            PlayerSettings.iOS.iPhoneSplashScreen1792x828 = null;
            
            // Security and privacy
            PlayerSettings.iOS.allowHTTPDownload = false;
            PlayerSettings.iOS.allowHTTPDownloadInHTTPS = false;
            PlayerSettings.iOS.allowHTTPDownloadInHTTPSStreamingAsset = false;
            PlayerSettings.iOS.allowHTTPDownloadInHTTPSWebGL = false;
            
            // App Store Connect
            PlayerSettings.iOS.appleEnableAutomaticSigning = true;
            PlayerSettings.iOS.appleDeveloperTeamID = Environment.GetEnvironmentVariable("APPLE_TEAM_ID") ?? "";
            
            // Game Center and In-App Purchase
            PlayerSettings.iOS.allowDownloadsOverCellular = false;
            PlayerSettings.iOS.allowDownloadsOverCellularInHTTPS = false;
            
            // Background modes
            PlayerSettings.iOS.backgroundModes = iOSBackgroundMode.BackgroundFetch | iOSBackgroundMode.BackgroundProcessing;
            
            // Push notifications
            PlayerSettings.iOS.remoteNotificationSupport = true;
            
            // Camera and microphone
            PlayerSettings.iOS.cameraUsageDescription = "This app uses the camera to scan QR codes for special features.";
            PlayerSettings.iOS.microphoneUsageDescription = "This app uses the microphone for voice commands and audio features.";
            
            // Location services
            PlayerSettings.iOS.locationUsageDescription = "This app uses location data to provide personalized game content and analytics.";
            
            // Photo library
            PlayerSettings.iOS.photoLibraryUsageDescription = "This app accesses your photo library to save and share game screenshots.";
            
            // Contacts
            PlayerSettings.iOS.contactsUsageDescription = "This app accesses your contacts to find friends who also play the game.";
            
            // Calendar
            PlayerSettings.iOS.calendarsUsageDescription = "This app accesses your calendar to schedule game reminders and events.";
            
            // Reminders
            PlayerSettings.iOS.remindersUsageDescription = "This app accesses your reminders to set game-related notifications.";
            
            // Motion
            PlayerSettings.iOS.motionUsageDescription = "This app uses motion data to enhance gameplay with device movement.";
            
            // Health
            PlayerSettings.iOS.healthShareUsageDescription = "This app accesses health data to provide wellness-related game features.";
            PlayerSettings.iOS.healthUpdateUsageDescription = "This app updates health data to track gaming activity and wellness.";
            
            // Bluetooth
            PlayerSettings.iOS.bluetoothUsageDescription = "This app uses Bluetooth to connect with other players and accessories.";
            
            // Local network
            PlayerSettings.iOS.localNetworkUsageDescription = "This app uses the local network to discover nearby players and features.";
            
            // User tracking (iOS 14.5+)
            PlayerSettings.iOS.userTrackingUsageDescription = "This app uses tracking data to provide personalized content and improve your gaming experience.";
            
            // App Transport Security
            PlayerSettings.iOS.allowHTTPDownload = false;
            PlayerSettings.iOS.allowHTTPDownloadInHTTPS = false;
            
            // Scene configuration
            PlayerSettings.iOS.supportsMultipleScenes = false;
            
            // Accessibility
            PlayerSettings.iOS.accessibilityUsageDescription = "This app uses accessibility features to provide an inclusive gaming experience.";
            
            // App Store Review Guidelines compliance
            PlayerSettings.iOS.requiresFullScreen = false;
            PlayerSettings.iOS.statusBarHidden = false;
            PlayerSettings.iOS.statusBarStyle = iOSStatusBarStyle.Default;
            
            // Unity Services
            PlayerSettings.iOS.cloudProjectId = Environment.GetEnvironmentVariable("UNITY_CLOUD_PROJECT_ID") ?? "";
            PlayerSettings.iOS.cloudServicesEnabled = true;
            
            // Build settings
            PlayerSettings.iOS.developmentTeam = Environment.GetEnvironmentVariable("APPLE_TEAM_ID") ?? "";
            PlayerSettings.iOS.iOSManualProvisioningProfileID = Environment.GetEnvironmentVariable("PROVISIONING_PROFILE_ID") ?? "";
            PlayerSettings.iOS.iOSManualProvisioningProfileType = ProvisioningProfileType.Distribution;
        }

        private static void HandleBuildResult(BuildReport report, string platform)
        {
            if (report.summary.result == BuildResult.Succeeded)
            {
                Debug.Log($"✅ {platform} build succeeded!");
                Debug.Log($"Build size: {report.summary.totalSize / (1024 * 1024)} MB");
                Debug.Log($"Build time: {report.summary.totalTime.TotalMinutes:F2} minutes");
            }
            else
            {
                Debug.LogError($"❌ {platform} build failed!");
                Debug.LogError($"Build result: {report.summary.result}");
                
                // Log build errors
                foreach (var step in report.steps)
                {
                    foreach (var message in step.messages)
                    {
                        if (message.type == LogType.Error || message.type == LogType.Exception)
                        {
                            Debug.LogError($"[{platform}] {message.content}");
                        }
                    }
                }
                
                // Exit with error code for CI
                EditorApplication.Exit(1);
            }
        }

        private static string GetVersion()
        {
            // Try to get version from environment variable (CI)
            string version = Environment.GetEnvironmentVariable("VERSION");
            if (!string.IsNullOrEmpty(version))
            {
                return version;
            }
            
            // Fallback to current version in project settings
            return PlayerSettings.bundleVersion;
        }

        private static int GetBuildNumber()
        {
            // Try to get build number from environment variable (CI)
            string buildNumber = Environment.GetEnvironmentVariable("BUILD_NUMBER");
            if (!string.IsNullOrEmpty(buildNumber) && int.TryParse(buildNumber, out int result))
            {
                return result;
            }
            
            // Fallback to current build number
            return PlayerSettings.Android.bundleVersionCode;
        }

        private static bool IsDevelopmentBuild()
        {
            // Check environment variable for build type
            string buildType = Environment.GetEnvironmentVariable("BUILD_TYPE");
            return buildType == "development";
        }

        // Command line entry points for CI
        [MenuItem("Build/CI Build Windows")]
        public static void CIBuildWindows()
        {
            Debug.Log("CI Build Windows started...");
            BuildWindows();
        }

        [MenuItem("Build/CI Build Linux")]
        public static void CIBuildLinux()
        {
            Debug.Log("CI Build Linux started...");
            BuildLinux();
        }

        [MenuItem("Build/CI Build WebGL")]
        public static void CIBuildWebGL()
        {
            Debug.Log("CI Build WebGL started...");
            BuildWebGL();
        }

        [MenuItem("Build/CI Build Android")]
        public static void CIBuildAndroid()
        {
            Debug.Log("CI Build Android started...");
            BuildAndroid();
        }

        [MenuItem("Build/CI Build iOS")]
        public static void CIBuildiOS()
        {
            Debug.Log("CI Build iOS started...");
            BuildiOS();
        }
    }
}