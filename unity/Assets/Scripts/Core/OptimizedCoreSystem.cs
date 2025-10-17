using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using UnityEngine;
using UnityEngine.SceneManagement;
using Evergreen.Core;
using Evergreen.AI;
using Evergreen.Analytics;
using Evergreen.Social;
using Evergreen.LiveOps;
using Evergreen.Collections;
using Evergreen.ARPU;
using Evergreen.Retention;
using Evergreen.Addiction;

namespace Evergreen.Core
{
    /// <summary>
    /// OPTIMIZED CORE SYSTEM - Consolidated Core Functionality
    /// Combines: GameManager, ServiceLocator, AdvancedServiceLocator, Logger, MemoryOptimizer, EventBus
    /// Reduces 6+ files to 1 optimized system
    /// </summary>
    public class OptimizedCoreSystem : MonoBehaviour
    {
        [Header("System Configuration")]
        public bool enableAI = true;
        public bool enableAnalytics = true;
        public bool enableSocial = true;
        public bool enableLiveOps = true;
        public bool enableCollections = true;
        public bool enableARPU = true;
        public bool enableRetention = true;
        public bool enableAddictionMechanics = true;
        
        [Header("Service Locator Settings")]
        public bool enableLogging = true;
        public bool enableValidation = true;
        public bool enableLazyLoading = true;
        public bool enableCircularDependencyDetection = true;
        public bool enableServiceHealthMonitoring = true;
        
        [Header("Performance Settings")]
        public int maxServices = 100;
        public float healthCheckInterval = 5f;
        public float serviceTimeout = 30f;
        public float initializationDelay = 0.1f;
        public bool initializeOnAwake = true;
        public bool showInitializationLogs = true;
        
        [Header("Game State")]
        public GameState currentState = GameState.Initializing;
        public string currentLevel = "1";
        public int playerScore = 0;
        public int playerCoins = 1000;
        public int playerGems = 50;
        
        // Service Locator
        private Dictionary<Type, ServiceRegistration> _services = new Dictionary<Type, ServiceRegistration>();
        private Dictionary<Type, object> _singletons = new Dictionary<Type, object>();
        private Dictionary<Type, List<Type>> _dependencies = new Dictionary<Type, List<Type>>();
        private Dictionary<Type, ServiceHealth> _serviceHealth = new Dictionary<Type, ServiceHealth>();
        private List<Type> _initializationOrder = new List<Type>();
        private HashSet<Type> _initializing = new HashSet<Type>();
        private bool _isInitialized = false;
        private Coroutine _healthCheckCoroutine;
        
        // System References
        private SceneManager _sceneManager;
        private AIInfiniteContentManager _aiContentManager;
        private GameAnalyticsManager _analyticsManager;
        private AdvancedSocialSystem _socialSystem;
        private LiveEventsSystem _liveEventsSystem;
        private AchievementSystem _achievementSystem;
        private CompleteARPUManager _arpuManager;
        private AdvancedRetentionSystem _retentionSystem;
        private AddictionMechanics _addictionMechanics;
        
        // Memory Management
        private Dictionary<string, MemoryAllocation> _memoryAllocations = new Dictionary<string, MemoryAllocation>();
        private Dictionary<string, ObjectPool> _objectPools = new Dictionary<string, ObjectPool>();
        private long _totalMemoryUsage = 0;
        
        // Event System
        private Dictionary<Type, List<Delegate>> _eventHandlers = new Dictionary<Type, List<Delegate>>();
        private Dictionary<string, float> _profilingData = new Dictionary<string, float>();
        
        // Events
        public static event Action<GameState> OnGameStateChanged;
        public static event Action<int> OnScoreChanged;
        public static event Action<int> OnCoinsChanged;
        public static event Action<int> OnGemsChanged;
        public static event Action<string> OnLevelChanged;
        public static event Action OnGameInitialized;
        public event Action<Type> OnServiceRegistered;
        public event Action<Type> OnServiceResolved;
        public event Action<Type> OnServiceDisposed;
        public event Action<Type, Exception> OnServiceError;
        public event Action<Type, ServiceHealth> OnServiceHealthChanged;
        
        public static OptimizedCoreSystem Instance { get; private set; }
        
        public enum GameState
        {
            Initializing, MainMenu, Loading, Gameplay, Paused, Settings, 
            Shop, Social, Events, Collections, GameOver, Quitting
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeCoreSystem();
                
                if (initializeOnAwake)
                {
                    StartCoroutine(InitializeGame());
                }
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (!initializeOnAwake)
            {
                StartCoroutine(InitializeGame());
            }
        }
        
        #region Core System Initialization
        
        private void InitializeCoreSystem()
        {
            Log("🔧 Initializing Optimized Core System...");
            
            // Initialize service locator
            RegisterCoreServices();
            
            // Initialize memory management
            InitializeMemoryManagement();
            
            // Initialize event system
            InitializeEventSystem();
            
            // Auto-discover services
            if (enableLazyLoading)
            {
                AutoDiscoverServices();
            }
            
            _isInitialized = true;
            Log("✅ Core System Initialized");
        }
        
        private void RegisterCoreServices()
        {
            // Register the core system itself
            RegisterSingleton<OptimizedCoreSystem>(() => this);
            
            // Register core services
            RegisterSingleton<ILogger>(() => new AdvancedLogger());
            RegisterSingleton<IMemoryManager>(() => new AdvancedMemoryManager());
            RegisterSingleton<IPerformanceMonitor>(() => new AdvancedPerformanceMonitor());
            RegisterSingleton<IEventBus>(() => new AdvancedEventBus());
            RegisterSingleton<IConfigurationManager>(() => new AdvancedConfigurationManager());
        }
        
        private void InitializeMemoryManagement()
        {
            // Initialize object pools
            _objectPools["UI"] = new ObjectPool();
            _objectPools["Effects"] = new ObjectPool();
            _objectPools["Audio"] = new ObjectPool();
            
            Log("Memory management initialized");
        }
        
        private void InitializeEventSystem()
        {
            _eventHandlers = new Dictionary<Type, List<Delegate>>();
            Log("Event system initialized");
        }
        
