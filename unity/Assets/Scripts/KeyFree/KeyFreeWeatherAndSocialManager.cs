using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Text;
using Newtonsoft.Json;
using Evergreen.Core;

namespace Evergreen.KeyFree
{
    /// <summary>
    /// Consolidated Weather and Social Manager - No API keys required
    /// Combines weather data fetching and social sharing functionality
    /// </summary>
    public class KeyFreeWeatherAndSocialManager : MonoBehaviour
    {
        [Header("Weather Configuration")]
        [SerializeField] private WeatherSource weatherSource = WeatherSource.OpenMeteo;
        [SerializeField] private WeatherSource fallbackSource = WeatherSource.WTTR;
        [SerializeField] private float weatherUpdateInterval = 300f; // 5 minutes
        [SerializeField] private bool enableWeatherEffects = true;
        [SerializeField] private bool enableLocationDetection = true;
        
        [Header("Social Configuration")]
        [SerializeField] private bool enableNativeSharing = true;
        [SerializeField] private bool enableQRSharing = true;
        [SerializeField] private bool enableP2PSharing = true;
        [SerializeField] private bool enableClipboardSharing = true;
        [SerializeField] private bool enableEmailSharing = true;
        [SerializeField] private bool enableSMSSharing = true;
        
        [Header("Location Settings")]
        [SerializeField] private float defaultLatitude = 51.5074f; // London
        [SerializeField] private float defaultLongitude = -0.1278f;
        [SerializeField] private string defaultLocationName = "London";
        
        [Header("Game Integration")]
        [SerializeField] private string gameName = "Evergreen Match-3";
        [SerializeField] private string gameVersion = "1.0.0";
        [SerializeField] private string gameWebsite = "https://evergreen-game.com";
        
        // Weather Data Structures
        [System.Serializable]
        public class WeatherData
        {
            public string location;
            public float latitude;
            public float longitude;
            public float temperature;
            public float humidity;
            public float windSpeed;
            public WeatherType weatherType;
            public WeatherIntensity intensity;
            public string description;
            public string source;
            public DateTime timestamp;
            public bool isActive;
        }
        
        [System.Serializable]
        public class WeatherCondition
        {
            public int code;
            public string description;
            public WeatherType type;
            public WeatherIntensity intensity;
        }
        
        public enum WeatherType
        {
            Clear, Sunny, PartlyCloudy, Cloudy, Rainy, Stormy, Snowy, Foggy, Windy, Hot, Cold
        }
        
        public enum WeatherIntensity
        {
            Light, Moderate, Heavy, Extreme
        }
        
        public enum WeatherSource
        {
            OpenMeteo, WTTR, IPBased, LocalSimulation
        }
        
        // Social Data Structures
        [System.Serializable]
        public class ShareRecord
        {
            public string id;
            public string content;
            public SharePlatform platform;
            public DateTime timestamp;
            public bool success;
            public string error;
        }
        
        [System.Serializable]
        public class QRCodeData
        {
            public string url;
            public string content;
            public int size;
            public DateTime generatedAt;
        }
        
        public enum SharePlatform
        {
            Native, QR, P2P, Clipboard, Email, SMS
        }
        
        // API Response Structures
        [System.Serializable]
        public class OpenMeteoResponse
        {
            public float latitude;
            public float longitude;
            public CurrentWeather current_weather;
        }
        
        [System.Serializable]
        public class CurrentWeather
        {
            public float temperature;
            public float windspeed;
            public int weathercode;
            public int is_day;
        }
        
        [System.Serializable]
        public class WTTRResponse
        {
            public List<CurrentCondition> current_condition;
        }
        
        [System.Serializable]
        public class CurrentCondition
        {
            public string temp_C;
            public string humidity;
            public string windspeedKmph;
            public string weatherDesc;
        }
        
        [System.Serializable]
        public class IPLocationResponse
        {
            public string city;
            public string region;
            public string country;
            public float latitude;
            public float longitude;
        }
        
