using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using System;
using Evergreen.Core;

namespace Evergreen.AI
{
    /// <summary>
    /// Advanced AI system with machine learning, difficulty adjustment, and personalization
    /// </summary>
    public class AdvancedAISystem : MonoBehaviour
    {
        public static AdvancedAISystem Instance { get; private set; }

        [Header("AI Settings")]
        public bool enableMachineLearning = true;
        public bool enableDifficultyAdjustment = true;
        public bool enablePersonalization = true;
        public float learningRate = 0.1f;
        public int maxTrainingIterations = 1000;

        [Header("Difficulty Settings")]
        public float baseDifficulty = 0.5f;
        public float difficultyAdjustmentSpeed = 0.1f;
        public float minDifficulty = 0.1f;
        public float maxDifficulty = 1.0f;

        [Header("Personalization")]
        public bool enablePlayerProfiling = true;
        public bool enableBehavioralAnalysis = true;
        public bool enablePredictiveAnalytics = true;

        private Dictionary<string, PlayerProfile> _playerProfiles = new Dictionary<string, PlayerProfile>();
        private Dictionary<string, DifficultyProfile> _difficultyProfiles = new Dictionary<string, DifficultyProfile>();
        private Dictionary<string, BehavioralPattern> _behavioralPatterns = new Dictionary<string, BehavioralPattern>();
        private NeuralNetwork _neuralNetwork;
        private GameplayAnalyzer _gameplayAnalyzer;
        private PersonalizationEngine _personalizationEngine;

        public class PlayerProfile
        {
            public string playerId;
            public float skillLevel;
            public float engagementLevel;
            public float spendingTendency;
            public List<string> preferredGameModes = new List<string>();
            public Dictionary<string, float> playStyleWeights = new Dictionary<string, float>();
            public DateTime lastUpdated;
            public int totalPlayTime;
            public int levelsCompleted;
            public float averageScore;
            public float retentionProbability;
        }

        public class DifficultyProfile
        {
            public string playerId;
            public float currentDifficulty;
            public float targetDifficulty;
            public List<float> difficultyHistory = new List<float>();
            public float winRate;
            public float averageMovesPerLevel;
            public float averageTimePerLevel;
            public DateTime lastAdjusted;
        }

        public class BehavioralPattern
        {
            public string playerId;
            public Dictionary<string, float> patternWeights = new Dictionary<string, float>();
            public List<GameplayEvent> recentEvents = new List<GameplayEvent>();
            public float churnRisk;
            public float engagementScore;
            public DateTime lastAnalyzed;
        }

        public class GameplayEvent
        {
            public string eventType;
            public Dictionary<string, object> parameters;
            public DateTime timestamp;
            public float value;
        }

        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeAISystem();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void InitializeAISystem()
        {
            if (enableMachineLearning)
            {
                _neuralNetwork = new NeuralNetwork(10, 20, 5); // Input, Hidden, Output layers
            }

            _gameplayAnalyzer = new GameplayAnalyzer();
            _personalizationEngine = new PersonalizationEngine();

            Logger.Info("Advanced AI System initialized", "AISystem");
        }

        #region Player Profiling
        public void UpdatePlayerProfile(string playerId, GameplayEvent gameplayEvent)
        {
            if (!_playerProfiles.ContainsKey(playerId))
            {
                _playerProfiles[playerId] = new PlayerProfile
                {
                    playerId = playerId,
                    skillLevel = 0.5f,
                    engagementLevel = 0.5f,
                    spendingTendency = 0.5f,
                    lastUpdated = DateTime.Now
                };
            }

            var profile = _playerProfiles[playerId];
            AnalyzeGameplayEvent(profile, gameplayEvent);
            UpdateBehavioralPattern(playerId, gameplayEvent);
        }

