using UnityEngine;
using System.Collections.Generic;
using System.Collections;
using System;

namespace Evergreen.Ads
{
    public class AdvancedAdMediation : MonoBehaviour
    {
        public static AdvancedAdMediation Instance { get; private set; }
        
        [Header("Ad Networks")]
        public List<AdNetworkConfig> networkConfigs = new List<AdNetworkConfig>();
        
        [Header("Mediation Settings")]
        public bool enableWaterfall = true;
        public bool enableAuction = true;
        public float auctionTimeout = 5f;
        public int maxRetries = 3;
        
        [Header("Revenue Optimization")]
        public bool enableRevenueOptimization = true;
        public float minECPM = 0.50f;
        public float maxECPM = 10.00f;
        
        private Dictionary<string, IAdAdapter> _adapters;
        private Dictionary<string, AdNetworkPerformance> _networkPerformance;
        private Dictionary<string, List<string>> _waterfallOrder;
        private Coroutine _optimizationRoutine;
        
        private void Awake()
        {
            if (Instance != null) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            
            InitializeAdapters();
            InitializePerformanceTracking();
            StartOptimization();
        }
        
        private void InitializeAdapters()
        {
            _adapters = new Dictionary<string, IAdAdapter>();
            
            // Initialize MAX adapter
            var maxAdapter = new MaxAdapter();
            _adapters["MAX"] = maxAdapter;
            
            // Initialize LevelPlay adapter
            var levelPlayAdapter = new LevelPlayAdapter();
            _adapters["LevelPlay"] = levelPlayAdapter;
            
            // Initialize Unity Ads adapter
            var unityAdsAdapter = new UnityAdsAdapter();
            _adapters["UnityAds"] = unityAdsAdapter;
            
            // Initialize AdMob adapter
            var adMobAdapter = new AdMobAdapter();
            _adapters["AdMob"] = adMobAdapter;
            
            Debug.Log($"[AdMediation] Initialized {_adapters.Count} ad adapters");
        }
        
        private void InitializePerformanceTracking()
        {
            _networkPerformance = new Dictionary<string, AdNetworkPerformance>();
            _waterfallOrder = new Dictionary<string, List<string>>();
            
            foreach (var network in _adapters.Keys)
            {
                _networkPerformance[network] = new AdNetworkPerformance
                {
                    networkName = network,
                    impressions = 0,
                    revenue = 0f,
                    fillRate = 0f,
                    avgECPM = 0f,
                    loadTime = 0f,
                    lastUpdated = Time.time
                };
            }
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
                yield return new WaitForSeconds(60f); // Optimize every minute
                OptimizeWaterfallOrder();
                UpdateNetworkPerformance();
                AdjustBidPrices();
            }
        }
        
        public void InitializeAllNetworks(Dictionary<string, object> config)
        {
            foreach (var adapter in _adapters.Values)
            {
                try
                {
                    adapter.Initialize(config);
                }
                catch (Exception e)
                {
                    Debug.LogError($"[AdMediation] Failed to initialize adapter: {e.Message}");
                }
            }
        }
        
        public void PreloadAd(string placement, AdType adType)
        {
            var bestNetworks = GetBestNetworksForPlacement(placement, adType);
            
            foreach (var network in bestNetworks)
            {
                if (_adapters.ContainsKey(network))
                {
                    _adapters[network].Preload(placement);
                }
            }
        }
        
        public void ShowAd(string placement, AdType adType, Action onComplete = null)
        {
            if (enableAuction)
            {
                StartCoroutine(ShowAdWithAuction(placement, adType, onComplete));
            }
            else if (enableWaterfall)
            {
                StartCoroutine(ShowAdWithWaterfall(placement, adType, onComplete));
            }
            else
            {
                ShowAdWithBestNetwork(placement, adType, onComplete);
            }
        }
        
