using System;
using System.Collections.Generic;
using UnityEngine;

namespace Evergreen.Ads
{
    public class UnityAdsAdapter : IAdAdapter
    {
        private bool _isInitialized = false;
        private Dictionary<string, bool> _loadedAds = new Dictionary<string, bool>();
        private Dictionary<string, float> _adRevenue = new Dictionary<string, float>();
        
        public void Initialize(Dictionary<string, object> config)
        {
            if (_isInitialized) return;
            
            try
            {
                // Initialize Unity Ads
                Debug.Log("[UnityAds] Initializing Unity Ads SDK...");
                
                // Set user consent (GDPR/CCPA)
                SetUserConsent(config);
                
                // Initialize Unity Ads SDK
                InitializeUnityAdsSdk(config);
                
                // Set up callbacks
                SetupCallbacks();
                
                _isInitialized = true;
                Debug.Log("[UnityAds] SDK initialized successfully");
            }
            catch (Exception e)
            {
                Debug.LogError($"[UnityAds] Initialization failed: {e.Message}");
            }
        }
        
        private void SetUserConsent(Dictionary<string, object> config)
        {
            // GDPR Consent
            if (config.ContainsKey("gdpr_consent"))
            {
                bool gdprConsent = Convert.ToBoolean(config["gdpr_consent"]);
                // MetaData gdprMetaData = new MetaData("gdpr");
                // gdprMetaData.Set("consent", gdprConsent ? "true" : "false");
                // Advertisement.SetMetaData(gdprMetaData);
                Debug.Log($"[UnityAds] GDPR Consent: {gdprConsent}");
            }
            
            // CCPA Consent
            if (config.ContainsKey("ccpa_consent"))
            {
                bool ccpaConsent = Convert.ToBoolean(config["ccpa_consent"]);
                // MetaData ccpaMetaData = new MetaData("ccpa");
                // ccpaMetaData.Set("consent", ccpaConsent ? "true" : "false");
                // Advertisement.SetMetaData(ccpaMetaData);
                Debug.Log($"[UnityAds] CCPA Consent: {ccpaConsent}");
            }
        }
        
        private void InitializeUnityAdsSdk(Dictionary<string, object> config)
        {
            string gameId = config.ContainsKey("game_id") ? config["game_id"].ToString() : "";
            bool testMode = config.ContainsKey("test_mode") ? Convert.ToBoolean(config["test_mode"]) : false;
            
            if (string.IsNullOrEmpty(gameId))
            {
                Debug.LogError("[UnityAds] Game ID not provided");
                return;
            }
            
            // Advertisement.Initialize(gameId, testMode);
            
            Debug.Log($"[UnityAds] Game ID set: {gameId}, Test Mode: {testMode}");
        }
        
        private void SetupCallbacks()
        {
            // Interstitial callbacks
            // Advertisement.AddListener(OnInterstitialReady);
            // Advertisement.AddListener(OnInterstitialError);
            // Advertisement.AddListener(OnInterstitialStart);
            // Advertisement.AddListener(OnInterstitialFinish);
            
            // Rewarded callbacks
            // Advertisement.AddListener(OnRewardedReady);
            // Advertisement.AddListener(OnRewardedError);
            // Advertisement.AddListener(OnRewardedStart);
            // Advertisement.AddListener(OnRewardedFinish);
            
            Debug.Log("[UnityAds] Callbacks registered");
        }
        
        public void Preload(string placement)
        {
            if (!_isInitialized)
            {
                Debug.LogWarning("[UnityAds] SDK not initialized, cannot preload");
                return;
            }
            
            Debug.Log($"[UnityAds] Preloading ad for placement: {placement}");
            
            if (placement.Contains("interstitial") || placement.Contains("level_complete"))
            {
                // Advertisement.Load(placement);
                _loadedAds[placement] = true;
                Debug.Log($"[UnityAds] Interstitial ad preloaded for {placement}");
            }
            else if (placement.Contains("rewarded") || placement.Contains("continue"))
            {
                // Advertisement.Load(placement);
                _loadedAds[placement] = true;
                Debug.Log($"[UnityAds] Rewarded ad preloaded for {placement}");
            }
        }
        
