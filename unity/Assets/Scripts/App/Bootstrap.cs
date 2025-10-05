using UnityEngine;
using Evergreen.Core;

public class Bootstrap : MonoBehaviour
{
    private static Bootstrap _instance;

    void Awake()
    {
        if (_instance != null) 
        { 
            Destroy(gameObject); 
            return; 
        }
        
        _instance = this;
        DontDestroyOnLoad(gameObject);
        
        // Initialize the game using the new GameManager
        InitializeGame();
    }

    private void InitializeGame()
    {
        try
        {
            // Create GameManager if it doesn't exist
            var gameManager = FindObjectOfType<GameManager>();
            if (gameManager == null)
            {
                var go = new GameObject("GameManager");
                gameManager = go.AddComponent<GameManager>();
            }
            
            // Initialize the game
            gameManager.InitializeGame();
            
            Debug.Log("Game initialization completed successfully");
        }
        catch (System.Exception e)
        {
            Debug.LogError($"Failed to initialize game: {e.Message}");
            
            // Fallback to old initialization method
            FallbackInitialization();
        }
    }

    private void FallbackInitialization()
    {
        Debug.LogWarning("Using fallback initialization method");
        
        // Load core systems
        Evergreen.Game.RemoteConfigService.Load();
        GameState.Load();
        
        // Ensure basic managers exist
        EnsureManagers();
        
        // Show main menu
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
