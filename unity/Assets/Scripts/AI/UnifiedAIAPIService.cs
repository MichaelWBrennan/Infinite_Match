using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;
using System.Text;
using Newtonsoft.Json;

namespace Evergreen.AI
{
    /// <summary>
    /// Unified AI API Service - Single API for all AI functionality across the game
    /// Handles: Gameplay, UI/UX, Audio, Visual Effects, Economy, Analytics, Social
    /// </summary>
    public class UnifiedAIAPIService : MonoBehaviour
    {
        [Header("Unified AI API Configuration")]
        public string apiEndpoint = "https://api.your-ai-service.com/v1";
        public string apiKey = "your-api-key-here";
        public bool enableAPI = true;
        public bool enableCaching = true;
        public float cacheExpiryMinutes = 30f;
        public int maxRetries = 3;
        public float retryDelaySeconds = 1f;
        
        [Header("Fallback Settings")]
        public bool enableFallback = true;
        public bool enableLocalAI = true;
        public bool enableAlgorithmicAI = true;
        
        [Header("Performance Settings")]
        public int maxConcurrentRequests = 5;
        public float requestTimeoutSeconds = 30f;
        public bool enableRequestBatching = true;
        public float batchDelaySeconds = 0.1f;
        
        // Singleton
        public static UnifiedAIAPIService Instance { get; private set; }
        
        // Request management
        private Queue<AIRequest> _requestQueue = new Queue<AIRequest>();
        private Dictionary<string, AIResponse> _responseCache = new Dictionary<string, AIResponse>();
        private Dictionary<string, DateTime> _cacheTimestamps = new Dictionary<string, DateTime>();
        private int _activeRequests = 0;
        private Coroutine _requestProcessor;
        
        // Fallback systems
        private LocalAIFallback _localAIFallback;
        private AlgorithmicAIFallback _algorithmicAIFallback;
        
        // Events
        public static event Action<string, AIResponse> OnAIResponseReceived;
        public static event Action<string, string> OnAIError;
        public static event Action<string> OnAIRequestStarted;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeAIService();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            StartRequestProcessor();
        }
        
        private void InitializeAIService()
        {
            Debug.Log("🤖 Initializing Unified AI API Service...");
            
            // Initialize fallback systems
            if (enableFallback)
            {
                _localAIFallback = new LocalAIFallback();
                _algorithmicAIFallback = new AlgorithmicAIFallback();
            }
            
            Debug.Log("✅ Unified AI API Service Initialized");
        }
        
        private void StartRequestProcessor()
        {
            if (_requestProcessor != null)
            {
                StopCoroutine(_requestProcessor);
            }
            _requestProcessor = StartCoroutine(ProcessRequests());
        }
        
        #region Public API Methods
        
        /// <summary>
        /// Request AI assistance for gameplay
        /// </summary>
        public void RequestGameplayAI(string playerId, GameplayContext context, System.Action<GameplayAIResponse> callback)
        {
            var request = new AIRequest
            {
                Id = Guid.NewGuid().ToString(),
                Type = AIRequestType.Gameplay,
                PlayerId = playerId,
                Context = context,
                Callback = (response) => {
                    var gameplayResponse = JsonConvert.DeserializeObject<GameplayAIResponse>(response.Data);
                    callback?.Invoke(gameplayResponse);
                }
            };
            
            QueueRequest(request);
        }
        
        /// <summary>
        /// Request AI assistance for UI/UX
        /// </summary>
        public void RequestUIAI(string playerId, UIContext context, System.Action<UIAIResponse> callback)
        {
            var request = new AIRequest
            {
                Id = Guid.NewGuid().ToString(),
                Type = AIRequestType.UI,
                PlayerId = playerId,
                Context = context,
                Callback = (response) => {
                    var uiResponse = JsonConvert.DeserializeObject<UIAIResponse>(response.Data);
                    callback?.Invoke(uiResponse);
                }
            };
            
            QueueRequest(request);
        }
        
