using System;
using System.Collections.Generic;
using UnityEngine;

namespace Evergreen.Ads
{
    public class AdvancedAdMediationAdapter : IAdAdapter
    {
        private bool _isInitialized = false;
        private AdvancedAdMediation _mediation;
        private AdRevenueAnalytics _analytics;
        
        public void Initialize(Dictionary<string, object> config)
        {
            if (_isInitialized) return;
            
            try
            {
                Debug.Log("[AdvancedMediation] Initializing Advanced Ad Mediation...");
                
                // Initialize mediation system
                _mediation = AdvancedAdMediation.Instance;
                if (_mediation == null)
                {
                    var go = new GameObject("AdvancedAdMediation");
                    _mediation = go.AddComponent<AdvancedAdMediation>();
                }
                
                // Initialize analytics
                _analytics = AdRevenueAnalytics.Instance;
                if (_analytics == null)
                {
                    var go = new GameObject("AdRevenueAnalytics");
                    _analytics = go.AddComponent<AdRevenueAnalytics>();
                }
                
                // Initialize all networks
                _mediation.InitializeAllNetworks(config);
                
                _isInitialized = true;
                Debug.Log("[AdvancedMediation] Advanced Ad Mediation initialized successfully");
            }
            catch (Exception e)
            {
                Debug.LogError($"[AdvancedMediation] Initialization failed: {e.Message}");
            }
        }
        
        public void Preload(string placement)
        {
            if (!_isInitialized)
            {
                Debug.LogWarning("[AdvancedMediation] Not initialized, cannot preload");
                return;
            }
            
            Debug.Log($"[AdvancedMediation] Preloading ad for placement: {placement}");
            
            // Determine ad type from placement
            var adType = GetAdTypeFromPlacement(placement);
            
            // Preload with best networks
            _mediation.PreloadAd(placement, adType);
        }
        
        public void ShowRewarded(string placement, Action onComplete = null)
        {
            if (!_isInitialized)
            {
                Debug.LogWarning("[AdvancedMediation] Not initialized, cannot show rewarded ad");
                onComplete?.Invoke();
                return;
            }
            
            Debug.Log($"[AdvancedMediation] Showing rewarded ad for {placement}");
            
            // Show with revenue optimization
            _mediation.ShowAd(placement, AdType.Rewarded, () =>
            {
                // Track impression and revenue
                if (_analytics != null)
                {
                    var revenue = CalculateRevenue(placement, AdType.Rewarded);
                    var userSegment = GetUserSegment();
                    _analytics.TrackAdImpression(placement, "AdvancedMediation", revenue, userSegment);
                }
                
                onComplete?.Invoke();
            });
        }
        
        public void ShowInterstitial(string placement)
        {
            if (!_isInitialized)
            {
                Debug.LogWarning("[AdvancedMediation] Not initialized, cannot show interstitial");
                return;
            }
            
            Debug.Log($"[AdvancedMediation] Showing interstitial ad for {placement}");
            
            // Show with revenue optimization
            _mediation.ShowAd(placement, AdType.Interstitial, () =>
            {
                // Track impression and revenue
                if (_analytics != null)
                {
                    var revenue = CalculateRevenue(placement, AdType.Interstitial);
                    var userSegment = GetUserSegment();
                    _analytics.TrackAdImpression(placement, "AdvancedMediation", revenue, userSegment);
                }
            });
        }
        
        private AdType GetAdTypeFromPlacement(string placement)
        {
            if (placement.Contains("rewarded") || placement.Contains("continue") || placement.Contains("boost"))
            {
                return AdType.Rewarded;
            }
            else if (placement.Contains("interstitial") || placement.Contains("level_complete"))
            {
                return AdType.Interstitial;
            }
            else if (placement.Contains("banner"))
            {
                return AdType.Banner;
            }
            
            return AdType.Interstitial; // Default
        }
        
        private float CalculateRevenue(string placement, AdType adType)
        {
            // Calculate revenue based on placement and ad type
            var baseRevenue = 0.001f; // Base revenue per impression
            
            if (adType == AdType.Rewarded)
            {
                baseRevenue *= 2f; // Rewarded ads typically have higher eCPM
            }
            else if (adType == AdType.Interstitial)
            {
                baseRevenue *= 1.5f; // Interstitial ads have medium eCPM
            }
            else if (adType == AdType.Banner)
            {
                baseRevenue *= 0.5f; // Banner ads have lower eCPM
            }
            
            // Apply placement multiplier
            if (placement.Contains("level_complete"))
            {
                baseRevenue *= 1.2f; // Level complete has higher engagement
            }
            else if (placement.Contains("rewarded_continue"))
            {
                baseRevenue *= 1.5f; // Continue ads have highest value
            }
            
            return baseRevenue;
        }
        
        private string GetUserSegment()
        {
            var playerSpend = PlayerPrefs.GetFloat("PlayerSpend", 0f);
            
            if (playerSpend >= 50f) return "whale";
            if (playerSpend >= 10f) return "dolphin";
            return "minnow";
        }
        
        public float GetRevenue(string placement)
        {
            if (_analytics != null)
            {
                return _analytics.totalLifetimeRevenue;
            }
            return 0f;
        }
        
        public bool IsAdLoaded(string placement)
        {
            // Advanced mediation always tries to show ads
            return _isInitialized;
        }
    }
}
