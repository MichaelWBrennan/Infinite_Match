using UnityEngine;
using System.Collections.Generic;
using System.Collections;
using System;

namespace Evergreen.Ads
{
    public class AdRevenueOptimizer : MonoBehaviour
    {
        public static AdRevenueOptimizer Instance { get; private set; }
        
        [Header("Revenue Optimization")]
        public float minAdInterval = 30f;
        public float maxAdFrequency = 0.1f; // Max 10% of sessions
        public bool enableSmartTiming = true;
        public bool enableUserSegmentation = true;
        
        [Header("Performance Tracking")]
        public float totalRevenue = 0f;
        public int totalImpressions = 0;
        public float avgRevenuePerUser = 0f;
        public float adFillRate = 0f;
        
        private Dictionary<string, AdPlacement> _placements;
        private Dictionary<string, UserSegment> _userSegments;
        private List<AdNetwork> _networks;
        private Coroutine _optimizationRoutine;
        
        private void Awake()
        {
            if (Instance != null) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            
            InitializePlacements();
            InitializeUserSegments();
            InitializeNetworks();
            StartOptimization();
        }
        
        private void InitializePlacements()
        {
            _placements = new Dictionary<string, AdPlacement>
            {
                ["level_complete"] = new AdPlacement
                {
                    name = "Level Complete",
                    type = AdType.Interstitial,
                    priority = 1,
                    minLevel = 3,
                    cooldown = 60f,
                    expectedRevenue = 0.15f
                },
                ["rewarded_continue"] = new AdPlacement
                {
                    name = "Rewarded Continue",
                    type = AdType.Rewarded,
                    priority = 2,
                    minLevel = 1,
                    cooldown = 0f,
                    expectedRevenue = 0.25f
                },
                ["rewarded_boost"] = new AdPlacement
                {
                    name = "Rewarded Boost",
                    type = AdType.Rewarded,
                    priority = 3,
                    minLevel = 5,
                    cooldown = 0f,
                    expectedRevenue = 0.20f
                },
                ["banner_bottom"] = new AdPlacement
                {
                    name = "Banner Bottom",
                    type = AdType.Banner,
                    priority = 4,
                    minLevel = 1,
                    cooldown = 0f,
                    expectedRevenue = 0.05f
                }
            };
        }
        
        private void InitializeUserSegments()
        {
            _userSegments = new Dictionary<string, UserSegment>
            {
                ["whale"] = new UserSegment
                {
                    name = "Whale",
                    minSpend = 50f,
                    adFrequency = 0.05f,
                    preferredTypes = new[] { AdType.Rewarded, AdType.Interstitial }
                },
                ["dolphin"] = new UserSegment
                {
                    name = "Dolphin",
                    minSpend = 10f,
                    adFrequency = 0.08f,
                    preferredTypes = new[] { AdType.Rewarded, AdType.Banner }
                },
                ["minnow"] = new UserSegment
                {
                    name = "Minnow",
                    minSpend = 0f,
                    adFrequency = 0.12f,
                    preferredTypes = new[] { AdType.Banner, AdType.Interstitial }
                }
            };
        }
        
        private void InitializeNetworks()
        {
            _networks = new List<AdNetwork>
            {
                new AdNetwork { name = "MAX", priority = 1, fillRate = 0.95f, eCPM = 2.50f },
                new AdNetwork { name = "LevelPlay", priority = 2, fillRate = 0.90f, eCPM = 2.20f },
                new AdNetwork { name = "Unity Ads", priority = 3, fillRate = 0.85f, eCPM = 1.80f },
                new AdNetwork { name = "AdMob", priority = 4, fillRate = 0.88f, eCPM = 1.60f }
            };
        }
        
        private void StartOptimization()
        {
            if (_optimizationRoutine != null) StopCoroutine(_optimizationRoutine);
            _optimizationRoutine = StartCoroutine(OptimizationRoutine());
        }
        
