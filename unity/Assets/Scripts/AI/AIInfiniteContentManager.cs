using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;
using Newtonsoft.Json;

namespace Evergreen.AI
{
    /// <summary>
    /// AI Infinite Content Manager - Unity integration with AI content generation
    /// Provides seamless integration between Unity and the AI content generation backend
    /// </summary>
    public class AIInfiniteContentManager : MonoBehaviour
    {
        [Header("AI Configuration")]
        public string aiApiBaseUrl = "https://your-api.com/api/ai";
        public string apiKey = "your-api-key";
        public bool enableAIContent = true;
        public bool enablePersonalization = true;
        public bool enableMarketResearch = true;
        
        [Header("Content Generation")]
        public int contentGenerationInterval = 300; // 5 minutes
        public int maxContentQueue = 100;
        public bool autoGenerateContent = true;
        
        [Header("Personalization")]
        public bool enablePlayerProfiling = true;
        public bool enableDifficultyOptimization = true;
        public bool enablePersonalizedOffers = true;
        
        private Queue<GeneratedContent> contentQueue = new Queue<GeneratedContent>();
        private Dictionary<string, PlayerProfile> playerProfiles = new Dictionary<string, PlayerProfile>();
        private Dictionary<string, MarketInsights> marketInsights = new Dictionary<string, MarketInsights>();
        private Coroutine contentGenerationCoroutine;
        private Coroutine personalizationCoroutine;
        
        public static AIInfiniteContentManager Instance { get; private set; }
        
        // Events
        public System.Action<GeneratedContent> OnContentGenerated;
        public System.Action<PlayerProfile> OnPlayerProfileUpdated;
        public System.Action<MarketInsights> OnMarketInsightsUpdated;
        public System.Action<string> OnAIContentError;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeAI();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (enableAIContent)
            {
                StartAIContentGeneration();
            }
            
            if (enablePersonalization)
            {
                StartPersonalization();
            }
        }
        
        private void InitializeAI()
        {
            Debug.Log("AI Infinite Content Manager initialized - Industry-leading content generation activated!");
            
            // Initialize player profiles
            LoadPlayerProfiles();
            
            // Load market insights
            LoadMarketInsights();
        }
        
        /// <summary>
        /// Start AI content generation
        /// </summary>
        public void StartAIContentGeneration()
        {
            if (contentGenerationCoroutine != null)
            {
                StopCoroutine(contentGenerationCoroutine);
            }
            
            contentGenerationCoroutine = StartCoroutine(ContentGenerationLoop());
            Debug.Log("AI content generation started");
        }
        
        /// <summary>
        /// Stop AI content generation
        /// </summary>
        public void StopAIContentGeneration()
        {
            if (contentGenerationCoroutine != null)
            {
                StopCoroutine(contentGenerationCoroutine);
                contentGenerationCoroutine = null;
            }
            
            Debug.Log("AI content generation stopped");
        }
        
        /// <summary>
        /// Generate AI content
        /// </summary>
        public async void GenerateAIContent(string contentType, System.Action<GeneratedContent> onComplete = null)
        {
            try
            {
                var requestData = new
                {
                    contentType = contentType,
                    playerId = GetCurrentPlayerId(),
                    preferences = GetPlayerPreferences()
                };
                
                var json = JsonConvert.SerializeObject(requestData);
                var request = new UnityWebRequest($"{aiApiBaseUrl}/generate", "POST");
                request.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json));
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");
                request.SetRequestHeader("Authorization", $"Bearer {apiKey}");
                
                var operation = request.SendWebRequest();
                
                while (!operation.isDone)
                {
                    await System.Threading.Tasks.Task.Yield();
                }
                
                if (request.result == UnityWebRequest.Result.Success)
                {
                    var response = JsonConvert.DeserializeObject<AIResponse<GeneratedContent>>(request.downloadHandler.text);
                    
                    if (response.success)
                    {
                        var content = response.content;
                        contentQueue.Enqueue(content);
                        
                        OnContentGenerated?.Invoke(content);
                        onComplete?.Invoke(content);
                        
                        Debug.Log($"AI generated {contentType} content: {content.id}");
                    }
                    else
                    {
                        OnAIContentError?.Invoke($"Failed to generate {contentType}: {response.error}");
                    }
                }
                else
                {
                    OnAIContentError?.Invoke($"AI content generation failed: {request.error}");
                }
                
