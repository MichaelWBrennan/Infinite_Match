using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System;

namespace Evergreen.Ads
{
    /// <summary>
    /// Automated Unity Ads setup that works without the Unity editor
    /// Configures everything programmatically
    /// </summary>
    public class UnityAdsAutoSetup : MonoBehaviour
    {
        [Header("Auto Setup Configuration")]
        public bool autoSetupOnStart = true;
        public bool enableTestMode = true;
        public bool enableDebugLogs = true;
        public bool createConfigFiles = true;
        
        [Header("Game Configuration")]
        public string gameId = "1234567"; // Will be auto-configured
        public string gameName = "My Unity Game";
        public string bundleId = "com.yourcompany.yourgame";
        
        [Header("Platform Settings")]
        public bool enableAndroid = true;
        public bool enableiOS = true;
        public bool enableWebGL = false;
        
        [Header("Ad Configuration")]
        public float baseRevenuePerAd = 0.02f;
        public float adFrequencyMultiplier = 1.0f;
        public float minAdInterval = 30f;
        public float maxAdInterval = 120f;
        
        private UnityAdsNoKeys _adSystem;
        private AdConfiguration _config;
        
        void Start()
        {
            if (autoSetupOnStart)
            {
                StartCoroutine(SetupUnityAdsAutomatically());
            }
        }
        
        private IEnumerator SetupUnityAdsAutomatically()
        {
            Debug.Log("[UnityAdsAutoSetup] Starting automated Unity Ads setup...");
            
            // Step 1: Create configuration
            yield return StartCoroutine(CreateConfiguration());
            
            // Step 2: Setup ad system
            yield return StartCoroutine(SetupAdSystem());
            
            // Step 3: Create config files
            if (createConfigFiles)
            {
                yield return StartCoroutine(CreateConfigFiles());
            }
            
            // Step 4: Initialize everything
            yield return StartCoroutine(InitializeEverything());
            
            Debug.Log("[UnityAdsAutoSetup] Automated setup complete!");
        }
        
        private IEnumerator CreateConfiguration()
        {
            Debug.Log("[UnityAdsAutoSetup] Creating configuration...");
            
            _config = new AdConfiguration
            {
                gameId = gameId,
                gameName = gameName,
                bundleId = bundleId,
                enableTestMode = enableTestMode,
                enableDebugLogs = enableDebugLogs,
                baseRevenuePerAd = baseRevenuePerAd,
                adFrequencyMultiplier = adFrequencyMultiplier,
                minAdInterval = minAdInterval,
                maxAdInterval = maxAdInterval,
                platforms = new List<PlatformConfiguration>()
            };
            
            // Add Android configuration
            if (enableAndroid)
            {
                _config.platforms.Add(new PlatformConfiguration
                {
                    platform = "Android",
                    interstitialAdId = "Interstitial_Android",
                    rewardedAdId = "Rewarded_Android",
                    bannerAdId = "Banner_Android",
                    enabled = true
                });
            }
            
            // Add iOS configuration
            if (enableiOS)
            {
                _config.platforms.Add(new PlatformConfiguration
                {
                    platform = "iOS",
                    interstitialAdId = "Interstitial_iOS",
                    rewardedAdId = "Rewarded_iOS",
                    bannerAdId = "Banner_iOS",
                    enabled = true
                });
            }
            
            // Add WebGL configuration
            if (enableWebGL)
            {
                _config.platforms.Add(new PlatformConfiguration
                {
                    platform = "WebGL",
                    interstitialAdId = "Interstitial_WebGL",
                    rewardedAdId = "Rewarded_WebGL",
                    bannerAdId = "Banner_WebGL",
                    enabled = true
                });
            }
            
            yield return null;
        }
        
