using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine.Audio;

namespace Evergreen.Audio
{
    /// <summary>
    /// Advanced Audio System with 3D audio, dynamic music, and premium sound design
    /// Implements industry-leading audio features for maximum player engagement
    /// </summary>
    public class AdvancedAudioSystem : MonoBehaviour
    {
        [Header("Audio Sources")]
        [SerializeField] private AudioSource musicSource;
        [SerializeField] private AudioSource sfxSource;
        [SerializeField] private AudioSource voiceSource;
        [SerializeField] private AudioSource ambientSource;
        [SerializeField] private AudioSource uiSource;
        [SerializeField] private AudioSource[] poolSources;
        
        [Header("Audio Mixer")]
        [SerializeField] private AudioMixerGroup musicMixerGroup;
        [SerializeField] private AudioMixerGroup sfxMixerGroup;
        [SerializeField] private AudioMixerGroup voiceMixerGroup;
        [SerializeField] private AudioMixerGroup ambientMixerGroup;
        [SerializeField] private AudioMixerGroup uiMixerGroup;
        
        [Header("Music System")]
        [SerializeField] private AudioClip[] backgroundMusic;
        [SerializeField] private AudioClip[] combatMusic;
        [SerializeField] private AudioClip[] victoryMusic;
        [SerializeField] private AudioClip[] defeatMusic;
        [SerializeField] private bool enableDynamicMusic = true;
        [SerializeField] private bool enableMusicFading = true;
        [SerializeField] private float musicFadeTime = 2.0f;
        
        [Header("3D Audio")]
        [SerializeField] private bool enable3DAudio = true;
        [SerializeField] private float max3DDistance = 50.0f;
        [SerializeField] private AnimationCurve distanceAttenuationCurve;
        [SerializeField] private bool enableSpatialBlend = true;
        
        [Header("Dynamic Audio")]
        [SerializeField] private bool enableDynamicVolume = true;
        [SerializeField] private bool enableAudioLayers = true;
        [SerializeField] private bool enableAudioTriggers = true;
        [SerializeField] private bool enableAudioRandomization = true;
        
        [Header("Audio Clips")]
        [SerializeField] private AudioClipData[] audioClips;
        [SerializeField] private AudioClipData[] uiClips;
        [SerializeField] private AudioClipData[] sfxClips;
        [SerializeField] private AudioClipData[] voiceClips;
        [SerializeField] private AudioClipData[] ambientClips;
        
        [Header("Quality Settings")]
        [SerializeField] private bool enableHighQualityAudio = true;
        [SerializeField] private bool enableMobileOptimization = false;
        [SerializeField] private int maxConcurrentSounds = 32;
        [SerializeField] private float audioPoolSize = 64;
        
        private Dictionary<string, AudioClipData> _audioLookup = new Dictionary<string, AudioClipData>();
        private Dictionary<string, AudioSource> _audioSourcePool = new Dictionary<string, AudioSource>();
        private Queue<AudioSource> _availableSources = new Queue<AudioSource>();
        private List<AudioSource> _activeSources = new List<AudioSource>();
        private Dictionary<string, Coroutine> _activeCoroutines = new Dictionary<string, Coroutine>();
        private Dictionary<string, float> _audioLayers = new Dictionary<string, float>();
        private Dictionary<string, AudioTrigger> _audioTriggers = new Dictionary<string, AudioTrigger>();
        
        public static AdvancedAudioSystem Instance { get; private set; }
        
        [System.Serializable]
        public class AudioClipData
        {
            public string id;
            public AudioClip clip;
            public AudioType type;
            public float volume = 1.0f;
            public float pitch = 1.0f;
            public bool loop = false;
            public bool is3D = false;
            public float spatialBlend = 0.0f;
            public float minDistance = 1.0f;
            public float maxDistance = 500.0f;
            public AudioRolloffMode rolloffMode = AudioRolloffMode.Logarithmic;
            public float dopplerLevel = 1.0f;
            public bool randomizePitch = false;
            public float pitchVariation = 0.1f;
            public bool randomizeVolume = false;
            public float volumeVariation = 0.1f;
            public int priority = 128;
            public float cooldown = 0.0f;
            public string[] tags;
        }
        
        [System.Serializable]
        public class AudioTrigger
        {
            public string id;
            public AudioClipData clipData;
            public TriggerType triggerType;
            public float threshold;
            public float cooldown;
            public bool isActive;
            public float lastTriggerTime;
        }
        
