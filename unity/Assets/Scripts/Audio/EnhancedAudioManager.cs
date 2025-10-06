using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using Evergreen.Core;

namespace Evergreen.Audio
{
    [System.Serializable]
    public class AudioClipData
    {
        public string id;
        public AudioClip clip;
        public float volume = 1.0f;
        public float pitch = 1.0f;
        public bool loop = false;
        public AudioType type = AudioType.SFX;
    }
    
    public enum AudioType
    {
        Music,
        SFX,
        Voice,
        Ambient
    }
    
    public class EnhancedAudioManager : MonoBehaviour
    {
        [Header("Audio Sources")]
        public AudioSource musicSource;
        public AudioSource sfxSource;
        public AudioSource voiceSource;
        public AudioSource ambientSource;
        
        [Header("Audio Clips")]
        public List<AudioClipData> audioClips = new List<AudioClipData>();
        
        [Header("Volume Settings")]
        [Range(0f, 1f)] public float masterVolume = 1.0f;
        [Range(0f, 1f)] public float musicVolume = 0.7f;
        [Range(0f, 1f)] public float sfxVolume = 0.8f;
        [Range(0f, 1f)] public float voiceVolume = 0.9f;
        [Range(0f, 1f)] public float ambientVolume = 0.5f;
        
        [Header("Music Settings")]
        public bool playMusicOnStart = true;
        public string defaultMusicId = "main_theme";
        public float musicFadeTime = 2.0f;
        
        [Header("SFX Settings")]
        public int maxSFXSources = 10;
        public float sfxPitchVariation = 0.1f;
        
        private Dictionary<string, AudioClipData> _audioLookup = new Dictionary<string, AudioClipData>();
        private List<AudioSource> _sfxSources = new List<AudioSource>();
        private Queue<AudioSource> _availableSFXSources = new Queue<AudioSource>();
        private Coroutine _musicFadeCoroutine;
        private string _currentMusicId;
        
        public static EnhancedAudioManager Instance { get; private set; }
        
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
        
        void Start()
        {
            if (playMusicOnStart && !string.IsNullOrEmpty(defaultMusicId))
            {
                PlayMusic(defaultMusicId);
            }
        }
        
        private void InitializeAudioManager()
        {
            // Create audio sources if they don't exist
            if (musicSource == null)
            {
                musicSource = gameObject.AddComponent<AudioSource>();
                musicSource.loop = true;
                musicSource.playOnAwake = false;
            }
            
            if (sfxSource == null)
            {
                sfxSource = gameObject.AddComponent<AudioSource>();
                sfxSource.playOnAwake = false;
            }
            
            if (voiceSource == null)
            {
                voiceSource = gameObject.AddComponent<AudioSource>();
                voiceSource.playOnAwake = false;
            }
            
            if (ambientSource == null)
            {
                ambientSource = gameObject.AddComponent<AudioSource>();
                ambientSource.loop = true;
                ambientSource.playOnAwake = false;
            }
            
            // Create additional SFX sources
            for (int i = 0; i < maxSFXSources; i++)
            {
                var source = gameObject.AddComponent<AudioSource>();
                source.playOnAwake = false;
                _sfxSources.Add(source);
                _availableSFXSources.Enqueue(source);
            }
            
            // Build audio lookup
            BuildAudioLookup();
            
            // Load audio settings
            LoadAudioSettings();
        }
        
        private void BuildAudioLookup()
        {
            _audioLookup.Clear();
            foreach (var audioData in audioClips)
            {
                _audioLookup[audioData.id] = audioData;
            }
        }
        
        public void PlayMusic(string musicId, bool fadeIn = true)
        {
            if (!_audioLookup.ContainsKey(musicId)) return;
            
            var audioData = _audioLookup[musicId];
            if (audioData.type != AudioType.Music) return;
            
            if (_musicFadeCoroutine != null)
            {
                StopCoroutine(_musicFadeCoroutine);
            }
            
            _currentMusicId = musicId;
            musicSource.clip = audioData.clip;
            musicSource.volume = audioData.volume * musicVolume * masterVolume;
            musicSource.pitch = audioData.pitch;
            musicSource.loop = audioData.loop;
            
            if (fadeIn)
            {
                _musicFadeCoroutine = StartCoroutine(FadeInMusic());
            }
            else
            {
                musicSource.Play();
            }
        }
        
        public void StopMusic(bool fadeOut = true)
        {
            if (fadeOut)
            {
                if (_musicFadeCoroutine != null)
                {
                    StopCoroutine(_musicFadeCoroutine);
                }
                _musicFadeCoroutine = StartCoroutine(FadeOutMusic());
            }
            else
            {
                musicSource.Stop();
            }
        }
        
