using System;
using System.Collections.Generic;
using UnityEngine;
using Evergreen.Core;
using Evergreen.Game;

namespace Evergreen.Economy
{
    /// <summary>
    /// Central economy service that coordinates all economy-related systems
    /// Integrates with existing GameManager and provides unified economy interface
    /// </summary>
    public class EconomyService : MonoBehaviour
    {
        [Header("Economy Configuration")]
        [SerializeField] private bool enableAdvancedEconomy = true;
        [SerializeField] private bool enableRewardSystem = true;
        [SerializeField] private bool enableShopSystem = true;
        [SerializeField] private bool enableAnalytics = true;
        
        [Header("Currency Settings")]
        [SerializeField] private CurrencyData[] currencies;
        [SerializeField] private bool syncWithGameManager = true;
        
        private CurrencyManager _currencyManager;
        private RewardSystem _rewardSystem;
        private ShopSystem _shopSystem;
        private EconomyAnalytics _economyAnalytics;
        private GameManager _gameManager;
        
        // Events
        public System.Action<string, int, int> OnCurrencyChanged; // currencyId, oldAmount, newAmount
        public System.Action<string, int, string> OnCurrencySpent; // currencyId, amount, reason
        public System.Action<string, int, string> OnCurrencyEarned; // currencyId, amount, source
        public System.Action<RewardInstance> OnRewardEarned;
        public System.Action<RewardInstance> OnRewardClaimed;
        
        public static EconomyService Instance { get; private set; }
        
        [System.Serializable]
        public class CurrencyData
        {
            public string id;
            public string name;
            public string symbol;
            public bool isPrimary;
            public bool isHardCurrency;
            public int startingAmount;
            public int maxAmount = int.MaxValue;
            public int minAmount = 0;
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeEconomyService();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            SetupEconomySystems();
            SyncWithGameManager();
        }
        
        private void InitializeEconomyService()
        {
            Debug.Log("Economy Service initialized");
            
            // Get reference to GameManager
            _gameManager = GameManager.Instance;
            if (_gameManager == null)
            {
                Debug.LogError("GameManager not found! EconomyService requires GameManager to be initialized first.");
                return;
            }
        }
        
        private void SetupEconomySystems()
        {
            // Initialize Currency Manager
            if (enableAdvancedEconomy)
            {
                _currencyManager = GetComponent<CurrencyManager>();
                if (_currencyManager == null)
                {
                    _currencyManager = gameObject.AddComponent<CurrencyManager>();
                }
                
                // Subscribe to currency events
                _currencyManager.OnCurrencyChanged += OnCurrencyManagerChanged;
                _currencyManager.OnCurrencySpent += OnCurrencyManagerSpent;
                _currencyManager.OnCurrencyEarned += OnCurrencyManagerEarned;
            }
            
            // Initialize Reward System
            if (enableRewardSystem)
            {
                _rewardSystem = GetComponent<RewardSystem>();
                if (_rewardSystem == null)
                {
                    _rewardSystem = gameObject.AddComponent<RewardSystem>();
                }
                
                // Subscribe to reward events
                _rewardSystem.OnRewardEarned += OnRewardSystemEarned;
                _rewardSystem.OnRewardClaimed += OnRewardSystemClaimed;
            }
            
            // Initialize Shop System
            if (enableShopSystem)
            {
                _shopSystem = GetComponent<ShopSystem>();
                if (_shopSystem == null)
                {
                    _shopSystem = gameObject.AddComponent<ShopSystem>();
                }
            }
            
            // Initialize Economy Analytics
            if (enableAnalytics)
            {
                _economyAnalytics = GetComponent<EconomyAnalytics>();
                if (_economyAnalytics == null)
                {
                    _economyAnalytics = gameObject.AddComponent<EconomyAnalytics>();
                }
            }
        }
        
        private void SyncWithGameManager()
        {
            if (!syncWithGameManager || _gameManager == null) return;
            
            // Sync currencies with GameManager
            if (_currencyManager != null)
            {
                // Get currencies from GameManager and sync with CurrencyManager
                int coins = _gameManager.GetCurrency("coins");
                int gems = _gameManager.GetCurrency("gems");
                
                _currencyManager.SetCurrency("coins", coins);
                _currencyManager.SetCurrency("gems", gems);
                
                Debug.Log($"Synced currencies with GameManager: Coins={coins}, Gems={gems}");
            }
        }
        
        #region Currency Management
        
        /// <summary>
        /// Get currency amount (unified interface)
        /// </summary>
        public int GetCurrency(string currencyId)
        {
            if (enableAdvancedEconomy && _currencyManager != null)
            {
                return _currencyManager.GetCurrency(currencyId);
            }
            else if (_gameManager != null)
            {
                return _gameManager.GetCurrency(currencyId);
            }
            
            return 0;
        }
        
