using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using Evergreen.Core;

namespace Evergreen.Security
{
    /// <summary>
    /// Enhanced client-side anti-cheat system
    /// Works in conjunction with server validation
    /// </summary>
    public class ClientAntiCheat : MonoBehaviour
    {
        [Header("Anti-Cheat Settings")]
        public bool enableClientAntiCheat = true;
        public bool enableServerValidation = true;
        public float checkInterval = 0.5f;
        public int maxViolationsBeforeReport = 3;
        
        [Header("Detection Settings")]
        public bool enableSpeedHackDetection = true;
        public bool enableMemoryHackDetection = true;
        public bool enableValueValidation = true;
        public bool enableBehaviorAnalysis = true;
        public bool enableInputValidation = true;
        
        [Header("Thresholds")]
        public float speedHackThreshold = 1.5f;
        public float memoryDeviationThreshold = 0.3f;
        public float behaviorAnomalyThreshold = 0.7f;
        public float inputConsistencyThreshold = 0.8f;
        
        [Header("Debug")]
        public bool enableDebugLogs = true;
        public bool enableVisualDebugging = false;
        
        // Detection data
        private Dictionary<string, DetectionData> detectionData = new Dictionary<string, DetectionData>();
        private Dictionary<string, List<float>> frameTimeHistory = new Dictionary<string, List<float>>();
        private Dictionary<string, List<InputData>> inputHistory = new Dictionary<string, List<InputData>>();
        private Dictionary<string, List<GameAction>> actionHistory = new Dictionary<string, List<GameAction>>();
        
        // Violation tracking
        private List<ClientViolation> violations = new List<ClientViolation>();
        private int violationCount = 0;
        
        // Events
        public event Action<ClientViolation> OnViolationDetected;
        public event Action<string> OnCheatDetected;
        public event Action<float> OnRiskScoreUpdated;
        
        public static ClientAntiCheat Instance { get; private set; }
        
        [System.Serializable]
        public class DetectionData
        {
            public string playerId;
            public float lastCheckTime;
            public int violationCount;
            public float riskScore;
            public bool isSuspicious;
            public List<string> detectedCheats = new List<string>();
        }
        
        [System.Serializable]
        public class InputData
        {
            public Vector2 position;
            public float timestamp;
            public float responseTime;
            public string inputType;
        }
        
        [System.Serializable]
        public class GameAction
        {
            public string actionType;
            public Dictionary<string, object> data;
            public float timestamp;
            public float responseTime;
        }
        
        [System.Serializable]
        public class ClientViolation
        {
            public string id;
            public string type;
            public string description;
            public float severity;
            public float confidence;
            public float timestamp;
            public Dictionary<string, object> evidence;
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeAntiCheat();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (enableClientAntiCheat)
            {
                StartCoroutine(AntiCheatCoroutine());
            }
        }
        
        private void InitializeAntiCheat()
        {
            if (enableDebugLogs)
            {
                Debug.Log("[ClientAntiCheat] Initialized client-side anti-cheat system");
            }
        }
        
        private IEnumerator AntiCheatCoroutine()
        {
            while (enableClientAntiCheat)
            {
                yield return new WaitForSeconds(checkInterval);
                
                // Run all detection methods
                if (enableSpeedHackDetection)
                {
                    DetectSpeedHacks();
                }
                
                if (enableMemoryHackDetection)
                {
                    DetectMemoryHacks();
                }
                
                if (enableValueValidation)
                {
                    ValidateGameValues();
                }
                
                if (enableBehaviorAnalysis)
                {
                    AnalyzeBehavior();
                }
                
                if (enableInputValidation)
                {
                    ValidateInput();
                }
                
                // Update risk scores
                UpdateRiskScores();
            }
        }
        
