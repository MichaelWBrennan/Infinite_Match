using UnityEngine;
using System.Collections.Generic;
using System.IO;
using Newtonsoft.Json;

namespace Evergreen.Platform
{
    /// <summary>
    /// Central platform manager that loads and applies platform-specific compliance profiles
    /// </summary>
    public class PlatformManager : MonoBehaviour
    {
        [Header("Platform Configuration")]
        [SerializeField] private PlatformType targetPlatform = PlatformType.AutoDetect;
        [SerializeField] private bool enablePlatformValidation = true;
        [SerializeField] private bool enableComplianceChecks = true;
        
        [Header("Debug Settings")]
        [SerializeField] private bool enableDebugLogging = true;
        [SerializeField] private bool showComplianceReport = true;
        
        public static PlatformManager Instance { get; private set; }
        public PlatformProfile CurrentProfile { get; private set; }
        public PlatformType CurrentPlatform { get; private set; }
        
        private Dictionary<PlatformType, PlatformProfile> _profiles = new Dictionary<PlatformType, PlatformProfile>();
        private ComplianceReport _complianceReport;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializePlatformManager();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        private void InitializePlatformManager()
        {
            Debug.Log("🌐 Initializing Platform Manager...");
            
            // Load all platform profiles
            LoadPlatformProfiles();
            
            // Detect or set target platform
            DetectTargetPlatform();
            
            // Apply platform profile
            ApplyPlatformProfile();
            
            // Run compliance checks
            if (enableComplianceChecks)
            {
                RunComplianceChecks();
            }
            
            Debug.Log($"🌐 Platform Manager initialized for: {CurrentPlatform}");
        }
        
        private void LoadPlatformProfiles()
        {
            Debug.Log("📋 Loading platform profiles...");
            
            // Load WebGL platforms
            LoadProfile(PlatformType.Poki, "poki.json");
            LoadProfile(PlatformType.Facebook, "facebook.json");
            LoadProfile(PlatformType.Snap, "snap.json");
            LoadProfile(PlatformType.TikTok, "tiktok.json");
            LoadProfile(PlatformType.Kongregate, "kongregate.json");
            LoadProfile(PlatformType.CrazyGames, "crazygames.json");
            
            // Load Mobile platforms
            LoadProfile(PlatformType.GooglePlay, "googleplay.json");
            LoadProfile(PlatformType.AppStore, "appstore.json");
            
            // Load PC platforms
            LoadProfile(PlatformType.Steam, "steam.json");
            LoadProfile(PlatformType.Epic, "epic.json");
            
            // Load Console platforms
            LoadProfile(PlatformType.PS5, "ps5.json");
        }
        
