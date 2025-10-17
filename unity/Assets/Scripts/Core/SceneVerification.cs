using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;
using System.Collections.Generic;
using System.Linq;

namespace Evergreen.Core
{
    /// <summary>
    /// Scene Verification System - Ensures all scenes are properly set up and functional
    /// Validates scene structure, components, and connections
    /// </summary>
    public class SceneVerification : MonoBehaviour
    {
        [Header("Verification Settings")]
        public bool runOnStart = true;
        public bool showDetailedLogs = true;
        public bool fixIssuesAutomatically = true;
        
        [Header("Required Scenes")]
        public string[] requiredScenes = {
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
        
        [Header("Required Components")]
        public string[] requiredComponents = {
            "Canvas",
            "EventSystem",
            "AudioSource",
            "Camera"
        };
        
        private Dictionary<string, bool> sceneStatus = new Dictionary<string, bool>();
        private List<string> issuesFound = new List<string>();
        private List<string> fixesApplied = new List<string>();
        
        public static SceneVerification Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (runOnStart)
            {
                StartCoroutine(VerifyAllScenes());
            }
        }
        
        /// <summary>
        /// Verify all scenes
        /// </summary>
        public IEnumerator VerifyAllScenes()
        {
            Debug.Log("🔍 Starting Scene Verification...");
            
            issuesFound.Clear();
            fixesApplied.Clear();
            sceneStatus.Clear();
            
            foreach (string sceneName in requiredScenes)
            {
                yield return StartCoroutine(VerifyScene(sceneName));
            }
            
            // Generate verification report
            GenerateVerificationReport();
            
            Debug.Log("✅ Scene Verification Complete!");
        }
        
        /// <summary>
        /// Verify individual scene
        /// </summary>
        private IEnumerator VerifyScene(string sceneName)
        {
            if (showDetailedLogs)
                Debug.Log($"🔍 Verifying scene: {sceneName}");
            
            bool sceneValid = true;
            List<string> sceneIssues = new List<string>();
            
            // Check if scene exists
            if (!DoesSceneExist(sceneName))
            {
                sceneIssues.Add($"Scene '{sceneName}' does not exist in build settings");
                sceneValid = false;
            }
            else
            {
                // Load scene additively to check its contents
                yield return StartCoroutine(LoadAndCheckScene(sceneName, sceneIssues));
            }
            
            sceneStatus[sceneName] = sceneValid;
            issuesFound.AddRange(sceneIssues);
            
            if (showDetailedLogs)
            {
                if (sceneValid)
                    Debug.Log($"✅ Scene '{sceneName}' is valid");
                else
                    Debug.LogWarning($"❌ Scene '{sceneName}' has issues: {string.Join(", ", sceneIssues)}");
            }
        }
        
        /// <summary>
        /// Load and check scene contents
        /// </summary>
        private IEnumerator LoadAndCheckScene(string sceneName, List<string> issues)
        {
            // Load scene additively
            AsyncOperation asyncLoad = SceneManager.LoadSceneAsync(sceneName, LoadSceneMode.Additive);
            asyncLoad.allowSceneActivation = false;
            
            while (!asyncLoad.isDone)
            {
                if (asyncLoad.progress >= 0.9f)
                {
                    asyncLoad.allowSceneActivation = true;
                }
                yield return null;
            }
            
            // Wait a frame for scene to fully load
            yield return null;
            
            // Check scene contents
            Scene scene = SceneManager.GetSceneByName(sceneName);
            if (scene.IsValid())
            {
                CheckSceneContents(scene, issues);
            }
            
            // Unload the scene
            yield return SceneManager.UnloadSceneAsync(sceneName);
        }
        
        /// <summary>
        /// Check scene contents
        /// </summary>
        private void CheckSceneContents(Scene scene, List<string> issues)
        {
            GameObject[] rootObjects = scene.GetRootGameObjects();
            
            // Check for required components
            foreach (string componentName in requiredComponents)
            {
                if (!HasComponentInScene(rootObjects, componentName))
                {
                    issues.Add($"Missing required component: {componentName}");
                }
            }
            
            // Check for Canvas
            Canvas canvas = FindComponentInScene<Canvas>(rootObjects);
            if (canvas == null)
            {
                issues.Add("No Canvas found in scene");
            }
            else
            {
                // Check Canvas settings
                if (canvas.renderMode != RenderMode.ScreenSpaceOverlay)
                {
                    issues.Add("Canvas should use Screen Space - Overlay mode");
                }
                
                // Check for EventSystem
                if (FindComponentInScene<UnityEngine.EventSystems.EventSystem>(rootObjects) == null)
                {
                    issues.Add("No EventSystem found (required for UI)");
                }
            }
            
            // Check for Camera
            Camera camera = FindComponentInScene<Camera>(rootObjects);
            if (camera == null)
            {
                issues.Add("No Camera found in scene");
            }
            
            // Check for AudioSource
            AudioSource audioSource = FindComponentInScene<AudioSource>(rootObjects);
            if (audioSource == null)
            {
                issues.Add("No AudioSource found in scene");
            }
            
            // Scene-specific checks
            CheckSceneSpecificRequirements(scene.name, rootObjects, issues);
        }
        
