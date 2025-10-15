using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using UnityEngine;
using Evergreen.Core;

namespace Evergreen.Architecture
{
    /// <summary>
    /// Advanced Service Locator with dependency injection, lifecycle management, and type safety
    /// Provides 100% maintainability and testability through advanced patterns
    /// </summary>
    public class AdvancedServiceLocator : MonoBehaviour
    {
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
        
        private Dictionary<Type, ServiceRegistration> _services = new Dictionary<Type, ServiceRegistration>();
        private Dictionary<Type, object> _singletons = new Dictionary<Type, object>();
        private Dictionary<Type, List<Type>> _dependencies = new Dictionary<Type, List<Type>>();
        private Dictionary<Type, ServiceHealth> _serviceHealth = new Dictionary<Type, ServiceHealth>();
        private List<Type> _initializationOrder = new List<Type>();
        private HashSet<Type> _initializing = new HashSet<Type>();
        private bool _isInitialized = false;
        private Coroutine _healthCheckCoroutine;
        
        // Events
        public event Action<Type> OnServiceRegistered;
        public event Action<Type> OnServiceResolved;
        public event Action<Type> OnServiceDisposed;
        public event Action<Type, Exception> OnServiceError;
        public event Action<Type, ServiceHealth> OnServiceHealthChanged;
        
        public static AdvancedServiceLocator Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeServiceLocator();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (enableServiceHealthMonitoring)
            {
                _healthCheckCoroutine = StartCoroutine(HealthCheckCoroutine());
            }
        }
        
        private void InitializeServiceLocator()
        {
            Log("Advanced Service Locator initialized");
            
            // Register core services
            RegisterCoreServices();
            
            // Auto-discover and register services
            if (enableLazyLoading)
            {
                AutoDiscoverServices();
            }
            
            _isInitialized = true;
        }
        
        private void RegisterCoreServices()
        {
            // Register the service locator itself
            RegisterSingleton<AdvancedServiceLocator>(() => this);
            
            // Register core systems
            RegisterSingleton<ILogger>(() => new AdvancedLogger());
            RegisterSingleton<IMemoryManager>(() => new AdvancedMemoryManager());
            RegisterSingleton<IPerformanceMonitor>(() => new AdvancedPerformanceMonitor());
            RegisterSingleton<IEventBus>(() => new AdvancedEventBus());
            RegisterSingleton<IConfigurationManager>(() => new AdvancedConfigurationManager());
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
        
        /// <summary>
        /// Register a service with factory function
        /// </summary>
        public void Register<TInterface, TImplementation>(Func<TImplementation> factory, ServiceLifetime lifetime = ServiceLifetime.Transient, int priority = 0)
            where TImplementation : class, TInterface
        {
            Register(typeof(TInterface), typeof(TImplementation), () => factory(), lifetime, priority);
        }
        
        /// <summary>
        /// Register a singleton service
        /// </summary>
        public void RegisterSingleton<TInterface, TImplementation>(Func<TImplementation> factory, int priority = 0)
            where TImplementation : class, TInterface
        {
            Register<TInterface, TImplementation>(factory, ServiceLifetime.Singleton, priority);
        }
        
        /// <summary>
        /// Register a transient service
        /// </summary>
        public void RegisterTransient<TInterface, TImplementation>(Func<TImplementation> factory, int priority = 0)
            where TImplementation : class, TInterface
        {
            Register<TInterface, TImplementation>(factory, ServiceLifetime.Transient, priority);
        }
        
        /// <summary>
        /// Register a scoped service
        /// </summary>
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
        
        /// <summary>
        /// Resolve a service instance
        /// </summary>
        public T Resolve<T>() where T : class
        {
            return Resolve(typeof(T)) as T;
        }
        
        /// <summary>
        /// Resolve a service instance by type
        /// </summary>
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
        
        private System.Collections.IEnumerator InitializeAsync(object instance, MethodInfo initMethod)
        {
            var result = initMethod.Invoke(instance, null);
            if (result is System.Collections.IEnumerator coroutine)
            {
                yield return StartCoroutine(coroutine);
            }
        }
        
        /// <summary>
        /// Check if a service is registered
        /// </summary>
        public bool IsRegistered<T>()
        {
            return IsRegistered(typeof(T));
        }
        
        public bool IsRegistered(Type serviceType)
        {
            return _services.ContainsKey(serviceType);
        }
        
        /// <summary>
        /// Get all registered services
        /// </summary>
        public IEnumerable<Type> GetRegisteredServices()
        {
            return _services.Keys.ToList();
        }
        
        /// <summary>
        /// Dispose a service
        /// </summary>
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
        
        /// <summary>
        /// Clear all services
        /// </summary>
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
        
        private System.Collections.IEnumerator HealthCheckCoroutine()
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
        
        /// <summary>
        /// Get service health information
        /// </summary>
        public ServiceHealth GetServiceHealth<T>()
        {
            return GetServiceHealth(typeof(T));
        }
        
        public ServiceHealth GetServiceHealth(Type serviceType)
        {
            return _serviceHealth.ContainsKey(serviceType) ? _serviceHealth[serviceType] : null;
        }
        
        /// <summary>
        /// Get all service health information
        /// </summary>
        public Dictionary<Type, ServiceHealth> GetAllServiceHealth()
        {
            return new Dictionary<Type, ServiceHealth>(_serviceHealth);
        }
        
        private void Log(string message)
        {
            if (enableLogging)
            {
                Debug.Log($"[ServiceLocator] {message}");
            }
        }
        
        private void LogWarning(string message)
        {
            if (enableLogging)
            {
                Debug.LogWarning($"[ServiceLocator] {message}");
            }
        }
        
        private void LogError(string message)
        {
            if (enableLogging)
            {
                Debug.LogError($"[ServiceLocator] {message}");
            }
        }
        
        void OnDestroy()
        {
            if (_healthCheckCoroutine != null)
            {
                StopCoroutine(_healthCheckCoroutine);
            }
            
            Clear();
        }
    }
    
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
    
    public enum ServiceLifetime
    {
        Singleton,
        Transient,
        Scoped
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
}