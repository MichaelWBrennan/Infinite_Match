using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;

namespace Core
{
    /// <summary>
    /// Helper class to migrate existing file reading code to use RobustFileManager
    /// Provides easy-to-use methods that match existing patterns but use the robust system
    /// </summary>
    public static class FileReadingMigrationHelper
    {
        /// <summary>
        /// Migrates File.ReadAllText calls to use RobustFileManager
        /// </summary>
        public static string ReadAllTextSafe(string filePath)
        {
            try
            {
                // Determine location based on path
                FileLocation location = DetermineFileLocation(filePath);
                string fileName = Path.GetFileName(filePath);
                string subDirectory = GetSubDirectory(filePath, location);
                
                return RobustFileManager.ReadTextFile(fileName, location, subDirectory);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[FileReadingMigrationHelper] Failed to read file {filePath}: {ex.Message}");
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
                
                return RobustFileManager.ReadBinaryFile(fileName, location, subDirectory);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[FileReadingMigrationHelper] Failed to read binary file {filePath}: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Migrates File.ReadAllLines calls to use RobustFileManager
        /// </summary>
        public static string[] ReadAllLinesSafe(string filePath)
        {
            try
            {
                string content = ReadAllTextSafe(filePath);
                if (content != null)
                {
                    return content.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[FileReadingMigrationHelper] Failed to read lines from file {filePath}: {ex.Message}");
            }
            return new string[0];
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
                
                return RobustFileManager.FileExists(fileName, location, subDirectory);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[FileReadingMigrationHelper] Failed to check file existence {filePath}: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Safe version of Path.Combine for Unity file paths
        /// </summary>
        public static string CombinePathSafe(params string[] paths)
        {
            try
            {
                if (paths == null || paths.Length == 0)
                    return string.Empty;

                string result = paths[0];
                for (int i = 1; i < paths.Length; i++)
                {
                    if (!string.IsNullOrEmpty(paths[i]))
                    {
                        result = Path.Combine(result, paths[i]);
                    }
                }
                return result;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[FileReadingMigrationHelper] Failed to combine paths: {ex.Message}");
                return string.Empty;
            }
        }

        /// <summary>
        /// Determines the file location based on the path
        /// </summary>
        private static FileLocation DetermineFileLocation(string filePath)
        {
            if (string.IsNullOrEmpty(filePath))
                return FileLocation.StreamingAssets;

            string normalizedPath = filePath.Replace('\\', '/').ToLower();

            if (normalizedPath.Contains("streamingassets"))
                return FileLocation.StreamingAssets;
            if (normalizedPath.Contains("persistentdata"))
                return FileLocation.PersistentData;
            if (normalizedPath.Contains("resources"))
                return FileLocation.Resources;
            if (normalizedPath.Contains("data"))
                return FileLocation.DataPath;

            // Default to StreamingAssets for most cases
            return FileLocation.StreamingAssets;
        }

        /// <summary>
        /// Extracts subdirectory from file path
        /// </summary>
        private static string GetSubDirectory(string filePath, FileLocation location)
        {
            try
            {
                string basePath = GetBasePathForLocation(location);
                if (string.IsNullOrEmpty(basePath) || !filePath.StartsWith(basePath))
                    return string.Empty;

                string relativePath = filePath.Substring(basePath.Length).TrimStart(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
                string fileName = Path.GetFileName(relativePath);
                string subDirectory = Path.GetDirectoryName(relativePath);

                return subDirectory?.Replace('\\', '/') ?? string.Empty;
            }
            catch
            {
                return string.Empty;
            }
        }

        /// <summary>
        /// Gets base path for a file location
        /// </summary>
        private static string GetBasePathForLocation(FileLocation location)
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
                    return Application.streamingAssetsPath;
            }
        }

        /// <summary>
        /// Creates a safe file path for writing
        /// </summary>
        public static string CreateSafeWritePath(string fileName, FileLocation location = FileLocation.PersistentData, string subDirectory = "")
        {
            try
            {
                string basePath = GetBasePathForLocation(location);
                string fullPath = string.IsNullOrEmpty(subDirectory) 
                    ? Path.Combine(basePath, fileName)
                    : Path.Combine(basePath, subDirectory, fileName);

                // Ensure directory exists
                RobustFileManager.EnsureDirectoryExists(fullPath);
                
                return fullPath;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[FileReadingMigrationHelper] Failed to create safe write path: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Writes text to file safely
        /// </summary>
        public static bool WriteTextSafe(string fileName, string content, FileLocation location = FileLocation.PersistentData, string subDirectory = "")
        {
            try
            {
                string filePath = CreateSafeWritePath(fileName, location, subDirectory);
                if (string.IsNullOrEmpty(filePath))
                    return false;

                File.WriteAllText(filePath, content, System.Text.Encoding.UTF8);
                Debug.Log($"[FileReadingMigrationHelper] Successfully wrote text to: {filePath}");
                return true;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[FileReadingMigrationHelper] Failed to write text file {fileName}: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Writes binary data to file safely
        /// </summary>
        public static bool WriteBinarySafe(string fileName, byte[] data, FileLocation location = FileLocation.PersistentData, string subDirectory = "")
        {
            try
            {
                string filePath = CreateSafeWritePath(fileName, location, subDirectory);
                if (string.IsNullOrEmpty(filePath))
                    return false;

                File.WriteAllBytes(filePath, data);
                Debug.Log($"[FileReadingMigrationHelper] Successfully wrote binary to: {filePath}");
                return true;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[FileReadingMigrationHelper] Failed to write binary file {fileName}: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Gets file information safely
        /// </summary>
        public static FileInfo GetFileInfoSafe(string fileName, FileLocation location = FileLocation.StreamingAssets, string subDirectory = "")
        {
            try
            {
                string filePath = RobustFileManager.GetFilePath(fileName, location, subDirectory);
                if (!string.IsNullOrEmpty(filePath) && File.Exists(filePath))
                {
                    return new FileInfo(filePath);
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[FileReadingMigrationHelper] Failed to get file info for {fileName}: {ex.Message}");
            }
            return null;
        }

        /// <summary>
        /// Lists files in directory safely
        /// </summary>
        public static string[] ListFilesSafe(string subDirectory = "", FileLocation location = FileLocation.StreamingAssets, string pattern = "*")
        {
            try
            {
                return RobustFileManager.ListFiles(subDirectory, location, pattern);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[FileReadingMigrationHelper] Failed to list files in {subDirectory}: {ex.Message}");
                return new string[0];
            }
        }

        /// <summary>
        /// Validates that a file path is safe and accessible
        /// </summary>
        public static bool ValidateFilePath(string filePath, bool checkExistence = true)
        {
            try
            {
                if (string.IsNullOrEmpty(filePath))
                    return false;

                // Check for invalid characters
                char[] invalidChars = Path.GetInvalidPathChars();
                foreach (char c in invalidChars)
                {
                    if (filePath.Contains(c))
                    {
                        Debug.LogError($"[FileReadingMigrationHelper] Invalid character '{c}' in path: {filePath}");
                        return false;
                    }
                }

                // Check if path is too long
                if (filePath.Length > 260) // Windows path limit
                {
                    Debug.LogError($"[FileReadingMigrationHelper] Path too long: {filePath.Length} characters");
                    return false;
                }

                // Check existence if requested
                if (checkExistence && !File.Exists(filePath))
                {
                    Debug.LogWarning($"[FileReadingMigrationHelper] File does not exist: {filePath}");
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[FileReadingMigrationHelper] Failed to validate file path {filePath}: {ex.Message}");
                return false;
            }
        }
    }
}