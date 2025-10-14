using UnityEngine;
using Evergreen.Platform;

namespace Evergreen.Platform
{
    /// <summary>
    /// Example script showing how to integrate platform-specific functionality
    /// This demonstrates the proper use of conditional compilation directives
    /// </summary>
    public class PlatformIntegrationExample : MonoBehaviour
    {
        [Header("Platform Integration Example")]
        [SerializeField] private bool enablePlatformFeatures = true;
        [SerializeField] private bool showPlatformInfo = true;
        
        private PlatformManager _platformManager;
        private AdPlatformAdapter _adAdapter;
        private IAPPlatformAdapter _iapAdapter;
        private AnalyticsPlatformAdapter _analyticsAdapter;
        
        void Start()
        {
            InitializePlatformIntegration();
        }
        
        private void InitializePlatformIntegration()
        {
            Debug.Log("🌐 Initializing Platform Integration Example...");
            
            // Get platform manager
            _platformManager = PlatformManager.Instance;
            if (_platformManager == null)
            {
                Debug.LogError("❌ PlatformManager not found!");
                return;
            }
            
            // Get platform adapters
            _adAdapter = GetComponent<AdPlatformAdapter>();
            _iapAdapter = GetComponent<IAPPlatformAdapter>();
            _analyticsAdapter = GetComponent<AnalyticsPlatformAdapter>();
            
            // Show platform information
            if (showPlatformInfo)
            {
                ShowPlatformInfo();
            }
            
            // Demonstrate platform-specific functionality
            DemonstratePlatformFeatures();
        }
        
        private void ShowPlatformInfo()
        {
            Debug.Log("🌐 PLATFORM INFORMATION");
            Debug.Log("=======================");
            Debug.Log($"Current Platform: {_platformManager.CurrentPlatform}");
            Debug.Log($"Platform Profile: {_platformManager.CurrentProfile?.name}");
            Debug.Log($"Platform Version: {_platformManager.CurrentProfile?.version}");
            Debug.Log("=======================");
        }
        
        private void DemonstratePlatformFeatures()
        {
            if (!enablePlatformFeatures) return;
            
            Debug.Log("🎯 Demonstrating platform features...");
            
            // Demonstrate ads
            DemonstrateAds();
            
            // Demonstrate IAP
            DemonstrateIAP();
            
            // Demonstrate analytics
            DemonstrateAnalytics();
        }
        
        private void DemonstrateAds()
        {
            Debug.Log("📺 Demonstrating ads...");
            
            if (_adAdapter != null)
            {
                // Check if ads are available
                if (_adAdapter.CanShowBanner())
                {
                    Debug.Log("📺 Banner ads available");
                    // _adAdapter.ShowBannerAd();
                }
                
                if (_adAdapter.CanShowInterstitial())
                {
                    Debug.Log("📺 Interstitial ads available");
                    // _adAdapter.ShowInterstitialAd();
                }
                
                if (_adAdapter.CanShowRewarded())
                {
                    Debug.Log("📺 Rewarded ads available");
                    // _adAdapter.ShowRewardedAd();
                }
            }
        }
        
        private void DemonstrateIAP()
        {
            Debug.Log("💳 Demonstrating IAP...");
            
            if (_iapAdapter != null && _iapAdapter.IsIAPSupported())
            {
                Debug.Log("💳 IAP supported on this platform");
                
                // Get available products
                var products = _iapAdapter.GetAllProducts();
                Debug.Log($"💳 Available products: {products.Count}");
                
                foreach (var product in products)
                {
                    Debug.Log($"💳 Product: {product.displayName} - ${product.price:F2}");
                }
            }
            else
            {
                Debug.Log("💳 IAP not supported on this platform");
            }
        }
        
        private void DemonstrateAnalytics()
        {
            Debug.Log("📊 Demonstrating analytics...");
            
            if (_analyticsAdapter != null && _analyticsAdapter.IsAnalyticsSupported())
            {
                Debug.Log("📊 Analytics supported on this platform");
                
                // Track some events
                _analyticsAdapter.TrackEvent("platform_integration_demo");
                _analyticsAdapter.TrackLevelComplete(1, 120.5f);
                _analyticsAdapter.TrackSessionStart();
                
                // Set user properties
                _analyticsAdapter.SetUserId("demo_user_123");
                _analyticsAdapter.SetUserLevel(1);
                _analyticsAdapter.SetUserScore(1000);
            }
            else
            {
                Debug.Log("📊 Analytics not supported on this platform");
            }
        }
        
        // Platform-specific methods using conditional compilation
        
        public void ShowPlatformSpecificUI()
        {
#if UNITY_WEBGL && POKI_PLATFORM
            ShowPokiUI();
#elif UNITY_ANDROID && GOOGLE_PLAY_PLATFORM
            ShowGooglePlayUI();
#elif UNITY_IOS && APP_STORE_PLATFORM
            ShowAppStoreUI();
#else
            ShowFallbackUI();
#endif
        }
        
