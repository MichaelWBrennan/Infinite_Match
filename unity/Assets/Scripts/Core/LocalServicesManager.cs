using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;
using Evergreen.Economy;
using Evergreen.Analytics;
using Evergreen.Authentication;
using Evergreen.CloudCode;

namespace Evergreen.Core
{
    /// <summary>
    /// Local services manager that coordinates all local services instead of Unity Services
    /// </summary>
    public class LocalServicesManager : MonoBehaviour
    {
        [Header("Local Services Settings")]
        [SerializeField] private bool enableLocalServices = true;
        [SerializeField] private bool enableDebugLogs = true;
        [SerializeField] private bool autoInitialize = true;
        
        [Header("Service Dependencies")]
        [SerializeField] private bool requireAuthentication = true;
        [SerializeField] private bool requireEconomy = true;
        [SerializeField] private bool requireAnalytics = true;
        [SerializeField] private bool requireCloudCode = true;
        
        public static LocalServicesManager Instance { get; private set; }
        
        private bool _isInitialized = false;
        private Dictionary<string, bool> _serviceStatus = new Dictionary<string, bool>();
        
        // Service references
        private LocalAuthenticationManager _authManager;
        private RuntimeEconomyManager _economyManager;
        private LocalAnalyticsManager _analyticsManager;
        private LocalCloudCodeManager _cloudCodeManager;
        
        // Events
        public System.Action OnInitialized;
        public System.Action<string, bool> OnServiceStatusChanged;
        public System.Action OnAllServicesReady;
        
        public bool IsInitialized => _isInitialized;
        public bool AreAllServicesReady => _serviceStatus.Values.All(status => status);
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        async void Start()
        {
            if (autoInitialize)
            {
                await InitializeLocalServices();
            }
        }
        
        public async Task<bool> InitializeLocalServices()
        {
            if (!enableLocalServices)
            {
                if (enableDebugLogs)
                    Debug.LogWarning("Local services are disabled");
                return false;
            }
            
            try
            {
                if (enableDebugLogs)
                    Debug.Log("Initializing Local Services Manager...");
                
                // Initialize service status tracking
                _serviceStatus.Clear();
                _serviceStatus["authentication"] = false;
                _serviceStatus["economy"] = false;
                _serviceStatus["analytics"] = false;
                _serviceStatus["cloudcode"] = false;
                
                // Initialize Authentication Service
                if (requireAuthentication)
                {
                    await InitializeAuthenticationService();
                }
                
                // Initialize Economy Service
                if (requireEconomy)
                {
                    await InitializeEconomyService();
                }
                
                // Initialize Analytics Service
                if (requireAnalytics)
                {
                    await InitializeAnalyticsService();
                }
                
                // Initialize Cloud Code Service
                if (requireCloudCode)
                {
                    await InitializeCloudCodeService();
                }
                
                _isInitialized = true;
                OnInitialized?.Invoke();
                
                if (AreAllServicesReady)
                {
                    OnAllServicesReady?.Invoke();
                }
                
                if (enableDebugLogs)
                    Debug.Log("Local Services Manager initialized successfully");
                
                return true;
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to initialize Local Services Manager: {e.Message}");
                return false;
            }
        }
        
        private async Task InitializeAuthenticationService()
        {
            try
            {
                _authManager = FindObjectOfType<LocalAuthenticationManager>();
                if (_authManager == null)
                {
                    var authGO = new GameObject("LocalAuthenticationManager");
                    _authManager = authGO.AddComponent<LocalAuthenticationManager>();
                }
                
                // Wait for authentication to be ready
                while (!_authManager.IsInitialized)
                {
                    await Task.Delay(100);
                }
                
                _serviceStatus["authentication"] = true;
                OnServiceStatusChanged?.Invoke("authentication", true);
                
                if (enableDebugLogs)
                    Debug.Log("Authentication service initialized");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to initialize Authentication service: {e.Message}");
                _serviceStatus["authentication"] = false;
                OnServiceStatusChanged?.Invoke("authentication", false);
            }
        }
        
