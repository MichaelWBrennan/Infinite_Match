using System;
using System.Collections.Generic;
using UnityEngine;
using Evergreen.Core;

namespace Evergreen.Economy
{
    /// <summary>
    /// Comprehensive currency management system for Unity games
    /// Handles multiple currencies, exchange rates, and currency operations
    /// </summary>
    public class CurrencyManager : MonoBehaviour
    {
        [Header("Currency Configuration")]
        [SerializeField] private CurrencyData[] currencies;
        [SerializeField] private ExchangeRate[] exchangeRates;
        [SerializeField] private bool enableCurrencyConversion = true;
        [SerializeField] private bool enableCurrencySinks = true;
        [SerializeField] private bool enableInflationControl = true;
        
        [Header("Inflation Control")]
        [SerializeField] private float inflationThreshold = 0.1f; // 10% inflation threshold
        [SerializeField] private float sinkMultiplier = 1.2f; // Increase sink costs when inflation detected
        [SerializeField] private float sourceMultiplier = 0.8f; // Decrease source rewards when inflation detected
        
        private Dictionary<string, CurrencyData> _currencies = new Dictionary<string, CurrencyData>();
        private Dictionary<string, ExchangeRate> _exchangeRates = new Dictionary<string, ExchangeRate>();
        private Dictionary<string, int> _currencyBalances = new Dictionary<string, int>();
        private Dictionary<string, CurrencyHistory> _currencyHistory = new Dictionary<string, CurrencyHistory>();
        
        // Events
        public System.Action<string, int, int> OnCurrencyChanged; // currencyId, oldAmount, newAmount
        public System.Action<string, int, string> OnCurrencySpent; // currencyId, amount, reason
        public System.Action<string, int, string> OnCurrencyEarned; // currencyId, amount, source
        public System.Action<string, string, int, float> OnCurrencyExchanged; // fromCurrency, toCurrency, amount, rate
        
        public static CurrencyManager Instance { get; private set; }
        
        [System.Serializable]
        public class CurrencyData
        {
            public string id;
            public string name;
            public string symbol;
            public string description;
            public bool isPrimary;
            public bool isHardCurrency;
            public bool isTradeable;
            public int decimalPlaces;
            public string iconPath;
            public Color displayColor = Color.white;
            public int maxAmount = int.MaxValue;
            public int minAmount = 0;
        }
        
        [System.Serializable]
        public class ExchangeRate
        {
            public string fromCurrency;
            public string toCurrency;
            public float rate;
            public float minRate;
            public float maxRate;
            public bool isActive;
            public DateTime lastUpdated;
        }
        
        [System.Serializable]
        public class CurrencyHistory
        {
            public string currencyId;
            public List<CurrencyTransaction> transactions = new List<CurrencyTransaction>();
            public int totalEarned;
            public int totalSpent;
            public float averageBalance;
            public DateTime lastUpdated;
        }
        
        [System.Serializable]
        public class CurrencyTransaction
        {
            public string type; // "earn", "spend", "exchange"
            public int amount;
            public string source; // "level_complete", "purchase", "ad_reward", etc.
            public string reason; // "level_1", "shop_item", "energy_refill", etc.
            public DateTime timestamp;
            public int balanceAfter;
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeCurrencysystemSafe();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            LoadCurrencyData();
            SetupDefaultCurrencies();
            SetupExchangeRates();
            StartCoroutine(UpdateCurrencysystemSafe());
        }
        
        private void InitializeCurrencysystemSafe()
        {
            Debug.Log("Currency Manager initialized");
        }
        
