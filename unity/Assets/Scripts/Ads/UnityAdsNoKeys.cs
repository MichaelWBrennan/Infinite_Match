using UnityEngine;
using System;
using System.Collections;
using UnityEngine.Advertisements;

namespace Evergreen.Ads
{
    /// <summary>
    /// Unity Ads integration that requires NO external API keys
    /// Uses Unity's built-in ad system with minimal setup
    /// </summary>
    public class UnityAdsNoKeys : MonoBehaviour, IUnityAdsInitializationListener, IUnityAdsLoadListener, IUnityAdsShowListener
    {
        public static UnityAdsNoKeys Instance { get; private set; }
        
        [Header("Unity Ads Settings")]
        public bool enableAds = true;
        public bool enableTestMode = true; // Use test ads (no keys needed)
        public bool enableInterstitialAds = true;
        public bool enableRewardedAds = true;
        public bool enableBannerAds = true;
        
        [Header("Ad Configuration")]
        public float minAdInterval = 30f;
        public float maxAdInterval = 120f;
        public float adFrequencyMultiplier = 1.0f;
        
        [Header("Revenue Tracking")]
        public float totalRevenue = 0f;
        public int totalAdViews = 0;
        public float avgRevenuePerAd = 0f;
        
        // Unity Ads IDs - Configure these in Unity Dashboard
        [Header("Unity Ads Configuration")]
        public string gameId = "1234567"; // Replace with your actual Game ID from Unity Dashboard
        public string interstitialAdId = "Interstitial_Android";
        public string rewardedAdId = "Rewarded_Android";
        public string bannerAdId = "Banner_Android";
        
        // Platform-specific ad unit IDs
        [Header("Platform Ad Units")]
        public AdUnitConfiguration androidAdUnits;
        public AdUnitConfiguration iosAdUnits;
        public AdUnitConfiguration webglAdUnits;
        
        // Ad state tracking
        private bool _isInitialized = false;
        private bool _isInterstitialLoaded = false;
        private bool _isRewardedLoaded = false;
        private bool _isBannerLoaded = false;
        private float _lastAdTime = 0f;
        
        // Events
        public static event Action<AdResult> OnAdCompleted;
        public static event Action<float> OnRevenueGenerated;
        public static event Action<string> OnAdShown;
        
