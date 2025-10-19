using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System;

namespace Evergreen.Ads
{
    /// <summary>
    /// Key-Free Ad System - No external API keys required
    /// Uses local ad serving and simulated revenue generation
    /// </summary>
    public class KeyFreeAdSystem : MonoBehaviour
    {
        public static KeyFreeAdSystem Instance { get; private set; }
        
        [Header("Ad Configuration")]
        public bool enableLocalAds = true;
        public bool enableSimulatedRevenue = true;
        public float baseRevenuePerAd = 0.02f; // $0.02 per ad
        public float revenueVariation = 0.5f; // ±50% variation
        
        [Header("Ad Frequency")]
        public float minAdInterval = 30f;
        public float maxAdInterval = 120f;
        public float adFrequencyMultiplier = 1.0f;
        
        [Header("Local Ad Content")]
        public List<LocalAdContent> localAds = new List<LocalAdContent>();
        public List<RewardOffer> rewardOffers = new List<RewardOffer>();
        
        [Header("Revenue Tracking")]
        public float totalRevenue = 0f;
        public int totalAdViews = 0;
        public float avgRevenuePerAd = 0f;
        
        private Dictionary<string, AdPlacement> _placements;
        private Dictionary<string, float> _lastAdTime;
        private Coroutine _adServingCoroutine;
        
        // Events
        public static event Action<AdResult> OnAdCompleted;
        public static event Action<float> OnRevenueGenerated;
        public static event Action<string> OnAdShown;
        
        private void Awake()
        {
            if (Instance != null) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            
            InitializeAdSystem();
        }
        
        private void Start()
        {
            if (enableLocalAds)
            {
                StartAdServing();
            }
        }
        
        private void InitializeAdSystem()
        {
            _placements = new Dictionary<string, AdPlacement>();
            _lastAdTime = new Dictionary<string, float>();
            
            // Initialize default placements
            InitializeDefaultPlacements();
            InitializeLocalAdContent();
            InitializeRewardOffers();
            
            Debug.Log("[KeyFreeAdSystem] Initialized - No external keys required!");
        }
        
        private void InitializeDefaultPlacements()
        {
            _placements["level_complete"] = new AdPlacement
            {
                name = "Level Complete",
                type = AdType.Interstitial,
                cooldown = 60f,
                baseRevenue = 0.03f,
                priority = 1
            };
            
            _placements["rewarded_continue"] = new AdPlacement
            {
                name = "Rewarded Continue",
                type = AdType.Rewarded,
                cooldown = 0f,
                baseRevenue = 0.05f,
                priority = 2
            };
            
            _placements["rewarded_boost"] = new AdPlacement
            {
                name = "Rewarded Boost",
                type = AdType.Rewarded,
                cooldown = 0f,
                baseRevenue = 0.04f,
                priority = 3
            };
            
            _placements["banner_bottom"] = new AdPlacement
            {
                name = "Banner Bottom",
                type = AdType.Banner,
                cooldown = 0f,
                baseRevenue = 0.01f,
                priority = 4
            };
        }
        
        private void InitializeLocalAdContent()
        {
            if (localAds.Count == 0)
            {
                localAds.AddRange(new List<LocalAdContent>
                {
                    new LocalAdContent
                    {
                        id = "local_ad_1",
                        title = "Upgrade Your Game!",
                        description = "Get premium features and remove ads",
                        imageUrl = "local://upgrade_ad.png",
                        actionText = "Upgrade Now",
                        revenue = 0.02f
                    },
                    new LocalAdContent
                    {
                        id = "local_ad_2",
                        title = "More Games Available",
                        description = "Check out our other amazing games",
                        imageUrl = "local://cross_promotion.png",
                        actionText = "View Games",
                        revenue = 0.015f
                    },
                    new LocalAdContent
                    {
                        id = "local_ad_3",
                        title = "Special Offer!",
                        description = "Limited time discount on premium items",
                        imageUrl = "local://special_offer.png",
                        actionText = "Claim Offer",
                        revenue = 0.025f
                    }
                });
            }
        }
        
