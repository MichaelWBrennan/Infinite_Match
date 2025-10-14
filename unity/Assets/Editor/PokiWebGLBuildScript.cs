using UnityEngine;
using UnityEditor;
using UnityEditor.Build.Reporting;
using System.IO;
using System.Collections.Generic;
using System.Text;
using Newtonsoft.Json;

namespace Evergreen.Editor
{
    /// <summary>
    /// Poki WebGL build script optimized for Vercel deployment
    /// </summary>
    public class PokiWebGLBuildScript : EditorWindow
    {
        [Header("Poki WebGL Build Configuration")]
        [SerializeField] private string buildPath = "webgl";
        [SerializeField] private bool enablePokiSDK = true;
        [SerializeField] private bool enableCompression = true;
        [SerializeField] private bool enableMemoryOptimization = true;
        [SerializeField] private bool enableVercelOptimization = true;
        
        [Header("Build Settings")]
        [SerializeField] private bool developmentBuild = false;
        [SerializeField] private bool allowDebugging = false;
        [SerializeField] private bool enableProfiler = false;
        [SerializeField] private bool enableExceptionSupport = false;
        
        [Header("Poki Integration")]
        [SerializeField] private string pokiGameId = "your_game_id_here";
        [SerializeField] private string pokiApiKey = "your_api_key_here";
        [SerializeField] private bool enablePokiAds = true;
        [SerializeField] private bool enablePokiSocial = true;
        [SerializeField] private bool enablePokiAnalytics = true;
        
        [MenuItem("Evergreen/Build/Poki WebGL Build")]
        public static void ShowWindow()
        {
            GetWindow<PokiWebGLBuildScript>("Poki WebGL Build");
        }
        
        void OnGUI()
        {
            GUILayout.Label("Poki WebGL Build Script", EditorStyles.boldLabel);
            GUILayout.Space(10);
            
            // Build Configuration
            GUILayout.Label("Build Configuration", EditorStyles.boldLabel);
            buildPath = EditorGUILayout.TextField("Build Path", buildPath);
            enablePokiSDK = EditorGUILayout.Toggle("Enable Poki SDK", enablePokiSDK);
            enableCompression = EditorGUILayout.Toggle("Enable Compression", enableCompression);
            enableMemoryOptimization = EditorGUILayout.Toggle("Enable Memory Optimization", enableMemoryOptimization);
            enableVercelOptimization = EditorGUILayout.Toggle("Enable Vercel Optimization", enableVercelOptimization);
            GUILayout.Space(5);
            
            // Build Settings
            GUILayout.Label("Build Settings", EditorStyles.boldLabel);
            developmentBuild = EditorGUILayout.Toggle("Development Build", developmentBuild);
            allowDebugging = EditorGUILayout.Toggle("Allow Debugging", allowDebugging);
            enableProfiler = EditorGUILayout.Toggle("Enable Profiler", enableProfiler);
            enableExceptionSupport = EditorGUILayout.Toggle("Enable Exception Support", enableExceptionSupport);
            GUILayout.Space(5);
            
            // Poki Integration
            GUILayout.Label("Poki Integration", EditorStyles.boldLabel);
            pokiGameId = EditorGUILayout.TextField("Poki Game ID", pokiGameId);
            pokiApiKey = EditorGUILayout.TextField("Poki API Key", pokiApiKey);
            enablePokiAds = EditorGUILayout.Toggle("Enable Poki Ads", enablePokiAds);
            enablePokiSocial = EditorGUILayout.Toggle("Enable Poki Social", enablePokiSocial);
            enablePokiAnalytics = EditorGUILayout.Toggle("Enable Poki Analytics", enablePokiAnalytics);
            GUILayout.Space(10);
            
            // Build Buttons
            GUILayout.BeginHorizontal();
            if (GUILayout.Button("Build Poki WebGL", GUILayout.Height(30)))
            {
                BuildPokiWebGL();
            }
            if (GUILayout.Button("Build & Deploy to Vercel", GUILayout.Height(30)))
            {
                BuildAndDeployToVercel();
            }
            GUILayout.EndHorizontal();
            GUILayout.Space(5);
            
            // Additional Actions
            GUILayout.BeginHorizontal();
            if (GUILayout.Button("Validate Poki Configuration"))
            {
                ValidatePokiConfiguration();
            }
            if (GUILayout.Button("Generate Poki HTML"))
            {
                GeneratePokiHTML();
            }
            GUILayout.EndHorizontal();
        }
        