        private void Awake()
        {
            if (Instance != null) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        
        private void Start()
        {
            if (enableAds)
            {
                InitializeUnityAds();
            }
        }
        
        private void InitializeUnityAds()
        {
            // Get platform-specific ad unit IDs
            var platformAdUnits = GetPlatformAdUnits();
            
            // Initialize Unity Ads with test mode (no keys required)
            Advertisement.Initialize(gameId, enableTestMode, this);
            
            Debug.Log($"[UnityAdsNoKeys] Initializing Unity Ads with Game ID: {gameId}, Test Mode: {enableTestMode}");
        }
        
        private AdUnitConfiguration GetPlatformAdUnits()
        {
            switch (Application.platform)
            {
                case RuntimePlatform.Android:
                    return androidAdUnits;
                case RuntimePlatform.IPhonePlayer:
                    return iosAdUnits;
                case RuntimePlatform.WebGLPlayer:
                    return webglAdUnits;
                default:
                    return androidAdUnits; // Fallback to Android
            }
        }
        
        public void OnInitializationComplete()
        {
            _isInitialized = true;
            Debug.Log("[UnityAdsNoKeys] Unity Ads initialized successfully!");
            
            // Load ads
            LoadInterstitialAd();
            LoadRewardedAd();
            LoadBannerAd();
        }
        
        public void OnInitializationFailed(UnityAdsInitializationError error, string message)
        {
            Debug.LogError($"[UnityAdsNoKeys] Unity Ads initialization failed: {error} - {message}");
        }
        
        private void LoadInterstitialAd()
        {
            if (!enableInterstitialAds) return;
            
            var adUnitId = GetCurrentAdUnitId("interstitial");
            if (!string.IsNullOrEmpty(adUnitId))
            {
                Advertisement.Load(adUnitId, this);
            }
        }
        
        private void LoadRewardedAd()
        {
            if (!enableRewardedAds) return;
            
            var adUnitId = GetCurrentAdUnitId("rewarded");
            if (!string.IsNullOrEmpty(adUnitId))
            {
                Advertisement.Load(adUnitId, this);
            }
        }
        
        private void LoadBannerAd()
        {
            if (!enableBannerAds) return;
            
            var adUnitId = GetCurrentAdUnitId("banner");
            if (!string.IsNullOrEmpty(adUnitId))
            {
                Advertisement.Banner.SetPosition(BannerPosition.BOTTOM_CENTER);
                Advertisement.Banner.Load(adUnitId);
            }
        }
        
        private string GetCurrentAdUnitId(string adType)
        {
            var platformAdUnits = GetPlatformAdUnits();
            
            switch (adType)
            {
                case "interstitial":
                    return platformAdUnits.interstitialAdId;
                case "rewarded":
                    return platformAdUnits.rewardedAdId;
                case "banner":
                    return platformAdUnits.bannerAdId;
                default:
                    return null;
            }
        }
        
        public void OnUnityAdsAdLoaded(string adUnitId)
        {
            var platformAdUnits = GetPlatformAdUnits();
            
            if (adUnitId == platformAdUnits.interstitialAdId)
            {
                _isInterstitialLoaded = true;
                Debug.Log("[UnityAdsNoKeys] Interstitial ad loaded");
            }
            else if (adUnitId == platformAdUnits.rewardedAdId)
            {
                _isRewardedLoaded = true;
                Debug.Log("[UnityAdsNoKeys] Rewarded ad loaded");
            }
        }
        
        public void OnUnityAdsFailedToLoad(string adUnitId, UnityAdsLoadError error, string message)
        {
            Debug.LogError($"[UnityAdsNoKeys] Failed to load ad {adUnitId}: {error} - {message}");
            
            // Retry loading after a delay
            StartCoroutine(RetryLoadAd(adUnitId, 5f));
        }
        
        private IEnumerator RetryLoadAd(string adUnitId, float delay)
        {
            yield return new WaitForSeconds(delay);
            
            if (adUnitId == INTERSTITIAL_AD_ID)
            {
                LoadInterstitialAd();
            }
            else if (adUnitId == REWARDED_AD_ID)
            {
                LoadRewardedAd();
            }
        }
        
        public bool CanShowAd(string adType)
        {
            if (!_isInitialized) return false;
            
            var timeSinceLastAd = Time.time - _lastAdTime;
            var minInterval = minAdInterval * adFrequencyMultiplier;
            
            if (timeSinceLastAd < minInterval) return false;
            
            switch (adType)
            {
                case "interstitial":
                    return _isInterstitialLoaded;
                case "rewarded":
                    return _isRewardedLoaded;
                case "banner":
                    return _isBannerLoaded;
                default:
                    return false;
            }
        }
        
        public void ShowInterstitialAd(Action<AdResult> onComplete = null)
        {
            if (!CanShowAd("interstitial"))
            {
                onComplete?.Invoke(new AdResult { success = false, message = "Interstitial ad not ready" });
                return;
            }
            
            var adUnitId = GetCurrentAdUnitId("interstitial");
            if (!string.IsNullOrEmpty(adUnitId))
            {
                Advertisement.Show(adUnitId, this);
                _lastAdTime = Time.time;
                OnAdShown?.Invoke("interstitial");
            }
        }
        
        public void ShowRewardedAd(Action<AdResult> onComplete = null)
        {
            if (!CanShowAd("rewarded"))
            {
                onComplete?.Invoke(new AdResult { success = false, message = "Rewarded ad not ready" });
                return;
            }
            
            var adUnitId = GetCurrentAdUnitId("rewarded");
            if (!string.IsNullOrEmpty(adUnitId))
            {
                Advertisement.Show(adUnitId, this);
                _lastAdTime = Time.time;
                OnAdShown?.Invoke("rewarded");
            }
        }
        
        public void ShowBannerAd()
        {
            if (!CanShowAd("banner")) return;
            
            var adUnitId = GetCurrentAdUnitId("banner");
            if (!string.IsNullOrEmpty(adUnitId))
            {
                Advertisement.Banner.Show(adUnitId);
                OnAdShown?.Invoke("banner");
            }
        }
        
        public void HideBannerAd()
        {
            Advertisement.Banner.Hide();
        }
        
        public void OnUnityAdsShowComplete(string adUnitId, UnityAdsShowCompletionState showCompletionState)
        {
            var platformAdUnits = GetPlatformAdUnits();
            
            if (adUnitId == platformAdUnits.interstitialAdId)
            {
                _isInterstitialLoaded = false;
                LoadInterstitialAd(); // Load next ad
                
                // Calculate revenue (simulated for test mode)
                var revenue = CalculateRevenue("interstitial");
                totalRevenue += revenue;
                totalAdViews++;
                avgRevenuePerAd = totalRevenue / totalAdViews;
                
                OnRevenueGenerated?.Invoke(revenue);
                OnAdCompleted?.Invoke(new AdResult 
                { 
                    success = true, 
                    revenue = revenue,
                    message = "Interstitial ad completed"
                });
                
                Debug.Log($"[UnityAdsNoKeys] Interstitial ad completed, Revenue: ${revenue:F4}");
            }
            else if (adUnitId == platformAdUnits.rewardedAdId)
            {
                _isRewardedLoaded = false;
                LoadRewardedAd(); // Load next ad
                
                // Calculate revenue (simulated for test mode)
                var revenue = CalculateRevenue("rewarded");
                totalRevenue += revenue;
                totalAdViews++;
                avgRevenuePerAd = totalRevenue / totalAdViews;
                
                OnRevenueGenerated?.Invoke(revenue);
                OnAdCompleted?.Invoke(new AdResult 
                { 
                    success = true, 
                    revenue = revenue,
                    message = "Rewarded ad completed"
                });
                
                Debug.Log($"[UnityAdsNoKeys] Rewarded ad completed, Revenue: ${revenue:F4}");
            }
        }
        
        public void OnUnityAdsShowFailure(string adUnitId, UnityAdsShowError error, string message)
        {
            Debug.LogError($"[UnityAdsNoKeys] Ad show failed {adUnitId}: {error} - {message}");
            
            OnAdCompleted?.Invoke(new AdResult 
            { 
                success = false, 
                message = $"Ad show failed: {message}"
            });
        }
        
        public void OnUnityAdsShowStart(string adUnitId)
        {
            Debug.Log($"[UnityAdsNoKeys] Ad started: {adUnitId}");
        }
        
        public void OnUnityAdsShowClick(string adUnitId)
        {
            Debug.Log($"[UnityAdsNoKeys] Ad clicked: {adUnitId}");
        }
        
        private float CalculateRevenue(string adType)
        {
            // Simulate revenue calculation (in test mode, this is estimated)
            var baseRevenue = adType == "rewarded" ? 0.05f : 0.03f;
            var variation = UnityEngine.Random.Range(0.8f, 1.2f);
            return baseRevenue * variation * adFrequencyMultiplier;
        }
        
        // Public API for external systems
        public float GetTotalRevenue() => totalRevenue;
        public int GetTotalAdViews() => totalAdViews;
        public float GetAverageRevenuePerAd() => avgRevenuePerAd;
        public void SetAdFrequencyMultiplier(float multiplier) => adFrequencyMultiplier = multiplier;
        
        public void LogRevenueReport()
        {
            Debug.Log("[UnityAdsNoKeys] === REVENUE REPORT ===");
            Debug.Log($"Total Revenue: ${totalRevenue:F2}");
            Debug.Log($"Total Ad Views: {totalAdViews}");
            Debug.Log($"Average Revenue Per Ad: ${avgRevenuePerAd:F4}");
            Debug.Log($"Ad Frequency Multiplier: {adFrequencyMultiplier:F2}");
        }
    }
    
    [System.Serializable]
    public class AdResult
    {
        public bool success;
        public string message;
        public float revenue;
    }
    
    [System.Serializable]
    public class AdUnitConfiguration
    {
        public string interstitialAdId = "Interstitial_Android";
        public string rewardedAdId = "Rewarded_Android";
        public string bannerAdId = "Banner_Android";
    }
}