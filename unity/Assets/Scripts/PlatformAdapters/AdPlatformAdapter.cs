using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using Evergreen.Platform;

namespace Evergreen.Platform
{
    /// <summary>
    /// Platform-specific ad adapter that handles different ad SDKs based on target platform
    /// </summary>
    public class AdPlatformAdapter : MonoBehaviour
    {
        [Header("Ad Configuration")]
        [SerializeField] private bool enableAds = true;
        [SerializeField] private bool enableBannerAds = true;
        [SerializeField] private bool enableInterstitialAds = true;
        [SerializeField] private bool enableRewardedAds = true;
        
        [Header("Ad Settings")]
        [SerializeField] private float bannerRefreshRate = 30f;
        [SerializeField] private float interstitialCooldown = 60f;
        [SerializeField] private int maxAdsPerSession = 10;
        
        private PlatformProfile _profile;
        private Dictionary<string, string> _adUnits = new Dictionary<string, string>();
        private int _adsShownThisSession = 0;
        private float _lastInterstitialTime = 0f;
        
        // Events
        public System.Action<bool> OnAdLoaded;
        public System.Action<string> OnAdFailedToLoad;
        public System.Action OnAdShown;
        public System.Action OnAdClosed;
        public System.Action OnAdRewarded;
        
        void Start()
        {
            if (enableAds)
            {
                InitializeAds();
            }
        }
        
        public void Initialize(PlatformProfile profile)
        {
            _profile = profile;
            Debug.Log($"📺 Initializing Ad Adapter for {profile.platform}");
            
            // Configure ad units based on platform
            ConfigureAdUnits();
            
            // Initialize platform-specific ad SDK
            InitializePlatformAds();
        }
        
        private void ConfigureAdUnits()
        {
            if (_profile?.adSdks?.adUnits != null)
            {
                _adUnits = new Dictionary<string, string>(_profile.adSdks.adUnits);
                Debug.Log($"📺 Configured {_adUnits.Count} ad units");
            }
        }
        
        private void InitializePlatformAds()
        {
            switch (_profile.platform)
            {
                case "poki":
                    InitializePokiAds();
                    break;
                case "googleplay":
                    InitializeGooglePlayAds();
                    break;
                case "appstore":
                    InitializeAppStoreAds();
                    break;
                default:
                    Debug.LogWarning($"⚠️ Unknown platform for ads: {_profile.platform}");
                    break;
            }
        }
        
        private void InitializePokiAds()
        {
            Debug.Log("🎮 Initializing Poki Ads...");
            
#if UNITY_WEBGL && POKI_PLATFORM
            // Initialize Poki SDK
            InitializePokiSDK();
#else
            Debug.LogWarning("⚠️ Poki platform not detected, using fallback ads");
            InitializeFallbackAds();
#endif
        }
        
        private void InitializeGooglePlayAds()
        {
            Debug.Log("🤖 Initializing Google Play Ads...");
            
#if UNITY_ANDROID && GOOGLE_PLAY_PLATFORM
            // Initialize Google Mobile Ads
            InitializeGoogleMobileAds();
#else
            Debug.LogWarning("⚠️ Google Play platform not detected, using fallback ads");
            InitializeFallbackAds();
#endif
        }
        
        private void InitializeAppStoreAds()
        {
            Debug.Log("🍎 Initializing App Store Ads...");
            
#if UNITY_IOS && APP_STORE_PLATFORM
            // Initialize Unity Ads
            InitializeUnityAds();
#else
            Debug.LogWarning("⚠️ App Store platform not detected, using fallback ads");
            InitializeFallbackAds();
#endif
        }
        
        private void InitializeFallbackAds()
        {
            Debug.Log("🔄 Initializing fallback ads...");
            
            // Use Unity Ads as fallback
            InitializeUnityAds();
        }
        
#if UNITY_WEBGL && POKI_PLATFORM
        private void InitializePokiSDK()
        {
            Debug.Log("🎮 Initializing Poki SDK...");
            
            // Poki SDK initialization would go here
            // This is a placeholder for the actual Poki SDK integration
        }
#endif
        
#if UNITY_ANDROID && GOOGLE_PLAY_PLATFORM
        private void InitializeGoogleMobileAds()
        {
            Debug.Log("📱 Initializing Google Mobile Ads...");
            
            // Google Mobile Ads initialization would go here
            // This is a placeholder for the actual GMA integration
        }
#endif
        
