using UnityEngine;
using Evergreen.Core;

namespace Evergreen.Economy
{
    /// <summary>
    /// Example script demonstrating how to use the Unity Economy System
    /// This shows common economy operations and integrations
    /// </summary>
    public class EconomyExample : MonoBehaviour
    {
        [Header("Example Settings")]
        [SerializeField] private string playerId = "player1";
        [SerializeField] private bool enableAutoTesting = false;
        [SerializeField] private float testInterval = 10f;
        
        private EconomyService _economyService;
        private float _lastTestTime;
        
        void Start()
        {
            // Get the economy service
            _economyService = ServiceLocator.Get<EconomyService>();
            if (_economyService == null)
            {
                Debug.LogError("EconomyService not found! Make sure it's registered in GameManager.");
                return;
            }
            
            // Subscribe to economy events
            _economyService.OnCurrencyChanged += OnCurrencyChanged;
            _economyService.OnRewardEarned += OnRewardEarned;
            _economyService.OnRewardClaimed += OnRewardClaimed;
            
            // Run initial example
            RunEconomyExamples();
        }
        
        void Update()
        {
            if (enableAutoTesting && Time.time - _lastTestTime > testInterval)
            {
                RunRandomEconomyTest();
                _lastTestTime = Time.time;
            }
        }
        
        /// <summary>
        /// Run comprehensive economy examples
        /// </summary>
        public void RunEconomyExamples()
        {
            Debug.Log("=== RUNNING ECONOMY EXAMPLES ===");
            
            // Example 1: Basic currency operations
            ExampleBasicCurrencyOperations();
            
            // Example 2: Reward system
            ExampleRewardSystem();
            
            // Example 3: Shop system
            ExampleShopSystem();
            
            // Example 4: Economy analytics
            ExampleEconomyAnalytics();
            
            Debug.Log("=== ECONOMY EXAMPLES COMPLETED ===");
        }
        
        private void ExampleBasicCurrencyOperations()
        {
            Debug.Log("--- Basic Currency Operations ---");
            
            // Add some starting currencies
            _economyService.AddCurrency("coins", 1000, "starting_currency");
            _economyService.AddCurrency("gems", 50, "starting_currency");
            _economyService.AddCurrency("energy", 5, "starting_currency");
            
            // Display current balances
            Debug.Log($"Coins: {_economyService.GetCurrency("coins")}");
            Debug.Log($"Gems: {_economyService.GetCurrency("gems")}");
            Debug.Log($"Energy: {_economyService.GetCurrency("energy")}");
            
            // Spend some currency
            bool spent = _economyService.SpendCurrency("coins", 100, "test_purchase");
            Debug.Log($"Spent 100 coins: {spent}");
            
            // Check if can afford something
            bool canAfford = _economyService.CanAfford("gems", 25);
            Debug.Log($"Can afford 25 gems: {canAfford}");
        }
        
        private void ExampleRewardSystem()
        {
            Debug.Log("--- Reward System ---");
            
            // Award level completion reward
            _economyService.AwardLevelCompletion(playerId, 1, 1500, true, true);
            
            // Award streak reward
            _economyService.AwardStreakReward(playerId, 5);
            
            // Award currency reward
            _economyService.AwardCurrency(playerId, "coins", 500, "example_reward");
            
            // Check daily reward availability
            bool canClaimDaily = _economyService.CanClaimDailyReward(playerId);
            Debug.Log($"Can claim daily reward: {canClaimDaily}");
            
            if (canClaimDaily)
            {
                bool claimed = _economyService.ClaimDailyReward(playerId);
                Debug.Log($"Daily reward claimed: {claimed}");
            }
            
            // Get player rewards
            var rewards = _economyService.GetPlayerRewards(playerId, true);
            Debug.Log($"Player has {rewards.Count} unclaimed rewards");
        }
        
        private void ExampleShopSystem()
        {
            Debug.Log("--- Shop System ---");
            
            // Get available shop items
            var shopSystem = ServiceLocator.Get<ShopSystem>();
            if (shopSystem != null)
            {
                var items = shopSystem.GetAvailableItems(playerId);
                Debug.Log($"Available shop items: {items.Count}");
                
                // Try to purchase an item
                if (items.Count > 0)
                {
                    var firstItem = items[0];
                    Debug.Log($"Attempting to purchase: {firstItem.name}");
                    
                    bool purchased = shopSystem.PurchaseItem(firstItem.id, playerId);
                    Debug.Log($"Purchase successful: {purchased}");
                }
            }
        }
        
