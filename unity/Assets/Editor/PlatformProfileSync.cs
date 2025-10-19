using UnityEditor;
using UnityEngine;
using System.IO;
using System.Collections.Generic;
using Evergreen.Core;

namespace Evergreen.Editor
{
    /// <summary>
    /// PLATFORM PROFILE SYNC & BUILD PIPELINE
    /// Automatically syncs platform profiles and builds for all platforms
    /// Maintains single codebase with platform-specific optimizations
    /// </summary>
    public static class PlatformProfileSync
    {
        private const string PLATFORM_PROFILES_PATH = "ProjectSettings/PlatformProfiles.json";
        
        [MenuItem("Build/Sync & Build All Profiles")]
        public static void SyncAndBuildAllProfiles()
        {
            Debug.Log("🚀 Starting Platform Profile Sync & Build...");
            
            if (!File.Exists(PLATFORM_PROFILES_PATH))
            {
                Debug.LogError($"PlatformProfiles.json not found at: {PLATFORM_PROFILES_PATH}");
                return;
            }
            
            try
            {
                // Load platform profiles
                var profiles = LoadPlatformProfiles();
                
                // Sync and build each platform
                BuildProfile("webgl", BuildTarget.WebGL, profiles);
                BuildProfile("android", BuildTarget.Android, profiles);
                BuildProfile("ios", BuildTarget.iOS, profiles);
                
                Debug.Log("✅ All platform builds completed successfully!");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Build pipeline error: {e.Message}");
            }
        }
        
        [MenuItem("Build/Sync & Build WebGL")]
        public static void SyncAndBuildWebGL()
        {
            Debug.Log("🌐 Building WebGL...");
            var profiles = LoadPlatformProfiles();
            BuildProfile("webgl", BuildTarget.WebGL, profiles);
        }
        
        [MenuItem("Build/Sync & Build Android")]
        public static void SyncAndBuildAndroid()
        {
            Debug.Log("🤖 Building Android...");
            var profiles = LoadPlatformProfiles();
            BuildProfile("android", BuildTarget.Android, profiles);
        }
        
        [MenuItem("Build/Sync & Build iOS")]
        public static void SyncAndBuildiOS()
        {
            Debug.Log("🍎 Building iOS...");
            var profiles = LoadPlatformProfiles();
            BuildProfile("ios", BuildTarget.iOS, profiles);
        }
        
        [MenuItem("Build/Sync Platform Profiles Only")]
        public static void SyncPlatformProfilesOnly()
        {
            Debug.Log("🔄 Syncing Platform Profiles...");
            
            try
            {
                var profiles = LoadPlatformProfiles();
                ApplyPlatformSettings(profiles);
                Debug.Log("✅ Platform profiles synced successfully!");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Profile sync error: {e.Message}");
            }
        }
        
        private static JObject LoadPlatformProfiles()
        {
            string jsonContent = File.ReadAllText(PLATFORM_PROFILES_PATH);
            return SimpleJSON.Parse(jsonContent);
        }
        
