using System;
using System.Collections.Generic;
using System.Text;

namespace Evergreen.Core
{
    /// <summary>
    /// SIMPLE JSON PARSER
    /// Lightweight JSON parser to replace Newtonsoft.Json dependency
    /// Supports basic JSON operations needed for platform profiles
    /// </summary>
    public static class SimpleJSON
    {
        public static JObject Parse(string json)
        {
            return new JObject(json);
        }
        
        public static string Stringify(JObject obj)
        {
            return obj.ToString();
        }
    }
    
    public class JObject
    {
        private Dictionary<string, object> _data = new Dictionary<string, object>();
        private string _jsonString;
        
        public JObject(string json)
        {
            _jsonString = json;
            ParseJson(json);
        }
        
        public JObject()
        {
        }
        
        public object this[string key]
        {
            get
            {
                if (_data.ContainsKey(key))
                    return _data[key];
                return null;
            }
            set
            {
                _data[key] = value;
            }
        }
        
        public bool ContainsKey(string key)
        {
            return _data.ContainsKey(key);
        }
        
        public JObject GetObject(string key)
        {
            if (_data.ContainsKey(key) && _data[key] is JObject)
                return _data[key] as JObject;
            return null;
        }
        
        public string GetString(string key)
        {
            if (_data.ContainsKey(key))
                return _data[key].ToString();
            return null;
        }
        
        public bool GetBool(string key)
        {
            if (_data.ContainsKey(key))
            {
                if (bool.TryParse(_data[key].ToString(), out bool result))
                    return result;
            }
            return false;
        }
        
        public int GetInt(string key)
        {
            if (_data.ContainsKey(key))
            {
                if (int.TryParse(_data[key].ToString(), out int result))
                    return result;
            }
            return 0;
        }
        
        public JArray GetArray(string key)
        {
            if (_data.ContainsKey(key) && _data[key] is JArray)
                return _data[key] as JArray;
            return null;
        }
        
        public void SetString(string key, string value)
        {
            _data[key] = value;
        }
        
        public void SetBool(string key, bool value)
        {
            _data[key] = value;
        }
        
        public void SetInt(string key, int value)
        {
            _data[key] = value;
        }
        
        public void SetObject(string key, JObject value)
        {
            _data[key] = value;
        }
        
        public void SetArray(string key, JArray value)
        {
            _data[key] = value;
        }
        
        private void ParseJson(string json)
        {
            json = json.Trim();
            if (json.StartsWith("{") && json.EndsWith("}"))
            {
                json = json.Substring(1, json.Length - 2);
                ParseObject(json);
            }
        }
        
        private void ParseObject(string json)
        {
            int braceCount = 0;
            int bracketCount = 0;
            bool inString = false;
            bool escapeNext = false;
            int start = 0;
            
            for (int i = 0; i < json.Length; i++)
            {
                char c = json[i];
                
                if (escapeNext)
                {
                    escapeNext = false;
                    continue;
                }
                
                if (c == '\\')
                {
                    escapeNext = true;
                    continue;
                }
                
                if (c == '"')
                {
                    inString = !inString;
                    continue;
                }
                
                if (!inString)
                {
                    if (c == '{') braceCount++;
                    else if (c == '}') braceCount--;
                    else if (c == '[') bracketCount++;
                    else if (c == ']') bracketCount--;
                    else if (c == ',' && braceCount == 0 && bracketCount == 0)
                    {
                        ParseKeyValue(json.Substring(start, i - start));
                        start = i + 1;
                    }
                }
            }
            
            if (start < json.Length)
            {
                ParseKeyValue(json.Substring(start));
            }
        }
        
        private void ParseKeyValue(string kv)
        {
            kv = kv.Trim();
            if (string.IsNullOrEmpty(kv)) return;
            
            int colonIndex = kv.IndexOf(':');
            if (colonIndex == -1) return;
            
            string key = kv.Substring(0, colonIndex).Trim();
            string value = kv.Substring(colonIndex + 1).Trim();
            
            // Remove quotes from key
            if (key.StartsWith("\"") && key.EndsWith("\""))
                key = key.Substring(1, key.Length - 2);
            
            // Parse value
            if (value.StartsWith("\"") && value.EndsWith("\""))
            {
                // String value
                _data[key] = value.Substring(1, value.Length - 2);
            }
            else if (value == "true")
            {
                _data[key] = true;
            }
            else if (value == "false")
            {
                _data[key] = false;
            }
            else if (value == "null")
            {
                _data[key] = null;
            }
            else if (value.StartsWith("{") && value.EndsWith("}"))
            {
                // Object value
                _data[key] = new JObject(value);
            }
            else if (value.StartsWith("[") && value.EndsWith("]"))
            {
                // Array value
                _data[key] = new JArray(value);
            }
            else if (int.TryParse(value, out int intValue))
            {
                _data[key] = intValue;
            }
            else if (float.TryParse(value, out float floatValue))
            {
                _data[key] = floatValue;
            }
            else
            {
                _data[key] = value;
            }
        }
        
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("{");
            
