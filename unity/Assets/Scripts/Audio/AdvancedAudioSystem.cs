using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System;
using Evergreen.Core;

namespace Evergreen.Audio
{
    public class AdvancedAudioSystem : MonoBehaviour
    {
        [Header("Audio Sources")]
        public AudioSource musicSource;
        public AudioSource sfxSource;
        public AudioSource voiceSource;
        public AudioSource ambientSource;
        public AudioSource uiSource;
        
        [Header("Audio Clips")]
        public AudioClip[] musicTracks;
        public AudioClip[] sfxClips;
        public AudioClip[] voiceClips;
        public AudioClip[] ambientClips;
        public AudioClip[] uiClips;
        
        [Header("Volume Settings")]
        [Range(0f, 1f)] public float masterVolume = 1f;
        [Range(0f, 1f)] public float musicVolume = 0.8f;
        [Range(0f, 1f)] public float sfxVolume = 1f;
        [Range(0f, 1f)] public float voiceVolume = 1f;
        [Range(0f, 1f)] public float ambientVolume = 0.6f;
        [Range(0f, 1f)] public float uiVolume = 0.9f;
        
        [Header("Audio Settings")]
        public bool enableMusic = true;
        public bool enableSFX = true;
        public bool enableVoice = true;
        public bool enableAmbient = true;
        public bool enableUI = true;
        public bool enable3DAudio = true;
        public bool enableSpatialAudio = true;
        
        [Header("Music Settings")]
        public bool loopMusic = true;
        public bool crossfadeMusic = true;
        public float crossfadeDuration = 2f;
        public bool randomizeMusic = false;
        public float musicFadeInDuration = 1f;
        public float musicFadeOutDuration = 1f;
        
        [Header("SFX Settings")]
        public int maxSFXSources = 10;
        public float sfxPitchVariation = 0.1f;
        public bool enableSFXPooling = true;
        public float sfxSpatialBlend = 0.5f;
        
        [Header("Voice Settings")]
        public bool enableVoiceSubtitles = true;
        public float voiceSubtitleDuration = 3f;
        public bool enableVoiceLipSync = false;
        
        [Header("3D Audio Settings")]
        public float max3DDistance = 50f;
        public AnimationCurve volumeRolloff = AnimationCurve.EaseInOut(0f, 1f, 1f, 0f);
        public float dopplerLevel = 1f;
        public float spread = 0f;
        
        [Header("Audio Mixing")]
        public AudioMixerGroup musicMixerGroup;
        public AudioMixerGroup sfxMixerGroup;
        public AudioMixerGroup voiceMixerGroup;
        public AudioMixerGroup ambientMixerGroup;
        public AudioMixerGroup uiMixerGroup;
        
        private Dictionary<string, AudioClip> _audioClipLookup = new Dictionary<string, AudioClip>();
        private Dictionary<string, AudioSource> _audioSourceLookup = new Dictionary<string, AudioSource>();
        private List<AudioSource> _sfxPool = new List<AudioSource>();
        private Queue<AudioSource> _availableSFXSources = new Queue<AudioSource>();
        private AudioSource _currentMusicSource;
        private AudioSource _nextMusicSource;
        private Coroutine _musicCrossfadeCoroutine;
        private Coroutine _musicFadeCoroutine;
        private Dictionary<string, Coroutine> _activeFades = new Dictionary<string, Coroutine>();
        
        // Events
        public System.Action<string> OnMusicStarted;
        public System.Action<string> OnMusicStopped;
        public System.Action<string> OnSFXPlayed;
        public System.Action<string> OnVoicePlayed;
        public System.Action<float> OnVolumeChanged;
        
        public static AdvancedAudioSystem Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeAudioSystem();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            SetupAudioSources();
            InitializeAudioClips();
            InitializeSFXPool();
            UpdateVolumeSettings();
        }
        
        void Update()
        {
            UpdateSFXPool();
            Update3DAudio();
        }
        
        private void InitializeAudioSystem()
        {
            Debug.Log("Advanced Audio System initialized");
            
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
        }
        
