#if LEVELPLAY_SDK
using System;
using System.Collections.Generic;
using UnityEngine;

namespace Evergreen.Ads
{
    public class LevelPlayAdapter : IAdAdapter
    {
        public void Initialize(Dictionary<string, object> config)
        {
            Debug.Log("[LevelPlay] Initialize with config");
            // TODO: LevelPlay SDK calls
        }
        public void Preload(string placement) { Debug.Log($"[LevelPlay] Preload {placement}"); }
        public void ShowRewarded(string placement, Action onComplete = null)
        {
            Debug.Log($"[LevelPlay] Show RV {placement}");
            onComplete?.Invoke();
        }
        public void ShowInterstitial(string placement) { Debug.Log($"[LevelPlay] Show INT {placement}"); }
    }
}
#endif
