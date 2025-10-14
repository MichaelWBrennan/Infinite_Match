using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections.Generic;
using Evergreen.ARPU;

namespace Evergreen.Examples
{
    /// <summary>
    /// Complete ARPU Example - Comprehensive example showing all ARPU features
    /// This demonstrates how to use all ARPU systems in a real game scenario
    /// </summary>
    public class CompleteARPUExample : MonoBehaviour
    {
        [Header("Example Settings")]
        public string playerId = "player_123";
        public bool enableExamples = true;
        public bool showDebugLogs = true;
        public float exampleInterval = 5f;
        
        [Header("UI References")]
        public TextMeshProUGUI statusText;
        public TextMeshProUGUI energyText;
        public TextMeshProUGUI subscriptionText;
        public TextMeshProUGUI offersText;
        public TextMeshProUGUI socialText;
        public TextMeshProUGUI analyticsText;
        public Button playLevelButton;
        public Button energyButton;
        public Button subscriptionButton;
        public Button offersButton;
        public Button socialButton;
        public Button analyticsButton;
        
        private CompleteARPUManager _arpuManager;
        private CompleteARPUInitializer _initializer;
        private CompleteARPUIntegration _integration;
        private float _exampleTimer;
        private int _exampleStep = 0;
        
        void Start()
        {
            if (enableExamples)
            {
                InitializeARPUExample();
                SetupUI();
                StartCoroutine(RunARPUExamples());
            }
        }
        
        void Update()
        {
            if (enableExamples)
            {
                UpdateUI();
            }
        }
        
        private void InitializeARPUExample()
        {
            // Initialize ARPU systems
            _initializer = FindObjectOfType<CompleteARPUInitializer>();
            if (_initializer == null)
            {
                var initializerGO = new GameObject("CompleteARPUInitializer");
                _initializer = initializerGO.AddComponent<CompleteARPUInitializer>();
            }
            
            _initializer.InitializeCompleteARPU();
            _arpuManager = _initializer.GetARPUManager();
            
            // Initialize integration
            _integration = FindObjectOfType<CompleteARPUIntegration>();
            if (_integration == null)
            {
                var integrationGO = new GameObject("CompleteARPUIntegration");
                _integration = integrationGO.AddComponent<CompleteARPUIntegration>();
            }
            
            _integration.IntegrateARPUSystems();
            
            if (showDebugLogs)
                Debug.Log("[CompleteARPUExample] ARPU systems initialized and integrated");
        }
        
        private void SetupUI()
        {
            // Setup button listeners
            if (playLevelButton != null)
                playLevelButton.onClick.AddListener(OnPlayLevelClicked);
            if (energyButton != null)
                energyButton.onClick.AddListener(OnEnergyButtonClicked);
            if (subscriptionButton != null)
                subscriptionButton.onClick.AddListener(OnSubscriptionButtonClicked);
            if (offersButton != null)
                offersButton.onClick.AddListener(OnOffersButtonClicked);
            if (socialButton != null)
                socialButton.onClick.AddListener(OnSocialButtonClicked);
            if (analyticsButton != null)
                analyticsButton.onClick.AddListener(OnAnalyticsButtonClicked);
        }
        
        private System.Collections.IEnumerator RunARPUExamples()
        {
            yield return new WaitForSeconds(2f); // Wait for initialization
            
            while (true)
            {
                yield return new WaitForSeconds(exampleInterval);
                
                switch (_exampleStep)
                {
                    case 0:
                        ExampleEnergySystem();
                        break;
                    case 1:
                        ExampleSubscriptionSystem();
                        break;
                    case 2:
                        ExamplePersonalizedOffers();
                        break;
                    case 3:
                        ExampleSocialFeatures();
                        break;
                    case 4:
                        ExampleAnalytics();
                        break;
                    case 5:
                        ExampleRetentionSystem();
                        break;
                    case 6:
                        ExampleCompleteIntegration();
                        break;
                }
                
                _exampleStep = (_exampleStep + 1) % 7;
            }
        }
        
        private void ExampleEnergySystem()
        {
            if (_arpuManager == null) return;
            
            var currentEnergy = _arpuManager.GetCurrentEnergy(playerId);
            var maxEnergy = _arpuManager.GetMaxEnergy(playerId);
            var canPlay = _arpuManager.CanPlayLevel(playerId);
            
            if (showDebugLogs)
                Debug.Log($"[CompleteARPUExample] Energy System - Current: {currentEnergy}/{maxEnergy}, Can Play: {canPlay}");
            
            if (!canPlay)
            {
                if (showDebugLogs)
                    Debug.Log("[CompleteARPUExample] Player needs energy! Showing energy purchase options...");
            }
        }
        