        private void AnalyzeGameplayEvent(PlayerProfile profile, GameplayEvent gameplayEvent)
        {
            switch (gameplayEvent.eventType)
            {
                case "level_completed":
                    profile.levelsCompleted++;
                    profile.skillLevel = Mathf.Clamp01(profile.skillLevel + 0.01f);
                    break;
                case "level_failed":
                    profile.skillLevel = Mathf.Clamp01(profile.skillLevel - 0.005f);
                    break;
                case "purchase_made":
                    profile.spendingTendency = Mathf.Clamp01(profile.spendingTendency + 0.1f);
                    break;
                case "session_started":
                    profile.engagementLevel = Mathf.Clamp01(profile.engagementLevel + 0.02f);
                    break;
            }

            profile.lastUpdated = DateTime.Now;
        }

        private void UpdateBehavioralPattern(string playerId, GameplayEvent gameplayEvent)
        {
            if (!_behavioralPatterns.ContainsKey(playerId))
            {
                _behavioralPatterns[playerId] = new BehavioralPattern
                {
                    playerId = playerId,
                    lastAnalyzed = DateTime.Now
                };
            }

            var pattern = _behavioralPatterns[playerId];
            pattern.recentEvents.Add(gameplayEvent);

            // Keep only last 100 events
            if (pattern.recentEvents.Count > 100)
            {
                pattern.recentEvents.RemoveAt(0);
            }

            // Analyze patterns
            AnalyzeBehavioralPatterns(pattern);
        }

        private void AnalyzeBehavioralPatterns(BehavioralPattern pattern)
        {
            // Calculate engagement score
            var recentEvents = pattern.recentEvents.Where(e => 
                DateTime.Now - e.timestamp < TimeSpan.FromHours(24)).ToList();

            pattern.engagementScore = recentEvents.Count / 24f; // Events per hour

            // Calculate churn risk
            var lastSession = pattern.recentEvents.LastOrDefault(e => e.eventType == "session_ended");
            if (lastSession != null)
            {
                var timeSinceLastSession = DateTime.Now - lastSession.timestamp;
                pattern.churnRisk = Mathf.Clamp01((float)timeSinceLastSession.TotalDays / 7f);
            }

            pattern.lastAnalyzed = DateTime.Now;
        }
        #endregion

        #region Difficulty Adjustment
        public float GetAdjustedDifficulty(string playerId, int levelId)
        {
            if (!enableDifficultyAdjustment) return baseDifficulty;

            if (!_difficultyProfiles.ContainsKey(playerId))
            {
                _difficultyProfiles[playerId] = new DifficultyProfile
                {
                    playerId = playerId,
                    currentDifficulty = baseDifficulty,
                    targetDifficulty = baseDifficulty
                };
            }

            var difficultyProfile = _difficultyProfiles[playerId];
            AdjustDifficulty(difficultyProfile);
            return difficultyProfile.currentDifficulty;
        }

        private void AdjustDifficulty(DifficultyProfile profile)
        {
            var playerProfile = _playerProfiles.GetValueOrDefault(profile.playerId);
            if (playerProfile == null) return;

            // Calculate target difficulty based on player performance
            var skillFactor = playerProfile.skillLevel;
            var engagementFactor = playerProfile.engagementLevel;
            var winRateFactor = profile.winRate;

            // Machine learning adjustment
            if (enableMachineLearning && _neuralNetwork != null)
            {
                var inputs = new float[]
                {
                    skillFactor,
                    engagementFactor,
                    winRateFactor,
                    profile.averageMovesPerLevel / 50f,
                    profile.averageTimePerLevel / 300f,
                    (float)playerProfile.levelsCompleted / 100f,
                    playerProfile.averageScore / 10000f,
                    profile.currentDifficulty,
                    (float)(DateTime.Now - profile.lastAdjusted).TotalHours / 24f,
                    profile.difficultyHistory.Count > 0 ? profile.difficultyHistory.Last() : 0.5f
                };

                var outputs = _neuralNetwork.FeedForward(inputs);
                profile.targetDifficulty = Mathf.Clamp01(outputs[0]);
            }
            else
            {
                // Rule-based adjustment
                profile.targetDifficulty = (skillFactor + engagementFactor + winRateFactor) / 3f;
            }

            // Smooth adjustment
            var adjustment = (profile.targetDifficulty - profile.currentDifficulty) * difficultyAdjustmentSpeed;
            profile.currentDifficulty = Mathf.Clamp01(profile.currentDifficulty + adjustment);

            // Record difficulty history
            profile.difficultyHistory.Add(profile.currentDifficulty);
            if (profile.difficultyHistory.Count > 50)
            {
                profile.difficultyHistory.RemoveAt(0);
            }

            profile.lastAdjusted = DateTime.Now;
        }