        private void SetupDefaultCurrencies()
        {
            if (currencies == null || currencies.Length == 0)
            {
                currencies = new CurrencyData[]
                {
                    new CurrencyData
                    {
                        id = "coins",
                        name = "Coins",
                        symbol = "C",
                        description = "Primary soft currency earned through gameplay",
                        isPrimary = true,
                        isHardCurrency = false,
                        isTradeable = true,
                        decimalPlaces = 0,
                        iconPath = "UI/Currency/Coins",
                        displayColor = new Color(1f, 0.84f, 0f), // Gold
                        maxAmount = 999999,
                        minAmount = 0
                    },
                    new CurrencyData
                    {
                        id = "gems",
                        name = "Gems",
                        symbol = "G",
                        description = "Premium hard currency for special purchases",
                        isPrimary = false,
                        isHardCurrency = true,
                        isTradeable = true,
                        decimalPlaces = 0,
                        iconPath = "UI/Currency/Gems",
                        displayColor = new Color(0.5f, 0f, 1f), // Purple
                        maxAmount = 99999,
                        minAmount = 0
                    },
                    new CurrencyData
                    {
                        id = "energy",
                        name = "Energy",
                        symbol = "E",
                        description = "Energy required to play levels",
                        isPrimary = false,
                        isHardCurrency = false,
                        isTradeable = false,
                        decimalPlaces = 0,
                        iconPath = "UI/Currency/Energy",
                        displayColor = new Color(0f, 1f, 0f), // Green
                        maxAmount = 30,
                        minAmount = 0
                    },
                    new CurrencyData
                    {
                        id = "stars",
                        name = "Stars",
                        symbol = "★",
                        description = "Achievement currency earned by completing levels with high scores",
                        isPrimary = false,
                        isHardCurrency = false,
                        isTradeable = true,
                        decimalPlaces = 0,
                        iconPath = "UI/Currency/Stars",
                        displayColor = new Color(1f, 1f, 0f), // Yellow
                        maxAmount = 9999,
                        minAmount = 0
                    }
                };
            }
            
            foreach (var currency in currencies)
            {
                _currencies[currency.id] = currency;
                if (!_currencyBalances.ContainsKey(currency.id))
                {
                    _currencyBalances[currency.id] = currency.minAmount;
                }
                if (!_currencyHistory.ContainsKey(currency.id))
                {
                    _currencyHistory[currency.id] = new CurrencyHistory
                    {
                        currencyId = currency.id,
                        totalEarned = 0,
                        totalSpent = 0,
                        averageBalance = 0,
                        lastUpdated = DateTime.Now
                    };
                }
            }
        }
        
        private void SetupExchangeRates()
        {
            if (exchangeRates == null || exchangeRates.Length == 0)
            {
                exchangeRates = new ExchangeRate[]
                {
                    new ExchangeRate
                    {
                        fromCurrency = "coins",
                        toCurrency = "gems",
                        rate = 100f, // 100 coins = 1 gem
                        minRate = 50f,
                        maxRate = 200f,
                        isActive = true,
                        lastUpdated = DateTime.Now
                    },
                    new ExchangeRate
                    {
                        fromCurrency = "gems",
                        toCurrency = "coins",
                        rate = 0.01f, // 1 gem = 100 coins
                        minRate = 0.005f,
                        maxRate = 0.02f,
                        isActive = true,
                        lastUpdated = DateTime.Now
                    },
                    new ExchangeRate
                    {
                        fromCurrency = "stars",
                        toCurrency = "coins",
                        rate = 10f, // 1 star = 10 coins
                        minRate = 5f,
                        maxRate = 20f,
                        isActive = true,
                        lastUpdated = DateTime.Now
                    }
                };
            }
            
            foreach (var rate in exchangeRates)
            {
                string key = $"{rate.fromCurrency}_{rate.toCurrency}";
                _exchangeRates[key] = rate;
            }
        }
        
        public int GetCurrency(string currencyId)
        {
            return _currencyBalances.ContainsKey(currencyId) ? _currencyBalances[currencyId] : 0;
        }
        
        public bool AddCurrency(string currencyId, int amount, string source = "unknown")
        {
            if (!_currencies.ContainsKey(currencyId) || amount <= 0) return false;
            
            var currency = _currencies[currencyId];
            int oldAmount = _currencyBalances[currencyId];
            int newAmount = Mathf.Min(oldAmount + amount, currency.maxAmount);
            
            if (newAmount != oldAmount)
            {
                _currencyBalances[currencyId] = newAmount;
                
                // Record transaction
                RecordTransaction(currencyId, "earn", amount, source, "currency_earned", newAmount);
                
                // Update history
                UpdateCurrencyHistory(currencyId, amount, 0);
                
                // Fire events
                OnCurrencyChanged?.Invoke(currencyId, oldAmount, newAmount);
                OnCurrencyEarned?.Invoke(currencyId, amount, source);
                
                SaveCurrencyData();
                return true;
            }
            
            return false;
        }
        
        /// <summary>
        /// Set currency amount directly
        /// </summary>
        public void SetCurrency(string currencyId, int amount)
        {
            if (!_currencies.ContainsKey(currencyId)) return;
            
            var currency = _currencies[currencyId];
            int oldAmount = _currencyBalances[currencyId];
            int newAmount = Mathf.Clamp(amount, currency.minAmount, currency.maxAmount);
            
            if (newAmount != oldAmount)
            {
                _currencyBalances[currencyId] = newAmount;
                
                // Fire events
                OnCurrencyChanged?.Invoke(currencyId, oldAmount, newAmount);
                
                SaveCurrencyData();
            }
        }
        