        /// <summary>
        /// Add currency (unified interface)
        /// </summary>
        public bool AddCurrency(string currencyId, int amount, string source = "unknown")
        {
            bool success = false;
            
            if (enableAdvancedEconomy && _currencyManager != null)
            {
                success = _currencyManager.AddCurrency(currencyId, amount, source);
            }
            else if (_gameManager != null)
            {
                _gameManager.AddCurrency(currencyId, amount);
                success = true;
            }
            
            // Sync with GameManager if using advanced economy
            if (success && enableAdvancedEconomy && syncWithGameManager && _gameManager != null)
            {
                SyncCurrencyToGameManager(currencyId);
            }
            
            return success;
        }
        
        /// <summary>
        /// Spend currency (unified interface)
        /// </summary>
        public bool SpendCurrency(string currencyId, int amount, string reason = "unknown")
        {
            bool success = false;
            
            if (enableAdvancedEconomy && _currencyManager != null)
            {
                success = _currencyManager.SpendCurrency(currencyId, amount, reason);
            }
            else if (_gameManager != null)
            {
                success = _gameManager.SpendCurrency(currencyId, amount);
            }
            
            // Sync with GameManager if using advanced economy
            if (success && enableAdvancedEconomy && syncWithGameManager && _gameManager != null)
            {
                SyncCurrencyToGameManager(currencyId);
            }
            
            return success;
        }
        
        /// <summary>
        /// Set currency amount (unified interface)
        /// </summary>
        public void SetCurrency(string currencyId, int amount)
        {
            if (enableAdvancedEconomy && _currencyManager != null)
            {
                _currencyManager.SetCurrency(currencyId, amount);
            }
            else if (_gameManager != null)
            {
                _gameManager.SetCurrency(currencyId, amount);
            }
            
            // Sync with GameManager if using advanced economy
            if (enableAdvancedEconomy && syncWithGameManager && _gameManager != null)
            {
                SyncCurrencyToGameManager(currencyId);
            }
        }
        
        /// <summary>
        /// Check if player can afford something
        /// </summary>
        public bool CanAfford(string currencyId, int amount)
        {
            if (enableAdvancedEconomy && _currencyManager != null)
            {
                return _currencyManager.CanAfford(currencyId, amount);
            }
            else if (_gameManager != null)
            {
                return _gameManager.GetCurrency(currencyId) >= amount;
            }
            
            return false;
        }
        
        private void SyncCurrencyToGameManager(string currencyId)
        {
            if (_gameManager == null || _currencyManager == null) return;
            
            int amount = _currencyManager.GetCurrency(currencyId);
            _gameManager.SetCurrency(currencyId, amount);
        }
        
        #endregion
        
        #region Reward System
        
        /// <summary>
        /// Earn a reward
        /// </summary>
        public RewardInstance EarnReward(string playerId, string rewardId, string source = "unknown", string reason = "unknown")
        {
            if (_rewardSystem != null)
            {
                return _rewardSystem.EarnReward(playerId, rewardId, source, reason);
            }
            
            return null;
        }
        
        /// <summary>
        /// Claim a reward
        /// </summary>
        public bool ClaimReward(string rewardId)
        {
            if (_rewardSystem != null)
            {
                return _rewardSystem.ClaimReward(rewardId);
            }
            
            return false;
        }
        
        /// <summary>
        /// Get player rewards
        /// </summary>
        public List<RewardInstance> GetPlayerRewards(string playerId, bool unclaimedOnly = false)
        {
            if (_rewardSystem != null)
            {
                return _rewardSystem.GetPlayerRewards(playerId, unclaimedOnly);
            }
            
            return new List<RewardInstance>();
        }
        
        /// <summary>
        /// Update achievement progress
        /// </summary>
        public void UpdateAchievement(string playerId, string achievementId, int value)
        {
            if (_rewardSystem != null)
            {
                _rewardSystem.UpdateAchievement(playerId, achievementId, value);
            }
        }
        
        /// <summary>
        /// Claim daily reward
        /// </summary>
        public bool ClaimDailyReward(string playerId)
        {
            if (_rewardSystem != null)
            {
                return _rewardSystem.ClaimDailyReward(playerId);
            }
            
            return false;
        }
        
        /// <summary>
        /// Check if daily reward is available
        /// </summary>
        public bool CanClaimDailyReward(string playerId)
        {
            if (_rewardSystem != null)
            {
                return _rewardSystem.CanClaimDailyReward(playerId);
            }
            
            return false;
        }
        
        #endregion
        
        #region Shop System
        
        /// <summary>
        /// Purchase item from shop
        /// </summary>
        public bool PurchaseItem(string itemId, string playerId)
        {
            if (_shopSystem != null)
            {
                return _shopSystem.PurchaseItem(itemId, playerId);
            }
            
            return false;
        }
        
        /// <summary>
        /// Get available shop items
        /// </summary>
        public List<ShopItem> GetAvailableItems(string playerId)
        {
            if (_shopSystem != null)
            {
                return _shopSystem.GetAvailableItems(playerId);
            }
            
            return new List<ShopItem>();
        }
        
        #endregion
        
        #region Economy Analytics
        
        /// <summary>
        /// Track economy event
        /// </summary>
        public void TrackEconomyEvent(string eventName, Dictionary<string, object> parameters)
        {
            if (_economyAnalytics != null)
            {
                _economyAnalytics.TrackEvent(eventName, parameters);
            }
        }
        
