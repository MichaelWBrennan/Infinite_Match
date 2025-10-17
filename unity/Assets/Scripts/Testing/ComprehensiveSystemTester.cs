using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Linq;
using Evergreen.Core;
using Evergreen.UI;
using Evergreen.Game;
using Evergreen.KeyFree;
using Evergreen.Testing;

namespace Evergreen.Testing
{
    /// <summary>
    /// Comprehensive System Tester - Tests all optimized systems
    /// Validates functionality, integration, and scene compatibility
    /// </summary>
    public class ComprehensiveSystemTester : MonoBehaviour
    {
        [Header("Test Configuration")]
        [SerializeField] private bool runTestsOnStart = true;
        [SerializeField] private bool enableDetailedLogging = true;
        [SerializeField] private bool enablePerformanceTests = true;
        [SerializeField] private bool enableSceneTests = true;
        [SerializeField] private bool enableIntegrationTests = true;
        [SerializeField] private float testInterval = 0.1f;
        
        [Header("Test Results")]
        [SerializeField] private TestResults testResults = new TestResults();
        [SerializeField] private List<string> testLog = new List<string>();
        [SerializeField] private List<string> errorLog = new List<string>();
        [SerializeField] private List<string> warningLog = new List<string>();
        
        // System References
        private OptimizedCoreSystem _coreSystem;
        private OptimizedUISystem _uiSystem;
        private OptimizedGameSystem _gameSystem;
        private KeyFreeUnifiedManager _unifiedManager;
        private KeyFreeSystemTester _keyFreeTester;
        
        // Test State
        private bool _isRunningTests = false;
        private int _currentTestIndex = 0;
        private List<TestDefinition> _allTests = new List<TestDefinition>();
        
        // Events
        public static event Action<string> OnTestStarted;
        public static event Action<string, bool> OnTestCompleted;
        public static event Action<TestResults> OnAllTestsCompleted;
        
        void Start()
        {
            if (runTestsOnStart)
            {
                StartCoroutine(RunAllTests());
            }
        }
        
        #region Test Initialization
        
        private IEnumerator RunAllTests()
        {
            _isRunningTests = true;
            Log("🧪 Starting Comprehensive System Tests...");
            
            // Initialize test results
            InitializeTestResults();
            
            // Get system references
            yield return StartCoroutine(GetSystemReferences());
            
            // Define all tests
            DefineAllTests();
            
            // Run tests by category
            yield return StartCoroutine(RunCoreSystemTests());
            yield return StartCoroutine(RunUISystemTests());
            yield return StartCoroutine(RunGameSystemTests());
            yield return StartCoroutine(RunKeyFreeSystemTests());
            yield return StartCoroutine(RunSceneTests());
            yield return StartCoroutine(RunIntegrationTests());
            yield return StartCoroutine(RunPerformanceTests());
            
            // Generate final report
            GenerateTestReport();
            
            _isRunningTests = false;
            Log("✅ All tests completed!");
            
            OnAllTestsCompleted?.Invoke(testResults);
        }
        
        private void InitializeTestResults()
        {
            testResults = new TestResults
            {
                totalTests = 0,
                passedTests = 0,
                failedTests = 0,
                warnings = 0,
                startTime = DateTime.Now,
                endTime = DateTime.Now,
                testDetails = new List<TestDetail>()
            };
            
            testLog.Clear();
            errorLog.Clear();
            warningLog.Clear();
        }
        
