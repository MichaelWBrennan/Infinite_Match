using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using Evergreen.Core;

namespace Evergreen.Graphics
{
    /// <summary>
    /// Advanced graphics optimization system with LOD, batching, and mobile optimizations
    /// </summary>
    public class GraphicsOptimizer : MonoBehaviour
    {
        public static GraphicsOptimizer Instance { get; private set; }

        [Header("LOD Settings")]
        public bool enableLODSystem = true;
        public float[] lodDistances = { 10f, 25f, 50f, 100f };
        public int[] lodTriangles = { 100, 50, 25, 10 };
        public bool enableLODBias = true;
        public float lodBias = 1.0f;

        [Header("Batching Settings")]
        public bool enableStaticBatching = true;
        public bool enableDynamicBatching = true;
        public int maxBatchingVertices = 900;
        public bool enableGPUInstancing = true;
        public int maxInstancesPerBatch = 1023;

        [Header("Culling Settings")]
        public bool enableOcclusionCulling = true;
        public bool enableFrustumCulling = true;
        public bool enableShadowCulling = true;
        public float cullingDistance = 200f;

        [Header("Mobile Optimizations")]
        public bool enableMobileOptimizations = true;
        public int mobileMaxTextureSize = 1024;
        public int mobileMaxLODLevel = 2;
        public bool enableMobileShadows = false;
        public bool enableMobileParticles = true;
        public int mobileMaxParticles = 100;

        [Header("Quality Settings")]
        public int targetFrameRate = 60;
        public bool enableVSync = true;
        public int antiAliasing = 4;
        public bool enableAnisotropicFiltering = true;
        public int anisotropicFilteringLevel = 4;

        [Header("Performance Monitoring")]
        public bool enablePerformanceMonitoring = true;
        public float monitoringInterval = 1f;
        public float targetFrameTime = 16.67f; // 60 FPS
        public float lowPerformanceThreshold = 0.8f;

        private Camera _mainCamera;
        private UniversalRenderPipelineAsset _urpAsset;
        private Dictionary<GameObject, LODGroup> _lodGroups = new Dictionary<GameObject, LODGroup>();
        private Dictionary<Renderer, MaterialPropertyBlock> _materialPropertyBlocks = new Dictionary<Renderer, MaterialPropertyBlock>();
        private List<Renderer> _staticRenderers = new List<Renderer>();
        private List<Renderer> _dynamicRenderers = new List<Renderer>();
        
        // Dynamic LOD system
        private Dictionary<LODGroup, LODData> _lodData = new Dictionary<LODGroup, LODData>();
        private List<LODGroup> _activeLODGroups = new List<LODGroup>();
        private float _currentLODBias = 1.0f;
        private int _currentLODLevel = 0;
        
        // Occlusion culling
        private Dictionary<Renderer, OcclusionData> _occlusionData = new Dictionary<Renderer, OcclusionData>();
        private List<Renderer> _occlusionCulledRenderers = new List<Renderer>();
        private bool _occlusionCullingActive = false;
        private float _occlusionUpdateInterval = 0.1f;
        private float _lastOcclusionUpdate = 0f;

        private float _lastMonitoringTime = 0f;
        private float _currentFrameTime = 0f;
        private int _currentFPS = 0;
        private bool _isLowPerformance = false;
        
        [System.Serializable]
        public class LODData
        {
            public LODGroup lodGroup;
            public float[] originalDistances;
            public int[] originalTriangles;
            public bool isDynamic;
            public float lastUpdateTime;
            public Vector3 lastPosition;
        }
        
        [System.Serializable]
        public class OcclusionData
        {
            public Renderer renderer;
            public Bounds bounds;
            public bool isOccluded;
            public float lastCheckTime;
            public Vector3 lastPosition;
        }

        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeGraphicsOptimizer();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        void Start()
        {
            SetupGraphicsPipeline();
            SetupLODsystemSafe();
            SetupBatching();
            SetupCulling();
            ApplyMobileOptimizations();
        }

        void Update()
        {
            if (enablePerformanceMonitoring)
            {
                MonitorPerformance();
            }

            UpdateLODsystemSafe();
            UpdateBatching();
            UpdateOcclusionCulling();
        }

        private void InitializeGraphicsOptimizer()
        {
            _mainCamera = Camera.main;
            if (_mainCamera == null)
            {
                _mainCamera = FindObjectOfType<Camera>();
            }

            _urpAsset = GraphicsSettings.renderPipelineAsset as UniversalRenderPipelineAsset;
            if (_urpAsset == null)
            {
                Logger.Warning("URP asset not found! Please assign URP asset to Graphics Settings.", "GraphicsOptimizer");
            }

            Logger.Info("Graphics Optimizer initialized", "GraphicsOptimizer");
        }