        // Events
        public static event Action<WeatherData> OnWeatherUpdated;
        public static event Action<WeatherData> OnWeatherChanged;
        public static event Action<ShareRecord> OnShareCompleted;
        public static event Action<string> OnShareError;
        
        // Singleton
        public static KeyFreeWeatherAndSocialManager Instance { get; private set; }
        
        // Private fields
        private WeatherData currentWeather;
        private Dictionary<string, object> socialStats;
        private List<ShareRecord> shareHistory;
        private bool isInitialized = false;
        private Coroutine weatherUpdateCoroutine;
        private bool nativeSharingSupported = false;
        
        // Weather condition mappings
        private Dictionary<int, WeatherCondition> weatherConditions;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeWeatherAndSocialManager();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            StartCoroutine(InitializeWeatherAndSocialSystem());
        }
        
        private void InitializeWeatherAndSocialManager()
        {
            // Initialize weather conditions
            InitializeWeatherConditions();
            
            // Initialize social stats
            socialStats = new Dictionary<string, object>
            {
                {"totalShares", 0},
                {"successfulShares", 0},
                {"failedShares", 0},
                {"lastShareTime", DateTime.MinValue}
            };
            
            shareHistory = new List<ShareRecord>();
            
            // Load data from PlayerPrefs
            LoadSocialData();
        }
        
        private void InitializeWeatherConditions()
        {
            weatherConditions = new Dictionary<int, WeatherCondition>
            {
                {0, new WeatherCondition {code = 0, description = "Clear sky", type = WeatherType.Clear, intensity = WeatherIntensity.Light}},
                {1, new WeatherCondition {code = 1, description = "Mainly clear", type = WeatherType.PartlyCloudy, intensity = WeatherIntensity.Light}},
                {2, new WeatherCondition {code = 2, description = "Partly cloudy", type = WeatherType.PartlyCloudy, intensity = WeatherIntensity.Moderate}},
                {3, new WeatherCondition {code = 3, description = "Overcast", type = WeatherType.Cloudy, intensity = WeatherIntensity.Moderate}},
                {45, new WeatherCondition {code = 45, description = "Foggy", type = WeatherType.Foggy, intensity = WeatherIntensity.Moderate}},
                {48, new WeatherCondition {code = 48, description = "Depositing rime fog", type = WeatherType.Foggy, intensity = WeatherIntensity.Heavy}},
                {51, new WeatherCondition {code = 51, description = "Light drizzle", type = WeatherType.Rainy, intensity = WeatherIntensity.Light}},
                {53, new WeatherCondition {code = 53, description = "Moderate drizzle", type = WeatherType.Rainy, intensity = WeatherIntensity.Moderate}},
                {55, new WeatherCondition {code = 55, description = "Dense drizzle", type = WeatherType.Rainy, intensity = WeatherIntensity.Heavy}},
                {61, new WeatherCondition {code = 61, description = "Slight rain", type = WeatherType.Rainy, intensity = WeatherIntensity.Light}},
                {63, new WeatherCondition {code = 63, description = "Moderate rain", type = WeatherType.Rainy, intensity = WeatherIntensity.Moderate}},
                {65, new WeatherCondition {code = 65, description = "Heavy rain", type = WeatherType.Rainy, intensity = WeatherIntensity.Heavy}},
                {71, new WeatherCondition {code = 71, description = "Slight snow", type = WeatherType.Snowy, intensity = WeatherIntensity.Light}},
                {73, new WeatherCondition {code = 73, description = "Moderate snow", type = WeatherType.Snowy, intensity = WeatherIntensity.Moderate}},
                {75, new WeatherCondition {code = 75, description = "Heavy snow", type = WeatherType.Snowy, intensity = WeatherIntensity.Heavy}},
                {80, new WeatherCondition {code = 80, description = "Slight rain showers", type = WeatherType.Rainy, intensity = WeatherIntensity.Light}},
                {81, new WeatherCondition {code = 81, description = "Moderate rain showers", type = WeatherType.Rainy, intensity = WeatherIntensity.Moderate}},
                {82, new WeatherCondition {code = 82, description = "Violent rain showers", type = WeatherType.Rainy, intensity = WeatherIntensity.Extreme}},
                {95, new WeatherCondition {code = 95, description = "Thunderstorm", type = WeatherType.Stormy, intensity = WeatherIntensity.Heavy}},
                {96, new WeatherCondition {code = 96, description = "Thunderstorm with slight hail", type = WeatherType.Stormy, intensity = WeatherIntensity.Heavy}},
                {99, new WeatherCondition {code = 99, description = "Thunderstorm with heavy hail", type = WeatherType.Stormy, intensity = WeatherIntensity.Extreme}}
            };
        }
        
