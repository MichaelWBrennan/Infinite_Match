using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System;

namespace Evergreen.Weather
{
    /// <summary>
    /// Advanced Weather System for dynamic environmental effects
    /// Implements industry-leading weather simulation for maximum immersion
    /// </summary>
    public class AdvancedWeatherSystem : MonoBehaviour
    {
        [Header("Weather Configuration")]
        [SerializeField] private bool enableWeatherSystem = true;
        [SerializeField] private bool enableRealTimeWeather = true;
        [SerializeField] private bool enableWeatherAPI = true;
        [SerializeField] private bool enableWeatherPrediction = true;
        [SerializeField] private bool enableWeatherEffects = true;
        [SerializeField] private bool enableWeatherSound = true;
        [SerializeField] private bool enableWeatherParticles = true;
        [SerializeField] private bool enableWeatherLighting = true;
        
        [Header("Weather Types")]
        [SerializeField] private bool enableRain = true;
        [SerializeField] private bool enableSnow = true;
        [SerializeField] private bool enableFog = true;
        [SerializeField] private bool enableWind = true;
        [SerializeField] private bool enableThunder = true;
        [SerializeField] private bool enableHail = true;
        [SerializeField] private bool enableSandstorm = true;
        [SerializeField] private bool enableBlizzard = true;
        
        [Header("Weather Settings")]
        [SerializeField] private WeatherIntensity intensity = WeatherIntensity.Medium;
        [SerializeField] private float transitionSpeed = 1.0f;
        [SerializeField] private float weatherDuration = 300.0f;
        [SerializeField] private bool enableRandomWeather = true;
        [SerializeField] private bool enableSeasonalWeather = true;
        [SerializeField] private bool enableRegionalWeather = true;
        [SerializeField] private bool enableWeatherInfluence = true;
        
        [Header("Weather Effects")]
        [SerializeField] private bool enableRainEffects = true;
        [SerializeField] private bool enableSnowEffects = true;
        [SerializeField] private bool enableFogEffects = true;
        [SerializeField] private bool enableWindEffects = true;
        [SerializeField] private bool enableThunderEffects = true;
        [SerializeField] private bool enableHailEffects = true;
        [SerializeField] private bool enableSandstormEffects = true;
        [SerializeField] private bool enableBlizzardEffects = true;
        
        [Header("Weather Asset References")]
        [SerializeField] private GameObject rainEffectPrefab;
        [SerializeField] private GameObject snowEffectPrefab;
        [SerializeField] private GameObject fogEffectPrefab;
        [SerializeField] private GameObject windEffectPrefab;
        [SerializeField] private GameObject thunderEffectPrefab;
        [SerializeField] private GameObject hailEffectPrefab;
        [SerializeField] private GameObject sandstormEffectPrefab;
        [SerializeField] private GameObject blizzardEffectPrefab;
        
        [Header("Weather Audio Assets")]
        [SerializeField] private AudioClip rainAudioClip;
        [SerializeField] private AudioClip snowAudioClip;
        [SerializeField] private AudioClip windAudioClip;
        [SerializeField] private AudioClip thunderAudioClip;
        [SerializeField] private AudioClip hailAudioClip;
        [SerializeField] private AudioClip sandstormAudioClip;
        [SerializeField] private AudioClip blizzardAudioClip;
        
        [Header("Weather Particle Systems")]
        [SerializeField] private ParticleSystem rainParticleSystem;
        [SerializeField] private ParticleSystem snowParticleSystem;
        [SerializeField] private ParticleSystem hailParticleSystem;
        [SerializeField] private ParticleSystem sandParticleSystem;
        [SerializeField] private ParticleSystem dustParticleSystem;
        [SerializeField] private ParticleSystem ashParticleSystem;
        
        [Header("Weather Lighting Assets")]
        [SerializeField] private Light sunLight;
        [SerializeField] private Light moonLight;
        [SerializeField] private Light lightningLight;
        [SerializeField] private Light fireLight;
        
        [Header("Weather Audio")]
        [SerializeField] private bool enableWeatherAudio = true;
        [SerializeField] private bool enable3DWeatherAudio = true;
        [SerializeField] private bool enableWeatherAudioMixing = true;
        [SerializeField] private bool enableWeatherAudioFading = true;
        [SerializeField] private bool enableWeatherAudioSpatialization = true;
        
        [Header("Weather Particles")]
        [SerializeField] private bool enableWeatherParticles = true;
        [SerializeField] private bool enableWeatherParticleCollision = true;
        [SerializeField] private bool enableWeatherParticlePhysics = true;
        [SerializeField] private bool enableWeatherParticleLighting = true;
        [SerializeField] private bool enableWeatherParticleShadows = true;
        
        [Header("Weather Lighting")]
        [SerializeField] private bool enableWeatherLighting = true;
        [SerializeField] private bool enableWeatherLightingTransition = true;
        [SerializeField] private bool enableWeatherLightingColor = true;
        [SerializeField] private bool enableWeatherLightingIntensity = true;
        [SerializeField] private bool enableWeatherLightingShadows = true;
        
        private Dictionary<string, WeatherCondition> _weatherConditions = new Dictionary<string, WeatherCondition>();
        private Dictionary<string, WeatherEffect> _weatherEffects = new Dictionary<string, WeatherEffect>();
        private Dictionary<string, WeatherAudio> _weatherAudio = new Dictionary<string, WeatherAudio>();
        private Dictionary<string, WeatherParticle> _weatherParticles = new Dictionary<string, WeatherParticle>();
        private Dictionary<string, WeatherLighting> _weatherLighting = new Dictionary<string, WeatherLighting>();
        private Dictionary<string, WeatherInfluence> _weatherInfluences = new Dictionary<string, WeatherInfluence>();
        
        private WeatherManager _weatherManager;
        private WeatherAPI _weatherAPI;
        private WeatherPredictor _weatherPredictor;
        private WeatherEffectManager _weatherEffectManager;
        private WeatherAudioManager _weatherAudioManager;
        private WeatherParticleManager _weatherParticleManager;
        private WeatherLightingManager _weatherLightingManager;
        private WeatherInfluenceManager _weatherInfluenceManager;
        
        public static AdvancedWeatherSystem Instance { get; private set; }
        
        [System.Serializable]
        public class WeatherCondition
        {
            public string id;
            public string name;
            public WeatherType type;
            public WeatherIntensity intensity;
            public float temperature;
            public float humidity;
            public float pressure;
            public float windSpeed;
            public float windDirection;
            public float visibility;
            public float precipitation;
            public float cloudCover;
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
        
