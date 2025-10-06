using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System;
using DG.Tweening;
using Evergreen.Core;

namespace Evergreen.Effects
{
    public class AdvancedVisualEffectsSystem : MonoBehaviour
    {
        [Header("Particle Effects")]
        public ParticleSystem matchEffectPrefab;
        public ParticleSystem comboEffectPrefab;
        public ParticleSystem specialEffectPrefab;
        public ParticleSystem explosionEffectPrefab;
        public ParticleSystem sparkleEffectPrefab;
        public ParticleSystem trailEffectPrefab;
        
        [Header("Screen Effects")]
        public Camera mainCamera;
        public float screenShakeIntensity = 1f;
        public float screenShakeDuration = 0.3f;
        public Color flashColor = Color.white;
        public float flashDuration = 0.1f;
        
        [Header("UI Effects")]
        public Canvas uiCanvas;
        public float uiShakeIntensity = 10f;
        public float uiShakeDuration = 0.2f;
        
        [Header("Object Pooling")]
        public int particlePoolSize = 50;
        public int effectPoolSize = 20;
        
        [Header("Performance Settings")]
        public bool enableEffects = true;
        public bool enableParticles = true;
        public bool enableScreenShake = true;
        public bool enableUIEffects = true;
        public float effectLODDistance = 50f;
        
        private Dictionary<string, ObjectPool<ParticleSystem>> _particlePools = new Dictionary<string, ObjectPool<ParticleSystem>>();
        private Dictionary<string, ObjectPool<GameObject>> _effectPools = new Dictionary<string, ObjectPool<GameObject>>();
        private Dictionary<string, List<ParticleSystem>> _activeParticles = new Dictionary<string, List<ParticleSystem>>();
        private Dictionary<string, List<GameObject>> _activeEffects = new Dictionary<string, List<GameObject>>();
        
        private Camera _camera;
        private Vector3 _originalCameraPosition;
        private bool _isScreenShaking = false;
        private Coroutine _screenShakeCoroutine;
        private Coroutine _flashCoroutine;
        
        // Events
        public System.Action<Vector3, EffectType> OnEffectPlayed;
        public System.Action<EffectType> OnEffectCompleted;
        
        public static AdvancedVisualEffectsSystem Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeEffectsSystem();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            SetupCamera();
            InitializeParticlePools();
            InitializeEffectPools();
        }
        
        private void InitializeEffectsSystem()
        {
            Debug.Log("Advanced Visual Effects System initialized");
            
            if (mainCamera == null)
                mainCamera = Camera.main;
                
            if (uiCanvas == null)
                uiCanvas = FindObjectOfType<Canvas>();
        }
        
        private void SetupCamera()
        {
            _camera = mainCamera;
            if (_camera != null)
            {
                _originalCameraPosition = _camera.transform.position;
            }
        }
        
