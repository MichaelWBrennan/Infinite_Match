using System;
using System.Collections;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

namespace Core
{
    /// <summary>
    /// Robust file manager that handles Unity file reading issues across all platforms
    /// Provides fallback mechanisms and proper error handling for file operations
    /// </summary>
    public static class RobustFileManager
    {
        public enum FileLocation
        {
            StreamingAssets,
            PersistentData,
            DataPath,
            Resources
        }

        public enum FileType
        {
            Text,
            Binary,
            JSON,
            CSV
        }

        /// <summary>
        /// Reads a text file with robust error handling and platform-specific path resolution
        /// </summary>
        /// <param name="fileName">Name of the file to read</param>
        /// <param name="location">Location where the file is stored</param>
        /// <param name="subDirectory">Optional subdirectory within the location</param>
        /// <returns>File content as string, or null if failed</returns>
        public static async Task<string> ReadTextFileAsync(string fileName, FileLocation location = FileLocation.StreamingAssets, string subDirectory = "")
        {
            try
            {
                string filePath = GetFilePath(fileName, location, subDirectory);
                
                if (string.IsNullOrEmpty(filePath))
                {
                    Debug.LogError($"[RobustFileManager] Invalid file path for: {fileName}");
                    return null;
                }

                // Check if file exists
                if (!FileExists(filePath))
                {
                    Debug.LogWarning($"[RobustFileManager] File not found: {filePath}");
                    return await TryFallbackRead(fileName, location, subDirectory);
                }

                // Use UnityWebRequest for StreamingAssets on some platforms
                if (location == FileLocation.StreamingAssets && ShouldUseWebRequest())
                {
                    return await ReadWithWebRequest(filePath);
                }

                // Standard file reading
                return await File.ReadAllTextAsync(filePath, Encoding.UTF8);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[RobustFileManager] Failed to read text file {fileName}: {ex.Message}");
                return await TryFallbackRead(fileName, location, subDirectory);
            }
        }

        /// <summary>
        /// Synchronous version of ReadTextFileAsync for compatibility
        /// </summary>
        public static string ReadTextFile(string fileName, FileLocation location = FileLocation.StreamingAssets, string subDirectory = "")
        {
            try
            {
                string filePath = GetFilePath(fileName, location, subDirectory);
                
                if (string.IsNullOrEmpty(filePath))
                {
                    Debug.LogError($"[RobustFileManager] Invalid file path for: {fileName}");
                    return null;
                }

                if (!FileExists(filePath))
                {
                    Debug.LogWarning($"[RobustFileManager] File not found: {filePath}");
                    return TryFallbackReadSync(fileName, location, subDirectory);
                }

                if (location == FileLocation.StreamingAssets && ShouldUseWebRequest())
                {
                    // For sync calls, we'll use a coroutine or fallback to Resources
                    return TryFallbackReadSync(fileName, location, subDirectory);
                }

                return File.ReadAllText(filePath, Encoding.UTF8);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[RobustFileManager] Failed to read text file {fileName}: {ex.Message}");
                return TryFallbackReadSync(fileName, location, subDirectory);
            }
        }

        /// <summary>
        /// Reads a binary file with robust error handling
        /// </summary>
        public static async Task<byte[]> ReadBinaryFileAsync(string fileName, FileLocation location = FileLocation.StreamingAssets, string subDirectory = "")
        {
            try
            {
                string filePath = GetFilePath(fileName, location, subDirectory);
                
                if (string.IsNullOrEmpty(filePath))
                {
                    Debug.LogError($"[RobustFileManager] Invalid file path for: {fileName}");
                    return null;
                }

                if (!FileExists(filePath))
                {
                    Debug.LogWarning($"[RobustFileManager] File not found: {filePath}");
                    return await TryFallbackReadBinary(fileName, location, subDirectory);
                }

                if (location == FileLocation.StreamingAssets && ShouldUseWebRequest())
                {
                    return await ReadBinaryWithWebRequest(filePath);
                }

                return await File.ReadAllBytesAsync(filePath);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[RobustFileManager] Failed to read binary file {fileName}: {ex.Message}");
                return await TryFallbackReadBinary(fileName, location, subDirectory);
            }
        }

