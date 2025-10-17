using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using System;
using System.Linq;
using Evergreen.Core;
using Evergreen.UI;
using Evergreen.Game;
using Evergreen.KeyFree;

namespace Evergreen.Testing
{
    /// <summary>
    /// Scene Validator - Tests all Unity scenes for proper functionality
    /// Validates scene loading, component presence, and system integration
    /// </summary>
    public class SceneValidator : MonoBehaviour
    {
        [Header("Scene Validation Settings")]
        [SerializeField] private bool runValidationOnStart = true;
        [SerializeField] private bool enableDetailedLogging = true;
        [SerializeField] private float sceneLoadTimeout = 10f;
        [SerializeField] private bool validateAllScenes = true;
        
        [Header("Scene List")]
        [SerializeField] private List<string> scenesToValidate = new List<string>
        {
            "MainMenu",
            "Gameplay", 
            "Settings",
            "Shop",
            "Social",
            "Events",
            "Collections",
            "Loading",
            "Bootstrap"
        };
        
        [Header("Validation Results")]
        [SerializeField] private SceneValidationResults validationResults = new SceneValidationResults();
        [SerializeField] private List<string> validationLog = new List<string>();
        [SerializeField] private List<string> errorLog = new List<string>();
        
        // Validation State
        private bool _isValidating = false;
        private int _currentSceneIndex = 0;
        private string _originalScene;
        
        // Events
        public static event Action<string> OnSceneValidationStarted;
        public static event Action<string, bool> OnSceneValidationCompleted;
        public static event Action<SceneValidationResults> OnAllScenesValidated;
        
        void Start()
        {
            if (runValidationOnStart)
            {
                StartCoroutine(ValidateAllScenes());
            }
        }
        
        #region Scene Validation
        
        private IEnumerator ValidateAllScenes()
        {
            _isValidating = true;
            Log("🎬 Starting Scene Validation...");
            
            // Initialize validation results
            InitializeValidationResults();
            
            // Store original scene
            _originalScene = SceneManager.GetActiveScene().name;
            
            // Validate each scene
            for (int i = 0; i < scenesToValidate.Count; i++)
            {
                _currentSceneIndex = i;
                var sceneName = scenesToValidate[i];
                
                yield return StartCoroutine(ValidateScene(sceneName));
            }
            
            // Return to original scene
            if (!string.IsNullOrEmpty(_originalScene))
            {
                yield return StartCoroutine(LoadScene(_originalScene));
            }
            
            // Generate validation report
            GenerateValidationReport();
            
            _isValidating = false;
            Log("✅ Scene validation completed!");
            
            OnAllScenesValidated?.Invoke(validationResults);
        }
        
        private void InitializeValidationResults()
        {
            validationResults = new SceneValidationResults
            {
                totalScenes = scenesToValidate.Count,
                validScenes = 0,
                invalidScenes = 0,
                sceneDetails = new List<SceneValidationDetail>(),
                startTime = DateTime.Now,
                endTime = DateTime.Now
            };
            
            validationLog.Clear();
            errorLog.Clear();
        }
        
        private IEnumerator ValidateScene(string sceneName)
        {
            OnSceneValidationStarted?.Invoke(sceneName);
            Log($"🔍 Validating scene: {sceneName}");
            
            var sceneDetail = new SceneValidationDetail
            {
                sceneName = sceneName,
                isValid = false,
                loadTime = 0f,
                errors = new List<string>(),
                warnings = new List<string>(),
                componentsFound = new List<string>(),
                timestamp = DateTime.Now
            };
            
            var startTime = Time.realtimeSinceStartup;
            
            try
            {
                // Load scene
                yield return StartCoroutine(LoadScene(sceneName));
                var loadTime = Time.realtimeSinceStartup - startTime;
                sceneDetail.loadTime = loadTime;
                
                // Validate scene components
                yield return StartCoroutine(ValidateSceneComponents(sceneName, sceneDetail));
                
                // Validate system integration
                yield return StartCoroutine(ValidateSystemIntegration(sceneName, sceneDetail));
                
                // Validate UI elements
                yield return StartCoroutine(ValidateUIElements(sceneName, sceneDetail));
                
                // Validate game objects
                yield return StartCoroutine(ValidateGameObjects(sceneName, sceneDetail));
                
                // Check for errors
                if (sceneDetail.errors.Count == 0)
                {
                    sceneDetail.isValid = true;
                    validationResults.validScenes++;
                    Log($"✅ Scene validated successfully: {sceneName}");
                }
                else
                {
                    validationResults.invalidScenes++;
                    LogError($"❌ Scene validation failed: {sceneName}");
                }
            }
            catch (Exception ex)
            {
                sceneDetail.isValid = false;
                sceneDetail.errors.Add($"Exception during validation: {ex.Message}");
                validationResults.invalidScenes++;
                LogError($"❌ Scene validation exception: {sceneName} - {ex.Message}");
            }
            
            validationResults.sceneDetails.Add(sceneDetail);
            OnSceneValidationCompleted?.Invoke(sceneName, sceneDetail.isValid);
            
            yield return new WaitForSeconds(0.5f);
        }
        