        /// <summary>
        /// Detect speed hacks by monitoring frame time consistency
        /// </summary>
        private void DetectSpeedHacks()
        {
            float currentTime = Time.time;
            float deltaTime = Time.deltaTime;
            float expectedDeltaTime = 1f / 60f; // Expected 60 FPS
            
            // Calculate speed multiplier
            float speedMultiplier = expectedDeltaTime / deltaTime;
            
            // Check if speed is suspiciously high
            if (speedMultiplier > speedHackThreshold)
            {
                RecordViolation("speed_hack", $"Speed multiplier: {speedMultiplier:F2}x", 
                    CalculateSeverity(speedMultiplier, speedHackThreshold), 0.9f,
                    new Dictionary<string, object> { {"speedMultiplier", speedMultiplier} });
            }
            
            // Track frame time history for pattern analysis
            string playerId = GetCurrentPlayerId();
            if (!string.IsNullOrEmpty(playerId))
            {
                if (!frameTimeHistory.ContainsKey(playerId))
                {
                    frameTimeHistory[playerId] = new List<float>();
                }
                
                frameTimeHistory[playerId].Add(deltaTime);
                
                // Keep only last 100 frame times
                if (frameTimeHistory[playerId].Count > 100)
                {
                    frameTimeHistory[playerId].RemoveAt(0);
                }
                
                // Check for consistent speed hacks
                if (frameTimeHistory[playerId].Count >= 10)
                {
                    CheckConsistentSpeedHack(playerId);
                }
            }
        }
        
        /// <summary>
        /// Check for consistent speed hacks over time
        /// </summary>
        private void CheckConsistentSpeedHack(string playerId)
        {
            var frameTimes = frameTimeHistory[playerId];
            var recentFrameTimes = frameTimes.TakeLast(10).ToList();
            
            float avgFrameTime = recentFrameTimes.Average();
            float expectedFrameTime = 1f / 60f;
            float speedMultiplier = expectedFrameTime / avgFrameTime;
            
            if (speedMultiplier > speedHackThreshold)
            {
                // Check consistency
                float variance = recentFrameTimes.Select(ft => Mathf.Pow(ft - avgFrameTime, 2)).Average();
                float standardDeviation = Mathf.Sqrt(variance);
                
                // If speed hack is consistent (low variance), it's more suspicious
                if (standardDeviation < 0.001f) // Very low variance
                {
                    RecordViolation("consistent_speed_hack", 
                        $"Consistent speed hack detected: {speedMultiplier:F2}x", 
                        CalculateSeverity(speedMultiplier, speedHackThreshold), 0.95f,
                        new Dictionary<string, object> 
                        { 
                            {"speedMultiplier", speedMultiplier},
                            {"consistency", 1f - standardDeviation * 1000f}
                        });
                }
            }
        }
        
        /// <summary>
        /// Detect memory hacks by monitoring memory usage patterns
        /// </summary>
        private void DetectMemoryHacks()
        {
            long currentMemory = System.GC.GetTotalMemory(false);
            long expectedMemory = GetExpectedMemoryUsage();
            
            // Calculate memory deviation
            float memoryDeviation = Mathf.Abs(currentMemory - expectedMemory) / (float)expectedMemory;
            
            if (memoryDeviation > memoryDeviationThreshold)
            {
                RecordViolation("memory_hack", 
                    $"Memory usage deviation: {memoryDeviation:P2}", 
                    CalculateSeverity(memoryDeviation, memoryDeviationThreshold), 0.8f,
                    new Dictionary<string, object> 
                    { 
                        {"currentMemory", currentMemory},
                        {"expectedMemory", expectedMemory},
                        {"deviation", memoryDeviation}
                    });
            }
        }
        
        /// <summary>
        /// Validate game values for consistency
        /// </summary>
        private void ValidateGameValues()
        {
            // This would validate game-specific values
            // Implementation depends on your game's value system
            
            // Example: Validate score values
            ValidateScoreValues();
            
            // Example: Validate resource values
            ValidateResourceValues();
        }
        
        /// <summary>
        /// Validate score values
        /// </summary>
        private void ValidateScoreValues()
        {
            // Get current score from game state
            // This is a placeholder - implement based on your game's scoring system
            int currentScore = GetCurrentScore();
            int previousScore = GetPreviousScore();
            
            if (currentScore < 0)
            {
                RecordViolation("negative_score", "Negative score detected", 1.0f, 1.0f,
                    new Dictionary<string, object> { {"score", currentScore} });
            }
            
            if (currentScore > 10000000)
            {
                RecordViolation("impossible_score", "Impossibly high score detected", 1.0f, 1.0f,
                    new Dictionary<string, object> { {"score", currentScore} });
            }
            
            // Check for impossible score increases
            int scoreIncrease = currentScore - previousScore;
            if (scoreIncrease > 10000) // More than 10k points in one action
            {
                RecordViolation("impossible_score_increase", 
                    $"Impossible score increase: {scoreIncrease}", 0.9f, 0.8f,
                    new Dictionary<string, object> 
                    { 
                        {"scoreIncrease", scoreIncrease},
                        {"currentScore", currentScore},
                        {"previousScore", previousScore}
                    });
            }
        }
        
