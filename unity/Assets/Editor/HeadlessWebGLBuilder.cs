using UnityEngine;
using UnityEditor;
using UnityEditor.Build.Reporting;
using System.IO;
using System.Collections.Generic;
using System.Linq;

namespace InfiniteMatch.Editor
{
    /// <summary>
    /// Headless WebGL build script for CLI builds without Unity Editor
    /// </summary>
    public class HeadlessWebGLBuilder
    {
        /// <summary>
        /// Main build method called from command line
        /// </summary>
        /// <param name="platform">Target platform (poki, facebook, snap, tiktok, kongregate, crazygames)</param>
        /// <param name="buildPath">Output build path</param>
        /// <param name="development">Development build flag</param>
        public static void BuildWebGLHeadless(string platform = "poki", string buildPath = "Builds/WebGL", string development = "false")
        {
            Debug.Log($"🚀 Starting headless WebGL build for platform: {platform}");
            Debug.Log($"📁 Build path: {buildPath}");
            Debug.Log($"🔧 Development build: {development}");

            try
            {
                // Configure build settings
                ConfigureWebGLSettings(platform);
                
                // Apply platform-specific settings
                ApplyPlatformSettings(platform);
                
                // Create build options
                BuildPlayerOptions buildOptions = CreateBuildOptions(buildPath, development == "true");
                
                // Build the project
                BuildReport report = BuildPipeline.BuildPlayer(buildOptions);
                
                // Process build result
                ProcessBuildResult(report, platform, buildPath);
                
                // Generate platform-specific files
                GeneratePlatformFiles(platform, buildPath);
                
                Debug.Log("✅ Headless WebGL build completed successfully!");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Headless WebGL build failed: {e.Message}");
                EditorApplication.Exit(1);
            }
        }

        private static void ConfigureWebGLSettings(string platform)
        {
            Debug.Log("⚙️ Configuring WebGL settings...");
            
            // Set WebGL memory size based on platform
            int memorySize = GetMemorySizeForPlatform(platform);
            PlayerSettings.WebGL.memorySize = memorySize;
            
            // Configure WebGL settings
            PlayerSettings.WebGL.dataCaching = true;
            PlayerSettings.WebGL.exceptionSupport = WebGLExceptionSupport.ExplicitlyThrownExceptionsOnly;
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Gzip;
            PlayerSettings.WebGL.nameFilesAsHashes = true;
            PlayerSettings.WebGL.threadsSupport = false;
            
            // Set template
            PlayerSettings.WebGL.template = "PROJECT:Default";
            
            Debug.Log($"✅ WebGL configured - Memory: {memorySize}MB, Platform: {platform}");
        }

        private static int GetMemorySizeForPlatform(string platform)
        {
            switch (platform.ToLower())
            {
                case "poki":
                case "facebook":
                case "snap":
                case "tiktok":
                    return 256; // Optimized for web platforms
                case "kongregate":
                case "crazygames":
                    return 512; // More memory for these platforms
                default:
                    return 256;
            }
        }

        private static void ApplyPlatformSettings(string platform)
        {
            Debug.Log($"🎮 Applying {platform} platform settings...");
            
            // Apply build defines
            List<string> defines = GetBuildDefinesForPlatform(platform);
            string defineString = string.Join(";", defines);
            PlayerSettings.SetScriptingDefineSymbolsForGroup(BuildTargetGroup.WebGL, defineString);
            
            Debug.Log($"🔧 Applied build defines: {defineString}");
        }

        private static List<string> GetBuildDefinesForPlatform(string platform)
        {
            List<string> defines = new List<string>
            {
                "UNITY_WEBGL",
                "WEBGL_BUILD"
            };

            switch (platform.ToLower())
            {
                case "poki":
                    defines.AddRange(new[] { "POKI_PLATFORM", "POKI_SDK_ENABLED", "POKI_ADS_ENABLED", "NO_IAP" });
                    break;
                case "facebook":
                    defines.AddRange(new[] { "FACEBOOK_PLATFORM", "FACEBOOK_INSTANT_GAMES", "NO_IAP" });
                    break;
                case "snap":
                    defines.AddRange(new[] { "SNAP_PLATFORM", "SNAP_MINI_GAMES", "NO_IAP" });
                    break;
                case "tiktok":
                    defines.AddRange(new[] { "TIKTOK_PLATFORM", "TIKTOK_MINI_GAMES", "NO_IAP" });
                    break;
                case "kongregate":
                    defines.AddRange(new[] { "KONGREGATE_PLATFORM", "KONGREGATE_API", "NO_IAP" });
                    break;
                case "crazygames":
                    defines.AddRange(new[] { "CRAZYGAMES_PLATFORM", "CRAZYGAMES_API", "NO_IAP" });
                    break;
            }

            return defines;
        }