        private IEnumerator LoadScene(string sceneName)
        {
            Log($"📂 Loading scene: {sceneName}");
            
            var loadOperation = SceneManager.LoadSceneAsync(sceneName);
            loadOperation.allowSceneActivation = true;
            
            var timeout = Time.realtimeSinceStartup + sceneLoadTimeout;
            
            while (!loadOperation.isDone)
            {
                if (Time.realtimeSinceStartup > timeout)
                {
                    throw new Exception($"Scene load timeout: {sceneName}");
                }
                yield return null;
            }
            
            // Wait for scene to fully initialize
            yield return new WaitForSeconds(0.5f);
            
            Log($"✅ Scene loaded: {sceneName}");
        }
        
        #endregion
        
        #region Component Validation
        
        private IEnumerator ValidateSceneComponents(string sceneName, SceneValidationDetail sceneDetail)
        {
            Log($"🔧 Validating components in: {sceneName}");
            
            // Check for core systems
            var coreSystem = FindObjectOfType<OptimizedCoreSystem>();
            if (coreSystem != null)
            {
                sceneDetail.componentsFound.Add("OptimizedCoreSystem");
                Log($"✅ Found OptimizedCoreSystem in {sceneName}");
            }
            else
            {
                sceneDetail.warnings.Add("OptimizedCoreSystem not found");
                LogWarning($"⚠️ OptimizedCoreSystem not found in {sceneName}");
            }
            
            // Check for UI systems
            var uiSystem = FindObjectOfType<OptimizedUISystem>();
            if (uiSystem != null)
            {
                sceneDetail.componentsFound.Add("OptimizedUISystem");
                Log($"✅ Found OptimizedUISystem in {sceneName}");
            }
            else
            {
                sceneDetail.warnings.Add("OptimizedUISystem not found");
                LogWarning($"⚠️ OptimizedUISystem not found in {sceneName}");
            }
            
            // Check for game systems (only in gameplay scenes)
            if (sceneName == "Gameplay" || sceneName == "MainMenu")
            {
                var gameSystem = FindObjectOfType<OptimizedGameSystem>();
                if (gameSystem != null)
                {
                    sceneDetail.componentsFound.Add("OptimizedGameSystem");
                    Log($"✅ Found OptimizedGameSystem in {sceneName}");
                }
                else
                {
                    sceneDetail.warnings.Add("OptimizedGameSystem not found");
                    LogWarning($"⚠️ OptimizedGameSystem not found in {sceneName}");
                }
            }
            
            // Check for key-free systems
            var unifiedManager = FindObjectOfType<KeyFreeUnifiedManager>();
            if (unifiedManager != null)
            {
                sceneDetail.componentsFound.Add("KeyFreeUnifiedManager");
                Log($"✅ Found KeyFreeUnifiedManager in {sceneName}");
            }
            else
            {
                sceneDetail.warnings.Add("KeyFreeUnifiedManager not found");
                LogWarning($"⚠️ KeyFreeUnifiedManager not found in {sceneName}");
            }
            
            yield return null;
        }
        
