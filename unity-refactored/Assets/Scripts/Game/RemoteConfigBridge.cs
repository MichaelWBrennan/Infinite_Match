using UnityEngine;
using Evergreen.Game;

public static class RemoteConfigBridge
{
    public static int GetInt(string key, int defVal)
    {
        return RemoteConfigService.Get(key, defVal);
    }
    public static string GetString(string key, string defVal)
    {
        return RemoteConfigService.Get(key, defVal);
    }
}