        private static void BuildProfile(string profileKey, BuildTarget target, JObject profiles)
        {
            Debug.Log($"🔧 Applying {profileKey} profile and building for {target}...");
            
            try
            {
                // Apply platform settings
                ApplyPlatformSettings(profiles, profileKey);
                
                // Get build scenes
                string[] scenes = GetBuildScenes();
                
                // Set build options
                var options = new BuildPlayerOptions
                {
                    scenes = scenes,
                    locationPathName = $"Builds/{profileKey}/",
                    target = target,
                    options = BuildOptions.CleanBuildCache | BuildOptions.Development
                };
                
                // Build the project
                var report = BuildPipeline.BuildPlayer(options);
                
                if (report.summary.result == UnityEditor.Build.Reporting.BuildResult.Succeeded)
                {
                    Debug.Log($"✅ {profileKey} build succeeded!");
                    Debug.Log($"📁 Build location: {report.summary.outputPath}");
                    Debug.Log($"⏱️ Build time: {report.summary.totalTime}");
                    Debug.Log($"📊 Build size: {report.summary.totalSize} bytes");
                }
                else
                {
                    Debug.LogError($"❌ {profileKey} build failed!");
                    Debug.LogError($"Error: {report.summary.result}");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Build error for {profileKey}: {e.Message}");
            }
        }
        
        private static void ApplyPlatformSettings(JObject profiles, string profileKey = null)
        {
            var profilesObj = profiles.GetObject("profiles");
            var syncRules = profiles.GetObject("syncRules");
            
            if (profileKey != null && profilesObj.ContainsKey(profileKey))
            {
                // Apply specific profile
                ApplyProfileSettings(profilesObj.GetObject(profileKey), syncRules);
            }
            else
            {
                // Apply default profile
                if (profilesObj.ContainsKey("default"))
                {
                    ApplyProfileSettings(profilesObj.GetObject("default"), syncRules);
                }
            }
        }
        
        private static void ApplyProfileSettings(JObject profile, JObject syncRules)
        {
            Debug.Log("🔧 Applying profile settings...");
            
            // Apply PlayerSettings
            ApplyPlayerSettings(profile);
            
            // Apply WebGL settings
            if (profile.ContainsKey("targetPlatform") && profile.GetString("targetPlatform") == "WebGL")
            {
                ApplyWebGLSettings(profile);
            }
            
            // Apply Android settings
            if (profile.ContainsKey("targetPlatform") && profile.GetString("targetPlatform") == "Android")
            {
                ApplyAndroidSettings(profile);
            }
            
            // Apply iOS settings
            if (profile.ContainsKey("targetPlatform") && profile.GetString("targetPlatform") == "iOS")
            {
                ApplyiOSSettings(profile);
            }
            
            Debug.Log("✅ Profile settings applied successfully!");
        }
        
        private static void ApplyPlayerSettings(JObject profile)
        {
            // Basic PlayerSettings
            if (profile.ContainsKey("companyName"))
                PlayerSettings.companyName = profile.GetString("companyName");
            
            if (profile.ContainsKey("productName"))
                PlayerSettings.productName = profile.GetString("productName");
            
            if (profile.ContainsKey("bundleVersion"))
                PlayerSettings.bundleVersion = profile.GetString("bundleVersion");
            
            if (profile.ContainsKey("scriptingBackend"))
            {
                var backend = profile.GetString("scriptingBackend");
                if (backend == "IL2CPP")
                {
                    PlayerSettings.SetScriptingBackend(BuildTargetGroup.Standalone, ScriptingImplementation.IL2CPP);
                    PlayerSettings.SetScriptingBackend(BuildTargetGroup.WebGL, ScriptingImplementation.IL2CPP);
                    PlayerSettings.SetScriptingBackend(BuildTargetGroup.Android, ScriptingImplementation.IL2CPP);
                    PlayerSettings.SetScriptingBackend(BuildTargetGroup.iOS, ScriptingImplementation.IL2CPP);
                }
            }
            
            if (profile.ContainsKey("apiCompatibilityLevel"))
            {
                var apiLevel = profile.GetString("apiCompatibilityLevel");
                if (apiLevel == "NET_Standard_2_1")
                {
                    PlayerSettings.SetApiCompatibilityLevel(BuildTargetGroup.Standalone, ApiCompatibilityLevel.NET_Standard_2_1);
                    PlayerSettings.SetApiCompatibilityLevel(BuildTargetGroup.WebGL, ApiCompatibilityLevel.NET_Standard_2_1);
                    PlayerSettings.SetApiCompatibilityLevel(BuildTargetGroup.Android, ApiCompatibilityLevel.NET_Standard_2_1);
                    PlayerSettings.SetApiCompatibilityLevel(BuildTargetGroup.iOS, ApiCompatibilityLevel.NET_Standard_2_1);
                }
            }
            
            if (profile.ContainsKey("stripEngineCode"))
                PlayerSettings.stripEngineCode = profile.GetBool("stripEngineCode");
            
            if (profile.ContainsKey("managedStrippingLevel"))
            {
                var strippingLevel = profile.GetString("managedStrippingLevel");
                if (strippingLevel == "Medium")
                {
                    PlayerSettings.SetManagedStrippingLevel(BuildTargetGroup.Standalone, ManagedStrippingLevel.Medium);
                    PlayerSettings.SetManagedStrippingLevel(BuildTargetGroup.WebGL, ManagedStrippingLevel.Medium);
                    PlayerSettings.SetManagedStrippingLevel(BuildTargetGroup.Android, ManagedStrippingLevel.Medium);
                    PlayerSettings.SetManagedStrippingLevel(BuildTargetGroup.iOS, ManagedStrippingLevel.Medium);
                }
            }
            
            if (profile.ContainsKey("graphicsJobs"))
                PlayerSettings.graphicsJobs = profile.GetBool("graphicsJobs");
            
            if (profile.ContainsKey("vSyncCount"))
                QualitySettings.vSyncCount = profile.GetInt("vSyncCount");
            
            if (profile.ContainsKey("targetFrameRate"))
                Application.targetFrameRate = profile.GetInt("targetFrameRate");
            
            if (profile.ContainsKey("gcIncremental"))
                PlayerSettings.gcIncremental = profile.GetBool("gcIncremental");
            
            if (profile.ContainsKey("fullscreenMode"))
            {
                var fullscreenMode = profile.GetString("fullscreenMode");
                if (fullscreenMode == "Windowed")
                {
                    PlayerSettings.fullScreenMode = FullScreenMode.Windowed;
                }
            }
            
            if (profile.ContainsKey("colorSpace"))
            {
                var colorSpace = profile.GetString("colorSpace");
                if (colorSpace == "Gamma")
                {
                    PlayerSettings.colorSpace = ColorSpace.Gamma;
                }
            }
        }
        
        private static void ApplyWebGLSettings(JObject profile)
        {
            Debug.Log("🌐 Applying WebGL settings...");
            
            if (profile.ContainsKey("webglMemorySizeMB"))
                PlayerSettings.WebGL.memorySize = profile.GetInt("webglMemorySizeMB");
            
            if (profile.ContainsKey("webglThreadsSupport"))
                PlayerSettings.WebGL.threadsSupport = profile.GetBool("webglThreadsSupport");
            
            if (profile.ContainsKey("webglWasmStreaming"))
                PlayerSettings.WebGL.wasmStreaming = profile.GetBool("webglWasmStreaming");
            
            if (profile.ContainsKey("webglDataCaching"))
                PlayerSettings.WebGL.dataCaching = profile.GetBool("webglDataCaching");
            
            if (profile.ContainsKey("webglCompressionFormat"))
            {
                var compressionFormat = profile.GetString("webglCompressionFormat");
                if (compressionFormat == "Brotli")
                {
                    PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Brotli;
                }
            }
            
            if (profile.ContainsKey("webglDecompressionFallback"))
                PlayerSettings.WebGL.decompressionFallback = profile.GetBool("webglDecompressionFallback");
            
            if (profile.ContainsKey("webglExceptionSupport"))
            {
                var exceptionSupport = profile.GetString("webglExceptionSupport");
                if (exceptionSupport == "ExplicitlyThrownExceptionsOnly")
                {
                    PlayerSettings.WebGL.exceptionSupport = WebGLExceptionSupport.ExplicitlyThrownExceptionsOnly;
                }
            }
            
            if (profile.ContainsKey("webglNameFilesAsHashes"))
                PlayerSettings.WebGL.nameFilesAsHashes = profile.GetBool("webglNameFilesAsHashes");
            
            if (profile.ContainsKey("runInBackground"))
                PlayerSettings.runInBackground = profile.GetBool("runInBackground");
        }
        
        private static void ApplyAndroidSettings(JObject profile)
        {
            Debug.Log("🤖 Applying Android settings...");
            
            if (profile.ContainsKey("bundleIdentifier"))
                PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.Android, profile.GetString("bundleIdentifier"));
            
            if (profile.ContainsKey("minSdkVersion"))
                PlayerSettings.Android.minSdkVersion = (AndroidSdkVersions)profile.GetInt("minSdkVersion");
            
            if (profile.ContainsKey("targetSdkVersion"))
                PlayerSettings.Android.targetSdkVersion = (AndroidSdkVersions)profile.GetInt("targetSdkVersion");
            
            if (profile.ContainsKey("internetAccess"))
            {
                var internetAccess = profile.GetString("internetAccess");
                if (internetAccess == "Require")
                {
                    PlayerSettings.Android.forceInternetPermission = true;
                }
            }
            
            if (profile.ContainsKey("androidIsGame"))
                PlayerSettings.Android.AndroidIsGame = profile.GetBool("androidIsGame");
            
            if (profile.ContainsKey("androidTVCompatibility"))
                PlayerSettings.Android.androidTVCompatibility = profile.GetBool("androidTVCompatibility");
            
            if (profile.ContainsKey("androidBuildApkPerCpuArchitecture"))
                PlayerSettings.Android.buildApkPerCpuArchitecture = profile.GetBool("androidBuildApkPerCpuArchitecture");
        }
        
