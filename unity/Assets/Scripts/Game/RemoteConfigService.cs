using System.Collections.Generic;using UnityEngine;using System.IO;

namespace Evergreen.Game
{
    public static class RemoteConfigService
    {
        private static Dictionary<string, object> _cache;
        public static void Load()
        {
            var path = Path.Combine(Application.dataPath, "config/remote_overrides.json");
            if (File.Exists(path))
            {
                var txt = File.ReadAllText(path);
                _cache = MiniJSON.Json.Deserialize(txt) as Dictionary<string, object>;
            }
            else _cache = new Dictionary<string, object>();
        }
        public static T Get<T>(string key, T def)
        {
            if (_cache == null) Load();
            if (_cache.TryGetValue(key, out var v)) return (T)System.Convert.ChangeType(v, typeof(T));
            return def;
        }
    }
}
