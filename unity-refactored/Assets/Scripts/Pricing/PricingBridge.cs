using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;

namespace Evergreen.Pricing
{
    public class PricingBridge : MonoBehaviour
    {
        public static PricingBridge Instance { get; private set; }

        [Header("Server Settings")]
        public string serverBaseUrl = "http://localhost:3030";
        public string authToken;
        public string country = "US";
        public string currency = "USD";

        private Dictionary<string, object> _tiers;

        private void Awake()
        {
            if (Instance != null) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void Refresh(){ StartCoroutine(CoRefresh()); }

        private System.Collections.IEnumerator CoRefresh()
        {
            var url = string.Format("{0}/api/monetization/pricing?country={1}&currency={2}", serverBaseUrl.TrimEnd('/'), country, currency);
            using (var req = UnityWebRequest.Get(url))
            {
                if (!string.IsNullOrEmpty(authToken)) req.SetRequestHeader("Authorization", "Bearer " + authToken);
                yield return req.SendWebRequest();
                if (req.result != UnityWebRequest.Result.Success) yield break;
                try
                {
                    var json = Evergreen.Game.MiniJSON.Json.Deserialize(req.downloadHandler.text) as Dictionary<string, object>;
                    _tiers = json;
                }
                catch {}
            }
        }

        public bool TryGetPrice(string sku, out decimal amount, out string currencyCode)
        {
            amount = 0m; currencyCode = currency;
            try
            {
                var tiers = _tiers["tiers"] as List<object>;
                foreach (var t in tiers)
                {
                    var tier = t as Dictionary<string, object>;
                    if (tier["sku"].ToString() == sku)
                    {
                        var price = tier["price"] as Dictionary<string, object>;
                        amount = Convert.ToDecimal(price["amount"]);
                        currencyCode = price["currency"].ToString();
                        return true;
                    }
                }
            }
            catch {}
            return false;
        }
    }
}
