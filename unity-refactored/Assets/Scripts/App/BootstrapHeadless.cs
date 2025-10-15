using UnityEngine;
using UnityEngine.SceneManagement;
using System.Collections;

namespace Evergreen.App
{
    /// <summary>
    /// Bootstrap script specifically designed for headless builds and testing
    /// This script initializes the game without requiring user interaction
    /// </summary>
    public class BootstrapHeadless : MonoBehaviour
    {
        [Header("Headless Configuration")]
        [SerializeField] private bool runTestsOnStart = true;
        [SerializeField] private bool loadMainMenuAfterInit = true;
        [SerializeField] private float initializationDelay = 1.0f;
        
        [Header("Test Configuration")]
        [SerializeField] private bool enablePerformanceTests = true;
        [SerializeField] private bool enableIntegrationTests = true;
        [SerializeField] private int maxTestDuration = 30; // seconds
        
        private static BootstrapHeadless _instance;
        private bool _initializationComplete = false;
        private float _testStartTime;
        
        public static BootstrapHeadless Instance => _instance;
        public bool IsInitializationComplete => _initializationComplete;
        
        void Awake()
        {
            if (_instance != null)
            {
                Destroy(gameObject);
                return;
            }
            
            _instance = this;
            DontDestroyOnLoad(gameObject);
            
            Debug.Log("[BootstrapHeadless] Starting headless initialization...");
        }
        
        void Start()
        {
            StartCoroutine(InitializeHeadless());
        }
        
        private IEnumerator InitializeHeadless()
        {
            // Wait for a frame to ensure all systems are ready
            yield return null;
            
            Debug.Log("[BootstrapHeadless] Initializing core systems...");
            
            try
            {
                // Initialize GameManager
                InitializeGameManager();
                yield return new WaitForSeconds(0.1f);
                
                // Initialize essential systems
                InitializeEssentialSystems();
                yield return new WaitForSeconds(0.1f);
                
                // Run tests if enabled
                if (runTestsOnStart)
                {
                    yield return StartCoroutine(RunHeadlessTests());
                }
                
                // Mark initialization as complete
                _initializationComplete = true;
                Debug.Log("[BootstrapHeadless] Headless initialization completed successfully!");
                
                // Load main menu if requested
                if (loadMainMenuAfterInit)
                {
                    yield return new WaitForSeconds(initializationDelay);
                    LoadMainMenu();
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"[BootstrapHeadless] Initialization failed: {e.Message}");
                Debug.LogError($"[BootstrapHeadless] Stack trace: {e.StackTrace}");
                
                // Try fallback initialization
                yield return StartCoroutine(FallbackInitialization());
            }
        }
        
        private void InitializeGameManager()
        {
            var gameManager = FindObjectOfType<Evergreen.Core.GameManager>();
            if (gameManager == null)
            {
                var go = new GameObject("GameManager");
                gameManager = go.AddComponent<Evergreen.Core.GameManager>();
                Debug.Log("[BootstrapHeadless] Created GameManager");
            }
            else
            {
                Debug.Log("[BootstrapHeadless] Found existing GameManager");
            }
        }
        
        private void InitializeEssentialSystems()
        {
            Debug.Log("[BootstrapHeadless] Initializing essential systems...");
            
            // Initialize any essential systems here
            // This is where you'd initialize systems that are required for headless operation
            
            Debug.Log("[BootstrapHeadless] Essential systems initialized");
        }
        
        private IEnumerator RunHeadlessTests()
        {
            Debug.Log("[BootstrapHeadless] Starting headless tests...");
            _testStartTime = Time.time;
            
            if (enablePerformanceTests)
            {
                yield return StartCoroutine(RunPerformanceTests());
            }
            
            if (enableIntegrationTests)
            {
                yield return StartCoroutine(RunIntegrationTests());
            }
            
            float testDuration = Time.time - _testStartTime;
            Debug.Log($"[BootstrapHeadless] Tests completed in {testDuration:F2} seconds");
        }
        
        private IEnumerator RunPerformanceTests()
        {
            Debug.Log("[BootstrapHeadless] Running performance tests...");
            
            // Basic performance validation
            float startTime = Time.realtimeSinceStartup;
            yield return new WaitForSeconds(0.1f);
            float endTime = Time.realtimeSinceStartup;
            
            float frameTime = endTime - startTime;
            Debug.Log($"[BootstrapHeadless] Frame time test: {frameTime * 1000:F2}ms");
            
            // Memory usage check
            long memoryBefore = System.GC.GetTotalMemory(false);
            yield return new WaitForSeconds(0.1f);
            long memoryAfter = System.GC.GetTotalMemory(false);
            
            Debug.Log($"[BootstrapHeadless] Memory usage: {(memoryAfter - memoryBefore) / 1024}KB");
            
            yield return new WaitForSeconds(0.1f);
        }
        
        private IEnumerator RunIntegrationTests()
        {
            Debug.Log("[BootstrapHeadless] Running integration tests...");
            
            // Test basic game functionality
            var gameManager = FindObjectOfType<Evergreen.Core.GameManager>();
            if (gameManager != null)
            {
                Debug.Log("[BootstrapHeadless] GameManager integration test: PASSED");
            }
            else
            {
                Debug.LogError("[BootstrapHeadless] GameManager integration test: FAILED");
            }
            
            // Test scene loading
            if (SceneManager.GetActiveScene().name == "Bootstrap")
            {
                Debug.Log("[BootstrapHeadless] Scene loading test: PASSED");
            }
            else
            {
                Debug.LogError("[BootstrapHeadless] Scene loading test: FAILED");
            }
            
            yield return new WaitForSeconds(0.1f);
        }
        
        private IEnumerator FallbackInitialization()
        {
            Debug.LogWarning("[BootstrapHeadless] Using fallback initialization...");
            
            // Minimal initialization for headless builds
            var gameManager = FindObjectOfType<Evergreen.Core.GameManager>();
            if (gameManager == null)
            {
                var go = new GameObject("GameManager");
                go.AddComponent<Evergreen.Core.GameManager>();
            }
            
            _initializationComplete = true;
            Debug.Log("[BootstrapHeadless] Fallback initialization completed");
            
            yield return null;
        }
        
        private void LoadMainMenu()
        {
            Debug.Log("[BootstrapHeadless] Loading main menu...");
            SceneManager.LoadScene("MainMenu");
        }
        
        void Update()
        {
            // Check for test timeout
            if (runTestsOnStart && !_initializationComplete)
            {
                if (Time.time - _testStartTime > maxTestDuration)
                {
                    Debug.LogWarning("[BootstrapHeadless] Test timeout reached, completing initialization");
                    _initializationComplete = true;
                }
            }
        }
        
        void OnApplicationQuit()
        {
            Debug.Log("[BootstrapHeadless] Application quitting...");
        }
        
        // Public methods for external testing
        public void ForceInitialization()
        {
            if (!_initializationComplete)
            {
                StartCoroutine(InitializeHeadless());
            }
        }
        
        public void RunTests()
        {
            if (_initializationComplete)
            {
                StartCoroutine(RunHeadlessTests());
            }
        }
    }
}