        private void InitializeRewardOffers()
        {
            if (rewardOffers.Count == 0)
            {
                rewardOffers.AddRange(new List<RewardOffer>
                {
                    new RewardOffer
                    {
                        id = "reward_continue",
                        title = "Continue Playing",
                        description = "Watch an ad to continue your game",
                        rewardType = "continue",
                        rewardAmount = 1,
                        revenue = 0.05f
                    },
                    new RewardOffer
                    {
                        id = "reward_coins",
                        title = "Free Coins",
                        description = "Get 100 coins for watching an ad",
                        rewardType = "coins",
                        rewardAmount = 100,
                        revenue = 0.04f
                    },
                    new RewardOffer
                    {
                        id = "reward_energy",
                        title = "Free Energy",
                        description = "Get 5 energy for watching an ad",
                        rewardType = "energy",
                        rewardAmount = 5,
                        revenue = 0.03f
                    },
                    new RewardOffer
                    {
                        id = "reward_boost",
                        title = "Power Boost",
                        description = "Get a 2x score multiplier",
                        rewardType = "boost",
                        rewardAmount = 1,
                        revenue = 0.06f
                    }
                });
            }
        }
        
        private void StartAdServing()
        {
            if (_adServingCoroutine != null) StopCoroutine(_adServingCoroutine);
            _adServingCoroutine = StartCoroutine(AdServingRoutine());
        }
        
        private IEnumerator AdServingRoutine()
        {
            while (enableLocalAds)
            {
                yield return new WaitForSeconds(UnityEngine.Random.Range(minAdInterval, maxAdInterval));
                
                // Serve random local ad
                ServeRandomLocalAd();
            }
        }
        
        public bool CanShowAd(string placement)
        {
            if (!_placements.ContainsKey(placement)) return false;
            
            var adPlacement = _placements[placement];
            var lastTime = _lastAdTime.ContainsKey(placement) ? _lastAdTime[placement] : 0f;
            var timeSinceLastAd = Time.time - lastTime;
            
            return timeSinceLastAd >= adPlacement.cooldown;
        }
        
        public void ShowAd(string placement, Action<AdResult> onComplete = null)
        {
            if (!CanShowAd(placement))
            {
                onComplete?.Invoke(new AdResult { success = false, message = "Ad not ready" });
                return;
            }
            
            StartCoroutine(ShowAdCoroutine(placement, onComplete));
        }
        
        public void ShowRewardedAd(string placement, Action<AdResult> onComplete = null)
        {
            if (!CanShowAd(placement))
            {
                onComplete?.Invoke(new AdResult { success = false, message = "Ad not ready" });
                return;
            }
            
            StartCoroutine(ShowRewardedAdCoroutine(placement, onComplete));
        }
        
        private IEnumerator ShowAdCoroutine(string placement, Action<AdResult> onComplete)
        {
            var adPlacement = _placements[placement];
            var adContent = GetRandomAdContent();
            
            // Simulate ad load time
            yield return new WaitForSeconds(0.5f);
            
            // Show ad UI (you would implement this)
            ShowAdUI(adContent);
            OnAdShown?.Invoke(placement);
            
            // Simulate ad display time
            yield return new WaitForSeconds(2f);
            
            // Calculate revenue
            var revenue = CalculateRevenue(adPlacement, adContent);
            totalRevenue += revenue;
            totalAdViews++;
            avgRevenuePerAd = totalRevenue / totalAdViews;
            
            // Update tracking
            _lastAdTime[placement] = Time.time;
            
            // Notify listeners
            OnRevenueGenerated?.Invoke(revenue);
            OnAdCompleted?.Invoke(new AdResult 
            { 
                success = true, 
                revenue = revenue,
                message = "Ad completed successfully"
            });
            
            onComplete?.Invoke(new AdResult 
            { 
                success = true, 
                revenue = revenue,
                message = "Ad completed successfully"
            });
            
            Debug.Log($"[KeyFreeAdSystem] Ad shown: {placement}, Revenue: ${revenue:F4}, Total: ${totalRevenue:F2}");
        }
        
        private IEnumerator ShowRewardedAdCoroutine(string placement, Action<AdResult> onComplete)
        {
            var adPlacement = _placements[placement];
            var rewardOffer = GetRandomRewardOffer();
            
            // Simulate ad load time
            yield return new WaitForSeconds(0.5f);
            
            // Show rewarded ad UI
            ShowRewardedAdUI(rewardOffer);
            OnAdShown?.Invoke(placement);
            
            // Simulate ad display time
            yield return new WaitForSeconds(3f);
            
            // Calculate revenue
            var revenue = CalculateRevenue(adPlacement, rewardOffer);
            totalRevenue += revenue;
            totalAdViews++;
            avgRevenuePerAd = totalRevenue / totalAdViews;
            
            // Give reward
            GiveReward(rewardOffer);
            
            // Update tracking
            _lastAdTime[placement] = Time.time;
            
            // Notify listeners
            OnRevenueGenerated?.Invoke(revenue);
            OnAdCompleted?.Invoke(new AdResult 
            { 
                success = true, 
                revenue = revenue,
                reward = rewardOffer,
                message = "Rewarded ad completed successfully"
            });
            
            onComplete?.Invoke(new AdResult 
            { 
                success = true, 
                revenue = revenue,
                reward = rewardOffer,
                message = "Rewarded ad completed successfully"
            });
            
            Debug.Log($"[KeyFreeAdSystem] Rewarded ad shown: {placement}, Reward: {rewardOffer.title}, Revenue: ${revenue:F4}");
        }
        