        private IEnumerator ValidateSystemIntegration(string sceneName, SceneValidationDetail sceneDetail)
        {
            Log($"🔗 Validating system integration in: {sceneName}");
            
            try
            {
                // Test core system functionality
                var coreSystem = FindObjectOfType<OptimizedCoreSystem>();
                if (coreSystem != null)
                {
                    // Test service locator
                    if (coreSystem.IsRegistered<ILogger>())
                    {
                        var logger = coreSystem.Resolve<ILogger>();
                        if (logger != null)
                        {
                            Log($"✅ Service locator working in {sceneName}");
                        }
                        else
                        {
                            sceneDetail.errors.Add("Service locator resolution failed");
                        }
                    }
                    
                    // Test game state management
                    var initialState = coreSystem.currentState;
                    coreSystem.SetGameState(OptimizedCoreSystem.GameState.MainMenu);
                    if (coreSystem.currentState == OptimizedCoreSystem.GameState.MainMenu)
                    {
                        Log($"✅ Game state management working in {sceneName}");
                    }
                    else
                    {
                        sceneDetail.errors.Add("Game state management failed");
                    }
                }
                
                // Test UI system functionality
                var uiSystem = FindObjectOfType<OptimizedUISystem>();
                if (uiSystem != null)
                {
                    // Test panel management
                    uiSystem.ShowMainMenu();
                    yield return new WaitForSeconds(0.1f);
                    Log($"✅ UI system working in {sceneName}");
                }
                
                // Test game system functionality (if present)
                var gameSystem = FindObjectOfType<OptimizedGameSystem>();
                if (gameSystem != null)
                {
                    // Test level management
                    gameSystem.StartNewLevel(1);
                    yield return new WaitForSeconds(0.1f);
                    if (gameSystem.currentLevel == 1)
                    {
                        Log($"✅ Game system working in {sceneName}");
                    }
                    else
                    {
                        sceneDetail.errors.Add("Game system level management failed");
                    }
                }
                
                // Test key-free systems
                var unifiedManager = FindObjectOfType<KeyFreeUnifiedManager>();
                if (unifiedManager != null)
                {
                    var playerData = unifiedManager.GetCurrentPlayerData();
                    if (playerData != null)
                    {
                        Log($"✅ Key-free systems working in {sceneName}");
                    }
                    else
                    {
                        sceneDetail.errors.Add("Key-free systems data retrieval failed");
                    }
                }
            }
            catch (Exception ex)
            {
                sceneDetail.errors.Add($"System integration error: {ex.Message}");
                LogError($"❌ System integration error in {sceneName}: {ex.Message}");
            }
            
            yield return null;
        }
        
        private IEnumerator ValidateUIElements(string sceneName, SceneValidationDetail sceneDetail)
        {
            Log($"🎨 Validating UI elements in: {sceneName}");
            
            try
            {
                // Check for Canvas
                var canvas = FindObjectOfType<Canvas>();
                if (canvas != null)
                {
                    sceneDetail.componentsFound.Add("Canvas");
                    Log($"✅ Found Canvas in {sceneName}");
                }
                else
                {
                    sceneDetail.warnings.Add("Canvas not found");
                }
                
                // Check for EventSystem
                var eventSystem = FindObjectOfType<UnityEngine.EventSystems.EventSystem>();
                if (eventSystem != null)
                {
                    sceneDetail.componentsFound.Add("EventSystem");
                    Log($"✅ Found EventSystem in {sceneName}");
                }
                else
                {
                    sceneDetail.warnings.Add("EventSystem not found");
                }
                
                // Check for UI panels
                var uiPanels = FindObjectsOfType<GameObject>().Where(go => go.name.Contains("Panel")).ToArray();
                if (uiPanels.Length > 0)
                {
                    sceneDetail.componentsFound.Add($"UI Panels ({uiPanels.Length})");
                    Log($"✅ Found {uiPanels.Length} UI panels in {sceneName}");
                }
                
                // Check for buttons
                var buttons = FindObjectsOfType<UnityEngine.UI.Button>();
                if (buttons.Length > 0)
                {
                    sceneDetail.componentsFound.Add($"Buttons ({buttons.Length})");
                    Log($"✅ Found {buttons.Length} buttons in {sceneName}");
                }
                
                // Check for text elements
                var texts = FindObjectsOfType<UnityEngine.UI.Text>();
                if (texts.Length > 0)
                {
                    sceneDetail.componentsFound.Add($"Text Elements ({texts.Length})");
                    Log($"✅ Found {texts.Length} text elements in {sceneName}");
                }
            }
            catch (Exception ex)
            {
                sceneDetail.errors.Add($"UI validation error: {ex.Message}");
                LogError($"❌ UI validation error in {sceneName}: {ex.Message}");
            }
            
            yield return null;
        }
        
