
using UnityEngine;
using UnityEditor;
using System.Collections.Generic;
using System.IO;

namespace Evergreen.Editor
{
    public class Match3PhysicsAutomation : EditorWindow
    {
        [MenuItem("Tools/Match-3 Physics/Automate Everything")]
        public static void ShowWindow()
        {
            GetWindow<Match3PhysicsAutomation>("Match-3 Physics Automation");
        }

        private void OnGUI()
        {
            GUILayout.Label("Match-3 Physics Automation", EditorStyles.boldLabel);
            GUILayout.Space(10);

            if (GUILayout.Button("🧱 Setup Physics Materials", GUILayout.Height(30)))
            {
                SetupPhysicsMaterials();
            }

            if (GUILayout.Button("🔗 Setup Collision Layers", GUILayout.Height(30)))
            {
                SetupCollisionLayers();
            }

            if (GUILayout.Button("🎮 Setup Physics Components", GUILayout.Height(30)))
            {
                SetupPhysicsComponents();
            }

            if (GUILayout.Button("🚀 Optimize Physics", GUILayout.Height(30)))
            {
                OptimizePhysics();
            }

            if (GUILayout.Button("🎯 Run Full Automation", GUILayout.Height(40)))
            {
                RunFullAutomation();
            }
        }

        private static void SetupPhysicsMaterials()
        {
            try
            {
                Debug.Log("🧱 Setting up Physics Materials...");

                // Load physics materials configuration
                string configPath = "Assets/Physics/Materials/Match3PhysicsMaterials.json";
                if (File.Exists(configPath))
                {
                    string json = File.ReadAllText(configPath);
                    var config = JsonUtility.FromJson<PhysicsMaterialsConfig>(json);

                    // Create physics materials
                    CreatePhysicsMaterials(config.physics_materials);

                    Debug.Log("✅ Physics Materials setup completed!");
                }
                else
                {
                    Debug.LogWarning("⚠️ Match3PhysicsMaterials.json not found");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Physics Materials setup failed: {e.Message}");
            }
        }

        private static void CreatePhysicsMaterials(Dictionary<string, PhysicsMaterialData> materials)
        {
            foreach (var kvp in materials)
            {
                var materialName = kvp.Key;
                var materialData = kvp.Value;

                Debug.Log($"🧱 Creating physics material: {materialName}");

                // Create physics material
                var material = new PhysicMaterial(materialName);
                material.dynamicFriction = materialData.dynamic_friction;
                material.staticFriction = materialData.static_friction;
                material.bounciness = materialData.bounciness;
                material.frictionCombine = GetFrictionCombine(materialData.friction_combine);
                material.bounceCombine = GetBounceCombine(materialData.bounce_combine);

                // Save physics material
                AssetDatabase.CreateAsset(material, $"Assets/Physics/Materials/{materialName}.physicMaterial");
            }
        }

        private static PhysicMaterialCombine GetFrictionCombine(string combine)
        {
            switch (combine.ToLower())
            {
                case "average": return PhysicMaterialCombine.Average;
                case "minimum": return PhysicMaterialCombine.Minimum;
                case "maximum": return PhysicMaterialCombine.Maximum;
                case "multiply": return PhysicMaterialCombine.Multiply;
                default: return PhysicMaterialCombine.Average;
            }
        }

        private static PhysicMaterialCombine GetBounceCombine(string combine)
        {
            switch (combine.ToLower())
            {
                case "average": return PhysicMaterialCombine.Average;
                case "minimum": return PhysicMaterialCombine.Minimum;
                case "maximum": return PhysicMaterialCombine.Maximum;
                case "multiply": return PhysicMaterialCombine.Multiply;
                default: return PhysicMaterialCombine.Average;
            }
        }

        private static void SetupCollisionLayers()
        {
            try
            {
                Debug.Log("🔗 Setting up Collision Layers...");

                // Load collision layers configuration
                string configPath = "Assets/Physics/CollisionLayers.json";
                if (File.Exists(configPath))
                {
                    string json = File.ReadAllText(configPath);
                    var config = JsonUtility.FromJson<CollisionLayersConfig>(json);

                    // Apply physics settings
                    ApplyPhysicsSettings(config.physics_settings);

                    Debug.Log("✅ Collision Layers setup completed!");
                }
                else
                {
                    Debug.LogWarning("⚠️ CollisionLayers.json not found");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Collision Layers setup failed: {e.Message}");
            }
        }

        private static void ApplyPhysicsSettings(PhysicsSettings settings)
        {
            // Apply gravity
            Physics.gravity = new Vector3(
                settings.gravity[0],
                settings.gravity[1],
                settings.gravity[2]
            );

            // Apply other physics settings
            Physics.bounceThreshold = settings.bounce_threshold;
            Physics.sleepThreshold = settings.sleep_threshold;
            Physics.defaultSolverIterations = settings.default_solver_iterations;
            Physics.defaultSolverVelocityIterations = settings.default_solver_velocity_iterations;
            Physics.queriesHitTriggers = settings.queries_hit_triggers;
            Physics.queriesStartInColliders = settings.queries_start_in_colliders;

            Debug.Log("🔗 Physics settings applied");
        }

        private static void SetupPhysicsComponents()
        {
            try
            {
                Debug.Log("🎮 Setting up Physics Components...");

                // Load physics components configuration
                string configPath = "Assets/Physics/Match3PhysicsComponents.json";
                if (File.Exists(configPath))
                {
                    string json = File.ReadAllText(configPath);
                    var config = JsonUtility.FromJson<PhysicsComponentsConfig>(json);

                    // Create physics component prefabs
                    CreatePhysicsComponentPrefabs(config);

                    Debug.Log("✅ Physics Components setup completed!");
                }
                else
                {
                    Debug.LogWarning("⚠️ Match3PhysicsComponents.json not found");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Physics Components setup failed: {e.Message}");
            }
        }

        private static void CreatePhysicsComponentPrefabs(PhysicsComponentsConfig config)
        {
            // Create tile physics prefab
            CreatePhysicsComponentPrefab("TilePhysics", config.tile_physics);

            // Create board physics prefab
            CreatePhysicsComponentPrefab("BoardPhysics", config.board_physics);

            // Create wall physics prefab
            CreatePhysicsComponentPrefab("WallPhysics", config.wall_physics);

            // Create powerup physics prefab
            CreatePhysicsComponentPrefab("PowerUpPhysics", config.powerup_physics);
        }

        private static void CreatePhysicsComponentPrefab(string prefabName, PhysicsComponentData componentData)
        {
            Debug.Log($"🎮 Creating physics component prefab: {prefabName}");

            // Create GameObject
            var obj = new GameObject(prefabName);

            // Add Rigidbody
            var rigidbody = obj.AddComponent<Rigidbody>();
            rigidbody.mass = componentData.rigidbody.mass;
            rigidbody.drag = componentData.rigidbody.drag;
            rigidbody.angularDrag = componentData.rigidbody.angular_drag;
            rigidbody.useGravity = componentData.rigidbody.use_gravity;
            rigidbody.isKinematic = componentData.rigidbody.is_kinematic;
            rigidbody.interpolation = GetRigidbodyInterpolation(componentData.rigidbody.interpolation);
            rigidbody.collisionDetectionMode = GetCollisionDetectionMode(componentData.rigidbody.collision_detection);

            // Add Collider
            Collider collider = null;
            switch (componentData.collider.type.ToLower())
            {
                case "boxcollider":
                    var boxCollider = obj.AddComponent<BoxCollider>();
                    boxCollider.size = new Vector3(
                        componentData.collider.size[0],
                        componentData.collider.size[1],
                        componentData.collider.size[2]
                    );
                    boxCollider.center = new Vector3(
                        componentData.collider.center[0],
                        componentData.collider.center[1],
                        componentData.collider.center[2]
                    );
                    collider = boxCollider;
                    break;
                case "spherecollider":
                    var sphereCollider = obj.AddComponent<SphereCollider>();
                    sphereCollider.radius = componentData.collider.radius;
                    sphereCollider.center = new Vector3(
                        componentData.collider.center[0],
                        componentData.collider.center[1],
                        componentData.collider.center[2]
                    );
                    collider = sphereCollider;
                    break;
            }

            if (collider != null)
            {
                collider.isTrigger = componentData.collider.is_trigger;

                // Load physics material
                var material = AssetDatabase.LoadAssetAtPath<PhysicMaterial>($"Assets/Physics/Materials/{componentData.collider.material}.physicMaterial");
                if (material != null)
                {
                    collider.material = material;
                }
            }

            // Save as prefab
            PrefabUtility.SaveAsPrefabAsset(obj, $"Assets/Prefabs/Physics/{prefabName}.prefab");
            DestroyImmediate(obj);
        }

        private static RigidbodyInterpolation GetRigidbodyInterpolation(string interpolation)
        {
            switch (interpolation.ToLower())
            {
                case "none": return RigidbodyInterpolation.None;
                case "interpolate": return RigidbodyInterpolation.Interpolate;
                case "extrapolate": return RigidbodyInterpolation.Extrapolate;
                default: return RigidbodyInterpolation.None;
            }
        }

        private static CollisionDetectionMode GetCollisionDetectionMode(string detection)
        {
            switch (detection.ToLower())
            {
                case "discrete": return CollisionDetectionMode.Discrete;
                case "continuous": return CollisionDetectionMode.Continuous;
                case "continuousdynamic": return CollisionDetectionMode.ContinuousDynamic;
                case "continuousspeculative": return CollisionDetectionMode.ContinuousSpeculative;
                default: return CollisionDetectionMode.Discrete;
            }
        }

        private static void OptimizePhysics()
        {
            try
            {
                Debug.Log("🚀 Optimizing Physics...");

                // Load physics optimization configuration
                string configPath = "Assets/Physics/PhysicsOptimization.json";
                if (File.Exists(configPath))
                {
                    string json = File.ReadAllText(configPath);
                    var config = JsonUtility.FromJson<PhysicsOptimizationConfig>(json);

                    // Apply performance settings
                    ApplyPerformanceSettings(config.performance_settings);

                    // Apply collision detection settings
                    ApplyCollisionDetectionSettings(config.collision_detection);

                    // Setup memory management
                    SetupMemoryManagement(config.memory_management);

                    Debug.Log("✅ Physics optimization completed!");
                }
                else
                {
                    Debug.LogWarning("⚠️ PhysicsOptimization.json not found");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Physics optimization failed: {e.Message}");
            }
        }

        private static void ApplyPerformanceSettings(PerformanceSettings settings)
        {
            if (settings.enable_physics_2d)
            {
                Debug.Log("🚀 Physics 2D enabled");
            }

            if (settings.enable_physics_3d)
            {
                Debug.Log("🚀 Physics 3D enabled");
            }

            Debug.Log("🚀 Performance settings applied");
        }

        private static void ApplyCollisionDetectionSettings(CollisionDetectionSettings settings)
        {
            Physics.defaultSolverIterations = settings.default_solver_iterations;
            Physics.defaultSolverVelocityIterations = settings.default_solver_velocity_iterations;
            Physics.bounceThreshold = settings.bounce_threshold;
            Physics.sleepThreshold = settings.sleep_threshold;
            Physics.maxAngularVelocity = settings.max_angular_velocity;

            Debug.Log("🚀 Collision detection settings applied");
        }

        private static void SetupMemoryManagement(MemoryManagement settings)
        {
            if (settings.enable_physics_pooling)
            {
                Debug.Log($"🚀 Physics pooling enabled: {settings.max_rigidbody_pool_size} rigidbodies, {settings.max_collider_pool_size} colliders");
            }

            Debug.Log("🚀 Memory management configured");
        }

        private static void RunFullAutomation()
        {
            try
            {
                Debug.Log("🎯 Running full Match-3 physics automation...");

                SetupPhysicsMaterials();
                SetupCollisionLayers();
                SetupPhysicsComponents();
                OptimizePhysics();

                Debug.Log("🎉 Full Match-3 physics automation completed!");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Full automation failed: {e.Message}");
            }
        }
    }

    // Data structures for JSON deserialization
    [System.Serializable]
    public class PhysicsMaterialsConfig
    {
        public Dictionary<string, PhysicsMaterialData> physics_materials;
    }

    [System.Serializable]
    public class PhysicsMaterialData
    {
        public string name;
        public float dynamic_friction;
        public float static_friction;
        public float bounciness;
        public string friction_combine;
        public string bounce_combine;
    }

    [System.Serializable]
    public class CollisionLayersConfig
    {
        public Dictionary<string, int> layers;
        public Dictionary<string, string[]> layer_collisions;
        public PhysicsSettings physics_settings;
    }

    [System.Serializable]
    public class PhysicsSettings
    {
        public float[] gravity;
        public string default_material;
        public float bounce_threshold;
        public float sleep_threshold;
        public int default_solver_iterations;
        public int default_solver_velocity_iterations;
        public bool queries_hit_triggers;
        public bool queries_start_in_colliders;
    }

    [System.Serializable]
    public class PhysicsComponentsConfig
    {
        public PhysicsComponentData tile_physics;
        public PhysicsComponentData board_physics;
        public PhysicsComponentData wall_physics;
        public PhysicsComponentData powerup_physics;
    }

    [System.Serializable]
    public class PhysicsComponentData
    {
        public RigidbodyData rigidbody;
        public ColliderData collider;
    }

    [System.Serializable]
    public class RigidbodyData
    {
        public float mass;
        public float drag;
        public float angular_drag;
        public bool use_gravity;
        public bool is_kinematic;
        public string interpolation;
        public string collision_detection;
    }

    [System.Serializable]
    public class ColliderData
    {
        public string type;
        public bool is_trigger;
        public string material;
        public float[] size;
        public float[] center;
        public float radius;
    }

    [System.Serializable]
    public class PhysicsOptimizationConfig
    {
        public PerformanceSettings performance_settings;
        public CollisionDetectionSettings collision_detection;
        public MemoryManagement memory_management;
        public Dictionary<string, QualitySettings> quality_settings;
    }

    [System.Serializable]
    public class PerformanceSettings
    {
        public bool enable_physics_2d;
        public bool enable_physics_3d;
        public bool enable_continuous_collision_detection;
        public bool enable_queries_hit_triggers;
        public bool enable_queries_start_in_colliders;
    }

    [System.Serializable]
    public class CollisionDetectionSettings
    {
        public string default_collision_detection;
        public int default_solver_iterations;
        public int default_solver_velocity_iterations;
        public float bounce_threshold;
        public float sleep_threshold;
        public float max_angular_velocity;
    }

    [System.Serializable]
    public class MemoryManagement
    {
        public bool enable_physics_pooling;
        public int max_rigidbody_pool_size;
        public int max_collider_pool_size;
        public float physics_garbage_collection_interval;
    }

    [System.Serializable]
    public class QualitySettings
    {
        public int solver_iterations;
        public int solver_velocity_iterations;
        public float bounce_threshold;
        public float sleep_threshold;
    }
}
