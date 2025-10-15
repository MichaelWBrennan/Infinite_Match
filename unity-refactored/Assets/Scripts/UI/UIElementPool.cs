using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Evergreen.Core;

namespace Evergreen.UI
{
    /// <summary>
    /// Pooled UI element system for efficient UI management
    /// </summary>
    public class UIElementPool : MonoBehaviour
    {
        [Header("Pool Settings")]
        public GameObject textElementPrefab;
        public GameObject buttonElementPrefab;
        public GameObject imageElementPrefab;
        public int initialPoolSize = 50;
        public int maxPoolSize = 200;
        
        private Dictionary<string, Queue<GameObject>> _pools = new Dictionary<string, Queue<GameObject>>();
        private Dictionary<string, int> _activeCounts = new Dictionary<string, int>();
        private Dictionary<string, int> _totalCreated = new Dictionary<string, int>();
        private Transform _poolParent;
        
        public static UIElementPool Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializePools();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        private void InitializePools()
        {
            _poolParent = new GameObject("UIElementPool").transform;
            _poolParent.SetParent(transform);
            
            // Initialize text element pool
            if (textElementPrefab != null)
            {
                InitializePool("TextElement", textElementPrefab);
            }
            
            // Initialize button element pool
            if (buttonElementPrefab != null)
            {
                InitializePool("ButtonElement", buttonElementPrefab);
            }
            
            // Initialize image element pool
            if (imageElementPrefab != null)
            {
                InitializePool("ImageElement", imageElementPrefab);
            }
            
            Logger.Info("UI Element Pool initialized", "UIElementPool");
        }
        
        private void InitializePool(string poolName, GameObject prefab)
        {
            if (!_pools.ContainsKey(poolName))
            {
                _pools[poolName] = new Queue<GameObject>();
                _activeCounts[poolName] = 0;
                _totalCreated[poolName] = 0;
            }
            
            // Pre-populate pool
            for (int i = 0; i < initialPoolSize; i++)
            {
                var obj = Instantiate(prefab, _poolParent);
                obj.SetActive(false);
                _pools[poolName].Enqueue(obj);
                _totalCreated[poolName]++;
            }
        }
        
        public GameObject GetElement(string poolName)
        {
            if (!_pools.ContainsKey(poolName))
            {
                Logger.Warning($"Pool '{poolName}' not found", "UIElementPool");
                return null;
            }
            
            GameObject element;
            
            if (_pools[poolName].Count > 0)
            {
                element = _pools[poolName].Dequeue();
            }
            else if (_totalCreated[poolName] < maxPoolSize)
            {
                // Create new element if under max size
                var prefab = GetPrefabForPool(poolName);
                if (prefab != null)
                {
                    element = Instantiate(prefab, _poolParent);
                    _totalCreated[poolName]++;
                }
                else
                {
                    Logger.Warning($"No prefab found for pool '{poolName}'", "UIElementPool");
                    return null;
                }
            }
            else
            {
                // Pool is full, create temporary element
                var prefab = GetPrefabForPool(poolName);
                element = prefab != null ? Instantiate(prefab, _poolParent) : null;
            }
            
            if (element != null)
            {
                element.SetActive(true);
                _activeCounts[poolName]++;
            }
            
            return element;
        }
        
        public void ReturnElement(string poolName, GameObject element)
        {
            if (element == null || !_pools.ContainsKey(poolName)) return;
            
            element.SetActive(false);
            element.transform.SetParent(_poolParent);
            
            // Reset element state
            ResetElement(element);
            
            if (_pools[poolName].Count < maxPoolSize)
            {
                _pools[poolName].Enqueue(element);
            }
            else
            {
                Destroy(element);
            }
            
            _activeCounts[poolName] = Mathf.Max(0, _activeCounts[poolName] - 1);
        }
        
        private void ResetElement(GameObject element)
        {
            // Reset text components
            var textComponent = element.GetComponent<Text>();
            if (textComponent != null)
            {
                textComponent.text = "";
                textComponent.color = Color.white;
            }
            
            var tmpText = element.GetComponent<TextMeshProUGUI>();
            if (tmpText != null)
            {
                tmpText.text = "";
                tmpText.color = Color.white;
            }
            
            // Reset button components
            var button = element.GetComponent<Button>();
            if (button != null)
            {
                button.onClick.RemoveAllListeners();
            }
            
            // Reset image components
            var image = element.GetComponent<Image>();
            if (image != null)
            {
                image.sprite = null;
                image.color = Color.white;
            }
        }
        