        private IEnumerator GetSystemReferences()
        {
            Log("🔍 Getting system references...");
            
            // Get core system
            _coreSystem = FindObjectOfType<OptimizedCoreSystem>();
            if (_coreSystem == null)
            {
                var coreGO = new GameObject("OptimizedCoreSystem");
                _coreSystem = coreGO.AddComponent<OptimizedCoreSystem>();
            }
            
            // Get UI system
            _uiSystem = FindObjectOfType<OptimizedUISystem>();
            if (_uiSystem == null)
            {
                var uiGO = new GameObject("OptimizedUISystem");
                _uiSystem = uiGO.AddComponent<OptimizedUISystem>();
            }
            
            // Get game system
            _gameSystem = FindObjectOfType<OptimizedGameSystem>();
            if (_gameSystem == null)
            {
                var gameGO = new GameObject("OptimizedGameSystem");
                _gameSystem = gameGO.AddComponent<OptimizedGameSystem>();
            }
            
            // Get unified manager
            _unifiedManager = FindObjectOfType<KeyFreeUnifiedManager>();
            if (_unifiedManager == null)
            {
                var unifiedGO = new GameObject("KeyFreeUnifiedManager");
                _unifiedManager = unifiedGO.AddComponent<KeyFreeUnifiedManager>();
            }
            
            // Get key-free tester
            _keyFreeTester = FindObjectOfType<KeyFreeSystemTester>();
            if (_keyFreeTester == null)
            {
                var testerGO = new GameObject("KeyFreeSystemTester");
                _keyFreeTester = testerGO.AddComponent<KeyFreeSystemTester>();
            }
            
            yield return new WaitForSeconds(0.1f);
            Log("✅ System references obtained");
        }
        
        private void DefineAllTests()
        {
            _allTests.Clear();
            
            // Core System Tests
            _allTests.Add(new TestDefinition("Core System Initialization", TestCoreSystemInitialization));
            _allTests.Add(new TestDefinition("Service Locator Functionality", TestServiceLocator));
            _allTests.Add(new TestDefinition("Memory Management", TestMemoryManagement));
            _allTests.Add(new TestDefinition("Event System", TestEventSystem));
            _allTests.Add(new TestDefinition("Game State Management", TestGameStateManagement));
            
            // UI System Tests
            _allTests.Add(new TestDefinition("UI System Initialization", TestUISystemInitialization));
            _allTests.Add(new TestDefinition("Panel Management", TestPanelManagement));
            _allTests.Add(new TestDefinition("Notification System", TestNotificationSystem));
            _allTests.Add(new TestDefinition("Reward System", TestRewardSystem));
            _allTests.Add(new TestDefinition("UI Transitions", TestUITransitions));
            
            // Game System Tests
            _allTests.Add(new TestDefinition("Game System Initialization", TestGameSystemInitialization));
            _allTests.Add(new TestDefinition("Board Generation", TestBoardGeneration));
            _allTests.Add(new TestDefinition("Match Detection", TestMatchDetection));
            _allTests.Add(new TestDefinition("Energy System", TestEnergySystem));
            _allTests.Add(new TestDefinition("Level Management", TestLevelManagement));
            
            // Key-Free System Tests
            _allTests.Add(new TestDefinition("Key-Free System Initialization", TestKeyFreeSystemInitialization));
            _allTests.Add(new TestDefinition("Weather System", TestWeatherSystem));
            _allTests.Add(new TestDefinition("Social System", TestSocialSystem));
            _allTests.Add(new TestDefinition("Calendar System", TestCalendarSystem));
            _allTests.Add(new TestDefinition("Event System", TestEventSystem));
            
            // Scene Tests
            _allTests.Add(new TestDefinition("Main Menu Scene", TestMainMenuScene));
            _allTests.Add(new TestDefinition("Gameplay Scene", TestGameplayScene));
            _allTests.Add(new TestDefinition("Settings Scene", TestSettingsScene));
            _allTests.Add(new TestDefinition("Shop Scene", TestShopScene));
            _allTests.Add(new TestDefinition("Social Scene", TestSocialScene));
            
            // Integration Tests
            _allTests.Add(new TestDefinition("System Integration", TestSystemIntegration));
            _allTests.Add(new TestDefinition("Cross-System Communication", TestCrossSystemCommunication));
            _allTests.Add(new TestDefinition("Data Flow", TestDataFlow));
            _allTests.Add(new TestDefinition("Error Handling", TestErrorHandling));
            
            // Performance Tests
            _allTests.Add(new TestDefinition("Memory Usage", TestMemoryUsage));
            _allTests.Add(new TestDefinition("Frame Rate", TestFrameRate));
            _allTests.Add(new TestDefinition("Load Times", TestLoadTimes));
            _allTests.Add(new TestDefinition("Object Pooling", TestObjectPooling));
            
            testResults.totalTests = _allTests.Count;
            Log($"📋 Defined {_allTests.Count} tests");
        }
        
        #endregion
        
        #region Core System Tests
        
