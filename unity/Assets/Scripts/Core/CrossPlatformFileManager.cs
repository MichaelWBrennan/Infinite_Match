using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System;
using System.Threading.Tasks;
using System.IO;
using UnityEngine.Networking;

namespace Evergreen.Core
{
    /// <summary>
    /// CROSS-PLATFORM FILE MANAGER
    /// Provides platform-specific file operations while maintaining WebGL compatibility
    /// Automatically adapts file handling based on platform capabilities
    /// </summary>
    public static class CrossPlatformFileManager
    {
        public enum FileLocation
        {
            StreamingAssets,
            PersistentData,
            DataPath,
            Resources,
            WebGLIndexedDB
        }
        
        public enum FileType
        {
            Text,
            Binary,
            JSON,
            CSV,
            Config
        }
        
        /// <summary>
        /// Reads a text file with platform-specific implementation
        /// </summary>
        public static async Task<string> ReadTextFileAsync(string fileName, FileLocation location = FileLocation.StreamingAssets, string subDirectory = "")
        {
            try
            {
                string filePath = GetFilePath(fileName, location, subDirectory);
                
                if (string.IsNullOrEmpty(filePath))
                {
                    Debug.LogError($"[CrossPlatformFileManager] Invalid file path for: {fileName}");
                    return null;
                }
                
                #if UNITY_WEBGL && !UNITY_EDITOR
                return await ReadFileWebGL(filePath);
                #else
                return await ReadFileDesktop(filePath);
                #endif
            }
            catch (Exception e)
            {
                Debug.LogError($"[CrossPlatformFileManager] Error reading file {fileName}: {e.Message}");
                return null;
            }
        }
        
        /// <summary>
        /// Writes a text file with platform-specific implementation
        /// </summary>
        public static async Task<bool> WriteTextFileAsync(string fileName, string content, FileLocation location = FileLocation.PersistentData, string subDirectory = "")
        {
            try
            {
                string filePath = GetFilePath(fileName, location, subDirectory);
                
                if (string.IsNullOrEmpty(filePath))
                {
                    Debug.LogError($"[CrossPlatformFileManager] Invalid file path for: {fileName}");
                    return false;
                }
                
                #if UNITY_WEBGL && !UNITY_EDITOR
                return await WriteFileWebGL(filePath, content);
                #else
                return await WriteFileDesktop(filePath, content);
                #endif
            }
            catch (Exception e)
            {
                Debug.LogError($"[CrossPlatformFileManager] Error writing file {fileName}: {e.Message}");
                return false;
            }
        }
        
        /// <summary>
        /// Checks if a file exists with platform-specific implementation
        /// </summary>
        public static bool FileExists(string fileName, FileLocation location = FileLocation.StreamingAssets, string subDirectory = "")
        {
            try
            {
                string filePath = GetFilePath(fileName, location, subDirectory);
                
                if (string.IsNullOrEmpty(filePath))
                {
                    return false;
                }
                
                #if UNITY_WEBGL && !UNITY_EDITOR
                return FileExistsWebGL(filePath);
                #else
                return File.Exists(filePath);
                #endif
            }
            catch (Exception e)
            {
                Debug.LogError($"[CrossPlatformFileManager] Error checking file existence {fileName}: {e.Message}");
                return false;
            }
        }
        
        /// <summary>
        /// Gets the appropriate file path for the platform and location
        /// </summary>
        private static string GetFilePath(string fileName, FileLocation location, string subDirectory)
        {
            string basePath = "";
            string fullPath = "";
            
            switch (location)
            {
                case FileLocation.StreamingAssets:
                    basePath = Application.streamingAssetsPath;
                    break;
                case FileLocation.PersistentData:
                    basePath = Application.persistentDataPath;
                    break;
                case FileLocation.DataPath:
                    basePath = Application.dataPath;
                    break;
                case FileLocation.Resources:
                    basePath = "Assets/Resources";
                    break;
                case FileLocation.WebGLIndexedDB:
                    basePath = "WebGLIndexedDB";
                    break;
            }
            
            if (string.IsNullOrEmpty(subDirectory))
            {
                fullPath = Path.Combine(basePath, fileName);
            }
            else
            {
                fullPath = Path.Combine(basePath, subDirectory, fileName);
            }
            
            return fullPath;
        }
        
        // WebGL-specific implementations
        