        private void InitializeParticlePools()
        {
            if (!enableParticles) return;
            
            // Match effect pool
            if (matchEffectPrefab != null)
            {
                _particlePools["match"] = new ObjectPool<ParticleSystem>(
                    createFunc: () => Instantiate(matchEffectPrefab),
                    onGet: (particle) => {
                        particle.gameObject.SetActive(true);
                        particle.Play();
                    },
                    onReturn: (particle) => {
                        particle.Stop();
                        particle.gameObject.SetActive(false);
                    },
                    maxSize: particlePoolSize
                );
                _activeParticles["match"] = new List<ParticleSystem>();
            }
            
            // Combo effect pool
            if (comboEffectPrefab != null)
            {
                _particlePools["combo"] = new ObjectPool<ParticleSystem>(
                    createFunc: () => Instantiate(comboEffectPrefab),
                    onGet: (particle) => {
                        particle.gameObject.SetActive(true);
                        particle.Play();
                    },
                    onReturn: (particle) => {
                        particle.Stop();
                        particle.gameObject.SetActive(false);
                    },
                    maxSize: particlePoolSize
                );
                _activeParticles["combo"] = new List<ParticleSystem>();
            }
            
            // Special effect pool
            if (specialEffectPrefab != null)
            {
                _particlePools["special"] = new ObjectPool<ParticleSystem>(
                    createFunc: () => Instantiate(specialEffectPrefab),
                    onGet: (particle) => {
                        particle.gameObject.SetActive(true);
                        particle.Play();
                    },
                    onReturn: (particle) => {
                        particle.Stop();
                        particle.gameObject.SetActive(false);
                    },
                    maxSize: particlePoolSize
                );
                _activeParticles["special"] = new List<ParticleSystem>();
            }
            
            // Explosion effect pool
            if (explosionEffectPrefab != null)
            {
                _particlePools["explosion"] = new ObjectPool<ParticleSystem>(
                    createFunc: () => Instantiate(explosionEffectPrefab),
                    onGet: (particle) => {
                        particle.gameObject.SetActive(true);
                        particle.Play();
                    },
                    onReturn: (particle) => {
                        particle.Stop();
                        particle.gameObject.SetActive(false);
                    },
                    maxSize: particlePoolSize
                );
                _activeParticles["explosion"] = new List<ParticleSystem>();
            }
            
            // Sparkle effect pool
            if (sparkleEffectPrefab != null)
            {
                _particlePools["sparkle"] = new ObjectPool<ParticleSystem>(
                    createFunc: () => Instantiate(sparkleEffectPrefab),
                    onGet: (particle) => {
                        particle.gameObject.SetActive(true);
                        particle.Play();
                    },
                    onReturn: (particle) => {
                        particle.Stop();
                        particle.gameObject.SetActive(false);
                    },
                    maxSize: particlePoolSize
                );
                _activeParticles["sparkle"] = new List<ParticleSystem>();
            }
            
            // Trail effect pool
            if (trailEffectPrefab != null)
            {
                _particlePools["trail"] = new ObjectPool<ParticleSystem>(
                    createFunc: () => Instantiate(trailEffectPrefab),
                    onGet: (particle) => {
                        particle.gameObject.SetActive(true);
                        particle.Play();
                    },
                    onReturn: (particle) => {
                        particle.Stop();
                        particle.gameObject.SetActive(false);
                    },
                    maxSize: particlePoolSize
                );
                _activeParticles["trail"] = new List<ParticleSystem>();
            }
        }
        
        private void InitializeEffectPools()
        {
            // Initialize effect pools for other visual effects
            // This would include things like screen overlays, UI effects, etc.
        }
        
        public void PlayMatchEffect(Vector3 position, int matchCount, bool isSpecial = false)
        {
            if (!enableEffects) return;
            
            string effectType = isSpecial ? "special" : "match";
            
            if (_particlePools.ContainsKey(effectType))
            {
                var particle = _particlePools[effectType].Get();
                if (particle != null)
                {
                    particle.transform.position = position;
                    _activeParticles[effectType].Add(particle);
                    
                    // Auto-return to pool after duration
                    StartCoroutine(ReturnParticleToPool(particle, effectType, particle.main.duration));
                    
                    OnEffectPlayed?.Invoke(position, EffectType.Match);
                }
            }
            
            // Play screen shake for special matches
            if (isSpecial && enableScreenShake)
            {
                PlayScreenShake(screenShakeIntensity * 1.5f, screenShakeDuration * 1.2f);
            }
        }
        
        public void PlayComboEffect(Vector3 position, int comboCount)
        {
            if (!enableEffects) return;
            
            if (_particlePools.ContainsKey("combo"))
            {
                var particle = _particlePools["combo"].Get();
                if (particle != null)
                {
                    particle.transform.position = position;
                    _activeParticles["combo"].Add(particle);
                    
                    // Scale effect based on combo count
                    float scale = Mathf.Lerp(1f, 2f, Mathf.Clamp01(comboCount / 10f));
                    particle.transform.localScale = Vector3.one * scale;
                    
                    StartCoroutine(ReturnParticleToPool(particle, "combo", particle.main.duration));
                    
                    OnEffectPlayed?.Invoke(position, EffectType.Combo);
                }
            }
            
            // Play screen shake for high combos
            if (comboCount >= 5 && enableScreenShake)
            {
                PlayScreenShake(screenShakeIntensity * 0.8f, screenShakeDuration * 0.8f);
            }
        }
        
