using UnityEngine;
using Evergreen.Match3;
using Evergreen.Game;

public class GameplayUI : MonoBehaviour
{
    [SerializeField] private Transform gridRoot;
    [SerializeField] private GameObject tilePrefab;

    private Board _board;

    void Start()
    {
        var lm = FindObjectOfType<LevelManager>();
        if (lm == null) { var go = new GameObject("LevelManager"); lm = go.AddComponent<LevelManager>(); }
        lm.LoadLevel(GameState.CurrentLevel);
        _board = new Board(lm.BoardSize, lm.NumColors);
        BuildGrid();
    }

    private void BuildGrid()
    {
        foreach (Transform c in gridRoot) Destroy(c.gameObject);
        for (int y = 0; y < _board.Size.y; y++)
        {
            for (int x = 0; x < _board.Size.x; x++)
            {
                var go = Instantiate(tilePrefab, gridRoot);
                go.name = $"Cell_{x}_{y}";
            }
        }
    }
}