        private void AutoDiscoverServices()
        {
            var assemblies = AppDomain.CurrentDomain.GetAssemblies();
            var serviceTypes = assemblies
                .SelectMany(assembly => assembly.GetTypes())
                .Where(type => type.GetCustomAttribute<ServiceAttribute>() != null)
                .ToList();
            
            foreach (var serviceType in serviceTypes)
            {
                var attribute = serviceType.GetCustomAttribute<ServiceAttribute>();
                RegisterService(serviceType, attribute.Lifetime, attribute.Priority);
            }
        }
        
        #endregion
        
        #region Game Initialization
        
        private IEnumerator InitializeGame()
        {
            if (showInitializationLogs)
                Log("🎮 Starting Game Initialization...");
            
            SetGameState(GameState.Initializing);
            
            // Initialize core systems first
            yield return StartCoroutine(InitializeCoreSystems());
            
            // Initialize game systems
            yield return StartCoroutine(InitializeGameSystems());
            
            // Initialize AI systems
            if (enableAI)
            {
                yield return StartCoroutine(InitializeAISystems());
            }
            
            // Initialize analytics
            if (enableAnalytics)
            {
                yield return StartCoroutine(InitializeAnalytics());
            }
            
            // Initialize social systems
            if (enableSocial)
            {
                yield return StartCoroutine(InitializeSocialSystems());
            }
            
            // Initialize live operations
            if (enableLiveOps)
            {
                yield return StartCoroutine(InitializeLiveOps());
            }
            
            // Initialize collections
            if (enableCollections)
            {
                yield return StartCoroutine(InitializeCollections());
            }
            
            // Initialize monetization
            if (enableARPU)
            {
                yield return StartCoroutine(InitializeARPU());
            }
            
            // Initialize retention
            if (enableRetention)
            {
                yield return StartCoroutine(InitializeRetention());
            }
            
            // Initialize addiction mechanics
            if (enableAddictionMechanics)
            {
                yield return StartCoroutine(InitializeAddictionMechanics());
            }
            
            // Finalize initialization
            yield return StartCoroutine(FinalizeInitialization());
            
            if (showInitializationLogs)
                Log("✅ Game Initialization Complete!");
            
            OnGameInitialized?.Invoke();
        }
        
        private IEnumerator InitializeCoreSystems()
        {
            if (showInitializationLogs)
                Log("🔧 Initializing Core Systems...");
            
            // Initialize Scene Manager
            _sceneManager = SceneManager.Instance;
            yield return new WaitForSeconds(initializationDelay);
            
            if (showInitializationLogs)
                Log("✅ Core Systems Initialized");
        }
        
        private IEnumerator InitializeGameSystems()
        {
            if (showInitializationLogs)
                Log("🎯 Initializing Game Systems...");
            
            // Load player data
            LoadPlayerData();
            
            // Initialize game state
            SetGameState(GameState.MainMenu);
            
            yield return new WaitForSeconds(initializationDelay);
            
            if (showInitializationLogs)
                Log("✅ Game Systems Initialized");
        }
        
        private IEnumerator InitializeAISystems()
        {
            if (showInitializationLogs)
                Log("🤖 Initializing AI Systems...");
            
            _aiContentManager = FindObjectOfType<AIInfiniteContentManager>();
            if (_aiContentManager == null)
            {
                GameObject aiGO = new GameObject("AIInfiniteContentManager");
                _aiContentManager = aiGO.AddComponent<AIInfiniteContentManager>();
            }
            
            yield return new WaitForSeconds(initializationDelay);
            
            if (showInitializationLogs)
                Log("✅ AI Systems Initialized");
        }
        
        private IEnumerator InitializeAnalytics()
        {
            if (showInitializationLogs)
                Log("📊 Initializing Analytics...");
            
            _analyticsManager = FindObjectOfType<GameAnalyticsManager>();
            if (_analyticsManager == null)
            {
                GameObject analyticsGO = new GameObject("GameAnalyticsManager");
                _analyticsManager = analyticsGO.AddComponent<GameAnalyticsManager>();
            }
            
            yield return new WaitForSeconds(initializationDelay);
            
            if (showInitializationLogs)
                Log("✅ Analytics Initialized");
        }
        
        private IEnumerator InitializeSocialSystems()
        {
            if (showInitializationLogs)
                Log("👥 Initializing Social Systems...");
            
            _socialSystem = FindObjectOfType<AdvancedSocialSystem>();
            if (_socialSystem == null)
            {
                GameObject socialGO = new GameObject("AdvancedSocialSystem");
                _socialSystem = socialGO.AddComponent<AdvancedSocialSystem>();
            }
            
            yield return new WaitForSeconds(initializationDelay);
            
            if (showInitializationLogs)
                Log("✅ Social Systems Initialized");
        }
        
        private IEnumerator InitializeLiveOps()
        {
            if (showInitializationLogs)
                Log("🎪 Initializing Live Operations...");
            
            _liveEventsSystem = FindObjectOfType<LiveEventsSystem>();
            if (_liveEventsSystem == null)
            {
                GameObject liveOpsGO = new GameObject("LiveEventsSystem");
                _liveEventsSystem = liveOpsGO.AddComponent<LiveEventsSystem>();
            }
            
            yield return new WaitForSeconds(initializationDelay);
            
            if (showInitializationLogs)
                Log("✅ Live Operations Initialized");
        }
        
        private IEnumerator InitializeCollections()
        {
            if (showInitializationLogs)
                Log("🏆 Initializing Collections...");
            
            _achievementSystem = FindObjectOfType<AchievementSystem>();
            if (_achievementSystem == null)
            {
                GameObject collectionsGO = new GameObject("AchievementSystem");
                _achievementSystem = collectionsGO.AddComponent<AchievementSystem>();
            }
            
            yield return new WaitForSeconds(initializationDelay);
            
            if (showInitializationLogs)
                Log("✅ Collections Initialized");
        }
        
        private IEnumerator InitializeARPU()
        {
            if (showInitializationLogs)
                Log("💰 Initializing ARPU Systems...");
            
            _arpuManager = FindObjectOfType<CompleteARPUManager>();
            if (_arpuManager == null)
            {
                GameObject arpuGO = new GameObject("CompleteARPUManager");
                _arpuManager = arpuGO.AddComponent<CompleteARPUManager>();
            }
            
            yield return new WaitForSeconds(initializationDelay);
            
            if (showInitializationLogs)
                Log("✅ ARPU Systems Initialized");
        }
        