        private void BuildPokiWebGL()
        {
            Debug.Log("🎮 Building Poki WebGL...");
            
            // Configure Poki-specific settings
            ConfigurePokiSettings();
            
            // Apply Poki build defines
            ApplyPokiBuildDefines();
            
            // Configure WebGL settings for Poki
            ConfigureWebGLSettings();
            
            // Build the project
            BuildPlayerOptions buildOptions = CreatePokiBuildOptions();
            BuildReport report = BuildPipeline.BuildPlayer(buildOptions);
            
            // Process build result
            ProcessBuildResult(report);
            
            // Generate Poki-specific files
            GeneratePokiFiles();
        }
        
        private void BuildAndDeployToVercel()
        {
            Debug.Log("🚀 Building and deploying to Vercel...");
            
            // Build Poki WebGL
            BuildPokiWebGL();
            
            // Generate Vercel configuration
            GenerateVercelConfig();
            
            // Deploy to Vercel
            DeployToVercel();
        }
        
        private void ConfigurePokiSettings()
        {
            Debug.Log("🎮 Configuring Poki settings...");
            
            // Set Poki-specific player settings
            PlayerSettings.WebGL.memorySize = enableMemoryOptimization ? 256 : 512;
            PlayerSettings.WebGL.dataCaching = true;
            PlayerSettings.WebGL.exceptionSupport = enableExceptionSupport ? 
                WebGLExceptionSupport.ExplicitlyThrownExceptionsOnly : 
                WebGLExceptionSupport.None;
            PlayerSettings.WebGL.compressionFormat = enableCompression ? 
                WebGLCompressionFormat.Gzip : 
                WebGLCompressionFormat.Disabled;
            
            // Set build settings
            EditorUserBuildSettings.development = developmentBuild;
            EditorUserBuildSettings.allowDebugging = allowDebugging;
            EditorUserBuildSettings.connectProfiler = enableProfiler;
        }
        
        private void ApplyPokiBuildDefines()
        {
            Debug.Log("🔧 Applying Poki build defines...");
            
            List<string> defines = new List<string>
            {
                "UNITY_WEBGL",
                "POKI_PLATFORM",
                "WEBGL_BUILD",
                "NO_IAP",
                "POKI_ADS_ONLY"
            };
            
            if (enablePokiSDK)
            {
                defines.Add("POKI_SDK_ENABLED");
            }
            
            if (enablePokiAds)
            {
                defines.Add("POKI_ADS_ENABLED");
            }
            
            if (enablePokiSocial)
            {
                defines.Add("POKI_SOCIAL_ENABLED");
            }
            
            if (enablePokiAnalytics)
            {
                defines.Add("POKI_ANALYTICS_ENABLED");
            }
            
            string defineString = string.Join(";", defines);
            PlayerSettings.SetScriptingDefineSymbolsForGroup(BuildTargetGroup.WebGL, defineString);
            
            Debug.Log($"🔧 Applied build defines: {defineString}");
        }
        
        private void ConfigureWebGLSettings()
        {
            Debug.Log("🌐 Configuring WebGL settings...");
            
            // Configure WebGL template for Poki
            PlayerSettings.WebGL.template = "PROJECT:Default";
            
            // Set WebGL-specific settings
            PlayerSettings.WebGL.nameFilesAsHashes = true;
            PlayerSettings.WebGL.dataCaching = true;
            PlayerSettings.WebGL.threadsSupport = false;
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Gzip;
            
            // Configure for Vercel deployment
            if (enableVercelOptimization)
            {
                PlayerSettings.WebGL.memorySize = 256; // Optimize for Vercel
                PlayerSettings.WebGL.dataCaching = true;
            }
        }
        