        public enum AudioType
        {
            Music,
            SFX,
            Voice,
            Ambient,
            UI,
            Environmental,
            Weapon,
            Footstep,
            Impact,
            Explosion
        }
        
        public enum TriggerType
        {
            OnEnter,
            OnExit,
            OnStay,
            OnCollision,
            OnTrigger,
            OnDamage,
            OnHeal,
            OnLevelComplete,
            OnLevelFail,
            OnMatch,
            OnCombo,
            OnSpecialPiece
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeAdvancedAudio();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            SetupAudioSources();
            SetupAudioMixer();
            SetupAudioPool();
            BuildAudioLookup();
            SetupAudioTriggers();
            StartCoroutine(UpdateAudioSystem());
        }
        
        private void InitializeAdvancedAudio()
        {
            // Create audio sources if they don't exist
            if (musicSource == null)
            {
                musicSource = CreateAudioSource("MusicSource", AudioType.Music);
            }
            
            if (sfxSource == null)
            {
                sfxSource = CreateAudioSource("SFXSource", AudioType.SFX);
            }
            
            if (voiceSource == null)
            {
                voiceSource = CreateAudioSource("VoiceSource", AudioType.Voice);
            }
            
            if (ambientSource == null)
            {
                ambientSource = CreateAudioSource("AmbientSource", AudioType.Ambient);
            }
            
            if (uiSource == null)
            {
                uiSource = CreateAudioSource("UISource", AudioType.UI);
            }
            
            // Setup distance attenuation curve
            if (distanceAttenuationCurve == null || distanceAttenuationCurve.keys.Length == 0)
            {
                distanceAttenuationCurve = new AnimationCurve(
                    new Keyframe(0f, 1f),
                    new Keyframe(0.5f, 0.5f),
                    new Keyframe(1f, 0f)
                );
            }
        }
        
        private AudioSource CreateAudioSource(string name, AudioType type)
        {
            GameObject audioObj = new GameObject(name);
            audioObj.transform.SetParent(transform);
            
            AudioSource audioSource = audioObj.AddComponent<AudioSource>();
            audioSource.playOnAwake = false;
            audioSource.loop = false;
            
            // Setup based on audio type
            switch (type)
            {
                case AudioType.Music:
                    audioSource.volume = 0.7f;
                    audioSource.pitch = 1.0f;
                    audioSource.loop = true;
                    audioSource.priority = 0;
                    break;
                case AudioType.SFX:
                    audioSource.volume = 1.0f;
                    audioSource.pitch = 1.0f;
                    audioSource.priority = 64;
                    break;
                case AudioType.Voice:
                    audioSource.volume = 0.8f;
                    audioSource.pitch = 1.0f;
                    audioSource.priority = 32;
                    break;
                case AudioType.Ambient:
                    audioSource.volume = 0.5f;
                    audioSource.pitch = 1.0f;
                    audioSource.loop = true;
                    audioSource.priority = 96;
                    break;
                case AudioType.UI:
                    audioSource.volume = 0.6f;
                    audioSource.pitch = 1.0f;
                    audioSource.priority = 16;
                    break;
            }
            
            return audioSource;
        }
        
        private void SetupAudioSources()
        {
            // Setup music source
            if (musicSource != null)
            {
                musicSource.outputAudioMixerGroup = musicMixerGroup;
                musicSource.spatialBlend = 0.0f; // 2D audio
            }
            
            // Setup SFX source
            if (sfxSource != null)
            {
                sfxSource.outputAudioMixerGroup = sfxMixerGroup;
                sfxSource.spatialBlend = enable3DAudio ? 1.0f : 0.0f;
            }
            
            // Setup voice source
            if (voiceSource != null)
            {
                voiceSource.outputAudioMixerGroup = voiceMixerGroup;
                voiceSource.spatialBlend = 0.0f; // 2D audio
            }
            
            // Setup ambient source
            if (ambientSource != null)
            {
                ambientSource.outputAudioMixerGroup = ambientMixerGroup;
                ambientSource.spatialBlend = enable3DAudio ? 1.0f : 0.0f;
            }
            
            // Setup UI source
            if (uiSource != null)
            {
                uiSource.outputAudioMixerGroup = uiMixerGroup;
                uiSource.spatialBlend = 0.0f; // 2D audio
            }
        }
        
        private void SetupAudioMixer()
        {
            // Create audio mixer groups if they don't exist
            if (musicMixerGroup == null)
            {
                // In a real implementation, you would load these from an AudioMixer asset
                Debug.LogWarning("AudioMixerGroup not assigned. Please assign in inspector.");
            }
        }
        