        private IEnumerator InitializeRetention()
        {
            if (showInitializationLogs)
                Log("🔄 Initializing Retention Systems...");
            
            _retentionSystem = FindObjectOfType<AdvancedRetentionSystem>();
            if (_retentionSystem == null)
            {
                GameObject retentionGO = new GameObject("AdvancedRetentionSystem");
                _retentionSystem = retentionGO.AddComponent<AdvancedRetentionSystem>();
            }
            
            yield return new WaitForSeconds(initializationDelay);
            
            if (showInitializationLogs)
                Log("✅ Retention Systems Initialized");
        }
        
        private IEnumerator InitializeAddictionMechanics()
        {
            if (showInitializationLogs)
                Log("🎯 Initializing Addiction Mechanics...");
            
            _addictionMechanics = FindObjectOfType<AddictionMechanics>();
            if (_addictionMechanics == null)
            {
                GameObject addictionGO = new GameObject("AddictionMechanics");
                _addictionMechanics = addictionGO.AddComponent<AddictionMechanics>();
            }
            
            yield return new WaitForSeconds(initializationDelay);
            
            if (showInitializationLogs)
                Log("✅ Addiction Mechanics Initialized");
        }
        
        private IEnumerator FinalizeInitialization()
        {
            if (showInitializationLogs)
                Log("🎉 Finalizing Game Initialization...");
            
            // Set initial game state
            SetGameState(GameState.MainMenu);
            
            // Start background systems
            StartBackgroundSystems();
            
            // Start health monitoring
            if (enableServiceHealthMonitoring)
            {
                _healthCheckCoroutine = StartCoroutine(HealthCheckCoroutine());
            }
            
            yield return new WaitForSeconds(initializationDelay);
            
            if (showInitializationLogs)
                Log("🎮 Game Ready!");
        }
        
        private void StartBackgroundSystems()
        {
            // Start AI content generation
            if (_aiContentManager != null)
            {
                _aiContentManager.StartAIContentGeneration();
            }
            
            // Start analytics tracking
            if (_analyticsManager != null)
            {
                // Analytics will start automatically
            }
            
            // Start social systems
            if (_socialSystem != null)
            {
                // Social systems will start automatically
            }
            
            // Start live events
            if (_liveEventsSystem != null)
            {
                // Live events will start automatically
            }
        }
        
        #endregion
        
        #region Service Locator Implementation
        
        public void Register<TInterface, TImplementation>(Func<TImplementation> factory, ServiceLifetime lifetime = ServiceLifetime.Transient, int priority = 0)
            where TImplementation : class, TInterface
        {
            Register(typeof(TInterface), typeof(TImplementation), () => factory(), lifetime, priority);
        }
        
        public void RegisterSingleton<TInterface, TImplementation>(Func<TImplementation> factory, int priority = 0)
            where TImplementation : class, TInterface
        {
            Register<TInterface, TImplementation>(factory, ServiceLifetime.Singleton, priority);
        }
        
        public void RegisterTransient<TInterface, TImplementation>(Func<TImplementation> factory, int priority = 0)
            where TImplementation : class, TInterface
        {
            Register<TInterface, TImplementation>(factory, ServiceLifetime.Transient, priority);
        }
        
        public void RegisterScoped<TInterface, TImplementation>(Func<TImplementation> factory, int priority = 0)
            where TImplementation : class, TInterface
        {
            Register<TInterface, TImplementation>(factory, ServiceLifetime.Scoped, priority);
        }
        
        private void Register(Type interfaceType, Type implementationType, Func<object> factory, ServiceLifetime lifetime, int priority)
        {
            if (_services.ContainsKey(interfaceType))
            {
                LogWarning($"Service {interfaceType.Name} is already registered. Overwriting...");
            }
            
            var registration = new ServiceRegistration
            {
                InterfaceType = interfaceType,
                ImplementationType = implementationType,
                Factory = factory,
                Lifetime = lifetime,
                Priority = priority,
                CreatedAt = DateTime.Now
            };
            
            _services[interfaceType] = registration;
            
            // Build dependency graph
            BuildDependencyGraph(interfaceType, implementationType);
            
            // Update initialization order
            UpdateInitializationOrder();
            
            OnServiceRegistered?.Invoke(interfaceType);
            Log($"Service registered: {interfaceType.Name} -> {implementationType.Name} ({lifetime})");
        }
        
        private void RegisterService(Type serviceType, ServiceLifetime lifetime, int priority)
        {
            Register(serviceType, serviceType, () => Activator.CreateInstance(serviceType), lifetime, priority);
        }
        
        private void BuildDependencyGraph(Type interfaceType, Type implementationType)
        {
            var dependencies = new List<Type>();
            
            // Find constructor dependencies
            var constructors = implementationType.GetConstructors();
            if (constructors.Length > 0)
            {
                var constructor = constructors.OrderByDescending(c => c.GetParameters().Length).First();
                var parameters = constructor.GetParameters();
                
                foreach (var parameter in parameters)
                {
                    if (_services.ContainsKey(parameter.ParameterType))
                    {
                        dependencies.Add(parameter.ParameterType);
                    }
                }
            }
            
            // Find property dependencies
            var properties = implementationType.GetProperties()
                .Where(p => p.GetCustomAttribute<InjectAttribute>() != null)
                .ToList();
            
            foreach (var property in properties)
            {
                if (_services.ContainsKey(property.PropertyType))
                {
                    dependencies.Add(property.PropertyType);
                }
            }
            
            _dependencies[interfaceType] = dependencies;
        }
        
        private void UpdateInitializationOrder()
        {
            _initializationOrder.Clear();
            var visited = new HashSet<Type>();
            var temp = new HashSet<Type>();
            
            foreach (var serviceType in _services.Keys)
            {
                if (!visited.Contains(serviceType))
                {
                    TopologicalSort(serviceType, visited, temp);
                }
            }
        }
        
