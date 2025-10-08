using UnityEngine;using UnityEngine.UI;using Evergreen.Social;

public class TeamChatPanel : MonoBehaviour
{
    [SerializeField] private RectTransform content;
    [SerializeField] private InputField input;
    [SerializeField] private Text template;

    void OnEnable()
    { 
        if (TeamChat.Instance != null) 
        {
            TeamChat.Instance.OnMessage += OnMessage; 
        }
        Refresh(); 
    }
    
    void OnDisable()
    { 
        if (TeamChat.Instance != null) 
        {
            TeamChat.Instance.OnMessage -= OnMessage; 
        }
    }

    public void OnSend()
    { 
        if (string.IsNullOrWhiteSpace(input.text)) return; 
        TeamChat.Instance?.Send(input.text); 
        input.text = string.Empty; 
    }

    private void OnMessage(ChatMessage msg)
    { 
        AddLine($"[{msg.From}] {msg.Text}"); 
    }

    private void Refresh()
    { 
        if (TeamChat.Instance == null) return; 
        
        foreach (Transform t in content) 
        {
            Destroy(t.gameObject); 
        }
        
        foreach (var m in TeamChat.Instance.Messages) 
        {
            AddLine($"[{m.From}] {m.Text}"); 
        }
    }

    private void AddLine(string txt){ var t = Instantiate(template, content); t.gameObject.SetActive(true); t.text = txt; }
}
