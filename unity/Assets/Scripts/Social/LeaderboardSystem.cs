using System.Collections.Generic;
using UnityEngine;
using System;

namespace Evergreen.Social
{
    [Serializable]
    public class LeaderboardEntry
    {
        public string playerId;
        public string playerName;
        public int score;
        public int level;
        public string avatar;
        public long timestamp;
        public int rank;
    }
    
    [Serializable]
    public class LeaderboardData
    {
        public string leaderboardId;
        public string name;
        public List<LeaderboardEntry> entries = new List<LeaderboardEntry>();
        public long lastUpdated;
        public int totalPlayers;
    }
    
    public class LeaderboardSystem : MonoBehaviour
    {
        [Header("Leaderboards")]
        public List<LeaderboardData> leaderboards = new List<LeaderboardData>();
        
        [Header("Settings")]
        public int maxEntriesPerLeaderboard = 100;
        public float refreshInterval = 300f; // 5 minutes
        
        public static LeaderboardSystem Instance { get; private set; }
        
        private float lastRefreshTime;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeLeaderboards();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            LoadLeaderboardData();
            RefreshAllLeaderboards();
        }
        
        void Update()
        {
            if (Time.time - lastRefreshTime > refreshInterval)
            {
                RefreshAllLeaderboards();
            }
        }
        
        private void InitializeLeaderboards()
        {
            leaderboards = new List<LeaderboardData>
            {
                new LeaderboardData
                {
                    leaderboardId = "weekly_score",
                    name = "Weekly High Scores",
                    totalPlayers = 0
                },
                new LeaderboardData
                {
                    leaderboardId = "level_progress",
                    name = "Level Progress",
                    totalPlayers = 0
                },
                new LeaderboardData
                {
                    leaderboardId = "friends",
                    name = "Friends",
                    totalPlayers = 0
                },
                new LeaderboardData
                {
                    leaderboardId = "global",
                    name = "Global",
                    totalPlayers = 0
                }
            };
        }
        
        public void SubmitScore(string leaderboardId, int score, int level = 0)
        {
            var leaderboard = GetLeaderboard(leaderboardId);
            if (leaderboard == null) return;
            
            var playerId = GetPlayerId();
            var playerName = GetPlayerName();
            var avatar = GetPlayerAvatar();
            
            var entry = new LeaderboardEntry
            {
                playerId = playerId,
                playerName = playerName,
                score = score,
                level = level,
                avatar = avatar,
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            };
            
            // Update or add entry
            var existingIndex = leaderboard.entries.FindIndex(e => e.playerId == playerId);
            if (existingIndex >= 0)
            {
                leaderboard.entries[existingIndex] = entry;
            }
            else
            {
                leaderboard.entries.Add(entry);
            }
            
            // Sort by score (descending)
            leaderboard.entries.Sort((a, b) => b.score.CompareTo(a.score));
            
            // Update ranks
            for (int i = 0; i < leaderboard.entries.Count; i++)
            {
                leaderboard.entries[i].rank = i + 1;
            }
            
            // Keep only top entries
            if (leaderboard.entries.Count > maxEntriesPerLeaderboard)
            {
                leaderboard.entries = leaderboard.entries.GetRange(0, maxEntriesPerLeaderboard);
            }
            
            leaderboard.totalPlayers = leaderboard.entries.Count;
            leaderboard.lastUpdated = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            
            // Analytics
            Evergreen.Game.AnalyticsAdapter.CustomEvent("leaderboard_score_submitted", new Dictionary<string, object>
            {
                {"leaderboard_id", leaderboardId},
                {"score", score},
                {"rank", entry.rank}
            });
            
            SaveLeaderboardData();
        }
        
        public LeaderboardData GetLeaderboard(string leaderboardId)
        {
            return leaderboards.Find(l => l.leaderboardId == leaderboardId);
        }
        
        public List<LeaderboardEntry> GetTopEntries(string leaderboardId, int count = 10)
        {
            var leaderboard = GetLeaderboard(leaderboardId);
            if (leaderboard == null) return new List<LeaderboardEntry>();
            
            var result = new List<LeaderboardEntry>();
            for (int i = 0; i < Mathf.Min(count, leaderboard.entries.Count); i++)
            {
                result.Add(leaderboard.entries[i]);
            }
            return result;
        }
        
        public int GetPlayerRank(string leaderboardId)
        {
            var leaderboard = GetLeaderboard(leaderboardId);
            if (leaderboard == null) return -1;
            
            var playerId = GetPlayerId();
            var entry = leaderboard.entries.Find(e => e.playerId == playerId);
            return entry?.rank ?? -1;
        }
        
        public LeaderboardEntry GetPlayerEntry(string leaderboardId)
        {
            var leaderboard = GetLeaderboard(leaderboardId);
            if (leaderboard == null) 
            {
                Debug.LogError($"LeaderboardSystem: Leaderboard not found for ID {leaderboardId}");
                return new LeaderboardEntry
                {
                    playerId = "unknown",
                    playerName = "Unknown Player",
                    score = 0,
                    rank = 0,
                    timestamp = DateTime.Now
                };
            }
            
            var playerId = GetPlayerId();
            return leaderboard.entries.Find(e => e.playerId == playerId);
        }
        
        public void RefreshAllLeaderboards()
        {
            lastRefreshTime = Time.time;
            
            // In a real implementation, this would fetch from server
            // For now, we'll just update the local data
            foreach (var leaderboard in leaderboards)
            {
                RefreshLeaderboard(leaderboard.leaderboardId);
            }
        }
        
        private void RefreshLeaderboard(string leaderboardId)
        {
            // Simulate server refresh
            // In real implementation, make API call to server
            Debug.Log($"Refreshing leaderboard: {leaderboardId}");
        }
        
        private string GetPlayerId()
        {
            // Get from GameState or generate if not exists
            var playerId = PlayerPrefs.GetString("PlayerId", "");
            if (string.IsNullOrEmpty(playerId))
            {
                playerId = System.Guid.NewGuid().ToString();
                PlayerPrefs.SetString("PlayerId", playerId);
            }
            return playerId;
        }
        
        private string GetPlayerName()
        {
            return PlayerPrefs.GetString("PlayerName", "Player");
        }
        
        private string GetPlayerAvatar()
        {
            return PlayerPrefs.GetString("PlayerAvatar", "default_avatar");
        }
        
        private void LoadLeaderboardData()
        {
            var data = PlayerPrefs.GetString("LeaderboardData", "");
            if (!string.IsNullOrEmpty(data))
            {
                try
                {
                    var leaderboardData = JsonUtility.FromJson<LeaderboardData[]>(data);
                    if (leaderboardData != null)
                    {
                        leaderboards = new List<LeaderboardData>(leaderboardData);
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"Failed to load leaderboard data: {e.Message}");
                }
            }
        }
        
        private void SaveLeaderboardData()
        {
            try
            {
                var data = JsonUtility.ToJson(leaderboards.ToArray());
                PlayerPrefs.SetString("LeaderboardData", data);
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to save leaderboard data: {e.Message}");
            }
        }
    }
}