using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;

namespace Evergreen.Graphics
{
    public class ProceduralGemGenerator : MonoBehaviour
    {
        [Header("Generation Settings")]
        public int maxUniqueGems = 10000;
        public Material baseGemMaterial;
        public ComputeShader generationShader;
        
        [Header("Gem Properties")]
        public float minSize = 0.8f;
        public float maxSize = 1.2f;
        public float minRoughness = 0.1f;
        public float maxRoughness = 0.9f;
        public float minMetallic = 0.0f;
        public float maxMetallic = 1.0f;
        
        [Header("Color Generation")]
        public bool enableHueVariation = true;
        public bool enableSaturationVariation = true;
        public bool enableValueVariation = true;
        public float hueVariationRange = 0.1f;
        public float saturationVariationRange = 0.2f;
        public float valueVariationRange = 0.1f;
        
        private Dictionary<string, GameObject> generatedGems = new Dictionary<string, GameObject>();
        private Dictionary<string, Material> generatedMaterials = new Dictionary<string, Material>();
        private int gemCounter = 0;
        private ComputeBuffer gemDataBuffer;
        private GemData[] gemDataArray;
        
        [System.Serializable]
        public struct GemData
        {
            public Vector3 position;
            public Vector3 rotation;
            public Vector3 scale;
            public Vector4 color;
            public float roughness;
            public float metallic;
            public float emission;
            public int gemType;
        }
        
        public void Initialize(int maxGems, Material baseMaterial, ComputeShader shader)
        {
            maxUniqueGems = maxGems;
            baseGemMaterial = baseMaterial;
            generationShader = shader;
            
            // Initialize compute buffer
            gemDataArray = new GemData[maxUniqueGems];
            gemDataBuffer = new ComputeBuffer(maxUniqueGems, System.Runtime.InteropServices.Marshal.SizeOf(typeof(GemData)));
            
            // Pre-generate some gems
            PreGenerateGems(100);
        }
        
        private void PreGenerateGems(int count)
        {
            for (int i = 0; i < count; i++)
            {
                GenerateRandomGem();
            }
        }
        
        public GameObject CreateUniqueGem(Vector3 position, GemType gemType, int colorIndex)
        {
            var gemKey = $"{gemType}_{colorIndex}_{gemCounter}";
            gemCounter++;
            
            if (generatedGems.ContainsKey(gemKey))
            {
                var existingGem = generatedGems[gemKey];
                var newGem = Instantiate(existingGem, position, Quaternion.identity);
                newGem.name = $"{gemKey}_{Time.time}";
                return newGem;
            }
            
            var gem = GenerateNewGem(gemKey, position, gemType, colorIndex);
            if (gem != null)
            {
                generatedGems[gemKey] = gem;
            }
            
            return gem;
        }
        
        private GameObject GenerateNewGem(string gemKey, Vector3 position, GemType gemType, int colorIndex)
        {
            // Create gem GameObject
            var gemGO = new GameObject($"Gem_{gemKey}");
            gemGO.transform.position = position;
            
            // Add mesh components
            var meshFilter = gemGO.AddComponent<MeshFilter>();
            var meshRenderer = gemGO.AddComponent<MeshRenderer>();
            var collider = gemGO.AddComponent<MeshCollider>();
            
            // Generate unique mesh
            var mesh = GenerateGemMesh(gemType);
            meshFilter.mesh = mesh;
            collider.sharedMesh = mesh;
            
            // Generate unique material
            var material = GenerateGemMaterial(gemKey, gemType, colorIndex);
            meshRenderer.material = material;
            
            // Add gem properties
            var gemProperties = gemGO.AddComponent<GemProperties>();
            gemProperties.Initialize(gemType, colorIndex, material);
            
            // Add physics
            var rigidbody = gemGO.AddComponent<Rigidbody>();
            rigidbody.mass = 1.0f;
            rigidbody.drag = 0.5f;
            rigidbody.angularDrag = 0.5f;
            
            // Add visual effects
            AddVisualEffects(gemGO, gemType);
            
            return gemGO;
        }
        
