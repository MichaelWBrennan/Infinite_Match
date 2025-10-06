using UnityEngine;
using UnityEngine.UI;
using System.Collections;
using System.Collections.Generic;
using DG.Tweening;
using TMPro;

namespace Evergreen.UI
{
    /// <summary>
    /// Premium UI Manager with advanced animations, transitions, and visual polish
    /// Implements industry-leading UI/UX patterns for maximum player engagement
    /// </summary>
    public class PremiumUIManager : MonoBehaviour
    {
        [Header("Animation Settings")]
        [SerializeField] private float defaultAnimationDuration = 0.3f;
        [SerializeField] private Ease defaultEase = Ease.OutCubic;
        [SerializeField] private float bounceIntensity = 1.2f;
        [SerializeField] private float shakeIntensity = 10f;
        
        [Header("Visual Effects")]
        [SerializeField] private ParticleSystem sparkleEffect;
        [SerializeField] private ParticleSystem confettiEffect;
        [SerializeField] private ParticleSystem starBurstEffect;
        [SerializeField] private GameObject glowEffect;
        [SerializeField] private GameObject rippleEffect;
        
        [Header("Sound Effects")]
        [SerializeField] private AudioClip buttonClickSound;
        [SerializeField] private AudioClip buttonHoverSound;
        [SerializeField] private AudioClip successSound;
        [SerializeField] private AudioClip errorSound;
        [SerializeField] private AudioClip levelCompleteSound;
        
        [Header("UI Components")]
        [SerializeField] private Canvas mainCanvas;
        [SerializeField] private GraphicRaycaster graphicRaycaster;
        [SerializeField] private CanvasScaler canvasScaler;
        [SerializeField] private CanvasGroup fadeGroup;
        
        [Header("Premium Features")]
        [SerializeField] private bool enableHapticFeedback = true;
        [SerializeField] private bool enableParticleEffects = true;
        [SerializeField] private bool enableScreenShake = true;
        [SerializeField] private bool enableGlowEffects = true;
        
        private Dictionary<string, GameObject> _uiPanels = new Dictionary<string, GameObject>();
        private Dictionary<string, Tween> _activeTweens = new Dictionary<string, Tween>();
        private Queue<UIAnimation> _animationQueue = new Queue<UIAnimation>();
        private bool _isAnimating = false;
        
        public static PremiumUIManager Instance { get; private set; }
        
        [System.Serializable]
        public class UIAnimation
        {
            public string id;
            public GameObject target;
            public AnimationType type;
            public float duration;
            public Ease ease;
            public System.Action onComplete;
            public object[] parameters;
        }
        
        public enum AnimationType
        {
            FadeIn,
            FadeOut,
            SlideIn,
            SlideOut,
            ScaleIn,
            ScaleOut,
            Bounce,
            Shake,
            Rotate,
            Glow,
            Ripple,
            Sparkle,
            Confetti
        }
        
        void Awake()
               {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializePremiumUI();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            SetupPremiumFeatures();
            StartCoroutine(ProcessAnimationQueue());
        }
        
        private void InitializePremiumUI()
        {
            // Setup canvas for premium quality
            if (mainCanvas != null)
            {
                mainCanvas.renderMode = RenderMode.ScreenSpaceOverlay;
                mainCanvas.sortingOrder = 100;
            }
            
            // Setup canvas scaler for all screen sizes
            if (canvasScaler != null)
            {
                canvasScaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
                canvasScaler.referenceResolution = new Vector2(1080, 1920);
                canvasScaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
                canvasScaler.matchWidthOrHeight = 0.5f;
            }
            
            // Setup fade group for smooth transitions
            if (fadeGroup == null)
            {
                fadeGroup = mainCanvas.GetComponent<CanvasGroup>();
                if (fadeGroup == null)
                {
                    fadeGroup = mainCanvas.gameObject.AddComponent<CanvasGroup>();
                }
            }
        }
        
        private void SetupPremiumFeatures()
        {
            // Initialize particle effects
            if (enableParticleEffects)
            {
                InitializeParticleEffects();
            }
            
            // Setup haptic feedback
            if (enableHapticFeedback)
            {
                SetupHapticFeedback();
            }
            
            // Initialize glow effects
            if (enableGlowEffects)
            {
                InitializeGlowEffects();
            }
        }
        
