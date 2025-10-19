using UnityEngine;
using System;

namespace Evergreen.Ads
{
    /// <summary>
    /// Example integration of Key-Free Ad System
    /// Shows how to use the system without any external API keys
    /// </summary>
    public class KeyFreeAdIntegration : MonoBehaviour
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
        
        private KeyFreeAdSystem _adSystem;
        
        void Start()
        {
            _adSystem = KeyFreeAdSystem.Instance;
            
            if (_adSystem == null)
            {
                Debug.LogError("KeyFreeAdSystem not found! Make sure it's in the scene.");
                return;
            }
            
            // Subscribe to ad events
            KeyFreeAdSystem.OnAdCompleted += OnAdCompleted;
            KeyFreeAdSystem.OnRevenueGenerated += OnRevenueGenerated;
            KeyFreeAdSystem.OnAdShown += OnAdShown;
            
            Debug.Log("Key-Free Ad Integration initialized - No external keys required!");
        }
        
        void OnDestroy()
        {
            // Unsubscribe from events
            if (KeyFreeAdSystem.OnAdCompleted != null)
            {
                KeyFreeAdSystem.OnAdCompleted -= OnAdCompleted;
                KeyFreeAdSystem.OnRevenueGenerated -= OnRevenueGenerated;
                KeyFreeAdSystem.OnAdShown -= OnAdShown;
            }
        }
        
        // Example: Show ad when level is completed
        public void OnLevelComplete(int level)
        {
            if (!enableAds || !showAdOnLevelComplete) return;
            
            if (enableInterstitialAds && _adSystem.CanShowAd("level_complete"))
            {
                _adSystem.ShowAd("level_complete", (result) =>
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
            
            if (enableRewardedAds && _adSystem.CanShowAd("rewarded_continue"))
            {
                _adSystem.ShowRewardedAd("rewarded_continue", (result) =>
                {
                    if (result.success)
                    {
                        Debug.Log($"Player struggling - Rewarded ad shown, Reward: {result.reward.title}, Revenue: ${result.revenue:F4}");
                        // Give the reward to the player
                        GiveRewardToPlayer(result.reward);
                    }
                });
            }
        }
        
        // Example: Show rewarded ad for boost
        public void OnBoostRequested()
        {
            if (!enableAds || !showAdOnBoostRequest) return;
            
            if (enableRewardedAds && _adSystem.CanShowAd("rewarded_boost"))
            {
                _adSystem.ShowRewardedAd("rewarded_boost", (result) =>
                {
                    if (result.success)
                    {
                        Debug.Log($"Boost requested - Rewarded ad shown, Reward: {result.reward.title}, Revenue: ${result.revenue:F4}");
                        // Give the boost to the player
                        GiveRewardToPlayer(result.reward);
                    }
                });
            }
        }
        
        // Example: Show rewarded ad when energy is empty
        public void OnEnergyEmpty()
        {
            if (!enableAds || !showAdOnEnergyEmpty) return;
            
            if (enableRewardedAds && _adSystem.CanShowAd("rewarded_energy"))
            {
                _adSystem.ShowRewardedAd("rewarded_energy", (result) =>
                {
                    if (result.success)
                    {
                        Debug.Log($"Energy empty - Rewarded ad shown, Reward: {result.reward.title}, Revenue: ${result.revenue:F4}");
                        // Give energy to the player
                        GiveRewardToPlayer(result.reward);
                    }
                });
            }
        }
        
        // Example: Show banner ad
        public void ShowBannerAd()
        {
            if (!enableAds || !enableBannerAds) return;
            
            if (_adSystem.CanShowAd("banner_bottom"))
            {
                _adSystem.ShowAd("banner_bottom", (result) =>
                {
                    if (result.success)
                    {
                        Debug.Log($"Banner ad shown, Revenue: ${result.revenue:F4}");
                    }
                });
            }
        }
        
        private void GiveRewardToPlayer(RewardOffer reward)
        {
            if (reward == null) return;
            
            // Implement your reward system here
            switch (reward.rewardType)
            {
                case "coins":
                    // Add coins to player
                    Debug.Log($"Giving {reward.rewardAmount} coins to player");
                    break;
                case "energy":
                    // Add energy to player
                    Debug.Log($"Giving {reward.rewardAmount} energy to player");
                    break;
                case "boost":
                    // Activate boost
                    Debug.Log($"Activating {reward.rewardAmount}x boost for player");
                    break;
                case "continue":
                    // Allow player to continue
                    Debug.Log("Allowing player to continue");
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
        public void ShowAd(string placement)
        {
            if (_adSystem != null && _adSystem.CanShowAd(placement))
            {
                _adSystem.ShowAd(placement);
            }
        }
        
        public void ShowRewardedAd(string placement)
        {
            if (_adSystem != null && _adSystem.CanShowAd(placement))
            {
                _adSystem.ShowRewardedAd(placement);
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