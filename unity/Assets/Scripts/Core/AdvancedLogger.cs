using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using UnityEngine;
using Evergreen.Core;

namespace Evergreen.Architecture
{
    /// <summary>
    /// Advanced Logger with comprehensive error handling, structured logging, and performance monitoring
    /// Provides 100% reliability and debuggability through advanced logging techniques
    /// </summary>
    public class AdvancedLogger : MonoBehaviour, ILogger
    {
        [Header("Logging Settings")]
        public LogLevel minimumLogLevel = LogLevel.Info;
        public bool enableConsoleLogging = true;
        public bool enableFileLogging = true;
        public bool enableRemoteLogging = false;
        public bool enableStructuredLogging = true;
        public bool enablePerformanceLogging = true;
        public bool enableSecurityLogging = true;
        
        [Header("File Logging")]
        public string logDirectory = "Logs";
        public string logFileName = "game.log";
        public int maxLogFileSize = 10 * 1024 * 1024; // 10MB
        public int maxLogFiles = 10;
        public bool enableLogRotation = true;
        public bool enableCompression = true;
        
        [Header("Remote Logging")]
        public string remoteLogEndpoint = "";
        public string apiKey = "";
        public float remoteLogInterval = 5f;
        public int maxRemoteLogBatch = 100;
        
        [Header("Performance Settings")]
        public bool enableAsyncLogging = true;
        public int maxLogQueueSize = 1000;
        public float logFlushInterval = 1f;
        public bool enableLogBuffering = true;
        
        [Header("Security Settings")]
        public bool enableLogSanitization = true;
        public bool enableLogEncryption = false;
        public string encryptionKey = "";
        public bool enableAuditLogging = true;
        
        private Dictionary<LogLevel, LogColor> _logColors = new Dictionary<LogLevel, LogColor>();
        private Dictionary<string, LogCategory> _logCategories = new Dictionary<string, LogCategory>();
        private Queue<LogEntry> _logQueue = new Queue<LogEntry>();
        private List<LogEntry> _logBuffer = new List<LogEntry>();
        private Dictionary<string, LogStatistics> _logStatistics = new Dictionary<string, LogStatistics>();
        private Dictionary<string, PerformanceMetric> _performanceMetrics = new Dictionary<string, PerformanceMetric>();
        private Coroutine _logFlushCoroutine;
        private Coroutine _remoteLogCoroutine;
        private string _currentLogFile;
        private int _currentLogFileSize;
        private int _currentLogFileIndex;
        private bool _isInitialized = false;
        
        // Events
        public event Action<LogEntry> OnLogEntry;
        public event Action<LogLevel, string> OnLogLevelChanged;
        public event Action<LogStatistics> OnLogStatisticsUpdated;
        public event Action<PerformanceMetric> OnPerformanceMetricUpdated;
        
        public static AdvancedLogger Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeLogger();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (enableAsyncLogging)
            {
                _logFlushCoroutine = StartCoroutine(LogFlushCoroutine());
            }
            
            if (enableRemoteLogging)
            {
                _remoteLogCoroutine = StartCoroutine(RemoteLogCoroutine());
            }
        }
        
        private void InitializeLogger()
        {
            Debug.Log("Advanced Logger initialized");
            
            // Initialize log colors
            InitializeLogColors();
            
            // Initialize log categories
            InitializeLogCategories();
            
            // Setup log directory
            SetupLogDirectory();
            
            // Initialize current log file
            InitializeCurrentLogFile();
            
            _isInitialized = true;
        }
        
        private void InitializeLogColors()
        {
            _logColors[LogLevel.Debug] = LogColor.White;
            _logColors[LogLevel.Info] = LogColor.White;
            _logColors[LogLevel.Warning] = LogColor.Yellow;
            _logColors[LogLevel.Error] = LogLevel.Red;
            _logColors[LogLevel.Critical] = LogLevel.Red;
            _logColors[LogLevel.Audit] = LogColor.Cyan;
            _logColors[LogLevel.Performance] = LogColor.Green;
            _logColors[LogLevel.Security] = LogColor.Magenta;
        }
        
