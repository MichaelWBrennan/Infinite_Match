using System;
using UnityEngine;
using Evergreen.Economy;

namespace Evergreen.Monetization
{
    public class PiggyBankSystem : MonoBehaviour
    {
        public static PiggyBankSystem Instance { get; private set; }

        [Header("Piggy Bank Settings")]
        [Range(0f, 1f)] public float contributionRate = 0.10f; // 10% of relevant earnings
        public int capacity = 5000; // max coins in piggy bank
        public string trackedCurrencyId = "coins"; // capture a portion of soft-currency earnings

        private int _balance;
        private const string SaveKey = "piggy_bank_balance";

        public event Action<int, int> OnBalanceChanged; // old, new
        public event Action OnCashout;

        private void Awake()
        {
            if (Instance != null) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            _balance = PlayerPrefs.GetInt(SaveKey, 0);
            TrySubscribeCurrencyEvents();
        }

        private void TrySubscribeCurrencyEvents()
        {
            var cm = CurrencyManager.Instance;
            if (cm != null)
            {
                cm.OnCurrencyEarned += OnCurrencyEarned;
            }
        }

        private void OnDestroy()
        {
            var cm = CurrencyManager.Instance;
            if (cm != null)
            {
                cm.OnCurrencyEarned -= OnCurrencyEarned;
            }
        }

        private void OnCurrencyEarned(string currencyId, int amount, string source)
        {
            if (!string.Equals(currencyId, trackedCurrencyId, StringComparison.OrdinalIgnoreCase)) return;
            if (amount <= 0) return;

            int deposit = Mathf.FloorToInt(amount * contributionRate);
            if (deposit <= 0) return;

            int old = _balance;
            _balance = Mathf.Min(_balance + deposit, capacity);
            if (_balance != old)
            {
                PlayerPrefs.SetInt(SaveKey, _balance);
                PlayerPrefs.Save();
                OnBalanceChanged?.Invoke(old, _balance);
            }
        }

        public int GetBalance() => _balance;
        public bool IsFull() => _balance >= capacity;

        public bool CanCashout() => _balance > 0;

        public bool Cashout()
        {
            if (!CanCashout()) return false;
            var cm = CurrencyManager.Instance;
            if (cm == null) return false;

            int old = _balance;
            cm.AddCurrency(trackedCurrencyId, _balance, "piggy_bank_cashout");
            _balance = 0;
            PlayerPrefs.SetInt(SaveKey, _balance);
            PlayerPrefs.Save();
            OnBalanceChanged?.Invoke(old, _balance);
            OnCashout?.Invoke();
            return true;
        }
    }
}
