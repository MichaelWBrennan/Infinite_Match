using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace Evergreen.Ads
{
    public class AdMediationConfigClient : MonoBehaviour
    {
        [Header("Server Settings")]
        public string serverBaseUrl = "http://localhost:3030";
        public string playerId = "dev_player";
        public string password = "devpass123"; // dev-only

        public string authToken;
        public Dictionary<string, object> lastConfig;

        public event Action<Dictionary<string, object>> OnConfig;

        public void Refresh()
        {
            StartCoroutine(CoRefresh());
        }

        private IEnumerator CoRefresh()
        {
            // Ensure BackendClient exists
            if (Evergreen.Game.BackendClient.Instance == null)
            {
                var go = new GameObject("BackendClient");
                go.AddComponent<Evergreen.Game.BackendClient>();
            }

            if (string.IsNullOrEmpty(authToken))
            {
                yield return Evergreen.Game.BackendClient.Instance.Login(serverBaseUrl, playerId, password, t => authToken = t);
            }

            var url = serverBaseUrl.TrimEnd('/') + "/api/monetization/ad-config";
            yield return Evergreen.Game.BackendClient.Instance.Get(url, authToken, (ok, body) =>
            {
                if (!ok) { Debug.LogWarning("Ad-config fetch failed"); return; }
                try
                {
                    lastConfig = Evergreen.Game.MiniJSON.Json.Deserialize(body) as Dictionary<string, object>;
                    OnConfig?.Invoke(lastConfig);
                }
                catch (Exception e)
                {
                    Debug.LogWarning("Ad-config parse error: " + e.Message);
                }
            });
        }
    }
}
