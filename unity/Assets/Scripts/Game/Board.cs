using System.Collections.Generic;
using UnityEngine;
using Evergreen.Core;

namespace Evergreen.Match3
{
    public class Board
    {
        public Vector2Int Size;
        public int NumColors;
        public Piece?[,] Grid;
        public int[,] JellyLayers;
        public bool[,] Holes;
        public int[,] CrateHp;
        public int[,] IceHp;
        public bool[,] Locked;
        public int[,] Chocolate;

        private System.Random _rng = new System.Random();
        
        // Use memory-optimized pools
        private static readonly ObjectPool<List<Vector2Int>> _vectorListPool = 
            new ObjectPool<List<Vector2Int>>(
                createFunc: () => new List<Vector2Int>(),
                onGet: list => list.Clear(),
                onReturn: list => list.Clear(),
                maxSize: 50
            );
        
        private static readonly ObjectPool<List<List<Vector2Int>>> _vectorListListPool = 
            new ObjectPool<List<List<Vector2Int>>>(
                createFunc: () => new List<List<Vector2Int>>(),
                onGet: list => list.Clear(),
                onReturn: list => list.Clear(),
                maxSize: 20
            );
        
        private static readonly ObjectPool<Dictionary<string, object>> _dictionaryPool = 
            new ObjectPool<Dictionary<string, object>>(
                createFunc: () => new Dictionary<string, object>(),
                onGet: dict => dict.Clear(),
                onReturn: dict => dict.Clear(),
                maxSize: 30
            );
        
        private static readonly ObjectPool<Dictionary<int, int>> _intDictionaryPool = 
            new ObjectPool<Dictionary<int, int>>(
                createFunc: () => new Dictionary<int, int>(),
                onGet: dict => dict.Clear(),
                onReturn: dict => dict.Clear(),
                maxSize: 20
            );

        public Board(Vector2Int size, int numColors, int? seed = null)
        {
            using (Profiler.Start("Board Creation", "Board"))
            {
                Size = size;
                NumColors = numColors;
                if (seed.HasValue) _rng = new System.Random(seed.Value);
                
                // Track memory allocation
                MemoryOptimizer.TrackAllocation("Board_Grid", 1, size.x * size.y * sizeof(Piece?));
                MemoryOptimizer.TrackAllocation("Board_Arrays", 5, size.x * size.y * (sizeof(int) + sizeof(bool) + sizeof(int) + sizeof(int) + sizeof(int)));
                
                Grid = new Piece?[size.x, size.y];
                JellyLayers = new int[size.x, size.y];
                Holes = new bool[size.x, size.y];
                CrateHp = new int[size.x, size.y];
                IceHp = new int[size.x, size.y];
                Locked = new bool[size.x, size.y];
                Chocolate = new int[size.x, size.y];
                
                for (int x = 0; x < size.x; x++)
                for (int y = 0; y < size.y; y++)
                {
                    Grid[x, y] = MakeNormal(_rng.Next(0, NumColors));
                }
                
                ResolveInitial();
            }
        }

        public static Piece MakeNormal(int color) => new Piece { Kind = PieceKind.Normal, Color = color };
        public static Piece MakeRocketH(int color) => new Piece { Kind = PieceKind.RocketH, Color = color };
        public static Piece MakeRocketV(int color) => new Piece { Kind = PieceKind.RocketV, Color = color };
        public static Piece MakeBomb(int color) => new Piece { Kind = PieceKind.Bomb, Color = color };
        public static Piece MakeColorBomb() => new Piece { Kind = PieceKind.ColorBomb, Color = -1 };
        public static Piece MakeIngredient() => new Piece { Kind = PieceKind.Ingredient, Color = -1 };

        public bool InBounds(Vector2Int p) => p.x >= 0 && p.x < Size.x && p.y >= 0 && p.y < Size.y;
        public bool IsHole(Vector2Int p) => InBounds(p) && Holes[p.x, p.y];
        public bool IsLocked(Vector2Int p) => InBounds(p) && Locked[p.x, p.y];

        public void Swap(Vector2Int a, Vector2Int b)
        {
            var tmp = Grid[a.x, a.y];
            Grid[a.x, a.y] = Grid[b.x, b.y];
            Grid[b.x, b.y] = tmp;
        }

        public bool IsAdjacent(Vector2Int a, Vector2Int b) => Mathf.Abs(a.x - b.x) + Mathf.Abs(a.y - b.y) == 1;

        public bool HasMatches() => FindMatches().Count > 0;

