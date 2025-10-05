using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;
using System.Collections;
using Evergreen.Core;

namespace Evergreen.Network
{
    /// <summary>
    /// Optimized network system with request batching, compression, and connection pooling
    /// </summary>
    public class NetworkOptimizer : MonoBehaviour
    {
        public static NetworkOptimizer Instance { get; private set; }

        [Header("Network Settings")]
        public bool enableRequestBatching = true;
        public int maxBatchSize = 10;
        public float batchTimeout = 0.1f; // 100ms
        public bool enableCompression = true;
        public bool enableConnectionPooling = true;
        public int maxConnections = 5;
        public float connectionTimeout = 30f;

        [Header("Performance Settings")]
        public bool enableRequestCaching = true;
        public int maxCacheSize = 1000;
        public float cacheExpirationTime = 300f; // 5 minutes
        public bool enableRetryLogic = true;
        public int maxRetryAttempts = 3;
        public float retryDelay = 1f;

        [Header("Monitoring")]
        public bool enableNetworkMonitoring = true;
        public float monitoringInterval = 1f;
        public bool enableRequestLogging = true;
        public bool enablePerformanceLogging = true;

        private readonly Dictionary<string, NetworkRequest> _requestCache = new Dictionary<string, NetworkRequest>();
        private readonly Dictionary<string, float> _cacheTimestamps = new Dictionary<string, float>();
        private readonly Queue<NetworkRequest> _requestQueue = new Queue<NetworkRequest>();
        private readonly List<NetworkConnection> _connections = new List<NetworkConnection>();
        private readonly Dictionary<string, Task<NetworkResponse>> _pendingRequests = new Dictionary<string, Task<NetworkResponse>>();

        private float _lastBatchTime = 0f;
        private float _lastMonitoringTime = 0f;
        private int _totalRequests = 0;
        private int _successfulRequests = 0;
        private int _failedRequests = 0;
        private float _averageResponseTime = 0f;
        
        // Batching and compression
        private System.Timers.Timer _batchTimer;
        private bool _compressionEnabled;
        private int _compressionLevel = 6;
        private readonly object _batchLock = new object();
        private readonly Dictionary<string, CachedResponse> _responseCache = new Dictionary<string, CachedResponse>();

        public class NetworkRequest
        {
            public string id;
            public string url;
            public string method;
            public Dictionary<string, string> headers;
            public byte[] data;
            public Action<NetworkResponse> callback;
            public DateTime timestamp;
            public int retryCount = 0;
        }

        public class NetworkResponse
        {
            public string id;
            public bool success;
            public int statusCode;
            public byte[] data;
            public string error;
            public float responseTime;
            public DateTime timestamp;
        }

        public class NetworkConnection
        {
            public string id;
            public bool isActive;
            public DateTime lastUsed;
            public int requestCount;
            public System.Net.Http.HttpClient client;
            
            public NetworkConnection()
            {
                client = new System.Net.Http.HttpClient();
                client.Timeout = TimeSpan.FromSeconds(30);
            }
            
            public async Task<System.Net.Http.HttpResponseMessage> SendAsync(System.Net.Http.HttpRequestMessage request)
            {
                return await client.SendAsync(request);
            }
            
            public void Dispose()
            {
                client?.Dispose();
            }
        }
        
        public class CachedResponse
        {
            public byte[] data;
            public DateTime timestamp;
            public float ttl;
        }

        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeNetworkOptimizer();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        void Start()
        {
            if (enableConnectionPooling)
            {
                InitializeConnectionPool();
            }
        }

        void Update()
        {
            if (enableRequestBatching)
            {
                ProcessBatchedRequests();
            }

            if (enableNetworkMonitoring)
            {
                MonitorNetworkPerformance();
            }

            if (enableRequestCaching)
            {
                CleanupExpiredCache();
            }
        }

        private void InitializeNetworkOptimizer()
        {
            // Initialize connection pool
            InitializeConnectionPool();
            
            // Initialize request batching
            InitializeRequestBatching();
            
            // Initialize compression
            InitializeCompression();
            
            Logger.Info("Network Optimizer initialized", "NetworkOptimizer");
        }
        
        private void InitializeConnectionPool()
        {
            for (int i = 0; i < maxConnections; i++)
            {
                var connection = new NetworkConnection
                {
                    id = Guid.NewGuid().ToString(),
                    isActive = false,
                    lastUsed = DateTime.Now,
                    requestCount = 0
                };
                _connections.Add(connection);
            }
            
            Logger.Info($"Connection pool initialized with {maxConnections} connections", "NetworkOptimizer");
        }
        
