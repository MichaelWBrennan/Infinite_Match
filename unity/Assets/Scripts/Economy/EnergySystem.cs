using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Evergreen.Core;
using Evergreen.Analytics;

namespace Evergreen.Economy
{
    /// <summary>
    /// Advanced Energy System with monetization opportunities
    /// Creates soft paywalls and energy-based purchase incentives
    /// </summary>
    public class EnergySystem : MonoBehaviour
    {
        [Header("Energy Settings")]
        public int maxEnergy = 30;
        public int energyPerLevel = 1;
        public int energyRefillCost = 10; // gems
        public float energyRefillTime = 300f; // 5 minutes per energy
        public int energyRefillAmount = 1;
        public bool enableEnergySystem = true;
        
        [Header("Industry Leader Settings")]
        public bool enableKingStyleEnergy = true; // Candy Crush style (5 lives, 30 min refill)
        public bool enableSupercellStyleEnergy = true; // Clash of Clans style (shield system)
        public bool enableNianticStyleEnergy = true; // Pokemon GO style (walking energy)
        public bool enableEpicStyleEnergy = true; // Fortnite style (battle pass energy)
        public bool enableRobloxStyleEnergy = true; // Roblox style (developer energy)
        
        [Header("Monetization Settings")]
        public bool enableEnergyPacks = true;
        public bool enableEnergySubscriptions = true;
        public bool enableEnergyAds = true;
        public int energyAdReward = 5;
        public float energyAdCooldown = 300f; // 5 minutes
        
        [Header("Energy Packs")]
        public EnergyPack[] energyPacks = new EnergyPack[]
        {
            new EnergyPack { id = "energy_small", name = "Energy Boost", energy = 10, cost = 5, costType = "gems" },
            new EnergyPack { id = "energy_medium", name = "Energy Surge", energy = 25, cost = 10, costType = "gems" },
            new EnergyPack { id = "energy_large", name = "Energy Rush", energy = 50, cost = 18, costType = "gems" },
            new EnergyPack { id = "energy_ultimate", name = "Unlimited Energy", energy = 999, cost = 50, costType = "gems" }
        };
        
        private int _currentEnergy;
        private DateTime _lastEnergyRefill;
        private DateTime _lastEnergyAd;
        private bool _isRefilling = false;
        private Coroutine _refillCoroutine;
        
        // Events
        public static event Action<int> OnEnergyChanged;
        public static event Action<int> OnEnergyRefilled;
        public static event Action<EnergyPack> OnEnergyPackPurchased;
        public static event Action OnEnergyDepleted;
        public static event Action OnEnergyFull;
        
        public static EnergySystem Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeEnergySystem();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            LoadEnergyData();
            StartEnergyRefill();
        }
        
        private void InitializeEnergySystem()
        {
            _currentEnergy = maxEnergy;
            _lastEnergyRefill = DateTime.Now;
            
            // Apply industry leader energy strategies
            ApplyIndustryLeaderEnergyStrategies();
            
            Debug.Log("Energy System initialized - Industry leader monetization mode activated!");
        }
        
        private void ApplyIndustryLeaderEnergyStrategies()
        {
            if (enableKingStyleEnergy)
            {
                ApplyKingEnergyStrategy();
            }
            
            if (enableSupercellStyleEnergy)
            {
                ApplySupercellEnergyStrategy();
            }
            
            if (enableNianticStyleEnergy)
            {
                ApplyNianticEnergyStrategy();
            }
            
            if (enableEpicStyleEnergy)
            {
                ApplyEpicEnergyStrategy();
            }
            
            if (enableRobloxStyleEnergy)
            {
                ApplyRobloxEnergyStrategy();
            }
        }
        
        private void ApplyKingEnergyStrategy()
        {
            // King (Candy Crush) energy strategy
            maxEnergy = 5; // King uses 5 lives
            energyRefillTime = 1800f; // 30 minutes per life
            energyRefillCost = 1; // 1 gem per life
            
            Debug.Log("Applied King (Candy Crush) energy strategy: 5 lives, 30min refill, 1 gem cost");
        }
        
        private void ApplySupercellEnergyStrategy()
        {
            // Supercell (Clash of Clans) energy strategy
            maxEnergy = 20; // Supercell uses more energy
            energyRefillTime = 600f; // 10 minutes per energy
            energyRefillCost = 5; // 5 gems per energy
            
            Debug.Log("Applied Supercell (Clash of Clans) energy strategy: 20 energy, 10min refill, 5 gem cost");
        }
        