        /// <summary>
        /// Request AI assistance for audio
        /// </summary>
        public void RequestAudioAI(string playerId, AudioContext context, System.Action<AudioAIResponse> callback)
        {
            var request = new AIRequest
            {
                Id = Guid.NewGuid().ToString(),
                Type = AIRequestType.Audio,
                PlayerId = playerId,
                Context = context,
                Callback = (response) => {
                    var audioResponse = JsonConvert.DeserializeObject<AudioAIResponse>(response.Data);
                    callback?.Invoke(audioResponse);
                }
            };
            
            QueueRequest(request);
        }
        
        /// <summary>
        /// Request AI assistance for visual effects
        /// </summary>
        public void RequestVisualEffectsAI(string playerId, VisualEffectsContext context, System.Action<VisualEffectsAIResponse> callback)
        {
            var request = new AIRequest
            {
                Id = Guid.NewGuid().ToString(),
                Type = AIRequestType.VisualEffects,
                PlayerId = playerId,
                Context = context,
                Callback = (response) => {
                    var visualResponse = JsonConvert.DeserializeObject<VisualEffectsAIResponse>(response.Data);
                    callback?.Invoke(visualResponse);
                }
            };
            
            QueueRequest(request);
        }
        
        /// <summary>
        /// Request AI assistance for economy
        /// </summary>
        public void RequestEconomyAI(string playerId, EconomyContext context, System.Action<EconomyAIResponse> callback)
        {
            var request = new AIRequest
            {
                Id = Guid.NewGuid().ToString(),
                Type = AIRequestType.Economy,
                PlayerId = playerId,
                Context = context,
                Callback = (response) => {
                    var economyResponse = JsonConvert.DeserializeObject<EconomyAIResponse>(response.Data);
                    callback?.Invoke(economyResponse);
                }
            };
            
            QueueRequest(request);
        }
        
        /// <summary>
        /// Request AI assistance for analytics
        /// </summary>
        public void RequestAnalyticsAI(string playerId, AnalyticsContext context, System.Action<AnalyticsAIResponse> callback)
        {
            var request = new AIRequest
            {
                Id = Guid.NewGuid().ToString(),
                Type = AIRequestType.Analytics,
                PlayerId = playerId,
                Context = context,
                Callback = (response) => {
                    var analyticsResponse = JsonConvert.DeserializeObject<AnalyticsAIResponse>(response.Data);
                    callback?.Invoke(analyticsResponse);
                }
            };
            
            QueueRequest(request);
        }
        
        /// <summary>
        /// Request AI assistance for social features
        /// </summary>
        public void RequestSocialAI(string playerId, SocialContext context, System.Action<SocialAIResponse> callback)
        {
            var request = new AIRequest
            {
                Id = Guid.NewGuid().ToString(),
                Type = AIRequestType.Social,
                PlayerId = playerId,
                Context = context,
                Callback = (response) => {
                    var socialResponse = JsonConvert.DeserializeObject<SocialAIResponse>(response.Data);
                    callback?.Invoke(socialResponse);
                }
            };
            
            QueueRequest(request);
        }
        
        #endregion
        
        #region Request Processing
        
        private void QueueRequest(AIRequest request)
        {
            if (enableRequestBatching)
            {
                _requestQueue.Enqueue(request);
            }
            else
            {
                ProcessRequest(request);
            }
        }
        
        private IEnumerator ProcessRequests()
        {
            while (true)
            {
                if (_requestQueue.Count > 0 && _activeRequests < maxConcurrentRequests)
                {
                    var request = _requestQueue.Dequeue();
                    StartCoroutine(ProcessRequest(request));
                }
                
                yield return new WaitForSeconds(batchDelaySeconds);
            }
        }
        
