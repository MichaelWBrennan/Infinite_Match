#if MAX_SDK
using System;
using System.Collections.Generic;
using UnityEngine;

namespace Evergreen.Ads
{
    public class MaxAdapter : IAdAdapter
    {
        public void Initialize(Dictionary<string, object> config)
        {
            Debug.Log("[MAX] Initialize with config");
            // TODO: MAX SDK calls
        }
        public void Preload(string placement) { Debug.Log($"[MAX] Preload {placement}"); }
        public void ShowRewarded(string placement, Action onComplete = null)
        {
            Debug.Log($"[MAX] Show RV {placement}");
            onComplete?.Invoke();
        }
        public void ShowInterstitial(string placement) { Debug.Log($"[MAX] Show INT {placement}"); }
    }
}
#endif
