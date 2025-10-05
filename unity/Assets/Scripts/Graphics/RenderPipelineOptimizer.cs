using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using Evergreen.Core;

namespace Evergreen.Graphics
{
    /// <summary>
    /// Render pipeline optimizer for URP with advanced features and mobile optimizations
    /// </summary>
    public class RenderPipelineOptimizer : MonoBehaviour
    {
        public static RenderPipelineOptimizer Instance { get; private set; }

        [Header("Rendering Features")]
        public bool enableDeferredRendering = false;
        public bool enableForwardRendering = true;
        public bool enableDepthPrepass = true;
        public bool enableOpaqueTexture = false;
        public bool enableDepthTexture = true;
        public bool enableMotionVectors = false;

        [Header("Lighting Settings")]
        public bool enableMainLightShadows = true;
        public bool enableAdditionalLightShadows = false;
        public int maxAdditionalLights = 4;
        public bool enableMixedLighting = true;
        public bool enableLightProbeBlending = true;

        [Header("Shadow Settings")]
        public ShadowQuality shadowQuality = ShadowQuality.All;
        public ShadowResolution shadowResolution = ShadowResolution.Medium;
        public float shadowDistance = 50f;
        public int shadowCascades = 4;
        public float shadowCascadeRatio1 = 0.1f;
        public float shadowCascadeRatio2 = 0.25f;
        public float shadowCascadeRatio3 = 0.5f;

        [Header("Post-Processing")]
        public bool enablePostProcessing = true;
        public bool enableBloom = true;
        public bool enableColorGrading = true;
        public bool enableVignette = false;
        public bool enableChromaticAberration = false;
        public bool enableLensDistortion = false;

        [Header("Mobile Optimizations")]
        public bool enableMobileRendering = true;
        public bool enableMobileShadows = false;
        public bool enableMobilePostProcessing = false;
        public int mobileShadowResolution = 256;
        public int mobileMaxLights = 2;

        [Header("Performance")]
        public bool enableAdaptiveQuality = true;
        public float targetFrameTime = 16.67f; // 60 FPS
        public float lowPerformanceThreshold = 0.8f;
        public int qualityLevel = 2; // 0 = Low, 1 = Medium, 2 = High, 3 = Ultra

        private UniversalRenderPipelineAsset _urpAsset;
        private Camera _mainCamera;
        private Dictionary<string, RendererFeature> _rendererFeatures = new Dictionary<string, RendererFeature>();
        private bool _isLowPerformance = false;
        private float _lastPerformanceCheck = 0f;
        private int _currentQualityLevel = 2;

        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeRenderPipelineOptimizer();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        void Start()
        {
            SetupRenderPipeline();
            ApplyQualitySettings();
            SetupMobileOptimizations();
        }

        void Update()
        {
            if (enableAdaptiveQuality)
            {
                CheckPerformanceAndAdjustQuality();
            }
        }

        private void InitializeRenderPipelineOptimizer()
        {
            _urpAsset = GraphicsSettings.renderPipelineAsset as UniversalRenderPipelineAsset;
            if (_urpAsset == null)
            {
                Logger.Warning("URP asset not found! Please assign URP asset to Graphics Settings.", "RenderPipelineOptimizer");
            }

            _mainCamera = Camera.main;
            if (_mainCamera == null)
            {
                _mainCamera = FindObjectOfType<Camera>();
            }

            Logger.Info("Render Pipeline Optimizer initialized", "RenderPipelineOptimizer");
        }

        #region Render Pipeline Setup
        private void SetupRenderPipeline()
        {
            if (_urpAsset == null) return;

            // Configure rendering path
            if (enableDeferredRendering)
            {
                _urpAsset.renderingPath = RenderingPath.DeferredShading;
            }
            else if (enableForwardRendering)
            {
                _urpAsset.renderingPath = RenderingPath.Forward;
            }

            // Configure depth settings
            _urpAsset.supportsCameraDepthTexture = enableDepthTexture;
            _urpAsset.supportsCameraOpaqueTexture = enableOpaqueTexture;
            _urpAsset.supportsCameraMotionVectors = enableMotionVectors;

            // Configure lighting
            _urpAsset.supportsMainLightShadows = enableMainLightShadows;
            _urpAsset.supportsAdditionalLightShadows = enableAdditionalLightShadows;
            _urpAsset.maxAdditionalLights = maxAdditionalLights;
            _urpAsset.supportsMixedLighting = enableMixedLighting;
            _urpAsset.supportsLightProbeBlending = enableLightProbeBlending;

            // Configure shadows
            _urpAsset.shadowType = shadowQuality;
            _urpAsset.mainLightShadowmapResolution = (int)shadowResolution;
            _urpAsset.shadowDistance = shadowDistance;
            _urpAsset.shadowCascadeCount = shadowCascades;
            _urpAsset.shadowCascadeRatio1 = shadowCascadeRatio1;
            _urpAsset.shadowCascadeRatio2 = shadowCascadeRatio2;
            _urpAsset.shadowCascadeRatio3 = shadowCascadeRatio3;

            Logger.Info("Render pipeline configured", "RenderPipelineOptimizer");
        }
        #endregion

