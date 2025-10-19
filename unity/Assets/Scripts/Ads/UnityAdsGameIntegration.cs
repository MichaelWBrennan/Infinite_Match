using UnityEngine;
using System;
using System.Collections;

namespace Evergreen.Ads
{
    /// <summary>
    /// Complete Unity Ads integration for Unity games
    /// Shows how to integrate ads in various game scenarios
    /// </summary>
    public class UnityAdsGameIntegration : MonoBehaviour
    {
        [Header("Game Integration Settings")]
        public bool enableAds = true;
        public bool enableRewardedAds = true;
        public bool enableInterstitialAds = true;
        public bool enableBannerAds = true;
        
        [Header("Ad Triggers")]
        public bool showAdOnLevelComplete = true;
        public bool showAdOnGameOver = true;
        public bool showAdOnPlayerStruggling = true;
        public bool showAdOnBoostRequest = true;
        public bool showAdOnEnergyEmpty = true;
        public bool showAdOnShopOpen = true;
        
        [Header("Ad Timing")]
        public float minAdInterval = 30f;
        public float maxAdInterval = 120f;
        public float adFrequencyMultiplier = 1.0f;
        
        [Header("Game State")]
        public int currentLevel = 1;
        public int playerScore = 0;
        public int playerCoins = 0;
        public int playerEnergy = 5;
        public bool isGameOver = false;
        public bool isPlayerStruggling = false;
        
        private UnityAdsNoKeys _adSystem;
        private float _lastAdTime = 0f;
        private int _adViewCount = 0;
        
        // Events
        public static event Action<AdResult> OnAdCompleted;
        public static event Action<float> OnRevenueGenerated;
        public static event Action<string> OnAdShown;
        
        void Start()
        {
            // Get the ad system
            _adSystem = UnityAdsNoKeys.Instance;
            
            if (_adSystem == null)
            {
                Debug.LogError("[UnityAdsGameIntegration] UnityAdsNoKeys not found! Make sure it's in the scene.");
                return;
            }
            
            // Subscribe to ad events
            UnityAdsNoKeys.OnAdCompleted += OnAdCompletedHandler;
            UnityAdsNoKeys.OnRevenueGenerated += OnRevenueGeneratedHandler;
            UnityAdsNoKeys.OnAdShown += OnAdShownHandler;
            
            // Initialize game state
            InitializeGameState();
            
            Debug.Log("[UnityAdsGameIntegration] Game integration initialized!");
        }
        
        void OnDestroy()
        {
            // Unsubscribe from events
            if (UnityAdsNoKeys.OnAdCompleted != null)
            {
                UnityAdsNoKeys.OnAdCompleted -= OnAdCompletedHandler;
                UnityAdsNoKeys.OnRevenueGenerated -= OnRevenueGeneratedHandler;
                UnityAdsNoKeys.OnAdShown -= OnAdShownHandler;
            }
        }
        
        private void InitializeGameState()
        {
            currentLevel = 1;
            playerScore = 0;
            playerCoins = 100; // Starting coins
            playerEnergy = 5; // Starting energy
            isGameOver = false;
            isPlayerStruggling = false;
        }
        
        // GAME SCENARIOS - These would be called from your game logic
        
        public void OnLevelComplete(int level, int score)
        {
            currentLevel = level;
            playerScore = score;
            
            Debug.Log($"[UnityAdsGameIntegration] Level {level} completed with score {score}");
            
            if (enableAds && showAdOnLevelComplete && CanShowAd())
            {
                ShowInterstitialAd("Level Complete");
            }
        }
        
        public void OnGameOver(int finalScore)
        {
            isGameOver = true;
            playerScore = finalScore;
            
            Debug.Log($"[UnityAdsGameIntegration] Game over with score {finalScore}");
            
            if (enableAds && showAdOnGameOver && CanShowAd())
            {
                ShowInterstitialAd("Game Over");
            }
        }
        
        public void OnPlayerStruggling()
        {
            isPlayerStruggling = true;
            
            Debug.Log("[UnityAdsGameIntegration] Player is struggling");
            
            if (enableAds && showAdOnPlayerStruggling && CanShowAd())
            {
                ShowRewardedAd("Player Struggling", (result) =>
                {
                    if (result.success)
                    {
                        // Give player a boost or hint
                        GivePlayerBoost();
                    }
                });
            }
        }
        
        public void OnBoostRequested()
        {
            Debug.Log("[UnityAdsGameIntegration] Player requested boost");
            
            if (enableAds && showAdOnBoostRequest && CanShowAd())
            {
                ShowRewardedAd("Boost Request", (result) =>
                {
                    if (result.success)
                    {
                        // Give player boost
                        GivePlayerBoost();
                    }
                });
            }
        }
        
        public void OnEnergyEmpty()
        {
            playerEnergy = 0;
            
            Debug.Log("[UnityAdsGameIntegration] Player energy is empty");
            
            if (enableAds && showAdOnEnergyEmpty && CanShowAd())
            {
                ShowRewardedAd("Energy Empty", (result) =>
                {
                    if (result.success)
                    {
                        // Give player energy
                        GivePlayerEnergy(5);
                    }
                });
            }
        }
        
