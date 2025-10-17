using System.Collections.Generic;
using UnityEngine;
using System.Collections;
using Evergreen.Core;

namespace Evergreen.Audio
{
    /// <summary>
    /// Optimized audio manager with compression, pooling, and memory management
    /// </summary>
    public class OptimizedAudioManager : MonoBehaviour
    {
        public static OptimizedAudioManager Instance { get; private set; }

        [Header("Audio Settings")]
        public int maxAudioSources = 32;
        public bool enableAudioCompression = true;
        public AudioCompressionFormat compressionFormat = AudioCompressionFormat.Vorbis;
        public int maxAudioMemoryMB = 128;
        public bool enableAudioStreaming = true;
        public bool unloadUnusedAudio = true;
        public float unloadInterval = 60f;
        
        [Header("Compression Settings")]
        public bool enableFormatOptimization = true;
        public AudioCompressionFormat mobileFormat = AudioCompressionFormat.Vorbis;
        public AudioCompressionFormat desktopFormat = AudioCompressionFormat.PCM;
        public float compressionQuality = 0.7f;
        public bool enableAdaptiveQuality = true;
        public int maxCompressionThreads = 4;

        [Header("Performance Settings")]
        public bool enableAudioPooling = true;
        public int audioSourcePoolSize = 16;
        public bool enableSpatialAudio = true;
        public float spatialAudioMaxDistance = 50f;

        private readonly Dictionary<string, AudioClip> _audioCache = new Dictionary<string, AudioClip>();
        private readonly Dictionary<string, AudioClip> _compressedAudioCache = new Dictionary<string, AudioClip>();
        private readonly Dictionary<string, float> _audioLastUsed = new Dictionary<string, float>();
        private readonly Dictionary<string, int> _audioReferenceCount = new Dictionary<string, int>();

        private readonly Stack<AudioSource> _audioSourcePool = new Stack<AudioSource>();
        private readonly List<AudioSource> _activeAudioSources = new List<AudioSource>();
        private readonly Dictionary<string, AudioSource> _loopingAudioSources = new Dictionary<string, AudioSource>();

        private float _lastUnloadTime = 0f;
        private long _currentAudioMemory = 0;
        private AudioSource _musicSource;
        private AudioSource _sfxSource;

        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeAudioManager();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void InitializeAudioManager()
        {
            // Create main audio sources
            _musicSource = gameObject.AddComponent<AudioSource>();
            _musicSource.loop = true;
            _musicSource.volume = 0.7f;
            _musicSource.priority = 0;

            _sfxSource = gameObject.AddComponent<AudioSource>();
            _sfxSource.loop = false;
            _sfxSource.volume = 1f;
            _sfxSource.priority = 128;

            // Initialize audio source pool
            if (enableAudioPooling)
            {
                InitializeAudioSourcePool();
            }

            Logger.Info("Optimized Audio Manager initialized", "AudioManager");
        }

        private void InitializeAudioSourcePool()
        {
            for (int i = 0; i < audioSourcePoolSize; i++)
            {
                var audioSource = gameObject.AddComponent<AudioSource>();
                audioSource.enabled = false;
                _audioSourcePool.Push(audioSource);
            }
        }

        void Update()
        {
            if (unloadUnusedAudio && Time.time - _lastUnloadTime > unloadInterval)
            {
                UnloadUnusedAudio();
                _lastUnloadTime = Time.time;
            }

            // Clean up finished audio sources
            CleanupFinishedAudioSources();
        }

        #region Audio Loading
        /// <summary>
        /// Load and optimize audio clip
        /// </summary>
        public AudioClip LoadAudioClip(string audioPath, bool compress = true)
        {
            if (string.IsNullOrEmpty(audioPath)) return null;

            // Check cache first
            if (_audioCache.TryGetValue(audioPath, out var cachedClip))
            {
                _audioLastUsed[audioPath] = Time.time;
                _audioReferenceCount[audioPath]++;
                return cachedClip;
            }

            // Load audio clip from resources
            var originalClip = Resources.Load<AudioClip>(audioPath);
            if (originalClip == null)
            {
                Logger.Warning($"Audio clip not found: {audioPath}", "AudioManager");
                return null;
            }

            // Optimize audio clip
            var optimizedClip = OptimizeAudioClip(originalClip, compress);
            if (optimizedClip == null) 
            {
                Debug.LogWarning("OptimizedAudioManager: Failed to optimize audio clip, returning original");
                return originalClip;
            }

            // Cache audio clip
            _audioCache[audioPath] = optimizedClip;
            _audioLastUsed[audioPath] = Time.time;
            _audioReferenceCount[audioPath] = 1;

            // Track memory usage
            _currentAudioMemory += CalculateAudioMemorySize(optimizedClip);

            Logger.Info($"Loaded audio clip: {audioPath} ({CalculateAudioMemorySize(optimizedClip) / 1024} KB)", "AudioManager");
            return optimizedClip;
        }

