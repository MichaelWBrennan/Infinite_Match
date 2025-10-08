using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;
using System.Reflection;

namespace Evergreen.CloudCode
{
    /// <summary>
    /// Local cloud code manager that handles cloud functions locally instead of using Unity Cloud Code
    /// </summary>
    public class LocalCloudCodeManager : MonoBehaviour
    {
        [Header("Cloud Code Settings")]
        [SerializeField] private bool enableLocalCloudCode = true;
        [SerializeField] private bool enableDebugLogs = true;
        [SerializeField] private float functionTimeout = 30f; // 30 second timeout for functions
        
        public static LocalCloudCodeManager Instance { get; private set; }
        
        private Dictionary<string, CloudCodeFunction> _functions = new Dictionary<string, CloudCodeFunction>();
        private bool _isInitialized = false;
        
        // Events
        public System.Action OnInitialized;
        public System.Action<string, bool> OnFunctionExecuted;
        
        public bool IsInitialized => _isInitialized;
        
        [System.Serializable]
        public class CloudCodeFunction
        {
            public string functionName;
            public System.Func<Dictionary<string, object>, Task<CloudCodeResult>> function;
            public string description;
            public float timeout;
            
            public CloudCodeFunction(string name, System.Func<Dictionary<string, object>, Task<CloudCodeResult>> func, string desc = "", float timeout = 30f)
            {
                functionName = name;
                function = func;
                description = desc;
                this.timeout = timeout;
            }
        }
        
        [System.Serializable]
        public class CloudCodeResult
        {
            public bool success;
            public string errorMessage;
            public Dictionary<string, object> data;
            public long executionTimeMs;
            
            public CloudCodeResult(bool success, string errorMessage = "", Dictionary<string, object> data = null, long executionTimeMs = 0)
            {
                this.success = success;
                this.errorMessage = errorMessage;
                this.data = data ?? new Dictionary<string, object>();
                this.executionTimeMs = executionTimeMs;
            }
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeLocalCloudCode();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        private void InitializeLocalCloudCode()
        {
            if (!enableLocalCloudCode) return;
            
            try
            {
                RegisterDefaultFunctions();
                _isInitialized = true;
                OnInitialized?.Invoke();
                
                if (enableDebugLogs)
                    Debug.Log("Local Cloud Code Manager initialized");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to initialize Local Cloud Code: {e.Message}");
            }
        }
        
