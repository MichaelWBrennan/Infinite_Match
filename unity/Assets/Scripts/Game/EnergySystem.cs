using UnityEngine;
using System;
using Evergreen.Core;

namespace Evergreen.Game
{
    [System.Serializable]
    public class EnergyData
    {
        public int currentEnergy;
        public int maxEnergy;
        public DateTime lastEnergyTime;
        public int energyPerLevel = 1;
        public int energyPerHour = 1;
        public int maxEnergyCap = 30;
        public int energyRefillCost = 10; // Gems
        public int energyRefillAmount = 5;
    }

    public class EnergySystem : MonoBehaviour
    {
        [Header("Energy Settings")]
        public EnergyData energyData = new EnergyData();
        
        [Header("UI References")]
        public UnityEngine.UI.Text energyText;
        public UnityEngine.UI.Button refillButton;
        public UnityEngine.UI.Slider energySlider;
        
        // Events
        public System.Action<int, int> OnEnergyChanged; // current, max
        public System.Action OnEnergyRefilled;
        public System.Action OnEnergyDepleted;
        
        public static EnergySystem Instance { get; private set; }
        
        private bool _isInitialized = false;
        
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
            UpdateEnergyDisplay();
            SetupUI();
        }
        
        void Update()
        {
            if (_isInitialized)
            {
                UpdateEnergyOverTime();
            }
        }
        
        private void InitializeEnergySystem()
        {
            if (energyData.currentEnergy == 0)
            {
                energyData.currentEnergy = energyData.maxEnergy;
                energyData.lastEnergyTime = DateTime.Now;
            }
            _isInitialized = true;
        }
        
        private void SetupUI()
        {
            if (refillButton != null)
            {
                refillButton.onClick.AddListener(OnRefillButtonClicked);
            }
        }
        
        private void UpdateEnergyOverTime()
        {
            if (energyData.currentEnergy >= energyData.maxEnergyCap)
                return;
                
            DateTime now = DateTime.Now;
            TimeSpan timeSinceLastUpdate = now - energyData.lastEnergyTime;
            
            int energyToAdd = Mathf.FloorToInt((float)timeSinceLastUpdate.TotalHours * energyData.energyPerHour);
            
            if (energyToAdd > 0)
            {
                AddEnergy(energyToAdd);
                energyData.lastEnergyTime = now;
                SaveEnergyData();
            }
        }
        
        public bool CanPlayLevel()
        {
            return energyData.currentEnergy >= energyData.energyPerLevel;
        }
        
        public bool ConsumeEnergyForLevel()
        {
            if (!CanPlayLevel())
                return false;
                
            energyData.currentEnergy -= energyData.energyPerLevel;
            energyData.lastEnergyTime = DateTime.Now;
            
            UpdateEnergyDisplay();
            OnEnergyChanged?.Invoke(energyData.currentEnergy, energyData.maxEnergy);
            
            if (energyData.currentEnergy <= 0)
            {
                OnEnergyDepleted?.Invoke();
            }
            
            SaveEnergyData();
            return true;
        }
        
        public void AddEnergy(int amount)
        {
            int oldEnergy = energyData.currentEnergy;
            energyData.currentEnergy = Mathf.Min(energyData.currentEnergy + amount, energyData.maxEnergyCap);
            
            if (energyData.currentEnergy > oldEnergy)
            {
                UpdateEnergyDisplay();
                OnEnergyChanged?.Invoke(energyData.currentEnergy, energyData.maxEnergy);
            }
        }
        
        public void RefillEnergy()
        {
            var gameManager = ServiceLocator.Get<GameManager>();
            if (gameManager == null) return;
            
            int gems = gameManager.GetCurrency("gems");
            if (gems >= energyData.energyRefillCost)
            {
                gameManager.SpendCurrency("gems", energyData.energyRefillCost);
                AddEnergy(energyData.energyRefillAmount);
                OnEnergyRefilled?.Invoke();
                
                // Show reward message
                Debug.Log($"Energy refilled! +{energyData.energyRefillAmount} energy");
            }
            else
            {
                Debug.Log("Not enough gems to refill energy!");
            }
        }
        
