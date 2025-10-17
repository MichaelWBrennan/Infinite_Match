using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;
using System;

namespace Evergreen.Core
{
    /// <summary>
    /// Comprehensive Scene Manager for handling all scene transitions and loading
    /// Ensures smooth transitions between all game scenes with proper loading states
    /// </summary>
    public class SceneManager : MonoBehaviour
    {
        [Header("Scene Configuration")]
        public string[] sceneNames = {
            "Bootstrap",
            "Loading", 
            "MainMenu",
            "Gameplay",
            "Settings",
            "Shop",
            "Social",
            "Events",
            "Collections"
        };
        
        [Header("Loading Settings")]
        public float minimumLoadingTime = 2f;
        public float fadeInTime = 0.5f;
        public float fadeOutTime = 0.5f;
        
        [Header("Scene Transitions")]
        public bool enableSmoothTransitions = true;
        public bool showLoadingScreen = true;
        public bool preloadScenes = true;
        
        private static SceneManager _instance;
        private string _currentScene = "Bootstrap";
        private bool _isLoading = false;
        private Coroutine _loadingCoroutine;
        
        // Events
        public static event Action<string> OnSceneStartedLoading;
        public static event Action<string> OnSceneFinishedLoading;
        public static event Action<float> OnLoadingProgress;
        
        public static SceneManager Instance
        {
            get
            {
                if (_instance == null)
                {
                    _instance = FindObjectOfType<SceneManager>();
                    if (_instance == null)
                    {
                        GameObject go = new GameObject("SceneManager");
                        _instance = go.AddComponent<SceneManager>();
                        DontDestroyOnLoad(go);
                    }
                }
                return _instance;
            }
        }
        
        void Awake()
        {
            if (_instance == null)
            {
                _instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeSceneManager();
            }
            else if (_instance != this)
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (preloadScenes)
            {
                StartCoroutine(PreloadScenes());
            }
        }
        
        private void InitializeSceneManager()
        {
            Debug.Log("Scene Manager initialized - All scenes ready for seamless transitions");
            
            // Set up scene loading callbacks
            UnityEngine.SceneManagement.SceneManager.sceneLoaded += OnSceneLoaded;
            UnityEngine.SceneManagement.SceneManager.sceneUnloaded += OnSceneUnloaded;
        }
        
        /// <summary>
        /// Load a scene with smooth transition
        /// </summary>
        public void LoadScene(string sceneName, bool useLoadingScreen = true)
        {
            if (_isLoading)
            {
                Debug.LogWarning($"Already loading a scene. Cannot load {sceneName}");
                return;
            }
            
            if (!IsValidScene(sceneName))
            {
                Debug.LogError($"Invalid scene name: {sceneName}");
                return;
            }
            
            if (_loadingCoroutine != null)
            {
                StopCoroutine(_loadingCoroutine);
            }
            
            _loadingCoroutine = StartCoroutine(LoadSceneCoroutine(sceneName, useLoadingScreen));
        }
        
        /// <summary>
        /// Load scene with specific loading parameters
        /// </summary>
        public void LoadScene(string sceneName, float minLoadingTime, bool useLoadingScreen = true)
        {
            if (_isLoading)
            {
                Debug.LogWarning($"Already loading a scene. Cannot load {sceneName}");
                return;
            }
            
            if (!IsValidScene(sceneName))
            {
                Debug.LogError($"Invalid scene name: {sceneName}");
                return;
            }
            
            if (_loadingCoroutine != null)
            {
                StopCoroutine(_loadingCoroutine);
            }
            
            _loadingCoroutine = StartCoroutine(LoadSceneCoroutine(sceneName, useLoadingScreen, minLoadingTime));
        }
        
        /// <summary>
        /// Load scene asynchronously without loading screen
        /// </summary>
        public void LoadSceneAsync(string sceneName)
        {
            if (_isLoading)
            {
                Debug.LogWarning($"Already loading a scene. Cannot load {sceneName}");
                return;
            }
            
            if (!IsValidScene(sceneName))
            {
                Debug.LogError($"Invalid scene name: {sceneName}");
                return;
            }
            
            StartCoroutine(LoadSceneAsyncCoroutine(sceneName));
        }
        
        /// <summary>
        /// Reload current scene
        /// </summary>
        public void ReloadCurrentScene()
        {
            LoadScene(_currentScene);
        }
        
        /// <summary>
        /// Go back to main menu
        /// </summary>
        public void GoToMainMenu()
        {
            LoadScene("MainMenu");
        }
        
