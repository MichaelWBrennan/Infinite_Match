using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using Evergreen.Core;

namespace Evergreen.Effects
{
    public class EnhancedMatchEffects : MonoBehaviour
    {
        [Header("Particle Effects")]
        public ParticleSystem matchEffectPrefab;
        public ParticleSystem specialMatchEffectPrefab;
        public ParticleSystem comboEffectPrefab;
        public ParticleSystem levelCompleteEffectPrefab;
        public ParticleSystem coinCollectEffectPrefab;
        public ParticleSystem gemCollectEffectPrefab;
        
        [Header("Audio Effects")]
        public AudioClip matchSound;
        public AudioClip specialMatchSound;
        public AudioClip comboSound;
        public AudioClip levelCompleteSound;
        public AudioClip coinCollectSound;
        public AudioClip gemCollectSound;
        
        [Header("Visual Effects")]
        public GameObject matchGlowPrefab;
        public GameObject specialGlowPrefab;
        public GameObject comboGlowPrefab;
        public float effectDuration = 1.0f;
        public float glowIntensity = 2.0f;
        
        [Header("Screen Effects")]
        public Camera mainCamera;
        public float screenShakeIntensity = 0.1f;
        public float screenShakeDuration = 0.2f;
        
        private AudioSource _audioSource;
        private Queue<ParticleSystem> _matchEffectPool = new Queue<ParticleSystem>();
        private Queue<ParticleSystem> _specialMatchEffectPool = new Queue<ParticleSystem>();
        private Queue<ParticleSystem> _comboEffectPool = new Queue<ParticleSystem>();
        private Queue<ParticleSystem> _levelCompleteEffectPool = new Queue<ParticleSystem>();
        private Queue<ParticleSystem> _coinCollectEffectPool = new Queue<ParticleSystem>();
        private Queue<ParticleSystem> _gemCollectEffectPool = new Queue<ParticleSystem>();
        
        public static EnhancedMatchEffects Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeEffects();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        private void InitializeEffects()
        {
            _audioSource = GetComponent<AudioSource>();
            if (_audioSource == null)
            {
                _audioSource = gameObject.AddComponent<AudioSource>();
            }
            
            if (mainCamera == null)
            {
                mainCamera = Camera.main;
            }
            
            // Pre-populate effect pools
            PrePopulateEffectPools();
        }
        
        private void PrePopulateEffectPools()
        {
            // Create pools for each effect type
            CreateEffectPool(matchEffectPrefab, _matchEffectPool, 10);
            CreateEffectPool(specialMatchEffectPrefab, _specialMatchEffectPool, 5);
            CreateEffectPool(comboEffectPrefab, _comboEffectPool, 5);
            CreateEffectPool(levelCompleteEffectPrefab, _levelCompleteEffectPool, 3);
            CreateEffectPool(coinCollectEffectPrefab, _coinCollectEffectPool, 15);
            CreateEffectPool(gemCollectEffectPrefab, _gemCollectEffectPool, 10);
        }
        
        private void CreateEffectPool(ParticleSystem prefab, Queue<ParticleSystem> pool, int count)
        {
            if (prefab == null) return;
            
            for (int i = 0; i < count; i++)
            {
                var effect = Instantiate(prefab, transform);
                effect.gameObject.SetActive(false);
                pool.Enqueue(effect);
            }
        }
        
        public void PlayMatchEffect(Vector3 position, int matchCount, bool isSpecial = false)
        {
            StartCoroutine(PlayMatchEffectCoroutine(position, matchCount, isSpecial));
        }
        
        private IEnumerator PlayMatchEffectCoroutine(Vector3 position, int matchCount, bool isSpecial)
        {
            // Play particle effect
            ParticleSystem effect = GetEffectFromPool(isSpecial ? _specialMatchEffectPool : _matchEffectPool, 
                                                     isSpecial ? specialMatchEffectPrefab : matchEffectPrefab);
            if (effect != null)
            {
                effect.transform.position = position;
                effect.gameObject.SetActive(true);
                effect.Play();
                
                // Return to pool after effect duration
                yield return new WaitForSeconds(effectDuration);
                effect.gameObject.SetActive(false);
                ReturnEffectToPool(effect, isSpecial ? _specialMatchEffectPool : _matchEffectPool);
            }
            
            // Play audio effect
            PlayAudioEffect(isSpecial ? specialMatchSound : matchSound);
            
            // Play glow effect
            PlayGlowEffect(position, isSpecial ? specialGlowPrefab : matchGlowPrefab);
            
            // Screen shake for special matches
            if (isSpecial)
            {
                StartCoroutine(ScreenShake());
            }
        }
        
        public void PlayComboEffect(Vector3 position, int comboSize)
        {
            StartCoroutine(PlayComboEffectCoroutine(position, comboSize));
        }
        
        private IEnumerator PlayComboEffectCoroutine(Vector3 position, int comboSize)
        {
            // Play particle effect
            ParticleSystem effect = GetEffectFromPool(_comboEffectPool, comboEffectPrefab);
            if (effect != null)
            {
                effect.transform.position = position;
                effect.gameObject.SetActive(true);
                effect.Play();
                
                yield return new WaitForSeconds(effectDuration);
                effect.gameObject.SetActive(false);
                ReturnEffectToPool(effect, _comboEffectPool);
            }
            
            // Play audio effect
            PlayAudioEffect(comboSound);
            
            // Play glow effect
            PlayGlowEffect(position, comboGlowPrefab);
            
            // Screen shake for large combos
            if (comboSize >= 5)
            {
                StartCoroutine(ScreenShake());
            }
        }
        
        public void PlayLevelCompleteEffect(Vector3 position)
        {
            StartCoroutine(PlayLevelCompleteEffectCoroutine(position));
        }
        
