using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Reflection;

namespace Evergreen.Testing
{
    [System.Serializable]
    public class TestResult
    {
        public string testId;
        public string testName;
        public TestStatus status;
        public string message;
        public float executionTime;
        public DateTime timestamp;
        public Dictionary<string, object> data = new Dictionary<string, object>();
        public List<string> errors = new List<string>();
        public List<string> warnings = new List<string>();
    }
    
    public enum TestStatus
    {
        NotRun,
        Running,
        Passed,
        Failed,
        Skipped,
        Error
    }
    
    [System.Serializable]
    public class TestSuite
    {
        public string suiteId;
        public string suiteName;
        public List<string> testIds = new List<string>();
        public TestStatus status;
        public float totalExecutionTime;
        public int passedTests;
        public int failedTests;
        public int skippedTests;
        public int errorTests;
        public DateTime startTime;
        public DateTime endTime;
    }
    
    [System.Serializable]
    public class TestConfiguration
    {
        public bool enableUnitTests = true;
        public bool enableIntegrationTests = true;
        public bool enablePerformanceTests = true;
        public bool enableStressTests = true;
        public bool enableRegressionTests = true;
        public bool enableAutomatedTests = true;
        public float testTimeout = 30f;
        public int maxRetries = 3;
        public bool stopOnFirstFailure = false;
        public bool enableParallelExecution = true;
        public int maxConcurrentTests = 5;
        public bool enableDetailedLogging = true;
        public bool enableTestReports = true;
    }
    
    [System.Serializable]
    public class TestReport
    {
        public string reportId;
        public string reportName;
        public DateTime generatedAt;
        public TestConfiguration configuration;
        public List<TestSuite> testSuites = new List<TestSuite>();
        public List<TestResult> allTests = new List<TestResult>();
        public TestSummary summary = new TestSummary();
        public Dictionary<string, object> metadata = new Dictionary<string, object>();
    }
    
    [System.Serializable]
    public class TestSummary
    {
        public int totalTests;
        public int passedTests;
        public int failedTests;
        public int skippedTests;
        public int errorTests;
        public float totalExecutionTime;
        public float averageExecutionTime;
        public float successRate;
        public DateTime startTime;
        public DateTime endTime;
        public List<string> criticalFailures = new List<string>();
        public List<string> performanceIssues = new List<string>();
    }
    
    public class TestFramework : MonoBehaviour
    {
        [Header("Test Configuration")]
        public TestConfiguration testConfiguration = new TestConfiguration();
        public bool runTestsOnStart = false;
        public bool runTestsInEditor = true;
        public bool enableTestUI = true;
        
        [Header("Test Categories")]
        public bool enableSystemTests = true;
        public bool enableIntegrationTests = true;
        public bool enablePerformanceTests = true;
        public bool enableUserInterfaceTests = true;
        public bool enableDataTests = true;
        public bool enableNetworkTests = true;
        
        public static TestFramework Instance { get; private set; }
        
        private Dictionary<string, TestResult> testResults = new Dictionary<string, TestResult>();
        private Dictionary<string, TestSuite> testSuites = new Dictionary<string, TestSuite>();
        private List<ITestCase> testCases = new List<ITestCase>();
        private TestReport currentReport;
        private bool isRunningTests = false;
        
        private Coroutine testExecutionCoroutine;
        
        // Test Categories
        private SystemTests systemTests;
        private IntegrationTests integrationTests;
        private PerformanceTests performanceTests;
        private UserInterfaceTests userInterfaceTests;
        private DataTests dataTests;
        private NetworkTests networkTests;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeTestFramework();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            InitializeTestCategories();
            RegisterTestCases();
            
            if (runTestsOnStart)
            {
                StartCoroutine(RunAllTests());
            }
        }
        
        private void InitializeTestFramework()
        {
            // Initialize test framework
            Debug.Log("Test Framework initialized");
        }
        
        private void InitializeTestCategories()
        {
            // Initialize test categories
            if (enableSystemTests)
            {
                systemTests = gameObject.AddComponent<SystemTests>();
            }
            
            if (enableIntegrationTests)
            {
                integrationTests = gameObject.AddComponent<IntegrationTests>();
            }
            
            if (enablePerformanceTests)
            {
                performanceTests = gameObject.AddComponent<PerformanceTests>();
            }
            
            if (enableUserInterfaceTests)
            {
                userInterfaceTests = gameObject.AddComponent<UserInterfaceTests>();
            }
            
            if (enableDataTests)
            {
                dataTests = gameObject.AddComponent<DataTests>();
            }
            
            if (enableNetworkTests)
            {
                networkTests = gameObject.AddComponent<NetworkTests>();
            }
        }
        