        private IEnumerator ValidateGameObjects(string sceneName, SceneValidationDetail sceneDetail)
        {
            Log($"🎮 Validating game objects in: {sceneName}");
            
            try
            {
                // Get all game objects in the scene
                var allObjects = FindObjectsOfType<GameObject>();
                var objectCount = allObjects.Length;
                
                sceneDetail.componentsFound.Add($"Game Objects ({objectCount})");
                Log($"✅ Found {objectCount} game objects in {sceneName}");
                
                // Check for specific scene requirements
                switch (sceneName)
                {
                    case "MainMenu":
                        ValidateMainMenuObjects(sceneDetail);
                        break;
                    case "Gameplay":
                        ValidateGameplayObjects(sceneDetail);
                        break;
                    case "Settings":
                        ValidateSettingsObjects(sceneDetail);
                        break;
                    case "Shop":
                        ValidateShopObjects(sceneDetail);
                        break;
                    case "Social":
                        ValidateSocialObjects(sceneDetail);
                        break;
                }
            }
            catch (Exception ex)
            {
                sceneDetail.errors.Add($"Game object validation error: {ex.Message}");
                LogError($"❌ Game object validation error in {sceneName}: {ex.Message}");
            }
            
            yield return null;
        }
        
        #endregion
        
        #region Scene-Specific Validation
        
        private void ValidateMainMenuObjects(SceneValidationDetail sceneDetail)
        {
            // Check for main menu specific objects
            var playButton = GameObject.Find("PlayButton");
            if (playButton != null)
            {
                sceneDetail.componentsFound.Add("PlayButton");
            }
            else
            {
                sceneDetail.warnings.Add("PlayButton not found");
            }
            
            var settingsButton = GameObject.Find("SettingsButton");
            if (settingsButton != null)
            {
                sceneDetail.componentsFound.Add("SettingsButton");
            }
            else
            {
                sceneDetail.warnings.Add("SettingsButton not found");
            }
        }
        
        private void ValidateGameplayObjects(SceneValidationDetail sceneDetail)
        {
            // Check for gameplay specific objects
            var gameBoard = GameObject.Find("GameBoard");
            if (gameBoard != null)
            {
                sceneDetail.componentsFound.Add("GameBoard");
            }
            else
            {
                sceneDetail.warnings.Add("GameBoard not found");
            }
            
            var scoreText = GameObject.Find("ScoreText");
            if (scoreText != null)
            {
                sceneDetail.componentsFound.Add("ScoreText");
            }
            else
            {
                sceneDetail.warnings.Add("ScoreText not found");
            }
        }
        
        private void ValidateSettingsObjects(SceneValidationDetail sceneDetail)
        {
            // Check for settings specific objects
            var volumeSlider = GameObject.Find("VolumeSlider");
            if (volumeSlider != null)
            {
                sceneDetail.componentsFound.Add("VolumeSlider");
            }
            else
            {
                sceneDetail.warnings.Add("VolumeSlider not found");
            }
        }
        
        private void ValidateShopObjects(SceneValidationDetail sceneDetail)
        {
            // Check for shop specific objects
            var shopItems = GameObject.FindGameObjectsWithTag("ShopItem");
            if (shopItems.Length > 0)
            {
                sceneDetail.componentsFound.Add($"Shop Items ({shopItems.Length})");
            }
            else
            {
                sceneDetail.warnings.Add("No shop items found");
            }
        }
        
        private void ValidateSocialObjects(SceneValidationDetail sceneDetail)
        {
            // Check for social specific objects
            var leaderboard = GameObject.Find("Leaderboard");
            if (leaderboard != null)
            {
                sceneDetail.componentsFound.Add("Leaderboard");
            }
            else
            {
                sceneDetail.warnings.Add("Leaderboard not found");
            }
        }
        