        /// <summary>
        /// Validate resource values
        /// </summary>
        private void ValidateResourceValues()
        {
            // Validate coins
            int currentCoins = GetCurrentCoins();
            if (currentCoins < 0)
            {
                RecordViolation("negative_coins", "Negative coins detected", 1.0f, 1.0f,
                    new Dictionary<string, object> { {"coins", currentCoins} });
            }
            
            if (currentCoins > 1000000)
            {
                RecordViolation("impossible_coins", "Impossibly high coin count", 1.0f, 1.0f,
                    new Dictionary<string, object> { {"coins", currentCoins} });
            }
            
            // Validate gems
            int currentGems = GetCurrentGems();
            if (currentGems < 0)
            {
                RecordViolation("negative_gems", "Negative gems detected", 1.0f, 1.0f,
                    new Dictionary<string, object> { {"gems", currentGems} });
            }
            
            if (currentGems > 100000)
            {
                RecordViolation("impossible_gems", "Impossibly high gem count", 1.0f, 1.0f,
                    new Dictionary<string, object> { {"gems", currentGems} });
            }
        }
        
        /// <summary>
        /// Analyze player behavior for anomalies
        /// </summary>
        private void AnalyzeBehavior()
        {
            string playerId = GetCurrentPlayerId();
            if (string.IsNullOrEmpty(playerId)) return;
            
            // Analyze input patterns
            AnalyzeInputPatterns(playerId);
            
            // Analyze action patterns
            AnalyzeActionPatterns(playerId);
            
            // Analyze timing patterns
            AnalyzeTimingPatterns(playerId);
        }
        
        /// <summary>
        /// Analyze input patterns for suspicious behavior
        /// </summary>
        private void AnalyzeInputPatterns(string playerId)
        {
            if (!inputHistory.ContainsKey(playerId) || inputHistory[playerId].Count < 10)
                return;
            
            var recentInputs = inputHistory[playerId].TakeLast(20).ToList();
            
            // Check for inhuman input patterns
            float avgResponseTime = recentInputs.Average(input => input.responseTime);
            float responseTimeVariance = recentInputs.Select(input => 
                Mathf.Pow(input.responseTime - avgResponseTime, 2)).Average();
            float responseTimeStdDev = Mathf.Sqrt(responseTimeVariance);
            
            // If response times are too consistent (low variance), it might be a bot
            if (responseTimeStdDev < 10f) // Less than 10ms variance
            {
                RecordViolation("inhuman_input_pattern", 
                    "Input pattern appears inhuman (too consistent)", 0.7f, 0.8f,
                    new Dictionary<string, object> 
                    { 
                        {"responseTimeVariance", responseTimeVariance},
                        {"avgResponseTime", avgResponseTime}
                    });
            }
            
            // Check for perfect timing patterns
            if (HasPerfectTiming(recentInputs))
            {
                RecordViolation("perfect_timing", 
                    "Perfect timing pattern detected", 0.8f, 0.9f,
                    new Dictionary<string, object> { {"inputCount", recentInputs.Count} });
            }
        }
        
        /// <summary>
        /// Analyze action patterns
        /// </summary>
        private void AnalyzeActionPatterns(string playerId)
        {
            if (!actionHistory.ContainsKey(playerId) || actionHistory[playerId].Count < 10)
                return;
            
            var recentActions = actionHistory[playerId].TakeLast(20).ToList();
            
            // Check for repetitive patterns
            var actionTypes = recentActions.Select(action => action.actionType).ToList();
            var uniqueActions = actionTypes.Distinct().Count();
            float diversityRatio = (float)uniqueActions / actionTypes.Count;
            
            if (diversityRatio < 0.3f) // Less than 30% diversity
            {
                RecordViolation("repetitive_pattern", 
                    "Repetitive action pattern detected", 0.6f, 0.7f,
                    new Dictionary<string, object> 
                    { 
                        {"diversityRatio", diversityRatio},
                        {"uniqueActions", uniqueActions},
                        {"totalActions", actionTypes.Count}
                    });
            }
        }
        
