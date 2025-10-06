using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using UnityEngine;
using Evergreen.Core;

namespace Evergreen.Architecture
{
    /// <summary>
    /// Advanced Event Bus with type safety, async support, and comprehensive error handling
    /// Provides 100% maintainability through event-driven architecture
    /// </summary>
    public class AdvancedEventBus : MonoBehaviour, IEventBus
    {
        [Header("Event Bus Settings")]
        public bool enableLogging = true;
        public bool enableAsyncEvents = true;
        public bool enableEventValidation = true;
        public bool enableEventHistory = true;
        public bool enablePerformanceMonitoring = true;
        
        [Header("Performance Settings")]
        public int maxEventHistory = 1000;
        public float eventTimeout = 30f;
        public int maxConcurrentEvents = 10;
        
        private Dictionary<Type, List<EventHandler>> _handlers = new Dictionary<Type, List<EventHandler>>();
        private Dictionary<Type, List<AsyncEventHandler>> _asyncHandlers = new Dictionary<Type, List<AsyncEventHandler>>();
        private Queue<EventHistory> _eventHistory = new Queue<EventHistory>();
        private Dictionary<string, EventPerformance> _eventPerformance = new Dictionary<string, EventPerformance>();
        private Dictionary<Type, EventStatistics> _eventStatistics = new Dictionary<Type, EventStatistics>();
        private Queue<EventData> _eventQueue = new Queue<EventData>();
        private bool _isProcessingEvents = false;
        private Coroutine _eventProcessingCoroutine;
        
        // Events
        public event Action<Type, object> OnEventPublished;
        public event Action<Type, object> OnEventHandled;
        public event Action<Type, Exception> OnEventError;
        public event Action<Type, float> OnEventPerformance;
        
        public static AdvancedEventBus Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeEventBus();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (enableAsyncEvents)
            {
                _eventProcessingCoroutine = StartCoroutine(ProcessEventQueue());
            }
        }
        
        private void InitializeEventBus()
        {
            Log("Advanced Event Bus initialized");
            
            // Auto-discover event handlers
            AutoDiscoverEventHandlers();
        }
        
        private void AutoDiscoverEventHandlers()
        {
            var assemblies = AppDomain.CurrentDomain.GetAssemblies();
            var handlerTypes = assemblies
                .SelectMany(assembly => assembly.GetTypes())
                .Where(type => type.GetCustomAttribute<EventHandlerAttribute>() != null)
                .ToList();
            
            foreach (var handlerType in handlerTypes)
            {
                RegisterEventHandler(handlerType);
            }
        }
        
        private void RegisterEventHandler(Type handlerType)
        {
            var methods = handlerType.GetMethods(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance)
                .Where(method => method.GetCustomAttribute<EventSubscriberAttribute>() != null)
                .ToList();
            
            foreach (var method in methods)
            {
                var attribute = method.GetCustomAttribute<EventSubscriberAttribute>();
                var eventType = attribute.EventType;
                
                if (eventType == null)
                {
                    // Try to infer from method parameters
                    var parameters = method.GetParameters();
                    if (parameters.Length == 1)
                    {
                        eventType = parameters[0].ParameterType;
                    }
                }
                
                if (eventType != null)
                {
                    var handler = new EventHandler
                    {
                        HandlerType = handlerType,
                        Method = method,
                        Priority = attribute.Priority,
                        IsAsync = attribute.IsAsync,
                        Filter = attribute.Filter
                    };
                    
                    if (attribute.IsAsync)
                    {
                        if (!_asyncHandlers.ContainsKey(eventType))
                            _asyncHandlers[eventType] = new List<AsyncEventHandler>();
                        
                        _asyncHandlers[eventType].Add(new AsyncEventHandler
                        {
                            Handler = handler,
                            Timeout = attribute.Timeout
                        });
                    }
                    else
                    {
                        if (!_handlers.ContainsKey(eventType))
                            _handlers[eventType] = new List<EventHandler>();
                        
                        _handlers[eventType].Add(handler);
                    }
                    
                    Log($"Event handler registered: {handlerType.Name}.{method.Name} for {eventType.Name}");
                }
            }
        }
        