        private BuildPlayerOptions CreatePokiBuildOptions()
        {
            var buildOptions = new BuildPlayerOptions
            {
                scenes = GetEnabledScenes(),
                locationPathName = buildPath,
                target = BuildTarget.WebGL,
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
            
            if (enableProfiler)
            {
                options |= BuildOptions.ConnectWithProfiler;
            }
            
            return options;
        }
        
        private void ProcessBuildResult(BuildReport report)
        {
            if (report.summary.result == BuildResult.Succeeded)
            {
                Debug.Log("✅ Poki WebGL build succeeded!");
                Debug.Log($"📁 Build location: {report.summary.outputPath}");
                Debug.Log($"📊 Build size: {report.summary.totalSize / (1024 * 1024)} MB");
                Debug.Log($"⏱️ Build time: {report.summary.totalTime.TotalMinutes:F2} minutes");
            }
            else
            {
                Debug.LogError("❌ Poki WebGL build failed!");
                Debug.LogError($"❌ Error: {report.summary.result}");
            }
        }
        
        private void GeneratePokiFiles()
        {
            Debug.Log("📄 Generating Poki-specific files...");
            
            // Generate Poki HTML
            GeneratePokiHTML();
            
            // Generate Poki configuration
            GeneratePokiConfig();
            
            // Generate Vercel configuration
            GenerateVercelConfig();
        }
        
        private void GeneratePokiHTML()
        {
            Debug.Log("📄 Generating Poki HTML...");
            
            string htmlContent = GeneratePokiHTMLContent();
            string htmlPath = Path.Combine(buildPath, "index.html");
            
            File.WriteAllText(htmlPath, htmlContent);
            Debug.Log($"✅ Poki HTML generated: {htmlPath}");
        }
        
        private string GeneratePokiHTMLContent()
        {
            StringBuilder html = new StringBuilder();
            
            html.AppendLine("<!DOCTYPE html>");
            html.AppendLine("<html lang=\"en\">");
            html.AppendLine("<head>");
            html.AppendLine("    <meta charset=\"utf-8\">");
            html.AppendLine("    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1, shrink-to-fit=no\">");
            html.AppendLine("    <meta name=\"description\" content=\"Unity WebGL Game on Poki\">");
            html.AppendLine("    <title>Unity WebGL Game - Poki</title>");
            html.AppendLine("    <style>");
            html.AppendLine("        html, body {");
            html.AppendLine("            height: 100%;");
            html.AppendLine("            margin: 0;");
            html.AppendLine("            padding: 0;");
            html.AppendLine("            background: #000;");
            html.AppendLine("            color: #fff;");
            html.AppendLine("            font-family: Arial, sans-serif;");
            html.AppendLine("            overflow: hidden;");
            html.AppendLine("        }");
            html.AppendLine("        #unity-container {");
            html.AppendLine("            width: 100%;");
            html.AppendLine("            height: 100%;");
            html.AppendLine("            display: flex;");
            html.AppendLine("            align-items: center;");
            html.AppendLine("            justify-content: center;");
            html.AppendLine("        }");
            html.AppendLine("        #unity-canvas {");
            html.AppendLine("            background: #231F20;");
            html.AppendLine("            display: block;");
            html.AppendLine("        }");
            html.AppendLine("        #unity-loading-bar {");
            html.AppendLine("            position: absolute;");
            html.AppendLine("            left: 50%;");
            html.AppendLine("            top: 50%;");
            html.AppendLine("            transform: translate(-50%, -50%);");
            html.AppendLine("            display: none;");
            html.AppendLine("        }");
            html.AppendLine("        #unity-logo {");
            html.AppendLine("            width: 154px;");
            html.AppendLine("            height: 130px;");
            html.AppendLine("            background: url('TemplateData/unity-logo-dark.png') no-repeat center / contain;");
            html.AppendLine("        }");
            html.AppendLine("        #unity-progress-bar-empty {");
            html.AppendLine("            width: 141px;");
            html.AppendLine("            height: 18px;");
            html.AppendLine("            margin-top: 10px;");
            html.AppendLine("            background: url('TemplateData/progress-bar-empty-dark.png') no-repeat center / contain;");
            html.AppendLine("        }");
            html.AppendLine("        #unity-progress-bar-full {");
            html.AppendLine("            width: 0%;");
            html.AppendLine("            height: 18px;");
            html.AppendLine("            background: url('TemplateData/progress-bar-full-dark.png') no-repeat center / contain;");
            html.AppendLine("        }");
            html.AppendLine("        #unity-footer {");
            html.AppendLine("            position: relative;");
            html.AppendLine("        }");
            html.AppendLine("        #unity-webgl-logo {");
            html.AppendLine("            float: left;");
            html.AppendLine("            width: 204px;");
            html.AppendLine("            height: 38px;");
            html.AppendLine("            background: url('TemplateData/webgl-logo.png') no-repeat center / contain;");
            html.AppendLine("        }");
            html.AppendLine("        #unity-fullscreen-button {");
            html.AppendLine("            float: right;");
            html.AppendLine("            width: 38px;");
            html.AppendLine("            height: 38px;");
            html.AppendLine("            background: url('TemplateData/fullscreen-button.png') no-repeat center / contain;");
            html.AppendLine("        }");
            html.AppendLine("        #unity-mobile-warning {");
            html.AppendLine("            position: absolute;");
            html.AppendLine("            left: 50%;");
            html.AppendLine("            top: 5%;");
            html.AppendLine("            transform: translate(-50%, -5%);");
            html.AppendLine("            background: #000;");
            html.AppendLine("            color: #fff;");
            html.AppendLine("            padding: 10px;");
            html.AppendLine("            border-radius: 5px;");
            html.AppendLine("            display: none;");
            html.AppendLine("        }");
            html.AppendLine("    </style>");
            html.AppendLine("</head>");
            html.AppendLine("<body>");
            html.AppendLine("    <div id=\"unity-container\" class=\"unity-desktop\">");
            html.AppendLine("        <canvas id=\"unity-canvas\" tabindex=\"-1\"></canvas>");
            html.AppendLine("        <div id=\"unity-loading-bar\">");
            html.AppendLine("            <div id=\"unity-logo\"></div>");
            html.AppendLine("            <div id=\"unity-progress-bar-empty\">");
            html.AppendLine("                <div id=\"unity-progress-bar-full\"></div>");
            html.AppendLine("            </div>");
            html.AppendLine("        </div>");
            html.AppendLine("        <div id=\"unity-mobile-warning\">");
            html.AppendLine("            WebGL builds are not supported on mobile devices.");
            html.AppendLine("        </div>");
            html.AppendLine("    </div>");
            html.AppendLine("    <script>");
            html.AppendLine("        var container = document.querySelector(\"#unity-container\");");
            html.AppendLine("        var canvas = document.querySelector(\"#unity-canvas\");");
            html.AppendLine("        var loadingBar = document.querySelector(\"#unity-loading-bar\");");
            html.AppendLine("        var progressBarFull = document.querySelector(\"#unity-progress-bar-full\");");
            html.AppendLine("        var fullscreenButton = document.querySelector(\"#unity-fullscreen-button\");");
            html.AppendLine("        var mobileWarning = document.querySelector(\"#unity-mobile-warning\");");
            html.AppendLine("");
            html.AppendLine("        // Show a mobile message if the user is on a mobile device");
            html.AppendLine("        if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {");
            html.AppendLine("            container.className = \"unity-mobile\";");
            html.AppendLine("            mobileWarning.style.display = \"block\";");
            html.AppendLine("        }");
            html.AppendLine("        else {");
            html.AppendLine("            canvas.style.width = \"960px\";");
            html.AppendLine("            canvas.style.height = \"600px\";");
            html.AppendLine("        }");
            html.AppendLine("        loadingBar.style.display = \"block\";");
            html.AppendLine("");
            html.AppendLine("        var buildUrl = \"Build\";");
            html.AppendLine("        var loaderUrl = buildUrl + \"/WebGL.loader.js\";");
            html.AppendLine("        var config = {");
            html.AppendLine("            dataUrl: buildUrl + \"/WebGL.data\",");
            html.AppendLine("            frameworkUrl: buildUrl + \"/WebGL.framework.js\",");
            html.AppendLine("            codeUrl: buildUrl + \"/WebGL.wasm\",");
            html.AppendLine("            streamingAssetsUrl: \"StreamingAssets\",");
            html.AppendLine("            companyName: \"YourCompany\",");
            html.AppendLine("            productName: \"YourGame\",");
            html.AppendLine("            productVersion: \"1.0\",");
            html.AppendLine("        };");
            html.AppendLine("");
            html.AppendLine("        // Poki SDK Integration");
            html.AppendLine("        if (typeof window.pokiSDK !== 'undefined') {");
            html.AppendLine("            config.pokiSDK = window.pokiSDK;");
            html.AppendLine("        }");
            html.AppendLine("");
            html.AppendLine("        var script = document.createElement(\"script\");");
            html.AppendLine("        script.src = loaderUrl;");
            html.AppendLine("        script.onload = () => {");
            html.AppendLine("            createUnityInstance(canvas, config, (progress) => {");
            html.AppendLine("                progressBarFull.style.width = 100 * progress + \"%\";");
            html.AppendLine("            }).then((unityInstance) => {");
            html.AppendLine("                loadingBar.style.display = \"none\";");
            html.AppendLine("                fullscreenButton.onclick = () => {");
            html.AppendLine("                    unityInstance.SetFullscreen(1);");
            html.AppendLine("                };");
            html.AppendLine("            }).catch((message) => {");
            html.AppendLine("                alert(message);");
            html.AppendLine("            });");
            html.AppendLine("        };");
            html.AppendLine("        script.onerror = () => {");
            html.AppendLine("            alert(\"Failed to load Unity WebGL build. Please check your browser console for errors.\");");
            html.AppendLine("        };");
            html.AppendLine("        document.body.appendChild(script);");
            html.AppendLine("    </script>");
            html.AppendLine("</body>");
            html.AppendLine("</html>");
            
            return html.ToString();
        }
        
        private void GeneratePokiConfig()
        {
            Debug.Log("⚙️ Generating Poki configuration...");
            
            var pokiConfig = new
            {
                gameId = pokiGameId,
                apiKey = pokiApiKey,
                environment = "production",
                features = new
                {
                    ads = enablePokiAds,
                    social = enablePokiSocial,
                    analytics = enablePokiAnalytics
                },
                settings = new
                {
                    memoryOptimization = enableMemoryOptimization,
                    compression = enableCompression,
                    vercelOptimization = enableVercelOptimization
                }
            };
            
            string configJson = JsonConvert.SerializeObject(pokiConfig, Formatting.Indented);
            string configPath = Path.Combine(buildPath, "poki-config.json");
            
            File.WriteAllText(configPath, configJson);
            Debug.Log($"✅ Poki configuration generated: {configPath}");
        }
        
        private void GenerateVercelConfig()
        {
            Debug.Log("🚀 Generating Vercel configuration...");
            
            var vercelConfig = new
            {
                version = 2,
                rewrites = new[]
                {
                    new { source = "/", destination = "/webgl/index.html" }
                },
                headers = new[]
                {
                    new
                    {
                        source = "/index.html",
                        headers = new[]
                        {
                            new { key = "Cache-Control", value = "no-cache" }
                        }
                    },
                    new
                    {
                        source = "/Build/*.data.br",
                        headers = new[]
                        {
                            new { key = "Content-Type", value = "application/octet-stream" },
                            new { key = "Content-Encoding", value = "br" },
                            new { key = "Cache-Control", value = "public, max-age=31536000, immutable" }
                        }
                    },
                    new
                    {
                        source = "/Build/*.wasm.br",
                        headers = new[]
                        {
                            new { key = "Content-Type", value = "application/wasm" },
                            new { key = "Content-Encoding", value = "br" },
                            new { key = "Cache-Control", value = "public, max-age=31536000, immutable" }
                        }
                    },
                    new
                    {
                        source = "/Build/*.js.br",
                        headers = new[]
                        {
                            new { key = "Content-Type", value = "application/javascript" },
                            new { key = "Content-Encoding", value = "br" },
                            new { key = "Cache-Control", value = "public, max-age=31536000, immutable" }
                        }
                    },
                    new
                    {
                        source = "/Build/*.data.gz",
                        headers = new[]
                        {
                            new { key = "Content-Type", value = "application/octet-stream" },
                            new { key = "Content-Encoding", value = "gzip" },
                            new { key = "Cache-Control", value = "public, max-age=31536000, immutable" }
                        }
                    },
                    new
                    {
                        source = "/Build/*.wasm.gz",
                        headers = new[]
                        {
                            new { key = "Content-Type", value = "application/wasm" },
                            new { key = "Content-Encoding", value = "gzip" },
                            new { key = "Cache-Control", value = "public, max-age=31536000, immutable" }
                        }
                    },
                    new
                    {
                        source = "/Build/*.js.gz",
                        headers = new[]
                        {
                            new { key = "Content-Type", value = "application/javascript" },
                            new { key = "Content-Encoding", value = "gzip" },
                            new { key = "Cache-Control", value = "public, max-age=31536000, immutable" }
                        }
                    },
                    new
                    {
                        source = "/Build/*.json",
                        headers = new[]
                        {
                            new { key = "Content-Type", value = "application/json" },
                            new { key = "Cache-Control", value = "public, max-age=3600" }
                        }
                    },
                    new
                    {
                        source = "/TemplateData/(.*)",
                        headers = new[]
                        {
                            new { key = "Cache-Control", value = "public, max-age=31536000, immutable" }
                        }
                    }
                }
            };
            
            string vercelJson = JsonConvert.SerializeObject(vercelConfig, Formatting.Indented);
            string vercelPath = Path.Combine(buildPath, "vercel.json");
            
            File.WriteAllText(vercelPath, vercelJson);
            Debug.Log($"✅ Vercel configuration generated: {vercelPath}");
        }
        
        private void ValidatePokiConfiguration()
        {
            Debug.Log("🔍 Validating Poki configuration...");
            
            bool isValid = true;
            List<string> errors = new List<string>();
            
            if (string.IsNullOrEmpty(pokiGameId) || pokiGameId == "your_game_id_here")
            {
                errors.Add("Poki Game ID is not set");
                isValid = false;
            }
            
            if (string.IsNullOrEmpty(pokiApiKey) || pokiApiKey == "your_api_key_here")
            {
                errors.Add("Poki API Key is not set");
                isValid = false;
            }
            
            if (!Directory.Exists(buildPath))
            {
                errors.Add("Build path does not exist");
                isValid = false;
            }
            
            if (isValid)
            {
                Debug.Log("✅ Poki configuration is valid");
            }
            else
            {
                Debug.LogError("❌ Poki configuration validation failed:");
                foreach (string error in errors)
                {
                    Debug.LogError($"❌ {error}");
                }
            }
        }
        
        private void DeployToVercel()
        {
            Debug.Log("🚀 Deploying to Vercel...");
            
            // This would typically use Vercel CLI or API
            // For now, we'll just log the deployment steps
            Debug.Log("📋 Vercel deployment steps:");
            Debug.Log("1. Install Vercel CLI: npm i -g vercel");
            Debug.Log("2. Navigate to build directory: cd webgl");
            Debug.Log("3. Deploy: vercel --prod");
            Debug.Log("4. Or use Vercel dashboard to deploy the webgl folder");
        }
    }
}