        private void ExampleEconomyAnalytics()
        {
            Debug.Log("--- Economy Analytics ---");
            
            // Track some economy events
            var analytics = ServiceLocator.Get<EconomyAnalytics>();
            if (analytics != null)
            {
                // Track a purchase event
                analytics.TrackEvent("item_purchased", new System.Collections.Generic.Dictionary<string, object>
                {
                    {"playerId", playerId},
                    {"itemId", "coins_small"},
                    {"value", 10f},
                    {"currency", "gems"},
                    {"category", "currency"}
                });
                
                // Track a reward event
                analytics.TrackEvent("reward_earned", new System.Collections.Generic.Dictionary<string, object>
                {
                    {"playerId", playerId},
                    {"rewardId", "level_complete_basic"},
                    {"value", 100f},
                    {"source", "level_complete"}
                });
                
                // Get economy report
                string report = analytics.GetReport();
                Debug.Log("Economy Report:\n" + report);
            }
        }
        
        private void RunRandomEconomyTest()
        {
            int testType = Random.Range(0, 4);
            
            switch (testType)
            {
                case 0:
                    // Random currency award
                    string[] currencies = {"coins", "gems", "energy"};
                    string currency = currencies[Random.Range(0, currencies.Length)];
                    int amount = Random.Range(10, 100);
                    _economyService.AddCurrency(currency, amount, "random_test");
                    Debug.Log($"Random test: Added {amount} {currency}");
                    break;
                    
                case 1:
                    // Random level completion
                    int level = Random.Range(1, 10);
                    int score = Random.Range(1000, 3000);
                    bool isPerfect = Random.Range(0f, 1f) < 0.3f;
                    _economyService.AwardLevelCompletion(playerId, level, score, isPerfect, false);
                    Debug.Log($"Random test: Level {level} completed with score {score}");
                    break;
                    
                case 2:
                    // Random streak
                    int streak = Random.Range(3, 8);
                    _economyService.AwardStreakReward(playerId, streak);
                    Debug.Log($"Random test: Streak of {streak}");
                    break;
                    
                case 3:
                    // Random shop purchase attempt
                    var shopSystem = ServiceLocator.Get<ShopSystem>();
                    if (shopSystem != null)
                    {
                        var items = shopSystem.GetAvailableItems(playerId);
                        if (items.Count > 0)
                        {
                            var randomItem = items[Random.Range(0, items.Count)];
                            bool purchased = shopSystem.PurchaseItem(randomItem.id, playerId);
                            Debug.Log($"Random test: Tried to purchase {randomItem.name} - Success: {purchased}");
                        }
                    }
                    break;
            }
        }
        
        private void OnCurrencyChanged(string currencyId, int oldAmount, int newAmount)
        {
            Debug.Log($"Currency changed: {currencyId} {oldAmount} -> {newAmount}");
        }
        
        private void OnRewardEarned(RewardInstance reward)
        {
            Debug.Log($"Reward earned: {reward.template.name}");
        }
        
        private void OnRewardClaimed(RewardInstance reward)
        {
            Debug.Log($"Reward claimed: {reward.template.name}");
        }
        
        void OnDestroy()
        {
            // Unsubscribe from events
            if (_economyService != null)
            {
                _economyService.OnCurrencyChanged -= OnCurrencyChanged;
                _economyService.OnRewardEarned -= OnRewardEarned;
                _economyService.OnRewardClaimed -= OnRewardClaimed;
            }
        }
        
        // Public methods for UI buttons
        [ContextMenu("Add 100 Coins")]
        public void AddCoins()
        {
            _economyService?.AddCurrency("coins", 100, "manual_test");
        }
        
        [ContextMenu("Add 10 Gems")]
        public void AddGems()
        {
            _economyService?.AddCurrency("gems", 10, "manual_test");
        }
        
        [ContextMenu("Spend 50 Coins")]
        public void SpendCoins()
        {
            _economyService?.SpendCurrency("coins", 50, "manual_test");
        }
        
        [ContextMenu("Award Level Reward")]
        public void AwardLevelReward()
        {
            _economyService?.AwardLevelCompletion(playerId, Random.Range(1, 10), Random.Range(1000, 3000), false, false);
        }
        
        [ContextMenu("Show Economy Report")]
        public void ShowEconomyReport()
        {
            var analytics = ServiceLocator.Get<EconomyAnalytics>();
            if (analytics != null)
            {
                string report = analytics.GetReport();
                Debug.Log("Economy Report:\n" + report);
            }
        }
    }
}