using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Text;
using Newtonsoft.Json;
using Evergreen.Core;

namespace Evergreen.Weather
{
    /// <summary>
    /// Key-Free Weather System
    /// Uses open APIs that don't require API keys or authentication
    /// </summary>
    public class KeyFreeWeatherSystem : MonoBehaviour
    {
        [Header("Weather Configuration")]
        [SerializeField] private bool enableWeatherSystem = true;
        [SerializeField] private bool enableRealTimeWeather = true;
        [SerializeField] private WeatherSource weatherSource = WeatherSource.OpenMeteo;
        [SerializeField] private float updateInterval = 300f; // 5 minutes
        [SerializeField] private bool useLocationBased = true;
        
        [Header("Fallback Configuration")]
        [SerializeField] private bool enableFallback = true;
        [SerializeField] private WeatherSource fallbackSource = WeatherSource.WTTR;
        [SerializeField] private bool useLocalSimulation = true;
        
        [Header("Location Settings")]
        [SerializeField] private float defaultLatitude = 51.5074f; // London
        [SerializeField] private float defaultLongitude = -0.1278f;
        [SerializeField] private string defaultLocation = "London";
        
        // Weather sources that don't require API keys
        public enum WeatherSource
        {
            OpenMeteo,      // https://open-meteo.com - No API key required
            WTTR,           // https://wttr.in - No API key required
            IPBased,        // https://ipapi.co - No API key required
            LocalSimulation // No external calls
        }
        
        // Singleton
        public static KeyFreeWeatherSystem Instance { get; private set; }
        
        // Services
        private GameAnalyticsManager analyticsManager;
        
        // Weather data
        private WeatherData currentWeather;
        private Dictionary<string, WeatherCondition> weatherConditions = new Dictionary<string, WeatherCondition>();
        private DateTime lastWeatherUpdate;
        private bool isWeatherActive = false;
        
        // Events
        public System.Action<WeatherData> OnWeatherUpdated;
        public System.Action<WeatherType> OnWeatherChanged;
        public System.Action<string> OnWeatherError;
        
        [System.Serializable]
        public class WeatherData
        {
            public string source;
            public string location;
            public float latitude;
            public float longitude;
            public WeatherType type;
            public string description;
            public float temperature;
            public int humidity;
            public float pressure;
            public float windSpeed;
            public int windDirection;
            public int cloudCover;
            public float visibility;
            public DateTime timestamp;
            public Dictionary<string, object> gameplayEffects;
        }
        
        [System.Serializable]
        public class WeatherCondition
        {
            public string id;
            public string name;
            public WeatherType type;
            public WeatherIntensity intensity;
            public float temperature;
            public int humidity;
            public float pressure;
            public float windSpeed;
            public int windDirection;
            public float visibility;
            public int cloudCover;
            public Color skyColor;
            public Color fogColor;
            public bool isActive;
            public bool isTransitioning;
            public float duration;
            public float remainingTime;
            public DateTime startTime;
            public DateTime endTime;
            public Dictionary<string, object> properties;
        }
        
        public enum WeatherType
        {
            Clear,
            Cloudy,
            Rain,
            Snow,
            Thunderstorm,
            Fog,
            Haze,
            Unknown
        }
        
        public enum WeatherIntensity
        {
            None,
            Light,
            Medium,
            Heavy,
            Extreme
        }
        
        // Open API responses
        [System.Serializable]
        public class OpenMeteoResponse
        {
            public float latitude;
            public float longitude;
            public float generationtime_ms;
            public int utc_offset_seconds;
            public string timezone;
            public string timezone_abbreviation;
            public float elevation;
            public CurrentWeather current_weather;
        }
        
        [System.Serializable]
        public class CurrentWeather
        {
            public float temperature;
            public float windspeed;
            public float winddirection;
            public int weathercode;
            public int is_day;
            public string time;
        }
        
        [System.Serializable]
        public class WTTRResponse
        {
            public CurrentCondition current_condition;
            public List<WeatherCondition> weather;
        }
        
        [System.Serializable]
        public class CurrentCondition
        {
            public string temp_C;
            public string temp_F;
            public string humidity;
            public string pressure;
            public string wind_speed;
            public string wind_dir;
            public string cloudcover;
            public string visibility;
            public string weatherDesc;
            public string weatherCode;
        }
        
