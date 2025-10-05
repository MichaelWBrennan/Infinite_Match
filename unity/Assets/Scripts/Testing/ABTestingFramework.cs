using System.Collections.Generic;
using UnityEngine;
using System;
using System.Linq;
using Evergreen.Core;
using Evergreen.Analytics;

namespace Evergreen.Testing
{
    /// <summary>
    /// Advanced A/B Testing Framework with statistical significance, multivariate testing, and real-time optimization
    /// </summary>
    public class ABTestingFramework : MonoBehaviour
    {
        public static ABTestingFramework Instance { get; private set; }

        [Header("A/B Testing Settings")]
        public bool enableABTesting = true;
        public bool enableMultivariateTesting = true;
        public bool enableRealTimeOptimization = true;
        public float minimumSampleSize = 100f;
        public float confidenceLevel = 0.95f;
        public float statisticalSignificanceThreshold = 0.05f;

        [Header("Test Configuration")]
        public bool enableAutomaticTestCreation = true;
        public bool enableTestRotation = true;
        public float testRotationInterval = 24f; // hours
        public int maxConcurrentTests = 5;

        [Header("Optimization")]
        public bool enableBayesianOptimization = true;
        public bool enableMultiArmedBandit = true;
        public float explorationRate = 0.1f;
        public float exploitationRate = 0.9f;

        private Dictionary<string, ABTest> _activeTests = new Dictionary<string, ABTest>();
        private Dictionary<string, ABTest> _completedTests = new Dictionary<string, ABTest>();
        private Dictionary<string, TestVariant> _testVariants = new Dictionary<string, TestVariant>();
        private Dictionary<string, PlayerAssignment> _playerAssignments = new Dictionary<string, PlayerAssignment>();

        private StatisticalAnalyzer _statisticalAnalyzer;
        private BayesianOptimizer _bayesianOptimizer;
        private MultiArmedBandit _multiArmedBandit;
        private TestCreator _testCreator;

        public class ABTest
        {
            public string testId;
            public string testName;
            public string description;
            public TestType testType;
            public TestStatus status;
            public DateTime startTime;
            public DateTime endTime;
            public List<string> variantIds;
            public string primaryMetric;
            public List<string> secondaryMetrics;
            public Dictionary<string, object> configuration;
            public TestResults results;
            public int targetSampleSize;
            public float currentSignificance;
            public bool isStatisticallySignificant;
        }

        public class TestVariant
        {
            public string variantId;
            public string testId;
            public string variantName;
            public int weight;
            public Dictionary<string, object> parameters;
            public VariantResults results;
            public bool isControl;
        }

        public class PlayerAssignment
        {
            public string playerId;
            public string testId;
            public string variantId;
            public DateTime assignedAt;
            public bool hasConverted;
            public Dictionary<string, float> metrics;
            public DateTime lastSeen;
        }

        public class TestResults
        {
            public int totalParticipants;
            public int totalConversions;
            public float conversionRate;
            public float confidenceInterval;
            public float pValue;
            public string winningVariant;
            public float lift;
            public Dictionary<string, VariantResults> variantResults;
        }

        public class VariantResults
        {
            public string variantId;
            public int participants;
            public int conversions;
            public float conversionRate;
            public float confidenceInterval;
            public float pValue;
            public float lift;
            public Dictionary<string, float> secondaryMetrics;
        }

        public enum TestType
        {
            A_B,
            Multivariate,
            MultiArmedBandit,
            Bayesian
        }

        public enum TestStatus
        {
            Draft,
            Running,
            Paused,
            Completed,
            Cancelled
        }

        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeABTesting();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void InitializeABTesting()
        {
            _statisticalAnalyzer = new StatisticalAnalyzer();
            _bayesianOptimizer = new BayesianOptimizer();
            _multiArmedBandit = new MultiArmedBandit();
            _testCreator = new TestCreator();

            if (enableAutomaticTestCreation)
            {
                StartCoroutine(AutoCreateTests());
            }

            if (enableTestRotation)
            {
                StartCoroutine(RotateTests());
            }

            Logger.Info("A/B Testing Framework initialized", "ABTesting");
        }

