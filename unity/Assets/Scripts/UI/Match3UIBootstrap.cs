using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using Evergreen.Game;

public class Match3UIBootstrap : MonoBehaviour
{
    private Canvas _canvas;

    void Awake()
    {
        EnsureEventSystem();
        EnsureCanvas();
        EnsureTopBar();
        EnsureBoostersPanel();
        EnsurePause();
        EnsureEndPanels();
    }

    void Update()
    {
        // Update HUD texts if present
        var score = GameObject.Find("ScoreText")?.GetComponent<Text>();
        if (score != null) score.text = $"Score: {SafeScore()}";
        var moves = GameObject.Find("MovesText")?.GetComponent<Text>();
        if (moves != null) moves.text = $"Moves: {SafeMoves()}";
        var goal = GameObject.Find("GoalText")?.GetComponent<Text>();
        if (goal != null) goal.text = SafeGoal();
    }

    private void EnsureEventSystem()
    {
        if (FindObjectOfType<EventSystem>() == null)
        {
            var es = new GameObject("EventSystem");
            es.AddComponent<EventSystem>();
            es.AddComponent<StandaloneInputModule>();
        }
    }

    private void EnsureCanvas()
    {
        _canvas = FindObjectOfType<Canvas>();
        if (_canvas == null)
        {
            var cgo = new GameObject("Canvas");
            _canvas = cgo.AddComponent<Canvas>();
            _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            cgo.AddComponent<CanvasScaler>();
            cgo.AddComponent<GraphicRaycaster>();
        }
    }

    private void EnsureTopBar()
    {
        if (GameObject.Find("TopBar") != null) return;
        var top = CreatePanel("TopBar", new Vector2(0f, 0.9f), new Vector2(1f, 1f));
        CreateLabel(top.transform, "ScoreText", new Vector2(0.02f, 0.1f), new Vector2(0.22f, 0.9f), "Score: 0");
        CreateLabel(top.transform, "MovesText", new Vector2(0.4f, 0.1f), new Vector2(0.6f, 0.9f), "Moves: 0");
        CreateLabel(top.transform, "GoalText", new Vector2(0.78f, 0.1f), new Vector2(0.98f, 0.9f), "Goal: ");
    }

    private void EnsureBoostersPanel()
    {
        if (GameObject.Find("BoostersPanel") != null) return;
        var panel = CreatePanel("BoostersPanel", new Vector2(0.8f, 0.1f), new Vector2(0.98f, 0.5f));
        CreateButton(panel.transform, "Hammer", new Vector2(0.1f, 0.7f), new Vector2(0.9f, 0.9f), () => UseBooster("hammer"));
        CreateButton(panel.transform, "Bomb", new Vector2(0.1f, 0.4f), new Vector2(0.9f, 0.6f), () => UseBooster("bomb"));
        CreateButton(panel.transform, "Shuffle", new Vector2(0.1f, 0.1f), new Vector2(0.9f, 0.3f), () => UseBooster("shuffle"));
    }

    private void EnsurePause()
    {
        if (GameObject.Find("PauseButton") == null)
        {
            CreateButton(_canvas.transform, "PauseButton", new Vector2(0.02f, 0.02f), new Vector2(0.12f, 0.09f), TogglePause);
        }
        if (GameObject.Find("PausePanel") == null)
        {
            var panel = CreatePanel("PausePanel", new Vector2(0.3f, 0.3f), new Vector2(0.7f, 0.7f));
            panel.SetActive(false);
            CreateLabel(panel.transform, "PauseTitle", new Vector2(0.1f, 0.7f), new Vector2(0.9f, 0.9f), "Paused");
            CreateButton(panel.transform, "Resume", new Vector2(0.1f, 0.1f), new Vector2(0.9f, 0.3f), TogglePause);
        }
    }

