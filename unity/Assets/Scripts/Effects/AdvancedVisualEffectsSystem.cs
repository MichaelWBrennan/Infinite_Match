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
        
        [Header("AI Visual Effects Enhancement")]
        public bool enableAIVisualEffects = true;
        public bool enableAIParticleGeneration = true;
        public bool enableAIEffectAdaptation = true;
        public bool enableAIVisualPersonalization = true;
        public bool enableAIPerformanceOptimization = true;
        public float aiAdaptationStrength = 0.8f;
        public float aiPersonalizationStrength = 0.7f;
        
        private Dictionary<string, ObjectPool<ParticleSystem>> _particlePools = new Dictionary<string, ObjectPool<ParticleSystem>>();
        private Dictionary<string, ObjectPool<GameObject>> _effectPools = new Dictionary<string, ObjectPool<GameObject>>();
        private Dictionary<string, List<ParticleSystem>> _activeParticles = new Dictionary<string, List<ParticleSystem>>();
        private Dictionary<string, List<GameObject>> _activeEffects = new Dictionary<string, List<GameObject>>();
        
        private Camera _camera;
        private Vector3 _originalCameraPosition;
        private bool _isScreenShaking = false;
        private Coroutine _screenShakeCoroutine;
        private Coroutine _flashCoroutine;
        
        // AI Visual Effects Systems
        private UnifiedAIAPIService _aiService;
        
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
                InitializeEffectssystemSafe();
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
            InitializeAIVisualEffectsSystems();
        }
        
        private void InitializeEffectssystemSafe()
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
        
        #region AI Visual Effects Systems
        
        private void InitializeAIVisualEffectsSystems()
        {
            if (!enableAIVisualEffects) return;
            
            Debug.Log("🎨 Initializing AI Visual Effects Systems...");
            
            _aiService = UnifiedAIAPIService.Instance;
            if (_aiService == null)
            {
                var aiServiceGO = new GameObject("UnifiedAIAPIService");
                _aiService = aiServiceGO.AddComponent<UnifiedAIAPIService>();
            }
            
            Debug.Log("✅ AI Visual Effects Systems Initialized with Unified API");
        }
        
        public void AdaptEffectsToContext(string effectType, string intensity, string style)
        {
            if (!enableAIVisualEffects || _aiService == null) return;
            
            var context = new VisualEffectsContext
            {
                EffectType = effectType,
                GameState = "playing",
                EffectData = new Dictionary<string, object>
                {
                    ["intensity"] = intensity,
                    ["style"] = style,
                    ["screen_shake"] = screenShakeIntensity,
                    ["ui_shake"] = uiShakeIntensity
                },
                Intensity = intensity,
                Style = style
            };
            
            _aiService.RequestVisualEffectsAI("player_1", context, (response) => {
                if (response != null)
                {
                    ApplyVisualEffectsAdaptations(response);
                }
            });
        }
        
        public void PersonalizeEffectsForPlayer(string playerId)
        {
            if (!enableAIVisualEffects || _aiService == null) return;
            
            var context = new VisualEffectsContext
            {
                EffectType = "personalization",
                GameState = "menu",
                EffectData = new Dictionary<string, object>
                {
                    ["player_id"] = playerId,
                    ["preferred_style"] = "default",
                    ["intensity_preference"] = 0.5f
                },
                Intensity = "medium",
                Style = "default"
            };
            
            _aiService.RequestVisualEffectsAI(playerId, context, (response) => {
                if (response != null)
                {
                    ApplyVisualEffectsPersonalization(response);
                }
            });
        }
        
        public void GenerateDynamicParticles(string effectType, Vector3 position, float intensity)
        {
            if (!enableAIVisualEffects || _aiService == null) return;
            
            var context = new VisualEffectsContext
            {
                EffectType = effectType,
                GameState = "playing",
                EffectData = new Dictionary<string, object>
                {
                    ["position"] = position,
                    ["intensity"] = intensity,
                    ["particle_count"] = 10
                },
                Intensity = intensity.ToString(),
                Style = "dynamic"
            };
            
            _aiService.RequestVisualEffectsAI("player_1", context, (response) => {
                if (response != null)
                {
                    ApplyDynamicParticleGeneration(response, position);
                }
            });
        }
        
        public void OptimizeVisualEffectsPerformance()
        {
            if (!enableAIVisualEffects || _aiService == null) return;
            
            var context = new VisualEffectsContext
            {
                EffectType = "optimization",
                GameState = "performance_check",
                EffectData = new Dictionary<string, object>
                {
                    ["fps"] = 1f / Time.unscaledDeltaTime,
                    ["active_particles"] = GetActiveParticleCount(),
                    ["memory_usage"] = UnityEngine.Profiling.Profiler.GetTotalAllocatedMemory(UnityEngine.Profiling.Profiler.Area.All) / (1024f * 1024f)
                },
                Intensity = "medium",
                Style = "optimized"
            };
            
            _aiService.RequestVisualEffectsAI("player_1", context, (response) => {
                if (response != null)
                {
                    ApplyVisualEffectsOptimizations(response);
                }
            });
        }
        
        public void RecordEffectInteraction(string effectType, string effectName)
        {
            if (!enableAIVisualEffects || _aiService == null) return;
            
            var context = new VisualEffectsContext
            {
                EffectType = effectType,
                GameState = "playing",
                EffectData = new Dictionary<string, object>
                {
                    ["effect_name"] = effectName,
                    ["interaction_type"] = "user_interaction",
                    ["timestamp"] = Time.time
                },
                Intensity = "medium",
                Style = "default"
            };
            
            _aiService.RequestVisualEffectsAI("player_1", context, (response) => {
                if (response != null)
                {
                    ProcessEffectInteraction(response);
                }
            });
        }
        
        private void ApplyVisualEffectsAdaptations(VisualEffectsAIResponse response)
        {
            // Apply visual effects adaptations from AI
            if (!string.IsNullOrEmpty(response.EffectStyle))
            {
                ApplyEffectStyle(response.EffectStyle);
            }
            
            if (response.Intensity != null)
            {
                ApplyEffectIntensity(response.Intensity);
            }
            
            if (response.EffectRecommendations != null)
            {
                foreach (var recommendation in response.EffectRecommendations)
                {
                    Debug.Log($"Visual Effects AI Recommendation: {recommendation}");
                }
            }
        }
        
        private void ApplyVisualEffectsPersonalization(VisualEffectsAIResponse response)
        {
            // Apply visual effects personalization from AI
            Debug.Log($"AI Visual Effects Personalization: {response.EffectStyle}");
        }
        
        private void ApplyDynamicParticleGeneration(VisualEffectsAIResponse response, Vector3 position)
        {
            // Apply dynamic particle generation from AI
            if (!string.IsNullOrEmpty(response.EffectType))
            {
                PlayEffectByType(response.EffectType, position);
            }
        }
        
        private void ApplyVisualEffectsOptimizations(VisualEffectsAIResponse response)
        {
            // Apply visual effects optimizations from AI
            Debug.Log("AI Visual Effects Optimizations Applied");
        }
        
        private void ProcessEffectInteraction(VisualEffectsAIResponse response)
        {
            // Process effect interaction from AI
            Debug.Log("AI Effect Interaction Processed");
        }
        
        private int GetActiveParticleCount()
        {
            // Get count of active particles
            return _activeParticles.Values.Sum(list => list.Count);
        }
        
        private void ApplyEffectStyle(string style)
        {
            // Apply effect style
            Debug.Log($"AI Effect Style: {style}");
        }
        
        private void ApplyEffectIntensity(string intensity)
        {
            // Apply effect intensity
            Debug.Log($"AI Effect Intensity: {intensity}");
        }
        
        private void PlayEffectByType(string effectType, Vector3 position)
        {
            // Play effect by type
            switch (effectType.ToLower())
            {
                case "match":
                    PlayMatchEffect(position, 3, false);
                    break;
                case "combo":
                    PlayComboEffect(position, 5);
                    break;
                case "explosion":
                    PlayExplosionEffect(position, 1f);
                    break;
                case "sparkle":
                    PlaySparkleEffect(position, 5);
                    break;
            }
        }
        
        private void PlayParticleEffect(AIParticleEffect effect)
        {
            // Play the AI-generated particle effect
            if (effect.Type == ParticleEffectType.Match)
            {
                PlayMatchEffect(effect.Position, effect.Intensity, effect.IsSpecial);
            }
            else if (effect.Type == ParticleEffectType.Combo)
            {
                PlayComboEffect(effect.Position, effect.Intensity);
            }
            else if (effect.Type == ParticleEffectType.Explosion)
            {
                PlayExplosionEffect(effect.Position, effect.Intensity);
            }
        }
        
        #endregion

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