        private void RegisterTestCases()
        {
            // Register all test cases
            RegisterSystemTests();
            RegisterIntegrationTests();
            RegisterPerformanceTests();
            RegisterUserInterfaceTests();
            RegisterDataTests();
            RegisterNetworkTests();
        }
        
        private void RegisterSystemTests()
        {
            if (systemTests == null) return;
            
            // AI Personalization Tests
            RegisterTest("ai_personalization_initialization", "AI Personalization Initialization", systemTests.TestAIPersonalizationInitialization);
            RegisterTest("ai_personalization_learning", "AI Personalization Learning", systemTests.TestAIPersonalizationLearning);
            RegisterTest("ai_personalization_adaptation", "AI Personalization Adaptation", systemTests.TestAIPersonalizationAdaptation);
            
            // Living World Tests
            RegisterTest("living_world_initialization", "Living World Initialization", systemTests.TestLivingWorldInitialization);
            RegisterTest("living_world_weather", "Living World Weather", systemTests.TestLivingWorldWeather);
            RegisterTest("living_world_npcs", "Living World NPCs", systemTests.TestLivingWorldNPCs);
            
            // Social Revolution Tests
            RegisterTest("social_revolution_initialization", "Social Revolution Initialization", systemTests.TestSocialRevolutionInitialization);
            RegisterTest("social_revolution_content", "Social Revolution Content", systemTests.TestSocialRevolutionContent);
            RegisterTest("social_revolution_guilds", "Social Revolution Guilds", systemTests.TestSocialRevolutionGuilds);
            
            // Subscription Model Tests
            RegisterTest("subscription_model_initialization", "Subscription Model Initialization", systemTests.TestSubscriptionModelInitialization);
            RegisterTest("subscription_model_plans", "Subscription Model Plans", systemTests.TestSubscriptionModelPlans);
            RegisterTest("subscription_model_billing", "Subscription Model Billing", systemTests.TestSubscriptionModelBilling);
            
            // Hybrid Gameplay Tests
            RegisterTest("hybrid_gameplay_initialization", "Hybrid Gameplay Initialization", systemTests.TestHybridGameplayInitialization);
            RegisterTest("hybrid_gameplay_rpg", "Hybrid Gameplay RPG", systemTests.TestHybridGameplayRPG);
            RegisterTest("hybrid_gameplay_racing", "Hybrid Gameplay Racing", systemTests.TestHybridGameplayRacing);
            RegisterTest("hybrid_gameplay_strategy", "Hybrid Gameplay Strategy", systemTests.TestHybridGameplayStrategy);
            
            // Cloud Gaming Tests
            RegisterTest("cloud_gaming_initialization", "Cloud Gaming Initialization", systemTests.TestCloudGamingInitialization);
            RegisterTest("cloud_gaming_sessions", "Cloud Gaming Sessions", systemTests.TestCloudGamingSessions);
            RegisterTest("cloud_gaming_sync", "Cloud Gaming Sync", systemTests.TestCloudGamingSync);
            
            // AR Mode Tests
            RegisterTest("ar_mode_initialization", "AR Mode Initialization", systemTests.TestARModeInitialization);
            RegisterTest("ar_mode_tracking", "AR Mode Tracking", systemTests.TestARModeTracking);
            RegisterTest("ar_mode_objects", "AR Mode Objects", systemTests.TestARModeObjects);
            
            // Voice Commands Tests
            RegisterTest("voice_commands_initialization", "Voice Commands Initialization", systemTests.TestVoiceCommandsInitialization);
            RegisterTest("voice_commands_recognition", "Voice Commands Recognition", systemTests.TestVoiceCommandsRecognition);
            RegisterTest("voice_commands_execution", "Voice Commands Execution", systemTests.TestVoiceCommandsExecution);
            
            // 3D Graphics Tests
            RegisterTest("graphics_initialization", "3D Graphics Initialization", systemTests.TestGraphicsInitialization);
            RegisterTest("graphics_raytracing", "3D Graphics Ray Tracing", systemTests.TestGraphicsRayTracing);
            RegisterTest("graphics_procedural", "3D Graphics Procedural", systemTests.TestGraphicsProcedural);
        }
        