        /// <summary>
        /// Load audio clip asynchronously
        /// </summary>
        public IEnumerator LoadAudioClipAsync(string audioPath, System.Action<AudioClip> onComplete, bool compress = true)
        {
            if (string.IsNullOrEmpty(audioPath))
            {
                onComplete?.Invoke(null);
                yield break;
            }

            // Check cache first
            if (_audioCache.TryGetValue(audioPath, out var cachedClip))
            {
                _audioLastUsed[audioPath] = Time.time;
                _audioReferenceCount[audioPath]++;
                onComplete?.Invoke(cachedClip);
                yield break;
            }

            // Load audio clip asynchronously
            var request = Resources.LoadAsync<AudioClip>(audioPath);
            yield return request;

            if (request.asset == null)
            {
                Logger.Warning($"Audio clip not found: {audioPath}", "AudioManager");
                onComplete?.Invoke(null);
                yield break;
            }

            var originalClip = request.asset as AudioClip;
            var optimizedClip = OptimizeAudioClip(originalClip, compress);

            if (optimizedClip != null)
            {
                _audioCache[audioPath] = optimizedClip;
                _audioLastUsed[audioPath] = Time.time;
                _audioReferenceCount[audioPath] = 1;
                _currentAudioMemory += CalculateAudioMemorySize(optimizedClip);
            }

            onComplete?.Invoke(optimizedClip);
        }

        /// <summary>
        /// Optimize audio clip for current platform
        /// </summary>
        private AudioClip OptimizeAudioClip(AudioClip original, bool compress)
        {
            if (original == null) 
            {
                Debug.LogError("OptimizedAudioManager: Cannot optimize null audio clip");
                return null;
            }

            if (!compress || !enableAudioCompression)
            {
                return original;
            }

            // Platform-specific optimization
            var targetFormat = GetOptimalAudioFormat(original);
            if (targetFormat == original.loadType) return original;

            // Create optimized clip with compression
            var optimizedClip = CreateCompressedAudioClip(original, targetFormat);
            
            return optimizedClip;
        }
        
        private AudioClip CreateCompressedAudioClip(AudioClip original, AudioCompressionFormat targetFormat)
        {
            // Get optimal settings for the target format
            var settings = GetCompressionSettings(targetFormat);
            
            // Create compressed clip
            var compressedClip = AudioClip.Create(
                original.name + "_Compressed",
                original.samples,
                original.channels,
                original.frequency,
                settings.streaming,
                OnAudioRead,
                OnAudioSetPosition
            );
            
            // Store original data for callbacks
            _compressionData[compressedClip] = new CompressionData
            {
                originalClip = original,
                targetFormat = targetFormat,
                settings = settings
            };
            
            return compressedClip;
        }
        
        private CompressionSettings GetCompressionSettings(AudioCompressionFormat format)
        {
            var settings = new CompressionSettings();
            
            switch (format)
            {
                case AudioCompressionFormat.PCM:
                    settings.loadType = AudioClipLoadType.DecompressOnLoad;
                    settings.compressionQuality = 1.0f;
                    settings.streaming = false;
                    break;
                    
                case AudioCompressionFormat.Vorbis:
                    settings.loadType = AudioClipLoadType.CompressedInMemory;
                    settings.compressionQuality = compressionQuality;
                    settings.streaming = false;
                    break;
                    
                case AudioCompressionFormat.ADPCM:
                    settings.loadType = AudioClipLoadType.CompressedInMemory;
                    settings.compressionQuality = 0.5f;
                    settings.streaming = false;
                    break;
                    
                case AudioCompressionFormat.MP3:
                    settings.loadType = AudioClipLoadType.Streaming;
                    settings.compressionQuality = compressionQuality;
                    settings.streaming = true;
                    break;
            }
            
            return settings;
        }
        
        private AudioCompressionFormat GetOptimalAudioFormat(AudioClip original)
        {
            if (!enableFormatOptimization) return compressionFormat;
            
            // Determine optimal format based on platform and clip characteristics
            if (Application.platform == RuntimePlatform.Android || 
                Application.platform == RuntimePlatform.IPhonePlayer)
            {
                // Mobile platforms prefer compressed formats
                if (original.length > 10f) // Long clips
                {
                    return mobileFormat;
                }
                else if (original.frequency > 44100) // High quality clips
                {
                    return AudioCompressionFormat.Vorbis;
                }
                else
                {
                    return AudioCompressionFormat.ADPCM;
                }
            }
            else
            {
                // Desktop platforms can handle higher quality
                if (original.length < 5f) // Short clips
                {
                    return AudioCompressionFormat.PCM;
                }
                else
                {
                    return desktopFormat;
                }
            }
        }
        