        private IEnumerator ProcessRequest(AIRequest request)
        {
            _activeRequests++;
            OnAIRequestStarted?.Invoke(request.Id);
            
            // Check cache first
            if (enableCaching && IsCached(request))
            {
                var cachedResponse = GetCachedResponse(request);
                request.Callback?.Invoke(cachedResponse);
                _activeRequests--;
                yield break;
            }
            
            // Try API first
            if (enableAPI)
            {
                yield return StartCoroutine(SendAPIRequest(request));
            }
            
            // If API failed and fallback is enabled, use fallback
            if (!request.IsCompleted && enableFallback)
            {
                yield return StartCoroutine(ProcessFallbackRequest(request));
            }
            
            _activeRequests--;
        }
        
        private IEnumerator SendAPIRequest(AIRequest request)
        {
            var apiRequest = CreateAPIRequest(request);
            
            using (var webRequest = UnityWebRequest.Post(apiEndpoint, apiRequest))
            {
                webRequest.SetRequestHeader("Content-Type", "application/json");
                webRequest.SetRequestHeader("Authorization", $"Bearer {apiKey}");
                webRequest.timeout = (int)requestTimeoutSeconds;
                
                yield return webRequest.SendWebRequest();
                
                if (webRequest.result == UnityWebRequest.Result.Success)
                {
                    var response = JsonConvert.DeserializeObject<AIResponse>(webRequest.downloadHandler.text);
                    request.IsCompleted = true;
                    request.Callback?.Invoke(response);
                    
                    // Cache response
                    if (enableCaching)
                    {
                        CacheResponse(request, response);
                    }
                    
                    OnAIResponseReceived?.Invoke(request.Id, response);
                }
                else
                {
                    Debug.LogWarning($"API request failed: {webRequest.error}");
                    OnAIError?.Invoke(request.Id, webRequest.error);
                }
            }
        }
        
        private IEnumerator ProcessFallbackRequest(AIRequest request)
        {
            AIResponse response = null;
            
            // Try local AI first
            if (enableLocalAI && _localAIFallback != null)
            {
                response = _localAIFallback.ProcessRequest(request);
            }
            
            // If local AI failed, try algorithmic AI
            if (response == null && enableAlgorithmicAI && _algorithmicAIFallback != null)
            {
                response = _algorithmicAIFallback.ProcessRequest(request);
            }
            
            if (response != null)
            {
                request.IsCompleted = true;
                request.Callback?.Invoke(response);
                OnAIResponseReceived?.Invoke(request.Id, response);
            }
            else
            {
                OnAIError?.Invoke(request.Id, "All AI systems failed");
            }
            
            yield return null;
        }
        
        #endregion
        
        #region Caching
        
        private bool IsCached(AIRequest request)
        {
            var cacheKey = GenerateCacheKey(request);
            return _responseCache.ContainsKey(cacheKey) && 
                   _cacheTimestamps.ContainsKey(cacheKey) &&
                   DateTime.Now - _cacheTimestamps[cacheKey] < TimeSpan.FromMinutes(cacheExpiryMinutes);
        }
        
        private AIResponse GetCachedResponse(AIRequest request)
        {
            var cacheKey = GenerateCacheKey(request);
            return _responseCache[cacheKey];
        }
        
        private void CacheResponse(AIRequest request, AIResponse response)
        {
            var cacheKey = GenerateCacheKey(request);
            _responseCache[cacheKey] = response;
            _cacheTimestamps[cacheKey] = DateTime.Now;
        }
        
        private string GenerateCacheKey(AIRequest request)
        {
            return $"{request.Type}_{request.PlayerId}_{request.Context.GetHashCode()}";
        }
        
        #endregion
        
        #region API Request Creation
        
        private string CreateAPIRequest(AIRequest request)
        {
            var apiRequest = new
            {
                request_id = request.Id,
                type = request.Type.ToString().ToLower(),
                player_id = request.PlayerId,
                context = request.Context,
                timestamp = DateTime.Now,
                version = "1.0"
            };
            
            return JsonConvert.SerializeObject(apiRequest);
        }
        
