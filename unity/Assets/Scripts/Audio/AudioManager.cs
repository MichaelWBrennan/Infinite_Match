using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Audio;
using System.Collections;

namespace Evergreen.Audio
{
    [System.Serializable]
    public class Sound
    {
        public string name;
        public AudioClip clip;
        [Range(0f, 1f)]
        public float volume = 1f;
        [Range(0.1f, 3f)]
        public float pitch = 1f;
        public bool loop = false;
        public bool playOnAwake = false;
        [HideInInspector]
        public AudioSource source;
    }
    
    [System.Serializable]
    public class MusicTrack
    {
        public string name;
        public AudioClip clip;
        [Range(0f, 1f)]
        public float volume = 0.7f;
        public bool loop = true;
        public float fadeInTime = 2f;
        public float fadeOutTime = 2f;
    }
    
    public class AudioManager : MonoBehaviour
    {
        [Header("Audio Sources")]
        public AudioSource musicSource;
        public AudioSource sfxSource;
        public AudioSource uiSource;
        public AudioSource ambientSource;
        
        [Header("Audio Mixer")]
        public AudioMixerGroup musicMixerGroup;
        public AudioMixerGroup sfxMixerGroup;
        public AudioMixerGroup uiMixerGroup;
        public AudioMixerGroup ambientMixerGroup;
        
        [Header("Sounds")]
        public Sound[] sounds;
        
        [Header("Music")]
        public MusicTrack[] musicTracks;
        
        [Header("Settings")]
        [Range(0f, 1f)]
        public float masterVolume = 1f;
        [Range(0f, 1f)]
        public float musicVolume = 0.7f;
        [Range(0f, 1f)]
        public float sfxVolume = 1f;
        [Range(0f, 1f)]
        public float uiVolume = 1f;
        [Range(0f, 1f)]
        public float ambientVolume = 0.5f;
        
        public static AudioManager Instance { get; private set; }
        
        private Dictionary<string, Sound> soundDictionary = new Dictionary<string, Sound>();
        private Dictionary<string, MusicTrack> musicDictionary = new Dictionary<string, MusicTrack>();
        private string currentMusicTrack = "";
        private Coroutine musicFadeCoroutine;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeAudio();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            LoadAudioSettings();
            PlayMusic("main_theme");
        }
        
        private void InitializeAudio()
        {
            // Create audio sources if they don't exist
            if (musicSource == null)
            {
                musicSource = gameObject.AddComponent<AudioSource>();
                musicSource.outputAudioMixerGroup = musicMixerGroup;
            }
            
            if (sfxSource == null)
            {
                sfxSource = gameObject.AddComponent<AudioSource>();
                sfxSource.outputAudioMixerGroup = sfxMixerGroup;
            }
            
            if (uiSource == null)
            {
                uiSource = gameObject.AddComponent<AudioSource>();
                uiSource.outputAudioMixerGroup = uiMixerGroup;
            }
            
            if (ambientSource == null)
            {
                ambientSource = gameObject.AddComponent<AudioSource>();
                ambientSource.outputAudioMixerGroup = ambientMixerGroup;
            }
            
            // Initialize sounds
            foreach (var sound in sounds)
            {
                sound.source = gameObject.AddComponent<AudioSource>();
                sound.source.clip = sound.clip;
                sound.source.volume = sound.volume;
                sound.source.pitch = sound.pitch;
                sound.source.loop = sound.loop;
                sound.source.playOnAwake = sound.playOnAwake;
                sound.source.outputAudioMixerGroup = sfxMixerGroup;
                
                soundDictionary[sound.name] = sound;
            }
            
            // Initialize music tracks
            foreach (var track in musicTracks)
            {
                musicDictionary[track.name] = track;
            }
        }
        
        public void PlaySound(string soundName)
        {
            if (soundDictionary.ContainsKey(soundName))
            {
                var sound = soundDictionary[soundName];
                sound.source.volume = sound.volume * sfxVolume * masterVolume;
                sound.source.Play();
            }
            else
            {
                Debug.LogWarning($"Sound '{soundName}' not found!");
            }
        }
        
        public void PlayUISound(string soundName)
        {
            if (soundDictionary.ContainsKey(soundName))
            {
                var sound = soundDictionary[soundName];
                uiSource.clip = sound.clip;
                uiSource.volume = sound.volume * uiVolume * masterVolume;
                uiSource.pitch = sound.pitch;
                uiSource.Play();
            }
            else
            {
                Debug.LogWarning($"UI Sound '{soundName}' not found!");
            }
        }
        
        public void PlayMusic(string trackName)
        {
            if (musicDictionary.ContainsKey(trackName))
            {
                if (currentMusicTrack == trackName) return;
                
                var track = musicDictionary[trackName];
                currentMusicTrack = trackName;
                
                if (musicFadeCoroutine != null)
                {
                    StopCoroutine(musicFadeCoroutine);
                }
                
                musicFadeCoroutine = StartCoroutine(FadeToNewMusic(track));
            }
            else
            {
                Debug.LogWarning($"Music track '{trackName}' not found!");
            }
        }
        