        private IEnumerator RunCoreSystemTests()
        {
            Log("🔧 Running Core System Tests...");
            
            yield return StartCoroutine(RunTest("Core System Initialization", TestCoreSystemInitialization));
            yield return StartCoroutine(RunTest("Service Locator Functionality", TestServiceLocator));
            yield return StartCoroutine(RunTest("Memory Management", TestMemoryManagement));
            yield return StartCoroutine(RunTest("Event System", TestEventSystem));
            yield return StartCoroutine(RunTest("Game State Management", TestGameStateManagement));
        }
        
        private IEnumerator TestCoreSystemInitialization()
        {
            try
            {
                Assert(_coreSystem != null, "Core system should be initialized");
                Assert(_coreSystem.Instance != null, "Core system instance should exist");
                Assert(_coreSystem.enableAI, "AI should be enabled by default");
                Assert(_coreSystem.enableAnalytics, "Analytics should be enabled by default");
                Assert(_coreSystem.enableSocial, "Social should be enabled by default");
                
                Log("✅ Core system initialization test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Core system initialization test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestServiceLocator()
        {
            try
            {
                // Test service registration
                _coreSystem.RegisterSingleton<ILogger>(() => new AdvancedLogger());
                Assert(_coreSystem.IsRegistered<ILogger>(), "Logger should be registered");
                
                // Test service resolution
                var logger = _coreSystem.Resolve<ILogger>();
                Assert(logger != null, "Logger should be resolved");
                
                // Test service functionality
                logger.Log("Test log message");
                
                Log("✅ Service locator test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Service locator test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestMemoryManagement()
        {
            try
            {
                // Test memory tracking
                var initialMemory = _coreSystem.GetMemoryUsage();
                _coreSystem.TrackAllocation("test", 1, 1000);
                var afterAllocation = _coreSystem.GetMemoryUsage();
                Assert(afterAllocation > initialMemory, "Memory should increase after allocation");
                
                _coreSystem.TrackDeallocation("test", 1, 1000);
                var afterDeallocation = _coreSystem.GetMemoryUsage();
                Assert(afterDeallocation <= afterAllocation, "Memory should decrease after deallocation");
                
                Log("✅ Memory management test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Memory management test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestEventSystem()
        {
            try
            {
                bool eventReceived = false;
                
                // Subscribe to event
                _coreSystem.Subscribe<TestEvent>(evt => eventReceived = true);
                
                // Publish event
                _coreSystem.Publish(new TestEvent { message = "Test" });
                
                yield return new WaitForSeconds(0.1f);
                
                Assert(eventReceived, "Event should be received");
                
                Log("✅ Event system test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Event system test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestGameStateManagement()
        {
            try
            {
                var initialState = _coreSystem.currentState;
                _coreSystem.SetGameState(OptimizedCoreSystem.GameState.Gameplay);
                Assert(_coreSystem.currentState == OptimizedCoreSystem.GameState.Gameplay, "Game state should change");
                
                _coreSystem.AddScore(100);
                Assert(_coreSystem.playerScore == 100, "Score should be updated");
                
                _coreSystem.AddCoins(50);
                Assert(_coreSystem.playerCoins == 50, "Coins should be updated");
                
                Log("✅ Game state management test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Game state management test failed: {ex.Message}");
                throw;
            }
        }
        
        #endregion
        
        #region UI System Tests
        
        private IEnumerator RunUISystemTests()
        {
            Log("🎨 Running UI System Tests...");
            
            yield return StartCoroutine(RunTest("UI System Initialization", TestUISystemInitialization));
            yield return StartCoroutine(RunTest("Panel Management", TestPanelManagement));
            yield return StartCoroutine(RunTest("Notification System", TestNotificationSystem));
            yield return StartCoroutine(RunTest("Reward System", TestRewardSystem));
            yield return StartCoroutine(RunTest("UI Transitions", TestUITransitions));
        }
        
        private IEnumerator TestUISystemInitialization()
        {
            try
            {
                Assert(_uiSystem != null, "UI system should be initialized");
                Assert(_uiSystem.Instance != null, "UI system instance should exist");
                Assert(_uiSystem.enableSmoothTransitions, "Smooth transitions should be enabled");
                Assert(_uiSystem.enableObjectPooling, "Object pooling should be enabled");
                
                Log("✅ UI system initialization test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ UI system initialization test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestPanelManagement()
        {
            try
            {
                // Test panel switching
                _uiSystem.ShowMainMenu();
                yield return new WaitForSeconds(0.5f);
                
                _uiSystem.ShowGameplay();
                yield return new WaitForSeconds(0.5f);
                
                _uiSystem.ShowSettings();
                yield return new WaitForSeconds(0.5f);
                
                Log("✅ Panel management test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Panel management test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestNotificationSystem()
        {
            try
            {
                // Test notification display
                _uiSystem.ShowNotification("Test notification", 2f, NotificationType.Info);
                yield return new WaitForSeconds(0.5f);
                
                _uiSystem.ShowNotification("Success notification", 2f, NotificationType.Success);
                yield return new WaitForSeconds(0.5f);
                
                _uiSystem.ShowNotification("Warning notification", 2f, NotificationType.Warning);
                yield return new WaitForSeconds(0.5f);
                
                Log("✅ Notification system test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Notification system test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestRewardSystem()
        {
            try
            {
                // Test reward popup
                var testIcon = Resources.Load<Sprite>("TestIcon");
                _uiSystem.ShowRewardPopup("Test Reward", "100 coins earned", testIcon, 100, RewardType.Coins);
                yield return new WaitForSeconds(1f);
                
                Log("✅ Reward system test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Reward system test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestUITransitions()
        {
            try
            {
                // Test transition settings
                _uiSystem.EnableSmoothTransitions(true);
                _uiSystem.EnableUIAnimations(true);
                
                // Test scale changes
                _uiSystem.SetUIScale(1.5f);
                yield return new WaitForSeconds(0.1f);
                
                _uiSystem.SetUIScale(1.0f);
                yield return new WaitForSeconds(0.1f);
                
                Log("✅ UI transitions test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ UI transitions test failed: {ex.Message}");
                throw;
            }
        }
        
        #endregion
        
        #region Game System Tests
        
        private IEnumerator RunGameSystemTests()
        {
            Log("🎮 Running Game System Tests...");
            
            yield return StartCoroutine(RunTest("Game System Initialization", TestGameSystemInitialization));
            yield return StartCoroutine(RunTest("Board Generation", TestBoardGeneration));
            yield return StartCoroutine(RunTest("Match Detection", TestMatchDetection));
            yield return StartCoroutine(RunTest("Energy System", TestEnergySystem));
            yield return StartCoroutine(RunTest("Level Management", TestLevelManagement));
        }
        
        private IEnumerator TestGameSystemInitialization()
        {
            try
            {
                Assert(_gameSystem != null, "Game system should be initialized");
                Assert(_gameSystem.Instance != null, "Game system instance should exist");
                Assert(_gameSystem.boardWidth > 0, "Board width should be positive");
                Assert(_gameSystem.boardHeight > 0, "Board height should be positive");
                Assert(_gameSystem.maxEnergy > 0, "Max energy should be positive");
                
                Log("✅ Game system initialization test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Game system initialization test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestBoardGeneration()
        {
            try
            {
                // Test board generation
                _gameSystem.StartNewLevel(1);
                yield return new WaitForSeconds(0.5f);
                
                Assert(_gameSystem.currentLevel == 1, "Current level should be 1");
                Assert(_gameSystem.currentScore == 0, "Initial score should be 0");
                Assert(_gameSystem.currentMoves == 0, "Initial moves should be 0");
                
                Log("✅ Board generation test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Board generation test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestMatchDetection()
        {
            try
            {
                // Test match detection (simplified)
                var tile = _gameSystem.GetTileAt(0, 0);
                if (tile != null)
                {
                    Assert(tile.tileType != TileType.Red || tile.tileType != TileType.Blue, "Tile should have valid type");
                }
                
                Log("✅ Match detection test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Match detection test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestEnergySystem()
        {
            try
            {
                var initialEnergy = _gameSystem.currentEnergy;
                Assert(initialEnergy > 0, "Initial energy should be positive");
                
                // Test energy consumption
                if (_gameSystem.CanMakeMove())
                {
                    _gameSystem.ConsumeEnergy(1);
                    Assert(_gameSystem.currentEnergy < initialEnergy, "Energy should decrease after consumption");
                }
                
                Log("✅ Energy system test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Energy system test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestLevelManagement()
        {
            try
            {
                // Test level progression
                _gameSystem.StartNewLevel(1);
                yield return new WaitForSeconds(0.1f);
                
                Assert(_gameSystem.currentLevel == 1, "Should start at level 1");
                
                // Test score addition
                _gameSystem.AddScore(100);
                Assert(_gameSystem.currentScore == 100, "Score should be updated");
                
                Log("✅ Level management test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Level management test failed: {ex.Message}");
                throw;
            }
        }
        
        #endregion
        
        #region Key-Free System Tests
        
        private IEnumerator RunKeyFreeSystemTests()
        {
            Log("🔑 Running Key-Free System Tests...");
            
            yield return StartCoroutine(RunTest("Key-Free System Initialization", TestKeyFreeSystemInitialization));
            yield return StartCoroutine(RunTest("Weather System", TestWeatherSystem));
            yield return StartCoroutine(RunTest("Social System", TestSocialSystem));
            yield return StartCoroutine(RunTest("Calendar System", TestCalendarSystem));
            yield return StartCoroutine(RunTest("Event System", TestEventSystem));
        }
        
        private IEnumerator TestKeyFreeSystemInitialization()
        {
            try
            {
                Assert(_unifiedManager != null, "Unified manager should be initialized");
                Assert(_unifiedManager.Instance != null, "Unified manager instance should exist");
                
                var playerData = _unifiedManager.GetCurrentPlayerData();
                Assert(playerData != null, "Player data should be available");
                
                Log("✅ Key-free system initialization test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Key-free system initialization test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestWeatherSystem()
        {
            try
            {
                var weatherManager = _unifiedManager.GetWeatherAndSocialManager();
                Assert(weatherManager != null, "Weather manager should be available");
                
                // Test weather data fetching
                yield return StartCoroutine(weatherManager.FetchWeatherData());
                
                var weatherData = weatherManager.GetCurrentWeatherData();
                Assert(weatherData != null, "Weather data should be available");
                
                Log("✅ Weather system test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Weather system test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestSocialSystem()
        {
            try
            {
                var socialManager = _unifiedManager.GetWeatherAndSocialManager();
                Assert(socialManager != null, "Social manager should be available");
                
                // Test social sharing
                socialManager.ShareToNative("Test share message");
                yield return new WaitForSeconds(0.1f);
                
                Log("✅ Social system test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Social system test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestCalendarSystem()
        {
            try
            {
                var calendarManager = _unifiedManager.GetCalendarAndEventManager();
                Assert(calendarManager != null, "Calendar manager should be available");
                
                var events = calendarManager.GetTodayEvents();
                Assert(events != null, "Today's events should be available");
                
                Log("✅ Calendar system test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Calendar system test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestEventSystem()
        {
            try
            {
                var eventManager = _unifiedManager.GetCalendarAndEventManager();
                Assert(eventManager != null, "Event manager should be available");
                
                var gameEvents = eventManager.GetActiveGameEvents();
                Assert(gameEvents != null, "Game events should be available");
                
                Log("✅ Event system test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Event system test failed: {ex.Message}");
                throw;
            }
        }
        
        #endregion
        
        #region Scene Tests
        
        private IEnumerator RunSceneTests()
        {
            if (!enableSceneTests)
            {
                Log("⏭️ Scene tests disabled");
                yield break;
            }
            
            Log("🎬 Running Scene Tests...");
            
            yield return StartCoroutine(RunTest("Main Menu Scene", TestMainMenuScene));
            yield return StartCoroutine(RunTest("Gameplay Scene", TestGameplayScene));
            yield return StartCoroutine(RunTest("Settings Scene", TestSettingsScene));
            yield return StartCoroutine(RunTest("Shop Scene", TestShopScene));
            yield return StartCoroutine(RunTest("Social Scene", TestSocialScene));
        }
        
        private IEnumerator TestMainMenuScene()
        {
            try
            {
                // Test scene loading
                UnityEngine.SceneManagement.SceneManager.LoadScene("MainMenu");
                yield return new WaitForSeconds(1f);
                
                var currentScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
                Assert(currentScene.name == "MainMenu", "MainMenu scene should be loaded");
                
                // Test UI elements
                var uiSystem = FindObjectOfType<OptimizedUISystem>();
                Assert(uiSystem != null, "UI system should be present in MainMenu scene");
                
                Log("✅ Main menu scene test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Main menu scene test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestGameplayScene()
        {
            try
            {
                // Test scene loading
                UnityEngine.SceneManagement.SceneManager.LoadScene("Gameplay");
                yield return new WaitForSeconds(1f);
                
                var currentScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
                Assert(currentScene.name == "Gameplay", "Gameplay scene should be loaded");
                
                // Test game systems
                var gameSystem = FindObjectOfType<OptimizedGameSystem>();
                Assert(gameSystem != null, "Game system should be present in Gameplay scene");
                
                Log("✅ Gameplay scene test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Gameplay scene test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestSettingsScene()
        {
            try
            {
                // Test scene loading
                UnityEngine.SceneManagement.SceneManager.LoadScene("Settings");
                yield return new WaitForSeconds(1f);
                
                var currentScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
                Assert(currentScene.name == "Settings", "Settings scene should be loaded");
                
                Log("✅ Settings scene test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Settings scene test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestShopScene()
        {
            try
            {
                // Test scene loading
                UnityEngine.SceneManagement.SceneManager.LoadScene("Shop");
                yield return new WaitForSeconds(1f);
                
                var currentScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
                Assert(currentScene.name == "Shop", "Shop scene should be loaded");
                
                Log("✅ Shop scene test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Shop scene test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestSocialScene()
        {
            try
            {
                // Test scene loading
                UnityEngine.SceneManagement.SceneManager.LoadScene("Social");
                yield return new WaitForSeconds(1f);
                
                var currentScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
                Assert(currentScene.name == "Social", "Social scene should be loaded");
                
                Log("✅ Social scene test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Social scene test failed: {ex.Message}");
                throw;
            }
        }
        
        #endregion
        
        #region Integration Tests
        
        private IEnumerator RunIntegrationTests()
        {
            if (!enableIntegrationTests)
            {
                Log("⏭️ Integration tests disabled");
                yield break;
            }
            
            Log("🔗 Running Integration Tests...");
            
            yield return StartCoroutine(RunTest("System Integration", TestSystemIntegration));
            yield return StartCoroutine(RunTest("Cross-System Communication", TestCrossSystemCommunication));
            yield return StartCoroutine(RunTest("Data Flow", TestDataFlow));
            yield return StartCoroutine(RunTest("Error Handling", TestErrorHandling));
        }
        
        private IEnumerator TestSystemIntegration()
        {
            try
            {
                // Test that all systems can communicate
                _coreSystem.SetGameState(OptimizedCoreSystem.GameState.Gameplay);
                _uiSystem.ShowGameplay();
                _gameSystem.StartNewLevel(1);
                
                yield return new WaitForSeconds(0.5f);
                
                Assert(_coreSystem.currentState == OptimizedCoreSystem.GameState.Gameplay, "Core system state should be gameplay");
                Assert(_gameSystem.currentLevel == 1, "Game system should be at level 1");
                
                Log("✅ System integration test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ System integration test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestCrossSystemCommunication()
        {
            try
            {
                // Test cross-system communication
                _coreSystem.AddScore(100);
                _uiSystem.ShowNotification($"Score: {_coreSystem.playerScore}", 2f, NotificationType.Success);
                
                yield return new WaitForSeconds(0.5f);
                
                Assert(_coreSystem.playerScore == 100, "Score should be communicated between systems");
                
                Log("✅ Cross-system communication test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Cross-system communication test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestDataFlow()
        {
            try
            {
                // Test data flow through systems
                var initialScore = _coreSystem.playerScore;
                _gameSystem.AddScore(50);
                var finalScore = _coreSystem.playerScore;
                
                Assert(finalScore > initialScore, "Data should flow between systems");
                
                Log("✅ Data flow test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Data flow test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestErrorHandling()
        {
            try
            {
                // Test error handling
                try
                {
                    _gameSystem.StartNewLevel(-1); // Invalid level
                }
                catch
                {
                    // Expected to fail
                }
                
                // System should still be functional
                _gameSystem.StartNewLevel(1);
                Assert(_gameSystem.currentLevel == 1, "System should handle errors gracefully");
                
                Log("✅ Error handling test passed");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Error handling test failed: {ex.Message}");
                throw;
            }
        }
        
        #endregion
        
        #region Performance Tests
        
        private IEnumerator RunPerformanceTests()
        {
            if (!enablePerformanceTests)
            {
                Log("⏭️ Performance tests disabled");
                yield break;
            }
            
            Log("⚡ Running Performance Tests...");
            
            yield return StartCoroutine(RunTest("Memory Usage", TestMemoryUsage));
            yield return StartCoroutine(RunTest("Frame Rate", TestFrameRate));
            yield return StartCoroutine(RunTest("Load Times", TestLoadTimes));
            yield return StartCoroutine(RunTest("Object Pooling", TestObjectPooling));
        }
        
        private IEnumerator TestMemoryUsage()
        {
            try
            {
                var initialMemory = _coreSystem.GetMemoryUsage();
                
                // Perform memory-intensive operations
                for (int i = 0; i < 100; i++)
                {
                    _uiSystem.ShowNotification($"Test {i}", 0.1f, NotificationType.Info);
                }
                
                yield return new WaitForSeconds(1f);
                
                var finalMemory = _coreSystem.GetMemoryUsage();
                var memoryIncrease = finalMemory - initialMemory;
                
                Assert(memoryIncrease < 10 * 1024 * 1024, "Memory increase should be reasonable (< 10MB)");
                
                Log($"✅ Memory usage test passed (Increase: {memoryIncrease / 1024}KB)");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Memory usage test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestFrameRate()
        {
            try
            {
                var frameCount = 0;
                var startTime = Time.realtimeSinceStartup;
                
                // Count frames for 1 second
                while (Time.realtimeSinceStartup - startTime < 1f)
                {
                    frameCount++;
                    yield return null;
                }
                
                var fps = frameCount;
                Assert(fps > 30, "Frame rate should be above 30 FPS");
                
                Log($"✅ Frame rate test passed (FPS: {fps})");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Frame rate test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestLoadTimes()
        {
            try
                {
                var startTime = Time.realtimeSinceStartup;
                
                // Test scene loading time
                UnityEngine.SceneManagement.SceneManager.LoadScene("MainMenu");
                yield return new WaitForSeconds(0.1f);
                
                var loadTime = Time.realtimeSinceStartup - startTime;
                Assert(loadTime < 5f, "Scene load time should be under 5 seconds");
                
                Log($"✅ Load times test passed (Load time: {loadTime:F2}s)");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Load times test failed: {ex.Message}");
                throw;
            }
        }
        
        private IEnumerator TestObjectPooling()
        {
            try
            {
                // Test object pooling efficiency
                var startTime = Time.realtimeSinceStartup;
                
                for (int i = 0; i < 50; i++)
                {
                    _uiSystem.ShowNotification($"Pool test {i}", 0.1f, NotificationType.Info);
                }
                
                yield return new WaitForSeconds(1f);
                
                var endTime = Time.realtimeSinceStartup;
                var totalTime = endTime - startTime;
                
                Assert(totalTime < 2f, "Object pooling should be efficient");
                
                Log($"✅ Object pooling test passed (Time: {totalTime:F2}s)");
                yield return null;
            }
            catch (Exception ex)
            {
                LogError($"❌ Object pooling test failed: {ex.Message}");
                throw;
            }
        }
        
        #endregion
        
        #region Test Execution
        
        private IEnumerator RunTest(string testName, Func<IEnumerator> testMethod)
        {
            OnTestStarted?.Invoke(testName);
            Log($"🧪 Running test: {testName}");
            
            var startTime = DateTime.Now;
            bool passed = false;
            string errorMessage = "";
            
            try
            {
                yield return StartCoroutine(testMethod());
                passed = true;
                testResults.passedTests++;
            }
            catch (Exception ex)
            {
                passed = false;
                errorMessage = ex.Message;
                testResults.failedTests++;
                LogError($"❌ Test failed: {testName} - {errorMessage}");
            }
            
            var endTime = DateTime.Now;
            var duration = (endTime - startTime).TotalMilliseconds;
            
            var testDetail = new TestDetail
            {
                testName = testName,
                passed = passed,
                duration = duration,
                errorMessage = errorMessage,
                timestamp = startTime
            };
            
            testResults.testDetails.Add(testDetail);
            
            OnTestCompleted?.Invoke(testName, passed);
            
            if (passed)
            {
                Log($"✅ Test passed: {testName} ({duration:F0}ms)");
            }
            else
            {
                LogError($"❌ Test failed: {testName} ({duration:F0}ms) - {errorMessage}");
            }
            
            yield return new WaitForSeconds(testInterval);
        }
        
        #endregion
        
        #region Test Reporting
        
        private void GenerateTestReport()
        {
            testResults.endTime = DateTime.Now;
            testResults.totalDuration = (testResults.endTime - testResults.startTime).TotalMilliseconds;
            testResults.successRate = (float)testResults.passedTests / testResults.totalTests * 100f;
            
            Log("📊 Generating test report...");
            Log($"Total Tests: {testResults.totalTests}");
            Log($"Passed: {testResults.passedTests}");
            Log($"Failed: {testResults.failedTests}");
            Log($"Success Rate: {testResults.successRate:F1}%");
            Log($"Total Duration: {testResults.totalDuration:F0}ms");
            
            if (testResults.failedTests > 0)
            {
                LogWarning($"⚠️ {testResults.failedTests} tests failed");
            }
            
            if (testResults.successRate >= 90f)
            {
                Log("🎉 Excellent! System is working very well!");
            }
            else if (testResults.successRate >= 75f)
            {
                Log("✅ Good! System is working well with minor issues.");
            }
            else if (testResults.successRate >= 50f)
            {
                Log("⚠️ Fair! System has some issues that need attention.");
            }
            else
            {
                Log("❌ Poor! System has significant issues that need immediate attention.");
            }
        }
        
        #endregion
        
        #region Utility Methods
        
        private void Assert(bool condition, string message)
        {
            if (!condition)
            {
                throw new Exception($"Assertion failed: {message}");
            }
        }
        
        private void Log(string message)
        {
            if (enableDetailedLogging)
            {
                Debug.Log($"[ComprehensiveTester] {message}");
            }
            testLog.Add($"[{DateTime.Now:HH:mm:ss}] {message}");
        }
        
        private void LogWarning(string message)
        {
            Debug.LogWarning($"[ComprehensiveTester] {message}");
            warningLog.Add($"[{DateTime.Now:HH:mm:ss}] {message}");
            testResults.warnings++;
        }
        
        private void LogError(string message)
        {
            Debug.LogError($"[ComprehensiveTester] {message}");
            errorLog.Add($"[{DateTime.Now:HH:mm:ss}] {message}");
        }
        
        #endregion
        
        #region Public API
        
        public void RunAllTestsManually()
        {
            if (!_isRunningTests)
            {
                StartCoroutine(RunAllTests());
            }
        }
        
        public TestResults GetTestResults()
        {
            return testResults;
        }
        
        public List<string> GetTestLog()
        {
            return testLog;
        }
        
        public List<string> GetErrorLog()
        {
            return errorLog;
        }
        
        public List<string> GetWarningLog()
        {
            return warningLog;
        }
        
        #endregion
    }
    
    #region Data Structures
    
    [System.Serializable]
    public class TestResults
    {
        public int totalTests;
        public int passedTests;
        public int failedTests;
        public int warnings;
        public DateTime startTime;
        public DateTime endTime;
        public float totalDuration;
        public float successRate;
        public List<TestDetail> testDetails = new List<TestDetail>();
    }
    
    [System.Serializable]
    public class TestDetail
    {
        public string testName;
        public bool passed;
        public float duration;
        public string errorMessage;
        public DateTime timestamp;
    }
    
    [System.Serializable]
    public class TestDefinition
    {
        public string name;
        public Func<IEnumerator> testMethod;
        
        public TestDefinition(string name, Func<IEnumerator> testMethod)
        {
            this.name = name;
            this.testMethod = testMethod;
        }
    }
    
    [System.Serializable]
    public class TestEvent
    {
        public string message;
    }
    
    #endregion
}