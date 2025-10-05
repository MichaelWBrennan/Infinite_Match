using System;
using System.Collections.Generic;
using UnityEngine;

namespace Evergreen.Data
{
    /// <summary>
    /// Enhanced JSON utility with error handling and fallback support
    /// </summary>
    public static class JsonUtility
    {
        /// <summary>
        /// Safely deserialize JSON with error handling
        /// </summary>
        public static T FromJson<T>(string json) where T : class
        {
            if (string.IsNullOrEmpty(json))
            {
                Debug.LogWarning("Attempting to deserialize null or empty JSON");
                return null;
            }

            try
            {
                return UnityEngine.JsonUtility.FromJson<T>(json);
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to deserialize JSON: {e.Message}\nJSON: {json}");
                return null;
            }
        }

        /// <summary>
        /// Safely serialize object to JSON with error handling
        /// </summary>
        public static string ToJson(object obj, bool prettyPrint = false)
        {
            if (obj == null)
            {
                Debug.LogWarning("Attempting to serialize null object");
                return "{}";
            }

            try
            {
                return UnityEngine.JsonUtility.ToJson(obj, prettyPrint);
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to serialize object to JSON: {e.Message}\nObject: {obj}");
                return "{}";
            }
        }

        /// <summary>
        /// Deserialize JSON to Dictionary with error handling
        /// </summary>
        public static Dictionary<string, object> FromJsonToDictionary(string json)
        {
            if (string.IsNullOrEmpty(json))
            {
                return new Dictionary<string, object>();
            }

            try
            {
                // Use MiniJSON as fallback for complex dictionaries
                return MiniJSON.Json.Deserialize(json) as Dictionary<string, object> ?? new Dictionary<string, object>();
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to deserialize JSON to Dictionary: {e.Message}\nJSON: {json}");
                return new Dictionary<string, object>();
            }
        }

        /// <summary>
        /// Serialize Dictionary to JSON with error handling
        /// </summary>
        public static string DictionaryToJson(Dictionary<string, object> dictionary)
        {
            if (dictionary == null)
            {
                return "{}";
            }

            try
            {
                return MiniJSON.Json.Serialize(dictionary);
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to serialize Dictionary to JSON: {e.Message}");
                return "{}";
            }
        }

        /// <summary>
        /// Validate JSON string format
        /// </summary>
        public static bool IsValidJson(string json)
        {
            if (string.IsNullOrEmpty(json))
                return false;

            try
            {
                MiniJSON.Json.Deserialize(json);
                return true;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Safe file read with JSON validation
        /// </summary>
        public static T LoadFromFile<T>(string filePath) where T : class
        {
            try
            {
                if (!System.IO.File.Exists(filePath))
                {
                    Debug.LogWarning($"File not found: {filePath}");
                    return null;
                }

                string json = System.IO.File.ReadAllText(filePath);
                return FromJson<T>(json);
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to load JSON from file {filePath}: {e.Message}");
                return null;
            }
        }

        /// <summary>
        /// Safe file write with JSON validation
        /// </summary>
        public static bool SaveToFile<T>(T obj, string filePath, bool prettyPrint = false)
        {
            try
            {
                string json = ToJson(obj, prettyPrint);
                if (string.IsNullOrEmpty(json) || json == "{}")
                {
                    Debug.LogWarning($"Empty JSON generated for object: {typeof(T).Name}");
                    return false;
                }

                System.IO.File.WriteAllText(filePath, json);
                return true;
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to save JSON to file {filePath}: {e.Message}");
                return false;
            }
        }
    }
}