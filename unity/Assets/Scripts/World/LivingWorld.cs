using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Linq;

namespace Evergreen.World
{
    [System.Serializable]
    public class WorldState
    {
        public WeatherType currentWeather;
        public TimeOfDay timeOfDay;
        public Season currentSeason;
        public float temperature;
        public float humidity;
        public float windSpeed;
        public float precipitation;
        public List<NPC> npcs = new List<NPC>();
        public List<WorldEvent> activeEvents = new List<WorldEvent>();
        public Dictionary<string, object> worldProperties = new Dictionary<string, object>();
        public DateTime lastUpdate;
    }
    
    public enum WeatherType
    {
        Sunny,
        Cloudy,
        Rainy,
        Stormy,
        Snowy,
        Foggy,
        Windy,
        Hot,
        Cold,
        Perfect
    }
    
    public enum TimeOfDay
    {
        Dawn,
        Morning,
        Noon,
        Afternoon,
        Evening,
        Night,
        Midnight
    }
    
    public enum Season
    {
        Spring,
        Summer,
        Autumn,
        Winter
    }
    
    [System.Serializable]
    public class NPC
    {
        public string npcId;
        public string name;
        public NPCType npcType;
        public Vector3 position;
        public NPCState currentState;
        public NPCBehavior behavior;
        public Dictionary<string, object> properties = new Dictionary<string, object>();
        public List<NPCMemory> memories = new List<NPCMemory>();
        public float happiness;
        public float energy;
        public float hunger;
        public float social;
        public DateTime lastInteraction;
        public bool isActive;
    }
    
    public enum NPCType
    {
        Villager,
        Merchant,
        Guard,
        Child,
        Elder,
        Traveler,
        Mystic,
        Builder,
        Gardener,
        Entertainer
    }
    
    public enum NPCState
    {
        Idle,
        Walking,
        Working,
        Talking,
        Eating,
        Sleeping,
        Playing,
        Thinking,
        Worried,
        Excited
    }
    
    [System.Serializable]
    public class NPCBehavior
    {
        public string behaviorId;
        public string description;
        public List<string> actions = new List<string>();
        public List<string> conditions = new List<string>();
        public float priority;
        public float frequency;
        public DateTime lastExecuted;
    }
    
    [System.Serializable]
    public class NPCMemory
    {
        public string memoryId;
        public string description;
        public MemoryType memoryType;
        public float importance;
        public DateTime timestamp;
        public Dictionary<string, object> context = new Dictionary<string, object>();
    }
    
    public enum MemoryType
    {
        Interaction,
        Event,
        Observation,
        Emotion,
        Fact,
        Story
    }
    
    [System.Serializable]
    public class WorldEvent
    {
        public string eventId;
        public string name;
        public string description;
        public EventType eventType;
        public Vector3 location;
        public float radius;
        public DateTime startTime;
        public DateTime endTime;
        public Dictionary<string, object> parameters = new Dictionary<string, object>();
        public List<string> affectedNPCs = new List<string>();
        public bool isActive;
    }
    
    public enum EventType
    {
        Festival,
        Market,
        Storm,
        Celebration,
        Emergency,
        Construction,
        Harvest,
        Migration,
        Discovery,
        Mystery
    }
    
    public class LivingWorld : MonoBehaviour
    {
        [Header("World Settings")]
        public bool enableWeatherSystem = true;
        public bool enableNPCSystem = true;
        public bool enableEventSystem = true;
        public bool enableDayNightCycle = true;
        public bool enableSeasonalChanges = true;
        
        [Header("Seasonal Asset References")]
        [SerializeField] private GameObject springEnvironmentPrefab;
        [SerializeField] private GameObject summerEnvironmentPrefab;
        [SerializeField] private GameObject autumnEnvironmentPrefab;
        [SerializeField] private GameObject winterEnvironmentPrefab;
        
