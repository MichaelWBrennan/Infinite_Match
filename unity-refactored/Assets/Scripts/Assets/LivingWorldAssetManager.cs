using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Linq;

namespace Evergreen.Assets
{
    [System.Serializable]
    public class WeatherAssets
    {
        [Header("Weather Effects")]
        public GameObject rainEffect;
        public GameObject snowEffect;
        public GameObject sunEffect;
        public GameObject stormEffect;
        public GameObject windEffect;
        
        [Header("Weather Audio")]
        public AudioClip rainLightSound;
        public AudioClip rainHeavySound;
        public AudioClip rainThunderSound;
        public AudioClip windLightSound;
        public AudioClip windStrongSound;
        public AudioClip windStormSound;
        
        [Header("Weather Materials")]
        public Material rainMaterial;
        public Material snowMaterial;
        public Material sunMaterial;
        public Material stormMaterial;
    }
    
    [System.Serializable]
    public class NPCAssets
    {
        [Header("Character Models")]
        public GameObject villageElder;
        public GameObject youngAdventurer;
        public GameObject merchant;
        public GameObject child;
        public GameObject guard;
        
        [Header("Character Animations")]
        public RuntimeAnimatorController elderAnimator;
        public RuntimeAnimatorController adventurerAnimator;
        public RuntimeAnimatorController merchantAnimator;
        public RuntimeAnimatorController childAnimator;
        public RuntimeAnimatorController guardAnimator;
        
        [Header("Character Portraits")]
        public Sprite elderPortrait;
        public Sprite adventurerPortrait;
        public Sprite merchantPortrait;
        public Sprite childPortrait;
        public Sprite guardPortrait;
        
        [Header("Character Audio")]
        public AudioClip elderVoice;
        public AudioClip adventurerVoice;
        public AudioClip merchantVoice;
        public AudioClip childVoice;
        public AudioClip guardVoice;
    }
    
    [System.Serializable]
    public class EnvironmentAssets
    {
        [Header("Skybox Materials")]
        public Material daySkybox;
        public Material nightSkybox;
        public Material dawnSkybox;
        public Material duskSkybox;
        public Material stormSkybox;
        
        [Header("Nature Objects")]
        public GameObject[] treePrefabs;
        public GameObject[] flowerPrefabs;
        public GameObject[] rockPrefabs;
        public GameObject[] grassPrefabs;
        
        [Header("Building Objects")]
        public GameObject[] housePrefabs;
        public GameObject[] shopPrefabs;
        public GameObject[] decorationPrefabs;
        
        [Header("Terrain Materials")]
        public Material grassMaterial;
        public Material dirtMaterial;
        public Material stoneMaterial;
        public Material waterMaterial;
        
        [Header("Ambient Audio")]
        public AudioClip villageAmbient;
        public AudioClip marketAmbient;
        public AudioClip forestAmbient;
        public AudioClip waterAmbient;
    }
    
    [System.Serializable]
    public class UIAssets
    {
        [Header("Weather UI")]
        public GameObject weatherWidget;
        public Sprite[] weatherIcons;
        public Font weatherFont;
        
        [Header("Dialogue UI")]
        public GameObject dialogueBox;
        public GameObject speechBubble;
        public Font dialogueFont;
        
        [Header("Environment UI")]
        public GameObject timeDisplay;
        public GameObject seasonDisplay;
        public GameObject temperatureDisplay;
    }
    
    [System.Serializable]
    public class EffectAssets
    {
        [Header("Particle Effects")]
        public GameObject[] sparkleEffects;
        public GameObject[] glowEffects;
        public GameObject[] magicEffects;
        public GameObject[] celebrationEffects;
        
        [Header("Sound Effects")]
        public AudioClip[] uiSounds;
        public AudioClip[] interactionSounds;
        public AudioClip[] celebrationSounds;
        public AudioClip[] ambientSounds;
    }
    
    public class LivingWorldAssetManager : MonoBehaviour
    {
        [Header("Asset Categories")]
        public WeatherAssets weatherAssets = new WeatherAssets();
        public NPCAssets npcAssets = new NPCAssets();
        public EnvironmentAssets environmentAssets = new EnvironmentAssets();
        public UIAssets uiAssets = new UIAssets();
        public EffectAssets effectAssets = new EffectAssets();
        