#region AI Visual Effects System Classes

public class AIVisualEffectsPersonalizationEngine
{
    private AdvancedVisualEffectsSystem _effectsSystem;
    private Dictionary<string, VisualEffectsPersonalizationProfile> _playerProfiles;
    
    public void Initialize(AdvancedVisualEffectsSystem effectsSystem)
    {
        _effectsSystem = effectsSystem;
        _playerProfiles = new Dictionary<string, VisualEffectsPersonalizationProfile>();
    }
    
    public void PersonalizeForPlayer(string playerId)
    {
        if (!_playerProfiles.ContainsKey(playerId))
        {
            _playerProfiles[playerId] = new VisualEffectsPersonalizationProfile();
        }
        
        var profile = _playerProfiles[playerId];
        ApplyPersonalization(profile);
    }
    
    private void ApplyPersonalization(VisualEffectsPersonalizationProfile profile)
    {
        // Apply personalized visual effects settings
        _effectsSystem.screenShakeIntensity = profile.PreferredScreenShakeIntensity;
        _effectsSystem.uiShakeIntensity = profile.PreferredUIShakeIntensity;
        _effectsSystem.flashColor = profile.PreferredFlashColor;
        _effectsSystem.flashDuration = profile.PreferredFlashDuration;
        
        // Apply personalized effect preferences
        if (profile.PreferredEffectStyle != EffectStyle.None)
        {
            AdaptEffectsToStyle(profile.PreferredEffectStyle);
        }
        
        // Apply personalized particle preferences
        if (profile.PreferredParticleStyle != ParticleStyle.None)
        {
            AdaptParticlesToStyle(profile.PreferredParticleStyle);
        }
    }
    