        private void TopologicalSort(Type serviceType, HashSet<Type> visited, HashSet<Type> temp)
        {
            if (temp.Contains(serviceType))
            {
                if (enableCircularDependencyDetection)
                {
                    throw new InvalidOperationException($"Circular dependency detected involving {serviceType.Name}");
                }
                return;
            }
            
            if (visited.Contains(serviceType))
                return;
            
            temp.Add(serviceType);
            
            if (_dependencies.ContainsKey(serviceType))
            {
                foreach (var dependency in _dependencies[serviceType])
                {
                    TopologicalSort(dependency, visited, temp);
                }
            }
            
            temp.Remove(serviceType);
            visited.Add(serviceType);
            _initializationOrder.Add(serviceType);
        }
        
        public T Resolve<T>() where T : class
        {
            return Resolve(typeof(T)) as T;
        }
        
        public object Resolve(Type serviceType)
        {
            if (!_services.ContainsKey(serviceType))
            {
                throw new InvalidOperationException($"Service {serviceType.Name} is not registered");
            }
            
            var registration = _services[serviceType];
            
            // Check if already created for singleton
            if (registration.Lifetime == ServiceLifetime.Singleton && _singletons.ContainsKey(serviceType))
            {
                OnServiceResolved?.Invoke(serviceType);
                return _singletons[serviceType];
            }
            
            // Create new instance
            var instance = CreateServiceInstance(serviceType, registration);
            
            // Store singleton
            if (registration.Lifetime == ServiceLifetime.Singleton)
            {
                _singletons[serviceType] = instance;
            }
            
            // Initialize service
            InitializeService(instance, serviceType);
            
            OnServiceResolved?.Invoke(serviceType);
            Log($"Service resolved: {serviceType.Name}");
            
            return instance;
        }
        
        private object CreateServiceInstance(Type serviceType, ServiceRegistration registration)
        {
            try
            {
                // Resolve dependencies
                var dependencies = ResolveDependencies(serviceType);
                
                // Create instance using constructor injection
                var instance = CreateInstanceWithConstructorInjection(registration.ImplementationType, dependencies);
                
                // Apply property injection
                ApplyPropertyInjection(instance, dependencies);
                
                // Apply method injection
                ApplyMethodInjection(instance, dependencies);
                
                return instance;
            }
            catch (Exception ex)
            {
                OnServiceError?.Invoke(serviceType, ex);
                LogError($"Failed to create service {serviceType.Name}: {ex.Message}");
                throw;
            }
        }
        
        private Dictionary<Type, object> ResolveDependencies(Type serviceType)
        {
            var dependencies = new Dictionary<Type, object>();
            
            if (_dependencies.ContainsKey(serviceType))
            {
                foreach (var dependencyType in _dependencies[serviceType])
                {
                    dependencies[dependencyType] = Resolve(dependencyType);
                }
            }
            
            return dependencies;
        }
        
        private object CreateInstanceWithConstructorInjection(Type implementationType, Dictionary<Type, object> dependencies)
        {
            var constructors = implementationType.GetConstructors();
            if (constructors.Length == 0)
            {
                return Activator.CreateInstance(implementationType);
            }
            
            var constructor = constructors.OrderByDescending(c => c.GetParameters().Length).First();
            var parameters = constructor.GetParameters();
            var args = new object[parameters.Length];
            
            for (int i = 0; i < parameters.Length; i++)
            {
                var parameterType = parameters[i].ParameterType;
                if (dependencies.ContainsKey(parameterType))
                {
                    args[i] = dependencies[parameterType];
                }
                else
                {
                    args[i] = Resolve(parameterType);
                }
            }
            
            return Activator.CreateInstance(implementationType, args);
        }
        
        private void ApplyPropertyInjection(object instance, Dictionary<Type, object> dependencies)
        {
            var properties = instance.GetType().GetProperties()
                .Where(p => p.GetCustomAttribute<InjectAttribute>() != null && p.CanWrite)
                .ToList();
            
            foreach (var property in properties)
            {
                if (dependencies.ContainsKey(property.PropertyType))
                {
                    property.SetValue(instance, dependencies[property.PropertyType]);
                }
                else
                {
                    property.SetValue(instance, Resolve(property.PropertyType));
                }
            }
        }
        
        private void ApplyMethodInjection(object instance, Dictionary<Type, object> dependencies)
        {
            var methods = instance.GetType().GetMethods()
                .Where(m => m.GetCustomAttribute<InjectAttribute>() != null)
                .ToList();
            
            foreach (var method in methods)
            {
                var parameters = method.GetParameters();
                var args = new object[parameters.Length];
                
                for (int i = 0; i < parameters.Length; i++)
                {
                    var parameterType = parameters[i].ParameterType;
                    if (dependencies.ContainsKey(parameterType))
                    {
                        args[i] = dependencies[parameterType];
                    }
                    else
                    {
                        args[i] = Resolve(parameterType);
                    }
                }
                
                method.Invoke(instance, args);
            }
        }
        
        private void InitializeService(object instance, Type serviceType)
        {
            // Call initialization methods
            var initMethod = instance.GetType().GetMethod("Initialize", BindingFlags.Public | BindingFlags.Instance);
            if (initMethod != null)
            {
                initMethod.Invoke(instance, null);
            }
            
            // Call async initialization if available
            var asyncInitMethod = instance.GetType().GetMethod("InitializeAsync", BindingFlags.Public | BindingFlags.Instance);
            if (asyncInitMethod != null)
            {
                StartCoroutine(InitializeAsync(instance, asyncInitMethod));
            }
        }
        
        private IEnumerator InitializeAsync(object instance, MethodInfo initMethod)
        {
            var result = initMethod.Invoke(instance, null);
            if (result is IEnumerator coroutine)
            {
                yield return StartCoroutine(coroutine);
            }
        }
        
        public bool IsRegistered<T>()
        {
            return IsRegistered(typeof(T));
        }
        
        public bool IsRegistered(Type serviceType)
        {
            return _services.ContainsKey(serviceType);
        }
        
        public IEnumerable<Type> GetRegisteredServices()
        {
            return _services.Keys.ToList();
        }
        
        public void Dispose<T>()
        {
            Dispose(typeof(T));
        }
        
        public void Dispose(Type serviceType)
        {
            if (_singletons.ContainsKey(serviceType))
            {
                var instance = _singletons[serviceType];
                if (instance is IDisposable disposable)
                {
                    disposable.Dispose();
                }
                _singletons.Remove(serviceType);
                OnServiceDisposed?.Invoke(serviceType);
            }
        }
        