        private IEnumerator ShowAdWithAuction(string placement, AdType adType, Action onComplete)
        {
            var availableNetworks = GetAvailableNetworks(placement, adType);
            var auctionResults = new List<AuctionResult>();
            
            // Start auction for all available networks
            foreach (var network in availableNetworks)
            {
                if (_adapters.ContainsKey(network))
                {
                    var adapter = _adapters[network];
                    if (adapter.IsAdLoaded(placement))
                    {
                        var eCPM = GetNetworkECPM(network);
                        var score = CalculateAuctionScore(network, eCPM, placement);
                        
                        auctionResults.Add(new AuctionResult
                        {
                            network = network,
                            eCPM = eCPM,
                            score = score,
                            adapter = adapter
                        });
                    }
                }
            }
            
            // Sort by score (highest first)
            auctionResults.Sort((a, b) => b.score.CompareTo(a.score));
            
            // Show ad from best network
            if (auctionResults.Count > 0)
            {
                var bestResult = auctionResults[0];
                Debug.Log($"[AdMediation] Auction winner: {bestResult.network} (Score: {bestResult.score:F2}, eCPM: ${bestResult.eCPM:F2})");
                
                ShowAdWithAdapter(bestResult.adapter, placement, adType, onComplete);
            }
            else
            {
                Debug.LogWarning($"[AdMediation] No networks available for {placement}");
                onComplete?.Invoke();
            }
            
            yield return null;
        }
        
        private IEnumerator ShowAdWithWaterfall(string placement, AdType adType, Action onComplete)
        {
            var waterfall = GetWaterfallOrder(placement, adType);
            
            foreach (var network in waterfall)
            {
                if (_adapters.ContainsKey(network))
                {
                    var adapter = _adapters[network];
                    if (adapter.IsAdLoaded(placement))
                    {
                        Debug.Log($"[AdMediation] Showing ad via {network} (waterfall)");
                        ShowAdWithAdapter(adapter, placement, adType, onComplete);
                        yield break;
                    }
                }
            }
            
            Debug.LogWarning($"[AdMediation] No networks available in waterfall for {placement}");
            onComplete?.Invoke();
        }
        
        private void ShowAdWithBestNetwork(string placement, AdType adType, Action onComplete)
        {
            var bestNetwork = GetBestNetworkForPlacement(placement, adType);
            
            if (bestNetwork != null && _adapters.ContainsKey(bestNetwork))
            {
                var adapter = _adapters[bestNetwork];
                if (adapter.IsAdLoaded(placement))
                {
                    Debug.Log($"[AdMediation] Showing ad via {bestNetwork} (best network)");
                    ShowAdWithAdapter(adapter, placement, adType, onComplete);
                }
                else
                {
                    Debug.LogWarning($"[AdMediation] Best network {bestNetwork} not loaded for {placement}");
                    onComplete?.Invoke();
                }
            }
            else
            {
                Debug.LogWarning($"[AdMediation] No best network found for {placement}");
                onComplete?.Invoke();
            }
        }
        
        private void ShowAdWithAdapter(IAdAdapter adapter, string placement, AdType adType, Action onComplete)
        {
            if (adType == AdType.Rewarded)
            {
                adapter.ShowRewarded(placement, onComplete);
            }
            else if (adType == AdType.Interstitial)
            {
                adapter.ShowInterstitial(placement);
                onComplete?.Invoke();
            }
            else if (adType == AdType.Banner)
            {
                // Banner ads are typically shown automatically when loaded
                onComplete?.Invoke();
            }
        }
        
        private List<string> GetBestNetworksForPlacement(string placement, AdType adType)
        {
            var networks = new List<string>();
            var availableNetworks = GetAvailableNetworks(placement, adType);
            
            // Sort by performance score
            availableNetworks.Sort((a, b) => 
            {
                var scoreA = CalculateNetworkScore(a, placement);
                var scoreB = CalculateNetworkScore(b, placement);
                return scoreB.CompareTo(scoreA);
            });
            
            // Return top 3 networks
            for (int i = 0; i < Mathf.Min(3, availableNetworks.Count); i++)
            {
                networks.Add(availableNetworks[i]);
            }
            
            return networks;
        }
        
        private string GetBestNetworkForPlacement(string placement, AdType adType)
        {
            var availableNetworks = GetAvailableNetworks(placement, adType);
            
            if (availableNetworks.Count == 0) return null;
            
            string bestNetwork = availableNetworks[0];
            float bestScore = CalculateNetworkScore(bestNetwork, placement);
            
            foreach (var network in availableNetworks)
            {
                var score = CalculateNetworkScore(network, placement);
                if (score > bestScore)
                {
                    bestScore = score;
                    bestNetwork = network;
                }
            }
            
            return bestNetwork;
        }
        
        private List<string> GetAvailableNetworks(string placement, AdType adType)
        {
            var available = new List<string>();
            
            foreach (var network in _adapters.Keys)
            {
                if (_adapters[network].IsAdLoaded(placement))
                {
                    var performance = _networkPerformance[network];
                    if (performance.avgECPM >= minECPM && performance.avgECPM <= maxECPM)
                    {
                        available.Add(network);
                    }
                }
            }
            
            return available;
        }
        