        private static void ApplyiOSSettings(JObject profile)
        {
            Debug.Log("🍎 Applying iOS settings...");
            
            if (profile.ContainsKey("bundleIdentifier"))
                PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.iOS, profile.GetString("bundleIdentifier"));
            
            if (profile.ContainsKey("targetDevice"))
            {
                var targetDevice = profile.GetString("targetDevice");
                if (targetDevice == "iPhoneAndiPad")
                {
                    PlayerSettings.iOS.targetDevice = iOSTargetDevice.iPhoneAndiPad;
                }
            }
            
            if (profile.ContainsKey("targetOSVersion"))
            {
                var targetOSVersion = profile.GetString("targetOSVersion");
                PlayerSettings.iOS.targetOSVersionString = targetOSVersion;
            }
            
            if (profile.ContainsKey("appleEnableProMotion"))
                PlayerSettings.iOS.appleEnableProMotion = profile.GetBool("appleEnableProMotion");
            
            if (profile.ContainsKey("statusBarHidden"))
                PlayerSettings.iOS.statusBarHidden = profile.GetBool("statusBarHidden");
            
            if (profile.ContainsKey("iosShowActivityIndicatorOnLoading"))
                PlayerSettings.iOS.showActivityIndicatorOnLoading = profile.GetBool("iosShowActivityIndicatorOnLoading");
            