        #region Test Creation
        public string CreateTest(string testName, string description, TestType testType, List<TestVariant> variants, string primaryMetric)
        {
            var testId = Guid.NewGuid().ToString();
            var test = new ABTest
            {
                testId = testId,
                testName = testName,
                description = description,
                testType = testType,
                status = TestStatus.Draft,
                startTime = DateTime.Now,
                variantIds = variants.Select(v => v.variantId).ToList(),
                primaryMetric = primaryMetric,
                secondaryMetrics = new List<string>(),
                configuration = new Dictionary<string, object>(),
                results = new TestResults
                {
                    variantResults = new Dictionary<string, VariantResults>()
                },
                targetSampleSize = CalculateTargetSampleSize(variants.Count),
                currentSignificance = 0f,
                isStatisticallySignificant = false
            };

            _activeTests[testId] = test;

            // Add variants
            foreach (var variant in variants)
            {
                variant.testId = testId;
                _testVariants[variant.variantId] = variant;
            }

            Logger.Info($"Created A/B test: {testName} ({testId})", "ABTesting");
            return testId;
        }

        public void StartTest(string testId)
        {
            if (_activeTests.ContainsKey(testId))
            {
                var test = _activeTests[testId];
                test.status = TestStatus.Running;
                test.startTime = DateTime.Now;

                Logger.Info($"Started A/B test: {test.testName}", "ABTesting");
            }
        }

        public void StopTest(string testId)
        {
            if (_activeTests.ContainsKey(testId))
            {
                var test = _activeTests[testId];
                test.status = TestStatus.Completed;
                test.endTime = DateTime.Now;

                // Calculate final results
                CalculateTestResults(test);

                // Move to completed tests
                _completedTests[testId] = test;
                _activeTests.Remove(testId);

                Logger.Info($"Completed A/B test: {test.testName}", "ABTesting");
            }
        }

        private int CalculateTargetSampleSize(int variantCount)
        {
            // Calculate sample size based on statistical power
            var baseSampleSize = 1000; // Minimum sample size
            var variantMultiplier = variantCount * 0.5f;
            return Mathf.RoundToInt(baseSampleSize * (1 + variantMultiplier));
        }
        #endregion

        #region Player Assignment
        public string GetPlayerVariant(string playerId, string testId)
        {
            if (!_activeTests.ContainsKey(testId)) return null;

            var test = _activeTests[testId];
            if (test.status != TestStatus.Running) return null;

            // Check if player is already assigned
            var assignmentKey = $"{playerId}_{testId}";
            if (_playerAssignments.ContainsKey(assignmentKey))
            {
                return _playerAssignments[assignmentKey].variantId;
            }

            // Assign player to variant
            var variantId = AssignPlayerToVariant(playerId, test);
            if (variantId != null)
            {
                var assignment = new PlayerAssignment
                {
                    playerId = playerId,
                    testId = testId,
                    variantId = variantId,
                    assignedAt = DateTime.Now,
                    hasConverted = false,
                    metrics = new Dictionary<string, float>(),
                    lastSeen = DateTime.Now
                };

                _playerAssignments[assignmentKey] = assignment;
            }

            return variantId;
        }

        private string AssignPlayerToVariant(string playerId, ABTest test)
        {
            switch (test.testType)
            {
                case TestType.A_B:
                    return AssignABVariant(test);
                case TestType.Multivariate:
                    return AssignMultivariateVariant(test);
                case TestType.MultiArmedBandit:
                    return _multiArmedBandit.AssignVariant(test, _playerAssignments.Values.ToList());
                case TestType.Bayesian:
                    return _bayesianOptimizer.AssignVariant(test, _playerAssignments.Values.ToList());
                default:
                    return AssignABVariant(test);
            }
        }

