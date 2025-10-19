using System;
using System.Collections.Generic;
using UnityEngine;

namespace Evergreen.Ads
{
    public class MaxAdapter : IAdAdapter
    {
        private bool _isInitialized = false;
        private Dictionary<string, bool> _loadedAds = new Dictionary<string, bool>();
        private Dictionary<string, float> _adRevenue = new Dictionary<string, float>();
        
        public void Initialize(Dictionary<string, object> config)
        {
            if (_isInitialized) return;
            
            try
            {
                // Initialize MAX SDK
                Debug.Log("[MAX] Initializing AppLovin MAX SDK...");
                
                // Set user consent (GDPR/CCPA)
                SetUserConsent(config);
                
                // Initialize MAX SDK
                InitializeMaxSdk(config);
                
                // Set up callbacks
                SetupCallbacks();
                
                _isInitialized = true;
                Debug.Log("[MAX] SDK initialized successfully");
            }
            catch (Exception e)
            {
                Debug.LogError($"[MAX] Initialization failed: {e.Message}");
            }
        }
        
        private void SetUserConsent(Dictionary<string, object> config)
        {
            // GDPR Consent
            if (config.ContainsKey("gdpr_consent"))
            {
                bool gdprConsent = Convert.ToBoolean(config["gdpr_consent"]);
                // MAX.SetHasUserConsent(gdprConsent);
                Debug.Log($"[MAX] GDPR Consent: {gdprConsent}");
            }
            
            // CCPA Consent
            if (config.ContainsKey("ccpa_consent"))
            {
                bool ccpaConsent = Convert.ToBoolean(config["ccpa_consent"]);
                // MAX.SetIsAgeRestrictedUser(!ccpaConsent);
                Debug.Log($"[MAX] CCPA Consent: {ccpaConsent}");
            }
        }
        
        private void InitializeMaxSdk(Dictionary<string, object> config)
        {
            string sdkKey = config.ContainsKey("sdk_key") ? config["sdk_key"].ToString() : "";
            
            if (string.IsNullOrEmpty(sdkKey))
            {
                Debug.LogError("[MAX] SDK key not provided");
                return;
            }
            
            // MAX.SetSdkKey(sdkKey);
            // MAX.InitializeSdk();
            
            Debug.Log("[MAX] SDK key set and initialization started");
        }
        
        private void SetupCallbacks()
        {
            // Interstitial callbacks
            // MAX.InterstitialAd.OnAdLoadedEvent += OnInterstitialLoaded;
            // MAX.InterstitialAd.OnAdLoadFailedEvent += OnInterstitialLoadFailed;
            // MAX.InterstitialAd.OnAdDisplayedEvent += OnInterstitialDisplayed;
            // MAX.InterstitialAd.OnAdClickedEvent += OnInterstitialClicked;
            // MAX.InterstitialAd.OnAdHiddenEvent += OnInterstitialHidden;
            // MAX.InterstitialAd.OnAdDisplayFailedEvent += OnInterstitialDisplayFailed;
            
            // Rewarded callbacks
            // MAX.RewardedAd.OnAdLoadedEvent += OnRewardedLoaded;
            // MAX.RewardedAd.OnAdLoadFailedEvent += OnRewardedLoadFailed;
            // MAX.RewardedAd.OnAdDisplayedEvent += OnRewardedDisplayed;
            // MAX.RewardedAd.OnAdClickedEvent += OnRewardedClicked;
            // MAX.RewardedAd.OnAdHiddenEvent += OnRewardedHidden;
            // MAX.RewardedAd.OnAdDisplayFailedEvent += OnRewardedDisplayFailed;
            // MAX.RewardedAd.OnAdReceivedRewardEvent += OnRewardedReceived;
            
            // Banner callbacks
            // MAX.BannerAd.OnAdLoadedEvent += OnBannerLoaded;
            // MAX.BannerAd.OnAdLoadFailedEvent += OnBannerLoadFailed;
            // MAX.BannerAd.OnAdClickedEvent += OnBannerClicked;
            // MAX.BannerAd.OnAdCollapsedEvent += OnBannerCollapsed;
            // MAX.BannerAd.OnAdExpandedEvent += OnBannerExpanded;
            
            Debug.Log("[MAX] Callbacks registered");
        }
        
