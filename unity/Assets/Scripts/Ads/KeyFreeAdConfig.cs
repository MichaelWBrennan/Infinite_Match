using UnityEngine;
using System.Collections.Generic;

namespace Evergreen.Ads
{
    /// <summary>
    /// Configuration for Key-Free Ad System
    /// Easy setup without external dependencies
    /// </summary>
    [CreateAssetMenu(fileName = "KeyFreeAdConfig", menuName = "Ads/Key-Free Ad Config")]
    public class KeyFreeAdConfig : ScriptableObject
    {
        [Header("System Settings")]
        public bool enableLocalAds = true;
        public bool enableSimulatedRevenue = true;
        public bool enableRevenueTracking = true;
        
        [Header("Revenue Configuration")]
        [Range(0.01f, 0.10f)]
        public float baseRevenuePerAd = 0.02f;
        [Range(0.1f, 1.0f)]
        public float revenueVariation = 0.5f;
        [Range(0.5f, 3.0f)]
        public float adFrequencyMultiplier = 1.0f;
        
        [Header("Ad Timing")]
        [Range(10f, 300f)]
        public float minAdInterval = 30f;
        [Range(60f, 600f)]
        public float maxAdInterval = 120f;
        
        [Header("Ad Placements")]
        public List<AdPlacementConfig> placements = new List<AdPlacementConfig>();
        
        [Header("Local Ad Content")]
        public List<LocalAdContentConfig> localAdContent = new List<LocalAdContentConfig>();
        
        [Header("Reward Offers")]
        public List<RewardOfferConfig> rewardOffers = new List<RewardOfferConfig>();
        
        [Header("Platform Settings")]
        public PlatformAdSettings mobileSettings;
        public PlatformAdSettings webSettings;
        public PlatformAdSettings desktopSettings;
        
        private void OnValidate()
        {
            // Ensure minimum values
            baseRevenuePerAd = Mathf.Max(0.01f, baseRevenuePerAd);
            revenueVariation = Mathf.Clamp(revenueVariation, 0.1f, 1.0f);
            adFrequencyMultiplier = Mathf.Clamp(adFrequencyMultiplier, 0.5f, 3.0f);
            minAdInterval = Mathf.Max(10f, minAdInterval);
            maxAdInterval = Mathf.Max(minAdInterval + 10f, maxAdInterval);
        }
        
