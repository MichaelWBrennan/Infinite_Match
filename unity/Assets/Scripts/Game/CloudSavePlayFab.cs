using System;
using System.Collections;
using System.Text;
using UnityEngine;

namespace Evergreen.Game
{
    public class CloudSavePlayFab : MonoBehaviour
    {
        public static CloudSavePlayFab Instance { get; private set; }
        private void Awake(){ if (Instance!=null){ Destroy(gameObject); return;} Instance=this; DontDestroyOnLoad(gameObject);}        

        public void Load()
        {
#if PLAYFAB_SDK
            var customId = SystemInfo.deviceUniqueIdentifier;
            var req = new PlayFab.ClientModels.LoginWithCustomIDRequest { CustomId = customId, CreateAccount = true };
            PlayFab.PlayFabClientAPI.LoginWithCustomID(req, result =>
            {
                var getReq = new PlayFab.ClientModels.GetUserDataRequest { Keys = new System.Collections.Generic.List<string> { "state", "ts" } };
                PlayFab.PlayFabClientAPI.GetUserData(getReq, r =>
                {
                    if (r.Data != null && r.Data.ContainsKey("state"))
                    {
                        var json = r.Data["state"].Value;
                        // naive apply: overwrite local if remote newer
                        long remoteTs = 0; if (r.Data.ContainsKey("ts")) long.TryParse(r.Data["ts"].Value, out remoteTs);
                        var localTs = GetLocalTimestamp();
                        if (remoteTs >= localTs)
                        {
                            ApplyRemoteState(json);
                        }
                    }
                }, err => Debug.LogWarning($"PlayFab GetUserData failed: {err.GenerateErrorReport()}"));
            }, err => Debug.LogWarning($"PlayFab Login failed: {err.GenerateErrorReport()}"));
#else
            Debug.Log("CloudSave Load (stub)");
#endif
        }

        public void Save()
        {
#if PLAYFAB_SDK
            var stateJson = LoadLocalStateJson();
            var ts = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
            var upd = new PlayFab.ClientModels.UpdateUserDataRequest
            {
                Data = new System.Collections.Generic.Dictionary<string, string>
                {
                    {"state", stateJson},
                    {"ts", ts}
                }
            };
            PlayFab.PlayFabClientAPI.UpdateUserData(upd, _ => { }, err => Debug.LogWarning($"PlayFab UpdateUserData failed: {err.GenerateErrorReport()}"));
#else
            Debug.Log("CloudSave Save (stub)");
#endif
        }

        private long GetLocalTimestamp()
        {
            // store a local ts alongside state if desired; fallback to file write time
            try
            {
                var path = System.IO.Path.Combine(Application.persistentDataPath, "state.json");
                if (System.IO.File.Exists(path))
                {
                    return new System.IO.FileInfo(path).LastWriteTimeUtc.ToFileTimeUtc();
                }
            }
            catch { }
            return 0;
        }

        private string LoadLocalStateJson()
        {
            try
            {
                var data = new GameStateData
                {
                    // expose relevant fields if you want selective sync; or serialize current file
                };
                var path = System.IO.Path.Combine(Application.persistentDataPath, "state.json");
                if (System.IO.File.Exists(path))
                    return System.IO.File.ReadAllText(path);
            }
            catch { }
            return "{}";
        }

        private void ApplyRemoteState(string json)
        {
            try
            {
                var path = System.IO.Path.Combine(Application.persistentDataPath, "state.json");
                System.IO.File.WriteAllText(path, json, Encoding.UTF8);
                GameState.Load();
            }
            catch (Exception e)
            {
                Debug.LogWarning($"ApplyRemoteState failed: {e.Message}");
            }
        }
    }
}
