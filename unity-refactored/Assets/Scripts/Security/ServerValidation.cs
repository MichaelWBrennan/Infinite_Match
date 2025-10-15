using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;
using Evergreen.Core;

namespace Evergreen.Security
{
    /// <summary>
    /// Server-side validation system for Unity client
    /// Validates game data with the backend anti-cheat system
    /// </summary>
    public class ServerValidation : MonoBehaviour
    {
        [Header("Server Configuration")]
        public string serverUrl = "http://localhost:3030";
        public string authToken;
        public string sessionId;
        public string playerId;
        
        [Header("Validation Settings")]
        public bool enableServerValidation = true;
        public float validationInterval = 1f;
        public int maxRetries = 3;
        public float retryDelay = 2f;
        
        [Header("Debug")]
        public bool enableDebugLogs = true;
        
        private Queue<GameData> pendingValidations = new Queue<GameData>();
        private bool isValidationInProgress = false;
        private Coroutine validationCoroutine;
        
        // Events
        public event Action<ValidationResult> OnValidationResult;
        public event Action<string> OnValidationError;
        public event Action<bool> OnServerConnectionStatus;
        
        public static ServerValidation Instance { get; private set; }
        
        [System.Serializable]
        public class GameData
        {
            public string actionType;
            public Dictionary<string, object> data;
            public long timestamp;
            public string requestId;
        }
        
        [System.Serializable]
        public class ValidationResult
        {
            public bool isValid;
            public List<SecurityViolation> violations;
            public List<SuspiciousActivity> suspiciousActivities;
            public float riskScore;
            public string message;
        }
        
        [System.Serializable]
        public class SecurityViolation
        {
            public string type;
            public string message;
            public string severity;
            public object value;
        }
        
        [System.Serializable]
        public class SuspiciousActivity
        {
            public string type;
            public string message;
            public string severity;
            public float confidence;
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeServerValidation();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (enableServerValidation)
            {
                StartValidationCoroutine();
            }
        }
        
        private void InitializeServerValidation()
        {
            if (enableDebugLogs)
            {
                Debug.Log("[ServerValidation] Initialized server validation system");
            }
        }
        
        private void StartValidationCoroutine()
        {
            if (validationCoroutine != null)
            {
                StopCoroutine(validationCoroutine);
            }
            
            validationCoroutine = StartCoroutine(ValidationCoroutine());
        }
        
        private IEnumerator ValidationCoroutine()
        {
            while (enableServerValidation)
            {
                yield return new WaitForSeconds(validationInterval);
                
                if (pendingValidations.Count > 0 && !isValidationInProgress)
                {
                    yield return StartCoroutine(ProcessPendingValidations());
                }
            }
        }
        
        private IEnumerator ProcessPendingValidations()
        {
            isValidationInProgress = true;
            
            while (pendingValidations.Count > 0)
            {
                var gameData = pendingValidations.Dequeue();
                yield return StartCoroutine(ValidateGameData(gameData));
                
                // Small delay between validations to avoid overwhelming the server
                yield return new WaitForSeconds(0.1f);
            }
            
            isValidationInProgress = false;
        }
        
        /// <summary>
        /// Submit game data for server validation
        /// </summary>
        public void SubmitGameData(string actionType, Dictionary<string, object> data)
        {
            if (!enableServerValidation) return;
            
            var gameData = new GameData
            {
                actionType = actionType,
                data = data,
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                requestId = Guid.NewGuid().ToString()
            };
            
            pendingValidations.Enqueue(gameData);
            
            if (enableDebugLogs)
            {
                Debug.Log($"[ServerValidation] Queued validation for action: {actionType}");
            }
        }
        
        /// <summary>
        /// Validate game data with server
        /// </summary>
        private IEnumerator ValidateGameData(GameData gameData)
        {
            if (string.IsNullOrEmpty(authToken))
            {
                if (enableDebugLogs)
                {
                    Debug.LogWarning("[ServerValidation] No auth token available for validation");
                }
                yield break;
            }
            
            string url = $"{serverUrl}/game/submit_data";
            string jsonData = JsonUtility.ToJson(new { gameData = gameData.data, actionType = gameData.actionType });
            
            using (UnityWebRequest request = new UnityWebRequest(url, "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");
                request.SetRequestHeader("Authorization", $"Bearer {authToken}");
                
                yield return request.SendWebRequest();
                
                if (request.result == UnityWebRequest.Result.Success)
                {
                    ProcessValidationResponse(request.downloadHandler.text, gameData);
                }
                else
                {
                    HandleValidationError(request.error, request.responseCode, gameData);
                }
            }
        }
        