        public void HandlePlatformSpecificInput()
        {
#if UNITY_WEBGL && POKI_PLATFORM
            HandlePokiInput();
#elif UNITY_ANDROID && GOOGLE_PLAY_PLATFORM
            HandleGooglePlayInput();
#elif UNITY_IOS && APP_STORE_PLATFORM
            HandleAppStoreInput();
#else
            HandleFallbackInput();
#endif
        }
        
        public void ProcessPlatformSpecificData()
        {
#if UNITY_WEBGL && POKI_PLATFORM
            ProcessPokiData();
#elif UNITY_ANDROID && GOOGLE_PLAY_PLATFORM
            ProcessGooglePlayData();
#elif UNITY_IOS && APP_STORE_PLATFORM
            ProcessAppStoreData();
#else
            ProcessFallbackData();
#endif
        }
        
        // Poki-specific implementations
#if UNITY_WEBGL && POKI_PLATFORM
        private void ShowPokiUI()
        {
            Debug.Log("🎮 Showing Poki UI...");
            // Poki-specific UI implementation
        }
        
        private void HandlePokiInput()
        {
            Debug.Log("🎮 Handling Poki input...");
            // Poki-specific input handling
        }
        
        private void ProcessPokiData()
        {
            Debug.Log("🎮 Processing Poki data...");
            // Poki-specific data processing
        }
#endif
        
        // Google Play-specific implementations
#if UNITY_ANDROID && GOOGLE_PLAY_PLATFORM
        private void ShowGooglePlayUI()
        {
            Debug.Log("🤖 Showing Google Play UI...");
            // Google Play-specific UI implementation
        }
        
        private void HandleGooglePlayInput()
        {
            Debug.Log("🤖 Handling Google Play input...");
            // Google Play-specific input handling
        }
        
        private void ProcessGooglePlayData()
        {
            Debug.Log("🤖 Processing Google Play data...");
            // Google Play-specific data processing
        }
#endif
        
        // App Store-specific implementations
#if UNITY_IOS && APP_STORE_PLATFORM
        private void ShowAppStoreUI()
        {
            Debug.Log("🍎 Showing App Store UI...");
            // App Store-specific UI implementation
        }
        
        private void HandleAppStoreInput()
        {
            Debug.Log("🍎 Handling App Store input...");
            // App Store-specific input handling
        }
        
        private void ProcessAppStoreData()
        {
            Debug.Log("🍎 Processing App Store data...");
            // App Store-specific data processing
        }
#endif
        
        // Fallback implementations
        private void ShowFallbackUI()
        {
            Debug.Log("🔄 Showing fallback UI...");
            // Fallback UI implementation
        }
        
        private void HandleFallbackInput()
        {
            Debug.Log("🔄 Handling fallback input...");
            // Fallback input handling
        }
        
        private void ProcessFallbackData()
        {
            Debug.Log("🔄 Processing fallback data...");
            // Fallback data processing
        }
        
        // Public API methods
        
        public void TestPlatformFeatures()
        {
            Debug.Log("🧪 Testing platform features...");
            
            // Test ads
            if (_adAdapter != null)
            {
                Debug.Log($"📺 Ad adapter available: {_adAdapter != null}");
                Debug.Log($"📺 Can show banner: {_adAdapter.CanShowBanner()}");
                Debug.Log($"📺 Can show interstitial: {_adAdapter.CanShowInterstitial()}");
                Debug.Log($"📺 Can show rewarded: {_adAdapter.CanShowRewarded()}");
            }
            
            // Test IAP
            if (_iapAdapter != null)
            {
                Debug.Log($"💳 IAP adapter available: {_iapAdapter != null}");
                Debug.Log($"💳 IAP supported: {_iapAdapter.IsIAPSupported()}");
                Debug.Log($"💳 Platform: {_iapAdapter.GetPlatformName()}");
            }
            
            // Test analytics
            if (_analyticsAdapter != null)
            {
                Debug.Log($"📊 Analytics adapter available: {_analyticsAdapter != null}");
                Debug.Log($"📊 Analytics supported: {_analyticsAdapter.IsAnalyticsSupported()}");
                Debug.Log($"📊 Platform: {_analyticsAdapter.GetPlatformName()}");
            }
        }
        
        public void ShowPlatformComplianceReport()
        {
            if (_platformManager != null)
            {
                var report = _platformManager.GetComplianceReport();
                if (report != null)
                {
                    Debug.Log("📊 PLATFORM COMPLIANCE REPORT");
                    Debug.Log("=============================");
                    Debug.Log($"Platform: {report.platform}");
                    Debug.Log($"Timestamp: {report.timestamp}");
                    Debug.Log("Checks:");
                    
                    foreach (var check in report.checks)
                    {
                        string status = check.passed ? "✅ PASS" : "❌ FAIL";
                        string required = check.required ? " (REQUIRED)" : " (OPTIONAL)";
                        Debug.Log($"  {check.name}: {status}{required} - {check.message}");
                    }
                    
                    Debug.Log("=============================");
                }
            }
        }
    }
}