        private void RegisterIntegrationTests()
        {
            if (integrationTests == null) return;
            
            // Game Integration Tests
            RegisterTest("game_integration_initialization", "Game Integration Initialization", integrationTests.TestGameIntegrationInitialization);
            RegisterTest("game_integration_communication", "Game Integration Communication", integrationTests.TestGameIntegrationCommunication);
            RegisterTest("game_integration_state", "Game Integration State", integrationTests.TestGameIntegrationState);
            
            // UI Integration Tests
            RegisterTest("ui_integration_initialization", "UI Integration Initialization", integrationTests.TestUIIntegrationInitialization);
            RegisterTest("ui_integration_themes", "UI Integration Themes", integrationTests.TestUIIntegrationThemes);
            RegisterTest("ui_integration_animations", "UI Integration Animations", integrationTests.TestUIIntegrationAnimations);
            
            // Data Pipeline Tests
            RegisterTest("data_pipeline_initialization", "Data Pipeline Initialization", integrationTests.TestDataPipelineInitialization);
            RegisterTest("data_pipeline_flow", "Data Pipeline Flow", integrationTests.TestDataPipelineFlow);
            RegisterTest("data_pipeline_validation", "Data Pipeline Validation", integrationTests.TestDataPipelineValidation);
            
            // Performance Integration Tests
            RegisterTest("performance_integration_initialization", "Performance Integration Initialization", integrationTests.TestPerformanceIntegrationInitialization);
            RegisterTest("performance_integration_monitoring", "Performance Integration Monitoring", integrationTests.TestPerformanceIntegrationMonitoring);
            RegisterTest("performance_integration_optimization", "Performance Integration Optimization", integrationTests.TestPerformanceIntegrationOptimization);
            
            // Analytics Integration Tests
            RegisterTest("analytics_integration_initialization", "Analytics Integration Initialization", integrationTests.TestAnalyticsIntegrationInitialization);
            RegisterTest("analytics_integration_tracking", "Analytics Integration Tracking", integrationTests.TestAnalyticsIntegrationTracking);
            RegisterTest("analytics_integration_reports", "Analytics Integration Reports", integrationTests.TestAnalyticsIntegrationReports);
        }
        
        private void RegisterPerformanceTests()
        {
            if (performanceTests == null) return;
            
            // FPS Tests
            RegisterTest("performance_fps_target", "Performance FPS Target", performanceTests.TestFPSTarget);
            RegisterTest("performance_fps_stability", "Performance FPS Stability", performanceTests.TestFPSStability);
            
            // Memory Tests
            RegisterTest("performance_memory_usage", "Performance Memory Usage", performanceTests.TestMemoryUsage);
            RegisterTest("performance_memory_leaks", "Performance Memory Leaks", performanceTests.TestMemoryLeaks);
            
            // CPU Tests
            RegisterTest("performance_cpu_usage", "Performance CPU Usage", performanceTests.TestCPUUsage);
            RegisterTest("performance_cpu_spikes", "Performance CPU Spikes", performanceTests.TestCPUSpikes);
            
            // GPU Tests
            RegisterTest("performance_gpu_usage", "Performance GPU Usage", performanceTests.TestGPUUsage);
            RegisterTest("performance_gpu_memory", "Performance GPU Memory", performanceTests.TestGPUMemory);
            
            // Load Tests
            RegisterTest("performance_load_test", "Performance Load Test", performanceTests.TestLoadTest);
            RegisterTest("performance_stress_test", "Performance Stress Test", performanceTests.TestStressTest);
        }
        
        private void RegisterUserInterfaceTests()
        {
            if (userInterfaceTests == null) return;
            
            // UI Component Tests
            RegisterTest("ui_components_rendering", "UI Components Rendering", userInterfaceTests.TestUIComponentsRendering);
            RegisterTest("ui_components_interaction", "UI Components Interaction", userInterfaceTests.TestUIComponentsInteraction);
            RegisterTest("ui_components_accessibility", "UI Components Accessibility", userInterfaceTests.TestUIComponentsAccessibility);
            
            // UI Animation Tests
            RegisterTest("ui_animations_smoothness", "UI Animations Smoothness", userInterfaceTests.TestUIAnimationsSmoothness);
            RegisterTest("ui_animations_performance", "UI Animations Performance", userInterfaceTests.TestUIAnimationsPerformance);
            
            // UI Theme Tests
            RegisterTest("ui_themes_switching", "UI Themes Switching", userInterfaceTests.TestUIThemesSwitching);
            RegisterTest("ui_themes_consistency", "UI Themes Consistency", userInterfaceTests.TestUIThemesConsistency);
        }
        