        private void ExampleSubscriptionSystem()
        {
            if (_arpuManager == null) return;
            
            var hasSubscription = _arpuManager.HasActiveSubscription(playerId);
            var coinMultiplier = _arpuManager.GetSubscriptionMultiplier(playerId, "coins_multiplier");
            var gemMultiplier = _arpuManager.GetSubscriptionMultiplier(playerId, "gems_multiplier");
            
            if (showDebugLogs)
                Debug.Log($"[CompleteARPUExample] Subscription System - Active: {hasSubscription}, Coin Multiplier: {coinMultiplier:F2}x, Gem Multiplier: {gemMultiplier:F2}x");
            
            if (!hasSubscription)
            {
                if (showDebugLogs)
                    Debug.Log("[CompleteARPUExample] Player has no subscription. Showing subscription options...");
            }
        }
        
        private void ExamplePersonalizedOffers()
        {
            if (_arpuManager == null) return;
            
            var offers = _arpuManager.GetPersonalizedOffers(playerId);
            
            if (showDebugLogs)
                Debug.Log($"[CompleteARPUExample] Personalized Offers - Found {offers.Count} offers for player");
            
            foreach (var offer in offers)
            {
                if (showDebugLogs)
                    Debug.Log($"[CompleteARPUExample] Offer: {offer.name} - ${offer.personalizedPrice:F2} (was ${offer.originalPrice:F2}) - {offer.discount:P0} off");
            }
        }
        
        private void ExampleSocialFeatures()
        {
            if (_arpuManager == null) return;
            
            var leaderboard = _arpuManager.GetLeaderboard("weekly_score", 5);
            
            if (showDebugLogs)
                Debug.Log($"[CompleteARPUExample] Social Features - Weekly Leaderboard:");
            
            for (int i = 0; i < leaderboard.Count; i++)
            {
                var entry = leaderboard[i];
                if (showDebugLogs)
                    Debug.Log($"[CompleteARPUExample] {i + 1}. {entry.playerName} - {entry.score:N0} points");
            }
        }
        
        private void ExampleAnalytics()
        {
            if (_arpuManager == null) return;
            
            var report = _arpuManager.GetARPUReport();
            
            if (showDebugLogs)
                Debug.Log($"[CompleteARPUExample] Analytics - ARPU Report:");
            
            foreach (var kvp in report)
            {
                if (showDebugLogs)
                    Debug.Log($"[CompleteARPUExample] {kvp.Key}: {kvp.Value}");
            }
        }
        
        private void ExampleRetentionSystem()
        {
            if (_arpuManager == null) return;
            
            var profile = _arpuManager.GetPlayerProfile(playerId);
            
            if (showDebugLogs)
                Debug.Log($"[CompleteARPUExample] Retention System - Player Profile:");
            if (showDebugLogs)
                Debug.Log($"[CompleteARPUExample] Total Spent: ${profile.totalSpent:F2}");
            if (showDebugLogs)
                Debug.Log($"[CompleteARPUExample] Levels Completed: {profile.levelsCompleted}");
            if (showDebugLogs)
                Debug.Log($"[CompleteARPUExample] Segment: {profile.segment}");
            if (showDebugLogs)
                Debug.Log($"[CompleteARPUExample] Predicted LTV: ${profile.predictedLTV:F2}");
        }
        
        private void ExampleCompleteIntegration()
        {
            if (_arpuManager == null) return;
            
            var systemStatus = _arpuManager.GetSystemStatus();
            
            if (showDebugLogs)
                Debug.Log($"[CompleteARPUExample] Complete Integration - System Status:");
            
            foreach (var kvp in systemStatus)
            {
                if (showDebugLogs)
                    Debug.Log($"[CompleteARPUExample] {kvp.Key}: {kvp.Value}");
            }
        }
        
        private void UpdateUI()
        {
            if (_arpuManager == null) return;
            
            // Update status text
            if (statusText != null)
            {
                var systemStatus = _arpuManager.GetSystemStatus();
                var activeSystems = 0;
                foreach (var status in systemStatus.Values)
                {
                    if (status is bool isActive && isActive)
                        activeSystems++;
                }
                statusText.text = $"ARPU Systems: {activeSystems} active";
            }
            
            // Update energy text
            if (energyText != null)
            {
                var currentEnergy = _arpuManager.GetCurrentEnergy(playerId);
                var maxEnergy = _arpuManager.GetMaxEnergy(playerId);
                energyText.text = $"Energy: {currentEnergy}/{maxEnergy}";
            }
            
            // Update subscription text
            if (subscriptionText != null)
            {
                var hasSubscription = _arpuManager.HasActiveSubscription(playerId);
                subscriptionText.text = hasSubscription ? "Active Subscription" : "No Subscription";
            }
            
            // Update offers text
            if (offersText != null)
            {
                var offers = _arpuManager.GetPersonalizedOffers(playerId);
                offersText.text = $"Offers: {offers.Count} available";
            }
            
            // Update social text
            if (socialText != null)
            {
                var leaderboard = _arpuManager.GetLeaderboard("weekly_score", 1);
                socialText.text = leaderboard.Count > 0 ? $"Leader: {leaderboard[0].playerName}" : "No Leaderboard";
            }
            
            // Update analytics text
            if (analyticsText != null)
            {
                var report = _arpuManager.GetARPUReport();
                var arpu = report.ContainsKey("arpu") ? (float)report["arpu"] : 0f;
                analyticsText.text = $"ARPU: ${arpu:F2}";
            }
        }
        