        [Header("Asset Settings")]
        public bool enableAssetLoading = true;
        public bool enableAssetCaching = true;
        public bool enableAssetOptimization = true;
        public bool enableAssetValidation = true;
        
        [Header("Performance Settings")]
        public int maxLoadedAssets = 100;
        public float assetLoadTimeout = 30f;
        public bool enableAsyncLoading = true;
        
        public static LivingWorldAssetManager Instance { get; private set; }
        
        private Dictionary<string, GameObject> loadedPrefabs = new Dictionary<string, GameObject>();
        private Dictionary<string, AudioClip> loadedAudio = new Dictionary<string, AudioClip>();
        private Dictionary<string, Material> loadedMaterials = new Dictionary<string, Material>();
        private Dictionary<string, Sprite> loadedSprites = new Dictionary<string, Sprite>();
        
        private Coroutine assetLoadingCoroutine;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeAssetManager();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (enableAssetLoading)
            {
                StartCoroutine(LoadAllAssets());
            }
        }
        
        private void InitializeAssetManager()
        {
            Debug.Log("Living World Asset Manager initialized");
            
            // Create placeholder assets if real assets are not available
            CreatePlaceholderAssets();
        }
        
        private void CreatePlaceholderAssets()
        {
            // Create placeholder weather effects
            CreatePlaceholderWeatherEffects();
            
            // Create placeholder NPCs
            CreatePlaceholderNPCs();
            
            // Create placeholder environment
            CreatePlaceholderEnvironment();
            
            // Create placeholder UI
            CreatePlaceholderUI();
            
            // Create placeholder effects
            CreatePlaceholderEffects();
        }
        
        private void CreatePlaceholderWeatherEffects()
        {
            // Create placeholder rain effect
            if (weatherAssets.rainEffect == null)
            {
                weatherAssets.rainEffect = CreatePlaceholderEffect("Rain Effect", Color.blue, Vector3.zero);
            }
            
            // Create placeholder snow effect
            if (weatherAssets.snowEffect == null)
            {
                weatherAssets.snowEffect = CreatePlaceholderEffect("Snow Effect", Color.white, Vector3.zero);
            }
            
            // Create placeholder sun effect
            if (weatherAssets.sunEffect == null)
            {
                weatherAssets.sunEffect = CreatePlaceholderEffect("Sun Effect", Color.yellow, Vector3.zero);
            }
            
            // Create placeholder storm effect
            if (weatherAssets.stormEffect == null)
            {
                weatherAssets.stormEffect = CreatePlaceholderEffect("Storm Effect", Color.gray, Vector3.zero);
            }
        }
        
        private void CreatePlaceholderNPCs()
        {
            // Create placeholder village elder
            if (npcAssets.villageElder == null)
            {
                npcAssets.villageElder = CreatePlaceholderNPC("Village Elder", Color.gray, new Vector3(0, 0, 0));
            }
            
            // Create placeholder young adventurer
            if (npcAssets.youngAdventurer == null)
            {
                npcAssets.youngAdventurer = CreatePlaceholderNPC("Young Adventurer", Color.green, new Vector3(2, 0, 0));
            }
            
            // Create placeholder merchant
            if (npcAssets.merchant == null)
            {
                npcAssets.merchant = CreatePlaceholderNPC("Merchant", Color.yellow, new Vector3(-2, 0, 0));
            }
            
            // Create placeholder child
            if (npcAssets.child == null)
            {
                npcAssets.child = CreatePlaceholderNPC("Child", Color.cyan, new Vector3(0, 0, 2));
            }
            
            // Create placeholder guard
            if (npcAssets.guard == null)
            {
                npcAssets.guard = CreatePlaceholderNPC("Guard", Color.red, new Vector3(0, 0, -2));
            }
        }
        