        private static BuildPlayerOptions CreateBuildOptions(string buildPath, bool development)
        {
            // Ensure build directory exists
            Directory.CreateDirectory(buildPath);

            var buildOptions = new BuildPlayerOptions
            {
                scenes = GetEnabledScenes(),
                locationPathName = buildPath,
                target = BuildTarget.WebGL,
                options = GetBuildOptions(development)
            };

            return buildOptions;
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
            
            if (enabledScenes.Count == 0)
            {
                Debug.LogWarning("⚠️ No scenes enabled in build settings. Adding default scene.");
                enabledScenes.Add("Assets/Scenes/MainMenu.unity");
            }
            
            return enabledScenes.ToArray();
        }

        private static BuildOptions GetBuildOptions(bool development)
        {
            BuildOptions options = BuildOptions.None;
            
            if (development)
            {
                options |= BuildOptions.Development;
            }
            
            return options;
        }

        private static void ProcessBuildResult(BuildReport report, string platform, string buildPath)
        {
            if (report.summary.result == BuildResult.Succeeded)
            {
                Debug.Log($"✅ Build succeeded for {platform}");
                Debug.Log($"📁 Build location: {report.summary.outputPath}");
                Debug.Log($"📊 Build size: {report.summary.totalSize / (1024 * 1024)} MB");
                Debug.Log($"⏱️ Build time: {report.summary.totalTime.TotalMinutes:F2} minutes");
            }
            else
            {
                Debug.LogError($"❌ Build failed for {platform}");
                Debug.LogError($"❌ Error: {report.summary.result}");
                EditorApplication.Exit(1);
            }
        }

        private static void GeneratePlatformFiles(string platform, string buildPath)
        {
            Debug.Log($"📄 Generating {platform} platform files...");
            
            // Generate platform-specific HTML
            GeneratePlatformHTML(platform, buildPath);
            
            // Generate platform configuration
            GeneratePlatformConfig(platform, buildPath);
            
            // Copy platform-specific assets
            CopyPlatformAssets(platform, buildPath);
        }

        private static void GeneratePlatformHTML(string platform, string buildPath)
        {
            string htmlContent = GetPlatformHTMLContent(platform);
            string htmlPath = Path.Combine(buildPath, "index.html");
            
            File.WriteAllText(htmlPath, htmlContent);
            Debug.Log($"✅ Generated {platform} HTML: {htmlPath}");
        }

        private static string GetPlatformHTMLContent(string platform)
        {
            string title = GetPlatformTitle(platform);
            string sdkScript = GetPlatformSDKScript(platform);
            
            return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1, shrink-to-fit=no"">
    <meta name=""description"" content=""Infinite Match - {title}"">
    <title>Infinite Match - {title}</title>
    <link rel=""shortcut icon"" href=""TemplateData/favicon.ico"">
    <link rel=""stylesheet"" href=""TemplateData/style.css"">
    <style>
        body {{
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: 'Arial', sans-serif;
            overflow: hidden;
        }}
        #unity-container {{
            position: relative;
            width: 100vw;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }}
        #unity-canvas {{
            background: #231F20;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }}
        #unity-loading-bar {{
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            display: none;
        }}
        #unity-logo {{
            width: 154px;
            height: 130px;
            background: url('TemplateData/unity-logo-dark.png') no-repeat center / contain;
        }}
        #unity-progress-bar-empty {{
            width: 141px;
            height: 18px;
            margin-top: 10px;
            background: url('TemplateData/progress-bar-empty-dark.png') no-repeat center / contain;
        }}
        #unity-progress-bar-full {{
            width: 0%;
            height: 18px;
            background: url('TemplateData/progress-bar-full-dark.png') no-repeat center / contain;
        }}
        .loading-text {{
            color: white;
            text-align: center;
            margin-top: 20px;
            font-size: 18px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }}
    </style>
    {sdkScript}
