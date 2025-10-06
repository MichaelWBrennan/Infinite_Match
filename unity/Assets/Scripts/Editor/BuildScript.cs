using UnityEngine;
using UnityEditor;
using UnityEditor.Build.Reporting;
using System.IO;
using System.Linq;

namespace Evergreen.Editor
{
    /// <summary>
    /// Unity Build Script for CI/CD automation
    /// Handles Android and iOS builds with comprehensive configuration
    /// </summary>
    public static class BuildScript
    {
        // Build configuration
        private static readonly string[] Scenes = FindEnabledEditorScenes();
        private static readonly string BuildPath = "build";
        private static readonly string AndroidBuildPath = Path.Combine(BuildPath, "Android");
        private static readonly string iOSBuildPath = Path.Combine(BuildPath, "iOS");
        
        // Version information
        private static string Version => PlayerSettings.bundleVersion;
        private static int BuildNumber => GetBuildNumber();
        
        /// <summary>
        /// Build Android APK/AAB
        /// </summary>
        [MenuItem("Build/Android APK")]
        public static void BuildAndroidAPK()
        {
            BuildAndroid(BuildTarget.Android, AndroidBuildPath, ".apk");
        }
        
        /// <summary>
        /// Build Android AAB (Google Play)
        /// </summary>
        [MenuItem("Build/Android AAB")]
        public static void BuildAndroidAAB()
        {
            BuildAndroid(BuildTarget.Android, AndroidBuildPath, ".aab");
        }
        
        /// <summary>
        /// Build iOS
        /// </summary>
        [MenuItem("Build/iOS")]
        public static void BuildiOS()
        {
            BuildiOS(iOSBuildPath);
        }
        
        /// <summary>
        /// Build All Platforms
        /// </summary>
        [MenuItem("Build/All Platforms")]
        public static void BuildAll()
        {
            BuildAndroidAPK();
            BuildAndroidAAB();
            BuildiOS();
        }
        
        /// <summary>
        /// CI/CD Android Build
        /// </summary>
        public static void BuildAndroid()
        {
            Debug.Log("Starting Android build for CI/CD...");
            
            // Configure Android settings
            ConfigureAndroidSettings();
            
            // Build AAB for Google Play
            BuildAndroid(BuildTarget.Android, AndroidBuildPath, ".aab");
            
            Debug.Log("Android build completed successfully!");
        }
        
        /// <summary>
        /// CI/CD iOS Build
        /// </summary>
        public static void BuildiOS()
        {
            Debug.Log("Starting iOS build for CI/CD...");
            
            // Configure iOS settings
            ConfigureiOSSettings();
            
            // Build iOS
            BuildiOS(iOSBuildPath);
            
            Debug.Log("iOS build completed successfully!");
        }
        
        private static void BuildAndroid(BuildTarget target, string buildPath, string extension)
        {
            Debug.Log($"Building Android {extension}...");
            
            // Create build directory
            if (Directory.Exists(buildPath))
            {
                Directory.Delete(buildPath, true);
            }
            Directory.CreateDirectory(buildPath);
            
            // Configure build settings
            EditorUserBuildSettings.buildAppBundle = extension == ".aab";
            EditorUserBuildSettings.androidBuildSystem = AndroidBuildSystem.Gradle;
            
            // Set build options
            BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions
            {
                scenes = Scenes,
                locationPathName = Path.Combine(buildPath, $"EvergreenMatch3{extension}"),
                target = target,
                options = BuildOptions.None
            };
            
            // Build
            BuildReport report = BuildPipeline.BuildPlayer(buildPlayerOptions);
            BuildSummary summary = report.summary;
            
            if (summary.result == BuildResult.Succeeded)
            {
                Debug.Log($"Android build succeeded: {summary.totalSize} bytes");
            }
            else
            {
                Debug.LogError($"Android build failed: {summary.result}");
                EditorApplication.Exit(1);
            }
        }
        
