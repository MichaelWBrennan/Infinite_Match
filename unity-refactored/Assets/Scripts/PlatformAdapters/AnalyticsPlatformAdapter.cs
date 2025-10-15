using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using Evergreen.Platform;

namespace Evergreen.Platform
{
    /// <summary>
    /// Platform-specific analytics adapter that handles different analytics SDKs based on target platform
    /// </summary>
    public class AnalyticsPlatformAdapter : MonoBehaviour
    {
        [Header("Analytics Configuration")]
        [SerializeField] private bool enableAnalytics = true;
        [SerializeField] private bool enableCustomEvents = true;
        [SerializeField] private bool enableUserProperties = true;
        [SerializeField] private bool enableCrashReporting = true;
        
        [Header("Privacy Settings")]
        [SerializeField] private bool enableDataCollection = true;
        [SerializeField] private bool enablePersonalizedAds = true;
        [SerializeField] private bool enableDebugMode = false;
        
        private PlatformProfile _profile;
        private Dictionary<string, object> _userProperties = new Dictionary<string, object>();
        private Dictionary<string, int> _eventCounts = new Dictionary<string, int>();
        private bool _isInitialized = false;
        
        // Events
        public System.Action<bool> OnAnalyticsInitialized;
        public System.Action<string> OnEventTracked;
        public System.Action<string> OnErrorOccurred;
        
        void Start()
        {
            if (enableAnalytics)
            {
                InitializeAnalytics();
            }
        }
        
        public void Initialize(PlatformProfile profile)
        {
            _profile = profile;
            Debug.Log($"📊 Initializing Analytics Adapter for {profile.platform}");
            
            // Configure analytics based on platform
            ConfigureAnalytics();
            
            // Initialize platform-specific analytics SDK
            InitializePlatformAnalytics();
        }
        
        private void ConfigureAnalytics()
        {
            Debug.Log("📊 Configuring analytics...");
            
            // Set privacy settings based on platform
            ConfigurePrivacySettings();
            
            // Configure required events
            ConfigureRequiredEvents();
        }
        
        private void ConfigurePrivacySettings()
        {
            if (_profile?.analytics != null)
            {
                enableDataCollection = _profile.analytics.dataCollection != "minimal";
                Debug.Log($"📊 Data collection: {_profile.analytics.dataCollection}");
            }
        }
        
        private void ConfigureRequiredEvents()
        {
            if (_profile?.analytics?.requiredEvents != null)
            {
                Debug.Log($"📊 Required events: {string.Join(", ", _profile.analytics.requiredEvents)}");
            }
        }
        
        private void InitializePlatformAnalytics()
        {
            switch (_profile.platform)
            {
                case "poki":
                    InitializePokiAnalytics();
                    break;
                case "googleplay":
                    InitializeGooglePlayAnalytics();
                    break;
                case "appstore":
                    InitializeAppStoreAnalytics();
                    break;
                default:
                    InitializeFallbackAnalytics();
                    break;
            }
        }
        
        private void InitializePokiAnalytics()
        {
            Debug.Log("🎮 Initializing Poki Analytics...");
            
#if UNITY_WEBGL && POKI_PLATFORM
            // Initialize Poki Analytics
            InitializePokiSDK();
#else
            Debug.LogWarning("⚠️ Poki platform not detected, using fallback analytics");
            InitializeFallbackAnalytics();
#endif
        }
        
        private void InitializeGooglePlayAnalytics()
        {
            Debug.Log("🤖 Initializing Google Play Analytics...");
            
#if UNITY_ANDROID && GOOGLE_PLAY_PLATFORM
            // Initialize Google Analytics / Firebase
            InitializeGoogleAnalytics();
#else
            Debug.LogWarning("⚠️ Google Play platform not detected, using fallback analytics");
            InitializeFallbackAnalytics();
#endif
        }
        
        private void InitializeAppStoreAnalytics()
        {
            Debug.Log("🍎 Initializing App Store Analytics...");
            
#if UNITY_IOS && APP_STORE_PLATFORM
            // Initialize Unity Analytics / Firebase
            InitializeUnityAnalytics();
#else
            Debug.LogWarning("⚠️ App Store platform not detected, using fallback analytics");
            InitializeFallbackAnalytics();
#endif
        }
        