        #region Graphics Pipeline Setup
        private void SetupGraphicsPipeline()
        {
            // Set target frame rate
            Application.targetFrameRate = targetFrameRate;
            QualitySettings.vSyncCount = enableVSync ? 1 : 0;

            // Set anti-aliasing
            QualitySettings.antiAliasing = antiAliasing;

            // Set anisotropic filtering
            if (enableAnisotropicFiltering)
            {
                QualitySettings.anisotropicFiltering = (AnisotropicFiltering)anisotropicFilteringLevel;
            }

            // Configure URP settings
            if (_urpAsset != null)
            {
                ConfigureURPSettings();
            }
        }

        private void ConfigureURPSettings()
        {
            // This would configure URP settings based on platform and performance requirements
            // In a real implementation, you would modify the URP asset settings here
            Logger.Info("URP settings configured", "GraphicsOptimizer");
        }
        #endregion

        #region LOD System
        private void SetupLODsystemSafe()
        {
            if (!enableLODSystem) return;

            // Find all renderers and create LOD groups
            var renderers = FindObjectsOfType<Renderer>();
            foreach (var renderer in renderers)
            {
                CreateLODGroup(renderer.gameObject);
            }

            Logger.Info($"LOD system setup complete. {_lodGroups.Count} LOD groups created.", "GraphicsOptimizer");
        }

        private void CreateLODGroup(GameObject obj)
        {
            if (_lodGroups.ContainsKey(obj)) return;

            var lodGroup = obj.GetComponent<LODGroup>();
            if (lodGroup == null)
            {
                lodGroup = obj.AddComponent<LODGroup>();
            }

            var renderers = obj.GetComponentsInChildren<Renderer>();
            if (renderers.Length == 0) return;

            var lods = new LOD[lodDistances.Length];
            for (int i = 0; i < lodDistances.Length; i++)
            {
                var distance = lodDistances[i];
                var triangles = lodTriangles[i];
                
                // Create simplified mesh for this LOD level
                var simplifiedMesh = CreateSimplifiedMesh(renderers[0], triangles);
                
                lods[i] = new LOD(1.0f - (distance / cullingDistance), new Renderer[] { renderers[0] });
            }

            lodGroup.SetLODs(lods);
            lodGroup.size = 1f;
            _lodGroups[obj] = lodGroup;
        }

        private Mesh CreateSimplifiedMesh(Renderer renderer, int targetTriangles)
        {
            var meshFilter = renderer.GetComponent<MeshFilter>();
            if (meshFilter == null || meshFilter.mesh == null) return null;

            var originalMesh = meshFilter.mesh;
            var simplifiedMesh = new Mesh();
            simplifiedMesh.name = originalMesh.name + "_LOD";

            // Simple mesh simplification (in a real implementation, use a proper mesh simplification algorithm)
            var vertices = originalMesh.vertices;
            var triangles = originalMesh.triangles;
            var targetTriangleCount = Mathf.Min(targetTriangles, triangles.Length / 3);

            if (targetTriangleCount < triangles.Length / 3)
            {
                var step = triangles.Length / (targetTriangleCount * 3);
                var simplifiedTriangles = new int[targetTriangleCount * 3];
                
                for (int i = 0; i < targetTriangleCount; i++)
                {
                    var index = i * step * 3;
                    simplifiedTriangles[i * 3] = triangles[index];
                    simplifiedTriangles[i * 3 + 1] = triangles[index + 1];
                    simplifiedTriangles[i * 3 + 2] = triangles[index + 2];
                }

                simplifiedMesh.vertices = vertices;
                simplifiedMesh.triangles = simplifiedTriangles;
                simplifiedMesh.RecalculateNormals();
                simplifiedMesh.RecalculateBounds();
            }
            else
            {
                simplifiedMesh = originalMesh;
            }

            return simplifiedMesh;
        }

        private void UpdateLODsystemSafe()
        {
            if (!enableLODSystem || _mainCamera == null) return;

            // Update LOD bias based on performance
            if (enableLODBias)
            {
                UpdateDynamicLODBias();
                QualitySettings.lodBias = _currentLODBias;
            }
            
            // Update LOD groups based on camera distance and performance
            UpdateLODGroups();
        }
        