        public bool SpendCurrency(string currencyId, int amount, string reason = "unknown")
        {
            if (!_currencies.ContainsKey(currencyId) || amount <= 0) return false;
            
            int currentAmount = _currencyBalances[currencyId];
            if (currentAmount < amount) return false;
            
            int newAmount = Mathf.Max(currentAmount - amount, _currencies[currencyId].minAmount);
            _currencyBalances[currencyId] = newAmount;
            
            // Record transaction
            RecordTransaction(currencyId, "spend", amount, "currency_spent", reason, newAmount);
            
            // Update history
            UpdateCurrencyHistory(currencyId, 0, amount);
            
            // Fire events
            OnCurrencyChanged?.Invoke(currencyId, currentAmount, newAmount);
            OnCurrencySpent?.Invoke(currencyId, amount, reason);
            
            SaveCurrencyData();
            return true;
        }
        
        public bool ExchangeCurrency(string fromCurrency, string toCurrency, int amount)
        {
            if (!enableCurrencyConversion) return false;
            
            string exchangeKey = $"{fromCurrency}_{toCurrency}";
            if (!_exchangeRates.ContainsKey(exchangeKey)) return false;
            
            var exchangeRate = _exchangeRates[exchangeKey];
            if (!exchangeRate.isActive) return false;
            
            if (!SpendCurrency(fromCurrency, amount, $"exchange_to_{toCurrency}")) return false;
            
            int convertedAmount = Mathf.RoundToInt(amount * exchangeRate.rate);
            if (convertedAmount <= 0) return false;
            
            if (AddCurrency(toCurrency, convertedAmount, $"exchange_from_{fromCurrency}"))
            {
                OnCurrencyExchanged?.Invoke(fromCurrency, toCurrency, amount, exchangeRate.rate);
                return true;
            }
            
            // Refund if conversion failed
            AddCurrency(fromCurrency, amount, "exchange_refund");
            return false;
        }
        
        public bool CanAfford(string currencyId, int amount)
        {
            return GetCurrency(currencyId) >= amount;
        }
        
        public bool CanExchange(string fromCurrency, string toCurrency, int amount)
        {
            if (!enableCurrencyConversion) return false;
            
            string exchangeKey = $"{fromCurrency}_{toCurrency}";
            if (!_exchangeRates.ContainsKey(exchangeKey)) return false;
            
            var exchangeRate = _exchangeRates[exchangeKey];
            if (!exchangeRate.isActive) return false;
            
            return CanAfford(fromCurrency, amount);
        }
        
        public float GetExchangeRate(string fromCurrency, string toCurrency)
        {
            string exchangeKey = $"{fromCurrency}_{toCurrency}";
            return _exchangeRates.ContainsKey(exchangeKey) ? _exchangeRates[exchangeKey].rate : 0f;
        }
        
        public int GetExchangeAmount(string fromCurrency, string toCurrency, int amount)
        {
            float rate = GetExchangeRate(fromCurrency, toCurrency);
            return Mathf.RoundToInt(amount * rate);
        }
        
        public CurrencyData GetCurrencyData(string currencyId)
        {
            return _currencies.ContainsKey(currencyId) ? _currencies[currencyId] : null;
        }
        
        public List<CurrencyData> GetAllCurrencies()
        {
            return new List<CurrencyData>(_currencies.Values);
        }
        
        public List<CurrencyData> GetTradeableCurrencies()
        {
            var tradeableCurrencies = new List<CurrencyData>();
            foreach (var currency in _currencies.Values)
            {
                if (currency.isTradeable)
                {
                    tradeableCurrencies.Add(currency);
                }
            }
            return tradeableCurrencies;
        }
        
        public CurrencyHistory GetCurrencyHistory(string currencyId)
        {
            return _currencyHistory.ContainsKey(currencyId) ? _currencyHistory[currencyId] : null;
        }
        
        private void RecordTransaction(string currencyId, string type, int amount, string source, string reason, int balanceAfter)
        {
            if (!_currencyHistory.ContainsKey(currencyId)) return;
            
            var transaction = new CurrencyTransaction
            {
                type = type,
                amount = amount,
                source = source,
                reason = reason,
                timestamp = DateTime.Now,
                balanceAfter = balanceAfter
            };
            
            _currencyHistory[currencyId].transactions.Add(transaction);
            
            // Keep only last 100 transactions
            if (_currencyHistory[currencyId].transactions.Count > 100)
            {
                _currencyHistory[currencyId].transactions.RemoveAt(0);
            }
        }
        