        private void InitializeFallbackAnalytics()
        {
            Debug.Log("🔄 Initializing fallback analytics...");
            
            // Use Unity Analytics as fallback
            InitializeUnityAnalytics();
        }
        
#if UNITY_WEBGL && POKI_PLATFORM
        private void InitializePokiSDK()
        {
            Debug.Log("🎮 Initializing Poki SDK...");
            
            // Poki Analytics initialization would go here
            // This is a placeholder for the actual Poki SDK integration
            
            _isInitialized = true;
            OnAnalyticsInitialized?.Invoke(true);
        }
#endif
        
#if UNITY_ANDROID && GOOGLE_PLAY_PLATFORM
        private void InitializeGoogleAnalytics()
        {
            Debug.Log("📊 Initializing Google Analytics...");
            
            // Google Analytics / Firebase initialization would go here
            // This is a placeholder for the actual Google Analytics integration
            
            _isInitialized = true;
            OnAnalyticsInitialized?.Invoke(true);
        }
#endif
        
        private void InitializeUnityAnalytics()
        {
            Debug.Log("📊 Initializing Unity Analytics...");
            
            // Unity Analytics initialization would go here
            // This is a placeholder for the actual Unity Analytics integration
            
            _isInitialized = true;
            OnAnalyticsInitialized?.Invoke(true);
        }
        
        // Public API Methods
        
        public void TrackEvent(string eventName, Dictionary<string, object> parameters = null)
        {
            if (!_isInitialized || !enableAnalytics)
            {
                Debug.Log("📊 Analytics disabled or not initialized");
                return;
            }
            
            if (!enableCustomEvents)
            {
                Debug.Log("📊 Custom events disabled");
                return;
            }
            
            Debug.Log($"📊 Tracking event: {eventName}");
            
            // Increment event count
            if (!_eventCounts.ContainsKey(eventName))
            {
                _eventCounts[eventName] = 0;
            }
            _eventCounts[eventName]++;
            
            // Track event based on platform
            TrackPlatformEvent(eventName, parameters);
            
            OnEventTracked?.Invoke(eventName);
        }
        
        public void TrackPurchase(string productId, float price, string currency = "USD")
        {
            var parameters = new Dictionary<string, object>
            {
                ["product_id"] = productId,
                ["price"] = price,
                ["currency"] = currency
            };
            
            TrackEvent("purchase", parameters);
        }
        
        public void TrackLevelComplete(int level, float timeSpent)
        {
            var parameters = new Dictionary<string, object>
            {
                ["level"] = level,
                ["time_spent"] = timeSpent
            };
            
            TrackEvent("level_complete", parameters);
        }
        
        public void TrackLevelFail(int level, string reason)
        {
            var parameters = new Dictionary<string, object>
            {
                ["level"] = level,
                ["reason"] = reason
            };
            
            TrackEvent("level_fail", parameters);
        }
        
        public void TrackSessionStart()
        {
            TrackEvent("session_start");
        }
        
        public void TrackSessionEnd(float sessionDuration)
        {
            var parameters = new Dictionary<string, object>
            {
                ["session_duration"] = sessionDuration
            };
            
            TrackEvent("session_end", parameters);
        }
        
        public void TrackAdImpression(string adType, string adUnitId)
        {
            var parameters = new Dictionary<string, object>
            {
                ["ad_type"] = adType,
                ["ad_unit_id"] = adUnitId
            };
            
            TrackEvent("ad_impression", parameters);
        }
        
        public void TrackAdClick(string adType, string adUnitId)
        {
            var parameters = new Dictionary<string, object>
            {
                ["ad_type"] = adType,
                ["ad_unit_id"] = adUnitId
            };
            
            TrackEvent("ad_click", parameters);
        }
        
        public void SetUserProperty(string propertyName, object value)
        {
            if (!_isInitialized || !enableAnalytics)
            {
                Debug.Log("📊 Analytics disabled or not initialized");
                return;
            }
            
            if (!enableUserProperties)
            {
                Debug.Log("📊 User properties disabled");
                return;
            }
            
            _userProperties[propertyName] = value;
            Debug.Log($"📊 Set user property: {propertyName} = {value}");
            
            // Set platform-specific user property
            SetPlatformUserProperty(propertyName, value);
        }
        
        public void SetUserId(string userId)
        {
            SetUserProperty("user_id", userId);
        }
        
        public void SetUserLevel(int level)
        {
            SetUserProperty("user_level", level);
        }
        
        public void SetUserScore(int score)
        {
            SetUserProperty("user_score", score);
        }
        
        // Platform-specific event tracking implementations
        