                request.Dispose();
            }
            catch (Exception e)
            {
                OnAIContentError?.Invoke($"AI content generation error: {e.Message}");
            }
        }
        
        /// <summary>
        /// Get personalized recommendations
        /// </summary>
        public async void GetPersonalizedRecommendations(string contentType, System.Action<List<Recommendation>> onComplete = null)
        {
            try
            {
                var playerId = GetCurrentPlayerId();
                var request = UnityWebRequest.Get($"{aiApiBaseUrl}/recommendations/{playerId}?contentType={contentType}");
                request.SetRequestHeader("Authorization", $"Bearer {apiKey}");
                
                var operation = request.SendWebRequest();
                
                while (!operation.isDone)
                {
                    await System.Threading.Tasks.Task.Yield();
                }
                
                if (request.result == UnityWebRequest.Result.Success)
                {
                    var response = JsonConvert.DeserializeObject<AIResponse<RecommendationResponse>>(request.downloadHandler.text);
                    
                    if (response.success)
                    {
                        onComplete?.Invoke(response.content.recommendations);
                    }
                    else
                    {
                        OnAIContentError?.Invoke($"Failed to get recommendations: {response.error}");
                    }
                }
                else
                {
                    OnAIContentError?.Invoke($"Recommendations request failed: {request.error}");
                }
                
                request.Dispose();
            }
            catch (Exception e)
            {
                OnAIContentError?.Invoke($"Recommendations error: {e.Message}");
            }
        }
        
        /// <summary>
        /// Optimize difficulty for current player
        /// </summary>
        public async void OptimizeDifficulty(LevelData currentLevel, PlayerPerformance performance, System.Action<DifficultyOptimization> onComplete = null)
        {
            try
            {
                var requestData = new
                {
                    playerId = GetCurrentPlayerId(),
                    currentLevel = currentLevel,
                    performance = performance
                };
                
                var json = JsonConvert.SerializeObject(requestData);
                var request = new UnityWebRequest($"{aiApiBaseUrl}/optimize-difficulty", "POST");
                request.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json));
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");
                request.SetRequestHeader("Authorization", $"Bearer {apiKey}");
                
                var operation = request.SendWebRequest();
                
                while (!operation.isDone)
                {
                    await System.Threading.Tasks.Task.Yield();
                }
                
                if (request.result == UnityWebRequest.Result.Success)
                {
                    var response = JsonConvert.DeserializeObject<AIResponse<DifficultyOptimization>>(request.downloadHandler.text);
                    
                    if (response.success)
                    {
                        onComplete?.Invoke(response.content);
                        Debug.Log($"Difficulty optimized: {response.content.adjustmentReason}");
                    }
                    else
                    {
                        OnAIContentError?.Invoke($"Failed to optimize difficulty: {response.error}");
                    }
                }
                else
                {
                    OnAIContentError?.Invoke($"Difficulty optimization failed: {request.error}");
                }
                
                request.Dispose();
            }
            catch (Exception e)
            {
                OnAIContentError?.Invoke($"Difficulty optimization error: {e.Message}");
            }
        }
        
        /// <summary>
        /// Get churn prediction for current player
        /// </summary>
        public async void GetChurnPrediction(System.Action<ChurnPrediction> onComplete = null)
        {
            try
            {
                var playerId = GetCurrentPlayerId();
                var request = UnityWebRequest.Get($"{aiApiBaseUrl}/churn-prediction/{playerId}");
                request.SetRequestHeader("Authorization", $"Bearer {apiKey}");
                
                var operation = request.SendWebRequest();
                
                while (!operation.isDone)
                {
                    await System.Threading.Tasks.Task.Yield();
                }
                
                if (request.result == UnityWebRequest.Result.Success)
                {
                    var response = JsonConvert.DeserializeObject<AIResponse<ChurnPrediction>>(request.downloadHandler.text);
                    
                    if (response.success)
                    {
                        onComplete?.Invoke(response.content);
                        Debug.Log($"Churn prediction: {response.content.churnProbability} ({response.content.riskLevel})");
                    }
                    else
                    {
                        OnAIContentError?.Invoke($"Failed to get churn prediction: {response.error}");
                    }
                }
                else
                {
                    OnAIContentError?.Invoke($"Churn prediction failed: {request.error}");
                }
                
                request.Dispose();
            }
            catch (Exception e)
            {
                OnAIContentError?.Invoke($"Churn prediction error: {e.Message}");
            }
        }
        
        /// <summary>
        /// Get personalized offers
        /// </summary>
        public async void GetPersonalizedOffers(string offerType, System.Action<List<PersonalizedOffer>> onComplete = null)
        {
            try
            {
                var requestData = new
                {
                    playerId = GetCurrentPlayerId(),
                    offerType = offerType
                };
                
                var json = JsonConvert.SerializeObject(requestData);
                var request = new UnityWebRequest($"{aiApiBaseUrl}/personalized-offers", "POST");
                request.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json));
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");
                request.SetRequestHeader("Authorization", $"Bearer {apiKey}");
                
                var operation = request.SendWebRequest();
                
                while (!operation.isDone)
                {
                    await System.Threading.Tasks.Task.Yield();
                }
                
                if (request.result == UnityWebRequest.Result.Success)
                {
                    var response = JsonConvert.DeserializeObject<AIResponse<PersonalizedOfferResponse>>(request.downloadHandler.text);
                    
                    if (response.success)
                    {
                        onComplete?.Invoke(response.content.offers);
                    }
                    else
                    {
                        OnAIContentError?.Invoke($"Failed to get personalized offers: {response.error}");
                    }
                }
                else
                {
                    OnAIContentError?.Invoke($"Personalized offers failed: {request.error}");
                }
                
                request.Dispose();
            }
            catch (Exception e)
            {
                OnAIContentError?.Invoke($"Personalized offers error: {e.Message}");
            }
        }
        
        /// <summary>
        /// Get market insights
        /// </summary>
        public async void GetMarketInsights(System.Action<MarketInsights> onComplete = null)
        {
            try
            {
                var request = UnityWebRequest.Get($"{aiApiBaseUrl}/market-insights");
                request.SetRequestHeader("Authorization", $"Bearer {apiKey}");
                
                var operation = request.SendWebRequest();
                
                while (!operation.isDone)
                {
                    await System.Threading.Tasks.Task.Yield();
                }
                
                if (request.result == UnityWebRequest.Result.Success)
                {
                    var response = JsonConvert.DeserializeObject<AIResponse<MarketInsights>>(request.downloadHandler.text);
                    
                    if (response.success)
                    {
                        marketInsights["latest"] = response.content;
                        OnMarketInsightsUpdated?.Invoke(response.content);
                        onComplete?.Invoke(response.content);
                    }
                    else
                    {
                        OnAIContentError?.Invoke($"Failed to get market insights: {response.error}");
                    }
                }
                else
                {
                    OnAIContentError?.Invoke($"Market insights failed: {request.error}");
                }
                
                request.Dispose();
            }
            catch (Exception e)
            {
                OnAIContentError?.Invoke($"Market insights error: {e.Message}");
            }
        }
        
        /// <summary>
        /// Get next content from queue
        /// </summary>
        public GeneratedContent GetNextContent()
        {
            if (contentQueue.Count > 0)
            {
                return contentQueue.Dequeue();
            }
            return null;
        }
        
        /// <summary>
        /// Get content queue size
        /// </summary>
        public int GetContentQueueSize()
        {
            return contentQueue.Count;
        }
        
        /// <summary>
        /// Content generation loop
        /// </summary>
        private IEnumerator ContentGenerationLoop()
        {
            while (enableAIContent)
            {
                if (contentQueue.Count < maxContentQueue)
                {
                    // Generate different types of content
                    GenerateAIContent("level");
                    GenerateAIContent("event");
                    GenerateAIContent("visual");
                }
                
                yield return new WaitForSeconds(contentGenerationInterval);
            }
        }
        
        /// <summary>
        /// Personalization loop
        /// </summary>
        private IEnumerator PersonalizationLoop()
        {
            while (enablePersonalization)
            {
                // Update player profile
                UpdatePlayerProfile();
                
                // Get market insights
                GetMarketInsights();
                
                yield return new WaitForSeconds(300); // 5 minutes
            }
        }
        
        /// <summary>
        /// Start personalization
        /// </summary>
        private void StartPersonalization()
        {
            if (personalizationCoroutine != null)
            {
                StopCoroutine(personalizationCoroutine);
            }
            
            personalizationCoroutine = StartCoroutine(PersonalizationLoop());
        }
        
        /// <summary>
        /// Update player profile
        /// </summary>
        private void UpdatePlayerProfile()
        {
            var playerId = GetCurrentPlayerId();
            if (!playerProfiles.ContainsKey(playerId))
            {
                CreatePlayerProfile(playerId);
            }
            else
            {
                UpdatePlayerProfileData(playerId);
            }
        }
        
        /// <summary>
        /// Create player profile
        /// </summary>
        private async void CreatePlayerProfile(string playerId)
        {
            try
            {
                var playerData = GetPlayerData();
                var requestData = new
                {
                    playerId = playerId,
                    initialData = playerData
                };
                
                var json = JsonConvert.SerializeObject(requestData);
                var request = new UnityWebRequest($"{aiApiBaseUrl}/player-profile", "POST");
                request.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json));
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");
                request.SetRequestHeader("Authorization", $"Bearer {apiKey}");
                
                var operation = request.SendWebRequest();
                
                while (!operation.isDone)
                {
                    await System.Threading.Tasks.Task.Yield();
                }
                
                if (request.result == UnityWebRequest.Result.Success)
                {
                    var response = JsonConvert.DeserializeObject<AIResponse<PlayerProfile>>(request.downloadHandler.text);
                    
                    if (response.success)
                    {
                        playerProfiles[playerId] = response.content;
                        OnPlayerProfileUpdated?.Invoke(response.content);
                    }
                }
                
                request.Dispose();
            }
            catch (Exception e)
            {
                OnAIContentError?.Invoke($"Player profile creation error: {e.Message}");
            }
        }
        
        /// <summary>
        /// Update player profile data
        /// </summary>
        private void UpdatePlayerProfileData(string playerId)
        {
            // Update local player profile with current data
            if (playerProfiles.ContainsKey(playerId))
            {
                var profile = playerProfiles[playerId];
                // Update profile with current player data
                OnPlayerProfileUpdated?.Invoke(profile);
            }
        }
        
        /// <summary>
        /// Get current player ID
        /// </summary>
        private string GetCurrentPlayerId()
        {
            return PlayerPrefs.GetString("PlayerId", System.Guid.NewGuid().ToString());
        }
        
        /// <summary>
        /// Get player preferences
        /// </summary>
        private Dictionary<string, object> GetPlayerPreferences()
        {
            return new Dictionary<string, object>
            {
                {"difficulty", PlayerPrefs.GetInt("PreferredDifficulty", 5)},
                {"theme", PlayerPrefs.GetString("PreferredTheme", "default")},
                {"playStyle", PlayerPrefs.GetString("PlayStyle", "casual")}
            };
        }
        
        /// <summary>
        /// Get player data
        /// </summary>
        private Dictionary<string, object> GetPlayerData()
        {
            return new Dictionary<string, object>
            {
                {"level", PlayerPrefs.GetInt("CurrentLevel", 1)},
                {"score", PlayerPrefs.GetInt("HighScore", 0)},
                {"playTime", PlayerPrefs.GetFloat("TotalPlayTime", 0)},
                {"purchases", PlayerPrefs.GetInt("TotalPurchases", 0)},
                {"sessions", PlayerPrefs.GetInt("TotalSessions", 0)}
            };
        }
        
        /// <summary>
        /// Load player profiles
        /// </summary>
        private void LoadPlayerProfiles()
        {
            // Load from local storage
            var profilesJson = PlayerPrefs.GetString("PlayerProfiles", "{}");
            try
            {
                var profiles = JsonConvert.DeserializeObject<Dictionary<string, PlayerProfile>>(profilesJson);
                if (profiles != null)
                {
                    playerProfiles = profiles;
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to load player profiles: {e.Message}");
            }
        }
        
        /// <summary>
        /// Load market insights
        /// </summary>
        private void LoadMarketInsights()
        {
            // Load from local storage
            var insightsJson = PlayerPrefs.GetString("MarketInsights", "{}");
            try
            {
                var insights = JsonConvert.DeserializeObject<Dictionary<string, MarketInsights>>(insightsJson);
                if (insights != null)
                {
                    marketInsights = insights;
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to load market insights: {e.Message}");
            }
        }
        
        void OnDestroy()
        {
            if (contentGenerationCoroutine != null)
            {
                StopCoroutine(contentGenerationCoroutine);
            }
            
            if (personalizationCoroutine != null)
            {
                StopCoroutine(personalizationCoroutine);
            }
        }
    }
    
    // Data classes
    [System.Serializable]
    public class GeneratedContent
    {
        public string id;
        public string type;
        public string title;
        public string description;
        public Dictionary<string, object> data;
        public Dictionary<string, object> metadata;
        public string generatedAt;
    }
    
    [System.Serializable]
    public class PlayerProfile
    {
        public string id;
        public Dictionary<string, object> basicInfo;
        public Dictionary<string, object> preferences;
        public Dictionary<string, object> engagementPatterns;
        public Dictionary<string, object> monetizationProfile;
        public float personalizationScore;
        public string lastUpdated;
        public bool aiGenerated;
    }
    
    [System.Serializable]
    public class MarketInsights
    {
        public string[] popularThemes;
        public string engagementPatterns;
        public string revenueTrends;
        public string competitorAnalysis;
        public string[] marketOpportunities;
        public string[] recommendedFeatures;
        public string timestamp;
    }
    
    [System.Serializable]
    public class Recommendation
    {
        public string id;
        public string type;
        public string title;
        public string description;
        public float confidence;
        public float expectedEngagement;
        public string[] personalizationFactors;
    }
    
    [System.Serializable]
    public class RecommendationResponse
    {
        public List<Recommendation> recommendations;
        public string reasoning;
        public string[] alternatives;
        public string[] nextSteps;
    }
    
    [System.Serializable]
    public class LevelData
    {
        public string id;
        public int levelNumber;
        public int difficulty;
        public Dictionary<string, object> board;
        public List<Dictionary<string, object>> objectives;
        public int moves;
        public string theme;
    }
    
    [System.Serializable]
    public class PlayerPerformance
    {
        public int score;
        public int movesUsed;
        public float timeSpent;
        public int stars;
        public bool completed;
    }
    
    [System.Serializable]
    public class DifficultyOptimization
    {
        public string levelId;
        public string playerId;
        public float originalDifficulty;
        public float adjustedDifficulty;
        public string adjustmentReason;
        public float confidence;
        public string timestamp;
    }
    
    [System.Serializable]
    public class ChurnPrediction
    {
        public string playerId;
        public float churnProbability;
        public string riskLevel;
        public Dictionary<string, object> factors;
        public List<Dictionary<string, object>> preventionActions;
        public string predictedChurnDate;
        public string timestamp;
    }
    
    [System.Serializable]
    public class PersonalizedOffer
    {
        public string id;
        public string type;
        public string title;
        public string description;
        public float price;
        public float value;
        public int discount;
        public string urgency;
        public float personalizationScore;
        public float conversionPrediction;
        public string targetAudience;
    }
    
    [System.Serializable]
    public class PersonalizedOfferResponse
    {
        public List<PersonalizedOffer> offers;
        public string strategy;
        public string timing;
        public string frequency;
    }
    
    [System.Serializable]
    public class AIResponse<T>
    {
        public bool success;
        public T content;
        public string error;
    }
}