        private void RegisterDefaultFunctions()
        {
            // Register AddCurrency function
            RegisterFunction("AddCurrency", async (parameters) =>
            {
                var startTime = DateTime.Now;
                
                try
                {
                    if (!parameters.ContainsKey("currencyId") || !parameters.ContainsKey("amount"))
                    {
                        return new CloudCodeResult(false, "Missing required parameters: currencyId, amount");
                    }
                    
                    string currencyId = parameters["currencyId"].ToString();
                    int amount = Convert.ToInt32(parameters["amount"]);
                    
                    // Simulate currency addition
                    var economyManager = FindObjectOfType<Evergreen.Economy.RuntimeEconomyManager>();
                    if (economyManager != null)
                    {
                        bool success = await economyManager.AddCurrency(currencyId, amount);
                        
                        var executionTime = (DateTime.Now - startTime).TotalMilliseconds;
                        return new CloudCodeResult(success, success ? "" : "Failed to add currency", 
                            new Dictionary<string, object> { { "currencyId", currencyId }, { "amount", amount } }, 
                            (long)executionTime);
                    }
                    else
                    {
                        var executionTime = (DateTime.Now - startTime).TotalMilliseconds;
                        return new CloudCodeResult(false, "Economy manager not found", null, (long)executionTime);
                    }
                }
                catch (Exception e)
                {
                    var executionTime = (DateTime.Now - startTime).TotalMilliseconds;
                    return new CloudCodeResult(false, e.Message, null, (long)executionTime);
                }
            }, "Add currency to player balance");
            
            // Register SpendCurrency function
            RegisterFunction("SpendCurrency", async (parameters) =>
            {
                var startTime = DateTime.Now;
                
                try
                {
                    if (!parameters.ContainsKey("currencyId") || !parameters.ContainsKey("amount"))
                    {
                        return new CloudCodeResult(false, "Missing required parameters: currencyId, amount");
                    }
                    
                    string currencyId = parameters["currencyId"].ToString();
                    int amount = Convert.ToInt32(parameters["amount"]);
                    
                    // Simulate currency spending
                    var economyManager = FindObjectOfType<Evergreen.Economy.RuntimeEconomyManager>();
                    if (economyManager != null)
                    {
                        bool success = await economyManager.SpendCurrency(currencyId, amount);
                        
                        var executionTime = (DateTime.Now - startTime).TotalMilliseconds;
                        return new CloudCodeResult(success, success ? "" : "Insufficient funds", 
                            new Dictionary<string, object> { { "currencyId", currencyId }, { "amount", amount } }, 
                            (long)executionTime);
                    }
                    else
                    {
                        var executionTime = (DateTime.Now - startTime).TotalMilliseconds;
                        return new CloudCodeResult(false, "Economy manager not found", null, (long)executionTime);
                    }
                }
                catch (Exception e)
                {
                    var executionTime = (DateTime.Now - startTime).TotalMilliseconds;
                    return new CloudCodeResult(false, e.Message, null, (long)executionTime);
                }
            }, "Spend currency from player balance");
            
            // Register AddInventoryItem function
            RegisterFunction("AddInventoryItem", async (parameters) =>
            {
                var startTime = DateTime.Now;
                
                try
                {
                    if (!parameters.ContainsKey("itemId") || !parameters.ContainsKey("quantity"))
                    {
                        return new CloudCodeResult(false, "Missing required parameters: itemId, quantity");
                    }
                    
                    string itemId = parameters["itemId"].ToString();
                    int quantity = Convert.ToInt32(parameters["quantity"]);
                    
                    // Simulate inventory item addition
                    var economyManager = FindObjectOfType<Evergreen.Economy.RuntimeEconomyManager>();
                    if (economyManager != null)
                    {
                        // For inventory items, we'll simulate the addition
                        var executionTime = (DateTime.Now - startTime).TotalMilliseconds;
                        return new CloudCodeResult(true, "", 
                            new Dictionary<string, object> { { "itemId", itemId }, { "quantity", quantity } }, 
                            (long)executionTime);
                    }
                    else
                    {
                        var executionTime = (DateTime.Now - startTime).TotalMilliseconds;
                        return new CloudCodeResult(false, "Economy manager not found", null, (long)executionTime);
                    }
                }
                catch (Exception e)
                {
                    var executionTime = (DateTime.Now - startTime).TotalMilliseconds;
                    return new CloudCodeResult(false, e.Message, null, (long)executionTime);
                }
            }, "Add item to player inventory");
            
            // Register UseInventoryItem function
            RegisterFunction("UseInventoryItem", async (parameters) =>
            {
                var startTime = DateTime.Now;
                
                try
                {
                    if (!parameters.ContainsKey("itemId") || !parameters.ContainsKey("quantity"))
                    {
                        return new CloudCodeResult(false, "Missing required parameters: itemId, quantity");
                    }
                    
                    string itemId = parameters["itemId"].ToString();
                    int quantity = Convert.ToInt32(parameters["quantity"]);
                    
                    // Simulate inventory item usage
                    var economyManager = FindObjectOfType<Evergreen.Economy.RuntimeEconomyManager>();
                    if (economyManager != null)
                    {
                        bool success = await economyManager.UseInventoryItem(itemId, quantity);
                        
                        var executionTime = (DateTime.Now - startTime).TotalMilliseconds;
                        return new CloudCodeResult(success, success ? "" : "Insufficient inventory", 
                            new Dictionary<string, object> { { "itemId", itemId }, { "quantity", quantity } }, 
                            (long)executionTime);
                    }
                    else
                    {
                        var executionTime = (DateTime.Now - startTime).TotalMilliseconds;
                        return new CloudCodeResult(false, "Economy manager not found", null, (long)executionTime);
                    }
                }
                catch (Exception e)
                {
                    var executionTime = (DateTime.Now - startTime).TotalMilliseconds;
                    return new CloudCodeResult(false, e.Message, null, (long)executionTime);
                }
            }, "Use/consume inventory item");
            
            // Register GetPlayerData function
            RegisterFunction("GetPlayerData", async (parameters) =>
            {
                var startTime = DateTime.Now;
                
                try
                {
                    var authManager = FindObjectOfType<Evergreen.Authentication.LocalAuthenticationManager>();
                    if (authManager != null && authManager.IsAuthenticated)
                    {
                        var playerData = authManager.GetPlayerData();
                        var executionTime = (DateTime.Now - startTime).TotalMilliseconds;
                        return new CloudCodeResult(true, "", playerData, (long)executionTime);
                    }
                    else
                    {
                        var executionTime = (DateTime.Now - startTime).TotalMilliseconds;
                        return new CloudCodeResult(false, "Player not authenticated", null, (long)executionTime);
                    }
                }
                catch (Exception e)
                {
                    var executionTime = (DateTime.Now - startTime).TotalMilliseconds;
                    return new CloudCodeResult(false, e.Message, null, (long)executionTime);
                }
            }, "Get player data");
            
            // Register TrackEvent function
            RegisterFunction("TrackEvent", async (parameters) =>
            {
                var startTime = DateTime.Now;
                
                try
                {
                    if (!parameters.ContainsKey("eventName"))
                    {
                        return new CloudCodeResult(false, "Missing required parameter: eventName");
                    }
                    
                    string eventName = parameters["eventName"].ToString();
                    var eventParameters = new Dictionary<string, object>();
                    
                    // Extract event parameters
                    foreach (var kvp in parameters)
                    {
                        if (kvp.Key != "eventName")
                        {
                            eventParameters[kvp.Key] = kvp.Value;
                        }
                    }
                    
                    // Track the event
                    var analyticsManager = FindObjectOfType<Evergreen.Analytics.LocalAnalyticsManager>();
                    if (analyticsManager != null)
                    {
                        analyticsManager.TrackEvent(eventName, eventParameters);
                    }
                    
                    var executionTime = (DateTime.Now - startTime).TotalMilliseconds;
                    return new CloudCodeResult(true, "", 
                        new Dictionary<string, object> { { "eventName", eventName } }, 
                        (long)executionTime);
                }
                catch (Exception e)
                {
                    var executionTime = (DateTime.Now - startTime).TotalMilliseconds;
                    return new CloudCodeResult(false, e.Message, null, (long)executionTime);
                }
            }, "Track analytics event");
        }
        