        public void RefillEnergyWithAd()
        {
            // This would integrate with your ad system
            var adManager = ServiceLocator.Get<UnityAdsManager>();
            if (adManager != null)
            {
                adManager.ShowRewardedAd("energy_refill", (success) => {
                    if (success)
                    {
                        AddEnergy(energyData.energyRefillAmount);
                        OnEnergyRefilled?.Invoke();
                        Debug.Log("Energy refilled with ad!");
                    }
                });
            }
        }
        
        public void IncreaseMaxEnergy(int amount)
        {
            energyData.maxEnergy += amount;
            energyData.maxEnergyCap += amount;
            UpdateEnergyDisplay();
            OnEnergyChanged?.Invoke(energyData.currentEnergy, energyData.maxEnergy);
            SaveEnergyData();
        }
        
        public void SetEnergyPerHour(int amount)
        {
            energyData.energyPerHour = amount;
        }
        
        public void SetEnergyRefillCost(int cost)
        {
            energyData.energyRefillCost = cost;
        }
        
        public int GetCurrentEnergy()
        {
            return energyData.currentEnergy;
        }
        
        public int GetMaxEnergy()
        {
            return energyData.maxEnergy;
        }
        
        public float GetEnergyPercentage()
        {
            return (float)energyData.currentEnergy / energyData.maxEnergy;
        }
        
        public TimeSpan GetTimeToNextEnergy()
        {
            if (energyData.currentEnergy >= energyData.maxEnergyCap)
                return TimeSpan.Zero;
                
            DateTime now = DateTime.Now;
            TimeSpan timeSinceLastUpdate = now - energyData.lastEnergyTime;
            TimeSpan timeToNextEnergy = TimeSpan.FromHours(1.0 / energyData.energyPerHour) - timeSinceLastUpdate;
            
            return timeToNextEnergy > TimeSpan.Zero ? timeToNextEnergy : TimeSpan.Zero;
        }
        
        private void UpdateEnergyDisplay()
        {
            if (energyText != null)
            {
                energyText.text = $"{energyData.currentEnergy}/{energyData.maxEnergy}";
            }
            
            if (energySlider != null)
            {
                energySlider.value = GetEnergyPercentage();
            }
            
            if (refillButton != null)
            {
                var gameManager = ServiceLocator.Get<GameManager>();
                if (gameManager != null)
                {
                    int gems = gameManager.GetCurrency("gems");
                    refillButton.interactable = gems >= energyData.energyRefillCost && 
                                              energyData.currentEnergy < energyData.maxEnergyCap;
                }
            }
        }
        
        private void OnRefillButtonClicked()
        {
            RefillEnergy();
        }
        
        private void SaveEnergyData()
        {
            string json = JsonUtility.ToJson(energyData, true);
            System.IO.File.WriteAllText(Application.persistentDataPath + "/energy_data.json", json);
        }
        
        private void LoadEnergyData()
        {
            string path = Application.persistentDataPath + "/energy_data.json";
            if (System.IO.File.Exists(path))
            {
                string json = System.IO.File.ReadAllText(path);
                var loadedData = JsonUtility.FromJson<EnergyData>(json);
                
                // Merge loaded data with current data
                energyData.currentEnergy = loadedData.currentEnergy;
                energyData.maxEnergy = loadedData.maxEnergy;
                energyData.lastEnergyTime = loadedData.lastEnergyTime;
                energyData.energyPerLevel = loadedData.energyPerLevel;
                energyData.energyPerHour = loadedData.energyPerHour;
                energyData.maxEnergyCap = loadedData.maxEnergyCap;
                energyData.energyRefillCost = loadedData.energyRefillCost;
                energyData.energyRefillAmount = loadedData.energyRefillAmount;
            }
        }
        
        public void ResetEnergy()
        {
            energyData.currentEnergy = energyData.maxEnergy;
            energyData.lastEnergyTime = DateTime.Now;
            UpdateEnergyDisplay();
            OnEnergyChanged?.Invoke(energyData.currentEnergy, energyData.maxEnergy);
            SaveEnergyData();
        }
        
        public void SetEnergyData(EnergyData newData)
        {
            energyData = newData;
            UpdateEnergyDisplay();
            OnEnergyChanged?.Invoke(energyData.currentEnergy, energyData.maxEnergy);
            SaveEnergyData();
        }
    }
}