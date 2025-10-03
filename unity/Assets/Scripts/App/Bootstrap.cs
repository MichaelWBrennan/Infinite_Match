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
    }
}