        private AudioSource CreateAudioSource(string name, AudioType type)
        {
            GameObject audioObj = new GameObject(name);
            audioObj.transform.SetParent(transform);
            
            AudioSource source = audioObj.AddComponent<AudioSource>();
            
            // Configure based on type
            switch (type)
            {
                case AudioType.Music:
                    source.loop = loopMusic;
                    source.volume = musicVolume * masterVolume;
                    source.priority = 0;
                    break;
                case AudioType.SFX:
                    source.loop = false;
                    source.volume = sfxVolume * masterVolume;
                    source.priority = 128;
                    break;
                case AudioType.Voice:
                    source.loop = false;
                    source.volume = voiceVolume * masterVolume;
                    source.priority = 64;
                    break;
                case AudioType.Ambient:
                    source.loop = true;
                    source.volume = ambientVolume * masterVolume;
                    source.priority = 32;
                    break;
                case AudioType.UI:
                    source.loop = false;
                    source.volume = uiVolume * masterVolume;
                    source.priority = 96;
                    break;
            }
            
            // Configure 3D audio
            if (enable3DAudio && type != AudioType.Music)
            {
                source.spatialBlend = sfxSpatialBlend;
                source.rolloffMode = AudioRolloffMode.Custom;
                source.maxDistance = max3DDistance;
                source.dopplerLevel = dopplerLevel;
                source.spread = spread;
            }
            else
            {
                source.spatialBlend = 0f; // 2D audio
            }
            
            // Set mixer group
            AudioMixerGroup mixerGroup = GetMixerGroup(type);
            if (mixerGroup != null)
            {
                source.outputAudioMixerGroup = mixerGroup;
            }
            
            _audioSourceLookup[name] = source;
            return source;
        }
        
        private AudioMixerGroup GetMixerGroup(AudioType type)
        {
            switch (type)
            {
                case AudioType.Music:
                    return musicMixerGroup;
                case AudioType.SFX:
                    return sfxMixerGroup;
                case AudioType.Voice:
                    return voiceMixerGroup;
                case AudioType.Ambient:
                    return ambientMixerGroup;
                case AudioType.UI:
                    return uiMixerGroup;
                default:
                    return null;
            }
        }
        
        private void SetupAudioSources()
        {
            _currentMusicSource = musicSource;
            _nextMusicSource = null;
        }
        
        private void InitializeAudioClips()
        {
            // Initialize music clips
            foreach (var clip in musicTracks)
            {
                if (clip != null)
                {
                    _audioClipLookup[clip.name] = clip;
                }
            }
            
            // Initialize SFX clips
            foreach (var clip in sfxClips)
            {
                if (clip != null)
                {
                    _audioClipLookup[clip.name] = clip;
                }
            }
            
            // Initialize voice clips
            foreach (var clip in voiceClips)
            {
                if (clip != null)
                {
                    _audioClipLookup[clip.name] = clip;
                }
            }
            
            // Initialize ambient clips
            foreach (var clip in ambientClips)
            {
                if (clip != null)
                {
                    _audioClipLookup[clip.name] = clip;
                }
            }
            
            // Initialize UI clips
            foreach (var clip in uiClips)
            {
                if (clip != null)
                {
                    _audioClipLookup[clip.name] = clip;
                }
            }
        }
        
        private void InitializeSFXPool()
        {
            if (!enableSFXPooling) return;
            
            for (int i = 0; i < maxSFXSources; i++)
            {
                var sfxSource = CreateAudioSource($"SFXPool_{i}", AudioType.SFX);
                sfxSource.gameObject.SetActive(false);
                _sfxPool.Add(sfxSource);
                _availableSFXSources.Enqueue(sfxSource);
            }
        }
        
        private void UpdateSFXPool()
        {
            if (!enableSFXPooling) return;
            
            // Check for finished SFX sources and return them to pool
            for (int i = _sfxPool.Count - 1; i >= 0; i--)
            {
                var source = _sfxPool[i];
                if (source != null && !source.isPlaying && source.gameObject.activeInHierarchy)
                {
                    source.gameObject.SetActive(false);
                    _availableSFXSources.Enqueue(source);
                }
            }
        }
        
        private void Update3DAudio()
        {
            if (!enable3DAudio || !enableSpatialAudio) return;
            
            // Update 3D audio settings for all sources
            foreach (var source in _audioSourceLookup.Values)
            {
                if (source != null && source.spatialBlend > 0f)
                {
                    // Update volume based on distance and rolloff curve
                    float distance = Vector3.Distance(transform.position, source.transform.position);
                    float normalizedDistance = Mathf.Clamp01(distance / max3DDistance);
                    float volumeMultiplier = volumeRolloff.Evaluate(normalizedDistance);
                    
                    source.volume = GetBaseVolume(source) * volumeMultiplier * masterVolume;
                }
            }
        }
        
