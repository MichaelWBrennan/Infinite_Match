using System.Collections.Generic;
using UnityEngine;
using Evergreen.Core;

namespace Evergreen.Graphics
{
    /// <summary>
    /// Optimized texture management system with compression and memory optimization
    /// </summary>
    public class OptimizedTextureManager : MonoBehaviour
    {
        public static OptimizedTextureManager Instance { get; private set; }

        [Header("Texture Settings")]
        public TextureFormat mobileTextureFormat = TextureFormat.ETC2_RGBA8;
        public TextureFormat desktopTextureFormat = TextureFormat.DXT5;
        public int maxTextureSize = 2048;
        public bool enableMipMaps = true;
        public FilterMode textureFilterMode = FilterMode.Bilinear;
        public TextureWrapMode textureWrapMode = TextureWrapMode.Clamp;

        [Header("Memory Settings")]
        public bool enableTextureStreaming = true;
        public int maxTextureMemoryMB = 512;
        public bool unloadUnusedTextures = true;
        public float unloadInterval = 30f;

        private readonly Dictionary<string, Texture2D> _textureCache = new Dictionary<string, Texture2D>();
        private readonly Dictionary<string, Texture2D> _compressedTextureCache = new Dictionary<string, Texture2D>();
        private readonly Dictionary<string, float> _textureLastUsed = new Dictionary<string, float>();
        private readonly Dictionary<string, int> _textureReferenceCount = new Dictionary<string, int>();

        private float _lastUnloadTime = 0f;
        private long _currentTextureMemory = 0;

        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeTextureManager();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void InitializeTextureManager()
        {
            // Set texture quality based on platform
            SetTextureQualityForPlatform();
            Logger.Info("Optimized Texture Manager initialized", "TextureManager");
        }

        private void SetTextureQualityForPlatform()
        {
            switch (Application.platform)
            {
                case RuntimePlatform.Android:
                case RuntimePlatform.IPhonePlayer:
                    mobileTextureFormat = TextureFormat.ETC2_RGBA8;
                    maxTextureSize = 1024;
                    break;
                case RuntimePlatform.WindowsPlayer:
                case RuntimePlatform.OSXPlayer:
                case RuntimePlatform.LinuxPlayer:
                    desktopTextureFormat = TextureFormat.DXT5;
                    maxTextureSize = 2048;
                    break;
            }
        }

        void Update()
        {
            if (unloadUnusedTextures && Time.time - _lastUnloadTime > unloadInterval)
            {
                UnloadUnusedTextures();
                _lastUnloadTime = Time.time;
            }
        }

        #region Texture Loading
        /// <summary>
        /// Load and optimize texture
        /// </summary>
        public Texture2D LoadTexture(string texturePath, bool compress = true)
        {
            if (string.IsNullOrEmpty(texturePath)) return null;

            // Check cache first
            if (_textureCache.TryGetValue(texturePath, out var cachedTexture))
            {
                _textureLastUsed[texturePath] = Time.time;
                _textureReferenceCount[texturePath]++;
                return cachedTexture;
            }

            // Load texture from resources
            var originalTexture = Resources.Load<Texture2D>(texturePath);
            if (originalTexture == null)
            {
                Logger.Warning($"Texture not found: {texturePath}", "TextureManager");
                return null;
            }

            // Optimize texture
            var optimizedTexture = OptimizeTexture(originalTexture, compress);
            if (optimizedTexture == null) return null;

            // Cache texture
            _textureCache[texturePath] = optimizedTexture;
            _textureLastUsed[texturePath] = Time.time;
            _textureReferenceCount[texturePath] = 1;

            // Track memory usage
            _currentTextureMemory += CalculateTextureMemorySize(optimizedTexture);

            Logger.Info($"Loaded texture: {texturePath} ({CalculateTextureMemorySize(optimizedTexture) / 1024} KB)", "TextureManager");
            return optimizedTexture;
        }