            bool first = true;
            foreach (var kvp in _data)
            {
                if (!first) sb.Append(",");
                sb.Append($"\"{kvp.Key}\":");
                
                if (kvp.Value is string)
                {
                    sb.Append($"\"{kvp.Value}\"");
                }
                else if (kvp.Value is bool)
                {
                    sb.Append(kvp.Value.ToString().ToLower());
                }
                else if (kvp.Value is JObject)
                {
                    sb.Append(kvp.Value.ToString());
                }
                else if (kvp.Value is JArray)
                {
                    sb.Append(kvp.Value.ToString());
                }
                else if (kvp.Value == null)
                {
                    sb.Append("null");
                }
                else
                {
                    sb.Append(kvp.Value.ToString());
                }
                
                first = false;
            }
            
            sb.Append("}");
            return sb.ToString();
        }
    }
    
    public class JArray
    {
        private List<object> _items = new List<object>();
        
        public JArray(string json)
        {
            json = json.Trim();
            if (json.StartsWith("[") && json.EndsWith("]"))
            {
                json = json.Substring(1, json.Length - 2);
                ParseArray(json);
            }
        }
        
        public JArray()
        {
        }
        
        public object this[int index]
        {
            get
            {
                if (index >= 0 && index < _items.Count)
                    return _items[index];
                return null;
            }
            set
            {
                if (index >= 0 && index < _items.Count)
                    _items[index] = value;
            }
        }
        
        public int Count => _items.Count;
        
        public void Add(object item)
        {
            _items.Add(item);
        }
        
        public string GetString(int index)
        {
            if (index >= 0 && index < _items.Count)
                return _items[index].ToString();
            return null;
        }
        
        public bool GetBool(int index)
        {
            if (index >= 0 && index < _items.Count)
            {
                if (bool.TryParse(_items[index].ToString(), out bool result))
                    return result;
            }
            return false;
        }
        
        public int GetInt(int index)
        {
            if (index >= 0 && index < _items.Count)
            {
                if (int.TryParse(_items[index].ToString(), out int result))
                    return result;
            }
            return 0;
        }
        
        private void ParseArray(string json)
        {
            if (string.IsNullOrEmpty(json)) return;
            
            int braceCount = 0;
            int bracketCount = 0;
            bool inString = false;
            bool escapeNext = false;
            int start = 0;
            
            for (int i = 0; i < json.Length; i++)
            {
                char c = json[i];
                
                if (escapeNext)
                {
                    escapeNext = false;
                    continue;
                }
                
                if (c == '\\')
                {
                    escapeNext = true;
                    continue;
                }
                
                if (c == '"')
                {
                    inString = !inString;
                    continue;
                }
                
                if (!inString)
                {
                    if (c == '{') braceCount++;
                    else if (c == '}') braceCount--;
                    else if (c == '[') bracketCount++;
                    else if (c == ']') bracketCount--;
                    else if (c == ',' && braceCount == 0 && bracketCount == 0)
                    {
                        ParseItem(json.Substring(start, i - start));
                        start = i + 1;
                    }
                }
            }
            
            if (start < json.Length)
            {
                ParseItem(json.Substring(start));
            }
        }
        
        private void ParseItem(string item)
        {
            item = item.Trim();
            if (string.IsNullOrEmpty(item)) return;
            
            if (item.StartsWith("\"") && item.EndsWith("\""))
            {
                _items.Add(item.Substring(1, item.Length - 2));
            }
            else if (item == "true")
            {
                _items.Add(true);
            }
            else if (item == "false")
            {
                _items.Add(false);
            }
            else if (item == "null")
            {
                _items.Add(null);
            }
            else if (item.StartsWith("{") && item.EndsWith("}"))
            {
                _items.Add(new JObject(item));
            }
            else if (item.StartsWith("[") && item.EndsWith("]"))
            {
                _items.Add(new JArray(item));
            }
            else if (int.TryParse(item, out int intValue))
            {
                _items.Add(intValue);
            }
            else if (float.TryParse(item, out float floatValue))
            {
                _items.Add(floatValue);
            }
            else
            {
                _items.Add(item);
            }
        }
        
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("[");
            
            for (int i = 0; i < _items.Count; i++)
            {
                if (i > 0) sb.Append(",");
                
                if (_items[i] is string)
                {
                    sb.Append($"\"{_items[i]}\"");
                }
                else if (_items[i] is bool)
                {
                    sb.Append(_items[i].ToString().ToLower());
                }
                else if (_items[i] is JObject || _items[i] is JArray)
                {
                    sb.Append(_items[i].ToString());
                }
                else if (_items[i] == null)
                {
                    sb.Append("null");
                }
                else
                {
                    sb.Append(_items[i].ToString());
                }
            }
            
            sb.Append("]");
            return sb.ToString();
        }
    }
}