        /// <summary>
        /// Analyze timing patterns
        /// </summary>
        private void AnalyzeTimingPatterns(string playerId)
        {
            if (!actionHistory.ContainsKey(playerId) || actionHistory[playerId].Count < 10)
                return;
            
            var recentActions = actionHistory[playerId].TakeLast(20).ToList();
            
            // Check for consistent intervals
            var intervals = new List<float>();
            for (int i = 1; i < recentActions.Count; i++)
            {
                intervals.Add(recentActions[i].timestamp - recentActions[i-1].timestamp);
            }
            
            if (intervals.Count > 0)
            {
                float avgInterval = intervals.Average();
                float intervalVariance = intervals.Select(interval => 
                    Mathf.Pow(interval - avgInterval, 2)).Average();
                float intervalStdDev = Mathf.Sqrt(intervalVariance);
                
                // If intervals are too regular, it might be automated
                if (intervalStdDev < 0.1f) // Very low variance
                {
                    RecordViolation("automated_timing", 
                        "Timing pattern appears automated", 0.7f, 0.8f,
                        new Dictionary<string, object> 
                        { 
                            {"intervalVariance", intervalVariance},
                            {"avgInterval", avgInterval}
                        });
                }
            }
        }
        
        /// <summary>
        /// Validate input for suspicious patterns
        /// </summary>
        private void ValidateInput()
        {
            // This would validate current input
            // Implementation depends on your input system
        }
        
        /// <summary>
        /// Record input data
        /// </summary>
        public void RecordInput(Vector2 position, string inputType, float responseTime)
        {
            string playerId = GetCurrentPlayerId();
            if (string.IsNullOrEmpty(playerId)) return;
            
            if (!inputHistory.ContainsKey(playerId))
            {
                inputHistory[playerId] = new List<InputData>();
            }
            
            var inputData = new InputData
            {
                position = position,
                timestamp = Time.time,
                responseTime = responseTime,
                inputType = inputType
            };
            
            inputHistory[playerId].Add(inputData);
            
            // Keep only last 100 inputs
            if (inputHistory[playerId].Count > 100)
            {
                inputHistory[playerId].RemoveAt(0);
            }
        }
        
        /// <summary>
        /// Record game action
        /// </summary>
        public void RecordGameAction(string actionType, Dictionary<string, object> data, float responseTime)
        {
            string playerId = GetCurrentPlayerId();
            if (string.IsNullOrEmpty(playerId)) return;
            
            if (!actionHistory.ContainsKey(playerId))
            {
                actionHistory[playerId] = new List<GameAction>();
            }
            
            var gameAction = new GameAction
            {
                actionType = actionType,
                data = data,
                timestamp = Time.time,
                responseTime = responseTime
            };
            
            actionHistory[playerId].Add(gameAction);
            
            // Keep only last 100 actions
            if (actionHistory[playerId].Count > 100)
            {
                actionHistory[playerId].RemoveAt(0);
            }
        }
        
        /// <summary>
        /// Record a violation
        /// </summary>
        private void RecordViolation(string type, string description, float severity, float confidence, Dictionary<string, object> evidence)
        {
            var violation = new ClientViolation
            {
                id = Guid.NewGuid().ToString(),
                type = type,
                description = description,
                severity = severity,
                confidence = confidence,
                timestamp = Time.time,
                evidence = evidence
            };
            
            violations.Add(violation);
            violationCount++;
            
            if (enableDebugLogs)
            {
                Debug.LogWarning($"[ClientAntiCheat] Violation detected: {type} - {description}");
            }
            
            OnViolationDetected?.Invoke(violation);
            
            // If we have too many violations, report to server
            if (violationCount >= maxViolationsBeforeReport)
            {
                ReportViolationsToServer();
            }
        }
        
