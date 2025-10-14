using UnityEngine;
using UnityEditor;
using UnityEditor.Build.Reporting;
using System.IO;
using System.Diagnostics;
using System.Collections.Generic;
using Newtonsoft.Json;
using Evergreen.Platform;

namespace Evergreen.Editor
{
    /// <summary>
    /// Headless WebGL builder that can be run from command line without GUI
    /// </summary>
    public class HeadlessWebGLBuilder
    {
        private static string[] webglPlatforms = {
            "poki", "facebook", "snap", "tiktok", "kongregate", "crazygames"
        };
        
        [MenuItem("Evergreen/Build/Headless WebGL Build")]
        public static void BuildWebGLHeadless()
        {
            Debug.Log("🚀 Starting headless WebGL build...");
            
            // Get command line arguments
            string[] args = System.Environment.GetCommandLineArgs();
            string targetPlatform = GetCommandLineArg(args, "-platform", "poki");
            string buildPath = GetCommandLineArg(args, "-buildPath", "Builds/WebGL");
            bool developmentBuild = GetCommandLineArg(args, "-development", "false").ToLower() == "true";
            
            Debug.Log($"🎯 Target platform: {targetPlatform}");
            Debug.Log($"📁 Build path: {buildPath}");
            Debug.Log($"🔧 Development build: {developmentBuild}");
            
            // Validate platform
            if (!IsValidWebGLPlatform(targetPlatform))
            {
                Debug.LogError($"❌ Invalid platform: {targetPlatform}. Valid platforms: {string.Join(", ", webglPlatforms)}");
                return;
            }
            
            // Load platform profile
            PlatformProfile profile = LoadPlatformProfile(targetPlatform);
            if (profile == null)
            {
                Debug.LogError($"❌ Failed to load profile for platform: {targetPlatform}");
                return;
            }
            
            // Configure build settings
            ConfigureBuildSettings(profile, developmentBuild);
            
            // Build WebGL
            BuildWebGL(targetPlatform, buildPath, developmentBuild);
            
            Debug.Log("✅ Headless WebGL build completed!");
        }
        
        private static string GetCommandLineArg(string[] args, string argName, string defaultValue)
        {
            for (int i = 0; i < args.Length - 1; i++)
            {
                if (args[i] == argName)
                {
                    return args[i + 1];
                }
            }
            return defaultValue;
        }
        
        private static bool IsValidWebGLPlatform(string platform)
        {
            foreach (string validPlatform in webglPlatforms)
            {
                if (platform.ToLower() == validPlatform)
                    return true;
            }
            return false;
        }
        
        private static PlatformProfile LoadPlatformProfile(string platformName)
        {
            string configPath = $"Assets/Config/{platformName}.json";
            
            if (!File.Exists(configPath))
            {
                Debug.LogError($"❌ Config file not found: {configPath}");
                return null;
            }
            
            try
            {
                string jsonContent = File.ReadAllText(configPath);
                PlatformProfile profile = JsonConvert.DeserializeObject<PlatformProfile>(jsonContent);
                Debug.Log($"✅ Loaded profile for {platformName}");
                return profile;
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Failed to load profile: {e.Message}");
                return null;
            }
        }
        
        private static void ConfigureBuildSettings(PlatformProfile profile, bool developmentBuild)
        {
            Debug.Log("⚙️ Configuring build settings...");
            
            // Set WebGL build target
            EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.WebGL, BuildTarget.WebGL);
            
            // Configure WebGL settings
            PlayerSettings.WebGL.memorySize = profile.build_settings.memory_size;
            PlayerSettings.WebGL.dataCaching = profile.build_settings.data_caching;
            PlayerSettings.WebGL.exceptionSupport = (WebGLExceptionSupport)System.Enum.Parse(typeof(WebGLExceptionSupport), profile.build_settings.exception_support);
            
            // Set scripting backend
            PlayerSettings.SetScriptingBackend(BuildTargetGroup.WebGL, ScriptingImplementation.IL2CPP);
            
            // Set API compatibility level
            PlayerSettings.SetApiCompatibilityLevel(BuildTargetGroup.WebGL, ApiCompatibilityLevel.NET_Standard_2_1);
            