        private float GetBaseVolume(AudioSource source)
        {
            if (source == musicSource) return musicVolume;
            if (source == sfxSource) return sfxVolume;
            if (source == voiceSource) return voiceVolume;
            if (source == ambientSource) return ambientVolume;
            if (source == uiSource) return uiVolume;
            return 1f;
        }
        
        public void PlayMusic(string clipName, bool loop = true, bool crossfade = true)
        {
            if (!enableMusic || !_audioClipLookup.ContainsKey(clipName)) return;
            
            var clip = _audioClipLookup[clipName];
            
            if (crossfade && crossfadeMusic)
            {
                StartCoroutine(CrossfadeMusic(clip, loop));
            }
            else
            {
                PlayMusicDirect(clip, loop);
            }
        }
        
        private void PlayMusicDirect(AudioClip clip, bool loop)
        {
            if (_currentMusicSource != null)
            {
                _currentMusicSource.clip = clip;
                _currentMusicSource.loop = loop;
                _currentMusicSource.Play();
                OnMusicStarted?.Invoke(clip.name);
            }
        }
        
        private IEnumerator CrossfadeMusic(AudioClip newClip, bool loop)
        {
            if (_musicCrossfadeCoroutine != null)
            {
                StopCoroutine(_musicCrossfadeCoroutine);
            }
            
            _musicCrossfadeCoroutine = StartCoroutine(CrossfadeMusicCoroutine(newClip, loop));
            yield return _musicCrossfadeCoroutine;
        }
        
        private IEnumerator CrossfadeMusicCoroutine(AudioClip newClip, bool loop)
        {
            // Create next music source if needed
            if (_nextMusicSource == null)
            {
                _nextMusicSource = CreateAudioSource("NextMusicSource", AudioType.Music);
            }
            
            // Setup next music source
            _nextMusicSource.clip = newClip;
            _nextMusicSource.loop = loop;
            _nextMusicSource.volume = 0f;
            _nextMusicSource.Play();
            
            // Crossfade
            float elapsed = 0f;
            while (elapsed < crossfadeDuration)
            {
                float t = elapsed / crossfadeDuration;
                
                if (_currentMusicSource != null)
                {
                    _currentMusicSource.volume = musicVolume * masterVolume * (1f - t);
                }
                
                _nextMusicSource.volume = musicVolume * masterVolume * t;
                
                elapsed += Time.deltaTime;
                yield return null;
            }
            
            // Complete crossfade
            if (_currentMusicSource != null)
            {
                _currentMusicSource.Stop();
                _currentMusicSource.volume = musicVolume * masterVolume;
            }
            
            _nextMusicSource.volume = musicVolume * masterVolume;
            
            // Swap sources
            var temp = _currentMusicSource;
            _currentMusicSource = _nextMusicSource;
            _nextMusicSource = temp;
            
            OnMusicStarted?.Invoke(newClip.name);
            _musicCrossfadeCoroutine = null;
        }
        
        public void StopMusic(bool fadeOut = true)
        {
            if (_currentMusicSource == null || !_currentMusicSource.isPlaying) return;
            
            if (fadeOut)
            {
                StartCoroutine(FadeOutMusic());
            }
            else
            {
                _currentMusicSource.Stop();
                OnMusicStopped?.Invoke(_currentMusicSource.clip?.name ?? "Unknown");
            }
        }
        
        private IEnumerator FadeOutMusic()
        {
            if (_musicFadeCoroutine != null)
            {
                StopCoroutine(_musicFadeCoroutine);
            }
            
            _musicFadeCoroutine = StartCoroutine(FadeOutMusicCoroutine());
            yield return _musicFadeCoroutine;
        }
        
