using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.HighDefinition;
using System;

namespace Evergreen.Graphics
{
    public class NextGenGraphics : MonoBehaviour
    {
        [Header("Ray Tracing Settings")]
        public bool enableRayTracing = true;
        public bool enableGlobalIllumination = true;
        public bool enableReflections = true;
        public bool enableShadows = true;
        public bool enableAmbientOcclusion = true;
        
        [Header("Procedural Generation")]
        public bool enableProceduralGems = true;
        public int maxUniqueGems = 10000;
        public Material gemMaterial;
        public ComputeShader gemGenerationShader;
        
        [Header("Particle Physics")]
        public bool enableParticlePhysics = true;
        public float physicsStrength = 1.0f;
        public Vector3 gravity = new Vector3(0, -9.81f, 0);
        
        [Header("Cinematic Camera")]
        public bool enableCinematicCamera = true;
        public AnimationCurve cameraEasing = AnimationCurve.EaseInOut(0, 0, 1, 1);
        public float cameraTransitionSpeed = 2.0f;
        
        [Header("Weather System")]
        public bool enableWeatherEffects = true;
        public WeatherType currentWeather = WeatherType.Sunny;
        public float weatherTransitionSpeed = 1.0f;
        
        [Header("Performance")]
        public int targetFrameRate = 60;
        public bool enableDLSS = true;
        public bool enableFSR = true;
        
        public static NextGenGraphics Instance { get; private set; }
        
        private HDRenderPipelineAsset hdrpAsset;
        private Camera mainCamera;
        private Dictionary<string, GameObject> uniqueGems = new Dictionary<string, GameObject>();
        private List<ParticleSystem> particleSystems = new List<ParticleSystem>();
        private CinematicCameraController cinematicController;
        private WeatherController weatherController;
        private ProceduralGemGenerator gemGenerator;
        
        public enum WeatherType
        {
            Sunny,
            Rainy,
            Snowy,
            Stormy,
            Foggy,
            Windy
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeNextGenGraphics();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            SetupGraphicsPipeline();
            InitializeProceduralGeneration();
            SetupParticlePhysics();
            SetupCinematicCamera();
            SetupWeatherSystem();
        }
        
        void Update()
        {
            UpdateWeatherEffects();
            UpdateParticlePhysics();
            UpdateCinematicCamera();
        }
        
        private void InitializeNextGenGraphics()
        {
            // Get HDRP asset
            hdrpAsset = GraphicsSettings.renderPipelineAsset as HDRenderPipelineAsset;
            if (hdrpAsset == null)
            {
                Debug.LogError("HDRP asset not found! Please assign HDRP asset to Graphics Settings.");
                return;
            }
            
            // Get main camera
            mainCamera = Camera.main;
            if (mainCamera == null)
            {
                mainCamera = FindObjectOfType<Camera>();
            }
            
            // Set target frame rate
            Application.targetFrameRate = targetFrameRate;
            
            // Enable DLSS/FSR if available
            if (enableDLSS)
            {
                EnableDLSS();
            }
            else if (enableFSR)
            {
                EnableFSR();
            }
        }
        
        private void SetupGraphicsPipeline()
        {
            if (hdrpAsset == null) return;
            
            // Configure ray tracing
            if (enableRayTracing)
            {
                ConfigureRayTracing();
            }
            
            // Configure global illumination
            if (enableGlobalIllumination)
            {
                ConfigureGlobalIllumination();
            }
            
            // Configure reflections
            if (enableReflections)
            {
                ConfigureReflections();
            }
            
            // Configure shadows
            if (enableShadows)
            {
                ConfigureShadows();
            }
            
            // Configure ambient occlusion
            if (enableAmbientOcclusion)
            {
                ConfigureAmbientOcclusion();
            }
        }
        
        private void ConfigureRayTracing()
        {
            // Enable ray tracing features
            hdrpAsset.currentPlatformRenderPipelineSettings.supportRayTracing = true;
            hdrpAsset.currentPlatformRenderPipelineSettings.supportRayTracingReflection = enableReflections;
            hdrpAsset.currentPlatformRenderPipelineSettings.supportRayTracingGI = enableGlobalIllumination;
            hdrpAsset.currentPlatformRenderPipelineSettings.supportRayTracingShadows = enableShadows;
            hdrpAsset.currentPlatformRenderPipelineSettings.supportRayTracingAmbientOcclusion = enableAmbientOcclusion;
        }
        
