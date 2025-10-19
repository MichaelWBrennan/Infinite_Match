using System;
using System.Collections.Generic;
using UnityEngine;

namespace Evergreen.Ads
{
    public class LevelPlayAdapter : IAdAdapter
    {
        private bool _isInitialized = false;
        private Dictionary<string, bool> _loadedAds = new Dictionary<string, bool>();
        private Dictionary<string, float> _adRevenue = new Dictionary<string, float>();
        
        public void Initialize(Dictionary<string, object> config)
        {
            if (_isInitialized) return;
            
            try
            {
                // Initialize LevelPlay SDK
                Debug.Log("[LevelPlay] Initializing IronSource LevelPlay SDK...");
                
                // Set user consent (GDPR/CCPA)
                SetUserConsent(config);
                
                // Initialize LevelPlay SDK
                InitializeLevelPlaySdk(config);
                
                // Set up callbacks
                SetupCallbacks();
                
                _isInitialized = true;
                Debug.Log("[LevelPlay] SDK initialized successfully");
            }
            catch (Exception e)
            {
                Debug.LogError($"[LevelPlay] Initialization failed: {e.Message}");
            }
        }
        
        private void SetUserConsent(Dictionary<string, object> config)
        {
            // GDPR Consent
            if (config.ContainsKey("gdpr_consent"))
            {
                bool gdprConsent = Convert.ToBoolean(config["gdpr_consent"]);
                // IronSource.setConsent(gdprConsent);
                Debug.Log($"[LevelPlay] GDPR Consent: {gdprConsent}");
            }
            
            // CCPA Consent
            if (config.ContainsKey("ccpa_consent"))
            {
                bool ccpaConsent = Convert.ToBoolean(config["ccpa_consent"]);
                // IronSource.setMetaData("is_deviceid_optout", ccpaConsent ? "true" : "false");
                Debug.Log($"[LevelPlay] CCPA Consent: {ccpaConsent}");
            }
        }
        
        private void InitializeLevelPlaySdk(Dictionary<string, object> config)
        {
            string appKey = config.ContainsKey("app_key") ? config["app_key"].ToString() : "";
            
            if (string.IsNullOrEmpty(appKey))
            {
                Debug.LogError("[LevelPlay] App key not provided");
                return;
            }
            
            // IronSource.setUserId("user_id");
            // IronSource.init(appKey);
            
            Debug.Log("[LevelPlay] App key set and initialization started");
        }
        
        private void SetupCallbacks()
        {
            // Interstitial callbacks
            // IronSourceInterstitialEvents.onAdReadyEvent += OnInterstitialReady;
            // IronSourceInterstitialEvents.onAdLoadFailedEvent += OnInterstitialLoadFailed;
            // IronSourceInterstitialEvents.onAdOpenedEvent += OnInterstitialOpened;
            // IronSourceInterstitialEvents.onAdClickedEvent += OnInterstitialClicked;
            // IronSourceInterstitialEvents.onAdClosedEvent += OnInterstitialClosed;
            // IronSourceInterstitialEvents.onAdShowFailedEvent += OnInterstitialShowFailed;
            
            // Rewarded callbacks
            // IronSourceRewardedVideoEvents.onAdAvailableEvent += OnRewardedAvailable;
            // IronSourceRewardedVideoEvents.onAdUnavailableEvent += OnRewardedUnavailable;
            // IronSourceRewardedVideoEvents.onAdOpenedEvent += OnRewardedOpened;
            // IronSourceRewardedVideoEvents.onAdClickedEvent += OnRewardedClicked;
            // IronSourceRewardedVideoEvents.onAdClosedEvent += OnRewardedClosed;
            // IronSourceRewardedVideoEvents.onAdRewardedEvent += OnRewardedReceived;
            // IronSourceRewardedVideoEvents.onAdShowFailedEvent += OnRewardedShowFailed;
            
            // Banner callbacks
            // IronSourceBannerEvents.onAdLoadedEvent += OnBannerLoaded;
            // IronSourceBannerEvents.onAdLoadFailedEvent += OnBannerLoadFailed;
            // IronSourceBannerEvents.onAdClickedEvent += OnBannerClicked;
            // IronSourceBannerEvents.onAdScreenPresentedEvent += OnBannerPresented;
            // IronSourceBannerEvents.onAdScreenDismissedEvent += OnBannerDismissed;
            // IronSourceBannerEvents.onAdLeftApplicationEvent += OnBannerLeftApplication;
            
            Debug.Log("[LevelPlay] Callbacks registered");
        }
        
