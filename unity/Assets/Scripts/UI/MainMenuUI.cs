using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using Evergreen.Game;
using Evergreen.Social;

public class MainMenuUI : MonoBehaviour
{
    void Start()
    {
        // Ensure a working Chat button exists at runtime
        var existing = GameObject.Find("ChatButton");
        if (existing == null)
        {
            var canvas = FindObjectOfType<Canvas>();
            if (canvas != null)
            {
                var btnGo = new GameObject("ChatButton");
                btnGo.transform.SetParent(canvas.transform, false);
                var img = btnGo.AddComponent<Image>(); img.color = new Color(0.2f, 0.5f, 1f, 0.85f);
                var btn = btnGo.AddComponent<Button>();
                var rt = btnGo.GetComponent<RectTransform>();
                rt.anchorMin = new Vector2(0.85f, 0.9f);
                rt.anchorMax = new Vector2(0.98f, 0.98f);
                rt.offsetMin = rt.offsetMax = Vector2.zero;
                // Label
                var textGo = new GameObject("Text"); textGo.transform.SetParent(btnGo.transform, false);
                var txt = textGo.AddComponent<Text>(); txt.text = "Chat"; txt.alignment = TextAnchor.MiddleCenter; txt.font = Resources.GetBuiltinResource<Font>("Arial.ttf"); txt.color = Color.white;
                var trt = textGo.GetComponent<RectTransform>(); trt.anchorMin = Vector2.zero; trt.anchorMax = Vector2.one; trt.offsetMin = trt.offsetMax = Vector2.zero;
                btn.onClick.AddListener(OnOpenChat);
            }
        }
    }
    public void OnStartGame()
    {
        if (!GameState.ConsumeEnergy(1))
        {
            FindObjectOfType<UnityAdsManager>()?.ShowRewarded(() => GameState.AddCoins(5));
            return;
        }
        SceneManager.LoadScene("Gameplay");
    }

    public static void Show()
    {
        SceneManager.LoadScene("MainMenu");
    }

    // Hook this to a UI Button to open Team Chat
    public void OnOpenChat()
    {
        TeamChatUIFactory.Show();
    }
}