        private void ApplyNianticEnergyStrategy()
        {
            // Niantic (Pokemon GO) energy strategy
            maxEnergy = 50; // Niantic uses high energy
            energyRefillTime = 120f; // 2 minutes per energy
            energyRefillCost = 2; // 2 gems per energy
            
            Debug.Log("Applied Niantic (Pokemon GO) energy strategy: 50 energy, 2min refill, 2 gem cost");
        }
        
        private void ApplyEpicEnergyStrategy()
        {
            // Epic (Fortnite) energy strategy
            maxEnergy = 100; // Epic uses very high energy
            energyRefillTime = 60f; // 1 minute per energy
            energyRefillCost = 1; // 1 gem per energy
            
            Debug.Log("Applied Epic (Fortnite) energy strategy: 100 energy, 1min refill, 1 gem cost");
        }
        
        private void ApplyRobloxEnergyStrategy()
        {
            // Roblox energy strategy
            maxEnergy = 200; // Roblox uses highest energy
            energyRefillTime = 30f; // 30 seconds per energy
            energyRefillCost = 1; // 1 gem per energy
            
            Debug.Log("Applied Roblox energy strategy: 200 energy, 30sec refill, 1 gem cost");
        }
        
        private void LoadEnergyData()
        {
            _currentEnergy = PlayerPrefs.GetInt("current_energy", maxEnergy);
            var lastRefillString = PlayerPrefs.GetString("last_energy_refill", DateTime.Now.ToString());
            if (DateTime.TryParse(lastRefillString, out DateTime lastRefill))
            {
                _lastEnergyRefill = lastRefill;
            }
            
            // Calculate energy gained while away
            if (enableEnergySystem)
            {
                CalculateOfflineEnergy();
            }
        }
        
        private void CalculateOfflineEnergy()
        {
            var timeAway = DateTime.Now - _lastEnergyRefill;
            var energyGained = Mathf.FloorToInt((float)timeAway.TotalSeconds / energyRefillTime);
            
            if (energyGained > 0)
            {
                _currentEnergy = Mathf.Min(_currentEnergy + energyGained, maxEnergy);
                _lastEnergyRefill = DateTime.Now;
                SaveEnergyData();
                
                OnEnergyRefilled?.Invoke(energyGained);
            }
        }
        
        private void StartEnergyRefill()
        {
            if (enableEnergySystem && _currentEnergy < maxEnergy)
            {
                _refillCoroutine = StartCoroutine(EnergyRefillCoroutine());
            }
        }
        
        private IEnumerator EnergyRefillCoroutine()
        {
            while (_currentEnergy < maxEnergy)
            {
                yield return new WaitForSeconds(energyRefillTime);
                
                if (_currentEnergy < maxEnergy)
                {
                    _currentEnergy++;
                    _lastEnergyRefill = DateTime.Now;
                    SaveEnergyData();
                    
                    OnEnergyChanged?.Invoke(_currentEnergy);
                    OnEnergyRefilled?.Invoke(1);
                    
                    if (_currentEnergy >= maxEnergy)
                    {
                        OnEnergyFull?.Invoke();
                        break;
                    }
                }
            }
        }
        
        public bool CanPlayLevel()
        {
            if (!enableEnergySystem) return true;
            return _currentEnergy >= energyPerLevel;
        }
        
        public bool TryConsumeEnergy(int amount = 1)
        {
            if (!enableEnergySystem) return true;
            
            if (_currentEnergy >= amount)
            {
                _currentEnergy -= amount;
                SaveEnergyData();
                
                OnEnergyChanged?.Invoke(_currentEnergy);
                
                if (_currentEnergy <= 0)
                {
                    OnEnergyDepleted?.Invoke();
                }
                
                // Track analytics
                var analytics = AdvancedAnalyticsSystem.Instance;
                if (analytics != null)
                {
                    analytics.TrackEvent("energy_consumed", new Dictionary<string, object>
                    {
                        ["amount"] = amount,
                        ["remaining"] = _currentEnergy,
                        ["max_energy"] = maxEnergy
                    });
                }
                
                return true;
            }
            
            return false;
        }
        
        public void AddEnergy(int amount)
        {
            _currentEnergy = Mathf.Min(_currentEnergy + amount, maxEnergy);
            SaveEnergyData();
            
            OnEnergyChanged?.Invoke(_currentEnergy);
            OnEnergyRefilled?.Invoke(amount);
            
            if (_currentEnergy >= maxEnergy)
            {
                OnEnergyFull?.Invoke();
            }
        }
        