        public void Preload(string placement)
        {
            if (!_isInitialized)
            {
                Debug.LogWarning("[MAX] SDK not initialized, cannot preload");
                return;
            }
            
            Debug.Log($"[MAX] Preloading ad for placement: {placement}");
            
            if (placement.Contains("interstitial") || placement.Contains("level_complete"))
            {
                // MAX.InterstitialAd.LoadAd();
                _loadedAds[placement] = true;
                Debug.Log($"[MAX] Interstitial ad preloaded for {placement}");
            }
            else if (placement.Contains("rewarded") || placement.Contains("continue"))
            {
                // MAX.RewardedAd.LoadAd();
                _loadedAds[placement] = true;
                Debug.Log($"[MAX] Rewarded ad preloaded for {placement}");
            }
            else if (placement.Contains("banner"))
            {
                // MAX.BannerAd.CreateAd(placement, AdViewPosition.BottomCenter);
                _loadedAds[placement] = true;
                Debug.Log($"[MAX] Banner ad preloaded for {placement}");
            }
        }
        
        public void ShowRewarded(string placement, Action onComplete = null)
        {
            if (!_isInitialized)
            {
                Debug.LogWarning("[MAX] SDK not initialized, cannot show rewarded ad");
                onComplete?.Invoke();
                return;
            }
            
            if (!_loadedAds.ContainsKey(placement) || !_loadedAds[placement])
            {
                Debug.LogWarning($"[MAX] Rewarded ad not loaded for {placement}");
                onComplete?.Invoke();
                return;
            }
            
            Debug.Log($"[MAX] Showing rewarded ad for {placement}");
            
            // Check if ad is ready
            // if (MAX.RewardedAd.IsReady())
            // {
            //     MAX.RewardedAd.ShowAd(placement);
            // }
            // else
            // {
            //     Debug.LogWarning("[MAX] Rewarded ad not ready");
            //     onComplete?.Invoke();
            // }
            
            // Simulate ad display for now
            StartCoroutine(SimulateRewardedAd(placement, onComplete));
        }
        
        public void ShowInterstitial(string placement)
        {
            if (!_isInitialized)
            {
                Debug.LogWarning("[MAX] SDK not initialized, cannot show interstitial");
                return;
            }
            
            if (!_loadedAds.ContainsKey(placement) || !_loadedAds[placement])
            {
                Debug.LogWarning($"[MAX] Interstitial ad not loaded for {placement}");
                return;
            }
            
            Debug.Log($"[MAX] Showing interstitial ad for {placement}");
            
            // Check if ad is ready
            // if (MAX.InterstitialAd.IsReady())
            // {
            //     MAX.InterstitialAd.ShowAd(placement);
            // }
            // else
            // {
            //     Debug.LogWarning("[MAX] Interstitial ad not ready");
            // }
            
            // Simulate ad display for now
            StartCoroutine(SimulateInterstitialAd(placement));
        }
        
        private System.Collections.IEnumerator SimulateRewardedAd(string placement, Action onComplete)
        {
            Debug.Log("[MAX] Simulating rewarded ad display...");
            yield return new WaitForSeconds(2f);
            
            // Simulate reward received
            Debug.Log("[MAX] Reward received!");
            onComplete?.Invoke();
        }
        
        private System.Collections.IEnumerator SimulateInterstitialAd(string placement)
        {
            Debug.Log("[MAX] Simulating interstitial ad display...");
            yield return new WaitForSeconds(2f);
            Debug.Log("[MAX] Interstitial ad completed");
        }
        
        // Callback methods (would be called by MAX SDK)
        private void OnInterstitialLoaded(string adUnitId, MaxSdkBase.AdInfo adInfo)
        {
            Debug.Log($"[MAX] Interstitial loaded: {adUnitId}");
            _loadedAds["interstitial"] = true;
        }
        