        public void RecordLevelResult(string playerId, bool won, int moves, float time, int score)
        {
            if (!_difficultyProfiles.ContainsKey(playerId)) return;

            var profile = _difficultyProfiles[playerId];
            
            // Update win rate
            var totalGames = profile.difficultyHistory.Count;
            if (totalGames == 0)
            {
                profile.winRate = won ? 1f : 0f;
            }
            else
            {
                profile.winRate = (profile.winRate * totalGames + (won ? 1f : 0f)) / (totalGames + 1);
            }

            // Update averages
            profile.averageMovesPerLevel = (profile.averageMovesPerLevel * totalGames + moves) / (totalGames + 1);
            profile.averageTimePerLevel = (profile.averageTimePerLevel * totalGames + time) / (totalGames + 1);

            // Update player profile
            if (_playerProfiles.ContainsKey(playerId))
            {
                _playerProfiles[playerId].averageScore = (_playerProfiles[playerId].averageScore * totalGames + score) / (totalGames + 1);
            }
        }
        #endregion

        #region Personalization
        public PersonalizedContent GetPersonalizedContent(string playerId)
        {
            if (!enablePersonalization || !_playerProfiles.ContainsKey(playerId))
            {
                return GetDefaultContent();
            }

            var playerProfile = _playerProfiles[playerId];
            var behavioralPattern = _behavioralPatterns.GetValueOrDefault(playerId);

            return _personalizationEngine.GeneratePersonalizedContent(playerProfile, behavioralPattern);
        }

        private PersonalizedContent GetDefaultContent()
        {
            return new PersonalizedContent
            {
                recommendedLevels = new List<int> { 1, 2, 3 },
                suggestedPowerUps = new List<string> { "bomb", "rocket" },
                personalizedOffers = new List<Offer>(),
                difficultyAdjustment = 0.5f,
                themePreference = "default"
            };
        }

        public class PersonalizedContent
        {
            public List<int> recommendedLevels;
            public List<string> suggestedPowerUps;
            public List<Offer> personalizedOffers;
            public float difficultyAdjustment;
            public string themePreference;
        }

        public class Offer
        {
            public string offerId;
            public string type;
            public float discount;
            public DateTime expirationTime;
            public Dictionary<string, object> parameters;
        }
        #endregion

        #region Machine Learning
        public void TrainNeuralNetwork()
        {
            if (!enableMachineLearning || _neuralNetwork == null) return;

            var trainingData = GenerateTrainingData();
            _neuralNetwork.Train(trainingData, maxTrainingIterations, learningRate);
        }

        private List<TrainingExample> GenerateTrainingData()
        {
            var trainingData = new List<TrainingExample>();

            // Generate synthetic training data based on player profiles
            foreach (var profile in _playerProfiles.Values)
            {
                var inputs = new float[]
                {
                    profile.skillLevel,
                    profile.engagementLevel,
                    profile.spendingTendency,
                    (float)profile.levelsCompleted / 100f,
                    profile.averageScore / 10000f,
                    profile.retentionProbability,
                    (float)(DateTime.Now - profile.lastUpdated).TotalDays / 30f,
                    profile.preferredGameModes.Count / 5f,
                    profile.playStyleWeights.Count / 10f,
                    (float)profile.totalPlayTime / 3600f // Hours
                };

                var outputs = new float[]
                {
                    profile.skillLevel,
                    profile.engagementLevel,
                    profile.spendingTendency,
                    profile.retentionProbability,
                    profile.averageScore / 10000f
                };

                trainingData.Add(new TrainingExample { inputs = inputs, outputs = outputs });
            }

            return trainingData;
        }

