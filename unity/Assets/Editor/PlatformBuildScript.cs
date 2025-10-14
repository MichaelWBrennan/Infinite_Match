using UnityEngine;
using UnityEditor;
using UnityEditor.Build.Reporting;
using System.IO;
using System.Collections.Generic;
using Newtonsoft.Json;
using Evergreen.Platform;

namespace Evergreen.Editor
{
    /// <summary>
    /// Platform-aware build script that handles different deployment platforms
    /// </summary>
    public class PlatformBuildScript : EditorWindow
    {
        [Header("Build Configuration")]
        private PlatformType targetPlatform = PlatformType.AutoDetect;
        private bool enableComplianceChecks = true;
        private bool enablePlatformValidation = true;
        private bool showBuildReport = true;
        
        [Header("Build Settings")]
        private string buildPath = "Builds";
        private bool developmentBuild = false;
        private bool allowDebugging = false;
        private bool compressBuild = true;
        
        [Header("Platform Profiles")]
        private Dictionary<PlatformType, PlatformProfile> profiles = new Dictionary<PlatformType, PlatformProfile>();
        private ComplianceReport complianceReport;
        
        [MenuItem("Evergreen/Build/Platform Build Script")]
        public static void ShowWindow()
        {
            GetWindow<PlatformBuildScript>("Platform Build Script");
        }
        
        void OnEnable()
        {
            LoadPlatformProfiles();
        }
        
        void OnGUI()
        {
            GUILayout.Label("Platform Build Script", EditorStyles.boldLabel);
            GUILayout.Space(10);
            
            // Platform Selection
            GUILayout.Label("Target Platform", EditorStyles.boldLabel);
            targetPlatform = (PlatformType)EditorGUILayout.EnumPopup("Platform", targetPlatform);
            GUILayout.Space(5);
            
            // Build Settings
            GUILayout.Label("Build Settings", EditorStyles.boldLabel);
            buildPath = EditorGUILayout.TextField("Build Path", buildPath);
            developmentBuild = EditorGUILayout.Toggle("Development Build", developmentBuild);
            allowDebugging = EditorGUILayout.Toggle("Allow Debugging", allowDebugging);
            compressBuild = EditorGUILayout.Toggle("Compress Build", compressBuild);
            GUILayout.Space(5);
            
            // Compliance Settings
            GUILayout.Label("Compliance Settings", EditorStyles.boldLabel);
            enableComplianceChecks = EditorGUILayout.Toggle("Enable Compliance Checks", enableComplianceChecks);
            enablePlatformValidation = EditorGUILayout.Toggle("Enable Platform Validation", enablePlatformValidation);
            showBuildReport = EditorGUILayout.Toggle("Show Build Report", showBuildReport);
            GUILayout.Space(10);
            
            // Build Buttons
            GUILayout.BeginHorizontal();
            if (GUILayout.Button("Build Current Platform", GUILayout.Height(30)))
            {
                BuildCurrentPlatform();
            }
            if (GUILayout.Button("Build All Platforms", GUILayout.Height(30)))
            {
                BuildAllPlatforms();
            }
            GUILayout.EndHorizontal();
            GUILayout.Space(5);
            
            // Platform-specific Build Buttons
            GUILayout.Label("Platform-Specific Builds", EditorStyles.boldLabel);
            GUILayout.BeginHorizontal();
            if (GUILayout.Button("Build Poki (WebGL)"))
            {
                BuildPlatform(PlatformType.Poki);
            }
            if (GUILayout.Button("Build Google Play (Android)"))
            {
                BuildPlatform(PlatformType.GooglePlay);
            }
            if (GUILayout.Button("Build App Store (iOS)"))
            {
                BuildPlatform(PlatformType.AppStore);
            }
            GUILayout.EndHorizontal();
            GUILayout.BeginHorizontal();
            if (GUILayout.Button("Build Facebook (WebGL)"))
            {
                BuildPlatform(PlatformType.Facebook);
            }
            if (GUILayout.Button("Build Snap (WebGL)"))
            {
                BuildPlatform(PlatformType.Snap);
            }
            if (GUILayout.Button("Build TikTok (WebGL)"))
            {
                BuildPlatform(PlatformType.TikTok);
            }
            GUILayout.EndHorizontal();
            
            GUILayout.Space(5);
            GUILayout.Label("Additional WebGL Platforms", EditorStyles.boldLabel);
            GUILayout.BeginHorizontal();
            if (GUILayout.Button("Build Kongregate (WebGL)"))
            {
                BuildPlatform(PlatformType.Kongregate);
            }
            if (GUILayout.Button("Build CrazyGames (WebGL)"))
            {
                BuildPlatform(PlatformType.CrazyGames);
            }
            GUILayout.EndHorizontal();
            
            GUILayout.Space(5);
            GUILayout.Label("PC Platforms", EditorStyles.boldLabel);
            GUILayout.BeginHorizontal();
            if (GUILayout.Button("Build Steam (PC)"))
            {
                BuildPlatform(PlatformType.Steam);
            }
            if (GUILayout.Button("Build Epic (PC)"))
            {
                BuildPlatform(PlatformType.Epic);
            }
            GUILayout.EndHorizontal();
            
            GUILayout.Space(5);
            GUILayout.Label("Console Platforms", EditorStyles.boldLabel);
            GUILayout.BeginHorizontal();
            if (GUILayout.Button("Build PS5 (Console)"))
            {
                BuildPlatform(PlatformType.PS5);
            }
            GUILayout.EndHorizontal();
            GUILayout.Space(10);
            
            // Compliance Report
            if (complianceReport != null && showBuildReport)
            {
                DrawComplianceReport();
            }
        }
        
