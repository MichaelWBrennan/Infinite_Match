using System;
using System.Collections.Generic;
using UnityEngine;

namespace Evergreen.Ads
{
    public class AdMobAdapter : IAdAdapter
    {
        private bool _isInitialized = false;
        private Dictionary<string, bool> _loadedAds = new Dictionary<string, bool>();
        private Dictionary<string, float> _adRevenue = new Dictionary<string, float>();
        
        public void Initialize(Dictionary<string, object> config)
        {
            if (_isInitialized) return;
            
            try
            {
                // Initialize AdMob
                Debug.Log("[AdMob] Initializing Google AdMob SDK...");
                
                // Set user consent (GDPR/CCPA)
                SetUserConsent(config);
                
                // Initialize AdMob SDK
                InitializeAdMobSdk(config);
                
                // Set up callbacks
                SetupCallbacks();
                
                _isInitialized = true;
                Debug.Log("[AdMob] SDK initialized successfully");
            }
            catch (Exception e)
            {
                Debug.LogError($"[AdMob] Initialization failed: {e.Message}");
            }
        }
        
        private void SetUserConsent(Dictionary<string, object> config)
        {
            // GDPR Consent
            if (config.ContainsKey("gdpr_consent"))
            {
                bool gdprConsent = Convert.ToBoolean(config["gdpr_consent"]);
                // MobileAds.SetRequestConfiguration(new RequestConfiguration.Builder()
                //     .SetTagForChildDirectedTreatment(TagForChildDirectedTreatment.Unspecified)
                //     .SetTagForUnderAgeOfConsent(TagForUnderAgeOfConsent.Unspecified)
                //     .SetMaxAdContentRating(MaxAdContentRating.Unspecified)
                //     .Build());
                Debug.Log($"[AdMob] GDPR Consent: {gdprConsent}");
            }
            
            // CCPA Consent
            if (config.ContainsKey("ccpa_consent"))
            {
                bool ccpaConsent = Convert.ToBoolean(config["ccpa_consent"]);
                // MobileAds.SetRequestConfiguration(new RequestConfiguration.Builder()
                //     .SetTagForChildDirectedTreatment(TagForChildDirectedTreatment.Unspecified)
                //     .SetTagForUnderAgeOfConsent(TagForUnderAgeOfConsent.Unspecified)
                //     .SetMaxAdContentRating(MaxAdContentRating.Unspecified)
                //     .Build());
                Debug.Log($"[AdMob] CCPA Consent: {ccpaConsent}");
            }
        }
        
        private void InitializeAdMobSdk(Dictionary<string, object> config)
        {
            string appId = config.ContainsKey("app_id") ? config["app_id"].ToString() : "";
            
            if (string.IsNullOrEmpty(appId))
            {
                Debug.LogError("[AdMob] App ID not provided");
                return;
            }
            
            // MobileAds.Initialize(OnInitializationComplete);
            
            Debug.Log($"[AdMob] App ID set: {appId}");
        }
        
        private void OnInitializationComplete(InitializationStatus status)
        {
            Debug.Log($"[AdMob] Initialization complete: {status}");
        }
        
        private void SetupCallbacks()
        {
            // Interstitial callbacks
            // InterstitialAd.OnAdLoaded += OnInterstitialLoaded;
            // InterstitialAd.OnAdFailedToLoad += OnInterstitialFailedToLoad;
            // InterstitialAd.OnAdOpening += OnInterstitialOpening;
            // InterstitialAd.OnAdClosed += OnInterstitialClosed;
            // InterstitialAd.OnAdFailedToShow += OnInterstitialFailedToShow;
            
            // Rewarded callbacks
            // RewardedAd.OnAdLoaded += OnRewardedLoaded;
            // RewardedAd.OnAdFailedToLoad += OnRewardedFailedToLoad;
            // RewardedAd.OnAdOpening += OnRewardedOpening;
            // RewardedAd.OnAdClosed += OnRewardedClosed;
            // RewardedAd.OnAdFailedToShow += OnRewardedFailedToShow;
            // RewardedAd.OnUserEarnedReward += OnRewardedEarned;
            
            // Banner callbacks
            // BannerView.OnBannerAdLoaded += OnBannerLoaded;
            // BannerView.OnBannerAdLoadFailed += OnBannerLoadFailed;
            // BannerView.OnBannerAdOpened += OnBannerOpened;
            // BannerView.OnBannerAdClosed += OnBannerClosed;
            
            Debug.Log("[AdMob] Callbacks registered");
        }
        
        public void Preload(string placement)
        {
            if (!_isInitialized)
            {
                Debug.LogWarning("[AdMob] SDK not initialized, cannot preload");
                return;
            }
            
            Debug.Log($"[AdMob] Preloading ad for placement: {placement}");
            
            if (placement.Contains("interstitial") || placement.Contains("level_complete"))
            {
                // InterstitialAd.LoadAd(placement, new AdRequest());
                _loadedAds[placement] = true;
                Debug.Log($"[AdMob] Interstitial ad preloaded for {placement}");
            }
            else if (placement.Contains("rewarded") || placement.Contains("continue"))
            {
                // RewardedAd.LoadAd(placement, new AdRequest());
                _loadedAds[placement] = true;
                Debug.Log($"[AdMob] Rewarded ad preloaded for {placement}");
            }
            else if (placement.Contains("banner"))
            {
                // BannerView bannerView = new BannerView(placement, AdSize.Banner, AdPosition.Bottom);
                // bannerView.LoadAd(new AdRequest());
                _loadedAds[placement] = true;
                Debug.Log($"[AdMob] Banner ad preloaded for {placement}");
            }
        }
        