        private void InitializeParticleEffects()
        {
            // Create sparkle effect
            if (sparkleEffect == null)
            {
                GameObject sparkleObj = new GameObject("SparkleEffect");
                sparkleObj.transform.SetParent(transform);
                sparkleEffect = sparkleObj.AddComponent<ParticleSystem>();
                SetupSparkleEffect();
            }
            
            // Create confetti effect
            if (confettiEffect == null)
            {
                GameObject confettiObj = new GameObject("ConfettiEffect");
                confettiObj.transform.SetParent(transform);
                confettiEffect = confettiObj.AddComponent<ParticleSystem>();
                SetupConfettiEffect();
            }
            
            // Create star burst effect
            if (starBurstEffect == null)
            {
                GameObject starBurstObj = new GameObject("StarBurstEffect");
                starBurstObj.transform.SetParent(transform);
                starBurstEffect = starBurstObj.AddComponent<ParticleSystem>();
                SetupStarBurstEffect();
            }
        }
        
        private void SetupSparkleEffect()
        {
            var main = sparkleEffect.main;
            main.startLifetime = 1.0f;
            main.startSpeed = 5.0f;
            main.startSize = 0.1f;
            main.startColor = Color.yellow;
            main.maxParticles = 50;
            
            var emission = sparkleEffect.emission;
            emission.rateOverTime = 0;
            emission.SetBursts(new ParticleSystem.Burst[] { new ParticleSystem.Burst(0.0f, 20) });
            
            var shape = sparkleEffect.shape;
            shape.shapeType = ParticleSystemShapeType.Circle;
            shape.radius = 1.0f;
            
            var velocityOverLifetime = sparkleEffect.velocityOverLifetime;
            velocityOverLifetime.enabled = true;
            velocityOverLifetime.space = ParticleSystemSimulationSpace.Local;
            velocityOverLifetime.radial = new ParticleSystem.MinMaxCurve(2.0f);
            
            var sizeOverLifetime = sparkleEffect.sizeOverLifetime;
            sizeOverLifetime.enabled = true;
            sizeOverLifetime.size = new ParticleSystem.MinMaxCurve(1.0f, new AnimationCurve(
                new Keyframe(0.0f, 0.0f),
                new Keyframe(0.5f, 1.0f),
                new Keyframe(1.0f, 0.0f)
            ));
        }
        
        private void SetupConfettiEffect()
        {
            var main = confettiEffect.main;
            main.startLifetime = 3.0f;
            main.startSpeed = 10.0f;
            main.startSize = 0.2f;
            main.startColor = new Color(1.0f, 0.5f, 0.0f);
            main.maxParticles = 100;
            main.gravityModifier = 0.5f;
            
            var emission = confettiEffect.emission;
            emission.rateOverTime = 0;
            emission.SetBursts(new ParticleSystem.Burst[] { new ParticleSystem.Burst(0.0f, 50) });
            
            var shape = confettiEffect.shape;
            shape.shapeType = ParticleSystemShapeType.Cone;
            shape.angle = 30.0f;
            shape.radius = 0.1f;
        }
        
        private void SetupStarBurstEffect()
        {
            var main = starBurstEffect.main;
            main.startLifetime = 2.0f;
            main.startSpeed = 15.0f;
            main.startSize = 0.3f;
            main.startColor = Color.white;
            main.maxParticles = 30;
            
            var emission = starBurstEffect.emission;
            emission.rateOverTime = 0;
            emission.SetBursts(new ParticleSystem.Burst[] { new ParticleSystem.Burst(0.0f, 15) });
            
            var shape = starBurstEffect.shape;
            shape.shapeType = ParticleSystemShapeType.Circle;
            shape.radius = 0.5f;
        }
        
        private void SetupHapticFeedback()
        {
            // Setup haptic feedback for mobile devices
            #if UNITY_ANDROID && !UNITY_EDITOR
            AndroidJavaClass unityPlayer = new AndroidJavaClass("com.unity3d.player.UnityPlayer");
            AndroidJavaObject currentActivity = unityPlayer.GetStatic<AndroidJavaObject>("currentActivity");
            AndroidJavaObject vibrator = currentActivity.Call<AndroidJavaObject>("getSystemService", "vibrator");
            #endif
        }
        
