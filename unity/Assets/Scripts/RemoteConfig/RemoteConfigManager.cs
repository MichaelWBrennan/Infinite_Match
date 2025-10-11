using System;
using System.Collections.Generic;
using UnityEngine;
using System.IO;
using Newtonsoft.Json;

namespace RemoteConfig
{
    [System.Serializable]
    public class GameSettings
    {
        public bool ads_enabled;
        public bool kid_safe_mode;
        public bool daily_bonus_enabled;
        public int energy_recharge_rate;
        public int max_energy;
        public int max_lives;
        public int match3_board_size;
        public float level_difficulty_multiplier;
        public float booster_effectiveness;
        public float currency_reward_multiplier;
    }

    [System.Serializable]
    public class RemoteConfigData
    {
        public GameSettings game_settings;
    }

    public class RemoteConfigManager : MonoBehaviour
    {
        [Header("Remote Config Settings")]
        public bool debugMode = true;
        public bool autoRefresh = true;
        public float refreshInterval = 300f; // 5 minutes
        
        private RemoteConfigData config;
        private float lastRefreshTime;
        
        public static RemoteConfigManager Instance { get; private set; }
        
        // Events
        public static event Action<RemoteConfigData> OnConfigUpdated;
        public static event Action<string> OnConfigError;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                LoadRemoteConfig();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void Update()
        {
            if (autoRefresh && Time.time - lastRefreshTime > refreshInterval)
            {
                RefreshConfig();
            }
        }

        private void LoadRemoteConfig()
        {
            try
            {
                string configPath = Path.Combine(Application.streamingAssetsPath, "unity_services_config.json");
                
                if (File.Exists(configPath))
                {
                    string jsonContent = File.ReadAllText(configPath);
                    var fullConfig = JsonConvert.DeserializeObject<UnityServicesConfig>(jsonContent);
                    config = new RemoteConfigData
                    {
                        game_settings = fullConfig.remoteConfig.game_settings
                    };
                    
                    if (debugMode)
                    {
                        Debug.Log("[RemoteConfig] Configuration loaded successfully");
                        LogConfigValues();
                    }
                    
                    OnConfigUpdated?.Invoke(config);
                }
                else
                {
                    Debug.LogError("[RemoteConfig] Configuration file not found at: " + configPath);
                    CreateDefaultConfig();
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[RemoteConfig] Failed to load configuration: {e.Message}");
                OnConfigError?.Invoke(e.Message);
                CreateDefaultConfig();
            }
        }

        private void CreateDefaultConfig()
        {
            config = new RemoteConfigData
            {
                game_settings = new GameSettings
                {
                    ads_enabled = true,
                    kid_safe_mode = true,
                    daily_bonus_enabled = true,
                    energy_recharge_rate = 300,
                    max_energy = 100,
                    max_lives = 5,
                    match3_board_size = 8,
                    level_difficulty_multiplier = 1.0f,
                    booster_effectiveness = 1.0f,
                    currency_reward_multiplier = 1.0f
                }
            };
            
            if (debugMode)
            {
                Debug.Log("[RemoteConfig] Using default configuration");
            }
        }

        public void RefreshConfig()
        {
            lastRefreshTime = Time.time;
            LoadRemoteConfig();
            
            if (debugMode)
            {
                Debug.Log("[RemoteConfig] Configuration refreshed");
            }
        }

        // Getters for specific config values
        public bool GetBool(string key, bool defaultValue = false)
        {
            if (config?.game_settings != null)
            {
                switch (key.ToLower())
                {
                    case "ads_enabled":
                        return config.game_settings.ads_enabled;
                    case "kid_safe_mode":
                        return config.game_settings.kid_safe_mode;
                    case "daily_bonus_enabled":
                        return config.game_settings.daily_bonus_enabled;
                    default:
                        return defaultValue;
                }
            }
            return defaultValue;
        }

        public int GetInt(string key, int defaultValue = 0)
        {
            if (config?.game_settings != null)
            {
                switch (key.ToLower())
                {
                    case "energy_recharge_rate":
                        return config.game_settings.energy_recharge_rate;
                    case "max_energy":
                        return config.game_settings.max_energy;
                    case "max_lives":
                        return config.game_settings.max_lives;
                    case "match3_board_size":
                        return config.game_settings.match3_board_size;
                    default:
                        return defaultValue;
                }
            }
            return defaultValue;
        }

        public float GetFloat(string key, float defaultValue = 0f)
        {
            if (config?.game_settings != null)
            {
                switch (key.ToLower())
                {
                    case "level_difficulty_multiplier":
                        return config.game_settings.level_difficulty_multiplier;
                    case "booster_effectiveness":
                        return config.game_settings.booster_effectiveness;
                    case "currency_reward_multiplier":
                        return config.game_settings.currency_reward_multiplier;
                    default:
                        return defaultValue;
                }
            }
            return defaultValue;
        }

        public string GetString(string key, string defaultValue = "")
        {
            // For future string configs
            return defaultValue;
        }

        // Get full config
        public RemoteConfigData GetConfig()
        {
            return config;
        }

        // Get game settings
        public GameSettings GetGameSettings()
        {
            return config?.game_settings;
        }

        private void LogConfigValues()
        {
            if (config?.game_settings != null)
            {
                Debug.Log("=== REMOTE CONFIG VALUES ===");
                Debug.Log($"Ads Enabled: {config.game_settings.ads_enabled}");
                Debug.Log($"Kid Safe Mode: {config.game_settings.kid_safe_mode}");
                Debug.Log($"Daily Bonus Enabled: {config.game_settings.daily_bonus_enabled}");
                Debug.Log($"Energy Recharge Rate: {config.game_settings.energy_recharge_rate}");
                Debug.Log($"Max Energy: {config.game_settings.max_energy}");
                Debug.Log($"Max Lives: {config.game_settings.max_lives}");
                Debug.Log($"Match3 Board Size: {config.game_settings.match3_board_size}");
                Debug.Log($"Level Difficulty Multiplier: {config.game_settings.level_difficulty_multiplier}");
                Debug.Log($"Booster Effectiveness: {config.game_settings.booster_effectiveness}");
                Debug.Log($"Currency Reward Multiplier: {config.game_settings.currency_reward_multiplier}");
                Debug.Log("===========================");
            }
        }
    }

    // Helper class for Unity Services Config
    [System.Serializable]
    public class UnityServicesConfig
    {
        public string projectId;
        public string environmentId;
        public string licenseType;
        public bool cloudServicesAvailable;
        public RemoteConfigData remoteConfig;
    }
}