        private void TrackPlatformEvent(string eventName, Dictionary<string, object> parameters)
        {
            switch (_profile.platform)
            {
                case "poki":
                    TrackPokiEvent(eventName, parameters);
                    break;
                case "googleplay":
                    TrackGooglePlayEvent(eventName, parameters);
                    break;
                case "appstore":
                    TrackAppStoreEvent(eventName, parameters);
                    break;
                default:
                    TrackFallbackEvent(eventName, parameters);
                    break;
            }
        }
        
        private void TrackPokiEvent(string eventName, Dictionary<string, object> parameters)
        {
#if UNITY_WEBGL && POKI_PLATFORM
            Debug.Log($"🎮 Tracking Poki event: {eventName}");
            // Poki Analytics event tracking implementation
#else
            TrackFallbackEvent(eventName, parameters);
#endif
        }
        
        private void TrackGooglePlayEvent(string eventName, Dictionary<string, object> parameters)
        {
#if UNITY_ANDROID && GOOGLE_PLAY_PLATFORM
            Debug.Log($"🤖 Tracking Google Play event: {eventName}");
            // Google Analytics event tracking implementation
#else
            TrackFallbackEvent(eventName, parameters);
#endif
        }
        
        private void TrackAppStoreEvent(string eventName, Dictionary<string, object> parameters)
        {
#if UNITY_IOS && APP_STORE_PLATFORM
            Debug.Log($"🍎 Tracking App Store event: {eventName}");
            // Unity Analytics event tracking implementation
#else
            TrackFallbackEvent(eventName, parameters);
#endif
        }
        
        private void TrackFallbackEvent(string eventName, Dictionary<string, object> parameters)
        {
            Debug.Log($"🔄 Tracking fallback event: {eventName}");
            // Fallback event tracking implementation
        }
        
        private void SetPlatformUserProperty(string propertyName, object value)
        {
            switch (_profile.platform)
            {
                case "poki":
                    SetPokiUserProperty(propertyName, value);
                    break;
                case "googleplay":
                    SetGooglePlayUserProperty(propertyName, value);
                    break;
                case "appstore":
                    SetAppStoreUserProperty(propertyName, value);
                    break;
                default:
                    SetFallbackUserProperty(propertyName, value);
                    break;
            }
        }
        
        private void SetPokiUserProperty(string propertyName, object value)
        {
#if UNITY_WEBGL && POKI_PLATFORM
            Debug.Log($"🎮 Setting Poki user property: {propertyName} = {value}");
            // Poki Analytics user property implementation
#else
            SetFallbackUserProperty(propertyName, value);
#endif
        }
        
        private void SetGooglePlayUserProperty(string propertyName, object value)
        {
#if UNITY_ANDROID && GOOGLE_PLAY_PLATFORM
            Debug.Log($"🤖 Setting Google Play user property: {propertyName} = {value}");
            // Google Analytics user property implementation
#else
            SetFallbackUserProperty(propertyName, value);
#endif
        }
        
        private void SetAppStoreUserProperty(string propertyName, object value)
        {
#if UNITY_IOS && APP_STORE_PLATFORM
            Debug.Log($"🍎 Setting App Store user property: {propertyName} = {value}");
            // Unity Analytics user property implementation
#else
            SetFallbackUserProperty(propertyName, value);
#endif
        }
        
        private void SetFallbackUserProperty(string propertyName, object value)
        {
            Debug.Log($"🔄 Setting fallback user property: {propertyName} = {value}");
            // Fallback user property implementation
        }
        
        // Utility Methods
        
        public Dictionary<string, int> GetEventCounts()
        {
            return new Dictionary<string, int>(_eventCounts);
        }
        
        public Dictionary<string, object> GetUserProperties()
        {
            return new Dictionary<string, object>(_userProperties);
        }
        
        public int GetEventCount(string eventName)
        {
            return _eventCounts.ContainsKey(eventName) ? _eventCounts[eventName] : 0;
        }
        
        public object GetUserProperty(string propertyName)
        {
            return _userProperties.ContainsKey(propertyName) ? _userProperties[propertyName] : null;
        }
        
        public void ResetAnalytics()
        {
            _eventCounts.Clear();
            _userProperties.Clear();
            Debug.Log("🔄 Analytics reset");
        }
        
        public bool IsAnalyticsSupported()
        {
            return _isInitialized && enableAnalytics;
        }
        
        public string GetPlatformName()
        {
            return _profile?.platform ?? "unknown";
        }
        
        public void EnableDebugMode(bool enabled)
        {
            enableDebugMode = enabled;
            Debug.Log($"📊 Debug mode: {(enabled ? "enabled" : "disabled")}");
        }
    }
}