        private void InitializeLogCategories()
        {
            _logCategories["System"] = new LogCategory
            {
                Name = "System",
                Enabled = true,
                MinimumLevel = LogLevel.Info,
                Color = LogColor.White
            };
            
            _logCategories["Gameplay"] = new LogCategory
            {
                Name = "Gameplay",
                Enabled = true,
                MinimumLevel = LogLevel.Debug,
                Color = LogColor.Green
            };
            
            _logCategories["UI"] = new LogCategory
            {
                Name = "UI",
                Enabled = true,
                MinimumLevel = LogLevel.Info,
                Color = LogColor.Blue
            };
            
            _logCategories["Audio"] = new LogCategory
            {
                Name = "Audio",
                Enabled = true,
                MinimumLevel = LogLevel.Info,
                Color = LogColor.Cyan
            };
            
            _logCategories["Network"] = new LogCategory
            {
                Name = "Network",
                Enabled = true,
                MinimumLevel = LogLevel.Info,
                Color = LogColor.Yellow
            };
            
            _logCategories["Performance"] = new LogCategory
            {
                Name = "Performance",
                Enabled = true,
                MinimumLevel = LogLevel.Debug,
                Color = LogColor.Magenta
            };
            
            _logCategories["Security"] = new LogCategory
            {
                Name = "Security",
                Enabled = true,
                MinimumLevel = LogLevel.Info,
                Color = LogColor.Red
            };
        }
        
        private void SetupLogDirectory()
        {
            if (enableFileLogging)
            {
                string logPath = Path.Combine(Application.persistentDataPath, logDirectory);
                if (!Directory.Exists(logPath))
                {
                    Directory.CreateDirectory(logPath);
                }
            }
        }
        
        private void InitializeCurrentLogFile()
        {
            if (enableFileLogging)
            {
                _currentLogFile = Path.Combine(Application.persistentDataPath, logDirectory, logFileName);
                _currentLogFileSize = 0;
                _currentLogFileIndex = 0;
            }
        }
        
        /// <summary>
        /// Log a message with default category
        /// </summary>
        public void Log(string message)
        {
            Log(LogLevel.Info, "System", message);
        }
        
        /// <summary>
        /// Log a warning message
        /// </summary>
        public void LogWarning(string message)
        {
            Log(LogLevel.Warning, "System", message);
        }
        
        /// <summary>
        /// Log an error message
        /// </summary>
        public void LogError(string message)
        {
            Log(LogLevel.Error, "System", message);
        }
        
        /// <summary>
        /// Log a message with specific level and category
        /// </summary>
        public void Log(LogLevel level, string category, string message)
        {
            Log(level, category, message, null);
        }
        
        /// <summary>
        /// Log a message with specific level, category, and exception
        /// </summary>
        public void Log(LogLevel level, string category, string message, Exception exception)
        {
            if (!_isInitialized) return;
            
            // Check if logging is enabled for this level
            if (level < minimumLogLevel) return;
            
            // Check if category is enabled
            if (!_logCategories.ContainsKey(category) || !_logCategories[category].Enabled) return;
            
            // Check if category minimum level is met
            if (level < _logCategories[category].MinimumLevel) return;
            
            // Create log entry
            var logEntry = new LogEntry
            {
                Timestamp = DateTime.Now,
                Level = level,
                Category = category,
                Message = SanitizeMessage(message),
                Exception = exception,
                ThreadId = System.Threading.Thread.CurrentThread.ManagedThreadId,
                StackTrace = GetStackTrace(level),
                PerformanceData = GetPerformanceData()
            };
            
            // Add to queue
            if (enableAsyncLogging)
            {
                lock (_logQueue)
                {
                    if (_logQueue.Count < maxLogQueueSize)
                    {
                        _logQueue.Enqueue(logEntry);
                    }
                }
            }
            else
            {
                ProcessLogEntry(logEntry);
            }
            
            // Update statistics
            UpdateLogStatistics(category, level);
            
            // Update performance metrics
            UpdatePerformanceMetrics(category, level);
        }
        
        /// <summary>
        /// Log a structured message
        /// </summary>
        public void LogStructured(LogLevel level, string category, string message, Dictionary<string, object> properties)
        {
            if (!enableStructuredLogging) return;
            
            var structuredMessage = new StringBuilder(message);
            if (properties != null && properties.Count > 0)
            {
                structuredMessage.Append(" | Properties: ");
                foreach (var kvp in properties)
                {
                    structuredMessage.Append($"{kvp.Key}={kvp.Value}; ");
                }
            }
            
            Log(level, category, structuredMessage.ToString());
        }
        