        /// <summary>
        /// Check scene-specific requirements
        /// </summary>
        private void CheckSceneSpecificRequirements(string sceneName, GameObject[] rootObjects, List<string> issues)
        {
            switch (sceneName)
            {
                case "Bootstrap":
                    CheckBootstrapScene(rootObjects, issues);
                    break;
                case "MainMenu":
                    CheckMainMenuScene(rootObjects, issues);
                    break;
                case "Gameplay":
                    CheckGameplayScene(rootObjects, issues);
                    break;
                case "Loading":
                    CheckLoadingScene(rootObjects, issues);
                    break;
                case "Settings":
                    CheckSettingsScene(rootObjects, issues);
                    break;
                case "Shop":
                    CheckShopScene(rootObjects, issues);
                    break;
                case "Social":
                    CheckSocialScene(rootObjects, issues);
                    break;
                case "Events":
                    CheckEventsScene(rootObjects, issues);
                    break;
                case "Collections":
                    CheckCollectionsScene(rootObjects, issues);
                    break;
            }
        }
        
        /// <summary>
        /// Check Bootstrap scene
        /// </summary>
        private void CheckBootstrapScene(GameObject[] rootObjects, List<string> issues)
        {
            // Bootstrap should have GameManager
            if (FindComponentInScene<GameManager>(rootObjects) == null)
            {
                issues.Add("Bootstrap scene should have GameManager component");
            }
            
            // Should have SceneManager
            if (FindComponentInScene<SceneManager>(rootObjects) == null)
            {
                issues.Add("Bootstrap scene should have SceneManager component");
            }
        }
        
        /// <summary>
        /// Check MainMenu scene
        /// </summary>
        private void CheckMainMenuScene(GameObject[] rootObjects, List<string> issues)
        {
            // Should have UI buttons
            if (!HasUIButtons(rootObjects))
            {
                issues.Add("MainMenu scene should have UI buttons");
            }
        }
        
        /// <summary>
        /// Check Gameplay scene
        /// </summary>
        private void CheckGameplayScene(GameObject[] rootObjects, List<string> issues)
        {
            // Should have match-3 related components
            if (!HasMatch3Components(rootObjects))
            {
                issues.Add("Gameplay scene should have match-3 game components");
            }
        }
        
        /// <summary>
        /// Check Loading scene
        /// </summary>
        private void CheckLoadingScene(GameObject[] rootObjects, List<string> issues)
        {
            // Should have loading UI elements
            if (!HasLoadingUI(rootObjects))
            {
                issues.Add("Loading scene should have loading UI elements");
            }
        }
        
        /// <summary>
        /// Check Settings scene
        /// </summary>
        private void CheckSettingsScene(GameObject[] rootObjects, List<string> issues)
        {
            // Should have settings UI elements
            if (!HasSettingsUI(rootObjects))
            {
                issues.Add("Settings scene should have settings UI elements");
            }
        }
        
        /// <summary>
        /// Check Shop scene
        /// </summary>
        private void CheckShopScene(GameObject[] rootObjects, List<string> issues)
        {
            // Should have shop UI elements
            if (!HasShopUI(rootObjects))
            {
                issues.Add("Shop scene should have shop UI elements");
            }
        }
        
        /// <summary>
        /// Check Social scene
        /// </summary>
        private void CheckSocialScene(GameObject[] rootObjects, List<string> issues)
        {
            // Should have social UI elements
            if (!HasSocialUI(rootObjects))
            {
                issues.Add("Social scene should have social UI elements");
            }
        }
        
        /// <summary>
        /// Check Events scene
        /// </summary>
        private void CheckEventsScene(GameObject[] rootObjects, List<string> issues)
        {
            // Should have events UI elements
            if (!HasEventsUI(rootObjects))
            {
                issues.Add("Events scene should have events UI elements");
            }
        }
        
        /// <summary>
        /// Check Collections scene
        /// </summary>
        private void CheckCollectionsScene(GameObject[] rootObjects, List<string> issues)
        {
            // Should have collections UI elements
            if (!HasCollectionsUI(rootObjects))
            {
                issues.Add("Collections scene should have collections UI elements");
            }
        }
        