        public void OnShopOpened()
        {
            Debug.Log("[UnityAdsGameIntegration] Shop opened");
            
            if (enableAds && showAdOnShopOpen && CanShowAd())
            {
                ShowBannerAd("Shop Banner");
            }
        }
        
        // AD DISPLAY METHODS
        
        private void ShowInterstitialAd(string context)
        {
            if (!enableInterstitialAds || _adSystem == null) return;
            
            if (_adSystem.CanShowAd("interstitial"))
            {
                _adSystem.ShowInterstitialAd((result) =>
                {
                    if (result.success)
                    {
                        _adViewCount++;
                        _lastAdTime = Time.time;
                        Debug.Log($"[UnityAdsGameIntegration] Interstitial ad shown for {context}, Revenue: ${result.revenue:F4}");
                    }
                });
            }
        }
        
        private void ShowRewardedAd(string context, Action<AdResult> onComplete = null)
        {
            if (!enableRewardedAds || _adSystem == null) return;
            
            if (_adSystem.CanShowAd("rewarded"))
            {
                _adSystem.ShowRewardedAd((result) =>
                {
                    if (result.success)
                    {
                        _adViewCount++;
                        _lastAdTime = Time.time;
                        Debug.Log($"[UnityAdsGameIntegration] Rewarded ad shown for {context}, Revenue: ${result.revenue:F4}");
                    }
                    
                    onComplete?.Invoke(result);
                });
            }
        }
        
        private void ShowBannerAd(string context)
        {
            if (!enableBannerAds || _adSystem == null) return;
            
            if (_adSystem.CanShowAd("banner"))
            {
                _adSystem.ShowBannerAd();
                Debug.Log($"[UnityAdsGameIntegration] Banner ad shown for {context}");
            }
        }
        
        private bool CanShowAd()
        {
            if (!enableAds) return false;
            
            var timeSinceLastAd = Time.time - _lastAdTime;
            var minInterval = minAdInterval * adFrequencyMultiplier;
            
            return timeSinceLastAd >= minInterval;
        }
        
        // REWARD METHODS
        
        private void GivePlayerBoost()
        {
            // Implement your boost system here
            Debug.Log("[UnityAdsGameIntegration] Player received boost!");
        }
        
        private void GivePlayerEnergy(int amount)
        {
            playerEnergy += amount;
            Debug.Log($"[UnityAdsGameIntegration] Player received {amount} energy. Total: {playerEnergy}");
        }
        
        private void GivePlayerCoins(int amount)
        {
            playerCoins += amount;
            Debug.Log($"[UnityAdsGameIntegration] Player received {amount} coins. Total: {playerCoins}");
        }
        
        // EVENT HANDLERS
        
        private void OnAdCompletedHandler(AdResult result)
        {
            OnAdCompleted?.Invoke(result);
        }
        
        private void OnRevenueGeneratedHandler(float revenue)
        {
            OnRevenueGenerated?.Invoke(revenue);
        }
        
        private void OnAdShownHandler(string placement)
        {
            OnAdShown?.Invoke(placement);
        }
        
        // PUBLIC API
        
        public void SetAdFrequencyMultiplier(float multiplier)
        {
            adFrequencyMultiplier = multiplier;
            Debug.Log($"[UnityAdsGameIntegration] Ad frequency multiplier set to {multiplier}");
        }
        
        public void EnableAds(bool enable)
        {
            enableAds = enable;
            Debug.Log($"[UnityAdsGameIntegration] Ads {(enable ? "enabled" : "disabled")}");
        }
        
        public void EnableRewardedAds(bool enable)
        {
            enableRewardedAds = enable;
            Debug.Log($"[UnityAdsGameIntegration] Rewarded ads {(enable ? "enabled" : "disabled")}");
        }
        
        public void EnableInterstitialAds(bool enable)
        {
            enableInterstitialAds = enable;
            Debug.Log($"[UnityAdsGameIntegration] Interstitial ads {(enable ? "enabled" : "disabled")}");
        }
        
        public void EnableBannerAds(bool enable)
        {
            enableBannerAds = enable;
            Debug.Log($"[UnityAdsGameIntegration] Banner ads {(enable ? "enabled" : "disabled")}");
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
        
        public void GenerateRevenueReport()
        {
            if (_adSystem != null)
            {
                _adSystem.LogRevenueReport();
            }
        }
        
        // DEBUG METHODS
        
        [ContextMenu("Test Level Complete")]
        public void TestLevelComplete()
        {
            OnLevelComplete(currentLevel + 1, playerScore + 1000);
        }
        
        [ContextMenu("Test Game Over")]
        public void TestGameOver()
        {
            OnGameOver(playerScore);
        }
        
        [ContextMenu("Test Player Struggling")]
        public void TestPlayerStruggling()
        {
            OnPlayerStruggling();
        }
        
        [ContextMenu("Test Boost Request")]
        public void TestBoostRequest()
        {
            OnBoostRequested();
        }
        
        [ContextMenu("Test Energy Empty")]
        public void TestEnergyEmpty()
        {
            OnEnergyEmpty();
        }
        
        [ContextMenu("Test Shop Open")]
        public void TestShopOpen()
        {
            OnShopOpened();
        }
    }
}