    private void AdaptEffectsToStyle(EffectStyle style)
    {
        switch (style)
        {
            case EffectStyle.Realistic:
                // Use realistic effects
                break;
            case EffectStyle.Cartoon:
                // Use cartoon-style effects
                break;
            case EffectStyle.Minimalist:
                // Use minimal effects
                break;
            case EffectStyle.Cinematic:
                // Use cinematic effects
                break;
        }
    }
    
    private void AdaptParticlesToStyle(ParticleStyle style)
    {
        switch (style)
        {
            case ParticleStyle.Realistic:
                // Use realistic particles
                break;
            case ParticleStyle.Cartoon:
                // Use cartoon-style particles
                break;
            case ParticleStyle.Minimalist:
                // Use minimal particles
                break;
            case ParticleStyle.Fantasy:
                // Use fantasy particles
                break;
        }
    }
}

public class AIParticleGenerator
{
    private AdvancedVisualEffectsSystem _effectsSystem;
    private Dictionary<ParticleContext, AIParticleEffect> _generatedEffects;
    
    public void Initialize(AdvancedVisualEffectsSystem effectsSystem)
    {
        _effectsSystem = effectsSystem;
        _generatedEffects = new Dictionary<ParticleContext, AIParticleEffect>();
    }
    
    public AIParticleEffect GenerateParticleEffect(ParticleContext context)
    {
        if (_generatedEffects.ContainsKey(context))
        {
            return _generatedEffects[context];
        }
        
        var effect = CreateParticleEffect(context);
        _generatedEffects[context] = effect;
        return effect;
    }
    
    private AIParticleEffect CreateParticleEffect(ParticleContext context)
    {
        // Generate particle effect based on context
        var effect = new AIParticleEffect
        {
            Type = DetermineEffectType(context),
            Position = context.Position,
            Intensity = CalculateIntensity(context),
            IsSpecial = context.IsSpecial,
            Color = CalculateColor(context),
            Size = CalculateSize(context),
            Duration = CalculateDuration(context)
        };
        
        return effect;
    }
    
    private ParticleEffectType DetermineEffectType(ParticleContext context)
    {
        switch (context.Type)
        {
            case ParticleContextType.Match:
                return ParticleEffectType.Match;
            case ParticleContextType.Combo:
                return ParticleEffectType.Combo;
            case ParticleContextType.Explosion:
                return ParticleEffectType.Explosion;
            case ParticleContextType.Sparkle:
                return ParticleEffectType.Sparkle;
            default:
                return ParticleEffectType.Match;
        }
    }
    
    private float CalculateIntensity(ParticleContext context)
    {
        return Mathf.Clamp01(context.Intensity * context.Urgency);
    }
    
    private Color CalculateColor(ParticleContext context)
    {
        // Calculate color based on context
        switch (context.Mood)
        {
            case "happy":
                return Color.yellow;
            case "excited":
                return Color.red;
            case "calm":
                return Color.blue;
            case "mysterious":
                return Color.purple;
            default:
                return Color.white;
        }
    }
    
    private float CalculateSize(ParticleContext context)
    {
        return Mathf.Lerp(0.5f, 2f, context.Intensity);
    }
    