        public void StopMusic()
        {
            if (musicFadeCoroutine != null)
            {
                StopCoroutine(musicFadeCoroutine);
            }
            
            musicFadeCoroutine = StartCoroutine(FadeOutMusic());
        }
        
        public void PlayAmbient(string soundName)
        {
            if (soundDictionary.ContainsKey(soundName))
            {
                var sound = soundDictionary[soundName];
                ambientSource.clip = sound.clip;
                ambientSource.volume = sound.volume * ambientVolume * masterVolume;
                ambientSource.loop = true;
                ambientSource.Play();
            }
        }
        
        public void StopAmbient()
        {
            ambientSource.Stop();
        }
        
        private IEnumerator FadeToNewMusic(MusicTrack track)
        {
            // Fade out current music
            if (musicSource.isPlaying)
            {
                yield return StartCoroutine(FadeOutMusic());
            }
            
            // Fade in new music
            musicSource.clip = track.clip;
            musicSource.volume = 0f;
            musicSource.loop = track.loop;
            musicSource.Play();
            
            float targetVolume = track.volume * musicVolume * masterVolume;
            float fadeTime = track.fadeInTime;
            float elapsedTime = 0f;
            
            while (elapsedTime < fadeTime)
            {
                elapsedTime += Time.deltaTime;
                musicSource.volume = Mathf.Lerp(0f, targetVolume, elapsedTime / fadeTime);
                yield return null;
            }
            
            musicSource.volume = targetVolume;
        }
        
        private IEnumerator FadeOutMusic()
        {
            float startVolume = musicSource.volume;
            float fadeTime = 2f; // Default fade out time
            float elapsedTime = 0f;
            
            while (elapsedTime < fadeTime)
            {
                elapsedTime += Time.deltaTime;
                musicSource.volume = Mathf.Lerp(startVolume, 0f, elapsedTime / fadeTime);
                yield return null;
            }
            
            musicSource.Stop();
            musicSource.volume = startVolume;
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
            musicSource.volume = musicVolume * masterVolume;
            SaveAudioSettings();
        }
        
        public void SetSFXVolume(float volume)
        {
            sfxVolume = Mathf.Clamp01(volume);
            UpdateSFXVolumes();
            SaveAudioSettings();
        }
        
        public void SetUIVolume(float volume)
        {
            uiVolume = Mathf.Clamp01(volume);
            uiSource.volume = uiVolume * masterVolume;
            SaveAudioSettings();
        }
        
        public void SetAmbientVolume(float volume)
        {
            ambientVolume = Mathf.Clamp01(volume);
            ambientSource.volume = ambientVolume * masterVolume;
            SaveAudioSettings();
        }
        
        private void UpdateAllVolumes()
        {
            musicSource.volume = musicVolume * masterVolume;
            uiSource.volume = uiVolume * masterVolume;
            ambientSource.volume = ambientVolume * masterVolume;
            UpdateSFXVolumes();
        }
        
        private void UpdateSFXVolumes()
        {
            foreach (var sound in soundDictionary.Values)
            {
                sound.source.volume = sound.volume * sfxVolume * masterVolume;
            }
        }
        
        public void PlayMatchSound(int matchSize, bool isSpecial)
        {
            if (isSpecial)
            {
                PlaySound("special_match");
            }
            else if (matchSize >= 5)
            {
                PlaySound("big_match");
            }
            else if (matchSize == 4)
            {
                PlaySound("good_match");
            }
            else
            {
                PlaySound("normal_match");
            }
        }
        
        public void PlayLevelCompleteSound(int stars)
        {
            switch (stars)
            {
                case 3:
                    PlaySound("level_complete_3_stars");
                    break;
                case 2:
                    PlaySound("level_complete_2_stars");
                    break;
                case 1:
                    PlaySound("level_complete_1_star");
                    break;
                default:
                    PlaySound("level_complete");
                    break;
            }
        }
        
        public void PlayLevelFailedSound()
        {
            PlaySound("level_failed");
        }
        
        public void PlayButtonClickSound()
        {
            PlayUISound("button_click");
        }
        
        public void PlayPurchaseSound()
        {
            PlayUISound("purchase");
        }
        
        public void PlayAchievementSound()
        {
            PlayUISound("achievement");
        }
        
        public void PlayNotificationSound()
        {
            PlayUISound("notification");
        }
        
        private void LoadAudioSettings()
        {
            masterVolume = PlayerPrefs.GetFloat("MasterVolume", 1f);
            musicVolume = PlayerPrefs.GetFloat("MusicVolume", 0.7f);
            sfxVolume = PlayerPrefs.GetFloat("SFXVolume", 1f);
            uiVolume = PlayerPrefs.GetFloat("UIVolume", 1f);
            ambientVolume = PlayerPrefs.GetFloat("AmbientVolume", 0.5f);
            
            UpdateAllVolumes();
        }
        
        private void SaveAudioSettings()
        {
            PlayerPrefs.SetFloat("MasterVolume", masterVolume);
            PlayerPrefs.SetFloat("MusicVolume", musicVolume);
            PlayerPrefs.SetFloat("SFXVolume", sfxVolume);
            PlayerPrefs.SetFloat("UIVolume", uiVolume);
            PlayerPrefs.SetFloat("AmbientVolume", ambientVolume);
        }
    }
}