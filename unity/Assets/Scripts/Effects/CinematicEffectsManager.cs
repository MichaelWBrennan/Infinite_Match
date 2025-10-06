using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using DG.Tweening;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace Evergreen.Effects
{
    /// <summary>
    /// Cinematic Effects Manager for premium visual quality
    /// Implements industry-leading visual effects for maximum player engagement
    /// </summary>
    public class CinematicEffectsManager : MonoBehaviour
    {
        [Header("Post-Processing Effects")]
        [SerializeField] private Volume postProcessVolume;
        [SerializeField] private bool enableBloom = true;
        [SerializeField] private bool enableChromaticAberration = true;
        [SerializeField] private bool enableVignette = true;
        [SerializeField] private bool enableColorGrading = true;
        
        [Header("Particle Systems")]
        [SerializeField] private ParticleSystem matchEffect;
        [SerializeField] private ParticleSystem comboEffect;
        [SerializeField] private ParticleSystem levelCompleteEffect;
        [SerializeField] private ParticleSystem coinCollectEffect;
        [SerializeField] private ParticleSystem gemCollectEffect;
        [SerializeField] private ParticleSystem specialPieceEffect;
        [SerializeField] private ParticleSystem screenTransitionEffect;
        
        [Header("Screen Effects")]
        [SerializeField] private GameObject screenFlash;
        [SerializeField] private GameObject screenShake;
        [SerializeField] private GameObject screenRipple;
        [SerializeField] private GameObject screenGlow;
        
        [Header("Lighting Effects")]
        [SerializeField] private Light mainLight;
        [SerializeField] private Light[] accentLights;
        [SerializeField] private bool enableDynamicLighting = true;
        [SerializeField] private bool enableLightFlares = true;
        
        [Header("Camera Effects")]
        [SerializeField] private Camera mainCamera;
        [SerializeField] private bool enableCameraShake = true;
        [SerializeField] private bool enableCameraZoom = true;
        [SerializeField] private bool enableCameraTilt = true;
        
        [Header("Quality Settings")]
        [SerializeField] private int maxParticles = 1000;
        [SerializeField] private float effectIntensity = 1.0f;
        [SerializeField] private bool enableHighQualityEffects = true;
        [SerializeField] private bool enableMobileOptimization = false;
        
        private Dictionary<string, ParticleSystem> _particleSystems = new Dictionary<string, ParticleSystem>();
        private Dictionary<string, Tween> _activeTweens = new Dictionary<string, Tween>();
        private Queue<EffectRequest> _effectQueue = new Queue<EffectRequest>();
        private bool _isProcessingEffects = false;
        
        public static CinematicEffectsManager Instance { get; private set; }
        
        [System.Serializable]
        public class EffectRequest
        {
            public string effectName;
            public Vector3 position;
            public float duration;
            public System.Action onComplete;
            public object[] parameters;
        }
        
        public enum EffectType
        {
            Match,
            Combo,
            LevelComplete,
            CoinCollect,
            GemCollect,
            SpecialPiece,
            ScreenFlash,
            ScreenShake,
            ScreenRipple,
            ScreenGlow,
            CameraShake,
            CameraZoom,
            CameraTilt,
            LightFlash,
            LightFade,
            ParticleBurst,
            ParticleTrail,
            ParticleExplosion
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeCinematicEffects();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            SetupPostProcessing();
            SetupParticleSystems();
            SetupScreenEffects();
            SetupLightingEffects();
            SetupCameraEffects();
            StartCoroutine(ProcessEffectQueue());
        }
        
        private void InitializeCinematicEffects()
        {
            // Setup post-processing volume
            if (postProcessVolume == null)
            {
                postProcessVolume = FindObjectOfType<Volume>();
                if (postProcessVolume == null)
                {
                    GameObject volumeObj = new GameObject("PostProcessVolume");
                    postProcessVolume = volumeObj.AddComponent<Volume>();
                    postProcessVolume.priority = 1;
                }
            }
            
            // Setup main camera
            if (mainCamera == null)
            {
                mainCamera = Camera.main;
                if (mainCamera == null)
                {
                    mainCamera = FindObjectOfType<Camera>();
                }
            }
            
            // Setup main light
            if (mainLight == null)
            {
                mainLight = FindObjectOfType<Light>();
            }
        }
        
        private void SetupPostProcessing()
        {
            if (postProcessVolume == null) return;
            
            // Create post-processing profile
            var profile = ScriptableObject.CreateInstance<VolumeProfile>();
            postProcessVolume.profile = profile;
            
            // Add Bloom effect
            if (enableBloom)
            {
                var bloom = profile.Add<Bloom>();
                bloom.intensity.value = 0.5f;
                bloom.threshold.value = 1.0f;
                bloom.scatter.value = 0.7f;
            }
            
            // Add Chromatic Aberration
            if (enableChromaticAberration)
            {
                var chromaticAberration = profile.Add<ChromaticAberration>();
                chromaticAberration.intensity.value = 0.1f;
            }
            
            // Add Vignette
            if (enableVignette)
            {
                var vignette = profile.Add<Vignette>();
                vignette.intensity.value = 0.3f;
                vignette.smoothness.value = 0.4f;
            }
            
            // Add Color Grading
            if (enableColorGrading)
            {
                var colorGrading = profile.Add<ColorAdjustments>();
                colorGrading.postExposure.value = 0.0f;
                colorGrading.contrast.value = 0.0f;
                colorGrading.saturation.value = 0.0f;
            }
        }
        
        private void SetupParticleSystems()
        {
            // Create match effect
            if (matchEffect == null)
            {
                matchEffect = CreateParticleSystem("MatchEffect", new Vector3(0, 0, 0));
                SetupMatchEffect();
            }
            
            // Create combo effect
            if (comboEffect == null)
            {
                comboEffect = CreateParticleSystem("ComboEffect", new Vector3(0, 0, 0));
                SetupComboEffect();
            }
            
            // Create level complete effect
            if (levelCompleteEffect == null)
            {
                levelCompleteEffect = CreateParticleSystem("LevelCompleteEffect", new Vector3(0, 0, 0));
                SetupLevelCompleteEffect();
            }
            
            // Create coin collect effect
            if (coinCollectEffect == null)
            {
                coinCollectEffect = CreateParticleSystem("CoinCollectEffect", new Vector3(0, 0, 0));
                SetupCoinCollectEffect();
            }
            
            // Create gem collect effect
            if (gemCollectEffect == null)
            {
                gemCollectEffect = CreateParticleSystem("GemCollectEffect", new Vector3(0, 0, 0));
                SetupGemCollectEffect();
            }
            
            // Create special piece effect
            if (specialPieceEffect == null)
            {
                specialPieceEffect = CreateParticleSystem("SpecialPieceEffect", new Vector3(0, 0, 0));
                SetupSpecialPieceEffect();
            }
            
            // Create screen transition effect
            if (screenTransitionEffect == null)
            {
                screenTransitionEffect = CreateParticleSystem("ScreenTransitionEffect", new Vector3(0, 0, 0));
                SetupScreenTransitionEffect();
            }
            
            // Register particle systems
            _particleSystems["MatchEffect"] = matchEffect;
            _particleSystems["ComboEffect"] = comboEffect;
            _particleSystems["LevelCompleteEffect"] = levelCompleteEffect;
            _particleSystems["CoinCollectEffect"] = coinCollectEffect;
            _particleSystems["GemCollectEffect"] = gemCollectEffect;
            _particleSystems["SpecialPieceEffect"] = specialPieceEffect;
            _particleSystems["ScreenTransitionEffect"] = screenTransitionEffect;
        }
        
        private ParticleSystem CreateParticleSystem(string name, Vector3 position)
        {
            GameObject particleObj = new GameObject(name);
            particleObj.transform.SetParent(transform);
            particleObj.transform.position = position;
            
            ParticleSystem particleSystem = particleObj.AddComponent<ParticleSystem>();
            return particleSystem;
        }
        
        private void SetupMatchEffect()
        {
            var main = matchEffect.main;
            main.startLifetime = 1.0f;
            main.startSpeed = 5.0f;
            main.startSize = 0.2f;
            main.startColor = Color.yellow;
            main.maxParticles = 50;
            
            var emission = matchEffect.emission;
            emission.rateOverTime = 0;
            emission.SetBursts(new ParticleSystem.Burst[] { new ParticleSystem.Burst(0.0f, 20) });
            
            var shape = matchEffect.shape;
            shape.shapeType = ParticleSystemShapeType.Circle;
            shape.radius = 0.5f;
            
            var velocityOverLifetime = matchEffect.velocityOverLifetime;
            velocityOverLifetime.enabled = true;
            velocityOverLifetime.space = ParticleSystemSimulationSpace.Local;
            velocityOverLifetime.radial = new ParticleSystem.MinMaxCurve(3.0f);
            
            var sizeOverLifetime = matchEffect.sizeOverLifetime;
            sizeOverLifetime.enabled = true;
            sizeOverLifetime.size = new ParticleSystem.MinMaxCurve(1.0f, new AnimationCurve(
                new Keyframe(0.0f, 0.0f),
                new Keyframe(0.3f, 1.0f),
                new Keyframe(1.0f, 0.0f)
            ));
        }
        
        private void SetupComboEffect()
        {
            var main = comboEffect.main;
            main.startLifetime = 2.0f;
            main.startSpeed = 8.0f;
            main.startSize = 0.3f;
            main.startColor = Color.cyan;
            main.maxParticles = 100;
            
            var emission = comboEffect.emission;
            emission.rateOverTime = 0;
            emission.SetBursts(new ParticleSystem.Burst[] { new ParticleSystem.Burst(0.0f, 30) });
            
            var shape = comboEffect.shape;
            shape.shapeType = ParticleSystemShapeType.Circle;
            shape.radius = 1.0f;
            
            var velocityOverLifetime = comboEffect.velocityOverLifetime;
            velocityOverLifetime.enabled = true;
            velocityOverLifetime.space = ParticleSystemSimulationSpace.Local;
            velocityOverLifetime.radial = new ParticleSystem.MinMaxCurve(5.0f);
            
            var sizeOverLifetime = comboEffect.sizeOverLifetime;
            sizeOverLifetime.enabled = true;
            sizeOverLifetime.size = new ParticleSystem.MinMaxCurve(1.0f, new AnimationCurve(
                new Keyframe(0.0f, 0.0f),
                new Keyframe(0.5f, 1.0f),
                new Keyframe(1.0f, 0.0f)
            ));
        }
        
        private void SetupLevelCompleteEffect()
        {
            var main = levelCompleteEffect.main;
            main.startLifetime = 3.0f;
            main.startSpeed = 10.0f;
            main.startSize = 0.4f;
            main.startColor = Color.green;
            main.maxParticles = 200;
            
            var emission = levelCompleteEffect.emission;
            emission.rateOverTime = 0;
            emission.SetBursts(new ParticleSystem.Burst[] { new ParticleSystem.Burst(0.0f, 100) });
            
            var shape = levelCompleteEffect.shape;
            shape.shapeType = ParticleSystemShapeType.Cone;
            shape.angle = 45.0f;
            shape.radius = 0.1f;
        }
        
        private void SetupCoinCollectEffect()
        {
            var main = coinCollectEffect.main;
            main.startLifetime = 1.5f;
            main.startSpeed = 3.0f;
            main.startSize = 0.1f;
            main.startColor = Color.yellow;
            main.maxParticles = 30;
            
            var emission = coinCollectEffect.emission;
            emission.rateOverTime = 0;
            emission.SetBursts(new ParticleSystem.Burst[] { new ParticleSystem.Burst(0.0f, 10) });
            
            var shape = coinCollectEffect.shape;
            shape.shapeType = ParticleSystemShapeType.Circle;
            shape.radius = 0.2f;
        }
        
        private void SetupGemCollectEffect()
        {
            var main = gemCollectEffect.main;
            main.startLifetime = 2.0f;
            main.startSpeed = 4.0f;
            main.startSize = 0.15f;
            main.startColor = Color.magenta;
            main.maxParticles = 40;
            
            var emission = gemCollectEffect.emission;
            emission.rateOverTime = 0;
            emission.SetBursts(new ParticleSystem.Burst[] { new ParticleSystem.Burst(0.0f, 15) });
            
            var shape = gemCollectEffect.shape;
            shape.shapeType = ParticleSystemShapeType.Circle;
            shape.radius = 0.3f;
        }
        
        private void SetupSpecialPieceEffect()
        {
            var main = specialPieceEffect.main;
            main.startLifetime = 2.5f;
            main.startSpeed = 6.0f;
            main.startSize = 0.25f;
            main.startColor = Color.red;
            main.maxParticles = 60;
            
            var emission = specialPieceEffect.emission;
            emission.rateOverTime = 0;
            emission.SetBursts(new ParticleSystem.Burst[] { new ParticleSystem.Burst(0.0f, 25) });
            
            var shape = specialPieceEffect.shape;
            shape.shapeType = ParticleSystemShapeType.Circle;
            shape.radius = 0.4f;
        }
        
        private void SetupScreenTransitionEffect()
        {
            var main = screenTransitionEffect.main;
            main.startLifetime = 1.0f;
            main.startSpeed = 0.0f;
            main.startSize = 0.5f;
            main.startColor = Color.white;
            main.maxParticles = 1;
            
            var emission = screenTransitionEffect.emission;
            emission.rateOverTime = 0;
            emission.SetBursts(new ParticleSystem.Burst[] { new ParticleSystem.Burst(0.0f, 1) });
            
            var shape = screenTransitionEffect.shape;
            shape.shapeType = ParticleSystemShapeType.Circle;
            shape.radius = 10.0f;
        }
        
        private void SetupScreenEffects()
        {
            // Create screen flash effect
            if (screenFlash == null)
            {
                screenFlash = new GameObject("ScreenFlash");
                screenFlash.transform.SetParent(transform);
                
                Canvas canvas = screenFlash.AddComponent<Canvas>();
                canvas.renderMode = RenderMode.ScreenSpaceOverlay;
                canvas.sortingOrder = 1000;
                
                Image flashImage = screenFlash.AddComponent<Image>();
                flashImage.color = new Color(1, 1, 1, 0);
                flashImage.raycastTarget = false;
                
                RectTransform flashRect = screenFlash.GetComponent<RectTransform>();
                flashRect.anchorMin = Vector2.zero;
                flashRect.anchorMax = Vector2.one;
                flashRect.offsetMin = Vector2.zero;
                flashRect.offsetMax = Vector2.zero;
                
                screenFlash.SetActive(false);
            }
            
            // Create screen shake effect
            if (screenShake == null)
            {
                screenShake = new GameObject("ScreenShake");
                screenShake.transform.SetParent(transform);
                screenShake.SetActive(false);
            }
            
            // Create screen ripple effect
            if (screenRipple == null)
            {
                screenRipple = new GameObject("ScreenRipple");
                screenRipple.transform.SetParent(transform);
                
                Canvas canvas = screenRipple.AddComponent<Canvas>();
                canvas.renderMode = RenderMode.ScreenSpaceOverlay;
                canvas.sortingOrder = 999;
                
                Image rippleImage = screenRipple.AddComponent<Image>();
                rippleImage.color = new Color(0, 0.5f, 1, 0.3f);
                rippleImage.raycastTarget = false;
                
                RectTransform rippleRect = screenRipple.GetComponent<RectTransform>();
                rippleRect.anchorMin = Vector2.zero;
                rippleRect.anchorMax = Vector2.one;
                rippleRect.offsetMin = Vector2.zero;
                rippleRect.offsetMax = Vector2.zero;
                
                screenRipple.SetActive(false);
            }
            
            // Create screen glow effect
            if (screenGlow == null)
            {
                screenGlow = new GameObject("ScreenGlow");
                screenGlow.transform.SetParent(transform);
                
                Canvas canvas = screenGlow.AddComponent<Canvas>();
                canvas.renderMode = RenderMode.ScreenSpaceOverlay;
                canvas.sortingOrder = 998;
                
                Image glowImage = screenGlow.AddComponent<Image>();
                glowImage.color = new Color(1, 1, 0, 0.2f);
                glowImage.raycastTarget = false;
                
                RectTransform glowRect = screenGlow.GetComponent<RectTransform>();
                glowRect.anchorMin = Vector2.zero;
                glowRect.anchorMax = Vector2.one;
                glowRect.offsetMin = Vector2.zero;
                glowRect.offsetMax = Vector2.zero;
                
                screenGlow.SetActive(false);
            }
        }
        
        private void SetupLightingEffects()
        {
            if (mainLight == null) return;
            
            // Setup main light
            mainLight.type = LightType.Directional;
            mainLight.intensity = 1.0f;
            mainLight.color = Color.white;
            
            // Create accent lights
            if (accentLights == null || accentLights.Length == 0)
            {
                accentLights = new Light[3];
                for (int i = 0; i < accentLights.Length; i++)
                {
                    GameObject lightObj = new GameObject($"AccentLight_{i}");
                    lightObj.transform.SetParent(transform);
                    accentLights[i] = lightObj.AddComponent<Light>();
                    accentLights[i].type = LightType.Point;
                    accentLights[i].intensity = 0.5f;
                    accentLights[i].range = 10.0f;
                    accentLights[i].color = new Color(1, 0.5f, 0, 1);
                    accentLights[i].enabled = false;
                }
            }
        }
        
        private void SetupCameraEffects()
        {
            if (mainCamera == null) return;
            
            // Setup camera for effects
            mainCamera.allowHDR = enableHighQualityEffects;
            mainCamera.allowMSAA = enableHighQualityEffects;
        }
        
        /// <summary>
        /// Play a cinematic effect
        /// </summary>
        public void PlayEffect(EffectType effectType, Vector3 position, float duration = 1.0f, System.Action onComplete = null)
        {
            if (!_isProcessingEffects)
            {
                _isProcessingEffects = true;
                ProcessEffect(effectType, position, duration, onComplete);
            }
            else
            {
                _effectQueue.Enqueue(new EffectRequest
                {
                    effectName = effectType.ToString(),
                    position = position,
                    duration = duration,
                    onComplete = onComplete
                });
            }
        }
        
        private void ProcessEffect(EffectType effectType, Vector3 position, float duration, System.Action onComplete)
        {
            switch (effectType)
            {
                case EffectType.Match:
                    PlayMatchEffect(position);
                    break;
                case EffectType.Combo:
                    PlayComboEffect(position);
                    break;
                case EffectType.LevelComplete:
                    PlayLevelCompleteEffect(position);
                    break;
                case EffectType.CoinCollect:
                    PlayCoinCollectEffect(position);
                    break;
                case EffectType.GemCollect:
                    PlayGemCollectEffect(position);
                    break;
                case EffectType.SpecialPiece:
                    PlaySpecialPieceEffect(position);
                    break;
                case EffectType.ScreenFlash:
                    PlayScreenFlash(duration);
                    break;
                case EffectType.ScreenShake:
                    PlayScreenShake(duration);
                    break;
                case EffectType.ScreenRipple:
                    PlayScreenRipple(position, duration);
                    break;
                case EffectType.ScreenGlow:
                    PlayScreenGlow(duration);
                    break;
                case EffectType.CameraShake:
                    PlayCameraShake(duration);
                    break;
                case EffectType.CameraZoom:
                    PlayCameraZoom(duration);
                    break;
                case EffectType.CameraTilt:
                    PlayCameraTilt(duration);
                    break;
                case EffectType.LightFlash:
                    PlayLightFlash(duration);
                    break;
                case EffectType.LightFade:
                    PlayLightFade(duration);
                    break;
            }
            
            if (onComplete != null)
            {
                StartCoroutine(InvokeAfterDelay(onComplete, duration));
            }
            
            _isProcessingEffects = false;
        }
        
        private void PlayMatchEffect(Vector3 position)
        {
            if (matchEffect != null)
            {
                matchEffect.transform.position = position;
                matchEffect.Play();
            }
        }
        
        private void PlayComboEffect(Vector3 position)
        {
            if (comboEffect != null)
            {
                comboEffect.transform.position = position;
                comboEffect.Play();
            }
        }
        
        private void PlayLevelCompleteEffect(Vector3 position)
        {
            if (levelCompleteEffect != null)
            {
                levelCompleteEffect.transform.position = position;
                levelCompleteEffect.Play();
            }
        }
        
        private void PlayCoinCollectEffect(Vector3 position)
        {
            if (coinCollectEffect != null)
            {
                coinCollectEffect.transform.position = position;
                coinCollectEffect.Play();
            }
        }
        
        private void PlayGemCollectEffect(Vector3 position)
        {
            if (gemCollectEffect != null)
            {
                gemCollectEffect.transform.position = position;
                gemCollectEffect.Play();
            }
        }
        
        private void PlaySpecialPieceEffect(Vector3 position)
        {
            if (specialPieceEffect != null)
            {
                specialPieceEffect.transform.position = position;
                specialPieceEffect.Play();
            }
        }
        
        private void PlayScreenFlash(float duration)
        {
            if (screenFlash != null)
            {
                screenFlash.SetActive(true);
                Image flashImage = screenFlash.GetComponent<Image>();
                flashImage.color = new Color(1, 1, 1, 0);
                
                flashImage.DOColor(new Color(1, 1, 1, 0.8f), duration * 0.1f).OnComplete(() => {
                    flashImage.DOColor(new Color(1, 1, 1, 0), duration * 0.9f).OnComplete(() => {
                        screenFlash.SetActive(false);
                    });
                });
            }
        }
        
        private void PlayScreenShake(float duration)
        {
            if (screenShake != null && enableCameraShake)
            {
                screenShake.SetActive(true);
                screenShake.transform.DOShakePosition(duration, 10f, 10, 90, false, true).OnComplete(() => {
                    screenShake.SetActive(false);
                });
            }
        }
        
        private void PlayScreenRipple(Vector3 position, float duration)
        {
            if (screenRipple != null)
            {
                screenRipple.SetActive(true);
                screenRipple.transform.position = position;
                
                RectTransform rippleRect = screenRipple.GetComponent<RectTransform>();
                rippleRect.localScale = Vector3.zero;
                
                rippleRect.DOScale(Vector3.one * 2f, duration).OnComplete(() => {
                    screenRipple.SetActive(false);
                });
            }
        }
        
        private void PlayScreenGlow(float duration)
        {
            if (screenGlow != null)
            {
                screenGlow.SetActive(true);
                Image glowImage = screenGlow.GetComponent<Image>();
                glowImage.color = new Color(1, 1, 0, 0);
                
                glowImage.DOColor(new Color(1, 1, 0, 0.3f), duration * 0.5f).OnComplete(() => {
                    glowImage.DOColor(new Color(1, 1, 0, 0), duration * 0.5f).OnComplete(() => {
                        screenGlow.SetActive(false);
                    });
                });
            }
        }
        
        private void PlayCameraShake(float duration)
        {
            if (mainCamera != null && enableCameraShake)
            {
                mainCamera.transform.DOShakePosition(duration, 0.5f, 10, 90, false, true);
            }
        }
        
        private void PlayCameraZoom(float duration)
        {
            if (mainCamera != null && enableCameraZoom)
            {
                float originalSize = mainCamera.orthographicSize;
                mainCamera.DOOrthoSize(originalSize * 0.8f, duration * 0.5f).OnComplete(() => {
                    mainCamera.DOOrthoSize(originalSize, duration * 0.5f);
                });
            }
        }
        
        private void PlayCameraTilt(float duration)
        {
            if (mainCamera != null && enableCameraTilt)
            {
                mainCamera.transform.DORotate(new Vector3(0, 0, 5f), duration * 0.5f).OnComplete(() => {
                    mainCamera.transform.DORotate(Vector3.zero, duration * 0.5f);
                });
            }
        }
        
        private void PlayLightFlash(float duration)
        {
            if (mainLight != null)
            {
                float originalIntensity = mainLight.intensity;
                mainLight.DOIntensity(originalIntensity * 2f, duration * 0.1f).OnComplete(() => {
                    mainLight.DOIntensity(originalIntensity, duration * 0.9f);
                });
            }
        }
        
        private void PlayLightFade(float duration)
        {
            if (mainLight != null)
            {
                float originalIntensity = mainLight.intensity;
                mainLight.DOIntensity(0f, duration * 0.5f).OnComplete(() => {
                    mainLight.DOIntensity(originalIntensity, duration * 0.5f);
                });
            }
        }
        
        private IEnumerator ProcessEffectQueue()
        {
            while (true)
            {
                if (_effectQueue.Count > 0 && !_isProcessingEffects)
                {
                    EffectRequest request = _effectQueue.Dequeue();
                    EffectType effectType = (EffectType)System.Enum.Parse(typeof(EffectType), request.effectName);
                    ProcessEffect(effectType, request.position, request.duration, request.onComplete);
                }
                
                yield return new WaitForSeconds(0.1f);
            }
        }
        
        private IEnumerator InvokeAfterDelay(System.Action action, float delay)
        {
            yield return new WaitForSeconds(delay);
            action?.Invoke();
        }
        
        /// <summary>
        /// Set effect intensity
        /// </summary>
        public void SetEffectIntensity(float intensity)
        {
            effectIntensity = Mathf.Clamp01(intensity);
            
            // Update particle systems
            foreach (var particleSystem in _particleSystems.Values)
            {
                if (particleSystem != null)
                {
                    var main = particleSystem.main;
                    main.startSpeed = main.startSpeed.constant * effectIntensity;
                    main.startSize = main.startSize.constant * effectIntensity;
                }
            }
        }
        
        /// <summary>
        /// Enable/disable high quality effects
        /// </summary>
        public void SetHighQualityEffects(bool enabled)
        {
            enableHighQualityEffects = enabled;
            
            if (mainCamera != null)
            {
                mainCamera.allowHDR = enabled;
                mainCamera.allowMSAA = enabled;
            }
            
            // Update particle systems
            foreach (var particleSystem in _particleSystems.Values)
            {
                if (particleSystem != null)
                {
                    var main = particleSystem.main;
                    main.maxParticles = enabled ? maxParticles : maxParticles / 2;
                }
            }
        }
        
        /// <summary>
        /// Enable/disable mobile optimization
        /// </summary>
        public void SetMobileOptimization(bool enabled)
        {
            enableMobileOptimization = enabled;
            
            if (enabled)
            {
                SetHighQualityEffects(false);
                SetEffectIntensity(0.5f);
            }
            else
            {
                SetHighQualityEffects(true);
                SetEffectIntensity(1.0f);
            }
        }
        
        /// <summary>
        /// Stop all effects
        /// </summary>
        public void StopAllEffects()
        {
            // Stop all particle systems
            foreach (var particleSystem in _particleSystems.Values)
            {
                if (particleSystem != null)
                {
                    particleSystem.Stop();
                }
            }
            
            // Stop all tweens
            foreach (var tween in _activeTweens.Values)
            {
                tween.Kill();
            }
            _activeTweens.Clear();
            
            // Clear effect queue
            _effectQueue.Clear();
            
            // Deactivate screen effects
            if (screenFlash != null) screenFlash.SetActive(false);
            if (screenShake != null) screenShake.SetActive(false);
            if (screenRipple != null) screenRipple.SetActive(false);
            if (screenGlow != null) screenGlow.SetActive(false);
        }
        
        void OnDestroy()
        {
            StopAllEffects();
        }
    }
}