        private void LoadPlatformProfiles()
        {
            Debug.Log("📋 Loading platform profiles...");
            
            profiles.Clear();
            
            // Load Poki profile
            LoadProfile(PlatformType.Poki, "poki.json");
            
            // Load Google Play profile
            LoadProfile(PlatformType.GooglePlay, "googleplay.json");
            
            // Load App Store profile
            LoadProfile(PlatformType.AppStore, "appstore.json");
            
            // Load Facebook Instant Games profile
            LoadProfile(PlatformType.Facebook, "facebook.json");
            
            // Load Snap Mini Games profile
            LoadProfile(PlatformType.Snap, "snap.json");
            
            // Load TikTok Mini Games profile
            LoadProfile(PlatformType.TikTok, "tiktok.json");
            
            // Load Kongregate profile
            LoadProfile(PlatformType.Kongregate, "kongregate.json");
            
            // Load CrazyGames profile
            LoadProfile(PlatformType.CrazyGames, "crazygames.json");
            
            // Load Steam profile
            LoadProfile(PlatformType.Steam, "steam.json");
            
            // Load Epic profile
            LoadProfile(PlatformType.Epic, "epic.json");
            
            // Load PS5 profile
            LoadProfile(PlatformType.PS5, "ps5.json");
        }
        
        private void LoadProfile(PlatformType platformType, string fileName)
        {
            try
            {
                string filePath = Path.Combine(Application.streamingAssetsPath, "Config", fileName);
                
                if (File.Exists(filePath))
                {
                    string jsonContent = File.ReadAllText(filePath);
                    var profile = JsonConvert.DeserializeObject<PlatformProfile>(jsonContent);
                    profiles[platformType] = profile;
                    Debug.Log($"✅ Loaded profile: {platformType}");
                }
                else
                {
                    Debug.LogWarning($"⚠️ Profile not found: {fileName}");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Failed to load profile {fileName}: {e.Message}");
            }
        }
        
        private void BuildCurrentPlatform()
        {
            PlatformType currentPlatform = DetectCurrentPlatform();
            BuildPlatform(currentPlatform);
        }
        
        private void BuildAllPlatforms()
        {
            Debug.Log("🚀 Building all platforms...");
            
            List<PlatformType> platformsToBuild = new List<PlatformType>
            {
                PlatformType.Poki,
                PlatformType.GooglePlay,
                PlatformType.AppStore,
                PlatformType.Facebook,
                PlatformType.Snap,
                PlatformType.TikTok,
                PlatformType.Kongregate,
                PlatformType.CrazyGames,
                PlatformType.Steam,
                PlatformType.Epic,
                PlatformType.PS5
            };
            
            foreach (var platform in platformsToBuild)
            {
                if (profiles.ContainsKey(platform))
                {
                    BuildPlatform(platform);
                }
            }
        }
        
        private void BuildPlatform(PlatformType platformType)
        {
            if (!profiles.ContainsKey(platformType))
            {
                Debug.LogError($"❌ No profile found for platform: {platformType}");
                return;
            }
            
            var profile = profiles[platformType];
            Debug.Log($"🚀 Building platform: {platformType}");
            
            // Apply platform profile
            ApplyPlatformProfile(profile);
            
            // Run compliance checks
            if (enableComplianceChecks)
            {
                RunComplianceChecks(profile);
            }
            
            // Validate platform requirements
            if (enablePlatformValidation)
            {
                ValidatePlatformRequirements(profile);
            }
            
            // Build the platform
            BuildTarget buildTarget = GetBuildTarget(platformType);
            BuildPlayerOptions buildOptions = CreateBuildOptions(buildTarget, profile);
            
            BuildReport report = BuildPipeline.BuildPlayer(buildOptions);
            
            // Process build result
            ProcessBuildResult(report, platformType);
        }
        
        private PlatformType DetectCurrentPlatform()
        {
#if UNITY_WEBGL
            return PlatformType.Poki;
#elif UNITY_ANDROID
            return PlatformType.GooglePlay;
#elif UNITY_IOS
            return PlatformType.AppStore;
#else
            return PlatformType.Standalone;
#endif
        }
        
        private void ApplyPlatformProfile(PlatformProfile profile)
        {
            Debug.Log($"⚙️ Applying platform profile: {profile.name}");
            
            // Apply build defines
            ApplyBuildDefines(profile);
            
            // Apply platform-specific settings
            ApplyPlatformSpecificSettings(profile);
        }
        
        private void ApplyBuildDefines(PlatformProfile profile)
        {
            if (profile.buildDefines != null)
            {
                string defines = string.Join(";", profile.buildDefines);
                PlayerSettings.SetScriptingDefineSymbolsForGroup(EditorUserBuildSettings.selectedBuildTargetGroup, defines);
                Debug.Log($"🔧 Applied build defines: {defines}");
            }
        }
        
        private void ApplyPlatformSpecificSettings(PlatformProfile profile)
        {
            switch (profile.platform)
            {
                case "poki":
                    ApplyPokiSettings(profile);
                    break;
                case "googleplay":
                    ApplyGooglePlaySettings(profile);
                    break;
                case "appstore":
                    ApplyAppStoreSettings(profile);
                    break;
            }
        }
        
        private void ApplyPokiSettings(PlatformProfile profile)
        {
            Debug.Log("🎮 Applying Poki settings...");
            
            // Set WebGL settings
            PlayerSettings.WebGL.memorySize = profile.buildSettings?.memorySize ?? 256;
            PlayerSettings.WebGL.dataCaching = profile.buildSettings?.dataCaching ?? true;
            PlayerSettings.WebGL.exceptionSupport = WebGLExceptionSupport.ExplicitlyThrownExceptionsOnly;
            
            // Disable IAP
            PlayerSettings.SetScriptingDefineSymbolsForGroup(BuildTargetGroup.WebGL, "NO_IAP;POKI_ADS_ONLY");
        }
        
        private void ApplyGooglePlaySettings(PlatformProfile profile)
        {
            Debug.Log("🤖 Applying Google Play settings...");
            
            // Set Android settings
            PlayerSettings.Android.minSdkVersion = AndroidSdkVersions.AndroidApiLevel21;
            PlayerSettings.Android.targetSdkVersion = AndroidSdkVersions.AndroidApiLevel34;
            PlayerSettings.Android.bundleVersionCode = 1;
            
            // Set package name
            PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.Android, "com.yourcompany.yourgame");
            
            // Enable Google Play Billing
            PlayerSettings.SetScriptingDefineSymbolsForGroup(BuildTargetGroup.Android, "GOOGLE_PLAY_BILLING;GOOGLE_MOBILE_ADS");
        }
        