        private void OnAudioRead(float[] data)
        {
            // This would be called during audio streaming
            // Implementation depends on specific compression needs
        }
        
        private void OnAudioSetPosition(int position)
        {
            // This would be called when setting audio position
            // Implementation depends on specific compression needs
        }
        
        [System.Serializable]
        public class CompressionSettings
        {
            public AudioClipLoadType loadType;
            public float compressionQuality;
            public bool streaming;
        }
        
        [System.Serializable]
        public class CompressionData
        {
            public AudioClip originalClip;
            public AudioCompressionFormat targetFormat;
            public CompressionSettings settings;
        }
        
        private Dictionary<AudioClip, CompressionData> _compressionData = new Dictionary<AudioClip, CompressionData>();
        #endregion

        #region Audio Playback
        /// <summary>
        /// Play sound effect
        /// </summary>
        public void PlaySFX(string audioPath, float volume = 1f, float pitch = 1f)
        {
            var clip = LoadAudioClip(audioPath);
            if (clip != null)
            {
                _sfxSource.PlayOneShot(clip, volume);
            }
        }

        /// <summary>
        /// Play sound effect with pooling
        /// </summary>
        public void PlaySFXPooled(string audioPath, float volume = 1f, float pitch = 1f)
        {
            if (!enableAudioPooling)
            {
                PlaySFX(audioPath, volume, pitch);
                return;
            }

            var audioSource = GetPooledAudioSource();
            if (audioSource != null)
            {
                var clip = LoadAudioClip(audioPath);
                if (clip != null)
                {
                    audioSource.clip = clip;
                    audioSource.volume = volume;
                    audioSource.pitch = pitch;
                    audioSource.Play();
                }
            }
        }

        /// <summary>
        /// Play music
        /// </summary>
        public void PlayMusic(string audioPath, float volume = 0.7f, bool loop = true)
        {
            var clip = LoadAudioClip(audioPath);
            if (clip != null)
            {
                _musicSource.clip = clip;
                _musicSource.volume = volume;
                _musicSource.loop = loop;
                _musicSource.Play();
            }
        }

        /// <summary>
        /// Play looping audio
        /// </summary>
        public void PlayLoopingAudio(string audioPath, string loopId, float volume = 1f)
        {
            if (_loopingAudioSources.ContainsKey(loopId))
            {
                StopLoopingAudio(loopId);
            }

            var audioSource = GetPooledAudioSource();
            if (audioSource != null)
            {
                var clip = LoadAudioClip(audioPath);
                if (clip != null)
                {
                    audioSource.clip = clip;
                    audioSource.volume = volume;
                    audioSource.loop = true;
                    audioSource.Play();
                    _loopingAudioSources[loopId] = audioSource;
                }
            }
        }

        /// <summary>
        /// Stop looping audio
        /// </summary>
        public void StopLoopingAudio(string loopId)
        {
            if (_loopingAudioSources.TryGetValue(loopId, out var audioSource))
            {
                audioSource.Stop();
                ReturnPooledAudioSource(audioSource);
                _loopingAudioSources.Remove(loopId);
            }
        }

        /// <summary>
        /// Play spatial audio
        /// </summary>
        public void PlaySpatialAudio(string audioPath, Vector3 position, float volume = 1f, float pitch = 1f)
        {
            if (!enableSpatialAudio)
            {
                PlaySFX(audioPath, volume, pitch);
                return;
            }

            var audioSource = GetPooledAudioSource();
            if (audioSource != null)
            {
                var clip = LoadAudioClip(audioPath);
                if (clip != null)
                {
                    audioSource.clip = clip;
                    audioSource.volume = volume;
                    audioSource.pitch = pitch;
                    audioSource.spatialBlend = 1f; // 3D audio
                    audioSource.rolloffMode = AudioRolloffMode.Logarithmic;
                    audioSource.maxDistance = spatialAudioMaxDistance;
                    audioSource.transform.position = position;
                    audioSource.Play();
                }
            }
        }
        #endregion

        #region Audio Source Pooling
        /// <summary>
        /// Get pooled audio source
        /// </summary>
        private AudioSource GetPooledAudioSource()
        {
            if (_audioSourcePool.Count > 0)
            {
                var audioSource = _audioSourcePool.Pop();
                audioSource.enabled = true;
                _activeAudioSources.Add(audioSource);
                return audioSource;
            }

            // Create new audio source if pool is empty
            var newAudioSource = gameObject.AddComponent<AudioSource>();
            _activeAudioSources.Add(newAudioSource);
            return newAudioSource;
        }

        /// <summary>
        /// Return pooled audio source
        /// </summary>
        private void ReturnPooledAudioSource(AudioSource audioSource)
        {
            if (audioSource == null) return;

            audioSource.Stop();
            audioSource.clip = null;
            audioSource.enabled = false;
            _activeAudioSources.Remove(audioSource);

            if (_audioSourcePool.Count < audioSourcePoolSize)
            {
                _audioSourcePool.Push(audioSource);
            }
            else
            {
                DestroyImmediate(audioSource);
            }
        }