        public class TrainingExample
        {
            public float[] inputs;
            public float[] outputs;
        }
        #endregion

        #region Analytics
        public Dictionary<string, object> GetAIAnalytics()
        {
            return new Dictionary<string, object>
            {
                {"total_players", _playerProfiles.Count},
                {"active_difficulty_profiles", _difficultyProfiles.Count},
                {"behavioral_patterns", _behavioralPatterns.Count},
                {"average_skill_level", _playerProfiles.Values.Average(p => p.skillLevel)},
                {"average_engagement", _playerProfiles.Values.Average(p => p.engagementLevel)},
                {"average_spending_tendency", _playerProfiles.Values.Average(p => p.spendingTendency)},
                {"high_churn_risk_players", _behavioralPatterns.Values.Count(p => p.churnRisk > 0.7f)},
                {"neural_network_enabled", enableMachineLearning},
                {"personalization_enabled", enablePersonalization},
                {"difficulty_adjustment_enabled", enableDifficultyAdjustment}
            };
        }
        #endregion
    }

    /// <summary>
    /// Neural Network implementation for machine learning
    /// </summary>
    public class NeuralNetwork
    {
        private int inputSize;
        private int hiddenSize;
        private int outputSize;
        private float[,] weightsInputHidden;
        private float[,] weightsHiddenOutput;
        private float[] hiddenBias;
        private float[] outputBias;

        public NeuralNetwork(int inputSize, int hiddenSize, int outputSize)
        {
            this.inputSize = inputSize;
            this.hiddenSize = hiddenSize;
            this.outputSize = outputSize;

            InitializeWeights();
        }

        private void InitializeWeights()
        {
            weightsInputHidden = new float[inputSize, hiddenSize];
            weightsHiddenOutput = new float[hiddenSize, outputSize];
            hiddenBias = new float[hiddenSize];
            outputBias = new float[outputSize];

            // Initialize with random weights
            for (int i = 0; i < inputSize; i++)
            {
                for (int j = 0; j < hiddenSize; j++)
                {
                    weightsInputHidden[i, j] = UnityEngine.Random.Range(-1f, 1f);
                }
            }

            for (int i = 0; i < hiddenSize; i++)
            {
                for (int j = 0; j < outputSize; j++)
                {
                    weightsHiddenOutput[i, j] = UnityEngine.Random.Range(-1f, 1f);
                }
            }
        }

        public float[] FeedForward(float[] inputs)
        {
            // Calculate hidden layer
            var hidden = new float[hiddenSize];
            for (int j = 0; j < hiddenSize; j++)
            {
                hidden[j] = hiddenBias[j];
                for (int i = 0; i < inputSize; i++)
                {
                    hidden[j] += inputs[i] * weightsInputHidden[i, j];
                }
                hidden[j] = Sigmoid(hidden[j]);
            }

            // Calculate output layer
            var outputs = new float[outputSize];
            for (int j = 0; j < outputSize; j++)
            {
                outputs[j] = outputBias[j];
                for (int i = 0; i < hiddenSize; i++)
                {
                    outputs[j] += hidden[i] * weightsHiddenOutput[i, j];
                }
                outputs[j] = Sigmoid(outputs[j]);
            }

            return outputs;
        }

        public void Train(List<TrainingExample> trainingData, int iterations, float learningRate)
        {
            for (int iter = 0; iter < iterations; iter++)
            {
                foreach (var example in trainingData)
                {
                    // Forward pass
                    var hidden = new float[hiddenSize];
                    for (int j = 0; j < hiddenSize; j++)
                    {
                        hidden[j] = hiddenBias[j];
                        for (int i = 0; i < inputSize; i++)
                        {
                            hidden[j] += example.inputs[i] * weightsInputHidden[i, j];
                        }
                        hidden[j] = Sigmoid(hidden[j]);
                    }

                    var outputs = new float[outputSize];
                    for (int j = 0; j < outputSize; j++)
                    {
                        outputs[j] = outputBias[j];
                        for (int i = 0; i < hiddenSize; i++)
                        {
                            outputs[j] += hidden[i] * weightsHiddenOutput[i, j];
                        }
                        outputs[j] = Sigmoid(outputs[j]);
                    }

                    // Backward pass (simplified)
                    for (int j = 0; j < outputSize; j++)
                    {
                        var error = example.outputs[j] - outputs[j];
                        outputBias[j] += learningRate * error;
                    }
                }
            }
        }

