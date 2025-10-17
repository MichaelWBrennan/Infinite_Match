using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;
using System.Text;
using Newtonsoft.Json;
using Evergreen.Core;
using Evergreen.AI;

namespace Evergreen.Integration
{
    /// <summary>
    /// Backend Connector - Handles communication with Node.js backend
    /// Manages API calls, data synchronization, and error handling
    /// </summary>
    public class BackendConnector : MonoBehaviour
    {
        [Header("Backend Configuration")]
        public string baseUrl = "https://your-api.com/api";
        public string apiKey = "your-api-key";
        public float requestTimeout = 10f;
        public int maxRetries = 3;
        
        [Header("Endpoints")]
        public string gameDataEndpoint = "/game/data";
        public string aiContentEndpoint = "/ai/generate";
        public string analyticsEndpoint = "/analytics/track";
        public string saveDataEndpoint = "/save/data";
        public string leaderboardEndpoint = "/social/leaderboard";
        
        [Header("Debug")]
        public bool enableLogging = true;
        public bool simulateOffline = false;
        
        // Singleton
        public static BackendConnector Instance { get; private set; }
        
        // State
        private bool isOnline = true;
        private Queue<APIRequest> requestQueue = new Queue<APIRequest>();
        private Dictionary<string, object> cachedData = new Dictionary<string, object>();
        
        // Events
        public System.Action<bool> OnConnectionStatusChanged;
        public System.Action<string, object> OnDataReceived;
        public System.Action<string, string> OnError;
        
        [System.Serializable]
        public class APIRequest
        {
            public string endpoint;
            public string method;
            public object data;
            public System.Action<string> onSuccess;
            public System.Action<string> onError;
            public int retries;
        }
        
        [System.Serializable]
        public class GameData
        {
            public int level;
            public int score;
            public int moves;
            public int coins;
            public int gems;
            public Dictionary<string, object> progress;
        }
        
        [System.Serializable]
        public class AIContentRequest
        {
            public string contentType;
            public int level;
            public Dictionary<string, object> context;
            public Dictionary<string, object> playerProfile;
        }
        
        [System.Serializable]
        public class AIContentResponse
        {
            public bool success;
            public string contentId;
            public object content;
            public string error;
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                Initialize();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            // Check connection status
            StartCoroutine(CheckConnectionStatus());
            
            // Process queued requests
            StartCoroutine(ProcessRequestQueue());
        }
        
        /// <summary>
        /// Initialize backend connector
        /// </summary>
        private void Initialize()
        {
            // Load configuration from PlayerPrefs or config file
            LoadConfiguration();
            
            // Setup headers
            SetupHeaders();
            
            Debug.Log("🌐 Backend Connector initialized");
        }
        
        /// <summary>
        /// Load configuration
        /// </summary>
        private void LoadConfiguration()
        {
            baseUrl = PlayerPrefs.GetString("BackendUrl", baseUrl);
            apiKey = PlayerPrefs.GetString("ApiKey", apiKey);
        }
        
        /// <summary>
        /// Setup request headers
        /// </summary>
        private void SetupHeaders()
        {
            // Headers will be set in individual requests
        }
        
        /// <summary>
        /// Check connection status
        /// </summary>
        private IEnumerator CheckConnectionStatus()
        {
            while (true)
            {
                yield return StartCoroutine(TestConnection());
                yield return new WaitForSeconds(30f); // Check every 30 seconds
            }
        }
        
        /// <summary>
        /// Test connection to backend
        /// </summary>
        private IEnumerator TestConnection()
        {
            if (simulateOffline)
            {
                SetConnectionStatus(false);
                yield break;
            }
            
            string url = baseUrl + "/health";
            
            using (UnityWebRequest request = UnityWebRequest.Get(url))
            {
                request.timeout = 5;
                request.SetRequestHeader("Authorization", "Bearer " + apiKey);
                
                yield return request.SendWebRequest();
                
                bool wasOnline = isOnline;
                isOnline = request.result == UnityWebRequest.Result.Success;
                
                if (wasOnline != isOnline)
                {
                    SetConnectionStatus(isOnline);
                }
            }
        }
        