            // Configure development build
            EditorUserBuildSettings.development = developmentBuild;
            EditorUserBuildSettings.allowDebugging = developmentBuild;
            
            // Set build defines based on platform
            SetPlatformDefines(profile.platform);
            
            Debug.Log("✅ Build settings configured");
        }
        
        private static void SetPlatformDefines(string platform)
        {
            List<string> defines = new List<string>();
            
            // Base WebGL defines
            defines.Add("UNITY_WEBGL");
            defines.Add("WEBGL_BUILD");
            
            // Platform-specific defines
            switch (platform.ToLower())
            {
                case "poki":
                    defines.Add("POKI_PLATFORM");
                    defines.Add("POKI_ADS");
                    break;
                case "facebook":
                    defines.Add("FACEBOOK_PLATFORM");
                    defines.Add("FACEBOOK_ADS");
                    break;
                case "snap":
                    defines.Add("SNAP_PLATFORM");
                    defines.Add("SNAP_ADS");
                    break;
                case "tiktok":
                    defines.Add("TIKTOK_PLATFORM");
                    defines.Add("TIKTOK_ADS");
                    break;
                case "kongregate":
                    defines.Add("KONGREGATE_PLATFORM");
                    defines.Add("KONGREGATE_ADS");
                    break;
                case "crazygames":
                    defines.Add("CRAZYGAMES_PLATFORM");
                    defines.Add("CRAZYGAMES_ADS");
                    break;
            }
            
            PlayerSettings.SetScriptingDefineSymbolsForGroup(BuildTargetGroup.WebGL, string.Join(";", defines));
            Debug.Log($"✅ Set defines: {string.Join(", ", defines)}");
        }
        
        private static void BuildWebGL(string platform, string buildPath, bool developmentBuild)
        {
            Debug.Log($"🔨 Building WebGL for {platform}...");
            
            // Create build directory
            if (!Directory.Exists(buildPath))
            {
                Directory.CreateDirectory(buildPath);
            }
            
            // Configure build options
            BuildPlayerOptions buildOptions = new BuildPlayerOptions();
            buildOptions.scenes = GetEnabledScenes();
            buildOptions.locationPathName = buildPath;
            buildOptions.target = BuildTarget.WebGL;
            buildOptions.options = BuildOptions.None;
            
            if (developmentBuild)
            {
                buildOptions.options |= BuildOptions.Development;
            }
            
            // Start build
            BuildReport report = BuildPipeline.BuildPlayer(buildOptions);
            
            // Check build result
            if (report.summary.result == BuildResult.Succeeded)
            {
                Debug.Log($"✅ WebGL build succeeded: {report.summary.totalSize} bytes");
                
                // Copy platform-specific template
                CopyWebGLTemplate(platform, buildPath);
                
                // Generate build info
                GenerateBuildInfo(platform, buildPath, report);
            }
            else
            {
                Debug.LogError($"❌ WebGL build failed: {report.summary.result}");
            }
        }
        
        private static string[] GetEnabledScenes()
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
        
        private static void CopyWebGLTemplate(string platform, string buildPath)
        {
            string templatePath = $"Assets/StreamingAssets/{platform}-webgl-template.html";
            string targetPath = Path.Combine(buildPath, "index.html");
            
            if (File.Exists(templatePath))
            {
                File.Copy(templatePath, targetPath, true);
                Debug.Log($"✅ Copied WebGL template: {platform}-webgl-template.html");
            }
            else
            {
                Debug.LogWarning($"⚠️ WebGL template not found: {templatePath}");
            }
        }
        
        private static void GenerateBuildInfo(string platform, string buildPath, BuildReport report)
        {
            var buildInfo = new
            {
                platform = platform,
                buildTime = System.DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                buildSize = report.summary.totalSize,
                buildResult = report.summary.result.ToString(),
                scenes = GetEnabledScenes(),
                unityVersion = Application.unityVersion
            };
            
            string buildInfoPath = Path.Combine(buildPath, "build-info.json");
            string json = JsonConvert.SerializeObject(buildInfo, Formatting.Indented);
            File.WriteAllText(buildInfoPath, json);
            
            Debug.Log($"✅ Generated build info: {buildInfoPath}");
        }
    }
}