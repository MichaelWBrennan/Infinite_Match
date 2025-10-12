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
    private float _lastInterstitialTime;
    private float _lastRewardedTime;
    private int _interstitialShownThisSession;
    private int _rewardedShownThisSession;

    void Awake()
    {
        DontDestroyOnLoad(gameObject);
        InitializeAds();
        RemoteConfigManager.OnConfigUpdated += _ => ApplyAdMetadata();
    }

    public void InitializeAds()
    {
        _gameId = (Application.platform == RuntimePlatform.IPhonePlayer) ? iOSGameId : androidGameId;
        ApplyAdMetadata();

        if (!Advertisement.isInitialized && AreAdsEnabled())
        {
            Advertisement.Initialize(_gameId, testMode, this);
        }
    }

    private void ApplyAdMetadata()
    {
        try
        {
            bool kidSafe = RemoteConfigManager.Instance?.GetBool("kid_safe_mode", true) ?? true;
            bool npa = kidSafe || (RemoteConfigManager.Instance?.GetBool("use_npa_for_kids", true) ?? true);

            var privacy = new MetaData("privacy");
            privacy.Set("user.nonbehavioral", npa ? "true" : "false");
            Advertisement.SetMetaData(privacy);

            var gdpr = new MetaData("gdpr");
            gdpr.Set("consent", npa ? "false" : "false");
            Advertisement.SetMetaData(gdpr);

            var meta = new MetaData("meta");
            meta.Set("ad_content_rating_max", RemoteConfigManager.Instance?.GetString("ad_content_rating_max", "G"));
            Advertisement.SetMetaData(meta);
        }
        catch { }
    }

    public void OnInitializationComplete()
    {
        if (!AreAdsEnabled()) return;
        if (!RemoteConfigManager.Instance?.GetBool("ads_rewarded_enabled", true) ?? true) return;

        int cap = RemoteConfigManager.Instance?.GetInt("ads_rewarded_max_per_session", 6) ?? 6;
        int interval = RemoteConfigManager.Instance?.GetInt("ads_rewarded_min_interval_seconds", 45) ?? 45;
        if (_rewardedShownThisSession >= cap) return;
        if (Time.unscaledTime - _lastRewardedTime < interval) return;
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

    public void ShowInterstitial()
    {
        if (!AreAdsEnabled()) return;
        if (!RemoteConfigManager.Instance?.GetBool("ads_interstitial_enabled", true) ?? true) return;

        int cap = RemoteConfigManager.Instance?.GetInt("ads_interstitial_max_per_session", 6) ?? 6;
        int interval = RemoteConfigManager.Instance?.GetInt("ads_interstitial_min_interval_seconds", 120) ?? 120;
        if (_interstitialShownThisSession >= cap) return;
        if (Time.unscaledTime - _lastInterstitialTime < interval) return;

        Advertisement.Show(interstitialPlacementId, this);
    }

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
            _rewardedShownThisSession++;
            _lastRewardedTime = Time.unscaledTime;
        }
        if (placementId == interstitialPlacementId)
        {
            _interstitialShownThisSession++;
            _lastInterstitialTime = Time.unscaledTime;
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
        // Disable ads entirely when kid_safe_mode is enabled
        if (RemoteConfigManager.Instance?.GetBool("kid_safe_mode", true) == true)
            return false;
        // Default to true unless explicitly disabled via Remote Config
        return RemoteConfigManager.Instance?.GetBool("ads_enabled", true) ?? true;
    }
}