        private void CreatePlaceholderEnvironment()
        {
            // Create placeholder trees
            if (environmentAssets.treePrefabs == null || environmentAssets.treePrefabs.Length == 0)
            {
                environmentAssets.treePrefabs = new GameObject[3];
                for (int i = 0; i < 3; i++)
                {
                    environmentAssets.treePrefabs[i] = CreatePlaceholderTree($"Tree_{i}", new Vector3(i * 5, 0, 0));
                }
            }
            
            // Create placeholder houses
            if (environmentAssets.housePrefabs == null || environmentAssets.housePrefabs.Length == 0)
            {
                environmentAssets.housePrefabs = new GameObject[2];
                for (int i = 0; i < 2; i++)
                {
                    environmentAssets.housePrefabs[i] = CreatePlaceholderHouse($"House_{i}", new Vector3(i * 10, 0, 5));
                }
            }
            
            // Create placeholder skybox materials
            if (environmentAssets.daySkybox == null)
            {
                environmentAssets.daySkybox = CreatePlaceholderSkybox("Day Skybox", Color.cyan);
            }
            
            if (environmentAssets.nightSkybox == null)
            {
                environmentAssets.nightSkybox = CreatePlaceholderSkybox("Night Skybox", Color.blue);
            }
        }
        
        private void CreatePlaceholderUI()
        {
            // Create placeholder weather widget
            if (uiAssets.weatherWidget == null)
            {
                uiAssets.weatherWidget = CreatePlaceholderUI("Weather Widget", new Vector2(100, 100));
            }
            
            // Create placeholder dialogue box
            if (uiAssets.dialogueBox == null)
            {
                uiAssets.dialogueBox = CreatePlaceholderUI("Dialogue Box", new Vector2(400, 200));
            }
        }
        
        private void CreatePlaceholderEffects()
        {
            // Create placeholder particle effects
            if (effectAssets.sparkleEffects == null || effectAssets.sparkleEffects.Length == 0)
            {
                effectAssets.sparkleEffects = new GameObject[2];
                for (int i = 0; i < 2; i++)
                {
                    effectAssets.sparkleEffects[i] = CreatePlaceholderEffect($"Sparkle_{i}", Color.white, Vector3.zero);
                }
            }
        }
        
        private GameObject CreatePlaceholderEffect(string name, Color color, Vector3 position)
        {
            var effect = GameObject.CreatePrimitive(PrimitiveType.Cube);
            effect.name = name;
            effect.transform.position = position;
            effect.transform.localScale = Vector3.one * 0.5f;
            
            var renderer = effect.GetComponent<Renderer>();
            var material = new Material(Shader.Find("Standard"));
            material.color = color;
            material.SetFloat("_Metallic", 0.5f);
            material.SetFloat("_Smoothness", 0.8f);
            renderer.material = material;
            
            // Add particle system for effect
            var particleSystem = effect.AddComponent<ParticleSystem>();
            var main = particleSystem.main;
            main.startColor = color;
            main.startSize = 0.1f;
            main.startLifetime = 2f;
            main.maxParticles = 100;
            
            return effect;
        }
        
        private GameObject CreatePlaceholderNPC(string name, Color color, Vector3 position)
        {
            var npc = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            npc.name = name;
            npc.transform.position = position;
            npc.transform.localScale = Vector3.one * 0.8f;
            
            var renderer = npc.GetComponent<Renderer>();
            var material = new Material(Shader.Find("Standard"));
            material.color = color;
            renderer.material = material;
            
            // Add NPC components
            npc.AddComponent<Animator>();
            npc.AddComponent<AudioSource>();
            npc.AddComponent<Collider>();
            
            // Add NPC tag
            npc.tag = "NPC";
            
            return npc;
        }
        
        private GameObject CreatePlaceholderTree(string name, Vector3 position)
        {
            var tree = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            tree.name = name;
            tree.transform.position = position;
            tree.transform.localScale = new Vector3(1, 2, 1);
            
            var renderer = tree.GetComponent<Renderer>();
            var material = new Material(Shader.Find("Standard"));
            material.color = Color.green;
            renderer.material = material;
            
            return tree;
        }
        
        private GameObject CreatePlaceholderHouse(string name, Vector3 position)
        {
            var house = GameObject.CreatePrimitive(PrimitiveType.Cube);
            house.name = name;
            house.transform.position = position;
            house.transform.localScale = new Vector3(3, 2, 3);
            
            var renderer = house.GetComponent<Renderer>();
            var material = new Material(Shader.Find("Standard"));
            material.color = Color.brown;
            renderer.material = material;
            
            return house;
        }
        