</head>
<body>
    <div id=""unity-container"">
        <div id=""unity-loading-bar"">
            <div id=""unity-logo""></div>
            <div id=""unity-progress-bar-empty"">
                <div id=""unity-progress-bar-full""></div>
            </div>
            <div class=""loading-text"">Loading Infinite Match...</div>
        </div>
    </div>
    
    <script>
        var container = document.querySelector(""#unity-container"");
        var canvas = document.querySelector(""#unity-canvas"");
        var loadingBar = document.querySelector(""#unity-loading-bar"");
        var progressBarFull = document.querySelector(""#unity-progress-bar-full"");
        
        loadingBar.style.display = ""block"";
        
        var buildUrl = ""Build"";
        var loaderUrl = buildUrl + ""/WebGL.loader.js"";
        var config = {{
            dataUrl: buildUrl + ""/WebGL.data"",
            frameworkUrl: buildUrl + ""/WebGL.framework.js"",
            codeUrl: buildUrl + ""/WebGL.wasm"",
            streamingAssetsUrl: ""StreamingAssets"",
            companyName: ""Infinite Match"",
            productName: ""Infinite Match"",
            productVersion: ""1.0"",
        }};
        
        var script = document.createElement(""script"");
        script.src = loaderUrl;
        script.onload = () => {{
            createUnityInstance(canvas, config, (progress) => {{
                progressBarFull.style.width = 100 * progress + ""%"";
            }}).then((unityInstance) => {{
                loadingBar.style.display = ""none"";
            }}).catch((message) => {{
                alert(message);
            }});
        }};
        script.onerror = () => {{
            alert(""Failed to load Unity WebGL build. Please check your browser console for errors."");
        }};
        document.body.appendChild(script);
    </script>
</body>
</html>";
        }

        private static string GetPlatformTitle(string platform)
        {
            switch (platform.ToLower())
            {
                case "poki": return "Poki Game";
                case "facebook": return "Facebook Instant Game";
                case "snap": return "Snap Mini Game";
                case "tiktok": return "TikTok Mini Game";
                case "kongregate": return "Kongregate Game";
                case "crazygames": return "CrazyGames";
                default: return "WebGL Game";
            }
        }

        private static string GetPlatformSDKScript(string platform)
        {
            switch (platform.ToLower())
            {
                case "poki":
                    return @"<script src=""https://game-cdn.poki.com/scripts/v1/poki-sdk.js""></script>";
                case "facebook":
                    return @"<script src=""https://connect.facebook.net/en_US/fbinstant.6.2.js""></script>";
                case "snap":
                    return @"<script src=""https://sdk.snapchat.com/ssdk.js""></script>";
                case "tiktok":
                    return @"<script src=""https://developer.tiktok.com/mini-game/developer/js/tt.min.js""></script>";
                default:
                    return "";
            }
        }

        private static void GeneratePlatformConfig(string platform, string buildPath)
        {
            var config = new
            {
                platform = platform,
                gameName = "Infinite Match",
                version = "1.0.0",
                buildTime = System.DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                settings = new
                {
                    memorySize = GetMemorySizeForPlatform(platform),
                    compression = true,
                    dataCaching = true
                }
            };

            string configJson = JsonUtility.ToJson(config, true);
            string configPath = Path.Combine(buildPath, "platform-config.json");
            
            File.WriteAllText(configPath, configJson);
            Debug.Log($"✅ Generated platform config: {configPath}");
        }

        private static void CopyPlatformAssets(string platform, string buildPath)
        {
            string sourceAssetsPath = Path.Combine(Application.streamingAssetsPath, "PlatformAssets", platform);
            string destAssetsPath = Path.Combine(buildPath, "PlatformAssets");
            
            if (Directory.Exists(sourceAssetsPath))
            {
                Directory.CreateDirectory(destAssetsPath);
                CopyDirectory(sourceAssetsPath, destAssetsPath);
                Debug.Log($"✅ Copied {platform} platform assets");
            }
        }

        private static void CopyDirectory(string sourceDir, string destDir)
        {
            Directory.CreateDirectory(destDir);
            
            foreach (string file in Directory.GetFiles(sourceDir))
            {
                string fileName = Path.GetFileName(file);
                File.Copy(file, Path.Combine(destDir, fileName), true);
            }
            
            foreach (string subDir in Directory.GetDirectories(sourceDir))
            {
                string subDirName = Path.GetFileName(subDir);
                CopyDirectory(subDir, Path.Combine(destDir, subDirName));
            }
        }
    }
}