        /// <summary>
        /// Start gameplay scene
        /// </summary>
        public void StartGameplay()
        {
            LoadScene("Gameplay");
        }
        
        /// <summary>
        /// Open settings scene
        /// </summary>
        public void OpenSettings()
        {
            LoadScene("Settings");
        }
        
        /// <summary>
        /// Open shop scene
        /// </summary>
        public void OpenShop()
        {
            LoadScene("Shop");
        }
        
        /// <summary>
        /// Open social scene
        /// </summary>
        public void OpenSocial()
        {
            LoadScene("Social");
        }
        
        /// <summary>
        /// Open events scene
        /// </summary>
        public void OpenEvents()
        {
            LoadScene("Events");
        }
        
        /// <summary>
        /// Open collections scene
        /// </summary>
        public void OpenCollections()
        {
            LoadScene("Collections");
        }
        
        /// <summary>
        /// Get current scene name
        /// </summary>
        public string GetCurrentScene()
        {
            return _currentScene;
        }
        
        /// <summary>
        /// Check if currently loading
        /// </summary>
        public bool IsLoading()
        {
            return _isLoading;
        }
        
        /// <summary>
        /// Check if scene is valid
        /// </summary>
        public bool IsValidScene(string sceneName)
        {
            foreach (string scene in sceneNames)
            {
                if (scene == sceneName)
                    return true;
            }
            return false;
        }
        
        /// <summary>
        /// Main scene loading coroutine
        /// </summary>
        private IEnumerator LoadSceneCoroutine(string sceneName, bool useLoadingScreen, float customMinTime = -1)
        {
            _isLoading = true;
            OnSceneStartedLoading?.Invoke(sceneName);
            
            float minTime = customMinTime > 0 ? customMinTime : minimumLoadingTime;
            float startTime = Time.time;
            
            // Fade out current scene
            if (enableSmoothTransitions)
            {
                yield return StartCoroutine(FadeOut());
            }
            
            // Load loading scene if requested
            if (useLoadingScreen && sceneName != "Loading")
            {
                yield return StartCoroutine(LoadSceneAsyncCoroutine("Loading"));
                yield return new WaitForSeconds(0.1f); // Brief pause
            }
            
            // Load target scene
            yield return StartCoroutine(LoadSceneAsyncCoroutine(sceneName));
            
            // Ensure minimum loading time
            float elapsedTime = Time.time - startTime;
            if (elapsedTime < minTime)
            {
                yield return new WaitForSeconds(minTime - elapsedTime);
            }
            
            // Fade in new scene
            if (enableSmoothTransitions)
            {
                yield return StartCoroutine(FadeIn());
            }
            
            _isLoading = false;
            OnSceneFinishedLoading?.Invoke(sceneName);
            
            Debug.Log($"Scene {sceneName} loaded successfully");
        }
        
        /// <summary>
        /// Async scene loading coroutine
        /// </summary>
        private IEnumerator LoadSceneAsyncCoroutine(string sceneName)
        {
            AsyncOperation asyncLoad = UnityEngine.SceneManagement.SceneManager.LoadSceneAsync(sceneName);
            asyncLoad.allowSceneActivation = false;
            
            while (!asyncLoad.isDone)
            {
                float progress = Mathf.Clamp01(asyncLoad.progress / 0.9f);
                OnLoadingProgress?.Invoke(progress);
                
                if (asyncLoad.progress >= 0.9f)
                {
                    asyncLoad.allowSceneActivation = true;
                }
                
                yield return null;
            }
        }
        
        /// <summary>
        /// Preload scenes for faster transitions
        /// </summary>
        private IEnumerator PreloadScenes()
        {
            Debug.Log("Preloading scenes for faster transitions...");
            
            foreach (string sceneName in sceneNames)
            {
                if (sceneName != _currentScene)
                {
                    AsyncOperation asyncLoad = UnityEngine.SceneManagement.SceneManager.LoadSceneAsync(sceneName, LoadSceneMode.Additive);
                    asyncLoad.allowSceneActivation = false;
                    
                    while (!asyncLoad.isDone)
                    {
                        if (asyncLoad.progress >= 0.9f)
                        {
                            asyncLoad.allowSceneActivation = true;
                        }
                        yield return null;
                    }
                    
                    // Unload the preloaded scene
                    yield return UnityEngine.SceneManagement.SceneManager.UnloadSceneAsync(sceneName);
                }
            }
            
            Debug.Log("Scene preloading completed");
        }
        
        /// <summary>
        /// Fade out effect
        /// </summary>
        private IEnumerator FadeOut()
        {
            // This would integrate with your UI fade system
            // For now, just wait for the fade time
            yield return new WaitForSeconds(fadeOutTime);
        }
        