        private Material CreatePlaceholderSkybox(string name, Color color)
        {
            var material = new Material(Shader.Find("Skybox/6 Sided"));
            material.SetColor("_Tint", color);
            material.SetFloat("_Exposure", 1f);
            return material;
        }
        
        private GameObject CreatePlaceholderUI(string name, Vector2 size)
        {
            var ui = new GameObject(name);
            ui.AddComponent<RectTransform>();
            ui.AddComponent<CanvasRenderer>();
            ui.AddComponent<Image>();
            
            var rectTransform = ui.GetComponent<RectTransform>();
            rectTransform.sizeDelta = size;
            
            return ui;
        }
        
        private IEnumerator LoadAllAssets()
        {
            Debug.Log("Loading all Living World assets...");
            
            // Load weather assets
            yield return StartCoroutine(LoadWeatherAssets());
            
            // Load NPC assets
            yield return StartCoroutine(LoadNPCAssets());
            
            // Load environment assets
            yield return StartCoroutine(LoadEnvironmentAssets());
            
            // Load UI assets
            yield return StartCoroutine(LoadUIAssets());
            
            // Load effect assets
            yield return StartCoroutine(LoadEffectAssets());
            
            Debug.Log("All Living World assets loaded successfully!");
        }
        
        private IEnumerator LoadWeatherAssets()
        {
            Debug.Log("Loading weather assets...");
            
            // Load weather effects
            if (weatherAssets.rainEffect != null)
            {
                loadedPrefabs["RainEffect"] = weatherAssets.rainEffect;
            }
            
            if (weatherAssets.snowEffect != null)
            {
                loadedPrefabs["SnowEffect"] = weatherAssets.snowEffect;
            }
            
            if (weatherAssets.sunEffect != null)
            {
                loadedPrefabs["SunEffect"] = weatherAssets.sunEffect;
            }
            
            if (weatherAssets.stormEffect != null)
            {
                loadedPrefabs["StormEffect"] = weatherAssets.stormEffect;
            }
            
            // Load weather audio
            if (weatherAssets.rainLightSound != null)
            {
                loadedAudio["RainLight"] = weatherAssets.rainLightSound;
            }
            
            if (weatherAssets.rainHeavySound != null)
            {
                loadedAudio["RainHeavy"] = weatherAssets.rainHeavySound;
            }
            
            if (weatherAssets.windLightSound != null)
            {
                loadedAudio["WindLight"] = weatherAssets.windLightSound;
            }
            
            yield return new WaitForSeconds(0.1f);
        }
        
        private IEnumerator LoadNPCAssets()
        {
            Debug.Log("Loading NPC assets...");
            
            // Load NPC models
            if (npcAssets.villageElder != null)
            {
                loadedPrefabs["VillageElder"] = npcAssets.villageElder;
            }
            
            if (npcAssets.youngAdventurer != null)
            {
                loadedPrefabs["YoungAdventurer"] = npcAssets.youngAdventurer;
            }
            
            if (npcAssets.merchant != null)
            {
                loadedPrefabs["Merchant"] = npcAssets.merchant;
            }
            
            if (npcAssets.child != null)
            {
                loadedPrefabs["Child"] = npcAssets.child;
            }
            
            if (npcAssets.guard != null)
            {
                loadedPrefabs["Guard"] = npcAssets.guard;
            }
            
            // Load NPC portraits
            if (npcAssets.elderPortrait != null)
            {
                loadedSprites["ElderPortrait"] = npcAssets.elderPortrait;
            }
            
            if (npcAssets.adventurerPortrait != null)
            {
                loadedSprites["AdventurerPortrait"] = npcAssets.adventurerPortrait;
            }
            
            yield return new WaitForSeconds(0.1f);
        }
        
