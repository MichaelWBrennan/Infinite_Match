#if UNITY_IOS
using Unity.Advertisement.IosSupport;
#endif
using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

namespace Evergreen.Privacy
{
    public class ConsentManager : MonoBehaviour
    {
        public static ConsentManager Instance { get; private set; }

        [Header("Server Settings")]
        public string serverBaseUrl = "http://localhost:3030";
        public string userId = "dev_player";
        public string authToken = null;

        private const string KEY_ADS_ALLOWED = "consent_adsAllowed";
        private const string KEY_NPA = "consent_npa";

        private void Awake()
        {
            if (Instance != null) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void RequestConsent()
        {
            StartCoroutine(CoRequestConsent());
        }

        private IEnumerator CoRequestConsent()
        {
#if UNITY_IOS
            var status = ATTrackingStatusBinding.GetAuthorizationTrackingStatus();
            if (status == ATTrackingStatusBinding.AuthorizationTrackingStatus.NOT_DETERMINED)
            {
                ATTrackingStatusBinding.RequestAuthorizationTracking();
            }
#endif
            // Simple default: allow ads, npa=0 unless kid mode
            int adsAllowed = PlayerPrefs.GetInt(KEY_ADS_ALLOWED, 1);
            int npa = PlayerPrefs.GetInt(KEY_NPA, 0);
            yield return CoSyncConsent(adsAllowed == 1, npa == 1);
        }

        public void SetConsent(bool adsAllowed, bool nonPersonalizedAds)
        {
            PlayerPrefs.SetInt(KEY_ADS_ALLOWED, adsAllowed ? 1 : 0);
            PlayerPrefs.SetInt(KEY_NPA, nonPersonalizedAds ? 1 : 0);
            PlayerPrefs.Save();
            StartCoroutine(CoSyncConsent(adsAllowed, nonPersonalizedAds));
        }

        private IEnumerator CoSyncConsent(bool adsAllowed, bool nonPersonalized)
        {
            var url = serverBaseUrl.TrimEnd('/') + "/api/consent/set";
            var body = new System.Collections.Generic.Dictionary<string, object>{
                {"userId", userId}, {"adsAllowed", adsAllowed}, {"npa", nonPersonalized}
            };
            var json = Evergreen.Game.MiniJSON.Json.Serialize(body);
            using (var req = new UnityWebRequest(url, UnityWebRequest.kHttpVerbPOST))
            {
                var bytes = System.Text.Encoding.UTF8.GetBytes(json);
                req.uploadHandler = new UploadHandlerRaw(bytes);
                req.downloadHandler = new DownloadHandlerBuffer();
                req.SetRequestHeader("Content-Type", "application/json");
                if (!string.IsNullOrEmpty(authToken)) req.SetRequestHeader("Authorization", "Bearer " + authToken);
                yield return req.SendWebRequest();
            }
        }

        public static bool AdsAllowed() => PlayerPrefs.GetInt(KEY_ADS_ALLOWED, 1) == 1;
        public static bool UseNPA() => PlayerPrefs.GetInt(KEY_NPA, 0) == 1;
    }
}