        private void RegisterDataTests()
        {
            if (dataTests == null) return;
            
            // Data Validation Tests
            RegisterTest("data_validation_integrity", "Data Validation Integrity", dataTests.TestDataValidationIntegrity);
            RegisterTest("data_validation_types", "Data Validation Types", dataTests.TestDataValidationTypes);
            
            // Data Persistence Tests
            RegisterTest("data_persistence_save", "Data Persistence Save", dataTests.TestDataPersistenceSave);
            RegisterTest("data_persistence_load", "Data Persistence Load", dataTests.TestDataPersistenceLoad);
            
            // Data Sync Tests
            RegisterTest("data_sync_consistency", "Data Sync Consistency", dataTests.TestDataSyncConsistency);
            RegisterTest("data_sync_performance", "Data Sync Performance", dataTests.TestDataSyncPerformance);
        }
        
        private void RegisterNetworkTests()
        {
            if (networkTests == null) return;
            
            // Network Connection Tests
            RegisterTest("network_connection_stability", "Network Connection Stability", networkTests.TestNetworkConnectionStability);
            RegisterTest("network_connection_latency", "Network Connection Latency", networkTests.TestNetworkConnectionLatency);
            
            // Cloud Gaming Tests
            RegisterTest("cloud_gaming_connection", "Cloud Gaming Connection", networkTests.TestCloudGamingConnection);
            RegisterTest("cloud_gaming_streaming", "Cloud Gaming Streaming", networkTests.TestCloudGamingStreaming);
        }
        
        private void RegisterTest(string testId, string testName, Func<TestResult> testMethod)
        {
            var testCase = new TestCase
            {
                testId = testId,
                testName = testName,
                testMethod = testMethod
            };
            
            testCases.Add(testCase);
        }
        
        // Test Execution
        public IEnumerator RunAllTests()
        {
            if (isRunningTests)
            {
                Debug.LogWarning("Tests are already running");
                yield break;
            }
            
            isRunningTests = true;
            currentReport = CreateTestReport();
            
            Debug.Log("Starting test execution...");
            
            // Run test suites
            yield return StartCoroutine(RunSystemTests());
            yield return StartCoroutine(RunIntegrationTests());
            yield return StartCoroutine(RunPerformanceTests());
            yield return StartCoroutine(RunUserInterfaceTests());
            yield return StartCoroutine(RunDataTests());
            yield return StartCoroutine(RunNetworkTests());
            
            // Generate final report
            GenerateTestReport();
            
            isRunningTests = false;
            Debug.Log("Test execution completed");
        }
        
        private IEnumerator RunSystemTests()
        {
            if (!enableSystemTests) yield break;
            
            var suite = CreateTestSuite("System Tests");
            currentReport.testSuites.Add(suite);
            
            var systemTestCases = testCases.Where(t => t.testId.StartsWith("ai_") || 
                                                      t.testId.StartsWith("living_") || 
                                                      t.testId.StartsWith("social_") || 
                                                      t.testId.StartsWith("subscription_") || 
                                                      t.testId.StartsWith("hybrid_") || 
                                                      t.testId.StartsWith("cloud_") || 
                                                      t.testId.StartsWith("ar_") || 
                                                      t.testId.StartsWith("voice_") || 
                                                      t.testId.StartsWith("graphics_")).ToList();
            
            yield return StartCoroutine(RunTestSuite(suite, systemTestCases));
        }
        
        private IEnumerator RunIntegrationTests()
        {
            if (!enableIntegrationTests) yield break;
            
            var suite = CreateTestSuite("Integration Tests");
            currentReport.testSuites.Add(suite);
            
            var integrationTestCases = testCases.Where(t => t.testId.StartsWith("game_integration_") || 
                                                           t.testId.StartsWith("ui_integration_") || 
                                                           t.testId.StartsWith("data_pipeline_") || 
                                                           t.testId.StartsWith("performance_integration_") || 
                                                           t.testId.StartsWith("analytics_integration_")).ToList();
            
            yield return StartCoroutine(RunTestSuite(suite, integrationTestCases));
        }
        