        /// <summary>
        /// Load texture asynchronously
        /// </summary>
        public System.Collections.IEnumerator LoadTextureAsync(string texturePath, System.Action<Texture2D> onComplete, bool compress = true)
        {
            if (string.IsNullOrEmpty(texturePath))
            {
                onComplete?.Invoke(null);
                yield break;
            }

            // Check cache first
            if (_textureCache.TryGetValue(texturePath, out var cachedTexture))
            {
                _textureLastUsed[texturePath] = Time.time;
                _textureReferenceCount[texturePath]++;
                onComplete?.Invoke(cachedTexture);
                yield break;
            }

            // Load texture asynchronously
            var request = Resources.LoadAsync<Texture2D>(texturePath);
            yield return request;

            if (request.asset == null)
            {
                Logger.Warning($"Texture not found: {texturePath}", "TextureManager");
                onComplete?.Invoke(null);
                yield break;
            }

            var originalTexture = request.asset as Texture2D;
            var optimizedTexture = OptimizeTexture(originalTexture, compress);

            if (optimizedTexture != null)
            {
                _textureCache[texturePath] = optimizedTexture;
                _textureLastUsed[texturePath] = Time.time;
                _textureReferenceCount[texturePath] = 1;
                _currentTextureMemory += CalculateTextureMemorySize(optimizedTexture);
            }

            onComplete?.Invoke(optimizedTexture);
        }

        /// <summary>
        /// Optimize texture for current platform
        /// </summary>
        private Texture2D OptimizeTexture(Texture2D original, bool compress)
        {
            if (original == null) return null;

            // Resize if too large
            var resizedTexture = ResizeTextureIfNeeded(original);

            if (!compress)
            {
                return resizedTexture;
            }

            // Compress texture
            var format = GetOptimalTextureFormat();
            var compressedTexture = CompressTexture(resizedTexture, format);

            // Clean up resized texture if it's different from original
            if (resizedTexture != original)
            {
                DestroyImmediate(resizedTexture);
            }

            return compressedTexture;
        }

        /// <summary>
        /// Resize texture if it exceeds max size
        /// </summary>
        private Texture2D ResizeTextureIfNeeded(Texture2D original)
        {
            if (original.width <= maxTextureSize && original.height <= maxTextureSize)
            {
                return original;
            }

            var scale = Mathf.Min((float)maxTextureSize / original.width, (float)maxTextureSize / original.height);
            var newWidth = Mathf.RoundToInt(original.width * scale);
            var newHeight = Mathf.RoundToInt(original.height * scale);

            var resizedTexture = new Texture2D(newWidth, newHeight, original.format, enableMipMaps);
            resizedTexture.name = original.name + "_Resized";

            // Scale texture
            var pixels = original.GetPixels();
            var resizedPixels = new Color[newWidth * newHeight];

            for (int y = 0; y < newHeight; y++)
            {
                for (int x = 0; x < newWidth; x++)
                {
                    var sourceX = Mathf.RoundToInt(x / scale);
                    var sourceY = Mathf.RoundToInt(y / scale);
                    sourceX = Mathf.Clamp(sourceX, 0, original.width - 1);
                    sourceY = Mathf.Clamp(sourceY, 0, original.height - 1);
                    resizedPixels[y * newWidth + x] = pixels[sourceY * original.width + sourceX];
                }
            }

            resizedTexture.SetPixels(resizedPixels);
            resizedTexture.Apply();

            return resizedTexture;
        }

        /// <summary>
        /// Compress texture with optimal format
        /// </summary>
        private Texture2D CompressTexture(Texture2D original, TextureFormat format)
        {
            var compressedTexture = new Texture2D(original.width, original.height, format, enableMipMaps);
            compressedTexture.name = original.name + "_Compressed";
            compressedTexture.filterMode = textureFilterMode;
            compressedTexture.wrapMode = textureWrapMode;

            compressedTexture.SetPixels(original.GetPixels());
            compressedTexture.Apply();

            return compressedTexture;
        }

        /// <summary>
        /// Get optimal texture format for current platform
        /// </summary>
        private TextureFormat GetOptimalTextureFormat()
        {
            switch (Application.platform)
            {
                case RuntimePlatform.Android:
                    return mobileTextureFormat;
                case RuntimePlatform.IPhonePlayer:
                    return TextureFormat.ASTC_6x6;
                case RuntimePlatform.WindowsPlayer:
                case RuntimePlatform.OSXPlayer:
                case RuntimePlatform.LinuxPlayer:
                    return desktopTextureFormat;
                default:
                    return TextureFormat.RGBA32;
            }
        }
        #endregion