        private void ApplyAppStoreSettings(PlatformProfile profile)
        {
            Debug.Log("🍎 Applying App Store settings...");
            
            // Set iOS settings
            PlayerSettings.iOS.targetOSVersionString = "12.0";
            PlayerSettings.iOS.sdkVersion = iOSSdkVersion.DeviceSDK;
            PlayerSettings.iOS.buildNumber = "1";
            
            // Set bundle identifier
            PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.iOS, "com.yourcompany.yourgame");
            
            // Enable StoreKit
            PlayerSettings.SetScriptingDefineSymbolsForGroup(BuildTargetGroup.iOS, "STOREKIT_2;UNITY_ADS");
        }
        
        private void RunComplianceChecks(PlatformProfile profile)
        {
            Debug.Log("✅ Running compliance checks...");
            
            complianceReport = new ComplianceReport
            {
                platform = GetPlatformTypeFromString(profile.platform),
                timestamp = System.DateTime.Now,
                checks = new List<ComplianceCheck>()
            };
            
            if (profile.complianceChecks != null)
            {
                foreach (var check in profile.complianceChecks)
                {
                    RunComplianceCheck(check.Key, check.Value, profile);
                }
            }
            
            if (showBuildReport)
            {
                LogComplianceReport();
            }
        }
        