        private void InitializeGlowEffects()
        {
            // Create glow effect prefab
            if (glowEffect == null)
            {
                glowEffect = new GameObject("GlowEffect");
                glowEffect.transform.SetParent(transform);
                
                Image glowImage = glowEffect.AddComponent<Image>();
                glowImage.color = new Color(1.0f, 1.0f, 0.0f, 0.5f);
                glowImage.raycastTarget = false;
                
                RectTransform glowRect = glowEffect.GetComponent<RectTransform>();
                glowRect.sizeDelta = new Vector2(200, 200);
                
                glowEffect.SetActive(false);
            }
            
            // Create ripple effect prefab
            if (rippleEffect == null)
            {
                rippleEffect = new GameObject("RippleEffect");
                rippleEffect.transform.SetParent(transform);
                
                Image rippleImage = rippleEffect.AddComponent<Image>();
                rippleImage.color = new Color(0.0f, 0.5f, 1.0f, 0.3f);
                rippleImage.raycastTarget = false;
                
                RectTransform rippleRect = rippleEffect.GetComponent<RectTransform>();
                rippleRect.sizeDelta = new Vector2(100, 100);
                
                rippleEffect.SetActive(false);
            }
        }
        
        /// <summary>
        /// Show a UI panel with premium animation
        /// </summary>
        public void ShowPanel(string panelName, AnimationType animationType = AnimationType.FadeIn, float duration = -1)
        {
            if (_uiPanels.ContainsKey(panelName))
            {
                GameObject panel = _uiPanels[panelName];
                if (panel != null)
                {
                    panel.SetActive(true);
                    AnimateUI(panel, animationType, duration > 0 ? duration : defaultAnimationDuration);
                }
            }
        }
        
        /// <summary>
        /// Hide a UI panel with premium animation
        /// </summary>
        public void HidePanel(string panelName, AnimationType animationType = AnimationType.FadeOut, float duration = -1)
        {
            if (_uiPanels.ContainsKey(panelName))
            {
                GameObject panel = _uiPanels[panelName];
                if (panel != null)
                {
                    AnimateUI(panel, animationType, duration > 0 ? duration : defaultAnimationDuration, () => {
                        panel.SetActive(false);
                    });
                }
            }
        }
        
        /// <summary>
        /// Animate a UI element with premium effects
        /// </summary>
        public void AnimateUI(GameObject target, AnimationType type, float duration, System.Action onComplete = null)
        {
            if (target == null) return;
            
            // Kill existing tween for this target
            string tweenId = target.GetInstanceID().ToString();
            if (_activeTweens.ContainsKey(tweenId))
            {
                _activeTweens[tweenId].Kill();
            }
            
            // Play sound effect
            PlayAnimationSound(type);
            
            // Play haptic feedback
            PlayHapticFeedback(type);
            
            // Create new tween based on animation type
            Tween tween = CreateTween(target, type, duration);
            
            if (tween != null)
            {
                tween.OnComplete(() => {
                    if (_activeTweens.ContainsKey(tweenId))
                    {
                        _activeTweens.Remove(tweenId);
                    }
                    onComplete?.Invoke();
                });
                
                _activeTweens[tweenId] = tween;
            }
        }
        
        private Tween CreateTween(GameObject target, AnimationType type, float duration)
        {
            RectTransform rectTransform = target.GetComponent<RectTransform>();
            CanvasGroup canvasGroup = target.GetComponent<CanvasGroup>();
            
            if (canvasGroup == null)
            {
                canvasGroup = target.AddComponent<CanvasGroup>();
            }
            
            switch (type)
            {
                case AnimationType.FadeIn:
                    canvasGroup.alpha = 0f;
                    return canvasGroup.DOFade(1f, duration).SetEase(defaultEase);
                    
                case AnimationType.FadeOut:
                    return canvasGroup.DOFade(0f, duration).SetEase(defaultEase);
                    
                case AnimationType.SlideIn:
                    rectTransform.anchoredPosition = new Vector2(0, Screen.height);
                    return rectTransform.DOAnchorPosY(0, duration).SetEase(defaultEase);
                    
                case AnimationType.SlideOut:
                    return rectTransform.DOAnchorPosY(Screen.height, duration).SetEase(defaultEase);
                    
                case AnimationType.ScaleIn:
                    rectTransform.localScale = Vector3.zero;
                    return rectTransform.DOScale(Vector3.one, duration).SetEase(defaultEase);
                    
                case AnimationType.ScaleOut:
                    return rectTransform.DOScale(Vector3.zero, duration).SetEase(defaultEase);
                    
                case AnimationType.Bounce:
                    rectTransform.localScale = Vector3.zero;
                    return rectTransform.DOScale(Vector3.one * bounceIntensity, duration).SetEase(Ease.OutBounce);
                    
                case AnimationType.Shake:
                    return rectTransform.DOShakePosition(duration, shakeIntensity).SetEase(Ease.OutQuad);
                    
                case AnimationType.Rotate:
                    return rectTransform.DORotate(new Vector3(0, 0, 360), duration, RotateMode.FastBeyond360).SetEase(Ease.OutCubic);
                    
                case AnimationType.Glow:
                    return CreateGlowEffect(target, duration);
                    
                case AnimationType.Ripple:
                    return CreateRippleEffect(target, duration);
                    
                case AnimationType.Sparkle:
                    PlaySparkleEffect(target.transform.position);
                    return null;
                    
                case AnimationType.Confetti:
                    PlayConfettiEffect(target.transform.position);
                    return null;
                    
                default:
                    return null;
            }
        }
        