        private IEnumerator FadeOutMusicCoroutine()
        {
            float startVolume = _currentMusicSource.volume;
            float elapsed = 0f;
            
            while (elapsed < musicFadeOutDuration)
            {
                float t = elapsed / musicFadeOutDuration;
                _currentMusicSource.volume = startVolume * (1f - t);
                elapsed += Time.deltaTime;
                yield return null;
            }
            
            _currentMusicSource.Stop();
            _currentMusicSource.volume = startVolume;
            OnMusicStopped?.Invoke(_currentMusicSource.clip?.name ?? "Unknown");
            _musicFadeCoroutine = null;
        }
        
        public void PlaySFX(string clipName, Vector3 position = default, float pitch = 1f, float volume = 1f)
        {
            if (!enableSFX || !_audioClipLookup.ContainsKey(clipName)) return;
            
            var clip = _audioClipLookup[clipName];
            AudioSource source = null;
            
            if (enableSFXPooling && _availableSFXSources.Count > 0)
            {
                source = _availableSFXSources.Dequeue();
                source.gameObject.SetActive(true);
            }
            else
            {
                source = sfxSource;
            }
            
            if (source != null)
            {
                source.clip = clip;
                source.pitch = pitch + UnityEngine.Random.Range(-sfxPitchVariation, sfxPitchVariation);
                source.volume = sfxVolume * masterVolume * volume;
                
                if (position != default && enable3DAudio)
                {
                    source.transform.position = position;
                }
                
                source.Play();
                OnSFXPlayed?.Invoke(clipName);
            }
        }
        
        public void PlayVoice(string clipName, bool showSubtitles = true)
        {
            if (!enableVoice || !_audioClipLookup.ContainsKey(clipName)) return;
            
            var clip = _audioClipLookup[clipName];
            
            if (voiceSource != null)
            {
                voiceSource.clip = clip;
                voiceSource.Play();
                OnVoicePlayed?.Invoke(clipName);
                
                if (showSubtitles && enableVoiceSubtitles)
                {
                    StartCoroutine(ShowVoiceSubtitles(clipName, clip.length));
                }
            }
        }
        
        private IEnumerator ShowVoiceSubtitles(string clipName, float duration)
        {
            // This would integrate with your UI system to show subtitles
            Debug.Log($"Voice: {clipName}");
            yield return new WaitForSeconds(duration);
        }
        
        public void PlayAmbient(string clipName, bool loop = true)
        {
            if (!enableAmbient || !_audioClipLookup.ContainsKey(clipName)) return;
            
            var clip = _audioClipLookup[clipName];
            
            if (ambientSource != null)
            {
                ambientSource.clip = clip;
                ambientSource.loop = loop;
                ambientSource.Play();
            }
        }
        
        public void PlayUI(string clipName, float pitch = 1f, float volume = 1f)
        {
            if (!enableUI || !_audioClipLookup.ContainsKey(clipName)) return;
            
            var clip = _audioClipLookup[clipName];
            
            if (uiSource != null)
            {
                uiSource.clip = clip;
                uiSource.pitch = pitch;
                uiSource.volume = uiVolume * masterVolume * volume;
                uiSource.Play();
            }
        }
        
        public void SetMasterVolume(float volume)
        {
            masterVolume = Mathf.Clamp01(volume);
            UpdateVolumeSettings();
            OnVolumeChanged?.Invoke(masterVolume);
        }
        
        public void SetMusicVolume(float volume)
        {
            musicVolume = Mathf.Clamp01(volume);
            UpdateVolumeSettings();
        }
        
        public void SetSFXVolume(float volume)
        {
            sfxVolume = Mathf.Clamp01(volume);
            UpdateVolumeSettings();
        }
        
        public void SetVoiceVolume(float volume)
        {
            voiceVolume = Mathf.Clamp01(volume);
            UpdateVolumeSettings();
        }
        
        public void SetAmbientVolume(float volume)
        {
            ambientVolume = Mathf.Clamp01(volume);
            UpdateVolumeSettings();
        }
        
        public void SetUIVolume(float volume)
        {
            uiVolume = Mathf.Clamp01(volume);
            UpdateVolumeSettings();
        }
        
        private void UpdateVolumeSettings()
        {
            if (musicSource != null)
                musicSource.volume = musicVolume * masterVolume;
            if (sfxSource != null)
                sfxSource.volume = sfxVolume * masterVolume;
            if (voiceSource != null)
                voiceSource.volume = voiceVolume * masterVolume;
            if (ambientSource != null)
                ambientSource.volume = ambientVolume * masterVolume;
            if (uiSource != null)
                uiSource.volume = uiVolume * masterVolume;
        }
        