        private void SetupAudioPool()
        {
            // Create audio source pool
            for (int i = 0; i < audioPoolSize; i++)
            {
                AudioSource pooledSource = CreateAudioSource($"PooledSource_{i}", AudioType.SFX);
                pooledSource.gameObject.SetActive(false);
                _availableSources.Enqueue(pooledSource);
            }
        }
        
        private void BuildAudioLookup()
        {
            _audioLookup.Clear();
            
            // Add all audio clips to lookup
            AddAudioClipsToLookup(audioClips);
            AddAudioClipsToLookup(uiClips);
            AddAudioClipsToLookup(sfxClips);
            AddAudioClipsToLookup(voiceClips);
            AddAudioClipsToLookup(ambientClips);
        }
        
        private void AddAudioClipsToLookup(AudioClipData[] clips)
        {
            if (clips == null) return;
            
            foreach (var clipData in clips)
            {
                if (clipData != null && !string.IsNullOrEmpty(clipData.id))
                {
                    _audioLookup[clipData.id] = clipData;
                }
            }
        }
        
        private void SetupAudioTriggers()
        {
            // Setup audio triggers for dynamic audio
            if (enableAudioTriggers)
            {
                // Example triggers - in a real implementation, these would be configured
                _audioTriggers["LevelComplete"] = new AudioTrigger
                {
                    id = "LevelComplete",
                    triggerType = TriggerType.OnLevelComplete,
                    threshold = 1.0f,
                    cooldown = 0.0f,
                    isActive = true
                };
                
                _audioTriggers["LevelFail"] = new AudioTrigger
                {
                    id = "LevelFail",
                    triggerType = TriggerType.OnLevelFail,
                    threshold = 1.0f,
                    cooldown = 0.0f,
                    isActive = true
                };
                
                _audioTriggers["Match"] = new AudioTrigger
                {
                    id = "Match",
                    triggerType = TriggerType.OnMatch,
                    threshold = 1.0f,
                    cooldown = 0.1f,
                    isActive = true
                };
                
                _audioTriggers["Combo"] = new AudioTrigger
                {
                    id = "Combo",
                    triggerType = TriggerType.OnCombo,
                    threshold = 1.0f,
                    cooldown = 0.2f,
                    isActive = true
                };
            }
        }
        
        /// <summary>
        /// Play audio by ID with advanced features
        /// </summary>
        public void PlayAudio(string audioId, Vector3 position = default, bool use3D = false, float volume = -1f, float pitch = -1f)
        {
            if (!_audioLookup.ContainsKey(audioId))
            {
                Debug.LogWarning($"Audio clip '{audioId}' not found in lookup table.");
                return;
            }
            
            AudioClipData clipData = _audioLookup[audioId];
            
            // Check cooldown
            if (clipData.cooldown > 0f)
            {
                string cooldownKey = $"cooldown_{audioId}";
                if (_activeCoroutines.ContainsKey(cooldownKey))
                {
                    return; // Still on cooldown
                }
                
                _activeCoroutines[cooldownKey] = StartCoroutine(CooldownCoroutine(cooldownKey, clipData.cooldown));
            }
            
            // Get audio source
            AudioSource source = GetAudioSource(clipData.type, use3D || clipData.is3D);
            
            if (source == null)
            {
                Debug.LogWarning($"No available audio source for type: {clipData.type}");
                return;
            }
            
            // Setup audio source
            SetupAudioSource(source, clipData, position, volume, pitch);
            
            // Play audio
            source.Play();
            
            // Add to active sources
            if (!_activeSources.Contains(source))
            {
                _activeSources.Add(source);
            }
        }
        
        private AudioSource GetAudioSource(AudioType type, bool use3D)
        {
            // Try to get appropriate source based on type
            AudioSource source = null;
            
            switch (type)
            {
                case AudioType.Music:
                    source = musicSource;
                    break;
                case AudioType.SFX:
                    source = sfxSource;
                    break;
                case AudioType.Voice:
                    source = voiceSource;
                    break;
                case AudioType.Ambient:
                    source = ambientSource;
                    break;
                case AudioType.UI:
                    source = uiSource;
                    break;
                default:
                    // Use pooled source for other types
                    if (_availableSources.Count > 0)
                    {
                        source = _availableSources.Dequeue();
                        source.gameObject.SetActive(true);
                    }
                    break;
            }
            
            // If no specific source or need 3D audio, use pooled source
            if (source == null || (use3D && source.spatialBlend == 0f))
            {
                if (_availableSources.Count > 0)
                {
                    source = _availableSources.Dequeue();
                    source.gameObject.SetActive(true);
                }
            }
            
            return source;
        }
        
