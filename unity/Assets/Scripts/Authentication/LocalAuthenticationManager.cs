using System;
using System.Collections.Generic;
using UnityEngine;
using System.Security.Cryptography;
using System.Text;

namespace Evergreen.Authentication
{
    /// <summary>
    /// Local authentication manager that handles player authentication without Unity Services
    /// </summary>
    public class LocalAuthenticationManager : MonoBehaviour
    {
        [Header("Authentication Settings")]
        [SerializeField] private bool enableLocalAuth = true;
        [SerializeField] private bool enableAnonymousAuth = true;
        [SerializeField] private bool enableDebugLogs = true;
        [SerializeField] private bool autoSignIn = true;
        
        [Header("Player Data")]
        [SerializeField] private string playerIdKey = "LocalPlayerId";
        [SerializeField] private string playerNameKey = "LocalPlayerName";
        [SerializeField] private string authTokenKey = "LocalAuthToken";
        
        public static LocalAuthenticationManager Instance { get; private set; }
        
        private bool _isInitialized = false;
        private bool _isAuthenticated = false;
        private string _playerId;
        private string _playerName;
        private string _authToken;
        private Dictionary<string, object> _playerData = new Dictionary<string, object>();
        
        // Events
        public System.Action OnInitialized;
        public System.Action OnAuthenticated;
        public System.Action OnSignOut;
        public System.Action<string> OnAuthenticationFailed;
        
        public bool IsInitialized => _isInitialized;
        public bool IsAuthenticated => _isAuthenticated;
        public string PlayerId => _playerId;
        public string PlayerName => _playerName;
        public string AuthToken => _authToken;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeLocalAuth();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (autoSignIn)
            {
                SignInAnonymously();
            }
        }
        
        private void InitializeLocalAuth()
        {
            if (!enableLocalAuth) return;
            
            try
            {
                // Load existing player data
                LoadPlayerData();
                
                _isInitialized = true;
                OnInitialized?.Invoke();
                
                if (enableDebugLogs)
                    Debug.Log("Local Authentication Manager initialized");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to initialize Local Authentication: {e.Message}");
            }
        }
        
        public async System.Threading.Tasks.Task<bool> SignInAnonymously()
        {
            if (!enableLocalAuth || !enableAnonymousAuth)
            {
                if (enableDebugLogs)
                    Debug.LogWarning("Local authentication or anonymous auth is disabled");
                return false;
            }
            
            try
            {
                if (enableDebugLogs)
                    Debug.Log("Signing in anonymously...");
                
                // Generate or retrieve player ID
                _playerId = GetOrCreatePlayerId();
                
                // Generate player name
                _playerName = GetOrCreatePlayerName();
                
                // Generate auth token
                _authToken = GenerateAuthToken();
                
                // Load player data
                LoadPlayerData();
                
                _isAuthenticated = true;
                OnAuthenticated?.Invoke();
                
                if (enableDebugLogs)
                    Debug.Log($"Anonymous sign-in successful. Player ID: {_playerId}");
                
                return true;
            }
            catch (Exception e)
            {
                Debug.LogError($"Anonymous sign-in failed: {e.Message}");
                OnAuthenticationFailed?.Invoke(e.Message);
                return false;
            }
        }
        
        public async System.Threading.Tasks.Task<bool> SignInWithCustomId(string customId)
        {
            if (!enableLocalAuth)
            {
                if (enableDebugLogs)
                    Debug.LogWarning("Local authentication is disabled");
                return false;
            }
            
            try
            {
                if (string.IsNullOrEmpty(customId))
                {
                    throw new ArgumentException("Custom ID cannot be null or empty");
                }
                
                if (enableDebugLogs)
                    Debug.Log($"Signing in with custom ID: {customId}");
                
                _playerId = customId;
                _playerName = GetOrCreatePlayerName();
                _authToken = GenerateAuthToken();
                
                // Save player data
                SavePlayerData();
                
                _isAuthenticated = true;
                OnAuthenticated?.Invoke();
                
                if (enableDebugLogs)
                    Debug.Log($"Custom ID sign-in successful. Player ID: {_playerId}");
                
                return true;
            }
            catch (Exception e)
            {
                Debug.LogError($"Custom ID sign-in failed: {e.Message}");
                OnAuthenticationFailed?.Invoke(e.Message);
                return false;
            }
        }
        