        #endregion
        
        #region Utility Methods
        
        public void ClearCache()
        {
            _responseCache.Clear();
            _cacheTimestamps.Clear();
        }
        
        public int GetQueueSize()
        {
            return _requestQueue.Count;
        }
        
        public int GetActiveRequestCount()
        {
            return _activeRequests;
        }
        
        public void SetAPIEndpoint(string endpoint)
        {
            apiEndpoint = endpoint;
        }
        
        public void SetAPIKey(string key)
        {
            apiKey = key;
        }
        
        #endregion
        
        void OnDestroy()
        {
            if (_requestProcessor != null)
            {
                StopCoroutine(_requestProcessor);
            }
        }
    }
    
    #region Data Structures
    
    public class AIRequest
    {
        public string Id;
        public AIRequestType Type;
        public string PlayerId;
        public object Context;
        public System.Action<AIResponse> Callback;
        public bool IsCompleted = false;
    }
    
    public class AIResponse
    {
        public string RequestId;
        public bool Success;
        public string Data;
        public string Error;
        public DateTime Timestamp;
    }
    
    public enum AIRequestType
    {
        Gameplay,
        UI,
        Audio,
        VisualEffects,
        Economy,
        Analytics,
        Social
    }
    
    // Context classes for different AI requests
    public class GameplayContext
    {
        public string GameState;
        public string PlayerAction;
        public Dictionary<string, object> GameData;
        public string Difficulty;
        public float Performance;
    }
    
    public class UIContext
    {
        public string CurrentPanel;
        public string UserAction;
        public Dictionary<string, object> UIData;
        public string ScreenSize;
        public string Accessibility;
    }
    
    public class AudioContext
    {
        public string AudioType;
        public string GameState;
        public Dictionary<string, object> AudioData;
        public string Mood;
        public float Volume;
    }
    
    public class VisualEffectsContext
    {
        public string EffectType;
        public string GameState;
        public Dictionary<string, object> EffectData;
        public string Intensity;
        public string Style;
    }
    
    public class EconomyContext
    {
        public string EconomyAction;
        public string PlayerState;
        public Dictionary<string, object> EconomyData;
        public string Currency;
        public float Amount;
    }
    
    public class AnalyticsContext
    {
        public string AnalyticsType;
        public string PlayerId;
        public Dictionary<string, object> AnalyticsData;
        public string TimeRange;
        public string Metric;
    }
    
    public class SocialContext
    {
        public string SocialAction;
        public string PlayerId;
        public Dictionary<string, object> SocialData;
        public string TeamId;
        public string Message;
    }
    
    // Response classes for different AI requests
    public class GameplayAIResponse
    {
        public string Hint;
        public string Strategy;
        public float DifficultyAdjustment;
        public List<string> Recommendations;
        public Dictionary<string, object> GameplayData;
    }
    
    public class UIAIResponse
    {
        public string LayoutAdjustment;
        public string ColorScheme;
        public string AccessibilitySettings;
        public List<string> UIRecommendations;
        public Dictionary<string, object> UIData;
    }
    
    public class AudioAIResponse
    {
        public string MusicTrack;
        public float Volume;
        public string AudioEffect;
        public List<string> AudioRecommendations;
        public Dictionary<string, object> AudioData;
    }
    
    public class VisualEffectsAIResponse
    {
        public string EffectType;
        public string EffectStyle;
        public float Intensity;
        public List<string> EffectRecommendations;
        public Dictionary<string, object> EffectData;
    }
    
    public class EconomyAIResponse
    {
        public float PriceAdjustment;
        public string OfferType;
        public float Discount;
        public List<string> EconomyRecommendations;
        public Dictionary<string, object> EconomyData;
    }
    
    public class AnalyticsAIResponse
    {
        public string Pattern;
        public string Prediction;
        public float Confidence;
        public List<string> AnalyticsRecommendations;
        public Dictionary<string, object> AnalyticsData;
    }
    
    public class SocialAIResponse
    {
        public string TeamMatch;
        public string FriendRecommendation;
        public string EventRecommendation;
        public List<string> SocialRecommendations;
        public Dictionary<string, object> SocialData;
    }
    
    #endregion
}

