using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.EventSystems;

namespace Evergreen.UI
{
    /// <summary>
    /// High-performance UI component cache to eliminate expensive FindObjectOfType and GetComponent calls
    /// </summary>
    public class UIComponentCache : MonoBehaviour
    {
        private static UIComponentCache _instance;
        public static UIComponentCache Instance
        {
            get
            {
                if (_instance == null)
                {
                    _instance = FindObjectOfType<UIComponentCache>();
                    if (_instance == null)
                    {
                        var go = new GameObject("UIComponentCache");
                        _instance = go.AddComponent<UIComponentCache>();
                        DontDestroyOnLoad(go);
                    }
                }
                return _instance;
            }
        }

        // Core UI components cache
        private Canvas _mainCanvas;
        private GraphicRaycaster _graphicRaycaster;
        private EventSystem _eventSystem;
        private AudioSource _audioSource;

        // UI panel caches
        private readonly Dictionary<string, GameObject> _panelCache = new Dictionary<string, GameObject>();
        private readonly Dictionary<string, RectTransform> _rectTransformCache = new Dictionary<string, RectTransform>();
        private readonly Dictionary<string, CanvasGroup> _canvasGroupCache = new Dictionary<string, CanvasGroup>();

        // Component caches for frequently accessed components
        private readonly Dictionary<GameObject, Button> _buttonCache = new Dictionary<GameObject, Button>();
        private readonly Dictionary<GameObject, TextMeshProUGUI> _textCache = new Dictionary<GameObject, TextMeshProUGUI>();
        private readonly Dictionary<GameObject, Image> _imageCache = new Dictionary<GameObject, Image>();
        private readonly Dictionary<GameObject, RectTransform> _rectTransformComponentCache = new Dictionary<GameObject, RectTransform>();

        // Prefab caches
        private readonly Dictionary<string, GameObject> _prefabCache = new Dictionary<string, GameObject>();

        void Awake()
        {
            if (_instance == null)
            {
                _instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeCaches();
            }
            else if (_instance != this)
            {
                Destroy(gameObject);
            }
        }

        private void InitializeCaches()
        {
            // Cache core UI components
            _mainCanvas = GetComponent<Canvas>();
            if (_mainCanvas == null)
            {
                _mainCanvas = FindObjectOfType<Canvas>();
            }

            _graphicRaycaster = GetComponent<GraphicRaycaster>();
            if (_graphicRaycaster == null)
            {
                _graphicRaycaster = _mainCanvas?.GetComponent<GraphicRaycaster>();
            }

            _eventSystem = FindObjectOfType<EventSystem>();
            if (_eventSystem == null)
            {
                var eventSystemGO = new GameObject("EventSystem");
                _eventSystem = eventSystemGO.AddComponent<EventSystem>();
                eventSystemGO.AddComponent<StandaloneInputModule>();
            }

            _audioSource = GetComponent<AudioSource>();
            if (_audioSource == null)
            {
                _audioSource = gameObject.AddComponent<AudioSource>();
            }
        }

        #region Core UI Components
        public Canvas MainCanvas => _mainCanvas;
        public GraphicRaycaster GraphicRaycaster => _graphicRaycaster;
        public EventSystem EventSystem => _eventSystem;
        public AudioSource AudioSource => _audioSource;
        #endregion

        #region Panel Management
        public void RegisterPanel(string panelId, GameObject panelObject)
        {
            if (panelObject == null) return;

            _panelCache[panelId] = panelObject;
            
            // Cache common components
            var rectTransform = panelObject.GetComponent<RectTransform>();
            if (rectTransform != null)
            {
                _rectTransformCache[panelId] = rectTransform;
            }

            var canvasGroup = panelObject.GetComponent<CanvasGroup>();
            if (canvasGroup != null)
            {
                _canvasGroupCache[panelId] = canvasGroup;
            }
        }

        public GameObject GetPanel(string panelId)
        {
            return _panelCache.TryGetValue(panelId, out var panel) ? panel : null;
        }

        public RectTransform GetPanelRectTransform(string panelId)
        {
            return _rectTransformCache.TryGetValue(panelId, out var rect) ? rect : null;
        }

        public CanvasGroup GetPanelCanvasGroup(string panelId)
        {
            return _canvasGroupCache.TryGetValue(panelId, out var canvasGroup) ? canvasGroup : null;
        }

        public void UnregisterPanel(string panelId)
        {
            _panelCache.Remove(panelId);
            _rectTransformCache.Remove(panelId);
            _canvasGroupCache.Remove(panelId);
        }
        #endregion