        public List<List<Vector2Int>> FindMatches()
        {
            var groups = _vectorListListPool.Get();
            
            try
            {
                // Horizontal matches
                for (int y = 0; y < Size.y; y++)
                {
                    var run = _vectorListPool.Get();
                    run.Add(new Vector2Int(0, y));
                    
                    for (int x = 1; x < Size.x + 1; x++)
                    {
                        bool cont = x < Size.x && SameColor(new Vector2Int(x, y), new Vector2Int(x - 1, y));
                        if (cont) 
                        {
                            run.Add(new Vector2Int(x, y));
                        }
                        else
                        {
                            if (run.Count >= 3) 
                            {
                                var matchGroup = _vectorListPool.Get();
                                matchGroup.AddRange(run);
                                groups.Add(matchGroup);
                            }
                            else
                            {
                                _vectorListPool.Return(run);
                            }
                            
                            run = (x < Size.x) ? _vectorListPool.Get() : null;
                            if (run != null) run.Add(new Vector2Int(x, y));
                        }
                    }
                    
                    if (run != null)
                    {
                        _vectorListPool.Return(run);
                    }
                }
                
                // Vertical matches
                for (int x = 0; x < Size.x; x++)
                {
                    var run = _vectorListPool.Get();
                    run.Add(new Vector2Int(x, 0));
                    
                    for (int y = 1; y < Size.y + 1; y++)
                    {
                        bool cont = y < Size.y && SameColor(new Vector2Int(x, y), new Vector2Int(x, y - 1));
                        if (cont) 
                        {
                            run.Add(new Vector2Int(x, y));
                        }
                        else
                        {
                            if (run.Count >= 3) 
                            {
                                var matchGroup = _vectorListPool.Get();
                                matchGroup.AddRange(run);
                                groups.Add(matchGroup);
                            }
                            else
                            {
                                _vectorListPool.Return(run);
                            }
                            
                            run = (y < Size.y) ? _vectorListPool.Get() : null;
                            if (run != null) run.Add(new Vector2Int(x, y));
                        }
                    }
                    
                    if (run != null)
                    {
                        _vectorListPool.Return(run);
                    }
                }
                
                return MergeOverlapping(groups);
            }
            finally
            {
                // Return the groups list to pool after processing
                foreach (var group in groups)
                {
                    _vectorListPool.Return(group);
                }
                _vectorListListPool.Return(groups);
            }
        }

        private bool SameColor(Vector2Int a, Vector2Int b)
        {
            if (!InBounds(a) || !InBounds(b)) return false;
            if (IsHole(a) || IsHole(b)) return false;
            var pa = Grid[a.x, a.y];
            var pb = Grid[b.x, b.y];
            if (!pa.HasValue || !pb.HasValue) return false;
            if (pa.Value.Kind == PieceKind.ColorBomb || pb.Value.Kind == PieceKind.ColorBomb) return false;
            return pa.Value.Color == pb.Value.Color;
        }

        private List<List<Vector2Int>> MergeOverlapping(List<List<Vector2Int>> groups)
        {
            var merged = new List<List<Vector2Int>>();
            foreach (var g in groups)
            {
                bool added = false;
                foreach (var mg in merged)
                {
                    if (GroupsOverlap(mg, g))
                    {
                        foreach (var p in g)
                            if (!mg.Contains(p)) mg.Add(p);
                        added = true;
                        break;
                    }
                }
                if (!added) merged.Add(new List<Vector2Int>(g));
            }
            return merged;
        }

        private bool GroupsOverlap(List<Vector2Int> a, List<Vector2Int> b)
        {
            foreach (var p in a)
                if (b.Contains(p)) return true;
            return false;
        }

        public Dictionary<string, object> ResolveBoard()
        {
            int totalCleared = 0;
            int totalJelly = 0;
            int cascades = 0;
            var colorCounts = _intDictionaryPool.Get();
            
            try
            {
                while (true)
                {
                    var matches = FindMatches();
                    if (matches.Count == 0) break;
                    
                    var result = ClearMatchesAndGenerateSpecials(matches);
                    totalCleared += (int)result["cleared"];
                    totalJelly += (int)result["jelly_cleared"];
                    
                    var cc = (Dictionary<int, int>)result["color_counts"];
                    foreach (var kv in cc)
                    {
                        colorCounts[kv.Key] = colorCounts.ContainsKey(kv.Key) ? colorCounts[kv.Key] + kv.Value : kv.Value;
                    }
                    
                    // Return the result dictionary to pool
                    _dictionaryPool.Return(result);
                    
                    ApplyGravityAndFill();
                    cascades++;
                }
                
                var finalResult = _dictionaryPool.Get();
                finalResult["cleared"] = totalCleared;
                finalResult["jelly_cleared"] = totalJelly;
                finalResult["cascades"] = cascades;
                finalResult["color_counts"] = new Dictionary<int, int>(colorCounts); // Create a copy
                
                return finalResult;
            }
            finally
            {
                _intDictionaryPool.Return(colorCounts);
            }
        }