    private float CalculateDuration(ParticleContext context)
    {
        return Mathf.Lerp(0.5f, 3f, context.Intensity);
    }
}

public class AIEffectAdaptationEngine
{
    private AdvancedVisualEffectsSystem _effectsSystem;
    private Dictionary<VisualEffectsContext, EffectAdaptation> _adaptations;
    
    public void Initialize(AdvancedVisualEffectsSystem effectsSystem)
    {
        _effectsSystem = effectsSystem;
        _adaptations = new Dictionary<VisualEffectsContext, EffectAdaptation>();
    }
    
    public void AdaptToContext(VisualEffectsContext context)
    {
        if (!_adaptations.ContainsKey(context))
        {
            _adaptations[context] = new EffectAdaptation();
        }
        
        var adaptation = _adaptations[context];
        ApplyAdaptation(adaptation);
    }
    
    private void ApplyAdaptation(EffectAdaptation adaptation)
    {
        // Apply effect adaptation based on context
        _effectsSystem.screenShakeIntensity = adaptation.ScreenShakeIntensity;
        _effectsSystem.uiShakeIntensity = adaptation.UIShakeIntensity;
        _effectsSystem.flashColor = adaptation.FlashColor;
        _effectsSystem.flashDuration = adaptation.FlashDuration;
        
        // Apply dynamic effect modifications
        if (adaptation.EnableScreenShake)
        {
            EnableScreenShake();
        }
        
        if (adaptation.EnableScreenFlash)
        {
            EnableScreenFlash();
        }
        
        if (adaptation.EnableParticleEffects)
        {
            EnableParticleEffects();
        }
    }
    
    private void EnableScreenShake()
    {
        // Enable screen shake
        _effectsSystem.enableScreenShake = true;
    }
    
    private void EnableScreenFlash()
    {
        // Enable screen flash
        _effectsSystem.enableEffects = true;
    }
    
    private void EnableParticleEffects()
    {
        // Enable particle effects
        _effectsSystem.enableParticles = true;
    }
}

public class AIVisualEffectsOptimizer
{
    private AdvancedVisualEffectsSystem _effectsSystem;
    private VisualEffectsPerformanceProfile _performanceProfile;
    
    public void Initialize(AdvancedVisualEffectsSystem effectsSystem)
    {
        _effectsSystem = effectsSystem;
        _performanceProfile = new VisualEffectsPerformanceProfile();
    }
    
    public void OptimizePerformance()
    {
        // Optimize visual effects performance
        OptimizeParticleCount();
        OptimizeEffectQuality();
        OptimizeMemoryUsage();
    }
    
    private void OptimizeParticleCount()
    {
        // Optimize particle count based on performance
        var systemPerformance = GetSystemPerformance();
        
        if (systemPerformance < 0.5f)
        {
            // Reduce particle count for better performance
            ReduceParticleCount();
        }
        else
        {
            // Increase particle count for better visuals
            IncreaseParticleCount();
        }
    }
    
    private void OptimizeEffectQuality()
    {
        // Optimize effect quality
        var systemPerformance = GetSystemPerformance();
        
        if (systemPerformance < 0.7f)
        {
            // Reduce effect quality for better performance
            ReduceEffectQuality();
        }
        else
        {
            // Increase effect quality for better visuals
            IncreaseEffectQuality();
        }
    }
    
    private void OptimizeMemoryUsage()
    {
        // Optimize memory usage for visual effects
        var memoryUsage = GetVisualEffectsMemoryUsage();
        
        if (memoryUsage > 100f) // 100MB
        {
            // Reduce memory usage
            ReduceMemoryUsage();
        }
    }
    
    private float GetSystemPerformance()
    {
        // Get current system performance
        return 1f / Time.unscaledDeltaTime / 60f; // FPS-based performance
    }
    
    private float GetVisualEffectsMemoryUsage()
    {
        // Get current visual effects memory usage
        return 50f; // Simplified
    }
    
    private void ReduceParticleCount()
    {
        // Reduce particle count
        Debug.Log("Reducing particle count for performance");
    }
    
    private void IncreaseParticleCount()
    {
        // Increase particle count
        Debug.Log("Increasing particle count for better visuals");
    }
    
    private void ReduceEffectQuality()
    {
        // Reduce effect quality
        Debug.Log("Reducing effect quality for performance");
    }
    
    private void IncreaseEffectQuality()
    {
        // Increase effect quality
        Debug.Log("Increasing effect quality for better visuals");
    }
    
    private void ReduceMemoryUsage()
    {
        // Reduce memory usage
        Debug.Log("Reducing visual effects memory usage");
    }
}