            if (profile.ContainsKey("iosUseOnDemandResources"))
                PlayerSettings.iOS.useOnDemandResources = profile.GetBool("iosUseOnDemandResources");
            
            if (profile.ContainsKey("iosRequireFullScreen"))
                PlayerSettings.iOS.requireFullScreen = profile.GetBool("iosRequireFullScreen");
            
            if (profile.ContainsKey("iosAllowHTTPDownload"))
                PlayerSettings.iOS.allowHTTPDownload = profile.GetBool("iosAllowHTTPDownload");
        }
        
        private static string[] GetBuildScenes()
        {
            var scenes = new List<string>();
            
            foreach (var scene in EditorBuildSettings.scenes)
            {
                if (scene.enabled)
                {
                    scenes.Add(scene.path);
                }
            }
            
            return scenes.ToArray();
        }
        
        [MenuItem("Build/Validate All Scenes")]
        public static void ValidateAllScenes()
        {
            Debug.Log("🔍 Validating all scenes...");
            
            var scenes = GetBuildScenes();
            int validScenes = 0;
            int totalScenes = scenes.Length;
            
            foreach (var scenePath in scenes)
            {
                if (ValidateScene(scenePath))
                {
                    validScenes++;
                }
            }
            
            Debug.Log($"✅ Scene validation complete: {validScenes}/{totalScenes} scenes valid");
        }
        
        private static bool ValidateScene(string scenePath)
        {
            try
            {
                var scene = UnityEditor.SceneManagement.EditorSceneManager.OpenScene(scenePath);
                
                // Check for missing references
                var missingReferences = new List<string>();
                var allGameObjects = scene.GetRootGameObjects();
                
                foreach (var go in allGameObjects)
                {
                    CheckGameObjectForMissingReferences(go, missingReferences);
                }
                
                if (missingReferences.Count > 0)
                {
                    Debug.LogWarning($"⚠️ Scene {scenePath} has {missingReferences.Count} missing references:");
                    foreach (var missing in missingReferences)
                    {
                        Debug.LogWarning($"  - {missing}");
                    }
                    return false;
                }
                
                return true;
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Error validating scene {scenePath}: {e.Message}");
                return false;
            }
        }
        
        private static void CheckGameObjectForMissingReferences(GameObject go, List<string> missingReferences)
        {
            var components = go.GetComponents<Component>();
            
            foreach (var component in components)
            {
                if (component == null)
                {
                    missingReferences.Add($"Missing component on {go.name}");
                }
            }
            
            // Check children
            foreach (Transform child in go.transform)
            {
                CheckGameObjectForMissingReferences(child.gameObject, missingReferences);
            }
        }
    }
}