        /// <summary>
        /// Set connection status
        /// </summary>
        private void SetConnectionStatus(bool online)
        {
            isOnline = online;
            OnConnectionStatusChanged?.Invoke(online);
            
            if (enableLogging)
            {
                Debug.Log($"🌐 Backend connection: {(online ? "Online" : "Offline")}");
            }
        }
        
        /// <summary>
        /// Process request queue
        /// </summary>
        private IEnumerator ProcessRequestQueue()
        {
            while (true)
            {
                if (requestQueue.Count > 0 && isOnline)
                {
                    APIRequest request = requestQueue.Dequeue();
                    yield return StartCoroutine(ProcessRequest(request));
                }
                
                yield return new WaitForSeconds(0.1f);
            }
        }
        
        /// <summary>
        /// Process individual request
        /// </summary>
        private IEnumerator ProcessRequest(APIRequest request)
        {
            string url = baseUrl + request.endpoint;
            string jsonData = request.data != null ? JsonConvert.SerializeObject(request.data) : "";
            
            using (UnityWebRequest webRequest = CreateWebRequest(url, request.method, jsonData))
            {
                webRequest.timeout = (int)requestTimeout;
                
                yield return webRequest.SendWebRequest();
                
                if (webRequest.result == UnityWebRequest.Result.Success)
                {
                    request.onSuccess?.Invoke(webRequest.downloadHandler.text);
                }
                else
                {
                    HandleRequestError(request, webRequest.error);
                }
            }
        }
        
        /// <summary>
        /// Create web request
        /// </summary>
        private UnityWebRequest CreateWebRequest(string url, string method, string jsonData)
        {
            UnityWebRequest request;
            
            switch (method.ToUpper())
            {
                case "GET":
                    request = UnityWebRequest.Get(url);
                    break;
                case "POST":
                    request = UnityWebRequest.Post(url, jsonData, "application/json");
                    break;
                case "PUT":
                    request = UnityWebRequest.Put(url, jsonData);
                    break;
                case "DELETE":
                    request = UnityWebRequest.Delete(url);
                    break;
                default:
                    request = UnityWebRequest.Get(url);
                    break;
            }
            
            // Set headers
            request.SetRequestHeader("Authorization", "Bearer " + apiKey);
            request.SetRequestHeader("Content-Type", "application/json");
            request.SetRequestHeader("User-Agent", "EvergreenMatch3/1.0");
            
            return request;
        }
        
        /// <summary>
        /// Handle request error
        /// </summary>
        private void HandleRequestError(APIRequest request, string error)
        {
            request.retries++;
            
            if (request.retries < maxRetries)
            {
                // Retry request
                requestQueue.Enqueue(request);
                
                if (enableLogging)
                {
                    Debug.LogWarning($"🔄 Retrying request to {request.endpoint} (attempt {request.retries})");
                }
            }
            else
            {
                // Max retries reached
                request.onError?.Invoke(error);
                OnError?.Invoke(request.endpoint, error);
                
                if (enableLogging)
                {
                    Debug.LogError($"❌ Request failed after {maxRetries} retries: {error}");
                }
            }
        }
        
        /// <summary>
        /// Send game data to backend
        /// </summary>
        public void SendGameData(GameData gameData)
        {
            if (!isOnline)
            {
                // Queue for later
                QueueRequest(new APIRequest
                {
                    endpoint = gameDataEndpoint,
                    method = "POST",
                    data = gameData,
                    onSuccess = (response) => {
                        if (enableLogging) Debug.Log("✅ Game data saved");
                    },
                    onError = (error) => {
                        Debug.LogError($"❌ Failed to save game data: {error}");
                    }
                });
                return;
            }
            
            StartCoroutine(SendGameDataCoroutine(gameData));
        }
        