        private IEnumerator LoadEnvironmentAssets()
        {
            Debug.Log("Loading environment assets...");
            
            // Load skybox materials
            if (environmentAssets.daySkybox != null)
            {
                loadedMaterials["DaySkybox"] = environmentAssets.daySkybox;
            }
            
            if (environmentAssets.nightSkybox != null)
            {
                loadedMaterials["NightSkybox"] = environmentAssets.nightSkybox;
            }
            
            // Load nature objects
            if (environmentAssets.treePrefabs != null)
            {
                for (int i = 0; i < environmentAssets.treePrefabs.Length; i++)
                {
                    if (environmentAssets.treePrefabs[i] != null)
                    {
                        loadedPrefabs[$"Tree_{i}"] = environmentAssets.treePrefabs[i];
                    }
                }
            }
            
            // Load building objects
            if (environmentAssets.housePrefabs != null)
            {
                for (int i = 0; i < environmentAssets.housePrefabs.Length; i++)
                {
                    if (environmentAssets.housePrefabs[i] != null)
                    {
                        loadedPrefabs[$"House_{i}"] = environmentAssets.housePrefabs[i];
                    }
                }
            }
            
            yield return new WaitForSeconds(0.1f);
        }
        
        private IEnumerator LoadUIAssets()
        {
            Debug.Log("Loading UI assets...");
            
            // Load UI widgets
            if (uiAssets.weatherWidget != null)
            {
                loadedPrefabs["WeatherWidget"] = uiAssets.weatherWidget;
            }
            
            if (uiAssets.dialogueBox != null)
            {
                loadedPrefabs["DialogueBox"] = uiAssets.dialogueBox;
            }
            
            yield return new WaitForSeconds(0.1f);
        }
        
        private IEnumerator LoadEffectAssets()
        {
            Debug.Log("Loading effect assets...");
            
            // Load particle effects
            if (effectAssets.sparkleEffects != null)
            {
                for (int i = 0; i < effectAssets.sparkleEffects.Length; i++)
                {
                    if (effectAssets.sparkleEffects[i] != null)
                    {
                        loadedPrefabs[$"Sparkle_{i}"] = effectAssets.sparkleEffects[i];
                    }
                }
            }
            
            yield return new WaitForSeconds(0.1f);
        }
        
        // Public methods for accessing assets
        public GameObject GetPrefab(string name)
        {
            return loadedPrefabs.ContainsKey(name) ? loadedPrefabs[name] : null;
        }
        
        public AudioClip GetAudio(string name)
        {
            return loadedAudio.ContainsKey(name) ? loadedAudio[name] : null;
        }
        
        public Material GetMaterial(string name)
        {
            return loadedMaterials.ContainsKey(name) ? loadedMaterials[name] : null;
        }
        
        public Sprite GetSprite(string name)
        {
            return loadedSprites.ContainsKey(name) ? loadedSprites[name] : null;
        }
        
        public void ReplaceAsset(string name, GameObject newAsset)
        {
            if (loadedPrefabs.ContainsKey(name))
            {
                loadedPrefabs[name] = newAsset;
                Debug.Log($"Replaced asset: {name}");
            }
        }
        
        public void ReplaceAsset(string name, AudioClip newAsset)
        {
            if (loadedAudio.ContainsKey(name))
            {
                loadedAudio[name] = newAsset;
                Debug.Log($"Replaced audio: {name}");
            }
        }
        
        public void ReplaceAsset(string name, Material newAsset)
        {
            if (loadedMaterials.ContainsKey(name))
            {
                loadedMaterials[name] = newAsset;
                Debug.Log($"Replaced material: {name}");
            }
        }
        
        public void ReplaceAsset(string name, Sprite newAsset)
        {
            if (loadedSprites.ContainsKey(name))
            {
                loadedSprites[name] = newAsset;
                Debug.Log($"Replaced sprite: {name}");
            }
        }
        
        public Dictionary<string, object> GetAssetSummary()
        {
            return new Dictionary<string, object>
            {
                {"loaded_prefabs", loadedPrefabs.Count},
                {"loaded_audio", loadedAudio.Count},
                {"loaded_materials", loadedMaterials.Count},
                {"loaded_sprites", loadedSprites.Count},
                {"total_assets", loadedPrefabs.Count + loadedAudio.Count + loadedMaterials.Count + loadedSprites.Count}
            };
        }
    }
}