        private void SetupAudioSource(AudioSource source, AudioClipData clipData, Vector3 position, float volume, float pitch)
        {
            // Set clip
            source.clip = clipData.clip;
            
            // Set volume
            float finalVolume = volume >= 0 ? volume : clipData.volume;
            if (clipData.randomizeVolume)
            {
                finalVolume += Random.Range(-clipData.volumeVariation, clipData.volumeVariation);
            }
            source.volume = Mathf.Clamp01(finalVolume);
            
            // Set pitch
            float finalPitch = pitch >= 0 ? pitch : clipData.pitch;
            if (clipData.randomizePitch)
            {
                finalPitch += Random.Range(-clipData.pitchVariation, clipData.pitchVariation);
            }
            source.pitch = Mathf.Clamp(finalPitch, 0.1f, 3.0f);
            
            // Set loop
            source.loop = clipData.loop;
            
            // Set priority
            source.priority = clipData.priority;
            
            // Set 3D audio properties
            if (clipData.is3D || source.spatialBlend > 0f)
            {
                source.spatialBlend = clipData.spatialBlend;
                source.minDistance = clipData.minDistance;
                source.maxDistance = clipData.maxDistance;
                source.rolloffMode = clipData.rolloffMode;
                source.dopplerLevel = clipData.dopplerLevel;
                
                // Set position
                source.transform.position = position;
            }
            
            // Set output mixer group
            switch (clipData.type)
            {
                case AudioType.Music:
                    source.outputAudioMixerGroup = musicMixerGroup;
                    break;
                case AudioType.SFX:
                    source.outputAudioMixerGroup = sfxMixerGroup;
                    break;
                case AudioType.Voice:
                    source.outputAudioMixerGroup = voiceMixerGroup;
                    break;
                case AudioType.Ambient:
                    source.outputAudioMixerGroup = ambientMixerGroup;
                    break;
                case AudioType.UI:
                    source.outputAudioMixerGroup = uiMixerGroup;
                    break;
            }
        }
        
        /// <summary>
        /// Play music with dynamic features
        /// </summary>
        public void PlayMusic(string musicId, bool fadeIn = true, float fadeTime = -1f)
        {
            if (!_audioLookup.ContainsKey(musicId))
            {
                Debug.LogWarning($"Music clip '{musicId}' not found in lookup table.");
                return;
            }
            
            AudioClipData clipData = _audioLookup[musicId];
            
            if (musicSource == null)
            {
                Debug.LogWarning("Music source not available.");
                return;
            }
            
            // Stop current music
            if (musicSource.isPlaying)
            {
                if (fadeIn && enableMusicFading)
                {
                    StartCoroutine(FadeOutMusic(fadeTime > 0 ? fadeTime : musicFadeTime, () => {
                        PlayMusicImmediate(clipData, fadeIn, fadeTime);
                    }));
                }
                else
                {
                    musicSource.Stop();
                    PlayMusicImmediate(clipData, fadeIn, fadeTime);
                }
            }
            else
            {
                PlayMusicImmediate(clipData, fadeIn, fadeTime);
            }
        }
        
        private void PlayMusicImmediate(AudioClipData clipData, bool fadeIn, float fadeTime)
        {
            musicSource.clip = clipData.clip;
            musicSource.volume = fadeIn ? 0f : clipData.volume;
            musicSource.loop = clipData.loop;
            musicSource.Play();
            
            if (fadeIn && enableMusicFading)
            {
                StartCoroutine(FadeInMusic(fadeTime > 0 ? fadeTime : musicFadeTime, clipData.volume));
            }
        }
        
        /// <summary>
        /// Play 3D audio at specific position
        /// </summary>
        public void Play3DAudio(string audioId, Vector3 position, float volume = -1f, float pitch = -1f)
        {
            PlayAudio(audioId, position, true, volume, pitch);
        }
        
        /// <summary>
        /// Play UI sound
        /// </summary>
        public void PlayUISound(string audioId, float volume = -1f, float pitch = -1f)
        {
            PlayAudio(audioId, Vector3.zero, false, volume, pitch);
        }
        
        /// <summary>
        /// Play voice line
        /// </summary>
        public void PlayVoice(string audioId, float volume = -1f, float pitch = -1f)
        {
            PlayAudio(audioId, Vector3.zero, false, volume, pitch);
        }
        