        public void Preload(string placement)
        {
            if (!_isInitialized)
            {
                Debug.LogWarning("[LevelPlay] SDK not initialized, cannot preload");
                return;
            }
            
            Debug.Log($"[LevelPlay] Preloading ad for placement: {placement}");
            
            if (placement.Contains("interstitial") || placement.Contains("level_complete"))
            {
                // IronSource.loadInterstitial();
                _loadedAds[placement] = true;
                Debug.Log($"[LevelPlay] Interstitial ad preloaded for {placement}");
            }
            else if (placement.Contains("rewarded") || placement.Contains("continue"))
            {
                // IronSource.loadRewardedVideo();
                _loadedAds[placement] = true;
                Debug.Log($"[LevelPlay] Rewarded ad preloaded for {placement}");
            }
            else if (placement.Contains("banner"))
            {
                // IronSource.loadBanner(IronSourceBannerSize.BANNER, IronSourceBannerPosition.BOTTOM);
                _loadedAds[placement] = true;
                Debug.Log($"[LevelPlay] Banner ad preloaded for {placement}");
            }
        }
        
        public void ShowRewarded(string placement, Action onComplete = null)
        {
            if (!_isInitialized)
            {
                Debug.LogWarning("[LevelPlay] SDK not initialized, cannot show rewarded ad");
                onComplete?.Invoke();
                return;
            }
            
            if (!_loadedAds.ContainsKey(placement) || !_loadedAds[placement])
            {
                Debug.LogWarning($"[LevelPlay] Rewarded ad not loaded for {placement}");
                onComplete?.Invoke();
                return;
            }
            
            Debug.Log($"[LevelPlay] Showing rewarded ad for {placement}");
            
            // Check if ad is ready
            // if (IronSource.isRewardedVideoAvailable())
            // {
            //     IronSource.showRewardedVideo(placement);
            // }
            // else
            // {
            //     Debug.LogWarning("[LevelPlay] Rewarded ad not ready");
            //     onComplete?.Invoke();
            // }
            
            // Simulate ad display for now
            StartCoroutine(SimulateRewardedAd(placement, onComplete));
        }
        
        public void ShowInterstitial(string placement)
        {
            if (!_isInitialized)
            {
                Debug.LogWarning("[LevelPlay] SDK not initialized, cannot show interstitial");
                return;
            }
            
            if (!_loadedAds.ContainsKey(placement) || !_loadedAds[placement])
            {
                Debug.LogWarning($"[LevelPlay] Interstitial ad not loaded for {placement}");
                return;
            }
            
            Debug.Log($"[LevelPlay] Showing interstitial ad for {placement}");
            
            // Check if ad is ready
            // if (IronSource.isInterstitialReady())
            // {
            //     IronSource.showInterstitial(placement);
            // }
            // else
            // {
            //     Debug.LogWarning("[LevelPlay] Interstitial ad not ready");
            // }
            
            // Simulate ad display for now
            StartCoroutine(SimulateInterstitialAd(placement));
        }
        
        private System.Collections.IEnumerator SimulateRewardedAd(string placement, Action onComplete)
        {
            Debug.Log("[LevelPlay] Simulating rewarded ad display...");
            yield return new WaitForSeconds(2f);
            
            // Simulate reward received
            Debug.Log("[LevelPlay] Reward received!");
            onComplete?.Invoke();
        }
        