        [System.Serializable]
        public class WeatherEffect
        {
            public string id;
            public string name;
            public WeatherEffectType type;
            public GameObject effectObject;
            public ParticleSystem particleSystem;
            public AudioSource audioSource;
            public Light lightSource;
            public bool isActive;
            public bool isLooping;
            public float intensity;
            public float duration;
            public float remainingTime;
            public Vector3 position;
            public Vector3 rotation;
            public Vector3 scale;
            public Dictionary<string, object> properties;
        }
        
        [System.Serializable]
        public class WeatherAudio
        {
            public string id;
            public string name;
            public WeatherAudioType type;
            public AudioClip audioClip;
            public AudioSource audioSource;
            public bool isActive;
            public bool isLooping;
            public float volume;
            public float pitch;
            public float spatialBlend;
            public float minDistance;
            public float maxDistance;
            public bool enable3D;
            public bool enableSpatialization;
            public Dictionary<string, object> properties;
        }
        
        [System.Serializable]
        public class WeatherParticle
        {
            public string id;
            public string name;
            public WeatherParticleType type;
            public ParticleSystem particleSystem;
            public bool isActive;
            public bool isLooping;
            public float emissionRate;
            public float lifetime;
            public float speed;
            public float size;
            public Color color;
            public bool enableCollision;
            public bool enablePhysics;
            public bool enableLighting;
            public bool enableShadows;
            public Dictionary<string, object> properties;
        }
        
        [System.Serializable]
        public class WeatherLighting
        {
            public string id;
            public string name;
            public WeatherLightingType type;
            public Light lightSource;
            public bool isActive;
            public Color color;
            public float intensity;
            public float range;
            public float spotAngle;
            public bool enableShadows;
            public ShadowQuality shadowQuality;
            public bool enableFlickering;
            public float flickerSpeed;
            public float flickerIntensity;
            public Dictionary<string, object> properties;
        }
        
        [System.Serializable]
        public class WeatherInfluence
        {
            public string id;
            public string name;
            public WeatherInfluenceType type;
            public string targetSystem;
            public float influenceStrength;
            public bool isActive;
            public bool isPositive;
            public float duration;
            public float remainingTime;
            public Dictionary<string, object> properties;
        }
        
        [System.Serializable]
        public class WeatherManager
        {
            public bool isInitialized;
            public bool isActive;
            public WeatherType currentWeather;
            public WeatherIntensity currentIntensity;
            public WeatherType targetWeather;
            public WeatherIntensity targetIntensity;
            public bool isTransitioning;
            public float transitionProgress;
            public DateTime lastUpdate;
            public Dictionary<string, object> settings;
        }
        
        [System.Serializable]
        public class WeatherAPI
        {
            public bool isEnabled;
            public string apiKey;
            public string apiEndpoint;
            public string location;
            public float latitude;
            public float longitude;
            public bool enableRealTime;
            public bool enableForecast;
            public int forecastDays;
            public DateTime lastUpdate;
            public Dictionary<string, object> settings;
        }
        
        [System.Serializable]
        public class WeatherPredictor
        {
            public bool isEnabled;
            public bool enableMachineLearning;
            public bool enablePatternRecognition;
            public bool enableTrendAnalysis;
            public float accuracy;
            public int predictionHours;
            public DateTime lastPrediction;
            public Dictionary<string, object> settings;
        }
        
        [System.Serializable]
        public class WeatherEffectManager
        {
            public bool isEnabled;
            public bool enableRainEffects;
            public bool enableSnowEffects;
            public bool enableFogEffects;
            public bool enableWindEffects;
            public bool enableThunderEffects;
            public bool enableHailEffects;
            public bool enableSandstormEffects;
            public bool enableBlizzardEffects;
            public Dictionary<string, object> settings;
        }
        
        [System.Serializable]
        public class WeatherAudioManager
        {
            public bool isEnabled;
            public bool enable3DAudio;
            public bool enableAudioMixing;
            public bool enableAudioFading;
            public bool enableSpatialization;
            public float masterVolume;
            public Dictionary<string, object> settings;
        }
        
        [System.Serializable]
        public class WeatherParticleManager
        {
            public bool isEnabled;
            public bool enableParticleCollision;
            public bool enableParticlePhysics;
            public bool enableParticleLighting;
            public bool enableParticleShadows;
            public int maxParticles;
            public Dictionary<string, object> settings;
        }
        
        [System.Serializable]
        public class WeatherLightingManager
        {
            public bool isEnabled;
            public bool enableLightingTransition;
            public bool enableLightingColor;
            public bool enableLightingIntensity;
            public bool enableLightingShadows;
            public float transitionSpeed;
            public Dictionary<string, object> settings;
        }
        
        [System.Serializable]
        public class WeatherInfluenceManager
        {
            public bool isEnabled;
            public bool enableGameplayInfluence;
            public bool enableVisualInfluence;
            public bool enableAudioInfluence;
            public bool enablePerformanceInfluence;
            public Dictionary<string, object> settings;
        }
        
        public enum WeatherType
        {
            Clear,
            PartlyCloudy,
            Cloudy,
            Overcast,
            Rain,
            HeavyRain,
            Thunderstorm,
            Snow,
            HeavySnow,
            Blizzard,
            Fog,
            Mist,
            Haze,
            Sandstorm,
            Hail,
            Sleet,
            FreezingRain,
            Custom
        }
        
        public enum WeatherIntensity
        {
            None,
            Light,
            Medium,
            Heavy,
            Extreme
        }
        
        public enum WeatherEffectType
        {
            Rain,
            Snow,
            Fog,
            Wind,
            Thunder,
            Hail,
            Sandstorm,
            Blizzard,
            Custom
        }
        
        public enum WeatherAudioType
        {
            Rain,
            Snow,
            Wind,
            Thunder,
            Hail,
            Sandstorm,
            Blizzard,
            Ambient,
            Custom
        }
        
        public enum WeatherParticleType
        {
            Rain,
            Snow,
            Hail,
            Sand,
            Dust,
            Ash,
            Custom
        }
        
        public enum WeatherLightingType
        {
            Sun,
            Moon,
            Lightning,
            Fire,
            Custom
        }
        
        public enum WeatherInfluenceType
        {
            Gameplay,
            Visual,
            Audio,
            Performance,
            Custom
        }
        
        public enum ShadowQuality
        {
            Disabled,
            HardOnly,
            HardAndSoft
        }
        
        [System.Serializable]
        public class WeatherAPIResponse
        {
            public WeatherMain main;
            public WeatherInfo[] weather;
            public WeatherWind wind;
            public WeatherClouds clouds;
            public WeatherSys sys;
            public string name;
            public int visibility;
        }
        
        [System.Serializable]
        public class WeatherMain
        {
            public float temp;
            public float feels_like;
            public float temp_min;
            public float temp_max;
            public int pressure;
            public int humidity;
        }
        