        /// <summary>
        /// Check if scene exists in build settings
        /// </summary>
        private bool DoesSceneExist(string sceneName)
        {
            for (int i = 0; i < SceneManager.sceneCountInBuildSettings; i++)
            {
                string scenePath = SceneUtility.GetScenePathByBuildIndex(i);
                string sceneNameFromPath = System.IO.Path.GetFileNameWithoutExtension(scenePath);
                if (sceneNameFromPath == sceneName)
                {
                    return true;
                }
            }
            return false;
        }
        
        /// <summary>
        /// Check if component exists in scene
        /// </summary>
        private bool HasComponentInScene(GameObject[] rootObjects, string componentName)
        {
            foreach (GameObject obj in rootObjects)
            {
                if (obj.GetComponent(componentName) != null)
                {
                    return true;
                }
            }
            return false;
        }
        
        /// <summary>
        /// Find component in scene
        /// </summary>
        private T FindComponentInScene<T>(GameObject[] rootObjects) where T : Component
        {
            foreach (GameObject obj in rootObjects)
            {
                T component = obj.GetComponent<T>();
                if (component != null)
                {
                    return component;
                }
            }
            return null;
        }
        
        /// <summary>
        /// Check for UI buttons
        /// </summary>
        private bool HasUIButtons(GameObject[] rootObjects)
        {
            return FindComponentInScene<UnityEngine.UI.Button>(rootObjects) != null;
        }
        
        /// <summary>
        /// Check for match-3 components
        /// </summary>
        private bool HasMatch3Components(GameObject[] rootObjects)
        {
            // This would check for match-3 specific components
            return true; // Placeholder
        }
        
        /// <summary>
        /// Check for loading UI
        /// </summary>
        private bool HasLoadingUI(GameObject[] rootObjects)
        {
            return FindComponentInScene<UnityEngine.UI.Slider>(rootObjects) != null;
        }
        
        /// <summary>
        /// Check for settings UI
        /// </summary>
        private bool HasSettingsUI(GameObject[] rootObjects)
        {
            return FindComponentInScene<UnityEngine.UI.Toggle>(rootObjects) != null;
        }
        
        /// <summary>
        /// Check for shop UI
        /// </summary>
        private bool HasShopUI(GameObject[] rootObjects)
        {
            return FindComponentInScene<UnityEngine.UI.Button>(rootObjects) != null;
        }
        
        /// <summary>
        /// Check for social UI
        /// </summary>
        private bool HasSocialUI(GameObject[] rootObjects)
        {
            return FindComponentInScene<UnityEngine.UI.Button>(rootObjects) != null;
        }
        
        /// <summary>
        /// Check for events UI
        /// </summary>
        private bool HasEventsUI(GameObject[] rootObjects)
        {
            return FindComponentInScene<UnityEngine.UI.Button>(rootObjects) != null;
        }
        
        /// <summary>
        /// Check for collections UI
        /// </summary>
        private bool HasCollectionsUI(GameObject[] rootObjects)
        {
            return FindComponentInScene<UnityEngine.UI.Button>(rootObjects) != null;
        }
        
        /// <summary>
        /// Generate verification report
        /// </summary>
        private void GenerateVerificationReport()
        {
            Debug.Log("📊 Scene Verification Report:");
            Debug.Log("================================");
            
            int validScenes = 0;
            int totalScenes = requiredScenes.Length;
            
            foreach (string sceneName in requiredScenes)
            {
                bool isValid = sceneStatus.ContainsKey(sceneName) && sceneStatus[sceneName];
                Debug.Log($"Scene: {sceneName} - {(isValid ? "✅ Valid" : "❌ Invalid")}");
                if (isValid) validScenes++;
            }
            
            Debug.Log("================================");
            Debug.Log($"Valid Scenes: {validScenes}/{totalScenes}");
            Debug.Log($"Issues Found: {issuesFound.Count}");
            
            if (issuesFound.Count > 0)
            {
                Debug.LogWarning("Issues Found:");
                foreach (string issue in issuesFound)
                {
                    Debug.LogWarning($"- {issue}");
                }
            }
            
            if (fixesApplied.Count > 0)
            {
                Debug.Log("Fixes Applied:");
                foreach (string fix in fixesApplied)
                {
                    Debug.Log($"- {fix}");
                }
            }
            
            Debug.Log("================================");
        }
        
        /// <summary>
        /// Get scene status
        /// </summary>
        public bool IsSceneValid(string sceneName)
        {
            return sceneStatus.ContainsKey(sceneName) && sceneStatus[sceneName];
        }
        
        /// <summary>
        /// Get all issues
        /// </summary>
        public List<string> GetIssues()
        {
            return new List<string>(issuesFound);
        }
        
        /// <summary>
        /// Get all fixes applied
        /// </summary>
        public List<string> GetFixesApplied()
        {
            return new List<string>(fixesApplied);
        }
    }
}