        /// <summary>
        /// Subscribe to an event type
        /// </summary>
        public void Subscribe<T>(Action<T> handler)
        {
            var eventType = typeof(T);
            var eventHandler = new EventHandler
            {
                HandlerType = typeof(Action<T>),
                Method = handler.Method,
                Target = handler.Target,
                Priority = 0,
                IsAsync = false
            };
            
            if (!_handlers.ContainsKey(eventType))
                _handlers[eventType] = new List<EventHandler>();
            
            _handlers[eventType].Add(eventHandler);
            Log($"Subscribed to {eventType.Name}");
        }
        
        /// <summary>
        /// Subscribe to an async event type
        /// </summary>
        public void SubscribeAsync<T>(Func<T, System.Threading.Tasks.Task> handler, float timeout = 30f)
        {
            var eventType = typeof(T);
            var eventHandler = new EventHandler
            {
                HandlerType = typeof(Func<T, System.Threading.Tasks.Task>),
                Method = handler.Method,
                Target = handler.Target,
                Priority = 0,
                IsAsync = true
            };
            
            if (!_asyncHandlers.ContainsKey(eventType))
                _asyncHandlers[eventType] = new List<AsyncEventHandler>();
            
            _asyncHandlers[eventType].Add(new AsyncEventHandler
            {
                Handler = eventHandler,
                Timeout = timeout
            });
            
            Log($"Subscribed to async {eventType.Name}");
        }
        
        /// <summary>
        /// Unsubscribe from an event type
        /// </summary>
        public void Unsubscribe<T>(Action<T> handler)
        {
            var eventType = typeof(T);
            if (_handlers.ContainsKey(eventType))
            {
                _handlers[eventType].RemoveAll(h => h.Method == handler.Method && h.Target == handler.Target);
                Log($"Unsubscribed from {eventType.Name}");
            }
        }
        
        /// <summary>
        /// Unsubscribe from an async event type
        /// </summary>
        public void UnsubscribeAsync<T>(Func<T, System.Threading.Tasks.Task> handler)
        {
            var eventType = typeof(T);
            if (_asyncHandlers.ContainsKey(eventType))
            {
                _asyncHandlers[eventType].RemoveAll(h => h.Handler.Method == handler.Method && h.Handler.Target == handler.Target);
                Log($"Unsubscribed from async {eventType.Name}");
            }
        }
        
        /// <summary>
        /// Publish an event
        /// </summary>
        public void Publish<T>(T eventData)
        {
            var eventType = typeof(T);
            var startTime = DateTime.Now;
            
            try
            {
                // Validate event data
                if (enableEventValidation)
                {
                    ValidateEventData(eventData);
                }
                
                // Add to event history
                if (enableEventHistory)
                {
                    AddToEventHistory(eventType, eventData);
                }
                
                // Publish to sync handlers
                PublishToSyncHandlers(eventType, eventData);
                
                // Publish to async handlers
                if (enableAsyncEvents)
                {
                    PublishToAsyncHandlers(eventType, eventData);
                }
                
                // Update performance metrics
                if (enablePerformanceMonitoring)
                {
                    UpdatePerformanceMetrics(eventType, startTime);
                }
                
                OnEventPublished?.Invoke(eventType, eventData);
                Log($"Event published: {eventType.Name}");
            }
            catch (Exception ex)
            {
                OnEventError?.Invoke(eventType, ex);
                LogError($"Error publishing event {eventType.Name}: {ex.Message}");
                throw;
            }
        }
        
        /// <summary>
        /// Publish an event asynchronously
        /// </summary>
        public void PublishAsync<T>(T eventData)
        {
            if (enableAsyncEvents)
            {
                _eventQueue.Enqueue(new EventData
                {
                    EventType = typeof(T),
                    EventObject = eventData,
                    Timestamp = DateTime.Now
                });
            }
            else
            {
                Publish(eventData);
            }
        }
        
