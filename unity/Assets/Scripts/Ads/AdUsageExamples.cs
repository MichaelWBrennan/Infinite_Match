using UnityEngine;
using System.Collections;

namespace Evergreen.Ads
{
    public class AdUsageExamples : MonoBehaviour
    {
        [Header("Ad Integration Examples")]
        public bool enableExamples = true;
        
        private void Start()
        {
            if (enableExamples)
            {
                StartCoroutine(ShowAdExamples());
            }
        }
        
        private IEnumerator ShowAdExamples()
        {
            yield return new WaitForSeconds(2f);
            
            // Example 1: Show rewarded ad for continue
            ShowRewardedContinueAd();
            
            yield return new WaitForSeconds(5f);
            
            // Example 2: Show interstitial ad after level complete
            ShowLevelCompleteAd();
            
            yield return new WaitForSeconds(5f);
            
            // Example 3: Show rewarded ad for boost
            ShowRewardedBoostAd();
        }
        
        public void ShowRewardedContinueAd()
        {
            Debug.Log("[AdExamples] Showing rewarded continue ad...");
            
            if (AdMediation.Instance != null)
            {
                AdMediation.Instance.ShowRewarded("rewarded_continue");
            }
            else
            {
                Debug.LogWarning("[AdExamples] AdMediation not available");
            }
        }
        
        public void ShowLevelCompleteAd()
        {
            Debug.Log("[AdExamples] Showing level complete ad...");
            
            if (AdMediation.Instance != null)
            {
                AdMediation.Instance.ShowInterstitial("level_complete");
            }
            else
            {
                Debug.LogWarning("[AdExamples] AdMediation not available");
            }
        }
        
        public void ShowRewardedBoostAd()
        {
            Debug.Log("[AdExamples] Showing rewarded boost ad...");
            
            if (AdMediation.Instance != null)
            {
                AdMediation.Instance.ShowRewarded("rewarded_boost");
            }
            else
            {
                Debug.LogWarning("[AdExamples] AdMediation not available");
            }
        }
        
        public void ShowBannerAd()
        {
            Debug.Log("[AdExamples] Showing banner ad...");
            
            if (AdMediation.Instance != null)
            {
                AdMediation.Instance.Preload("banner_bottom");
            }
            else
            {
                Debug.LogWarning("[AdExamples] AdMediation not available");
            }
        }
        
        // Example of how to integrate with game events
        public void OnLevelComplete(int level)
        {
            Debug.Log($"[AdExamples] Level {level} completed, showing ad...");
            
            // Show ad after level 3
            if (level >= 3)
            {
                ShowLevelCompleteAd();
            }
        }
        
        public void OnPlayerStruggling()
        {
            Debug.Log("[AdExamples] Player struggling, offering rewarded ad...");
            
            // Show rewarded ad when player is struggling
            ShowRewardedContinueAd();
        }
        
        public void OnBoostRequested()
        {
            Debug.Log("[AdExamples] Boost requested, showing rewarded ad...");
            
            // Show rewarded ad for boost
            ShowRewardedBoostAd();
        }
        
        // Example of revenue tracking
        public void TrackRevenue()
        {
            if (AdRevenueAnalytics.Instance != null)
            {
                AdRevenueAnalytics.Instance.GenerateRevenueReport();
            }
        }
        
        // Example of ad optimization
        public void OptimizeAds()
        {
            if (AdRevenueOptimizer.Instance != null)
            {
                AdRevenueOptimizer.Instance.LogRevenueReport();
            }
        }
    }
}