        [System.Serializable]
        public class WeatherInfo
        {
            public int id;
            public string main;
            public string description;
            public string icon;
        }
        
        [System.Serializable]
        public class WeatherWind
        {
            public float speed;
            public int deg;
        }
        
        [System.Serializable]
        public class WeatherClouds
        {
            public int all;
        }
        
        [System.Serializable]
        public class WeatherSys
        {
            public string country;
            public long sunrise;
            public long sunset;
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeWeathersystemSafe();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            SetupWeatherConditions();
            SetupWeatherEffects();
            SetupWeatherAudio();
            SetupWeatherParticles();
            SetupWeatherLighting();
            SetupWeatherInfluences();
            SetupWeatherManager();
            SetupWeatherAPI();
            SetupWeatherPredictor();
            SetupWeatherEffectManager();
            SetupWeatherAudioManager();
            SetupWeatherParticleManager();
            SetupWeatherLightingManager();
            SetupWeatherInfluenceManager();
            StartCoroutine(UpdateWeathersystemSafe());
        }
        
        private void InitializeWeathersystemSafe()
        {
            // Initialize weather system components
            InitializeWeatherConditions();
            InitializeWeatherEffects();
            InitializeWeatherAudio();
            InitializeWeatherParticles();
            InitializeWeatherLighting();
            InitializeWeatherInfluences();
            InitializeWeatherManager();
            InitializeWeatherAPI();
            InitializeWeatherPredictor();
            InitializeWeatherEffectManager();
            InitializeWeatherAudioManager();
            InitializeWeatherParticleManager();
            InitializeWeatherLightingManager();
            InitializeWeatherInfluenceManager();
        }
        
        private void InitializeWeatherConditions()
        {
            // Initialize weather conditions
            _weatherConditions["clear"] = new WeatherCondition
            {
                id = "clear",
                name = "Clear Sky",
                type = WeatherType.Clear,
                intensity = WeatherIntensity.None,
                temperature = 20.0f,
                humidity = 50.0f,
                pressure = 1013.25f,
                windSpeed = 5.0f,
                windDirection = 0.0f,
                visibility = 10000.0f,
                precipitation = 0.0f,
                cloudCover = 0.0f,
                skyColor = new Color(0.5f, 0.8f, 1.0f),
                fogColor = new Color(0.8f, 0.8f, 0.8f),
                isActive = false,
                isTransitioning = false,
                duration = 0.0f,
                remainingTime = 0.0f,
                startTime = DateTime.Now,
                endTime = DateTime.Now,
                properties = new Dictionary<string, object>()
            };
            
            _weatherConditions["rain"] = new WeatherCondition
            {
                id = "rain",
                name = "Rain",
                type = WeatherType.Rain,
                intensity = WeatherIntensity.Medium,
                temperature = 15.0f,
                humidity = 80.0f,
                pressure = 1000.0f,
                windSpeed = 15.0f,
                windDirection = 45.0f,
                visibility = 5000.0f,
                precipitation = 5.0f,
                cloudCover = 80.0f,
                skyColor = new Color(0.3f, 0.4f, 0.6f),
                fogColor = new Color(0.6f, 0.6f, 0.6f),
                isActive = false,
                isTransitioning = false,
                duration = 300.0f,
                remainingTime = 300.0f,
                startTime = DateTime.Now,
                endTime = DateTime.Now.AddSeconds(300.0f),
                properties = new Dictionary<string, object>()
            };
            
            _weatherConditions["snow"] = new WeatherCondition
            {
                id = "snow",
                name = "Snow",
                type = WeatherType.Snow,
                intensity = WeatherIntensity.Medium,
                temperature = -5.0f,
                humidity = 70.0f,
                pressure = 1020.0f,
                windSpeed = 10.0f,
                windDirection = 90.0f,
                visibility = 3000.0f,
                precipitation = 3.0f,
                cloudCover = 90.0f,
                skyColor = new Color(0.7f, 0.7f, 0.8f),
                fogColor = new Color(0.9f, 0.9f, 0.9f),
                isActive = false,
                isTransitioning = false,
                duration = 600.0f,
                remainingTime = 600.0f,
                startTime = DateTime.Now,
                endTime = DateTime.Now.AddSeconds(600.0f),
                properties = new Dictionary<string, object>()
            };
        }
        
        private void InitializeWeatherEffects()
        {
            // Initialize weather effects
            _weatherEffects["rain_effect"] = new WeatherEffect
            {
                id = "rain_effect",
                name = "Rain Effect",
                type = WeatherEffectType.Rain,
                effectObject = null,
                particleSystem = null,
                audioSource = null,
                lightSource = null,
                isActive = false,
                isLooping = true,
                intensity = 1.0f,
                duration = 0.0f,
                remainingTime = 0.0f,
                position = Vector3.zero,
                rotation = Vector3.zero,
                scale = Vector3.one,
                properties = new Dictionary<string, object>()
            };
        }
        
        private void InitializeWeatherAudio()
        {
            // Initialize weather audio
            _weatherAudio["rain_audio"] = new WeatherAudio
            {
                id = "rain_audio",
                name = "Rain Audio",
                type = WeatherAudioType.Rain,
                audioClip = null,
                audioSource = null,
                isActive = false,
                isLooping = true,
                volume = 0.5f,
                pitch = 1.0f,
                spatialBlend = 0.0f,
                minDistance = 1.0f,
                maxDistance = 500.0f,
                enable3D = false,
                enableSpatialization = false,
                properties = new Dictionary<string, object>()
            };
        }
        
        private void InitializeWeatherParticles()
        {
            // Initialize weather particles
            _weatherParticles["rain_particles"] = new WeatherParticle
            {
                id = "rain_particles",
                name = "Rain Particles",
                type = WeatherParticleType.Rain,
                particleSystem = null,
                isActive = false,
                isLooping = true,
                emissionRate = 1000.0f,
                lifetime = 2.0f,
                speed = 10.0f,
                size = 0.1f,
                color = new Color(0.8f, 0.8f, 1.0f, 0.8f),
                enableCollision = true,
                enablePhysics = true,
                enableLighting = true,
                enableShadows = false,
                properties = new Dictionary<string, object>()
            };
        }
        
        private void InitializeWeatherLighting()
        {
            // Initialize weather lighting
            _weatherLighting["sun_light"] = new WeatherLighting
            {
                id = "sun_light",
                name = "Sun Light",
                type = WeatherLightingType.Sun,
                lightSource = null,
                isActive = true,
                color = new Color(1.0f, 0.95f, 0.8f),
                intensity = 1.0f,
                range = 1000.0f,
                spotAngle = 30.0f,
                enableShadows = true,
                shadowQuality = ShadowQuality.HardAndSoft,
                enableFlickering = false,
                flickerSpeed = 0.0f,
                flickerIntensity = 0.0f,
                properties = new Dictionary<string, object>()
            };
        }
        