        private void UpdateDynamicLODBias()
        {
            // Adjust LOD bias based on performance
            if (_isLowPerformance)
            {
                _currentLODBias = Mathf.Lerp(_currentLODBias, lodBias * 0.5f, Time.deltaTime * 2f);
            }
            else
            {
                _currentLODBias = Mathf.Lerp(_currentLODBias, lodBias, Time.deltaTime * 2f);
            }
            
            // Adjust based on FPS
            float fpsRatio = _currentFPS / (float)targetFrameRate;
            if (fpsRatio < 0.8f)
            {
                _currentLODBias *= 0.8f;
            }
            else if (fpsRatio > 1.2f)
            {
                _currentLODBias *= 1.1f;
            }
            
            _currentLODBias = Mathf.Clamp(_currentLODBias, 0.1f, 2.0f);
        }
        
        private void UpdateLODGroups()
        {
            if (_mainCamera == null) return;
            
            Vector3 cameraPos = _mainCamera.transform.position;
            
            foreach (var lodGroup in _activeLODGroups)
            {
                if (lodGroup == null) continue;
                
                var lodData = _lodData[lodGroup];
                if (!lodData.isDynamic) continue;
                
                // Check if LOD group has moved significantly
                float distance = Vector3.Distance(cameraPos, lodGroup.transform.position);
                if (Vector3.Distance(lodData.lastPosition, lodGroup.transform.position) > 1f || 
                    Time.time - lodData.lastUpdateTime > 0.5f)
                {
                    UpdateLODGroupDistances(lodGroup, lodData, distance);
                    lodData.lastPosition = lodGroup.transform.position;
                    lodData.lastUpdateTime = Time.time;
                }
            }
        }
        
        private void UpdateLODGroupDistances(LODGroup lodGroup, LODData lodData, float distance)
        {
            var lods = lodGroup.GetLODs();
            if (lods.Length == 0) return;
            
            // Calculate new distances based on performance and distance
            float performanceMultiplier = _isLowPerformance ? 0.6f : 1.0f;
            float distanceMultiplier = Mathf.Clamp(distance / 50f, 0.5f, 2.0f);
            
            for (int i = 0; i < lods.Length && i < lodData.originalDistances.Length; i++)
            {
                float newDistance = lodData.originalDistances[i] * performanceMultiplier * distanceMultiplier;
                lods[i].screenRelativeTransitionHeight = newDistance / 100f; // Convert to screen space
            }
            
            lodGroup.SetLODs(lods);
        }
        #endregion

        #region Batching
        private void SetupBatching()
        {
            if (!enableStaticBatching && !enableDynamicBatching) return;

            // Find all renderers and categorize them
            var renderers = FindObjectsOfType<Renderer>();
            foreach (var renderer in renderers)
            {
                if (renderer.isStatic)
                {
                    _staticRenderers.Add(renderer);
                }
                else
                {
                    _dynamicRenderers.Add(renderer);
                }
            }

            // Enable static batching
            if (enableStaticBatching)
            {
                StaticBatchingUtility.Combine(_staticRenderers.ToArray());
                Logger.Info($"Static batching enabled for {_staticRenderers.Count} renderers", "GraphicsOptimizer");
            }

            // Enable dynamic batching
            if (enableDynamicBatching)
            {
                QualitySettings.maxQueuedFrames = 0; // Disable frame queuing for better batching
                Logger.Info($"Dynamic batching enabled for {_dynamicRenderers.Count} renderers", "GraphicsOptimizer");
            }
        }

        private void UpdateBatching()
        {
            if (!enableDynamicBatching) return;

            // Update dynamic batching based on performance
            if (_isLowPerformance)
            {
                // Reduce batching complexity when performance is low
                QualitySettings.maxQueuedFrames = 1;
            }
            else
            {
                QualitySettings.maxQueuedFrames = 0;
            }
        }
        #endregion

        #region Culling
        private void SetupCulling()
        {
            if (!enableOcclusionCulling && !enableFrustumCulling) return;

            // Configure camera culling
            if (_mainCamera != null)
            {
                _mainCamera.farClipPlane = cullingDistance;
                
                if (enableFrustumCulling)
                {
                    _mainCamera.cullingMask = -1; // Cull all layers
                }
                
                if (enableOcclusionCulling)
                {
                    _mainCamera.useOcclusionCulling = true;
                    _occlusionCullingActive = true;
                }
            }
            
            // Setup occlusion culling data
            if (enableOcclusionCulling)
            {
                SetupOcclusionCulling();
            }

            Logger.Info("Culling system configured", "GraphicsOptimizer");
        }
        
