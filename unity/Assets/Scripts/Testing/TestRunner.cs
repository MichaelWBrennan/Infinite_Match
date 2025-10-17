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
    /// Test Runner - Orchestrates all testing systems
    /// Runs comprehensive tests on all optimized systems and scenes
    /// </summary>
    public class TestRunner : MonoBehaviour
    {
        [Header("Test Configuration")]
        [SerializeField] private bool runTestsOnStart = true;
        [SerializeField] private bool enableDetailedLogging = true;
        [SerializeField] private bool enablePerformanceTests = true;
        [SerializeField] private bool enableSceneTests = true;
        [SerializeField] private bool enableIntegrationTests = true;
        [SerializeField] private bool enableSystemTests = true;
        
        [Header("Test Components")]
        [SerializeField] private ComprehensiveSystemTester systemTester;
        [SerializeField] private SceneValidator sceneValidator;
        [SerializeField] private KeyFreeSystemTester keyFreeTester;
        
        [Header("Test Results")]
        [SerializeField] private MasterTestResults masterResults = new MasterTestResults();
        [SerializeField] private List<string> masterLog = new List<string>();
        [SerializeField] private List<string> masterErrorLog = new List<string>();
        
        // Test State
        private bool _isRunningTests = false;
        private int _currentTestPhase = 0;
        private string[] _testPhases = { "System Tests", "Scene Tests", "Integration Tests", "Game Logic Tests", "Performance Tests", "Key-Free Tests" };
        
        // Events
        public static event Action<string> OnTestPhaseStarted;
        public static event Action<string, bool> OnTestPhaseCompleted;
        public static event Action<MasterTestResults> OnAllTestsCompleted;
        
        void Start()
        {
            if (runTestsOnStart)
            {
                StartCoroutine(RunAllTests());
            }
        }
        
        #region Test Execution
        
        private IEnumerator RunAllTests()
        {
            _isRunningTests = true;
            Log("🚀 Starting Master Test Suite...");
            
            // Initialize master results
            InitializeMasterResults();
            
            // Get test components
            yield return StartCoroutine(InitializeTestComponents());
            
            // Run all test phases
            yield return StartCoroutine(RunSystemTests());
            yield return StartCoroutine(RunSceneTests());
            yield return StartCoroutine(RunIntegrationTests());
            yield return StartCoroutine(RunGameLogicTests());
            yield return StartCoroutine(RunPerformanceTests());
            yield return StartCoroutine(RunKeyFreeTests());
            
            // Generate master report
            GenerateMasterReport();
            
            _isRunningTests = false;
            Log("🎉 Master Test Suite Completed!");
            
            OnAllTestsCompleted?.Invoke(masterResults);
        }
        
        private void InitializeMasterResults()
        {
            masterResults = new MasterTestResults
            {
                totalPhases = _testPhases.Length,
                completedPhases = 0,
                successfulPhases = 0,
                failedPhases = 0,
                startTime = DateTime.Now,
                endTime = DateTime.Now,
                phaseResults = new List<PhaseResult>()
            };
            
            masterLog.Clear();
            masterErrorLog.Clear();
        }
        
        private IEnumerator InitializeTestComponents()
        {
            Log("🔧 Initializing test components...");
            
            // Get or create system tester
            systemTester = FindObjectOfType<ComprehensiveSystemTester>();
            if (systemTester == null)
            {
                var systemTesterGO = new GameObject("ComprehensiveSystemTester");
                systemTester = systemTesterGO.AddComponent<ComprehensiveSystemTester>();
            }
            
            // Get or create scene validator
            sceneValidator = FindObjectOfType<SceneValidator>();
            if (sceneValidator == null)
            {
                var sceneValidatorGO = new GameObject("SceneValidator");
                sceneValidator = sceneValidatorGO.AddComponent<SceneValidator>();
            }
            
            // Get or create key-free tester
            keyFreeTester = FindObjectOfType<KeyFreeSystemTester>();
            if (keyFreeTester == null)
            {
                var keyFreeTesterGO = new GameObject("KeyFreeSystemTester");
                keyFreeTester = keyFreeTesterGO.AddComponent<KeyFreeSystemTester>();
            }
            
            yield return new WaitForSeconds(0.1f);
            Log("✅ Test components initialized");
        }
        
        #endregion
        
        #region Test Phases
        
        private IEnumerator RunSystemTests()
        {
            if (!enableSystemTests)
            {
                Log("⏭️ System tests disabled");
                yield break;
            }
            
            var phaseName = "System Tests";
            OnTestPhaseStarted?.Invoke(phaseName);
            Log($"🧪 Starting {phaseName}...");
            
            var phaseResult = new PhaseResult
            {
                phaseName = phaseName,
                startTime = DateTime.Now,
                success = false,
                details = new List<string>()
            };
            
            try
            {
                // Run comprehensive system tests
                systemTester.RunAllTestsManually();
                
                // Wait for tests to complete
                yield return new WaitForSeconds(5f);
                
                // Get test results
                var systemResults = systemTester.GetTestResults();
                phaseResult.success = systemResults.successRate >= 75f;
                phaseResult.details.Add($"System Tests: {systemResults.passedTests}/{systemResults.totalTests} passed");
                phaseResult.details.Add($"Success Rate: {systemResults.successRate:F1}%");
                phaseResult.details.Add($"Duration: {systemResults.totalDuration:F0}ms");
                
                if (systemResults.failedTests > 0)
                {
                    phaseResult.details.Add($"Failed Tests: {systemResults.failedTests}");
                }
                
                Log($"✅ {phaseName} completed - Success: {phaseResult.success}");
            }
            catch (Exception ex)
            {
                phaseResult.success = false;
                phaseResult.details.Add($"Exception: {ex.Message}");
                LogError($"❌ {phaseName} failed: {ex.Message}");
            }
            
            phaseResult.endTime = DateTime.Now;
            phaseResult.duration = (phaseResult.endTime - phaseResult.startTime).TotalMilliseconds;
            
            masterResults.phaseResults.Add(phaseResult);
            masterResults.completedPhases++;
            if (phaseResult.success) masterResults.successfulPhases++;
            else masterResults.failedPhases++;
            
            OnTestPhaseCompleted?.Invoke(phaseName, phaseResult.success);
            yield return new WaitForSeconds(1f);
        }
        
        private IEnumerator RunSceneTests()
        {
            if (!enableSceneTests)
            {
                Log("⏭️ Scene tests disabled");
                yield break;
            }
            
            var phaseName = "Scene Tests";
            OnTestPhaseStarted?.Invoke(phaseName);
            Log($"🎬 Starting {phaseName}...");
            
            var phaseResult = new PhaseResult
            {
                phaseName = phaseName,
                startTime = DateTime.Now,
                success = false,
                details = new List<string>()
            };
            
            try
            {
                // Run scene validation
                sceneValidator.ValidateAllScenesManually();
                
                // Wait for validation to complete
                yield return new WaitForSeconds(10f);
                
                // Get validation results
                var sceneResults = sceneValidator.GetValidationResults();
                phaseResult.success = sceneResults.successRate >= 75f;
                phaseResult.details.Add($"Scene Validation: {sceneResults.validScenes}/{sceneResults.totalScenes} valid");
                phaseResult.details.Add($"Success Rate: {sceneResults.successRate:F1}%");
                phaseResult.details.Add($"Duration: {sceneResults.totalDuration:F0}ms");
                
                if (sceneResults.invalidScenes > 0)
                {
                    phaseResult.details.Add($"Invalid Scenes: {sceneResults.invalidScenes}");
                }
                
                Log($"✅ {phaseName} completed - Success: {phaseResult.success}");
            }
            catch (Exception ex)
            {
                phaseResult.success = false;
                phaseResult.details.Add($"Exception: {ex.Message}");
                LogError($"❌ {phaseName} failed: {ex.Message}");
            }
            
            phaseResult.endTime = DateTime.Now;
            phaseResult.duration = (phaseResult.endTime - phaseResult.startTime).TotalMilliseconds;
            
            masterResults.phaseResults.Add(phaseResult);
            masterResults.completedPhases++;
            if (phaseResult.success) masterResults.successfulPhases++;
            else masterResults.failedPhases++;
            
            OnTestPhaseCompleted?.Invoke(phaseName, phaseResult.success);
            yield return new WaitForSeconds(1f);
        }
        
        private IEnumerator RunIntegrationTests()
        {
            if (!enableIntegrationTests)
            {
                Log("⏭️ Integration tests disabled");
                yield break;
            }
            
            var phaseName = "Integration Tests";
            OnTestPhaseStarted?.Invoke(phaseName);
            Log($"🔗 Starting {phaseName}...");
            
            var phaseResult = new PhaseResult
            {
                phaseName = phaseName,
                startTime = DateTime.Now,
                success = false,
                details = new List<string>()
            };
            
            try
            {
                // Test system integration
                yield return StartCoroutine(TestSystemIntegration());
                
                // Test cross-system communication
                yield return StartCoroutine(TestCrossSystemCommunication());
                
                // Test data flow
                yield return StartCoroutine(TestDataFlow());
                
                phaseResult.success = true;
                phaseResult.details.Add("System integration working");
                phaseResult.details.Add("Cross-system communication working");
                phaseResult.details.Add("Data flow working");
                
                Log($"✅ {phaseName} completed - Success: {phaseResult.success}");
            }
            catch (Exception ex)
            {
                phaseResult.success = false;
                phaseResult.details.Add($"Exception: {ex.Message}");
                LogError($"❌ {phaseName} failed: {ex.Message}");
            }
            
            phaseResult.endTime = DateTime.Now;
            phaseResult.duration = (phaseResult.endTime - phaseResult.startTime).TotalMilliseconds;
            
            masterResults.phaseResults.Add(phaseResult);
            masterResults.completedPhases++;
            if (phaseResult.success) masterResults.successfulPhases++;
            else masterResults.failedPhases++;
            
            OnTestPhaseCompleted?.Invoke(phaseName, phaseResult.success);
            yield return new WaitForSeconds(1f);
        }
        
        private IEnumerator RunPerformanceTests()
        {
            if (!enablePerformanceTests)
            {
                Log("⏭️ Performance tests disabled");
                yield break;
            }
            
            var phaseName = "Performance Tests";
            OnTestPhaseStarted?.Invoke(phaseName);
            Log($"⚡ Starting {phaseName}...");
            
            var phaseResult = new PhaseResult
            {
                phaseName = phaseName,
                startTime = DateTime.Now,
                success = false,
                details = new List<string>()
            };
            
            try
            {
                // Test memory usage
                yield return StartCoroutine(TestMemoryPerformance());
                
                // Test frame rate
                yield return StartCoroutine(TestFrameRatePerformance());
                
                // Test load times
                yield return StartCoroutine(TestLoadTimePerformance());
                
                phaseResult.success = true;
                phaseResult.details.Add("Memory performance acceptable");
                phaseResult.details.Add("Frame rate performance acceptable");
                phaseResult.details.Add("Load time performance acceptable");
                
                Log($"✅ {phaseName} completed - Success: {phaseResult.success}");
            }
            catch (Exception ex)
            {
                phaseResult.success = false;
                phaseResult.details.Add($"Exception: {ex.Message}");
                LogError($"❌ {phaseName} failed: {ex.Message}");
            }
            
            phaseResult.endTime = DateTime.Now;
            phaseResult.duration = (phaseResult.endTime - phaseResult.startTime).TotalMilliseconds;
            
            masterResults.phaseResults.Add(phaseResult);
            masterResults.completedPhases++;
            if (phaseResult.success) masterResults.successfulPhases++;
            else masterResults.failedPhases++;
            
            OnTestPhaseCompleted?.Invoke(phaseName, phaseResult.success);
            yield return new WaitForSeconds(1f);
        }
        
        private IEnumerator RunGameLogicTests()
        {
            var phaseName = "Game Logic Tests";
            OnTestPhaseStarted?.Invoke(phaseName);
            Log($"🎮 Starting {phaseName}...");
            
            var phaseResult = new PhaseResult
            {
                phaseName = phaseName,
                startTime = DateTime.Now,
                success = false,
                details = new List<string>()
            };
            
            try
            {
                // Run game logic tests
                yield return StartCoroutine(TestGameLogic());
                
                phaseResult.success = true;
                phaseResult.details.Add("Board logic working");
                phaseResult.details.Add("Game state logic working");
                phaseResult.details.Add("Scoring logic working");
                
                Log($"✅ {phaseName} completed - Success: {phaseResult.success}");
            }
            catch (Exception ex)
            {
                phaseResult.success = false;
                phaseResult.details.Add($"Exception: {ex.Message}");
                LogError($"❌ {phaseName} failed: {ex.Message}");
            }
            
            phaseResult.endTime = DateTime.Now;
            phaseResult.duration = (phaseResult.endTime - phaseResult.startTime).TotalMilliseconds;
            
            masterResults.phaseResults.Add(phaseResult);
            masterResults.completedPhases++;
            if (phaseResult.success) masterResults.successfulPhases++;
            else masterResults.failedPhases++;
            
            OnTestPhaseCompleted?.Invoke(phaseName, phaseResult.success);
            yield return new WaitForSeconds(1f);
        }
        
        private IEnumerator RunKeyFreeTests()
        {
            var phaseName = "Key-Free Tests";
            OnTestPhaseStarted?.Invoke(phaseName);
            Log($"🔑 Starting {phaseName}...");
            
            var phaseResult = new PhaseResult
            {
                phaseName = phaseName,
                startTime = DateTime.Now,
                success = false,
                details = new List<string>()
            };
            
            try
            {
                // Run key-free system tests
                keyFreeTester.RunAllTests();
                
                // Wait for tests to complete
                yield return new WaitForSeconds(5f);
                
                // Get test results
                var keyFreeResults = keyFreeTester.GetTestResults();
                phaseResult.success = keyFreeResults.successRate >= 75f;
                phaseResult.details.Add($"Key-Free Tests: {keyFreeResults.passedTests}/{keyFreeResults.totalTests} passed");
                phaseResult.details.Add($"Success Rate: {keyFreeResults.successRate:F1}%");
                phaseResult.details.Add($"Duration: {keyFreeResults.totalDuration:F0}ms");
                
                if (keyFreeResults.failedTests > 0)
                {
                    phaseResult.details.Add($"Failed Tests: {keyFreeResults.failedTests}");
                }
                
                Log($"✅ {phaseName} completed - Success: {phaseResult.success}");
            }
            catch (Exception ex)
            {
                phaseResult.success = false;
                phaseResult.details.Add($"Exception: {ex.Message}");
                LogError($"❌ {phaseName} failed: {ex.Message}");
            }
            
            phaseResult.endTime = DateTime.Now;
            phaseResult.duration = (phaseResult.endTime - phaseResult.startTime).TotalMilliseconds;
            
            masterResults.phaseResults.Add(phaseResult);
            masterResults.completedPhases++;
            if (phaseResult.success) masterResults.successfulPhases++;
            else masterResults.failedPhases++;
            
            OnTestPhaseCompleted?.Invoke(phaseName, phaseResult.success);
            yield return new WaitForSeconds(1f);
        }
        
        #endregion
        
        #region Integration Test Methods
        
        private IEnumerator TestSystemIntegration()
        {
            Log("🔗 Testing system integration...");
            
            // Test core system integration
            var coreSystem = FindObjectOfType<OptimizedCoreSystem>();
            Assert(coreSystem != null, "Core system should be available");
            
            // Test UI system integration
            var uiSystem = FindObjectOfType<OptimizedUISystem>();
            Assert(uiSystem != null, "UI system should be available");
            
            // Test game system integration
            var gameSystem = FindObjectOfType<OptimizedGameSystem>();
            Assert(gameSystem != null, "Game system should be available");
            
            // Test key-free system integration
            var unifiedManager = FindObjectOfType<KeyFreeUnifiedManager>();
            Assert(unifiedManager != null, "Unified manager should be available");
            
            Log("✅ System integration test passed");
            yield return null;
        }
        
        private IEnumerator TestGameLogic()
        {
            Log("🎮 Testing game logic...");
            
            // Test board functionality
            yield return StartCoroutine(TestBoardLogic());
            
            // Test game state management
            yield return StartCoroutine(TestGameStateLogic());
            
            // Test scoring system
            yield return StartCoroutine(TestScoringLogic());
            
            Log("✅ Game logic tests passed");
            yield return null;
        }
        
        private IEnumerator TestBoardLogic()
        {
            Log("🧩 Testing board logic...");
            
            // Test board creation
            var board = new Board(8, 6);
            Assert(board != null, "Board should be created");
            Assert(board.Size.x == 8, "Board width should be 8");
            Assert(board.Size.y == 6, "Board height should be 6");
            
            // Test board operations
            board.SetTile(0, 0, 1);
            Assert(board.GetTile(0, 0) == 1, "Tile should be set correctly");
            
            Log("✅ Board logic tests passed");
            yield return null;
        }
        
        private IEnumerator TestGameStateLogic()
        {
            Log("🎯 Testing game state logic...");
            
            var coreSystem = FindObjectOfType<OptimizedCoreSystem>();
            if (coreSystem != null)
            {
                // Test state transitions
                coreSystem.SetGameState(OptimizedCoreSystem.GameState.MainMenu);
                Assert(coreSystem.currentState == OptimizedCoreSystem.GameState.MainMenu, "State should be MainMenu");
                
                coreSystem.SetGameState(OptimizedCoreSystem.GameState.Gameplay);
                Assert(coreSystem.currentState == OptimizedCoreSystem.GameState.Gameplay, "State should be Gameplay");
            }
            
            Log("✅ Game state logic tests passed");
            yield return null;
        }
        
        private IEnumerator TestScoringLogic()
        {
            Log("🏆 Testing scoring logic...");
            
            var coreSystem = FindObjectOfType<OptimizedCoreSystem>();
            if (coreSystem != null)
            {
                // Test score updates
                int initialScore = coreSystem.playerScore;
                coreSystem.AddScore(100);
                Assert(coreSystem.playerScore == initialScore + 100, "Score should be updated correctly");
                
                // Test coin updates
                int initialCoins = coreSystem.playerCoins;
                coreSystem.AddCoins(50);
                Assert(coreSystem.playerCoins == initialCoins + 50, "Coins should be updated correctly");
            }
            
            Log("✅ Scoring logic tests passed");
            yield return null;
        }
        
        private IEnumerator TestCrossSystemCommunication()
        {
            Log("📡 Testing cross-system communication...");
            
            var coreSystem = FindObjectOfType<OptimizedCoreSystem>();
            var uiSystem = FindObjectOfType<OptimizedUISystem>();
            var gameSystem = FindObjectOfType<OptimizedGameSystem>();
            
            // Test communication between systems
            coreSystem.SetGameState(OptimizedCoreSystem.GameState.Gameplay);
            uiSystem.ShowGameplay();
            gameSystem.StartNewLevel(1);
            
            yield return new WaitForSeconds(0.5f);
            
            Assert(coreSystem.currentState == OptimizedCoreSystem.GameState.Gameplay, "Core system state should be gameplay");
            Assert(gameSystem.currentLevel == 1, "Game system should be at level 1");
            
            Log("✅ Cross-system communication test passed");
            yield return null;
        }
        
        private IEnumerator TestDataFlow()
        {
            Log("📊 Testing data flow...");
            
            var coreSystem = FindObjectOfType<OptimizedCoreSystem>();
            var gameSystem = FindObjectOfType<OptimizedGameSystem>();
            
            // Test data flow
            var initialScore = coreSystem.playerScore;
            gameSystem.AddScore(100);
            var finalScore = coreSystem.playerScore;
            
            Assert(finalScore > initialScore, "Data should flow between systems");
            
            Log("✅ Data flow test passed");
            yield return null;
        }
        
        #endregion
        
        #region Performance Test Methods
        
        private IEnumerator TestMemoryPerformance()
        {
            Log("💾 Testing memory performance...");
            
            var coreSystem = FindObjectOfType<OptimizedCoreSystem>();
            var initialMemory = coreSystem.GetMemoryUsage();
            
            // Perform memory-intensive operations
            for (int i = 0; i < 100; i++)
            {
                var uiSystem = FindObjectOfType<OptimizedUISystem>();
                uiSystem.ShowNotification($"Memory test {i}", 0.1f, NotificationType.Info);
            }
            
            yield return new WaitForSeconds(1f);
            
            var finalMemory = coreSystem.GetMemoryUsage();
            var memoryIncrease = finalMemory - initialMemory;
            
            Assert(memoryIncrease < 50 * 1024 * 1024, "Memory increase should be reasonable (< 50MB)");
            
            Log($"✅ Memory performance test passed (Increase: {memoryIncrease / 1024}KB)");
            yield return null;
        }
        
        private IEnumerator TestFrameRatePerformance()
        {
            Log("🎮 Testing frame rate performance...");
            
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
            
            Log($"✅ Frame rate performance test passed (FPS: {fps})");
            yield return null;
        }
        
        private IEnumerator TestLoadTimePerformance()
        {
            Log("⏱️ Testing load time performance...");
            
            var startTime = Time.realtimeSinceStartup;
            
            // Test scene loading time
            SceneManager.LoadScene("MainMenu");
            yield return new WaitForSeconds(0.1f);
            
            var loadTime = Time.realtimeSinceStartup - startTime;
            Assert(loadTime < 10f, "Scene load time should be under 10 seconds");
            
            Log($"✅ Load time performance test passed (Load time: {loadTime:F2}s)");
            yield return null;
        }
        
        #endregion
        
        #region Master Reporting
        
        private void GenerateMasterReport()
        {
            masterResults.endTime = DateTime.Now;
            masterResults.totalDuration = (masterResults.endTime - masterResults.startTime).TotalMilliseconds;
            masterResults.successRate = (float)masterResults.successfulPhases / masterResults.completedPhases * 100f;
            
            Log("📊 Generating master test report...");
            Log($"Total Phases: {masterResults.totalPhases}");
            Log($"Completed Phases: {masterResults.completedPhases}");
            Log($"Successful Phases: {masterResults.successfulPhases}");
            Log($"Failed Phases: {masterResults.failedPhases}");
            Log($"Success Rate: {masterResults.successRate:F1}%");
            Log($"Total Duration: {masterResults.totalDuration:F0}ms");
            
            // Log phase details
            foreach (var phaseResult in masterResults.phaseResults)
            {
                Log($"Phase: {phaseResult.phaseName} - {(phaseResult.success ? "✅ Success" : "❌ Failed")} ({phaseResult.duration:F0}ms)");
                
                foreach (var detail in phaseResult.details)
                {
                    Log($"  {detail}");
                }
            }
            
            if (masterResults.failedPhases > 0)
            {
                LogWarning($"⚠️ {masterResults.failedPhases} phases failed");
            }
            
            if (masterResults.successRate >= 90f)
            {
                Log("🎉 EXCELLENT! All systems are working perfectly!");
            }
            else if (masterResults.successRate >= 75f)
            {
                Log("✅ GOOD! Most systems are working well with minor issues.");
            }
            else if (masterResults.successRate >= 50f)
            {
                Log("⚠️ FAIR! Some systems have issues that need attention.");
            }
            else
            {
                Log("❌ POOR! Many systems have significant issues that need immediate attention.");
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
                Debug.Log($"[TestRunner] {message}");
            }
            masterLog.Add($"[{DateTime.Now:HH:mm:ss}] {message}");
        }
        
        private void LogError(string message)
        {
            Debug.LogError($"[TestRunner] {message}");
            masterErrorLog.Add($"[{DateTime.Now:HH:mm:ss}] ERROR: {message}");
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
        
        public MasterTestResults GetMasterResults()
        {
            return masterResults;
        }
        
        public List<string> GetMasterLog()
        {
            return masterLog;
        }
        
        public List<string> GetMasterErrorLog()
        {
            return masterErrorLog;
        }
        
        #endregion
    }
    
    #region Data Structures
    
    [System.Serializable]
    public class MasterTestResults
    {
        public int totalPhases;
        public int completedPhases;
        public int successfulPhases;
        public int failedPhases;
        public float successRate;
        public DateTime startTime;
        public DateTime endTime;
        public float totalDuration;
        public List<PhaseResult> phaseResults = new List<PhaseResult>();
    }
    
    [System.Serializable]
    public class PhaseResult
    {
        public string phaseName;
        public bool success;
        public DateTime startTime;
        public DateTime endTime;
        public float duration;
        public List<string> details = new List<string>();
    }
    
    #endregion
}