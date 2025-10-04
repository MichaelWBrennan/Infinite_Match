using UnityEngine;

namespace Evergreen.Game
{
    public static class AnalyticsAdapter
    {
        public static void CustomEvent(string name, object value=null)
        {
            Debug.Log($"Analytics: {name} {value}");
            // TODO: Integrate Firebase/GA SDKs here
        }
    }
}