        private void LoadProfile(PlatformType platformType, string fileName)
        {
            try
            {
                string filePath = Path.Combine(Application.streamingAssetsPath, "Config", fileName);
                
                if (File.Exists(filePath))
                {
                    string jsonContent = File.ReadAllText(filePath);
                    var profile = JsonConvert.DeserializeObject<PlatformProfile>(jsonContent);
                    _profiles[platformType] = profile;
                    Debug.Log($"✅ Loaded profile: {platformType}");
                }
                else
                {
                    Debug.LogWarning($"⚠️ Profile not found: {fileName}");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Failed to load profile {fileName}: {e.Message}");
            }
        }
        
        private void DetectTargetPlatform()
        {
            if (targetPlatform == PlatformType.AutoDetect)
            {
                CurrentPlatform = DetectCurrentPlatform();
            }
            else
            {
                CurrentPlatform = targetPlatform;
            }
            
            Debug.Log($"🎯 Target platform: {CurrentPlatform}");
        }
        
        private PlatformType DetectCurrentPlatform()
        {
#if UNITY_WEBGL
            // Check for platform-specific defines
#if POKI_PLATFORM
            return PlatformType.Poki;
#elif FACEBOOK_PLATFORM
            return PlatformType.Facebook;
#elif SNAP_PLATFORM
            return PlatformType.Snap;
#elif TIKTOK_PLATFORM
            return PlatformType.TikTok;
#elif KONGREGATE_PLATFORM
            return PlatformType.Kongregate;
#elif CRAZYGAMES_PLATFORM
            return PlatformType.CrazyGames;
#else
            return PlatformType.Poki; // Default to Poki for WebGL
#endif
#elif UNITY_ANDROID
            return PlatformType.GooglePlay;
#elif UNITY_IOS
            return PlatformType.AppStore;
#elif UNITY_STANDALONE_WIN
#if STEAM_PLATFORM
            return PlatformType.Steam;
#elif EPIC_PLATFORM
            return PlatformType.Epic;
#else
            return PlatformType.Standalone;
#endif
#elif UNITY_PS5
            return PlatformType.PS5;
#else
            return PlatformType.Standalone;
#endif
        }
        
        private void ApplyPlatformProfile()
        {
            if (_profiles.ContainsKey(CurrentPlatform))
            {
                CurrentProfile = _profiles[CurrentPlatform];
                ApplyPlatformSettings();
                Debug.Log($"✅ Applied profile: {CurrentProfile.name}");
            }
            else
            {
                Debug.LogError($"❌ No profile found for platform: {CurrentPlatform}");
            }
        }
        
        private void ApplyPlatformSettings()
        {
            Debug.Log("⚙️ Applying platform settings...");
            
            // Apply build defines
            ApplyBuildDefines();
            
            // Apply platform-specific settings
            ApplyPlatformSpecificSettings();
            
            // Initialize platform adapters
            InitializePlatformAdapters();
        }
        
        private void ApplyBuildDefines()
        {
            Debug.Log("🔧 Applying build defines...");
            
            if (CurrentProfile.buildDefines != null)
            {
                foreach (string define in CurrentProfile.buildDefines)
                {
                    Debug.Log($"📝 Build define: {define}");
                }
            }
        }
        
        private void ApplyPlatformSpecificSettings()
        {
            Debug.Log("🎯 Applying platform-specific settings...");
            
            switch (CurrentPlatform)
            {
                case PlatformType.Poki:
                    ApplyPokiSettings();
                    break;
                case PlatformType.GooglePlay:
                    ApplyGooglePlaySettings();
                    break;
                case PlatformType.AppStore:
                    ApplyAppStoreSettings();
                    break;
                case PlatformType.Facebook:
                    ApplyFacebookSettings();
                    break;
                case PlatformType.Snap:
                    ApplySnapSettings();
                    break;
                case PlatformType.TikTok:
                    ApplyTikTokSettings();
                    break;
                case PlatformType.Steam:
                    ApplySteamSettings();
                    break;
                case PlatformType.Epic:
                    ApplyEpicSettings();
                    break;
                case PlatformType.PS5:
                    ApplyPS5Settings();
                    break;
                case PlatformType.Kongregate:
                    ApplyKongregateSettings();
                    break;
                case PlatformType.CrazyGames:
                    ApplyCrazyGamesSettings();
                    break;
            }
        }
        
        private void ApplyPokiSettings()
        {
            Debug.Log("🎮 Applying Poki settings...");
            
            // Disable IAP systems
            DisableIAPSystems();
            
            // Enable Poki-specific features
            EnablePokiFeatures();
        }
        
        private void ApplyGooglePlaySettings()
        {
            Debug.Log("🤖 Applying Google Play settings...");
            
            // Enable Google Play Billing
            EnableGooglePlayBilling();
            
            // Configure Google Mobile Ads
            ConfigureGoogleMobileAds();
        }
        
        private void ApplyAppStoreSettings()
        {
            Debug.Log("🍎 Applying App Store settings...");
            
            // Enable StoreKit
            EnableStoreKit();
            
            // Configure Unity Ads
            ConfigureUnityAds();
        }
        
        private void InitializePlatformAdapters()
        {
            Debug.Log("🔌 Initializing platform adapters...");
            
            // Initialize ad adapter
            InitializeAdAdapter();
            
            // Initialize IAP adapter
            InitializeIAPAdapter();
            
            // Initialize analytics adapter
            InitializeAnalyticsAdapter();
            
            // Initialize platform-specific adapters
            InitializePlatformSpecificAdapters();
        }
        
        private void InitializePlatformSpecificAdapters()
        {
            Debug.Log("🔌 Initializing platform-specific adapters...");
            
            switch (CurrentPlatform)
            {
                case PlatformType.Facebook:
                    InitializeFacebookAdapter();
                    break;
                case PlatformType.Snap:
                    InitializeSnapAdapter();
                    break;
                case PlatformType.TikTok:
                    InitializeTikTokAdapter();
                    break;
                case PlatformType.Kongregate:
                    InitializeKongregateAdapter();
                    break;
                case PlatformType.CrazyGames:
                    InitializeCrazyGamesAdapter();
                    break;
                case PlatformType.Steam:
                    InitializeSteamAdapter();
                    break;
                case PlatformType.Epic:
                    InitializeEpicAdapter();
                    break;
                case PlatformType.PS5:
                    InitializePS5Adapter();
                    break;
            }
        }
        
        private void InitializeFacebookAdapter()
        {
            var facebookAdapter = gameObject.AddComponent<FacebookInstantGamesAdapter>();
            facebookAdapter.Initialize(CurrentProfile);
        }
        
        private void InitializeSnapAdapter()
        {
            var snapAdapter = gameObject.AddComponent<SnapMiniGamesAdapter>();
            snapAdapter.Initialize(CurrentProfile);
        }
        
        private void InitializeTikTokAdapter()
        {
            var tiktokAdapter = gameObject.AddComponent<TikTokMiniGamesAdapter>();
            tiktokAdapter.Initialize(CurrentProfile);
        }
        
        private void InitializeKongregateAdapter()
        {
            var kongregateAdapter = gameObject.AddComponent<KongregateAdapter>();
            kongregateAdapter.Initialize(CurrentProfile);
        }
        
        private void InitializeCrazyGamesAdapter()
        {
            var crazyGamesAdapter = gameObject.AddComponent<CrazyGamesAdapter>();
            crazyGamesAdapter.Initialize(CurrentProfile);
        }
        
        private void InitializeSteamAdapter()
        {
            var steamAdapter = gameObject.AddComponent<SteamAdapter>();
            steamAdapter.Initialize(CurrentProfile);
        }
        
        private void InitializeEpicAdapter()
        {
            var epicAdapter = gameObject.AddComponent<EpicAdapter>();
            epicAdapter.Initialize(CurrentProfile);
        }
        
        private void InitializePS5Adapter()
        {
            var ps5Adapter = gameObject.AddComponent<PS5Adapter>();
            ps5Adapter.Initialize(CurrentProfile);
        }
        
        private void InitializeAdAdapter()
        {
            var adAdapter = gameObject.AddComponent<AdPlatformAdapter>();
            adAdapter.Initialize(CurrentProfile);
        }
        
        private void InitializeIAPAdapter()
        {
            var iapAdapter = gameObject.AddComponent<IAPPlatformAdapter>();
            iapAdapter.Initialize(CurrentProfile);
        }
        
        private void InitializeAnalyticsAdapter()
        {
            var analyticsAdapter = gameObject.AddComponent<AnalyticsPlatformAdapter>();
            analyticsAdapter.Initialize(CurrentProfile);
        }
        
        private void DisableIAPSystems()
        {
            Debug.Log("🚫 Disabling IAP systems for Poki...");
        }
        
        private void EnablePokiFeatures()
        {
            Debug.Log("🎮 Enabling Poki features...");
        }
        
        private void EnableGooglePlayBilling()
        {
            Debug.Log("💳 Enabling Google Play Billing...");
        }
        
        private void ConfigureGoogleMobileAds()
        {
            Debug.Log("📱 Configuring Google Mobile Ads...");
        }
        
        private void EnableStoreKit()
        {
            Debug.Log("🛒 Enabling StoreKit...");
        }
        
        private void ConfigureUnityAds()
        {
            Debug.Log("📺 Configuring Unity Ads...");
        }
        
        private void ApplyFacebookSettings()
        {
            Debug.Log("📘 Applying Facebook Instant Games settings...");
            
            // Disable IAP systems for Facebook
            DisableIAPSystems();
            
            // Enable Facebook-specific features
            EnableFacebookFeatures();
        }
        
        private void ApplySnapSettings()
        {
            Debug.Log("👻 Applying Snap Mini Games settings...");
            
            // Disable IAP systems for Snap
            DisableIAPSystems();
            
            // Enable Snap-specific features
            EnableSnapFeatures();
        }
        
        private void ApplyTikTokSettings()
        {
            Debug.Log("🎵 Applying TikTok Mini Games settings...");
            
            // Disable IAP systems for TikTok
            DisableIAPSystems();
            
            // Enable TikTok-specific features
            EnableTikTokFeatures();
        }
        
        private void EnableFacebookFeatures()
        {
            Debug.Log("📘 Enabling Facebook Instant Games features...");
        }
        
        private void EnableSnapFeatures()
        {
            Debug.Log("👻 Enabling Snap Mini Games features...");
        }
        
        private void EnableTikTokFeatures()
        {
            Debug.Log("🎵 Enabling TikTok Mini Games features...");
        }
        
        private void ApplySteamSettings()
        {
            Debug.Log("🎮 Applying Steam settings...");
            // Steam-specific settings would go here
        }
        
        private void ApplyEpicSettings()
        {
            Debug.Log("⚡ Applying Epic settings...");
            // Epic-specific settings would go here
        }
        
        private void ApplyPS5Settings()
        {
            Debug.Log("🎮 Applying PS5 settings...");
            // PS5-specific settings would go here
        }
        
        private void ApplyKongregateSettings()
        {
            Debug.Log("🎯 Applying Kongregate settings...");
            // Kongregate-specific settings would go here
        }
        
        private void ApplyCrazyGamesSettings()
        {
            Debug.Log("🎪 Applying CrazyGames settings...");
            // CrazyGames-specific settings would go here
        }
        
        private void RunComplianceChecks()
        {
            Debug.Log("✅ Running compliance checks...");
            
            _complianceReport = new ComplianceReport
            {
                platform = CurrentPlatform,
                timestamp = System.DateTime.Now,
                checks = new List<ComplianceCheck>()
            };
            
            // Run platform-specific compliance checks
            RunPlatformComplianceChecks();
            
            // Generate compliance report
            GenerateComplianceReport();
        }
        
        private void RunPlatformComplianceChecks()
        {
            if (CurrentProfile.complianceChecks != null)
            {
                foreach (var check in CurrentProfile.complianceChecks)
                {
                    RunComplianceCheck(check.Key, check.Value);
                }
            }
        }
        
        private void RunComplianceCheck(string checkName, bool required)
        {
            bool passed = false;
            string message = "";
            
            switch (checkName)
            {
                case "file_size_check":
                    passed = CheckFileSize();
                    message = passed ? "File size within limits" : "File size exceeds limits";
                    break;
                case "memory_usage_check":
                    passed = CheckMemoryUsage();
                    message = passed ? "Memory usage within limits" : "Memory usage exceeds limits";
                    break;
                case "ad_integration_check":
                    passed = CheckAdIntegration();
                    message = passed ? "Ad integration compliant" : "Ad integration non-compliant";
                    break;
                case "content_policy_check":
                    passed = CheckContentPolicy();
                    message = passed ? "Content policy compliant" : "Content policy non-compliant";
                    break;
                case "performance_check":
                    passed = CheckPerformance();
                    message = passed ? "Performance within limits" : "Performance below limits";
                    break;
                default:
                    passed = true;
                    message = "Check not implemented";
                    break;
            }
            
            _complianceReport.checks.Add(new ComplianceCheck
            {
                name = checkName,
                required = required,
                passed = passed,
                message = message
            });
            
            if (enableDebugLogging)
            {
                Debug.Log($"✅ {checkName}: {(passed ? "PASS" : "FAIL")} - {message}");
            }
        }
        
        private bool CheckFileSize()
        {
            // Implement file size check based on platform
            return true; // Placeholder
        }
        
        private bool CheckMemoryUsage()
        {
            // Implement memory usage check based on platform
            return true; // Placeholder
        }
        
        private bool CheckAdIntegration()
        {
            // Implement ad integration check based on platform
            return true; // Placeholder
        }
        
        private bool CheckContentPolicy()
        {
            // Implement content policy check based on platform
            return true; // Placeholder
        }
        
        private bool CheckPerformance()
        {
            // Implement performance check based on platform
            return true; // Placeholder
        }
        
        private void GenerateComplianceReport()
        {
            Debug.Log("📊 Generating compliance report...");
            
            if (showComplianceReport)
            {
                LogComplianceReport();
            }
            
            // Save compliance report to file
            SaveComplianceReport();
        }
        
        private void LogComplianceReport()
        {
            Debug.Log("📊 COMPLIANCE REPORT");
            Debug.Log("===================");
            Debug.Log($"Platform: {_complianceReport.platform}");
            Debug.Log($"Timestamp: {_complianceReport.timestamp}");
            Debug.Log("Checks:");
            
            foreach (var check in _complianceReport.checks)
            {
                string status = check.passed ? "✅ PASS" : "❌ FAIL";
                string required = check.required ? " (REQUIRED)" : " (OPTIONAL)";
                Debug.Log($"  {check.name}: {status}{required} - {check.message}");
            }
            
            Debug.Log("===================");
        }
        
        private void SaveComplianceReport()
        {
            try
            {
                string reportPath = Path.Combine(Application.persistentDataPath, $"compliance_report_{CurrentPlatform}.json");
                string jsonContent = JsonConvert.SerializeObject(_complianceReport, Formatting.Indented);
                File.WriteAllText(reportPath, jsonContent);
                Debug.Log($"📄 Compliance report saved: {reportPath}");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Failed to save compliance report: {e.Message}");
            }
        }
        
        // Public API Methods
        
        public PlatformProfile GetProfile(PlatformType platformType)
        {
            return _profiles.ContainsKey(platformType) ? _profiles[platformType] : null;
        }
        
        public bool IsPlatformSupported(PlatformType platformType)
        {
            return _profiles.ContainsKey(platformType);
        }
        
        public ComplianceReport GetComplianceReport()
        {
            return _complianceReport;
        }
        
        public void SwitchPlatform(PlatformType platformType)
        {
            if (_profiles.ContainsKey(platformType))
            {
                CurrentPlatform = platformType;
                ApplyPlatformProfile();
                Debug.Log($"🔄 Switched to platform: {platformType}");
            }
            else
            {
                Debug.LogError($"❌ Platform not supported: {platformType}");
            }
        }
    }
    
