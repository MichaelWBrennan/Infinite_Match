using System;
using UnityEngine;
using UnityEngine.Advertisements;

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
        if (!Advertisement.isInitialized)
        {
            Advertisement.Initialize(_gameId, testMode, this);
        }
    }

    public void OnInitializationComplete()
    {
        LoadInterstitial();
        LoadRewarded();
        LoadBanner();
    }

    public void OnInitializationFailed(UnityAdsInitializationError error, string message)
    {
        Debug.LogError($"Unity Ads init failed: {error} {message}");
    }

    public void LoadRewarded() => Advertisement.Load(rewardedPlacementId, this);
    public void LoadInterstitial() => Advertisement.Load(interstitialPlacementId, this);
    public void LoadBanner() => Advertisement.Load(bannerPlacementId, this);

    public void ShowRewarded(Action onComplete)
    {
        _onRewardedComplete = onComplete;
        Advertisement.Show(rewardedPlacementId, this);
    }

    public void ShowInterstitial() => Advertisement.Show(interstitialPlacementId, this);

    public void ShowBanner()
    {
        Advertisement.Banner.SetPosition(BannerPosition.BOTTOM_CENTER);
        Advertisement.Banner.Show(bannerPlacementId);
    }

    public void HideBanner() => Advertisement.Banner.Hide();

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
}