        #region Component Caching
        public Button GetButton(GameObject go)
        {
            if (go == null) return null;

            if (!_buttonCache.TryGetValue(go, out var button))
            {
                button = go.GetComponent<Button>();
                if (button != null)
                {
                    _buttonCache[go] = button;
                }
            }
            return button;
        }

        public TextMeshProUGUI GetText(GameObject go)
        {
            if (go == null) return null;

            if (!_textCache.TryGetValue(go, out var text))
            {
                text = go.GetComponent<TextMeshProUGUI>();
                if (text != null)
                {
                    _textCache[go] = text;
                }
            }
            return text;
        }

        public Image GetImage(GameObject go)
        {
            if (go == null) return null;

            if (!_imageCache.TryGetValue(go, out var image))
            {
                image = go.GetComponent<Image>();
                if (image != null)
                {
                    _imageCache[go] = image;
                }
            }
            return image;
        }

        public RectTransform GetRectTransform(GameObject go)
        {
            if (go == null) return null;

            if (!_rectTransformComponentCache.TryGetValue(go, out var rectTransform))
            {
                rectTransform = go.GetComponent<RectTransform>();
                if (rectTransform != null)
                {
                    _rectTransformComponentCache[go] = rectTransform;
                }
            }
            return rectTransform;
        }

        public T GetComponentCached<T>(GameObject go) where T : Component
        {
            if (go == null) return null;

            // Use Unity's built-in caching for generic components
            return go.GetComponent<T>();
        }
        #endregion

        #region Prefab Management
        public void RegisterPrefab(string prefabId, GameObject prefab)
        {
            if (prefab != null)
            {
                _prefabCache[prefabId] = prefab;
            }
        }

        public GameObject GetPrefab(string prefabId)
        {
            return _prefabCache.TryGetValue(prefabId, out var prefab) ? prefab : null;
        }

        public GameObject InstantiatePrefab(string prefabId, Transform parent = null)
        {
            var prefab = GetPrefab(prefabId);
            if (prefab != null)
            {
                return Instantiate(prefab, parent);
            }
            return null;
        }
        #endregion

        #region Bulk Operations
        public Button[] GetButtonsInChildren(GameObject parent)
        {
            if (parent == null) return new Button[0];

            var buttons = parent.GetComponentsInChildren<Button>();
            
            // Cache all found buttons
            foreach (var button in buttons)
            {
                if (button != null && !_buttonCache.ContainsKey(button.gameObject))
                {
                    _buttonCache[button.gameObject] = button;
                }
            }

            return buttons;
        }

        public TextMeshProUGUI[] GetTextsInChildren(GameObject parent)
        {
            if (parent == null) return new TextMeshProUGUI[0];

            var texts = parent.GetComponentsInChildren<TextMeshProUGUI>();
            
            // Cache all found texts
            foreach (var text in texts)
            {
                if (text != null && !_textCache.ContainsKey(text.gameObject))
                {
                    _textCache[text.gameObject] = text;
                }
            }

            return texts;
        }

        public Image[] GetImagesInChildren(GameObject parent)
        {
            if (parent == null) return new Image[0];

            var images = parent.GetComponentsInChildren<Image>();
            
            // Cache all found images
            foreach (var image in images)
            {
                if (image != null && !_imageCache.ContainsKey(image.gameObject))
                {
                    _imageCache[image.gameObject] = image;
                }
            }

            return images;
        }
        #endregion

        #region Cache Management
        public void ClearCache()
        {
            _panelCache.Clear();
            _rectTransformCache.Clear();
            _canvasGroupCache.Clear();
            _buttonCache.Clear();
            _textCache.Clear();
            _imageCache.Clear();
            _rectTransformComponentCache.Clear();
            _prefabCache.Clear();
        }

        public void ClearComponentCache(GameObject go)
        {
            if (go == null) return;

            _buttonCache.Remove(go);
            _textCache.Remove(go);
            _imageCache.Remove(go);
            _rectTransformComponentCache.Remove(go);
        }

        public int GetCacheSize()
        {
            return _panelCache.Count + _rectTransformCache.Count + _canvasGroupCache.Count +
                   _buttonCache.Count + _textCache.Count + _imageCache.Count +
                   _rectTransformComponentCache.Count + _prefabCache.Count;
        }
        #endregion

        #region Performance Monitoring
        public Dictionary<string, int> GetCacheStatistics()
        {
            return new Dictionary<string, int>
            {
                {"panels", _panelCache.Count},
                {"rectTransforms", _rectTransformCache.Count},
                {"canvasGroups", _canvasGroupCache.Count},
                {"buttons", _buttonCache.Count},
                {"texts", _textCache.Count},
                {"images", _imageCache.Count},
                {"rectTransformComponents", _rectTransformComponentCache.Count},
                {"prefabs", _prefabCache.Count}
            };
        }
        #endregion
    }
}