        public void MuteAll(bool mute)
        {
            masterVolume = mute ? 0f : 1f;
            UpdateVolumeSettings();
        }
        
        public void MuteMusic(bool mute)
        {
            musicVolume = mute ? 0f : 0.8f;
            UpdateVolumeSettings();
        }
        
        public void MuteSFX(bool mute)
        {
            sfxVolume = mute ? 0f : 1f;
            UpdateVolumeSettings();
        }
        
        public void MuteVoice(bool mute)
        {
            voiceVolume = mute ? 0f : 1f;
            UpdateVolumeSettings();
        }
        
        public void MuteAmbient(bool mute)
        {
            ambientVolume = mute ? 0f : 0.6f;
            UpdateVolumeSettings();
        }
        
        public void MuteUI(bool mute)
        {
            uiVolume = mute ? 0f : 0.9f;
            UpdateVolumeSettings();
        }
        
        public void PauseAll()
        {
            if (musicSource != null && musicSource.isPlaying)
                musicSource.Pause();
            if (sfxSource != null && sfxSource.isPlaying)
                sfxSource.Pause();
            if (voiceSource != null && voiceSource.isPlaying)
                voiceSource.Pause();
            if (ambientSource != null && ambientSource.isPlaying)
                ambientSource.Pause();
            if (uiSource != null && uiSource.isPlaying)
                uiSource.Pause();
        }
        
        public void ResumeAll()
        {
            if (musicSource != null)
                musicSource.UnPause();
            if (sfxSource != null)
                sfxSource.UnPause();
            if (voiceSource != null)
                voiceSource.UnPause();
            if (ambientSource != null)
                ambientSource.UnPause();
            if (uiSource != null)
                uiSource.UnPause();
        }
        
        public void StopAll()
        {
            if (musicSource != null)
                musicSource.Stop();
            if (sfxSource != null)
                sfxSource.Stop();
            if (voiceSource != null)
                voiceSource.Stop();
            if (ambientSource != null)
                ambientSource.Stop();
            if (uiSource != null)
                uiSource.Stop();
        }
        
        public bool IsPlaying(string clipName)
        {
            if (!_audioClipLookup.ContainsKey(clipName)) return false;
            
            var clip = _audioClipLookup[clipName];
            
            foreach (var source in _audioSourceLookup.Values)
            {
                if (source != null && source.clip == clip && source.isPlaying)
                {
                    return true;
                }
            }
            
            return false;
        }
        
        public float GetClipLength(string clipName)
        {
            if (!_audioClipLookup.ContainsKey(clipName)) return 0f;
            
            return _audioClipLookup[clipName].length;
        }
        
        public void SetAudioClip(string category, string clipName, AudioClip clip)
        {
            _audioClipLookup[clipName] = clip;
            
            switch (category.ToLower())
            {
                case "music":
                    if (musicTracks == null) musicTracks = new AudioClip[0];
                    var musicList = new List<AudioClip>(musicTracks);
                    musicList.Add(clip);
                    musicTracks = musicList.ToArray();
                    break;
                case "sfx":
                    if (sfxClips == null) sfxClips = new AudioClip[0];
                    var sfxList = new List<AudioClip>(sfxClips);
                    sfxList.Add(clip);
                    sfxClips = sfxList.ToArray();
                    break;
                case "voice":
                    if (voiceClips == null) voiceClips = new AudioClip[0];
                    var voiceList = new List<AudioClip>(voiceClips);
                    voiceList.Add(clip);
                    voiceClips = voiceList.ToArray();
                    break;
                case "ambient":
                    if (ambientClips == null) ambientClips = new AudioClip[0];
                    var ambientList = new List<AudioClip>(ambientClips);
                    ambientList.Add(clip);
                    ambientClips = ambientList.ToArray();
                    break;
                case "ui":
                    if (uiClips == null) uiClips = new AudioClip[0];
                    var uiList = new List<AudioClip>(uiClips);
                    uiList.Add(clip);
                    uiClips = uiList.ToArray();
                    break;
            }
        }
    }
    
    public enum AudioType
    {
        Music,
        SFX,
        Voice,
        Ambient,
        UI
    }
}