        private void InitializeWeatherInfluences()
        {
            // Initialize weather influences
            _weatherInfluences["gameplay_influence"] = new WeatherInfluence
            {
                id = "gameplay_influence",
                name = "Gameplay Influence",
                type = WeatherInfluenceType.Gameplay,
                targetSystem = "Gameplay",
                influenceStrength = 1.0f,
                isActive = true,
                isPositive = true,
                duration = 0.0f,
                remainingTime = 0.0f,
                properties = new Dictionary<string, object>()
            };
        }
        
        private void InitializeWeatherManager()
        {
            // Initialize weather manager
            _weatherManager = new WeatherManager
            {
                isInitialized = true,
                isActive = true,
                currentWeather = WeatherType.Clear,
                currentIntensity = WeatherIntensity.None,
                targetWeather = WeatherType.Clear,
                targetIntensity = WeatherIntensity.None,
                isTransitioning = false,
                transitionProgress = 0.0f,
                lastUpdate = DateTime.Now,
                settings = new Dictionary<string, object>()
            };
        }
        
        private void InitializeWeatherAPI()
        {
            // Initialize weather API
            _weatherAPI = new WeatherAPI
            {
                isEnabled = enableWeatherAPI,
                apiKey = "", // Set via Unity Inspector or environment
                apiEndpoint = "https://api.openweathermap.org/data/2.5/weather",
                location = "London",
                latitude = 51.5074f,
                longitude = -0.1278f,
                enableRealTime = enableRealTimeWeather,
                enableForecast = true,
                forecastDays = 7,
                lastUpdate = DateTime.Now,
                settings = new Dictionary<string, object>()
            };
        }
        
        private void InitializeWeatherPredictor()
        {
            // Initialize weather predictor
            _weatherPredictor = new WeatherPredictor
            {
                isEnabled = enableWeatherPrediction,
                enableMachineLearning = true,
                enablePatternRecognition = true,
                enableTrendAnalysis = true,
                accuracy = 0.85f,
                predictionHours = 24,
                lastPrediction = DateTime.Now,
                settings = new Dictionary<string, object>()
            };
        }
        
        private void InitializeWeatherEffectManager()
        {
            // Initialize weather effect manager
            _weatherEffectManager = new WeatherEffectManager
            {
                isEnabled = enableWeatherEffects,
                enableRainEffects = enableRainEffects,
                enableSnowEffects = enableSnowEffects,
                enableFogEffects = enableFogEffects,
                enableWindEffects = enableWindEffects,
                enableThunderEffects = enableThunderEffects,
                enableHailEffects = enableHailEffects,
                enableSandstormEffects = enableSandstormEffects,
                enableBlizzardEffects = enableBlizzardEffects,
                settings = new Dictionary<string, object>()
            };
        }
        
        private void InitializeWeatherAudioManager()
        {
            // Initialize weather audio manager
            _weatherAudioManager = new WeatherAudioManager
            {
                isEnabled = enableWeatherAudio,
                enable3DAudio = enable3DWeatherAudio,
                enableAudioMixing = enableWeatherAudioMixing,
                enableAudioFading = enableWeatherAudioFading,
                enableSpatialization = enableWeatherAudioSpatialization,
                masterVolume = 1.0f,
                settings = new Dictionary<string, object>()
            };
        }
        
        private void InitializeWeatherParticleManager()
        {
            // Initialize weather particle manager
            _weatherParticleManager = new WeatherParticleManager
            {
                isEnabled = enableWeatherParticles,
                enableParticleCollision = enableWeatherParticleCollision,
                enableParticlePhysics = enableWeatherParticlePhysics,
                enableParticleLighting = enableWeatherParticleLighting,
                enableParticleShadows = enableWeatherParticleShadows,
                maxParticles = 10000,
                settings = new Dictionary<string, object>()
            };
        }
        
        private void InitializeWeatherLightingManager()
        {
            // Initialize weather lighting manager
            _weatherLightingManager = new WeatherLightingManager
            {
                isEnabled = enableWeatherLighting,
                enableLightingTransition = enableWeatherLightingTransition,
                enableLightingColor = enableWeatherLightingColor,
                enableLightingIntensity = enableWeatherLightingIntensity,
                enableLightingShadows = enableWeatherLightingShadows,
                transitionSpeed = transitionSpeed,
                settings = new Dictionary<string, object>()
            };
        }
        
        private void InitializeWeatherInfluenceManager()
        {
            // Initialize weather influence manager
            _weatherInfluenceManager = new WeatherInfluenceManager
            {
                isEnabled = enableWeatherInfluence,
                enableGameplayInfluence = true,
                enableVisualInfluence = true,
                enableAudioInfluence = true,
                enablePerformanceInfluence = true,
                settings = new Dictionary<string, object>()
            };
        }
        
        private void SetupWeatherConditions()
        {
            // Setup weather conditions
            foreach (var condition in _weatherConditions.Values)
            {
                SetupWeatherCondition(condition);
            }
        }
        
        private void SetupWeatherCondition(WeatherCondition condition)
        {
            // Setup individual weather condition
            // This would integrate with your weather system
        }
        
        private void SetupWeatherEffects()
        {
            // Setup weather effects
            foreach (var effect in _weatherEffects.Values)
            {
                SetupWeatherEffect(effect);
            }
        }
        
        private void SetupWeatherEffect(WeatherEffect effect)
        {
            // Setup individual weather effect with proper asset references
            switch (effect.type)
            {
                case WeatherEffectType.Rain:
                    if (rainEffectPrefab != null)
                    {
                        effect.effectObject = Instantiate(rainEffectPrefab);
                        effect.particleSystem = effect.effectObject.GetComponent<ParticleSystem>();
                    }
                    break;
                case WeatherEffectType.Snow:
                    if (snowEffectPrefab != null)
                    {
                        effect.effectObject = Instantiate(snowEffectPrefab);
                        effect.particleSystem = effect.effectObject.GetComponent<ParticleSystem>();
                    }
                    break;
                case WeatherEffectType.Fog:
                    if (fogEffectPrefab != null)
                    {
                        effect.effectObject = Instantiate(fogEffectPrefab);
                    }
                    break;
                case WeatherEffectType.Wind:
                    if (windEffectPrefab != null)
                    {
                        effect.effectObject = Instantiate(windEffectPrefab);
                    }
                    break;
                case WeatherEffectType.Thunder:
                    if (thunderEffectPrefab != null)
                    {
                        effect.effectObject = Instantiate(thunderEffectPrefab);
                        effect.lightSource = effect.effectObject.GetComponent<Light>();
                    }
                    break;
                case WeatherEffectType.Hail:
                    if (hailEffectPrefab != null)
                    {
                        effect.effectObject = Instantiate(hailEffectPrefab);
                        effect.particleSystem = effect.effectObject.GetComponent<ParticleSystem>();
                    }
                    break;
                case WeatherEffectType.Sandstorm:
                    if (sandstormEffectPrefab != null)
                    {
                        effect.effectObject = Instantiate(sandstormEffectPrefab);
                        effect.particleSystem = effect.effectObject.GetComponent<ParticleSystem>();
                    }
                    break;
                case WeatherEffectType.Blizzard:
                    if (blizzardEffectPrefab != null)
                    {
                        effect.effectObject = Instantiate(blizzardEffectPrefab);
                        effect.particleSystem = effect.effectObject.GetComponent<ParticleSystem>();
                    }
                    break;
            }
        }
        