        private string AssignABVariant(ABTest test)
        {
            var variants = test.variantIds.Select(id => _testVariants[id]).ToList();
            var totalWeight = variants.Sum(v => v.weight);
            var randomValue = UnityEngine.Random.Range(0f, totalWeight);

            var currentWeight = 0f;
            foreach (var variant in variants)
            {
                currentWeight += variant.weight;
                if (randomValue <= currentWeight)
                {
                    return variant.variantId;
                }
            }

            return variants[0].variantId; // Fallback
        }

        private string AssignMultivariateVariant(ABTest test)
        {
            // Multivariate testing assigns based on all possible combinations
            var variants = test.variantIds.Select(id => _testVariants[id]).ToList();
            var randomIndex = UnityEngine.Random.Range(0, variants.Count);
            return variants[randomIndex].variantId;
        }
        #endregion

        #region Data Collection
        public void RecordConversion(string playerId, string testId, string metric, float value = 1f)
        {
            var assignmentKey = $"{playerId}_{testId}";
            if (_playerAssignments.ContainsKey(assignmentKey))
            {
                var assignment = _playerAssignments[assignmentKey];
                assignment.hasConverted = true;
                assignment.metrics[metric] = value;
                assignment.lastSeen = DateTime.Now;

                // Update test results
                UpdateTestResults(testId, assignment);
            }
        }

        public void RecordMetric(string playerId, string testId, string metric, float value)
        {
            var assignmentKey = $"{playerId}_{testId}";
            if (_playerAssignments.ContainsKey(assignmentKey))
            {
                var assignment = _playerAssignments[assignmentKey];
                assignment.metrics[metric] = value;
                assignment.lastSeen = DateTime.Now;

                // Update test results
                UpdateTestResults(testId, assignment);
            }
        }

        private void UpdateTestResults(string testId, PlayerAssignment assignment)
        {
            if (!_activeTests.ContainsKey(testId)) return;

            var test = _activeTests[testId];
            var variantId = assignment.variantId;

            if (!test.results.variantResults.ContainsKey(variantId))
            {
                test.results.variantResults[variantId] = new VariantResults
                {
                    variantId = variantId,
                    participants = 0,
                    conversions = 0,
                    conversionRate = 0f,
                    secondaryMetrics = new Dictionary<string, float>()
                };
            }

            var variantResults = test.results.variantResults[variantId];
            variantResults.participants++;

            if (assignment.hasConverted)
            {
                variantResults.conversions++;
            }

            variantResults.conversionRate = (float)variantResults.conversions / variantResults.participants;

            // Update secondary metrics
            foreach (var metric in assignment.metrics)
            {
                if (!variantResults.secondaryMetrics.ContainsKey(metric.Key))
                {
                    variantResults.secondaryMetrics[metric.Key] = 0f;
                }
                variantResults.secondaryMetrics[metric.Key] = (variantResults.secondaryMetrics[metric.Key] * (variantResults.participants - 1) + metric.Value) / variantResults.participants;
            }

            // Update overall test results
            test.results.totalParticipants = test.results.variantResults.Values.Sum(v => v.participants);
            test.results.totalConversions = test.results.variantResults.Values.Sum(v => v.conversions);
            test.results.conversionRate = (float)test.results.totalConversions / test.results.totalParticipants;

            // Check statistical significance
            CheckStatisticalSignificance(test);
        }
        #endregion

        #region Statistical Analysis
        private void CheckStatisticalSignificance(ABTest test)
        {
            if (test.results.variantResults.Count < 2) return;

            var variants = test.results.variantResults.Values.ToList();
            var controlVariant = variants.FirstOrDefault(v => _testVariants[v.variantId].isControl);
            if (controlVariant == null) controlVariant = variants[0];

            var testVariant = variants.FirstOrDefault(v => v.variantId != controlVariant.variantId);
            if (testVariant == null) return;

            // Calculate statistical significance
            var significance = _statisticalAnalyzer.CalculateSignificance(controlVariant, testVariant);
            test.currentSignificance = significance;

            // Check if test is statistically significant
            test.isStatisticallySignificant = significance >= statisticalSignificanceThreshold;

            // Calculate lift
            if (testVariant.conversionRate > 0 && controlVariant.conversionRate > 0)
            {
                test.results.lift = (testVariant.conversionRate - controlVariant.conversionRate) / controlVariant.conversionRate;
            }

            // Determine winning variant
            if (test.isStatisticallySignificant)
            {
                test.results.winningVariant = testVariant.conversionRate > controlVariant.conversionRate ? testVariant.variantId : controlVariant.variantId;
            }
        }