#region Fallback Systems

public class LocalAIFallback
{
    public AIResponse ProcessRequest(AIRequest request)
    {
        // Local AI fallback implementation
        var response = new AIResponse
        {
            RequestId = request.Id,
            Success = true,
            Data = GenerateFallbackData(request),
            Timestamp = DateTime.Now
        };
        
        return response;
    }
    
    private string GenerateFallbackData(AIRequest request)
    {
        // Generate fallback data based on request type
        switch (request.Type)
        {
            case AIRequestType.Gameplay:
                return JsonConvert.SerializeObject(new GameplayAIResponse
                {
                    Hint = "Try to create larger matches",
                    Strategy = "Focus on the bottom rows",
                    DifficultyAdjustment = 0.1f,
                    Recommendations = new List<string> { "Look for patterns", "Plan ahead" }
                });
                
            case AIRequestType.UI:
                return JsonConvert.SerializeObject(new UIAIResponse
                {
                    LayoutAdjustment = "Compact",
                    ColorScheme = "Default",
                    AccessibilitySettings = "Standard",
                    UIRecommendations = new List<string> { "Use larger buttons", "Increase contrast" }
                });
                
            case AIRequestType.Audio:
                return JsonConvert.SerializeObject(new AudioAIResponse
                {
                    MusicTrack = "main_theme",
                    Volume = 0.7f,
                    AudioEffect = "None",
                    AudioRecommendations = new List<string> { "Adjust volume", "Try different music" }
                });
                
            case AIRequestType.VisualEffects:
                return JsonConvert.SerializeObject(new VisualEffectsAIResponse
                {
                    EffectType = "Standard",
                    EffectStyle = "Default",
                    Intensity = 0.5f,
                    EffectRecommendations = new List<string> { "Use particle effects", "Add screen shake" }
                });
                
            case AIRequestType.Economy:
                return JsonConvert.SerializeObject(new EconomyAIResponse
                {
                    PriceAdjustment = 1.0f,
                    OfferType = "Standard",
                    Discount = 0.0f,
                    EconomyRecommendations = new List<string> { "Check daily deals", "Save coins" }
                });
                
            case AIRequestType.Analytics:
                return JsonConvert.SerializeObject(new AnalyticsAIResponse
                {
                    Pattern = "Normal",
                    Prediction = "Stable",
                    Confidence = 0.5f,
                    AnalyticsRecommendations = new List<string> { "Monitor performance", "Track engagement" }
                });
                
            case AIRequestType.Social:
                return JsonConvert.SerializeObject(new SocialAIResponse
                {
                    TeamMatch = "None",
                    FriendRecommendation = "None",
                    EventRecommendation = "Weekly Tournament",
                    SocialRecommendations = new List<string> { "Join a team", "Make friends" }
                });
                
            default:
                return "{}";
        }
    }
}

public class AlgorithmicAIFallback
{
    public AIResponse ProcessRequest(AIRequest request)
    {
        // Algorithmic AI fallback implementation
        var response = new AIResponse
        {
            RequestId = request.Id,
            Success = true,
            Data = GenerateAlgorithmicData(request),
            Timestamp = DateTime.Now
        };
        
        return response;
    }
    