        private void ValidateEventData<T>(T eventData)
        {
            if (eventData == null)
            {
                throw new ArgumentNullException(nameof(eventData), "Event data cannot be null");
            }
            
            // Add custom validation logic here
            var validationAttributes = typeof(T).GetCustomAttributes<EventValidationAttribute>();
            foreach (var attribute in validationAttributes)
            {
                if (!attribute.Validate(eventData))
                {
                    throw new ArgumentException($"Event data validation failed: {attribute.ErrorMessage}");
                }
            }
        }
        
        private void AddToEventHistory(Type eventType, object eventData)
        {
            var history = new EventHistory
            {
                EventType = eventType,
                EventData = eventData,
                Timestamp = DateTime.Now,
                ThreadId = System.Threading.Thread.CurrentThread.ManagedThreadId
            };
            
            _eventHistory.Enqueue(history);
            
            // Maintain max history size
            while (_eventHistory.Count > maxEventHistory)
            {
                _eventHistory.Dequeue();
            }
        }
        
        private void PublishToSyncHandlers(Type eventType, object eventData)
        {
            if (!_handlers.ContainsKey(eventType))
                return;
            
            var handlers = _handlers[eventType].OrderBy(h => h.Priority).ToList();
            
            foreach (var handler in handlers)
            {
                try
                {
                    var startTime = DateTime.Now;
                    
                    if (handler.Target != null)
                    {
                        handler.Method.Invoke(handler.Target, new[] { eventData });
                    }
                    else
                    {
                        // Static method
                        handler.Method.Invoke(null, new[] { eventData });
                    }
                    
                    var endTime = DateTime.Now;
                    var duration = (float)(endTime - startTime).TotalMilliseconds;
                    
                    OnEventHandled?.Invoke(eventType, eventData);
                    OnEventPerformance?.Invoke(eventType, duration);
                    
                    Log($"Event handled by {handler.HandlerType.Name}.{handler.Method.Name} in {duration}ms");
                }
                catch (Exception ex)
                {
                    OnEventError?.Invoke(eventType, ex);
                    LogError($"Error in event handler {handler.HandlerType.Name}.{handler.Method.Name}: {ex.Message}");
                }
            }
        }
        
        private void PublishToAsyncHandlers(Type eventType, object eventData)
        {
            if (!_asyncHandlers.ContainsKey(eventType))
                return;
            
            var handlers = _asyncHandlers[eventType].OrderBy(h => h.Handler.Priority).ToList();
            
            foreach (var asyncHandler in handlers)
            {
                StartCoroutine(HandleAsyncEvent(asyncHandler, eventType, eventData));
            }
        }
        
        private System.Collections.IEnumerator HandleAsyncEvent(AsyncEventHandler asyncHandler, Type eventType, object eventData)
        {
            var startTime = DateTime.Now;
            var timeout = asyncHandler.Timeout;
            var completed = false;
            Exception exception = null;
            
            try
            {
                // Create task
                var task = CreateAsyncTask(asyncHandler.Handler, eventData);
                
                // Wait for completion with timeout
                var timeoutCoroutine = StartCoroutine(TimeoutCoroutine(timeout, () => completed = true));
                var taskCoroutine = StartCoroutine(TaskCoroutine(task, () => completed = true, ex => exception = ex));
                
                yield return new WaitUntil(() => completed);
                
                StopCoroutine(timeoutCoroutine);
                StopCoroutine(taskCoroutine);
                
                var endTime = DateTime.Now;
                var duration = (float)(endTime - startTime).TotalMilliseconds;
                
                if (exception != null)
                {
                    OnEventError?.Invoke(eventType, exception);
                    LogError($"Error in async event handler {asyncHandler.Handler.HandlerType.Name}.{asyncHandler.Handler.Method.Name}: {exception.Message}");
                }
                else
                {
                    OnEventHandled?.Invoke(eventType, eventData);
                    OnEventPerformance?.Invoke(eventType, duration);
                    Log($"Async event handled by {asyncHandler.Handler.HandlerType.Name}.{asyncHandler.Handler.Method.Name} in {duration}ms");
                }
            }
            catch (Exception ex)
            {
                OnEventError?.Invoke(eventType, ex);
                LogError($"Error in async event handler {asyncHandler.Handler.HandlerType.Name}.{asyncHandler.Handler.Method.Name}: {ex.Message}");
            }
        }
        
