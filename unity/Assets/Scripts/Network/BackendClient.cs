using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace Evergreen.Game
{
    public class BackendClient : MonoBehaviour
    {
        public static BackendClient Instance { get; private set; }

        private void Awake()
        {
            if (Instance != null) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public IEnumerator Login(string baseUrl, string playerId, string password, Action<string> onToken)
        {
            var url = TrimSlash(baseUrl) + "/api/auth/login";
            var payload = string.Format("{\"playerId\":\"{0}\",\"password\":\"{1}\"}", Escape(playerId), Escape(password));
            using (var req = new UnityWebRequest(url, UnityWebRequest.kHttpVerbPOST))
            {
                req.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(payload));
                req.downloadHandler = new DownloadHandlerBuffer();
                req.SetRequestHeader("Content-Type", "application/json");
                yield return req.SendWebRequest();
                if (req.result == UnityWebRequest.Result.Success)
                {
                    try
                    {
                        var json = MiniJSON.Json.Deserialize(req.downloadHandler.text) as System.Collections.Generic.Dictionary<string, object>;
                        if (json != null && json.ContainsKey("token"))
                        {
                            onToken?.Invoke(json["token"].ToString());
                            yield break;
                        }
                    }
                    catch {}
                }
                onToken?.Invoke(null);
            }
        }

        public IEnumerator Get(string url, string token, Action<bool, string> onDone)
        {
            using (var req = UnityWebRequest.Get(url))
            {
                if (!string.IsNullOrEmpty(token)) req.SetRequestHeader("Authorization", "Bearer " + token);
                yield return req.SendWebRequest();
                onDone?.Invoke(req.result == UnityWebRequest.Result.Success, req.downloadHandler.text);
            }
        }

        public IEnumerator PostJson(string url, string jsonBody, string token, Action<bool, string> onDone)
        {
            using (var req = new UnityWebRequest(url, UnityWebRequest.kHttpVerbPOST))
            {
                req.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(jsonBody ?? "{}"));
                req.downloadHandler = new DownloadHandlerBuffer();
                req.SetRequestHeader("Content-Type", "application/json");
                if (!string.IsNullOrEmpty(token)) req.SetRequestHeader("Authorization", "Bearer " + token);
                yield return req.SendWebRequest();
                onDone?.Invoke(req.result == UnityWebRequest.Result.Success, req.downloadHandler.text);
            }
        }

        private static string TrimSlash(string s) => s.EndsWith("/") ? s.Substring(0, s.Length - 1) : s;
        private static string Escape(string s) => (s ?? string.Empty).Replace("\"", "\\\"");
    }
}
