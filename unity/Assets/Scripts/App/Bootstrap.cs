using UnityEngine;
using Evergreen.Game;

public class Bootstrap : MonoBehaviour
{
    private static Bootstrap _instance;

    void Awake()
    {
        if (_instance != null) { Destroy(gameObject); return; }
        _instance = this;
        DontDestroyOnLoad(gameObject);
        GameState.Load();
        EnsureManagers();
        MainMenuUI.Show();
    }

    private void EnsureManagers()
    {
        if (FindObjectOfType<UnityAdsManager>() == null)
        {
            var go = new GameObject("UnityAdsManager");
            go.AddComponent<UnityAdsManager>();
        }
        if (FindObjectOfType<IAPManager>() == null)
        {
            var go = new GameObject("IAPManager");
            go.AddComponent<IAPManager>();
        }
        if (FindObjectOfType<Evergreen.Ads.AdMediation>() == null)
        {
            var go = new GameObject("AdMediation");
            go.AddComponent<Evergreen.Ads.AdMediation>();
        }
        if (FindObjectOfType<Evergreen.Game.CloudSavePlayFab>() == null)
        {
            var go = new GameObject("CloudSavePlayFab");
            go.AddComponent<Evergreen.Game.CloudSavePlayFab>();
        }
        if (FindObjectOfType<Evergreen.Social.TeamChat>() == null)
        {
            var go = new GameObject("TeamChat");
            go.AddComponent<Evergreen.Social.TeamChat>();
        }
        if (FindObjectOfType<Evergreen.Social.TeamGifting>() == null)
        {
            var go = new GameObject("TeamGifting");
            go.AddComponent<Evergreen.Social.TeamGifting>();
        }
    }
}