        /// <summary>
        /// Send game data coroutine
        /// </summary>
        private IEnumerator SendGameDataCoroutine(GameData gameData)
        {
            string url = baseUrl + gameDataEndpoint;
            string jsonData = JsonConvert.SerializeObject(gameData);
            
            using (UnityWebRequest request = UnityWebRequest.Post(url, jsonData, "application/json"))
            {
                request.SetRequestHeader("Authorization", "Bearer " + apiKey);
                request.SetRequestHeader("Content-Type", "application/json");
                request.timeout = (int)requestTimeout;
                
                yield return request.SendWebRequest();
                
                if (request.result == UnityWebRequest.Result.Success)
                {
                    if (enableLogging) Debug.Log("✅ Game data saved successfully");
                }
                else
                {
                    Debug.LogError($"❌ Failed to save game data: {request.error}");
                }
            }
        }
        
        /// <summary>
        /// Request AI content
        /// </summary>
        public void RequestAIContent(AIContentRequest contentRequest, System.Action<AIContentResponse> onComplete)
        {
            if (!isOnline)
            {
                // Return cached content or default
                onComplete?.Invoke(GetCachedAIContent(contentRequest.contentType));
                return;
            }
            
            StartCoroutine(RequestAIContentCoroutine(contentRequest, onComplete));
        }
        
        /// <summary>
        /// Request AI content coroutine
        /// </summary>
        private IEnumerator RequestAIContentCoroutine(AIContentRequest contentRequest, System.Action<AIContentResponse> onComplete)
        {
            string url = baseUrl + aiContentEndpoint;
            string jsonData = JsonConvert.SerializeObject(contentRequest);
            
            using (UnityWebRequest request = UnityWebRequest.Post(url, jsonData, "application/json"))
            {
                request.SetRequestHeader("Authorization", "Bearer " + apiKey);
                request.SetRequestHeader("Content-Type", "application/json");
                request.timeout = (int)requestTimeout;
                
                yield return request.SendWebRequest();
                
                AIContentResponse response = new AIContentResponse();
                
                if (request.result == UnityWebRequest.Result.Success)
                {
                    try
                    {
                        response = JsonConvert.DeserializeObject<AIContentResponse>(request.downloadHandler.text);
                        response.success = true;
                        
                        // Cache content
                        CacheAIContent(contentRequest.contentType, response.content);
                    }
                    catch (System.Exception e)
                    {
                        response.success = false;
                        response.error = e.Message;
                    }
                }
                else
                {
                    response.success = false;
                    response.error = request.error;
                }
                
                onComplete?.Invoke(response);
            }
        }
        
        /// <summary>
        /// Track analytics event
        /// </summary>
        public void TrackEvent(string eventName, Dictionary<string, object> eventData)
        {
            if (!isOnline)
            {
                // Queue for later
                QueueRequest(new APIRequest
                {
                    endpoint = analyticsEndpoint,
                    method = "POST",
                    data = new { eventName = eventName, data = eventData },
                    onSuccess = (response) => {
                        if (enableLogging) Debug.Log($"✅ Event tracked: {eventName}");
                    },
                    onError = (error) => {
                        Debug.LogError($"❌ Failed to track event: {error}");
                    }
                });
                return;
            }
            
            StartCoroutine(TrackEventCoroutine(eventName, eventData));
        }
        
        /// <summary>
        /// Track event coroutine
        /// </summary>
        private IEnumerator TrackEventCoroutine(string eventName, Dictionary<string, object> eventData)
        {
            string url = baseUrl + analyticsEndpoint;
            string jsonData = JsonConvert.SerializeObject(new { eventName = eventName, data = eventData });
            
            using (UnityWebRequest request = UnityWebRequest.Post(url, jsonData, "application/json"))
            {
                request.SetRequestHeader("Authorization", "Bearer " + apiKey);
                request.SetRequestHeader("Content-Type", "application/json");
                request.timeout = (int)requestTimeout;
                
                yield return request.SendWebRequest();
                
                if (request.result == UnityWebRequest.Result.Success)
                {
                    if (enableLogging) Debug.Log($"✅ Event tracked: {eventName}");
                }
                else
                {
                    Debug.LogError($"❌ Failed to track event: {request.error}");
                }
            }
        }
        