        public void PlayExplosionEffect(Vector3 position, float intensity = 1f)
        {
            if (!enableEffects) return;
            
            if (_particlePools.ContainsKey("explosion"))
            {
                var particle = _particlePools["explosion"].Get();
                if (particle != null)
                {
                    particle.transform.position = position;
                    particle.transform.localScale = Vector3.one * intensity;
                    _activeParticles["explosion"].Add(particle);
                    
                    StartCoroutine(ReturnParticleToPool(particle, "explosion", particle.main.duration));
                    
                    OnEffectPlayed?.Invoke(position, EffectType.Explosion);
                }
            }
            
            // Play screen shake for explosions
            if (enableScreenShake)
            {
                PlayScreenShake(screenShakeIntensity * intensity, screenShakeDuration * intensity);
            }
        }
        
        public void PlaySparkleEffect(Vector3 position, int count = 5)
        {
            if (!enableEffects) return;
            
            for (int i = 0; i < count; i++)
            {
                if (_particlePools.ContainsKey("sparkle"))
                {
                    var particle = _particlePools["sparkle"].Get();
                    if (particle != null)
                    {
                        Vector3 offset = UnityEngine.Random.insideUnitSphere * 2f;
                        particle.transform.position = position + offset;
                        _activeParticles["sparkle"].Add(particle);
                        
                        StartCoroutine(ReturnParticleToPool(particle, "sparkle", particle.main.duration));
                    }
                }
            }
            
            OnEffectPlayed?.Invoke(position, EffectType.Sparkle);
        }
        
        public void PlayTrailEffect(Vector3 startPos, Vector3 endPos, float duration = 1f)
        {
            if (!enableEffects) return;
            
            if (_particlePools.ContainsKey("trail"))
            {
                var particle = _particlePools["trail"].Get();
                if (particle != null)
                {
                    particle.transform.position = startPos;
                    _activeParticles["trail"].Add(particle);
                    
                    // Animate trail movement
                    particle.transform.DOMove(endPos, duration).SetEase(Ease.OutQuad);
                    
                    StartCoroutine(ReturnParticleToPool(particle, "trail", duration));
                    
                    OnEffectPlayed?.Invoke(startPos, EffectType.Trail);
                }
            }
        }
        
        public void PlayScreenShake(float intensity = 1f, float duration = 0.3f)
        {
            if (!enableScreenShake || _camera == null) return;
            
            if (_screenShakeCoroutine != null)
            {
                StopCoroutine(_screenShakeCoroutine);
            }
            
            _screenShakeCoroutine = StartCoroutine(ScreenShakeCoroutine(intensity, duration));
        }
        
        private IEnumerator ScreenShakeCoroutine(float intensity, float duration)
        {
            _isScreenShaking = true;
            float elapsed = 0f;
            
            while (elapsed < duration)
            {
                Vector3 randomOffset = UnityEngine.Random.insideUnitSphere * intensity * (1f - elapsed / duration);
                _camera.transform.position = _originalCameraPosition + randomOffset;
                
                elapsed += Time.deltaTime;
                yield return null;
            }
            
            _camera.transform.position = _originalCameraPosition;
            _isScreenShaking = false;
            _screenShakeCoroutine = null;
        }
        
        public void PlayScreenFlash(Color color, float duration = 0.1f)
        {
            if (!enableEffects) return;
            
            if (_flashCoroutine != null)
            {
                StopCoroutine(_flashCoroutine);
            }
            
            _flashCoroutine = StartCoroutine(ScreenFlashCoroutine(color, duration));
        }
        
        private IEnumerator ScreenFlashCoroutine(Color color, float duration)
        {
            // Create flash overlay
            GameObject flashOverlay = new GameObject("ScreenFlash");
            flashOverlay.transform.SetParent(uiCanvas.transform, false);
            
            var rectTransform = flashOverlay.AddComponent<RectTransform>();
            rectTransform.anchorMin = Vector2.zero;
            rectTransform.anchorMax = Vector2.one;
            rectTransform.offsetMin = Vector2.zero;
            rectTransform.offsetMax = Vector2.zero;
            
            var image = flashOverlay.AddComponent<UnityEngine.UI.Image>();
            image.color = new Color(color.r, color.g, color.b, 0f);
            
            // Flash in
            image.DOColor(new Color(color.r, color.g, color.b, color.a), duration * 0.3f).SetEase(Ease.OutQuad);
            yield return new WaitForSeconds(duration * 0.3f);
            
            // Flash out
            image.DOColor(new Color(color.r, color.g, color.b, 0f), duration * 0.7f).SetEase(Ease.InQuad);
            yield return new WaitForSeconds(duration * 0.7f);
            
            Destroy(flashOverlay);
            _flashCoroutine = null;
        }
        