        private async Task InitializeEconomyService()
        {
            try
            {
                _economyManager = FindObjectOfType<RuntimeEconomyManager>();
                if (_economyManager == null)
                {
                    var economyGO = new GameObject("RuntimeEconomyManager");
                    _economyManager = economyGO.AddComponent<RuntimeEconomyManager>();
                }
                
                // Wait for economy to be ready
                while (_economyManager == null)
                {
                    await Task.Delay(100);
                }
                
                _serviceStatus["economy"] = true;
                OnServiceStatusChanged?.Invoke("economy", true);
                
                if (enableDebugLogs)
                    Debug.Log("Economy service initialized");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to initialize Economy service: {e.Message}");
                _serviceStatus["economy"] = false;
                OnServiceStatusChanged?.Invoke("economy", false);
            }
        }
        
        private async Task InitializeAnalyticsService()
        {
            try
            {
                _analyticsManager = FindObjectOfType<LocalAnalyticsManager>();
                if (_analyticsManager == null)
                {
                    var analyticsGO = new GameObject("LocalAnalyticsManager");
                    _analyticsManager = analyticsGO.AddComponent<LocalAnalyticsManager>();
                }
                
                _serviceStatus["analytics"] = true;
                OnServiceStatusChanged?.Invoke("analytics", true);
                
                if (enableDebugLogs)
                    Debug.Log("Analytics service initialized");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to initialize Analytics service: {e.Message}");
                _serviceStatus["analytics"] = false;
                OnServiceStatusChanged?.Invoke("analytics", false);
            }
        }
        
        private async Task InitializeCloudCodeService()
        {
            try
            {
                _cloudCodeManager = FindObjectOfType<LocalCloudCodeManager>();
                if (_cloudCodeManager == null)
                {
                    var cloudCodeGO = new GameObject("LocalCloudCodeManager");
                    _cloudCodeManager = cloudCodeGO.AddComponent<LocalCloudCodeManager>();
                }
                
                // Wait for cloud code to be ready
                while (!_cloudCodeManager.IsInitialized)
                {
                    await Task.Delay(100);
                }
                
                _serviceStatus["cloudcode"] = true;
                OnServiceStatusChanged?.Invoke("cloudcode", true);
                
                if (enableDebugLogs)
                    Debug.Log("Cloud Code service initialized");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to initialize Cloud Code service: {e.Message}");
                _serviceStatus["cloudcode"] = false;
                OnServiceStatusChanged?.Invoke("cloudcode", false);
            }
        }
        
        public T GetService<T>() where T : class
        {
            if (typeof(T) == typeof(LocalAuthenticationManager))
                return _authManager as T;
            if (typeof(T) == typeof(RuntimeEconomyManager))
                return _economyManager as T;
            if (typeof(T) == typeof(LocalAnalyticsManager))
                return _analyticsManager as T;
            if (typeof(T) == typeof(LocalCloudCodeManager))
                return _cloudCodeManager as T;
            
            return null;
        }
        
        public bool IsServiceReady(string serviceName)
        {
            return _serviceStatus.ContainsKey(serviceName) && _serviceStatus[serviceName];
        }
        
        public Dictionary<string, object> GetServicesStatus()
        {
            var status = new Dictionary<string, object>
            {
                {"is_initialized", _isInitialized},
                {"all_services_ready", AreAllServicesReady},
                {"services", new Dictionary<string, object>(_serviceStatus)}
            };
            
            // Add individual service statuses
            if (_authManager != null)
            {
                status["authentication_details"] = _authManager.GetAuthenticationStatus();
            }
            
            if (_economyManager != null)
            {
                status["economy_details"] = _economyManager.GetEconomyStatus();
            }
            
            if (_analyticsManager != null)
            {
                status["analytics_details"] = _analyticsManager.GetAnalyticsSummary();
            }
            
            if (_cloudCodeManager != null)
            {
                status["cloudcode_details"] = _cloudCodeManager.GetCloudCodeStatus();
            }
            
            return status;
        }
        
        public void LogServicesStatus()
        {
            if (!enableDebugLogs) return;
            
            Debug.Log("=== Local Services Status ===");
            Debug.Log($"Initialized: {_isInitialized}");
            Debug.Log($"All Services Ready: {AreAllServicesReady}");
            
            foreach (var service in _serviceStatus)
            {
                Debug.Log($"{service.Key}: {(service.Value ? "Ready" : "Not Ready")}");
            }
            
            Debug.Log("=============================");
        }
        
        void OnDestroy()
        {
            // Clean up services if needed
            _authManager = null;
            _economyManager = null;
            _analyticsManager = null;
            _cloudCodeManager = null;
        }
    }
}