        public void Clear()
        {
            foreach (var singleton in _singletons.Values)
            {
                if (singleton is IDisposable disposable)
                {
                    disposable.Dispose();
                }
            }
            
            _services.Clear();
            _singletons.Clear();
            _dependencies.Clear();
            _serviceHealth.Clear();
            _initializationOrder.Clear();
            _initializing.Clear();
            
            Log("All services cleared");
        }
        
        #endregion
        
        #region Memory Management
        
        public void TrackAllocation(string name, int count, int size)
        {
            if (!_memoryAllocations.ContainsKey(name))
            {
                _memoryAllocations[name] = new MemoryAllocation();
            }
            
            _memoryAllocations[name].Count += count;
            _memoryAllocations[name].Size += size;
            _totalMemoryUsage += size;
        }
        
        public void TrackDeallocation(string name, int count, int size)
        {
            if (_memoryAllocations.ContainsKey(name))
            {
                _memoryAllocations[name].Count -= count;
                _memoryAllocations[name].Size -= size;
                _totalMemoryUsage -= size;
            }
        }
        
        public long GetMemoryUsage()
        {
            return _totalMemoryUsage;
        }
        
        public void ForceGarbageCollection()
        {
            System.GC.Collect();
            System.GC.WaitForPendingFinalizers();
            System.GC.Collect();
        }
        
        public ObjectPool GetObjectPool(string poolName)
        {
            return _objectPools.ContainsKey(poolName) ? _objectPools[poolName] : null;
        }
        
        #endregion
        
        #region Event System
        
        public void Subscribe<T>(Action<T> handler)
        {
            var eventType = typeof(T);
            if (!_eventHandlers.ContainsKey(eventType))
            {
                _eventHandlers[eventType] = new List<Delegate>();
            }
            _eventHandlers[eventType].Add(handler);
        }
        
        public void Unsubscribe<T>(Action<T> handler)
        {
            var eventType = typeof(T);
            if (_eventHandlers.ContainsKey(eventType))
            {
                _eventHandlers[eventType].Remove(handler);
            }
        }
        
        public void Publish<T>(T eventData)
        {
            var eventType = typeof(T);
            if (_eventHandlers.ContainsKey(eventType))
            {
                foreach (var handler in _eventHandlers[eventType])
                {
                    try
                    {
                        ((Action<T>)handler)(eventData);
                    }
                    catch (Exception ex)
                    {
                        LogError($"Error in event handler: {ex.Message}");
                    }
                }
            }
        }
        
        public void Clear()
        {
            _eventHandlers.Clear();
        }
        
        #endregion
        
        #region Performance Monitoring
        
        public void StartProfiling(string name)
        {
            _profilingData[name] = Time.realtimeSinceStartup;
        }
        
        public void EndProfiling(string name)
        {
            if (_profilingData.ContainsKey(name))
            {
                var duration = Time.realtimeSinceStartup - _profilingData[name];
                _profilingData[name] = duration;
            }
        }
        
        public float GetAverageTime(string name)
        {
            return _profilingData.ContainsKey(name) ? _profilingData[name] : 0f;
        }
        
        public void ResetProfiling(string name)
        {
            _profilingData.Remove(name);
        }
        
        #endregion
        
        #region Game State Management
        
        public void SetGameState(GameState newState)
        {
            if (currentState != newState)
            {
                GameState previousState = currentState;
                currentState = newState;
                
                OnGameStateChanged?.Invoke(newState);
                
                if (showInitializationLogs)
                    Log($"Game State: {previousState} -> {newState}");
            }
        }
        
        public void UpdateScore(int newScore)
        {
            playerScore = newScore;
            OnScoreChanged?.Invoke(playerScore);
        }
        
        public void AddScore(int points)
        {
            UpdateScore(playerScore + points);
        }
        
        public void UpdateCoins(int newCoins)
        {
            playerCoins = newCoins;
            OnCoinsChanged?.Invoke(playerCoins);
        }
        
        public void AddCoins(int coins)
        {
            UpdateCoins(playerCoins + coins);
        }
        
        public void UpdateGems(int newGems)
        {
            playerGems = newGems;
            OnGemsChanged?.Invoke(playerGems);
        }
        
        public void AddGems(int gems)
        {
            UpdateGems(playerGems + gems);
        }
        
        public void UpdateLevel(string newLevel)
        {
            currentLevel = newLevel;
            OnLevelChanged?.Invoke(currentLevel);
        }
        
        private void LoadPlayerData()
        {
            playerScore = PlayerPrefs.GetInt("PlayerScore", 0);
            playerCoins = PlayerPrefs.GetInt("PlayerCoins", 1000);
            playerGems = PlayerPrefs.GetInt("PlayerGems", 50);
            currentLevel = PlayerPrefs.GetString("CurrentLevel", "1");
        }
        
        public void SavePlayerData()
        {
            PlayerPrefs.SetInt("PlayerScore", playerScore);
            PlayerPrefs.SetInt("PlayerCoins", playerCoins);
            PlayerPrefs.SetInt("PlayerGems", playerGems);
            PlayerPrefs.SetString("CurrentLevel", currentLevel);
            PlayerPrefs.Save();
        }
        
        public void StartNewGame()
        {
            SetGameState(GameState.Loading);
            _sceneManager?.LoadScene("Gameplay");
        }
        
        public void PauseGame()
        {
            if (currentState == GameState.Gameplay)
            {
                SetGameState(GameState.Paused);
                Time.timeScale = 0f;
            }
        }
        
        public void ResumeGame()
        {
            if (currentState == GameState.Paused)
            {
                SetGameState(GameState.Gameplay);
                Time.timeScale = 1f;
            }
        }
        
        public void QuitGame()
        {
            SetGameState(GameState.Quitting);
            SavePlayerData();
            
            #if UNITY_EDITOR
                UnityEditor.EditorApplication.isPlaying = false;
            #else
                Application.Quit();
            #endif
        }
        
        #endregion
        
        #region Health Monitoring
        
        private IEnumerator HealthCheckCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(healthCheckInterval);
                