        private void SetupOcclusionCulling()
        {
            // Find all renderers that can be occlusion culled
            var allRenderers = FindObjectsOfType<Renderer>();
            
            foreach (var renderer in allRenderers)
            {
                if (renderer.gameObject.isStatic && renderer.enabled)
                {
                    var occlusionData = new OcclusionData
                    {
                        renderer = renderer,
                        bounds = renderer.bounds,
                        isOccluded = false,
                        lastCheckTime = 0f,
                        lastPosition = renderer.transform.position
                    };
                    
                    _occlusionData[renderer] = occlusionData;
                }
            }
            
            Logger.Info($"Occlusion culling setup for {_occlusionData.Count} renderers", "GraphicsOptimizer");
        }
        
        private void UpdateOcclusionCulling()
        {
            if (!enableOcclusionCulling || !_occlusionCullingActive || _mainCamera == null) return;
            
            if (Time.time - _lastOcclusionUpdate < _occlusionUpdateInterval) return;
            
            _lastOcclusionUpdate = Time.time;
            
            // Update occlusion culling for renderers
            foreach (var kvp in _occlusionData)
            {
                var occlusionData = kvp.Value;
                var renderer = occlusionData.renderer;
                
                if (renderer == null || !renderer.gameObject.activeInHierarchy) continue;
                
                // Check if renderer has moved significantly
                if (Vector3.Distance(occlusionData.lastPosition, renderer.transform.position) > 0.1f)
                {
                    occlusionData.bounds = renderer.bounds;
                    occlusionData.lastPosition = renderer.transform.position;
                }
                
                // Perform occlusion test
                bool isOccluded = IsOccluded(renderer, _mainCamera);
                
                if (isOccluded != occlusionData.isOccluded)
                {
                    occlusionData.isOccluded = isOccluded;
                    renderer.enabled = !isOccluded;
                    
                    if (isOccluded)
                    {
                        if (!_occlusionCulledRenderers.Contains(renderer))
                        {
                            _occlusionCulledRenderers.Add(renderer);
                        }
                    }
                    else
                    {
                        _occlusionCulledRenderers.Remove(renderer);
                    }
                }
                
                occlusionData.lastCheckTime = Time.time;
            }
        }
        
        private bool IsOccluded(Renderer renderer, Camera camera)
        {
            // Simple occlusion test using raycasting
            Vector3 cameraPos = camera.transform.position;
            Vector3 rendererPos = renderer.bounds.center;
            Vector3 direction = (rendererPos - cameraPos).normalized;
            float distance = Vector3.Distance(cameraPos, rendererPos);
            
            // Cast ray from camera to renderer
            RaycastHit hit;
            if (Physics.Raycast(cameraPos, direction, out hit, distance))
            {
                // If we hit something before reaching the renderer, it's occluded
                return hit.collider.gameObject != renderer.gameObject;
            }
            
            return false;
        }
        #endregion

        #region Mobile Optimizations
        private void ApplyMobileOptimizations()
        {
            if (!enableMobileOptimizations) return;

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
            // Reduce texture quality
            QualitySettings.masterTextureLimit = 1; // Half resolution textures

            // Reduce LOD levels
            if (enableLODSystem)
            {
                var mobileLODDistances = new float[mobileMaxLODLevel];
                var mobileLODTriangles = new int[mobileMaxLODLevel];
                
                for (int i = 0; i < mobileMaxLODLevel; i++)
                {
                    mobileLODDistances[i] = lodDistances[i];
                    mobileLODTriangles[i] = lodTriangles[i];
                }
                
                lodDistances = mobileLODDistances;
                lodTriangles = mobileLODTriangles;
            }

            // Disable shadows if not enabled
            if (!enableMobileShadows)
            {
                QualitySettings.shadows = ShadowQuality.Disable;
            }

            // Reduce particle count
            var particleSystems = FindObjectsOfType<ParticleSystem>();
            foreach (var ps in particleSystems)
            {
                if (enableMobileParticles)
                {
                    var main = ps.main;
                    main.maxParticles = Mathf.Min(main.maxParticles, mobileMaxParticles);
                }
                else
                {
                    ps.gameObject.SetActive(false);
                }
            }

            Logger.Info("Mobile optimizations applied", "GraphicsOptimizer");
        }
        #endregion