        private IEnumerator SetupAdSystem()
        {
            Debug.Log("[UnityAdsAutoSetup] Setting up ad system...");
            
            // Wait for Unity Ads system to be available
            yield return new WaitUntil(() => UnityAdsNoKeys.Instance != null);
            
            _adSystem = UnityAdsNoKeys.Instance;
            
            // Configure the ad system
            _adSystem.gameId = _config.gameId;
            _adSystem.enableTestMode = _config.enableTestMode;
            _adSystem.enableDebugLogs = _config.enableDebugLogs;
            _adSystem.baseRevenuePerAd = _config.baseRevenuePerAd;
            _adSystem.adFrequencyMultiplier = _config.adFrequencyMultiplier;
            _adSystem.minAdInterval = _config.minAdInterval;
            _adSystem.maxAdInterval = _config.maxAdInterval;
            
            // Configure platform-specific ad units
            foreach (var platform in _config.platforms)
            {
                switch (platform.platform)
                {
                    case "Android":
                        _adSystem.androidAdUnits.interstitialAdId = platform.interstitialAdId;
                        _adSystem.androidAdUnits.rewardedAdId = platform.rewardedAdId;
                        _adSystem.androidAdUnits.bannerAdId = platform.bannerAdId;
                        break;
                    case "iOS":
                        _adSystem.iosAdUnits.interstitialAdId = platform.interstitialAdId;
                        _adSystem.iosAdUnits.rewardedAdId = platform.rewardedAdId;
                        _adSystem.iosAdUnits.bannerAdId = platform.bannerAdId;
                        break;
                    case "WebGL":
                        _adSystem.webglAdUnits.interstitialAdId = platform.interstitialAdId;
                        _adSystem.webglAdUnits.rewardedAdId = platform.rewardedAdId;
                        _adSystem.webglAdUnits.bannerAdId = platform.bannerAdId;
                        break;
                }
            }
            
            yield return null;
        }
        
        private IEnumerator CreateConfigFiles()
        {
            Debug.Log("[UnityAdsAutoSetup] Creating configuration files...");
            
            // Create JSON configuration file
            var configJson = JsonUtility.ToJson(_config, true);
            var configPath = Path.Combine(Application.persistentDataPath, "unity_ads_config.json");
            File.WriteAllText(configPath, configJson);
            
            // Create Unity Ads manifest file
            var manifestPath = Path.Combine(Application.persistentDataPath, "unity_ads_manifest.json");
            var manifest = CreateUnityAdsManifest();
            File.WriteAllText(manifestPath, JsonUtility.ToJson(manifest, true));
            
            // Create platform-specific configuration files
            foreach (var platform in _config.platforms)
            {
                var platformConfigPath = Path.Combine(Application.persistentDataPath, $"unity_ads_{platform.platform.ToLower()}.json");
                File.WriteAllText(platformConfigPath, JsonUtility.ToJson(platform, true));
            }
            
            Debug.Log($"[UnityAdsAutoSetup] Configuration files created in: {Application.persistentDataPath}");
            
            yield return null;
        }
        
        private UnityAdsManifest CreateUnityAdsManifest()
        {
            return new UnityAdsManifest
            {
                version = "1.0.0",
                gameId = _config.gameId,
                gameName = _config.gameName,
                bundleId = _config.bundleId,
                platforms = _config.platforms,
                adUnits = new List<AdUnitManifest>
                {
                    new AdUnitManifest
                    {
                        name = "Interstitial",
                        type = "interstitial",
                        platforms = new List<string> { "Android", "iOS", "WebGL" }
                    },
                    new AdUnitManifest
                    {
                        name = "Rewarded",
                        type = "rewarded",
                        platforms = new List<string> { "Android", "iOS", "WebGL" }
                    },
                    new AdUnitManifest
                    {
                        name = "Banner",
                        type = "banner",
                        platforms = new List<string> { "Android", "iOS", "WebGL" }
                    }
                },
                settings = new AdSettings
                {
                    enableTestMode = _config.enableTestMode,
                    enableDebugLogs = _config.enableDebugLogs,
                    baseRevenuePerAd = _config.baseRevenuePerAd,
                    adFrequencyMultiplier = _config.adFrequencyMultiplier,
                    minAdInterval = _config.minAdInterval,
                    maxAdInterval = _config.maxAdInterval
                }
            };
        }
        