        /// <summary>
        /// Get leaderboard data
        /// </summary>
        public void GetLeaderboard(string leaderboardType, System.Action<object> onComplete)
        {
            if (!isOnline)
            {
                // Return cached data
                onComplete?.Invoke(GetCachedData("leaderboard_" + leaderboardType));
                return;
            }
            
            StartCoroutine(GetLeaderboardCoroutine(leaderboardType, onComplete));
        }
        
        /// <summary>
        /// Get leaderboard coroutine
        /// </summary>
        private IEnumerator GetLeaderboardCoroutine(string leaderboardType, System.Action<object> onComplete)
        {
            string url = baseUrl + leaderboardEndpoint + "?type=" + leaderboardType;
            
            using (UnityWebRequest request = UnityWebRequest.Get(url))
            {
                request.SetRequestHeader("Authorization", "Bearer " + apiKey);
                request.timeout = (int)requestTimeout;
                
                yield return request.SendWebRequest();
                
                if (request.result == UnityWebRequest.Result.Success)
                {
                    try
                    {
                        object leaderboardData = JsonConvert.DeserializeObject(request.downloadHandler.text);
                        onComplete?.Invoke(leaderboardData);
                        
                        // Cache data
                        CacheData("leaderboard_" + leaderboardType, leaderboardData);
                    }
                    catch (System.Exception e)
                    {
                        Debug.LogError($"❌ Failed to parse leaderboard data: {e.Message}");
                        onComplete?.Invoke(null);
                    }
                }
                else
                {
                    Debug.LogError($"❌ Failed to get leaderboard: {request.error}");
                    onComplete?.Invoke(null);
                }
            }
        }
        
        /// <summary>
        /// Queue request for later processing
        /// </summary>
        private void QueueRequest(APIRequest request)
        {
            requestQueue.Enqueue(request);
            
            if (enableLogging)
            {
                Debug.Log($"📝 Queued request: {request.method} {request.endpoint}");
            }
        }
        
        /// <summary>
        /// Cache AI content
        /// </summary>
        private void CacheAIContent(string contentType, object content)
        {
            string key = "ai_content_" + contentType;
            cachedData[key] = content;
        }
        
        /// <summary>
        /// Get cached AI content
        /// </summary>
        private AIContentResponse GetCachedAIContent(string contentType)
        {
            string key = "ai_content_" + contentType;
            
            if (cachedData.ContainsKey(key))
            {
                return new AIContentResponse
                {
                    success = true,
                    content = cachedData[key]
                };
            }
            
            return new AIContentResponse
            {
                success = false,
                error = "No cached content available"
            };
        }
        
        /// <summary>
        /// Cache data
        /// </summary>
        private void CacheData(string key, object data)
        {
            cachedData[key] = data;
        }
        
        /// <summary>
        /// Get cached data
        /// </summary>
        private object GetCachedData(string key)
        {
            return cachedData.ContainsKey(key) ? cachedData[key] : null;
        }
        
        /// <summary>
        /// Check if online
        /// </summary>
        public bool IsOnline()
        {
            return isOnline;
        }
        
        /// <summary>
        /// Get queued requests count
        /// </summary>
        public int GetQueuedRequestsCount()
        {
            return requestQueue.Count;
        }
        
        /// <summary>
        /// Clear request queue
        /// </summary>
        public void ClearRequestQueue()
        {
            requestQueue.Clear();
        }
        
        /// <summary>
        /// Set API key
        /// </summary>
        public void SetApiKey(string newApiKey)
        {
            apiKey = newApiKey;
            PlayerPrefs.SetString("ApiKey", apiKey);
        }
        
        /// <summary>
        /// Set base URL
        /// </summary>
        public void SetBaseUrl(string newBaseUrl)
        {
            baseUrl = newBaseUrl;
            PlayerPrefs.SetString("BackendUrl", baseUrl);
        }
    }
}