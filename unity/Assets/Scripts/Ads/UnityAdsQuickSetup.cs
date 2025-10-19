using UnityEngine;
using System.Collections;

namespace Evergreen.Ads
{
    /// <summary>
    /// Quick setup script for Unity Ads
    /// Automatically configures Unity Ads with minimal setup
    /// </summary>
    public class UnityAdsQuickSetup : MonoBehaviour
    {
        [Header("Quick Setup")]
        public bool autoSetup = true;
        public bool enableTestMode = true;
        public bool enableDebugLogs = true;
        
        [Header("Game Configuration")]
        public string gameId = "1234567"; // Replace with your Unity Dashboard Game ID
        public bool useTestMode = true;
        
        [Header("Ad Units (Auto-configured)")]
        public string interstitialAdId;
        public string rewardedAdId;
        public string bannerAdId;
        
        private UnityAdsNoKeys _adSystem;
        
        void Start()
        {
            if (autoSetup)
            {
                StartCoroutine(SetupUnityAds());
            }
        }
        
        private IEnumerator SetupUnityAds()
        {
            Debug.Log("[UnityAdsQuickSetup] Starting Unity Ads setup...");
            
            // Wait for Unity Ads system to be available
            yield return new WaitUntil(() => UnityAdsNoKeys.Instance != null);
            
            _adSystem = UnityAdsNoKeys.Instance;
            
            // Configure ad units based on platform
            ConfigureAdUnits();
            
            // Set up the ad system
            ConfigureAdSystem();
            
            Debug.Log("[UnityAdsQuickSetup] Unity Ads setup complete!");
        }
        
        private void ConfigureAdUnits()
        {
            // Configure ad unit IDs based on platform
            switch (Application.platform)
            {
                case RuntimePlatform.Android:
                    interstitialAdId = "Interstitial_Android";
                    rewardedAdId = "Rewarded_Android";
                    bannerAdId = "Banner_Android";
                    break;
                case RuntimePlatform.IPhonePlayer:
                    interstitialAdId = "Interstitial_iOS";
                    rewardedAdId = "Rewarded_iOS";
                    bannerAdId = "Banner_iOS";
                    break;
                case RuntimePlatform.WebGLPlayer:
                    interstitialAdId = "Interstitial_WebGL";
                    rewardedAdId = "Rewarded_WebGL";
                    bannerAdId = "Banner_WebGL";
                    break;
                default:
                    // Fallback to Android
                    interstitialAdId = "Interstitial_Android";
                    rewardedAdId = "Rewarded_Android";
                    bannerAdId = "Banner_Android";
                    break;
            }
            
            Debug.Log($"[UnityAdsQuickSetup] Configured ad units for {Application.platform}:");
            Debug.Log($"  Interstitial: {interstitialAdId}");
            Debug.Log($"  Rewarded: {rewardedAdId}");
            Debug.Log($"  Banner: {bannerAdId}");
        }
        
        private void ConfigureAdSystem()
        {
            if (_adSystem == null) return;
            
            // Configure the ad system
            _adSystem.gameId = gameId;
            _adSystem.enableTestMode = useTestMode;
            _adSystem.enableDebugLogs = enableDebugLogs;
            
            // Configure platform-specific ad units
            _adSystem.androidAdUnits.interstitialAdId = "Interstitial_Android";
            _adSystem.androidAdUnits.rewardedAdId = "Rewarded_Android";
            _adSystem.androidAdUnits.bannerAdId = "Banner_Android";
            
            _adSystem.iosAdUnits.interstitialAdId = "Interstitial_iOS";
            _adSystem.iosAdUnits.rewardedAdId = "Rewarded_iOS";
            _adSystem.iosAdUnits.bannerAdId = "Banner_iOS";
            
            _adSystem.webglAdUnits.interstitialAdId = "Interstitial_WebGL";
            _adSystem.webglAdUnits.rewardedAdId = "Rewarded_WebGL";
            _adSystem.webglAdUnits.bannerAdId = "Banner_WebGL";
            
            Debug.Log("[UnityAdsQuickSetup] Ad system configured successfully!");
        }
        
        [ContextMenu("Setup Unity Ads")]
        public void SetupUnityAdsManually()
        {
            StartCoroutine(SetupUnityAds());
        }
        
        [ContextMenu("Test Ad Display")]
        public void TestAdDisplay()
        {
            if (_adSystem == null)
            {
                Debug.LogError("[UnityAdsQuickSetup] Ad system not initialized!");
                return;
            }
            
            // Test interstitial ad
            if (_adSystem.CanShowAd("interstitial"))
            {
                _adSystem.ShowInterstitialAd((result) =>
                {
                    Debug.Log($"[UnityAdsQuickSetup] Test interstitial ad result: {result.message}");
                });
            }
            else
            {
                Debug.Log("[UnityAdsQuickSetup] Interstitial ad not ready for testing");
            }
        }
        
        [ContextMenu("Test Rewarded Ad")]
        public void TestRewardedAd()
        {
            if (_adSystem == null)
            {
                Debug.LogError("[UnityAdsQuickSetup] Ad system not initialized!");
                return;
            }
            
            // Test rewarded ad
            if (_adSystem.CanShowAd("rewarded"))
            {
                _adSystem.ShowRewardedAd((result) =>
                {
                    Debug.Log($"[UnityAdsQuickSetup] Test rewarded ad result: {result.message}");
                });
            }
            else
            {
                Debug.Log("[UnityAdsQuickSetup] Rewarded ad not ready for testing");
            }
        }
        
        [ContextMenu("Show Revenue Report")]
        public void ShowRevenueReport()
        {
            if (_adSystem == null)
            {
                Debug.LogError("[UnityAdsQuickSetup] Ad system not initialized!");
                return;
            }
            
            _adSystem.LogRevenueReport();
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
    }
}