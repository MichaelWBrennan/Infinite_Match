using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Threading.Tasks;
using Evergreen.Core;

namespace Evergreen.Core
{
    /// <summary>
    /// WEBGL COMPATIBILITY LAYER
    /// Provides WebGL-compatible alternatives for all platform-specific features
    /// Automatically detects WebGL and provides fallbacks for threading, file I/O, etc.
    /// </summary>
    public static class WebGLCompatibilityLayer
    {
        private static bool _isWebGL = false;
        private static bool _isInitialized = false;
        
        public static bool IsWebGL => _isWebGL;
        
        public static void Initialize()
        {
            if (_isInitialized) return;
            
            #if UNITY_WEBGL && !UNITY_EDITOR
            _isWebGL = true;
            Debug.Log("🌐 WebGL Compatibility Layer: WebGL detected, enabling compatibility mode");
            #else
            _isWebGL = false;
            Debug.Log("🚀 WebGL Compatibility Layer: Desktop/Mobile detected, enabling full performance mode");
            #endif
            
            _isInitialized = true;
        }
        
        // Threading alternatives
        
        public static void RunInBackground(Action action)
        {
            if (_isWebGL)
            {
                // WebGL: Use coroutine
                if (Application.isPlaying)
                {
                    var go = new GameObject("WebGLBackgroundTask");
                    var runner = go.AddComponent<WebGLBackgroundTaskRunner>();
                    runner.RunTask(action);
                }
            }
            else
            {
                // Desktop/Mobile: Use threading
                Task.Run(action);
            }
        }
        
        public static async Task RunInBackgroundAsync(Action action)
        {
            if (_isWebGL)
            {
                // WebGL: Use async/await with yield
                await Task.Yield();
                action?.Invoke();
            }
            else
            {
                // Desktop/Mobile: Use threading
                await Task.Run(action);
            }
        }
        
        // File I/O alternatives
        
        public static async Task<string> ReadFileAsync(string filePath)
        {
            if (_isWebGL)
            {
                // WebGL: Use UnityWebRequest
                return await ReadFileWebGL(filePath);
            }
            else
            {
                // Desktop/Mobile: Use System.IO
                return await ReadFileDesktop(filePath);
            }
        }
        
        public static async Task WriteFileAsync(string filePath, string content)
        {
            if (_isWebGL)
            {
                // WebGL: Use PlayerPrefs or IndexedDB
                await WriteFileWebGL(filePath, content);
            }
            else
            {
                // Desktop/Mobile: Use System.IO
                await WriteFileDesktop(filePath, content);
            }
        }
        
        // Performance alternatives
        
        public static void OptimizePerformance()
        {
            if (_isWebGL)
            {
                // WebGL: Use coroutine-based optimization
                OptimizePerformanceWebGL();
            }
            else
            {
                // Desktop/Mobile: Use threading-based optimization
                OptimizePerformanceDesktop();
            }
        }
        
        // WebGL-specific implementations
        
        private static async Task<string> ReadFileWebGL(string filePath)
        {
            try
            {
                using (var request = UnityEngine.Networking.UnityWebRequest.Get(filePath))
                {
                    var operation = request.SendWebRequest();
                    
                    while (!operation.isDone)
                    {
                        await Task.Yield();
                    }
                    
                    if (request.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                    {
                        return request.downloadHandler.text;
                    }
                    else
                    {
                        Debug.LogError($"WebGL file read error: {request.error}");
                        return null;
                    }
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"WebGL file read error: {e.Message}");
                return null;
            }
        }
        
        private static async Task WriteFileWebGL(string filePath, string content)
        {
            try
            {
                // Use PlayerPrefs for small files
                if (content.Length < 1000)
                {
                    string key = GetWebGLStorageKey(filePath);
                    PlayerPrefs.SetString(key, content);
                    PlayerPrefs.Save();
                }
                else
                {
                    // Use IndexedDB for large files (would need JavaScript plugin)
                    await WriteToIndexedDB(filePath, content);
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"WebGL file write error: {e.Message}");
            }
        }
        
        private static async Task WriteToIndexedDB(string filePath, string content)
        {
            // This would call a JavaScript plugin for IndexedDB
            // For now, we'll use a fallback to PlayerPrefs with chunking
            await Task.Yield();
            
            string key = GetWebGLStorageKey(filePath);
            int chunkSize = 1000;
            int chunkCount = (content.Length + chunkSize - 1) / chunkSize;
            
            PlayerPrefs.SetInt(key + "_chunks", chunkCount);
            
            for (int i = 0; i < chunkCount; i++)
            {
                int start = i * chunkSize;
                int length = Math.Min(chunkSize, content.Length - start);
                string chunk = content.Substring(start, length);
                PlayerPrefs.SetString(key + "_chunk_" + i, chunk);
            }
            
            PlayerPrefs.Save();
        }
        
        private static string GetWebGLStorageKey(string filePath)
        {
            return filePath.Replace("/", "_").Replace("\\", "_").Replace(":", "_");
        }
        
        private static void OptimizePerformanceWebGL()
        {
            // WebGL-safe performance optimization
            if (Application.isPlaying)
            {
                var go = new GameObject("WebGLPerformanceOptimizer");
                var optimizer = go.AddComponent<WebGLPerformanceOptimizer>();
                optimizer.Optimize();
            }
        }
        
        private static void OptimizePerformanceDesktop()
        {
            // Desktop performance optimization
            Task.Run(() =>
            {
                // CPU optimization
                System.GC.Collect();
                
                // Memory optimization
                System.GC.WaitForPendingFinalizers();
                System.GC.Collect();
            });
        }
        
        // Utility methods
        
        public static bool SupportsThreading()
        {
            return !_isWebGL;
        }
        
        public static bool SupportsFileIO()
        {
            return !_isWebGL;
        }
        
        public static bool SupportsSIMD()
        {
            return !_isWebGL;
        }
        
        public static int GetMaxWorkerThreads()
        {
            return _isWebGL ? 1 : Environment.ProcessorCount;
        }
        
        public static string GetPlatformName()
        {
            return _isWebGL ? "WebGL" : Application.platform.ToString();
        }
    }
    
    /// <summary>
    /// WebGL background task runner using coroutines
    /// </summary>
    public class WebGLBackgroundTaskRunner : MonoBehaviour
    {
        public void RunTask(Action task)
        {
            StartCoroutine(RunTaskCoroutine(task));
        }
        
        private IEnumerator RunTaskCoroutine(Action task)
        {
            yield return null; // Wait one frame
            task?.Invoke();
            Destroy(gameObject);
        }
    }
    
    /// <summary>
    /// WebGL performance optimizer using coroutines
    /// </summary>
    public class WebGLPerformanceOptimizer : MonoBehaviour
    {
        public void Optimize()
        {
            StartCoroutine(OptimizeCoroutine());
        }
        
        private IEnumerator OptimizeCoroutine()
        {
            // Optimize in chunks to avoid blocking
            for (int i = 0; i < 10; i++)
            {
                // Lightweight optimization
                System.GC.Collect();
                yield return null; // Yield every frame
            }
            
            Destroy(gameObject);
        }
    }
}