        public void PlaySFX(string sfxId, float volumeMultiplier = 1.0f, float pitchMultiplier = 1.0f)
        {
            if (!_audioLookup.ContainsKey(sfxId)) return;
            
            var audioData = _audioLookup[sfxId];
            if (audioData.type != AudioType.SFX) return;
            
            AudioSource source = GetAvailableSFXSource();
            if (source == null) return;
            
            source.clip = audioData.clip;
            source.volume = audioData.volume * sfxVolume * masterVolume * volumeMultiplier;
            source.pitch = audioData.pitch * pitchMultiplier * (1 + Random.Range(-sfxPitchVariation, sfxPitchVariation));
            source.loop = audioData.loop;
            source.Play();
            
            if (!audioData.loop)
            {
                StartCoroutine(ReturnSFXSourceWhenFinished(source));
            }
        }
        
        public void PlayVoice(string voiceId, float volumeMultiplier = 1.0f)
        {
            if (!_audioLookup.ContainsKey(voiceId)) return;
            
            var audioData = _audioLookup[voiceId];
            if (audioData.type != AudioType.Voice) return;
            
            voiceSource.clip = audioData.clip;
            voiceSource.volume = audioData.volume * voiceVolume * masterVolume * volumeMultiplier;
            voiceSource.pitch = audioData.pitch;
            voiceSource.Play();
        }
        
        public void PlayAmbient(string ambientId, bool fadeIn = true)
        {
            if (!_audioLookup.ContainsKey(ambientId)) return;
            
            var audioData = _audioLookup[ambientId];
            if (audioData.type != AudioType.Ambient) return;
            
            ambientSource.clip = audioData.clip;
            ambientSource.volume = audioData.volume * ambientVolume * masterVolume;
            ambientSource.pitch = audioData.pitch;
            ambientSource.loop = audioData.loop;
            ambientSource.Play();
        }
        
        public void StopAmbient(bool fadeOut = true)
        {
            if (fadeOut)
            {
                StartCoroutine(FadeOutAmbient());
            }
            else
            {
                ambientSource.Stop();
            }
        }
        
        public void SetMasterVolume(float volume)
        {
            masterVolume = Mathf.Clamp01(volume);
            UpdateAllVolumes();
            SaveAudioSettings();
        }
        
        public void SetMusicVolume(float volume)
        {
            musicVolume = Mathf.Clamp01(volume);
            musicSource.volume = musicSource.volume / (musicVolume / volume) * musicVolume;
            SaveAudioSettings();
        }
        
        public void SetSFXVolume(float volume)
        {
            sfxVolume = Mathf.Clamp01(volume);
            UpdateAllVolumes();
            SaveAudioSettings();
        }
        
        public void SetVoiceVolume(float volume)
        {
            voiceVolume = Mathf.Clamp01(volume);
            voiceSource.volume = voiceSource.volume / (voiceVolume / volume) * voiceVolume;
            SaveAudioSettings();
        }
        
        public void SetAmbientVolume(float volume)
        {
            ambientVolume = Mathf.Clamp01(volume);
            ambientSource.volume = ambientSource.volume / (ambientVolume / volume) * ambientVolume;
            SaveAudioSettings();
        }
        
        private void UpdateAllVolumes()
        {
            musicSource.volume = musicSource.volume / musicVolume * musicVolume * masterVolume;
            sfxSource.volume = sfxSource.volume / sfxVolume * sfxVolume * masterVolume;
            voiceSource.volume = voiceSource.volume / voiceVolume * voiceVolume * masterVolume;
            ambientSource.volume = ambientSource.volume / ambientVolume * ambientVolume * masterVolume;
            
            foreach (var source in _sfxSources)
            {
                if (source.isPlaying)
                {
                    source.volume = source.volume / sfxVolume * sfxVolume * masterVolume;
                }
            }
        }
        
        private AudioSource GetAvailableSFXSource()
        {
            if (_availableSFXSources.Count > 0)
            {
                return _availableSFXSources.Dequeue();
            }
            
            // If no available sources, find the oldest playing source
            foreach (var source in _sfxSources)
            {
                if (!source.isPlaying)
                {
                    return source;
                }
            }
            
            // If all sources are playing, use the first one (oldest)
            return _sfxSources[0];
        }
        
        private IEnumerator ReturnSFXSourceWhenFinished(AudioSource source)
        {
            yield return new WaitUntil(() => !source.isPlaying);
            _availableSFXSources.Enqueue(source);
        }
        
        private IEnumerator FadeInMusic()
        {
            float startVolume = 0f;
            float targetVolume = musicSource.volume;
            musicSource.volume = startVolume;
            musicSource.Play();
            
            float elapsed = 0f;
            while (elapsed < musicFadeTime)
            {
                elapsed += Time.deltaTime;
                musicSource.volume = Mathf.Lerp(startVolume, targetVolume, elapsed / musicFadeTime);
                yield return null;
            }
            
            musicSource.volume = targetVolume;
        }
        