        private Mesh GenerateGemMesh(GemType gemType)
        {
            var mesh = new Mesh();
            
            switch (gemType)
            {
                case GemType.Normal:
                    mesh = GenerateNormalGemMesh();
                    break;
                case GemType.Rocket:
                    mesh = GenerateRocketGemMesh();
                    break;
                case GemType.Bomb:
                    mesh = GenerateBombGemMesh();
                    break;
                case GemType.ColorBomb:
                    mesh = GenerateColorBombGemMesh();
                    break;
                case GemType.Lightning:
                    mesh = GenerateLightningGemMesh();
                    break;
                case GemType.Fire:
                    mesh = GenerateFireGemMesh();
                    break;
                case GemType.Ice:
                    mesh = GenerateIceGemMesh();
                    break;
                case GemType.Earth:
                    mesh = GenerateEarthGemMesh();
                    break;
                case GemType.Air:
                    mesh = GenerateAirGemMesh();
                    break;
                case GemType.Water:
                    mesh = GenerateWaterGemMesh();
                    break;
            }
            
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            
            return mesh;
        }
        
        private Mesh GenerateNormalGemMesh()
        {
            // Generate a basic gem shape
            var vertices = new Vector3[]
            {
                new Vector3(0, 0.5f, 0),      // Top
                new Vector3(-0.5f, 0, -0.5f), // Bottom left back
                new Vector3(0.5f, 0, -0.5f),  // Bottom right back
                new Vector3(0.5f, 0, 0.5f),   // Bottom right front
                new Vector3(-0.5f, 0, 0.5f),  // Bottom left front
                new Vector3(0, -0.5f, 0)      // Bottom
            };
            
            var triangles = new int[]
            {
                0, 1, 2,  // Top face 1
                0, 2, 3,  // Top face 2
                0, 3, 4,  // Top face 3
                0, 4, 1,  // Top face 4
                5, 2, 1,  // Bottom face 1
                5, 3, 2,  // Bottom face 2
                5, 4, 3,  // Bottom face 3
                5, 1, 4   // Bottom face 4
            };
            
            var mesh = new Mesh();
            mesh.vertices = vertices;
            mesh.triangles = triangles;
            
            return mesh;
        }
        
        private Mesh GenerateRocketGemMesh()
        {
            // Generate rocket-shaped gem
            var vertices = new List<Vector3>();
            var triangles = new List<int>();
            
            // Create rocket body (cylinder)
            int segments = 8;
            float height = 1.0f;
            float radius = 0.3f;
            
            // Top and bottom centers
            vertices.Add(new Vector3(0, height, 0)); // Top center
            vertices.Add(new Vector3(0, -height, 0)); // Bottom center
            
            // Create ring vertices
            for (int i = 0; i < segments; i++)
            {
                float angle = (float)i / segments * Mathf.PI * 2;
                float x = Mathf.Cos(angle) * radius;
                float z = Mathf.Sin(angle) * radius;
                
                vertices.Add(new Vector3(x, height, z));
                vertices.Add(new Vector3(x, -height, z));
            }
            
            // Create triangles
            for (int i = 0; i < segments; i++)
            {
                int next = (i + 1) % segments;
                int top1 = 2 + i * 2;
                int top2 = 2 + next * 2;
                int bottom1 = 2 + i * 2 + 1;
                int bottom2 = 2 + next * 2 + 1;
                
                // Top cap
                triangles.Add(0);
                triangles.Add(top2);
                triangles.Add(top1);
                
                // Bottom cap
                triangles.Add(1);
                triangles.Add(bottom1);
                triangles.Add(bottom2);
                
                // Side faces
                triangles.Add(top1);
                triangles.Add(top2);
                triangles.Add(bottom1);
                
                triangles.Add(top2);
                triangles.Add(bottom2);
                triangles.Add(bottom1);
            }
            
            var mesh = new Mesh();
            mesh.vertices = vertices.ToArray();
            mesh.triangles = triangles.ToArray();
            
            return mesh;
        }
        