        private void InitializeUnityAds()
        {
            Debug.Log("📺 Initializing Unity Ads...");
            
            // Unity Ads initialization would go here
            // This is a placeholder for the actual Unity Ads integration
        }
        
        // Public API Methods
        
        public void ShowBannerAd()
        {
            if (!enableBannerAds || !enableAds)
            {
                Debug.Log("📺 Banner ads disabled");
                return;
            }
            
            Debug.Log("📺 Showing banner ad...");
            
            switch (_profile.platform)
            {
                case "poki":
                    ShowPokiBannerAd();
                    break;
                case "googleplay":
                    ShowGooglePlayBannerAd();
                    break;
                case "appstore":
                    ShowAppStoreBannerAd();
                    break;
                default:
                    ShowFallbackBannerAd();
                    break;
            }
        }
        
        public void ShowInterstitialAd()
        {
            if (!enableInterstitialAds || !enableAds)
            {
                Debug.Log("📺 Interstitial ads disabled");
                return;
            }
            
            if (Time.time - _lastInterstitialTime < interstitialCooldown)
            {
                Debug.Log("📺 Interstitial ad on cooldown");
                return;
            }
            
            if (_adsShownThisSession >= maxAdsPerSession)
            {
                Debug.Log("📺 Max ads per session reached");
                return;
            }
            
            Debug.Log("📺 Showing interstitial ad...");
            
            switch (_profile.platform)
            {
                case "poki":
                    ShowPokiInterstitialAd();
                    break;
                case "googleplay":
                    ShowGooglePlayInterstitialAd();
                    break;
                case "appstore":
                    ShowAppStoreInterstitialAd();
                    break;
                default:
                    ShowFallbackInterstitialAd();
                    break;
            }
        }
        
        public void ShowRewardedAd()
        {
            if (!enableRewardedAds || !enableAds)
            {
                Debug.Log("📺 Rewarded ads disabled");
                return;
            }
            
            Debug.Log("📺 Showing rewarded ad...");
            
            switch (_profile.platform)
            {
                case "poki":
                    ShowPokiRewardedAd();
                    break;
                case "googleplay":
                    ShowGooglePlayRewardedAd();
                    break;
                case "appstore":
                    ShowAppStoreRewardedAd();
                    break;
                default:
                    ShowFallbackRewardedAd();
                    break;
            }
        }
        
        public bool IsAdReady(string adType)
        {
            switch (adType.ToLower())
            {
                case "banner":
                    return enableBannerAds && enableAds;
                case "interstitial":
                    return enableInterstitialAds && enableAds && 
                           Time.time - _lastInterstitialTime >= interstitialCooldown &&
                           _adsShownThisSession < maxAdsPerSession;
                case "rewarded":
                    return enableRewardedAds && enableAds;
                default:
                    return false;
            }
        }
        
        // Platform-specific ad implementations
        
        private void ShowPokiBannerAd()
        {
#if UNITY_WEBGL && POKI_PLATFORM
            Debug.Log("🎮 Showing Poki banner ad...");
            // Poki banner ad implementation
#else
            ShowFallbackBannerAd();
#endif
        }
        
        private void ShowPokiInterstitialAd()
        {
#if UNITY_WEBGL && POKI_PLATFORM
            Debug.Log("🎮 Showing Poki interstitial ad...");
            // Poki interstitial ad implementation
            OnAdShown?.Invoke();
            _adsShownThisSession++;
            _lastInterstitialTime = Time.time;
#else
            ShowFallbackInterstitialAd();
#endif
        }
        
        private void ShowPokiRewardedAd()
        {
#if UNITY_WEBGL && POKI_PLATFORM
            Debug.Log("🎮 Showing Poki rewarded ad...");
            // Poki rewarded ad implementation
            OnAdShown?.Invoke();
            OnAdRewarded?.Invoke();
#else
            ShowFallbackRewardedAd();
#endif
        }
        