        private IEnumerator InitializeEverything()
        {
            Debug.Log("[UnityAdsAutoSetup] Initializing everything...");
            
            // Wait for ad system to be ready
            yield return new WaitUntil(() => _adSystem != null);
            
            // Subscribe to events
            UnityAdsNoKeys.OnAdCompleted += OnAdCompleted;
            UnityAdsNoKeys.OnRevenueGenerated += OnRevenueGenerated;
            UnityAdsNoKeys.OnAdShown += OnAdShown;
            
            // Log setup completion
            LogSetupCompletion();
            
            yield return null;
        }
        
        private void LogSetupCompletion()
        {
            Debug.Log("[UnityAdsAutoSetup] === SETUP COMPLETE ===");
            Debug.Log($"Game ID: {_config.gameId}");
            Debug.Log($"Game Name: {_config.gameName}");
            Debug.Log($"Bundle ID: {_config.bundleId}");
            Debug.Log($"Test Mode: {_config.enableTestMode}");
            Debug.Log($"Platforms: {string.Join(", ", _config.platforms.ConvertAll(p => p.platform))}");
            Debug.Log($"Configuration files created in: {Application.persistentDataPath}");
        }
        
        // Event handlers
        private void OnAdCompleted(AdResult result)
        {
            if (enableDebugLogs)
            {
                Debug.Log($"[UnityAdsAutoSetup] Ad completed: {result.message}, Revenue: ${result.revenue:F4}");
            }
        }
        
        private void OnRevenueGenerated(float revenue)
        {
            if (enableDebugLogs)
            {
                Debug.Log($"[UnityAdsAutoSetup] Revenue generated: ${revenue:F4}");
            }
        }
        
        private void OnAdShown(string placement)
        {
            if (enableDebugLogs)
            {
                Debug.Log($"[UnityAdsAutoSetup] Ad shown: {placement}");
            }
        }
        
        // Public API
        public void SetGameId(string newGameId)
        {
            gameId = newGameId;
            if (_adSystem != null)
            {
                _adSystem.gameId = newGameId;
            }
        }
        
        public void SetTestMode(bool enable)
        {
            enableTestMode = enable;
            if (_adSystem != null)
            {
                _adSystem.enableTestMode = enable;
            }
        }
        
        public void SetAdFrequencyMultiplier(float multiplier)
        {
            adFrequencyMultiplier = multiplier;
            if (_adSystem != null)
            {
                _adSystem.SetAdFrequencyMultiplier(multiplier);
            }
        }
        
        public AdConfiguration GetConfiguration()
        {
            return _config;
        }
        
        public void ReloadConfiguration()
        {
            StartCoroutine(SetupUnityAdsAutomatically());
        }
    }
    
    [System.Serializable]
    public class AdConfiguration
    {
        public string gameId;
        public string gameName;
        public string bundleId;
        public bool enableTestMode;
        public bool enableDebugLogs;
        public float baseRevenuePerAd;
        public float adFrequencyMultiplier;
        public float minAdInterval;
        public float maxAdInterval;
        public List<PlatformConfiguration> platforms;
    }
    
    [System.Serializable]
    public class PlatformConfiguration
    {
        public string platform;
        public string interstitialAdId;
        public string rewardedAdId;
        public string bannerAdId;
        public bool enabled;
    }
    
    [System.Serializable]
    public class UnityAdsManifest
    {
        public string version;
        public string gameId;
        public string gameName;
        public string bundleId;
        public List<PlatformConfiguration> platforms;
        public List<AdUnitManifest> adUnits;
        public AdSettings settings;
    }
    
    [System.Serializable]
    public class AdUnitManifest
    {
        public string name;
        public string type;
        public List<string> platforms;
    }
    
    [System.Serializable]
    public class AdSettings
    {
        public bool enableTestMode;
        public bool enableDebugLogs;
        public float baseRevenuePerAd;
        public float adFrequencyMultiplier;
        public float minAdInterval;
        public float maxAdInterval;
    }
}