        /// <summary>
        /// Process validation response from server
        /// </summary>
        private void ProcessValidationResponse(string responseText, GameData gameData)
        {
            try
            {
                var response = JsonUtility.FromJson<ValidationResponse>(responseText);
                
                if (response.success)
                {
                    var validationResult = new ValidationResult
                    {
                        isValid = true,
                        violations = new List<SecurityViolation>(),
                        suspiciousActivities = new List<SuspiciousActivity>(),
                        riskScore = response.riskScore,
                        message = response.message
                    };
                    
                    OnValidationResult?.Invoke(validationResult);
                    
                    if (enableDebugLogs)
                    {
                        Debug.Log($"[ServerValidation] Validation successful for {gameData.actionType}");
                    }
                }
                else
                {
                    var validationResult = new ValidationResult
                    {
                        isValid = false,
                        violations = ParseViolations(response.violations),
                        suspiciousActivities = new List<SuspiciousActivity>(),
                        riskScore = 1.0f,
                        message = response.error
                    };
                    
                    OnValidationResult?.Invoke(validationResult);
                    OnValidationError?.Invoke(response.error);
                    
                    if (enableDebugLogs)
                    {
                        Debug.LogWarning($"[ServerValidation] Validation failed for {gameData.actionType}: {response.error}");
                    }
                }
            }
            catch (Exception ex)
            {
                if (enableDebugLogs)
                {
                    Debug.LogError($"[ServerValidation] Failed to parse validation response: {ex.Message}");
                }
                
                OnValidationError?.Invoke($"Failed to parse server response: {ex.Message}");
            }
        }
        
        /// <summary>
        /// Handle validation error
        /// </summary>
        private void HandleValidationError(string error, long responseCode, GameData gameData)
        {
            if (enableDebugLogs)
            {
                Debug.LogError($"[ServerValidation] Validation error: {error} (Code: {responseCode})");
            }
            
            OnValidationError?.Invoke($"Server validation failed: {error}");
            
            // Check if it's a temporary error and retry
            if (responseCode >= 500 && pendingValidations.Count < 10) // Don't retry too many times
            {
                StartCoroutine(RetryValidation(gameData));
            }
        }
        
        /// <summary>
        /// Retry validation after delay
        /// </summary>
        private IEnumerator RetryValidation(GameData gameData)
        {
            yield return new WaitForSeconds(retryDelay);
            pendingValidations.Enqueue(gameData);
        }
        
        /// <summary>
        /// Parse violations from server response
        /// </summary>
        private List<SecurityViolation> ParseViolations(string violationsJson)
        {
            var violations = new List<SecurityViolation>();
            
            if (string.IsNullOrEmpty(violationsJson)) return violations;
            
            try
            {
                // Simple JSON parsing for violations
                // In a real implementation, you'd use a proper JSON parser
                var violationData = JsonUtility.FromJson<ViolationData>(violationsJson);
                if (violationData != null && violationData.violations != null)
                {
                    violations.AddRange(violationData.violations);
                }
            }
            catch (Exception ex)
            {
                if (enableDebugLogs)
                {
                    Debug.LogError($"[ServerValidation] Failed to parse violations: {ex.Message}");
                }
            }
            
            return violations;
        }
        
        /// <summary>
        /// Authenticate with server
        /// </summary>
        public IEnumerator Authenticate(string playerId, string password = null)
        {
            this.playerId = playerId;
            
            string url = $"{serverUrl}/auth/login";
            string jsonData = JsonUtility.ToJson(new { 
                playerId = playerId, 
                password = password,
                deviceInfo = GetDeviceInfo()
            });
            
            using (UnityWebRequest request = new UnityWebRequest(url, "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");
                
                yield return request.SendWebRequest();
                
                if (request.result == UnityWebRequest.Result.Success)
                {
                    var response = JsonUtility.FromJson<AuthResponse>(request.downloadHandler.text);
                    if (response.success)
                    {
                        authToken = response.token;
                        sessionId = response.sessionId;
                        
                        if (enableDebugLogs)
                        {
                            Debug.Log($"[ServerValidation] Authentication successful for player: {playerId}");
                        }
                        
                        OnServerConnectionStatus?.Invoke(true);
                    }
                    else
                    {
                        if (enableDebugLogs)
                        {
                            Debug.LogError($"[ServerValidation] Authentication failed: {response.error}");
                        }
                        
                        OnServerConnectionStatus?.Invoke(false);
                    }
                }
                else
                {
                    if (enableDebugLogs)
                    {
                        Debug.LogError($"[ServerValidation] Authentication request failed: {request.error}");
                    }
                    
                    OnServerConnectionStatus?.Invoke(false);
                }
            }
        }
        