        #region Texture Management
        /// <summary>
        /// Release texture reference
        /// </summary>
        public void ReleaseTexture(string texturePath)
        {
            if (string.IsNullOrEmpty(texturePath)) return;

            if (_textureReferenceCount.TryGetValue(texturePath, out var count))
            {
                count--;
                if (count <= 0)
                {
                    _textureReferenceCount.Remove(texturePath);
                    _textureLastUsed.Remove(texturePath);
                    
                    if (_textureCache.TryGetValue(texturePath, out var texture))
                    {
                        _currentTextureMemory -= CalculateTextureMemorySize(texture);
                        _textureCache.Remove(texturePath);
                        DestroyImmediate(texture);
                    }
                }
                else
                {
                    _textureReferenceCount[texturePath] = count;
                }
            }
        }

        /// <summary>
        /// Unload unused textures
        /// </summary>
        public void UnloadUnusedTextures()
        {
            var currentTime = Time.time;
            var texturesToUnload = new List<string>();

            foreach (var kvp in _textureLastUsed)
            {
                if (currentTime - kvp.Value > unloadInterval)
                {
                    texturesToUnload.Add(kvp.Key);
                }
            }

            foreach (var texturePath in texturesToUnload)
            {
                ReleaseTexture(texturePath);
            }

            if (texturesToUnload.Count > 0)
            {
                Logger.Info($"Unloaded {texturesToUnload.Count} unused textures", "TextureManager");
            }
        }

        /// <summary>
        /// Preload textures
        /// </summary>
        public void PreloadTextures(string[] texturePaths)
        {
            foreach (var path in texturePaths)
            {
                LoadTexture(path);
            }
        }

        /// <summary>
        /// Clear all textures
        /// </summary>
        public void ClearAllTextures()
        {
            foreach (var texture in _textureCache.Values)
            {
                if (texture != null)
                {
                    DestroyImmediate(texture);
                }
            }

            _textureCache.Clear();
            _compressedTextureCache.Clear();
            _textureLastUsed.Clear();
            _textureReferenceCount.Clear();
            _currentTextureMemory = 0;

            Logger.Info("All textures cleared", "TextureManager");
        }
        #endregion

        #region Memory Management
        /// <summary>
        /// Calculate texture memory size
        /// </summary>
        private long CalculateTextureMemorySize(Texture2D texture)
        {
            if (texture == null) return 0;

            var bytesPerPixel = GetBytesPerPixel(texture.format);
            var mipMapMultiplier = enableMipMaps ? 1.33f : 1f;
            return (long)(texture.width * texture.height * bytesPerPixel * mipMapMultiplier);
        }

        /// <summary>
        /// Get bytes per pixel for texture format
        /// </summary>
        private int GetBytesPerPixel(TextureFormat format)
        {
            switch (format)
            {
                case TextureFormat.RGBA32: return 4;
                case TextureFormat.RGB24: return 3;
                case TextureFormat.DXT1: return 0; // Compressed
                case TextureFormat.DXT5: return 0; // Compressed
                case TextureFormat.ETC2_RGBA8: return 0; // Compressed
                case TextureFormat.ASTC_6x6: return 0; // Compressed
                default: return 4;
            }
        }

        /// <summary>
        /// Get current texture memory usage
        /// </summary>
        public long GetCurrentTextureMemory()
        {
            return _currentTextureMemory;
        }

        /// <summary>
        /// Get texture memory usage in MB
        /// </summary>
        public float GetTextureMemoryMB()
        {
            return _currentTextureMemory / 1024f / 1024f;
        }

        /// <summary>
        /// Check if texture memory is within limits
        /// </summary>
        public bool IsTextureMemoryWithinLimits()
        {
            return GetTextureMemoryMB() <= maxTextureMemoryMB;
        }
        #endregion

        #region Statistics
        /// <summary>
        /// Get texture manager statistics
        /// </summary>
        public Dictionary<string, object> GetStatistics()
        {
            return new Dictionary<string, object>
            {
                {"cached_textures", _textureCache.Count},
                {"compressed_textures", _compressedTextureCache.Count},
                {"total_memory_mb", GetTextureMemoryMB()},
                {"max_memory_mb", maxTextureMemoryMB},
                {"memory_usage_percent", (GetTextureMemoryMB() / maxTextureMemoryMB) * 100f},
                {"unload_interval", unloadInterval},
                {"enable_streaming", enableTextureStreaming}
            };
        }
        #endregion

        void OnDestroy()
        {
            ClearAllTextures();
        }

        void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus)
            {
                UnloadUnusedTextures();
            }
        }

        void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus)
            {
                UnloadUnusedTextures();
            }
        }
    }
}