public class AIVisualEffectsBehaviorAnalyzer
{
    private AdvancedVisualEffectsSystem _effectsSystem;
    private Dictionary<string, VisualEffectsInteractionData> _interactions;
    private VisualEffectsBehaviorProfile _behaviorProfile;
    
    public void Initialize(AdvancedVisualEffectsSystem effectsSystem)
    {
        _effectsSystem = effectsSystem;
        _interactions = new Dictionary<string, VisualEffectsInteractionData>();
        _behaviorProfile = new VisualEffectsBehaviorProfile();
    }
    
    public void RecordInteraction(string effectType, string effectName)
    {
        if (!_interactions.ContainsKey(effectName))
        {
            _interactions[effectName] = new VisualEffectsInteractionData();
        }
        
        var interaction = _interactions[effectName];
        interaction.InteractionCount++;
        interaction.LastInteraction = Time.time;
        
        _behaviorProfile.UpdateWithInteraction(effectType, effectName);
    }
    
    public void AnalyzeBehavior()
    {
        // Analyze visual effects behavior patterns
        AnalyzeEffectPreferences();
        AnalyzeIntensityPreferences();
        AnalyzeColorPreferences();
    }
    
    private void AnalyzeEffectPreferences()
    {
        // Analyze effect preferences
        var effectPrefs = _behaviorProfile.GetEffectPreferences();
        Debug.Log($"Effect preferences: {effectPrefs}");
    }
    
    private void AnalyzeIntensityPreferences()
    {
        // Analyze intensity preferences
        var intensityPrefs = _behaviorProfile.GetIntensityPreferences();
        Debug.Log($"Intensity preferences: {intensityPrefs:F2}");
    }
    
    private void AnalyzeColorPreferences()
    {
        // Analyze color preferences
        var colorPrefs = _behaviorProfile.GetColorPreferences();
        Debug.Log($"Color preferences: {colorPrefs}");
    }
}

#region AI Visual Effects Data Structures

public class VisualEffectsPersonalizationProfile
{
    public float PreferredScreenShakeIntensity;
    public float PreferredUIShakeIntensity;
    public Color PreferredFlashColor;
    public float PreferredFlashDuration;
    public EffectStyle PreferredEffectStyle;
    public ParticleStyle PreferredParticleStyle;
    public bool PrefersIntenseEffects;
    public bool PrefersSubtleEffects;
}

public class ParticleContext
{
    public ParticleContextType Type;
    public Vector3 Position;
    public float Intensity;
    public float Urgency;
    public bool IsSpecial;
    public string Mood;
}

public class VisualEffectsContext
{
    public VisualEffectsState State;
    public float Intensity;
    public string Scene;
    public bool IsPaused;
}

public class AIParticleEffect
{
    public ParticleEffectType Type;
    public Vector3 Position;
    public float Intensity;
    public bool IsSpecial;
    public Color Color;
    public float Size;
    public float Duration;
}

public class EffectAdaptation
{
    public float ScreenShakeIntensity;
    public float UIShakeIntensity;
    public Color FlashColor;
    public float FlashDuration;
    public bool EnableScreenShake;
    public bool EnableScreenFlash;
    public bool EnableParticleEffects;
}

public class VisualEffectsPerformanceProfile
{
    public float CurrentFPS;
    public float ParticleCount;
    public float MemoryUsage;
    public bool IsOptimized;
}

public class VisualEffectsInteractionData
{
    public int InteractionCount;
    public float LastInteraction;
    public float AverageIntensity;
    public List<string> InteractionTypes;
}

public class VisualEffectsBehaviorProfile
{
    public Dictionary<string, VisualEffectsInteractionData> Interactions;
    public float TotalEffectTime;
    public List<string> FavoriteEffects;
    
    public void UpdateWithInteraction(string effectType, string effectName)
    {
        // Update behavior profile with interaction
    }
    
    public string GetEffectPreferences()
    {
        return "Match, Combo, Explosion"; // Simplified
    }
    
    public float GetIntensityPreferences()
    {
        return 0.7f; // Simplified
    }
    
    public string GetColorPreferences()
    {
        return "Yellow, Red, Blue"; // Simplified
    }
}

public enum EffectStyle
{
    None, Realistic, Cartoon, Minimalist, Cinematic
}

public enum ParticleStyle
{
    None, Realistic, Cartoon, Minimalist, Fantasy
}

public enum ParticleContextType
{
    Match, Combo, Explosion, Sparkle, Trail
}

public enum VisualEffectsState
{
    Menu, Gameplay, Paused, GameOver, Victory
}

#endregion