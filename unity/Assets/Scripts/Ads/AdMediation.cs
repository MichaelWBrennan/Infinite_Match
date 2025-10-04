using UnityEngine;

namespace Evergreen.Ads
{
    public class AdMediation : MonoBehaviour
    {
        public static AdMediation Instance { get; private set; }
        private void Awake(){ if (Instance!=null){ Destroy(gameObject); return;} Instance=this; DontDestroyOnLoad(gameObject);} 
        public void Preload(string placement){ Debug.Log($"Preload {placement}"); }
        public void ShowRewarded(string placement){ Debug.Log($"Show RV {placement}"); }
        public void ShowInterstitial(string placement){ Debug.Log($"Show INT {placement}"); }
    }
}