        public void ShowRewarded(string placement, Action onComplete = null)
        {
            if (!_isInitialized)
            {
                Debug.LogWarning("[AdMob] SDK not initialized, cannot show rewarded ad");
                onComplete?.Invoke();
                return;
            }
            
            if (!_loadedAds.ContainsKey(placement) || !_loadedAds[placement])
            {
                Debug.LogWarning($"[AdMob] Rewarded ad not loaded for {placement}");
                onComplete?.Invoke();
                return;
            }
            
            Debug.Log($"[AdMob] Showing rewarded ad for {placement}");
            
            // Check if ad is ready
            // if (RewardedAd.IsLoaded())
            // {
            //     RewardedAd.Show(OnRewardedEarned);
            // }
            // else
            // {
            //     Debug.LogWarning("[AdMob] Rewarded ad not ready");
            //     onComplete?.Invoke();
            // }
            
            // Simulate ad display for now
            StartCoroutine(SimulateRewardedAd(placement, onComplete));
        }
        
        public void ShowInterstitial(string placement)
        {
            if (!_isInitialized)
            {
                Debug.LogWarning("[AdMob] SDK not initialized, cannot show interstitial");
                return;
            }
            
            if (!_loadedAds.ContainsKey(placement) || !_loadedAds[placement])
            {
                Debug.LogWarning($"[AdMob] Interstitial ad not loaded for {placement}");
                return;
            }
            
            Debug.Log($"[AdMob] Showing interstitial ad for {placement}");
            
            // Check if ad is ready
            // if (InterstitialAd.IsLoaded())
            // {
            //     InterstitialAd.Show();
            // }
            // else
            // {
            //     Debug.LogWarning("[AdMob] Interstitial ad not ready");
            // }
            
            // Simulate ad display for now
            StartCoroutine(SimulateInterstitialAd(placement));
        }
        
        private System.Collections.IEnumerator SimulateRewardedAd(string placement, Action onComplete)
        {
            Debug.Log("[AdMob] Simulating rewarded ad display...");
            yield return new WaitForSeconds(2f);
            
            // Simulate reward received
            Debug.Log("[AdMob] Reward received!");
            onComplete?.Invoke();
        }
        
        private System.Collections.IEnumerator SimulateInterstitialAd(string placement)
        {
            Debug.Log("[AdMob] Simulating interstitial ad display...");
            yield return new WaitForSeconds(2f);
            Debug.Log("[AdMob] Interstitial ad completed");
        }
        
        // Callback methods (would be called by AdMob SDK)
        private void OnInterstitialLoaded(InterstitialAd ad)
        {
            Debug.Log("[AdMob] Interstitial loaded");
            _loadedAds["interstitial"] = true;
        }
        
        private void OnInterstitialFailedToLoad(LoadAdError error)
        {
            Debug.LogError($"[AdMob] Interstitial load failed: {error.GetMessage()}");
            _loadedAds["interstitial"] = false;
        }
        
        private void OnInterstitialOpening(InterstitialAd ad)
        {
            Debug.Log("[AdMob] Interstitial opened");
        }
        
        private void OnInterstitialClosed(InterstitialAd ad)
        {
            Debug.Log("[AdMob] Interstitial closed");
        }
        
        private void OnInterstitialFailedToShow(AdError error)
        {
            Debug.LogError($"[AdMob] Interstitial show failed: {error.GetMessage()}");
        }
        
        private void OnRewardedLoaded(RewardedAd ad)
        {
            Debug.Log("[AdMob] Rewarded loaded");
            _loadedAds["rewarded"] = true;
        }
        
        private void OnRewardedFailedToLoad(LoadAdError error)
        {
            Debug.LogError($"[AdMob] Rewarded load failed: {error.GetMessage()}");
            _loadedAds["rewarded"] = false;
        }
        
        private void OnRewardedOpening(RewardedAd ad)
        {
            Debug.Log("[AdMob] Rewarded opened");
        }
        
        private void OnRewardedClosed(RewardedAd ad)
        {
            Debug.Log("[AdMob] Rewarded closed");
        }
        
        private void OnRewardedFailedToShow(AdError error)
        {
            Debug.LogError($"[AdMob] Rewarded show failed: {error.GetMessage()}");
        }
        
        private void OnRewardedEarned(Reward reward)
        {
            Debug.Log($"[AdMob] Reward earned: {reward.Amount} {reward.Type}");
        }
        
        private void OnBannerLoaded(BannerView bannerView)
        {
            Debug.Log("[AdMob] Banner loaded");
            _loadedAds["banner"] = true;
        }
        
        private void OnBannerLoadFailed(LoadAdError error)
        {
            Debug.LogError($"[AdMob] Banner load failed: {error.GetMessage()}");
            _loadedAds["banner"] = false;
        }
        
        private void OnBannerOpened(BannerView bannerView)
        {
            Debug.Log("[AdMob] Banner opened");
        }
        
        private void OnBannerClosed(BannerView bannerView)
        {
            Debug.Log("[AdMob] Banner closed");
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