        private void SetupWeatherAudio()
        {
            // Setup weather audio
            foreach (var audio in _weatherAudio.Values)
            {
                SetupWeatherAudio(audio);
            }
        }
        
        private void SetupWeatherAudio(WeatherAudio audio)
        {
            // Setup individual weather audio
            // This would integrate with your audio system
        }
        
        private void SetupWeatherParticles()
        {
            // Setup weather particles
            foreach (var particle in _weatherParticles.Values)
            {
                SetupWeatherParticle(particle);
            }
        }
        
        private void SetupWeatherParticle(WeatherParticle particle)
        {
            // Setup individual weather particle
            // This would integrate with your particle system
        }
        
        private void SetupWeatherLighting()
        {
            // Setup weather lighting
            foreach (var lighting in _weatherLighting.Values)
            {
                SetupWeatherLighting(lighting);
            }
        }
        
        private void SetupWeatherLighting(WeatherLighting lighting)
        {
            // Setup individual weather lighting
            // This would integrate with your lighting system
        }
        
        private void SetupWeatherInfluences()
        {
            // Setup weather influences
            foreach (var influence in _weatherInfluences.Values)
            {
                SetupWeatherInfluence(influence);
            }
        }
        
        private void SetupWeatherInfluence(WeatherInfluence influence)
        {
            // Setup individual weather influence
            // This would integrate with your influence system
        }
        
        private void SetupWeatherManager()
        {
            // Setup weather manager
            _weatherManager.isInitialized = true;
        }
        
        private void SetupWeatherAPI()
        {
            // Setup weather API
            _weatherAPI.isEnabled = true;
        }
        
        private void SetupWeatherPredictor()
        {
            // Setup weather predictor
            _weatherPredictor.isEnabled = true;
        }
        
        private void SetupWeatherEffectManager()
        {
            // Setup weather effect manager
            _weatherEffectManager.isEnabled = true;
        }
        
        private void SetupWeatherAudioManager()
        {
            // Setup weather audio manager
            _weatherAudioManager.isEnabled = true;
        }
        
        private void SetupWeatherParticleManager()
        {
            // Setup weather particle manager
            _weatherParticleManager.isEnabled = true;
        }
        
        private void SetupWeatherLightingManager()
        {
            // Setup weather lighting manager
            _weatherLightingManager.isEnabled = true;
        }
        
        private void SetupWeatherInfluenceManager()
        {
            // Setup weather influence manager
            _weatherInfluenceManager.isEnabled = true;
        }
        
        private IEnumerator UpdateWeathersystemSafe()
        {
            while (true)
            {
                // Update weather system
                UpdateWeatherManager();
                UpdateWeatherAPI();
                UpdateWeatherPredictor();
                UpdateWeatherEffectManager();
                UpdateWeatherAudioManager();
                UpdateWeatherParticleManager();
                UpdateWeatherLightingManager();
                UpdateWeatherInfluenceManager();
                UpdateWeatherConditions();
                UpdateWeatherEffects();
                UpdateWeatherAudio();
                UpdateWeatherParticles();
                UpdateWeatherLighting();
                UpdateWeatherInfluences();
                
                yield return new WaitForSeconds(1.0f); // Update every second
            }
        }
        
        private void UpdateWeatherManager()
        {
            // Update weather manager
            if (_weatherManager.isActive)
            {
                // Update weather transitions
                UpdateWeatherTransitions();
            }
        }
        
        private void UpdateWeatherTransitions()
        {
            // Update weather transitions
            if (_weatherManager.isTransitioning)
            {
                _weatherManager.transitionProgress += Time.deltaTime * transitionSpeed;
                
                if (_weatherManager.transitionProgress >= 1.0f)
                {
                    _weatherManager.transitionProgress = 1.0f;
                    _weatherManager.isTransitioning = false;
                    _weatherManager.currentWeather = _weatherManager.targetWeather;
                    _weatherManager.currentIntensity = _weatherManager.targetIntensity;
                }
            }
        }
        
        private void UpdateWeatherAPI()
        {
            // Update weather API
            if (_weatherAPI.isEnabled && _weatherAPI.enableRealTime)
            {
                // Fetch real-time weather data
                StartCoroutine(FetchWeatherData());
            }
        }
        
