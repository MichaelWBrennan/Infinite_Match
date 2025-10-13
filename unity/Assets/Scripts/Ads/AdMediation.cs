using UnityEngine;
using System.Collections.Generic;

namespace Evergreen.Ads
{
    public class AdMediation : MonoBehaviour
    {
        public static AdMediation Instance { get; private set; }
        [Header("Integration")]
        public AdMediationConfigClient configClient;

        private Dictionary<string, object> _config;
        private string _variant = "A";

        private void Awake()
        {
            if (Instance!=null){ Destroy(gameObject); return;} Instance=this; DontDestroyOnLoad(gameObject);
            if (configClient == null)
            {
                var go = new GameObject("AdMediationConfigClient");
                configClient = go.AddComponent<AdMediationConfigClient>();
                DontDestroyOnLoad(go);
            }
            configClient.OnConfig += OnConfig;
            configClient.Refresh();
        }

        private void OnDestroy()
        {
            if (configClient != null) configClient.OnConfig -= OnConfig;
        }

        private void OnConfig(Dictionary<string, object> cfg)
        {
            _config = cfg != null && cfg.ContainsKey("config") ? cfg["config"] as Dictionary<string, object> : cfg;
            SelectVariant();
            Debug.Log($"[Mediation] Config loaded, variant={_variant}");
        }

        private void SelectVariant()
        {
            // very simple assignment A/B; could use playerId hash for sticky bucketing
            _variant = Random.value < 0.5f ? "A" : "B";
        }

        public void Preload(string placement){ Debug.Log($"Preload {placement}"); }
        public void ShowRewarded(string placement){ Debug.Log($"Show RV {placement} v={_variant}"); }
        public void ShowInterstitial(string placement){ Debug.Log($"Show INT {placement} v={_variant}"); }
    }
}
