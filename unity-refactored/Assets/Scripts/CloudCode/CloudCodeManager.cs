using System;
using System.Collections;
using UnityEngine;
using Economy;

namespace CloudCode
{
    public class CloudCodeManager : MonoBehaviour
    {
        [Header("Cloud Code Settings")]
        public bool debugMode = true;
        public float simulatedDelay = 0.5f;
        
        public static CloudCodeManager Instance { get; private set; }
        
        // Events
        public static event Action<string, bool> OnCloudCodeResult;
        public static event Action<string, string> OnCloudCodeError;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
            }
        }

        // Simulated Cloud Code Functions
        public void AddCurrency(string playerId, string currencyId, int amount)
        {
            StartCoroutine(SimulateCloudCodeCall(() =>
            {
                if (EconomyManager.Instance != null)
                {
                    bool success = EconomyManager.Instance.AddCurrency(currencyId, amount);
                    OnCloudCodeResult?.Invoke($"AddCurrency_{playerId}_{currencyId}_{amount}", success);
                    
                    if (debugMode)
                    {
                        Debug.Log($"[CloudCode] AddCurrency: Player {playerId}, Currency {currencyId}, Amount {amount}, Success: {success}");
                    }
                }
                else
                {
                    OnCloudCodeError?.Invoke("AddCurrency", "EconomyManager not found");
                }
            }));
        }

        public void SpendCurrency(string playerId, string currencyId, int amount)
        {
            StartCoroutine(SimulateCloudCodeCall(() =>
            {
                if (EconomyManager.Instance != null)
                {
                    bool success = EconomyManager.Instance.SpendCurrency(currencyId, amount);
                    OnCloudCodeResult?.Invoke($"SpendCurrency_{playerId}_{currencyId}_{amount}", success);
                    
                    if (debugMode)
                    {
                        Debug.Log($"[CloudCode] SpendCurrency: Player {playerId}, Currency {currencyId}, Amount {amount}, Success: {success}");
                    }
                }
                else
                {
                    OnCloudCodeError?.Invoke("SpendCurrency", "EconomyManager not found");
                }
            }));
        }

        public void AddInventoryItem(string playerId, string itemId, int quantity)
        {
            StartCoroutine(SimulateCloudCodeCall(() =>
            {
                if (EconomyManager.Instance != null)
                {
                    bool success = EconomyManager.Instance.AddInventoryItem(itemId, quantity);
                    OnCloudCodeResult?.Invoke($"AddInventoryItem_{playerId}_{itemId}_{quantity}", success);
                    
                    if (debugMode)
                    {
                        Debug.Log($"[CloudCode] AddInventoryItem: Player {playerId}, Item {itemId}, Quantity {quantity}, Success: {success}");
                    }
                }
                else
                {
                    OnCloudCodeError?.Invoke("AddInventoryItem", "EconomyManager not found");
                }
            }));
        }

        public void UseInventoryItem(string playerId, string itemId, int quantity)
        {
            StartCoroutine(SimulateCloudCodeCall(() =>
            {
                if (EconomyManager.Instance != null)
                {
                    bool success = EconomyManager.Instance.UseInventoryItem(itemId, quantity);
                    OnCloudCodeResult?.Invoke($"UseInventoryItem_{playerId}_{itemId}_{quantity}", success);
                    
                    if (debugMode)
                    {
                        Debug.Log($"[CloudCode] UseInventoryItem: Player {playerId}, Item {itemId}, Quantity {quantity}, Success: {success}");
                    }
                }
                else
                {
                    OnCloudCodeError?.Invoke("UseInventoryItem", "EconomyManager not found");
                }
            }));
        }

        // Simulate network delay for Cloud Code calls
        private IEnumerator SimulateCloudCodeCall(Action callback)
        {
            yield return new WaitForSeconds(simulatedDelay);
            callback?.Invoke();
        }

        // Utility methods for testing
        public void TestAllCloudCodeFunctions()
        {
            if (debugMode)
            {
                Debug.Log("[CloudCode] Testing all Cloud Code functions...");
                
                AddCurrency("test_player", "coins", 100);
                SpendCurrency("test_player", "coins", 50);
                AddInventoryItem("test_player", "booster_extra_moves", 2);
                UseInventoryItem("test_player", "booster_extra_moves", 1);
            }
        }
    }
}