        [Header("Holiday Asset References")]
        [SerializeField] private GameObject christmasEnvironmentPrefab;
        [SerializeField] private GameObject halloweenEnvironmentPrefab;
        [SerializeField] private GameObject easterEnvironmentPrefab;
        [SerializeField] private GameObject valentineEnvironmentPrefab;
        [SerializeField] private GameObject thanksgivingEnvironmentPrefab;
        [SerializeField] private GameObject newYearEnvironmentPrefab;
        
        [Header("Weather Asset References")]
        [SerializeField] private GameObject sunnyEnvironmentPrefab;
        [SerializeField] private GameObject rainyEnvironmentPrefab;
        [SerializeField] private GameObject snowyEnvironmentPrefab;
        [SerializeField] private GameObject stormyEnvironmentPrefab;
        [SerializeField] private GameObject foggyEnvironmentPrefab;
        
        [Header("Time of Day Asset References")]
        [SerializeField] private GameObject dawnEnvironmentPrefab;
        [SerializeField] private GameObject morningEnvironmentPrefab;
        [SerializeField] private GameObject noonEnvironmentPrefab;
        [SerializeField] private GameObject eveningEnvironmentPrefab;
        [SerializeField] private GameObject nightEnvironmentPrefab;
        
        [Header("Event Asset References")]
        [SerializeField] private GameObject festivalEnvironmentPrefab;
        [SerializeField] private GameObject celebrationEnvironmentPrefab;
        [SerializeField] private GameObject specialEventEnvironmentPrefab;
        
        [Header("Weather Settings")]
        public float weatherChangeInterval = 300f; // 5 minutes
        public float weatherTransitionSpeed = 1f;
        public AnimationCurve weatherProbability = AnimationCurve.EaseInOut(0, 0, 1, 1);
        
        [Header("NPC Settings")]
        public int maxNPCs = 50;
        public float npcUpdateInterval = 10f;
        public float npcInteractionRadius = 5f;
        public float npcMemoryLimit = 100;
        
        [Header("Time Settings")]
        public float dayLength = 1440f; // 24 minutes = 1 day
        public float timeSpeed = 1f;
        public bool pauseAtNight = false;
        
        [Header("Event Settings")]
        public float eventSpawnInterval = 600f; // 10 minutes
        public int maxActiveEvents = 5;
        public float eventRadius = 20f;
        
        public static LivingWorld Instance { get; private set; }
        
        private WorldState worldState;
        private WeatherController weatherController;
        private NPCController npcController;
        private EventController eventController;
        private TimeController timeController;
        private EconomyController economyController;
        private Coroutine worldUpdateCoroutine;
        private Coroutine weatherCoroutine;
        private Coroutine npcCoroutine;
        private Coroutine eventCoroutine;
        private Coroutine timeCoroutine;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeLivingWorld();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            InitializeWorld();
            StartWorldSystems();
        }
        
        private void InitializeLivingWorld()
        {
            worldState = new WorldState
            {
                currentWeather = WeatherType.Sunny,
                timeOfDay = TimeOfDay.Morning,
                currentSeason = Season.Spring,
                temperature = 20f,
                humidity = 0.5f,
                windSpeed = 0f,
                precipitation = 0f,
                lastUpdate = DateTime.Now
            };
        }
        
        private void InitializeWorld()
        {
            // Initialize controllers
            weatherController = gameObject.AddComponent<WeatherController>();
            npcController = gameObject.AddComponent<NPCController>();
            eventController = gameObject.AddComponent<EventController>();
            timeController = gameObject.AddComponent<TimeController>();
            economyController = gameObject.AddComponent<EconomyController>();
            
            // Initialize systems
            if (enableWeatherSystem)
            {
                weatherController.Initialize(weatherChangeInterval, weatherTransitionSpeed);
            }
            
            if (enableNPCSystem)
            {
                npcController.Initialize(maxNPCs, npcUpdateInterval, npcInteractionRadius, npcMemoryLimit);
            }
            
            if (enableEventSystem)
            {
                eventController.Initialize(eventSpawnInterval, maxActiveEvents, eventRadius);
            }
            
            if (enableDayNightCycle)
            {
                timeController.Initialize(dayLength, timeSpeed, pauseAtNight);
            }
            
            economyController.Initialize();
        }
        
