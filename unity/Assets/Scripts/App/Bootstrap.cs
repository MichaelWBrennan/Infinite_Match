using UnityEngine;
using UnityEngine.SceneManagement;
using Evergreen.Core;

public class Bootstrap : MonoBehaviour
{
    private static Bootstrap _instance;

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
    private static void EnsureBootstrapExists()
    {
        // If scene reference is missing or not placed, create one at runtime
        if (FindObjectOfType<Bootstrap>() == null)
        {
            var go = new GameObject("Bootstrap");
            go.AddComponent<Bootstrap>();
            // Ensure there is at least a main camera
            if (Camera.main == null)
            {
                var camGo = new GameObject("Main Camera");
                var cam = camGo.AddComponent<Camera>();
                cam.tag = "MainCamera";
                cam.clearFlags = CameraClearFlags.SolidColor;
                var c = cam.backgroundColor; cam.backgroundColor = new Color(c.r, c.g, c.b, 1f);
            }
        }
    }

    void Awake()
    {
        if (_instance != null) 
        { 
            Destroy(gameObject); 
            return; 
        }
        
        _instance = this;
        DontDestroyOnLoad(gameObject);
        // Ensure camera background is opaque for visibility
        if (Camera.main != null)
        {
            var c = Camera.main.backgroundColor;
            Camera.main.backgroundColor = new Color(c.r, c.g, c.b, 1f);
            Camera.main.clearFlags = CameraClearFlags.SolidColor;
        }
        
        // Initialize the game using the new GameManager
        InitializeGame();
    }

    private void InitializeGame()
    {
        try
        {
            // Create GameManager if it doesn't exist
            var gameManager = OptimizedCoreSystem.Instance;
            if (gameManager == null)
            {
                var go = new GameObject("GameManager");
                gameManager = go.AddComponent<GameManager>();
            }
            
            // Initialize the game
            gameManager.InitializeGame();
            
            Debug.Log("Game initialization completed successfully");

            // If no UI is present, try loading MainMenu scene
            if (FindObjectOfType<Canvas>() == null)
            {
                TryLoadMainMenu();
            }
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
        if (!TryLoadMainMenu())
        {
            // As an ultimate fallback, try to show the legacy UI if present
            MainMenuUI.Show();
        }
    }

    private void EnsureManagers()
    {
        // Ensure EventSystem and Canvas exist for UI
        if (FindObjectOfType<UnityEngine.EventSystems.EventSystem>() == null)
        {
            var es = new GameObject("EventSystem");
            es.AddComponent<UnityEngine.EventSystems.EventSystem>();
            es.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
        }
        if (FindObjectOfType<Canvas>() == null)
        {
            var canvasGo = new GameObject("Canvas");
            var canvas = canvasGo.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvasGo.AddComponent<UnityEngine.UI.CanvasScaler>();
            canvasGo.AddComponent<UnityEngine.UI.GraphicRaycaster>();
        }
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

    private bool TryLoadMainMenu()
    {
        // Load MainMenu scene if it exists in the project
        try
        {
            var mainMenu = "MainMenu";
            if (Application.CanStreamedLevelBeLoaded(mainMenu))
            {
                SceneManager.LoadScene(mainMenu);
                return true;
            }
        }
        catch {}
        return false;
    }
}