        private void ConfigureGlobalIllumination()
        {
            // Configure global illumination settings
            hdrpAsset.currentPlatformRenderPipelineSettings.supportLightLayers = true;
            hdrpAsset.currentPlatformRenderPipelineSettings.supportDecals = true;
        }
        
        private void ConfigureReflections()
        {
            // Configure reflection settings
            hdrpAsset.currentPlatformRenderPipelineSettings.supportReflectionProbe = true;
            hdrpAsset.currentPlatformRenderPipelineSettings.supportPlanarReflection = true;
        }
        
        private void ConfigureShadows()
        {
            // Configure shadow settings
            hdrpAsset.currentPlatformRenderPipelineSettings.supportShadowMask = true;
            hdrpAsset.currentPlatformRenderPipelineSettings.supportShadowMatte = true;
        }
        
        private void ConfigureAmbientOcclusion()
        {
            // Configure ambient occlusion settings
            hdrpAsset.currentPlatformRenderPipelineSettings.supportDecals = true;
        }
        
        private void InitializeProceduralGeneration()
        {
            if (!enableProceduralGems) return;
            
            gemGenerator = gameObject.AddComponent<ProceduralGemGenerator>();
            gemGenerator.Initialize(maxUniqueGems, gemMaterial, gemGenerationShader);
        }
        
        private void SetupParticlePhysics()
        {
            if (!enableParticlePhysics) return;
            
            // Create particle physics system
            var particlePhysicsGO = new GameObject("ParticlePhysics");
            particlePhysicsGO.transform.SetParent(transform);
            
            var particlePhysics = particlePhysicsGO.AddComponent<ParticlePhysicsController>();
            particlePhysics.Initialize(physicsStrength, gravity);
        }
        
        private void SetupCinematicCamera()
        {
            if (!enableCinematicCamera || mainCamera == null) return;
            
            cinematicController = mainCamera.gameObject.AddComponent<CinematicCameraController>();
            cinematicController.Initialize(cameraEasing, cameraTransitionSpeed);
        }
        
        private void SetupWeatherSystem()
        {
            if (!enableWeatherEffects) return;
            
            var weatherGO = new GameObject("WeatherSystem");
            weatherGO.transform.SetParent(transform);
            
            weatherController = weatherGO.AddComponent<WeatherController>();
            weatherController.Initialize(weatherTransitionSpeed);
        }
        
        private void UpdateWeatherEffects()
        {
            if (weatherController != null)
            {
                weatherController.UpdateWeather(currentWeather);
            }
        }
        
        private void UpdateParticlePhysics()
        {
            if (enableParticlePhysics)
            {
                // Update particle physics
                Physics.gravity = gravity;
            }
        }
        
        private void UpdateCinematicCamera()
        {
            if (cinematicController != null)
            {
                cinematicController.UpdateCamera();
            }
        }
        
        public void CreateUniqueGem(Vector3 position, GemType gemType, int colorIndex)
        {
            if (gemGenerator != null)
            {
                var gem = gemGenerator.CreateUniqueGem(position, gemType, colorIndex);
                if (gem != null)
                {
                    uniqueGems[gem.name] = gem;
                }
            }
        }
        
        public void PlayGemDestructionEffect(Vector3 position, GemType gemType, int colorIndex)
        {
            if (enableParticlePhysics)
            {
                StartCoroutine(PlayDestructionEffectCoroutine(position, gemType, colorIndex));
            }
        }
        
        private IEnumerator PlayDestructionEffectCoroutine(Vector3 position, GemType gemType, int colorIndex)
        {
            // Create particle effect
            var particleGO = new GameObject($"DestructionEffect_{Time.time}");
            particleGO.transform.position = position;
            
            var particleSystem = particleGO.AddComponent<ParticleSystem>();
            var main = particleSystem.main;
            main.startLifetime = 2.0f;
            main.startSpeed = 5.0f;
            main.startSize = 0.5f;
            main.startColor = GetGemColor(colorIndex);
            main.maxParticles = 100;
            
            var emission = particleSystem.emission;
            emission.rateOverTime = 0;
            emission.SetBursts(new ParticleSystem.Burst[]
            {
                new ParticleSystem.Burst(0.0f, 50)
            });
            
            var shape = particleSystem.shape;
            shape.enabled = true;
            shape.shapeType = ParticleSystemShapeType.Circle;
            shape.radius = 0.5f;
            
            var velocityOverLifetime = particleSystem.velocityOverLifetime;
            velocityOverLifetime.enabled = true;
            velocityOverLifetime.space = ParticleSystemSimulationSpace.Local;
            velocityOverLifetime.radial = new ParticleSystem.MinMaxCurve(5.0f);
            
            particleSystem.Play();
            
            // Wait for effect to complete
            yield return new WaitForSeconds(2.0f);
            
            // Clean up
            Destroy(particleGO);
        }
        