        private IEnumerator OptimizationRoutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(30f);
                OptimizeAdPlacement();
                UpdateRevenueMetrics();
                AdjustAdFrequency();
            }
        }
        
        public bool ShouldShowAd(string placement, int playerLevel, float playerSpend)
        {
            if (!_placements.ContainsKey(placement)) return false;
            
            var adPlacement = _placements[placement];
            var userSegment = GetUserSegment(playerSpend);
            
            // Check level requirement
            if (playerLevel < adPlacement.minLevel) return false;
            
            // Check cooldown
            if (Time.time - adPlacement.lastShown < adPlacement.cooldown) return false;
            
            // Check frequency limits
            if (GetAdFrequency() > userSegment.adFrequency) return false;
            
            // Smart timing check
            if (enableSmartTiming && !IsOptimalTiming(placement)) return false;
            
            return true;
        }
        
        public void ShowAd(string placement, Action onComplete = null)
        {
            if (!ShouldShowAd(placement, GetPlayerLevel(), GetPlayerSpend()))
            {
                onComplete?.Invoke();
                return;
            }
            
            var adPlacement = _placements[placement];
            var bestNetwork = GetBestNetwork(adPlacement.type);
            
            if (bestNetwork != null)
            {
                ShowAdWithNetwork(placement, bestNetwork, onComplete);
            }
            else
            {
                Debug.LogWarning($"[AdRevenue] No network available for {placement}");
                onComplete?.Invoke();
            }
        }
        
        private void ShowAdWithNetwork(string placement, AdNetwork network, Action onComplete)
        {
            Debug.Log($"[AdRevenue] Showing {placement} via {network.name} (eCPM: ${network.eCPM:F2})");
            
            // Simulate ad display and revenue
            StartCoroutine(SimulateAdDisplay(placement, network, onComplete));
        }
        
        private IEnumerator SimulateAdDisplay(string placement, AdNetwork network, Action onComplete)
        {
            // Simulate ad load time
            yield return new WaitForSeconds(0.5f);
            
            // Simulate ad display
            yield return new WaitForSeconds(2f);
            
            // Calculate revenue
            var revenue = network.eCPM / 1000f; // Convert eCPM to revenue per impression
            totalRevenue += revenue;
            totalImpressions++;
            
            // Update placement data
            _placements[placement].lastShown = Time.time;
            _placements[placement].impressions++;
            _placements[placement].revenue += revenue;
            
            // Update network data
            network.impressions++;
            network.revenue += revenue;
            
            Debug.Log($"[AdRevenue] Ad completed. Revenue: ${revenue:F4}, Total: ${totalRevenue:F2}");
            
            onComplete?.Invoke();
        }
        
        private AdNetwork GetBestNetwork(AdType type)
        {
            AdNetwork best = null;
            float bestScore = 0f;
            
            foreach (var network in _networks)
            {
                if (network.fillRate < 0.8f) continue; // Skip low fill rate networks
                
                var score = network.eCPM * network.fillRate * (1f - network.loadTime);
                if (score > bestScore)
                {
                    bestScore = score;
                    best = network;
                }
            }
            
            return best;
        }
        
        private UserSegment GetUserSegment(float playerSpend)
        {
            if (playerSpend >= 50f) return _userSegments["whale"];
            if (playerSpend >= 10f) return _userSegments["dolphin"];
            return _userSegments["minnow"];
        }
        
        private bool IsOptimalTiming(string placement)
        {
            // Check if this is a good time to show ads based on user behavior
            var timeSinceLastAd = Time.time - GetLastAdTime();
            var timeSinceLastLevel = Time.time - GetLastLevelTime();
            
            // Don't show ads too frequently
            if (timeSinceLastAd < minAdInterval) return false;
            
            // Show ads after level completion (good engagement moment)
            if (placement.Contains("level_complete") && timeSinceLastLevel < 5f) return true;
            
            // Show rewarded ads when player is struggling
            if (placement.Contains("rewarded") && GetPlayerStruggling()) return true;
            
            return true;
        }
        
        private void OptimizeAdPlacement()
        {
            // Adjust ad frequency based on performance
            foreach (var placement in _placements.Values)
            {
                if (placement.impressions > 10)
                {
                    var revenuePerImpression = placement.revenue / placement.impressions;
                    if (revenuePerImpression < placement.expectedRevenue * 0.8f)
                    {
                        // Reduce frequency for low-performing placements
                        placement.cooldown = Mathf.Min(placement.cooldown * 1.2f, 300f);
                    }
                    else if (revenuePerImpression > placement.expectedRevenue * 1.2f)
                    {
                        // Increase frequency for high-performing placements
                        placement.cooldown = Mathf.Max(placement.cooldown * 0.9f, 30f);
                    }
                }
            }
        }
        
        private void UpdateRevenueMetrics()
        {
            avgRevenuePerUser = totalRevenue / Mathf.Max(1f, GetTotalUsers());
            adFillRate = (float)totalImpressions / Mathf.Max(1f, GetTotalAdRequests());
        }
        
        private void AdjustAdFrequency()
        {
            // Dynamically adjust ad frequency based on user engagement
            var engagement = GetUserEngagement();
            if (engagement > 0.8f)
            {
                maxAdFrequency = Mathf.Min(maxAdFrequency * 1.1f, 0.15f);
            }
            else if (engagement < 0.5f)
            {
                maxAdFrequency = Mathf.Max(maxAdFrequency * 0.9f, 0.05f);
            }
        }
        
        // Helper methods (implement based on your game's data)
        private int GetPlayerLevel() => PlayerPrefs.GetInt("PlayerLevel", 1);
        private float GetPlayerSpend() => PlayerPrefs.GetFloat("PlayerSpend", 0f);
        private float GetLastAdTime() => PlayerPrefs.GetFloat("LastAdTime", 0f);
        private float GetLastLevelTime() => PlayerPrefs.GetFloat("LastLevelTime", 0f);
        private bool GetPlayerStruggling() => PlayerPrefs.GetInt("PlayerStruggling", 0) == 1;
        private float GetAdFrequency() => PlayerPrefs.GetFloat("AdFrequency", 0f);
        private int GetTotalUsers() => PlayerPrefs.GetInt("TotalUsers", 1);
        private int GetTotalAdRequests() => PlayerPrefs.GetInt("TotalAdRequests", 1);
        private float GetUserEngagement() => PlayerPrefs.GetFloat("UserEngagement", 0.7f);
        
        public void LogRevenueReport()
        {
            Debug.Log($"[AdRevenue] === REVENUE REPORT ===");
            Debug.Log($"Total Revenue: ${totalRevenue:F2}");
            Debug.Log($"Total Impressions: {totalImpressions}");
            Debug.Log($"Avg Revenue Per User: ${avgRevenuePerUser:F4}");
            Debug.Log($"Ad Fill Rate: {adFillRate:P1}");
            Debug.Log($"Current Ad Frequency: {maxAdFrequency:P1}");
        }
    }
    
    [System.Serializable]
    public class AdPlacement
    {
        public string name;
        public AdType type;
        public int priority;
        public int minLevel;
        public float cooldown;
        public float expectedRevenue;
        public float lastShown;
        public int impressions;
        public float revenue;
    }
    
    [System.Serializable]
    public class UserSegment
    {
        public string name;
        public float minSpend;
        public float adFrequency;
        public AdType[] preferredTypes;
    }
    
    [System.Serializable]
    public class AdNetwork
    {
        public string name;
        public int priority;
        public float fillRate;
        public float eCPM;
        public float loadTime;
        public int impressions;
        public float revenue;
    }
    
    public enum AdType
    {
        Banner,
        Interstitial,
        Rewarded
    }
}
