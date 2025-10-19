using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System;

namespace Evergreen.Ads
{
    /// <summary>
    /// Build script for Unity Ads that works without the Unity editor
    /// Automatically configures everything during build
    /// </summary>
    public class UnityAdsBuildScript : MonoBehaviour
    {
        [Header("Build Configuration")]
        public bool enableBuildTimeSetup = true;
        public bool enableAutoConfiguration = true;
        public bool enableFileGeneration = true;
        public bool enablePlatformDetection = true;
        
        [Header("Build Settings")]
        public string buildOutputPath = "Builds";
        public string configOutputPath = "Config";
        public bool createBuildManifest = true;
        public bool createPlatformConfigs = true;
        
        [Header("Platform Settings")]
        public bool buildAndroid = true;
        public bool buildiOS = true;
        public bool buildWebGL = true;
        public bool buildDesktop = true;
        
        private UnityAdsAutoSetup _autoSetup;
        private BuildConfiguration _buildConfig;
        
        void Start()
        {
            if (enableBuildTimeSetup)
            {
                StartCoroutine(SetupBuildTimeConfiguration());
            }
        }
        
        private IEnumerator SetupBuildTimeConfiguration()
        {
            Debug.Log("[UnityAdsBuildScript] Starting build-time configuration...");
            
            // Step 1: Detect platform and create build configuration
            yield return StartCoroutine(CreateBuildConfiguration());
            
            // Step 2: Setup Unity Ads for current platform
            yield return StartCoroutine(SetupPlatformSpecificConfiguration());
            
            // Step 3: Generate build files
            if (enableFileGeneration)
            {
                yield return StartCoroutine(GenerateBuildFiles());
            }
            
            // Step 4: Create build manifest
            if (createBuildManifest)
            {
                yield return StartCoroutine(CreateBuildManifest());
            }
            
            Debug.Log("[UnityAdsBuildScript] Build-time configuration complete!");
        }
        
        private IEnumerator CreateBuildConfiguration()
        {
            Debug.Log("[UnityAdsBuildScript] Creating build configuration...");
            
            _buildConfig = new BuildConfiguration
            {
                buildTime = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                platform = Application.platform.ToString(),
                unityVersion = Application.unityVersion,
                buildNumber = GetBuildNumber(),
                gameId = GetGameId(),
                gameName = GetGameName(),
                bundleId = GetBundleId(),
                enableTestMode = IsTestMode(),
                enableDebugLogs = IsDebugMode(),
                platforms = new List<PlatformBuildConfig>()
            };
            
            // Add platform-specific configurations
            if (buildAndroid)
            {
                _buildConfig.platforms.Add(CreatePlatformBuildConfig("Android"));
            }
            
            if (buildiOS)
            {
                _buildConfig.platforms.Add(CreatePlatformBuildConfig("iOS"));
            }
            
            if (buildWebGL)
            {
                _buildConfig.platforms.Add(CreatePlatformBuildConfig("WebGL"));
            }
            
            if (buildDesktop)
            {
                _buildConfig.platforms.Add(CreatePlatformBuildConfig("Desktop"));
            }
            
            yield return null;
        }
        
        private PlatformBuildConfig CreatePlatformBuildConfig(string platform)
        {
            return new PlatformBuildConfig
            {
                platform = platform,
                interstitialAdId = $"Interstitial_{platform}",
                rewardedAdId = $"Rewarded_{platform}",
                bannerAdId = $"Banner_{platform}",
                enabled = true,
                buildPath = Path.Combine(buildOutputPath, platform),
                configPath = Path.Combine(configOutputPath, platform)
            };
        }
        