        private void StartWorldSystems()
        {
            // Start world update coroutine
            worldUpdateCoroutine = StartCoroutine(WorldUpdateLoop());
            
            // Start individual system coroutines
            if (enableWeatherSystem)
            {
                weatherCoroutine = StartCoroutine(WeatherUpdateLoop());
            }
            
            if (enableNPCSystem)
            {
                npcCoroutine = StartCoroutine(NPCUpdateLoop());
            }
            
            if (enableEventSystem)
            {
                eventCoroutine = StartCoroutine(EventUpdateLoop());
            }
            
            if (enableDayNightCycle)
            {
                timeCoroutine = StartCoroutine(TimeUpdateLoop());
            }
        }
        
        private IEnumerator WorldUpdateLoop()
        {
            while (true)
            {
                UpdateWorldState();
                yield return new WaitForSeconds(1f);
            }
        }
        
        private IEnumerator WeatherUpdateLoop()
        {
            while (enableWeatherSystem)
            {
                UpdateWeather();
                yield return new WaitForSeconds(weatherChangeInterval);
            }
        }
        
        private IEnumerator NPCUpdateLoop()
        {
            while (enableNPCSystem)
            {
                UpdateNPCs();
                yield return new WaitForSeconds(npcUpdateInterval);
            }
        }
        
        private IEnumerator EventUpdateLoop()
        {
            while (enableEventSystem)
            {
                UpdateEvents();
                yield return new WaitForSeconds(eventSpawnInterval);
            }
        }
        
        private IEnumerator TimeUpdateLoop()
        {
            while (enableDayNightCycle)
            {
                UpdateTime();
                yield return new WaitForSeconds(1f);
            }
        }
        
        private void UpdateWorldState()
        {
            worldState.lastUpdate = DateTime.Now;
            
            // Update world properties based on current state
            worldState.worldProperties["weather"] = worldState.currentWeather.ToString();
            worldState.worldProperties["time"] = worldState.timeOfDay.ToString();
            worldState.worldProperties["season"] = worldState.currentSeason.ToString();
            worldState.worldProperties["temperature"] = worldState.temperature;
            worldState.worldProperties["humidity"] = worldState.humidity;
            worldState.worldProperties["wind_speed"] = worldState.windSpeed;
            worldState.worldProperties["precipitation"] = worldState.precipitation;
            worldState.worldProperties["active_npcs"] = worldState.npcs.Count(n => n.isActive);
            worldState.worldProperties["active_events"] = worldState.activeEvents.Count(e => e.isActive);
        }
        
        private void UpdateWeather()
        {
            if (weatherController != null)
            {
                var newWeather = weatherController.GetNextWeather(worldState);
                if (newWeather != worldState.currentWeather)
                {
                    StartCoroutine(TransitionWeather(newWeather));
                }
            }
        }
        
        private IEnumerator TransitionWeather(WeatherType newWeather)
        {
            var oldWeather = worldState.currentWeather;
            var transitionTime = 0f;
            var maxTransitionTime = weatherTransitionSpeed;
            
            while (transitionTime < maxTransitionTime)
            {
                transitionTime += Time.deltaTime;
                var t = transitionTime / maxTransitionTime;
                
                // Interpolate weather properties
                worldState.temperature = Mathf.Lerp(GetWeatherTemperature(oldWeather), GetWeatherTemperature(newWeather), t);
                worldState.humidity = Mathf.Lerp(GetWeatherHumidity(oldWeather), GetWeatherHumidity(newWeather), t);
                worldState.windSpeed = Mathf.Lerp(GetWeatherWindSpeed(oldWeather), GetWeatherWindSpeed(newWeather), t);
                worldState.precipitation = Mathf.Lerp(GetWeatherPrecipitation(oldWeather), GetWeatherPrecipitation(newWeather), t);
                
                yield return null;
            }
            
            worldState.currentWeather = newWeather;
            
            // Notify NPCs of weather change
            NotifyNPCsOfWeatherChange(newWeather);
        }
        
