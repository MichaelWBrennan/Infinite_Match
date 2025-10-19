using UnityEngine;
using System.Collections.Generic;

namespace Evergreen.Ads
{
    /// <summary>
    /// Unity Ads Setup Guide and Configuration
    /// Complete setup instructions for Unity Ads integration
    /// </summary>
    public class UnityAdsSetupGuide : MonoBehaviour
    {
        [Header("Setup Instructions")]
        [TextArea(10, 20)]
        public string setupInstructions = @"
UNITY ADS SETUP GUIDE
====================

STEP 1: Unity Dashboard Setup
-----------------------------
1. Go to https://operate.dashboard.unity3d.com/
2. Create a new project or select existing
3. Go to 'Monetization' > 'Ads'
4. Create ad units for your platforms:
   - Interstitial: 'Interstitial_Android' / 'Interstitial_iOS'
   - Rewarded: 'Rewarded_Android' / 'Rewarded_iOS'
   - Banner: 'Banner_Android' / 'Banner_iOS'

STEP 2: Get Your Game ID
------------------------
1. In Unity Dashboard, go to 'Monetization' > 'Ads'
2. Copy your Game ID (it's a 7-digit number)
3. Replace the GAME_ID in UnityAdsNoKeys.cs

STEP 3: Unity Package Manager
-----------------------------
1. Open Window > Package Manager
2. Search for 'Advertisement'
3. Install 'Advertisement' package
4. Import the package

STEP 4: Platform Settings
-------------------------
Android:
- Player Settings > Publishing Settings > Build
- Set Package Name (com.yourcompany.yourgame)
- Set Minimum API Level to 22+

iOS:
- Player Settings > Publishing Settings > Build
- Set Bundle Identifier (com.yourcompany.yourgame)
- Set Target Device Family

STEP 5: Test Your Integration
-----------------------------
1. Enable Test Mode in UnityAdsNoKeys
2. Build and run on device
3. Check Unity Dashboard for ad requests
4. Disable Test Mode for production

STEP 6: Revenue Optimization
----------------------------
1. A/B test different ad placements
2. Monitor fill rates and eCPM
3. Optimize ad frequency
4. Use mediation for better revenue

TROUBLESHOOTING
==============

Common Issues:
- Ads not showing: Check Game ID and ad unit IDs
- Test mode not working: Ensure test mode is enabled
- Revenue not tracking: Check Unity Dashboard settings
- Build errors: Verify platform settings

Support:
- Unity Ads Documentation: https://docs.unity3d.com/Manual/UnityAds.html
- Unity Forums: https://forum.unity.com/forums/unity-ads.67/
- Unity Support: https://support.unity3d.com/
";

        [Header("Configuration Checklist")]
        public bool gameIdConfigured = false;
        public bool adUnitsCreated = false;
        public bool platformSettingsSet = false;
        public bool testModeEnabled = true;
        public bool productionReady = false;
        
        [Header("Ad Unit Configuration")]
        public string gameId = "1234567"; // Replace with your actual Game ID
        public List<AdUnitConfig> adUnits = new List<AdUnitConfig>();
        
        [Header("Platform Settings")]
        public bool enableAndroid = true;
        public bool enableiOS = true;
        public bool enableWebGL = false;
        
        [Header("Test Configuration")]
        public bool enableTestMode = true;
        public bool enableDebugLogs = true;
        public bool enableRevenueSimulation = true;
        
        private void Start()
        {
            InitializeAdUnits();
            ValidateConfiguration();
        }
        
        private void InitializeAdUnits()
        {
            if (adUnits.Count == 0)
            {
                adUnits.AddRange(new List<AdUnitConfig>
                {
                    new AdUnitConfig
                    {
                        platform = "Android",
                        adType = "Interstitial",
                        adUnitId = "Interstitial_Android",
                        enabled = true
                    },
                    new AdUnitConfig
                    {
                        platform = "Android",
                        adType = "Rewarded",
                        adUnitId = "Rewarded_Android",
                        enabled = true
                    },
                    new AdUnitConfig
                    {
                        platform = "Android",
                        adType = "Banner",
                        adUnitId = "Banner_Android",
                        enabled = true
                    },
                    new AdUnitConfig
                    {
                        platform = "iOS",
                        adType = "Interstitial",
                        adUnitId = "Interstitial_iOS",
                        enabled = true
                    },
                    new AdUnitConfig
                    {
                        platform = "iOS",
                        adType = "Rewarded",
                        adUnitId = "Rewarded_iOS",
                        enabled = true
                    },
                    new AdUnitConfig
                    {
                        platform = "iOS",
                        adType = "Banner",
                        adUnitId = "Banner_iOS",
                        enabled = true
                    }
                });
            }
        }
        
        private void ValidateConfiguration()
        {
            // Check if Game ID is configured
            gameIdConfigured = !string.IsNullOrEmpty(gameId) && gameId != "1234567";
            
            // Check if ad units are created
            adUnitsCreated = adUnits.Count > 0;
            
            // Check platform settings
            platformSettingsSet = enableAndroid || enableiOS || enableWebGL;
            
            // Check if production ready
            productionReady = gameIdConfigured && adUnitsCreated && platformSettingsSet && !enableTestMode;
            
            LogConfigurationStatus();
        }
        
        private void LogConfigurationStatus()
        {
            Debug.Log("[UnityAdsSetupGuide] === CONFIGURATION STATUS ===");
            Debug.Log($"Game ID Configured: {gameIdConfigured}");
            Debug.Log($"Ad Units Created: {adUnitsCreated}");
            Debug.Log($"Platform Settings Set: {platformSettingsSet}");
            Debug.Log($"Test Mode Enabled: {enableTestMode}");
            Debug.Log($"Production Ready: {productionReady}");
            
            if (!productionReady)
            {
                Debug.LogWarning("[UnityAdsSetupGuide] Configuration incomplete! Follow the setup guide above.");
            }
        }
        
        [ContextMenu("Validate Configuration")]
        public void ValidateConfigurationManually()
        {
            ValidateConfiguration();
        }
        
        [ContextMenu("Open Unity Dashboard")]
        public void OpenUnityDashboard()
        {
            Application.OpenURL("https://operate.dashboard.unity3d.com/");
        }
        
        [ContextMenu("Open Unity Ads Documentation")]
        public void OpenUnityAdsDocumentation()
        {
            Application.OpenURL("https://docs.unity3d.com/Manual/UnityAds.html");
        }
        
        public string GetCurrentPlatformAdUnitId(string adType)
        {
            var currentPlatform = Application.platform.ToString();
            
            foreach (var adUnit in adUnits)
            {
                if (adUnit.platform == currentPlatform && adUnit.adType == adType && adUnit.enabled)
                {
                    return adUnit.adUnitId;
                }
            }
            
            // Fallback to Android if current platform not found
            foreach (var adUnit in adUnits)
            {
                if (adUnit.platform == "Android" && adUnit.adType == adType && adUnit.enabled)
                {
                    return adUnit.adUnitId;
                }
            }
            
            return null;
        }
        
        public bool IsConfigurationComplete()
        {
            return gameIdConfigured && adUnitsCreated && platformSettingsSet;
        }
    }
    
    [System.Serializable]
    public class AdUnitConfig
    {
        public string platform;
        public string adType;
        public string adUnitId;
        public bool enabled;
    }
}