    private void EnsureEndPanels()
    {
        if (GameObject.Find("VictoryPanel") == null)
        {
            var panel = CreatePanel("VictoryPanel", new Vector2(0.25f, 0.25f), new Vector2(0.75f, 0.75f));
            panel.SetActive(false);
            CreateLabel(panel.transform, "VictoryTitle", new Vector2(0.1f, 0.6f), new Vector2(0.9f, 0.9f), "Level Complete!");
            CreateButton(panel.transform, "Next", new Vector2(0.1f, 0.1f), new Vector2(0.9f, 0.3f), NextLevel);
        }
        if (GameObject.Find("DefeatPanel") == null)
        {
            var panel = CreatePanel("DefeatPanel", new Vector2(0.25f, 0.25f), new Vector2(0.75f, 0.75f));
            panel.SetActive(false);
            CreateLabel(panel.transform, "DefeatTitle", new Vector2(0.1f, 0.6f), new Vector2(0.9f, 0.9f), "Out of Moves");
            CreateButton(panel.transform, "Retry", new Vector2(0.1f, 0.1f), new Vector2(0.9f, 0.3f), RetryLevel);
        }
    }

    private GameObject CreatePanel(string name, Vector2 anchorMin, Vector2 anchorMax)
    {
        var go = new GameObject(name);
        var img = go.AddComponent<Image>();
        img.color = new Color(0, 0, 0, 0.35f);
        var rt = go.GetComponent<RectTransform>();
        go.transform.SetParent(_canvas.transform, false);
        rt.anchorMin = anchorMin; rt.anchorMax = anchorMax; rt.offsetMin = rt.offsetMax = Vector2.zero;
        return go;
    }

    private void CreateLabel(Transform parent, string name, Vector2 anchorMin, Vector2 anchorMax, string text)
    {
        var go = new GameObject(name);
        var rt = go.AddComponent<RectTransform>();
        go.transform.SetParent(parent, false);
        var t = go.AddComponent<Text>();
        t.text = text; t.alignment = TextAnchor.MiddleLeft; t.font = Resources.GetBuiltinResource<Font>("Arial.ttf"); t.color = Color.white;
        rt.anchorMin = anchorMin; rt.anchorMax = anchorMax; rt.offsetMin = rt.offsetMax = Vector2.zero;
    }

    private void CreateButton(Transform parent, string name, Vector2 anchorMin, Vector2 anchorMax, UnityEngine.Events.UnityAction onClick)
    {
        var go = new GameObject(name);
        var rt = go.AddComponent<RectTransform>();
        go.transform.SetParent(parent, false);
        var img = go.AddComponent<Image>();
        var icon = Resources.Load<Sprite>($"UI/Icons/{name.ToLower()}");
        if (icon != null) { img.sprite = icon; img.color = Color.white; }
        else { img.color = new Color(0.2f, 0.5f, 1f, 0.85f); }
        var btn = go.AddComponent<Button>(); btn.onClick.AddListener(onClick);
        var labelGo = new GameObject("Text");
        var lrt = labelGo.AddComponent<RectTransform>(); labelGo.transform.SetParent(go.transform, false);
        var txt = labelGo.AddComponent<Text>(); txt.text = name; txt.alignment = TextAnchor.MiddleCenter; txt.font = Resources.GetBuiltinResource<Font>("Arial.ttf"); txt.color = Color.white;
        lrt.anchorMin = Vector2.zero; lrt.anchorMax = Vector2.one; lrt.offsetMin = lrt.offsetMax = Vector2.zero;
        rt.anchorMin = anchorMin; rt.anchorMax = anchorMax; rt.offsetMin = rt.offsetMax = Vector2.zero;
    }

    private void TogglePause()
    {
        var p = GameObject.Find("PausePanel");
        if (p != null) p.SetActive(!p.activeSelf);
    }

    private void NextLevel()
    {
        GameState.CurrentLevel += 1;
        RetryLevel();
    }

    private void RetryLevel()
    {
        UnityEngine.SceneManagement.SceneManager.LoadScene("Gameplay");
    }

    // Safe getters
    private int SafeScore() { return GameState != null ? GameState.Score : 0; }
    private int SafeMoves() { return GameState != null ? GameState.Moves : 0; }
    private string SafeGoal() { return "Goal: " + (GameState != null ? GameState.CurrentGoal : ""); }
}