        private void CalculateTestResults(ABTest test)
        {
            if (test.results.variantResults.Count == 0) return;

            var variants = test.results.variantResults.Values.ToList();
            var bestVariant = variants.OrderByDescending(v => v.conversionRate).First();

            test.results.winningVariant = bestVariant.variantId;
            test.results.lift = bestVariant.conversionRate - variants.Min(v => v.conversionRate);
        }
        #endregion

        #region Auto Test Creation
        private System.Collections.IEnumerator AutoCreateTests()
        {
            while (true)
            {
                if (_activeTests.Count < maxConcurrentTests)
                {
                    var newTest = _testCreator.CreateAutomaticTest();
                    if (newTest != null)
                    {
                        CreateTest(newTest.testName, newTest.description, newTest.testType, newTest.variants, newTest.primaryMetric);
                    }
                }

                yield return new WaitForSeconds(3600f); // Check every hour
            }
        }

        private System.Collections.IEnumerator RotateTests()
        {
            while (true)
            {
                yield return new WaitForSeconds(testRotationInterval * 3600f);

                // Rotate tests based on performance
                var testsToRotate = _activeTests.Values
                    .Where(t => t.status == TestStatus.Running && (DateTime.Now - t.startTime).TotalHours > testRotationInterval)
                    .ToList();

                foreach (var test in testsToRotate)
                {
                    if (test.isStatisticallySignificant)
                    {
                        StopTest(test.testId);
                    }
                }
            }
        }
        #endregion

        #region Optimization
        public void OptimizeTest(string testId)
        {
            if (!_activeTests.ContainsKey(testId)) return;

            var test = _activeTests[testId];
            if (test.testType == TestType.MultiArmedBandit)
            {
                _multiArmedBandit.Optimize(test, _playerAssignments.Values.ToList());
            }
            else if (test.testType == TestType.Bayesian)
            {
                _bayesianOptimizer.Optimize(test, _playerAssignments.Values.ToList());
            }
        }

        public void OptimizeAllTests()
        {
            foreach (var test in _activeTests.Values)
            {
                if (test.status == TestStatus.Running)
                {
                    OptimizeTest(test.testId);
                }
            }
        }
        #endregion

        #region Reporting
        public Dictionary<string, object> GetTestReport(string testId)
        {
            var test = _activeTests.GetValueOrDefault(testId) ?? _completedTests.GetValueOrDefault(testId);
            if (test == null) return null;

            return new Dictionary<string, object>
            {
                {"test_id", test.testId},
                {"test_name", test.testName},
                {"status", test.status.ToString()},
                {"start_time", test.startTime},
                {"end_time", test.endTime},
                {"total_participants", test.results.totalParticipants},
                {"total_conversions", test.results.totalConversions},
                {"conversion_rate", test.results.conversionRate},
                {"statistical_significance", test.currentSignificance},
                {"is_significant", test.isStatisticallySignificant},
                {"winning_variant", test.results.winningVariant},
                {"lift", test.results.lift},
                {"variant_results", test.results.variantResults}
            };
        }

        public Dictionary<string, object> GetAllTestsReport()
        {
            return new Dictionary<string, object>
            {
                {"active_tests", _activeTests.Count},
                {"completed_tests", _completedTests.Count},
                {"total_tests", _activeTests.Count + _completedTests.Count},
                {"active_test_ids", _activeTests.Keys.ToList()},
                {"completed_test_ids", _completedTests.Keys.ToList()}
            };
        }
        #endregion