        /// <summary>
        /// Report violations to server
        /// </summary>
        private void ReportViolationsToServer()
        {
            if (!enableServerValidation || ServerValidation.Instance == null)
                return;
            
            var recentViolations = violations.TakeLast(maxViolationsBeforeReport).ToList();
            var violationData = new Dictionary<string, object>
            {
                {"violations", recentViolations},
                {"playerId", GetCurrentPlayerId()},
                {"timestamp", Time.time}
            };
            
            ServerValidation.Instance.SubmitGameData("client_violations", violationData);
            
            if (enableDebugLogs)
            {
                Debug.Log($"[ClientAntiCheat] Reported {recentViolations.Count} violations to server");
            }
        }
        
        /// <summary>
        /// Update risk scores for all players
        /// </summary>
        private void UpdateRiskScores()
        {
            foreach (var kvp in detectionData)
            {
                string playerId = kvp.Key;
                var data = kvp.Value;
                
                // Calculate risk score based on violations
                float riskScore = CalculateRiskScore(playerId);
                data.riskScore = riskScore;
                
                OnRiskScoreUpdated?.Invoke(riskScore);
            }
        }
        
        /// <summary>
        /// Calculate risk score for a player
        /// </summary>
        private float CalculateRiskScore(string playerId)
        {
            float riskScore = 0f;
            
            // Base risk from violations
            var playerViolations = violations.Where(v => v.timestamp > Time.time - 3600f).ToList(); // Last hour
            riskScore += playerViolations.Count * 0.1f;
            
            // Risk from severity
            riskScore += playerViolations.Sum(v => v.severity * v.confidence) * 0.2f;
            
            // Risk from recent activity
            if (actionHistory.ContainsKey(playerId))
            {
                var recentActions = actionHistory[playerId].Where(a => a.timestamp > Time.time - 300f).ToList(); // Last 5 minutes
                if (recentActions.Count > 50) // Too many actions
                {
                    riskScore += 0.3f;
                }
            }
            
            return Mathf.Clamp01(riskScore);
        }
        
        /// <summary>
        /// Calculate severity based on threshold
        /// </summary>
        private float CalculateSeverity(float value, float threshold)
        {
            return Mathf.Clamp01((value - threshold) / threshold);
        }
        
        /// <summary>
        /// Check for perfect timing patterns
        /// </summary>
        private bool HasPerfectTiming(List<InputData> inputs)
        {
            if (inputs.Count < 5) return false;
            
            var intervals = new List<float>();
            for (int i = 1; i < inputs.Count; i++)
            {
                intervals.Add(inputs[i].timestamp - inputs[i-1].timestamp);
            }
            
            // Check if intervals are too regular
            float avgInterval = intervals.Average();
            float variance = intervals.Select(interval => Mathf.Pow(interval - avgInterval, 2)).Average();
            
            return variance < 0.01f; // Very low variance
        }
        
        // Placeholder methods - implement based on your game
        private string GetCurrentPlayerId()
        {
            // Return current player ID
            return "player_1"; // Placeholder
        }
        
        private long GetExpectedMemoryUsage()
        {
            // Return expected memory usage
            return 100 * 1024 * 1024; // 100MB placeholder
        }
        
        private int GetCurrentScore()
        {
            // Return current score
            return 0; // Placeholder
        }
        
        private int GetPreviousScore()
        {
            // Return previous score
            return 0; // Placeholder
        }
        
        private int GetCurrentCoins()
        {
            // Return current coins
            return 0; // Placeholder
        }
        
        private int GetCurrentGems()
        {
            // Return current gems
            return 0; // Placeholder
        }
        
        /// <summary>
        /// Get violation statistics
        /// </summary>
        public Dictionary<string, object> GetViolationStatistics()
        {
            return new Dictionary<string, object>
            {
                {"totalViolations", violationCount},
                {"recentViolations", violations.Where(v => v.timestamp > Time.time - 3600f).Count()},
                {"violationTypes", violations.GroupBy(v => v.type).ToDictionary(g => g.Key, g => g.Count())},
                {"averageSeverity", violations.Average(v => v.severity)},
                {"averageConfidence", violations.Average(v => v.confidence)}
            };
        }
        
        void OnDestroy()
        {
            // Cleanup
        }
    }
}