        private IEnumerator PlayLevelCompleteEffectCoroutine(Vector3 position)
        {
            // Play particle effect
            ParticleSystem effect = GetEffectFromPool(_levelCompleteEffectPool, levelCompleteEffectPrefab);
            if (effect != null)
            {
                effect.transform.position = position;
                effect.gameObject.SetActive(true);
                effect.Play();
                
                yield return new WaitForSeconds(effectDuration * 2);
                effect.gameObject.SetActive(false);
                ReturnEffectToPool(effect, _levelCompleteEffectPool);
            }
            
            // Play audio effect
            PlayAudioEffect(levelCompleteSound);
            
            // Screen shake
            StartCoroutine(ScreenShake());
        }
        
        public void PlayCoinCollectEffect(Vector3 position, int coinCount)
        {
            StartCoroutine(PlayCoinCollectEffectCoroutine(position, coinCount));
        }
        
        private IEnumerator PlayCoinCollectEffectCoroutine(Vector3 position, int coinCount)
        {
            // Play multiple coin effects for larger amounts
            int effectCount = Mathf.Min(coinCount / 10, 5);
            
            for (int i = 0; i < effectCount; i++)
            {
                ParticleSystem effect = GetEffectFromPool(_coinCollectEffectPool, coinCollectEffectPrefab);
                if (effect != null)
                {
                    Vector3 offset = new Vector3(
                        Random.Range(-0.5f, 0.5f),
                        Random.Range(-0.5f, 0.5f),
                        0
                    );
                    effect.transform.position = position + offset;
                    effect.gameObject.SetActive(true);
                    effect.Play();
                    
                    yield return new WaitForSeconds(0.1f);
                    
                    effect.gameObject.SetActive(false);
                    ReturnEffectToPool(effect, _coinCollectEffectPool);
                }
            }
            
            // Play audio effect
            PlayAudioEffect(coinCollectSound);
        }
        
        public void PlayGemCollectEffect(Vector3 position, int gemCount)
        {
            StartCoroutine(PlayGemCollectEffectCoroutine(position, gemCount));
        }
        
        private IEnumerator PlayGemCollectEffectCoroutine(Vector3 position, int gemCount)
        {
            // Play multiple gem effects
            int effectCount = Mathf.Min(gemCount, 3);
            
            for (int i = 0; i < effectCount; i++)
            {
                ParticleSystem effect = GetEffectFromPool(_gemCollectEffectPool, gemCollectEffectPrefab);
                if (effect != null)
                {
                    Vector3 offset = new Vector3(
                        Random.Range(-0.3f, 0.3f),
                        Random.Range(-0.3f, 0.3f),
                        0
                    );
                    effect.transform.position = position + offset;
                    effect.gameObject.SetActive(true);
                    effect.Play();
                    
                    yield return new WaitForSeconds(0.2f);
                    
                    effect.gameObject.SetActive(false);
                    ReturnEffectToPool(effect, _gemCollectEffectPool);
                }
            }
            
            // Play audio effect
            PlayAudioEffect(gemCollectSound);
        }
        
        private ParticleSystem GetEffectFromPool(Queue<ParticleSystem> pool, ParticleSystem prefab)
        {
            if (pool.Count > 0)
            {
                return pool.Dequeue();
            }
            else if (prefab != null)
            {
                var effect = Instantiate(prefab, transform);
                effect.gameObject.SetActive(false);
                return effect;
            }
            return null;
        }
        
        private void ReturnEffectToPool(ParticleSystem effect, Queue<ParticleSystem> pool)
        {
            if (effect != null)
            {
                effect.Stop();
                effect.Clear();
                pool.Enqueue(effect);
            }
        }
        
        private void PlayAudioEffect(AudioClip clip)
        {
            if (clip != null && _audioSource != null)
            {
                _audioSource.PlayOneShot(clip);
            }
        }
        
        private void PlayGlowEffect(Vector3 position, GameObject glowPrefab)
        {
            if (glowPrefab != null)
            {
                var glow = Instantiate(glowPrefab, position, Quaternion.identity);
                Destroy(glow, effectDuration);
            }
        }
        
        private IEnumerator ScreenShake()
        {
            if (mainCamera == null) yield break;
            
            Vector3 originalPosition = mainCamera.transform.localPosition;
            float elapsed = 0f;
            
            while (elapsed < screenShakeDuration)
            {
                float x = Random.Range(-1f, 1f) * screenShakeIntensity;
                float y = Random.Range(-1f, 1f) * screenShakeIntensity;
                
                mainCamera.transform.localPosition = new Vector3(x, y, originalPosition.z);
                
                elapsed += Time.deltaTime;
                yield return null;
            }
            
            mainCamera.transform.localPosition = originalPosition;
        }
        
        public void PlayCustomEffect(Vector3 position, ParticleSystem customEffect, AudioClip customSound, float duration = 1.0f)
        {
            StartCoroutine(PlayCustomEffectCoroutine(position, customEffect, customSound, duration));
        }
        
        private IEnumerator PlayCustomEffectCoroutine(Vector3 position, ParticleSystem customEffect, AudioClip customSound, float duration)
        {
            if (customEffect != null)
            {
                var effect = Instantiate(customEffect, position, Quaternion.identity);
                effect.Play();
                
                yield return new WaitForSeconds(duration);
                Destroy(effect.gameObject);
            }
            
            if (customSound != null)
            {
                PlayAudioEffect(customSound);
            }
        }
        
        public void SetEffectVolume(float volume)
        {
            if (_audioSource != null)
            {
                _audioSource.volume = volume;
            }
        }
        
        public void SetEffectIntensity(float intensity)
        {
            glowIntensity = intensity;
            screenShakeIntensity = intensity * 0.1f;
        }
    }
}