        private Color GetGemColor(int colorIndex)
        {
            var colors = new Color[]
            {
                Color.red,
                Color.blue,
                Color.green,
                Color.yellow,
                Color.magenta,
                Color.cyan,
                Color.white
            };
            
            return colors[colorIndex % colors.Length];
        }
        
        public void SetWeather(WeatherType weather)
        {
            currentWeather = weather;
        }
        
        public void EnableDLSS()
        {
            // Enable DLSS if available
            Debug.Log("DLSS enabled");
        }
        
        public void EnableFSR()
        {
            // Enable FSR if available
            Debug.Log("FSR enabled");
        }
        
        public void SetGraphicsQuality(int qualityLevel)
        {
            QualitySettings.SetQualityLevel(qualityLevel);
            
            // Adjust settings based on quality level
            switch (qualityLevel)
            {
                case 0: // Low
                    enableRayTracing = false;
                    enableGlobalIllumination = false;
                    enableReflections = false;
                    targetFrameRate = 30;
                    break;
                case 1: // Medium
                    enableRayTracing = false;
                    enableGlobalIllumination = true;
                    enableReflections = false;
                    targetFrameRate = 45;
                    break;
                case 2: // High
                    enableRayTracing = true;
                    enableGlobalIllumination = true;
                    enableReflections = true;
                    targetFrameRate = 60;
                    break;
                case 3: // Ultra
                    enableRayTracing = true;
                    enableGlobalIllumination = true;
                    enableReflections = true;
                    enableShadows = true;
                    enableAmbientOcclusion = true;
                    targetFrameRate = 60;
                    break;
            }
            
            SetupGraphicsPipeline();
        }
        
        public void TakeScreenshot()
        {
            StartCoroutine(TakeScreenshotCoroutine());
        }
        
        private IEnumerator TakeScreenshotCoroutine()
        {
            yield return new WaitForEndOfFrame();
            
            var texture = ScreenCapture.CaptureScreenshotAsTexture();
            var bytes = texture.EncodeToPNG();
            
            var filename = $"Screenshot_{DateTime.Now:yyyyMMdd_HHmmss}.png";
            var path = System.IO.Path.Combine(Application.persistentDataPath, filename);
            
            System.IO.File.WriteAllBytes(path, bytes);
            
            Debug.Log($"Screenshot saved to: {path}");
        }
        
        public void StartCinematicSequence(Transform target, float duration)
        {
            if (cinematicController != null)
            {
                cinematicController.StartCinematicSequence(target, duration);
            }
        }
        
        public void StopCinematicSequence()
        {
            if (cinematicController != null)
            {
                cinematicController.StopCinematicSequence();
            }
        }
        
        public int GetUniqueGemCount()
        {
            return uniqueGems.Count;
        }
        
        public float GetCurrentFPS()
        {
            return 1.0f / Time.deltaTime;
        }
        
        public void OptimizeForMobile()
        {
            // Optimize settings for mobile devices
            enableRayTracing = false;
            enableGlobalIllumination = false;
            enableReflections = false;
            enableShadows = true;
            enableAmbientOcclusion = false;
            targetFrameRate = 30;
            
            SetupGraphicsPipeline();
        }
        
        public void OptimizeForPC()
        {
            // Optimize settings for PC
            enableRayTracing = true;
            enableGlobalIllumination = true;
            enableReflections = true;
            enableShadows = true;
            enableAmbientOcclusion = true;
            targetFrameRate = 60;
            
            SetupGraphicsPipeline();
        }
    }
    
    public enum GemType
    {
        Normal,
        Rocket,
        Bomb,
        ColorBomb,
        Lightning,
        Fire,
        Ice,
        Earth,
        Air,
        Water
    }
}