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
        private IAdAdapter _adapter;

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
            SelectAdapter();
        }

        private void SelectVariant()
        {
            // very simple assignment A/B; could use playerId hash for sticky bucketing
            _variant = Random.value < 0.5f ? "A" : "B";
        }

        public void Preload(string placement){ Debug.Log($"Preload {placement}"); }
        public void ShowRewarded(string placement){ if (_adapter!=null){ _adapter.ShowRewarded(placement); } else { Debug.Log($"Show RV {placement} v={_variant}"); } }
        public void ShowInterstitial(string placement){ if (_adapter!=null){ _adapter.ShowInterstitial(placement); } else { Debug.Log($"Show INT {placement} v={_variant}"); } }

        private void SelectAdapter()
        {
            // Choose between MAX and LevelPlay based on remote config; default none
            try
            {
                var mediation = _config != null && _config.ContainsKey("config") ? _config["config"] as Dictionary<string, object> : _config;
                var provider = mediation != null && mediation.ContainsKey("provider") ? mediation["provider"].ToString() : "";
#if MAX_SDK
                if (provider.ToUpper().Contains("MAX")) { _adapter = new MaxAdapter(); _adapter.Initialize(mediation); return; }
#endif
#if LEVELPLAY_SDK
                if (provider.ToUpper().Contains("LEVEL") || provider.ToUpper().Contains("IRONSOURCE")) { _adapter = new LevelPlayAdapter(); _adapter.Initialize(mediation); return; }
#endif
            }
            catch {}
            _adapter = null;
        }
    }
}