        private void UpdateCurrencyHistory(string currencyId, int earned, int spent)
        {
            if (!_currencyHistory.ContainsKey(currencyId)) return;
            
            var history = _currencyHistory[currencyId];
            history.totalEarned += earned;
            history.totalSpent += spent;
            history.averageBalance = (_currencyBalances[currencyId] + history.averageBalance) / 2f;
            history.lastUpdated = DateTime.Now;
        }
        
        private System.Collections.IEnumerator UpdateCurrencysystemSafe()
        {
            while (true)
            {
                // Update exchange rates based on market conditions
                UpdateExchangeRates();
                
                // Check for inflation and adjust economy
                if (enableInflationControl)
                {
                    CheckAndControlInflation();
                }
                
                // Update currency history
                UpdateAllCurrencyHistory();
                
                yield return new WaitForSeconds(60f); // Update every minute
            }
        }
        
        private void UpdateExchangeRates()
        {
            // This would integrate with your analytics system to adjust rates based on player behavior
            foreach (var rate in _exchangeRates.Values)
            {
                // Simulate market fluctuations
                float fluctuation = UnityEngine.Random.Range(-0.05f, 0.05f);
                rate.rate = Mathf.Clamp(rate.rate * (1f + fluctuation), rate.minRate, rate.maxRate);
                rate.lastUpdated = DateTime.Now;
            }
        }
        
        private void CheckAndControlInflation()
        {
            foreach (var currencyId in _currencies.Keys)
            {
                var history = _currencyHistory[currencyId];
                if (history.transactions.Count < 10) continue; // Need enough data
                
                // Calculate inflation rate based on recent transactions
                float inflationRate = CalculateInflationRate(currencyId);
                
                if (inflationRate > inflationThreshold)
                {
                    // Increase sink costs and decrease source rewards
                    AdjustEconomyBalance(currencyId, true);
                }
                else if (inflationRate < -inflationThreshold)
                {
                    // Decrease sink costs and increase source rewards
                    AdjustEconomyBalance(currencyId, false);
                }
            }
        }
        
        private float CalculateInflationRate(string currencyId)
        {
            var history = _currencyHistory[currencyId];
            if (history.transactions.Count < 10) return 0f;
            
            // Simple inflation calculation based on recent transaction patterns
            var recentTransactions = history.transactions.GetRange(Mathf.Max(0, history.transactions.Count - 10), 
                Mathf.Min(10, history.transactions.Count));
            
            int recentEarned = 0;
            int recentSpent = 0;
            
            foreach (var transaction in recentTransactions)
            {
                if (transaction.type == "earn")
                    recentEarned += transaction.amount;
                else if (transaction.type == "spend")
                    recentSpent += transaction.amount;
            }
            
            if (recentSpent == 0) return 0f;
            
            return (float)(recentEarned - recentSpent) / recentSpent;
        }
        
        private void AdjustEconomyBalance(string currencyId, bool increaseSinks)
        {
            // This would integrate with your game systems to adjust costs and rewards
            Debug.Log($"Adjusting economy balance for {currencyId}: {(increaseSinks ? "increasing sinks" : "decreasing sinks")}");
        }
        
        private void UpdateAllCurrencyHistory()
        {
            foreach (var currencyId in _currencyHistory.Keys)
            {
                UpdateCurrencyHistory(currencyId, 0, 0);
            }
        }
        
        private void SaveCurrencyData()
        {
            var saveData = new CurrencySaveData
            {
                currencyBalances = new Dictionary<string, int>(_currencyBalances),
                currencyHistory = new Dictionary<string, CurrencyHistory>(_currencyHistory)
            };
            
            string json = JsonUtility.ToJson(saveData, true);
            System.IO.File.WriteAllText(Application.persistentDataPath + "/currency_data.json", json);
        }
        
        private void LoadCurrencyData()
        {
            string path = Application.persistentDataPath + "/currency_data.json";
            if (System.IO.File.Exists(path))
            {
                try
                {
                    string json = System.IO.File.ReadAllText(path);
                    var saveData = JsonUtility.FromJson<CurrencySaveData>(json);
                    
                    if (saveData.currencyBalances != null)
                    {
                        _currencyBalances = saveData.currencyBalances;
                    }
                    
                    if (saveData.currencyHistory != null)
                    {
                        _currencyHistory = saveData.currencyHistory;
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"Failed to load currency data: {e.Message}");
                }
            }
        }
        
        [System.Serializable]
        private class CurrencySaveData
        {
            public Dictionary<string, int> currencyBalances;
            public Dictionary<string, CurrencyHistory> currencyHistory;
        }
        
        void OnDestroy()
        {
            SaveCurrencyData();
        }
    }
}