        private Mesh GenerateBombGemMesh()
        {
            // Generate spherical bomb
            return GenerateSphereMesh(0.5f, 16, 16);
        }
        
        private Mesh GenerateColorBombGemMesh()
        {
            // Generate multi-faceted gem
            return GenerateDiamondMesh(0.6f, 12);
        }
        
        private Mesh GenerateLightningGemMesh()
        {
            // Generate jagged lightning shape
            var vertices = new Vector3[]
            {
                new Vector3(0, 0.5f, 0),
                new Vector3(-0.3f, 0.2f, 0),
                new Vector3(0.3f, -0.1f, 0),
                new Vector3(-0.2f, -0.3f, 0),
                new Vector3(0.2f, -0.5f, 0),
                new Vector3(0, -0.5f, 0)
            };
            
            var triangles = new int[]
            {
                0, 1, 2,
                1, 3, 2,
                2, 3, 4,
                3, 5, 4
            };
            
            var mesh = new Mesh();
            mesh.vertices = vertices;
            mesh.triangles = triangles;
            
            return mesh;
        }
        
        private Mesh GenerateFireGemMesh()
        {
            // Generate flame-like shape
            return GenerateNormalGemMesh(); // Simplified for now
        }
        
        private Mesh GenerateIceGemMesh()
        {
            // Generate crystalline ice shape
            return GenerateDiamondMesh(0.5f, 8);
        }
        
        private Mesh GenerateEarthGemMesh()
        {
            // Generate rocky, irregular shape
            return GenerateNormalGemMesh(); // Simplified for now
        }
        
        private Mesh GenerateAirGemMesh()
        {
            // Generate ethereal, wispy shape
            return GenerateNormalGemMesh(); // Simplified for now
        }
        
        private Mesh GenerateWaterGemMesh()
        {
            // Generate fluid, flowing shape
            return GenerateSphereMesh(0.4f, 12, 12);
        }
        
        private Mesh GenerateSphereMesh(float radius, int rings, int segments)
        {
            var vertices = new List<Vector3>();
            var triangles = new List<int>();
            
            // Generate vertices
            for (int i = 0; i <= rings; i++)
            {
                float v = (float)i / rings;
                float phi = v * Mathf.PI;
                
                for (int j = 0; j <= segments; j++)
                {
                    float u = (float)j / segments;
                    float theta = u * Mathf.PI * 2;
                    
                    float x = Mathf.Sin(phi) * Mathf.Cos(theta) * radius;
                    float y = Mathf.Cos(phi) * radius;
                    float z = Mathf.Sin(phi) * Mathf.Sin(theta) * radius;
                    
                    vertices.Add(new Vector3(x, y, z));
                }
            }
            
            // Generate triangles
            for (int i = 0; i < rings; i++)
            {
                for (int j = 0; j < segments; j++)
                {
                    int current = i * (segments + 1) + j;
                    int next = current + segments + 1;
                    
                    triangles.Add(current);
                    triangles.Add(next);
                    triangles.Add(current + 1);
                    
                    triangles.Add(current + 1);
                    triangles.Add(next);
                    triangles.Add(next + 1);
                }
            }
            
            var mesh = new Mesh();
            mesh.vertices = vertices.ToArray();
            mesh.triangles = triangles.ToArray();
            
            return mesh;
        }
        