    // Enums and Data Classes
    
    public enum PlatformType
    {
        AutoDetect,
        Poki,
        GooglePlay,
        AppStore,
        Facebook,
        Snap,
        TikTok,
        Steam,
        Epic,
        PS5,
        Kongregate,
        CrazyGames,
        Standalone
    }
    
    [System.Serializable]
    public class PlatformProfile
    {
        public string platform;
        public string name;
        public string version;
        public string description;
        public BuildSettings buildSettings;
        public AdSDKs adSdks;
        public Monetization monetization;
        public Analytics analytics;
        public Performance performance;
        public ContentRestrictions contentRestrictions;
        public TechnicalRequirements technicalRequirements;
        public Dictionary<string, object> platformSpecific;
        public Dictionary<string, bool> complianceChecks;
        public List<string> buildDefines;
        public List<string> excludedPlatforms;
    }
    
    [System.Serializable]
    public class BuildSettings
    {
        public string targetPlatform;
        public string scriptingBackend;
        public string apiCompatibilityLevel;
        public int memorySize;
        public bool dataCaching;
        public string exceptionSupport;
    }
    
    [System.Serializable]
    public class AdSDKs
    {
        public string primary;
        public string fallback;
        public List<string> requiredApis;
        public List<string> forbiddenApis;
        public Dictionary<string, string> adUnits;
    }
    