        public void SignOut()
        {
            if (!_isAuthenticated) return;
            
            try
            {
                if (enableDebugLogs)
                    Debug.Log("Signing out...");
                
                // Clear authentication data
                _isAuthenticated = false;
                _playerId = null;
                _playerName = null;
                _authToken = null;
                _playerData.Clear();
                
                // Clear saved data
                PlayerPrefs.DeleteKey(playerIdKey);
                PlayerPrefs.DeleteKey(playerNameKey);
                PlayerPrefs.DeleteKey(authTokenKey);
                
                OnSignOut?.Invoke();
                
                if (enableDebugLogs)
                    Debug.Log("Sign-out successful");
            }
            catch (Exception e)
            {
                Debug.LogError($"Sign-out failed: {e.Message}");
            }
        }
        
        private string GetOrCreatePlayerId()
        {
            string existingId = PlayerPrefs.GetString(playerIdKey, "");
            
            if (!string.IsNullOrEmpty(existingId))
            {
                return existingId;
            }
            
            // Generate new player ID
            string newId = System.Guid.NewGuid().ToString();
            PlayerPrefs.SetString(playerIdKey, newId);
            return newId;
        }
        
        private string GetOrCreatePlayerName()
        {
            string existingName = PlayerPrefs.GetString(playerNameKey, "");
            
            if (!string.IsNullOrEmpty(existingName))
            {
                return existingName;
            }
            
            // Generate new player name
            string newName = $"Player_{UnityEngine.Random.Range(1000, 9999)}";
            PlayerPrefs.SetString(playerNameKey, newName);
            return newName;
        }
        
        private string GenerateAuthToken()
        {
            // Generate a simple auth token (in a real implementation, this would be more secure)
            string tokenData = $"{_playerId}_{DateTime.Now.Ticks}_{UnityEngine.Random.Range(1000, 9999)}";
            
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(tokenData));
                return Convert.ToBase64String(hashBytes);
            }
        }
        
        private void LoadPlayerData()
        {
            try
            {
                _playerData.Clear();
                
                // Load basic player data
                _playerData["player_id"] = _playerId;
                _playerData["player_name"] = _playerName;
                _playerData["auth_token"] = _authToken;
                _playerData["sign_in_time"] = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                _playerData["platform"] = Application.platform.ToString();
                _playerData["version"] = Application.version;
                _playerData["device_model"] = SystemInfo.deviceModel;
                _playerData["device_type"] = SystemInfo.deviceType.ToString();
                
                if (enableDebugLogs)
                    Debug.Log("Player data loaded successfully");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to load player data: {e.Message}");
            }
        }
        
        private void SavePlayerData()
        {
            try
            {
                PlayerPrefs.SetString(playerIdKey, _playerId);
                PlayerPrefs.SetString(playerNameKey, _playerName);
                PlayerPrefs.SetString(authTokenKey, _authToken);
                PlayerPrefs.Save();
                
                if (enableDebugLogs)
                    Debug.Log("Player data saved successfully");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to save player data: {e.Message}");
            }
        }
        
        public Dictionary<string, object> GetPlayerData()
        {
            return new Dictionary<string, object>(_playerData);
        }
        
        public void UpdatePlayerData(string key, object value)
        {
            if (_playerData.ContainsKey(key))
            {
                _playerData[key] = value;
            }
            else
            {
                _playerData.Add(key, value);
            }
        }
        
        public T GetPlayerDataValue<T>(string key, T defaultValue = default(T))
        {
            if (_playerData.ContainsKey(key) && _playerData[key] is T)
            {
                return (T)_playerData[key];
            }
            return defaultValue;
        }
        
        public bool ValidateAuthToken(string token)
        {
            return !string.IsNullOrEmpty(token) && token == _authToken;
        }
        
        public Dictionary<string, object> GetAuthenticationStatus()
        {
            return new Dictionary<string, object>
            {
                {"is_initialized", _isInitialized},
                {"is_authenticated", _isAuthenticated},
                {"player_id", _playerId ?? "null"},
                {"player_name", _playerName ?? "null"},
                {"has_auth_token", !string.IsNullOrEmpty(_authToken)},
                {"platform", Application.platform.ToString()},
                {"version", Application.version}
            };
        }
        
        void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus && _isAuthenticated)
            {
                SavePlayerData();
            }
        }
        
        void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus && _isAuthenticated)
            {
                SavePlayerData();
            }
        }
        
        void OnDestroy()
        {
            if (_isAuthenticated)
            {
                SavePlayerData();
            }
        }
    }
}