        /// <summary>
        /// Synchronous version of ReadBinaryFileAsync
        /// </summary>
        public static byte[] ReadBinaryFile(string fileName, FileLocation location = FileLocation.StreamingAssets, string subDirectory = "")
        {
            try
            {
                string filePath = GetFilePath(fileName, location, subDirectory);
                
                if (string.IsNullOrEmpty(filePath))
                {
                    Debug.LogError($"[RobustFileManager] Invalid file path for: {fileName}");
                    return null;
                }

                if (!FileExists(filePath))
                {
                    Debug.LogWarning($"[RobustFileManager] File not found: {filePath}");
                    return TryFallbackReadBinarySync(fileName, location, subDirectory);
                }

                if (location == FileLocation.StreamingAssets && ShouldUseWebRequest())
                {
                    return TryFallbackReadBinarySync(fileName, location, subDirectory);
                }

                return File.ReadAllBytes(filePath);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[RobustFileManager] Failed to read binary file {fileName}: {ex.Message}");
                return TryFallbackReadBinarySync(fileName, location, subDirectory);
            }
        }

        /// <summary>
        /// Checks if a file exists with proper path resolution
        /// </summary>
        public static bool FileExists(string fileName, FileLocation location = FileLocation.StreamingAssets, string subDirectory = "")
        {
            try
            {
                string filePath = GetFilePath(fileName, location, subDirectory);
                return !string.IsNullOrEmpty(filePath) && File.Exists(filePath);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[RobustFileManager] Error checking file existence {fileName}: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Gets the full file path for a given file name and location
        /// </summary>
        public static string GetFilePath(string fileName, FileLocation location, string subDirectory = "")
        {
            try
            {
                string basePath = GetBasePath(location);
                if (string.IsNullOrEmpty(basePath))
                {
                    return null;
                }

                string fullPath = string.IsNullOrEmpty(subDirectory) 
                    ? Path.Combine(basePath, fileName)
                    : Path.Combine(basePath, subDirectory, fileName);

                return Path.GetFullPath(fullPath);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[RobustFileManager] Error getting file path for {fileName}: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Gets the base path for a given file location
        /// </summary>
        private static string GetBasePath(FileLocation location)
        {
            switch (location)
            {
                case FileLocation.StreamingAssets:
                    return Application.streamingAssetsPath;
                case FileLocation.PersistentData:
                    return Application.persistentDataPath;
                case FileLocation.DataPath:
                    return Application.dataPath;
                case FileLocation.Resources:
                    return Application.dataPath + "/Resources";
                default:
                    Debug.LogError($"[RobustFileManager] Unknown file location: {location}");
                    return null;
            }
        }

        /// <summary>
        /// Determines if UnityWebRequest should be used for file reading
        /// </summary>
        private static bool ShouldUseWebRequest()
        {
            return Application.platform == RuntimePlatform.WebGLPlayer || 
                   Application.platform == RuntimePlatform.Android;
        }

        /// <summary>
        /// Reads file using UnityWebRequest (for WebGL and Android)
        /// </summary>
        private static async Task<string> ReadWithWebRequest(string filePath)
        {
            try
            {
                using (UnityWebRequest request = UnityWebRequest.Get(filePath))
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
                        Debug.LogError($"[RobustFileManager] WebRequest failed: {request.error}");
                        return null;
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[RobustFileManager] WebRequest exception: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Reads binary file using UnityWebRequest
        /// </summary>
        private static async Task<byte[]> ReadBinaryWithWebRequest(string filePath)
        {
            try
            {
                using (UnityWebRequest request = UnityWebRequest.Get(filePath))
                {
                    var operation = request.SendWebRequest();
                    
                    while (!operation.isDone)
                    {
                        await Task.Yield();
                    }

                    if (request.result == UnityWebRequest.Result.Success)
                    {
                        return request.downloadHandler.data;
                    }
                    else
                    {
                        Debug.LogError($"[RobustFileManager] Binary WebRequest failed: {request.error}");
                        return null;
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[RobustFileManager] Binary WebRequest exception: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Tries to read file from fallback locations
        /// </summary>
        private static async Task<string> TryFallbackRead(string fileName, FileLocation originalLocation, string subDirectory)
        {
            // Try Resources folder as fallback
            if (originalLocation != FileLocation.Resources)
            {
                try
                {
                    string resourcePath = string.IsNullOrEmpty(subDirectory) 
                        ? fileName.Replace(Path.GetExtension(fileName), "")
                        : $"{subDirectory}/{fileName}".Replace(Path.GetExtension(fileName), "");
                    
                    TextAsset textAsset = Resources.Load<TextAsset>(resourcePath);
                    if (textAsset != null)
                    {
                        Debug.Log($"[RobustFileManager] Successfully loaded from Resources: {resourcePath}");
                        return textAsset.text;
                    }
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[RobustFileManager] Resources fallback failed: {ex.Message}");
                }
            }

            // Try other locations
            foreach (FileLocation location in Enum.GetValues(typeof(FileLocation)))
            {
                if (location == originalLocation) continue;

                try
                {
                    string filePath = GetFilePath(fileName, location, subDirectory);
                    if (!string.IsNullOrEmpty(filePath) && File.Exists(filePath))
                    {
                        string content = await File.ReadAllTextAsync(filePath, Encoding.UTF8);
                        if (!string.IsNullOrEmpty(content))
                        {
                            Debug.Log($"[RobustFileManager] Successfully loaded from fallback location {location}: {filePath}");
                            return content;
                        }
                    }
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[RobustFileManager] Fallback to {location} failed: {ex.Message}");
                }
            }

            Debug.LogError($"[RobustFileManager] All fallback attempts failed for: {fileName}");
            return null;
        }

        /// <summary>
        /// Synchronous fallback read
        /// </summary>
        private static string TryFallbackReadSync(string fileName, FileLocation originalLocation, string subDirectory)
        {
            // Try Resources folder as fallback
            if (originalLocation != FileLocation.Resources)
            {
                try
                {
                    string resourcePath = string.IsNullOrEmpty(subDirectory) 
                        ? fileName.Replace(Path.GetExtension(fileName), "")
                        : $"{subDirectory}/{fileName}".Replace(Path.GetExtension(fileName), "");
                    
                    TextAsset textAsset = Resources.Load<TextAsset>(resourcePath);
                    if (textAsset != null)
                    {
                        Debug.Log($"[RobustFileManager] Successfully loaded from Resources: {resourcePath}");
                        return textAsset.text;
                    }
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[RobustFileManager] Resources fallback failed: {ex.Message}");
                }
            }

            // Try other locations
            foreach (FileLocation location in Enum.GetValues(typeof(FileLocation)))
            {
                if (location == originalLocation) continue;

                try
                {
                    string filePath = GetFilePath(fileName, location, subDirectory);
                    if (!string.IsNullOrEmpty(filePath) && File.Exists(filePath))
                    {
                        string content = File.ReadAllText(filePath, Encoding.UTF8);
                        if (!string.IsNullOrEmpty(content))
                        {
                            Debug.Log($"[RobustFileManager] Successfully loaded from fallback location {location}: {filePath}");
                            return content;
                        }
                    }
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[RobustFileManager] Fallback to {location} failed: {ex.Message}");
                }
            }

            Debug.LogError($"[RobustFileManager] All fallback attempts failed for: {fileName}");
            return null;
        }

        /// <summary>
        /// Tries to read binary file from fallback locations
        /// </summary>
        private static async Task<byte[]> TryFallbackReadBinary(string fileName, FileLocation originalLocation, string subDirectory)
        {
            // Try other locations
            foreach (FileLocation location in Enum.GetValues(typeof(FileLocation)))
            {
                if (location == originalLocation) continue;

                try
                {
                    string filePath = GetFilePath(fileName, location, subDirectory);
                    if (!string.IsNullOrEmpty(filePath) && File.Exists(filePath))
                    {
                        byte[] content = await File.ReadAllBytesAsync(filePath);
                        if (content != null && content.Length > 0)
                        {
                            Debug.Log($"[RobustFileManager] Successfully loaded binary from fallback location {location}: {filePath}");
                            return content;
                        }
                    }
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[RobustFileManager] Binary fallback to {location} failed: {ex.Message}");
                }
            }

            Debug.LogError($"[RobustFileManager] All binary fallback attempts failed for: {fileName}");
            return null;
        }

        /// <summary>
        /// Synchronous fallback read for binary files
        /// </summary>
        private static byte[] TryFallbackReadBinarySync(string fileName, FileLocation originalLocation, string subDirectory)
        {
            // Try other locations
            foreach (FileLocation location in Enum.GetValues(typeof(FileLocation)))
            {
                if (location == originalLocation) continue;

                try
                {
                    string filePath = GetFilePath(fileName, location, subDirectory);
                    if (!string.IsNullOrEmpty(filePath) && File.Exists(filePath))
                    {
                        byte[] content = File.ReadAllBytes(filePath);
                        if (content != null && content.Length > 0)
                        {
                            Debug.Log($"[RobustFileManager] Successfully loaded binary from fallback location {location}: {filePath}");
                            return content;
                        }
                    }
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[RobustFileManager] Binary fallback to {location} failed: {ex.Message}");
                }
            }

            Debug.LogError($"[RobustFileManager] All binary fallback attempts failed for: {fileName}");
            return null;
        }

        /// <summary>
        /// Validates file path and ensures directory exists
        /// </summary>
        public static bool EnsureDirectoryExists(string filePath)
        {
            try
            {
                string directory = Path.GetDirectoryName(filePath);
                if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
                {
                    Directory.CreateDirectory(directory);
                    Debug.Log($"[RobustFileManager] Created directory: {directory}");
                }
                return true;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[RobustFileManager] Failed to create directory for {filePath}: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Gets file size in bytes
        /// </summary>
        public static long GetFileSize(string fileName, FileLocation location = FileLocation.StreamingAssets, string subDirectory = "")
        {
            try
            {
                string filePath = GetFilePath(fileName, location, subDirectory);
                if (!string.IsNullOrEmpty(filePath) && File.Exists(filePath))
                {
                    return new FileInfo(filePath).Length;
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[RobustFileManager] Failed to get file size for {fileName}: {ex.Message}");
            }
            return 0;
        }

        /// <summary>
        /// Lists all files in a directory
        /// </summary>
        public static string[] ListFiles(string subDirectory = "", FileLocation location = FileLocation.StreamingAssets, string pattern = "*")
        {
            try
            {
                string basePath = GetBasePath(location);
                if (string.IsNullOrEmpty(basePath))
                {
                    return new string[0];
                }

                string fullPath = string.IsNullOrEmpty(subDirectory) 
                    ? basePath 
                    : Path.Combine(basePath, subDirectory);

                if (Directory.Exists(fullPath))
                {
                    return Directory.GetFiles(fullPath, pattern, SearchOption.TopDirectoryOnly);
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[RobustFileManager] Failed to list files in {subDirectory}: {ex.Message}");
            }
            return new string[0];
        }
        
        #region Migration Helper Methods
        
        /// <summary>
        /// Migrates File.ReadAllText calls to use RobustFileManager
        /// Provides easy-to-use methods that match existing patterns
        /// </summary>
        public static string ReadAllTextSafe(string filePath)
        {
            try
            {
                // Determine location based on path
                FileLocation location = DetermineFileLocation(filePath);
                string fileName = Path.GetFileName(filePath);
                string subDirectory = GetSubDirectory(filePath, location);
                
                return ReadTextFile(fileName, location, subDirectory);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[RobustFileManager] Failed to read file {filePath}: {ex.Message}");
                return null;
            }
        }
        
        /// <summary>
        /// Migrates File.ReadAllBytes calls to use RobustFileManager
        /// </summary>
        public static byte[] ReadAllBytesSafe(string filePath)
        {
            try
            {
                FileLocation location = DetermineFileLocation(filePath);
                string fileName = Path.GetFileName(filePath);
                string subDirectory = GetSubDirectory(filePath, location);
                
                return ReadBinaryFile(fileName, location, subDirectory);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[RobustFileManager] Failed to read binary file {filePath}: {ex.Message}");
                return null;
            }
        }
        
        /// <summary>
        /// Migrates File.Exists calls to use RobustFileManager
        /// </summary>
        public static bool ExistsSafe(string filePath)
        {
            try
            {
                FileLocation location = DetermineFileLocation(filePath);
                string fileName = Path.GetFileName(filePath);
                string subDirectory = GetSubDirectory(filePath, location);
                
                return FileExists(fileName, location, subDirectory);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[RobustFileManager] Failed to check file existence {filePath}: {ex.Message}");
                return false;
            }
        }
        
        /// <summary>
        /// Migrates Directory.GetFiles calls to use RobustFileManager
        /// </summary>
        public static string[] GetFilesSafe(string directoryPath, string searchPattern = "*")
        {
            try
            {
                FileLocation location = DetermineFileLocation(directoryPath);
                string subDirectory = GetSubDirectory(directoryPath, location);
                
                return ListFiles(subDirectory, location, searchPattern);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[RobustFileManager] Failed to list files {directoryPath}: {ex.Message}");
                return new string[0];
            }
        }
        
        /// <summary>
        /// Determines file location based on path
        /// </summary>
        private static FileLocation DetermineFileLocation(string filePath)
        {
            if (string.IsNullOrEmpty(filePath))
                return FileLocation.StreamingAssets;
                
            if (filePath.Contains(Application.streamingAssetsPath))
                return FileLocation.StreamingAssets;
            else if (filePath.Contains(Application.persistentDataPath))
                return FileLocation.PersistentData;
            else if (filePath.Contains(Application.dataPath))
                return FileLocation.DataPath;
            else
                return FileLocation.StreamingAssets; // Default fallback
        }
        
        /// <summary>
        /// Gets subdirectory from full path
        /// </summary>
        private static string GetSubDirectory(string filePath, FileLocation location)
        {
            if (string.IsNullOrEmpty(filePath))
                return "";
                
            string basePath = "";
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
            }
            
            if (string.IsNullOrEmpty(basePath) || !filePath.StartsWith(basePath))
                return "";
                
            string relativePath = filePath.Substring(basePath.Length);
            if (relativePath.StartsWith(Path.DirectorySeparatorChar.ToString()))
                relativePath = relativePath.Substring(1);
                
            string directory = Path.GetDirectoryName(relativePath);
            return directory ?? "";
        }
        
        #endregion
    }
}