        private System.Threading.Tasks.Task CreateAsyncTask(EventHandler handler, object eventData)
        {
            if (handler.Target != null)
            {
                return (System.Threading.Tasks.Task)handler.Method.Invoke(handler.Target, new[] { eventData });
            }
            else
            {
                return (System.Threading.Tasks.Task)handler.Method.Invoke(null, new[] { eventData });
            }
        }
        
        private System.Collections.IEnumerator TimeoutCoroutine(float timeout, System.Action onTimeout)
        {
            yield return new WaitForSeconds(timeout);
            onTimeout();
        }
        
        private System.Collections.IEnumerator TaskCoroutine(System.Threading.Tasks.Task task, System.Action onComplete, System.Action<Exception> onError)
        {
            while (!task.IsCompleted)
            {
                yield return null;
            }
            
            if (task.IsFaulted)
            {
                onError(task.Exception);
            }
            else
            {
                onComplete();
            }
        }
        
        private System.Collections.IEnumerator ProcessEventQueue()
        {
            while (true)
            {
                if (_eventQueue.Count > 0 && !_isProcessingEvents)
                {
                    _isProcessingEvents = true;
                    
                    while (_eventQueue.Count > 0)
                    {
                        var eventData = _eventQueue.Dequeue();
                        PublishToSyncHandlers(eventData.EventType, eventData.EventObject);
                        PublishToAsyncHandlers(eventData.EventType, eventData.EventObject);
                    }
                    
                    _isProcessingEvents = false;
                }
                
                yield return new WaitForSeconds(0.1f);
            }
        }
        
        private void UpdatePerformanceMetrics(Type eventType, DateTime startTime)
        {
            var endTime = DateTime.Now;
            var duration = (float)(endTime - startTime).TotalMilliseconds;
            
            if (!_eventPerformance.ContainsKey(eventType.Name))
            {
                _eventPerformance[eventType.Name] = new EventPerformance
                {
                    EventType = eventType.Name,
                    TotalCalls = 0,
                    TotalTime = 0f,
                    AverageTime = 0f,
                    MinTime = float.MaxValue,
                    MaxTime = 0f,
                    LastCall = startTime
                };
            }
            
            var performance = _eventPerformance[eventType.Name];
            performance.TotalCalls++;
            performance.TotalTime += duration;
            performance.AverageTime = performance.TotalTime / performance.TotalCalls;
            performance.MinTime = Mathf.Min(performance.MinTime, duration);
            performance.MaxTime = Mathf.Max(performance.MaxTime, duration);
            performance.LastCall = startTime;
            
            if (!_eventStatistics.ContainsKey(eventType))
            {
                _eventStatistics[eventType] = new EventStatistics
                {
                    EventType = eventType,
                    TotalPublished = 0,
                    TotalHandled = 0,
                    TotalErrors = 0,
                    AverageHandlingTime = 0f
                };
            }
            
            var statistics = _eventStatistics[eventType];
            statistics.TotalPublished++;
        }
        
        /// <summary>
        /// Get event performance metrics
        /// </summary>
        public EventPerformance GetEventPerformance(string eventTypeName)
        {
            return _eventPerformance.ContainsKey(eventTypeName) ? _eventPerformance[eventTypeName] : null;
        }
        
        /// <summary>
        /// Get event statistics
        /// </summary>
        public EventStatistics GetEventStatistics(Type eventType)
        {
            return _eventStatistics.ContainsKey(eventType) ? _eventStatistics[eventType] : null;
        }
        