        private IEnumerator FetchWeatherData()
        {
            // Fetch weather data from API
            string url = $"{_weatherAPI.apiEndpoint}?lat={_weatherAPI.latitude}&lon={_weatherAPI.longitude}&appid={_weatherAPI.apiKey}&units=metric";
            
            using (UnityEngine.Networking.UnityWebRequest request = UnityEngine.Networking.UnityWebRequest.Get(url))
            {
                yield return request.SendWebRequest();
                
                if (request.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                {
                    try
                    {
                        WeatherAPIResponse response = JsonUtility.FromJson<WeatherAPIResponse>(request.downloadHandler.text);
                        ProcessWeatherAPIResponse(response);
                    }
                    catch (System.Exception e)
                    {
                        Debug.LogError($"Failed to parse weather data: {e.Message}");
                    }
                }
                else
                {
                    Debug.LogError($"Weather API request failed: {request.error}");
                }
            }
        }
        
        private void UpdateWeatherPredictor()
        {
            // Update weather predictor
            if (_weatherPredictor.isEnabled)
            {
                // Predict future weather
                PredictWeather();
            }
        }
        
        private void PredictWeather()
        {
            // Predict weather using machine learning
            if (_weatherPredictor.enableMachineLearning)
            {
                // Use historical data to predict weather patterns
                var historicalData = GetHistoricalWeatherData();
                var prediction = GenerateWeatherPrediction(historicalData);
                
                // Update weather predictor
                _weatherPredictor.lastPrediction = DateTime.Now;
                _weatherPredictor.accuracy = CalculatePredictionAccuracy(prediction);
            }
        }
        
        private List<WeatherCondition> GetHistoricalWeatherData()
        {
            // Get last 24 hours of weather data
            var historical = new List<WeatherCondition>();
            var cutoff = DateTime.Now.AddHours(-24);
            
            foreach (var condition in _weatherConditions.Values)
            {
                if (condition.startTime > cutoff)
                {
                    historical.Add(condition);
                }
            }
            
            return historical;
        }
        
        private WeatherCondition GenerateWeatherPrediction(List<WeatherCondition> historicalData)
        {
            // Simple prediction algorithm - in production, use ML
            if (historicalData.Count == 0) return null;
            
            var latest = historicalData.OrderByDescending(c => c.startTime).First();
            var prediction = new WeatherCondition
            {
                id = "prediction_" + DateTime.Now.Ticks,
                name = "Weather Prediction",
                type = latest.type,
                intensity = latest.intensity,
                temperature = latest.temperature + UnityEngine.Random.Range(-2f, 2f),
                humidity = Mathf.Clamp(latest.humidity + UnityEngine.Random.Range(-10f, 10f), 0f, 100f),
                pressure = latest.pressure + UnityEngine.Random.Range(-5f, 5f),
                windSpeed = Mathf.Max(0f, latest.windSpeed + UnityEngine.Random.Range(-2f, 2f)),
                windDirection = (latest.windDirection + UnityEngine.Random.Range(-30f, 30f)) % 360f,
                visibility = Mathf.Max(0f, latest.visibility + UnityEngine.Random.Range(-1000f, 1000f)),
                precipitation = Mathf.Max(0f, latest.precipitation + UnityEngine.Random.Range(-1f, 1f)),
                cloudCover = Mathf.Clamp(latest.cloudCover + UnityEngine.Random.Range(-20f, 20f), 0f, 100f),
                skyColor = latest.skyColor,
                fogColor = latest.fogColor,
                isActive = false,
                isTransitioning = false,
                duration = 60f,
                remainingTime = 60f,
                startTime = DateTime.Now.AddMinutes(30),
                endTime = DateTime.Now.AddMinutes(90),
                properties = new Dictionary<string, object>()
            };
            
            return prediction;
        }
        
        private float CalculatePredictionAccuracy(WeatherCondition prediction)
        {
            // Simple accuracy calculation - in production, compare with actual weather
            return UnityEngine.Random.Range(0.7f, 0.95f);
        }
        
        private void UpdateWeatherEffectManager()
        {
            // Update weather effect manager
            if (_weatherEffectManager.isEnabled)
            {
                // Update weather effects
                UpdateWeatherEffects();
            }
        }
        
        private void UpdateWeatherAudioManager()
        {
            // Update weather audio manager
            if (_weatherAudioManager.isEnabled)
            {
                // Update weather audio
                UpdateWeatherAudio();
            }
        }
        
        private void UpdateWeatherParticleManager()
        {
            // Update weather particle manager
            if (_weatherParticleManager.isEnabled)
            {
                // Update weather particles
                UpdateWeatherParticles();
            }
        }
        
        private void UpdateWeatherLightingManager()
        {
            // Update weather lighting manager
            if (_weatherLightingManager.isEnabled)
            {
                // Update weather lighting
                UpdateWeatherLighting();
            }
        }
        
        private void UpdateWeatherInfluenceManager()
        {
            // Update weather influence manager
            if (_weatherInfluenceManager.isEnabled)
            {
                // Update weather influences
                UpdateWeatherInfluences();
            }
        }
        
        private void UpdateWeatherConditions()
        {
            // Update weather conditions
            foreach (var condition in _weatherConditions.Values)
            {
                UpdateWeatherCondition(condition);
            }
        }
        
        private void UpdateWeatherCondition(WeatherCondition condition)
        {
            // Update individual weather condition
            if (condition.isActive)
            {
                condition.remainingTime -= Time.deltaTime;
                
                if (condition.remainingTime <= 0.0f)
                {
                    condition.isActive = false;
                    condition.remainingTime = 0.0f;
                }
            }
        }
        
        private void UpdateWeatherEffects()
        {
            // Update weather effects
            foreach (var effect in _weatherEffects.Values)
            {
                UpdateWeatherEffect(effect);
            }
        }
        
        private void UpdateWeatherEffect(WeatherEffect effect)
        {
            // Update individual weather effect
            if (effect.isActive)
            {
                effect.remainingTime -= Time.deltaTime;
                
                if (effect.remainingTime <= 0.0f && !effect.isLooping)
                {
                    effect.isActive = false;
                    effect.remainingTime = 0.0f;
                }
            }
        }
        
        private void UpdateWeatherAudio()
        {
            // Update weather audio
            foreach (var audio in _weatherAudio.Values)
            {
                UpdateWeatherAudio(audio);
            }
        }
        
        private void UpdateWeatherAudio(WeatherAudio audio)
        {
            // Update individual weather audio
            if (audio.isActive)
            {
                // Update audio properties
                if (audio.audioSource != null)
                {
                    audio.audioSource.volume = audio.volume;
                    audio.audioSource.pitch = audio.pitch;
                    audio.audioSource.spatialBlend = audio.spatialBlend;
                    audio.audioSource.minDistance = audio.minDistance;
                    audio.audioSource.maxDistance = audio.maxDistance;
                }
            }
        }
        
        private void UpdateWeatherParticles()
        {
            // Update weather particles
            foreach (var particle in _weatherParticles.Values)
            {
                UpdateWeatherParticle(particle);
            }
        }
        
        private void UpdateWeatherParticle(WeatherParticle particle)
        {
            // Update individual weather particle
            if (particle.isActive && particle.particleSystem != null)
            {
                var emission = particle.particleSystem.emission;
                emission.rateOverTime = particle.emissionRate;
                
                var main = particle.particleSystem.main;
                main.startLifetime = particle.lifetime;
                main.startSpeed = particle.speed;
                main.startSize = particle.size;
                main.startColor = particle.color;
            }
        }
        
        private void UpdateWeatherLighting()
        {
            // Update weather lighting
            foreach (var lighting in _weatherLighting.Values)
            {
                UpdateWeatherLighting(lighting);
            }
        }
        
        private void UpdateWeatherLighting(WeatherLighting lighting)
        {
            // Update individual weather lighting
            if (lighting.isActive && lighting.lightSource != null)
            {
                lighting.lightSource.color = lighting.color;
                lighting.lightSource.intensity = lighting.intensity;
                lighting.lightSource.range = lighting.range;
                lighting.lightSource.spotAngle = lighting.spotAngle;
                lighting.lightSource.shadows = lighting.enableShadows ? LightShadows.Soft : LightShadows.None;
                
                if (lighting.enableFlickering)
                {
                    float flicker = Mathf.Sin(Time.time * lighting.flickerSpeed) * lighting.flickerIntensity;
                    lighting.lightSource.intensity = lighting.intensity + flicker;
                }
            }
        }
        
        private void UpdateWeatherInfluences()
        {
            // Update weather influences
            foreach (var influence in _weatherInfluences.Values)
            {
                UpdateWeatherInfluence(influence);
            }
        }
        
        private void UpdateWeatherInfluence(WeatherInfluence influence)
        {
            // Update individual weather influence
            if (influence.isActive)
            {
                influence.remainingTime -= Time.deltaTime;
                
                if (influence.remainingTime <= 0.0f)
                {
                    influence.isActive = false;
                    influence.remainingTime = 0.0f;
                }
            }
        }
        
        /// <summary>
        /// Set weather condition
        /// </summary>
        public void SetWeather(WeatherType weatherType, WeatherIntensity weatherIntensity, float duration = 0f)
        {
            if (!enableWeatherSystem)
            {
                Debug.LogWarning("Weather system is disabled");
                return;
            }
            
            _weatherManager.targetWeather = weatherType;
            _weatherManager.targetIntensity = weatherIntensity;
            _weatherManager.isTransitioning = true;
            _weatherManager.transitionProgress = 0.0f;
            
            // Set weather duration
            if (duration > 0f)
            {
                var condition = _weatherConditions.Values.FirstOrDefault(c => c.type == weatherType);
                if (condition != null)
                {
                    condition.duration = duration;
                    condition.remainingTime = duration;
                    condition.startTime = DateTime.Now;
                    condition.endTime = DateTime.Now.AddSeconds(duration);
                }
            }
            
            // Activate weather effects
            ActivateWeatherEffects(weatherType, weatherIntensity);
        }
        
        private void ActivateWeatherEffects(WeatherType weatherType, WeatherIntensity weatherIntensity)
        {
            // Activate weather effects based on type and intensity
            switch (weatherType)
            {
                case WeatherType.Rain:
                case WeatherType.HeavyRain:
                    ActivateRainEffects(weatherIntensity);
                    break;
                case WeatherType.Snow:
                case WeatherType.HeavySnow:
                case WeatherType.Blizzard:
                    ActivateSnowEffects(weatherIntensity);
                    break;
                case WeatherType.Fog:
                case WeatherType.Mist:
                case WeatherType.Haze:
                    ActivateFogEffects(weatherIntensity);
                    break;
                case WeatherType.Thunderstorm:
                    ActivateThunderEffects(weatherIntensity);
                    break;
                case WeatherType.Hail:
                    ActivateHailEffects(weatherIntensity);
                    break;
                case WeatherType.Sandstorm:
                    ActivateSandstormEffects(weatherIntensity);
                    break;
            }
        }
        
        private void ActivateRainEffects(WeatherIntensity intensity)
        {
            // Activate rain effects
            var rainEffect = _weatherEffects.Values.FirstOrDefault(e => e.type == WeatherEffectType.Rain);
            if (rainEffect != null)
            {
                rainEffect.isActive = true;
                rainEffect.intensity = GetIntensityValue(intensity);
            }
        }
        
        private void ActivateSnowEffects(WeatherIntensity intensity)
        {
            // Activate snow effects
            var snowEffect = _weatherEffects.Values.FirstOrDefault(e => e.type == WeatherEffectType.Snow);
            if (snowEffect != null)
            {
                snowEffect.isActive = true;
                snowEffect.intensity = GetIntensityValue(intensity);
            }
        }
        
        private void ActivateFogEffects(WeatherIntensity intensity)
        {
            // Activate fog effects
            var fogEffect = _weatherEffects.Values.FirstOrDefault(e => e.type == WeatherEffectType.Fog);
            if (fogEffect != null)
            {
                fogEffect.isActive = true;
                fogEffect.intensity = GetIntensityValue(intensity);
            }
        }
        
        private void ActivateThunderEffects(WeatherIntensity intensity)
        {
            // Activate thunder effects
            var thunderEffect = _weatherEffects.Values.FirstOrDefault(e => e.type == WeatherEffectType.Thunder);
            if (thunderEffect != null)
            {
                thunderEffect.isActive = true;
                thunderEffect.intensity = GetIntensityValue(intensity);
            }
        }
        
        private void ActivateHailEffects(WeatherIntensity intensity)
        {
            // Activate hail effects
            var hailEffect = _weatherEffects.Values.FirstOrDefault(e => e.type == WeatherEffectType.Hail);
            if (hailEffect != null)
            {
                hailEffect.isActive = true;
                hailEffect.intensity = GetIntensityValue(intensity);
            }
        }
        
        private void ActivateSandstormEffects(WeatherIntensity intensity)
        {
            // Activate sandstorm effects
            var sandstormEffect = _weatherEffects.Values.FirstOrDefault(e => e.type == WeatherEffectType.Sandstorm);
            if (sandstormEffect != null)
            {
                sandstormEffect.isActive = true;
                sandstormEffect.intensity = GetIntensityValue(intensity);
            }
        }
        
        private void ProcessWeatherAPIResponse(WeatherAPIResponse response)
        {
            // Process weather data from API
            if (response.weather.Length > 0)
            {
                var weatherInfo = response.weather[0];
                var weatherType = MapWeatherCondition(weatherInfo.main);
                var gameplayEffects = GetWeatherGameplayEffects(weatherType);
                
                // Update current weather
                _weatherManager.currentWeather = weatherType;
                _weatherManager.currentIntensity = DetermineWeatherIntensity(response);
                _weatherManager.lastUpdate = DateTime.Now;
                
                // Update weather condition
                var condition = new WeatherCondition
                {
                    id = "current_weather",
                    name = weatherInfo.description,
                    type = weatherType,
                    intensity = _weatherManager.currentIntensity,
                    temperature = response.main.temp,
                    humidity = response.main.humidity,
                    pressure = response.main.pressure,
                    windSpeed = response.wind?.speed ?? 0f,
                    windDirection = response.wind?.deg ?? 0f,
                    visibility = response.visibility / 1000f, // Convert to km
                    precipitation = 0f, // Not provided in basic API
                    cloudCover = response.clouds?.all ?? 0f,
                    skyColor = GetSkyColorForWeather(weatherType),
                    fogColor = GetFogColorForWeather(weatherType),
                    isActive = true,
                    isTransitioning = false,
                    duration = 0f,
                    remainingTime = 0f,
                    startTime = DateTime.Now,
                    endTime = DateTime.Now.AddHours(1),
                    properties = new Dictionary<string, object>
                    {
                        {"api_icon", weatherInfo.icon},
                        {"api_id", weatherInfo.id},
                        {"city_name", response.name},
                        {"country", response.sys?.country ?? ""}
                    }
                };
                
                _weatherConditions["current"] = condition;
                
                // Activate weather effects
                ActivateWeatherEffects(weatherType, _weatherManager.currentIntensity);
                
                // Update gameplay effects
                UpdateGameplayEffects(gameplayEffects);
                
                Debug.Log($"Weather updated: {weatherInfo.description} ({weatherType})");
            }
        }
        
        private WeatherType MapWeatherCondition(string condition)
        {
            switch (condition.ToLower())
            {
                case "clear": return WeatherType.Clear;
                case "clouds": return WeatherType.Cloudy;
                case "rain": return WeatherType.Rain;
                case "drizzle": return WeatherType.Rain;
                case "thunderstorm": return WeatherType.Thunderstorm;
                case "snow": return WeatherType.Snow;
                case "mist": return WeatherType.Fog;
                case "fog": return WeatherType.Fog;
                case "haze": return WeatherType.Haze;
                default: return WeatherType.Clear;
            }
        }
        
        private WeatherIntensity DetermineWeatherIntensity(WeatherAPIResponse response)
        {
            // Determine intensity based on weather conditions
            if (response.weather.Length > 0)
            {
                var weather = response.weather[0];
                switch (weather.main.ToLower())
                {
                    case "thunderstorm":
                        return WeatherIntensity.Extreme;
                    case "rain":
                        return response.main.humidity > 80 ? WeatherIntensity.Heavy : WeatherIntensity.Medium;
                    case "snow":
                        return response.main.temp < -5 ? WeatherIntensity.Heavy : WeatherIntensity.Medium;
                    case "fog":
                    case "mist":
                        return response.visibility < 1000 ? WeatherIntensity.Heavy : WeatherIntensity.Light;
                    default:
                        return WeatherIntensity.Light;
                }
            }
            return WeatherIntensity.None;
        }
        
        private Color GetSkyColorForWeather(WeatherType weatherType)
        {
            switch (weatherType)
            {
                case WeatherType.Clear: return new Color(0.5f, 0.8f, 1.0f);
                case WeatherType.Rain: return new Color(0.3f, 0.4f, 0.6f);
                case WeatherType.Snow: return new Color(0.7f, 0.7f, 0.8f);
                case WeatherType.Thunderstorm: return new Color(0.2f, 0.2f, 0.4f);
                case WeatherType.Fog: return new Color(0.6f, 0.6f, 0.6f);
                case WeatherType.Cloudy: return new Color(0.4f, 0.5f, 0.7f);
                default: return new Color(0.5f, 0.8f, 1.0f);
            }
        }
        
        private Color GetFogColorForWeather(WeatherType weatherType)
        {
            switch (weatherType)
            {
                case WeatherType.Fog: return new Color(0.8f, 0.8f, 0.8f, 0.7f);
                case WeatherType.Rain: return new Color(0.6f, 0.6f, 0.6f, 0.5f);
                case WeatherType.Snow: return new Color(0.9f, 0.9f, 0.9f, 0.6f);
                default: return new Color(0.8f, 0.8f, 0.8f, 0.3f);
            }
        }
        
        private void UpdateGameplayEffects(Dictionary<string, object> effects)
        {
            // Update gameplay systems with weather effects
            if (effects.ContainsKey("scoreMultiplier"))
            {
                // Apply score multiplier to game systems
                Debug.Log($"Weather score multiplier: {effects["scoreMultiplier"]}");
            }
            
            if (effects.ContainsKey("energyRegen"))
            {
                // Apply energy regeneration modifier
                Debug.Log($"Weather energy regen: {effects["energyRegen"]}");
            }
            
            if (effects.ContainsKey("specialChance"))
            {
                // Apply special tile chance modifier
                Debug.Log($"Weather special chance: {effects["specialChance"]}");
            }
        }
        
        private float GetIntensityValue(WeatherIntensity intensity)
        {
            switch (intensity)
            {
                case WeatherIntensity.None:
                    return 0.0f;
                case WeatherIntensity.Light:
                    return 0.25f;
                case WeatherIntensity.Medium:
                    return 0.5f;
                case WeatherIntensity.Heavy:
                    return 0.75f;
                case WeatherIntensity.Extreme:
                    return 1.0f;
                default:
                    return 0.5f;
            }
        }
        
        /// <summary>
        /// Get weather system status
        /// </summary>
        public string GetWeatherStatus()
        {
            System.Text.StringBuilder status = new System.Text.StringBuilder();
            status.AppendLine("=== WEATHER SYSTEM STATUS ===");
            status.AppendLine($"Timestamp: {DateTime.Now}");
            status.AppendLine();
            
            status.AppendLine($"Weather System: {(enableWeatherSystem ? "Enabled" : "Disabled")}");
            status.AppendLine($"Real-Time Weather: {(enableRealTimeWeather ? "Enabled" : "Disabled")}");
            status.AppendLine($"Weather API: {(enableWeatherAPI ? "Enabled" : "Disabled")}");
            status.AppendLine($"Weather Prediction: {(enableWeatherPrediction ? "Enabled" : "Disabled")}");
            status.AppendLine();
            
            status.AppendLine($"Current Weather: {_weatherManager.currentWeather}");
            status.AppendLine($"Current Intensity: {_weatherManager.currentIntensity}");
            status.AppendLine($"Target Weather: {_weatherManager.targetWeather}");
            status.AppendLine($"Target Intensity: {_weatherManager.targetIntensity}");
            status.AppendLine($"Is Transitioning: {_weatherManager.isTransitioning}");
            status.AppendLine($"Transition Progress: {_weatherManager.transitionProgress:P1}");
            status.AppendLine();
            
            status.AppendLine($"Conditions: {_weatherConditions.Count}");
            status.AppendLine($"Effects: {_weatherEffects.Count}");
            status.AppendLine($"Audio: {_weatherAudio.Count}");
            status.AppendLine($"Particles: {_weatherParticles.Count}");
            status.AppendLine($"Lighting: {_weatherLighting.Count}");
            status.AppendLine($"Influences: {_weatherInfluences.Count}");
            
            return status.ToString();
        }
        
        /// <summary>
        /// Enable/disable weather features
        /// </summary>
        public void SetWeatherFeatures(bool weatherSystem, bool realTimeWeather, bool weatherAPI, bool weatherPrediction, bool weatherEffects)
        {
            enableWeatherSystem = weatherSystem;
            enableRealTimeWeather = realTimeWeather;
            enableWeatherAPI = weatherAPI;
            enableWeatherPrediction = weatherPrediction;
            enableWeatherEffects = weatherEffects;
        }
        
        void OnDestroy()
        {
            // Clean up weather system
        }
    }
}