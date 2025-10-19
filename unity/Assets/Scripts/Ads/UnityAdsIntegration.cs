using UnityEngine;
using System;

namespace Evergreen.Ads
{
    /// <summary>
    /// Simple integration example for Unity Ads (No Keys Required)
    /// Shows how to use Unity's built-in ad system
    /// </summary>
    public class UnityAdsIntegration : MonoBehaviour
    {
        [Header("Ad Integration Settings")]
        public bool enableAds = true;
        public bool enableRewardedAds = true;
        public bool enableInterstitialAds = true;
        public bool enableBannerAds = true;
        
        [Header("Ad Triggers")]
        public bool showAdOnLevelComplete = true;
        public bool showAdOnPlayerStruggling = true;
        public bool showAdOnBoostRequest = true;
        public bool showAdOnEnergyEmpty = true;
        
        private UnityAdsNoKeys _adSystem;
        
        void Start()
        {
            _adSystem = UnityAdsNoKeys.Instance;
            
            if (_adSystem == null)
            {
                Debug.LogError("UnityAdsNoKeys not found! Make sure it's in the scene.");
                return;
            }
            
            // Subscribe to ad events
            UnityAdsNoKeys.OnAdCompleted += OnAdCompleted;
            UnityAdsNoKeys.OnRevenueGenerated += OnRevenueGenerated;
            UnityAdsNoKeys.OnAdShown += OnAdShown;
            
            Debug.Log("Unity Ads Integration initialized - No external keys required!");
        }
        
        void OnDestroy()
        {
            // Unsubscribe from events
            if (UnityAdsNoKeys.OnAdCompleted != null)
            {
                UnityAdsNoKeys.OnAdCompleted -= OnAdCompleted;
                UnityAdsNoKeys.OnRevenueGenerated -= OnRevenueGenerated;
                UnityAdsNoKeys.OnAdShown -= OnAdShown;
            }
        }
        
        // Example: Show ad when level is completed
        public void OnLevelComplete(int level)
        {
            if (!enableAds || !showAdOnLevelComplete) return;
            
            if (enableInterstitialAds && _adSystem.CanShowAd("interstitial"))
            {
                _adSystem.ShowInterstitialAd((result) =>
                {
                    if (result.success)
                    {
                        Debug.Log($"Level {level} completed - Ad shown, Revenue: ${result.revenue:F4}");
                    }
                });
            }
        }
        
        // Example: Show rewarded ad when player is struggling
        public void OnPlayerStruggling()
        {
            if (!enableAds || !showAdOnPlayerStruggling) return;
            
            if (enableRewardedAds && _adSystem.CanShowAd("rewarded"))
            {
                _adSystem.ShowRewardedAd((result) =>
                {
                    if (result.success)
                    {
                        Debug.Log($"Player struggling - Rewarded ad shown, Revenue: ${result.revenue:F4}");
                        // Give reward to player
                        GiveRewardToPlayer("continue");
                    }
                });
            }
        }
        
        // Example: Show rewarded ad for boost
        public void OnBoostRequested()
        {
            if (!enableAds || !showAdOnBoostRequest) return;
            
            if (enableRewardedAds && _adSystem.CanShowAd("rewarded"))
            {
                _adSystem.ShowRewardedAd((result) =>
                {
                    if (result.success)
                    {
                        Debug.Log($"Boost requested - Rewarded ad shown, Revenue: ${result.revenue:F4}");
                        // Give boost to player
                        GiveRewardToPlayer("boost");
                    }
                });
            }
        }
        
        // Example: Show rewarded ad when energy is empty
        public void OnEnergyEmpty()
        {
            if (!enableAds || !showAdOnEnergyEmpty) return;
            
            if (enableRewardedAds && _adSystem.CanShowAd("rewarded"))
            {
                _adSystem.ShowRewardedAd((result) =>
                {
                    if (result.success)
                    {
                        Debug.Log($"Energy empty - Rewarded ad shown, Revenue: ${result.revenue:F4}");
                        // Give energy to player
                        GiveRewardToPlayer("energy");
                    }
                });
            }
        }
        
        // Example: Show banner ad
        public void ShowBannerAd()
        {
            if (!enableAds || !enableBannerAds) return;
            
            if (_adSystem.CanShowAd("banner"))
            {
                _adSystem.ShowBannerAd();
            }
        }
        
        // Example: Hide banner ad
        public void HideBannerAd()
        {
            if (_adSystem != null)
            {
                _adSystem.HideBannerAd();
            }
        }
        
        private void GiveRewardToPlayer(string rewardType)
        {
            // Implement your reward system here
            switch (rewardType)
            {
                case "continue":
                    Debug.Log("Giving continue reward to player");
                    break;
                case "boost":
                    Debug.Log("Giving boost reward to player");
                    break;
                case "energy":
                    Debug.Log("Giving energy reward to player");
                    break;
            }
        }
        
        // Event handlers
        private void OnAdCompleted(AdResult result)
        {
            Debug.Log($"Ad completed: {result.message}, Revenue: ${result.revenue:F4}");
        }
        
        private void OnRevenueGenerated(float revenue)
        {
            Debug.Log($"Revenue generated: ${revenue:F4}");
        }
        
        private void OnAdShown(string placement)
        {
            Debug.Log($"Ad shown: {placement}");
        }
        
        // Public methods for external systems
        public void ShowInterstitialAd()
        {
            if (_adSystem != null && _adSystem.CanShowAd("interstitial"))
            {
                _adSystem.ShowInterstitialAd();
            }
        }
        
        public void ShowRewardedAd()
        {
            if (_adSystem != null && _adSystem.CanShowAd("rewarded"))
            {
                _adSystem.ShowRewardedAd();
            }
        }
        
        public float GetTotalRevenue()
        {
            return _adSystem != null ? _adSystem.GetTotalRevenue() : 0f;
        }
        
        public int GetTotalAdViews()
        {
            return _adSystem != null ? _adSystem.GetTotalAdViews() : 0;
        }
        
        public float GetAverageRevenuePerAd()
        {
            return _adSystem != null ? _adSystem.GetAverageRevenuePerAd() : 0f;
        }
        
        public void SetAdFrequencyMultiplier(float multiplier)
        {
            if (_adSystem != null)
            {
                _adSystem.SetAdFrequencyMultiplier(multiplier);
            }
        }
        
        // Example: Generate revenue report
        public void GenerateRevenueReport()
        {
            if (_adSystem != null)
            {
                _adSystem.LogRevenueReport();
            }
        }
    }
}