        private IEnumerator SetupPlatformSpecificConfiguration()
        {
            Debug.Log("[UnityAdsBuildScript] Setting up platform-specific configuration...");
            
            // Get or create auto setup component
            _autoSetup = FindObjectOfType<UnityAdsAutoSetup>();
            if (_autoSetup == null)
            {
                var go = new GameObject("UnityAdsAutoSetup");
                _autoSetup = go.AddComponent<UnityAdsAutoSetup>();
            }
            
            // Configure for current platform
            var currentPlatform = Application.platform.ToString();
            var platformConfig = _buildConfig.platforms.Find(p => p.platform == currentPlatform);
            
            if (platformConfig != null)
            {
                _autoSetup.gameId = _buildConfig.gameId;
                _autoSetup.gameName = _buildConfig.gameName;
                _autoSetup.bundleId = _buildConfig.bundleId;
                _autoSetup.enableTestMode = _buildConfig.enableTestMode;
                _autoSetup.enableDebugLogs = _buildConfig.enableDebugLogs;
                
                // Set platform-specific settings
                switch (currentPlatform)
                {
                    case "Android":
                        _autoSetup.enableAndroid = true;
                        _autoSetup.enableiOS = false;
                        _autoSetup.enableWebGL = false;
                        break;
                    case "IPhonePlayer":
                        _autoSetup.enableAndroid = false;
                        _autoSetup.enableiOS = true;
                        _autoSetup.enableWebGL = false;
                        break;
                    case "WebGLPlayer":
                        _autoSetup.enableAndroid = false;
                        _autoSetup.enableiOS = false;
                        _autoSetup.enableWebGL = true;
                        break;
                    default:
                        _autoSetup.enableAndroid = true;
                        _autoSetup.enableiOS = true;
                        _autoSetup.enableWebGL = false;
                        break;
                }
            }
            
            yield return null;
        }
        
        private IEnumerator GenerateBuildFiles()
        {
            Debug.Log("[UnityAdsBuildScript] Generating build files...");
            
            // Create output directories
            Directory.CreateDirectory(buildOutputPath);
            Directory.CreateDirectory(configOutputPath);
            
            // Generate platform-specific configuration files
            foreach (var platform in _buildConfig.platforms)
            {
                var platformConfigPath = Path.Combine(configOutputPath, $"{platform.platform.ToLower()}_config.json");
                var platformConfigJson = JsonUtility.ToJson(platform, true);
                File.WriteAllText(platformConfigPath, platformConfigJson);
            }
            
            // Generate build configuration file
            var buildConfigPath = Path.Combine(configOutputPath, "build_config.json");
            var buildConfigJson = JsonUtility.ToJson(_buildConfig, true);
            File.WriteAllText(buildConfigPath, buildConfigJson);
            
            // Generate Unity Ads manifest
            var manifestPath = Path.Combine(configOutputPath, "unity_ads_manifest.json");
            var manifest = CreateUnityAdsManifest();
            File.WriteAllText(manifestPath, JsonUtility.ToJson(manifest, true));
            
            Debug.Log($"[UnityAdsBuildScript] Build files generated in: {configOutputPath}");
            
            yield return null;
        }
        
        private IEnumerator CreateBuildManifest()
        {
            Debug.Log("[UnityAdsBuildScript] Creating build manifest...");
            
            var manifest = new BuildManifest
            {
                version = "1.0.0",
                buildTime = _buildConfig.buildTime,
                platform = _buildConfig.platform,
                unityVersion = _buildConfig.unityVersion,
                buildNumber = _buildConfig.buildNumber,
                gameId = _buildConfig.gameId,
                gameName = _buildConfig.gameName,
                bundleId = _buildConfig.bundleId,
                platforms = _buildConfig.platforms,
                settings = new BuildSettings
                {
                    enableTestMode = _buildConfig.enableTestMode,
                    enableDebugLogs = _buildConfig.enableDebugLogs,
                    buildOutputPath = buildOutputPath,
                    configOutputPath = configOutputPath
                }
            };
            
            var manifestPath = Path.Combine(configOutputPath, "build_manifest.json");
            var manifestJson = JsonUtility.ToJson(manifest, true);
            File.WriteAllText(manifestPath, manifestJson);
            
            Debug.Log($"[UnityAdsBuildScript] Build manifest created: {manifestPath}");
            
            yield return null;
        }
        