        private static void BuildiOS(string buildPath)
        {
            Debug.Log("Building iOS...");
            
            // Create build directory
            if (Directory.Exists(buildPath))
            {
                Directory.Delete(buildPath, true);
            }
            Directory.CreateDirectory(buildPath);
            
            // Set build options
            BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions
            {
                scenes = Scenes,
                locationPathName = buildPath,
                target = BuildTarget.iOS,
                options = BuildOptions.None
            };
            
            // Build
            BuildReport report = BuildPipeline.BuildPlayer(buildPlayerOptions);
            BuildSummary summary = report.summary;
            
            if (summary.result == BuildResult.Succeeded)
            {
                Debug.Log($"iOS build succeeded: {summary.totalSize} bytes");
            }
            else
            {
                Debug.LogError($"iOS build failed: {summary.result}");
                EditorApplication.Exit(1);
            }
        }
        
        private static void ConfigureAndroidSettings()
        {
            Debug.Log("Configuring Android settings...");
            
            // Set Android settings
            PlayerSettings.Android.bundleVersionCode = BuildNumber;
            PlayerSettings.bundleVersion = Version;
            PlayerSettings.Android.targetSdkVersion = AndroidSdkVersions.AndroidApiLevel34;
            PlayerSettings.Android.minSdkVersion = AndroidSdkVersions.AndroidApiLevel21;
            
            // Configure graphics
            PlayerSettings.SetGraphicsAPIs(BuildTarget.Android, new UnityEngine.Rendering.GraphicsDeviceType[] 
            {
                UnityEngine.Rendering.GraphicsDeviceType.Vulkan,
                UnityEngine.Rendering.GraphicsDeviceType.OpenGLES3
            });
            
            // Configure scripting backend
            PlayerSettings.SetScriptingBackend(BuildTargetGroup.Android, ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64;
            
            // Configure compression
            PlayerSettings.Android.compressionOption = MobileTextureSubtarget.ASTC;
            PlayerSettings.Android.preferredInstallLocation = AndroidPreferredInstallLocation.Auto;
            
            // Configure keystore
            PlayerSettings.Android.keystoreName = "user.keystore";
            PlayerSettings.Android.keyaliasName = "user";
            
            Debug.Log("Android settings configured successfully");
        }
        
        private static void ConfigureiOSSettings()
        {
            Debug.Log("Configuring iOS settings...");
            
            // Set iOS settings
            PlayerSettings.iOS.buildNumber = BuildNumber.ToString();
            PlayerSettings.bundleVersion = Version;
            PlayerSettings.iOS.targetOSVersionString = "12.0";
            
            // Configure graphics
            PlayerSettings.SetGraphicsAPIs(BuildTarget.iOS, new UnityEngine.Rendering.GraphicsDeviceType[] 
            {
                UnityEngine.Rendering.GraphicsDeviceType.Metal
            });
            
            // Configure scripting backend
            PlayerSettings.SetScriptingBackend(BuildTargetGroup.iOS, ScriptingImplementation.IL2CPP);
            PlayerSettings.iOS.targetDevice = iOSTargetDevice.iPhoneAndiPad;
            
            // Configure compression
            PlayerSettings.iOS.compressionOption = MobileTextureSubtarget.ASTC;
            
            Debug.Log("iOS settings configured successfully");
        }
        
        private static string[] FindEnabledEditorScenes()
        {
            return EditorBuildSettings.scenes
                .Where(scene => scene.enabled)
                .Select(scene => scene.path)
                .ToArray();
        }
        
        private static int GetBuildNumber()
        {
            // Get build number from environment variable or generate one
            string buildNumberStr = System.Environment.GetEnvironmentVariable("BUILD_NUMBER");
            if (int.TryParse(buildNumberStr, out int buildNumber))
            {
                return buildNumber;
            }
            
            // Generate build number based on current time
            return int.Parse(System.DateTime.Now.ToString("yyyyMMddHHmm"));
        }
    }
}