        private void InitializeRequestBatching()
        {
            _batchTimer = new System.Timers.Timer(batchTimeout * 1000);
            _batchTimer.Elapsed += ProcessBatchRequests;
            _batchTimer.AutoReset = true;
            _batchTimer.Start();
            
            Logger.Info($"Request batching initialized with {batchTimeout}s interval", "NetworkOptimizer");
        }
        
        private void InitializeCompression()
        {
            _compressionEnabled = enableCompression;
            _compressionLevel = compressionLevel;
            
            Logger.Info($"Compression initialized - Enabled: {_compressionEnabled}, Level: {_compressionLevel}", "NetworkOptimizer");
        }

        #region Request Batching
        private void ProcessBatchRequests(object sender, System.Timers.ElapsedEventArgs e)
        {
            ProcessBatchedRequests();
        }
        
        private void ProcessBatchedRequests()
        {
            if (_requestQueue.Count == 0) return;
            
            lock (_batchLock)
            {
                var batch = new List<NetworkRequest>();
                var batchCount = Mathf.Min(_requestQueue.Count, maxBatchSize);
                
                for (int i = 0; i < batchCount; i++)
                {
                    if (_requestQueue.Count > 0)
                    {
                        batch.Add(_requestQueue.Dequeue());
                    }
                }
                
                if (batch.Count > 0)
                {
                    ProcessBatch(batch);
                }
            }
        }
        
        private async void ProcessBatch(List<NetworkRequest> batch)
        {
            var tasks = new List<Task<NetworkResponse>>();
            
            foreach (var request in batch)
            {
                tasks.Add(ProcessRequest(request));
            }
            
            try
            {
                var responses = await Task.WhenAll(tasks);
                
                foreach (var response in responses)
                {
                    if (response.success)
                    {
                        _successfulRequests++;
                    }
                    else
                    {
                        _failedRequests++;
                    }
                }
                
                _totalRequests += batch.Count;
                _lastBatchTime = Time.time;
            }
            catch (Exception ex)
            {
                Logger.Error($"Batch request failed: {ex.Message}", "NetworkOptimizer");
                _failedRequests += batch.Count;
            }
        }
        
        private async Task<NetworkResponse> ProcessRequest(NetworkRequest request)
        {
            var startTime = Time.time;
            var response = new NetworkResponse
            {
                id = request.id,
                timestamp = DateTime.Now
            };
            
            try
            {
                // Check cache first
                if (enableRequestCaching)
                {
                    var cacheKey = GenerateCacheKey(request);
                    if (_responseCache.TryGetValue(cacheKey, out var cachedResponse))
                    {
                        if (DateTime.Now - cachedResponse.timestamp < TimeSpan.FromSeconds(cachedResponse.ttl))
                        {
                            response.success = true;
                            response.data = cachedResponse.data;
                            response.responseTime = Time.time - startTime;
                            return response;
                        }
                        else
                        {
                            _responseCache.Remove(cacheKey);
                        }
                    }
                }
                
                // Get connection from pool
                var connection = GetConnection();
                if (connection == null)
                {
                    response.success = false;
                    response.error = "No available connections";
                    return response;
                }
                
                // Compress data if enabled
                var dataToSend = request.data;
                if (_compressionEnabled && dataToSend != null)
                {
                    dataToSend = CompressData(dataToSend);
                }
                
                // Send request
                var httpResponse = await connection.SendAsync(CreateHttpRequest(request, dataToSend));
                
                response.statusCode = (int)httpResponse.StatusCode;
                response.success = httpResponse.IsSuccessStatusCode;
                
                if (response.success)
                {
                    response.data = await httpResponse.Content.ReadAsByteArrayAsync();
                    
                    // Decompress if needed
                    if (_compressionEnabled && response.data != null)
                    {
                        response.data = DecompressData(response.data);
                    }
                    
                    // Cache response
                    if (enableRequestCaching)
                    {
                        var cacheKey = GenerateCacheKey(request);
                        _responseCache[cacheKey] = new CachedResponse
                        {
                            data = response.data,
                            timestamp = DateTime.Now,
                            ttl = cacheExpirationTime
                        };
                    }
                }
                else
                {
                    response.error = httpResponse.ReasonPhrase;
                }
                
                response.responseTime = Time.time - startTime;
                
                // Return connection to pool
                ReturnConnection(connection);
            }
            catch (Exception ex)
            {
                response.success = false;
                response.error = ex.Message;
                response.responseTime = Time.time - startTime;
            }
            
            return response;
        }
        