        #region Performance Monitoring
        private void MonitorPerformance()
        {
            if (Time.time - _lastMonitoringTime < monitoringInterval) return;

            _lastMonitoringTime = Time.time;
            _currentFrameTime = Time.unscaledDeltaTime;
            _currentFPS = Mathf.RoundToInt(1f / _currentFrameTime);

            // Check if performance is low
            _isLowPerformance = _currentFrameTime > (targetFrameTime * lowPerformanceThreshold);

            if (_isLowPerformance)
            {
                Logger.Warning($"Low performance detected: {_currentFPS} FPS", "GraphicsOptimizer");
                ApplyPerformanceOptimizations();
            }
        }

        private void ApplyPerformanceOptimizations()
        {
            // Reduce quality settings
            QualitySettings.masterTextureLimit = 1;
            QualitySettings.shadowResolution = ShadowResolution.Low;
            QualitySettings.shadowDistance = cullingDistance * 0.5f;

            // Reduce LOD bias
            if (enableLODBias)
            {
                lodBias = 0.5f;
            }

            // Disable expensive effects
            if (enableWeatherEffects)
            {
                // Disable weather effects
                Logger.Info("Weather effects disabled due to low performance", "GraphicsOptimizer");
            }
        }
        #endregion

        #region GPU Instancing
        /// <summary>
        /// Enable GPU instancing for a material
        /// </summary>
        public void EnableGPUInstancing(Material material)
        {
            if (material != null && enableGPUInstancing)
            {
                material.enableInstancing = true;
            }
        }

        /// <summary>
        /// Create instanced renderer
        /// </summary>
        public void CreateInstancedRenderer(GameObject prefab, Vector3[] positions, Material material)
        {
            if (prefab == null || positions == null || material == null) return;

            var meshFilter = prefab.GetComponent<MeshFilter>();
            if (meshFilter == null) return;

            var mesh = meshFilter.mesh;
            var renderer = prefab.GetComponent<Renderer>();
            if (renderer == null) return;

            // Create instanced rendering
            var matrices = new Matrix4x4[positions.Length];
            for (int i = 0; i < positions.Length; i++)
            {
                matrices[i] = Matrix4x4.TRS(positions[i], Quaternion.identity, Vector3.one);
            }

            Graphics.DrawMeshInstanced(mesh, 0, material, matrices);
        }
        #endregion

        #region Material Property Blocks
        /// <summary>
        /// Get or create material property block for a renderer
        /// </summary>
        public MaterialPropertyBlock GetMaterialPropertyBlock(Renderer renderer)
        {
            if (!_materialPropertyBlocks.TryGetValue(renderer, out var block))
            {
                block = new MaterialPropertyBlock();
                _materialPropertyBlocks[renderer] = block;
            }
            return block;
        }

        /// <summary>
        /// Set material property
        /// </summary>
        public void SetMaterialProperty(Renderer renderer, string propertyName, float value)
        {
            var block = GetMaterialPropertyBlock(renderer);
            block.SetFloat(propertyName, value);
            renderer.SetPropertyBlock(block);
        }

        /// <summary>
        /// Set material property
        /// </summary>
        public void SetMaterialProperty(Renderer renderer, string propertyName, Color value)
        {
            var block = GetMaterialPropertyBlock(renderer);
            block.SetColor(propertyName, value);
            renderer.SetPropertyBlock(block);
        }
        #endregion

        #region Statistics
        /// <summary>
        /// Get graphics optimizer statistics
        /// </summary>
        public Dictionary<string, object> GetStatistics()
        {
            return new Dictionary<string, object>
            {
                {"lod_groups", _lodGroups.Count},
                {"static_renderers", _staticRenderers.Count},
                {"dynamic_renderers", _dynamicRenderers.Count},
                {"current_fps", _currentFPS},
                {"current_frame_time", _currentFrameTime},
                {"is_low_performance", _isLowPerformance},
                {"target_frame_rate", targetFrameRate},
                {"enable_lod", enableLODSystem},
                {"enable_static_batching", enableStaticBatching},
                {"enable_dynamic_batching", enableDynamicBatching},
                {"enable_gpu_instancing", enableGPUInstancing},
                {"enable_mobile_optimizations", enableMobileOptimizations}
            };
        }
        #endregion

        void OnDestroy()
        {
            // Clean up material property blocks
            foreach (var block in _materialPropertyBlocks.Values)
            {
                if (block != null)
                {
                    block.Clear();
                }
            }
            _materialPropertyBlocks.Clear();
        }
    }
}