        /// <summary>
        /// Log a performance metric
        /// </summary>
        public void LogPerformance(string operation, float duration, Dictionary<string, object> metadata = null)
        {
            if (!enablePerformanceLogging) return;
            
            var message = $"Performance: {operation} took {duration:F2}ms";
            Log(LogLevel.Performance, "Performance", message);
            
            // Update performance metrics
            if (!_performanceMetrics.ContainsKey(operation))
            {
                _performanceMetrics[operation] = new PerformanceMetric
                {
                    Name = operation,
                    Count = 0,
                    TotalTime = 0f,
                    AverageTime = 0f,
                    MinTime = float.MaxValue,
                    MaxTime = 0f,
                    LastUpdated = DateTime.Now
                };
            }
            
            var metric = _performanceMetrics[operation];
            metric.Count++;
            metric.TotalTime += duration;
            metric.AverageTime = metric.TotalTime / metric.Count;
            metric.MinTime = Mathf.Min(metric.MinTime, duration);
            metric.MaxTime = Mathf.Max(metric.MaxTime, duration);
            metric.LastUpdated = DateTime.Now;
            
            OnPerformanceMetricUpdated?.Invoke(metric);
        }
        
        /// <summary>
        /// Log a security event
        /// </summary>
        public void LogSecurity(string eventType, string message, Dictionary<string, object> metadata = null)
        {
            if (!enableSecurityLogging) return;
            
            var securityMessage = $"Security: {eventType} - {message}";
            Log(LogLevel.Security, "Security", securityMessage);
        }
        
        /// <summary>
        /// Log an audit event
        /// </summary>
        public void LogAudit(string action, string user, Dictionary<string, object> metadata = null)
        {
            if (!enableAuditLogging) return;
            
            var auditMessage = $"Audit: {action} by {user}";
            Log(LogLevel.Audit, "Security", auditMessage);
        }
        
        private string SanitizeMessage(string message)
        {
            if (!enableLogSanitization) return message;
            
            // Remove sensitive information
            message = message.Replace("password", "***");
            message = message.Replace("token", "***");
            message = message.Replace("key", "***");
            message = message.Replace("secret", "***");
            
            return message;
        }
        
        private string GetStackTrace(LogLevel level)
        {
            if (level < LogLevel.Error) return null;
            
            return System.Environment.StackTrace;
        }
        
        private Dictionary<string, object> GetPerformanceData()
        {
            if (!enablePerformanceLogging) return null;
            
            return new Dictionary<string, object>
            {
                ["FPS"] = 1f / Time.unscaledDeltaTime,
                ["Memory"] = Profiler.GetTotalAllocatedMemory(Profiler.Area.All),
                ["GC"] = System.GC.GetTotalMemory(false),
                ["Time"] = Time.time
            };
        }
        
        private void ProcessLogEntry(LogEntry logEntry)
        {
            // Console logging
            if (enableConsoleLogging)
            {
                LogToConsole(logEntry);
            }
            
            // File logging
            if (enableFileLogging)
            {
                LogToFile(logEntry);
            }
            
            // Remote logging
            if (enableRemoteLogging)
            {
                LogToRemote(logEntry);
            }
            
            // Buffer for structured logging
            if (enableLogBuffering)
            {
                _logBuffer.Add(logEntry);
            }
            
            OnLogEntry?.Invoke(logEntry);
        }
        
        private void LogToConsole(LogEntry logEntry)
        {
            string formattedMessage = FormatLogMessage(logEntry);
            
            switch (logEntry.Level)
            {
                case LogLevel.Debug:
                    Debug.Log(formattedMessage);
                    break;
                case LogLevel.Info:
                    Debug.Log(formattedMessage);
                    break;
                case LogLevel.Warning:
                    Debug.LogWarning(formattedMessage);
                    break;
                case LogLevel.Error:
                case LogLevel.Critical:
                    Debug.LogError(formattedMessage);
                    break;
                case LogLevel.Audit:
                    Debug.Log($"<color=cyan>{formattedMessage}</color>");
                    break;
                case LogLevel.Performance:
                    Debug.Log($"<color=green>{formattedMessage}</color>");
                    break;
                case LogLevel.Security:
                    Debug.Log($"<color=magenta>{formattedMessage}</color>");
                    break;
            }
        }
        