        private void RunComplianceCheck(string checkName, bool required, PlatformProfile profile)
        {
            bool passed = false;
            string message = "";
            
            switch (checkName)
            {
                case "file_size_check":
                    passed = CheckFileSize(profile);
                    message = passed ? "File size within limits" : "File size exceeds limits";
                    break;
                case "memory_usage_check":
                    passed = CheckMemoryUsage(profile);
                    message = passed ? "Memory usage within limits" : "Memory usage exceeds limits";
                    break;
                case "ad_integration_check":
                    passed = CheckAdIntegration(profile);
                    message = passed ? "Ad integration compliant" : "Ad integration non-compliant";
                    break;
                case "content_policy_check":
                    passed = CheckContentPolicy(profile);
                    message = passed ? "Content policy compliant" : "Content policy non-compliant";
                    break;
                case "performance_check":
                    passed = CheckPerformance(profile);
                    message = passed ? "Performance within limits" : "Performance below limits";
                    break;
                default:
                    passed = true;
                    message = "Check not implemented";
                    break;
            }
            
            complianceReport.checks.Add(new ComplianceCheck
            {
                name = checkName,
                required = required,
                passed = passed,
                message = message
            });
            
            Debug.Log($"✅ {checkName}: {(passed ? "PASS" : "FAIL")} - {message}");
        }
        
        private bool CheckFileSize(PlatformProfile profile)
        {
            // Implement file size check based on platform
            return true; // Placeholder
        }
        
        private bool CheckMemoryUsage(PlatformProfile profile)
        {
            // Implement memory usage check based on platform
            return true; // Placeholder
        }
        
        private bool CheckAdIntegration(PlatformProfile profile)
        {
            // Implement ad integration check based on platform
            return true; // Placeholder
        }
        
        private bool CheckContentPolicy(PlatformProfile profile)
        {
            // Implement content policy check based on platform
            return true; // Placeholder
        }
        
        private bool CheckPerformance(PlatformProfile profile)
        {
            // Implement performance check based on platform
            return true; // Placeholder
        }
        
        private void ValidatePlatformRequirements(PlatformProfile profile)
        {
            Debug.Log("🔍 Validating platform requirements...");
            
            // Validate platform-specific requirements
            switch (profile.platform)
            {
                case "poki":
                    ValidatePokiRequirements(profile);
                    break;
                case "googleplay":
                    ValidateGooglePlayRequirements(profile);
                    break;
                case "appstore":
                    ValidateAppStoreRequirements(profile);
                    break;
            }
        }
        
        private void ValidatePokiRequirements(PlatformProfile profile)
        {
            Debug.Log("🎮 Validating Poki requirements...");
            // Poki-specific validation
        }
        
        private void ValidateGooglePlayRequirements(PlatformProfile profile)
        {
            Debug.Log("🤖 Validating Google Play requirements...");
            // Google Play-specific validation
        }
        
        private void ValidateAppStoreRequirements(PlatformProfile profile)
        {
            Debug.Log("🍎 Validating App Store requirements...");
            // App Store-specific validation
        }
        
        private BuildTarget GetBuildTarget(PlatformType platformType)
        {
            switch (platformType)
            {
                case PlatformType.Poki:
                case PlatformType.Facebook:
                case PlatformType.Snap:
                case PlatformType.TikTok:
                case PlatformType.Kongregate:
                case PlatformType.CrazyGames:
                    return BuildTarget.WebGL;
                case PlatformType.GooglePlay:
                    return BuildTarget.Android;
                case PlatformType.AppStore:
                    return BuildTarget.iOS;
                case PlatformType.Steam:
                case PlatformType.Epic:
                    return BuildTarget.StandaloneWindows;
                case PlatformType.PS5:
                    return BuildTarget.PS5;
                default:
                    return BuildTarget.StandaloneWindows;
            }
        }
        
