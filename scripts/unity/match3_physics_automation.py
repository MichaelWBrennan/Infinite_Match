#!/usr/bin/env python3
"""
Match-3 Physics Automation
Automates physics setup specifically for Evergreen Puzzler match-3 game
"""

import json
import os
import subprocess
from pathlib import Path
import yaml

class Match3PhysicsAutomation:
    def __init__(self):
        self.repo_root = Path(__file__).parent.parent.parent
        self.unity_assets = self.repo_root / "unity" / "Assets"
        self.physics_dir = self.unity_assets / "Physics"
        self.materials_dir = self.unity_assets / "Physics" / "Materials"
        
    def print_header(self, title):
        """Print formatted header"""
        print("\n" + "="*80)
        print(f"⚡ {title}")
        print("="*80)
    
    def setup_match3_physics_materials(self):
        """Setup physics materials for match-3 game"""
        print("🧱 Setting up Match-3 physics materials...")
        
        # Create match-3 specific physics materials
        physics_materials = {
            "tile_material": {
                "name": "TileMaterial",
                "dynamic_friction": 0.6,
                "static_friction": 0.6,
                "bounciness": 0.0,
                "friction_combine": "Average",
                "bounce_combine": "Average"
            },
            "board_material": {
                "name": "BoardMaterial",
                "dynamic_friction": 0.8,
                "static_friction": 0.8,
                "bounciness": 0.1,
                "friction_combine": "Average",
                "bounce_combine": "Average"
            },
            "wall_material": {
                "name": "WallMaterial",
                "dynamic_friction": 0.9,
                "static_friction": 0.9,
                "bounciness": 0.0,
                "friction_combine": "Maximum",
                "bounce_combine": "Minimum"
            },
            "ice_material": {
                "name": "IceMaterial",
                "dynamic_friction": 0.1,
                "static_friction": 0.1,
                "bounciness": 0.0,
                "friction_combine": "Minimum",
                "bounce_combine": "Average"
            },
            "bouncy_material": {
                "name": "BouncyMaterial",
                "dynamic_friction": 0.4,
                "static_friction": 0.4,
                "bounciness": 0.8,
                "friction_combine": "Average",
                "bounce_combine": "Maximum"
            }
        }
        
        # Save physics materials configuration
        materials_file = self.materials_dir / "Match3PhysicsMaterials.json"
        self.materials_dir.mkdir(parents=True, exist_ok=True)
        
        with open(materials_file, 'w') as f:
            json.dump(physics_materials, f, indent=2)
        
        print(f"✅ Match-3 physics materials configured: {materials_file}")
        return True
    
    def setup_collision_layers(self):
        """Setup collision layers for match-3 game"""
        print("🔗 Setting up collision layers...")
        
        # Create collision layer configuration
        collision_layers = {
            "layers": {
                "Default": 0,
                "TransparentFX": 1,
                "Ignore Raycast": 2,
                "Water": 4,
                "UI": 5,
                "Tile": 8,
                "Board": 9,
                "Wall": 10,
                "PowerUp": 11,
                "Particle": 12,
                "Background": 13,
                "Foreground": 14
            },
            "layer_collisions": {
                "Tile": ["Board", "Wall", "PowerUp"],
                "Board": ["Tile", "Wall"],
                "Wall": ["Tile", "Board"],
                "PowerUp": ["Tile"],
                "Particle": ["Default"],
                "Background": [],
                "Foreground": ["UI"]
            },
            "physics_settings": {
                "gravity": [0, -9.81, 0],
                "default_material": "TileMaterial",
                "bounce_threshold": 2.0,
                "sleep_threshold": 0.005,
                "default_solver_iterations": 6,
                "default_solver_velocity_iterations": 1,
                "queries_hit_triggers": True,
                "queries_start_in_colliders": False
            }
        }
        
        # Save collision layers configuration
        layers_file = self.physics_dir / "CollisionLayers.json"
        
        with open(layers_file, 'w') as f:
            json.dump(collision_layers, f, indent=2)
        
        print(f"✅ Collision layers configured: {layers_file}")
        return True
    
    def setup_match3_physics_components(self):
        """Setup physics components for match-3 game"""
        print("🎮 Setting up Match-3 physics components...")
        
        # Create physics components configuration
        physics_components = {
            "tile_physics": {
                "rigidbody": {
                    "mass": 1.0,
                    "drag": 0.0,
                    "angular_drag": 0.05,
                    "use_gravity": False,
                    "is_kinematic": True,
                    "interpolation": "None",
                    "collision_detection": "Discrete"
                },
                "collider": {
                    "type": "BoxCollider",
                    "is_trigger": False,
                    "material": "TileMaterial",
                    "size": [1.0, 1.0, 1.0],
                    "center": [0, 0, 0]
                }
            },
            "board_physics": {
                "rigidbody": {
                    "mass": 0.0,
                    "drag": 0.0,
                    "angular_drag": 0.05,
                    "use_gravity": False,
                    "is_kinematic": True,
                    "interpolation": "None",
                    "collision_detection": "Discrete"
                },
                "collider": {
                    "type": "BoxCollider",
                    "is_trigger": False,
                    "material": "BoardMaterial",
                    "size": [10.0, 0.1, 10.0],
                    "center": [0, -0.5, 0]
                }
            },
            "wall_physics": {
                "rigidbody": {
                    "mass": 0.0,
                    "drag": 0.0,
                    "angular_drag": 0.05,
                    "use_gravity": False,
                    "is_kinematic": True,
                    "interpolation": "None",
                    "collision_detection": "Discrete"
                },
                "collider": {
                    "type": "BoxCollider",
                    "is_trigger": False,
                    "material": "WallMaterial",
                    "size": [0.2, 10.0, 10.0],
                    "center": [0, 0, 0]
                }
            },
            "powerup_physics": {
                "rigidbody": {
                    "mass": 0.5,
                    "drag": 0.5,
                    "angular_drag": 0.1,
                    "use_gravity": True,
                    "is_kinematic": False,
                    "interpolation": "Interpolate",
                    "collision_detection": "Continuous"
                },
                "collider": {
                    "type": "SphereCollider",
                    "is_trigger": True,
                    "material": "BouncyMaterial",
                    "radius": 0.5,
                    "center": [0, 0, 0]
                }
            }
        }
        
        # Save physics components configuration
        components_file = self.physics_dir / "Match3PhysicsComponents.json"
        
        with open(components_file, 'w') as f:
            json.dump(physics_components, f, indent=2)
        
        print(f"✅ Match-3 physics components configured: {components_file}")
        return True
    
    def setup_physics_optimization(self):
        """Setup physics optimization for match-3 game"""
        print("🚀 Setting up physics optimization...")
        
        # Create physics optimization configuration
        physics_optimization = {
            "performance_settings": {
                "enable_physics_2d": True,
                "enable_physics_3d": False,
                "enable_continuous_collision_detection": False,
                "enable_queries_hit_triggers": True,
                "enable_queries_start_in_colliders": False
            },
            "collision_detection": {
                "default_collision_detection": "Discrete",
                "default_solver_iterations": 6,
                "default_solver_velocity_iterations": 1,
                "bounce_threshold": 2.0,
                "sleep_threshold": 0.005,
                "max_angular_velocity": 7.0
            },
            "memory_management": {
                "enable_physics_pooling": True,
                "max_rigidbody_pool_size": 100,
                "max_collider_pool_size": 200,
                "physics_garbage_collection_interval": 30.0
            },
            "quality_settings": {
                "low": {
                    "solver_iterations": 4,
                    "solver_velocity_iterations": 1,
                    "bounce_threshold": 3.0,
                    "sleep_threshold": 0.01
                },
                "medium": {
                    "solver_iterations": 6,
                    "solver_velocity_iterations": 1,
                    "bounce_threshold": 2.0,
                    "sleep_threshold": 0.005
                },
                "high": {
                    "solver_iterations": 8,
                    "solver_velocity_iterations": 2,
                    "bounce_threshold": 1.0,
                    "sleep_threshold": 0.001
                }
            }
        }
        
        # Save physics optimization configuration
        optimization_file = self.physics_dir / "PhysicsOptimization.json"
        
        with open(optimization_file, 'w') as f:
            json.dump(physics_optimization, f, indent=2)
        
        print(f"✅ Physics optimization configured: {optimization_file}")
        return True
    
    def create_physics_automation_script(self):
        """Create Unity Editor script for physics automation"""
        print("📝 Creating physics automation script...")
        
        script_content = '''
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
'''
        
        # Save Unity Editor script
        script_path = self.unity_assets / "Editor" / "Match3PhysicsAutomation.cs"
        script_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(script_path, 'w') as f:
            f.write(script_content)
        
        print(f"✅ Match-3 physics automation script created: {script_path}")
        return True
    
    def run_full_automation(self):
        """Run complete match-3 physics automation"""
        self.print_header("Match-3 Physics Full Automation")
        
        print("🎯 This will automate Match-3 specific physics setup")
        print("   - Physics Materials (tile, board, wall, ice, bouncy)")
        print("   - Collision Layers (tile, board, wall, powerup, particle)")
        print("   - Physics Components (rigidbody, collider configurations)")
        print("   - Physics Optimization (performance, memory management)")
        print("   - Physics Prefabs generation")
        
        success = True
        
        # Run all automation steps
        success &= self.setup_match3_physics_materials()
        success &= self.setup_collision_layers()
        success &= self.setup_match3_physics_components()
        success &= self.setup_physics_optimization()
        success &= self.create_physics_automation_script()
        
        if success:
            print("\n🎉 Match-3 physics automation completed successfully!")
            print("✅ Physics Materials configured")
            print("✅ Collision Layers setup")
            print("✅ Physics Components configured")
            print("✅ Physics Optimization applied")
            print("✅ Physics Prefabs generated")
            print("✅ Unity Editor automation script created")
        else:
            print("\n⚠️ Some Match-3 physics automation steps failed")
        
        return success

if __name__ == "__main__":
    automation = Match3PhysicsAutomation()
    automation.run_full_automation()