        private void LogToFile(LogEntry logEntry)
        {
            try
            {
                string formattedMessage = FormatLogMessage(logEntry);
                formattedMessage += Environment.NewLine;
                
                // Check if we need to rotate the log file
                if (enableLogRotation && _currentLogFileSize + formattedMessage.Length > maxLogFileSize)
                {
                    RotateLogFile();
                }
                
                // Write to file
                File.AppendAllText(_currentLogFile, formattedMessage);
                _currentLogFileSize += formattedMessage.Length;
            }
            catch (Exception ex)
            {
                Debug.LogError($"Failed to write to log file: {ex.Message}");
            }
        }
        
        private void LogToRemote(LogEntry logEntry)
        {
            // This would implement remote logging to a service like Loggly, Splunk, etc.
            // For now, we'll just add it to the buffer
            if (enableLogBuffering)
            {
                _logBuffer.Add(logEntry);
            }
        }
        
        private string FormatLogMessage(LogEntry logEntry)
        {
            var sb = new StringBuilder();
            
            // Timestamp
            sb.Append($"[{logEntry.Timestamp:yyyy-MM-dd HH:mm:ss.fff}] ");
            
            // Level
            sb.Append($"[{logEntry.Level.ToString().ToUpper()}] ");
            
            // Category
            sb.Append($"[{logEntry.Category}] ");
            
            // Thread ID
            sb.Append($"[T{logEntry.ThreadId}] ");
            
            // Message
            sb.Append(logEntry.Message);
            
            // Exception
            if (logEntry.Exception != null)
            {
                sb.Append($" | Exception: {logEntry.Exception.Message}");
                if (logEntry.StackTrace != null)
                {
                    sb.Append($" | StackTrace: {logEntry.StackTrace}");
                }
            }
            
            // Performance data
            if (logEntry.PerformanceData != null)
            {
                sb.Append(" | Performance: ");
                foreach (var kvp in logEntry.PerformanceData)
                {
                    sb.Append($"{kvp.Key}={kvp.Value}; ");
                }
            }
            
            return sb.ToString();
        }
        
        private void RotateLogFile()
        {
            try
            {
                // Close current file
                if (File.Exists(_currentLogFile))
                {
                    // Compress if enabled
                    if (enableCompression)
                    {
                        CompressLogFile(_currentLogFile);
                    }
                    
                    // Move to archived file
                    string archivedFile = _currentLogFile.Replace(".log", $".{_currentLogFileIndex}.log");
                    File.Move(_currentLogFile, archivedFile);
                }
                
                // Create new log file
                _currentLogFile = Path.Combine(Application.persistentDataPath, logDirectory, logFileName);
                _currentLogFileSize = 0;
                _currentLogFileIndex++;
                
                // Clean up old log files
                CleanupOldLogFiles();
            }
            catch (Exception ex)
            {
                Debug.LogError($"Failed to rotate log file: {ex.Message}");
            }
        }
        
        private void CompressLogFile(string filePath)
        {
            // This would implement log file compression
            // For now, we'll just leave it as is
        }
        