        /// <summary>
        /// Clean up finished audio sources
        /// </summary>
        private void CleanupFinishedAudioSources()
        {
            for (int i = _activeAudioSources.Count - 1; i >= 0; i--)
            {
                var audioSource = _activeAudioSources[i];
                if (audioSource != null && !audioSource.isPlaying)
                {
                    ReturnPooledAudioSource(audioSource);
                }
            }
        }
        #endregion

        #region Audio Management
        /// <summary>
        /// Release audio clip reference
        /// </summary>
        public void ReleaseAudioClip(string audioPath)
        {
            if (string.IsNullOrEmpty(audioPath)) return;

            if (_audioReferenceCount.TryGetValue(audioPath, out var count))
            {
                count--;
                if (count <= 0)
                {
                    _audioReferenceCount.Remove(audioPath);
                    _audioLastUsed.Remove(audioPath);
                    
                    if (_audioCache.TryGetValue(audioPath, out var clip))
                    {
                        _currentAudioMemory -= CalculateAudioMemorySize(clip);
                        _audioCache.Remove(audioPath);
                        DestroyImmediate(clip);
                    }
                }
                else
                {
                    _audioReferenceCount[audioPath] = count;
                }
            }
        }

        /// <summary>
        /// Unload unused audio clips
        /// </summary>
        public void UnloadUnusedAudio()
        {
            var currentTime = Time.time;
            var audioToUnload = new List<string>();

            foreach (var kvp in _audioLastUsed)
            {
                if (currentTime - kvp.Value > unloadInterval)
                {
                    audioToUnload.Add(kvp.Key);
                }
            }

            foreach (var audioPath in audioToUnload)
            {
                ReleaseAudioClip(audioPath);
            }

            if (audioToUnload.Count > 0)
            {
                Logger.Info($"Unloaded {audioToUnload.Count} unused audio clips", "AudioManager");
            }
        }

        /// <summary>
        /// Preload audio clips
        /// </summary>
        public void PreloadAudioClips(string[] audioPaths)
        {
            foreach (var path in audioPaths)
            {
                LoadAudioClip(path);
            }
        }

        /// <summary>
        /// Clear all audio clips
        /// </summary>
        public void ClearAllAudioClips()
        {
            foreach (var clip in _audioCache.Values)
            {
                if (clip != null)
                {
                    DestroyImmediate(clip);
                }
            }

            _audioCache.Clear();
            _compressedAudioCache.Clear();
            _audioLastUsed.Clear();
            _audioReferenceCount.Clear();
            _currentAudioMemory = 0;

            Logger.Info("All audio clips cleared", "AudioManager");
        }
        #endregion

        #region Memory Management
        /// <summary>
        /// Calculate audio memory size
        /// </summary>
        private long CalculateAudioMemorySize(AudioClip clip)
        {
            if (clip == null) return 0;

            // Approximate calculation - actual size depends on compression
            return clip.samples * clip.channels * 4; // Assuming 32-bit float
        }

        /// <summary>
        /// Get current audio memory usage
        /// </summary>
        public long GetCurrentAudioMemory()
        {
            return _currentAudioMemory;
        }

        /// <summary>
        /// Get audio memory usage in MB
        /// </summary>
        public float GetAudioMemoryMB()
        {
            return _currentAudioMemory / 1024f / 1024f;
        }

        /// <summary>
        /// Check if audio memory is within limits
        /// </summary>
        public bool IsAudioMemoryWithinLimits()
        {
            return GetAudioMemoryMB() <= maxAudioMemoryMB;
        }
        #endregion

        #region Statistics
        /// <summary>
        /// Get audio manager statistics
        /// </summary>
        public Dictionary<string, object> GetStatistics()
        {
            return new Dictionary<string, object>
            {
                {"cached_audio", _audioCache.Count},
                {"compressed_audio", _compressedAudioCache.Count},
                {"total_memory_mb", GetAudioMemoryMB()},
                {"max_memory_mb", maxAudioMemoryMB},
                {"memory_usage_percent", (GetAudioMemoryMB() / maxAudioMemoryMB) * 100f},
                {"pooled_sources", _audioSourcePool.Count},
                {"active_sources", _activeAudioSources.Count},
                {"looping_sources", _loopingAudioSources.Count},
                {"enable_pooling", enableAudioPooling},
                {"enable_streaming", enableAudioStreaming}
            };
        }
        #endregion

        void OnDestroy()
        {
            ClearAllAudioClips();
        }

        void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus)
            {
                UnloadUnusedAudio();
            }
        }

        void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus)
            {
                UnloadUnusedAudio();
            }
        }
    }
}