        /// <summary>
        /// Play ambient sound
        /// </summary>
        public void PlayAmbient(string audioId, Vector3 position = default, bool loop = true, float volume = -1f)
        {
            if (!_audioLookup.ContainsKey(audioId))
            {
                Debug.LogWarning($"Ambient clip '{audioId}' not found in lookup table.");
                return;
            }
            
            AudioClipData clipData = _audioLookup[audioId];
            clipData.loop = loop;
            
            PlayAudio(audioId, position, clipData.is3D, volume);
        }
        
        /// <summary>
        /// Stop audio by ID
        /// </summary>
        public void StopAudio(string audioId)
        {
            // Find and stop audio source playing this clip
            foreach (var source in _activeSources)
            {
                if (source != null && source.clip != null && _audioLookup.ContainsKey(audioId))
                {
                    if (source.clip == _audioLookup[audioId].clip)
                    {
                        source.Stop();
                        ReturnAudioSourceToPool(source);
                        break;
                    }
                }
            }
        }
        
        /// <summary>
        /// Stop all audio of specific type
        /// </summary>
        public void StopAudioType(AudioType type)
        {
            foreach (var source in _activeSources)
            {
                if (source != null && source.isPlaying)
                {
                    // Check if this source is playing audio of the specified type
                    if (IsSourcePlayingType(source, type))
                    {
                        source.Stop();
                        ReturnAudioSourceToPool(source);
                    }
                }
            }
        }
        
        private bool IsSourcePlayingType(AudioSource source, AudioType type)
        {
            if (source.clip == null) return false;
            
            // Check if the clip matches the type
            foreach (var clipData in _audioLookup.Values)
            {
                if (clipData.clip == source.clip && clipData.type == type)
                {
                    return true;
                }
            }
            
            return false;
        }
        
        /// <summary>
        /// Stop all audio
        /// </summary>
        public void StopAllAudio()
        {
            // Stop all active sources
            foreach (var source in _activeSources)
            {
                if (source != null)
                {
                    source.Stop();
                }
            }
            
            // Return all sources to pool
            foreach (var source in _activeSources)
            {
                ReturnAudioSourceToPool(source);
            }
            
            _activeSources.Clear();
        }
        
        private void ReturnAudioSourceToPool(AudioSource source)
        {
            if (source == null) return;
            
            // Don't return main sources to pool
            if (source == musicSource || source == sfxSource || source == voiceSource || 
                source == ambientSource || source == uiSource)
            {
                return;
            }
            
            // Return to pool
            source.Stop();
            source.clip = null;
            source.gameObject.SetActive(false);
            
            if (!_availableSources.Contains(source))
            {
                _availableSources.Enqueue(source);
            }
            
            if (_activeSources.Contains(source))
            {
                _activeSources.Remove(source);
            }
        }
        
        /// <summary>
        /// Set volume for audio type
        /// </summary>
        public void SetVolume(AudioType type, float volume)
        {
            volume = Mathf.Clamp01(volume);
            
            switch (type)
            {
                case AudioType.Music:
                    if (musicSource != null) musicSource.volume = volume;
                    break;
                case AudioType.SFX:
                    if (sfxSource != null) sfxSource.volume = volume;
                    break;
                case AudioType.Voice:
                    if (voiceSource != null) voiceSource.volume = volume;
                    break;
                case AudioType.Ambient:
                    if (ambientSource != null) ambientSource.volume = volume;
                    break;
                case AudioType.UI:
                    if (uiSource != null) uiSource.volume = volume;
                    break;
            }
        }
        
        /// <summary>
        /// Get volume for audio type
        /// </summary>
        public float GetVolume(AudioType type)
        {
            switch (type)
            {
                case AudioType.Music:
                    return musicSource != null ? musicSource.volume : 0f;
                case AudioType.SFX:
                    return sfxSource != null ? sfxSource.volume : 0f;
                case AudioType.Voice:
                    return voiceSource != null ? voiceSource.volume : 0f;
                case AudioType.Ambient:
                    return ambientSource != null ? ambientSource.volume : 0f;
                case AudioType.UI:
                    return uiSource != null ? uiSource.volume : 0f;
                default:
                    return 0f;
            }
        }
        
        /// <summary>
        /// Set master volume
        /// </summary>
        public void SetMasterVolume(float volume)
        {
            volume = Mathf.Clamp01(volume);
            AudioListener.volume = volume;
        }
        
        /// <summary>
        /// Get master volume
        /// </summary>
        public float GetMasterVolume()
        {
            return AudioListener.volume;
        }
        