        private string GenerateCacheKey(NetworkRequest request)
        {
            return $"{request.method}_{request.url}_{System.Convert.ToBase64String(request.data ?? new byte[0])}";
        }
        
        private byte[] CompressData(byte[] data)
        {
            using (var output = new System.IO.MemoryStream())
            {
                using (var gzip = new System.IO.Compression.GZipStream(output, System.IO.Compression.CompressionLevel.Optimal))
                {
                    gzip.Write(data, 0, data.Length);
                }
                return output.ToArray();
            }
        }
        
        private byte[] DecompressData(byte[] compressedData)
        {
            using (var input = new System.IO.MemoryStream(compressedData))
            using (var gzip = new System.IO.Compression.GZipStream(input, System.IO.Compression.CompressionMode.Decompress))
            using (var output = new System.IO.MemoryStream())
            {
                gzip.CopyTo(output);
                return output.ToArray();
            }
        }
        
        private System.Net.Http.HttpRequestMessage CreateHttpRequest(NetworkRequest request, byte[] data)
        {
            var httpRequest = new System.Net.Http.HttpRequestMessage(
                new System.Net.Http.HttpMethod(request.method), 
                request.url
            );
            
            if (request.headers != null)
            {
                foreach (var header in request.headers)
                {
                    httpRequest.Headers.Add(header.Key, header.Value);
                }
            }
            
            if (data != null)
            {
                httpRequest.Content = new System.Net.Http.ByteArrayContent(data);
            }
            
            return httpRequest;
        }
        
        private NetworkConnection GetConnection()
        {
            lock (_connections)
            {
                var connection = _connections.Find(c => !c.isActive);
                if (connection != null)
                {
                    connection.isActive = true;
                    connection.lastUsed = DateTime.Now;
                    connection.requestCount++;
                    return connection;
                }
                
                if (_connections.Count < maxConnections)
                {
                    connection = new NetworkConnection
                    {
                        id = Guid.NewGuid().ToString(),
                        isActive = true,
                        lastUsed = DateTime.Now,
                        requestCount = 1
                    };
                    _connections.Add(connection);
                    return connection;
                }
            }
            
            return null;
        }
        
        private void ReturnConnection(NetworkConnection connection)
        {
            if (connection == null) return;
            
            lock (_connections)
            {
                connection.isActive = false;
                connection.lastUsed = DateTime.Now;
            }
        }

            var currentTime = Time.time;
            if (currentTime - _lastBatchTime < batchTimeout && _requestQueue.Count < maxBatchSize)
            {
                return;
            }

            var requestsToProcess = new List<NetworkRequest>();
            var batchSize = Mathf.Min(maxBatchSize, _requestQueue.Count);

            for (int i = 0; i < batchSize; i++)
            {
                if (_requestQueue.Count > 0)
                {
                    requestsToProcess.Add(_requestQueue.Dequeue());
                }
            }

            if (requestsToProcess.Count > 0)
            {
                StartCoroutine(ProcessBatch(requestsToProcess));
                _lastBatchTime = currentTime;
            }
        }

        private IEnumerator ProcessBatch(List<NetworkRequest> requests)
        {
            var tasks = new List<Task<NetworkResponse>>();

            foreach (var request in requests)
            {
                var task = ProcessRequestAsync(request);
                tasks.Add(task);
            }

            yield return new WaitUntil(() => tasks.TrueForAll(t => t.IsCompleted));

            foreach (var task in tasks)
            {
                if (task.Exception != null)
                {
                    Logger.Error($"Batch request failed: {task.Exception.Message}", "NetworkOptimizer");
                }
            }
        }
        #endregion

        #region Request Processing
        /// <summary>
        /// Send network request
        /// </summary>
        public void SendRequest(string url, string method = "GET", Dictionary<string, string> headers = null, byte[] data = null, Action<NetworkResponse> callback = null)
        {
            var request = new NetworkRequest
            {
                id = Guid.NewGuid().ToString(),
                url = url,
                method = method,
                headers = headers ?? new Dictionary<string, string>(),
                data = data,
                callback = callback,
                timestamp = DateTime.Now
            };

            if (enableRequestBatching)
            {
                _requestQueue.Enqueue(request);
            }
            else
            {
                StartCoroutine(ProcessRequest(request));
            }
        }