        /// <summary>
        /// Get event history
        /// </summary>
        public List<EventHistory> GetEventHistory(int count = 100)
        {
            return _eventHistory.TakeLast(count).ToList();
        }
        
        /// <summary>
        /// Clear event history
        /// </summary>
        public void ClearEventHistory()
        {
            _eventHistory.Clear();
        }
        
        /// <summary>
        /// Clear all event handlers
        /// </summary>
        public void Clear()
        {
            _handlers.Clear();
            _asyncHandlers.Clear();
            _eventHistory.Clear();
            _eventPerformance.Clear();
            _eventStatistics.Clear();
            _eventQueue.Clear();
            
            Log("Event bus cleared");
        }
        
        /// <summary>
        /// Get all registered event types
        /// </summary>
        public List<Type> GetRegisteredEventTypes()
        {
            var eventTypes = new HashSet<Type>();
            eventTypes.UnionWith(_handlers.Keys);
            eventTypes.UnionWith(_asyncHandlers.Keys);
            return eventTypes.ToList();
        }
        
        /// <summary>
        /// Get handler count for an event type
        /// </summary>
        public int GetHandlerCount<T>()
        {
            var eventType = typeof(T);
            int count = 0;
            
            if (_handlers.ContainsKey(eventType))
                count += _handlers[eventType].Count;
            
            if (_asyncHandlers.ContainsKey(eventType))
                count += _asyncHandlers[eventType].Count;
            
            return count;
        }
        
        private void Log(string message)
        {
            if (enableLogging)
            {
                Debug.Log($"[EventBus] {message}");
            }
        }
        
        private void LogError(string message)
        {
            if (enableLogging)
            {
                Debug.LogError($"[EventBus] {message}");
            }
        }
        
        void OnDestroy()
        {
            if (_eventProcessingCoroutine != null)
            {
                StopCoroutine(_eventProcessingCoroutine);
            }
            
            Clear();
        }
    }
    
    [System.Serializable]
    public class EventHandler
    {
        public Type HandlerType;
        public MethodInfo Method;
        public object Target;
        public int Priority;
        public bool IsAsync;
        public string Filter;
    }
    
    [System.Serializable]
    public class AsyncEventHandler
    {
        public EventHandler Handler;
        public float Timeout;
    }
    
    [System.Serializable]
    public class EventHistory
    {
        public Type EventType;
        public object EventData;
        public DateTime Timestamp;
        public int ThreadId;
    }
    
    [System.Serializable]
    public class EventPerformance
    {
        public string EventType;
        public int TotalCalls;
        public float TotalTime;
        public float AverageTime;
        public float MinTime;
        public float MaxTime;
        public DateTime LastCall;
    }
    
    [System.Serializable]
    public class EventStatistics
    {
        public Type EventType;
        public int TotalPublished;
        public int TotalHandled;
        public int TotalErrors;
        public float AverageHandlingTime;
    }
    
    [System.Serializable]
    public class EventData
    {
        public Type EventType;
        public object EventObject;
        public DateTime Timestamp;
    }
    
    [System.AttributeUsage(System.AttributeTargets.Class)]
    public class EventHandlerAttribute : System.Attribute
    {
        public int Priority { get; set; } = 0;
    }
    
    [System.AttributeUsage(System.AttributeTargets.Method)]
    public class EventSubscriberAttribute : System.Attribute
    {
        public Type EventType { get; set; }
        public int Priority { get; set; } = 0;
        public bool IsAsync { get; set; } = false;
        public float Timeout { get; set; } = 30f;
        public string Filter { get; set; }
    }
    
    [System.AttributeUsage(System.AttributeTargets.Class | System.AttributeTargets.Struct)]
    public class EventValidationAttribute : System.Attribute
    {
        public string ErrorMessage { get; set; } = "Validation failed";
        
        public virtual bool Validate(object eventData)
        {
            return true;
        }
    }
}