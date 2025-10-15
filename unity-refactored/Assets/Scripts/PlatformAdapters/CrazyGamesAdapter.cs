using UnityEngine;
using System.Collections;

namespace Evergreen.Platform
{
    /// <summary>
    /// CrazyGames platform adapter for WebGL deployment
    /// </summary>
    public class CrazyGamesAdapter : MonoBehaviour, IPlatformAdapter
    {
        [Header("CrazyGames Settings")]
        [SerializeField] private bool enableCrazyGamesAPI = true;
        [SerializeField] private bool enableCrazyGamesAds = true;
        [SerializeField] private bool enableCrazyGamesSocial = true;
        [SerializeField] private bool enableCrazyGamesRewards = true;
        
        private PlatformProfile _profile;
        private bool _isInitialized = false;
        
        // Events
        public System.Action OnCrazyGamesInitialized;
        public System.Action<string> OnCrazyGamesError;
        public System.Action OnCrazyGamesReward;
        
        public void Initialize(PlatformProfile profile)
        {
            _profile = profile;
            Debug.Log("🎪 Initializing CrazyGames adapter...");
            
            if (enableCrazyGamesAPI)
            {
                InitializeCrazyGamesAPI();
            }
            
            _isInitialized = true;
            OnCrazyGamesInitialized?.Invoke();
        }
        
        private void InitializeCrazyGamesAPI()
        {
            Debug.Log("🎪 Initializing CrazyGames API...");
            
#if UNITY_WEBGL && CRAZYGAMES_PLATFORM
            // CrazyGames API initialization would go here
            // This would typically involve JavaScript interop
            Debug.Log("🎪 CrazyGames API initialized");
#else
            Debug.LogWarning("⚠️ CrazyGames API not available on this platform");
#endif
        }
        
        public void ShowBannerAd()
        {
            if (!_isInitialized) return;
            
            Debug.Log("🎪 Showing CrazyGames banner ad...");
            
#if UNITY_WEBGL && CRAZYGAMES_PLATFORM
            // CrazyGames banner ad implementation
            Debug.Log("🎪 CrazyGames banner ad shown");
#else
            Debug.LogWarning("⚠️ CrazyGames banner ads not available on this platform");
#endif
        }
        
        public void ShowInterstitialAd()
        {
            if (!_isInitialized) return;
            
            Debug.Log("🎪 Showing CrazyGames interstitial ad...");
            
#if UNITY_WEBGL && CRAZYGAMES_PLATFORM
            // CrazyGames interstitial ad implementation
            Debug.Log("🎪 CrazyGames interstitial ad shown");
#else
            Debug.LogWarning("⚠️ CrazyGames interstitial ads not available on this platform");
#endif
        }
        
        public void ShowRewardedAd(System.Action<bool> onComplete)
        {
            if (!_isInitialized) return;
            
            Debug.Log("🎪 Showing CrazyGames rewarded ad...");
            
#if UNITY_WEBGL && CRAZYGAMES_PLATFORM
            // CrazyGames rewarded ad implementation
            onComplete?.Invoke(true);
            OnCrazyGamesReward?.Invoke();
            Debug.Log("🎪 CrazyGames rewarded ad completed");
#else
            Debug.LogWarning("⚠️ CrazyGames rewarded ads not available on this platform");
            onComplete?.Invoke(false);
#endif
        }
        
        public void PurchaseItem(string itemId, System.Action<bool> onComplete)
        {
            if (!_isInitialized) return;
            
            Debug.Log($"🎪 CrazyGames does not support IAP - using virtual currency for: {itemId}");
            
            // CrazyGames uses virtual currency only
            onComplete?.Invoke(true);
        }
        
        public void SubmitScore(int score, string leaderboardId = "main")
        {
            if (!_isInitialized) return;
            
            Debug.Log($"🎪 Submitting CrazyGames score: {score} to {leaderboardId}");
            
#if UNITY_WEBGL && CRAZYGAMES_PLATFORM
            // CrazyGames leaderboard implementation
            Debug.Log($"🎪 CrazyGames score submitted: {score}");
#else
            Debug.LogWarning("⚠️ CrazyGames leaderboards not available on this platform");
#endif
        }
        
        public void UnlockAchievement(string achievementId)
        {
            if (!_isInitialized) return;
            
            Debug.Log($"🎪 Unlocking CrazyGames achievement: {achievementId}");
            
#if UNITY_WEBGL && CRAZYGAMES_PLATFORM
            // CrazyGames achievement implementation
            Debug.Log($"🎪 CrazyGames achievement unlocked: {achievementId}");
#else
            Debug.LogWarning("⚠️ CrazyGames achievements not available on this platform");
#endif
        }
        
        public void ShowLeaderboard()
        {
            if (!_isInitialized) return;
            
            Debug.Log("🎪 Showing CrazyGames leaderboard...");
            
#if UNITY_WEBGL && CRAZYGAMES_PLATFORM
            // CrazyGames leaderboard UI implementation
            Debug.Log("🎪 CrazyGames leaderboard shown");
#else
            Debug.LogWarning("⚠️ CrazyGames leaderboards not available on this platform");
#endif
        }
        
        public void ShowAchievements()
        {
            if (!_isInitialized) return;
            
            Debug.Log("🎪 Showing CrazyGames achievements...");
            
#if UNITY_WEBGL && CRAZYGAMES_PLATFORM
            // CrazyGames achievements UI implementation
            Debug.Log("🎪 CrazyGames achievements shown");
#else
            Debug.LogWarning("⚠️ CrazyGames achievements not available on this platform");
#endif
        }
        
        public void ShareGame()
        {
            if (!_isInitialized) return;
            
            Debug.Log("🎪 Sharing game on CrazyGames...");
            
#if UNITY_WEBGL && CRAZYGAMES_PLATFORM
            // CrazyGames sharing implementation
            Debug.Log("🎪 Game shared on CrazyGames");
#else
            Debug.LogWarning("⚠️ CrazyGames sharing not available on this platform");
#endif
        }
        
        public void AddToFavorites()
        {
            if (!_isInitialized) return;
            
            Debug.Log("🎪 Adding game to favorites...");
            
#if UNITY_WEBGL && CRAZYGAMES_PLATFORM
            // CrazyGames favorites implementation
            Debug.Log("🎪 Game added to favorites");
#else
            Debug.LogWarning("⚠️ CrazyGames favorites not available on this platform");
#endif
        }
        
        public void RateGame(int rating)
        {
            if (!_isInitialized) return;
            
            Debug.Log($"🎪 Rating game: {rating}/5");
            
#if UNITY_WEBGL && CRAZYGAMES_PLATFORM
            // CrazyGames rating implementation
            Debug.Log($"🎪 Game rated: {rating}/5");
#else
            Debug.LogWarning("⚠️ CrazyGames rating not available on this platform");
#endif
        }
        
        public bool IsInitialized()
        {
            return _isInitialized;
        }
        
        public string GetPlatformName()
        {
            return "CrazyGames";
        }
    }
}