        private Dictionary<string, object> ClearMatchesAndGenerateSpecials(List<List<Vector2Int>> groups)
        {
            int cleared = 0;
            int jellyCleared = 0;
            var colorCounts = _intDictionaryPool.Get();
            bool hasSpecialMatch = false;
            
            try
            {
                foreach (var group in groups)
                {
                    bool createdSpecial = false;
                    if (group.Count == 4)
                    {
                        var anchor = group[0];
                        bool isHoriz = IsSameY(group);
                        var piece = Grid[anchor.x, anchor.y].Value;
                        var special = isHoriz ? MakeRocketH(piece.Color) : MakeRocketV(piece.Color);
                        Grid[anchor.x, anchor.y] = special;
                        createdSpecial = true;
                        hasSpecialMatch = true;
                    }
                    else if (group.Count >= 5)
                    {
                        var anchor = group[0];
                        bool isLine = IsSameY(group) || IsSameX(group);
                        if (isLine) 
                        {
                            Grid[anchor.x, anchor.y] = MakeColorBomb();
                            hasSpecialMatch = true;
                        }
                        else
                        {
                            var piece = Grid[anchor.x, anchor.y].Value;
                            Grid[anchor.x, anchor.y] = MakeBomb(piece.Color);
                            hasSpecialMatch = true;
                        }
                        createdSpecial = true;
                    }
                    foreach (var p in group)
                    {
                        if (createdSpecial && p == group[0]) continue;
                        var before = Grid[p.x, p.y];
                        if (before.HasValue)
                        {
                            var c = before.Value.Color;
                            if (c >= 0)
                            {
                                if (!colorCounts.ContainsKey(c)) colorCounts[c] = 0;
                                colorCounts[c] += 1;
                            }
                        }
                        if (!DamageBlockersOrClearAt(p)) Grid[p.x, p.y] = null;
                        cleared++;
                        jellyCleared += HitJellyAt(p);
                    }
                }
                
                // Trigger effects and analytics
                if (hasSpecialMatch)
                {
                    // Trigger special match effects
                    if (Evergreen.Effects.MatchEffects.Instance != null)
                    {
                        Evergreen.Effects.MatchEffects.Instance.PlayMatchEffect(Vector3.zero, groups.Count, true);
                    }
                    
                    // Update game integration
                    if (Evergreen.Game.GameIntegration.Instance != null)
                    {
                        Evergreen.Game.GameIntegration.Instance.OnMatchMade(groups.Count, true);
                    }
                }
                else if (groups.Count > 0)
                {
                    // Trigger normal match effects
                    if (Evergreen.Effects.MatchEffects.Instance != null)
                    {
                        Evergreen.Effects.MatchEffects.Instance.PlayMatchEffect(Vector3.zero, groups.Count, false);
                    }
                    
                    // Update game integration
                    if (Evergreen.Game.GameIntegration.Instance != null)
                    {
                        Evergreen.Game.GameIntegration.Instance.OnMatchMade(groups.Count, false);
                    }
                }
                
                var result = _dictionaryPool.Get();
                result["cleared"] = cleared;
                result["jelly_cleared"] = jellyCleared;
                result["color_counts"] = new Dictionary<int, int>(colorCounts); // Create a copy
                result["special_match"] = hasSpecialMatch;
                
                return result;
            }
            finally
            {
                _intDictionaryPool.Return(colorCounts);
            }
        }

        private int HitJellyAt(Vector2Int p)
        {
            if (!InBounds(p)) return 0;
            int layers = JellyLayers[p.x, p.y];
            if (layers > 0)
            {
                JellyLayers[p.x, p.y] = layers - 1;
                return 1;
            }
            return 0;
        }

        private bool DamageBlockersOrClearAt(Vector2Int p)
        {
            if (!InBounds(p) || IsHole(p)) return false;
            if (Locked[p.x, p.y]) { Locked[p.x, p.y] = false; return true; }
            if (IceHp[p.x, p.y] > 0) { IceHp[p.x, p.y] = Mathf.Max(0, IceHp[p.x, p.y] - 1); return true; }
            if (CrateHp[p.x, p.y] > 0) { CrateHp[p.x, p.y] = Mathf.Max(0, CrateHp[p.x, p.y] - 1); return true; }
            if (Chocolate[p.x, p.y] > 0) { Chocolate[p.x, p.y] = 0; return true; }
            return false;
        }

        private void ApplyGravityAndFill()
        {
            for (int x = 0; x < Size.x; x++)
            {
                int writeY = Size.y - 1;
                for (int y = Size.y - 1; y >= 0; y--)
                {
                    var p = new Vector2Int(x, y);
                    if (IsHole(p)) continue;
                    if (Grid[x, y].HasValue)
                    {
                        Grid[x, writeY] = Grid[x, y];
                        if (writeY != y) Grid[x, y] = null;
                        writeY--;
                    }
                }
                while (writeY >= 0)
                {
                    var p = new Vector2Int(x, writeY);
                    if (IsHole(p)) { writeY--; continue; }
                    Grid[x, writeY] = MakeNormal(_rng.Next(0, NumColors));
                    writeY--;
                }
            }
        }

        private bool IsSameY(List<Vector2Int> group)
        {
            if (group.Count == 0) return false;
            int y0 = group[0].y;
            foreach (var p in group) if (p.y != y0) return false;
            return true;
        }

        private bool IsSameX(List<Vector2Int> group)
        {
            if (group.Count == 0) return false;
            int x0 = group[0].x;
            foreach (var p in group) if (p.x != x0) return false;
            return true;
        }

        private void ResolveInitial()
        {
            while (true)
            {
                var matches = FindMatches();
                if (matches.Count == 0) break;
                ClearMatchesAndGenerateSpecials(matches);
                ApplyGravityAndFill();
            }
        }
    }
}