        /// <summary>
        /// Logout from server
        /// </summary>
        public IEnumerator Logout()
        {
            if (string.IsNullOrEmpty(authToken)) yield break;
            
            string url = $"{serverUrl}/auth/logout";
            
            using (UnityWebRequest request = new UnityWebRequest(url, "POST"))
            {
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Authorization", $"Bearer {authToken}");
                
                yield return request.SendWebRequest();
                
                if (request.result == UnityWebRequest.Result.Success)
                {
                    if (enableDebugLogs)
                    {
                        Debug.Log("[ServerValidation] Logout successful");
                    }
                }
                else
                {
                    if (enableDebugLogs)
                    {
                        Debug.LogError($"[ServerValidation] Logout failed: {request.error}");
                    }
                }
            }
            
            authToken = null;
            sessionId = null;
            playerId = null;
        }
        
        /// <summary>
        /// Get device information for authentication
        /// </summary>
        private Dictionary<string, object> GetDeviceInfo()
        {
            return new Dictionary<string, object>
            {
                {"deviceModel", SystemInfo.deviceModel},
                {"deviceName", SystemInfo.deviceName},
                {"deviceType", SystemInfo.deviceType.ToString()},
                {"operatingSystem", SystemInfo.operatingSystem},
                {"processorType", SystemInfo.processorType},
                {"systemMemorySize", SystemInfo.systemMemorySize},
                {"graphicsDeviceName", SystemInfo.graphicsDeviceName},
                {"graphicsMemorySize", SystemInfo.graphicsMemorySize},
                {"screenWidth", Screen.width},
                {"screenHeight", Screen.height},
                {"screenDPI", Screen.dpi},
                {"platform", Application.platform.ToString()},
                {"version", Application.version},
                {"unityVersion", Application.unityVersion}
            };
        }
        
        /// <summary>
        /// Get security profile from server
        /// </summary>
        public IEnumerator GetSecurityProfile()
        {
            if (string.IsNullOrEmpty(authToken)) yield break;
            
            string url = $"{serverUrl}/player/security_profile";
            
            using (UnityWebRequest request = new UnityWebRequest(url, "GET"))
            {
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Authorization", $"Bearer {authToken}");
                
                yield return request.SendWebRequest();
                
                if (request.result == UnityWebRequest.Result.Success)
                {
                    var response = JsonUtility.FromJson<SecurityProfileResponse>(request.downloadHandler.text);
                    if (response.success)
                    {
                        if (enableDebugLogs)
                        {
                            Debug.Log($"[ServerValidation] Security profile loaded - Risk Score: {response.profile.riskScore}");
                        }
                    }
                }
                else
                {
                    if (enableDebugLogs)
                    {
                        Debug.LogError($"[ServerValidation] Failed to get security profile: {request.error}");
                    }
                }
            }
        }
        
        void OnDestroy()
        {
            if (validationCoroutine != null)
            {
                StopCoroutine(validationCoroutine);
            }
        }
        
        // Response classes
        [System.Serializable]
        public class ValidationResponse
        {
            public bool success;
            public string message;
            public string error;
            public float riskScore;
            public string violations;
        }
        
        [System.Serializable]
        public class AuthResponse
        {
            public bool success;
            public string token;
            public string sessionId;
            public string error;
        }
        
        [System.Serializable]
        public class ViolationData
        {
            public SecurityViolation[] violations;
        }
        
        [System.Serializable]
        public class SecurityProfileResponse
        {
            public bool success;
            public SecurityProfile profile;
        }
        
        [System.Serializable]
        public class SecurityProfile
        {
            public string playerId;
            public long createdAt;
            public long lastActivity;
            public float riskScore;
            public bool isBanned;
            public int violationCount;
            public int suspiciousActivityCount;
        }
    }
}