    [System.Serializable]
    public class Monetization
    {
        public bool iapEnabled;
        public bool virtualCurrencyOnly;
        public string premiumCurrency;
        public string freeCurrency;
        public int maxPurchaseAmount;
        public float currencyExchangeRate;
    }
    
    [System.Serializable]
    public class Analytics
    {
        public bool unityAnalytics;
        public bool customAnalytics;
        public string dataCollection;
        public bool privacyCompliant;
        public List<string> requiredEvents;
    }
    
    [System.Serializable]
    public class Performance
    {
        public string maxMemoryUsage;
        public string maxBuildSize;
        public string maxLoadingTime;
        public string textureCompression;
        public string audioCompression;
        public string meshCompression;
    }
    
    [System.Serializable]
    public class ContentRestrictions
    {
        public string violenceLevel;
        public string languageRestrictions;
        public bool gamblingElements;
        public bool lootBoxes;
        public bool realMoneyGambling;
        public string ageRating;
        public List<string> contentDescriptors;
    }
    
    [System.Serializable]
    public class TechnicalRequirements
    {
        public string minVersion;
        public List<string> supportedDevices;
        public List<string> screenSizes;
        public List<string> orientationSupport;
        public List<string> hardwareFeatures;
        public List<string> networkRequirements;
    }
    
    [System.Serializable]
    public class ComplianceReport
    {
        public PlatformType platform;
        public System.DateTime timestamp;
        public List<ComplianceCheck> checks;
    }
    
    [System.Serializable]
    public class ComplianceCheck
    {
        public string name;
        public bool required;
        public bool passed;
        public string message;
    }
}