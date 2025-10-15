using System;
using System.IO;
using UnityEngine;

namespace Evergreen.Game
{
    [Serializable]
    public class GameStateData
    {
        public int coins = 0;
        public int gems = 0;
        public int energyCurrent = 5;
        public int energyMax = 5;
        public long lastEnergyTs = 0;
        public int currentLevel = 1;
    }

    public static class GameState
    {
        private static GameStateData _d;
        private static string Path => System.IO.Path.Combine(Application.persistentDataPath, "state.json");

        public static void Load()
        {
            try
            {
                if (File.Exists(Path))
                {
                    var txt = File.ReadAllText(Path);
                    _d = JsonUtility.FromJson<GameStateData>(txt);
                }
            }
            catch { }
            if (_d == null) _d = new GameStateData();
            TickEnergyRefill();
        }

        public static void Save()
        {
            try
            {
                var txt = JsonUtility.ToJson(_d);
                File.WriteAllText(Path, txt);
            }
            catch { }
        }

        public static int Coins => _d.coins;
        public static int Gems => _d.gems;
        public static int EnergyCurrent => _d.energyCurrent;
        public static int EnergyMax => _d.energyMax;
        public static int CurrentLevel { get => _d.currentLevel; set { _d.currentLevel = Mathf.Max(1, value); Save(); } }

        public static void AddCoins(int amount) { _d.coins = Mathf.Max(0, _d.coins + Mathf.Max(0, amount)); Save(); }
        public static bool SpendCoins(int amount) { if (_d.coins >= amount) { _d.coins -= amount; Save(); return true; } return false; }
        public static void AddGems(int amount) { _d.gems = Mathf.Max(0, _d.gems + Mathf.Max(0, amount)); Save(); }
        public static bool SpendGems(int amount) { if (_d.gems >= amount) { _d.gems -= amount; Save(); return true; } return false; }

        public static bool ConsumeEnergy(int cost = 1)
        {
            TickEnergyRefill();
            if (_d.energyCurrent >= cost) { _d.energyCurrent -= cost; Save(); return true; }
            return false;
        }

        public static void RefillEnergy() { _d.energyCurrent = _d.energyMax; Save(); }

        public static void TickEnergyRefill()
        {
            int refillMinutes = RemoteConfigBridge.GetInt("energy_refill_minutes", 20);
            if (_d.energyCurrent >= _d.energyMax) return;
            var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            if (_d.lastEnergyTs <= 0) _d.lastEnergyTs = now;
            var seconds = now - _d.lastEnergyTs;
            var per = refillMinutes * 60;
            if (seconds >= per)
            {
                var gained = (int)(seconds / per);
                _d.energyCurrent = Mathf.Min(_d.energyMax, _d.energyCurrent + gained);
                _d.lastEnergyTs += gained * per;
                Save();
            }
        }
    }
}