        public void RegisterFunction(string functionName, System.Func<Dictionary<string, object>, Task<CloudCodeResult>> function, string description = "", float timeout = 30f)
        {
            if (string.IsNullOrEmpty(functionName) || function == null)
            {
                Debug.LogError("Invalid function name or function delegate");
                return;
            }
            
            _functions[functionName] = new CloudCodeFunction(functionName, function, description, timeout);
            
            if (enableDebugLogs)
                Debug.Log($"Registered Cloud Code function: {functionName}");
        }
        
        public async Task<CloudCodeResult> CallFunction(string functionName, Dictionary<string, object> parameters = null)
        {
            if (!_isInitialized)
            {
                return new CloudCodeResult(false, "Cloud Code manager not initialized");
            }
            
            if (!_functions.ContainsKey(functionName))
            {
                return new CloudCodeResult(false, $"Function '{functionName}' not found");
            }
            
            try
            {
                var function = _functions[functionName];
                var startTime = DateTime.Now;
                
                if (enableDebugLogs)
                    Debug.Log($"Calling Cloud Code function: {functionName}");
                
                // Execute function with timeout
                var task = function.function(parameters ?? new Dictionary<string, object>());
                var timeoutTask = Task.Delay(TimeSpan.FromSeconds(function.timeout));
                
                var completedTask = await Task.WhenAny(task, timeoutTask);
                
                if (completedTask == timeoutTask)
                {
                    return new CloudCodeResult(false, $"Function '{functionName}' timed out after {function.timeout} seconds");
                }
                
                var result = await task;
                OnFunctionExecuted?.Invoke(functionName, result.success);
                
                if (enableDebugLogs)
                {
                    Debug.Log($"Cloud Code function '{functionName}' executed: {(result.success ? "Success" : "Failed")}");
                }
                
                return result;
            }
            catch (Exception e)
            {
                Debug.LogError($"Error calling Cloud Code function '{functionName}': {e.Message}");
                return new CloudCodeResult(false, e.Message);
            }
        }
        
        public List<string> GetAvailableFunctions()
        {
            return new List<string>(_functions.Keys);
        }
        
        public CloudCodeFunction GetFunctionInfo(string functionName)
        {
            return _functions.ContainsKey(functionName) ? _functions[functionName] : null;
        }
        
        public Dictionary<string, object> GetCloudCodeStatus()
        {
            return new Dictionary<string, object>
            {
                {"is_initialized", _isInitialized},
                {"functions_count", _functions.Count},
                {"available_functions", GetAvailableFunctions()},
                {"enable_local_cloud_code", enableLocalCloudCode}
            };
        }
    }
}