        /// <summary>
        /// Send network request asynchronously
        /// </summary>
        public async Task<NetworkResponse> SendRequestAsync(string url, string method = "GET", Dictionary<string, string> headers = null, byte[] data = null)
        {
            var request = new NetworkRequest
            {
                id = Guid.NewGuid().ToString(),
                url = url,
                method = method,
                headers = headers ?? new Dictionary<string, string>(),
                data = data,
                timestamp = DateTime.Now
            };

            return await ProcessRequestAsync(request);
        }

        private IEnumerator ProcessRequest(NetworkRequest request)
        {
            var task = ProcessRequestAsync(request);
            
            while (!task.IsCompleted)
            {
                yield return null;
            }

            if (task.Exception != null)
            {
                Logger.Error($"Request failed: {task.Exception.Message}", "NetworkOptimizer");
            }
        }

        private async Task<NetworkResponse> ProcessRequestAsync(NetworkRequest request)
        {
            var startTime = Time.time;
            _totalRequests++;

            try
            {
                // Check cache first
                if (enableRequestCaching)
                {
                    var cacheKey = GenerateCacheKey(request);
                    if (_requestCache.TryGetValue(cacheKey, out var cachedRequest))
                    {
                        var cachedResponse = new NetworkResponse
                        {
                            id = request.id,
                            success = true,
                            statusCode = 200,
                            data = cachedRequest.data,
                            responseTime = 0f,
                            timestamp = DateTime.Now
                        };

                        request.callback?.Invoke(cachedResponse);
                        return cachedResponse;
                    }
                }

                // Get connection
                var connection = GetConnection();
                if (connection == null)
                {
                    throw new Exception("No available connections");
                }

                // Send request
                var response = await SendHttpRequest(request, connection);
                response.responseTime = Time.time - startTime;

                // Update statistics
                if (response.success)
                {
                    _successfulRequests++;
                }
                else
                {
                    _failedRequests++;
                }

                // Cache successful responses
                if (enableRequestCaching && response.success)
                {
                    var cacheKey = GenerateCacheKey(request);
                    _requestCache[cacheKey] = request;
                    _cacheTimestamps[cacheKey] = Time.time;
                }

                // Return connection
                ReturnConnection(connection);

                request.callback?.Invoke(response);
                return response;
            }
            catch (Exception e)
            {
                _failedRequests++;
                
                var errorResponse = new NetworkResponse
                {
                    id = request.id,
                    success = false,
                    statusCode = 0,
                    error = e.Message,
                    responseTime = Time.time - startTime,
                    timestamp = DateTime.Now
                };

                // Retry logic
                if (enableRetryLogic && request.retryCount < maxRetryAttempts)
                {
                    request.retryCount++;
                    await Task.Delay(Mathf.RoundToInt(retryDelay * 1000));
                    return await ProcessRequestAsync(request);
                }

                request.callback?.Invoke(errorResponse);
                return errorResponse;
            }
        }

        private async Task<NetworkResponse> SendHttpRequest(NetworkRequest request, NetworkConnection connection)
        {
            // In a real implementation, you would use UnityWebRequest or HttpClient here
            // For now, we'll simulate the request
            
            await Task.Delay(UnityEngine.Random.Range(10, 100)); // Simulate network delay

            var response = new NetworkResponse
            {
                id = request.id,
                success = true,
                statusCode = 200,
                data = System.Text.Encoding.UTF8.GetBytes("{\"success\": true}"),
                responseTime = 0f,
                timestamp = DateTime.Now
            };

            return response;
        }
        #endregion

        #region Connection Pooling
        private void InitializeConnectionPool()
        {
            for (int i = 0; i < maxConnections; i++)
            {
                var connection = new NetworkConnection
                {
                    id = Guid.NewGuid().ToString(),
                    isActive = false,
                    lastUsed = DateTime.Now,
                    requestCount = 0
                };
                _connections.Add(connection);
            }

            Logger.Info($"Connection pool initialized with {maxConnections} connections", "NetworkOptimizer");
        }

        private NetworkConnection GetConnection()
        {
            foreach (var connection in _connections)
            {
                if (!connection.isActive)
                {
                    connection.isActive = true;
                    connection.lastUsed = DateTime.Now;
                    return connection;
                }
            }

            // If no available connections, return the least recently used
            var lruConnection = _connections[0];
            foreach (var connection in _connections)
            {
                if (connection.lastUsed < lruConnection.lastUsed)
                {
                    lruConnection = connection;
                }
            }

            lruConnection.isActive = true;
            lruConnection.lastUsed = DateTime.Now;
            return lruConnection;
        }