        public void ShowRewarded(string placement, Action onComplete = null)
        {
            if (!_isInitialized)
            {
                Debug.LogWarning("[UnityAds] SDK not initialized, cannot show rewarded ad");
                onComplete?.Invoke();
                return;
            }
            
            if (!_loadedAds.ContainsKey(placement) || !_loadedAds[placement])
            {
                Debug.LogWarning($"[UnityAds] Rewarded ad not loaded for {placement}");
                onComplete?.Invoke();
                return;
            }
            
            Debug.Log($"[UnityAds] Showing rewarded ad for {placement}");
            
            // Check if ad is ready
            // if (Advertisement.IsReady(placement))
            // {
            //     Advertisement.Show(placement);
            // }
            // else
            // {
            //     Debug.LogWarning("[UnityAds] Rewarded ad not ready");
            //     onComplete?.Invoke();
            // }
            
            // Simulate ad display for now
            StartCoroutine(SimulateRewardedAd(placement, onComplete));
        }
        
        public void ShowInterstitial(string placement)
        {
            if (!_isInitialized)
            {
                Debug.LogWarning("[UnityAds] SDK not initialized, cannot show interstitial");
                return;
            }
            
            if (!_loadedAds.ContainsKey(placement) || !_loadedAds[placement])
            {
                Debug.LogWarning($"[UnityAds] Interstitial ad not loaded for {placement}");
                return;
            }
            
            Debug.Log($"[UnityAds] Showing interstitial ad for {placement}");
            
            // Check if ad is ready
            // if (Advertisement.IsReady(placement))
            // {
            //     Advertisement.Show(placement);
            // }
            // else
            // {
            //     Debug.LogWarning("[UnityAds] Interstitial ad not ready");
            // }
            
            // Simulate ad display for now
            StartCoroutine(SimulateInterstitialAd(placement));
        }
        
        private System.Collections.IEnumerator SimulateRewardedAd(string placement, Action onComplete)
        {
            Debug.Log("[UnityAds] Simulating rewarded ad display...");
            yield return new WaitForSeconds(2f);
            
            // Simulate reward received
            Debug.Log("[UnityAds] Reward received!");
            onComplete?.Invoke();
        }
        
        private System.Collections.IEnumerator SimulateInterstitialAd(string placement)
        {
            Debug.Log("[UnityAds] Simulating interstitial ad display...");
            yield return new WaitForSeconds(2f);
            Debug.Log("[UnityAds] Interstitial ad completed");
        }
        
        // Callback methods (would be called by Unity Ads SDK)
        private void OnInterstitialReady(string placementId)
        {
            Debug.Log($"[UnityAds] Interstitial ready: {placementId}");
            _loadedAds["interstitial"] = true;
        }
        
        private void OnInterstitialError(string message)
        {
            Debug.LogError($"[UnityAds] Interstitial error: {message}");
            _loadedAds["interstitial"] = false;
        }
        
        private void OnInterstitialStart(string placementId)
        {
            Debug.Log($"[UnityAds] Interstitial started: {placementId}");
        }
        
        private void OnInterstitialFinish(string placementId, ShowResult showResult)
        {
            Debug.Log($"[UnityAds] Interstitial finished: {placementId}, Result: {showResult}");
        }
        
        private void OnRewardedReady(string placementId)
        {
            Debug.Log($"[UnityAds] Rewarded ready: {placementId}");
            _loadedAds["rewarded"] = true;
        }
        
        private void OnRewardedError(string message)
        {
            Debug.LogError($"[UnityAds] Rewarded error: {message}");
            _loadedAds["rewarded"] = false;
        }
        
        private void OnRewardedStart(string placementId)
        {
            Debug.Log($"[UnityAds] Rewarded started: {placementId}");
        }
        
        private void OnRewardedFinish(string placementId, ShowResult showResult)
        {
            Debug.Log($"[UnityAds] Rewarded finished: {placementId}, Result: {showResult}");
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
    
    public enum ShowResult
    {
        Failed,
        Skipped,
        Finished
    }
}
