using System;
using System.Collections.Generic;
using UnityEngine;
using System.IO;

namespace Evergreen.Core
{
    /// <summary>
    /// Enhanced logging system with different log levels and file output
    /// </summary>
    public static class Logger
    {
        public enum LogLevel
        {
            Debug = 0,
            Info = 1,
            Warning = 2,
            Error = 3,
            Critical = 4
        }

        private static LogLevel _currentLogLevel = LogLevel.Info;
        private static bool _enableFileLogging = true;
        private static bool _enableConsoleLogging = true;
        private static string _logFilePath;
        private static readonly Queue<string> _logQueue = new Queue<string>();
        private static readonly object _lockObject = new object();

        static Logger()
        {
            _logFilePath = Path.Combine(Application.persistentDataPath, "game_logs.txt");
            
            // Clean up old logs on startup
            CleanupOldLogs();
        }

        public static void SetLogLevel(LogLevel level)
        {
            _currentLogLevel = level;
        }

        public static void SetFileLogging(bool enable)
        {
            _enableFileLogging = enable;
        }

        public static void SetConsoleLogging(bool enable)
        {
            _enableConsoleLogging = enable;
        }

        public static void Debug(string message, string category = "Debug")
        {
            Log(LogLevel.Debug, message, category);
        }

        public static void Info(string message, string category = "Info")
        {
            Log(LogLevel.Info, message, category);
        }

        public static void Warning(string message, string category = "Warning")
        {
            Log(LogLevel.Warning, message, category);
        }

        public static void Error(string message, string category = "Error")
        {
            Log(LogLevel.Error, message, category);
        }

        public static void Critical(string message, string category = "Critical")
        {
            Log(LogLevel.Critical, message, category);
        }

        public static void Log(LogLevel level, string message, string category = "General")
        {
            if (level < _currentLogLevel) return;

            var timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff");
            var logEntry = $"[{timestamp}] [{level}] [{category}] {message}";

            if (_enableConsoleLogging)
            {
                switch (level)
                {
                    case LogLevel.Debug:
                        UnityEngine.Debug.Log(logEntry);
                        break;
                    case LogLevel.Info:
                        UnityEngine.Debug.Log(logEntry);
                        break;
                    case LogLevel.Warning:
                        UnityEngine.Debug.LogWarning(logEntry);
                        break;
                    case LogLevel.Error:
                        UnityEngine.Debug.LogError(logEntry);
                        break;
                    case LogLevel.Critical:
                        UnityEngine.Debug.LogError($"CRITICAL: {logEntry}");
                        break;
                }
            }

            if (_enableFileLogging)
            {
                lock (_lockObject)
                {
                    _logQueue.Enqueue(logEntry);
                    
                    // Flush logs periodically
                    if (_logQueue.Count >= 10)
                    {
                        FlushLogs();
                    }
                }
            }
        }

        public static void LogException(Exception exception, string category = "Exception")
        {
            var message = $"Exception: {exception.Message}\nStack Trace: {exception.StackTrace}";
            Error(message, category);
        }

        public static void LogPerformance(string operation, float duration, string category = "Performance")
        {
            var message = $"Operation '{operation}' took {duration:F3}ms";
            if (duration > 100f)
            {
                Warning(message, category);
            }
            else
            {
                Info(message, category);
            }
        }

        public static void LogMemoryUsage(string category = "Memory")
        {
            var memory = GC.GetTotalMemory(false) / 1024f / 1024f;
            Info($"Memory usage: {memory:F2} MB", category);
        }

        private static void FlushLogs()
        {
            if (!_enableFileLogging) return;

            try
            {
                var logsToWrite = new List<string>();
                
                lock (_lockObject)
                {
                    while (_logQueue.Count > 0)
                    {
                        logsToWrite.Add(_logQueue.Dequeue());
                    }
                }

                if (logsToWrite.Count > 0)
                {
                    File.AppendAllLines(_logFilePath, logsToWrite);
                }
            }
            catch (Exception e)
            {
                UnityEngine.Debug.LogError($"Failed to write logs to file: {e.Message}");
            }
        }

        private static void CleanupOldLogs()
        {
            try
            {
                if (File.Exists(_logFilePath))
                {
                    var fileInfo = new FileInfo(_logFilePath);
                    if (fileInfo.Length > 10 * 1024 * 1024) // 10MB
                    {
                        File.Delete(_logFilePath);
                        Info("Cleaned up old log file", "Logger");
                    }
                }
            }
            catch (Exception e)
            {
                UnityEngine.Debug.LogError($"Failed to cleanup old logs: {e.Message}");
            }
        }

        public static void Flush()
        {
            FlushLogs();
        }

        public static string GetLogFilePath()
        {
            return _logFilePath;
        }

        public static int GetQueuedLogCount()
        {
            lock (_lockObject)
            {
                return _logQueue.Count;
            }
        }
    }

    /// <summary>
    /// Performance profiler for measuring execution time
    /// </summary>
    public class PerformanceProfiler : IDisposable
    {
        private readonly string _operation;
        private readonly string _category;
        private readonly System.Diagnostics.Stopwatch _stopwatch;

        public PerformanceProfiler(string operation, string category = "Performance")
        {
            _operation = operation;
            _category = category;
            _stopwatch = System.Diagnostics.Stopwatch.StartNew();
        }

        public void Dispose()
        {
            _stopwatch.Stop();
            Logger.LogPerformance(_operation, _stopwatch.ElapsedMilliseconds, _category);
        }
    }

    /// <summary>
    /// Utility class for using the performance profiler with using statements
    /// </summary>
    public static class Profiler
    {
        public static PerformanceProfiler Start(string operation, string category = "Performance")
        {
            return new PerformanceProfiler(operation, category);
        }
    }
}