        #region Quality Settings
        private void ApplyQualitySettings()
        {
            switch (qualityLevel)
            {
                case 0: // Low
                    ApplyLowQualitySettings();
                    break;
                case 1: // Medium
                    ApplyMediumQualitySettings();
                    break;
                case 2: // High
                    ApplyHighQualitySettings();
                    break;
                case 3: // Ultra
                    ApplyUltraQualitySettings();
                    break;
            }

            _currentQualityLevel = qualityLevel;
            Logger.Info($"Quality level {qualityLevel} applied", "RenderPipelineOptimizer");
        }

        private void ApplyLowQualitySettings()
        {
            if (_urpAsset == null) return;

            _urpAsset.supportsMainLightShadows = false;
            _urpAsset.supportsAdditionalLightShadows = false;
            _urpAsset.mainLightShadowmapResolution = 256;
            _urpAsset.shadowDistance = 25f;
            _urpAsset.shadowCascadeCount = 1;
            _urpAsset.maxAdditionalLights = 1;
            _urpAsset.supportsPostProcessing = false;

            QualitySettings.masterTextureLimit = 2;
            QualitySettings.antiAliasing = 0;
            QualitySettings.anisotropicFiltering = AnisotropicFiltering.Disable;
        }

        private void ApplyMediumQualitySettings()
        {
            if (_urpAsset == null) return;

            _urpAsset.supportsMainLightShadows = true;
            _urpAsset.supportsAdditionalLightShadows = false;
            _urpAsset.mainLightShadowmapResolution = 512;
            _urpAsset.shadowDistance = 50f;
            _urpAsset.shadowCascadeCount = 2;
            _urpAsset.maxAdditionalLights = 2;
            _urpAsset.supportsPostProcessing = true;

            QualitySettings.masterTextureLimit = 1;
            QualitySettings.antiAliasing = 2;
            QualitySettings.anisotropicFiltering = AnisotropicFiltering.Enable;
        }

        private void ApplyHighQualitySettings()
        {
            if (_urpAsset == null) return;

            _urpAsset.supportsMainLightShadows = true;
            _urpAsset.supportsAdditionalLightShadows = true;
            _urpAsset.mainLightShadowmapResolution = 1024;
            _urpAsset.shadowDistance = 100f;
            _urpAsset.shadowCascadeCount = 4;
            _urpAsset.maxAdditionalLights = 4;
            _urpAsset.supportsPostProcessing = true;

            QualitySettings.masterTextureLimit = 0;
            QualitySettings.antiAliasing = 4;
            QualitySettings.anisotropicFiltering = AnisotropicFiltering.Enable;
        }

        private void ApplyUltraQualitySettings()
        {
            if (_urpAsset == null) return;

            _urpAsset.supportsMainLightShadows = true;
            _urpAsset.supportsAdditionalLightShadows = true;
            _urpAsset.mainLightShadowmapResolution = 2048;
            _urpAsset.shadowDistance = 200f;
            _urpAsset.shadowCascadeCount = 4;
            _urpAsset.maxAdditionalLights = 8;
            _urpAsset.supportsPostProcessing = true;

            QualitySettings.masterTextureLimit = 0;
            QualitySettings.antiAliasing = 8;
            QualitySettings.anisotropicFiltering = AnisotropicFiltering.Enable;
        }
        #endregion

        #region Mobile Optimizations
        private void SetupMobileOptimizations()
        {
            if (!enableMobileRendering) return;

            switch (Application.platform)
            {
                case RuntimePlatform.Android:
                case RuntimePlatform.IPhonePlayer:
                    ApplyMobileSettings();
                    break;
            }
        }

        private void ApplyMobileSettings()
        {
            if (_urpAsset == null) return;

            // Disable expensive features
            _urpAsset.supportsMainLightShadows = enableMobileShadows;
            _urpAsset.supportsAdditionalLightShadows = false;
            _urpAsset.mainLightShadowmapResolution = mobileShadowResolution;
            _urpAsset.shadowDistance = 25f;
            _urpAsset.shadowCascadeCount = 1;
            _urpAsset.maxAdditionalLights = mobileMaxLights;
            _urpAsset.supportsPostProcessing = enableMobilePostProcessing;

            // Reduce texture quality
            QualitySettings.masterTextureLimit = 1;
            QualitySettings.antiAliasing = 0;
            QualitySettings.anisotropicFiltering = AnisotropicFiltering.Disable;

            // Disable expensive effects
            if (!enableMobilePostProcessing)
            {
                enableBloom = false;
                enableColorGrading = false;
                enableVignette = false;
                enableChromaticAberration = false;
                enableLensDistortion = false;
            }

            Logger.Info("Mobile optimizations applied", "RenderPipelineOptimizer");
        }
        #endregion