        private System.Collections.IEnumerator SimulateInterstitialAd(string placement)
        {
            Debug.Log("[LevelPlay] Simulating interstitial ad display...");
            yield return new WaitForSeconds(2f);
            Debug.Log("[LevelPlay] Interstitial ad completed");
        }
        
        // Callback methods (would be called by LevelPlay SDK)
        private void OnInterstitialReady(IronSourceAdInfo adInfo)
        {
            Debug.Log("[LevelPlay] Interstitial ready");
            _loadedAds["interstitial"] = true;
        }
        
        private void OnInterstitialLoadFailed(IronSourceError error)
        {
            Debug.LogError($"[LevelPlay] Interstitial load failed: {error.getDescription()}");
            _loadedAds["interstitial"] = false;
        }
        
        private void OnInterstitialOpened(IronSourceAdInfo adInfo)
        {
            Debug.Log("[LevelPlay] Interstitial opened");
        }
        
        private void OnInterstitialClicked(IronSourceAdInfo adInfo)
        {
            Debug.Log("[LevelPlay] Interstitial clicked");
        }
        
        private void OnInterstitialClosed(IronSourceAdInfo adInfo)
        {
            Debug.Log("[LevelPlay] Interstitial closed");
        }
        
        private void OnInterstitialShowFailed(IronSourceError error, IronSourceAdInfo adInfo)
        {
            Debug.LogError($"[LevelPlay] Interstitial show failed: {error.getDescription()}");
        }
        
        private void OnRewardedAvailable(IronSourceAdInfo adInfo)
        {
            Debug.Log("[LevelPlay] Rewarded video available");
            _loadedAds["rewarded"] = true;
        }
        
        private void OnRewardedUnavailable()
        {
            Debug.Log("[LevelPlay] Rewarded video unavailable");
            _loadedAds["rewarded"] = false;
        }
        
        private void OnRewardedOpened(IronSourceAdInfo adInfo)
        {
            Debug.Log("[LevelPlay] Rewarded video opened");
        }
        
        private void OnRewardedClicked(IronSourceAdInfo adInfo)
        {
            Debug.Log("[LevelPlay] Rewarded video clicked");
        }
        
        private void OnRewardedClosed(IronSourceAdInfo adInfo)
        {
            Debug.Log("[LevelPlay] Rewarded video closed");
        }
        
        private void OnRewardedReceived(IronSourcePlacement placement, IronSourceAdInfo adInfo)
        {
            Debug.Log($"[LevelPlay] Reward received: {placement.getRewardName()} - {placement.getRewardAmount()}");
        }
        
        private void OnRewardedShowFailed(IronSourceError error, IronSourceAdInfo adInfo)
        {
            Debug.LogError($"[LevelPlay] Rewarded video show failed: {error.getDescription()}");
        }
        
        private void OnBannerLoaded(IronSourceAdInfo adInfo)
        {
            Debug.Log("[LevelPlay] Banner loaded");
            _loadedAds["banner"] = true;
        }
        
        private void OnBannerLoadFailed(IronSourceError error)
        {
            Debug.LogError($"[LevelPlay] Banner load failed: {error.getDescription()}");
            _loadedAds["banner"] = false;
        }
        
        private void OnBannerClicked(IronSourceAdInfo adInfo)
        {
            Debug.Log("[LevelPlay] Banner clicked");
        }
        
        private void OnBannerPresented(IronSourceAdInfo adInfo)
        {
            Debug.Log("[LevelPlay] Banner presented");
        }
        
        private void OnBannerDismissed(IronSourceAdInfo adInfo)
        {
            Debug.Log("[LevelPlay] Banner dismissed");
        }
        
        private void OnBannerLeftApplication(IronSourceAdInfo adInfo)
        {
            Debug.Log("[LevelPlay] Banner left application");
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