        public void PlayUIShake(Transform uiElement, float intensity = 10f, float duration = 0.2f)
        {
            if (!enableUIEffects || uiElement == null) return;
            
            uiElement.DOShakePosition(duration, intensity, 10, 90, false, true);
        }
        
        public void PlayUIScale(Transform uiElement, float scale = 1.2f, float duration = 0.2f)
        {
            if (!enableUIEffects || uiElement == null) return;
            
            var sequence = DOTween.Sequence();
            sequence.Append(uiElement.DOScale(scale, duration * 0.5f).SetEase(Ease.OutQuad));
            sequence.Append(uiElement.DOScale(1f, duration * 0.5f).SetEase(Ease.InQuad));
        }
        
        public void PlayUIFade(CanvasGroup canvasGroup, float targetAlpha, float duration = 0.3f)
        {
            if (!enableUIEffects || canvasGroup == null) return;
            
            canvasGroup.DOFade(targetAlpha, duration).SetEase(Ease.OutQuad);
        }
        
        public void PlayUISlide(Transform uiElement, Vector3 targetPosition, float duration = 0.3f)
        {
            if (!enableUIEffects || uiElement == null) return;
            
            uiElement.DOLocalMove(targetPosition, duration).SetEase(Ease.OutQuad);
        }
        
        public void PlayUIRotate(Transform uiElement, Vector3 targetRotation, float duration = 0.3f)
        {
            if (!enableUIEffects || uiElement == null) return;
            
            uiElement.DORotate(targetRotation, duration).SetEase(Ease.OutQuad);
        }
        
        public void PlayUIPulse(Transform uiElement, float scale = 1.1f, float duration = 0.5f)
        {
            if (!enableUIEffects || uiElement == null) return;
            
            var sequence = DOTween.Sequence();
            sequence.Append(uiElement.DOScale(scale, duration * 0.5f).SetEase(Ease.OutQuad));
            sequence.Append(uiElement.DOScale(1f, duration * 0.5f).SetEase(Ease.InQuad));
            sequence.SetLoops(-1);
        }
        
        public void StopUIPulse(Transform uiElement)
        {
            if (uiElement == null) return;
            
            uiElement.DOKill();
            uiElement.localScale = Vector3.one;
        }
        
        private IEnumerator ReturnParticleToPool(ParticleSystem particle, string poolType, float delay)
        {
            yield return new WaitForSeconds(delay);
            
            if (particle != null && _particlePools.ContainsKey(poolType))
            {
                _activeParticles[poolType].Remove(particle);
                _particlePools[poolType].Return(particle);
            }
        }
        
        public void SetEffectIntensity(float intensity)
        {
            screenShakeIntensity = intensity;
            uiShakeIntensity = intensity * 10f;
        }
        
        public void SetEffectEnabled(bool enabled)
        {
            enableEffects = enabled;
            enableParticles = enabled;
            enableScreenShake = enabled;
            enableUIEffects = enabled;
        }
        
        public void ClearAllEffects()
        {
            // Stop all active particles
            foreach (var kvp in _activeParticles)
            {
                foreach (var particle in kvp.Value)
                {
                    if (particle != null)
                    {
                        particle.Stop();
                        particle.gameObject.SetActive(false);
                    }
                }
                kvp.Value.Clear();
            }
            
            // Stop screen shake
            if (_screenShakeCoroutine != null)
            {
                StopCoroutine(_screenShakeCoroutine);
                _screenShakeCoroutine = null;
            }
            
            if (_camera != null)
            {
                _camera.transform.position = _originalCameraPosition;
            }
            
            // Stop flash
            if (_flashCoroutine != null)
            {
                StopCoroutine(_flashCoroutine);
                _flashCoroutine = null;
            }
        }
        
        void OnDestroy()
        {
            ClearAllEffects();
            DOTween.KillAll();
        }
    }
    
    public enum EffectType
    {
        Match,
        Combo,
        Special,
        Explosion,
        Sparkle,
        Trail,
        ScreenShake,
        ScreenFlash,
        UIShake,
        UIScale,
        UIFade,
        UISlide,
        UIRotate,
        UIPulse
    }
}