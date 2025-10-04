using UnityEngine;using UnityEngine.UI;using Evergreen.Social;

public static class TeamChatUIFactory
{
    private static GameObject _window;
    public static void Show()
    {
        if (_window != null) { _window.SetActive(true); return; }
        // Try load prefab first
        var prefab = Resources.Load<GameObject>("TeamChatPanel");
        if (prefab != null)
        {
            _window = GameObject.Instantiate(prefab);
            return;
        }
        // Build minimal UGUI window
        var canvasGo = new GameObject("TeamChatCanvas");
        var canvas = canvasGo.AddComponent<Canvas>(); canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvasGo.AddComponent<CanvasScaler>(); canvasGo.AddComponent<GraphicRaycaster>();
        _window = canvasGo;

        var panel = CreateUI<RectTransform, Image>(canvasGo, "Panel"); var img = panel.GetComponent<Image>(); img.color = new Color(0,0,0,0.6f);
        panel.anchorMin = new Vector2(0.1f, 0.1f); panel.anchorMax = new Vector2(0.9f, 0.9f); panel.offsetMin=panel.offsetMax=Vector2.zero;

        // Scroll View
        var scrollGo = new GameObject("ScrollView"); scrollGo.transform.SetParent(panel, false);
        var scrollRect = scrollGo.AddComponent<ScrollRect>(); var mask = scrollGo.AddComponent<Mask>(); mask.showMaskGraphic=false; var img2 = scrollGo.AddComponent<Image>(); img2.color = new Color(1,1,1,0.05f);
        var srt = scrollGo.GetComponent<RectTransform>(); srt.anchorMin = new Vector2(0.05f, 0.25f); srt.anchorMax = new Vector2(0.95f, 0.9f); srt.offsetMin = srt.offsetMax = Vector2.zero;
        var content = new GameObject("Content"); content.transform.SetParent(scrollGo.transform, false);
        var contentRT = content.AddComponent<RectTransform>(); contentRT.anchorMin = new Vector2(0,1); contentRT.anchorMax = new Vector2(1,1); contentRT.pivot = new Vector2(0.5f,1);
        var layout = content.AddComponent<VerticalLayoutGroup>(); layout.childControlHeight=true; layout.childForceExpandHeight=false;
        scrollRect.content = contentRT;

        // Template text
        var templateGo = new GameObject("Template"); templateGo.transform.SetParent(content.transform, false);
        var txt = templateGo.AddComponent<Text>(); txt.text = ""; txt.font = Resources.GetBuiltinResource<Font>("Arial.ttf"); txt.color = Color.white; templateGo.SetActive(false);

        // Input
        var inputGo = new GameObject("Input"); inputGo.transform.SetParent(panel, false);
        var input = inputGo.AddComponent<InputField>(); var img3 = inputGo.AddComponent<Image>(); img3.color = new Color(1,1,1,0.1f);
        var irt = inputGo.GetComponent<RectTransform>(); irt.anchorMin = new Vector2(0.05f, 0.1f); irt.anchorMax = new Vector2(0.7f, 0.2f); irt.offsetMin=irt.offsetMax=Vector2.zero;

        // Send button
        var btnGo = new GameObject("Send"); btnGo.transform.SetParent(panel, false);
        var btn = btnGo.AddComponent<Button>(); var btnImg = btnGo.AddComponent<Image>(); btnImg.color = new Color(0.2f,0.5f,1f,0.8f);
        var brt = btnGo.GetComponent<RectTransform>(); brt.anchorMin = new Vector2(0.75f, 0.1f); brt.anchorMax = new Vector2(0.95f, 0.2f); brt.offsetMin=brt.offsetMax=Vector2.zero;
        var btnTextGo = new GameObject("Text"); btnTextGo.transform.SetParent(btnGo.transform, false);
        var btnText = btnTextGo.AddComponent<Text>(); btnText.text = "Send"; btnText.alignment = TextAnchor.MiddleCenter; btnText.font = Resources.GetBuiltinResource<Font>("Arial.ttf"); btnText.color=Color.white;
        var btrt = btnTextGo.GetComponent<RectTransform>(); btrt.anchorMin=Vector2.zero; btrt.anchorMax=Vector2.one; btrt.offsetMin=btrt.offsetMax=Vector2.zero;

        // Wire logic
        UnityEngine.Events.UnityAction send = () => { if (!string.IsNullOrWhiteSpace(input.text)) { TeamChat.Instance?.Send(input.text); AddLine(content.transform, templateGo, input.text); input.text = string.Empty; } };
        btn.onClick.AddListener(send);
        if (TeamChat.Instance!=null) TeamChat.Instance.OnMessage += (m)=> AddLine(content.transform, templateGo, $"[{m.From}] {m.Text}");
        // Fill existing
        if (TeamChat.Instance!=null) foreach (var m in TeamChat.Instance.Messages) AddLine(content.transform, templateGo, $"[{m.From}] {m.Text}");
    }

    private static T CreateUI<T, U>(GameObject parent, string name) where T: Component where U: Component
    {
        var go = new GameObject(name); go.transform.SetParent(parent.transform, false);
        go.AddComponent<U>(); return go.AddComponent<T>();
    }

    private static void AddLine(Transform content, GameObject template, string text)
    {
        var el = GameObject.Instantiate(template, content);
        el.SetActive(true); var t = el.GetComponent<Text>(); t.text = text;
    }
}
