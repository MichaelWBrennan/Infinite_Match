using UnityEngine;
using UnityEngine.UI;
using Evergreen.Match3;
using Evergreen.Game;

public class GameplayUI : MonoBehaviour
{
    [SerializeField] private Transform gridRoot;
    [SerializeField] private GameObject tilePrefab;
    [SerializeField] private Button pauseButton;

    private Board _board;

    void Start()
    {
        EnsureGridRoot();
        EnsureTilePrefab();
        InitializeUI();

        var lm = OptimizedGameSystem.Instance;
        if (lm == null) { var go = new GameObject("LevelManager"); lm = go.AddComponent<LevelManager>(); }
        lm.LoadLevel(GameState.CurrentLevel);
        _board = new Board(lm.BoardSize, lm.NumColors);
        BuildGrid();
    }

    private void InitializeUI()
    {
        // Setup button listeners
        if (pauseButton != null)
        {
            pauseButton.onClick.AddListener(OnPauseButtonClicked);
        }
    }

    public void OnPauseButtonClicked()
    {
        try
        {
            // Pause game logic here
            Debug.Log("Game paused");
            Logger.Info("Game paused", "Gameplay");
        }
        catch (System.Exception e)
        {
            Logger.LogException(e, "Gameplay");
        }
    }

    private void BuildGrid()
    {
        foreach (Transform c in gridRoot) Destroy(c.gameObject);

        // Add GridLayoutGroup for automatic tiling
        var glg = gridRoot.GetComponent<GridLayoutGroup>();
        if (glg == null)
        {
            glg = gridRoot.gameObject.AddComponent<GridLayoutGroup>();
            glg.cellSize = new Vector2(64, 64);
            glg.spacing = new Vector2(4, 4);
            glg.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
            glg.constraintCount = _board.Size.x;
        }

        for (int y = 0; y < _board.Size.y; y++)
        {
            for (int x = 0; x < _board.Size.x; x++)
            {
                var go = Instantiate(tilePrefab, gridRoot);
                go.name = $"Cell_{x}_{y}";
            }
        }
    }

    private void EnsureGridRoot()
    {
        if (gridRoot != null) return;
        var canvas = GameObject.FindObjectOfType<Canvas>();
        if (canvas == null)
        {
            var cgo = new GameObject("Canvas");
            canvas = cgo.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            cgo.AddComponent<CanvasScaler>();
            cgo.AddComponent<GraphicRaycaster>();
        }
        var root = new GameObject("GridRoot");
        var rt = root.AddComponent<RectTransform>();
        root.transform.SetParent(canvas.transform, false);
        rt.anchorMin = new Vector2(0.1f, 0.1f);
        rt.anchorMax = new Vector2(0.9f, 0.9f);
        rt.offsetMin = rt.offsetMax = Vector2.zero;
        gridRoot = root.transform;
    }

    private void EnsureTilePrefab()
    {
        if (tilePrefab != null) return;
        var go = new GameObject("Tile");
        var img = go.AddComponent<Image>();
        img.color = new Color(0.9f, 0.9f, 0.9f, 1f);
        var btn = go.AddComponent<Button>();
        var rt = go.GetComponent<RectTransform>();
        rt.sizeDelta = new Vector2(64, 64);
        tilePrefab = go;
    }

    void OnDestroy()
    {
        // Clean up button listeners
        if (pauseButton != null)
        {
            pauseButton.onClick.RemoveListener(OnPauseButtonClicked);
        }
    }
}