    private string GenerateAlgorithmicData(AIRequest request)
    {
        // Generate algorithmic data based on request type
        switch (request.Type)
        {
            case AIRequestType.Gameplay:
                return JsonConvert.SerializeObject(new GameplayAIResponse
                {
                    Hint = "Algorithmic hint: Look for 3+ matches",
                    Strategy = "Algorithmic strategy: Clear bottom first",
                    DifficultyAdjustment = CalculateDifficultyAdjustment(request),
                    Recommendations = GenerateAlgorithmicRecommendations(request)
                });
                
            case AIRequestType.UI:
                return JsonConvert.SerializeObject(new UIAIResponse
                {
                    LayoutAdjustment = "Algorithmic layout",
                    ColorScheme = "Algorithmic colors",
                    AccessibilitySettings = "Algorithmic accessibility",
                    UIRecommendations = new List<string> { "Algorithmic UI suggestion 1", "Algorithmic UI suggestion 2" }
                });
                
            case AIRequestType.Audio:
                return JsonConvert.SerializeObject(new AudioAIResponse
                {
                    MusicTrack = "algorithmic_track",
                    Volume = CalculateAlgorithmicVolume(request),
                    AudioEffect = "Algorithmic effect",
                    AudioRecommendations = new List<string> { "Algorithmic audio suggestion 1", "Algorithmic audio suggestion 2" }
                });
                
            case AIRequestType.VisualEffects:
                return JsonConvert.SerializeObject(new VisualEffectsAIResponse
                {
                    EffectType = "Algorithmic effect",
                    EffectStyle = "Algorithmic style",
                    Intensity = CalculateAlgorithmicIntensity(request),
                    EffectRecommendations = new List<string> { "Algorithmic effect suggestion 1", "Algorithmic effect suggestion 2" }
                });
                
            case AIRequestType.Economy:
                return JsonConvert.SerializeObject(new EconomyAIResponse
                {
                    PriceAdjustment = CalculateAlgorithmicPriceAdjustment(request),
                    OfferType = "Algorithmic offer",
                    Discount = CalculateAlgorithmicDiscount(request),
                    EconomyRecommendations = new List<string> { "Algorithmic economy suggestion 1", "Algorithmic economy suggestion 2" }
                });
                
            case AIRequestType.Analytics:
                return JsonConvert.SerializeObject(new AnalyticsAIResponse
                {
                    Pattern = "Algorithmic pattern",
                    Prediction = "Algorithmic prediction",
                    Confidence = CalculateAlgorithmicConfidence(request),
                    AnalyticsRecommendations = new List<string> { "Algorithmic analytics suggestion 1", "Algorithmic analytics suggestion 2" }
                });
                
            case AIRequestType.Social:
                return JsonConvert.SerializeObject(new SocialAIResponse
                {
                    TeamMatch = "Algorithmic team match",
                    FriendRecommendation = "Algorithmic friend",
                    EventRecommendation = "Algorithmic event",
                    SocialRecommendations = new List<string> { "Algorithmic social suggestion 1", "Algorithmic social suggestion 2" }
                });
                
            default:
                return "{}";
        }
    }
    
    private float CalculateDifficultyAdjustment(AIRequest request)
    {
        // Algorithmic difficulty calculation
        return UnityEngine.Random.Range(-0.2f, 0.2f);
    }
    
    private List<string> GenerateAlgorithmicRecommendations(AIRequest request)
    {
        return new List<string> { "Algorithmic recommendation 1", "Algorithmic recommendation 2" };
    }
    
    private float CalculateAlgorithmicVolume(AIRequest request)
    {
        return UnityEngine.Random.Range(0.5f, 1.0f);
    }
    
    private float CalculateAlgorithmicIntensity(AIRequest request)
    {
        return UnityEngine.Random.Range(0.3f, 1.0f);
    }
    
    private float CalculateAlgorithmicPriceAdjustment(AIRequest request)
    {
        return UnityEngine.Random.Range(0.8f, 1.2f);
    }
    
    private float CalculateAlgorithmicDiscount(AIRequest request)
    {
        return UnityEngine.Random.Range(0.0f, 0.3f);
    }
    
    private float CalculateAlgorithmicConfidence(AIRequest request)
    {
        return UnityEngine.Random.Range(0.6f, 0.9f);
    }
}

#endregion