        /// <summary>
        /// Get economy report
        /// </summary>
        public string GetEconomyReport()
        {
            if (_economyAnalytics != null)
            {
                return _economyAnalytics.GetReport();
            }
            
            return "Economy analytics not available";
        }
        
        #endregion
        
        #region Event Handlers
        
        private void OnCurrencyManagerChanged(string currencyId, int oldAmount, int newAmount)
        {
            OnCurrencyChanged?.Invoke(currencyId, oldAmount, newAmount);
        }
        
        private void OnCurrencyManagerSpent(string currencyId, int amount, string reason)
        {
            OnCurrencySpent?.Invoke(currencyId, amount, reason);
        }
        
        private void OnCurrencyManagerEarned(string currencyId, int amount, string source)
        {
            OnCurrencyEarned?.Invoke(currencyId, amount, source);
        }
        
        private void OnRewardSystemEarned(RewardInstance reward)
        {
            OnRewardEarned?.Invoke(reward);
        }
        
        private void OnRewardSystemClaimed(RewardInstance reward)
        {
            OnRewardClaimed?.Invoke(reward);
        }
        
        #endregion
        
        #region Public API for Game Systems
        
        /// <summary>
        /// Award level completion reward
        /// </summary>
        public void AwardLevelCompletion(string playerId, int level, int score, bool isPerfect = false, bool isFirstTime = false)
        {
            if (_rewardSystem == null) return;
            
            // Award basic level completion reward
            EarnReward(playerId, "level_complete_basic", "level_complete", $"level_{level}");
            
            // Award perfect score reward if applicable
            if (isPerfect)
            {
                EarnReward(playerId, "level_complete_perfect", "level_complete", $"level_{level}_perfect");
            }
            
            // Award first time reward if applicable
            if (isFirstTime)
            {
                EarnReward(playerId, "first_time_level", "level_complete", $"level_{level}_first");
            }
            
            // Update achievements
            UpdateAchievement(playerId, "first_level", 1);
            UpdateAchievement(playerId, "level_master", 1);
            
            // Track economy event
            TrackEconomyEvent("level_completed", new Dictionary<string, object>
            {
                {"level", level},
                {"score", score},
                {"is_perfect", isPerfect},
                {"is_first_time", isFirstTime}
            });
        }
        
        /// <summary>
        /// Award streak reward
        /// </summary>
        public void AwardStreakReward(string playerId, int streak)
        {
            if (_rewardSystem == null) return;
            
            // Award streak rewards based on milestone
            if (streak == 5)
            {
                EarnReward(playerId, "streak_5", "streak", $"streak_{streak}");
            }
            else if (streak == 10)
            {
                EarnReward(playerId, "streak_10", "streak", $"streak_{streak}");
            }
            
            // Update streak achievement
            UpdateAchievement(playerId, "streak_master", streak);
            
            // Track economy event
            TrackEconomyEvent("streak_achieved", new Dictionary<string, object>
            {
                {"streak", streak}
            });
        }
        
        /// <summary>
        /// Award currency reward
        /// </summary>
        public void AwardCurrency(string playerId, string currencyId, int amount, string source = "unknown")
        {
            AddCurrency(currencyId, amount, source);
            
            // Update currency achievement
            if (currencyId == "coins")
            {
                UpdateAchievement(playerId, "coin_collector", amount);
            }
            
            // Track economy event
            TrackEconomyEvent("currency_awarded", new Dictionary<string, object>
            {
                {"currency", currencyId},
                {"amount", amount},
                {"source", source}
            });
        }
        
        #endregion
        
        #region Service Management
        
        /// <summary>
        /// Enable/disable advanced economy features
        /// </summary>
        public void SetAdvancedEconomyEnabled(bool enabled)
        {
            enableAdvancedEconomy = enabled;
            
            if (enabled && _currencyManager == null)
            {
                SetupEconomySystems();
            }
        }
        
        /// <summary>
        /// Get economy service status
        /// </summary>
        public Dictionary<string, bool> GetServiceStatus()
        {
            return new Dictionary<string, bool>
            {
                {"AdvancedEconomy", enableAdvancedEconomy && _currencyManager != null},
                {"RewardSystem", enableRewardSystem && _rewardSystem != null},
                {"ShopSystem", enableShopSystem && _shopSystem != null},
                {"Analytics", enableAnalytics && _economyAnalytics != null},
                {"GameManagerSync", syncWithGameManager && _gameManager != null}
            };
        }
        
        #endregion
        
        void OnDestroy()
        {
            // Unsubscribe from events
            if (_currencyManager != null)
            {
                _currencyManager.OnCurrencyChanged -= OnCurrencyManagerChanged;
                _currencyManager.OnCurrencySpent -= OnCurrencyManagerSpent;
                _currencyManager.OnCurrencyEarned -= OnCurrencyManagerEarned;
            }
            
            if (_rewardSystem != null)
            {
                _rewardSystem.OnRewardEarned -= OnRewardSystemEarned;
                _rewardSystem.OnRewardClaimed -= OnRewardSystemClaimed;
            }
        }
    }
}