        private UnityAdsManifest CreateUnityAdsManifest()
        {
            return new UnityAdsManifest
            {
                version = "1.0.0",
                gameId = _buildConfig.gameId,
                gameName = _buildConfig.gameName,
                bundleId = _buildConfig.bundleId,
                platforms = _buildConfig.platforms.ConvertAll(p => new PlatformConfiguration
                {
                    platform = p.platform,
                    interstitialAdId = p.interstitialAdId,
                    rewardedAdId = p.rewardedAdId,
                    bannerAdId = p.bannerAdId,
                    enabled = p.enabled
                }),
                adUnits = new List<AdUnitManifest>
                {
                    new AdUnitManifest
                    {
                        name = "Interstitial",
                        type = "interstitial",
                        platforms = _buildConfig.platforms.ConvertAll(p => p.platform)
                    },
                    new AdUnitManifest
                    {
                        name = "Rewarded",
                        type = "rewarded",
                        platforms = _buildConfig.platforms.ConvertAll(p => p.platform)
                    },
                    new AdUnitManifest
                    {
                        name = "Banner",
                        type = "banner",
                        platforms = _buildConfig.platforms.ConvertAll(p => p.platform)
                    }
                },
                settings = new AdSettings
                {
                    enableTestMode = _buildConfig.enableTestMode,
                    enableDebugLogs = _buildConfig.enableDebugLogs,
                    baseRevenuePerAd = 0.02f,
                    adFrequencyMultiplier = 1.0f,
                    minAdInterval = 30f,
                    maxAdInterval = 120f
                }
            };
        }
        
        // Helper methods
        private string GetBuildNumber()
        {
            return DateTime.Now.ToString("yyyyMMddHHmmss");
        }
        
        private string GetGameId()
        {
            // Try to get from environment variable or use default
            var gameId = Environment.GetEnvironmentVariable("UNITY_ADS_GAME_ID");
            return !string.IsNullOrEmpty(gameId) ? gameId : "1234567";
        }
        
        private string GetGameName()
        {
            var gameName = Environment.GetEnvironmentVariable("UNITY_ADS_GAME_NAME");
            return !string.IsNullOrEmpty(gameName) ? gameName : Application.productName;
        }
        
        private string GetBundleId()
        {
            var bundleId = Environment.GetEnvironmentVariable("UNITY_ADS_BUNDLE_ID");
            return !string.IsNullOrEmpty(bundleId) ? bundleId : Application.identifier;
        }
        
        private bool IsTestMode()
        {
            var testMode = Environment.GetEnvironmentVariable("UNITY_ADS_TEST_MODE");
            return string.IsNullOrEmpty(testMode) || testMode.ToLower() == "true";
        }
        
        private bool IsDebugMode()
        {
            var debugMode = Environment.GetEnvironmentVariable("UNITY_ADS_DEBUG_MODE");
            return !string.IsNullOrEmpty(debugMode) && debugMode.ToLower() == "true";
        }
        
        // Public API
        public BuildConfiguration GetBuildConfiguration()
        {
            return _buildConfig;
        }
        
        public void SetGameId(string gameId)
        {
            _buildConfig.gameId = gameId;
            if (_autoSetup != null)
            {
                _autoSetup.SetGameId(gameId);
            }
        }
        
        public void SetTestMode(bool enable)
        {
            _buildConfig.enableTestMode = enable;
            if (_autoSetup != null)
            {
                _autoSetup.SetTestMode(enable);
            }
        }
    }
    
    [System.Serializable]
    public class BuildConfiguration
    {
        public string buildTime;
        public string platform;
        public string unityVersion;
        public string buildNumber;
        public string gameId;
        public string gameName;
        public string bundleId;
        public bool enableTestMode;
        public bool enableDebugLogs;
        public List<PlatformBuildConfig> platforms;
    }
    
    [System.Serializable]
    public class PlatformBuildConfig
    {
        public string platform;
        public string interstitialAdId;
        public string rewardedAdId;
        public string bannerAdId;
        public bool enabled;
        public string buildPath;
        public string configPath;
    }
    
    [System.Serializable]
    public class BuildManifest
    {
        public string version;
        public string buildTime;
        public string platform;
        public string unityVersion;
        public string buildNumber;
        public string gameId;
        public string gameName;
        public string bundleId;
        public List<PlatformBuildConfig> platforms;
        public BuildSettings settings;
    }
    
    [System.Serializable]
    public class BuildSettings
    {
        public bool enableTestMode;
        public bool enableDebugLogs;
        public string buildOutputPath;
        public string configOutputPath;
    }
}