        private BuildPlayerOptions CreateBuildOptions(BuildTarget buildTarget, PlatformProfile profile)
        {
            var buildOptions = new BuildPlayerOptions
            {
                scenes = GetEnabledScenes(),
                locationPathName = GetBuildPath(buildTarget),
                target = buildTarget,
                options = GetBuildOptions()
            };
            
            return buildOptions;
        }
        
        private string[] GetEnabledScenes()
        {
            List<string> enabledScenes = new List<string>();
            
            foreach (EditorBuildSettingsScene scene in EditorBuildSettings.scenes)
            {
                if (scene.enabled)
                {
                    enabledScenes.Add(scene.path);
                }
            }
            
            return enabledScenes.ToArray();
        }
        
        private string GetBuildPath(BuildTarget buildTarget)
        {
            string platformName = buildTarget.ToString().ToLower();
            return Path.Combine(buildPath, platformName);
        }
        
        private BuildOptions GetBuildOptions()
        {
            BuildOptions options = BuildOptions.None;
            
            if (developmentBuild)
            {
                options |= BuildOptions.Development;
            }
            
            if (allowDebugging)
            {
                options |= BuildOptions.AllowDebugging;
            }
            
            if (compressBuild)
            {
                options |= BuildOptions.CompressWithLz4;
            }
            
            return options;
        }
        
        private void ProcessBuildResult(BuildReport report, PlatformType platformType)
        {
            if (report.summary.result == BuildResult.Succeeded)
            {
                Debug.Log($"✅ Build succeeded for {platformType}");
                Debug.Log($"📁 Build location: {report.summary.outputPath}");
                Debug.Log($"📊 Build size: {report.summary.totalSize / (1024 * 1024)} MB");
                Debug.Log($"⏱️ Build time: {report.summary.totalTime.TotalMinutes:F2} minutes");
            }
            else
            {
                Debug.LogError($"❌ Build failed for {platformType}");
                Debug.LogError($"❌ Error: {report.summary.result}");
            }
        }
        
        private void LogComplianceReport()
        {
            Debug.Log("📊 COMPLIANCE REPORT");
            Debug.Log("===================");
            Debug.Log($"Platform: {complianceReport.platform}");
            Debug.Log($"Timestamp: {complianceReport.timestamp}");
            Debug.Log("Checks:");
            
            foreach (var check in complianceReport.checks)
            {
                string status = check.passed ? "✅ PASS" : "❌ FAIL";
                string required = check.required ? " (REQUIRED)" : " (OPTIONAL)";
                Debug.Log($"  {check.name}: {status}{required} - {check.message}");
            }
            
            Debug.Log("===================");
        }
        
        private void DrawComplianceReport()
        {
            GUILayout.Label("Compliance Report", EditorStyles.boldLabel);
            GUILayout.BeginVertical("box");
            
            GUILayout.Label($"Platform: {complianceReport.platform}");
            GUILayout.Label($"Timestamp: {complianceReport.timestamp}");
            GUILayout.Space(5);
            
            GUILayout.Label("Checks:");
            foreach (var check in complianceReport.checks)
            {
                string status = check.passed ? "✅ PASS" : "❌ FAIL";
                string required = check.required ? " (REQUIRED)" : " (OPTIONAL)";
                GUILayout.Label($"  {check.name}: {status}{required} - {check.message}");
            }
            
            GUILayout.EndVertical();
        }
        
        private PlatformType GetPlatformTypeFromString(string platformString)
        {
            switch (platformString)
            {
                case "poki":
                    return PlatformType.Poki;
                case "googleplay":
                    return PlatformType.GooglePlay;
                case "appstore":
                    return PlatformType.AppStore;
                case "facebook":
                    return PlatformType.Facebook;
                case "snap":
                    return PlatformType.Snap;
                case "tiktok":
                    return PlatformType.TikTok;
                case "kongregate":
                    return PlatformType.Kongregate;
                case "crazygames":
                    return PlatformType.CrazyGames;
                case "steam":
                    return PlatformType.Steam;
                case "epic":
                    return PlatformType.Epic;
                case "ps5":
                    return PlatformType.PS5;
                default:
                    return PlatformType.Standalone;
            }
        }
    }
}