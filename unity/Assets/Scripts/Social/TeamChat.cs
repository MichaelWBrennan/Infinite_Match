using System;using System.Collections.Generic;using UnityEngine;

namespace Evergreen.Social
{
    public class TeamChat : MonoBehaviour
    {
        public static TeamChat Instance { get; private set; }
        public event Action<ChatMessage> OnMessage;
        public List<ChatMessage> Messages = new List<ChatMessage>();

        private void Awake()
        {
            if (Instance != null) { Destroy(gameObject); return; }
            Instance = this; DontDestroyOnLoad(gameObject);
        }

        public void Send(string text)
        {
            var msg = new ChatMessage
            {
                From = SystemInfo.deviceUniqueIdentifier.Substring(0, 6),
                Text = text,
                UnixTs = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            };
            Messages.Add(msg);
            OnMessage?.Invoke(msg);
            Evergreen.Game.AnalyticsAdapter.CustomEvent("team_chat", text);
        }
    }

    [Serializable]
    public struct ChatMessage
    {
        public string From;
        public string Text;
        public long UnixTs;
    }
}