        #region Adaptive Quality
        private void CheckPerformanceAndAdjustQuality()
        {
            if (Time.time - _lastPerformanceCheck < 1f) return;

            _lastPerformanceCheck = Time.time;
            var currentFrameTime = Time.unscaledDeltaTime;
            var targetFrameTimeMs = targetFrameTime / 1000f;

            _isLowPerformance = currentFrameTime > (targetFrameTimeMs * lowPerformanceThreshold);

            if (_isLowPerformance && _currentQualityLevel > 0)
            {
                // Reduce quality
                qualityLevel = Mathf.Max(0, _currentQualityLevel - 1);
                ApplyQualitySettings();
                Logger.Warning($"Performance low, reducing quality to level {qualityLevel}", "RenderPipelineOptimizer");
            }
            else if (!_isLowPerformance && _currentQualityLevel < 3)
            {
                // Increase quality
                qualityLevel = Mathf.Min(3, _currentQualityLevel + 1);
                ApplyQualitySettings();
                Logger.Info($"Performance good, increasing quality to level {qualityLevel}", "RenderPipelineOptimizer");
            }
        }
        #endregion

        #region Renderer Features
        /// <summary>
        /// Add renderer feature
        /// </summary>
        public void AddRendererFeature(string name, RendererFeature feature)
        {
            if (feature != null)
            {
                _rendererFeatures[name] = feature;
                Logger.Info($"Renderer feature '{name}' added", "RenderPipelineOptimizer");
            }
        }

        /// <summary>
        /// Remove renderer feature
        /// </summary>
        public void RemoveRendererFeature(string name)
        {
            if (_rendererFeatures.Remove(name))
            {
                Logger.Info($"Renderer feature '{name}' removed", "RenderPipelineOptimizer");
            }
        }

        /// <summary>
        /// Get renderer feature
        /// </summary>
        public RendererFeature GetRendererFeature(string name)
        {
            return _rendererFeatures.TryGetValue(name, out var feature) ? feature : null;
        }
        #endregion

        #region Post-Processing
        /// <summary>
        /// Enable/disable post-processing effects
        /// </summary>
        public void SetPostProcessingEnabled(bool enabled)
        {
            if (_urpAsset != null)
            {
                _urpAsset.supportsPostProcessing = enabled;
            }
        }

        /// <summary>
        /// Configure bloom settings
        /// </summary>
        public void ConfigureBloom(bool enabled, float intensity = 1f, float threshold = 1f)
        {
            enableBloom = enabled;
            // In a real implementation, you would configure bloom parameters here
        }

        /// <summary>
        /// Configure color grading
        /// </summary>
        public void ConfigureColorGrading(bool enabled, float contrast = 1f, float saturation = 1f)
        {
            enableColorGrading = enabled;
            // In a real implementation, you would configure color grading parameters here
        }
        #endregion

        #region Statistics
        /// <summary>
        /// Get render pipeline statistics
        /// </summary>
        public Dictionary<string, object> GetStatistics()
        {
            return new Dictionary<string, object>
            {
                {"current_quality_level", _currentQualityLevel},
                {"is_low_performance", _isLowPerformance},
                {"enable_deferred_rendering", enableDeferredRendering},
                {"enable_forward_rendering", enableForwardRendering},
                {"enable_main_light_shadows", enableMainLightShadows},
                {"enable_additional_light_shadows", enableAdditionalLightShadows},
                {"max_additional_lights", maxAdditionalLights},
                {"shadow_quality", shadowQuality.ToString()},
                {"shadow_resolution", shadowResolution.ToString()},
                {"shadow_distance", shadowDistance},
                {"shadow_cascades", shadowCascades},
                {"enable_post_processing", enablePostProcessing},
                {"enable_mobile_rendering", enableMobileRendering},
                {"enable_adaptive_quality", enableAdaptiveQuality},
                {"renderer_features_count", _rendererFeatures.Count}
            };
        }
        #endregion

        #region Public API
        /// <summary>
        /// Set quality level
        /// </summary>
        public void SetQualityLevel(int level)
        {
            qualityLevel = Mathf.Clamp(level, 0, 3);
            ApplyQualitySettings();
        }

        /// <summary>
        /// Enable/disable shadows
        /// </summary>
        public void SetShadowsEnabled(bool enabled)
        {
            enableMainLightShadows = enabled;
            if (_urpAsset != null)
            {
                _urpAsset.supportsMainLightShadows = enabled;
            }
        }

        /// <summary>
        /// Set shadow distance
        /// </summary>
        public void SetShadowDistance(float distance)
        {
            shadowDistance = distance;
            if (_urpAsset != null)
            {
                _urpAsset.shadowDistance = distance;
            }
        }

        /// <summary>
        /// Enable/disable post-processing
        /// </summary>
        public void SetPostProcessingEnabled(bool enabled)
        {
            enablePostProcessing = enabled;
            SetPostProcessingEnabled(enabled);
        }
        #endregion
    }
}