        private GameObject GetPrefabForPool(string poolName)
        {
            switch (poolName)
            {
                case "TextElement": return textElementPrefab;
                case "ButtonElement": return buttonElementPrefab;
                case "ImageElement": return imageElementPrefab;
                default: return null;
            }
        }
        
        public int GetPooledCount(string poolName)
        {
            return _pools.ContainsKey(poolName) ? _pools[poolName].Count : 0;
        }
        
        public int GetActiveCount(string poolName)
        {
            return _activeCounts.ContainsKey(poolName) ? _activeCounts[poolName] : 0;
        }
        
        public int GetTotalCreated(string poolName)
        {
            return _totalCreated.ContainsKey(poolName) ? _totalCreated[poolName] : 0;
        }
        
        public Dictionary<string, object> GetPoolStatistics()
        {
            var stats = new Dictionary<string, object>();
            
            foreach (var poolName in _pools.Keys)
            {
                stats[poolName] = new Dictionary<string, object>
                {
                    {"pooled_count", GetPooledCount(poolName)},
                    {"active_count", GetActiveCount(poolName)},
                    {"total_created", GetTotalCreated(poolName)},
                    {"utilization_rate", GetActiveCount(poolName) / (float)Mathf.Max(1, GetTotalCreated(poolName))}
                };
            }
            
            return stats;
        }
        
        public void ClearPool(string poolName)
        {
            if (!_pools.ContainsKey(poolName)) return;
            
            while (_pools[poolName].Count > 0)
            {
                var element = _pools[poolName].Dequeue();
                if (element != null)
                {
                    Destroy(element);
                }
            }
            
            _activeCounts[poolName] = 0;
            _totalCreated[poolName] = 0;
        }
        
        public void ClearAllPools()
        {
            foreach (var poolName in _pools.Keys)
            {
                ClearPool(poolName);
            }
        }
        
        void OnDestroy()
        {
            ClearAllPools();
        }
    }
    
    /// <summary>
    /// UI element pool manager for specific UI components
    /// </summary>
    public class UIElementPoolManager : MonoBehaviour
    {
        [Header("Pool References")]
        public UIElementPool elementPool;
        
        private Dictionary<string, List<GameObject>> _activeElements = new Dictionary<string, List<GameObject>>();
        
        void Start()
        {
            if (elementPool == null)
            {
                elementPool = FindObjectOfType<UIElementPool>();
            }
        }
        
        public GameObject CreateTextElement(string text, Vector2 position, Transform parent = null)
        {
            var element = elementPool?.GetElement("TextElement");
            if (element == null) return null;
            
            var textComponent = element.GetComponent<TextMeshProUGUI>();
            if (textComponent != null)
            {
                textComponent.text = text;
            }
            
            var rectTransform = element.GetComponent<RectTransform>();
            if (rectTransform != null)
            {
                rectTransform.anchoredPosition = position;
                rectTransform.SetParent(parent, false);
            }
            
            if (!_activeElements.ContainsKey("TextElement"))
            {
                _activeElements["TextElement"] = new List<GameObject>();
            }
            _activeElements["TextElement"].Add(element);
            
            return element;
        }
        
        public void ReturnTextElement(GameObject element)
        {
            if (element == null) return;
            
            if (_activeElements.ContainsKey("TextElement"))
            {
                _activeElements["TextElement"].Remove(element);
            }
            
            elementPool?.ReturnElement("TextElement", element);
        }
        
        public void ReturnAllElements(string poolName)
        {
            if (!_activeElements.ContainsKey(poolName)) return;
            
            foreach (var element in _activeElements[poolName])
            {
                elementPool?.ReturnElement(poolName, element);
            }
            
            _activeElements[poolName].Clear();
        }
        
        public void ReturnAllElements()
        {
            foreach (var poolName in _activeElements.Keys)
            {
                ReturnAllElements(poolName);
            }
        }
        
        public Dictionary<string, object> GetActiveElementStatistics()
        {
            var stats = new Dictionary<string, object>();
            
            foreach (var kvp in _activeElements)
            {
                stats[kvp.Key] = new Dictionary<string, object>
                {
                    {"active_count", kvp.Value.Count},
                    {"pooled_count", elementPool?.GetPooledCount(kvp.Key) ?? 0},
                    {"total_created", elementPool?.GetTotalCreated(kvp.Key) ?? 0}
                };
            }
            
            return stats;
        }
    }
}