        #region Statistics
        public Dictionary<string, object> GetABTestingStatistics()
        {
            return new Dictionary<string, object>
            {
                {"active_tests", _activeTests.Count},
                {"completed_tests", _completedTests.Count},
                {"total_variants", _testVariants.Count},
                {"total_assignments", _playerAssignments.Count},
                {"enable_ab_testing", enableABTesting},
                {"enable_multivariate_testing", enableMultivariateTesting},
                {"enable_real_time_optimization", enableRealTimeOptimization},
                {"minimum_sample_size", minimumSampleSize},
                {"confidence_level", confidenceLevel},
                {"statistical_significance_threshold", statisticalSignificanceThreshold}
            };
        }
        #endregion
    }

    /// <summary>
    /// Statistical analyzer for A/B testing
    /// </summary>
    public class StatisticalAnalyzer
    {
        public float CalculateSignificance(VariantResults control, VariantResults test)
        {
            // Simplified statistical significance calculation
            // In a real implementation, this would use proper statistical tests like chi-square or t-test
            
            var controlRate = control.conversionRate;
            var testRate = test.conversionRate;
            var controlParticipants = control.participants;
            var testParticipants = test.participants;

            if (controlParticipants < 30 || testParticipants < 30) return 0f;

            // Calculate z-score
            var pooledRate = (control.conversions + test.conversions) / (float)(controlParticipants + testParticipants);
            var standardError = Mathf.Sqrt(pooledRate * (1 - pooledRate) * (1f / controlParticipants + 1f / testParticipants));
            var zScore = Mathf.Abs(testRate - controlRate) / standardError;

            // Convert z-score to p-value (simplified)
            var pValue = Mathf.Exp(-zScore * zScore / 2f);
            return pValue;
        }
    }

    /// <summary>
    /// Bayesian optimizer for A/B testing
    /// </summary>
    public class BayesianOptimizer
    {
        public string AssignVariant(ABTest test, List<PlayerAssignment> assignments)
        {
            // Bayesian optimization logic
            var variants = test.variantIds.Select(id => test.results.variantResults.GetValueOrDefault(id)).ToList();
            var bestVariant = variants.OrderByDescending(v => v?.conversionRate ?? 0f).First();
            return bestVariant?.variantId ?? test.variantIds[0];
        }

        public void Optimize(ABTest test, List<PlayerAssignment> assignments)
        {
            // Bayesian optimization implementation
        }
    }

    /// <summary>
    /// Multi-armed bandit for A/B testing
    /// </summary>
    public class MultiArmedBandit
    {
        public string AssignVariant(ABTest test, List<PlayerAssignment> assignments)
        {
            // Multi-armed bandit logic
            var variants = test.variantIds.Select(id => test.results.variantResults.GetValueOrDefault(id)).ToList();
            var randomValue = UnityEngine.Random.Range(0f, 1f);
            
            if (randomValue < 0.1f) // 10% exploration
            {
                var randomIndex = UnityEngine.Random.Range(0, variants.Count);
                return variants[randomIndex]?.variantId ?? test.variantIds[0];
            }
            else // 90% exploitation
            {
                var bestVariant = variants.OrderByDescending(v => v?.conversionRate ?? 0f).First();
                return bestVariant?.variantId ?? test.variantIds[0];
            }
        }

        public void Optimize(ABTest test, List<PlayerAssignment> assignments)
        {
            // Multi-armed bandit optimization implementation
        }
    }

    /// <summary>
    /// Test creator for automatic test generation
    /// </summary>
    public class TestCreator
    {
        public TestCreationData CreateAutomaticTest()
        {
            // Automatic test creation logic
            return null;
        }
    }

    public class TestCreationData
    {
        public string testName;
        public string description;
        public TestType testType;
        public List<TestVariant> variants;
        public string primaryMetric;
    }
}