        private void ShowGooglePlayBannerAd()
        {
#if UNITY_ANDROID && GOOGLE_PLAY_PLATFORM
            Debug.Log("🤖 Showing Google Play banner ad...");
            // Google Mobile Ads banner implementation
#else
            ShowFallbackBannerAd();
#endif
        }
        
        private void ShowGooglePlayInterstitialAd()
        {
#if UNITY_ANDROID && GOOGLE_PLAY_PLATFORM
            Debug.Log("🤖 Showing Google Play interstitial ad...");
            // Google Mobile Ads interstitial implementation
            OnAdShown?.Invoke();
            _adsShownThisSession++;
            _lastInterstitialTime = Time.time;
#else
            ShowFallbackInterstitialAd();
#endif
        }
        
        private void ShowGooglePlayRewardedAd()
        {
#if UNITY_ANDROID && GOOGLE_PLAY_PLATFORM
            Debug.Log("🤖 Showing Google Play rewarded ad...");
            // Google Mobile Ads rewarded implementation
            OnAdShown?.Invoke();
            OnAdRewarded?.Invoke();
#else
            ShowFallbackRewardedAd();
#endif
        }
        
        private void ShowAppStoreBannerAd()
        {
#if UNITY_IOS && APP_STORE_PLATFORM
            Debug.Log("🍎 Showing App Store banner ad...");
            // Unity Ads banner implementation
#else
            ShowFallbackBannerAd();
#endif
        }
        
        private void ShowAppStoreInterstitialAd()
        {
#if UNITY_IOS && APP_STORE_PLATFORM
            Debug.Log("🍎 Showing App Store interstitial ad...");
            // Unity Ads interstitial implementation
            OnAdShown?.Invoke();
            _adsShownThisSession++;
            _lastInterstitialTime = Time.time;
#else
            ShowFallbackInterstitialAd();
#endif
        }
        
        private void ShowAppStoreRewardedAd()
        {
#if UNITY_IOS && APP_STORE_PLATFORM
            Debug.Log("🍎 Showing App Store rewarded ad...");
            // Unity Ads rewarded implementation
            OnAdShown?.Invoke();
            OnAdRewarded?.Invoke();
#else
            ShowFallbackRewardedAd();
#endif
        }
        
        private void ShowFallbackBannerAd()
        {
            Debug.Log("🔄 Showing fallback banner ad...");
            // Fallback banner ad implementation
        }
        
        private void ShowFallbackInterstitialAd()
        {
            Debug.Log("🔄 Showing fallback interstitial ad...");
            // Fallback interstitial ad implementation
            OnAdShown?.Invoke();
            _adsShownThisSession++;
            _lastInterstitialTime = Time.time;
        }
        
        private void ShowFallbackRewardedAd()
        {
            Debug.Log("🔄 Showing fallback rewarded ad...");
            // Fallback rewarded ad implementation
            OnAdShown?.Invoke();
            OnAdRewarded?.Invoke();
        }
        
        // Utility Methods
        
        public void ResetAdSession()
        {
            _adsShownThisSession = 0;
            _lastInterstitialTime = 0f;
            Debug.Log("🔄 Ad session reset");
        }
        
        public int GetAdsShownThisSession()
        {
            return _adsShownThisSession;
        }
        
        public float GetTimeUntilNextInterstitial()
        {
            float timeSinceLastAd = Time.time - _lastInterstitialTime;
            return Mathf.Max(0, interstitialCooldown - timeSinceLastAd);
        }
        
        public bool CanShowInterstitial()
        {
            return enableInterstitialAds && 
                   enableAds && 
                   Time.time - _lastInterstitialTime >= interstitialCooldown &&
                   _adsShownThisSession < maxAdsPerSession;
        }
        
        public bool CanShowRewarded()
        {
            return enableRewardedAds && enableAds;
        }
        
        public bool CanShowBanner()
        {
            return enableBannerAds && enableAds;
        }
    }
}