        private IEnumerator InitializeWeatherAndSocialSystem()
        {
            // Get player location
            if (enableLocationDetection)
            {
                yield return StartCoroutine(GetPlayerLocation());
            }
            
            // Load weather data
            yield return StartCoroutine(LoadWeatherData());
            
            // Initialize social system
            yield return StartCoroutine(InitializeSocialSystem());
            
            // Start weather update loop
            if (weatherUpdateCoroutine != null)
            {
                StopCoroutine(weatherUpdateCoroutine);
            }
            weatherUpdateCoroutine = StartCoroutine(WeatherUpdateLoop());
            
            isInitialized = true;
            Debug.Log("✅ Weather and Social Manager initialized successfully");
        }
        
        private IEnumerator GetPlayerLocation()
        {
            if (Application.platform == RuntimePlatform.WebGLPlayer)
            {
                yield return StartCoroutine(GetBrowserLocation());
            }
            else
            {
                // Use default location for non-WebGL platforms
                SetLocation(defaultLatitude, defaultLongitude, defaultLocationName);
            }
        }
        
        private IEnumerator GetBrowserLocation()
        {
            string jsCode = @"
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        function(position) {
                            var data = {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                                accuracy: position.coords.accuracy
                            };
                            SendMessage('KeyFreeWeatherAndSocialManager', 'OnLocationReceived', JSON.stringify(data));
                        },
                        function(error) {
                            SendMessage('KeyFreeWeatherAndSocialManager', 'OnLocationError', error.message);
                        }
                    );
                } else {
                    SendMessage('KeyFreeWeatherAndSocialManager', 'OnLocationError', 'Geolocation not supported');
                }
            ";
            
            Application.ExternalEval(jsCode);
            
            // Wait for callback
            yield return new WaitForSeconds(2f);
        }
        
        public void OnLocationReceived(string locationData)
        {
            try
            {
                var location = JsonConvert.DeserializeObject<dynamic>(locationData);
                float lat = (float)location.latitude;
                float lon = (float)location.longitude;
                SetLocation(lat, lon, "Player Location");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to parse location data: {e.Message}");
                SetLocation(defaultLatitude, defaultLongitude, defaultLocationName);
            }
        }
        
        public void OnLocationError(string error)
        {
            Debug.LogWarning($"Location detection failed: {error}");
            SetLocation(defaultLatitude, defaultLongitude, defaultLocationName);
        }
        
        private IEnumerator LoadWeatherData()
        {
            string weatherURL = GetWeatherURL();
            
            using (var request = UnityEngine.Networking.UnityWebRequest.Get(weatherURL))
            {
                yield return request.SendWebRequest();
                
                if (request.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                {
                    ProcessWeatherResponse(request.downloadHandler.text);
                }
                else
                {
                    Debug.LogWarning($"Primary weather API failed: {request.error}");
                    yield return StartCoroutine(TryFallbackWeather());
                }
            }
        }
        
        private string GetWeatherURL()
        {
            switch (weatherSource)
            {
                case WeatherSource.OpenMeteo:
                    return $"https://api.open-meteo.com/v1/forecast?latitude={defaultLatitude}&longitude={defaultLongitude}&current_weather=true&timezone=auto";
                case WeatherSource.WTTR:
                    return $"https://wttr.in/{defaultLocationName}?format=j1";
                case WeatherSource.IPBased:
                    return "https://ipapi.co/json/";
                default:
                    return "";
            }
        }
        
        private IEnumerator TryFallbackWeather()
        {
            string fallbackURL = GetFallbackURL();
            
            if (!string.IsNullOrEmpty(fallbackURL))
            {
                using (var request = UnityEngine.Networking.UnityWebRequest.Get(fallbackURL))
                {
                    yield return request.SendWebRequest();
                    
                    if (request.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                    {
                        ProcessWeatherResponse(request.downloadHandler.text);
                    }
                    else
                    {
                        Debug.LogWarning($"Fallback weather API also failed: {request.error}");
                        GenerateLocalWeather();
                    }
                }
            }
            else
            {
                GenerateLocalWeather();
            }
        }
        
        private string GetFallbackURL()
        {
            switch (fallbackSource)
            {
                case WeatherSource.OpenMeteo:
                    return $"https://api.open-meteo.com/v1/forecast?latitude={defaultLatitude}&longitude={defaultLongitude}&current_weather=true&timezone=auto";
                case WeatherSource.WTTR:
                    return $"https://wttr.in/{defaultLocationName}?format=j1";
                case WeatherSource.IPBased:
                    return "https://ipapi.co/json/";
                default:
                    return "";
            }
        }
        
        private void ProcessWeatherResponse(string jsonResponse)
        {
            try
            {
                switch (weatherSource)
                {
                    case WeatherSource.OpenMeteo:
                        currentWeather = ParseOpenMeteoResponse(jsonResponse);
                        break;
                    case WeatherSource.WTTR:
                        currentWeather = ParseWTTRResponse(jsonResponse);
                        break;
                    case WeatherSource.IPBased:
                        currentWeather = ParseIPLocationResponse(jsonResponse);
                        break;
                }
                
                if (currentWeather != null)
                {
                    ApplyWeatherData(currentWeather);
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to process weather response: {e.Message}");
                GenerateLocalWeather();
            }
        }
        
        private WeatherData ParseOpenMeteoResponse(string json)
        {
            var response = JsonConvert.DeserializeObject<OpenMeteoResponse>(json);
            var current = response.current_weather;
            
            var condition = weatherConditions.ContainsKey(current.weathercode) 
                ? weatherConditions[current.weathercode] 
                : new WeatherCondition { code = current.weathercode, description = "Unknown", type = WeatherType.Cloudy, intensity = WeatherIntensity.Moderate };
            
            return new WeatherData
            {
                location = defaultLocationName,
                latitude = response.latitude,
                longitude = response.longitude,
                temperature = current.temperature,
                humidity = 0f, // Not provided by OpenMeteo
                windSpeed = current.windspeed,
                weatherType = condition.type,
                intensity = condition.intensity,
                description = condition.description,
                source = "OpenMeteo",
                timestamp = DateTime.Now,
                isActive = true
            };
        }
        
        private WeatherData ParseWTTRResponse(string json)
        {
            var response = JsonConvert.DeserializeObject<WTTRResponse>(json);
            var current = response.current_condition[0];
            
            return new WeatherData
            {
                location = defaultLocationName,
                latitude = defaultLatitude,
                longitude = defaultLongitude,
                temperature = float.Parse(current.temp_C),
                humidity = float.Parse(current.humidity),
                windSpeed = float.Parse(current.windspeedKmph),
                weatherType = MapWeatherDescription(current.weatherDesc),
                intensity = WeatherIntensity.Moderate,
                description = current.weatherDesc,
                source = "WTTR",
                timestamp = DateTime.Now,
                isActive = true
            };
        }
        
        private WeatherData ParseIPLocationResponse(string json)
        {
            var response = JsonConvert.DeserializeObject<IPLocationResponse>(json);
            
            return new WeatherData
            {
                location = $"{response.city}, {response.region}, {response.country}",
                latitude = response.latitude,
                longitude = response.longitude,
                temperature = UnityEngine.Random.Range(15f, 25f), // Random for IP-based
                humidity = UnityEngine.Random.Range(40f, 80f),
                windSpeed = UnityEngine.Random.Range(5f, 15f),
                weatherType = WeatherType.PartlyCloudy,
                intensity = WeatherIntensity.Moderate,
                description = "Partly Cloudy",
                source = "IP Location",
                timestamp = DateTime.Now,
                isActive = true
            };
        }
        
        private WeatherType MapWeatherDescription(string description)
        {
            string desc = description.ToLower();
            if (desc.Contains("sunny") || desc.Contains("clear")) return WeatherType.Sunny;
            if (desc.Contains("cloudy")) return WeatherType.Cloudy;
            if (desc.Contains("rain") || desc.Contains("drizzle")) return WeatherType.Rainy;
            if (desc.Contains("storm") || desc.Contains("thunder")) return WeatherType.Stormy;
            if (desc.Contains("snow")) return WeatherType.Snowy;
            if (desc.Contains("fog")) return WeatherType.Foggy;
            if (desc.Contains("wind")) return WeatherType.Windy;
            return WeatherType.PartlyCloudy;
        }
        
        private void GenerateLocalWeather()
        {
            var weatherTypes = System.Enum.GetValues(typeof(WeatherType));
            var randomType = (WeatherType)weatherTypes.GetValue(UnityEngine.Random.Range(0, weatherTypes.Length));
            
            currentWeather = new WeatherData
            {
                location = defaultLocationName,
                latitude = defaultLatitude,
                longitude = defaultLongitude,
                temperature = UnityEngine.Random.Range(10f, 30f),
                humidity = UnityEngine.Random.Range(30f, 90f),
                windSpeed = UnityEngine.Random.Range(0f, 20f),
                weatherType = randomType,
                intensity = WeatherIntensity.Moderate,
                description = $"Local {randomType} weather",
                source = "Local Simulation",
                timestamp = DateTime.Now,
                isActive = true
            };
            
            ApplyWeatherData(currentWeather);
        }
        
        private void ApplyWeatherData(WeatherData weather)
        {
            currentWeather = weather;
            
            if (enableWeatherEffects)
            {
                ApplyWeatherEffects(weather);
            }
            
            OnWeatherUpdated?.Invoke(weather);
            OnWeatherChanged?.Invoke(weather);
            
            Debug.Log($"🌤️ Weather updated: {weather.description} ({weather.temperature}°C) from {weather.source}");
        }
        
        private void ApplyWeatherEffects(WeatherData weather)
        {
            var effects = GetWeatherGameplayEffects(weather.weatherType);
            
            Debug.Log($"🎮 Weather effects applied: {JsonConvert.SerializeObject(effects)}");
            
            // Apply visual effects
            ApplyVisualEffects(weather.weatherType);
        }
        
        private Dictionary<string, object> GetWeatherGameplayEffects(WeatherType weatherType)
        {
            var effects = new Dictionary<string, object>();
            
            switch (weatherType)
            {
                case WeatherType.Sunny:
                case WeatherType.Clear:
                    effects["scoreMultiplier"] = 1.2f;
                    effects["energyRegen"] = 1.1f;
                    effects["specialTileChance"] = 0.15f;
                    break;
                case WeatherType.Rainy:
                    effects["scoreMultiplier"] = 0.9f;
                    effects["energyRegen"] = 0.8f;
                    effects["specialTileChance"] = 0.25f;
                    break;
                case WeatherType.Stormy:
                    effects["scoreMultiplier"] = 1.5f;
                    effects["energyRegen"] = 0.7f;
                    effects["specialTileChance"] = 0.35f;
                    break;
                case WeatherType.Snowy:
                    effects["scoreMultiplier"] = 1.1f;
                    effects["energyRegen"] = 0.9f;
                    effects["specialTileChance"] = 0.2f;
                    break;
                case WeatherType.Foggy:
                    effects["scoreMultiplier"] = 0.8f;
                    effects["energyRegen"] = 0.9f;
                    effects["specialTileChance"] = 0.1f;
                    break;
                default:
                    effects["scoreMultiplier"] = 1.0f;
                    effects["energyRegen"] = 1.0f;
                    effects["specialTileChance"] = 0.1f;
                    break;
            }
            
            return effects;
        }
        
        private void ApplyVisualEffects(WeatherType weatherType)
        {
            // Placeholder for visual effects integration
            Debug.Log($"🎨 Visual effects for {weatherType} weather");
        }
        
        private IEnumerator WeatherUpdateLoop()
        {
            while (true)
            {
                yield return new WaitForSeconds(weatherUpdateInterval);
                yield return StartCoroutine(LoadWeatherData());
            }
        }
        
        private IEnumerator InitializeSocialSystem()
        {
            if (Application.platform == RuntimePlatform.WebGLPlayer)
            {
                CheckNativeSharingSupport();
            }
            
            yield return null;
        }
        
        private void CheckNativeSharingSupport()
        {
            string jsCode = @"
                if (navigator.share) {
                    SendMessage('KeyFreeWeatherAndSocialManager', 'OnNativeSharingSupported', 'true');
                } else {
                    SendMessage('KeyFreeWeatherAndSocialManager', 'OnNativeSharingSupported', 'false');
                }
            ";
            
            Application.ExternalEval(jsCode);
        }
        
        public void OnNativeSharingSupported(string supported)
        {
            nativeSharingSupported = supported == "true";
            Debug.Log($"Native sharing supported: {nativeSharingSupported}");
        }
        
        // Social Sharing Methods
        public void ShareScore(int score, string additionalMessage = "")
        {
            string content = $"🎮 Just scored {score:N0} points in {gameName}! {additionalMessage}";
            ShareContent(content, SharePlatform.Native);
        }
        
        public void ShareAchievement(string achievementName, string description = "")
        {
            string content = $"🏆 Achievement Unlocked: {achievementName} in {gameName}! {description}";
            ShareContent(content, SharePlatform.Native);
        }
        
        public void ShareContent(string content, SharePlatform platform = SharePlatform.Native)
        {
            StartCoroutine(ShareContentCoroutine(content, platform));
        }
        
        private IEnumerator ShareContentCoroutine(string content, SharePlatform platform)
        {
            var record = new ShareRecord
            {
                id = System.Guid.NewGuid().ToString(),
                content = content,
                platform = platform,
                timestamp = DateTime.Now,
                success = false,
                error = ""
            };
            
            try
            {
                switch (platform)
                {
                    case SharePlatform.Native:
                        yield return StartCoroutine(ShareViaNativeAPI(content, record));
                        break;
                    case SharePlatform.QR:
                        yield return StartCoroutine(ShareViaQRCode(content, record));
                        break;
                    case SharePlatform.P2P:
                        yield return StartCoroutine(ShareViaP2P(content, record));
                        break;
                    case SharePlatform.Clipboard:
                        yield return StartCoroutine(ShareViaClipboard(content, record));
                        break;
                    case SharePlatform.Email:
                        yield return StartCoroutine(ShareViaEmail(content, record));
                        break;
                    case SharePlatform.SMS:
                        yield return StartCoroutine(ShareViaSMS(content, record));
                        break;
                }
            }
            catch (Exception e)
            {
                record.success = false;
                record.error = e.Message;
                OnShareError?.Invoke(e.Message);
            }
            
            UpdateSocialStats(record.success);
            shareHistory.Add(record);
            SaveSocialData();
            
            if (record.success)
            {
                OnShareCompleted?.Invoke(record);
            }
        }
        
        private IEnumerator ShareViaNativeAPI(string content, ShareRecord record)
        {
            if (Application.platform == RuntimePlatform.WebGLPlayer && nativeSharingSupported)
            {
                string jsCode = $@"
                    navigator.share({{
                        title: '{gameName}',
                        text: '{content}',
                        url: '{gameWebsite}'
                    }}).then(function() {{
                        SendMessage('KeyFreeWeatherAndSocialManager', 'OnNativeShareSuccess', 'navigator.share');
                    }}).catch(function(error) {{
                        SendMessage('KeyFreeWeatherAndSocialManager', 'OnNativeShareError', error.message);
                    }});
                ";
                
                Application.ExternalEval(jsCode);
                
                // Wait for callback
                yield return new WaitForSeconds(2f);
            }
            else
            {
                // Fallback to clipboard
                yield return StartCoroutine(ShareViaClipboard(content, record));
            }
        }
        
        public void OnNativeShareSuccess(string method)
        {
            Debug.Log($"✅ Native share successful via {method}");
        }
        
        public void OnNativeShareError(string error)
        {
            Debug.LogError($"❌ Native share failed: {error}");
        }
        
        private IEnumerator ShareViaQRCode(string content, ShareRecord record)
        {
            string qrURL = $"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={Uri.EscapeDataString(content)}";
            
            using (var request = UnityEngine.Networking.UnityWebRequest.Get(qrURL))
            {
                yield return request.SendWebRequest();
                
                if (request.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                {
                    var texture = new Texture2D(2, 2);
                    texture.LoadImage(request.downloadHandler.data);
                    DisplayQRCode(texture, content);
                    record.success = true;
                }
                else
                {
                    record.success = false;
                    record.error = request.error;
                }
            }
        }
        
        private void DisplayQRCode(Texture2D qrTexture, string content)
        {
            Debug.Log($"📱 QR Code generated for: {content}");
            // Placeholder for UI display
        }
        
        private IEnumerator ShareViaP2P(string content, ShareRecord record)
        {
            string roomCode = GenerateRoomCode();
            string shareData = JsonConvert.SerializeObject(new { content, roomCode, timestamp = DateTime.Now });
            
            // Store in PlayerPrefs for P2P sharing
            PlayerPrefs.SetString($"p2p_share_{roomCode}", shareData);
            PlayerPrefs.Save();
            
            DisplayRoomCode(roomCode);
            record.success = true;
            
            yield return null;
        }
        
        private string GenerateRoomCode()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var random = new System.Random();
            return new string(Enumerable.Repeat(chars, 6).Select(s => s[random.Next(s.Length)]).ToArray());
        }
        
        private void DisplayRoomCode(string roomCode)
        {
            Debug.Log($"🔗 P2P Share Code: {roomCode}");
            // Placeholder for UI display
        }
        
        private IEnumerator ShareViaClipboard(string content, ShareRecord record)
        {
            if (Application.platform == RuntimePlatform.WebGLPlayer)
            {
                string jsCode = $@"
                    navigator.clipboard.writeText('{content}').then(function() {{
                        SendMessage('KeyFreeWeatherAndSocialManager', 'OnClipboardSuccess', 'Clipboard');
                    }}).catch(function(error) {{
                        SendMessage('KeyFreeWeatherAndSocialManager', 'OnClipboardError', error.message);
                    }});
                ";
                
                Application.ExternalEval(jsCode);
                
                // Wait for callback
                yield return new WaitForSeconds(1f);
            }
            else
            {
                GUIUtility.systemCopyBuffer = content;
                record.success = true;
            }
        }
        
        public void OnClipboardSuccess(string data)
        {
            Debug.Log($"✅ Content copied to clipboard: {data}");
        }
        
        public void OnClipboardError(string error)
        {
            Debug.LogError($"❌ Clipboard copy failed: {error}");
        }
        
        private IEnumerator ShareViaEmail(string content, ShareRecord record)
        {
            string subject = Uri.EscapeDataString($"Check out my {gameName} score!");
            string body = Uri.EscapeDataString(content);
            string mailtoURL = $"mailto:?subject={subject}&body={body}";
            
            if (Application.platform == RuntimePlatform.WebGLPlayer)
            {
                string jsCode = $"window.open('{mailtoURL}', '_blank');";
                Application.ExternalEval(jsCode);
            }
            else
            {
                Application.OpenURL(mailtoURL);
            }
            
            record.success = true;
            yield return null;
        }
        
        private IEnumerator ShareViaSMS(string content, ShareRecord record)
        {
            string smsURL = $"sms:?body={Uri.EscapeDataString(content)}";
            
            if (Application.platform == RuntimePlatform.WebGLPlayer)
            {
                string jsCode = $"window.open('{smsURL}', '_blank');";
                Application.ExternalEval(jsCode);
            }
            else
            {
                Application.OpenURL(smsURL);
            }
            
            record.success = true;
            yield return null;
        }
        
        private void UpdateSocialStats(bool success)
        {
            socialStats["totalShares"] = (int)socialStats["totalShares"] + 1;
            socialStats["lastShareTime"] = DateTime.Now;
            
            if (success)
            {
                socialStats["successfulShares"] = (int)socialStats["successfulShares"] + 1;
            }
            else
            {
                socialStats["failedShares"] = (int)socialStats["failedShares"] + 1;
            }
        }
        
        private void LoadSocialData()
        {
            string statsJson = PlayerPrefs.GetString("social_stats", "");
            if (!string.IsNullOrEmpty(statsJson))
            {
                try
                {
                    socialStats = JsonConvert.DeserializeObject<Dictionary<string, object>>(statsJson);
                }
                catch
                {
                    // Use default stats if deserialization fails
                }
            }
            
            string historyJson = PlayerPrefs.GetString("share_history", "");
            if (!string.IsNullOrEmpty(historyJson))
            {
                try
                {
                    shareHistory = JsonConvert.DeserializeObject<List<ShareRecord>>(historyJson);
                }
                catch
                {
                    // Use empty history if deserialization fails
                }
            }
        }
        
        private void SaveSocialData()
        {
            try
            {
                string statsJson = JsonConvert.SerializeObject(socialStats);
                PlayerPrefs.SetString("social_stats", statsJson);
                
                string historyJson = JsonConvert.SerializeObject(shareHistory);
                PlayerPrefs.SetString("share_history", historyJson);
                
                PlayerPrefs.Save();
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to save social data: {e.Message}");
            }
        }
        
        // Public API Methods
        public WeatherData GetCurrentWeather() => currentWeather;
        public bool IsWeatherActive() => currentWeather?.isActive ?? false;
        public DateTime GetLastWeatherUpdate() => currentWeather?.timestamp ?? DateTime.MinValue;
        public void SetWeatherSource(WeatherSource source) => weatherSource = source;
        public void SetLocation(float lat, float lon, string name)
        {
            defaultLatitude = lat;
            defaultLongitude = lon;
            defaultLocationName = name;
        }
        public void RefreshWeather() => StartCoroutine(LoadWeatherData());
        
        public Dictionary<string, object> GetSocialStats() => socialStats;
        public List<ShareRecord> GetShareHistory() => shareHistory;
        public void ClearShareHistory()
        {
            shareHistory.Clear();
            SaveSocialData();
        }
        public void SetGameInfo(string name, string version, string website)
        {
            gameName = name;
            gameVersion = version;
            gameWebsite = website;
        }
        public void SetSharingMethodEnabled(SharePlatform platform, bool enabled)
        {
            switch (platform)
            {
                case SharePlatform.Native: enableNativeSharing = enabled; break;
                case SharePlatform.QR: enableQRSharing = enabled; break;
                case SharePlatform.P2P: enableP2PSharing = enabled; break;
                case SharePlatform.Clipboard: enableClipboardSharing = enabled; break;
                case SharePlatform.Email: enableEmailSharing = enabled; break;
                case SharePlatform.SMS: enableSMSSharing = enabled; break;
            }
        }
        
        void OnDestroy()
        {
            if (weatherUpdateCoroutine != null)
            {
                StopCoroutine(weatherUpdateCoroutine);
            }
        }
    }
}