        private LocalAdContent GetRandomAdContent()
        {
            if (localAds.Count == 0) return null;
            return localAds[UnityEngine.Random.Range(0, localAds.Count)];
        }
        
        private RewardOffer GetRandomRewardOffer()
        {
            if (rewardOffers.Count == 0) return null;
            return rewardOffers[UnityEngine.Random.Range(0, rewardOffers.Count)];
        }
        
        private float CalculateRevenue(AdPlacement placement, LocalAdContent content)
        {
            var baseRevenue = content != null ? content.revenue : placement.baseRevenue;
            var variation = UnityEngine.Random.Range(1f - revenueVariation, 1f + revenueVariation);
            return baseRevenue * variation * adFrequencyMultiplier;
        }
        
        private float CalculateRevenue(AdPlacement placement, RewardOffer offer)
        {
            var baseRevenue = offer != null ? offer.revenue : placement.baseRevenue;
            var variation = UnityEngine.Random.Range(1f - revenueVariation, 1f + revenueVariation);
            return baseRevenue * variation * adFrequencyMultiplier;
        }
        
        private void ShowAdUI(LocalAdContent content)
        {
            // Implement your ad UI here
            Debug.Log($"[KeyFreeAdSystem] Showing ad: {content.title} - {content.description}");
        }
        
        private void ShowRewardedAdUI(RewardOffer offer)
        {
            // Implement your rewarded ad UI here
            Debug.Log($"[KeyFreeAdSystem] Showing rewarded ad: {offer.title} - {offer.description}");
        }
        
        private void GiveReward(RewardOffer offer)
        {
            // Implement reward giving logic here
            Debug.Log($"[KeyFreeAdSystem] Giving reward: {offer.rewardAmount} {offer.rewardType}");
            
            // Example reward implementation
            switch (offer.rewardType)
            {
                case "coins":
                    // Add coins to player
                    break;
                case "energy":
                    // Add energy to player
                    break;
                case "boost":
                    // Activate boost
                    break;
                case "continue":
                    // Allow player to continue
                    break;
            }
        }
        
        private void ServeRandomLocalAd()
        {
            if (localAds.Count == 0) return;
            
            var adContent = GetRandomAdContent();
            var revenue = adContent.revenue * adFrequencyMultiplier;
            
            totalRevenue += revenue;
            totalAdViews++;
            avgRevenuePerAd = totalRevenue / totalAdViews;
            
            OnRevenueGenerated?.Invoke(revenue);
            Debug.Log($"[KeyFreeAdSystem] Served local ad: {adContent.title}, Revenue: ${revenue:F4}");
        }
        
        public void LogRevenueReport()
        {
            Debug.Log("[KeyFreeAdSystem] === REVENUE REPORT ===");
            Debug.Log($"Total Revenue: ${totalRevenue:F2}");
            Debug.Log($"Total Ad Views: {totalAdViews}");
            Debug.Log($"Average Revenue Per Ad: ${avgRevenuePerAd:F4}");
            Debug.Log($"Ad Frequency Multiplier: {adFrequencyMultiplier:F2}");
        }
        
        // Public API for external systems
        public float GetTotalRevenue() => totalRevenue;
        public int GetTotalAdViews() => totalAdViews;
        public float GetAverageRevenuePerAd() => avgRevenuePerAd;
        public void SetAdFrequencyMultiplier(float multiplier) => adFrequencyMultiplier = multiplier;
    }
    
    [System.Serializable]
    public class LocalAdContent
    {
        public string id;
        public string title;
        public string description;
        public string imageUrl;
        public string actionText;
        public float revenue;
    }
    
    [System.Serializable]
    public class RewardOffer
    {
        public string id;
        public string title;
        public string description;
        public string rewardType;
        public int rewardAmount;
        public float revenue;
    }
    
    [System.Serializable]
    public class AdPlacement
    {
        public string name;
        public AdType type;
        public float cooldown;
        public float baseRevenue;
        public int priority;
    }
    
    [System.Serializable]
    public class AdResult
    {
        public bool success;
        public string message;
        public float revenue;
        public RewardOffer reward;
    }
    
    public enum AdType
    {
        Banner,
        Interstitial,
        Rewarded
    }
}