        [System.Serializable]
        public class IPLocationResponse
        {
            public string ip;
            public string city;
            public string region;
            public string country;
            public string country_name;
            public string latitude;
            public string longitude;
            public string timezone;
            public string utc_offset;
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeWeatherSystem();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (enableWeatherSystem)
            {
                StartCoroutine(InitializeWeatherSystemCoroutine());
            }
        }
        
        private void InitializeWeatherSystem()
        {
            lastWeatherUpdate = DateTime.MinValue;
            analyticsManager = GameAnalyticsManager.Instance;
        }
        
        private IEnumerator InitializeWeatherSystemCoroutine()
        {
            Debug.Log("Initializing Key-Free Weather System");
            
            // Get player location if enabled
            if (useLocationBased)
            {
                yield return StartCoroutine(GetPlayerLocation());
            }
            
            // Load initial weather
            yield return StartCoroutine(LoadWeatherData());
            
            // Start weather update loop
            if (enableRealTimeWeather)
            {
                StartCoroutine(WeatherUpdateLoop());
            }
            
            Debug.Log("Key-Free Weather System initialized successfully");
        }
        
        private IEnumerator GetPlayerLocation()
        {
            // Try to get location from browser if on WebGL
            if (Application.platform == RuntimePlatform.WebGLPlayer)
            {
                yield return StartCoroutine(GetBrowserLocation());
            }
            else
            {
                // Use default location for other platforms
                Debug.Log($"Using default location: {defaultLocation} ({defaultLatitude}, {defaultLongitude})");
            }
        }
        
        private IEnumerator GetBrowserLocation()
        {
            string jsCode = @"
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        var lat = position.coords.latitude;
                        var lng = position.coords.longitude;
                        SendMessage('KeyFreeWeatherSystem', 'OnLocationReceived', lat + ',' + lng);
                    },
                    function(error) {
                        SendMessage('KeyFreeWeatherSystem', 'OnLocationError', error.message);
                    }
                );
            ";
            
            Application.ExternalEval(jsCode);
            
            // Wait for location response
            float timeout = 10f;
            float elapsed = 0f;
            