        private Mesh GenerateDiamondMesh(float size, int facets)
        {
            var vertices = new List<Vector3>();
            var triangles = new List<int>();
            
            // Top point
            vertices.Add(new Vector3(0, size, 0));
            
            // Middle ring
            for (int i = 0; i < facets; i++)
            {
                float angle = (float)i / facets * Mathf.PI * 2;
                float x = Mathf.Cos(angle) * size * 0.5f;
                float z = Mathf.Sin(angle) * size * 0.5f;
                vertices.Add(new Vector3(x, 0, z));
            }
            
            // Bottom point
            vertices.Add(new Vector3(0, -size, 0));
            
            // Create triangles
            for (int i = 0; i < facets; i++)
            {
                int next = (i + 1) % facets;
                
                // Top faces
                triangles.Add(0);
                triangles.Add(i + 1);
                triangles.Add(next + 1);
                
                // Bottom faces
                triangles.Add(vertices.Count - 1);
                triangles.Add(next + 1);
                triangles.Add(i + 1);
            }
            
            var mesh = new Mesh();
            mesh.vertices = vertices.ToArray();
            mesh.triangles = triangles.ToArray();
            
            return mesh;
        }
        
        private Material GenerateGemMaterial(string gemKey, GemType gemType, int colorIndex)
        {
            if (generatedMaterials.ContainsKey(gemKey))
            {
                return generatedMaterials[gemKey];
            }
            
            var material = new Material(baseGemMaterial);
            
            // Generate unique color
            var color = GenerateUniqueColor(gemType, colorIndex);
            material.color = color;
            
            // Generate unique properties
            var roughness = UnityEngine.Random.Range(minRoughness, maxRoughness);
            var metallic = UnityEngine.Random.Range(minMetallic, maxMetallic);
            var emission = UnityEngine.Random.Range(0.0f, 0.5f);
            
            material.SetFloat("_Roughness", roughness);
            material.SetFloat("_Metallic", metallic);
            material.SetFloat("_Emission", emission);
            
            // Add gem-specific properties
            switch (gemType)
            {
                case GemType.Lightning:
                    material.SetFloat("_Emission", 1.0f);
                    material.EnableKeyword("_EMISSION");
                    break;
                case GemType.Fire:
                    material.SetFloat("_Emission", 0.8f);
                    material.EnableKeyword("_EMISSION");
                    break;
                case GemType.Ice:
                    material.SetFloat("_Roughness", 0.1f);
                    material.SetFloat("_Metallic", 0.0f);
                    break;
            }
            
            generatedMaterials[gemKey] = material;
            return material;
        }
        
        private Color GenerateUniqueColor(GemType gemType, int colorIndex)
        {
            var baseColor = GetBaseColor(colorIndex);
            
            if (enableHueVariation)
            {
                float hue, saturation, value;
                Color.RGBToHSV(baseColor, out hue, out saturation, out value);
                
                hue += UnityEngine.Random.Range(-hueVariationRange, hueVariationRange);
                hue = Mathf.Repeat(hue, 1.0f);
                
                if (enableSaturationVariation)
                {
                    saturation += UnityEngine.Random.Range(-saturationVariationRange, saturationVariationRange);
                    saturation = Mathf.Clamp01(saturation);
                }
                
                if (enableValueVariation)
                {
                    value += UnityEngine.Random.Range(-valueVariationRange, valueVariationRange);
                    value = Mathf.Clamp01(value);
                }
                
                baseColor = Color.HSVToRGB(hue, saturation, value);
            }
            
            return baseColor;
        }
        
        private Color GetBaseColor(int colorIndex)
        {
            var colors = new Color[]
            {
                Color.red,
                Color.blue,
                Color.green,
                Color.yellow,
                Color.magenta,
                Color.cyan,
                Color.white,
                new Color(1f, 0.5f, 0f), // Orange
                new Color(0.5f, 0f, 1f), // Purple
                new Color(0f, 0.5f, 0.5f) // Teal
            };
            
            return colors[colorIndex % colors.Length];
        }
        
        private void AddVisualEffects(GameObject gem, GemType gemType)
        {
            switch (gemType)
            {
                case GemType.Lightning:
                    AddLightningEffect(gem);
                    break;
                case GemType.Fire:
                    AddFireEffect(gem);
                    break;
                case GemType.Ice:
                    AddIceEffect(gem);
                    break;
                case GemType.Water:
                    AddWaterEffect(gem);
                    break;
            }
        }
        
