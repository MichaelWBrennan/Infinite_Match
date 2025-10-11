using System;
using UnityEngine;
using UnityEngine.Advertisements;
using RemoteConfig;

public class UnityAdsManager : MonoBehaviour, IUnityAdsInitializationListener, IUnityAdsLoadListener, IUnityAdsShowListener
{
    [SerializeField] private string androidGameId = "";
    [SerializeField] private string iOSGameId = "";
    [SerializeField] private bool testMode = true;
    [SerializeField] private string rewardedPlacementId = "Rewarded_Android";
    [SerializeField] private string interstitialPlacementId = "Interstitial_Android";
    [SerializeField] private string bannerPlacementId = "Banner_Android";

    private string _gameId;

    void Awake()
    {
        DontDestroyOnLoad(gameObject);
        InitializeAds();
    }

    public void InitializeAds()
    {
        _gameId = (Application.platform == RuntimePlatform.IPhonePlayer) ? iOSGameId : androidGameId;
        // Enforce non-personalized ads for child safety and global compliance
        try
        {
            var privacy = new MetaData("privacy");
            privacy.Set("user.nonbehavioral", "true");
            Advertisement.SetMetaData(privacy);

            var gdpr = new MetaData("gdpr");
            gdpr.Set("consent", "false");
            Advertisement.SetMetaData(gdpr);
        }
        catch { /* best-effort metadata */ }

        if (!Advertisement.isInitialized && AreAdsEnabled())
        {
            Advertisement.Initialize(_gameId, testMode, this);
        }
    }

    public void OnInitializationComplete()
    {
        if (!AreAdsEnabled()) return;
        LoadInterstitial();
        LoadRewarded();
        LoadBanner();
    }

    public void OnInitializationFailed(UnityAdsInitializationError error, string message)
    {
        Debug.LogError($"Unity Ads init failed: {error} {message}");
    }

    public void LoadRewarded() { if (AreAdsEnabled()) Advertisement.Load(rewardedPlacementId, this); }
    public void LoadInterstitial() { if (AreAdsEnabled()) Advertisement.Load(interstitialPlacementId, this); }
    public void LoadBanner() { if (AreAdsEnabled()) Advertisement.Load(bannerPlacementId, this); }

    public void ShowRewarded(Action onComplete)
    {
        if (!AreAdsEnabled()) return;
        _onRewardedComplete = onComplete;
        if (Advertisement.isInitialized)
        {
            Advertisement.Show(rewardedPlacementId, this);
        }
    }

    public void ShowInterstitial() { if (AreAdsEnabled()) Advertisement.Show(interstitialPlacementId, this); }

    public void ShowBanner()
    {
        if (!AreAdsEnabled()) return;
        Advertisement.Banner.SetPosition(BannerPosition.BOTTOM_CENTER);
        if (Advertisement.isInitialized)
        {
            Advertisement.Banner.Show(bannerPlacementId);
        }
    }

    public void HideBanner() { if (Advertisement.isInitialized) Advertisement.Banner.Hide(); }

    // IUnityAdsLoadListener
    public void OnUnityAdsAdLoaded(string placementId) { }
    public void OnUnityAdsFailedToLoad(string placementId, UnityAdsLoadError error, string message)
    {
        Debug.LogWarning($"Load failed {placementId}: {error} {message}");
    }

    private Action _onRewardedComplete;

    // IUnityAdsShowListener
    public void OnUnityAdsShowComplete(string placementId, UnityAdsShowCompletionState showCompletionState)
    {
        if (placementId == rewardedPlacementId && showCompletionState == UnityAdsShowCompletionState.COMPLETED)
        {
            _onRewardedComplete?.Invoke();
        }
        LoadRewarded();
    }

    public void OnUnityAdsShowFailure(string placementId, UnityAdsShowError error, string message)
    {
        Debug.LogWarning($"Show failed {placementId}: {error} {message}");
    }

    public void OnUnityAdsShowStart(string placementId) { }
    public void OnUnityAdsShowClick(string placementId) { }

    private bool AreAdsEnabled()
    {
        // Default to true unless explicitly disabled via Remote Config
        return RemoteConfigManager.Instance?.GetBool("ads_enabled", true) ?? true;
    }
}