        public void InitializeDefaultConfig()
        {
            // Initialize default placements
            if (placements.Count == 0)
            {
                placements.AddRange(new List<AdPlacementConfig>
                {
                    new AdPlacementConfig
                    {
                        name = "level_complete",
                        displayName = "Level Complete",
                        type = AdType.Interstitial,
                        cooldown = 60f,
                        baseRevenue = 0.03f,
                        priority = 1,
                        enabled = true
                    },
                    new AdPlacementConfig
                    {
                        name = "rewarded_continue",
                        displayName = "Rewarded Continue",
                        type = AdType.Rewarded,
                        cooldown = 0f,
                        baseRevenue = 0.05f,
                        priority = 2,
                        enabled = true
                    },
                    new AdPlacementConfig
                    {
                        name = "rewarded_boost",
                        displayName = "Rewarded Boost",
                        type = AdType.Rewarded,
                        cooldown = 0f,
                        baseRevenue = 0.04f,
                        priority = 3,
                        enabled = true
                    },
                    new AdPlacementConfig
                    {
                        name = "banner_bottom",
                        displayName = "Banner Bottom",
                        type = AdType.Banner,
                        cooldown = 0f,
                        baseRevenue = 0.01f,
                        priority = 4,
                        enabled = true
                    }
                });
            }
            
            // Initialize default local ad content
            if (localAdContent.Count == 0)
            {
                localAdContent.AddRange(new List<LocalAdContentConfig>
                {
                    new LocalAdContentConfig
                    {
                        id = "local_ad_1",
                        title = "Upgrade Your Game!",
                        description = "Get premium features and remove ads",
                        imageUrl = "local://upgrade_ad.png",
                        actionText = "Upgrade Now",
                        revenue = 0.02f,
                        enabled = true
                    },
                    new LocalAdContentConfig
                    {
                        id = "local_ad_2",
                        title = "More Games Available",
                        description = "Check out our other amazing games",
                        imageUrl = "local://cross_promotion.png",
                        actionText = "View Games",
                        revenue = 0.015f,
                        enabled = true
                    },
                    new LocalAdContentConfig
                    {
                        id = "local_ad_3",
                        title = "Special Offer!",
                        description = "Limited time discount on premium items",
                        imageUrl = "local://special_offer.png",
                        actionText = "Claim Offer",
                        revenue = 0.025f,
                        enabled = true
                    }
                });
            }
            
            // Initialize default reward offers
            if (rewardOffers.Count == 0)
            {
                rewardOffers.AddRange(new List<RewardOfferConfig>
                {
                    new RewardOfferConfig
                    {
                        id = "reward_continue",
                        title = "Continue Playing",
                        description = "Watch an ad to continue your game",
                        rewardType = "continue",
                        rewardAmount = 1,
                        revenue = 0.05f,
                        enabled = true
                    },
                    new RewardOfferConfig
                    {
                        id = "reward_coins",
                        title = "Free Coins",
                        description = "Get 100 coins for watching an ad",
                        rewardType = "coins",
                        rewardAmount = 100,
                        revenue = 0.04f,
                        enabled = true
                    },
                    new RewardOfferConfig
                    {
                        id = "reward_energy",
                        title = "Free Energy",
                        description = "Get 5 energy for watching an ad",
                        rewardType = "energy",
                        rewardAmount = 5,
                        revenue = 0.03f,
                        enabled = true
                    },
                    new RewardOfferConfig
                    {
                        id = "reward_boost",
                        title = "Power Boost",
                        description = "Get a 2x score multiplier",
                        rewardType = "boost",
                        rewardAmount = 1,
                        revenue = 0.06f,
                        enabled = true
                    }
                });
            }
            
            // Initialize platform settings
            if (mobileSettings == null)
            {
                mobileSettings = new PlatformAdSettings
                {
                    platformName = "Mobile",
                    adFrequencyMultiplier = 1.2f,
                    baseRevenueMultiplier = 1.1f,
                    minAdInterval = 25f,
                    maxAdInterval = 100f
                };
            }
            
            if (webSettings == null)
            {
                webSettings = new PlatformAdSettings
                {
                    platformName = "Web",
                    adFrequencyMultiplier = 0.8f,
                    baseRevenueMultiplier = 0.9f,
                    minAdInterval = 40f,
                    maxAdInterval = 150f
                };
            }
            
            if (desktopSettings == null)
            {
                desktopSettings = new PlatformAdSettings
                {
                    platformName = "Desktop",
                    adFrequencyMultiplier = 0.6f,
                    baseRevenueMultiplier = 0.8f,
                    minAdInterval = 60f,
                    maxAdInterval = 200f
                };
            }
        }
    }
    
    [System.Serializable]
    public class AdPlacementConfig
    {
        public string name;
        public string displayName;
        public AdType type;
        public float cooldown;
        public float baseRevenue;
        public int priority;
        public bool enabled;
    }
    
    [System.Serializable]
    public class LocalAdContentConfig
    {
        public string id;
        public string title;
        public string description;
        public string imageUrl;
        public string actionText;
        public float revenue;
        public bool enabled;
    }
    
    [System.Serializable]
    public class RewardOfferConfig
    {
        public string id;
        public string title;
        public string description;
        public string rewardType;
        public int rewardAmount;
        public float revenue;
        public bool enabled;
    }
    
    [System.Serializable]
    public class PlatformAdSettings
    {
        public string platformName;
        public float adFrequencyMultiplier;
        public float baseRevenueMultiplier;
        public float minAdInterval;
        public float maxAdInterval;
    }
}