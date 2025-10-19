using UnityEditor;
using UnityEngine;
using System.IO;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;

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
            return JObject.Parse(jsonContent);
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
            var profilesObj = profiles["profiles"] as JObject;
            var syncRules = profiles["syncRules"] as JObject;
            
            if (profileKey != null && profilesObj.ContainsKey(profileKey))
            {
                // Apply specific profile
                ApplyProfileSettings(profilesObj[profileKey] as JObject, syncRules);
            }
            else
            {
                // Apply default profile
                if (profilesObj.ContainsKey("default"))
                {
                    ApplyProfileSettings(profilesObj["default"] as JObject, syncRules);
                }
            }
        }
        
        private static void ApplyProfileSettings(JObject profile, JObject syncRules)
        {
            Debug.Log("🔧 Applying profile settings...");
            
            // Apply PlayerSettings
            ApplyPlayerSettings(profile);
            
            // Apply WebGL settings
            if (profile.ContainsKey("targetPlatform") && profile["targetPlatform"].ToString() == "WebGL")
            {
                ApplyWebGLSettings(profile);
            }
            
            // Apply Android settings
            if (profile.ContainsKey("targetPlatform") && profile["targetPlatform"].ToString() == "Android")
            {
                ApplyAndroidSettings(profile);
            }
            
            // Apply iOS settings
            if (profile.ContainsKey("targetPlatform") && profile["targetPlatform"].ToString() == "iOS")
            {
                ApplyiOSSettings(profile);
            }
            
            Debug.Log("✅ Profile settings applied successfully!");
        }
        
        private static void ApplyPlayerSettings(JObject profile)
        {
            // Basic PlayerSettings
            if (profile.ContainsKey("companyName"))
                PlayerSettings.companyName = profile["companyName"].ToString();
            
            if (profile.ContainsKey("productName"))
                PlayerSettings.productName = profile["productName"].ToString();
            
            if (profile.ContainsKey("bundleVersion"))
                PlayerSettings.bundleVersion = profile["bundleVersion"].ToString();
            
            if (profile.ContainsKey("scriptingBackend"))
            {
                var backend = profile["scriptingBackend"].ToString();
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
                var apiLevel = profile["apiCompatibilityLevel"].ToString();
                if (apiLevel == "NET_Standard_2_1")
                {
                    PlayerSettings.SetApiCompatibilityLevel(BuildTargetGroup.Standalone, ApiCompatibilityLevel.NET_Standard_2_1);
                    PlayerSettings.SetApiCompatibilityLevel(BuildTargetGroup.WebGL, ApiCompatibilityLevel.NET_Standard_2_1);
                    PlayerSettings.SetApiCompatibilityLevel(BuildTargetGroup.Android, ApiCompatibilityLevel.NET_Standard_2_1);
                    PlayerSettings.SetApiCompatibilityLevel(BuildTargetGroup.iOS, ApiCompatibilityLevel.NET_Standard_2_1);
                }
            }
            
            if (profile.ContainsKey("stripEngineCode"))
                PlayerSettings.stripEngineCode = profile["stripEngineCode"].ToObject<bool>();
            
            if (profile.ContainsKey("managedStrippingLevel"))
            {
                var strippingLevel = profile["managedStrippingLevel"].ToString();
                if (strippingLevel == "Medium")
                {
                    PlayerSettings.SetManagedStrippingLevel(BuildTargetGroup.Standalone, ManagedStrippingLevel.Medium);
                    PlayerSettings.SetManagedStrippingLevel(BuildTargetGroup.WebGL, ManagedStrippingLevel.Medium);
                    PlayerSettings.SetManagedStrippingLevel(BuildTargetGroup.Android, ManagedStrippingLevel.Medium);
                    PlayerSettings.SetManagedStrippingLevel(BuildTargetGroup.iOS, ManagedStrippingLevel.Medium);
                }
            }
            
            if (profile.ContainsKey("graphicsJobs"))
                PlayerSettings.graphicsJobs = profile["graphicsJobs"].ToObject<bool>();
            
            if (profile.ContainsKey("vSyncCount"))
                QualitySettings.vSyncCount = profile["vSyncCount"].ToObject<int>();
            
            if (profile.ContainsKey("targetFrameRate"))
                Application.targetFrameRate = profile["targetFrameRate"].ToObject<int>();
            
            if (profile.ContainsKey("gcIncremental"))
                PlayerSettings.gcIncremental = profile["gcIncremental"].ToObject<bool>();
            
            if (profile.ContainsKey("fullscreenMode"))
            {
                var fullscreenMode = profile["fullscreenMode"].ToString();
                if (fullscreenMode == "Windowed")
                {
                    PlayerSettings.fullScreenMode = FullScreenMode.Windowed;
                }
            }
            
            if (profile.ContainsKey("colorSpace"))
            {
                var colorSpace = profile["colorSpace"].ToString();
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
                PlayerSettings.WebGL.memorySize = profile["webglMemorySizeMB"].ToObject<int>();
            
            if (profile.ContainsKey("webglThreadsSupport"))
                PlayerSettings.WebGL.threadsSupport = profile["webglThreadsSupport"].ToObject<bool>();
            
            if (profile.ContainsKey("webglWasmStreaming"))
                PlayerSettings.WebGL.wasmStreaming = profile["webglWasmStreaming"].ToObject<bool>();
            
            if (profile.ContainsKey("webglDataCaching"))
                PlayerSettings.WebGL.dataCaching = profile["webglDataCaching"].ToObject<bool>();
            
            if (profile.ContainsKey("webglCompressionFormat"))
            {
                var compressionFormat = profile["webglCompressionFormat"].ToString();
                if (compressionFormat == "Brotli")
                {
                    PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Brotli;
                }
            }
            
            if (profile.ContainsKey("webglDecompressionFallback"))
                PlayerSettings.WebGL.decompressionFallback = profile["webglDecompressionFallback"].ToObject<bool>();
            
            if (profile.ContainsKey("webglExceptionSupport"))
            {
                var exceptionSupport = profile["webglExceptionSupport"].ToString();
                if (exceptionSupport == "ExplicitlyThrownExceptionsOnly")
                {
                    PlayerSettings.WebGL.exceptionSupport = WebGLExceptionSupport.ExplicitlyThrownExceptionsOnly;
                }
            }
            
            if (profile.ContainsKey("webglNameFilesAsHashes"))
                PlayerSettings.WebGL.nameFilesAsHashes = profile["webglNameFilesAsHashes"].ToObject<bool>();
            
            if (profile.ContainsKey("runInBackground"))
                PlayerSettings.runInBackground = profile["runInBackground"].ToObject<bool>();
        }
        
        private static void ApplyAndroidSettings(JObject profile)
        {
            Debug.Log("🤖 Applying Android settings...");
            
            if (profile.ContainsKey("bundleIdentifier"))
                PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.Android, profile["bundleIdentifier"].ToString());
            
            if (profile.ContainsKey("minSdkVersion"))
                PlayerSettings.Android.minSdkVersion = (AndroidSdkVersions)profile["minSdkVersion"].ToObject<int>();
            
            if (profile.ContainsKey("targetSdkVersion"))
                PlayerSettings.Android.targetSdkVersion = (AndroidSdkVersions)profile["targetSdkVersion"].ToObject<int>();
            
            if (profile.ContainsKey("internetAccess"))
            {
                var internetAccess = profile["internetAccess"].ToString();
                if (internetAccess == "Require")
                {
                    PlayerSettings.Android.forceInternetPermission = true;
                }
            }
            
            if (profile.ContainsKey("androidIsGame"))
                PlayerSettings.Android.AndroidIsGame = profile["androidIsGame"].ToObject<bool>();
            
            if (profile.ContainsKey("androidTVCompatibility"))
                PlayerSettings.Android.androidTVCompatibility = profile["androidTVCompatibility"].ToObject<bool>();
            
            if (profile.ContainsKey("androidBuildApkPerCpuArchitecture"))
                PlayerSettings.Android.buildApkPerCpuArchitecture = profile["androidBuildApkPerCpuArchitecture"].ToObject<bool>();
        }
        
        private static void ApplyiOSSettings(JObject profile)
        {
            Debug.Log("🍎 Applying iOS settings...");
            
            if (profile.ContainsKey("bundleIdentifier"))
                PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.iOS, profile["bundleIdentifier"].ToString());
            
            if (profile.ContainsKey("targetDevice"))
            {
                var targetDevice = profile["targetDevice"].ToString();
                if (targetDevice == "iPhoneAndiPad")
                {
                    PlayerSettings.iOS.targetDevice = iOSTargetDevice.iPhoneAndiPad;
                }
            }
            
            if (profile.ContainsKey("targetOSVersion"))
            {
                var targetOSVersion = profile["targetOSVersion"].ToString();
                PlayerSettings.iOS.targetOSVersionString = targetOSVersion;
            }
            
            if (profile.ContainsKey("appleEnableProMotion"))
                PlayerSettings.iOS.appleEnableProMotion = profile["appleEnableProMotion"].ToObject<bool>();
            
            if (profile.ContainsKey("statusBarHidden"))
                PlayerSettings.iOS.statusBarHidden = profile["statusBarHidden"].ToObject<bool>();
            
            if (profile.ContainsKey("iosShowActivityIndicatorOnLoading"))
                PlayerSettings.iOS.showActivityIndicatorOnLoading = profile["iosShowActivityIndicatorOnLoading"].ToObject<bool>();
            
            if (profile.ContainsKey("iosUseOnDemandResources"))
                PlayerSettings.iOS.useOnDemandResources = profile["iosUseOnDemandResources"].ToObject<bool>();
            
            if (profile.ContainsKey("iosRequireFullScreen"))
                PlayerSettings.iOS.requireFullScreen = profile["iosRequireFullScreen"].ToObject<bool>();
            
            if (profile.ContainsKey("iosAllowHTTPDownload"))
                PlayerSettings.iOS.allowHTTPDownload = profile["iosAllowHTTPDownload"].ToObject<bool>();
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
