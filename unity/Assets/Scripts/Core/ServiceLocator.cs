using System;
using System.Collections.Generic;
using UnityEngine;

namespace Evergreen.Core
{
    /// <summary>
    /// Service Locator pattern implementation for dependency injection
    /// Provides centralized access to game services and managers
    /// </summary>
    public static class ServiceLocator
    {
        private static readonly Dictionary<Type, object> _services = new Dictionary<Type, object>();
        private static readonly Dictionary<Type, Func<object>> _factories = new Dictionary<Type, Func<object>>();

        /// <summary>
        /// Register a service instance
        /// </summary>
        public static void Register<T>(T service) where T : class
        {
            if (service == null)
            {
                Debug.LogError($"Cannot register null service of type {typeof(T)}");
                return;
            }

            _services[typeof(T)] = service;
            Debug.Log($"Registered service: {typeof(T).Name}");
        }

        /// <summary>
        /// Register a factory function for lazy instantiation
        /// </summary>
        public static void RegisterFactory<T>(Func<T> factory) where T : class
        {
            if (factory == null)
            {
                Debug.LogError($"Cannot register null factory for type {typeof(T)}");
                return;
            }

            _factories[typeof(T)] = () => factory();
            Debug.Log($"Registered factory for: {typeof(T).Name}");
        }

        /// <summary>
        /// Get a service instance
        /// </summary>
        public static T Get<T>() where T : class
        {
            var type = typeof(T);
            
            // Check if service is already instantiated
            if (_services.TryGetValue(type, out var service))
            {
                return service as T;
            }

            // Check if factory exists and create instance
            if (_factories.TryGetValue(type, out var factory))
            {
                var instance = factory() as T;
                if (instance != null)
                {
                    _services[type] = instance;
                    return instance;
                }
            }

            Debug.LogError($"Service not found: {type.Name}");
            return null;
        }

        /// <summary>
        /// Check if a service is registered
        /// </summary>
        public static bool IsRegistered<T>() where T : class
        {
            return _services.ContainsKey(typeof(T)) || _factories.ContainsKey(typeof(T));
        }

        /// <summary>
        /// Unregister a service
        /// </summary>
        public static void Unregister<T>() where T : class
        {
            var type = typeof(T);
            _services.Remove(type);
            _factories.Remove(type);
            Debug.Log($"Unregistered service: {type.Name}");
        }

        /// <summary>
        /// Clear all services (useful for testing)
        /// </summary>
        public static void Clear()
        {
            _services.Clear();
            _factories.Clear();
            Debug.Log("All services cleared");
        }

        /// <summary>
        /// Get all registered service types
        /// </summary>
        public static IEnumerable<Type> GetRegisteredTypes()
        {
            var types = new List<Type>();
            types.AddRange(_services.Keys);
            types.AddRange(_factories.Keys);
            return types;
        }
    }
}