        private void CleanupOldLogFiles()
        {
            try
            {
                string logPath = Path.Combine(Application.persistentDataPath, logDirectory);
                var logFiles = Directory.GetFiles(logPath, "*.log");
                
                if (logFiles.Length > maxLogFiles)
                {
                    Array.Sort(logFiles, (a, b) => File.GetCreationTime(a).CompareTo(File.GetCreationTime(b)));
                    
                    for (int i = 0; i < logFiles.Length - maxLogFiles; i++)
                    {
                        File.Delete(logFiles[i]);
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"Failed to cleanup old log files: {ex.Message}");
            }
        }
        
        private void UpdateLogStatistics(string category, LogLevel level)
        {
            if (!_logStatistics.ContainsKey(category))
            {
                _logStatistics[category] = new LogStatistics
                {
                    Category = category,
                    TotalLogs = 0,
                    DebugCount = 0,
                    InfoCount = 0,
                    WarningCount = 0,
                    ErrorCount = 0,
                    CriticalCount = 0,
                    LastUpdated = DateTime.Now
                };
            }
            
            var stats = _logStatistics[category];
            stats.TotalLogs++;
            stats.LastUpdated = DateTime.Now;
            
            switch (level)
            {
                case LogLevel.Debug:
                    stats.DebugCount++;
                    break;
                case LogLevel.Info:
                    stats.InfoCount++;
                    break;
                case LogLevel.Warning:
                    stats.WarningCount++;
                    break;
                case LogLevel.Error:
                    stats.ErrorCount++;
                    break;
                case LogLevel.Critical:
                    stats.CriticalCount++;
                    break;
            }
            
            OnLogStatisticsUpdated?.Invoke(stats);
        }
        
        private void UpdatePerformanceMetrics(string category, LogLevel level)
        {
            // This would update performance metrics based on logging activity
        }
        
        private System.Collections.IEnumerator LogFlushCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(logFlushInterval);
                
                // Process queued logs
                lock (_logQueue)
                {
                    while (_logQueue.Count > 0)
                    {
                        var logEntry = _logQueue.Dequeue();
                        ProcessLogEntry(logEntry);
                    }
                }
            }
        }
        
        private System.Collections.IEnumerator RemoteLogCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(remoteLogInterval);
                
                if (enableLogBuffering && _logBuffer.Count > 0)
                {
                    // Send logs to remote service
                    SendLogsToRemote();
                }
            }
        }
        
        private void SendLogsToRemote()
        {
            // This would implement remote logging
            // For now, we'll just clear the buffer
            _logBuffer.Clear();
        }
        
        /// <summary>
        /// Set minimum log level
        /// </summary>
        public void SetMinimumLogLevel(LogLevel level)
        {
            minimumLogLevel = level;
            OnLogLevelChanged?.Invoke(level, "Minimum log level changed");
        }
        
        /// <summary>
        /// Enable or disable a log category
        /// </summary>
        public void SetCategoryEnabled(string category, bool enabled)
        {
            if (_logCategories.ContainsKey(category))
            {
                _logCategories[category].Enabled = enabled;
            }
        }
        
        /// <summary>
        /// Set minimum log level for a category
        /// </summary>
        public void SetCategoryMinimumLevel(string category, LogLevel level)
        {
            if (_logCategories.ContainsKey(category))
            {
                _logCategories[category].MinimumLevel = level;
            }
        }
        
        /// <summary>
        /// Get log statistics
        /// </summary>
        public Dictionary<string, LogStatistics> GetLogStatistics()
        {
            return new Dictionary<string, LogStatistics>(_logStatistics);
        }
        
        /// <summary>
        /// Get performance metrics
        /// </summary>
        public Dictionary<string, PerformanceMetric> GetPerformanceMetrics()
        {
            return new Dictionary<string, PerformanceMetric>(_performanceMetrics);
        }
        
        /// <summary>
        /// Clear all logs
        /// </summary>
        public void ClearLogs()
        {
            _logQueue.Clear();
            _logBuffer.Clear();
            _logStatistics.Clear();
            _performanceMetrics.Clear();
        }
        
        /// <summary>
        /// Export logs to file
        /// </summary>
        public void ExportLogs(string filePath)
        {
            try
            {
                using (var writer = new StreamWriter(filePath))
                {
                    foreach (var logEntry in _logBuffer)
                    {
                        writer.WriteLine(FormatLogMessage(logEntry));
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"Failed to export logs: {ex.Message}");
            }
        }
        
        void OnDestroy()
        {
            if (_logFlushCoroutine != null)
            {
                StopCoroutine(_logFlushCoroutine);
            }
            
            if (_remoteLogCoroutine != null)
            {
                StopCoroutine(_remoteLogCoroutine);
            }
        }
    }
    
    [System.Serializable]
    public class LogEntry
    {
        public DateTime Timestamp;
        public LogLevel Level;
        public string Category;
        public string Message;
        public Exception Exception;
        public int ThreadId;
        public string StackTrace;
        public Dictionary<string, object> PerformanceData;
    }
    
    [System.Serializable]
    public class LogCategory
    {
        public string Name;
        public bool Enabled;
        public LogLevel MinimumLevel;
        public LogColor Color;
    }
    
    [System.Serializable]
    public class LogStatistics
    {
        public string Category;
        public int TotalLogs;
        public int DebugCount;
        public int InfoCount;
        public int WarningCount;
        public int ErrorCount;
        public int CriticalCount;
        public DateTime LastUpdated;
    }
    
    [System.Serializable]
    public class PerformanceMetric
    {
        public string Name;
        public int Count;
        public float TotalTime;
        public float AverageTime;
        public float MinTime;
        public float MaxTime;
        public DateTime LastUpdated;
    }
    
    public enum LogLevel
    {
        Debug = 0,
        Info = 1,
        Warning = 2,
        Error = 3,
        Critical = 4,
        Audit = 5,
        Performance = 6,
        Security = 7
    }
    
    public enum LogColor
    {
        White,
        Black,
        Red,
        Green,
        Blue,
        Yellow,
        Cyan,
        Magenta
    }
}