        private IEnumerator RunPerformanceTests()
        {
            if (!enablePerformanceTests) yield break;
            
            var suite = CreateTestSuite("Performance Tests");
            currentReport.testSuites.Add(suite);
            
            var performanceTestCases = testCases.Where(t => t.testId.StartsWith("performance_")).ToList();
            
            yield return StartCoroutine(RunTestSuite(suite, performanceTestCases));
        }
        
        private IEnumerator RunUserInterfaceTests()
        {
            if (!enableUserInterfaceTests) yield break;
            
            var suite = CreateTestSuite("User Interface Tests");
            currentReport.testSuites.Add(suite);
            
            var uiTestCases = testCases.Where(t => t.testId.StartsWith("ui_")).ToList();
            
            yield return StartCoroutine(RunTestSuite(suite, uiTestCases));
        }
        
        private IEnumerator RunDataTests()
        {
            if (!enableDataTests) yield break;
            
            var suite = CreateTestSuite("Data Tests");
            currentReport.testSuites.Add(suite);
            
            var dataTestCases = testCases.Where(t => t.testId.StartsWith("data_")).ToList();
            
            yield return StartCoroutine(RunTestSuite(suite, dataTestCases));
        }
        
        private IEnumerator RunNetworkTests()
        {
            if (!enableNetworkTests) yield break;
            
            var suite = CreateTestSuite("Network Tests");
            currentReport.testSuites.Add(suite);
            
            var networkTestCases = testCases.Where(t => t.testId.StartsWith("network_")).ToList();
            
            yield return StartCoroutine(RunTestSuite(suite, networkTestCases));
        }
        
        private IEnumerator RunTestSuite(TestSuite suite, List<ITestCase> testCases)
        {
            suite.startTime = DateTime.Now;
            suite.status = TestStatus.Running;
            
            foreach (var testCase in testCases)
            {
                var result = RunTest(testCase);
                suite.testIds.Add(result.testId);
                currentReport.allTests.Add(result);
                
                // Update suite statistics
                switch (result.status)
                {
                    case TestStatus.Passed:
                        suite.passedTests++;
                        break;
                    case TestStatus.Failed:
                        suite.failedTests++;
                        break;
                    case TestStatus.Skipped:
                        suite.skippedTests++;
                        break;
                    case TestStatus.Error:
                        suite.errorTests++;
                        break;
                }
                
                suite.totalExecutionTime += result.executionTime;
                
                // Stop on first failure if configured
                if (testConfiguration.stopOnFirstFailure && result.status == TestStatus.Failed)
                {
                    suite.status = TestStatus.Failed;
                    suite.endTime = DateTime.Now;
                    yield break;
                }
                
                yield return new WaitForSeconds(0.1f); // Small delay between tests
            }
            
            suite.endTime = DateTime.Now;
            suite.status = suite.failedTests > 0 ? TestStatus.Failed : TestStatus.Passed;
        }
        
        private TestResult RunTest(ITestCase testCase)
        {
            var result = new TestResult
            {
                testId = testCase.testId,
                testName = testCase.testName,
                status = TestStatus.Running,
                timestamp = DateTime.Now
            };
            
            var startTime = Time.realtimeSinceStartup;
            
            try
            {
                var testResult = testCase.Execute();
                result.status = testResult.status;
                result.message = testResult.message;
                result.data = testResult.data;
                result.errors = testResult.errors;
                result.warnings = testResult.warnings;
            }
            catch (Exception e)
            {
                result.status = TestStatus.Error;
                result.message = $"Test execution error: {e.Message}";
                result.errors.Add(e.ToString());
            }
            
            result.executionTime = Time.realtimeSinceStartup - startTime;
            result.timestamp = DateTime.Now;
            
            return result;
        }
        
        // Test Report Generation
        private TestReport CreateTestReport()
        {
            return new TestReport
            {
                reportId = Guid.NewGuid().ToString(),
                reportName = "Comprehensive Test Report",
                generatedAt = DateTime.Now,
                configuration = testConfiguration,
                summary = new TestSummary
                {
                    startTime = DateTime.Now
                }
            };
        }
        
        private TestSuite CreateTestSuite(string suiteName)
        {
            return new TestSuite
            {
                suiteId = Guid.NewGuid().ToString(),
                suiteName = suiteName,
                status = TestStatus.NotRun
            };
        }
        