        private Tween CreateGlowEffect(GameObject target, float duration)
        {
            if (glowEffect == null) return null;
            
            glowEffect.SetActive(true);
            glowEffect.transform.position = target.transform.position;
            
            CanvasGroup glowCanvasGroup = glowEffect.GetComponent<CanvasGroup>();
            if (glowCanvasGroup == null)
            {
                glowCanvasGroup = glowEffect.AddComponent<CanvasGroup>();
            }
            
            glowCanvasGroup.alpha = 0f;
            return glowCanvasGroup.DOFade(1f, duration).SetEase(Ease.OutQuad).OnComplete(() => {
                glowCanvasGroup.DOFade(0f, duration).SetEase(Ease.InQuad).OnComplete(() => {
                    glowEffect.SetActive(false);
                });
            });
        }
        
        private Tween CreateRippleEffect(GameObject target, float duration)
        {
            if (rippleEffect == null) return null;
            
            rippleEffect.SetActive(true);
            rippleEffect.transform.position = target.transform.position;
            
            RectTransform rippleRect = rippleEffect.GetComponent<RectTransform>();
            rippleRect.localScale = Vector3.zero;
            
            return rippleRect.DOScale(Vector3.one * 2f, duration).SetEase(Ease.OutQuad).OnComplete(() => {
                rippleEffect.SetActive(false);
            });
        }
        
        private void PlaySparkleEffect(Vector3 position)
        {
            if (sparkleEffect != null && enableParticleEffects)
            {
                sparkleEffect.transform.position = position;
                sparkleEffect.Play();
            }
        }
        
        private void PlayConfettiEffect(Vector3 position)
        {
            if (confettiEffect != null && enableParticleEffects)
            {
                confettiEffect.transform.position = position;
                confettiEffect.Play();
            }
        }
        
        private void PlayAnimationSound(AnimationType type)
        {
            AudioClip clipToPlay = null;
            
            switch (type)
            {
                case AnimationType.FadeIn:
                case AnimationType.ScaleIn:
                case AnimationType.Bounce:
                    clipToPlay = successSound;
                    break;
                case AnimationType.FadeOut:
                case AnimationType.ScaleOut:
                    clipToPlay = buttonClickSound;
                    break;
                case AnimationType.Shake:
                    clipToPlay = errorSound;
                    break;
                case AnimationType.Confetti:
                    clipToPlay = levelCompleteSound;
                    break;
            }
            
            if (clipToPlay != null)
            {
                AudioSource.PlayClipAtPoint(clipToPlay, Camera.main.transform.position);
            }
        }
        
        private void PlayHapticFeedback(AnimationType type)
        {
            if (!enableHapticFeedback) return;
            
            #if UNITY_ANDROID && !UNITY_EDITOR
            AndroidJavaClass unityPlayer = new AndroidJavaClass("com.unity3d.player.UnityPlayer");
            AndroidJavaObject currentActivity = unityPlayer.GetStatic<AndroidJavaObject>("currentActivity");
            AndroidJavaObject vibrator = currentActivity.Call<AndroidJavaObject>("getSystemService", "vibrator");
            
            switch (type)
            {
                case AnimationType.Bounce:
                case AnimationType.Confetti:
                    vibrator.Call("vibrate", 100); // Long vibration
                    break;
                case AnimationType.Shake:
                    vibrator.Call("vibrate", 50); // Medium vibration
                    break;
                default:
                    vibrator.Call("vibrate", 25); // Short vibration
                    break;
            }
            #elif UNITY_IOS && !UNITY_EDITOR
            Handheld.Vibrate();
            #endif
        }
        