        #if UNITY_WEBGL && !UNITY_EDITOR
        private static async Task<string> ReadFileWebGL(string filePath)
        {
            try
            {
                // For StreamingAssets, use UnityWebRequest
                if (filePath.Contains(Application.streamingAssetsPath))
                {
                    using (var request = UnityWebRequest.Get(filePath))
                    {
                        var operation = request.SendWebRequest();
                        
                        while (!operation.isDone)
                        {
                            await Task.Yield();
                        }
                        
                        if (request.result == UnityWebRequest.Result.Success)
                        {
                            return request.downloadHandler.text;
                        }
                        else
                        {
                            Debug.LogError($"[CrossPlatformFileManager] WebGL read error: {request.error}");
                            return null;
                        }
                    }
                }
                // For other locations, use PlayerPrefs or IndexedDB
                else
                {
                    return ReadFromWebGLStorage(filePath);
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[CrossPlatformFileManager] WebGL read error: {e.Message}");
                return null;
            }
        }
        
        private static async Task<bool> WriteFileWebGL(string filePath, string content)
        {
            try
            {
                // For small files, use PlayerPrefs
                if (content.Length < 1000)
                {
                    string key = GetWebGLStorageKey(filePath);
                    PlayerPrefs.SetString(key, content);
                    PlayerPrefs.Save();
                    return true;
                }
                // For larger files, use IndexedDB
                else
                {
                    return await WriteToWebGLIndexedDB(filePath, content);
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[CrossPlatformFileManager] WebGL write error: {e.Message}");
                return false;
            }
        }
        
        private static bool FileExistsWebGL(string filePath)
        {
            try
            {
                // For StreamingAssets, we can't check existence easily
                if (filePath.Contains(Application.streamingAssetsPath))
                {
                    return true; // Assume it exists, let read handle the error
                }
                // For other locations, check PlayerPrefs
                else
                {
                    string key = GetWebGLStorageKey(filePath);
                    return PlayerPrefs.HasKey(key);
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[CrossPlatformFileManager] WebGL exists check error: {e.Message}");
                return false;
            }
        }
        
        private static string ReadFromWebGLStorage(string filePath)
        {
            string key = GetWebGLStorageKey(filePath);
            return PlayerPrefs.GetString(key, "");
        }
        
        private static async Task<bool> WriteToWebGLIndexedDB(string filePath, string content)
        {
            // This would call a JavaScript plugin for IndexedDB
            // For now, we'll use a fallback to PlayerPrefs with chunking
            try
            {
                string key = GetWebGLStorageKey(filePath);
                
                // Split large content into chunks
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
                return true;
            }
            catch (Exception e)
            {
                Debug.LogError($"[CrossPlatformFileManager] WebGL IndexedDB write error: {e.Message}");
                return false;
            }
        }
        
        private static string GetWebGLStorageKey(string filePath)
        {
            // Convert file path to a valid PlayerPrefs key
            return filePath.Replace("/", "_").Replace("\\", "_").Replace(":", "_");
        }
        #endif
        
        // Desktop/Mobile/Console implementations
        
        #if !UNITY_WEBGL || UNITY_EDITOR
        private static async Task<string> ReadFileDesktop(string filePath)
        {
            try
            {
                if (File.Exists(filePath))
                {
                    return await File.ReadAllTextAsync(filePath);
                }
                else
                {
                    Debug.LogWarning($"[CrossPlatformFileManager] File not found: {filePath}");
                    return null;
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[CrossPlatformFileManager] Desktop read error: {e.Message}");
                return null;
            }
        }
        
        private static async Task<bool> WriteFileDesktop(string filePath, string content)
        {
            try
            {
                // Ensure directory exists
                string directory = Path.GetDirectoryName(filePath);
                if (!Directory.Exists(directory))
                {
                    Directory.CreateDirectory(directory);
                }
                
                await File.WriteAllTextAsync(filePath, content);
                return true;
            }
            catch (Exception e)
            {
                Debug.LogError($"[CrossPlatformFileManager] Desktop write error: {e.Message}");
                return false;
            }
        }
        #endif
        
        // Synchronous methods for backward compatibility
        
        public static string ReadTextFile(string fileName, FileLocation location = FileLocation.StreamingAssets, string subDirectory = "")
        {
            // Use coroutine for synchronous behavior
            var task = ReadTextFileAsync(fileName, location, subDirectory);
            task.Wait();
            return task.Result;
        }
        
        public static bool WriteTextFile(string fileName, string content, FileLocation location = FileLocation.PersistentData, string subDirectory = "")
        {
            // Use coroutine for synchronous behavior
            var task = WriteTextFileAsync(fileName, content, location, subDirectory);
            task.Wait();
            return task.Result;
        }
        
        // Utility methods
        
        public static string GetStreamingAssetsPath(string fileName, string subDirectory = "")
        {
            return GetFilePath(fileName, FileLocation.StreamingAssets, subDirectory);
        }
        
        public static string GetPersistentDataPath(string fileName, string subDirectory = "")
        {
            return GetFilePath(fileName, FileLocation.PersistentData, subDirectory);
        }
        
        public static string GetDataPath(string fileName, string subDirectory = "")
        {
            return GetFilePath(fileName, FileLocation.DataPath, subDirectory);
        }
        
        public static string GetResourcesPath(string fileName, string subDirectory = "")
        {
            return GetFilePath(fileName, FileLocation.Resources, subDirectory);
        }
        
        // Platform detection
        
        public static bool IsWebGL()
        {
            #if UNITY_WEBGL && !UNITY_EDITOR
            return true;
            #else
            return false;
            #endif
        }
        
        public static bool IsMobile()
        {
            #if UNITY_ANDROID || UNITY_IOS
            return true;
            #else
            return false;
            #endif
        }
        
        public static bool IsDesktop()
        {
            #if UNITY_STANDALONE_WIN || UNITY_STANDALONE_OSX || UNITY_STANDALONE_LINUX
            return true;
            #else
            return false;
            #endif
        }
        
        public static bool IsConsole()
        {
            #if UNITY_PS4 || UNITY_PS5 || UNITY_XBOXONE || UNITY_SWITCH
            return true;
            #else
            return false;
            #endif
        }
    }
}