        /// <summary>
        /// Pause all audio
        /// </summary>
        public void PauseAllAudio()
        {
            foreach (var source in _activeSources)
            {
                if (source != null && source.isPlaying)
                {
                    source.Pause();
                }
            }
        }
        
        /// <summary>
        /// Resume all audio
        /// </summary>
        public void ResumeAllAudio()
        {
            foreach (var source in _activeSources)
            {
                if (source != null)
                {
                    source.UnPause();
                }
            }
        }
        
        /// <summary>
        /// Add audio clip to system
        /// </summary>
        public void AddAudioClip(AudioClipData clipData)
        {
            if (clipData != null && !string.IsNullOrEmpty(clipData.id))
            {
                _audioLookup[clipData.id] = clipData;
            }
        }
        
        /// <summary>
        /// Remove audio clip from system
        /// </summary>
        public void RemoveAudioClip(string audioId)
        {
            if (_audioLookup.ContainsKey(audioId))
            {
                _audioLookup.Remove(audioId);
            }
        }
        
        /// <summary>
        /// Check if audio clip exists
        /// </summary>
        public bool HasAudioClip(string audioId)
        {
            return _audioLookup.ContainsKey(audioId);
        }
        
        /// <summary>
        /// Get audio clip data
        /// </summary>
        public AudioClipData GetAudioClipData(string audioId)
        {
            return _audioLookup.ContainsKey(audioId) ? _audioLookup[audioId] : null;
        }
        
        private IEnumerator FadeInMusic(float duration, float targetVolume)
        {
            float startVolume = musicSource.volume;
            float elapsed = 0f;
            
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                musicSource.volume = Mathf.Lerp(startVolume, targetVolume, elapsed / duration);
                yield return null;
            }
            
            musicSource.volume = targetVolume;
        }
        
        private IEnumerator FadeOutMusic(float duration, System.Action onComplete = null)
        {
            float startVolume = musicSource.volume;
            float elapsed = 0f;
            
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                musicSource.volume = Mathf.Lerp(startVolume, 0f, elapsed / duration);
                yield return null;
            }
            
            musicSource.volume = 0f;
            musicSource.Stop();
            onComplete?.Invoke();
        }
        
        private IEnumerator CooldownCoroutine(string cooldownKey, float duration)
        {
            yield return new WaitForSeconds(duration);
            
            if (_activeCoroutines.ContainsKey(cooldownKey))
            {
                _activeCoroutines.Remove(cooldownKey);
            }
        }
        
        private IEnumerator UpdateAudioSystem()
        {
            while (true)
            {
                // Clean up finished audio sources
                for (int i = _activeSources.Count - 1; i >= 0; i--)
                {
                    AudioSource source = _activeSources[i];
                    if (source == null || !source.isPlaying)
                    {
                        ReturnAudioSourceToPool(source);
                    }
                }
                
                // Update audio layers
                if (enableAudioLayers)
                {
                    UpdateAudioLayers();
                }
                
                // Update audio triggers
                if (enableAudioTriggers)
                {
                    UpdateAudioTriggers();
                }
                
                yield return new WaitForSeconds(0.1f);
            }
        }
        
        private void UpdateAudioLayers()
        {
            // Update audio layer volumes based on game state
            // This is where you would implement dynamic audio layering
            // For example, increasing music volume during intense moments
        }
        
        private void UpdateAudioTriggers()
        {
            // Update audio triggers based on game events
            // This is where you would implement dynamic audio triggering
            // For example, playing different music based on player health
        }
        
        /// <summary>
        /// Set high quality audio
        /// </summary>
        public void SetHighQualityAudio(bool enabled)
        {
            enableHighQualityAudio = enabled;
            
            // Update audio settings based on quality
            if (enabled)
            {
                AudioSettings.SetDSPBufferSize(1024, 4);
            }
            else
            {
                AudioSettings.SetDSPBufferSize(512, 2);
            }
        }
        
        /// <summary>
        /// Set mobile optimization
        /// </summary>
        public void SetMobileOptimization(bool enabled)
        {
            enableMobileOptimization = enabled;
            
            if (enabled)
            {
                SetHighQualityAudio(false);
                maxConcurrentSounds = 16;
                audioPoolSize = 32;
            }
            else
            {
                SetHighQualityAudio(true);
                maxConcurrentSounds = 32;
                audioPoolSize = 64;
            }
        }
        
        void OnDestroy()
        {
            StopAllAudio();
        }
    }
}