        // Button Event Handlers
        
        private void OnPlayLevelClicked()
        {
            if (_arpuManager == null) return;
            
            if (_arpuManager.CanPlayLevel(playerId))
            {
                _arpuManager.TryConsumeEnergy(playerId, 1);
                _arpuManager.TrackPlayerAction(playerId, "level_start", new Dictionary<string, object>
                {
                    ["source"] = "ui_button",
                    ["timestamp"] = System.DateTime.Now.ToString()
                });
                
                if (showDebugLogs)
                    Debug.Log("[CompleteARPUExample] Level started! Energy consumed.");
            }
            else
            {
                if (showDebugLogs)
                    Debug.Log("[CompleteARPUExample] Not enough energy to play level!");
            }
        }
        
        private void OnEnergyButtonClicked()
        {
            if (_arpuManager == null) return;
            
            var currentEnergy = _arpuManager.GetCurrentEnergy(playerId);
            var maxEnergy = _arpuManager.GetMaxEnergy(playerId);
            
            if (currentEnergy < maxEnergy)
            {
                if (showDebugLogs)
                    Debug.Log("[CompleteARPUExample] Showing energy refill options...");
            }
            else
            {
                if (showDebugLogs)
                    Debug.Log("[CompleteARPUExample] Energy is full!");
            }
        }
        
        private void OnSubscriptionButtonClicked()
        {
            if (_arpuManager == null) return;
            
            var hasSubscription = _arpuManager.HasActiveSubscription(playerId);
            
            if (hasSubscription)
            {
                if (showDebugLogs)
                    Debug.Log("[CompleteARPUExample] Showing subscription management...");
            }
            else
            {
                if (showDebugLogs)
                    Debug.Log("[CompleteARPUExample] Showing subscription tiers...");
            }
        }
        
        private void OnOffersButtonClicked()
        {
            if (_arpuManager == null) return;
            
            var offers = _arpuManager.GetPersonalizedOffers(playerId);
            
            if (showDebugLogs)
                Debug.Log($"[CompleteARPUExample] Showing {offers.Count} personalized offers...");
        }
        
        private void OnSocialButtonClicked()
        {
            if (_arpuManager == null) return;
            
            var leaderboard = _arpuManager.GetLeaderboard("weekly_score", 10);
            
            if (showDebugLogs)
                Debug.Log($"[CompleteARPUExample] Showing leaderboard with {leaderboard.Count} entries...");
        }
        
        private void OnAnalyticsButtonClicked()
        {
            if (_arpuManager == null) return;
            
            var report = _arpuManager.GetARPUReport();
            
            if (showDebugLogs)
                Debug.Log($"[CompleteARPUExample] Showing analytics report with {report.Count} metrics...");
        }
        
        // Public Methods for External Use
        
        public void SimulatePurchase(string itemId, float amount)
        {
            if (_arpuManager == null) return;
            
            _arpuManager.TrackRevenue(playerId, amount, RevenueSource.IAP, itemId);
            
            if (showDebugLogs)
                Debug.Log($"[CompleteARPUExample] Simulated purchase: {itemId} for ${amount:F2}");
        }
        
        public void SimulateLevelComplete(int levelId, int score)
        {
            if (_arpuManager == null) return;
            
            _arpuManager.TrackPlayerAction(playerId, "level_complete", new Dictionary<string, object>
            {
                ["level_id"] = levelId,
                ["score"] = score,
                ["timestamp"] = System.DateTime.Now.ToString()
            });
            
            if (showDebugLogs)
                Debug.Log($"[CompleteARPUExample] Simulated level complete: Level {levelId} with score {score}");
        }
        
        public void SimulateSubscriptionPurchase(string tierId)
        {
            if (_arpuManager == null) return;
            
            var tierPrices = new Dictionary<string, float>
            {
                ["basic"] = 4.99f,
                ["premium"] = 9.99f,
                ["ultimate"] = 19.99f
            };
            
            if (tierPrices.ContainsKey(tierId))
            {
                _arpuManager.TrackRevenue(playerId, tierPrices[tierId], RevenueSource.Subscription, tierId);
                
                if (showDebugLogs)
                    Debug.Log($"[CompleteARPUExample] Simulated subscription purchase: {tierId} for ${tierPrices[tierId]:F2}");
            }
        }
        
        public Dictionary<string, object> GetARPUReport()
        {
            if (_arpuManager == null) return new Dictionary<string, object>();
            return _arpuManager.GetARPUReport();
        }
        
        public Dictionary<string, object> GetSystemStatus()
        {
            if (_arpuManager == null) return new Dictionary<string, object>();
            return _arpuManager.GetSystemStatus();
        }
    }
}