            while (elapsed < timeout)
            {
                yield return new WaitForSeconds(0.1f);
                elapsed += 0.1f;
            }
        }
        
        public void OnLocationReceived(string locationData)
        {
            string[] coords = locationData.Split(',');
            if (coords.Length == 2)
            {
                if (float.TryParse(coords[0], out float lat) && float.TryParse(coords[1], out float lng))
                {
                    defaultLatitude = lat;
                    defaultLongitude = lng;
                    Debug.Log($"Location received: {lat}, {lng}");
                }
            }
        }
        
        public void OnLocationError(string error)
        {
            Debug.LogWarning($"Location error: {error}. Using default location.");
        }
        
        private IEnumerator LoadWeatherData()
        {
            string url = GetWeatherURL();
            
            if (string.IsNullOrEmpty(url))
            {
                if (useLocalSimulation)
                {
                    GenerateLocalWeather();
                }
                yield break;
            }
            
            using (UnityEngine.Networking.UnityWebRequest request = UnityEngine.Networking.UnityWebRequest.Get(url))
            {
                yield return request.SendWebRequest();
                
                if (request.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                {
                    try
                    {
                        ProcessWeatherResponse(request.downloadHandler.text);
                    }
                    catch (Exception e)
                    {
                        Debug.LogError($"Failed to parse weather data: {e.Message}");
                        if (enableFallback)
                        {
                            yield return StartCoroutine(TryFallbackWeather());
                        }
                    }
                }
                else
                {
                    Debug.LogError($"Weather request failed: {request.error}");
                    if (enableFallback)
                    {
                        yield return StartCoroutine(TryFallbackWeather());
                    }
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
                    return $"https://wttr.in/{defaultLocation}?format=j1";
                
                case WeatherSource.IPBased:
                    return "https://ipapi.co/json/";
                
                default:
                    return null; // Use local simulation
            }
        }
        
        private IEnumerator TryFallbackWeather()
        {
            Debug.Log("Trying fallback weather source...");
            
            string fallbackUrl = GetFallbackURL();
            
            if (string.IsNullOrEmpty(fallbackUrl))
            {
                if (useLocalSimulation)
                {
                    GenerateLocalWeather();
                }
                yield break;
            }
            
            using (UnityEngine.Networking.UnityWebRequest request = UnityEngine.Networking.UnityWebRequest.Get(fallbackUrl))
            {
                yield return request.SendWebRequest();
                
                if (request.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                {
                    try
                    {
                        ProcessWeatherResponse(request.downloadHandler.text);
                    }
                    catch (Exception e)
                    {
                        Debug.LogError($"Fallback weather parsing failed: {e.Message}");
                        if (useLocalSimulation)
                        {
                            GenerateLocalWeather();
                        }
                    }
                }
                else
                {
                    Debug.LogError($"Fallback weather request failed: {request.error}");
                    if (useLocalSimulation)
                    {
                        GenerateLocalWeather();
                    }
                }
            }
        }
        
        private string GetFallbackURL()
        {
            switch (fallbackSource)
            {
                case WeatherSource.OpenMeteo:
                    return $"https://api.open-meteo.com/v1/forecast?latitude={defaultLatitude}&longitude={defaultLongitude}&current_weather=true&timezone=auto";
                
                case WeatherSource.WTTR:
                    return $"https://wttr.in/{defaultLocation}?format=j1";
                
                case WeatherSource.IPBased:
                    return "https://ipapi.co/json/";
                
                default:
                    return null;
            }
        }
        
        private void ProcessWeatherResponse(string jsonResponse)
        {
            WeatherData weather = null;
            
            switch (weatherSource)
            {
                case WeatherSource.OpenMeteo:
                    weather = ParseOpenMeteoResponse(jsonResponse);
                    break;
                
                case WeatherSource.WTTR:
                    weather = ParseWTTRResponse(jsonResponse);
                    break;
                
                case WeatherSource.IPBased:
                    weather = ParseIPLocationResponse(jsonResponse);
                    break;
            }
            
            if (weather != null)
            {
                ApplyWeatherData(weather);
            }
        }
        
        private WeatherData ParseOpenMeteoResponse(string json)
        {
            try
            {
                var response = JsonConvert.DeserializeObject<OpenMeteoResponse>(json);
                var current = response.current_weather;
                
                return new WeatherData
                {
                    source = "OpenMeteo",
                    location = defaultLocation,
                    latitude = response.latitude,
                    longitude = response.longitude,
                    type = MapWeatherCode(current.weathercode),
                    description = GetWeatherDescription(current.weathercode),
                    temperature = current.temperature,
                    humidity = 0, // Not provided by OpenMeteo
                    pressure = 0, // Not provided by OpenMeteo
                    windSpeed = current.windspeed,
                    windDirection = (int)current.winddirection,
                    cloudCover = 0, // Not provided by OpenMeteo
                    visibility = 0, // Not provided by OpenMeteo
                    timestamp = DateTime.Now,
                    gameplayEffects = GetGameplayEffects(MapWeatherCode(current.weathercode))
                };
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to parse OpenMeteo response: {e.Message}");
                return null;
            }
        }
        
        private WeatherData ParseWTTRResponse(string json)
        {
            try
            {
                var response = JsonConvert.DeserializeObject<WTTRResponse>(json);
                var current = response.current_condition[0];
                
                return new WeatherData
                {
                    source = "WTTR",
                    location = defaultLocation,
                    latitude = defaultLatitude,
                    longitude = defaultLongitude,
                    type = MapWeatherDescription(current.weatherDesc[0].value),
                    description = current.weatherDesc[0].value,
                    temperature = float.Parse(current.temp_C),
                    humidity = int.Parse(current.humidity),
                    pressure = float.Parse(current.pressure),
                    windSpeed = float.Parse(current.wind_speed),
                    windDirection = int.Parse(current.wind_dir),
                    cloudCover = int.Parse(current.cloudcover),
                    visibility = float.Parse(current.visibility),
                    timestamp = DateTime.Now,
                    gameplayEffects = GetGameplayEffects(MapWeatherDescription(current.weatherDesc[0].value))
                };
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to parse WTTR response: {e.Message}");
                return null;
            }
        }
        
        private WeatherData ParseIPLocationResponse(string json)
        {
            try
            {
                var response = JsonConvert.DeserializeObject<IPLocationResponse>(json);
                
                return new WeatherData
                {
                    source = "IPLocation",
                    location = response.city,
                    latitude = float.Parse(response.latitude),
                    longitude = float.Parse(response.longitude),
                    type = WeatherType.Unknown, // IP location doesn't provide weather
                    description = "Location detected",
                    temperature = 20f, // Default temperature
                    humidity = 50, // Default humidity
                    pressure = 1013f, // Default pressure
                    windSpeed = 0f,
                    windDirection = 0,
                    cloudCover = 0,
                    visibility = 10f,
                    timestamp = DateTime.Now,
                    gameplayEffects = GetGameplayEffects(WeatherType.Unknown)
                };
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to parse IP location response: {e.Message}");
                return null;
            }
        }
        
        private WeatherType MapWeatherCode(int code)
        {
            // OpenMeteo weather codes
            if (code == 0) return WeatherType.Clear;
            if (code >= 1 && code <= 3) return WeatherType.Cloudy;
            if (code >= 45 && code <= 48) return WeatherType.Fog;
            if (code >= 51 && code <= 67) return WeatherType.Rain;
            if (code >= 71 && code <= 77) return WeatherType.Snow;
            if (code >= 80 && code <= 82) return WeatherType.Rain;
            if (code >= 85 && code <= 86) return WeatherType.Snow;
            if (code >= 95 && code <= 99) return WeatherType.Thunderstorm;
            
            return WeatherType.Unknown;
        }
        
        private WeatherType MapWeatherDescription(string description)
        {
            string desc = description.ToLower();
            
            if (desc.Contains("clear") || desc.Contains("sunny")) return WeatherType.Clear;
            if (desc.Contains("cloud") || desc.Contains("overcast")) return WeatherType.Cloudy;
            if (desc.Contains("rain") || desc.Contains("drizzle")) return WeatherType.Rain;
            if (desc.Contains("snow") || desc.Contains("blizzard")) return WeatherType.Snow;
            if (desc.Contains("storm") || desc.Contains("thunder")) return WeatherType.Thunderstorm;
            if (desc.Contains("fog") || desc.Contains("mist")) return WeatherType.Fog;
            if (desc.Contains("haze")) return WeatherType.Haze;
            
            return WeatherType.Unknown;
        }
        
        private string GetWeatherDescription(int code)
        {
            switch (code)
            {
                case 0: return "Clear sky";
                case 1: return "Mainly clear";
                case 2: return "Partly cloudy";
                case 3: return "Overcast";
                case 45: return "Fog";
                case 48: return "Depositing rime fog";
                case 51: return "Light drizzle";
                case 53: return "Moderate drizzle";
                case 55: return "Dense drizzle";
                case 61: return "Slight rain";
                case 63: return "Moderate rain";
                case 65: return "Heavy rain";
                case 71: return "Slight snow";
                case 73: return "Moderate snow";
                case 75: return "Heavy snow";
                case 80: return "Slight rain showers";
                case 81: return "Moderate rain showers";
                case 82: return "Violent rain showers";
                case 95: return "Thunderstorm";
                case 96: return "Thunderstorm with slight hail";
                case 99: return "Thunderstorm with heavy hail";
                default: return "Unknown";
            }
        }
        
        private Dictionary<string, object> GetGameplayEffects(WeatherType weatherType)
        {
            var effects = new Dictionary<string, object>();
            
            switch (weatherType)
            {
                case WeatherType.Clear:
                    effects["scoreMultiplier"] = 1.0f;
                    effects["energyRegen"] = 1.0f;
                    effects["specialChance"] = 1.0f;
                    effects["visualTheme"] = "sunny";
                    break;
                
                case WeatherType.Rain:
                    effects["scoreMultiplier"] = 1.2f;
                    effects["energyRegen"] = 0.8f;
                    effects["specialChance"] = 1.3f;
                    effects["visualTheme"] = "rainy";
                    break;
                
                case WeatherType.Snow:
                    effects["scoreMultiplier"] = 1.1f;
                    effects["energyRegen"] = 0.9f;
                    effects["specialChance"] = 1.2f;
                    effects["visualTheme"] = "winter";
                    break;
                
                case WeatherType.Thunderstorm:
                    effects["scoreMultiplier"] = 1.5f;
                    effects["energyRegen"] = 0.7f;
                    effects["specialChance"] = 1.8f;
                    effects["visualTheme"] = "stormy";
                    break;
                
                case WeatherType.Fog:
                    effects["scoreMultiplier"] = 0.9f;
                    effects["energyRegen"] = 1.1f;
                    effects["specialChance"] = 0.8f;
                    effects["visualTheme"] = "mysterious";
                    break;
                
                case WeatherType.Cloudy:
                    effects["scoreMultiplier"] = 1.0f;
                    effects["energyRegen"] = 1.0f;
                    effects["specialChance"] = 1.0f;
                    effects["visualTheme"] = "cloudy";
                    break;
                
                default:
                    effects["scoreMultiplier"] = 1.0f;
                    effects["energyRegen"] = 1.0f;
                    effects["specialChance"] = 1.0f;
                    effects["visualTheme"] = "neutral";
                    break;
            }
            
            return effects;
        }
        
        private void GenerateLocalWeather()
        {
            Debug.Log("Generating local weather simulation");
            
            // Generate random weather for local simulation
            var weatherTypes = System.Enum.GetValues(typeof(WeatherType));
            var randomType = (WeatherType)weatherTypes.GetValue(UnityEngine.Random.Range(0, weatherTypes.Length));
            
            currentWeather = new WeatherData
            {
                source = "LocalSimulation",
                location = defaultLocation,
                latitude = defaultLatitude,
                longitude = defaultLongitude,
                type = randomType,
                description = $"Simulated {randomType} weather",
                temperature = UnityEngine.Random.Range(5f, 30f),
                humidity = UnityEngine.Random.Range(30, 90),
                pressure = UnityEngine.Random.Range(1000f, 1030f),
                windSpeed = UnityEngine.Random.Range(0f, 15f),
                windDirection = UnityEngine.Random.Range(0, 360),
                cloudCover = UnityEngine.Random.Range(0, 100),
                visibility = UnityEngine.Random.Range(5f, 20f),
                timestamp = DateTime.Now,
                gameplayEffects = GetGameplayEffects(randomType)
            };
            
            ApplyWeatherData(currentWeather);
        }
        
        private void ApplyWeatherData(WeatherData weather)
        {
            currentWeather = weather;
            isWeatherActive = true;
            lastWeatherUpdate = DateTime.Now;
            
            // Apply weather effects to game systems
            ApplyWeatherEffects(weather);
            
            // Notify listeners
            OnWeatherUpdated?.Invoke(weather);
            OnWeatherChanged?.Invoke(weather.type);
            
            Debug.Log($"Weather updated: {weather.description} ({weather.temperature}°C) from {weather.source}");
        }
        
        private void ApplyWeatherEffects(WeatherData weather)
        {
            // Apply gameplay effects
            if (weather.gameplayEffects != null)
            {
                foreach (var effect in weather.gameplayEffects)
                {
                    Debug.Log($"Applying weather effect: {effect.Key} = {effect.Value}");
                }
            }
            
            // Apply visual effects
            ApplyVisualEffects(weather.type);
        }
        
        private void ApplyVisualEffects(WeatherType weatherType)
        {
            // This would integrate with your visual effects system
            Debug.Log($"Applying visual effects for {weatherType} weather");
        }
        
        private IEnumerator WeatherUpdateLoop()
        {
            while (enableRealTimeWeather)
            {
                yield return new WaitForSeconds(updateInterval);
                yield return StartCoroutine(LoadWeatherData());
            }
        }
        
        // Public API
        public WeatherData GetCurrentWeather()
        {
            return currentWeather;
        }
        
        public bool IsWeatherActive()
        {
            return isWeatherActive;
        }
        
        public DateTime GetLastUpdate()
        {
            return lastWeatherUpdate;
        }
        
        public void SetWeatherSource(WeatherSource source)
        {
            weatherSource = source;
        }
        
        public void SetLocation(float latitude, float longitude, string locationName = null)
        {
            defaultLatitude = latitude;
            defaultLongitude = longitude;
            if (!string.IsNullOrEmpty(locationName))
            {
                defaultLocation = locationName;
            }
        }
        
        public void RefreshWeather()
        {
            StartCoroutine(LoadWeatherData());
        }
        
        void OnDestroy()
        {
            // Clean up
        }
    }
}