        private List<string> GetWaterfallOrder(string placement, AdType adType)
        {
            if (!_waterfallOrder.ContainsKey(placement))
            {
                _waterfallOrder[placement] = new List<string>();
            }
            
            if (_waterfallOrder[placement].Count == 0)
            {
                // Initialize waterfall order based on performance
                var networks = GetAvailableNetworks(placement, adType);
                networks.Sort((a, b) => 
                {
                    var scoreA = CalculateNetworkScore(a, placement);
                    var scoreB = CalculateNetworkScore(b, placement);
                    return scoreB.CompareTo(scoreA);
                });
                
                _waterfallOrder[placement] = networks;
            }
            
            return _waterfallOrder[placement];
        }
        
        private float CalculateNetworkScore(string network, string placement)
        {
            if (!_networkPerformance.ContainsKey(network)) return 0f;
            
            var performance = _networkPerformance[network];
            var eCPM = performance.avgECPM;
            var fillRate = performance.fillRate;
            var loadTime = performance.loadTime;
            
            // Weighted score: eCPM (40%), fillRate (30%), loadTime (30%)
            var score = (eCPM * 0.4f) + (fillRate * 100f * 0.3f) + ((1f - loadTime) * 100f * 0.3f);
            
            return score;
        }
        
        private float CalculateAuctionScore(string network, float eCPM, string placement)
        {
            var baseScore = CalculateNetworkScore(network, placement);
            var eCPMBonus = eCPM * 0.1f; // Bonus for higher eCPM
            var timeBonus = (1f - Time.time % 1f) * 0.05f; // Slight randomization
            
            return baseScore + eCPMBonus + timeBonus;
        }
        
        private float GetNetworkECPM(string network)
        {
            if (_networkPerformance.ContainsKey(network))
            {
                return _networkPerformance[network].avgECPM;
            }
            return 0f;
        }
        
        private void OptimizeWaterfallOrder()
        {
            foreach (var placement in _waterfallOrder.Keys)
            {
                var networks = _waterfallOrder[placement];
                networks.Sort((a, b) => 
                {
                    var scoreA = CalculateNetworkScore(a, placement);
                    var scoreB = CalculateNetworkScore(b, placement);
                    return scoreB.CompareTo(scoreA);
                });
            }
        }
        
        private void UpdateNetworkPerformance()
        {
            foreach (var network in _networkPerformance.Keys)
            {
                var performance = _networkPerformance[network];
                var impressions = performance.impressions;
                var revenue = performance.revenue;
                
                if (impressions > 0)
                {
                    performance.avgECPM = revenue / impressions * 1000f;
                    performance.fillRate = Mathf.Min(1f, impressions / Mathf.Max(1f, impressions + GetFailedRequests(network)));
                }
                
                performance.lastUpdated = Time.time;
            }
        }
        
        private void AdjustBidPrices()
        {
            // Adjust bid prices based on performance
            foreach (var network in _networkPerformance.Keys)
            {
                var performance = _networkPerformance[network];
                
                if (performance.impressions > 10)
                {
                    var targetECPM = performance.avgECPM * 1.1f; // Increase by 10%
                    performance.avgECPM = Mathf.Clamp(targetECPM, minECPM, maxECPM);
                }
            }
        }
        
        private int GetFailedRequests(string network)
        {
            // This would be tracked in a real implementation
            return 0;
        }
        
        public void LogPerformanceReport()
        {
            Debug.Log("[AdMediation] === PERFORMANCE REPORT ===");
            
            foreach (var performance in _networkPerformance.Values)
            {
                Debug.Log($"[AdMediation] {performance.networkName}: " +
                         $"Impressions: {performance.impressions}, " +
                         $"Revenue: ${performance.revenue:F2}, " +
                         $"eCPM: ${performance.avgECPM:F2}, " +
                         $"Fill Rate: {performance.fillRate:P1}");
            }
        }
    }
    
    [System.Serializable]
    public class AdNetworkConfig
    {
        public string networkName;
        public string appId;
        public string sdkKey;
        public bool isEnabled;
        public float priority;
    }
    
    [System.Serializable]
    public class AdNetworkPerformance
    {
        public string networkName;
        public int impressions;
        public float revenue;
        public float fillRate;
        public float avgECPM;
        public float loadTime;
        public float lastUpdated;
    }
    
    [System.Serializable]
    public class AuctionResult
    {
        public string network;
        public float eCPM;
        public float score;
        public IAdAdapter adapter;
    }
}
