using System.Collections.Generic;using UnityEngine;using System.IO;

namespace Evergreen.LiveOps
{
    public static class EventRotation
    {
        public static Dictionary<string, object> LoadRotation()
        {
            var path = Path.Combine(Application.dataPath, "config/rotation.json");
            if (!File.Exists(path)) return new Dictionary<string, object>();
            var txt = File.ReadAllText(path);
            return MiniJSON.Json.Deserialize(txt) as Dictionary<string, object>;
        }

        public static Dictionary<string, object> GetEventToday()
        {
            var rot = LoadRotation();
            if (rot == null) return new Dictionary<string, object>();
            if (!rot.TryGetValue("events", out var evsObj)) return new Dictionary<string, object>();
            var evs = evsObj as List<object>; if (evs == null || evs.Count == 0) return new Dictionary<string, object>();
            var idx = (int)(System.DateTimeOffset.UtcNow.ToUnixTimeSeconds() / 86400) % evs.Count;
            return evs[idx] as Dictionary<string, object> ?? new Dictionary<string, object>();
        }
    }
}
