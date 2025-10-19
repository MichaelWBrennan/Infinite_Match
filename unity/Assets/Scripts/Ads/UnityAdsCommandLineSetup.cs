using UnityEngine;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace Evergreen.Ads
{
    /// <summary>
    /// Command-line setup tool for Unity Ads
    /// Works entirely without the Unity editor
    /// </summary>
    public class UnityAdsCommandLineSetup : MonoBehaviour
    {
        [Header("Command Line Arguments")]
        public string[] commandLineArgs;
        
        [Header("Setup Configuration")]
        public bool enableCommandLineSetup = true;
        public bool enableAutoConfiguration = true;
        public bool enableFileGeneration = true;
        
        private UnityAdsAutoSetup _autoSetup;
        
        void Start()
        {
            if (enableCommandLineSetup)
            {
                ProcessCommandLineArguments();
            }
        }
        
        private void ProcessCommandLineArguments()
        {
            // Get command line arguments
            commandLineArgs = Environment.GetCommandLineArgs();
            
            Debug.Log("[UnityAdsCommandLineSetup] Processing command line arguments...");
            
            // Parse arguments
            var config = ParseCommandLineArguments();
            
            if (config != null)
            {
                ApplyConfiguration(config);
            }
        }
        
        private AdConfiguration ParseCommandLineArguments()
        {
            var config = new AdConfiguration
            {
                gameId = "1234567",
                gameName = "My Unity Game",
                bundleId = "com.yourcompany.yourgame",
                enableTestMode = true,
                enableDebugLogs = true,
                baseRevenuePerAd = 0.02f,
                adFrequencyMultiplier = 1.0f,
                minAdInterval = 30f,
                maxAdInterval = 120f,
                platforms = new List<PlatformConfiguration>()
            };
            
            // Parse command line arguments
            for (int i = 0; i < commandLineArgs.Length; i++)
            {
                var arg = commandLineArgs[i].ToLower();
                
                switch (arg)
                {
                    case "-gameid":
                    case "--game-id":
                        if (i + 1 < commandLineArgs.Length)
                        {
                            config.gameId = commandLineArgs[i + 1];
                            i++;
                        }
                        break;
                        
                    case "-gamename":
                    case "--game-name":
                        if (i + 1 < commandLineArgs.Length)
                        {
                            config.gameName = commandLineArgs[i + 1];
                            i++;
                        }
                        break;
                        
                    case "-bundleid":
                    case "--bundle-id":
                        if (i + 1 < commandLineArgs.Length)
                        {
                            config.bundleId = commandLineArgs[i + 1];
                            i++;
                        }
                        break;
                        
                    case "-testmode":
                    case "--test-mode":
                        config.enableTestMode = true;
                        break;
                        
                    case "-production":
                    case "--production":
                        config.enableTestMode = false;
                        break;
                        
                    case "-debug":
                    case "--debug":
                        config.enableDebugLogs = true;
                        break;
                        
                    case "-platforms":
                    case "--platforms":
                        if (i + 1 < commandLineArgs.Length)
                        {
                            var platforms = commandLineArgs[i + 1].Split(',');
                            config.platforms = CreatePlatformConfigurations(platforms);
                            i++;
                        }
                        break;
                        
                    case "-help":
                    case "--help":
                    case "-h":
                        ShowHelp();
                        return null;
                }
            }
            
            // Set default platforms if none specified
            if (config.platforms.Count == 0)
            {
                config.platforms = CreatePlatformConfigurations(new string[] { "android", "ios" });
            }
            
            return config;
        }
        
        private List<PlatformConfiguration> CreatePlatformConfigurations(string[] platforms)
        {
            var configs = new List<PlatformConfiguration>();
            
            foreach (var platform in platforms)
            {
                var platformLower = platform.ToLower();
                
                switch (platformLower)
                {
                    case "android":
                        configs.Add(new PlatformConfiguration
                        {
                            platform = "Android",
                            interstitialAdId = "Interstitial_Android",
                            rewardedAdId = "Rewarded_Android",
                            bannerAdId = "Banner_Android",
                            enabled = true
                        });
                        break;
                        
                    case "ios":
                        configs.Add(new PlatformConfiguration
                        {
                            platform = "iOS",
                            interstitialAdId = "Interstitial_iOS",
                            rewardedAdId = "Rewarded_iOS",
                            bannerAdId = "Banner_iOS",
                            enabled = true
                        });
                        break;
                        
                    case "webgl":
                        configs.Add(new PlatformConfiguration
                        {
                            platform = "WebGL",
                            interstitialAdId = "Interstitial_WebGL",
                            rewardedAdId = "Rewarded_WebGL",
                            bannerAdId = "Banner_WebGL",
                            enabled = true
                        });
                        break;
                }
            }
            
            return configs;
        }
        
        private void ApplyConfiguration(AdConfiguration config)
        {
            Debug.Log("[UnityAdsCommandLineSetup] Applying configuration...");
            
            // Get or create auto setup component
            _autoSetup = FindObjectOfType<UnityAdsAutoSetup>();
            if (_autoSetup == null)
            {
                var go = new GameObject("UnityAdsAutoSetup");
                _autoSetup = go.AddComponent<UnityAdsAutoSetup>();
            }
            
            // Apply configuration
            _autoSetup.gameId = config.gameId;
            _autoSetup.gameName = config.gameName;
            _autoSetup.bundleId = config.bundleId;
            _autoSetup.enableTestMode = config.enableTestMode;
            _autoSetup.enableDebugLogs = config.enableDebugLogs;
            _autoSetup.baseRevenuePerAd = config.baseRevenuePerAd;
            _autoSetup.adFrequencyMultiplier = config.adFrequencyMultiplier;
            _autoSetup.minAdInterval = config.minAdInterval;
            _autoSetup.maxAdInterval = config.maxAdInterval;
            
            // Set platform configurations
            _autoSetup.enableAndroid = config.platforms.Exists(p => p.platform == "Android");
            _autoSetup.enableiOS = config.platforms.Exists(p => p.platform == "iOS");
            _autoSetup.enableWebGL = config.platforms.Exists(p => p.platform == "WebGL");
            
            // Start auto setup
            if (enableAutoConfiguration)
            {
                _autoSetup.autoSetupOnStart = true;
            }
            
            Debug.Log("[UnityAdsCommandLineSetup] Configuration applied successfully!");
        }
        
        private void ShowHelp()
        {
            var help = new StringBuilder();
            help.AppendLine("Unity Ads Command Line Setup");
            help.AppendLine("============================");
            help.AppendLine();
            help.AppendLine("Usage: YourGame.exe [options]");
            help.AppendLine();
            help.AppendLine("Options:");
            help.AppendLine("  -gameid, --game-id <id>        Set Unity Ads Game ID");
            help.AppendLine("  -gamename, --game-name <name>  Set game name");
            help.AppendLine("  -bundleid, --bundle-id <id>    Set bundle identifier");
            help.AppendLine("  -testmode, --test-mode         Enable test mode");
            help.AppendLine("  -production, --production      Enable production mode");
            help.AppendLine("  -debug, --debug                Enable debug logging");
            help.AppendLine("  -platforms, --platforms <list> Set platforms (android,ios,webgl)");
            help.AppendLine("  -help, --help, -h              Show this help");
            help.AppendLine();
            help.AppendLine("Examples:");
            help.AppendLine("  YourGame.exe -gameid 1234567 -testmode -platforms android,ios");
            help.AppendLine("  YourGame.exe -gameid 1234567 -production -debug");
            help.AppendLine("  YourGame.exe -gamename \"My Game\" -bundleid com.mycompany.mygame");
            
            Debug.Log(help.ToString());
        }
        
        // Public API for external scripts
        public void SetGameId(string gameId)
        {
            if (_autoSetup != null)
            {
                _autoSetup.SetGameId(gameId);
            }
        }
        
        public void SetTestMode(bool enable)
        {
            if (_autoSetup != null)
            {
                _autoSetup.SetTestMode(enable);
            }
        }
        
        public void SetAdFrequencyMultiplier(float multiplier)
        {
            if (_autoSetup != null)
            {
                _autoSetup.SetAdFrequencyMultiplier(multiplier);
            }
        }
        
        public AdConfiguration GetConfiguration()
        {
            return _autoSetup != null ? _autoSetup.GetConfiguration() : null;
        }
        
        public void ReloadConfiguration()
        {
            if (_autoSetup != null)
            {
                _autoSetup.ReloadConfiguration();
            }
        }
    }
}