        private void UpdateNPCs()
        {
            if (npcController != null)
            {
                npcController.UpdateNPCs(worldState);
            }
        }
        
        private void UpdateEvents()
        {
            if (eventController != null)
            {
                eventController.UpdateEvents(worldState);
            }
        }
        
        private void UpdateTime()
        {
            if (timeController != null)
            {
                var timeData = timeController.UpdateTime(worldState);
                worldState.timeOfDay = timeData.timeOfDay;
                worldState.currentSeason = timeData.season;
            }
        }
        
        private float GetWeatherTemperature(WeatherType weather)
        {
            switch (weather)
            {
                case WeatherType.Sunny: return 25f;
                case WeatherType.Cloudy: return 20f;
                case WeatherType.Rainy: return 15f;
                case WeatherType.Stormy: return 12f;
                case WeatherType.Snowy: return -5f;
                case WeatherType.Foggy: return 18f;
                case WeatherType.Windy: return 22f;
                case WeatherType.Hot: return 35f;
                case WeatherType.Cold: return 5f;
                case WeatherType.Perfect: return 23f;
                default: return 20f;
            }
        }
        
        private float GetWeatherHumidity(WeatherType weather)
        {
            switch (weather)
            {
                case WeatherType.Sunny: return 0.3f;
                case WeatherType.Cloudy: return 0.6f;
                case WeatherType.Rainy: return 0.9f;
                case WeatherType.Stormy: return 0.95f;
                case WeatherType.Snowy: return 0.4f;
                case WeatherType.Foggy: return 0.8f;
                case WeatherType.Windy: return 0.5f;
                case WeatherType.Hot: return 0.2f;
                case WeatherType.Cold: return 0.3f;
                case WeatherType.Perfect: return 0.5f;
                default: return 0.5f;
            }
        }
        
        private float GetWeatherWindSpeed(WeatherType weather)
        {
            switch (weather)
            {
                case WeatherType.Sunny: return 2f;
                case WeatherType.Cloudy: return 5f;
                case WeatherType.Rainy: return 8f;
                case WeatherType.Stormy: return 20f;
                case WeatherType.Snowy: return 10f;
                case WeatherType.Foggy: return 1f;
                case WeatherType.Windy: return 15f;
                case WeatherType.Hot: return 3f;
                case WeatherType.Cold: return 5f;
                case WeatherType.Perfect: return 4f;
                default: return 5f;
            }
        }
        
        private float GetWeatherPrecipitation(WeatherType weather)
        {
            switch (weather)
            {
                case WeatherType.Sunny: return 0f;
                case WeatherType.Cloudy: return 0f;
                case WeatherType.Rainy: return 0.8f;
                case WeatherType.Stormy: return 1f;
                case WeatherType.Snowy: return 0.6f;
                case WeatherType.Foggy: return 0.1f;
                case WeatherType.Windy: return 0f;
                case WeatherType.Hot: return 0f;
                case WeatherType.Cold: return 0f;
                case WeatherType.Perfect: return 0f;
                default: return 0f;
            }
        }
        
        private void NotifyNPCsOfWeatherChange(WeatherType newWeather)
        {
            foreach (var npc in worldState.npcs)
            {
                if (npc.isActive)
                {
                    // Update NPC behavior based on weather
                    UpdateNPCBehaviorForWeather(npc, newWeather);
                }
            }
        }
        