        private float Sigmoid(float x)
        {
            return 1f / (1f + Mathf.Exp(-x));
        }
    }

    /// <summary>
    /// Gameplay analyzer for pattern recognition
    /// </summary>
    public class GameplayAnalyzer
    {
        public Dictionary<string, float> AnalyzeGameplayPatterns(List<GameplayEvent> events)
        {
            var patterns = new Dictionary<string, float>();

            // Analyze play frequency
            var sessionCount = events.Count(e => e.eventType == "session_started");
            patterns["session_frequency"] = sessionCount;

            // Analyze level completion rate
            var levelAttempts = events.Count(e => e.eventType == "level_started");
            var levelCompletions = events.Count(e => e.eventType == "level_completed");
            patterns["completion_rate"] = levelAttempts > 0 ? (float)levelCompletions / levelAttempts : 0f;

            // Analyze spending patterns
            var purchases = events.Count(e => e.eventType == "purchase_made");
            patterns["purchase_frequency"] = purchases;

            return patterns;
        }
    }

    /// <summary>
    /// Personalization engine for content recommendation
    /// </summary>
    public class PersonalizationEngine
    {
        public PersonalizedContent GeneratePersonalizedContent(PlayerProfile profile, BehavioralPattern pattern)
        {
            var content = new PersonalizedContent
            {
                recommendedLevels = GenerateRecommendedLevels(profile),
                suggestedPowerUps = GenerateSuggestedPowerUps(profile),
                personalizedOffers = GeneratePersonalizedOffers(profile),
                difficultyAdjustment = CalculateDifficultyAdjustment(profile),
                themePreference = DetermineThemePreference(profile)
            };

            return content;
        }

        private List<int> GenerateRecommendedLevels(PlayerProfile profile)
        {
            var recommended = new List<int>();
            var baseLevel = Mathf.RoundToInt(profile.skillLevel * 100);
            
            for (int i = 0; i < 5; i++)
            {
                recommended.Add(Mathf.Max(1, baseLevel + i - 2));
            }

            return recommended;
        }

        private List<string> GenerateSuggestedPowerUps(PlayerProfile profile)
        {
            var powerUps = new List<string>();
            
            if (profile.skillLevel < 0.3f)
            {
                powerUps.AddRange(new[] { "bomb", "rocket", "color_bomb" });
            }
            else if (profile.skillLevel < 0.7f)
            {
                powerUps.AddRange(new[] { "rocket", "color_bomb", "lightning" });
            }
            else
            {
                powerUps.AddRange(new[] { "color_bomb", "lightning", "rainbow" });
            }

            return powerUps;
        }

        private List<Offer> GeneratePersonalizedOffers(PlayerProfile profile)
        {
            var offers = new List<Offer>();

            if (profile.spendingTendency > 0.7f)
            {
                offers.Add(new Offer
                {
                    offerId = "premium_pack",
                    type = "gem_pack",
                    discount = 0.2f,
                    expirationTime = DateTime.Now.AddDays(1)
                });
            }

            return offers;
        }

        private float CalculateDifficultyAdjustment(PlayerProfile profile)
        {
            return Mathf.Clamp01(profile.skillLevel + (profile.engagementLevel - 0.5f) * 0.2f);
        }

        private string DetermineThemePreference(PlayerProfile profile)
        {
            // Simple theme selection based on play style
            if (profile.playStyleWeights.ContainsKey("aggressive"))
            {
                return "dark";
            }
            else if (profile.playStyleWeights.ContainsKey("casual"))
            {
                return "pastel";
            }
            else
            {
                return "default";
            }
        }
    }
}