        private void OnInterstitialLoadFailed(string adUnitId, MaxSdkBase.ErrorInfo errorInfo)
        {
            Debug.LogError($"[MAX] Interstitial load failed: {errorInfo.Message}");
            _loadedAds["interstitial"] = false;
        }
        
        private void OnInterstitialDisplayed(string adUnitId, MaxSdkBase.AdInfo adInfo)
        {
            Debug.Log($"[MAX] Interstitial displayed: {adUnitId}");
        }
        
        private void OnInterstitialClicked(string adUnitId, MaxSdkBase.AdInfo adInfo)
        {
            Debug.Log($"[MAX] Interstitial clicked: {adUnitId}");
        }
        
        private void OnInterstitialHidden(string adUnitId, MaxSdkBase.AdInfo adInfo)
        {
            Debug.Log($"[MAX] Interstitial hidden: {adUnitId}");
        }
        
        private void OnInterstitialDisplayFailed(string adUnitId, MaxSdkBase.ErrorInfo errorInfo, MaxSdkBase.AdInfo adInfo)
        {
            Debug.LogError($"[MAX] Interstitial display failed: {errorInfo.Message}");
        }
        
        private void OnRewardedLoaded(string adUnitId, MaxSdkBase.AdInfo adInfo)
        {
            Debug.Log($"[MAX] Rewarded loaded: {adUnitId}");
            _loadedAds["rewarded"] = true;
        }
        
        private void OnRewardedLoadFailed(string adUnitId, MaxSdkBase.ErrorInfo errorInfo)
        {
            Debug.LogError($"[MAX] Rewarded load failed: {errorInfo.Message}");
            _loadedAds["rewarded"] = false;
        }
        
        private void OnRewardedDisplayed(string adUnitId, MaxSdkBase.AdInfo adInfo)
        {
            Debug.Log($"[MAX] Rewarded displayed: {adUnitId}");
        }
        
        private void OnRewardedClicked(string adUnitId, MaxSdkBase.AdInfo adInfo)
        {
            Debug.Log($"[MAX] Rewarded clicked: {adUnitId}");
        }
        
        private void OnRewardedHidden(string adUnitId, MaxSdkBase.AdInfo adInfo)
        {
            Debug.Log($"[MAX] Rewarded hidden: {adUnitId}");
        }
        
        private void OnRewardedDisplayFailed(string adUnitId, MaxSdkBase.ErrorInfo errorInfo, MaxSdkBase.AdInfo adInfo)
        {
            Debug.LogError($"[MAX] Rewarded display failed: {errorInfo.Message}");
        }
        
        private void OnRewardedReceived(string adUnitId, MaxSdk.Reward reward, MaxSdkBase.AdInfo adInfo)
        {
            Debug.Log($"[MAX] Reward received: {reward.Amount} {reward.Label}");
        }
        
        private void OnBannerLoaded(string adUnitId, MaxSdkBase.AdInfo adInfo)
        {
            Debug.Log($"[MAX] Banner loaded: {adUnitId}");
            _loadedAds["banner"] = true;
        }
        
        private void OnBannerLoadFailed(string adUnitId, MaxSdkBase.ErrorInfo errorInfo)
        {
            Debug.LogError($"[MAX] Banner load failed: {errorInfo.Message}");
            _loadedAds["banner"] = false;
        }
        
        private void OnBannerClicked(string adUnitId, MaxSdkBase.AdInfo adInfo)
        {
            Debug.Log($"[MAX] Banner clicked: {adUnitId}");
        }
        
        private void OnBannerCollapsed(string adUnitId, MaxSdkBase.AdInfo adInfo)
        {
            Debug.Log($"[MAX] Banner collapsed: {adUnitId}");
        }
        
        private void OnBannerExpanded(string adUnitId, MaxSdkBase.AdInfo adInfo)
        {
            Debug.Log($"[MAX] Banner expanded: {adUnitId}");
        }
        
        public float GetRevenue(string placement)
        {
            return _adRevenue.ContainsKey(placement) ? _adRevenue[placement] : 0f;
        }
        
        public bool IsAdLoaded(string placement)
        {
            return _loadedAds.ContainsKey(placement) && _loadedAds[placement];
        }
    }
}