                foreach (var serviceType in _services.Keys)
                {
                    CheckServiceHealth(serviceType);
                }
            }
        }
        
        private void CheckServiceHealth(Type serviceType)
        {
            var health = new ServiceHealth
            {
                ServiceType = serviceType,
                IsHealthy = true,
                LastChecked = DateTime.Now,
                ResponseTime = 0f,
                ErrorCount = 0,
                MemoryUsage = 0L
            };
            
            try
            {
                var startTime = DateTime.Now;
                var instance = Resolve(serviceType);
                var endTime = DateTime.Now;
                
                health.ResponseTime = (float)(endTime - startTime).TotalMilliseconds;
                health.IsHealthy = health.ResponseTime < serviceTimeout * 1000;
                
                // Check memory usage
                if (instance is MonoBehaviour mb)
                {
                    health.MemoryUsage = GC.GetTotalMemory(false);
                }
            }
            catch (Exception ex)
            {
                health.IsHealthy = false;
                health.ErrorCount++;
                health.LastError = ex.Message;
                OnServiceError?.Invoke(serviceType, ex);
            }
            
            _serviceHealth[serviceType] = health;
            OnServiceHealthChanged?.Invoke(serviceType, health);
        }
        
        public ServiceHealth GetServiceHealth<T>()
        {
            return GetServiceHealth(typeof(T));
        }
        
        public ServiceHealth GetServiceHealth(Type serviceType)
        {
            return _serviceHealth.ContainsKey(serviceType) ? _serviceHealth[serviceType] : null;
        }
        
        public Dictionary<Type, ServiceHealth> GetAllServiceHealth()
        {
            return new Dictionary<Type, ServiceHealth>(_serviceHealth);
        }
        
        #endregion
        
        #region Logging
        
        private void Log(string message)
        {
            if (enableLogging)
            {
                Debug.Log($"[OptimizedCore] {message}");
            }
        }
        
        private void LogWarning(string message)
        {
            if (enableLogging)
            {
                Debug.LogWarning($"[OptimizedCore] {message}");
            }
        }
        
        private void LogError(string message)
        {
            if (enableLogging)
            {
                Debug.LogError($"[OptimizedCore] {message}");
            }
        }
        
        #endregion
        
        #region Diagnostic and Testing Tools
        
        [ContextMenu("Run Asset Diagnostic")]
        public void RunAssetDiagnostic()
        {
            StartCoroutine(RunComprehensiveAssetDiagnostic());
        }
        
        [ContextMenu("Test File Reading")]
        public void TestFileReading()
        {
            StartCoroutine(TestFileReadingSystem());
        }
        
        [ContextMenu("Run Quick Tests")]
        public void RunQuickTests()
        {
            StartCoroutine(RunQuickTestSuite());
        }
        
        [ContextMenu("Validate File Reading")]
        public void ValidateFileReading()
        {
            StartCoroutine(ValidateFileReadingSystem());
        }
        
        private IEnumerator RunComprehensiveAssetDiagnostic()
        {
            Log("=== COMPREHENSIVE ASSET DIAGNOSTIC ===");
            Log($"Platform: {Application.platform}");
            Log($"Unity Version: {Application.unityVersion}");
            Log($"StreamingAssets Path: {Application.streamingAssetsPath}");
            Log($"Persistent Data Path: {Application.persistentDataPath}");
            
            int totalAssetsTested = 0;
            int assetsLoadedSuccessfully = 0;
            int assetsFailedToLoad = 0;
            
            // Test basic StreamingAssets access
            yield return StartCoroutine(TestStreamingAssetsAccess());
            
            // Test configuration files
            string[] configFiles = { "unity_services_config.json", "economy_data.json" };
            foreach (string configFile in configFiles)
            {
                yield return StartCoroutine(TestSingleFile(configFile, totalAssetsTested, assetsLoadedSuccessfully, assetsFailedToLoad));
            }
            
            // Test level files
            yield return StartCoroutine(TestLevelFiles(totalAssetsTested, assetsLoadedSuccessfully, assetsFailedToLoad));
            
            // Generate diagnostic report
            Log($"=== DIAGNOSTIC REPORT ===");
            Log($"Total Assets Tested: {totalAssetsTested}");
            Log($"Successfully Loaded: {assetsLoadedSuccessfully}");
            Log($"Failed to Load: {assetsFailedToLoad}");
            Log($"Success Rate: {(float)assetsLoadedSuccessfully / totalAssetsTested * 100:F1}%");
        }
        
        private IEnumerator TestStreamingAssetsAccess()
        {
            try
            {
                string streamingPath = Application.streamingAssetsPath;
                if (string.IsNullOrEmpty(streamingPath))
                {
                    LogError("StreamingAssets path is null or empty!");
                    yield break;
                }
                
                Log($"✓ StreamingAssets path accessible: {streamingPath}");
                
                // Test directory listing
                string[] files = Directory.GetFiles(streamingPath);
                Log($"✓ Found {files?.Length ?? 0} files in StreamingAssets root");
            }
            catch (System.Exception ex)
            {
                LogError($"StreamingAssets access failed: {ex.Message}");
            }
            
            yield return null;
        }
        
        private IEnumerator TestSingleFile(string fileName, int totalAssetsTested, int assetsLoadedSuccessfully, int assetsFailedToLoad)
        {
            totalAssetsTested++;
            
            try
            {
                Log($"Testing file: {fileName}");
                
                string filePath = Path.Combine(Application.streamingAssetsPath, fileName);
                bool exists = File.Exists(filePath);
                
                if (!exists)
                {
                    LogError($"File does not exist: {fileName}");
                    assetsFailedToLoad++;
                    yield break;
                }
                
                string content = File.ReadAllText(filePath);
                if (string.IsNullOrEmpty(content))
                {
                    LogError($"Failed to read file: {fileName}");
                    assetsFailedToLoad++;
                    yield break;
                }
                
                assetsLoadedSuccessfully++;
                Log($"✓ Successfully loaded: {fileName} ({content.Length} characters)");
            }
            catch (System.Exception ex)
            {
                LogError($"Exception loading {fileName}: {ex.Message}");
                assetsFailedToLoad++;
            }
            
            yield return null;
        }
        
        private IEnumerator TestLevelFiles(int totalAssetsTested, int assetsLoadedSuccessfully, int assetsFailedToLoad)
        {
            try
            {
                string levelsPath = Path.Combine(Application.streamingAssetsPath, "levels");
                if (Directory.Exists(levelsPath))
                {
                    string[] levelFiles = Directory.GetFiles(levelsPath, "level_*.json");
                    Log($"Found {levelFiles.Length} level files to test:");
                    
                    foreach (string levelFile in levelFiles)
                    {
                        string fileName = Path.GetFileName(levelFile);
                        yield return StartCoroutine(TestSingleFile(Path.Combine("levels", fileName), totalAssetsTested, assetsLoadedSuccessfully, assetsFailedToLoad));
                    }
                }
                else
                {
                    LogError("Levels directory not found!");
                }
            }
            catch (System.Exception ex)
            {
                LogError($"Level files test failed: {ex.Message}");
            }
            
            yield return null;
        }
        
        private IEnumerator TestFileReadingSystem()
        {
            Log("=== Testing File Reading System ===");
            
            try
            {
                // Test config file reading
                string configPath = Path.Combine(Application.streamingAssetsPath, "unity_services_config.json");
                if (File.Exists(configPath))
                {
                    string content = File.ReadAllText(configPath);
                    Log($"✓ Config file read successfully ({content.Length} characters)");
                }
                else
                {
                    LogError("❌ Config file not found");
                }
                
                // Test level file reading
                string levelPath = Path.Combine(Application.streamingAssetsPath, "levels", "level_1.json");
                if (File.Exists(levelPath))
                {
                    string content = File.ReadAllText(levelPath);
                    Log($"✓ Level file read successfully ({content.Length} characters)");
                }
                else
                {
                    LogError("❌ Level file not found");
                }
            }
            catch (System.Exception ex)
            {
                LogError($"❌ File reading test failed: {ex.Message}");
            }
            
            yield return null;
        }
        
        private IEnumerator RunQuickTestSuite()
        {
            Log("=== Running Quick Test Suite ===");
            
            // Test 1: Basic file reading
            yield return StartCoroutine(TestFileReadingSystem());
            
            // Test 2: System integration
            yield return StartCoroutine(TestSystemIntegration());
            
            // Test 3: Performance check
            yield return StartCoroutine(TestBasicPerformance());
            
            Log("=== Quick Test Suite Complete ===");
        }
        
        private IEnumerator TestSystemIntegration()
        {
            Log("🔗 Testing system integration...");
            
            // Test core system
            Assert(Instance != null, "Core system should be available");
            
            // Test service locator
            Assert(IsRegistered<ILogger>(), "Logger should be registered");
            Assert(IsRegistered<IMemoryManager>(), "Memory manager should be registered");
            
            Log("✅ System integration test passed");
            yield return null;
        }
        
        private IEnumerator TestBasicPerformance()
        {
            Log("⚡ Testing basic performance...");
            
            long initialMemory = GC.GetTotalMemory(false);
            float startTime = Time.realtimeSinceStartup;
            
            // Perform some operations
            for (int i = 0; i < 100; i++)
            {
                SetGameState(GameState.MainMenu);
                AddScore(1);
            }
            
            float endTime = Time.realtimeSinceStartup;
            long finalMemory = GC.GetTotalMemory(false);
            
            float totalTime = endTime - startTime;
            long memoryUsed = finalMemory - initialMemory;
            
            Log($"✓ Performance test: {totalTime:F4}s for 100 operations");
            Log($"✓ Memory usage: {memoryUsed / 1024}KB");
            
            yield return null;
        }
        
        private IEnumerator ValidateFileReadingSystem()
        {
            Log("=== Validating File Reading System ===");
            
            bool streamingAssetsAccessible = false;
            bool levelFilesReadable = false;
            bool configFilesReadable = false;
            int totalFilesFound = 0;
            int filesSuccessfullyRead = 0;
            
            // Test 1: Check StreamingAssets accessibility
            try
            {
                string streamingPath = Application.streamingAssetsPath;
                if (!string.IsNullOrEmpty(streamingPath) && Directory.Exists(streamingPath))
                {
                    streamingAssetsAccessible = true;
                    Log("✓ StreamingAssets is accessible");
                }
                else
                {
                    LogError("❌ StreamingAssets is not accessible");
                }
            }
            catch (System.Exception ex)
            {
                LogError($"❌ StreamingAssets access failed: {ex.Message}");
            }
            
            // Test 2: Check level files
            try
            {
                string[] levelFiles = Directory.GetFiles(Path.Combine(Application.streamingAssetsPath, "levels"), "level_*.json");
                totalFilesFound += levelFiles.Length;
                
                if (levelFiles.Length > 0)
                {
                    levelFilesReadable = true;
                    Log($"✓ Found {levelFiles.Length} level files");
                    
                    // Test reading a few level files
                    foreach (string levelFile in levelFiles)
                    {
                        try
                        {
                            string content = File.ReadAllText(levelFile);
                            if (!string.IsNullOrEmpty(content))
                            {
                                filesSuccessfullyRead++;
                            }
                        }
                        catch (System.Exception ex)
                        {
                            LogError($"❌ Failed to read level file {Path.GetFileName(levelFile)}: {ex.Message}");
                        }
                    }
                }
                else
                {
                    LogError("❌ No level files found");
                }
            }
            catch (System.Exception ex)
            {
                LogError($"❌ Level files validation failed: {ex.Message}");
            }
            
            // Test 3: Check config files
            try
            {
                string[] configFiles = { "unity_services_config.json", "economy_data.json" };
                
                foreach (string configFile in configFiles)
                {
                    string configPath = Path.Combine(Application.streamingAssetsPath, configFile);
                    if (File.Exists(configPath))
                    {
                        totalFilesFound++;
                        try
                        {
                            string content = File.ReadAllText(configPath);
                            if (!string.IsNullOrEmpty(content))
                            {
                                filesSuccessfullyRead++;
                                configFilesReadable = true;
                                Log($"✓ Config file {configFile} is readable");
                            }
                        }
                        catch (System.Exception ex)
                        {
                            LogError($"❌ Failed to read config file {configFile}: {ex.Message}");
                        }
                    }
                    else
                    {
                        LogError($"❌ Config file {configFile} not found");
                    }
                }
            }
            catch (System.Exception ex)
            {
                LogError($"❌ Config files validation failed: {ex.Message}");
            }
            
            // Generate validation report
            Log("=== File Reading Validation Report ===");
            Log($"StreamingAssets Accessible: {(streamingAssetsAccessible ? "✅ Yes" : "❌ No")}");
            Log($"Level Files Readable: {(levelFilesReadable ? "✅ Yes" : "❌ No")}");
            Log($"Config Files Readable: {(configFilesReadable ? "✅ Yes" : "❌ No")}");
            Log($"Total Files Found: {totalFilesFound}");
            Log($"Files Successfully Read: {filesSuccessfullyRead}");
            Log($"Success Rate: {(totalFilesFound > 0 ? (float)filesSuccessfullyRead / totalFilesFound * 100f : 0f):F1}%");
            
            if (streamingAssetsAccessible && levelFilesReadable && configFilesReadable)
            {
                Log("🎉 File reading system is working perfectly!");
            }
            else
            {
                LogError("⚠️ File reading system has issues that need attention.");
            }
            
            yield return null;
        }
        
        private void Assert(bool condition, string message)
        {
            if (!condition)
            {
                throw new System.Exception($"Assertion failed: {message}");
            }
        }
        
        #endregion
        
        #region Unity Lifecycle
        
        void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus)
            {
                SavePlayerData();
            }
        }
        
        void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus)
            {
                SavePlayerData();
            }
        }
        
        void OnDestroy()
        {
            if (_healthCheckCoroutine != null)
            {
                StopCoroutine(_healthCheckCoroutine);
            }
            
            SavePlayerData();
            Clear();
        }
        
        #endregion
    }
    
    #region Data Structures
    
    [System.Serializable]
    public class ServiceRegistration
    {
        public Type InterfaceType;
        public Type ImplementationType;
        public Func<object> Factory;
        public ServiceLifetime Lifetime;
        public int Priority;
        public DateTime CreatedAt;
    }
    
    [System.Serializable]
    public class ServiceHealth
    {
        public Type ServiceType;
        public bool IsHealthy;
        public DateTime LastChecked;
        public float ResponseTime;
        public int ErrorCount;
        public string LastError;
        public long MemoryUsage;
    }
    
    [System.Serializable]
    public class MemoryAllocation
    {
        public int Count;
        public int Size;
    }
    
    public enum ServiceLifetime
    {
        Singleton, Transient, Scoped
    }
    
    [System.AttributeUsage(System.AttributeTargets.Class)]
    public class ServiceAttribute : System.Attribute
    {
        public ServiceLifetime Lifetime { get; set; } = ServiceLifetime.Transient;
        public int Priority { get; set; } = 0;
    }
    
    [System.AttributeUsage(System.AttributeTargets.Property | System.AttributeTargets.Method)]
    public class InjectAttribute : System.Attribute
    {
        public string Name { get; set; }
    }
    
    // Core service interfaces
    public interface ILogger
    {
        void Log(string message);
        void LogWarning(string message);
        void LogError(string message);
    }
    
    public interface IMemoryManager
    {
        void TrackAllocation(string name, int count, int size);
        void TrackDeallocation(string name, int count, int size);
        long GetMemoryUsage();
        void ForceGarbageCollection();
    }
    
    public interface IPerformanceMonitor
    {
        void StartProfiling(string name);
        void EndProfiling(string name);
        float GetAverageTime(string name);
        void ResetProfiling(string name);
    }
    
    public interface IEventBus
    {
        void Subscribe<T>(Action<T> handler);
        void Unsubscribe<T>(Action<T> handler);
        void Publish<T>(T eventData);
        void Clear();
    }
    
    public interface IConfigurationManager
    {
        T GetValue<T>(string key, T defaultValue = default);
        void SetValue<T>(string key, T value);
        bool HasKey(string key);
        void Clear();
    }
    
    // Implementation classes
    public class AdvancedLogger : ILogger
    {
        public void Log(string message) => Debug.Log($"[Logger] {message}");
        public void LogWarning(string message) => Debug.LogWarning($"[Logger] {message}");
        public void LogError(string message) => Debug.LogError($"[Logger] {message}");
    }
    
    public class AdvancedMemoryManager : IMemoryManager
    {
        public void TrackAllocation(string name, int count, int size) { }
        public void TrackDeallocation(string name, int count, int size) { }
        public long GetMemoryUsage() => GC.GetTotalMemory(false);
        public void ForceGarbageCollection() => GC.Collect();
    }
    
    public class AdvancedPerformanceMonitor : IPerformanceMonitor
    {
        private Dictionary<string, float> _profilingData = new Dictionary<string, float>();
        
        public void StartProfiling(string name) => _profilingData[name] = Time.realtimeSinceStartup;
        public void EndProfiling(string name) => _profilingData[name] = Time.realtimeSinceStartup - _profilingData[name];
        public float GetAverageTime(string name) => _profilingData.ContainsKey(name) ? _profilingData[name] : 0f;
        public void ResetProfiling(string name) => _profilingData.Remove(name);
    }
    
    public class AdvancedEventBus : IEventBus
    {
        private Dictionary<Type, List<Delegate>> _handlers = new Dictionary<Type, List<Delegate>>();
        
        public void Subscribe<T>(Action<T> handler) => _handlers[typeof(T)] = new List<Delegate> { handler };
        public void Unsubscribe<T>(Action<T> handler) => _handlers[typeof(T)]?.Remove(handler);
        public void Publish<T>(T eventData) => _handlers[typeof(T)]?.ForEach(h => ((Action<T>)h)(eventData));
        public void Clear() => _handlers.Clear();
    }
    
    public class AdvancedConfigurationManager : IConfigurationManager
    {
        public T GetValue<T>(string key, T defaultValue = default) => (T)PlayerPrefs.GetString(key, defaultValue?.ToString() ?? "");
        public void SetValue<T>(string key, T value) => PlayerPrefs.SetString(key, value?.ToString() ?? "");
        public bool HasKey(string key) => PlayerPrefs.HasKey(key);
        public void Clear() => PlayerPrefs.DeleteAll();
    }
    
    #endregion
}