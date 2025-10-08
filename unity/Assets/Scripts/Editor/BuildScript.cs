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
            
            string buildPath = Path.Combine(BuildPath, "Android", $"{ProductName}.apk");
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
            
            // Android specific settings
            PlayerSettings.Android.targetSdkVersion = AndroidSdkVersions.AndroidApiLevel34;
            PlayerSettings.Android.minSdkVersion = AndroidSdkVersions.AndroidApiLevel21;
            PlayerSettings.Android.bundleVersionCode = GetBuildNumber();
            PlayerSettings.Android.keystoreName = "user.keystore";
            PlayerSettings.Android.keyaliasName = "user";
            
            // Set package name
            PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.Android, "com.evergreen.match3");
        }

        private static void SetiOSSettings()
        {
            PlayerSettings.SetScriptingBackend(BuildTargetGroup.iOS, ScriptingImplementation.IL2CPP);
            PlayerSettings.SetApiCompatibilityLevel(BuildTargetGroup.iOS, ApiCompatibilityLevel.NET_Standard_2_1);
            PlayerSettings.stripEngineCode = !IsDevelopmentBuild();
            
            // iOS specific settings
            PlayerSettings.iOS.buildNumber = GetBuildNumber().ToString();
            PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.iOS, "com.evergreen.match3");
            PlayerSettings.iOS.targetOSVersionString = "12.0";
            PlayerSettings.iOS.sdkVersion = iOSSdkVersion.DeviceSDK;
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