        private IEnumerator FadeOutMusic()
        {
            float startVolume = musicSource.volume;
            float elapsed = 0f;
            
            while (elapsed < musicFadeTime)
            {
                elapsed += Time.deltaTime;
                musicSource.volume = Mathf.Lerp(startVolume, 0f, elapsed / musicFadeTime);
                yield return null;
            }
            
            musicSource.Stop();
            musicSource.volume = startVolume;
        }
        
        private IEnumerator FadeOutAmbient()
        {
            float startVolume = ambientSource.volume;
            float elapsed = 0f;
            
            while (elapsed < musicFadeTime)
            {
                elapsed += Time.deltaTime;
                ambientSource.volume = Mathf.Lerp(startVolume, 0f, elapsed / musicFadeTime);
                yield return null;
            }
            
            ambientSource.Stop();
            ambientSource.volume = startVolume;
        }
        
        public void PlayRandomSFX(string[] sfxIds, float volumeMultiplier = 1.0f)
        {
            if (sfxIds.Length == 0) return;
            
            string randomId = sfxIds[Random.Range(0, sfxIds.Length)];
            PlaySFX(randomId, volumeMultiplier);
        }
        
        public void PlaySFXSequence(string[] sfxIds, float delay = 0.1f)
        {
            StartCoroutine(PlaySFXSequenceCoroutine(sfxIds, delay));
        }
        
        private IEnumerator PlaySFXSequenceCoroutine(string[] sfxIds, float delay)
        {
            foreach (string sfxId in sfxIds)
            {
                PlaySFX(sfxId);
                yield return new WaitForSeconds(delay);
            }
        }
        
        public void PauseAllAudio()
        {
            musicSource.Pause();
            sfxSource.Pause();
            voiceSource.Pause();
            ambientSource.Pause();
            
            foreach (var source in _sfxSources)
            {
                source.Pause();
            }
        }
        
        public void ResumeAllAudio()
        {
            musicSource.UnPause();
            sfxSource.UnPause();
            voiceSource.UnPause();
            ambientSource.UnPause();
            
            foreach (var source in _sfxSources)
            {
                source.UnPause();
            }
        }
        
        public void StopAllAudio()
        {
            musicSource.Stop();
            sfxSource.Stop();
            voiceSource.Stop();
            ambientSource.Stop();
            
            foreach (var source in _sfxSources)
            {
                source.Stop();
            }
        }
        
        private void LoadAudioSettings()
        {
            string path = Application.persistentDataPath + "/audio_settings.json";
            if (System.IO.File.Exists(path))
            {
                string json = System.IO.File.ReadAllText(path);
                var settings = JsonUtility.FromJson<AudioSettings>(json);
                
                masterVolume = settings.masterVolume;
                musicVolume = settings.musicVolume;
                sfxVolume = settings.sfxVolume;
                voiceVolume = settings.voiceVolume;
                ambientVolume = settings.ambientVolume;
                
                UpdateAllVolumes();
            }
        }
        
        private void SaveAudioSettings()
        {
            var settings = new AudioSettings
            {
                masterVolume = masterVolume,
                musicVolume = musicVolume,
                sfxVolume = sfxVolume,
                voiceVolume = voiceVolume,
                ambientVolume = ambientVolume
            };
            
            string json = JsonUtility.ToJson(settings, true);
            System.IO.File.WriteAllText(Application.persistentDataPath + "/audio_settings.json", json);
        }
        
        public void AddAudioClip(AudioClipData audioData)
        {
            audioClips.Add(audioData);
            _audioLookup[audioData.id] = audioData;
        }
        
        public void RemoveAudioClip(string audioId)
        {
            var audioData = audioClips.Find(a => a.id == audioId);
            if (audioData != null)
            {
                audioClips.Remove(audioData);
                _audioLookup.Remove(audioId);
            }
        }
        
        public bool HasAudioClip(string audioId)
        {
            return _audioLookup.ContainsKey(audioId);
        }
        
        public AudioClipData GetAudioClip(string audioId)
        {
            return _audioLookup.ContainsKey(audioId) ? _audioLookup[audioId] : null;
        }
        
        void OnDestroy()
        {
            SaveAudioSettings();
        }
    }
    
    [System.Serializable]
    public class AudioSettings
    {
        public float masterVolume = 1.0f;
        public float musicVolume = 0.7f;
        public float sfxVolume = 0.8f;
        public float voiceVolume = 0.9f;
        public float ambientVolume = 0.5f;
    }
}