        /// <summary>
        /// Register a UI panel for management
        /// </summary>
        public void RegisterPanel(string panelName, GameObject panel)
        {
            if (!_uiPanels.ContainsKey(panelName))
            {
                _uiPanels[panelName] = panel;
            }
        }
        
        /// <summary>
        /// Unregister a UI panel
        /// </summary>
        public void UnregisterPanel(string panelName)
        {
            if (_uiPanels.ContainsKey(panelName))
            {
                _uiPanels.Remove(panelName);
            }
        }
        
        /// <summary>
        /// Show a premium notification with animation
        /// </summary>
        public void ShowNotification(string message, float duration = 3f, AnimationType animationType = AnimationType.Bounce)
        {
            // Create notification GameObject
            GameObject notification = new GameObject("Notification");
            notification.transform.SetParent(mainCanvas.transform);
            
            // Add background
            Image background = notification.AddComponent<Image>();
            background.color = new Color(0, 0, 0, 0.8f);
            
            // Add text
            GameObject textObj = new GameObject("Text");
            textObj.transform.SetParent(notification.transform);
            
            TextMeshProUGUI text = textObj.AddComponent<TextMeshProUGUI>();
            text.text = message;
            text.fontSize = 24;
            text.color = Color.white;
            text.alignment = TextAlignmentOptions.Center;
            
            // Setup RectTransform
            RectTransform notificationRect = notification.GetComponent<RectTransform>();
            notificationRect.anchorMin = new Vector2(0.1f, 0.8f);
            notificationRect.anchorMax = new Vector2(0.9f, 0.9f);
            notificationRect.offsetMin = Vector2.zero;
            notificationRect.offsetMax = Vector2.zero;
            
            RectTransform textRect = textObj.GetComponent<RectTransform>();
            textRect.anchorMin = Vector2.zero;
            textRect.anchorMax = Vector2.one;
            textRect.offsetMin = Vector2.zero;
            textRect.offsetMax = Vector2.zero;
            
            // Animate notification
            AnimateUI(notification, animationType, defaultAnimationDuration, () => {
                StartCoroutine(HideNotificationAfterDelay(notification, duration));
            });
        }
        
        private IEnumerator HideNotificationAfterDelay(GameObject notification, float delay)
        {
            yield return new WaitForSeconds(delay);
            AnimateUI(notification, AnimationType.FadeOut, defaultAnimationDuration, () => {
                Destroy(notification);
            });
        }
        
        private IEnumerator ProcessAnimationQueue()
        {
            while (true)
            {
                if (_animationQueue.Count > 0 && !_isAnimating)
                {
                    _isAnimating = true;
                    UIAnimation animation = _animationQueue.Dequeue();
                    
                    AnimateUI(animation.target, animation.type, animation.duration, () => {
                        _isAnimating = false;
                        animation.onComplete?.Invoke();
                    });
                }
                
                yield return new WaitForSeconds(0.1f);
            }
        }
        
        /// <summary>
        /// Queue an animation for later processing
        /// </summary>
        public void QueueAnimation(UIAnimation animation)
        {
            _animationQueue.Enqueue(animation);
        }
        
        /// <summary>
        /// Stop all animations
        /// </summary>
        public void StopAllAnimations()
        {
            foreach (var tween in _activeTweens.Values)
            {
                tween.Kill();
            }
            _activeTweens.Clear();
            _animationQueue.Clear();
        }
        
        /// <summary>
        /// Set animation settings
        /// </summary>
        public void SetAnimationSettings(float duration, Ease ease, float bounceIntensity, float shakeIntensity)
        {
            this.defaultAnimationDuration = duration;
            this.defaultEase = ease;
            this.bounceIntensity = bounceIntensity;
            this.shakeIntensity = shakeIntensity;
        }
        
        /// <summary>
        /// Enable/disable premium features
        /// </summary>
        public void SetPremiumFeatures(bool haptic, bool particles, bool screenShake, bool glow)
        {
            enableHapticFeedback = haptic;
            enableParticleEffects = particles;
            enableScreenShake = screenShake;
            enableGlowEffects = glow;
        }
        
        void OnDestroy()
        {
            StopAllAnimations();
        }
    }
}