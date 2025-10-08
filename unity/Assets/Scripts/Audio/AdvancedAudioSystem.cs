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
                InitializeAudiosystemSafe();
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
        
        private void InitializeAudiosystemSafe()
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
        
        public void PlayMusic(string clipName, bool fadeIn = true)
        {
            if (!enableMusic || !_audioClipLookup.ContainsKey(clipName)) return;
            
            var clip = _audioClipLookup[clipName];
            PlayMusic(clip, fadeIn);
        }
        
        public void PlayMusic(AudioClip clip, bool fadeIn = true)
        {
            if (!enableMusic || clip == null) return;
            
            if (crossfadeMusic && _currentMusicSource.isPlaying)
            {
                StartCoroutine(CrossfadeMusic(clip, fadeIn));
            }
            else
            {
                _currentMusicSource.clip = clip;
                _currentMusicSource.Play();
                
                if (fadeIn)
                {
                    StartCoroutine(FadeInMusic());
                }
                
                OnMusicStarted?.Invoke(clip.name);
            }
        }
        
        private IEnumerator CrossfadeMusic(AudioClip newClip, bool fadeIn)
        {
            if (_musicCrossfadeCoroutine != null)
            {
                StopCoroutine(_musicCrossfadeCoroutine);
            }
            
            _musicCrossfadeCoroutine = StartCoroutine(CrossfadeMusicCoroutine(newClip, fadeIn));
            yield return _musicCrossfadeCoroutine;
        }
        
        private IEnumerator CrossfadeMusicCoroutine(AudioClip newClip, bool fadeIn)
        {
            // Create next music source
            _nextMusicSource = CreateAudioSource("NextMusicSource", AudioType.Music);
            _nextMusicSource.clip = newClip;
            _nextMusicSource.volume = 0f;
            _nextMusicSource.Play();
            
            // Fade out current, fade in next
            float elapsed = 0f;
            while (elapsed < crossfadeDuration)
            {
                float progress = elapsed / crossfadeDuration;
                _currentMusicSource.volume = musicVolume * masterVolume * (1f - progress);
                _nextMusicSource.volume = musicVolume * masterVolume * progress;
                
                elapsed += Time.deltaTime;
                yield return null;
            }
            
            // Clean up
            _currentMusicSource.Stop();
            Destroy(_currentMusicSource.gameObject);
            _currentMusicSource = _nextMusicSource;
            _nextMusicSource = null;
            
            OnMusicStarted?.Invoke(newClip.name);
            _musicCrossfadeCoroutine = null;
        }
        
        private IEnumerator FadeInMusic()
        {
            if (_musicFadeCoroutine != null)
            {
                StopCoroutine(_musicFadeCoroutine);
            }
            
            _musicFadeCoroutine = StartCoroutine(FadeInMusicCoroutine());
            yield return _musicFadeCoroutine;
        }
        
        private IEnumerator FadeInMusicCoroutine()
        {
            float startVolume = 0f;
            float targetVolume = musicVolume * masterVolume;
            
            _currentMusicSource.volume = startVolume;
            
            float elapsed = 0f;
            while (elapsed < musicFadeInDuration)
            {
                float progress = elapsed / musicFadeInDuration;
                _currentMusicSource.volume = Mathf.Lerp(startVolume, targetVolume, progress);
                
                elapsed += Time.deltaTime;
                yield return null;
            }
            
            _currentMusicSource.volume = targetVolume;
            _musicFadeCoroutine = null;
        }
        
        public void StopMusic(bool fadeOut = true)
        {
            if (!_currentMusicSource.isPlaying) return;
            
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
            float startVolume = _currentMusicSource.volume;
            float elapsed = 0f;
            
            while (elapsed < musicFadeOutDuration)
            {
                float progress = elapsed / musicFadeOutDuration;
                _currentMusicSource.volume = Mathf.Lerp(startVolume, 0f, progress);
                
                elapsed += Time.deltaTime;
                yield return null;
            }
            
            _currentMusicSource.Stop();
            _currentMusicSource.volume = musicVolume * masterVolume;
            OnMusicStopped?.Invoke(_currentMusicSource.clip?.name ?? "Unknown");
        }
        
        public void PlaySFX(string clipName, Vector3 position = default, float pitch = 1f)
        {
            if (!enableSFX || !_audioClipLookup.ContainsKey(clipName)) return;
            
            var clip = _audioClipLookup[clipName];
            PlaySFX(clip, position, pitch);
        }
        
        public void PlaySFX(AudioClip clip, Vector3 position = default, float pitch = 1f)
        {
            if (!enableSFX || clip == null) return;
            
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
            
            source.clip = clip;
            source.pitch = pitch + UnityEngine.Random.Range(-sfxPitchVariation, sfxPitchVariation);
            source.transform.position = position;
            source.Play();
            
            OnSFXPlayed?.Invoke(clip.name);
        }
        
        public void PlayVoice(string clipName, bool showSubtitles = true)
        {
            if (!enableVoice || !_audioClipLookup.ContainsKey(clipName)) return;
            
            var clip = _audioClipLookup[clipName];
            PlayVoice(clip, showSubtitles);
        }
        
        public void PlayVoice(AudioClip clip, bool showSubtitles = true)
        {
            if (!enableVoice || clip == null) return;
            
            voiceSource.clip = clip;
            voiceSource.Play();
            
            if (showSubtitles && enableVoiceSubtitles)
            {
                StartCoroutine(ShowVoiceSubtitles(clip.name));
            }
            
            OnVoicePlayed?.Invoke(clip.name);
        }
        
        private IEnumerator ShowVoiceSubtitles(string text)
        {
            // This would integrate with your UI system to show subtitles
            Debug.Log($"Voice: {text}");
            yield return new WaitForSeconds(voiceSubtitleDuration);
        }
        
        public void PlayAmbient(string clipName, bool loop = true)
        {
            if (!enableAmbient || !_audioClipLookup.ContainsKey(clipName)) return;
            
            var clip = _audioClipLookup[clipName];
            PlayAmbient(clip, loop);
        }
        
        public void PlayAmbient(AudioClip clip, bool loop = true)
        {
            if (!enableAmbient || clip == null) return;
            
            ambientSource.clip = clip;
            ambientSource.loop = loop;
            ambientSource.Play();
        }
        
        public void PlayUI(string clipName)
        {
            if (!enableUI || !_audioClipLookup.ContainsKey(clipName)) return;
            
            var clip = _audioClipLookup[clipName];
            PlayUI(clip);
        }
        
        public void PlayUI(AudioClip clip)
        {
            if (!enableUI || clip == null) return;
            
            uiSource.clip = clip;
            uiSource.Play();
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
            AudioListener.volume = mute ? 0f : 1f;
        }
        
        public void MuteMusic(bool mute)
        {
            if (musicSource != null)
                musicSource.mute = mute;
        }
        
        public void MuteSFX(bool mute)
        {
            if (sfxSource != null)
                sfxSource.mute = mute;
        }
        
        public void MuteVoice(bool mute)
        {
            if (voiceSource != null)
                voiceSource.mute = mute;
        }
        
        public void MuteAmbient(bool mute)
        {
            if (ambientSource != null)
                ambientSource.mute = mute;
        }
        
        public void MuteUI(bool mute)
        {
            if (uiSource != null)
                uiSource.mute = mute;
        }
        
        public void PauseAll()
        {
            AudioListener.pause = true;
        }
        
        public void UnpauseAll()
        {
            AudioListener.pause = false;
        }
        
        public void StopAll()
        {
            if (musicSource != null) musicSource.Stop();
            if (sfxSource != null) sfxSource.Stop();
            if (voiceSource != null) voiceSource.Stop();
            if (ambientSource != null) ambientSource.Stop();
            if (uiSource != null) uiSource.Stop();
        }
        
        public void StopSFX()
        {
            if (sfxSource != null) sfxSource.Stop();
            
            // Stop all pooled SFX sources
            foreach (var source in _sfxPool)
            {
                if (source != null) source.Stop();
            }
        }
        
        public void StopVoice()
        {
            if (voiceSource != null) voiceSource.Stop();
        }
        
        public void StopAmbient()
        {
            if (ambientSource != null) ambientSource.Stop();
        }
        
        public void StopUI()
        {
            if (uiSource != null) uiSource.Stop();
        }
        
        public bool IsMusicPlaying()
        {
            return musicSource != null && musicSource.isPlaying;
        }
        
        public bool IsSFXPlaying()
        {
            return sfxSource != null && sfxSource.isPlaying;
        }
        
        public bool IsVoicePlaying()
        {
            return voiceSource != null && voiceSource.isPlaying;
        }
        
        public bool IsAmbientPlaying()
        {
            return ambientSource != null && ambientSource.isPlaying;
        }
        
        public bool IsUIPlaying()
        {
            return uiSource != null && uiSource.isPlaying;
        }
        
        public float GetMusicTime()
        {
            return musicSource != null ? musicSource.time : 0f;
        }
        
        public float GetMusicLength()
        {
            return musicSource != null && musicSource.clip != null ? musicSource.clip.length : 0f;
        }
        
        public void SetMusicTime(float time)
        {
            if (musicSource != null && musicSource.clip != null)
            {
                musicSource.time = Mathf.Clamp(time, 0f, musicSource.clip.length);
            }
        }
        
        public void SetSFXPitch(float pitch)
        {
            if (sfxSource != null)
                sfxSource.pitch = pitch;
        }
        
        public void SetVoicePitch(float pitch)
        {
            if (voiceSource != null)
                voiceSource.pitch = pitch;
        }
        
        public void SetAmbientPitch(float pitch)
        {
            if (ambientSource != null)
                ambientSource.pitch = pitch;
        }
        
        public void SetUIPitch(float pitch)
        {
            if (uiSource != null)
                uiSource.pitch = pitch;
        }
        
        public void Set3DAudioEnabled(bool enabled)
        {
            enable3DAudio = enabled;
            enableSpatialAudio = enabled;
        }
        
        public void SetSpatialBlend(float blend)
        {
            sfxSpatialBlend = Mathf.Clamp01(blend);
            
            // Update all SFX sources
            foreach (var source in _sfxPool)
            {
                if (source != null)
                    source.spatialBlend = sfxSpatialBlend;
            }
        }
        
        public void SetMaxDistance(float distance)
        {
            max3DDistance = Mathf.Max(0f, distance);
        }
        
        public void SetDopplerLevel(float level)
        {
            dopplerLevel = Mathf.Max(0f, level);
        }
        
        public void SetSpread(float spread)
        {
            this.spread = Mathf.Clamp(spread, 0f, 360f);
        }
        
        public void SetVolumeRolloff(AnimationCurve curve)
        {
            volumeRolloff = curve;
        }
        
        public void AddAudioClip(AudioClip clip, string name = null)
        {
            if (clip == null) return;
            
            string clipName = name ?? clip.name;
            _audioClipLookup[clipName] = clip;
        }
        
        public void RemoveAudioClip(string name)
        {
            if (_audioClipLookup.ContainsKey(name))
            {
                _audioClipLookup.Remove(name);
            }
        }
        
        public AudioClip GetAudioClip(string name)
        {
            return _audioClipLookup.ContainsKey(name) ? _audioClipLookup[name] : null;
        }
        
        public bool HasAudioClip(string name)
        {
            return _audioClipLookup.ContainsKey(name);
        }
        
        public void ClearAllAudioClips()
        {
            _audioClipLookup.Clear();
        }
        
        public void SaveAudioSettings()
        {
            // Save audio settings to PlayerPrefs
            PlayerPrefs.SetFloat("MasterVolume", masterVolume);
            PlayerPrefs.SetFloat("MusicVolume", musicVolume);
            PlayerPrefs.SetFloat("SFXVolume", sfxVolume);
            PlayerPrefs.SetFloat("VoiceVolume", voiceVolume);
            PlayerPrefs.SetFloat("AmbientVolume", ambientVolume);
            PlayerPrefs.SetFloat("UIVolume", uiVolume);
            PlayerPrefs.SetInt("MusicEnabled", enableMusic ? 1 : 0);
            PlayerPrefs.SetInt("SFXEnabled", enableSFX ? 1 : 0);
            PlayerPrefs.SetInt("VoiceEnabled", enableVoice ? 1 : 0);
            PlayerPrefs.SetInt("AmbientEnabled", enableAmbient ? 1 : 0);
            PlayerPrefs.SetInt("UIEnabled", enableUI ? 1 : 0);
            PlayerPrefs.Save();
        }
        
        public void LoadAudioSettings()
        {
            // Load audio settings from PlayerPrefs
            masterVolume = PlayerPrefs.GetFloat("MasterVolume", 1f);
            musicVolume = PlayerPrefs.GetFloat("MusicVolume", 0.8f);
            sfxVolume = PlayerPrefs.GetFloat("SFXVolume", 1f);
            voiceVolume = PlayerPrefs.GetFloat("VoiceVolume", 1f);
            ambientVolume = PlayerPrefs.GetFloat("AmbientVolume", 0.6f);
            uiVolume = PlayerPrefs.GetFloat("UIVolume", 0.9f);
            enableMusic = PlayerPrefs.GetInt("MusicEnabled", 1) == 1;
            enableSFX = PlayerPrefs.GetInt("SFXEnabled", 1) == 1;
            enableVoice = PlayerPrefs.GetInt("VoiceEnabled", 1) == 1;
            enableAmbient = PlayerPrefs.GetInt("AmbientEnabled", 1) == 1;
            enableUI = PlayerPrefs.GetInt("UIEnabled", 1) == 1;
            
            UpdateVolumeSettings();
        }
        
        void OnDestroy()
        {
            SaveAudioSettings();
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