        private void UpdateNPCBehaviorForWeather(NPC npc, WeatherType weather)
        {
            switch (weather)
            {
                case WeatherType.Rainy:
                case WeatherType.Stormy:
                    // NPCs seek shelter
                    npc.currentState = NPCState.Worried;
                    npc.happiness = Mathf.Max(0f, npc.happiness - 0.1f);
                    break;
                case WeatherType.Sunny:
                case WeatherType.Perfect:
                    // NPCs are happier
                    npc.currentState = NPCState.Excited;
                    npc.happiness = Mathf.Min(1f, npc.happiness + 0.1f);
                    break;
                case WeatherType.Hot:
                    // NPCs are tired
                    npc.energy = Mathf.Max(0f, npc.energy - 0.2f);
                    break;
                case WeatherType.Cold:
                    // NPCs seek warmth
                    npc.currentState = NPCState.Worried;
                    break;
            }
        }
        
        public void AddNPC(string npcId, string name, NPCType npcType, Vector3 position)
        {
            var npc = new NPC
            {
                npcId = npcId,
                name = name,
                npcType = npcType,
                position = position,
                currentState = NPCState.Idle,
                behavior = new NPCBehavior(),
                happiness = 0.5f,
                energy = 1f,
                hunger = 0.5f,
                social = 0.5f,
                lastInteraction = DateTime.Now,
                isActive = true
            };
            
            worldState.npcs.Add(npc);
        }
        
        public void RemoveNPC(string npcId)
        {
            worldState.npcs.RemoveAll(n => n.npcId == npcId);
        }
        
        public NPC GetNPC(string npcId)
        {
            return worldState.npcs.FirstOrDefault(n => n.npcId == npcId);
        }
        
        public List<NPC> GetNPCsInRadius(Vector3 position, float radius)
        {
            return worldState.npcs.Where(n => n.isActive && Vector3.Distance(n.position, position) <= radius).ToList();
        }
        
        public void InteractWithNPC(string npcId, string interactionType, Dictionary<string, object> parameters = null)
        {
            var npc = GetNPC(npcId);
            if (npc == null) return;
            
            npc.lastInteraction = DateTime.Now;
            
            // Update NPC based on interaction
            switch (interactionType)
            {
                case "greeting":
                    npc.social = Mathf.Min(1f, npc.social + 0.1f);
                    npc.happiness = Mathf.Min(1f, npc.happiness + 0.05f);
                    break;
                case "gift":
                    npc.happiness = Mathf.Min(1f, npc.happiness + 0.2f);
                    break;
                case "trade":
                    npc.social = Mathf.Min(1f, npc.social + 0.05f);
                    break;
                case "insult":
                    npc.happiness = Mathf.Max(0f, npc.happiness - 0.3f);
                    npc.social = Mathf.Max(0f, npc.social - 0.1f);
                    break;
            }
            
            // Add memory
            var memory = new NPCMemory
            {
                memoryId = Guid.NewGuid().ToString(),
                description = $"Player {interactionType}",
                memoryType = MemoryType.Interaction,
                importance = 0.5f,
                timestamp = DateTime.Now,
                context = parameters ?? new Dictionary<string, object>()
            };
            
            npc.memories.Add(memory);
            
            // Keep memory limit
            if (npc.memories.Count > npcMemoryLimit)
            {
                npc.memories = npc.memories
                    .OrderByDescending(m => m.importance)
                    .Take(npcMemoryLimit)
                    .ToList();
            }
        }
        
        public void AddWorldEvent(string eventId, string name, string description, EventType eventType, Vector3 location, float radius, DateTime startTime, DateTime endTime)
        {
            var worldEvent = new WorldEvent
            {
                eventId = eventId,
                name = name,
                description = description,
                eventType = eventType,
                location = location,
                radius = radius,
                startTime = startTime,
                endTime = endTime,
                isActive = true
            };
            
            worldState.activeEvents.Add(worldEvent);
            
            // Notify NPCs of event
            NotifyNPCsOfEvent(worldEvent);
        }
        