        private void AddLightningEffect(GameObject gem)
        {
            var particleSystem = gem.AddComponent<ParticleSystem>();
            var main = particleSystem.main;
            main.startLifetime = 0.5f;
            main.startSpeed = 2.0f;
            main.startSize = 0.1f;
            main.startColor = Color.yellow;
            main.maxParticles = 20;
            
            var emission = particleSystem.emission;
            emission.rateOverTime = 10.0f;
        }
        
        private void AddFireEffect(GameObject gem)
        {
            var particleSystem = gem.AddComponent<ParticleSystem>();
            var main = particleSystem.main;
            main.startLifetime = 1.0f;
            main.startSpeed = 1.0f;
            main.startSize = 0.2f;
            main.startColor = Color.red;
            main.maxParticles = 30;
            
            var emission = particleSystem.emission;
            emission.rateOverTime = 15.0f;
        }
        
        private void AddIceEffect(GameObject gem)
        {
            var particleSystem = gem.AddComponent<ParticleSystem>();
            var main = particleSystem.main;
            main.startLifetime = 2.0f;
            main.startSpeed = 0.5f;
            main.startSize = 0.05f;
            main.startColor = Color.cyan;
            main.maxParticles = 10;
            
            var emission = particleSystem.emission;
            emission.rateOverTime = 5.0f;
        }
        
        private void AddWaterEffect(GameObject gem)
        {
            var particleSystem = gem.AddComponent<ParticleSystem>();
            var main = particleSystem.main;
            main.startLifetime = 1.5f;
            main.startSpeed = 1.5f;
            main.startSize = 0.15f;
            main.startColor = Color.blue;
            main.maxParticles = 25;
            
            var emission = particleSystem.emission;
            emission.rateOverTime = 12.0f;
        }
        
        private GameObject GenerateRandomGem()
        {
            var gemType = (GemType)UnityEngine.Random.Range(0, System.Enum.GetValues(typeof(GemType)).Length);
            var colorIndex = UnityEngine.Random.Range(0, 10);
            var position = Vector3.zero;
            
            return CreateUniqueGem(position, gemType, colorIndex);
        }
        
        void OnDestroy()
        {
            if (gemDataBuffer != null)
            {
                gemDataBuffer.Release();
            }
        }
    }
    
    public class GemProperties : MonoBehaviour
    {
        public GemType gemType;
        public int colorIndex;
        public Material gemMaterial;
        public float value;
        public float rarity;
        
        public void Initialize(GemType type, int color, Material material)
        {
            gemType = type;
            colorIndex = color;
            gemMaterial = material;
            value = CalculateValue();
            rarity = CalculateRarity();
        }
        
        private float CalculateValue()
        {
            float baseValue = 1.0f;
            
            switch (gemType)
            {
                case GemType.Normal:
                    baseValue = 1.0f;
                    break;
                case GemType.Rocket:
                    baseValue = 2.0f;
                    break;
                case GemType.Bomb:
                    baseValue = 3.0f;
                    break;
                case GemType.ColorBomb:
                    baseValue = 5.0f;
                    break;
                case GemType.Lightning:
                    baseValue = 4.0f;
                    break;
                case GemType.Fire:
                    baseValue = 3.5f;
                    break;
                case GemType.Ice:
                    baseValue = 3.5f;
                    break;
                case GemType.Earth:
                    baseValue = 3.5f;
                    break;
                case GemType.Air:
                    baseValue = 3.5f;
                    break;
                case GemType.Water:
                    baseValue = 3.5f;
                    break;
            }
            
            return baseValue * (1.0f + UnityEngine.Random.Range(0.0f, 0.5f));
        }
        
        private float CalculateRarity()
        {
            switch (gemType)
            {
                case GemType.Normal:
                    return 0.5f;
                case GemType.Rocket:
                    return 0.7f;
                case GemType.Bomb:
                    return 0.8f;
                case GemType.ColorBomb:
                    return 1.0f;
                default:
                    return 0.9f;
            }
        }
    }
}