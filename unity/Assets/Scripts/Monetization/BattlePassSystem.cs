using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;

namespace Evergreen.Monetization
{
    public class BattlePassSystem : MonoBehaviour
    {
        public static BattlePassSystem Instance { get; private set; }

        [Header("Server Settings")]
        public string serverBaseUrl = "http://localhost:3030";
        public string authToken;

        [Header("Progress"))]
        public int currentXp;
        public int currentLevel;
        public bool hasPremium;

        private Dictionary<string, object> _config;

        private void Awake()
        {
            if (Instance != null) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void RefreshConfig() { StartCoroutine(CoRefreshConfig()); }

        private System.Collections.IEnumerator CoRefreshConfig()
        {
            var url = serverBaseUrl.TrimEnd('/') + "/api/battlepass/config";
            using (var req = UnityWebRequest.Get(url))
            {
                if (!string.IsNullOrEmpty(authToken)) req.SetRequestHeader("Authorization", "Bearer " + authToken);
                yield return req.SendWebRequest();
                if (req.result != UnityWebRequest.Result.Success) yield break;
                try
                {
                    _config = Evergreen.Game.MiniJSON.Json.Deserialize(req.downloadHandler.text) as Dictionary<string, object>;
                }
                catch { }
            }
        }

        public int GetXpForEvent(string evt)
        {
            try
            {
                var pass = _config["pass"] as Dictionary<string, object>;
                var xpEv = pass["xpEvents"] as Dictionary<string, object>;
                if (xpEv != null && xpEv.ContainsKey(evt)) return Convert.ToInt32(xpEv[evt]);
            }
            catch { }
            return 0;
        }

        public void AddXp(string source)
        {
            int add = GetXpForEvent(source);
            if (add <= 0) return;
            currentXp += add;
            RecomputeLevel();
        }

        private void RecomputeLevel()
        {
            try
            {
                var pass = _config["pass"] as Dictionary<string, object>;
                var tiers = pass["tiers"] as List<object>;
                int best = 0;
                foreach (var t in tiers)
                {
                    var tier = t as Dictionary<string, object>;
                    int lvl = Convert.ToInt32(tier["level"]);
                    int need = Convert.ToInt32(tier["xp"]);
                    if (currentXp >= need && lvl > best) best = lvl;
                }
                currentLevel = best;
            }
            catch { }
        }
    }
}