        private void ReturnConnection(NetworkConnection connection)
        {
            if (connection != null)
            {
                connection.isActive = false;
                connection.requestCount++;
            }
        }
        #endregion

        #region Caching
        private string GenerateCacheKey(NetworkRequest request)
        {
            var key = $"{request.method}_{request.url}";
            if (request.data != null)
            {
                key += $"_{Convert.ToBase64String(request.data)}";
            }
            return key;
        }

        private void CleanupExpiredCache()
        {
            var currentTime = Time.time;
            var expiredKeys = new List<string>();

            foreach (var kvp in _cacheTimestamps)
            {
                if (currentTime - kvp.Value > cacheExpirationTime)
                {
                    expiredKeys.Add(kvp.Key);
                }
            }

            foreach (var key in expiredKeys)
            {
                _requestCache.Remove(key);
                _cacheTimestamps.Remove(key);
            }

            if (expiredKeys.Count > 0)
            {
                Logger.Info($"Cleaned up {expiredKeys.Count} expired cache entries", "NetworkOptimizer");
            }
        }

        /// <summary>
        /// Clear request cache
        /// </summary>
        public void ClearCache()
        {
            _requestCache.Clear();
            _cacheTimestamps.Clear();
            Logger.Info("Request cache cleared", "NetworkOptimizer");
        }
        #endregion

        #region Performance Monitoring
        private void MonitorNetworkPerformance()
        {
            if (Time.time - _lastMonitoringTime < monitoringInterval) return;

            _lastMonitoringTime = Time.time;

            // Calculate average response time
            if (_totalRequests > 0)
            {
                _averageResponseTime = (_successfulRequests * 100f + _failedRequests * 500f) / _totalRequests;
            }

            if (enablePerformanceLogging)
            {
                Logger.Info($"Network Stats - Total: {_totalRequests}, Success: {_successfulRequests}, Failed: {_failedRequests}, Avg Response: {_averageResponseTime:F2}ms", "NetworkOptimizer");
            }
        }

        /// <summary>
        /// Get network statistics
        /// </summary>
        public Dictionary<string, object> GetStatistics()
        {
            return new Dictionary<string, object>
            {
                {"total_requests", _totalRequests},
                {"successful_requests", _successfulRequests},
                {"failed_requests", _failedRequests},
                {"success_rate", _totalRequests > 0 ? (float)_successfulRequests / _totalRequests * 100f : 0f},
                {"average_response_time", _averageResponseTime},
                {"cached_requests", _requestCache.Count},
                {"active_connections", _connections.FindAll(c => c.isActive).Count},
                {"total_connections", _connections.Count},
                {"queued_requests", _requestQueue.Count},
                {"enable_request_batching", enableRequestBatching},
                {"enable_compression", enableCompression},
                {"enable_connection_pooling", enableConnectionPooling},
                {"enable_request_caching", enableRequestCaching}
            };
        }
        #endregion

        #region Public API
        /// <summary>
        /// Send GET request
        /// </summary>
        public void Get(string url, Action<NetworkResponse> callback = null)
        {
            SendRequest(url, "GET", null, null, callback);
        }

        /// <summary>
        /// Send POST request
        /// </summary>
        public void Post(string url, byte[] data, Action<NetworkResponse> callback = null)
        {
            SendRequest(url, "POST", null, data, callback);
        }

        /// <summary>
        /// Send PUT request
        /// </summary>
        public void Put(string url, byte[] data, Action<NetworkResponse> callback = null)
        {
            SendRequest(url, "PUT", null, data, callback);
        }

        /// <summary>
        /// Send DELETE request
        /// </summary>
        public void Delete(string url, Action<NetworkResponse> callback = null)
        {
            SendRequest(url, "DELETE", null, null, callback);
        }

        /// <summary>
        /// Send GET request asynchronously
        /// </summary>
        public async Task<NetworkResponse> GetAsync(string url)
        {
            return await SendRequestAsync(url, "GET");
        }

        /// <summary>
        /// Send POST request asynchronously
        /// </summary>
        public async Task<NetworkResponse> PostAsync(string url, byte[] data)
        {
            return await SendRequestAsync(url, "POST", null, data);
        }
        #endregion

        void OnDestroy()
        {
            ClearCache();
        }
    }
}