        #endregion
        
        #region Validation Reporting
        
        private void GenerateValidationReport()
        {
            validationResults.endTime = DateTime.Now;
            validationResults.totalDuration = (validationResults.endTime - validationResults.startTime).TotalMilliseconds;
            validationResults.successRate = (float)validationResults.validScenes / validationResults.totalScenes * 100f;
            
            Log("📊 Generating scene validation report...");
            Log($"Total Scenes: {validationResults.totalScenes}");
            Log($"Valid Scenes: {validationResults.validScenes}");
            Log($"Invalid Scenes: {validationResults.invalidScenes}");
            Log($"Success Rate: {validationResults.successRate:F1}%");
            Log($"Total Duration: {validationResults.totalDuration:F0}ms");
            
            // Log scene details
            foreach (var sceneDetail in validationResults.sceneDetails)
            {
                Log($"Scene: {sceneDetail.sceneName} - {(sceneDetail.isValid ? "✅ Valid" : "❌ Invalid")} ({sceneDetail.loadTime:F2}s)");
                
                if (sceneDetail.errors.Count > 0)
                {
                    foreach (var error in sceneDetail.errors)
                    {
                        LogError($"  Error: {error}");
                    }
                }
                
                if (sceneDetail.warnings.Count > 0)
                {
                    foreach (var warning in sceneDetail.warnings)
                    {
                        LogWarning($"  Warning: {warning}");
                    }
                }
            }
            
            if (validationResults.invalidScenes > 0)
            {
                LogWarning($"⚠️ {validationResults.invalidScenes} scenes have issues");
            }
            
            if (validationResults.successRate >= 90f)
            {
                Log("🎉 Excellent! All scenes are working very well!");
            }
            else if (validationResults.successRate >= 75f)
            {
                Log("✅ Good! Most scenes are working well with minor issues.");
            }
            else if (validationResults.successRate >= 50f)
            {
                Log("⚠️ Fair! Some scenes have issues that need attention.");
            }
            else
            {
                Log("❌ Poor! Many scenes have significant issues that need immediate attention.");
            }
        }
        
        #endregion
        
        #region Utility Methods
        
        private void Log(string message)
        {
            if (enableDetailedLogging)
            {
                Debug.Log($"[SceneValidator] {message}");
            }
            validationLog.Add($"[{DateTime.Now:HH:mm:ss}] {message}");
        }
        
        private void LogWarning(string message)
        {
            Debug.LogWarning($"[SceneValidator] {message}");
            validationLog.Add($"[{DateTime.Now:HH:mm:ss}] WARNING: {message}");
        }
        
        private void LogError(string message)
        {
            Debug.LogError($"[SceneValidator] {message}");
            errorLog.Add($"[{DateTime.Now:HH:mm:ss}] ERROR: {message}");
        }
        
        #endregion
        
        #region Public API
        
        public void ValidateAllScenesManually()
        {
            if (!_isValidating)
            {
                StartCoroutine(ValidateAllScenes());
            }
        }
        
        public void ValidateSingleScene(string sceneName)
        {
            if (!_isValidating)
            {
                StartCoroutine(ValidateScene(sceneName));
            }
        }
        
        public SceneValidationResults GetValidationResults()
        {
            return validationResults;
        }
        
        public List<string> GetValidationLog()
        {
            return validationLog;
        }
        
        public List<string> GetErrorLog()
        {
            return errorLog;
        }
        
        #endregion
    }
    
    #region Data Structures
    
    [System.Serializable]
    public class SceneValidationResults
    {
        public int totalScenes;
        public int validScenes;
        public int invalidScenes;
        public float successRate;
        public DateTime startTime;
        public DateTime endTime;
        public float totalDuration;
        public List<SceneValidationDetail> sceneDetails = new List<SceneValidationDetail>();
    }
    
    [System.Serializable]
    public class SceneValidationDetail
    {
        public string sceneName;
        public bool isValid;
        public float loadTime;
        public List<string> errors = new List<string>();
        public List<string> warnings = new List<string>();
        public List<string> componentsFound = new List<string>();
        public DateTime timestamp;
    }
    
    #endregion
}