        public bool RefillEnergyWithGems()
        {
            var economyManager = EconomyManager.Instance;
            if (economyManager == null) return false;
            
            if (economyManager.SpendCurrency("gems", energyRefillCost))
            {
                var energyNeeded = maxEnergy - _currentEnergy;
                AddEnergy(energyNeeded);
                
                // Track analytics
                var analytics = AdvancedAnalyticsSystem.Instance;
                if (analytics != null)
                {
                    analytics.TrackEvent("energy_refilled_gems", new Dictionary<string, object>
                    {
                        ["cost"] = energyRefillCost,
                        ["energy_gained"] = energyNeeded
                    });
                }
                
                return true;
            }
            
            return false;
        }
        
        public bool RefillEnergyWithAd()
        {
            if (!enableEnergyAds) return false;
            
            var timeSinceLastAd = DateTime.Now - _lastEnergyAd;
            if (timeSinceLastAd.TotalSeconds < energyAdCooldown)
            {
                return false; // Cooldown not met
            }
            
            // Show ad and reward energy
            var adManager = UnityAdsManager.Instance;
            if (adManager != null)
            {
                adManager.ShowRewarded(() =>
                {
                    AddEnergy(energyAdReward);
                    _lastEnergyAd = DateTime.Now;
                    SaveEnergyData();
                    
                    // Track analytics
                    var analytics = AdvancedAnalyticsSystem.Instance;
                    if (analytics != null)
                    {
                        analytics.TrackEvent("energy_refilled_ad", new Dictionary<string, object>
                        {
                            ["energy_gained"] = energyAdReward
                        });
                    }
                });
                
                return true;
            }
            
            return false;
        }
        
        public bool PurchaseEnergyPack(string packId)
        {
            if (!enableEnergyPacks) return false;
            
            var pack = Array.Find(energyPacks, p => p.id == packId);
            if (pack == null) return false;
            
            var economyManager = EconomyManager.Instance;
            if (economyManager == null) return false;
            
            if (economyManager.SpendCurrency(pack.costType, pack.cost))
            {
                AddEnergy(pack.energy);
                
                OnEnergyPackPurchased?.Invoke(pack);
                
                // Track analytics
                var analytics = AdvancedAnalyticsSystem.Instance;
                if (analytics != null)
                {
                    analytics.TrackEvent("energy_pack_purchased", new Dictionary<string, object>
                    {
                        ["pack_id"] = packId,
                        ["cost"] = pack.cost,
                        ["cost_type"] = pack.costType,
                        ["energy_gained"] = pack.energy
                    });
                }
                
                return true;
            }
            
            return false;
        }
        
        public EnergyPack[] GetAvailableEnergyPacks()
        {
            return energyPacks;
        }
        
        public int GetCurrentEnergy()
        {
            return _currentEnergy;
        }
        
        public int GetMaxEnergy()
        {
            return maxEnergy;
        }
        
        public float GetEnergyRefillProgress()
        {
            if (_currentEnergy >= maxEnergy) return 1f;
            
            var timeSinceLastRefill = DateTime.Now - _lastEnergyRefill;
            var progress = (float)timeSinceLastRefill.TotalSeconds / energyRefillTime;
            return Mathf.Clamp01(progress);
        }
        
        public int GetEnergyRefillTimeRemaining()
        {
            if (_currentEnergy >= maxEnergy) return 0;
            
            var timeSinceLastRefill = DateTime.Now - _lastEnergyRefill;
            var timeRemaining = energyRefillTime - (float)timeSinceLastRefill.TotalSeconds;
            return Mathf.Max(0, Mathf.RoundToInt(timeRemaining));
        }
        
        public bool CanWatchEnergyAd()
        {
            if (!enableEnergyAds) return false;
            
            var timeSinceLastAd = DateTime.Now - _lastEnergyAd;
            return timeSinceLastAd.TotalSeconds >= energyAdCooldown;
        }
        
        private void SaveEnergyData()
        {
            PlayerPrefs.SetInt("current_energy", _currentEnergy);
            PlayerPrefs.SetString("last_energy_refill", _lastEnergyRefill.ToString());
            PlayerPrefs.SetString("last_energy_ad", _lastEnergyAd.ToString());
            PlayerPrefs.Save();
        }
        
        void OnDestroy()
        {
            if (_refillCoroutine != null)
            {
                StopCoroutine(_refillCoroutine);
            }
            
            SaveEnergyData();
        }
    }
    
    [System.Serializable]
    public class EnergyPack
    {
        public string id;
        public string name;
        public int energy;
        public int cost;
        public string costType;
        public string description;
    }
}