        /// <summary>
        /// Fade in effect
        /// </summary>
        private IEnumerator FadeIn()
        {
            // This would integrate with your UI fade system
            // For now, just wait for the fade time
            yield return new WaitForSeconds(fadeInTime);
        }
        
        /// <summary>
        /// Scene loaded callback
        /// </summary>
        private void OnSceneLoaded(Scene scene, LoadSceneMode mode)
        {
            _currentScene = scene.name;
            Debug.Log($"Scene loaded: {scene.name}");
            
            // Auto-wire buttons in the loaded scene
            StartCoroutine(WireButtonsInScene(scene));
        }
        
        /// <summary>
        /// Wire all buttons in the loaded scene
        /// </summary>
        private System.Collections.IEnumerator WireButtonsInScene(Scene scene)
        {
            // Wait one frame for all objects to be fully loaded
            yield return null;
            
            // Find all buttons in the scene
            var rootObjects = scene.GetRootGameObjects();
            foreach (var rootObject in rootObjects)
            {
                var buttons = rootObject.GetComponentsInChildren<UnityEngine.UI.Button>();
                foreach (var button in buttons)
                {
                    // Skip if already wired
                    if (button.onClick.GetPersistentEventCount() > 0) continue;
                    
                    string buttonName = button.name.ToLower();
                    
                    // Wire buttons based on name patterns
                    if (buttonName.Contains("play") || buttonName.Contains("start") || buttonName.Contains("game"))
                    {
                        button.onClick.AddListener(() => StartGameplay());
                    }
                    else if (buttonName.Contains("main") || buttonName.Contains("menu"))
                    {
                        button.onClick.AddListener(() => GoToMainMenu());
                    }
                    else if (buttonName.Contains("settings"))
                    {
                        button.onClick.AddListener(() => OpenSettings());
                    }
                    else if (buttonName.Contains("shop"))
                    {
                        button.onClick.AddListener(() => OpenShop());
                    }
                    else if (buttonName.Contains("social") || buttonName.Contains("leaderboard") || buttonName.Contains("friends"))
                    {
                        button.onClick.AddListener(() => OpenSocial());
                    }
                    else if (buttonName.Contains("event") || buttonName.Contains("daily") || buttonName.Contains("tournament"))
                    {
                        button.onClick.AddListener(() => OpenEvents());
                    }
                    else if (buttonName.Contains("achievement") || buttonName.Contains("reward"))
                    {
                        button.onClick.AddListener(() => OpenCollections());
                    }
                    else if (buttonName.Contains("back") || buttonName.Contains("return"))
                    {
                        button.onClick.AddListener(() => GoToMainMenu());
                    }
                    else if (buttonName.Contains("pause"))
                    {
                        button.onClick.AddListener(() => {
                            // Pause game logic here
                            Debug.Log("Game paused");
                        });
                    }
                    else if (buttonName.Contains("resume"))
                    {
                        button.onClick.AddListener(() => {
                            // Resume game logic here
                            Debug.Log("Game resumed");
                        });
                    }
                    else if (buttonName.Contains("restart"))
                    {
                        button.onClick.AddListener(() => ReloadCurrentScene());
                    }
                }
            }
            
            Debug.Log($"Auto-wired buttons in scene: {scene.name}");
        }
        
        /// <summary>
        /// Scene unloaded callback
        /// </summary>
        private void OnSceneUnloaded(Scene scene)
        {
            Debug.Log($"Scene unloaded: {scene.name}");
        }
        
        /// <summary>
        /// Get scene index by name
        /// </summary>
        public int GetSceneIndex(string sceneName)
        {
            for (int i = 0; i < sceneNames.Length; i++)
            {
                if (sceneNames[i] == sceneName)
                    return i;
            }
            return -1;
        }
        
        /// <summary>
        /// Get scene name by index
        /// </summary>
        public string GetSceneName(int index)
        {
            if (index >= 0 && index < sceneNames.Length)
                return sceneNames[index];
            return null;
        }
        
        /// <summary>
        /// Get all available scenes
        /// </summary>
        public string[] GetAllScenes()
        {
            return (string[])sceneNames.Clone();
        }
        
        void OnDestroy()
        {
            if (_instance == this)
            {
                UnityEngine.SceneManagement.SceneManager.sceneLoaded -= OnSceneLoaded;
                UnityEngine.SceneManagement.SceneManager.sceneUnloaded -= OnSceneUnloaded;
            }
        }
    }
}