        private void GenerateTestReport()
        {
            if (currentReport == null) return;
            
            // Calculate summary statistics
            var summary = currentReport.summary;
            summary.totalTests = currentReport.allTests.Count;
            summary.passedTests = currentReport.allTests.Count(t => t.status == TestStatus.Passed);
            summary.failedTests = currentReport.allTests.Count(t => t.status == TestStatus.Failed);
            summary.skippedTests = currentReport.allTests.Count(t => t.status == TestStatus.Skipped);
            summary.errorTests = currentReport.allTests.Count(t => t.status == TestStatus.Error);
            summary.totalExecutionTime = currentReport.allTests.Sum(t => t.executionTime);
            summary.averageExecutionTime = summary.totalTests > 0 ? summary.totalExecutionTime / summary.totalTests : 0f;
            summary.successRate = summary.totalTests > 0 ? (float)summary.passedTests / summary.totalTests * 100f : 0f;
            summary.endTime = DateTime.Now;
            
            // Identify critical failures
            summary.criticalFailures = currentReport.allTests
                .Where(t => t.status == TestStatus.Failed && t.errors.Any())
                .Select(t => t.testName)
                .ToList();
            
            // Identify performance issues
            summary.performanceIssues = currentReport.allTests
                .Where(t => t.executionTime > testConfiguration.testTimeout)
                .Select(t => t.testName)
                .ToList();
            
            // Log report summary
            Debug.Log($"Test Report Generated:");
            Debug.Log($"Total Tests: {summary.totalTests}");
            Debug.Log($"Passed: {summary.passedTests}");
            Debug.Log($"Failed: {summary.failedTests}");
            Debug.Log($"Skipped: {summary.skippedTests}");
            Debug.Log($"Errors: {summary.errorTests}");
            Debug.Log($"Success Rate: {summary.successRate:F2}%");
            Debug.Log($"Total Execution Time: {summary.totalExecutionTime:F2}s");
            
            if (summary.criticalFailures.Any())
            {
                Debug.LogError($"Critical Failures: {string.Join(", ", summary.criticalFailures)}");
            }
            
            if (summary.performanceIssues.Any())
            {
                Debug.LogWarning($"Performance Issues: {string.Join(", ", summary.performanceIssues)}");
            }
        }
        
        // Utility Methods
        public TestResult GetTestResult(string testId)
        {
            return testResults.ContainsKey(testId) ? testResults[testId] : null;
        }
        
        public List<TestResult> GetTestResults(TestStatus status = TestStatus.Passed)
        {
            return currentReport?.allTests.Where(t => t.status == status).ToList() ?? new List<TestResult>();
        }
        
        public TestReport GetCurrentReport()
        {
            return currentReport;
        }
        
        public bool IsTestRunning()
        {
            return isRunningTests;
        }
        
        public void RunSpecificTest(string testId)
        {
            var testCase = testCases.FirstOrDefault(t => t.testId == testId);
            if (testCase != null)
            {
                var result = RunTest(testCase);
                testResults[testId] = result;
                Debug.Log($"Test {testId}: {result.status} - {result.message}");
            }
        }
        
        public void RunTestSuite(string suiteName)
        {
            StartCoroutine(RunTestSuiteByName(suiteName));
        }
        
        private IEnumerator RunTestSuiteByName(string suiteName)
        {
            var suite = testSuites.Values.FirstOrDefault(s => s.suiteName == suiteName);
            if (suite != null)
            {
                var testCases = this.testCases.Where(t => suite.testIds.Contains(t.testId)).ToList();
                yield return StartCoroutine(RunTestSuite(suite, testCases));
            }
        }
        
        void OnDestroy()
        {
            if (testExecutionCoroutine != null)
            {
                StopCoroutine(testExecutionCoroutine);
            }
        }
    }
    
    // Test Case Interface
    public interface ITestCase
    {
        string testId { get; }
        string testName { get; }
        TestResult Execute();
    }
    
    // Test Case Implementation
    public class TestCase : ITestCase
    {
        public string testId { get; set; }
        public string testName { get; set; }
        public Func<TestResult> testMethod { get; set; }
        
        public TestResult Execute()
        {
            return testMethod?.Invoke() ?? new TestResult
            {
                testId = testId,
                testName = testName,
                status = TestStatus.Error,
                message = "Test method not implemented"
            };
        }
    }
}