        private void NotifyNPCsOfEvent(WorldEvent worldEvent)
        {
            var affectedNPCs = GetNPCsInRadius(worldEvent.location, worldEvent.radius);
            
            foreach (var npc in affectedNPCs)
            {
                worldEvent.affectedNPCs.Add(npc.npcId);
                
                // Update NPC behavior based on event
                switch (worldEvent.eventType)
                {
                    case EventType.Festival:
                    case EventType.Celebration:
                        npc.happiness = Mathf.Min(1f, npc.happiness + 0.3f);
                        npc.currentState = NPCState.Excited;
                        break;
                    case EventType.Emergency:
                        npc.currentState = NPCState.Worried;
                        npc.happiness = Mathf.Max(0f, npc.happiness - 0.2f);
                        break;
                    case EventType.Market:
                        npc.currentState = NPCState.Working;
                        break;
                }
            }
        }
        
        public WorldState GetWorldState()
        {
            return worldState;
        }
        
        public WeatherType GetCurrentWeather()
        {
            return worldState.currentWeather;
        }
        
        public TimeOfDay GetCurrentTimeOfDay()
        {
            return worldState.timeOfDay;
        }
        
        public Season GetCurrentSeason()
        {
            return worldState.currentSeason;
        }
        
        public float GetTemperature()
        {
            return worldState.temperature;
        }
        
        public float GetHumidity()
        {
            return worldState.humidity;
        }
        
        public float GetWindSpeed()
        {
            return worldState.windSpeed;
        }
        
        public float GetPrecipitation()
        {
            return worldState.precipitation;
        }
        
        public List<WorldEvent> GetActiveEvents()
        {
            return worldState.activeEvents.Where(e => e.isActive).ToList();
        }
        
        public List<NPC> GetActiveNPCs()
        {
            return worldState.npcs.Where(n => n.isActive).ToList();
        }
        
        public void SetWeather(WeatherType weather)
        {
            worldState.currentWeather = weather;
            worldState.temperature = GetWeatherTemperature(weather);
            worldState.humidity = GetWeatherHumidity(weather);
            worldState.windSpeed = GetWeatherWindSpeed(weather);
            worldState.precipitation = GetWeatherPrecipitation(weather);
            
            NotifyNPCsOfWeatherChange(weather);
        }
        
        public void SetTimeOfDay(TimeOfDay timeOfDay)
        {
            worldState.timeOfDay = timeOfDay;
        }
        
        public void SetSeason(Season season)
        {
            worldState.currentSeason = season;
        }
        
        public void PauseWorld()
        {
            if (worldUpdateCoroutine != null)
            {
                StopCoroutine(worldUpdateCoroutine);
            }
            if (weatherCoroutine != null)
            {
                StopCoroutine(weatherCoroutine);
            }
            if (npcCoroutine != null)
            {
                StopCoroutine(npcCoroutine);
            }
            if (eventCoroutine != null)
            {
                StopCoroutine(eventCoroutine);
            }
            if (timeCoroutine != null)
            {
                StopCoroutine(timeCoroutine);
            }
        }
        
        public void ResumeWorld()
        {
            StartWorldSystems();
        }
        
        void OnDestroy()
        {
            PauseWorld();
        }
    }
    
    // Supporting controller classes
    public class WeatherController : MonoBehaviour
    {
        public void Initialize(float changeInterval, float transitionSpeed) { }
        public WeatherType GetNextWeather(WorldState worldState) { return WeatherType.Sunny; }
    }
    
    public class NPCController : MonoBehaviour
    {
        public void Initialize(int maxNPCs, float updateInterval, float interactionRadius, float memoryLimit) { }
        public void UpdateNPCs(WorldState worldState) { }
    }
    
    public class EventController : MonoBehaviour
    {
        public void Initialize(float spawnInterval, int maxActiveEvents, float eventRadius) { }
        public void UpdateEvents(WorldState worldState) { }
    }
    
    public class TimeController : MonoBehaviour
    {
        public void Initialize(float dayLength, float timeSpeed, bool pauseAtNight) { }
        public (TimeOfDay timeOfDay, Season season) UpdateTime(WorldState worldState) { return (TimeOfDay.Morning, Season.Spring); }
    }
    
    public class EconomyController : MonoBehaviour
    {
        public void Initialize() { }
    }
}