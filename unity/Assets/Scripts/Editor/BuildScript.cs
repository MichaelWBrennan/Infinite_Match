using UnityEngine;
using UnityEditor;
using UnityEditor.Build.Reporting;
using System.IO;
using System.Linq;
using System;

namespace Evergreen.Editor
{
    /// <summary>
    /// Advanced Unity Build Script for CI/CD automation
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
                
                // Generate build info
                GenerateBuildInfo(buildPath, "Android");
                
                // Generate what's new file
                GenerateWhatsNew(buildPath);
                
                // Generate mapping file for crash reporting
                GenerateMappingFile(buildPath);
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
                
                // Generate build info
                GenerateBuildInfo(buildPath, "iOS");
                
                // Configure Xcode project
                ConfigureXcodeProject(buildPath);
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
            
            // Configure icons
            ConfigureAndroidIcons();
            
            // Configure splash screen
            ConfigureAndroidSplashScreen();
            
            // Configure permissions
            ConfigureAndroidPermissions();
            
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
            
            // Configure icons
            ConfigureiOSIcons();
            
            // Configure splash screen
            ConfigureiOSSplashScreen();
            
            // Configure capabilities
            ConfigureiOSCapabilities();
            
            Debug.Log("iOS settings configured successfully");
        }
        
        private static void ConfigureAndroidIcons()
        {
            // Configure Android icons
            PlayerSettings.Android.icon = Resources.Load<Texture2D>("Icons/AndroidIcon");
            
            // Set adaptive icons
            PlayerSettings.Android.adaptiveIconForeground = Resources.Load<Texture2D>("Icons/AndroidAdaptiveForeground");
            PlayerSettings.Android.adaptiveIconBackground = Resources.Load<Texture2D>("Icons/AndroidAdaptiveBackground");
        }
        
        private static void ConfigureiOSIcons()
        {
            // Configure iOS icons
            PlayerSettings.iOS.icon = Resources.Load<Texture2D>("Icons/iOSIcon");
        }
        
        private static void ConfigureAndroidSplashScreen()
        {
            // Configure Android splash screen
            PlayerSettings.Android.splashScreen = Resources.Load<Texture2D>("Splash/AndroidSplash");
            PlayerSettings.Android.splashScreenScale = AndroidSplashScreenScale.Center;
        }
        
        private static void ConfigureiOSSplashScreen()
        {
            // Configure iOS splash screen
            PlayerSettings.iOS.launchScreenType = iOSLaunchScreenType.CustomXib;
            PlayerSettings.iOS.launchScreenPortrait = Resources.Load<Texture2D>("Splash/iOSSplashPortrait");
            PlayerSettings.iOS.launchScreenLandscape = Resources.Load<Texture2D>("Splash/iOSSplashLandscape");
        }
        
        private static void ConfigureAndroidPermissions()
        {
            // Configure Android permissions
            PlayerSettings.Android.usesPermission.Add("android.permission.INTERNET");
            PlayerSettings.Android.usesPermission.Add("android.permission.ACCESS_NETWORK_STATE");
            PlayerSettings.Android.usesPermission.Add("android.permission.WRITE_EXTERNAL_STORAGE");
            PlayerSettings.Android.usesPermission.Add("android.permission.READ_EXTERNAL_STORAGE");
        }
        
        private static void ConfigureiOSCapabilities()
        {
            // Configure iOS capabilities
            PlayerSettings.iOS.appleDeveloperTeamID = "YOUR_TEAM_ID";
            PlayerSettings.iOS.appleEnableAutomaticSigning = true;
        }
        
        private static void ConfigureXcodeProject(string buildPath)
        {
            Debug.Log("Configuring Xcode project...");
            
            // Find Xcode project
            string[] xcodeProjects = Directory.GetFiles(buildPath, "*.xcodeproj", SearchOption.AllDirectories);
            if (xcodeProjects.Length == 0)
            {
                Debug.LogError("No Xcode project found!");
                return;
            }
            
            string xcodeProjectPath = xcodeProjects[0];
            Debug.Log($"Found Xcode project: {xcodeProjectPath}");
            
            // Additional Xcode configuration can be added here
            // This would typically involve modifying the project.pbxproj file
        }
        
        private static void GenerateBuildInfo(string buildPath, string platform)
        {
            Debug.Log($"Generating build info for {platform}...");
            
            string buildInfoPath = Path.Combine(buildPath, "build_info.json");
            string buildInfo = $@"{{
                ""platform"": ""{platform}"",
                ""version"": ""{Version}"",
                ""build_number"": {BuildNumber},
                ""build_date"": ""{DateTime.Now:yyyy-MM-dd HH:mm:ss}"",
                ""git_hash"": ""{GetGitHash()}"",
                ""unity_version"": ""{Application.unityVersion}"",
                ""build_target"": ""{EditorUserBuildSettings.activeBuildTarget}""
            }}";
            
            File.WriteAllText(buildInfoPath, buildInfo);
            Debug.Log($"Build info saved to: {buildInfoPath}");
        }
        
        private static void GenerateWhatsNew(string buildPath)
        {
            Debug.Log("Generating what's new file...");
            
            string whatsNewPath = Path.Combine(buildPath, "whatsnew");
            Directory.CreateDirectory(whatsNewPath);
            
            string[] languages = { "en-US", "es-ES", "fr-FR", "de-DE", "ja-JP", "ko-KR", "zh-CN" };
            
            foreach (string lang in languages)
            {
                string whatsNewFile = Path.Combine(whatsNewPath, $"{lang}.txt");
                string whatsNewContent = GetWhatsNewContent(lang);
                File.WriteAllText(whatsNewFile, whatsNewContent);
            }
            
            Debug.Log("What's new files generated successfully");
        }
        
        private static string GetWhatsNewContent(string language)
        {
            return language switch
            {
                "en-US" => $"What's New in Version {Version}:\n\n• New levels and challenges\n• Improved performance and stability\n• Bug fixes and optimizations\n• Enhanced visual effects\n• New social features",
                "es-ES" => $"Novedades en la Versión {Version}:\n\n• Nuevos niveles y desafíos\n• Mejor rendimiento y estabilidad\n• Correcciones de errores y optimizaciones\n• Efectos visuales mejorados\n• Nuevas funciones sociales",
                "fr-FR" => $"Nouveautés de la Version {Version}:\n\n• Nouveaux niveaux et défis\n• Amélioration des performances et de la stabilité\n• Corrections de bugs et optimisations\n• Effets visuels améliorés\n• Nouvelles fonctionnalités sociales",
                "de-DE" => $"Neu in Version {Version}:\n\n• Neue Level und Herausforderungen\n• Verbesserte Leistung und Stabilität\n• Fehlerbehebungen und Optimierungen\n• Verbesserte visuelle Effekte\n• Neue soziale Funktionen",
                "ja-JP" => $"バージョン{Version}の新機能:\n\n• 新しいレベルとチャレンジ\n• パフォーマンスと安定性の向上\n• バグ修正と最適化\n• 強化されたビジュアルエフェクト\n• 新しいソーシャル機能",
                "ko-KR" => $"버전 {Version}의 새로운 기능:\n\n• 새로운 레벨과 도전\n• 성능 및 안정성 개선\n• 버그 수정 및 최적화\n• 향상된 시각 효과\n• 새로운 소셜 기능",
                "zh-CN" => $"版本{Version}的新功能:\n\n• 新关卡和挑战\n• 改进的性能和稳定性\n• 错误修复和优化\n• 增强的视觉效果\n• 新的社交功能",
                _ => $"What's New in Version {Version}:\n\n• New levels and challenges\n• Improved performance and stability\n• Bug fixes and optimizations\n• Enhanced visual effects\n• New social features"
            };
        }
        
        private static void GenerateMappingFile(string buildPath)
        {
            Debug.Log("Generating mapping file...");
            
            // Find mapping file
            string[] mappingFiles = Directory.GetFiles(buildPath, "mapping.txt", SearchOption.AllDirectories);
            if (mappingFiles.Length > 0)
            {
                string mappingFile = mappingFiles[0];
                string mappingPath = Path.Combine(buildPath, "mapping.txt");
                File.Copy(mappingFile, mappingPath, true);
                Debug.Log($"Mapping file copied to: {mappingPath}");
            }
            else
            {
                Debug.LogWarning("No mapping file found");
            }
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
            string buildNumberStr = Environment.GetEnvironmentVariable("BUILD_NUMBER");
            if (int.TryParse(buildNumberStr, out int buildNumber))
            {
                return buildNumber;
            }
            
            // Generate build number based on current time
            return int.Parse(DateTime.Now.ToString("yyyyMMddHHmm"));
        }
        
        private static string GetGitHash()
        {
            // Get git hash from environment variable or return default
            string gitHash = Environment.GetEnvironmentVariable("GIT_HASH");
            return !string.IsNullOrEmpty(gitHash) ? gitHash : "unknown";
        }
    }
}